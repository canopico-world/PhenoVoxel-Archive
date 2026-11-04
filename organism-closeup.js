import * as T from 'three';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
const V=(...v)=>new T.Vector3(...v);
export function prepareOrganism(gltf,s,asset){
 const root=new T.Group(),content=new T.Group();root.add(content);content.add(gltf.scene);const meshes=[];root.updateMatrixWorld(true);
 gltf.scene.traverse(o=>{if(!o.isMesh)return;meshes.push(o);o.castShadow=o.receiveShadow=false;for(const material of Array.isArray(o.material)?o.material:[o.material]){material.envMapIntensity=.35;material.userData.compatibilityLinearTexture=true;for(const key of ['map','normalMap','roughnessMap'])if(material[key])material[key].anisotropy=16;}});
 const bounds=new T.Box3().setFromObject(root,true),targets=asset.featureTargets.map(p=>V(...p)),best=targets.map(()=>({distance:Infinity})),point=V();
 for(const mesh of meshes){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);for(let k=0;k<targets.length;k++){const distance=point.distanceToSquared(targets[k]);if(distance<best[k].distance)best[k]={mesh,indices:[i],distance,kind:'Authored macro-anatomical region on the retained scan; not a microscopic tissue identification'};}}}
 const m={root,content,gltf,asset,id:s.id,kind:'mushroom',natural:true,textured:true,surfaceDetailed:true,parts:{},bones:[],limbs:[],features:targets.map(()=>V()),featureBindings:best,current:'observe',sourceClip:null,organismRevision:{version:'0.6.72',meshes},extent:bounds.getSize(V())};
 root.userData.focusAnatomy=true;root.userData.anatomyFocusScale=asset.anatomyFocusScale;root.userData.anatomyViewDirections=asset.anatomyViewDirections;root.userData.anatomyUnderside=asset.anatomyUnderside;root.userData.hideStudioGround=true;root.userData.reconstructionScope=asset.biology;
 // Only the teaching glyph changes. The photographed fruit body is stationary.
 root.userData.staticLocalBounds={min:bounds.min.toArray(),max:bounds.max.toArray()};updateSpecimenLandmarks(m);
 const marker=new T.Mesh(new T.SphereGeometry(.025,10,6),new T.MeshBasicMaterial({color:'#f2d872',transparent:true,opacity:.8,depthTest:false}));marker.name='Fertile_surface_teaching_marker';marker.renderOrder=20;marker.userData.cameraContext=true;marker.userData.teachingMarker=true;marker.position.copy(m.features[asset.fertileFeatureIndex]);marker.visible=false;root.add(marker);m.organismRevision.marker=marker;
 m.motionBounds={observe:bounds.clone(),spores:bounds.clone()};animateOrganism(m,'observe',0);return m;
}
export function animateOrganism(m,action,time){
 if(!m.organismRevision)return false;m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);m.root.scale.setScalar(1);const t=Math.max(0,Math.min(Number.isFinite(time)?time:0,4)),marker=m.organismRevision.marker;
 marker.visible=action==='spores';marker.material.opacity=.8*T.MathUtils.smoothstep(t,0,.7);marker.scale.setScalar(1+.12*Math.sin(t*Math.PI*2)*(1-T.MathUtils.smoothstep(t,3,4)));m.sourceClip=null;m.root.updateMatrixWorld(true);return true;
}
