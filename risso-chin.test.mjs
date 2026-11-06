import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import sharp from 'sharp';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareAsset,animateAsset} from './asset-motion.js';import {rissoDatabaseAt680} from './risso-history-v0681.mjs';
const read=f=>JSON.parse(fs.readFileSync(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),db=read('species.json'),s=db.species.find(s=>s.id==='grampus-griseus'),a=read('risso-assets-v0681.json').models[s.id];
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
test('Risso chin correction preserves the other species and removes the embedded viewer',()=>{
 const ledger=read('risso-revisions-v0681.json');assert.equal(sha(JSON.stringify(rissoDatabaseAt680(db))),ledger.parentDatabaseJsonSha256);
 assert.equal(sha(JSON.stringify(db.species.filter(x=>x.id!==s.id))),ledger.unchanged340Sha256);
 assert.equal(s.appearanceReference,undefined);assert.equal(s.visual.cetaceanVersion,'0.6.81');
 const ui=fs.readFileSync('risso-reference.js','utf8');assert.doesNotMatch(ui,/iframe|embedUrl|createElement\(['"]iframe/);assert.match(ui,/study.hidden=false/);
});
test('Portable Blender skin has valid geometry and independent pigment, roughness and micro-normal maps',async()=>{
 const bytes=fs.readFileSync(a.localFile);assert.equal(sha(bytes),a.sha256);const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).readBinary(bytes);
 assert.equal(doc.getRoot().listMeshes().length,3);const mat=doc.getRoot().listMeshes()[0].listPrimitives()[0].getMaterial();
 for(const [tex,size]of [[mat.getBaseColorTexture(),4096],[mat.getMetallicRoughnessTexture(),2048],[mat.getNormalTexture(),2048]])assert.equal((await sharp(tex.getImage()).metadata()).width,size);
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives())for(const name of ['POSITION','NORMAL','TEXCOORD_0'])for(const v of p.getAttribute(name).getArray())assert.ok(Number.isFinite(v));
 assert.equal(read('risso-build-v0681.json').closedSkinBoundaryEdges,0);assert.equal(mat.getMetallicFactor(),0);assert.equal(sha(fs.readFileSync(a.nativeProject)),read('risso-build-v0681.json').nativeProjectSha256);
});
test('Revised eyes stay attached through ongoing strokes and the body resets exactly',async()=>{
 const b=fs.readFileSync(a.localFile),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');const m=prepareAsset(g,s,a),parts=m.cetaceanSource.parts;
 const uv=parts.map(p=>p.mesh.geometry.attributes.uv.array.slice());
 for(const t of [.6,3.1,16.4]){animateAsset(m,'swim',t);let motion=0;for(let k=0;k<parts.length;k++){const p=parts[k],v=p.mesh.geometry.attributes.position.array;assert.deepEqual(p.mesh.geometry.attributes.uv.array,uv[k]);for(let i=0;i<v.length;i++){assert.ok(Number.isFinite(v[i]));if(k)assert.ok(Math.abs(v[i]-p.neutral[i])<1e-6);else motion=Math.max(motion,Math.abs(v[i]-p.neutral[i]));}}assert.ok(motion>1e-4);}
 animateAsset(m,'observe',0);for(const p of parts)assert.deepEqual(p.mesh.geometry.attributes.position.array,p.neutral);
});
