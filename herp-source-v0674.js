import * as T from 'three';
import {renderedBounds} from './camera-fit.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);

// Play the deposited artist clips on their original surfaces and skeletons.
// A fixed display transform sets the camera scale; it is not a body measurement.
export function prepareHerpSource(gltf,s,asset){
 const root=new T.Group(),content=new T.Group(),meshes=[],bones=[],bind=[];
 root.add(content);content.add(gltf.scene);
 gltf.scene.traverse(o=>{bind.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);if(o.isBone)bones.push(o);if(o.isMesh){meshes.push(o);o.castShadow=o.receiveShadow=true;o.frustumCulled=false;for(const mat of Array.isArray(o.material)?o.material:[o.material])mat.userData={...mat.userData,compatibilityLinearTexture:true,compatibilitySurfaceDetail:true};}});
 const mixer=new T.AnimationMixer(gltf.scene),m={root,content,gltf,mixer,asset,id:s.id,kind:s.visual.kind,forward:1,natural:true,textured:true,surfaceDetailed:true,parts:{},bones,limbs:[],features:[V(),V(),V()],featureBindings:[],current:'observe',sourceClip:null,action:null,herpSource:{meshes,bones,bind,clip:null}};
 animateHerpSource(m,'observe',0);
 content.rotation.y=Math.PI/2;root.updateMatrixWorld(true);
 const sourceBox=renderedBounds(root),size=sourceBox.getSize(V());content.scale.setScalar((asset.displaySpan||3.9)/Math.max(...size.toArray()));root.updateMatrixWorld(true);
 const fitted=renderedBounds(root),center=fitted.getCenter(V());content.position.set(-center.x,.13-fitted.min.y,-center.z);root.updateMatrixWorld(true);
 const box=renderedBounds(root),extent=box.getSize(V()),head=bones.find(b=>/^(head|Head_Controller|Head001_04)$/i.test(b.name));m.headAnchor=head;
 const axolotl=s.id==='ambystoma-mexicanum',turtle=s.id==='chelonia-mydas',targets=turtle?
  [V(0,box.max.y,0),V(0,box.min.y+extent.y*.25,box.min.z*.75),head?.getWorldPosition(V())||V(box.max.x*.8,box.max.y*.5,0)]:axolotl?
  [V(box.max.x*.50,box.max.y*.84,box.min.z*.35),V(box.min.x*.70,box.min.y+extent.y*.4,0),V(0,box.min.y,box.min.z*.65)]:
  [V(box.max.x*.62,box.min.y,box.min.z*.65),V(box.min.x*.45,box.min.y+extent.y*.45,box.min.z*.7),head?.getWorldPosition(V())||V(box.max.x*.65,box.max.y,0)];
 const skinMeshes=meshes.filter(o=>!(Array.isArray(o.material)?o.material:[o.material]).some(mat=>/Bones and Veins|Cornea|eyeouter/i.test(mat.name)));
 for(const [f,target]of targets.entries()){
  let best;const selected=axolotl&&f===0?skinMeshes.filter(o=>/Gills/i.test(o.name)||/Gills/i.test(o.material?.name)):skinMeshes;
  for(const mesh of selected.length?selected:skinMeshes){mesh.skeleton?.update();const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const point=mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld),d=point.distanceToSquared(target);if(!best||d<best.distance)best={mesh,indices:[i],distance:d,kind:'Approximate source-surface region; not measured anatomy'};}}
  m.featureBindings[f]=best;
 }
 m.extent=extent;
 Object.assign(root.userData,{compatibilityHerpDetail:true,hideStudioGround:true,aquaticStudy:turtle||axolotl,focusAnatomy:true,anatomyFocusScale:[.25,.3,.23],reconstruction:{version:'0.6.74',source:asset.source,reference:s.photograph?.source,geometry:asset.biology,sourceBinaryUnmodified:asset.sourceBinaryUnmodified,animationValidated:false}});
 m.motionBounds=Object.fromEntries(Object.entries(asset.motionBounds||{}).map(([key,b])=>[key,new T.Box3(V(...b.min),V(...b.max))]));
 updateSpecimenLandmarks(m);return m;
}

export function animateHerpSource(m,motion,time){
 const spec=m.asset.nativeMotion[motion]||m.asset.nativeMotion.observe,r=m.herpSource;
 const clip=m.gltf.animations.find(c=>c.name===spec.clip);if(!clip)throw Error('Missing credited source clip: '+spec.clip);
 if(r.clip!==clip){m.mixer.stopAllAction();for(const[o,p,q,s]of r.bind){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}m.action=m.mixer.clipAction(clip);m.action.reset().setLoop(T.LoopRepeat,Infinity).play();r.clip=clip;}
 const t=spec.hold??Math.max(0,Number.isFinite(time)?time:0)*(spec.rate??1);m.mixer.setTime(t);m.current=motion;m.sourceClip=clip;
 m.root.updateMatrixWorld(true);for(const mesh of r.meshes){mesh.skeleton?.update();}
 m.root.userData.sourcePlayback={clip:clip.name,sourceSeconds:t,duration:clip.duration,held:spec.hold!==undefined,measured:false};
}
