import * as T from 'three';
import {rimOptics} from './jellyfish-exteriors.js';
const V=()=>new T.Vector3();
function centroid(mesh){const p=mesh.geometry.attributes.position,c=V(),v=V();for(let i=0;i<p.count;i++)c.add(mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld));return c.divideScalar(p.count);}
export function prepareAureliaSurface(scene,content){
 const meshes=[];scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();if(o.isMesh&&o.name!=='Object_4')meshes.push(o);});
 const find=p=>meshes.find(o=>p.test(o.material.name)),cavity=find(/Cavity/),oral=find(/OralArm_mat/),bell=find(/Bell1/);
 if(!cavity||!oral||!bell)throw Error('Moon jelly source tissue mapping changed');
 // One rigid source-coordinate correction, fitted to the original tissue axis.
 // Geometry, UVs, skeleton, weights, image bytes and creator clip remain intact.
 const up=centroid(cavity).sub(centroid(oral)).normalize();content.quaternion.setFromUnitVectors(up,new T.Vector3(0,1,0));
 for(const mesh of meshes){mesh.castShadow=false;mesh.receiveShadow=false;const m=mesh.material;m.metalness=0;m.roughness=.24;m.depthWrite=false;m.transparent=true;
  if(/Bell1/.test(m.name)){m.opacity=.34;m.color.set('#c8d5d2');rimOptics(m);}
  else if(/Bell2/.test(m.name)){m.opacity=.17;m.color.set('#c1d0cd');rimOptics(m);}
  else if(/OralArmFold/.test(m.name)){m.opacity=.66;m.color.set('#d4c9c8');}
  else if(/OralArm/.test(m.name)){m.opacity=.48;m.color.set('#d7d7cf');}
  else if(/Cavity/.test(m.name)){m.opacity=.34;m.color.set('#c6b7be');}
  else if(/Tentacle/.test(m.name))m.opacity=.53;
  else if(/Canal1/.test(m.name)){m.emissiveIntensity=.12;m.opacity=.65;}
  else if(/Canal2/.test(m.name)){m.opacity=.42;m.color.set('#b8c5c4');}
  m.needsUpdate=true;
 }
 return{meshes,bell,oral,cavity,sourceUp:up.toArray()};
}
export function configureAurelia(m,prepared){if(!prepared)return;m.aureliaSurface=prepared;m.root.userData.focusAnatomy=true;m.root.userData.anatomyFocusScale=[1.5,1.3,1.3];m.clipMap.observe=m.gltf.animations[0];m.root.userData.aureliaSurface={version:'0.6.40',rigidAxis:prepared.sourceUp,sourcePayloadRetained:true,materialVisibility:'Authored, uncalibrated tissue opacity; no fluorescence or false-colour photo fitting.'};}
export function aureliaTime(action,t,duration){return action==='pulse'?Math.max(0,Math.min(duration,t)):0;}
export function updateAureliaFeatures(m){if(!m.aureliaSurface)return;const r=m.aureliaSurface;m.root.updateMatrixWorld(true);for(const [i,mesh]of[r.bell,r.oral,r.cavity].entries())m.features[i].copy(m.root.worldToLocal(centroid(mesh)));}
