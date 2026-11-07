import * as T from 'three';
import {renderedBounds} from './camera-fit.js';
import {prepareMovementStudy,animateMovementStudy,movementClip} from './movement-studies-v0685.js';
const V=()=>new T.Vector3();
// These are deposited creator clips, never a borrowed species rig or inferred physiology.
export function prepareDigitalLife(gltf,s,asset){
 const root=new T.Group(),content=new T.Group(),meshes=[],bind=[],bones=[];root.add(content);content.add(gltf.scene);
 gltf.scene.traverse(o=>{bind.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);if(o.isBone)bones.push(o);if(o.isMesh){meshes.push(o);o.frustumCulled=false;for(const mat of Array.isArray(o.material)?o.material:[o.material])mat.userData={...mat.userData,compatibilityLinearTexture:true,compatibilitySurfaceDetail:true};}});
 const m={root,content,gltf,asset,id:s.id,kind:s.visual.kind,forward:1,natural:true,textured:true,surfaceDetailed:true,hideDevelopmentLandmarks:true,parts:{},features:s.anatomy.map(V),featureBindings:[],bones,limbs:[],mixer:new T.AnimationMixer(gltf.scene),current:'observe',action:null,sourceClip:null,digitalLife:{meshes,bind,clip:null}};
 prepareMovementStudy(m);animateDigitalLife(m,'observe',0);
 let box=renderedBounds(root),size=box.getSize(V());if(size.z>size.x)content.rotation.y=Math.PI/2;
 content.scale.setScalar(3.9/Math.max(...size.toArray()));root.updateMatrixWorld(true);
 box=renderedBounds(root);const center=box.getCenter(V());content.position.set(-center.x,.13-box.min.y,-center.z);root.updateMatrixWorld(true);m.extent=renderedBounds(root).getSize(V());
 if(m.movementStudy)m.movementStudy.center=renderedBounds(root).getCenter(V());
 Object.assign(root.userData,{hideStudioGround:true,compatibilityHerpDetail:true,aquaticStudy:asset.aquatic,source:'DigitalLife3D',animationValidated:false});return m;
}
export function animateDigitalLife(m,motion,t){
 const state=m.digitalLife,spec=movementClip(m,motion);
 const clip=m.gltf.animations.find(c=>c.name===spec.clip);
 if(state.clip!==clip||state.motion!==motion){m.mixer.stopAllAction();for(const[o,p,q,s]of state.bind){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}state.clip=clip;state.motion=motion;if(clip){m.action=m.mixer.clipAction(clip).reset().setLoop(spec.finite?T.LoopOnce:T.LoopRepeat,spec.finite?1:Infinity);m.action.clampWhenFinished=!!spec.finite;m.action.play();}}
 const time=spec.hold??Math.min(spec.finite?(clip?.duration??Infinity):Infinity,Math.max(0,Number.isFinite(t)?t:0));
 if(clip){m.action.paused=false;m.action.enabled=true;m.mixer.setTime(time);}m.current=motion;m.sourceClip=clip||null;
 animateMovementStudy(m,motion,t,clip);
 m.root.updateMatrixWorld(true);for(const mesh of state.meshes)mesh.skeleton?.update();
 m.root.userData.sourcePlayback={clip:clip?.name||null,sourceSeconds:time,held:spec.hold!==undefined,measured:false};
}
