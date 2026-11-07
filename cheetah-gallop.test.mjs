import {movementDatabaseAt690} from './movement-history-v0691.mjs';
import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import crypto from'node:crypto';import * as T from'three';import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import{prepareAsset,animateAsset}from'./asset-motion.js';import{cheetahStep,cheetahSequenceDuration}from'./cheetah-rig.js';import{updateSpecimenLandmarks}from'./surface-landmarks.js';globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))),s=db.species.find(s=>s.id==='acinonyx-jubatus'),a=JSON.parse(fs.readFileSync(new URL('./model-assets.json',import.meta.url))).models[s.id],hash=b=>crypto.createHash('sha256').update(b).digest('hex'),V=()=>new T.Vector3();async function load(){const b=fs.readFileSync(new URL('./'+a.localFile,import.meta.url)),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');return{g,m:prepareAsset(g,s,a)};}

import{cheetahGallopPhase}from './cheetah-gallop-v0691.js';
const gallop=(m,t)=>animateAsset(m,'run',t);
test('cheetah rotary sequence keeps sampled distal surfaces separate',async()=>{
 const{m}=await load(),r=m.surfaceRig.rigs[0],g=r.mesh.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,indices=g.index.array;
 const membership=Array.from({length:p.count},(_,i)=>{if(p.getY(i)>.55)return -1;const weights=[0,0,0,0];for(let k=0;k<4;k++){const b=si.array[i*4+k];if(b>=9)weights[Math.floor((b-9)/4)]+=sw.array[i*4+k];}return Math.max(...weights)>.8?weights.indexOf(Math.max(...weights)):-1;});
 const faces=[[],[],[],[]];for(let i=0;i<indices.length;i+=3){const ids=[indices[i],indices[i+1],indices[i+2]],leg=membership[ids[0]];if(leg>=0&&ids.every(j=>membership[j]===leg))faces[leg].push(ids);}
 assert.ok(faces.every(x=>x.length>600),'distal surface coverage unexpectedly lost');
 const ray=new T.Ray(),hit=V(),pierces=(a,b,tri)=>{const delta=b.clone().sub(a),length=delta.length();if(length<1e-8)return false;ray.set(a,delta.divideScalar(length));if(!ray.intersectTriangle(...tri,false,hit))return false;const distance=hit.distanceTo(a);return distance>1e-6&&distance<length-1e-6;};
 // A sampled regression for distinct distal surfaces, not whole-body collision
 // freedom, soft-tissue contact, measured biomechanics or biological validation.
 for(const action of['gallop'])for(let n=0;n<=160;n++){
  const t=n/40;gallop(m,t);
  const positions=Array.from({length:p.count},(_,i)=>r.mesh.getVertexPosition(i,V()));
  const tris=faces.map(list=>list.map(ids=>{const points=ids.map(i=>positions[i]);return{points,box:new T.Box3().setFromPoints(points)};}));
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(const ta of tris[a])for(const tb of tris[b]){
   if(!ta.box.intersectsBox(tb.box))continue;
   assert.ok(!(ta.points.some((q,i)=>pierces(q,ta.points[(i+1)%3],tb.points))||tb.points.some((q,i)=>pierces(q,tb.points[(i+1)%3],ta.points))),`distal surfaces ${a}/${b} cross during ${action} at ${t}s`);
  }
 }
});


test('rotary gait record is reversible and retains separate physiological limits',()=>{
 const prior=movementDatabaseAt690(db),old=prior.species.find(x=>x.id===s.id),run=s.behaviors.find(b=>b.id==='run');assert.equal(old.behaviors.find(b=>b.id==='run').rendering.status,'unavailable');assert.equal(run.rendering.status,'partial');assert.equal(run.studyDuration,4);assert.match(run.description,/not measured stride time/);assert.match(run.rendering.reason,/forces/);assert.equal(s.review.independentlyValidated,false);assert.equal(hash(fs.readFileSync(new URL('./'+a.localFile,import.meta.url))),a.sourceSha256);
});
test('rotary contact sequence preserves lengths, skin, paw support and two aerial intervals',async()=>{
 const{m}=await load(),r=m.surfaceRig.rigs[0],g=r.mesh.geometry,attrs=Object.fromEntries(Object.entries(g.attributes).map(([k,v])=>[k,Array.from(v.array)])),material=r.mesh.material,lengths=r.bones.map(b=>b.position.length()),previous=new Map();let flights=0,inFlight=false;
 for(let n=0;n<=240;n++){const t=n/60;gallop(m,t);assert.equal(r.mesh.geometry,g);assert.equal(r.mesh.material,material);let support=0;
 for(const f of r.feet){const q=cheetahGallopPhase(f.index,t),paw=r.bones[f.upper+3].getWorldPosition(V()),target=m.root.localToWorld(f.gallopTarget.clone());assert.ok(paw.distanceTo(target)<.0001,'unreachable foot target');let low=Infinity;for(const i of f.samples)low=Math.min(low,r.mesh.getVertexPosition(i,V()).applyMatrix4(r.mesh.matrixWorld).y);assert.ok(low>=.1299,'paw below support plane');if(q.support){support++;assert.ok(Math.abs(low-.13)<.0001);if(previous.get(f.index)?.support)assert.ok(paw.distanceTo(previous.get(f.index).paw)<.0001,'support paw slips');}previous.set(f.index,{support:q.support,paw});}
 if(!support&&!inFlight)flights++;inFlight=!support;assert.ok(r.bones.every((b,i)=>i===0||Math.abs(b.position.length()-lengths[i])<1e-8));const bounds=new T.Box3().setFromObject(m.root,true);assert.ok(m.motionBounds.run.containsBox(bounds),'camera envelope excludes pose');
 }
 assert.equal(flights,2);for(const[k,v]of Object.entries(attrs))assert.deepEqual(Array.from(g.attributes[k].array),v,'surface attribute changed: '+k);
 assert.deepEqual([0,.32,2,2.32].map(t=>r.feet.filter(f=>cheetahGallopPhase(f.index,t).q<.000001).map(f=>f.index)),[[3],[1],[0],[2]]);
});
test('gallop is continuous, finite and deterministic, and Observe restores the same corrected surface',async()=>{
 const{m}=await load(),r=m.surfaceRig.rigs[0],pose=()=>r.bones.map(b=>({p:b.getWorldPosition(V()).toArray(),q:b.getWorldQuaternion(new T.Quaternion()).toArray()}));animateAsset(m,'observe',0);const neutral=pose();
 for(const boundary of[.32,.72,1.04,2,2.32,2.72,3.04]){gallop(m,boundary-.00001);const a=pose();gallop(m,boundary+.00001);const b=pose();assert.ok(a.every((v,i)=>v.p.every((x,k)=>Math.abs(x-b[i].p[k])<.001)),'contact transition jumps');}
 gallop(m,4);const end=pose();gallop(m,100);assert.deepEqual(pose(),end);assert.equal(m.movementStudy.duration,4);gallop(m,1.6);const gathered=pose();gallop(m,3.5);gallop(m,1.6);assert.deepEqual(pose(),gathered);animateAsset(m,'observe',0);assert.deepEqual(pose(),neutral);assert.equal(m.movementStudy,undefined);
 const p=r.mesh.geometry.attributes.position,groups=new Map();for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e5)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}for(const t of[0,.6,1.6,2.4,3.5,4]){gallop(m,t);for(const ids of groups.values()){if(ids.length<2)continue;const anchor=r.mesh.getVertexPosition(ids[0],V());for(const i of ids.slice(1))assert.ok(anchor.distanceTo(r.mesh.getVertexPosition(i,V()))<.00015,'UV seam opened');}}
});

test('rotary surface avoids the former tail web and large chest edge stretches',async()=>{
 const{m}=await load(),r=m.surfaceRig.rigs[0],g=r.mesh.geometry,p=g.attributes.position,ix=g.index.array,edges=new Map();
 for(let j=0;j<ix.length;j+=3)for(let k=0;k<3;k++){const a=ix[j+k],b=ix[j+(k+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');if(edges.has(key))continue;const length=V().fromBufferAttribute(p,a).distanceTo(V().fromBufferAttribute(p,b));if(length>.005)edges.set(key,{a,b,length});}
 // A gross deformation regression against the rejected 14–25x webs, not a
 // calibrated skin-strain limit or proof of biological soft-tissue mechanics.
 for(let n=0;n<=80;n++){gallop(m,n/20);const deformed=Array.from({length:p.count},(_,i)=>r.mesh.getVertexPosition(i,V()));for(const {a,b,length}of edges.values())assert.ok(deformed[a].distanceTo(deformed[b])/length<3.5,`surface web at ${n/20}s, edge ${a}/${b}`);}
});
