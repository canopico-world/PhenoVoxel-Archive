import * as T from 'three';

// Source timing is retained for inspection, not treated as a biological measurement.
// Finite playback allows reproducible endpoint and out-of-order time inspection.
export const movementStudyIds=new Set(['isurus-oxyrinchus','lontra-canadensis','phocoena-phocoena','carcharhinus-limbatus','sphyrna-mokarran','anguilla-rostrata','lepomis-macrochirus','lepisosteus-osseus','acipenser-oxyrinchus','ceratotherium-simum','natator-depressus','atelopus-zeteki','litoria-caerulea']);
const V=(...a)=>new T.Vector3(...a),Q=()=>new T.Quaternion();
export const safeTime=t=>Math.max(0,Number.isFinite(t)?t:0);
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};

export function movementClip(m,motion){
 const native=m.asset.nativeMotion[motion];
 if(native)return {...native,finite:movementStudyIds.has(m.id)&&motion!=='observe'};
 if(['lepisosteus-osseus','acipenser-oxyrinchus'].includes(m.id)){
  const clip={bank:'fast_swim_left_baked',reverse:'fast_swim_right_baked',escape:'fast_swim_steady_baked'}[motion];
  if(clip)return {clip,finite:true};
 }
 if(m.id==='sphyrna-mokarran'&&motion==='bank')return {...m.asset.nativeMotion.swim,finite:true};
 return {...m.asset.nativeMotion.observe};
}

export function prepareMovementStudy(m){
 if(!movementStudyIds.has(m.id))return;
 const study=m.movementStudy={duration:0,stage:'Observe',joints:[]};
 if(['atelopus-zeteki','litoria-caerulea'].includes(m.id)){
  // Regional throat shape key. Coordinates are registered to each source scan,
  // not a whole-body scale pulse. Mouth edge, eyes, feet and dorsal skin stay fixed.
  const golden=m.id==='atelopus-zeteki';
  const center=golden?V(-.15,4.45,4.15):V(-5.3,2.65,-.1);
  const radius=golden?V(1.25,1.05,1.45):V(2.25,1.35,2.6),amplitude=golden?.11:.19;
  study.throats=[];m.root.updateMatrixWorld(true);
  for(const mesh of m.digitalLife.meshes){
   const geometry=mesh.geometry,position=geometry.attributes.position,base=new Float32Array(position.count*3),target=new Float32Array(position.count*3),inverse=mesh.matrixWorld.clone().invert();let affected=0;
   for(let i=0;i<position.count;i++){
    const local=V().fromBufferAttribute(position,i);base.set(local.toArray(),i*3);
    const world=local.clone().applyMatrix4(mesh.matrixWorld),delta=world.clone().sub(center).divide(radius),r2=delta.lengthSq();
    const w=r2<1?(1-r2)**3:0;if(w>1e-5)affected++;
    world.y-=amplitude*w;target.set(world.applyMatrix4(inverse).toArray(),i*3);
   }
   // Use the exact source position for inactive vertices (avoids inverse-transform drift).
   for(let i=0;i<base.length;i++)if(Math.abs(target[i]-base[i])<1e-6)target[i]=base[i];
   geometry.setAttribute('position',new T.BufferAttribute(base,3));geometry.morphAttributes.position=[new T.BufferAttribute(target,3)];geometry.morphTargetsRelative=false;
   const posed=geometry.clone();posed.setAttribute('position',new T.BufferAttribute(target,3));posed.computeVertexNormals();
   geometry.morphAttributes.normal=[posed.attributes.normal.clone()];posed.dispose();mesh.updateMorphTargets();mesh.morphTargetInfluences[0]=0;
   study.throats.push({mesh,affected});
  }
 }
 if(m.id==='natator-depressus'){
  // The asset's +Z is rostral and +Y dorsal before display normalization.
  m.root.updateMatrixWorld(true);
  for(const side of ['L','R'])for(const [part,axis] of [['shoulder',V(0,0,1)],['ulna',V(0,1,0)],['thigh',V(0,1,0)]]){
   const bone=m.bones.find(b=>b.name===`${part}_${side}_body_rig`);if(!bone)throw Error('Flatback joint missing: '+part+side);
   const parentQ=bone.parent.getWorldQuaternion(Q());
   study.joints.push({bone,side,part,rest:bone.quaternion.clone(),axis:axis.applyQuaternion(parentQ.invert()).normalize()});
  }
 }
}

export function animateMovementStudy(m,motion,t,clip){
 const s=m.movementStudy;if(!s)return;
 m.root.position.set(0,0,0);m.root.quaternion.identity();
 const seconds=safeTime(t);
 s.duration=clip?.duration||6;s.time=Math.min(seconds,s.duration);s.stage=motion==='observe'?'Observe':seconds>=s.duration?'Study complete':'Movement study';
 if(s.throats){
  const u=Math.min(seconds,6),envelope=smooth(u/.5)*smooth((6-u)/.5);
  const influence=motion==='rest'?(.5-.5*Math.cos(u*Math.PI*2))*envelope:0;
  for(const {mesh}of s.throats)mesh.morphTargetInfluences[0]=influence;
  s.stage=motion==='observe'?'Observe':seconds>=6?'Study complete':influence>.45?'Buccal floor lowered':'Buccal floor returning';
 }
 if(m.id==='natator-depressus'){
  for(const j of s.joints)j.bone.quaternion.copy(j.rest);
  if(motion==='swim'||motion==='glide'){
   s.duration=6;s.time=Math.min(seconds,6);
   // Two synchronized foreflipper cycles. Hind flippers are small rudder adjustments.
   // Shoulder drive and forearm feathering are illustrative sea-turtle kinematics;
   // green/loggerhead studies inform the mechanism, not flatback measured angles.
   const phase=s.time/3*Math.PI*2,env=smooth(s.time/.5)*smooth((6-s.time)/.5);
   for(const j of s.joints){const sign=j.side==='L'?1:-1;let a=0;
    if(motion==='swim')a=j.part==='shoulder'?sign*.52*Math.sin(phase)*env:j.part==='ulna'?sign*.12*Math.sin(phase-.5)*env:sign*.035*Math.sin(phase)*env;
    j.bone.quaternion.copy(j.rest).premultiply(Q().setFromAxisAngle(j.axis,a));
   }
   s.stage=seconds>=6?'Study complete':motion==='glide'?'Flippers held for glide':Math.cos(phase)>0?'Foreflipper recovery':'Foreflipper downstroke';
  }
 }
 if(m.id==='sphyrna-mokarran'&&motion==='bank'){
  // Roll about the longitudinal display axis through the animal's centre.
  const u=s.time/s.duration,envelope=smooth(u/.2)*smooth((1-u)/.2);
  const q=Q().setFromAxisAngle(V(1,0,0),Math.PI/3*envelope),center=m.movementStudy.center;
  m.root.quaternion.copy(q);m.root.position.copy(center).sub(center.clone().applyQuaternion(q));
  s.stage=u>=1?'Upright recovery complete':u<.2?'Rolling into side swimming':u>.8?'Returning upright':'Rolled swimming';
 }
 m.root.userData.movementStudy={duration:s.duration,time:s.time,stage:s.stage,finite:true,measured:false};
}
