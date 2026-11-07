import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareAsset,animateAsset} from './asset-motion.js';import {renderedBounds} from './camera-fit.js';import {movementDatabaseAt684} from './movement-history-v0685.mjs';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const read=p=>JSON.parse(fs.readFileSync(p)),db=read('species.json'),report=read('movement-studies-v0685.json'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function load(id){const s=db.species.find(s=>s.id===id),b=fs.readFileSync(s.modelAsset.localFile),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');return prepareAsset(g,s,s.modelAsset);}
const sample=m=>m.digitalLife.meshes.flatMap(o=>{o.skeleton?.update();const n=o.geometry.attributes.position.count;return Array.from({length:Math.min(n,501)},(_,i)=>o.getVertexPosition(Math.floor(i*(n-1)/500),new T.Vector3()).applyMatrix4(o.matrixWorld).toArray()).flat();});

test('Movement revisions retain all unrelated records, source binaries and explicit evidence limits',()=>{
 const base=movementDatabaseAt684(db);assert.equal(base.species.length,363);assert.equal(base.version,'0.6.84');
 for(const r of report.records){const s=db.species.find(s=>s.id===r.id);assert.equal(sha(fs.readFileSync(s.modelAsset.localFile)),s.modelAsset.sha256);assert.equal(s.review.animationValidated,false);
  for(const b of s.behaviors){assert.ok(b.studyDuration>0);assert.ok(b.studyStages.length>=4);assert.ok(b.studyStages.every(p=>p.time>=0&&p.time<=b.studyDuration+1e-4));assert.notEqual(b.rendering.status,'unavailable');assert.match(b.timeScale,/illustrative/);assert.ok(b.sourceIds.every(id=>s.sources.some(r=>r.id===id)));}
 }
 const changed=structuredClone(db);changed.species[0].summary+=' changed';assert.throws(()=>movementDatabaseAt684(changed));
});

test('Every selectable study changes the actual surface, holds at end, seeks backwards and restores Observe exactly',async()=>{
 for(const r of report.records){const m=await load(r.id),initial=sample(m),surfaces=m.digitalLife.meshes.map(o=>[o.geometry,o.material,o.geometry.attributes.uv?.array.slice()]);
  for(const b of r.behaviors){let changed=0;
   for(const t of [b.studyDuration*.125,b.studyDuration*.25,b.studyDuration*.55]){animateAsset(m,b.id,t);const now=sample(m);assert.ok(now.every(Number.isFinite));now.forEach((v,i)=>changed=Math.max(changed,Math.abs(v-initial[i])));assert.ok(renderedBounds(m.root).getSize(new T.Vector3()).length()<12);}
   assert.ok(changed>1e-5,r.id+' '+b.id+' did not deform');
   animateAsset(m,b.id,b.studyDuration+.001);const end=sample(m);animateAsset(m,b.id,3600);assert.deepEqual(sample(m),end,r.id+' did not hold endpoint');
   animateAsset(m,b.id,b.studyDuration*.25);const quarter=sample(m);animateAsset(m,b.id,3600);animateAsset(m,b.id,b.studyDuration*.25);assert.deepEqual(sample(m),quarter,r.id+' seek is stateful');
   animateAsset(m,'observe',0);assert.deepEqual(sample(m),initial,r.id+' Observe reset differs');
  }
  m.digitalLife.meshes.forEach((o,i)=>{assert.equal(o.geometry,surfaces[i][0]);assert.equal(o.material,surfaces[i][1]);if(surfaces[i][2])assert.deepEqual(o.geometry.attributes.uv.array,surfaces[i][2]);});
 }
});

test('Buccal animation is localized and does not inflate or translate the entire frog',async()=>{
 for(const id of ['atelopus-zeteki','litoria-caerulea']){const m=await load(id);let count=0,changed=0,max=0;
  for(const o of m.digitalLife.meshes){const a=o.geometry.attributes.position,b=o.geometry.morphAttributes.position[0];for(let i=0;i<a.count;i++){count++;const d=new T.Vector3().fromBufferAttribute(a,i).distanceTo(new T.Vector3().fromBufferAttribute(b,i));if(d>1e-6)changed++;max=Math.max(max,d);}}
  assert.ok(changed>300&&changed/count<.09,id+' throat mask');assert.ok(max>1e-4);animateAsset(m,'rest',.5);assert.deepEqual(m.root.scale.toArray(),[1,1,1]);assert.deepEqual(m.root.position.toArray(),[0,0,0]);
 }
});

test('Flatback drive synchronizes foreflippers, retains shell joints and preserves bone lengths',async()=>{
 const m=await load('natator-depressus'),shell=m.bones.filter(b=>/shell|root_bone/.test(b.name)).map(b=>[b,b.quaternion.clone()]),lengths=m.bones.map(b=>[b,b.position.length()]);
 for(const t of [.2,.75,1.5,2.25,3.75,6]){animateAsset(m,'swim',t);for(const[b,q]of shell)assert.deepEqual(b.quaternion.toArray(),q.toArray());for(const[b,l]of lengths)assert.ok(Math.abs(b.position.length()-l)<1e-9);const pair=m.movementStudy.joints.filter(j=>j.part==='shoulder');assert.ok(Math.abs(pair[0].bone.quaternion.angleTo(pair[0].rest)-pair[1].bone.quaternion.angleTo(pair[1].rest))<1e-6);}
});
