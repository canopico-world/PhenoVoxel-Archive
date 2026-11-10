import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as T from 'three';
import {prepareAsset,animateAsset} from './asset-motion.js';
import {renderedBounds} from './camera-fit.js';
import {readPackedModel} from './model-packed.js';
import {sensoryProfile} from './sensory-evidence.js';
import {sensoryAccess} from './sensory-access.js';
const read=f=>JSON.parse(fs.readFileSync(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const asset=read('specimen-assets-v0709.json').models['oratosquilla-oratoria'],s=read('sensory-specimens-v0705.json').species.find(s=>s.id==='oratosquilla-oratoria');
const raw=gunzipSync(Buffer.concat(asset.parts.map(p=>fs.readFileSync(p.file))));
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:3072,height:3072,close(){}});
test('Japanese source stays a distinct taxon, carries CC0 provenance, and exposes only an evidence-linked sensory hypothesis',()=>{
 assert.equal(s.scientificName,'Oratosquilla oratoria');assert.equal(asset.license,'CC0');assert.deepEqual(s.modelAsset,asset);assert.equal(s.referenceOnly,false);assert.equal(s.behaviors[0].rendering.status,'unavailable');assert.equal(s.review.animationValidated,false);assert.equal(sensoryAccess(sensoryProfile(s)).maintenance,false);assert.deepEqual(sensoryAccess(sensoryProfile(s)).channels,['vision']);assert.match(sensoryProfile(s).tag,/hypothesis/);
 assert.ok(read('sensory-specimens-v0705.json').species.find(x=>x.id==='squilla-empusa').relatedSpecimens.some(x=>x.id===s.id));
});
test('Packed transport verifies every part and reconstructs byte-identical GLB data',async()=>{
 const parts=asset.parts.map(p=>({...p,url:p.file}));for(const p of parts){assert.ok(p.bytes<25000000);assert.equal(sha(fs.readFileSync(p.file)),p.sha256);}
 const fetchImpl=async u=>new Response(fs.readFileSync(u));const b=await readPackedModel(parts,asset.decodedSha256,{fetchImpl,subtle:crypto.webcrypto.subtle});assert.equal(sha(Buffer.from(b)),sha(raw));assert.equal(sha(raw),asset.sha256);
 await assert.rejects(readPackedModel(parts,'0'.repeat(64),{fetchImpl,subtle:crypto.webcrypto.subtle}),/decoded specimen/);
 await assert.rejects(readPackedModel(parts,asset.decodedSha256,{fetchImpl:async u=>{const b=Buffer.from(fs.readFileSync(u));b[20]^=1;return new Response(b);},subtle:crypto.webcrypto.subtle}),/verification failed/);
});
test('Source texture maps and static exterior survive; the unrelated cube and scene cameras do not',async()=>{
 const d=await new NodeIO().registerExtensions(ALL_EXTENSIONS).readBinary(raw),r=d.getRoot();assert.equal(r.listMeshes().length,1);assert.equal(r.listMaterials().length,6);assert.equal(r.listTextures().length,6);assert.equal(r.listAnimations().length,0);assert.equal(r.listSkins().length,0);assert.ok(!r.listNodes().some(n=>/Cube|Camera|Light/.test(n.getName())));
 let triangles=0;for(const p of r.listMeshes()[0].listPrimitives()){assert.ok(p.getAttribute('TEXCOORD_0'));assert.ok(p.getMaterial().getBaseColorTexture());assert.equal(p.getMaterial().getMetallicFactor(),0);assert.ok(p.getAttribute('POSITION').getArray().every(Number.isFinite));triangles+=p.getIndices().getCount()/3;}
 assert.equal(triangles,1038399);for(const t of r.listTextures()){assert.equal(t.getMimeType(),'image/jpeg');assert.ok(Math.max(...t.getSize())<=3072);assert.ok(t.getImage().length>100000);}
});
test('Viewer framing stays finite and static inspection does not deform the source or change UVs',async()=>{
 const g=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),''),m=prepareAsset(g,s,asset),meshes=m.sourceStudy707.meshes;
 const snap=()=>meshes.map(o=>({matrix:o.matrixWorld.toArray(),uv:sha(Buffer.from(o.geometry.attributes.uv.array.buffer)),position:sha(Buffer.from(o.geometry.attributes.position.array.buffer))}));const initial=snap();animateAsset(m,'observe',20);assert.deepEqual(snap(),initial);assert.equal(m.root.userData.hideStudioGround,true);const size=renderedBounds(m.root).getSize(new T.Vector3());assert.ok(size.toArray().every(Number.isFinite));assert.ok(Math.max(...size.toArray())<4.01);assert.equal(m.movementStudy.duration,0);
});
test('Japanese DNA preserves its own deposited record, annotations, and explicit translation restrictions',()=>{
 const r=read('molecular-records-v0709.json').records[s.id],e=read('molecular-index-v0709.json').records[s.id];assert.equal(r.organism,'Oratosquilla oratoria');assert.equal(r.accession,'NC_014342.1');assert.equal(r.length,15783);assert.equal(r.sequence.length,r.length);assert.equal(sha(r.sequence),e.sequenceSha256);assert.equal(sha(r.sourceXml),r.sourceXmlSha256);assert.equal(r.features.filter(f=>f.type==='CDS').length,13);assert.ok(r.features.filter(f=>f.type==='CDS').every(f=>f.translationCheck==='matches deposited protein'||f.translationRestriction));assert.equal(r.taxonomicSpecies||r.taxonName,'Oratosquilla oratoria');
});
