import {applySelectedPigmentTone} from './material-response.js';
import * as T from 'three';
import {animateCetaceanSurface} from './cetacean-surfaces.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
import {fineNoise,configureFineAnatomy,animateFineFeeding,applyFineMaterial} from './cetacean-fine-anatomy.js';
const V=(...v)=>new T.Vector3(...v);
export function prepareNarwhal(gltf,s={},asset={}){
 const root=new T.Group(),content=new T.Group();root.add(content);content.add(gltf.scene);root.updateMatrixWorld(true);
 const body=gltf.scene.getObjectByName('narwhal-artist-body'),tusk=gltf.scene.getObjectByName('selected-anatomical-left-erupted-tusk');if(!body||!tusk)throw Error('Missing qualified source regions');
 content.rotation.y=Math.PI/2;root.updateMatrixWorld(true);let b=new T.Box3().setFromObject(body,true),size=b.getSize(V());content.scale.setScalar(3.85/size.x);root.updateMatrixWorld(true);b.setFromObject(body,true);const center=b.getCenter(V());content.position.set(-center.x,1.45-center.y,-center.z);root.updateMatrixWorld(true);b.setFromObject(body,true);
 const meshes=[];gltf.scene.traverse(o=>{if(!o.isMesh)return;meshes.push(o);o.geometry=o.geometry.clone();o.material=o.material.clone();o.material.metalness=0;o.material.roughness=.36;o.material.envMapIntensity=.45;if(o===body){o.material.color.setRGB(1,1,1);o.material.userData.compatibilityWetSkin=true;applySelectedPigmentTone(o.material,{low:.018,high:.62,exponent:.70,saturation:.14});}if(o!==body&&o!==tusk){o.material.map=null;o.material.normalMap=null;o.material.color.set(0x11191d);o.material.roughness=.32;}o.castShadow=true;o.receiveShadow=true;});
 // Bake the disclosed orientation into cloned runtime geometry. Original GLB,
 // source UVs and embedded image bytes remain archived and delivered intact.
 for(const mesh of meshes){for(const[name,a]of Object.entries(mesh.geometry.attributes)){const data=[];for(let i=0;i<a.count;i++)for(let k=0;k<a.itemSize;k++)data.push(a.getComponent(i,k));mesh.geometry.setAttribute(name,new T.Float32BufferAttribute(data,a.itemSize));}mesh.geometry.applyMatrix4(mesh.matrixWorld);mesh.removeFromParent();mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.setScalar(1);root.add(mesh);}root.remove(content);root.updateMatrixWorld(true);
 const colours=[],bp=body.geometry.attributes.position,shade=new T.Color(),white=new T.Color('#afb7b3'),dark=new T.Color('#18262e'),gray=new T.Color('#7b898e');
 for(let i=0;i<bp.count;i++){const x=bp.getX(i),y=bp.getY(i)-1.45,z=bp.getZ(i),u=.5-x/3.85,n=.65*fineNoise(x*16,y*34,z*34)+.25*fineNoise(x*43,y*85,z*85)+.1*fineNoise(x*110,y*220,z*220),dorsal=T.MathUtils.smoothstep(y,-.12,.17),head=1-T.MathUtils.smoothstep(u,.09,.24),pattern=T.MathUtils.smoothstep(n,.42,.66);shade.copy(white).lerp(gray,dorsal*.45).lerp(dark,Math.min(.98,pattern*dorsal*.95+head*.18));colours.push(shade.r,shade.g,shade.b);}
 body.geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));body.material.map=null;body.material.vertexColors=true;delete body.material.userData.selectedPigmentTone;body.material.onBeforeCompile=()=>{};body.material.customProgramCacheKey=()=> 'narwhal-v654-pigment';
 const m={root,content,gltf,asset,id:'monodon-monoceros',kind:'cetacean',forward:1,natural:true,textured:true,surfaceDetailed:true,bones:[],parts:{},features:[],limbs:[],clipMap:{},current:'observe',action:null,sourceClip:null};
 const r=m.cetaceanSurface={creator:false,clip:null,meshes:[],seconds:12,centerY:1.45,min:b.min.x,max:b.max.x,length:b.max.x-b.min.x};
 for(const mesh of meshes){const p=mesh.geometry.attributes.position,world=new Float32Array(p.count*3);for(let i=0;i<p.count;i++)V().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).toArray(world,i*3);r.meshes.push({mesh,neutral:p.array.slice(),normal:mesh.geometry.attributes.normal?.array.slice(),world,inverse:mesh.matrixWorld.clone().invert()});}
 m.extent=new T.Box3().setFromObject(root,true).getSize(V());
 const targets=[V(b.max.x-.4,1.45,0),V(b.min.x+.08,1.45,0),V(0,b.max.y,0),new T.Box3().setFromObject(tusk,true).getCenter(V())];
 m.featureBindings=targets.map((target,j)=>{let best;for(const mesh of j===3?[tusk]:meshes){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const point=V().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),d=point.distanceToSquared(target);if(!best||d<best.d)best={mesh,indices:[i],d,kind:'Selected artist-surface region; unmeasured anatomical locator'};}}return best;});m.features=targets.map(()=>V());
 const profile=[];for(let i=0;i<=32;i++){const u=i/32,x=3.85*(.5-u),points=[];for(let j=0;j<bp.count;j++)if(Math.abs(bp.getX(j)-x)<.065&&Math.abs(bp.getZ(j))<.46)points.push(j);if(points.length)profile.push([u,Math.max(.002,...points.map(j=>Math.abs(bp.getZ(j)))),Math.max(...points.map(j=>bp.getY(j)-1.45)),Math.min(...points.map(j=>bp.getY(j)-1.45))]);}
 const c={id:m.id,length:3.85,y:1.45,profile,headEnd:.16,eyeU:.11,mouthQ:-.60},fr={c,body,parts:meshes.map(mesh=>({mesh,neutral:mesh.geometry.attributes.position.array.slice()}))};applyFineMaterial(body.material,c);configureFineAnatomy(m,fr);
 // Regional bending must use the newly split runtime body, not stale indices.
 for(const part of r.meshes){const p=part.mesh.geometry.attributes.position;part.neutral=p.array.slice();part.normal=part.mesh.geometry.attributes.normal.array.slice();part.world=p.array.slice();part.inverse.identity();}
 root.userData.focusAnatomy=true;root.userData.anatomyFocusScale=[.6,.6,.6,1];root.userData.anatomyViewDirections=[[.7,.15,1],[0,1,.001],[0,.6,1],[0,.15,1]];
 // A separate longitudinal pivot keeps the body centre fixed during an authored roll.
 const pivot=new T.Group();pivot.position.y=1.45;for(const mesh of meshes){root.remove(mesh);mesh.position.y-=1.45;pivot.add(mesh);}root.remove(m.fineAnatomy.oral.group);m.fineAnatomy.oral.group.position.y=-1.45;pivot.add(m.fineAnatomy.oral.group);root.add(pivot);m.narwhalSurface={body,tusk,pivot,tuskNeutral:tusk.geometry.attributes.position.array.slice(),version:'0.6.54',scope:'Cosmic_dust CC BY4 delivered payload preserved; disclosed runtime orientation baking, oral split, attached lining and new continuous body-relative pigment derivative. No measured phenotype or optics'};animateNarwhal(m,'observe',0);return m;
}
export function animateNarwhal(m,action,t){
 const poseKey=action==='observe'?'observe':action+':'+T.MathUtils.clamp(t,0,12);if(m.narwhalSurface.poseKey===poseKey)return true;
 if(animateFineFeeding(m,action,t)){m.narwhalSurface.pivot.rotation.x=0;m.narwhalSurface.poseKey=poseKey;return true;}
 m.narwhalSurface.pivot.rotation.x=0;animateCetaceanSurface(m,action==='glide'&&t>=6?'observe':action,t);m.cetaceanSurface.current.action=action;
 const tuskPositions=m.narwhalSurface.tusk.geometry.attributes.position;tuskPositions.array.set(m.narwhalSurface.tuskNeutral);tuskPositions.needsUpdate=true;
 if(action==='roll'){const q=T.MathUtils.clamp(t/12,0,1),entry=T.MathUtils.smoothstep(q,0,.30),exit=T.MathUtils.smoothstep(q,.70,1);m.narwhalSurface.pivot.rotation.x=Math.PI*entry*(1-exit);}
 m.root.updateMatrixWorld(true);updateSpecimenLandmarks(m);m.narwhalSurface.poseKey=poseKey;return true;
}
