import * as T from 'three';
import {renderedBounds} from './camera-fit.js';
const V=()=>new T.Vector3();
// These are deposited creator clips, never a borrowed species rig or inferred physiology.
export function prepareDigitalLife(gltf,s,asset){
 const root=new T.Group(),content=new T.Group(),meshes=[],bind=[],bones=[];root.add(content);content.add(gltf.scene);
 gltf.scene.traverse(o=>{bind.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);if(o.isBone)bones.push(o);if(o.isMesh){meshes.push(o);o.frustumCulled=false;for(const mat of Array.isArray(o.material)?o.material:[o.material])mat.userData={...mat.userData,compatibilityLinearTexture:true,compatibilitySurfaceDetail:true};}});
 const m={root,content,gltf,asset,id:s.id,kind:s.visual.kind,forward:1,natural:true,textured:true,surfaceDetailed:true,hideDevelopmentLandmarks:true,parts:{},features:s.anatomy.map(V),featureBindings:[],bones,limbs:[],mixer:new T.AnimationMixer(gltf.scene),current:'observe',action:null,sourceClip:null,digitalLife:{meshes,bind,clip:null}};
 animateDigitalLife(m,'observe',0);
 let box=renderedBounds(root),size=box.getSize(V());if(size.z>size.x)content.rotation.y=Math.PI/2;
 content.scale.setScalar(3.9/Math.max(...size.toArray()));root.updateMatrixWorld(true);
 box=renderedBounds(root);const center=box.getCenter(V());content.position.set(-center.x,.13-box.min.y,-center.z);root.updateMatrixWorld(true);m.extent=renderedBounds(root).getSize(V());
 Object.assign(root.userData,{hideStudioGround:true,compatibilityHerpDetail:true,aquaticStudy:asset.aquatic,source:'DigitalLife3D',animationValidated:false});return m;
}
export function animateDigitalLife(m,motion,t){
 const state=m.digitalLife,spec=m.asset.nativeMotion[motion]||m.asset.nativeMotion.observe;
 const clip=m.gltf.animations.find(c=>c.name===spec.clip);
 if(state.clip!==clip){m.mixer.stopAllAction();for(const[o,p,q,s]of state.bind){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}state.clip=clip;if(clip){m.action=m.mixer.clipAction(clip).reset().setLoop(T.LoopRepeat,Infinity).play();}}
 const time=spec.hold??Math.max(0,Number.isFinite(t)?t:0);
 if(clip)m.mixer.setTime(time);m.current=motion;m.sourceClip=clip||null;
 m.root.updateMatrixWorld(true);for(const mesh of state.meshes)mesh.skeleton?.update();
 m.root.userData.sourcePlayback={clip:clip?.name||null,sourceSeconds:time,held:spec.hold!==undefined,measured:false};
}
