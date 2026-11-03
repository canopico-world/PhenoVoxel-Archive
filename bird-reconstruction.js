import * as T from 'three';
import {animatePenguinFeet,eagleWingPose} from './bird-motion.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';

// Source-derived adult exteriors with authored, bounded posture studies.
// No fitted wingbeat/stride rate, aerodynamic or hydrodynamic force solver.
export const revisedBirdIds=new Set(['haliaeetus-leucocephalus','aptenodytes-forsteri']);
export function prepareBird(gltf,s,asset){
 const eagle=s.id==='haliaeetus-leucocephalus',root=new T.Group(),pivot=new T.Group();root.add(pivot);pivot.add(gltf.scene);
 const bind=new Map(),parts=[],bones=[];gltf.scene.traverse(o=>{bind.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()});if(o.isBone)bones.push(o);if(o.isMesh){parts.push(o);o.castShadow=o.receiveShadow=true;const mat=o.material;mat.metalness=0;mat.envMapIntensity=.3;if(mat.normalMap)mat.normalScale.setScalar(.40);for(const key of ['map','normalMap','roughnessMap'])if(mat[key]){mat[key].anisotropy=8;mat[key].userData={...mat[key].userData,compatibilityResolution:key==='map'?4096:2048};}mat.userData={compatibilitySurfaceDetail:true,compatibilityLinearTexture:true,compatibilityMarineOptics:true};}});
 const body=parts.find(p=>/Revised.bird.body/.test(p.name));if(!body?.isSkinnedMesh)throw Error('Revised bird skeleton is missing');
 const r={version:'0.6.67',eagle,bind,parts,body,bones:body.skeleton.bones,home:body.skeleton.bones.map(b=>b.position.clone()),current:{stage:'Adult exterior',duration:0}};
 if(!eagle){const a=body.geometry.attributes,p=a.position,used=new Set(body.geometry.index.array);r.penguinFeet=[3,4].map(bone=>{const samples=[...used].filter(i=>p.getY(i)<.6&&[0,1,2,3].reduce((n,k)=>n+(a.skinIndex.getComponent(i,k)===bone?a.skinWeight.getComponent(i,k):0),0)>.45);return{bone,samples,sole:Math.min(...samples.map(i=>p.getY(i))),frame:r.bones[bone].quaternion.clone()};});r.supportSole=Math.min(...r.penguinFeet.map(f=>f.sole));r.penguinFeet.forEach(f=>f.sole=r.supportSole);}
 const ground=new T.Mesh(new T.CircleGeometry(1.05,80),new T.MeshStandardMaterial({color:'#ccd5d5',roughness:.96,side:T.DoubleSide}));ground.name='Illustrative snow support';ground.rotation.x=-Math.PI/2;ground.position.y=.12;ground.receiveShadow=true;root.add(ground);ground.visible=!eagle;r.ground=ground;
 const targets=eagle?[[.82,.79,.06],[.5,.2,.13],[.05,.66,1.13]]:[[-.02,2.13,.61],[-.41,1.88,.12],[-.30,.32,.26]];
 const m={root,content:pivot,gltf,asset,id:s.id,kind:eagle?'bird':'penguin',forward:eagle?1:-1,natural:true,textured:true,surfaceDetailed:true,parts:{},bones,limbs:[],features:targets.map(p=>new T.Vector3(...p)),current:'observe',action:null,sourceClip:null,mixer:new T.AnimationMixer(gltf.scene),birdRevision:r};
 m.featureBindings=m.features.map(target=>{let best;for(const mesh of parts){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const distance=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld).distanceToSquared(target);if(!best||distance<best.distance)best={mesh,indices:[i],distance,kind:'Source-derived exterior region; unmeasured landmark'};}}return best;});
 Object.assign(root.userData,{aquaticStudy:true,focusAnatomy:true,anatomyFocusScale:eagle?[.19,.23,.38]:[.35,.36,.24],anatomyViewDirections:eagle?[[.4,.15,1],[.4,.05,1],[.15,.8,1]]:[[0,.2,1],[-1,.15,.6],[-.5,.05,1]],birdScope:'Source-derived adult exterior, revised plumage and bounded illustrative movement; no biological timing or force validation.'});
 m.motionBounds={};for(const action of eagle?['observe','fly','glide','bank']:['observe','walk','swim','glide','rest']){const box=new T.Box3();for(let t=0;t<=8;t+=.4){animateBird(m,action,t);box.union(new T.Box3().setFromObject(root,true));}m.motionBounds[action]=box.expandByScalar(.02);}animateBird(m,'observe',0);m.extent=new T.Box3().setFromObject(root,true).getSize(new T.Vector3());return m;
}
const smooth=(x,a,b)=>T.MathUtils.smoothstep(x,a,b);
export function animateBird(m,action,time){
 const r=m.birdRevision;if(!r)return false;for(const[o,b]of r.bind){o.position.copy(b.position);o.quaternion.copy(b.quaternion);o.scale.copy(b.scale);}m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);m.content.position.set(0,0,0);m.content.rotation.set(0,0,0);const t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,8),b=r.bones;
 if(r.eagle){
  const flight=['observe','fly','glide','bank'].includes(action),envelope=smooth(t,0,.8)*(1-smooth(t,6.8,8)),pose=eagleWingPose(action==='fly'?'fly':'glide',t);m.root.position.y=1.0;
  for(const[side,a,h,leg]of[[-1,1,2,5],[1,3,4,7]]){b[a].rotation.x=-side*(action==='fly'?pose.arm*envelope:.015);b[h].rotation.x=-side*pose.hand*envelope;b[h].rotation.z=side*pose.twist*envelope;if(flight){b[leg].rotation.z=-1.38;b[leg+1].rotation.z=.58;}}
  if(action==='bank'){m.content.rotation.x=.26*Math.sin(t/8*Math.PI*2)*envelope;b[10].rotation.y=.07*Math.sin(t/8*Math.PI*2)*envelope;}
  r.ground.visible=false;r.current={stage:action==='fly'?(t<.8?'Stroke onset':t<6.8?'Coupled wing and hand strokes':'Return to extended wings'):action==='bank'?'Shallow bank and return':'Extended wings, tucked legs',duration:action==='fly'||action==='bank'?8:0,complete:t>=8};
 }else{
  const swim=action==='swim'||action==='glide';r.ground.visible=!swim;m.gltf.scene.position.y=.13-r.supportSole;
  if(!swim&&action!=='walk')for(const foot of r.penguinFeet)for(let pass=0;pass<5;pass++){m.root.updateMatrixWorld(true);r.body.skeleton.update();const low=Math.min(...foot.samples.map(i=>r.body.getVertexPosition(i,new T.Vector3()).y));b[foot.bone].position.y+=foot.sole-low;}
  if(action==='walk'){const walkTime=Math.min(t,6),envelope=1-smooth(t,6,8);animatePenguinFeet(m,{...r,mesh:r.body},walkTime);for(const foot of r.penguinFeet){const bone=b[foot.bone];bone.position.lerp(r.home[foot.bone],1-envelope);}b[0].position.z*=envelope;}
  if(swim){m.gltf.scene.position.y=-2;m.content.position.y=2.1;m.content.rotation.z=Math.PI/2;b[5].rotation.z=-.85;const envelope=action==='glide'?0:smooth(t,0,.7)*(1-smooth(t,5.5,7));for(let i=1;i<=2;i++){const side=i===1?-1:1;b[i].rotation.x=-side*.92;b[i].rotation.y=side*Math.sin(t*4.2)*.47*envelope;b[i].rotation.z=side*Math.cos(t*4.2)*.07*envelope;}for(const i of[3,4])b[i].rotation.z=.90;}
  r.current={stage:action==='walk'?(t<6?'Alternating support and recovery':'Return to standing'):action==='swim'?(t<5.5?'Paired flipper strokes':'Stroke to glide'):action==='glide'?'Extended flipper glide posture':'Standing adult',duration:action==='walk'||action==='swim'?8:0,complete:t>=8};
 }
 m.root.updateMatrixWorld(true);for(const p of r.parts)if(p.isSkinnedMesh)p.skeleton.update();updateSpecimenLandmarks(m);return true;
}
