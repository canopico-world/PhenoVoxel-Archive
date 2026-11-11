import * as T from 'three';
import {renderedBounds} from './camera-fit.js';
const V=()=>new T.Vector3();

// Creator snake motion is inspectable, not measured kinematics. Squilla remains
// static until its own connected mesh has a reviewed articulated behavior rig.
export function prepareSourceSpecimen(gltf,s,asset){
 const root=new T.Group(),content=new T.Group(),meshes=[],bind=[];
 root.add(content);content.add(gltf.scene);if(s.id==='rangifer-tarandus')content.rotation.y=Math.PI/2;
 gltf.scene.traverse(o=>{
  bind.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);
  if(o.isMesh){meshes.push(o);o.frustumCulled=false;
   for(const mat of Array.isArray(o.material)?o.material:[o.material]){
    mat.userData={...mat.userData,compatibilityLinearTexture:true,compatibilitySurfaceDetail:true};
   }
  }
 });
 const m={root,content,gltf,asset,id:s.id,kind:s.visual.kind,forward:['gloydius-blomhoffii','drosophila-melanogaster'].includes(s.id)?-1:1,natural:true,textured:true,surfaceDetailed:true,hideDevelopmentLandmarks:true,parts:{},features:s.anatomy.map(V),featureBindings:[],bones:[],limbs:[],current:'observe',mixer:new T.AnimationMixer(gltf.scene),sourceStudy707:{meshes,bind},movementStudy:{duration:0}};
 animateSourceSpecimen(m,'observe',0);
 let box=renderedBounds(root),size=box.getSize(V());
 content.scale.setScalar(3.9/Math.max(...size.toArray()));root.updateMatrixWorld(true);
 box=renderedBounds(root);const center=box.getCenter(V());content.position.set(-center.x,.13-box.min.y,-center.z);root.updateMatrixWorld(true);
 m.sourceStudy707.home=content.position.clone();
 m.sourceStudy707.anchor=gltf.scene.getObjectByName('v25');
 m.sourceStudy707.anchorHome=m.sourceStudy707.anchor?.getWorldPosition(V());
 m.extent=renderedBounds(root).getSize(V());
 Object.assign(root.userData,{hideStudioGround:true,aquaticStudy:asset.aquatic,source:asset.source,animationValidated:false,surfaceProvenance:asset.surfaceType});
 return m;
}

export function animateSourceSpecimen(m,motion,t){
 const state=m.sourceStudy707,clip=m.gltf.animations[0],active=motion==='crawl'&&m.id==='gloydius-blomhoffii'&&!!clip;
 const duration=active?clip.duration:0,requested=Number.isFinite(t)?t:0,seconds=active?(requested>=duration-1e-6?duration:T.MathUtils.clamp(requested,0,duration)):0;
 m.mixer.stopAllAction();
 for(const[o,p,q,s]of state.bind){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}
 if(clip){const action=m.mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();m.mixer.setTime(seconds);}
 if(state.home)m.content.position.copy(state.home);
 m.root.updateMatrixWorld(true);for(const mesh of state.meshes)mesh.skeleton?.update();
 // Follow the source middle-body joint without changing its relative bone poses.
 // Camera-relative presentation is not a ground-speed or displacement measurement.
 if(state.anchor&&state.anchorHome){const p=state.anchor.getWorldPosition(V());m.content.position.x+=state.anchorHome.x-p.x;m.content.position.z+=state.anchorHome.z-p.z;m.root.updateMatrixWorld(true);}
 m.current=motion;m.sourceClip=clip||null;m.movementStudy.duration=duration;
 m.root.userData.movementStudy={duration,time:seconds,complete:active&&seconds>=duration,stage:active?(seconds>=duration?'End of creator clip':seconds<duration/3?'Early source pose':seconds<duration*2/3?'Middle source pose':'Late source pose'):'Static exterior inspection',measured:false};
 m.root.userData.sourcePlayback={clip:clip?.name||null,sourceSeconds:seconds,held:!active,measured:false,presentation:'Middle-body-following view; source relative articulation retained'};
}
