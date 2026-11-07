import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import sharp from 'sharp';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import * as T from 'three';
import {prepareAsset,animateAsset} from './asset-motion.js';import {renderedBounds} from './camera-fit.js';import {digitalLifeDatabaseAt683} from './digitallife-history-v0684.mjs';
const read=f=>JSON.parse(fs.readFileSync(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),db=read('species.json'),assets=read('digitallife-assets-v0684.json').models;
test('New records provide schema-required model provenance and visible behavior labels',()=>{
 const schema=read('schema.json'),contract=schema.$defs.species.properties;
 for(const s of db.species.filter(s=>assets[s.id])){for(const k of contract.modelAsset.required)assert.ok(k in s.modelAsset,s.id+' missing '+k);for(const k of contract.modelAsset.properties.viewerRig.required)assert.ok(k in s.modelAsset.viewerRig);assert.match(s.modelAsset.localFile,new RegExp(contract.modelAsset.properties.localFile.pattern));assert.equal(typeof s.visual.scale,'string');assert.ok(s.review.status);for(const b of s.behaviors){for(const k of schema.$defs.behavior.required)assert.ok(k in b);assert.ok(b.label.length);assert.ok(schema.$defs.behavior.properties.id.enum.includes(b.id));}}
});
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
test('Second DigitalLife batch additions preserve every prior record and declare individual scope and licensing',()=>{
 const ledger=read('digitallife-revisions-v0684.json');assert.equal(digitalLifeDatabaseAt683(db).species.length,351);assert.deepEqual(Object.keys(assets),ledger.addedIds);
 for(const id of ledger.addedIds){const s=db.species.find(s=>s.id===id),a=assets[id];assert.equal(s.modelAsset.sha256,a.sha256);assert.ok(a.individual);assert.match(a.license,/^CC BY(?:-NC)? 4.0$/);assert.equal(s.review.animationValidated,false);assert.equal(s.review.independentlyValidated,false);assert.equal(s.taxonomy.matchType,'EXACT');assert.equal(s.sources.find(x=>x.id==='digitallife-source').url,a.source);assert.ok(!a.source.includes('/none-'));}
 const broken=structuredClone(db);broken.species[0].summary+=' changed';assert.throws(()=>digitalLifeDatabaseAt683(broken));
});
test('Native assets retain embedded photographic pigment, UVs and nonmetallic surfaces within the upload budget',async()=>{
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
 for(const a of Object.values(assets)){const b=fs.readFileSync(a.localFile);assert.equal(sha(b),a.sha256);assert.ok(b.length<25*1024*1024);const d=await io.readBinary(b),r=d.getRoot();assert.ok(r.listMeshes().length);assert.ok(r.listTextures().length);
  for(const m of r.listMaterials()){assert.equal(m.getMetallicFactor(),0);if(!m.getBaseColorTexture()){const users=r.listNodes().filter(n=>n.getMesh()?.listPrimitives().some(p=>p.getMaterial()===m)).map(n=>n.getName());assert.match(m.getName()+' '+users.join(' '),/eye|sclera|outer|cornea|claw|lens|contact underside/i);}}
  let detailed=false;for(const t of r.listTextures()){const meta=await sharp(t.getImage()).metadata();if(meta.width>=2048)detailed=true;}assert.ok(detailed);
  for(const mesh of r.listMeshes())for(const p of mesh.listPrimitives()){if(p.getMaterial()?.getBaseColorTexture())assert.ok(p.getAttribute('TEXCOORD_0'));assert.ok(p.getAttribute('POSITION').getArray().every(Number.isFinite));}
 }
});
test('Source animation deforms the retained surface, stays finite, has no studio base, and resets exactly',async()=>{
 for(const [id,a] of Object.entries(assets)){
  const s=db.species.find(s=>s.id===id),b=fs.readFileSync(a.localFile),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''),m=prepareAsset(g,s,a);
  assert.ok(m.digitalLife);assert.equal(m.root.userData.hideStudioGround,true);assert.equal(m.hideDevelopmentLandmarks,true);
  const meshes=m.digitalLife.meshes,uv=meshes.map(o=>o.geometry.attributes.uv?sha(Buffer.from(o.geometry.attributes.uv.array.buffer)):null),samples=()=>meshes.flatMap(o=>{o.skeleton?.update();const n=o.geometry.attributes.position.count;return Array.from({length:Math.min(21,n)},(_,k)=>o.getVertexPosition(Math.floor(k*(n-1)/20),new T.Vector3()).applyMatrix4(o.matrixWorld).toArray()).flat();});
  const initial=samples(),mode=s.behaviors.find(b=>b.rendering.status!=='unavailable')?.id;let changed=0;
  if(mode)for(const t of [.33,1.1,2.7]){animateAsset(m,mode,t);const posed=samples();assert.ok(posed.every(Number.isFinite));posed.forEach((x,i)=>changed=Math.max(changed,Math.abs(x-initial[i])));assert.ok(renderedBounds(m.root).getSize(new T.Vector3()).length()<20);}
  if(mode)assert.ok(changed>1e-5,id+' clip is static');
  animateAsset(m,'observe',0);assert.deepEqual(samples(),initial);meshes.forEach((o,i)=>assert.equal(o.geometry.attributes.uv?sha(Buffer.from(o.geometry.attributes.uv.array.buffer)):null,uv[i]));
 }
});

test('Integrated frog platforms are removed while reconstructed contact areas are disclosed',()=>{const proof=read('digitallife-build-v0684.json').conversion;for(const id of ['atelopus-zeteki','litoria-caerulea']){const p=proof.find(x=>x.id===id);assert.ok(p.supportCleanup[0].removedPlatformFaces>10000);assert.ok(p.supportCleanup[0].contactCaps>0);assert.match(assets[id].biology,/contact|underside/i);}});
