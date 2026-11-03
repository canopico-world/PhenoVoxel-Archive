import * as T from 'three';
import {prepareBird,animateBird} from './bird-reconstruction.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';

// Exterior studies only. These angles are authored, not fitted kinematics.
export function prepareBirdPostures(gltf,s,asset){
 const m=prepareBird(gltf,s,asset),r=m.birdRevision;r.correctedPostures=true;r.version='0.6.68';
 r.ground.removeFromParent();r.ground.visible=false;
 r.surfaceDefaults=new Map(r.parts.map(p=>[p.material,{roughness:p.material.roughness,normalScale:p.material.normalScale.clone(),detail:p.material.userData.compatibilitySurfaceDetail}]));
 if(r.eagle){const a=r.body.geometry.attributes;r.standingSoles=[];r.flightIndex=r.body.geometry.index;r.standingParts=r.parts.filter(p=>/^Standing_/.test(p.name));const index=[];for(let i=0;i<r.flightIndex.count;i+=3){const tri=[r.flightIndex.getX(i),r.flightIndex.getX(i+1),r.flightIndex.getX(i+2)],flightFoot=tri.some(j=>a.position.getY(j)<.39&&Math.abs(a.position.getZ(j))<.27&&a.position.getX(j)>-.4&&a.position.getX(j)<.2);if(!flightFoot)index.push(...tri);}r.standingIndex=new T.BufferAttribute(new Uint32Array(index),1);r.body.geometry.setIndex(new T.BufferAttribute(new Uint32Array([...r.flightIndex.array,...index]),1));r.flightBindings=m.featureBindings.slice();}
 m.root.userData.birdScope='Ground-free exterior studies; restored penguin feet, paired underwater strokes and eagle standing posture. No force or physiological simulation.';
 animateBirdPostures(m,'observe',0);return m;
}
const smooth=T.MathUtils.smoothstep;
export function animateBirdPostures(m,action,time){
 const r=m.birdRevision,t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,8),b=r.bones;
 if(r.eagle){r.body.geometry.setDrawRange(action==='stand'?r.flightIndex.count:0,action==='stand'?r.standingIndex.count:r.flightIndex.count);m.featureBindings=r.flightBindings.slice();if(action==='stand')m.featureBindings[1]={mesh:r.standingParts[0],indices:[0],kind:'Authored standing tarsus and toes; unmeasured'};}
 if(r.body.morphTargetInfluences)r.body.morphTargetInfluences.fill(0);
 animateBird(m,action,time);r.ground.visible=false;if(r.eagle)for(const p of r.standingParts){p.visible=action==='stand';p.scale.setScalar(action==='stand'?1:0);}
 for(const[mat,base]of r.surfaceDefaults){mat.roughness=base.roughness;mat.normalScale.copy(base.normalScale);mat.userData.compatibilitySurfaceDetail=base.detail;if(!r.eagle||action==='stand'){mat.normalScale.setScalar(0);mat.roughness=.94;mat.userData.compatibilitySurfaceDetail=false;}}
 if(r.eagle&&action==='stand'){
  m.root.position.set(0,0,0);m.content.rotation.z=.68;r.body.morphTargetInfluences[0]=1;
  for(const[side,arm,hand,leg]of[[-1,1,2,5],[1,3,4,7]]){
   b[arm].rotation.set(0,0,0);b[hand].rotation.set(0,0,0);
   b[leg].rotation.set(0,0,-.68);b[leg+1].rotation.set(0,0,.12);
  }
  // A quiet, finite head turn; feet and folded wings stay supported.
  b[9].rotation.z=-.68;b[9].rotation.x=.12*Math.sin(t/8*Math.PI*2)*smooth(t,0,.7)*(1-smooth(t,7.2,8));
  if(r.standingSupportOffset===undefined){m.root.updateMatrixWorld(true);const feet=[];for(const p of r.standingParts){p.skeleton?.update();for(let i=0;i<p.geometry.attributes.position.count;i++)feet.push(p.getVertexPosition(i,new T.Vector3()).applyMatrix4(p.matrixWorld).y);}r.standingSupportOffset=.13-Math.min(...feet);}
  m.root.position.y=r.standingSupportOffset;r.current={stage:'Standing, folded wings and supported feet',duration:8,complete:t>=8};
 }else if(!r.eagle&&(action==='swim'||action==='glide')){
  // Upright +Y becomes forward -X; the ventral -X surface faces down.
  m.gltf.scene.position.set(0,-2,0);m.content.position.set(0,2.1,0);m.content.rotation.set(0,0,Math.PI/2);
  b[5].rotation.set(0,0,-Math.PI/2);
  const envelope=action==='glide'?0:smooth(t,0,.65)*(1-smooth(t,5.8,7.2)),phase=t*Math.PI*2*1.25;
  for(const[side,i]of[[-1,1],[1,2]]){
   // Rest chord +X maps tailward -Y, hanging span -Y maps laterally
   // outward, and foil thickness maps dorsoventrally. A simple shoulder
   // spread alone would wrongly leave the foil chord vertical in the water.
   const frame=new T.Matrix4().makeBasis(new T.Vector3(0,-1,0),new T.Vector3(0,0,-side),new T.Vector3(side,0,0)),glide=new T.Quaternion().setFromRotationMatrix(frame),stroke=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),side*.60*Math.sin(phase)*envelope),pitch=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.14*Math.cos(phase)*envelope);
   b[i].quaternion.copy(stroke).multiply(pitch).multiply(glide);b[i].position.z=side*.32;
  }
  for(const i of[3,4]){b[i].rotation.set(0,0,Math.PI/2);b[i].scale.y=.35;b[i].position.x=-.04;}
  r.current={stage:action==='glide'||t>=7.2?'Streamlined underwater glide':Math.cos(phase)>=0?'Paired dorsal upstroke':'Paired ventral downstroke',duration:action==='swim'?8:0,complete:t>=8};
 }
 m.root.updateMatrixWorld(true);for(const p of r.parts)if(p.isSkinnedMesh)p.skeleton.update();updateSpecimenLandmarks(m);return true;
}
