import * as T from 'three';
// A three-control exterior rig, not a reconstruction of individual vertebrae.
// The retained mesh/atlas is deformed only through the upper neck. Neither
// gaze, eye movements nor the animal's sensory physiology is calculated.
export function rigStandingEagle(m){
 const r=m.birdRevision;
 r.standingRigs=r.standingParts.map(source=>{
  const geometry=source.geometry.clone(),p=geometry.attributes.position;
  const index=new Uint16Array(p.count*4),weight=new Float32Array(p.count*4);
  for(let i=0;i<p.count;i++){
   const y=p.getY(i),x=p.getX(i),neck=T.MathUtils.smoothstep(y,.88,1.08)*T.MathUtils.smoothstep(x,-.12,.10),head=T.MathUtils.smoothstep(y,1.04,1.13);
   index.set([0,1,2,0],i*4);weight.set([1-neck,neck*(1-head),neck*head,0],i*4);
  }
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(index,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weight,4));
  const mesh=new T.SkinnedMesh(geometry,source.material);mesh.name=source.name;mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.scale.setScalar(1);mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.frustumCulled=false;
  const base=new T.Bone(),neck=new T.Bone(),head=new T.Bone();base.name='Standing body anchor';neck.name='Standing lower neck control';head.name='Standing head control';neck.position.set(.20,.94,0);head.position.set(.07,.18,0);base.add(neck);neck.add(head);mesh.add(base);source.parent.add(mesh);mesh.updateMatrixWorld(true);mesh.bind(new T.Skeleton([base,neck,head]));
  const bind=r.bind.get(source);r.bind.delete(source);r.bind.set(mesh,{position:bind.position.clone(),quaternion:bind.quaternion.clone(),scale:new T.Vector3(1,1,1)});for(const b of[base,neck,head])r.bind.set(b,{position:b.position.clone(),quaternion:b.quaternion.clone(),scale:b.scale.clone()});
  r.parts[r.parts.indexOf(source)]=mesh;for(const binding of r.standBindings)if(binding.mesh===source)binding.mesh=mesh;source.removeFromParent();
  return {mesh,bones:[base,neck,head],sourceGeometry:source.geometry};
 });
 r.standingParts=r.standingRigs.map(x=>x.mesh);
 m.motionBounds.look=new T.Box3(new T.Vector3(-.68,-.04,-.5),new T.Vector3(.72,1.36,.5));
}
export function standingEagleYaw(time){
 const t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,8),s=T.MathUtils.smoothstep;
 return 40*Math.PI/180*(s(t,.6,1.4)-s(t,2.6,3.4)-s(t,4.6,5.4)+s(t,6.6,7.4));
}
export function poseStandingEagle(m,action,time){
 const look=action==='look',t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,8),yaw=look?standingEagleYaw(t):0;
 for(const rig of m.birdRevision.standingRigs){rig.bones[1].rotation.y=yaw*.3;rig.bones[2].rotation.y=yaw*.7;}
 if(look){m.movementStudy={duration:8,time:t,complete:t>=8,stage:t<.6?'Forward viewing posture':t<2.6?'First sideways head turn':t<4.6?'Return through forward posture':t<6.6?'Opposite sideways head turn':t<7.4?'Return to forward posture':'Forward posture | end'};m.birdRevision.current={...m.movementStudy};m.root.userData.movementStudy={...m.movementStudy,finite:true,measured:false};}else{m.movementStudy=undefined;delete m.root.userData.movementStudy;}
}
