import * as THREE from 'three';
import {plantAction} from './plant-development-policy.js';
import {buildClownfishRig,animateClownfish} from './fish-rig.js';
import {hasMammalPosture,applyMammalPosture} from './mammal-postures.js';
import {correctAssetSurface} from './asset-surfaces.js';
import {repairExistingHierarchy,configureExistingRig,animateExistingRig} from './existing-rig-motion.js';
import {createSurfaceRig,animateSurfaceRig} from './surface-rigs.js';
import {capturePawFrames} from './paw-frames.js';
import {prepareWolfFace,setWolfExpression,closeWolfJaw} from './wolf-face.js';
import {prepareTigerEyelids,setTigerEyelids} from './tiger-eyelids.js';
import {prepareTigerClaws,setTigerClaws} from './tiger-claws.js';
import {prepareFoxStanding,configureFoxRig,animateFox} from './fox-motion.js';
import {configureSurfaceLandmarks} from './surface-landmarks.js';
import {curateOakSource,configureBotanicalAsset,animateBotanicalAsset} from './botanical-assets.js';
import {animateMammalJump} from './mammal-jump.js';
import {prepareWolfEyelids,setWolfEyelids} from './wolf-eyelids.js';
import {addArtistCoat} from './artist-coat.js';
import {addOwlFeathers} from './owl-feathers.js';
import {refineMarineSurface,configureDolphinMotion,dolphinPlaybackTime} from './marine-surface.js';
import {addBirdContours} from './bird-contours.js';
import {configureTigerWalk,animateTigerWalk} from './tiger-gait.js';
import {configureLargeMarine,animateLargeMarine} from './large-marine-motion.js';

// Approximate key poses authored for education. No measured gait, contact forces or timing.
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export function prepareAsset(gltf,s,asset){
 if(s.id==='quercus-robur')curateOakSource(gltf.scene);
 correctAssetSurface(gltf.scene,s.id);
 repairExistingHierarchy(gltf.scene,s.id);
 const fishRig=s.id==='amphiprion-ocellaris'?buildClownfishRig(gltf.scene):null;
 const root=new THREE.Group(),content=new THREE.Group();root.add(content);content.add(gltf.scene);
 const mixer=new THREE.AnimationMixer(gltf.scene),bones=[];
 gltf.scene.traverse(o=>{if(o.isBone)bones.push(o);if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];for(const mat of mats){mat.envMapIntensity=.45;if(mat.isMeshStandardMaterial){mat.roughness=Math.max(mat.roughness,.55);mat.metalness=0;}if(s.id==='pan-troglodytes'){mat.color.set(/Eyes/i.test(mat.name)?'#1a1d17':/Skin/i.test(mat.name)?'#c7ab90':'#aaa69c');mat.roughness=/Eyes/i.test(mat.name)?.22:/Skin/i.test(mat.name)?.72:.9;}}}});
 const find=(pattern)=>bones.find(b=>pattern.test(b.name));
 const wolf=s.id==='canis-lupus',tiger=s.id==='panthera-tigris',fox=s.id==='vulpes-vulpes';
 const bind=new Map();gltf.scene.traverse(o=>bind.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()}));
 prepareFoxStanding(gltf,mixer,asset);
 const baseClip=(wolf||fox)?gltf.animations.find(a=>/IDLE/i.test(a.name)):null;
 if(baseClip){const a=mixer.clipAction(baseClip);a.play();mixer.setTime(0);const pose=[];gltf.scene.traverse(o=>pose.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]));a.stop();for(const [o,p,q,s] of pose){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}}
 gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 if(s.id==='giraffa-camelopardalis'){const ground=gltf.scene.getObjectByName('Circle_0');ground?.removeFromParent();}
 if(s.id==='aurelia-aurita'){const decoration=[];gltf.scene.traverse(o=>{if(o.isMesh&&o.name==='Object_4')decoration.push(o);});decoration.forEach(o=>o.removeFromParent());}
 const box=new THREE.Box3().setFromObject(gltf.scene,true),size=box.getSize(V());
 // Source model axes vary. Fit the untouched source surface into the same research desk.
 const longX=size.x>=size.z;
 if(['quadruped','cetacean','fish','reptile','salamander','worm'].includes(s.visual.kind)&&!longX)content.rotation.y=Math.PI/2;
 const fit=3.75/Math.max(size.x,size.y,size.z);content.scale.setScalar(fit);
 root.updateMatrixWorld(true);const fitted=new THREE.Box3().setFromObject(root,true),center=fitted.getCenter(V());content.position.set(-center.x,.13-fitted.min.y,-center.z);
 root.updateMatrixWorld(true);
 const rest=new Map();gltf.scene.traverse(o=>rest.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()}));
 const normalized=new THREE.Box3().setFromObject(root,true),extent=normalized.getSize(V());
 const m={root,content,gltf,mixer,asset,fishRig,parts:{},features:[V(extent.x*.36,normalized.max.y*.8,extent.z*.18),V(extent.x*.18,.35,extent.z*.35),V(-extent.x*.15,normalized.max.y*.65,extent.z*.4)],kind:s.visual.kind,id:s.id,natural:true,textured:true,rest,bind,bones,limbs:[],extent,current:'observe',action:null,sourceClip:null};
 if(tiger){for(const side of ['L','R']){m.limbs.push(makeLimb([find(new RegExp('Bip01_'+side+'_UpperArm')),find(new RegExp('Bip01_'+side+'_Forearm')),find(new RegExp('Bip01_'+side+'_Hand'))],find(new RegExp('Bip01_'+side+'_Finger0_')),true));m.limbs.push(makeLimb([find(new RegExp('Bip01_'+side+'_Thigh')),find(new RegExp('Bip01_'+side+'_Calf')),find(new RegExp('Bip01_'+side+'_HorseLink')),find(new RegExp('Bip01_'+side+'_Foot'))],find(new RegExp('Bip01_'+side+'_Toe0_')),false));}m.head=find(/Bip01_Head_/);m.neck=find(/Bip01_Neck_/);m.body=find(/_rootJoint/);m.tail=find(/Bip01_Tail_/);}
 if(wolf){for(const side of ['L','R']){m.limbs.push(makeLimb([find(new RegExp('shoulder'+side+'_')),find(new RegExp('front_thigh'+side+'_')),find(new RegExp('front_shin'+side+'_'))],find(new RegExp('front_foot'+side+'_')),true));m.limbs.push(makeLimb([find(new RegExp('^thigh'+side+'_')),find(new RegExp('^shin'+side+'_')),find(new RegExp('^foot'+side+'_'))],find(new RegExp('^toe'+side+'_')),false));}m.head=find(/spine011_/);m.neck=find(/spine009_/);m.body=find(/spine004_/);m.tail=find(/spine003_/);}
 if(fox){for(const side of ['L','R'])for(const front of [true,false]){const n=front?1:0;m.limbs.push(makeLimb([find(new RegExp('^thigh'+side+n+'$')),find(new RegExp('^shin'+side+n+'$'))],find(new RegExp('^foot'+side+n+'$')),front));}m.head=find(/^head$/);m.neck=find(/^neck$/);m.body=find(/^hips$/);m.tail=find(/^tail0$/);}
 configureExistingRig(m);configureFoxRig(m);m.limbs=m.limbs.filter(l=>l&&l.chain.every(Boolean));
 prepareWolfFace(m);prepareWolfEyelids(m);prepareTigerEyelids(m);prepareTigerClaws(m);capturePawFrames(m);configureTigerWalk(m);
 function makeLimb(chain,end,front){return end?{chain,end,front,home:root.worldToLocal(end.getWorldPosition(V()))}:null;}
 m.clipMap={};
 for(const b of ['walk','run','forage','rest','sleep','swim','fly','pulse','jump','observe']){
  const patterns={walk:/\bwalk\b/i,run:/\brun\b/i,forage:/eating|forag|feeding/i,rest:/sleep|rest/i,sleep:/sleep/i,swim:/swim/i,fly:/fly|flight/i,pulse:/jelly|pulse/i,jump:/jump|hop/i,observe:/idle|look around/i};
  const clip=gltf.animations.find(a=>patterns[b].test(a.name));if(clip)m.clipMap[b]=clip;
 }
 if(wolf)m.clipMap.observe=baseClip;
 if(fox)m.clipMap.walk=gltf.animations.find(a=>/(?:^|\|)walk$/i.test(a.name))||m.clipMap.walk;
 if(tiger)m.clipMap.run=gltf.animations[0];
 if(s.id==='aurelia-aurita')m.clipMap.pulse=gltf.animations[0];if(s.id==='loxodonta-africana')m.clipMap.observe=gltf.animations[0];
 refineMarineSurface(m);configureDolphinMotion(m);
 m.surfaceRig=createSurfaceRig(m);
 addArtistCoat(m);
 addOwlFeathers(m);
 addBirdContours(m);
 configureSurfaceLandmarks(m);configureBotanicalAsset(m);
 configureLargeMarine(m);
 if(tiger){const envelope=new THREE.Box3().setFromObject(root,true);envelope.min.add(V(-.25,-.05,-.15));envelope.max.add(V(.25,.90,.15));m.motionBounds={jump:envelope};}
 return m;
}
function resetPose(m,useBind=false){for(const [o,b] of (useBind?m.bind:m.rest)){o.position.copy(b.position);o.quaternion.copy(b.quaternion);o.scale.copy(b.scale);}m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);m.root.scale.setScalar(1);}
export function selectAssetMotion(m,motion){
 m.mixer.stopAllAction();m.current=motion;m.sourceClip=hasMammalPosture(m,motion)?null:m.clipMap[motion]||null;resetPose(m,!!m.sourceClip);m.action=m.sourceClip?m.mixer.clipAction(m.sourceClip):null;
 if(m.action){m.action.reset().play();m.mixer.setTime(0);}
 m.root.updateMatrixWorld(true);
 if(m.botanicalAssetRig)return 'Retained artist plant · authored organ emergence · illustrative timing';
 if(m.largeMarine)return motion==='observe'?'Credited artist surface · source pose · unmeasured':m.largeMarine.creator?'Creator swimming clip · unmeasured motion study':'Retained artist surface · authored posterior swimming study · uncalibrated';
 if(m.dolphinSwim)return motion==='forage'?'Creator swim cycle · slowed approach illustration · no prey capture':motion==='rest'?'Creator swim cycle · quiet swimming illustration · sleep not simulated':motion==='swim'?'Creator swim cycle · unvalidated':'Artist source pose · pigment study';
 if(m.foxRig)return motion==='rest'?'Creator-authored repose · unvalidated':motion==='observe'?'Creator standing pose · unvalidated':'Authored articulation on creator rig · illustrative timing';
 if(hasMammalPosture(m,motion))return 'Curated articulated posture · source-guided, unvalidated';
 if(m.existingRig&&!m.sourceClip)return motion==='observe'?'Artist surface · neutral source pose':'Species-specific articulated study · illustrative timing';
 if(m.surfaceRig)return 'Authored species-specific articulation · illustrative timing';
 if(m.fishRig)return motion==='observe'?'Artist surface · authored rig at neutral pose':'Authored pectoral + caudal fin study · illustrative timing';
 return m.sourceClip?(m.wolfFace&&motion!=='forage'?'Creator clip + authored facial posture · unvalidated':'Creator clip · '+m.sourceClip.name):m.limbs.length?'Authored skeletal study · illustrative timing':m.bones.length?'Authored rig study · illustrative timing':motion==='observe'?'Artist surface · inspect geometry':['grow','unfurl','spread','swim','fly','glide'].includes(motion)?'Illustrative surface process · no complete rig':'Surface retained · behavior rig pending';
}
// CCD retains the original skinned mesh and adjusts the real joint chain to a paw target.
function solveLimb(m,l,target){
 m.root.updateMatrixWorld(true);const world=m.root.localToWorld(target.clone());
 for(let k=0;k<7;k++)for(let i=l.chain.length-1;i>=0;i--){
  const joint=l.chain[i],p=joint.getWorldPosition(V()),a=l.end.getWorldPosition(V()).sub(p),b=world.clone().sub(p);if(a.lengthSq()<1e-10||b.lengthSq()<1e-10)continue;
  const q=new THREE.Quaternion().setFromUnitVectors(a.normalize(),b.normalize()),angle=2*Math.acos(THREE.MathUtils.clamp(q.w,-1,1));if(angle>.22)q.slerp(new THREE.Quaternion(),1-.22/angle);
  const parent=joint.parent.getWorldQuaternion(new THREE.Quaternion());joint.quaternion.premultiply(parent.clone().invert().multiply(q).multiply(parent));joint.updateWorldMatrix(false,true);
 }
}
function rotateInDesk(m,bone,axis,angle){if(!bone)return;m.root.updateMatrixWorld(true);const a=axis.clone().applyQuaternion(m.root.getWorldQuaternion(new THREE.Quaternion())).applyQuaternion(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert());bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(a,angle));}
export function animateAsset(m,motion,t){
 motion=plantAction(m.id,motion);
 if(m.current!==motion)selectAssetMotion(m,motion);
 if(m.botanicalAssetRig){resetPose(m);animateBotanicalAsset(m,motion,t);return;}
 if(animateLargeMarine(m,motion,t))return;
 if(m.largeMarine?.creator&&motion!=='swim'){resetPose(m);m.root.position.y=.60;m.root.updateMatrixWorld(true);return;}
 setWolfExpression(m,motion);
 setWolfEyelids(m,motion);
 setTigerEyelids(m,motion);
 setTigerClaws(m,motion);
 if(hasMammalPosture(m,motion)){resetPose(m);applyMammalPosture(m,motion);return;}
 if(m.action){m.root.position.y=m.largeMarine?.creator?.60:m.dolphinSwim?.62:0;m.mixer.setTime(m.dolphinSwim?dolphinPlaybackTime(motion,t):t);closeWolfJaw(m,motion);m.root.updateMatrixWorld(true);m.gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});if(m.id==='canis-lupus'||m.id==='panthera-tigris'){const ground=.13-new THREE.Box3().setFromObject(m.root,true).min.y;m.root.position.y=m.id==='canis-lupus'?ground:Math.max(0,ground);}m.root.updateMatrixWorld(true);return;}
 resetPose(m);
 if(m.id==='panthera-tigris'&&motion==='jump'){animateMammalJump(m,t,solveLimb);return;}
 if(animateTigerWalk(m,motion,t))return;
 if(animateFox(m,motion,t))return;
 if(m.fishRig){animateClownfish(m.fishRig,motion,t);return;}
 if(animateSurfaceRig(m,motion,t))return;
 if(animateExistingRig(m,motion,t,{solveLimb}))return;
 const run=['run','escape'].includes(motion),walk=['walk','run','escape','crawl'].includes(motion);
 if(m.limbs.length){
  if(walk){const frequency=run?1.75:.72;rotateInDesk(m,m.body,V(0,0,1),run?Math.sin(t*frequency*Math.PI*2)*.025:0);
   m.limbs.forEach((l,i)=>{const offset=run?(l.front?0:.48)+(i>1?.1:0):[0,.5,.75,.25][i],u=(t*frequency+offset)%1,stance=.64,stride=run?.68:.38,target=l.home.clone();target.x+=u<stance?stride*(.5-u/stance):stride*(-.5+(u-stance)/(1-stance));target.y+=u<stance?0:Math.sin((u-stance)/(1-stance)*Math.PI)*(run?.26:.13);solveLimb(m,l,target);});
  }
  if(motion==='forage'){rotateInDesk(m,m.neck,V(0,0,1),-.6+Math.sin(t*1.4)*.045);rotateInDesk(m,m.head,V(0,0,1),-.28);m.limbs.forEach(l=>solveLimb(m,l,l.home));}
  if(['rest','sleep'].includes(motion)){const body=m.body;if(body){body.updateWorldMatrix(true,false);const origin=body.getWorldPosition(V()),target=origin.clone().add(V(0,-m.extent.y*.5,0));body.position.copy(body.parent.worldToLocal(target));}rotateInDesk(m,m.neck,V(0,0,1),-.3);rotateInDesk(m,m.tail,V(0,0,1),-.65);m.limbs.forEach(l=>{const p=l.home.clone();p.x+=l.front?.32:.18;p.y=.2;solveLimb(m,l,p);});}
  if(motion==='jump'){m.root.position.y=Math.max(0,Math.sin(t*3))*.55;m.limbs.forEach(l=>{const p=l.home.clone();p.y+=.13;solveLimb(m,l,p);});}
  if(motion==='swim'){m.limbs.forEach((l,i)=>{const p=l.home.clone();p.x+=Math.sin(t*4+i*Math.PI/2)*.18;p.y+=.16;solveLimb(m,l,p);});}
  if(motion!=='observe')rotateInDesk(m,m.tail,V(0,1,0),Math.sin(t*1.5)*.09);
 }else if(m.bones.length){
  // Other creator rigs retain their surface. Small joint motions are labeled as rig studies.
  const locomotion=['walk','swim','fly','crawl','forage','escape'].includes(motion);
  if(locomotion)m.bones.filter(b=>/tail|fin|wing|flipper|tentacle|leg|thigh|calf/i.test(b.name)&&!/end|nub|ik|target/i.test(b.name)).forEach((b,i)=>rotateInDesk(m,b,V(0,0,1),Math.sin(t*3+i)*.12));
  if(['rest','sleep'].includes(motion)){const head=m.bones.find(b=>/head|neck/i.test(b.name));rotateInDesk(m,head,V(0,0,1),-.14);}
 }else{
  // Non-rigged assets expose surface processes rather than fabricated creator animations.
  if(['grow','unfurl','spread'].includes(motion))m.root.scale.setScalar(.6+.4*((t%8)/8));
  if(['swim','fly','glide'].includes(motion)){m.root.rotation.z=Math.sin(t*1.2)*.04;m.root.position.y=Math.sin(t*1.5)*.05;}
 }
 closeWolfJaw(m,motion);m.root.updateMatrixWorld(true);
 if(m.id==='canis-lupus'||m.id==='panthera-tigris'){m.gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});m.root.position.y=Math.max(0,.13-new THREE.Box3().setFromObject(m.root,true).min.y);m.root.updateMatrixWorld(true);}
}
