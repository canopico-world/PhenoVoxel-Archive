import {applySelectedPigmentTone} from './material-response.js';
import * as T from 'three';
import {animateCetaceanSurface} from './cetacean-surfaces.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
const V=(...v)=>new T.Vector3(...v);
export function prepareNarwhal(gltf,s={},asset={}){
 const root=new T.Group(),content=new T.Group();root.add(content);content.add(gltf.scene);root.updateMatrixWorld(true);
 const body=gltf.scene.getObjectByName('narwhal-artist-body'),tusk=gltf.scene.getObjectByName('selected-anatomical-left-erupted-tusk');if(!body||!tusk)throw Error('Missing qualified source regions');
 content.rotation.y=Math.PI/2;root.updateMatrixWorld(true);let b=new T.Box3().setFromObject(body,true),size=b.getSize(V());content.scale.setScalar(3.85/size.x);root.updateMatrixWorld(true);b.setFromObject(body,true);const center=b.getCenter(V());content.position.set(-center.x,1.45-center.y,-center.z);root.updateMatrixWorld(true);b.setFromObject(body,true);
 const meshes=[];gltf.scene.traverse(o=>{if(!o.isMesh)return;meshes.push(o);o.geometry=o.geometry.clone();o.material=o.material.clone();o.material.metalness=0;o.material.roughness=.36;o.material.envMapIntensity=.45;if(o===body){o.material.color.setRGB(1,1,1);o.material.userData.compatibilityWetSkin=true;applySelectedPigmentTone(o.material,{low:.018,high:.62,exponent:.70,saturation:.14});}if(o!==body&&o!==tusk){o.material.map=null;o.material.normalMap=null;o.material.color.set(0x11191d);o.material.roughness=.32;}o.castShadow=true;o.receiveShadow=true;});
 const m={root,content,gltf,asset,id:'monodon-monoceros',kind:'cetacean',forward:1,natural:true,textured:true,surfaceDetailed:true,bones:[],parts:{},features:[],limbs:[],clipMap:{},current:'observe',action:null,sourceClip:null};
 const r=m.cetaceanSurface={creator:false,clip:null,meshes:[],seconds:12,centerY:1.45,min:b.min.x,max:b.max.x,length:b.max.x-b.min.x};
 for(const mesh of meshes){const p=mesh.geometry.attributes.position,world=new Float32Array(p.count*3);for(let i=0;i<p.count;i++)V().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).toArray(world,i*3);r.meshes.push({mesh,neutral:p.array.slice(),normal:mesh.geometry.attributes.normal?.array.slice(),world,inverse:mesh.matrixWorld.clone().invert()});}
 m.extent=new T.Box3().setFromObject(root,true).getSize(V());
 const targets=[V(b.max.x-.4,1.45,0),V(b.min.x+.08,1.45,0),V(0,b.max.y,0),new T.Box3().setFromObject(tusk,true).getCenter(V())];
 m.featureBindings=targets.map((target,j)=>{let best;for(const mesh of j===3?[tusk]:meshes){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const point=V().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),d=point.distanceToSquared(target);if(!best||d<best.d)best={mesh,indices:[i],d,kind:'Selected artist-surface region; unmeasured anatomical locator'};}}return best;});m.features=targets.map(()=>V());
 root.userData.focusAnatomy=true;root.userData.anatomyFocusScale=[.6,.6,.6,1];root.userData.anatomyViewDirections=[[.7,.15,1],[0,1,.001],[0,.6,1],[0,.15,1]];
 // A separate longitudinal pivot keeps the body centre fixed during an authored roll.
 const pivot=new T.Group();root.remove(content);pivot.position.y=1.45;content.position.y-=1.45;pivot.add(content);root.add(pivot);m.narwhalSurface={body,tusk,pivot,tuskNeutral:tusk.geometry.attributes.position.array.slice(),version:'0.6.53',scope:'Cosmic_dust CC BY4 retained source body/UV/images; closed eye/tusk topology repairs and selected runtime material derivative, no measured phenotype or optics'};animateNarwhal(m,'observe',0);return m;
}
export function animateNarwhal(m,action,t){
 const poseKey=action==='observe'?'observe':action+':'+T.MathUtils.clamp(t,0,12);if(m.narwhalSurface.poseKey===poseKey)return true;
 m.narwhalSurface.pivot.rotation.x=0;animateCetaceanSurface(m,action==='glide'&&t>=6?'observe':action,t);m.cetaceanSurface.current.action=action;
 const tuskPositions=m.narwhalSurface.tusk.geometry.attributes.position;tuskPositions.array.set(m.narwhalSurface.tuskNeutral);tuskPositions.needsUpdate=true;
 if(action==='roll'){const q=T.MathUtils.clamp(t/12,0,1),entry=T.MathUtils.smoothstep(q,0,.30),exit=T.MathUtils.smoothstep(q,.70,1);m.narwhalSurface.pivot.rotation.x=Math.PI*entry*(1-exit);}
 m.root.updateMatrixWorld(true);updateSpecimenLandmarks(m);m.narwhalSurface.poseKey=poseKey;return true;
}
