import * as T from 'three';
import {prepareBird,animateBird} from './bird-reconstruction.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
// Ground-free exterior studies. Joint angles and playback time are authored.
export function prepareRebuiltBird(gltf,s,asset){
 if(s.id==='haliaeetus-leucocephalus'){
  const m=prepareBird(gltf,s,asset),r=m.birdRevision;r.rebuilt=true;r.ground.removeFromParent();r.standingParts=r.parts.filter(p=>p.name.replaceAll('_',' ').startsWith('Rebuilt standing'));r.flightParts=r.parts.filter(p=>!p.name.replaceAll('_',' ').startsWith('Rebuilt standing'));r.flightBindings=m.featureBindings.slice();r.standBindings=[[.30,1.08,.04],[.15,.04,.10],[-.10,.65,.23]].map(point=>{const target=new T.Vector3(...point);let best;for(const mesh of r.standingParts){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const distance=new T.Vector3().fromBufferAttribute(p,i).distanceToSquared(target);if(!best||distance<best.distance)best={mesh,indices:[i],distance,kind:'Authored standing exterior region; unmeasured'};}}return best;});for(const p of r.standingParts){p.material.userData={compatibilitySurfaceDetail:false,compatibilityLinearTexture:true};if(p.material.normalMap)p.material.normalScale.setScalar(.15);}r.version='0.6.69';animateRebuiltBird(m,'observe',0);return m;
 }
 const root=new T.Group(),content=new T.Group();root.add(content);content.add(gltf.scene);const parts=[],bind=new Map();gltf.scene.traverse(o=>{bind.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()});if(o.isMesh){parts.push(o);o.material.metalness=0;o.material.envMapIntensity=.25;if(o.material.normalMap)o.material.normalScale.setScalar(.18);o.material.userData={compatibilitySurfaceDetail:true,compatibilityLinearTexture:true};}});
 const body=parts.find(p=>p.name.replaceAll('_',' ').startsWith('Rebuilt continuous')),r={version:'0.6.69',rebuilt:true,eagle:false,body,bones:body.skeleton.bones,bind,parts,current:{stage:'Standing adult'}};
 const m={root,content,gltf,asset,id:s.id,kind:'penguin',forward:-1,natural:true,textured:true,surfaceDetailed:true,parts:{},bones:r.bones,limbs:[],features:[],featureBindings:[],current:'observe',action:null,sourceClip:null,mixer:new T.AnimationMixer(gltf.scene),birdRevision:r};
 const targets=[new T.Vector3(0,2.3,.48),new T.Vector3(-.5,1.8,0),new T.Vector3(-.20,.18,.22)];m.features=targets.map(t=>t.clone());m.featureBindings=targets.map((t,feature)=>{let best;for(const mesh of parts){if(feature===0&&!/flipper/.test(mesh.name))continue;const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const distance=new T.Vector3().fromBufferAttribute(p,i).distanceToSquared(t);if(!best||distance<best.distance)best={mesh,indices:[i],distance,kind:'Authored exterior region; unmeasured'};}}return best;});
 Object.assign(root.userData,{aquaticStudy:true,focusAnatomy:true,anatomyFocusScale:[.3,.35,.25],anatomyViewDirections:[[0,.2,1],[-1,.15,.6],[-.5,.05,1]],birdScope:'Authored continuous adult exterior and bounded movement studies; not measured morphology or physiology.'});
 m.motionBounds={};for(const[action,b]of Object.entries(asset.motionBounds||{}))m.motionBounds[action]=new T.Box3(new T.Vector3(...b.min),new T.Vector3(...b.max));animateRebuiltBird(m,'observe',0);m.extent=new T.Box3().setFromObject(root,true).getSize(new T.Vector3());return m;
}
export function animateRebuiltBird(m,action,time){
 const r=m.birdRevision,t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,8),smooth=T.MathUtils.smoothstep;
 if(r.eagle){
  animateBird(m,action==='stand'?'observe':action,t);r.ground.visible=false;m.featureBindings=action==='stand'?r.standBindings:r.flightBindings;
  for(const p of r.flightParts){p.visible=action!=='stand';p.scale.copy(r.bind.get(p).scale).multiplyScalar(action==='stand'?0:1);}
  for(const p of r.standingParts){p.visible=action==='stand';p.scale.setScalar(action==='stand'?1:0);}
  if(action==='stand'){m.root.position.set(0,0,0);m.content.rotation.set(0,0,0);for(const b of r.bones){const bind=r.bind.get(b);b.position.copy(bind.position);b.quaternion.copy(bind.quaternion);b.scale.copy(bind.scale);}r.current={stage:'Standing adult, layered folded wings and supported feet',duration:0,complete:true};}
 }else{
  for(const[o,b]of r.bind){o.position.copy(b.position);o.quaternion.copy(b.quaternion);o.scale.copy(b.scale);}m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);m.content.position.set(0,0,0);m.content.rotation.set(0,0,0);
  const b=r.bones,swim=action==='swim'||action==='glide';
  if(swim){
   m.content.rotation.z=Math.PI/2;m.content.position.set(1.85,1.65,0);b[5].rotation.z=-Math.PI/2;
   const envelope=action==='swim'?smooth(t,0,.7)*(1-smooth(t,5.8,7.2)):0,phase=t*Math.PI*2*1.25;
   for(const[side,i]of[[-1,1],[1,2]]){const frame=new T.Matrix4().makeBasis(new T.Vector3(0,-1,0),new T.Vector3(0,0,-side),new T.Vector3(side,0,0)),q=new T.Quaternion().setFromRotationMatrix(frame),stroke=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),side*.48*Math.sin(phase)*envelope),pitch=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),.12*Math.cos(phase)*envelope);b[i].quaternion.copy(stroke).multiply(pitch).multiply(q);}
   for(const i of[3,4]){b[i].rotation.z=Math.PI/2;b[i].position.x=.02;b[i].position.y=.32;}
   r.current={stage:action==='glide'||t>=7.2?'Streamlined underwater glide':Math.cos(phase)>=0?'Paired dorsal upstroke':'Paired ventral downstroke',duration:action==='swim'?8:0,complete:t>=8};
  }else{
   if(action==='walk'){
    // Four finite short steps. Stance feet stay fixed in world space while
    // the body advances; each recovery follows a small lifted arc.
    const steps=[[.8,1.6,3,.05,-.16,0,-.08],[1.8,2.6,4,.05,-.37,-.08,-.26],[3,3.8,3,-.16,-.58,-.26,-.47],[4.2,5,4,-.37,-.58,-.47,-.63]],feet={3:.05,4:.05},lift={3:0,4:0};let advance=0,roll=0;
    for(const[start,end,bone,from,to,bodyFrom,bodyTo]of steps){const u=smooth(t,start,end);if(t>=start){feet[bone]=T.MathUtils.lerp(from,to,u);advance=T.MathUtils.lerp(bodyFrom,bodyTo,u);}if(t>start&&t<end){lift[bone]=.075*Math.sin(u*Math.PI);roll=(bone===3?1:-1)*.018*Math.sin(u*Math.PI);}}
    m.root.position.x=advance;m.content.rotation.x=roll;m.root.updateMatrixWorld(true);
    for(const[side,i]of[[-1,3],[1,4]]){b[i].position.copy(m.gltf.scene.worldToLocal(new T.Vector3(feet[i],.35+lift[i],side*.22)));b[i].quaternion.copy(m.content.quaternion).invert();}
   }
   r.current={stage:action==='walk'?'Short alternating steps; illustrative timing':'Standing adult',duration:action==='walk'?8:0,complete:t>=8};
  }
 }
 m.root.updateMatrixWorld(true);for(const p of r.parts)if(p.isSkinnedMesh)p.skeleton.update();updateSpecimenLandmarks(m);return true;
}
