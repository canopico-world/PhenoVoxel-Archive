import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import sharp from 'sharp';
import data from './fish-data-v0722.json' with {type:'json'};import reference from './fish-source-bounds-v0722.json' with {type:'json'};import {revisedFish} from './fish-source-v0722.js';import {prepareAsset,animateAsset} from './asset-motion.js';import {renderedBounds} from './camera-fit.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),archive=JSON.parse(fs.readFileSync('species.json'));
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const load=async b=>new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
for(const [id,d] of Object.entries(data.species)){
 const bytes=fs.readFileSync(d.modelAsset.localFile),base=archive.species.find(s=>s.id===id),name=id.startsWith('acipenser')?'sturgeon':'eel';
 test(name+': licensed source, explicit limits and preserved historical record',()=>{
  assert.equal(sha(bytes),d.modelAsset.sha256);assert(bytes.length<25*1024*1024);const before=JSON.stringify(base),s=revisedFish(base);assert.equal(JSON.stringify(base),before);assert.equal(s.modelAsset.license,'CC BY-NC 4.0');assert.equal(s.modelAsset.viewerRig.animationValidated,false);assert(s.behaviors.every(b=>b.rendering.status==='partial'));assert.equal(revisedFish({id:'unrelated'}).id,'unrelated');assert(d.limits.some(x=>x.includes('not fitted')));
 });
 test(name+': original 4K pigmentation, surface detail and separate ocular finish',async()=>{
  const r=(await new NodeIO().registerExtensions(ALL_EXTENSIONS).readBinary(bytes)).getRoot(),body=r.listMaterials().find(m=>!m.getName().includes('ocular')),eye=r.listMaterials().find(m=>m.getName().includes('ocular'));
  assert.equal(r.listMeshes().length,2);assert.equal(body.getRoughnessFactor(),1);assert(body.getNormalTexture());assert(body.getMetallicRoughnessTexture());assert.equal((await sharp(body.getBaseColorTexture().getImage()).metadata()).width,4096);assert(eye);assert.equal(eye.getNormalTexture(),null);assert.equal(eye.getMetallicFactor(),0);for(const m of r.listMeshes())for(const p of m.listPrimitives())assert(p.getAttribute('TEXCOORD_0'));
 });
 test(name+': browser skin agrees with independently evaluated Blender source poses',async()=>{
  const g=await load(bytes),mixer=new T.AnimationMixer(g.scene);
  for(const clip of g.animations){mixer.stopAllAction();const action=mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
   for(const sample of reference[name][clip.name]){action.paused=false;action.enabled=true;mixer.setTime(Math.min(sample.time,clip.duration));const b=renderedBounds(g.scene);for(let i=0;i<3;i++){assert(Math.abs(b.min.getComponent(i)-sample.min[i])<.00008,`${clip.name}: minimum axis ${i} at ${sample.time}: ${b.min.toArray()} / ${sample.min}; ${b.max.toArray()} / ${sample.max}`);assert(Math.abs(b.max.getComponent(i)-sample.max[i])<.00008,`${clip.name}: maximum axis ${i} at ${sample.time}: ${b.min.toArray()} / ${sample.min}; ${b.max.toArray()} / ${sample.max}`);}}
  }
 });
 test(name+': finite studies articulate, frame swept fins, seek deterministically and reset',async()=>{
  const m=prepareAsset(await load(bytes),revisedFish(base),d.modelAsset),meshes=m.digitalLife.meshes;
  const fingerprint=()=>meshes.map(o=>['position','uv','skinIndex','skinWeight'].map(k=>{const a=o.geometry.attributes[k].array;return sha(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}));const original=fingerprint();
  const pose=()=>meshes.flatMap(o=>{o.skeleton.update();return Array.from({length:101},(_,i)=>o.getVertexPosition(Math.floor((o.geometry.attributes.position.count-1)*i/100),new T.Vector3()).applyMatrix4(o.matrixWorld).toArray()).flat();}),rest=pose();
  for(const b of d.behaviors){let delta=0;for(const f of [0,.1,.25,.45,.5,.7,.9,1]){animateAsset(m,b.id,f*b.studyDuration);const p=pose();assert(p.every(Number.isFinite));p.forEach((v,i)=>delta=Math.max(delta,Math.abs(v-rest[i])));assert(m.motionBounds[b.id].containsBox(renderedBounds(m.root)), b.id+" "+f+" "+JSON.stringify(renderedBounds(m.root))+" "+JSON.stringify(m.motionBounds[b.id]));}assert(delta>.01);
   animateAsset(m,b.id,.5);const p=pose();animateAsset(m,b.id,1.7);animateAsset(m,b.id,.5);assert.deepEqual(pose(),p);animateAsset(m,b.id,m.movementStudy.duration);const end=pose();animateAsset(m,b.id,1e6);assert.deepEqual(pose(),end);assert.equal(m.root.userData.movementStudy.stage,'Study complete');animateAsset(m,'observe',0);assert.deepEqual(pose(),rest);
  }
  assert.deepEqual(fingerprint(),original);assert(m.root.userData.hideStudioGround);
 });
}
