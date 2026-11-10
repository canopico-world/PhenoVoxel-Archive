import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as T from 'three';
import {prepareAsset,animateAsset,selectAssetMotion} from './asset-motion.js';
import {renderedBounds} from './camera-fit.js';
const read=f=>JSON.parse(fs.readFileSync(f)),models=read('specimen-assets-v0707.json').models,species=read('sensory-specimens-v0705.json').species;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
test('New sources retain taxon identity, credits, noncommercial restrictions and explicit validation limits',()=>{
 assert.deepEqual(Object.keys(models),['squilla-empusa','gloydius-blomhoffii']);
 for(const[id,a]of Object.entries(models)){const s=species.find(s=>s.id===id);assert.deepEqual(s.modelAsset,a);assert.equal(s.referenceOnly,false);assert.equal(s.review.animationValidated,false);assert.equal(s.molecularStatus,'verified-deposited-record');assert.equal(sha(fs.readFileSync(a.localFile)),a.sha256);assert.ok(fs.statSync(a.localFile).size<25*1024*1024);}
 assert.equal(models['squilla-empusa'].license,'CC BY-NC 4.0');
 assert.equal(species.find(s=>s.id==='squilla-empusa').behaviors[0].rendering.status,'unavailable');
 assert.ok(species.find(s=>s.id==='rangifer-tarandus').referenceOnly);
});
test('Shrimp derivative has nonuniform pigment on all four retained parts and a bounded mobile triangle count',async()=>{
 const d=await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(models['squilla-empusa'].localFile),r=d.getRoot();
 assert.equal(r.listMeshes().length,4);assert.equal(r.listAnimations().length,0);assert.equal(r.listTextures().length,0);
 let triangles=0,vertexCount=0;
 for(const m of r.listMeshes())for(const p of m.listPrimitives()){
  const pos=p.getAttribute('POSITION'),col=p.getAttribute('COLOR_0');assert.ok(col);assert.equal(pos.getCount(),col.getCount());
  assert.ok(pos.getArray().every(Number.isFinite));assert.ok(col.getArray().every(Number.isFinite));
  const values=col.getArray(),reds=new Set();for(let i=0;i<col.getCount();i++)reds.add(Math.round(values[i*col.getElementSize()]*1000));assert.ok(reds.size>8,m.getName()+' pigment must vary between vertices, not only RGBA channels');
  const coordinates=pos.getArray();for(let i=0;i<coordinates.length;i+=3){assert.ok(Math.abs(coordinates[i])<.12);assert.ok(coordinates[i+1]>=-.001&&coordinates[i+1]<.046);assert.ok(Math.abs(coordinates[i+2])<.05);}
  triangles+=p.getIndices().getCount()/3;vertexCount+=pos.getCount();
  assert.equal(p.getMaterial().getMetallicFactor(),0);
 }
 assert.ok(triangles>50000&&triangles<300000,triangles);assert.ok(vertexCount>25000);
});
test('Viper preserves the exact supplied mesh, photographic texture, skeleton and source clip',async()=>{
 const a=models['gloydius-blomhoffii'];
 assert.equal(sha(fs.readFileSync(a.localFile)),'74c7b05d5bcf0f1583dc65c171293e0a9f6c5c884e15b231a27aec86807b30b4');
 const d=await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(a.localFile),r=d.getRoot();
 assert.equal(r.listTextures().length,1);assert.equal(r.listSkins().length,1);assert.equal(r.listAnimations().length,1);
 assert.equal(r.listMeshes()[0].listPrimitives()[0].getAttribute('POSITION').getCount(),40506);
});
test('Creator motion deforms the skin, clamps endpoints, supports arbitrary time order, and resets exactly without texture changes',async()=>{
 for(const[id,a]of Object.entries(models)){
  const b=fs.readFileSync(a.localFile),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''),s=species.find(s=>s.id===id),m=prepareAsset(g,s,a),meshes=m.sourceStudy707.meshes;
  const snapshots=()=>meshes.flatMap(o=>{o.skeleton?.update();const count=o.geometry.attributes.position.count;return Array.from({length:17},(_,k)=>o.getVertexPosition(Math.floor(k*(count-1)/16),new T.Vector3()).applyMatrix4(o.matrixWorld).toArray()).flat();});
  const uv=meshes.map(o=>o.geometry.attributes.uv?sha(Buffer.from(o.geometry.attributes.uv.array.buffer)):null),initial=snapshots();assert.equal(m.root.userData.hideStudioGround,true);
  if(id==='gloydius-blomhoffii'){
   assert.match(selectAssetMotion(m,'crawl'),/unvalidated/);animateAsset(m,'crawl',2.48);const middle=snapshots();assert.ok(middle.some((v,i)=>Math.abs(v-initial[i])>.001));
   animateAsset(m,'crawl',100);const end=snapshots();assert.equal(m.root.userData.movementStudy.complete,true);assert.ok(m.movementStudy.duration<5);
   animateAsset(m,'crawl',m.movementStudy.duration);assert.deepEqual(snapshots(),end);animateAsset(m,'crawl',s.behaviors[0].studyStages.at(-1).time);assert.equal(m.root.userData.movementStudy.complete,true);assert.deepEqual(snapshots(),end);animateAsset(m,'crawl',2.48);assert.deepEqual(snapshots(),middle);
   for(const t of [0,1.24,2.48,3.72,4.958333492]){animateAsset(m,'crawl',t);const bounds=renderedBounds(m.root);assert.ok(bounds.getSize(new T.Vector3()).length()<6);assert.ok(Math.abs(bounds.getCenter(new T.Vector3()).x)<1);assert.ok(snapshots().every(Number.isFinite));}
  }else{animateAsset(m,'observe',100);assert.deepEqual(snapshots(),initial);}
  animateAsset(m,'observe',0);assert.deepEqual(snapshots(),initial);meshes.forEach((o,i)=>assert.equal(o.geometry.attributes.uv?sha(Buffer.from(o.geometry.attributes.uv.array.buffer)):null,uv[i]));
 }
});
