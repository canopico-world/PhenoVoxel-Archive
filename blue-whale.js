import * as T from 'three';

// A disclosed runtime derivative of Bohdan Lvov's CC BY 4.0 whale. The source
// payload and animation samples are retained. The active base-atlas
// derivative is disclosed in the asset manifest. These are selected
// external-shape corrections, not a reconstruction of a measured individual.
function weightedSkin(parts){
 const weights=new Map();for(const[v,w]of parts)for(let k=0;k<4;k++)weights.set(v.j[k],(weights.get(v.j[k])||0)+v.w[k]*w);
 const a=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=a.reduce((n,x)=>n+x[1],0);while(a.length<4)a.push([0,0]);return{j:a.map(x=>x[0]),w:a.map(x=>sum?x[1]/sum:0)};
}
// Position welding is confined to the subdivision calculation. Per-corner UVs
// stay on their original atlas islands; interpolated weights are normalized.
export function subdivideWhaleSurface(g){
 const p=g.attributes.position,uv=g.attributes.uv,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,vertices=[],groups=new Map(),weld=[];
 for(let i=0;i<p.count;i++){
  const pos=[p.getX(i),p.getY(i),p.getZ(i)],key=pos.map(v=>Math.round(v*1e5)).join(',');let id=groups.get(key);if(id===undefined){id=weld.length;groups.set(key,id);weld.push({p:pos,neighbors:new Set(),edges:[]});}
  vertices.push({p:pos,uv:uv?[uv.getX(i),uv.getY(i)]:[0,0],j:si?[si.getX(i),si.getY(i),si.getZ(i),si.getW(i)]:[0,0,0,0],w:sw?[sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)]:[1,0,0,0],id});
 }
 const idx=g.index?Array.from(g.index.array):vertices.map((_,i)=>i),edges=new Map();
 for(let i=0;i<idx.length;i+=3){const tri=idx.slice(i,i+3);for(let k=0;k<3;k++){const a=vertices[tri[k]].id,b=vertices[tri[(k+1)%3]].id,c=vertices[tri[(k+2)%3]].id;if(a===b)continue;weld[a].neighbors.add(b);weld[b].neighbors.add(a);const key=[Math.min(a,b),Math.max(a,b)].join(':');if(!edges.has(key))edges.set(key,{a,b,opposite:[]});edges.get(key).opposite.push(c);}}
 for(const e of edges.values()){weld[e.a].edges.push(e);weld[e.b].edges.push(e);const terms=e.opposite.length===2?[[e.a,.375],[e.b,.375],[e.opposite[0],.125],[e.opposite[1],.125]]:[[e.a,.5],[e.b,.5]];e.p=[0,1,2].map(k=>terms.reduce((s,[i,w])=>s+weld[i].p[k]*w,0));}
 const smoothed=weld.map((v,i)=>{const boundary=v.edges.filter(e=>e.opposite.length===1).map(e=>e.a===i?e.b:e.a);if(boundary.length===2)return v.p.map((n,k)=>n*.75+(weld[boundary[0]].p[k]+weld[boundary[1]].p[k])*.125);const ns=[...v.neighbors],n=ns.length,beta=n===3?3/16:n?3/(8*n):0;return v.p.map((x,k)=>x*(1-n*beta)+beta*ns.reduce((a,j)=>a+weld[j].p[k],0));});
 const result=vertices.map(v=>({...v,p:smoothed[v.id]})),edgeCorners=new Map(),triangles=[];
 function midpoint(a,b){const key=[Math.min(a,b),Math.max(a,b)].join(':');if(edgeCorners.has(key))return edgeCorners.get(key);const A=vertices[a],B=vertices[b],e=edges.get([Math.min(A.id,B.id),Math.max(A.id,B.id)].join(':'));const v={p:e?e.p:A.p.map((x,k)=>(x+B.p[k])/2),uv:A.uv.map((x,k)=>(x+B.uv[k])/2),...weightedSkin([[A,.5],[B,.5]])},n=result.push(v)-1;edgeCorners.set(key,n);return n;}
 for(let i=0;i<idx.length;i+=3){const[a,b,c]=idx.slice(i,i+3),ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);triangles.push(a,ab,ca,b,bc,ab,c,ca,bc,ab,bc,ca);}
 const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(result.flatMap(v=>v.p),3));if(uv)out.setAttribute('uv',new T.Float32BufferAttribute(result.flatMap(v=>v.uv),2));if(si){out.setAttribute('skinIndex',new T.Uint16BufferAttribute(result.flatMap(v=>v.j),4));out.setAttribute('skinWeight',new T.Float32BufferAttribute(result.flatMap(v=>v.w),4));}out.setIndex(triangles);out.computeVertexNormals();out.computeBoundingBox();out.computeBoundingSphere();return out;
}
export function blueWhaleShape(v){
 const p=v.clone(),z=p.z,abs=Math.abs(p.x),head=T.MathUtils.smoothstep(z,300,640),tail=T.MathUtils.smoothstep(-z,560,740);
 // Narrow the stocky trunk while retaining the wider horizontal flukes. The
 // anterior remapping gives the rostrum a rounder U outline in dorsal view.
 p.x*=T.MathUtils.lerp(.70,1.22,tail)*(1+.28*head);
 if(z>300){const u=T.MathUtils.clamp((z-300)/343,0,1);p.z=300+343*(1-Math.pow(1-u,1.55));}
 const flipper=T.MathUtils.smoothstep(abs,142,215)*(1-T.MathUtils.smoothstep(Math.abs(z-50),200,300));
 p.x=T.MathUtils.lerp(p.x,Math.sign(p.x)*(83+(abs-110)*.50),flipper);p.z=T.MathUtils.lerp(p.z,220+(z-220)*.58,flipper);
 // Lower only the selected thin posterior dorsal-fin exterior toward the
 // neighbouring back. Smooth masks preserve the joined surface and fin root.
 const back=110.7+(z+412.2)*.403,excess=Math.max(0,p.y-back);
 const dorsal=T.MathUtils.smoothstep(z,-398,-368)*(1-T.MathUtils.smoothstep(z,-326,-294))*(1-T.MathUtils.smoothstep(abs,10,23));
 p.y-=excess*.55*dorsal;
 // Redistribute the joined posterior skin, carrying the fin farther aft.
 // This smooth longitudinal map has positive derivative throughout; it
 // preserves the rostrum/fluke ends without adding a detached replacement fin.
 p.z-=125*Math.exp(-Math.pow((p.z+340)/180,2));
 // A flatter selected dorsal rostrum, without altering the eye/body union.
 p.y=100+(p.y-100)*(1-.18*head);
 return p;
}
export function prepareBlueWhale(scene){
 scene.updateMatrixWorld(true);scene.traverse(mesh=>{
  if(!mesh.isMesh)return;if(mesh.isSkinnedMesh)mesh.skeleton.update();
  const geometry=mesh.geometry.clone(),p=geometry.attributes.position,v=new T.Vector3(),inverse=mesh.matrixWorld.clone().invert();
  // The archived scene's neutral skeleton differs from its raw bind vertices.
  // Subdivide the actually posed surface, then invert each interpolated skin
  // matrix. Editing raw bind coordinates had visibly truncated the rostrum.
  for(let i=0;i<p.count;i++){mesh.getVertexPosition(i,v);p.setXYZ(i,v.x,v.y,v.z);}
  let smooth=subdivideWhaleSurface(geometry);smooth=subdivideWhaleSurface(smooth);
  const q=smooth.attributes.position,n=smooth.attributes.normal,si=smooth.attributes.skinIndex,sw=smooth.attributes.skinWeight,dorsalIndices=[];
  for(let i=0;i<q.count;i++){
   v.fromBufferAttribute(q,i).applyMatrix4(mesh.matrixWorld);
   if(mesh.isSkinnedMesh&&Math.abs(v.x)<8&&v.z>-363&&v.z< -327&&v.y>110.7+(v.z+412.2)*.403+14)dorsalIndices.push(i);
   v.copy(blueWhaleShape(v)).applyMatrix4(inverse);q.setXYZ(i,v.x,v.y,v.z);
  }
  const eye=!mesh.isSkinnedMesh&&/^polySurface[23]_lambert1_0$/.test(mesh.name);
  if(eye){smooth.computeBoundingBox();const center=smooth.boundingBox.getCenter(new T.Vector3());for(let i=0;i<q.count;i++){v.fromBufferAttribute(q,i).sub(center).multiplyScalar(.6).add(center);q.setXYZ(i,v.x,v.y,v.z);}}
  smooth.computeVertexNormals();
  if(mesh.isSkinnedMesh)for(let i=0;i<q.count;i++){
   const sum=new T.Matrix4();sum.elements.fill(0);
   for(let k=0;k<4;k++){const j=si.getComponent(i,k),w=sw.getComponent(i,k),b=new T.Matrix4().multiplyMatrices(mesh.skeleton.bones[j].matrixWorld,mesh.skeleton.boneInverses[j]);for(let e=0;e<16;e++)sum.elements[e]+=b.elements[e]*w;}
   const skin=mesh.bindMatrixInverse.clone().multiply(sum).multiply(mesh.bindMatrix),undo=skin.clone().invert();v.fromBufferAttribute(q,i).applyMatrix4(undo);q.setXYZ(i,v.x,v.y,v.z);
   v.fromBufferAttribute(n,i).applyMatrix3(new T.Matrix3().setFromMatrix4(skin).transpose()).normalize();n.setXYZ(i,v.x,v.y,v.z);
  }
  smooth.computeBoundingBox();smooth.computeBoundingSphere();mesh.geometry=smooth;mesh.material=mesh.material.clone();mesh.material.color.setRGB(1,1,1);mesh.material.metalness=0;mesh.material.roughness=.48;mesh.material.normalScale?.setScalar(.12);
  if(eye){mesh.material.color.set('#151b1e');mesh.material.map=null;mesh.material.normalMap=null;mesh.material.aoMap=null;mesh.material.roughnessMap=null;mesh.material.metalnessMap=null;mesh.material.roughness=.3;}
  mesh.userData.blueWhaleDerivative={author:'PhenoVoxel Archive contributors',license:'CC BY 4.0',changes:'Selected slender body, flatter rostrum, lower dorsal fin carried farther aft by a monotone posterior rest-surface remap, and shorter pectoral envelope; two posed-space subdivision passes/inverse-skin rebinding, interpolated UV/weights and small dark eyes. Disclosed grey-blue luminance-remapped atlas. Common scene aspect transform carries the rig with the overall length/depth change. Regional rest-surface/rig relations remain unmeasured. Not specimen-fitted or measured optics.'};
  if(dorsalIndices.length)mesh.userData.blueWhaleDorsalIndices=dorsalIndices;
 });
 // Apply the length/depth correction to the entire scene, including its rig.
 // Stretching only vertices would leave the animation pivots in the old body.
 scene.scale.y*=.80;scene.scale.z*=1.22;scene.updateMatrixWorld(true);
 scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
}
export const BLUE_WHALE_STUDY_SECONDS=(4.125-1/24)*2;
export function blueWhaleSourceTime(t){return 1/24+Math.min(BLUE_WHALE_STUDY_SECONDS,Math.max(0,t))*.5;}
export function configureBlueWhale(m){
 if(m.id!=='balaenoptera-musculus')return;m.blueWhale={clip:m.gltf.animations.find(a=>a.name==='Swimming')};m.clipMap.swim=m.blueWhale.clip;
 const first=m.mixer.clipAction(m.blueWhale.clip);first.reset().play();m.mixer.setTime(1/24);m.blueWhale.neutralPose=new Map();m.gltf.scene.traverse(o=>m.blueWhale.neutralPose.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()}));m.mixer.stopAllAction();for(const[o,b]of m.blueWhale.neutralPose){o.position.copy(b.position);o.quaternion.copy(b.quaternion);o.scale.copy(b.scale);}m.root.updateMatrixWorld(true);m.gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 const targets=[new T.Vector3(1.12,.65,0),new T.Vector3(-1.74,.3,0),new T.Vector3(.55,.4,.3)],meshes=[];m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isMesh)meshes.push(o);});
 m.featureBindings=targets.map(target=>{let best=null;for(const mesh of meshes){const p=mesh.geometry.attributes.position,s=[];for(let i=0;i<p.count;i++){const v=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);s.push({i,d:v.distanceToSquared(target)});}s.sort((a,b)=>a.d-b.d);if(!best||s[0].d<best.distance)best={mesh,indices:s.slice(0,8).map(x=>x.i),distance:s[0].d,kind:'Selected source surface, not a measured anatomical landmark'};}return best;});
 const dorsal=meshes.find(o=>o.userData.blueWhaleDorsalIndices?.length);if(!dorsal)throw Error('Blue-whale dorsal surface region is missing');m.featureBindings.push({mesh:dorsal,indices:dorsal.userData.blueWhaleDorsalIndices,kind:'Selected posterior dorsal-fin exterior; unmeasured'});m.features=m.featureBindings.map(()=>new T.Vector3());
 Object.assign(m.root.userData,{focusAnatomy:true,anatomyUnderside:[2],anatomyFocusScale:[.44,.6,.48,.34],anatomyViewDirections:[[0,1,.2],[.3,.8,1],[0,-.9,.65],[0,.4,1]]});
}
export function animateBlueWhale(m,action,t){
 if(!m.blueWhale)return false;m.root.position.set(0,.60,0);m.root.rotation.set(0,0,0);m.root.scale.setScalar(1);
 if(action==='swim')m.mixer.setTime(Math.min(4.125-1e-7,blueWhaleSourceTime(t)));
 else{m.mixer.stopAllAction();for(const[o,b]of m.blueWhale.neutralPose){o.position.copy(b.position);o.quaternion.copy(b.quaternion);o.scale.copy(b.scale);}}
 m.root.updateMatrixWorld(true);m.gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});return true;
}
