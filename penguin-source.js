import * as T from 'three';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
// Artist exterior with a new bound skeleton. Angular amplitudes, step length,
// body roll and neck shape are authored; the active stroke cycle is 1.47 Hz.
export function prepareSourcePenguin(gltf,s,asset){
 const root=new T.Group(),content=new T.Group();root.add(content);content.add(gltf.scene);const parts=[],bind=new Map();
 gltf.scene.traverse(o=>{bind.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()});if(o.isMesh){parts.push(o);o.userData.compatibilityMorphNormals=true;o.material.userData={compatibilityLinearTexture:true,compatibilitySurfaceDetail:false};o.material.envMapIntensity=.2;}});
 const body=parts.find(p=>/Feathered/.test(p.name)),bones=body.skeleton.bones,r={version:'0.6.70',sourcePenguin:true,body,bones,bind,parts,current:{stage:'Standing adult'}};
 const m={root,content,gltf,asset,id:s.id,kind:'penguin',forward:-1,natural:true,textured:true,surfaceDetailed:true,parts:{},bones,limbs:[],features:[],featureBindings:[],current:'observe',action:null,sourceClip:null,mixer:new T.AnimationMixer(gltf.scene),birdRevision:r};
 const targets=[[-.06,2.52,.47],[-.40,1.7,0],[-.1,.13,.245]];
 m.features=targets.map(t=>new T.Vector3(...t));m.featureBindings=m.features.map(t=>{let best;for(const mesh of parts){const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const distance=new T.Vector3().fromBufferAttribute(a,i).distanceToSquared(t);if(!best||distance<best.distance)best={mesh,indices:[i],distance,kind:'Source-derived exterior region; unmeasured'};}}return best;});
 Object.assign(root.userData,{aquaticStudy:true,focusAnatomy:true,anatomyFocusScale:[.3,.35,.25],anatomyViewDirections:[[0,.2,1],[-1,.15,.6],[-.5,.05,1]],birdScope:'Marcel Porsiel exterior adapted for emperor identification; research-informed qualitative motion. No physiological or fluid solver.'});
 m.motionBounds={};for(const[action,b]of Object.entries(asset.motionBounds||{}))m.motionBounds[action]=new T.Box3(new T.Vector3(...b.min),new T.Vector3(...b.max));animateSourcePenguin(m,'observe',0);m.extent=new T.Box3().setFromObject(root,true).getSize(new T.Vector3());return m;
}
export function animateSourcePenguin(m,action,time){
 const r=m.birdRevision,b=r.bones,t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,8),smooth=T.MathUtils.smoothstep;
 for(const[o,q]of r.bind){o.position.copy(q.position);o.quaternion.copy(q.quaternion);o.scale.copy(q.scale);}m.root.position.set(0,0,0);m.root.quaternion.identity();m.content.position.set(0,0,0);m.content.quaternion.identity();
 const water=action==='swim'||action==='glide';
 for(const p of r.parts)if(p.morphTargetInfluences)p.morphTargetInfluences[0]=water?1:0;
 for(const[side,i]of [[-1,3],[1,4]]){
  const from=new T.Vector3(.99,-1.10,side*.77).normalize(),to=water?new T.Vector3(.10,-.14,side).normalize():new T.Vector3(.10,-1,side*.14).normalize();
  b[i].quaternion.setFromUnitVectors(from,to);
  if(water){const envelope=action==='swim'?smooth(t,0,.45)*(1-smooth(t,5.7,7)):0,phase=t*2*Math.PI*1.47,stroke=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),side*.52*Math.sin(phase)*envelope),pitch=new T.Quaternion().setFromAxisAngle(to,side*.10*Math.cos(phase)*envelope);b[i].quaternion.premultiply(stroke).premultiply(pitch);const offset=new T.Vector3(.296,0,0);b[i].position.add(offset).sub(offset.clone().applyQuaternion(b[i].quaternion));}
 }
 if(water){
  m.content.rotation.z=Math.PI/2;m.content.position.set(1.75,1.55,0);
  r.current={stage:action==='glide'||t>=7?'Streamlined underwater glide':Math.cos(t*2*Math.PI*1.47)>=0?'Paired dorsal upstroke':'Paired ventral downstroke',duration:action==='swim'?8:0,complete:t>=8};
 }else{
  if(action==='walk'){
   const rows=[[.6,1.3,5,0,-.20,0,-.07],[1.6,2.3,6,0,-.40,-.07,-.27],[2.6,3.3,5,-.20,-.60,-.27,-.47],[3.6,4.3,6,-.40,-.60,-.47,-.60]],feet={5:0,6:0},lift={5:0,6:0};let advance=0,roll=0;
   for(const[start,end,i,from,to,p,q]of rows){const u=smooth(t,start,end);if(t>=start){feet[i]=T.MathUtils.lerp(from,to,u);advance=T.MathUtils.lerp(p,q,u);}if(t>start&&t<end){lift[i]=.065*Math.sin(Math.PI*u);roll=(i===5?1:-1)*.025*Math.sin(Math.PI*u);}}
   m.root.position.x=advance;m.content.rotation.x=roll;m.root.updateMatrixWorld(true);
   for(const[side,i]of[[-1,5],[1,6]]){b[i].position.copy(m.gltf.scene.worldToLocal(new T.Vector3(feet[i],.29+lift[i],side*.245)));b[i].quaternion.copy(m.content.quaternion).invert();}
  }
  if(action==='rest'){b[1].rotation.z=.06;b[2].rotation.z=.10;}
  r.current={stage:action==='walk'?'Four alternating short steps':action==='rest'?'Quiet standing posture':'Standing adult',duration:action==='walk'?8:0,complete:t>=8};
 }
 m.root.updateMatrixWorld(true);for(const p of r.parts)if(p.isSkinnedMesh)p.skeleton.update();updateSpecimenLandmarks(m);return true;
}
