import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import * as T from 'three';
import {prepareAsset,animateAsset} from './asset-motion.js';import {renderedBounds} from './camera-fit.js';
import {skeletonSegments} from './fruitfly-neural-v0715.js';
const data=JSON.parse(fs.readFileSync('fruitfly-data-v0715.json')),s=data.species,a=s.modelAsset,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('fruit fly is an accepted dipteran with a separately identified female scientific body source',()=>{
 assert.equal(s.taxonomy.order,'Diptera');assert.equal(s.taxonomy.family,'Drosophilidae');assert.equal(s.taxonomy.usageKey,5073713);assert.equal(s.referenceOnly,false);assert.equal(a.license,'Apache-2.0');assert.match(a.biology,/female/);assert.equal(a.rigged,true);assert.equal(s.review.animationValidated,false);assert.ok(s.behaviors.every(b=>b.rendering.status==='unavailable'));
 assert.ok(fs.readFileSync('app.js','utf8').includes('fruitfly.species'));assert.ok(fs.readFileSync('asset-loader.js','utf8').includes('[fruitfly.species.id]:fruitfly.species.modelAsset'));
});
test('local GLB preserves body parts and the source rig, with no base, external dependencies or invented clip',async()=>{
 const bytes=fs.readFileSync(a.localFile);assert.equal(hash(bytes),a.sha256);assert.ok(bytes.length<10_000_000);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));assert.equal(json.meshes.length,68);assert.equal(json.skins.length,1);assert.equal(json.skins[0].joints.length,86);assert.equal(json.animations?.length||0,0);assert.equal(json.images?.length||0,0);
 assert.ok(!json.nodes.some(n=>n.name==='Plane.001'));for(const part of ['wing_left','wing_right','haltere_left','haltere_right','head','thorax','haustellum','antenna_left','antenna_right'])assert.ok(json.meshes.some(m=>m.name===part),part);
 for(const pair of ['T1','T2','T3'])for(const side of ['left','right'])assert.ok(json.meshes.some(m=>m.name===`tarsal_claw_${pair}_${side}`));
 const membrane=json.materials.find(m=>m.name==='membrane');assert.equal(membrane.alphaMode,'BLEND');assert.equal(membrane.pbrMetallicRoughness.metallicFactor,0);
 const g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const m=prepareAsset(g,s,a),before=renderedBounds(m.root).getSize(new T.Vector3()).toArray();assert.ok(before.every(Number.isFinite));assert.ok(Math.max(...before)<4.1);assert.equal(m.root.userData.hideStudioGround,true);assert.equal(m.forward,-1);assert.ok(renderedBounds(g.scene.getObjectByName("head")).getCenter(new T.Vector3()).x < renderedBounds(g.scene.getObjectByName("thorax")).getCenter(new T.Vector3()).x);animateAsset(m,'observe',13);assert.deepEqual(renderedBounds(m.root).getSize(new T.Vector3()).toArray(),before);assert.equal(m.movementStudy.duration,0);
});
test('three identified coarse neuron skeletons retain exact source bytes and parent connectivity',()=>{
 assert.deepEqual(data.neurons.map(n=>n.id),['169550','171728','44303']);
 for(const n of data.neurons){const bytes=fs.readFileSync(n.file);assert.equal(bytes.length,n.bytes);assert.equal(hash(bytes),n.sha256);const parsed=bytes.toString().split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>l.trim().split(/\s+/).map(Number));assert.deepEqual(n.nodes,parsed);
 const ids=new Map(n.nodes.map(v=>[v[0],v]));for(const row of n.nodes){assert.equal(row.length,7);assert.ok(row.every(Number.isFinite));assert.ok(row[5]>=0);const seen=new Set();let x=row;while(x[6]!==-1){assert.ok(!seen.has(x[0]),'cycle');seen.add(x[0]);x=ids.get(x[6]);assert.ok(x);}}
 const seg=skeletonSegments(n);assert.equal(seg.length,n.nodes.filter(v=>v[6]!==-1).length);assert.ok(seg.flat(2).every(Number.isFinite));assert.equal(seg[0][1][0],n.nodes.find(v=>v[6]!==-1)[2]*.008);
 }
});
test('molecular links use the imported reference proteins and preserve unresolved neuron subtypes',()=>{
 const records=JSON.parse(fs.readFileSync('public/research/sensory-benchmark-v1/sequences.json')).records;
 assert.equal(data.genes.length,5);for(const g of data.genes){assert.ok(records.some(r=>r.proteinAccession===g.uniprot||r.accession===g.uniprot));assert.match(g.flybase,/^FBgn\d+$/);for(const n of g.nucleotides)assert.match(n,/^NM_\d+\.\d+$/);}
 const ui=fs.readFileSync('fruitfly-neural-v0715.js','utf8');assert.match(ui,/no Rh3\/Rh4 or Rh5\/Rh6 assignment/);assert.match(ui,/No synapse edges/);assert.match(ui,/different specimens/i);assert.ok(data.resources.some(r=>r.name==='BANC'));assert.match(data.resources.find(r=>r.name.includes('FlyWire')).license,/NC/);
});
test('atlas links return to the actual specimen and maintenance does not enable unsupported live vision',()=>{
 const lab=fs.readFileSync('public/research/sensory-benchmark-v1/lab.js','utf8');assert.ok(lab.includes('../../fruitfly-study-v0715.html'));assert.ok(!lab.includes('fly is an atlas-only reference'));
 const sense=fs.readFileSync('sensory-lab.js','utf8');assert.ok(sense.includes('maintenanceMarkup(profile)+benchmarkLink(species.id)'));const neural=fs.readFileSync('fruitfly-neural-v0715.js','utf8');assert.ok(!neural.includes('getUserMedia'));assert.match(neural,/resize.disconnect/);assert.match(neural,/canvas.onkeydown/);
});

test('atlas descriptions acknowledge the linked body without claiming matched experiments',()=>{const atlas=fs.readFileSync('public/research/sensory-benchmark-v1/atlas.json','utf8');assert.ok(!atlas.includes('no fly 3D specimen'));assert.match(atlas,/not experimentally matched/);});
