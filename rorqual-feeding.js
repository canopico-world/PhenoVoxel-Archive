import * as T from 'three';

// Qualitative external kinematics, not fitted tag trajectories, water mechanics
// or a physiological simulation. The same credited atlas and skin remain in the
// viewer. The oral cut, lining and baleen are disclosed runtime derivatives.
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep;
const settings={
 'balaenoptera-musculus':{hinge:.72,y:.433,slope:.057,tip:1.875,upper:.52,lower:.34,pouch:.37,start:10,engulf:3.8,close:2.5,drain:24,recover:3,plates:80},
 'megaptera-novaeangliae':{hinge:.65,y:.40,slope:.24,tip:1.875,upper:.67,lower:.44,pouch:.43,start:6,engulf:2.8,close:2.2,drain:21,recover:3,plates:64}
};
export const hasRorqualFeeding=id=>!!settings[id];
const ease=(t,a,b)=>smooth(t,a,b);
export function rorqualFeedingState(id,time){
 const c=settings[id];if(!c)return null;
 const t=Math.max(0,time),a=c.start,b=a+c.engulf,d=b+c.close,e=d+c.drain,f=e+c.recover;
 // The pouch reaches its selected maximum while closure has already begun.
 // Posterior deflation precedes anterior deflation in this authored study.
 const opening=ease(t,a,b-.35),closing=1-ease(t,b-.35,d),gape=opening*closing;
 const pouch=ease(t,a+.45,b+.45)*(1-ease(t,d+.3,e)),posterior=ease(t,a+.45,b+.45)*(1-ease(t,b+.4,e-4));
 const tail=t<a?Math.sin(t*1.55)*.065*(1-ease(t,a-1.8,a))+.08*ease(t,a-1.1,a):T.MathUtils.lerp(.08,-.10,ease(t,a,b-.35))*(1-ease(t,b,d));
 const u=T.MathUtils.clamp(t/a,0,1),v=T.MathUtils.clamp((t-a)/(d-a),0,1),advance=.36*(u*u*u-.5*u*u*u*u)+(.36/a)*(d-a)*(v-v*v*v+.5*v*v*v*v);
 const stage=t<a?'Closed-mouth approach':t<b-.35?'Engulfment: head elevation, jaw opening and pouch expansion':t<d?'Jaw closure with pouch still distended':t<e?'Draining study: posterior then anterior pouch contraction':t<f?'Recovery to neutral':'Study complete: neutral hold';
 return {time:Math.min(t,f),duration:f,stage,gape,pouch,posterior,tail:tail||0,approach:t<a,advance,recovery:ease(t,e,f),upper:c.upper*gape,lower:c.lower*gape};
}
const mouthY=(c,x)=>c.y+c.slope*(x-c.hinge);
function blendVertex(a,b,t){
 const p=a.p.clone().lerp(b.p,t),values={};for(const key of Object.keys(a.values))values[key]=a.values[key].map((x,i)=>x+(b.values[key][i]-x)*t);
 if(values.skinIndex){const weights=new Map();for(const[v,w]of[[a,1-t],[b,t]])for(let k=0;k<4;k++){const j=v.values.skinIndex[k];weights.set(j,(weights.get(j)||0)+v.values.skinWeight[k]*w);}const pairs=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4);while(pairs.length<4)pairs.push([0,0]);const total=pairs.reduce((n,x)=>n+x[1],0);values.skinIndex=pairs.map(x=>x[0]);values.skinWeight=pairs.map(x=>x[1]/(total||1));}
 return {p,values,uid:'cut:'+ [a.uid,b.uid].sort().join(':')};
}
function skinMatrix(mesh,g,i){
 const sum=new T.Matrix4();sum.elements.fill(0);const si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
 for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(!w)continue;const j=si.getComponent(i,k),bone=new T.Matrix4().multiplyMatrices(mesh.skeleton.bones[j].matrixWorld,mesh.skeleton.boneInverses[j]);for(let e=0;e<16;e++)sum.elements[e]+=bone.elements[e]*w;}
 return mesh.bindMatrixInverse.clone().multiply(sum).multiply(mesh.bindMatrix);
}
function cutOralSeam(mesh,m,c){
 const original=mesh.geometry,attrs=original.attributes,verts=[];mesh.skeleton?.update();
 for(let i=0;i<attrs.position.count;i++){const p=mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld);m.root.worldToLocal(p);const values={};for(const[key,a]of Object.entries(attrs))if(key!=='position')values[key]=Array.from({length:a.itemSize},(_,k)=>a.getComponent(i,k));verts.push({p,values,uid:String(i)});}
 const indices=original.index?Array.from(original.index.array):verts.map((_,i)=>i),result=[],outIndex=[],seam=[],corners=new Map();
 const scalar=v=>v.p.y-mouthY(c,v.p.x);
 function emit(poly,side){for(let j=1;j<poly.length-1;j++){const tri=[poly[0],poly[j],poly[j+1]],cross=tri[1].p.clone().sub(tri[0].p).cross(tri[2].p.clone().sub(tri[0].p));if(cross.lengthSq()<1e-18)continue;for(const v of tri){const key=side+':'+v.uid;let index=corners.get(key);if(index===undefined){index=result.length;result.push({...v,side});corners.set(key,index);}outIndex.push(index);}}}
 for(let i=0;i<indices.length;i+=3){const tri=indices.slice(i,i+3).map(n=>verts[n]);if(Math.max(...tri.map(v=>v.p.x))<c.hinge-.12){emit(tri,0);continue;}
  for(const side of[-1,1]){const poly=[];for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],fa=scalar(a)*side,fb=scalar(b)*side;if(fa>=0)poly.push(a);if((fa<0&&fb>0)||(fa>0&&fb<0)){const v=blendVertex(a,b,fa/(fa-fb));poly.push(v);if(v.p.x>c.hinge+.04)seam.push(v.p.clone());}}if(poly.length>=3)emit(poly,side);}
 }
 const g=new T.BufferGeometry(),raw=[],rootToMesh=mesh.matrixWorld.clone().invert().multiply(m.root.matrixWorld);
 for(const v of result)raw.push(...v.p.clone().applyMatrix4(rootToMesh).toArray());g.setAttribute('position',new T.Float32BufferAttribute(raw,3));
 for(const[key,a]of Object.entries(attrs))if(key!=='position'){const data=result.flatMap(v=>v.values[key]),Attribute=key==='skinIndex'?T.Uint16BufferAttribute:T.Float32BufferAttribute;g.setAttribute(key,new Attribute(data,a.itemSize));}
 g.setIndex(outIndex);mesh.geometry=g;
 const undo=result.map((v,i)=>{const matrix=rootToMesh.clone();if(mesh.isSkinnedMesh)matrix.premultiply(skinMatrix(mesh,g,i).invert());return matrix;});
 // New interpolated corners must be rebound from the actual neutral pose.
 const p=g.attributes.position;for(let i=0;i<result.length;i++){const v=result[i].p.clone().applyMatrix4(undo[i]);p.setXYZ(i,v.x,v.y,v.z);}g.computeBoundingBox();g.computeBoundingSphere();
 return {mesh,original,result,undo,basePosition:p.array.slice(),baseNormal:g.attributes.normal?.array.slice(),seam};
}
function deformPoint(v,side,c,state){
 const p=v.clone(),neck=ease(p.x,c.hinge-.12,c.hinge+.28),a=side>0?state.upper:side<0?-state.lower:0;
 if(a){const x=p.x-c.hinge,y=p.y-c.y,angle=a*neck;p.x=c.hinge+x*Math.cos(angle)-y*Math.sin(angle);p.y=c.y+x*Math.sin(angle)+y*Math.cos(angle);}
 if(side<=0&&v.y<mouthY(c,v.x)){const u=T.MathUtils.clamp((v.x+.50)/(c.tip+.50),0,1),envelope=Math.pow(Math.sin(Math.PI*u),1.4),ventral=ease(mouthY(c,v.x)-v.y,0,.20),central=1-ease(Math.abs(v.z),.32,.55),anterior=ease(v.x,.35,1.1),amount=T.MathUtils.lerp(state.posterior,state.pouch,anterior);
  p.y-=c.pouch*amount*envelope*ventral*central;p.z*=1+.20*amount*envelope*ventral*central+.06*state.gape*neck;
 }
 if(v.x<-.32){const u=ease(-v.x,.32,1.65),angle=state.tail*u,x=p.x+.32,y=p.y-.43;p.x=-.32+x*Math.cos(angle)-y*Math.sin(angle);p.y=.43+x*Math.sin(angle)+y*Math.cos(angle);}
 return p;
}
function gridGeometry(nx,nz,point){
 const positions=[],indices=[];for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++)positions.push(...point(i/nx,j/nz).toArray());for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j,b=a+nz+1;indices.push(a,b,a+1,b,b+1,a+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function makeOralSurfaces(m,c,body){
 const seam=body.seam;
 const samples=80,width=[];for(let i=0;i<=samples;i++){const x=c.hinge+.04+(c.tip-c.hinge-.04)*i/samples,near=seam.filter(p=>Math.abs(p.x-x)<.035);width.push(near.length?Math.max(...near.map(p=>Math.abs(p.z))):i?width[i-1]:.25);}
 // The tip closes rather than leaving a square mouth opening.
 width[samples]=0;const at=u=>{const q=u*samples,i=Math.min(samples-1,Math.floor(q));return T.MathUtils.lerp(width[i],width[i+1],q-i);};
 const group=new T.Group();group.name='Authored oral cavity and paired baleen racks';m.root.add(group);const pieces=[];
 const roof=gridGeometry(48,20,(u,v)=>{const x=c.hinge+.04+(c.tip-c.hinge-.04)*u;return V(x,mouthY(c,x)+.004,(v*2-1)*at(u)*.985);}),roofMesh=new T.Mesh(roof,new T.MeshStandardMaterial({color:'#51434b',roughness:.52,side:T.FrontSide}));roofMesh.name='Authored inner palate; no airway model';group.add(roofMesh);pieces.push({mesh:roofMesh,side:1,rest:roof.attributes.position.array.slice()});
 // Derive the lining from the actual retained lower shell, rather than laying
 // a generic sheet through a differently shaped external pouch.
 const lower=[],lowerIndex=[],remap=new Map(),sourceIndex=body.mesh.geometry.index.array;
 for(let i=0;i<sourceIndex.length;i+=3){const tri=Array.from(sourceIndex.slice(i,i+3));if(!tri.every(k=>body.result[k].side<0&&body.result[k].p.x>c.hinge+.025))continue;const out=[];for(const k of tri){if(!remap.has(k)){remap.set(k,lower.length/3);const p=body.result[k].p;lower.push(p.x,p.y+.010,p.z*.975);}out.push(remap.get(k));}lowerIndex.push(out[0],out[2],out[1]);}
 const floor=new T.BufferGeometry();floor.setAttribute('position',new T.Float32BufferAttribute(lower,3));floor.setIndex(lowerIndex);floor.computeVertexNormals();const floorMesh=new T.Mesh(floor,new T.MeshStandardMaterial({color:'#65545c',roughness:.52,side:T.FrontSide}));floorMesh.name='Lining derived inside the retained distensible lower shell; tongue unresolved';group.add(floorMesh);pieces.push({mesh:floorMesh,side:-1,rest:floor.attributes.position.array.slice()});
 const backX=c.hinge+.15,backU=(backX-c.hinge-.04)/(c.tip-c.hinge-.04),backWidth=at(backU)*.97,near=body.result.filter(v=>Math.abs(v.p.x-backX)<.055&&Math.abs(v.p.z)<.12&&v.side<0),backMin=near.length?Math.min(...near.map(v=>v.p.y))+.018:c.y-.1,upper=[],bottom=[],mix=[];
 const back=gridGeometry(12,24,(u,v)=>{const z=(v*2-1)*backWidth,top=V(backX,mouthY(c,backX),z),low=V(backX,T.MathUtils.lerp(mouthY(c,backX),backMin,Math.sqrt(Math.max(0,1-Math.pow(v*2-1,2)))),z);upper.push(...top.toArray());bottom.push(...low.toArray());mix.push(u);return top.clone().lerp(low,u);}),backMesh=new T.Mesh(back,new T.MeshStandardMaterial({color:'#332c32',roughness:.64,side:T.DoubleSide}));backMesh.name='Selected rear oral lining; pharynx and airway unresolved';group.add(backMesh);pieces.push({mesh:backMesh,upper,bottom,mix});
 // Transverse plates occur in paired longitudinal racks attached to the roof;
 // these selected display counts are not anatomical plate counts or teeth.
 const positions=[],indices=[];for(const sign of[-1,1])for(let i=0;i<c.plates;i++){const u=.05+.88*i/(c.plates-1),x=c.hinge+.04+(c.tip-c.hinge-.04)*u,w=at(u),z=sign*w*.92,y=mouthY(c,x)+.006,drop=.025+.105*Math.pow(Math.sin(Math.PI*u),.7),n=positions.length/3;
  positions.push(x-.002,y,z,x+.002,y,z,x-.002,y-drop,z-sign*(.015+drop*.18),x+.002,y-drop,z-sign*(.015+drop*.18));indices.push(n,n+1,n+2,n+1,n+3,n+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const mat=new T.MeshStandardMaterial({color:'#4c4942',roughness:.77,side:T.DoubleSide}),mesh=new T.Mesh(g,mat);mesh.name='Paired authored baleen plate exteriors; selected display density';group.add(mesh);pieces.push({mesh,side:1,rest:Float32Array.from(g.attributes.position.array)});group.visible=false;
 for(const piece of pieces)if(!piece.mesh.geometry.attributes.uv)piece.mesh.geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(piece.mesh.geometry.attributes.position.count*2),2));
 return {group,pieces,width,at};
}
export function configureRorqualFeeding(m){
 const c=settings[m.id];if(!c)return;m.root.updateMatrixWorld(true);const sourceMeshes=[],oldBindings=m.featureBindings;m.root.traverse(o=>{if(o.isMesh)sourceMeshes.push(o);});
 const parts=sourceMeshes.map(mesh=>cutOralSeam(mesh,m,c)),body=parts.reduce((a,b)=>a.seam.length>b.seam.length?a:b),oral=makeOralSurfaces(m,c,body);
 m.rorqualFeeding={settings:c,parts,oral,current:null,changed:false,scope:'Authored external jaw/pouch/baleen study; selected geometry and timing, not measured fluid dynamics or complete feeding physiology'};
 // Existing anatomy anchors were vertex indices of the pre-cut surface.
 const targets=m.id==='balaenoptera-musculus'?[V(1.25,.60,0),V(-1.7,.3,0),V(.65,.29,.2),V(-.95,.55,0)]:[V(1.20,.65,0),V(.50,.45,.55),V(-1.7,.4,0),V(.45,.22,.12)];
 m.featureBindings=targets.map(target=>{let best;for(const p of parts){const indices=p.result.map((v,i)=>({i,d:v.p.distanceToSquared(target)})).sort((a,b)=>a.d-b.d).slice(0,10);if(!best||indices[0].d<best.distance)best={mesh:p.mesh,indices:indices.map(x=>x.i),distance:indices[0].d,kind:'Authored approximate retained surface region'};}return best;});
 // Keep the corrected blue dorsal-fin anchor on its actual selected surface.
 if(m.id==='balaenoptera-musculus')m.featureBindings=oldBindings.map(b=>{const p=parts.find(p=>p.mesh===b.mesh),source=new Set(b.indices.map(String)),indices=p.result.flatMap((v,i)=>source.has(v.uid)?[i]:[]);return {...b,indices};});
 m.features=targets.map(()=>V());Object.assign(m.root.userData,{focusAnatomy:true,anatomyUnderside:m.id==='balaenoptera-musculus'?[2]:[3],anatomyFocusScale:m.id==='balaenoptera-musculus'?[.70,.6,.55,.34]:[.75,.48,.60,.55],anatomyViewDirections:m.id==='balaenoptera-musculus'?[[1,.25,.8],[.3,.8,1],[.4,-.5,1],[0,.4,1]]:[[1,.22,.75],[0,.5,1],[.3,.8,1],[.4,-.5,1]]});
 m.motionBounds={...m.motionBounds,forage:new T.Box3(V(-1.98,.35,-1.06),V(2.25,2.15,1.06))};
}
export function restoreRorqualSkin(m){
 const r=m.rorqualFeeding;if(!r)return;r.oral.group.visible=false;if(!r.changed)return;
 for(const p of r.parts){p.mesh.geometry.attributes.position.array.set(p.basePosition);p.mesh.geometry.attributes.position.needsUpdate=true;if(p.baseNormal){p.mesh.geometry.attributes.normal.array.set(p.baseNormal);p.mesh.geometry.attributes.normal.needsUpdate=true;}p.mesh.geometry.computeBoundingBox();p.mesh.geometry.computeBoundingSphere();}
 r.changed=false;r.current=null;
}
export function animateRorqualFeeding(m,action,t){
 const r=m.rorqualFeeding;if(!r)return false;if(action!=='forage'){restoreRorqualSkin(m);return false;}
 if(r.changed&&r.current?.time===rorqualFeedingState(m.id,t).time)return true;
 // Hold the retained source rig neutral; this study uses continuous exterior
 // morphs instead of running an unrelated swimming clip during engulfment.
 m.mixer.stopAllAction();for(const[o,b]of(m.blueWhale?.neutralPose||m.rest)){o.position.copy(b.position);o.quaternion.copy(b.quaternion);o.scale.copy(b.scale);}
 if(m.surfaceRig?.kind==='whale')for(const rig of m.surfaceRig.rigs)rig.bones.forEach((b,i)=>{b.position.copy(rig.home[i]);b.quaternion.identity();});
 m.root.position.set(0,.60,0);m.root.rotation.set(0,0,0);m.root.scale.setScalar(1);m.root.updateMatrixWorld(true);for(const p of r.parts)p.mesh.skeleton?.update();
 const state=rorqualFeedingState(m.id,t),c=r.settings;r.current=state;m.root.position.x=state.advance;
 for(const p of r.parts){const g=p.mesh.geometry,a=g.attributes.position;for(let i=0;i<p.result.length;i++){const v=deformPoint(p.result[i].p,p.result[i].side,c,state).applyMatrix4(p.undo[i]);a.setXYZ(i,v.x,v.y,v.z);}a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();}
 for(const piece of r.oral.pieces){const a=piece.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const q=piece.mix?deformPoint(V().fromArray(piece.upper,i*3),1,c,state).lerp(deformPoint(V().fromArray(piece.bottom,i*3),-1,c,state),piece.mix[i]):deformPoint(V().fromArray(piece.rest,i*3),piece.side,c,state);a.setXYZ(i,q.x,q.y,q.z);}a.needsUpdate=true;piece.mesh.geometry.computeVertexNormals();piece.mesh.geometry.computeBoundingBox();piece.mesh.geometry.computeBoundingSphere();}
 r.oral.group.visible=state.gape>.002;r.changed=true;m.root.updateMatrixWorld(true);return true;
}
