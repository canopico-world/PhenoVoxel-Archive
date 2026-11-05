import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import * as T from 'three';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareAsset,animateAsset} from './asset-motion.js';
import {rissoDatabaseAt678} from './risso-history-v0679.mjs';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const read=f=>JSON.parse(fs.readFileSync(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const db=read('species.json'),ledger=read('risso-revisions-v0679.json'),registry=read('risso-assets-v0679.json'),proof=read('risso-build-v0679.json'),s=db.species.find(s=>s.id==='grampus-griseus'),a=registry.models[s.id];
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);

test('Risso source separation preserves the other340 records and all deposited sequence records',()=>{
 assert.equal(db.version,'0.6.79');assert.equal(db.species.length,341);
 const old=rissoDatabaseAt678(db);
 assert.equal(sha(JSON.stringify(old)),ledger.parentDatabaseJsonSha256);
 assert.equal(sha(JSON.stringify(db.species.filter(x=>x.id!==s.id))),ledger.unchanged340Sha256);
 for(const record of db.species){const prior=old.species.find(p=>p.id===record.id);for(const k of ['id','commonName','scientificName','taxonomy','photograph','occurrences','molecular'])assert.deepEqual(record[k],prior[k]);}
 assert.equal(s.appearanceReference.author,'Major');assert.equal(s.appearanceReference.editable,false);assert.equal(s.appearanceReference.localGeometryIncluded,false);
 assert.equal(a.author,'ivan.geraldo');assert.equal(a.license,'CC BY 4.0');assert.notEqual(a.source,s.appearanceReference.url);
 assert.equal(s.review.photorealismValidated,false);assert.deepEqual(Object.keys(registry.models),['grampus-griseus']);
});

test('The portable Risso has continuous body/eye surfaces, independent optical maps and verified provenance',async()=>{
 const bytes=fs.readFileSync(a.localFile);assert.equal(sha(bytes),a.sha256);assert.equal(sha(bytes),proof.assetSha256);assert.equal(bytes.length,a.bytes);
 const d=await io.readBinary(bytes),meshes=d.getRoot().listMeshes();assert.equal(meshes.length,3);
 assert.equal(d.getRoot().listSkins().length,0);assert.equal(d.getRoot().listAnimations().length,0);
 const mat=meshes[0].listPrimitives()[0].getMaterial();assert.equal(mat.getMetallicFactor(),0);assert.equal(mat.getNormalTexture(),null);
 assert.equal((await sharp(mat.getBaseColorTexture().getImage()).metadata()).width,4096);
 assert.equal((await sharp(mat.getMetallicRoughnessTexture().getImage()).metadata()).width,2048);
 for(const mesh of meshes)for(const p of mesh.listPrimitives())for(const name of ['POSITION','NORMAL','TEXCOORD_0']){const attr=p.getAttribute(name);assert.ok(attr);for(const v of attr.getArray())assert.ok(Number.isFinite(v));}
 assert.equal(d.getRoot().getExtras().photorealismValidated,false);assert.equal(proof.noMajorGeometryOrTexturesCopied,true);
 assert.equal(sha(fs.readFileSync('model-cetacean-grampus-griseus-v0678.glb')),proof.sourceInputSha256);
});

test('Risso strokes continue past15seconds with attached eyes, unchanged UVs and an exact neutral reset',async()=>{
 const bytes=fs.readFileSync(a.localFile),g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const m=prepareAsset(g,s,a),r=m.cetaceanSource;assert.equal(m.cet16.version,'0.6.79');assert.equal(r.parts.length,3);
 const uvs=r.parts.map(p=>p.mesh.geometry.attributes.uv.array.slice()),indices=r.parts.map(p=>p.mesh.geometry.index.array.slice());
 for(const time of [.6,2.4,15.3]){animateAsset(m,'swim',time);let posterior=0;
  for(let k=0;k<r.parts.length;k++){const p=r.parts[k],positions=p.mesh.geometry.attributes.position.array;assert.deepEqual(p.mesh.geometry.attributes.uv.array,uvs[k]);assert.deepEqual(p.mesh.geometry.index.array,indices[k]);
   for(let i=0;i<positions.length;i++){assert.ok(Number.isFinite(positions[i]));if(k>0)assert.ok(Math.abs(positions[i]-p.neutral[i])<1e-6);else if(p.neutral[i-i%3]<-.8)posterior=Math.max(posterior,Math.abs(positions[i]-p.neutral[i]));}}
  assert.ok(posterior>.0001,'Posterior stroke stopped at '+time);
 }
 animateAsset(m,'spindive',8);assert.ok(new T.Vector3(1,0,0).applyQuaternion(r.pivot.quaternion).y<-.6);
 animateAsset(m,'observe',0);for(const p of r.parts)assert.deepEqual(p.mesh.geometry.attributes.position.array,p.neutral);
 m.root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});

test('The downloadable Blender project and authored artwork match their release records',()=>{
 const b=fs.readFileSync('risso-editable-v0679.blend');assert.equal(b.length,proof.nativeProjectBytes);assert.equal(sha(b),proof.nativeProjectSha256);assert.ok(b.length<25000000);
 assert.equal(sha(fs.readFileSync('risso-rake-mask-v0679.png')),proof.authoredRakeMaskSha256);
 for(const view of ['head','whole','stroke'])assert.ok(fs.statSync('risso-blender-v0679-'+view+'.jpg').size>10000);
 for(const script of ['blender','polish','export'])assert.ok(fs.statSync('risso-'+script+'-v0679.py').size>1000);
 assert.match(fs.readFileSync('RISSO-LICENSES-v0679.md','utf8'),/Independent anatomical, biomechanical and visual validation remains pending/);
});
