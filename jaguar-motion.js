import * as T from 'three';

// These are bounded excerpts from one credited artist sequence, not a measured
// gait cycle or a physiological model. Stopping avoids a false looping contact.
export const jaguarWindows={step:[4.6,5.7],groom:[10.65,13.8],stretch:[5.7,10.1]};
export function jaguarPlaybackTime(action,t){
 if(action==='observe')return 0;
 const range=jaguarWindows[action];return range?range[0]+T.MathUtils.clamp(t,0,range[1]-range[0]):0;
}
export function configureJaguar(m){
 if(m.id!=='panthera-onca')return;
 const clip=m.gltf.animations[0];if(!clip||clip.duration<14)throw Error('The reviewed jaguar source sequence is missing');
 m.jaguarSequence={clip,scope:'Bounded creator sequence; no fitted kinematics, force/contact solver, prey handling or sleep physiology.'};
 for(const action of ['observe',...Object.keys(jaguarWindows)])m.clipMap[action]=clip;
 const find=re=>m.bones.find(b=>re.test(b.name)),head=find(/^Head_M_/),pelvis=find(/^Root_M_/);
 if(!head||!pelvis)throw Error('Jaguar source axis cannot be established');
 m.root.updateMatrixWorld(true);const direction=head.getWorldPosition(new T.Vector3()).sub(pelvis.getWorldPosition(new T.Vector3())),yaw=Math.atan2(direction.z,direction.x);
 m.content.rotation.y+=yaw;m.root.updateMatrixWorld(true);
 const turned=new T.Box3().setFromObject(m.root,true),extent=turned.getSize(new T.Vector3()),fit=3.75/Math.max(extent.x,extent.y,extent.z);m.content.scale.multiplyScalar(fit);m.root.updateMatrixWorld(true);
 const fitted=new T.Box3().setFromObject(m.root,true),center=fitted.getCenter(new T.Vector3());m.content.position.add(new T.Vector3(-center.x,.13-fitted.min.y,-center.z));m.root.updateMatrixWorld(true);m.extent=new T.Box3().setFromObject(m.root,true).getSize(new T.Vector3());m.jaguarSequence.alignment={yaw,scope:'Rigid presentation alignment and normalized display fit, not an animal measurement'};
 const b=new T.Box3().setFromObject(m.root,true),meshes=[];m.root.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
 const targets=[head,find(/^Spine2_M_/),find(/^Wrist_L_/)];
 m.featureBindings=targets.map((bone,index)=>{
  if(!bone)throw Error('Missing jaguar anatomy region');
  const target=bone.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,index===2?-.05:0,index===1?.35:.12));let best;
  for(const mesh of meshes){mesh.skeleton.update();const p=mesh.geometry.attributes.position,samples=[];for(let i=0;i<p.count;i++){const v=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);samples.push({i,d:v.distanceToSquared(target)});}samples.sort((a,b)=>a.d-b.d);if(samples.length&&(!best||samples[0].d<best.distance))best={mesh,indices:samples.slice(0,12).map(v=>v.i),distance:samples[0].d,kind:'Approximate retained artist surface region; not measured anatomy'};}return best;
 });
 Object.assign(m.root.userData,{focusAnatomy:true,anatomyFocusScale:[.42,.48,.36],foliageViewDirection:[0,.18,1],reproductiveViewDirection:[0,.18,1]});
 const envelope=b.clone();envelope.min.add(new T.Vector3(-.15,-.05,-.15));envelope.max.add(new T.Vector3(.15,.20,.15));m.motionBounds=Object.fromEntries(Object.keys(jaguarWindows).map(action=>[action,envelope.clone()]));
}
export function animateJaguar(m,action,t){
 if(!m.jaguarSequence)return false;
 m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);m.root.scale.setScalar(1);
 if(m.action){m.action.setLoop(T.LoopOnce,1);m.action.clampWhenFinished=true;m.action.paused=false;m.action.enabled=true;m.mixer.setTime(jaguarPlaybackTime(action,t));}
 m.root.updateMatrixWorld(true);m.gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 // A fixed presentation datum retains the source's relative support changes.
 // No frame-by-frame whole-animal lift is used to conceal sliding or air phases.
 return true;
}
