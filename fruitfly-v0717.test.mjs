import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function glb(version){const b=fs.readFileSync(`model-source-drosophila-melanogaster-v${version}.glb`),n=b.readUInt32LE(12);return {json:JSON.parse(b.subarray(20,20+n)),bin:b.subarray(28+n),bytes:b};}
const before=glb('0716'),after=glb('0717');
function accessor(g,i){const a=g.json.accessors[i],v=g.json.bufferViews[a.bufferView],size=({5120:1,5121:1,5122:2,5123:2,5125:4,5126:4})[a.componentType]*({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16})[a.type],offset=(v.byteOffset||0)+(a.byteOffset||0);return Buffer.concat(Array.from({length:a.count},(_,k)=>g.bin.subarray(offset+k*(v.byteStride||size),offset+k*(v.byteStride||size)+size)));}
test('surface revision preserves every mesh attribute, index, skeleton and animation sample',()=>{
 assert.deepEqual(after.json.nodes,before.json.nodes);assert.equal(after.json.meshes.length,68);
 for(let i=0;i<before.json.meshes.length;i++){const a=before.json.meshes[i],b=after.json.meshes[i];assert.equal(a.name,b.name);assert.equal(a.primitives.length,b.primitives.length);a.primitives.forEach((p,k)=>{const q=b.primitives[k];assert.deepEqual(Object.keys(p.attributes),Object.keys(q.attributes));for(const attr of Object.keys(p.attributes))assert.deepEqual(accessor(before,p.attributes[attr]),accessor(after,q.attributes[attr]),a.name+' '+attr);assert.deepEqual(accessor(before,p.indices),accessor(after,q.indices));});}
 before.json.skins.forEach((s,i)=>{assert.deepEqual(s.joints,after.json.skins[i].joints);assert.deepEqual(accessor(before,s.inverseBindMatrices),accessor(after,after.json.skins[i].inverseBindMatrices));});
 assert.equal(after.json.animations.length,2);before.json.animations.forEach((a,i)=>{const b=after.json.animations[i];assert.equal(a.name,b.name);assert.deepEqual(a.channels,b.channels);assert.equal(a.samplers.length,b.samplers.length);a.samplers.forEach((s,k)=>{for(const key of ['input','output'])assert.deepEqual(accessor(before,s[key]),accessor(after,b.samplers[k][key]));});});
});
test('revised PBR data differ and retain embedded maps and translucent membranes',()=>{
 const data=JSON.parse(fs.readFileSync('fruitfly-data-v0717.json'));assert.equal(hash(after.bytes),data.species.modelAsset.sha256);assert.notEqual(hash(after.bytes),hash(before.bytes));assert.equal(after.json.images.length,3);
 for(const m of after.json.materials){assert.equal(m.pbrMetallicRoughness.metallicFactor,0);if(m.name.endsWith('_membrane')){assert.equal(m.alphaMode,'BLEND');assert.ok(m.pbrMetallicRoughness.baseColorFactor[3]<.15);}}
 assert.ok(after.json.materials.some(m=>m.normalTexture));assert.equal(data.species.review.animationValidated,false);assert.equal(data.externalAudit.motionRetuned,false);
});
test('external results retain individual rows, repeated-record caveats and unresolved metrics',()=>{
 const a=JSON.parse(fs.readFileSync('fruitfly-audit-v0717.json'));assert.equal(a.walking.recordedFlies,3);assert.equal(a.walking.comparisons.length,18);assert.equal(a.confidenceInterval95,null);assert.equal(a.flight.trajectoryError3D,null);assert.equal(a.validatedPhysiology,false);
 for(const r of a.walking.comparisons){assert.ok(Number.isFinite(r.angleWassersteinDeg)&&r.angleWassersteinDeg>=0);assert.ok(r.modelFootSpread<r.recordedFootSpread);assert.equal(r.recordedFrames,1000);assert.equal(r.modelFrames,306);}
 assert.equal(a.flight.untreatedHaltereRecords.length,38);assert.equal(a.flight.untreatedWingRecords.length,132);assert.match(a.flight.limitations,/Repeated recordings/);assert.match(a.walking.limitations,/not pointwise/);assert.match(a.failures.join(' '),/simulans/);
});
test('input manifests use pinned walking source and preserve the historical GLB',()=>{
 const inputs=JSON.parse(fs.readFileSync('fruitfly-inputs-v0717.json'));for(const i of inputs.files){assert.match(i.sha256,/^[a-f0-9]{64}$/);assert.match(i.url,/^https:\/\//);if(i.root)assert.equal(hash(fs.readFileSync(i.file)),i.sha256);}
 const manifest=JSON.parse(fs.readFileSync('archive-delivery-v0708.json'));const entry=manifest.files['model-source-drosophila-melanogaster-v0716.glb'];assert.equal(entry.sha256,hash(before.bytes));assert.ok(entry.url.includes(entry.sourceCommit));assert.equal(entry.sourceCommit,'a0a957633326c603120b3aa329283d10b9b5bbfc');
});
