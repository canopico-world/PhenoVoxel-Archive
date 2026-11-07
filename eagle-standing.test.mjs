import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {prepareAsset,animateAsset} from './asset-motion.js';import {renderedBounds} from './camera-fit.js';
import {movementDatabaseAt691} from './movement-history-v0692.mjs';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const json=f=>JSON.parse(fs.readFileSync(new URL(f,import.meta.url))),a=json('./bird-assets-v0670.json').models['haliaeetus-leucocephalus'],db=json('./species.json'),s=db.species.find(s=>s.id==='haliaeetus-leucocephalus'),V=()=>new T.Vector3(),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function make(){const b=fs.readFileSync(new URL('./'+a.localFile,import.meta.url)),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');return prepareAsset(g,s,a);}
test('eagle study is documented without clearing pending capture or rest mechanisms',()=>{
 const before=movementDatabaseAt691(db),old=before.species.find(x=>x.id===s.id),look=s.behaviors.find(b=>b.id==='look');assert.equal(before.version,'0.6.91');assert.equal(old.behaviors.some(b=>b.id==='look'),false);assert.equal(look.studyDuration,8);assert.match(look.timeScale,/uncalibrated/);assert.equal(look.rendering.status,'partial');assert.match(look.rendering.reason,/eye movements/);for(const id of ['forage','rest'])assert.equal(s.behaviors.find(b=>b.id===id).rendering.status,old.behaviors.find(b=>b.id===id).rendering.status);const bad=structuredClone(db);bad.species[0].summary+=' altered';assert.throws(()=>movementDatabaseAt691(bad));
});
test('eagle standing rig retains immutable source and surface attributes',async()=>{
 assert.equal(sha(fs.readFileSync(new URL('./'+a.localFile,import.meta.url))),a.sha256);const m=await make(),r=m.birdRevision.standingRigs[0],g=r.mesh.geometry;
 for(const k of ['position','normal','uv'])assert.deepEqual(g.attributes[k].array,r.sourceGeometry.attributes[k].array);assert.deepEqual(g.index.array,r.sourceGeometry.index.array);
 const p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;for(let i=0;i<p.count;i++){let sum=0;for(let j=0;j<4;j++){assert.ok(si.getComponent(i,j)<3);sum+=sw.getComponent(i,j);}assert.ok(Math.abs(sum-1)<1e-6);}
 assert.ok(r.mesh.material.map);assert.ok(r.mesh.material.normalMap);assert.ok(r.mesh.material.roughnessMap);
});
test('standing head turns preserve feet, folded lower body, rigid upper head and smooth seams',async()=>{
 const m=await make(),r=m.birdRevision.standingRigs[0],p=r.mesh.geometry.attributes.position,source=Array.from({length:p.count},(_,i)=>V().fromBufferAttribute(p,i)),head=source.map((v,i)=>v.y>1.15?i:-1).filter(i=>i>=0),seams=new Map(),lengths=r.bones.map(b=>b.position.length());
 for(let i=0;i<p.count;i++){const key=source[i].toArray().map(v=>Math.round(v*1e6)).join(',');if(!seams.has(key))seams.set(key,[]);seams.get(key).push(i);}
 for(let n=0;n<=64;n++){
  animateAsset(m,'look',n/8);const posed=source.map((_,i)=>r.mesh.getVertexPosition(i,V()));
  for(let i=0;i<p.count;i++)if(source[i].y<=.88)assert.ok(posed[i].distanceTo(source[i])<1e-7,'supported lower surface moves');
  for(let i=1;i<head.length;i+=17)assert.ok(Math.abs(posed[head[i]].distanceTo(posed[head[0]])-source[head[i]].distanceTo(source[head[0]]))<1e-6,'upper head changes shape');
  for(const ids of seams.values())for(const i of ids.slice(1))assert.ok(posed[i].distanceTo(posed[ids[0]])<.000003,'feather/UV seam opens');
  assert.ok(m.motionBounds.look.containsBox(renderedBounds(m.root)));assert.ok(r.bones.every((b,i)=>Math.abs(b.position.length()-lengths[i])<1e-12));assert.ok(m.featureBindings.every(b=>b.mesh===r.mesh));assert.ok(m.birdRevision.flightParts.every(p=>!p.visible));
 }
});
test('standing look is finite, reversible, continuous and restores prior flight state',async()=>{
 const m=await make(),r=m.birdRevision.standingRigs[0],pose=()=>r.bones.map(b=>b.quaternion.toArray());animateAsset(m,'look',0);const neutral=pose();animateAsset(m,'look',2);const left=pose();assert.notDeepEqual(left,neutral);assert.equal(m.root.userData.movementStudy.stage,'First sideways head turn');animateAsset(m,'look',6);assert.notDeepEqual(pose(),left);animateAsset(m,'look',2);assert.deepEqual(pose(),left);
 animateAsset(m,'look',8);assert.deepEqual(pose(),neutral);assert.equal(m.movementStudy.complete,true);animateAsset(m,'look',99);assert.deepEqual(pose(),neutral);assert.equal(m.movementStudy.time,8);
 for(const t of [.6,1.4,2.6,3.4,4.6,5.4,6.6,7.4]){animateAsset(m,'look',t-.00001);const before=r.bones.map(b=>b.quaternion.clone());animateAsset(m,'look',t+.00001);assert.ok(before.every((q,i)=>q.angleTo(r.bones[i].quaternion)<.00001));}
 animateAsset(m,'stand',0);assert.deepEqual(pose(),neutral);assert.equal(m.movementStudy,undefined);assert.equal(m.root.userData.movementStudy,undefined);animateAsset(m,'fly',2);assert.equal(m.movementStudy.duration,8);assert.ok(m.birdRevision.flightParts.every(p=>p.visible));assert.ok(m.birdRevision.standingParts.every(p=>!p.visible));
});
