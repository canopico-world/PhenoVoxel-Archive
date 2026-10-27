import{beforeRorqualFeeding}from'./revision-baseline.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareAsset,animateAsset} from './asset-motion.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';

const read=f=>JSON.parse(fs.readFileSync(new URL('./'+f,import.meta.url),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const db=read('species.json'),s=beforeRorqualFeeding(db.species).find(x=>x.id==='balaenoptera-musculus');
const r=read('blue-whale-proportions-v0648.json'),old=r.preservation.beforeTargetRecord;
const bytes=fs.readFileSync(new URL('./'+s.modelAsset.localFile,import.meta.url));

test('blue-whale appearance correction preserves identity, all307 other records and the original photograph',()=>{
 assert.equal(db.species.filter(x=>x.review.releasePassId!=='cetacean-expansion-2026-10-28').length,308);assert.equal(r.newSpecies,0);
 assert.equal(r.preservation.unaffectedRecordHashes.length,307);const before=beforeRorqualFeeding(db.species);
 for(const x of r.preservation.unaffectedRecordHashes)assert.equal(hash(JSON.stringify(before.find(s=>s.id===x.id))),x.sha256,x.id);
 for(const key of ['id','scientificName','commonName','taxonomy','photograph','occurrences'])assert.deepEqual(s[key],old[key]);
 assert.equal(s.modelAsset.uid,old.modelAsset.uid);assert.equal(s.modelAsset.sourceSha256,old.modelAsset.sourceSha256);
 assert.equal(s.modelAsset.license,'CC BY 4.0');assert.notEqual(s.modelAsset.sha256,old.modelAsset.sha256);
 assert.equal(s.review.independentlyValidated,false);assert.equal(s.behaviors.find(b=>b.id==='forage').rendering.status,'unavailable');
 assert.equal(s.anatomy.length,4);assert.match(s.anatomy[3].name,/posterior dorsal fin/);
 assert.equal(read('behavior-capabilities-v0648.json').counts.available,11);
});

test('actual corrected neutral skin has a slender complete envelope and a low fin in the selected posterior region',async()=>{
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
 const g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const m=prepareAsset(g,s,s.modelAsset);animateAsset(m,'observe',0);updateSpecimenLandmarks(m);
 const b=new T.Box3().setFromObject(m.root,true),size=b.getSize(new T.Vector3());
 // These are regression limits for the authored model, not natural-animal
 // morphometric ranges or evidence of a specimen fit.
 assert(size.x/size.y>6.5&&size.x/size.y<8.5,'stocky or flattened/needle envelope');
 assert(size.x>3.7&&b.min.x< -1.8&&b.max.x>1.8,'head or flukes truncated');
 assert.equal(m.featureBindings.length,4);assert.equal(m.features.length,4);
 const binding=m.featureBindings[3],fin=m.root.localToWorld(m.features[3].clone());
 const fraction=(b.max.x-fin.x)/size.x;assert(fraction>.70&&fraction<.82,'fin returned to the anterior two-thirds region');
 assert(binding.indices.length>10);const tipBox=new T.Box3();
 for(const i of binding.indices)tipBox.expandByPoint(binding.mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(binding.mesh.matrixWorld));
 assert(tipBox.getSize(new T.Vector3()).y/size.x<.025,'selected dorsal-fin exterior is too tall');
 assert(m.root.userData.anatomyUnderside.includes(2));assert(b.min.y>.12);
});

test('delivered grey-blue atlas suppresses a stark white field while retaining spatial tone variation',async()=>{
 const length=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+length)),bin=bytes.subarray(28+length);
 const view=j.bufferViews[j.images[0].bufferView],image=bin.subarray(view.byteOffset,view.byteOffset+view.byteLength);
 assert.equal(hash(image),r.sourcePreservation.derivedBaseAtlasSha256);
 const {data,info}=await sharp(image).removeAlpha().raw().toBuffer({resolveWithObject:true});
 let min=255,max=0;for(let i=0;i<data.length;i+=info.channels){min=Math.min(min,data[i]);max=Math.max(max,data[i]);assert(data[i+2]>data[i]+25);assert(data[i+1]>data[i]+15);assert(Math.max(data[i],data[i+1],data[i+2])<190);}
 assert(max-min>18,'authored atlas lost all spatial variation');
 assert.match(s.modelAsset.changes,/24-pixel/);assert.match(s.modelAsset.changes,/not photographic sampling/);
 assert.equal(r.photographs[1].downloadSha256,'53b2a1ed8afa31d1b0d947e0e8ada2c0de30f7430170829515a7c50eb6e9927b');
 assert.equal(hash(fs.readFileSync(new URL('./'+r.photographs[1].localFile,import.meta.url))),r.photographs[1].sha256);
});
