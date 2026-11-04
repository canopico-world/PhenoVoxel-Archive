import * as T from 'three';
const V=()=>new T.Vector3(),smooth=T.MathUtils.smoothstep;
function appendMorph(g,deltas,name){
 g.morphTargetsRelative=true;const a=new T.Float32BufferAttribute(deltas,3);a.name=name;(g.morphAttributes.position||=[]).push(a);
 const normal=g.attributes.normal,copy=g.clone(),p=copy.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+deltas[i*3],p.getY(i)+deltas[i*3+1],p.getZ(i)+deltas[i*3+2]);copy.computeVertexNormals();const sums=new Map(),keys=[];for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');keys.push(key);if(!sums.has(key))sums.set(key,V());sums.get(key).add(V().fromBufferAttribute(copy.attributes.normal,i));}for(const n of sums.values())n.normalize();const dn=new Float32Array(normal.count*3);for(let i=0;i<normal.count;i++){if(Math.abs(deltas[i*3])+Math.abs(deltas[i*3+1])+Math.abs(deltas[i*3+2])<1e-10)continue;const n=sums.get(keys[i]);for(let k=0;k<3;k++)dn[i*3+k]=n.getComponent(k)-normal.getComponent(i,k);}const n=new T.Float32BufferAttribute(dn,3);n.name=name;(g.morphAttributes.normal||=[]).push(n);copy.dispose();
}
// Qualitative collective finger flexion; no individual joint or force calibration.
export function addChimpHandCurl(g){
 const p=g.attributes.position,mask=g.attributes.pvArm,d=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);if(!mask||mask.getX(i)<.8||y>1.24)continue;const distance=1.24-y,r=.115,angle=Math.min(3.1,distance/r),offset=x+.12,xx=-.12+r*(1-Math.cos(angle))+offset*Math.cos(angle),yy=1.24-r*Math.sin(angle)+offset*Math.sin(angle);d[i*3]=xx-x;d[i*3+1]=yy-y;}
 appendMorph(g,d,'PV collective finger curl · unmeasured');
}
// A bounded pose-space smoothing correction for the shoulder/neck transition.
// It preserves source topology/UVs and does not claim measured soft-tissue mechanics.
export function addChimpShoulderCorrective(m){
 const mesh=m.surfaceRig.rigs[0].mesh,g=mesh.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
 m.root.updateMatrixWorld(true);mesh.skeleton.update();const keys=new Map(),ids=[],points=[],bind=[],counts=[];
 for(let i=0;i<p.count;i++){const q=V().fromBufferAttribute(p,i),key=q.toArray().map(v=>Math.round(v*1e5)).join(',');let id=keys.get(key);if(id===undefined){id=points.length;keys.set(key,id);points.push(V());bind.push(q);counts.push(0);}ids.push(id);points[id].add(mesh.getVertexPosition(i,V()));counts[id]++;}
 points.forEach((v,i)=>v.divideScalar(counts[i]));const neighbors=points.map(()=>new Set()),index=g.index?.array||Array.from({length:p.count},(_,i)=>i);
 for(let i=0;i<index.length;i+=3){const a=ids[index[i]],b=ids[index[i+1]],c=ids[index[i+2]];for(const[u,v]of[[a,b],[b,c],[c,a]]){neighbors[u].add(v);neighbors[v].add(u);}}
 const original=points.map(v=>v.clone());let current=points;
 for(let pass=0;pass<14;pass++){const next=current.map(v=>v.clone());for(let i=0;i<current.length;i++){const q=bind[i],mask=(1-smooth(q.x,-.25,.15))*smooth(q.y,2.25,2.60)*(1-smooth(q.y,3.05,3.35));if(!mask||!neighbors[i].size)continue;const mean=V();for(const id of neighbors[i])mean.add(current[id]);mean.divideScalar(neighbors[i].size);next[i].lerp(mean,.45*mask);}current=next;}
 const deltas=new Float32Array(p.count*3),bone=new T.Matrix4(),skin=new T.Matrix4(),local=new T.Matrix3();
 for(let i=0;i<p.count;i++){const delta=current[ids[i]].clone().sub(original[ids[i]]);if(delta.lengthSq()<1e-12)continue;skin.elements.fill(0);for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(!w)continue;bone.fromArray(mesh.skeleton.boneMatrices,si.getComponent(i,k)*16);for(let j=0;j<16;j++)skin.elements[j]+=bone.elements[j]*w;}skin.premultiply(mesh.bindMatrixInverse).multiply(mesh.bindMatrix);if(Math.abs(skin.determinant())<1e-6)continue;local.setFromMatrix4(skin.invert());delta.applyMatrix3(local);delta.clampLength(0,.20);deltas.set(delta.toArray(),i*3);}
 appendMorph(g,deltas,'PV shoulder pose correction · unmeasured');mesh.updateMorphTargets();mesh.userData.compatibilityMorphNormals=true;
}
