import fs from 'node:fs';import {GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import * as T from'three';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const base=new URL('./research-cache/cetaceans-sources-v0677/',import.meta.url);
for(const [key,file]of Object.entries({risso:'risso-original/source/DelfinRisso.glb',sei:'sei-source.glb',minke:'minke-source.glb',pilot:'pilot-original/source/long finned pilot whale.glb',fin:'../../model-fin-whale-woelper.glb'})){
 const b=fs.readFileSync(new URL(file,base)),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');g.scene.updateMatrixWorld(true);g.scene.traverse(o=>o.skeleton?.update());const meshes=[];
 g.scene.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,uv=o.geometry.attributes.uv,nn=o.geometry.attributes.normal,out=[],raw=[],u=[];for(let i=0;i<p.count;i++){out.push(...o.getVertexPosition(i,new T.Vector3()).applyMatrix4(o.matrixWorld));raw.push(p.getX(i),p.getY(i),p.getZ(i));if(uv)u.push(uv.getX(i),uv.getY(i));}meshes.push({name:o.name,p:out,raw,uv:u,indices:[...o.geometry.index.array],joints:o.geometry.attributes.skinIndex?[...o.geometry.attributes.skinIndex.array]:null,weights:o.geometry.attributes.skinWeight?[...o.geometry.attributes.skinWeight.array]:null});});
 fs.writeFileSync(new URL(key+'-bake.json',base),JSON.stringify(meshes));
 console.log(key,meshes.map(m=>[m.name,m.p.length/3]));
}
