import * as T from 'three';
import {buildCetacean,animateCetacean,cetaceanRig} from './cetacean-models.js';
import {refineFlukePitch} from './cetacean-fine-anatomy.js';
import {cet16Profiles,cet16Limits} from './cetaceans-config-v0675.js';
import manifest from './cetaceans-textures-v0675.json' with {type:'json'};
const loaded=new Map(),pending=new Map();
export async function preloadCet16Textures(s){
 if(s.visual?.cetaceanVersion!=='0.6.75'||typeof document==='undefined')return;
 const id=s.visual.cetaceanProfile||s.id;if(pending.has(id))return pending.get(id);
 const task=Promise.all(['body','flipper','fluke','normal','roughness'].map(async kind=>{const a=manifest.assets[kind]||manifest.assets[id+':'+kind],tx=await new T.TextureLoader().loadAsync('./'+a.file);tx.flipY=false;tx.wrapT=T.RepeatWrapping;tx.colorSpace=['normal','roughness'].includes(kind)?T.NoColorSpace:T.SRGBColorSpace;tx.userData={author:manifest.author,license:manifest.license,source:manifest.scope,compatibilityLinearTexture:true};loaded.set(id+':'+kind,tx);}));pending.set(id,task);try{await task;}catch(error){pending.delete(id);throw error;}
}
export function buildCet16(s){
 const id=s.visual.cetaceanProfile||s.id,c=cet16Profiles[id];if(!c)throw Error('Unsupported cetacean profile '+id);
 const bodyTexture=loaded.get(id+':body'),m=buildCetacean(s,bodyTexture?{...c,textureFactory:(_,kind)=>loaded.get(id+':'+(kind==='body'?'body':'flipper')).clone()}:c),r=cetaceanRig(m);
 for(const part of r.parts){const mesh=part.mesh;if(!/closed-(?:species|pectoral|horizontal|dorsal)/.test(mesh.name))continue;
  const old=mesh.material,kind=mesh===r.body?'body':r.flukes.includes(mesh)?'fluke':r.flippers.some(f=>f.mesh===mesh)?'flipper':'dorsal',map=loaded.get(id+':'+kind)?.clone()||old.map;
  const mat=new T.MeshPhysicalMaterial({color:map?'#ffffff':c.back,map,roughness:.44,metalness:0,clearcoat:.32,clearcoatRoughness:.19,normalMap:loaded.get(id+':normal')?.clone()||null,roughnessMap:loaded.get(id+':roughness')?.clone()||null});
  mat.normalScale.set(.26,.26);mat.userData={compatibilityMarineOptics:true,compatibilityWetSkin:true,compatibilitySurfaceDetail:true,compatibilityLinearTexture:true};mesh.material=mat;
 }
 m.cet16={version:'0.6.75',profile:id,limits:cet16Limits};m.cetaceanStudy={version:'0.6.75',phenotype:c.phenotype,sourceScope:cet16Limits};
 Object.assign(m.root.userData,{cet16:m.cet16,cetaceanStudy:m.cetaceanStudy,aquaticStudy:true,hideStudioGround:true,compatibilityMarineShadows:true});
 m.motionBounds={swim:new T.Box3(new T.Vector3(-2.35,.5,-1.5),new T.Vector3(2.1,2.8,1.5)),turn:new T.Box3(new T.Vector3(-2.35,.5,-1.5),new T.Vector3(2.1,2.8,1.5))};return m;
}
export function animateCet16(m,action,t){if(!m.cet16)return false;animateCetacean(m,action,t);refineFlukePitch(cetaceanRig(m),action,t);return true;}
