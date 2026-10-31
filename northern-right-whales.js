import * as T from 'three';
import {prepareCetaceanSurface,animateCetaceanSurface} from './cetacean-surfaces.js';

export const northernRightIds=new Set(['eubalaena-glacialis','eubalaena-japonica']);

// The shared source is a licensed Southern right-whale reconstruction. Each
// northern interpretation has a separate shaped body and original skin field.
// These are selected adult appearances, not diagnostic ocean-basin templates.
export function prepareNorthernRightWhale(gltf,s,asset){
 // The delivered GLBs pack position/normal/UV in a shared vertex buffer.
 // Local deformation needs independent attribute arrays for exact restore.
 gltf.scene.traverse(o=>{if(!o.isMesh)return;for(const[name,a]of Object.entries(o.geometry.attributes)){if(!a.isInterleavedBufferAttribute)continue;const values=new a.data.array.constructor(a.count*a.itemSize);for(let i=0;i<a.count;i++)for(let k=0;k<a.itemSize;k++)values[i*a.itemSize+k]=a.data.array[i*a.data.stride+a.offset+k];o.geometry.setAttribute(name,new T.BufferAttribute(values,a.itemSize,a.normalized));}});
 const m=prepareCetaceanSurface(gltf,s,asset);
 m.northernRight={version:'0.6.64',sourceSpecies:'eubalaena-australis',selectedPattern:true,individuallyIdentified:false};
 for(const part of m.cetaceanSurface.meshes){
  const old=part.mesh.material,body=part.mesh.name==='Whale_Bake_0',eye=part.mesh.name.includes('Eyeball');
  const mat=new T.MeshPhysicalMaterial({name:old.name,color:old.color,map:old.map,normalMap:old.normalMap,roughnessMap:old.roughnessMap,metalness:0,roughness:body?1:eye?.14:.75,ior:1.36,clearcoat:body?.12:eye?.55:0,clearcoatRoughness:body?.36:.12,specularIntensity:body?.65:1,side:old.side});
  mat.normalScale.setScalar(body?.65:1);mat.envMapIntensity=.5;
  mat.userData={compatibilityWetSkin:true,compatibilityMarineOptics:true,compatibilitySurfaceDetail:true,compatibilityLinearTexture:true};
  for(const [key,role]of[['map','albedo'],['normalMap','normal'],['roughnessMap','roughness']])if(mat[key]){mat[key].anisotropy=8;mat[key].userData={...mat[key].userData,file:mat[key].name,role,compatibilityResolution:key==='map'?4096:2048};}
  part.mesh.material=mat;old.dispose();
  const groups=new Map();for(let i=0;i<part.neutral.length/3;i++){const key=[0,1,2].map(k=>Math.round(part.neutral[i*3+k]*1e6)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}part.northernWeld=[...groups.values()].filter(ids=>ids.length>1);
 }
 Object.assign(m.root.userData,{aquaticStudy:true,compatibilityMarineShadows:true,northernRightScope:'Selected northern adult interpretation derived from the credited Southern right-whale surface. Independently shaped exteriors, non-overlapping skin atlases and different irregular raised callosity patterns. Callosities are cyamid-colonized skin, not generic barnacle shells. Patterns and body condition vary among individuals; shape and marks do not diagnose the ocean-basin species. No specimen, tissue-optical or motion calibration.',anatomyFocusScale:[.40,.62,.65]});
 m.root.userData.cetaceanSurfaceScope=m.root.userData.northernRightScope;
 animateCetaceanSurface(m,'observe',0);return m;
}

export function animateNorthernRightWhale(m,action,t){
 animateCetaceanSurface(m,action,t);
 if(action!=='swim'||t<=0||t>=12)return true;
 for(const part of m.cetaceanSurface.meshes){const n=part.mesh.geometry.attributes.normal;for(const ids of part.northernWeld){const mean=new T.Vector3();for(const i of ids)mean.add(new T.Vector3().fromBufferAttribute(n,i));mean.normalize();for(const i of ids)n.setXYZ(i,...mean);}n.needsUpdate=true;}
 return true;
}
