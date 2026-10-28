import * as T from 'three';
import {updateSpecimenLandmarks} from './surface-landmarks.js';

// Artist surfaces remain under their own grants. Display placement, material
// compatibility and the finite local studies below are disclosed derivatives.
export const refinedCetaceanIds=new Set(['physeter-macrocephalus','kogia-breviceps','globicephala-macrorhynchus','ziphius-cavirostris','eubalaena-australis']);
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep,clamp=T.MathUtils.clamp;
export function prepareCetaceanSurface(gltf,s,asset){
 const root=new T.Group(),content=new T.Group();root.add(content);content.add(gltf.scene);root.updateMatrixWorld(true);
 let box=new T.Box3().setFromObject(content,true),size=box.getSize(V());
 if(size.z>size.x)content.rotation.y=Math.PI/2;
 if(s.id==='ziphius-cavirostris')content.rotation.y+=Math.PI;
 root.updateMatrixWorld(true);box.setFromObject(content,true);size=box.getSize(V());content.scale.setScalar(3.85/size.x);
 root.updateMatrixWorld(true);box.setFromObject(content,true);const center=box.getCenter(V());content.position.copy(V(-center.x,1.45-center.y,-center.z));root.updateMatrixWorld(true);
 const meshes=[],bones=[];gltf.scene.traverse(o=>{if(o.isBone)bones.push(o);if(!o.isMesh)return;meshes.push(o);o.castShadow=true;o.receiveShadow=true;for(const mat of Array.isArray(o.material)?o.material:[o.material]){mat.metalness=0;mat.roughness=.52;mat.envMapIntensity=.5;}});
 // The static CARI'MAM sperm surface carries a pronounced tail-down pose.
 // Relax only its caudal region toward the level live-reference posture;
 // this selected rest correction is not a fitted joint or tissue solution.
 if(s.id==='physeter-macrocephalus'){
  root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(root,true),length=b.max.x-b.min.x,pivot=V(b.max.x-length*.65,1.70,0);
  for(const mesh of meshes){mesh.geometry=mesh.geometry.clone();const p=mesh.geometry.attributes.position,inverse=mesh.matrixWorld.clone().invert();for(let i=0;i<p.count;i++){const v=V().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),u=(b.max.x-v.x)/length,a=-.52*smooth(u,.62,.92),dx=v.x-pivot.x,dy=v.y-pivot.y;v.set(pivot.x+dx*Math.cos(a)-dy*Math.sin(a),pivot.y+dx*Math.sin(a)+dy*Math.cos(a),v.z).applyMatrix4(inverse);p.setXYZ(i,...v);}p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
 }
 if(s.id==='globicephala-macrorhynchus'){
  // Tone the artist's very pale dorsal saddle toward the gray patch in the
  // live references. The ventral anchor and every original atlas pixel remain.
  const b=new T.Box3().setFromObject(root,true),length=b.max.x-b.min.x;
  for(const mesh of meshes){mesh.geometry=mesh.geometry.clone();const p=mesh.geometry.attributes.position,colours=[];for(let i=0;i<p.count;i++){const v=V().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),u=(b.max.x-v.x)/length,w=smooth(u,.27,.40)*(1-smooth(u,.69,.80))*smooth(v.y,1.43,1.65),tone=1-.64*w;colours.push(tone,tone,tone);}mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]){mat.vertexColors=true;mat.needsUpdate=true;}}
 }
 const mixer=new T.AnimationMixer(gltf.scene),creator=s.id==='eubalaena-australis',clip=creator?gltf.animations[0]:null;
 const m={root,content,gltf,mixer,asset,id:s.id,kind:'cetacean',forward:1,natural:true,textured:true,surfaceDetailed:true,bones,parts:{},features:[],limbs:[],clipMap:{},current:'observe',action:null,sourceClip:null};
 const r=m.cetaceanSurface={creator,clip,meshes:[],action:null,seconds:12,centerY:1.45};
 if(clip){r.action=mixer.clipAction(clip);r.action.setLoop(T.LoopOnce,1);r.action.clampWhenFinished=true;r.action.play();mixer.setTime(0);}
 root.updateMatrixWorld(true);box.setFromObject(root,true);r.min=box.min.x;r.max=box.max.x;r.length=box.max.x-box.min.x;m.extent=box.getSize(V());
 for(const mesh of meshes){if(mesh.isSkinnedMesh)continue;mesh.geometry=mesh.geometry.clone();const p=mesh.geometry.attributes.position,world=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const v=V().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);v.toArray(world,i*3);}r.meshes.push({mesh,neutral:p.array.slice(),normal:mesh.geometry.attributes.normal?.array.slice(),world,inverse:mesh.matrixWorld.clone().invert()});}
 let dorsal=V(0,-Infinity,0);for(const mesh of meshes){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld);if(Math.abs(v.z)<.08&&v.x<r.max-r.length*.28&&v.x>r.min+r.length*.15&&v.y>dorsal.y)dorsal.copy(v);}}if(!Number.isFinite(dorsal.y))dorsal.set(r.max-r.length*.58,box.max.y,0);
 const targets=[V(r.max-r.length*.18,1.45,.14),V(r.min+.12,1.45,0),dorsal];
 m.featureBindings=targets.map(target=>{let best;for(const mesh of meshes){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld),d=v.distanceToSquared(target);if(!best||d<best.d)best={mesh,indices:[i],d,kind:'Approximate retained artist-surface region; not a measured landmark'};}}return best;});m.features=targets.map(()=>V());
 Object.assign(root.userData,{focusAnatomy:true,anatomyFocusScale:[.65,.62,.65],anatomyViewDirections:[[.7,.15,1],[0,1,.001],[0,.6,1]],cetaceanSurfaceScope:'Same credited artist geometry, UVs and atlas across bounded local studies; no fitted trajectories, complete swimming, feeding, flow or physiological solver.'});
 animateCetaceanSurface(m,'observe',0);updateSpecimenLandmarks(m);return m;
}
export function selectCetaceanSurface(m,action){m.current=action;m.sourceClip=m.cetaceanSurface.creator&&action==='swim'?m.cetaceanSurface.clip:null;return action==='observe'?'Credited sculpted surface and original atlas · selected source pose':m.sourceClip?'Finite creator fluke/flipper excerpt · uncalibrated':'Same credited surface · finite authored local posture · uncalibrated';}
export function cetaceanSurfaceLine(r,action,t){
 const u=clamp(t/12,0,1),envelope=t<=0||t>=12?0:Math.sin(Math.PI*u)**2,stroke=action==='glide'?1-smooth(t,5,6):1,n=160,line=[];let x=r.max,y=0;
 for(let i=0;i<=n;i++){const v=i/n,w=smooth(v,.40,1),a=['swim','glide'].includes(action)?.19*envelope*stroke*w*w*Math.sin(t*Math.PI*.5-v*2.1):0;if(i){const ds=r.length/n;x-=ds*Math.cos(a);y-=ds*Math.sin(a);}line.push({x,y,a});}return{line,envelope};
}
export function animateCetaceanSurface(m,action,t){
 const r=m.cetaceanSurface;if(!r)return false;const clock=clamp(t,0,12),{line,envelope}=cetaceanSurfaceLine(r,action,clock),n=line.length-1;
 m.root.position.set(0,0,0);m.root.scale.setScalar(1);m.root.rotation.set(0,action==='turn'?.20*envelope*Math.sin(Math.PI*clock/12):0,0);
 if(r.creator){const a=r.action;a.paused=false;a.enabled=true;a.play();m.mixer.setTime(action==='swim'?Math.min(t/2,r.clip.duration-1e-6):0);m.gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});}
 else for(const part of r.meshes){const {mesh,neutral,world,inverse}=part,p=mesh.geometry.attributes.position;if(envelope===0||!['swim','glide'].includes(action)){p.array.set(neutral);if(part.normal)mesh.geometry.attributes.normal.array.set(part.normal);}else for(let i=0;i<p.count;i++){const x=world[i*3],y=world[i*3+1],z=world[i*3+2],u=clamp((r.max-x)/r.length,0,1),f=u*n,k=Math.min(n-1,Math.floor(f)),w=f-k,a=T.MathUtils.lerp(line[k].a,line[k+1].a,w),dx=x-(r.max-u*r.length),dy=y-r.centerY,v=V(T.MathUtils.lerp(line[k].x,line[k+1].x,w)+dx*Math.cos(a)-dy*Math.sin(a),r.centerY+T.MathUtils.lerp(line[k].y,line[k+1].y,w)+dy*Math.cos(a),z).applyMatrix4(inverse);p.setXYZ(i,...v);}
  p.needsUpdate=true;if(envelope>0&&['swim','glide'].includes(action))mesh.geometry.computeVertexNormals();else if(mesh.geometry.attributes.normal)mesh.geometry.attributes.normal.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
 m.root.updateMatrixWorld(true);updateSpecimenLandmarks(m);r.current={action,clock,finished:t>=12,scope:r.creator?'Bounded creator excerpt, not measured swimming':'Finite authored posterior bending or orientation only'};return true;
}
