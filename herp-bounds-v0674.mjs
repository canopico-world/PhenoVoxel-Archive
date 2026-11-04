import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareHerpSource,animateHerpSource} from './herp-source-v0674.js';
import {renderedBounds} from './camera-fit.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
const file='herp-assets-v0674.json',registry=JSON.parse(fs.readFileSync(file)),db=JSON.parse(fs.readFileSync('species.json'));
for(const[id,a]of Object.entries(registry.models)){
 const bytes=fs.readFileSync(a.localFile),gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),m=prepareHerpSource(gltf,db.species.find(s=>s.id===id),a);a.motionBounds={};
 for(const[action,spec]of Object.entries(a.nativeMotion)){
  const envelope=new T.Box3(),clip=gltf.animations.find(c=>c.name===spec.clip);let min=Infinity,max=-Infinity;
  for(let i=0;i<=24;i++){animateHerpSource(m,action,clip.duration*i/24/(spec.rate||1));const b=renderedBounds(m.root);envelope.union(b);min=Math.min(min,b.min.y);max=Math.max(max,b.min.y);}
  const b=envelope.expandByScalar(.06);a.motionBounds[action]={min:b.min.toArray(),max:b.max.toArray()};console.log(id,action,'min-y range',min.toFixed(4),max.toFixed(4));
 }
}
fs.writeFileSync(file,JSON.stringify(registry,null,2)+'\n');
