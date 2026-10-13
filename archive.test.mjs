import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildSpecimen, animateSpecimen, modelKinds } from './models.js';
const archive=JSON.parse(await readFile(new URL('./species.json',import.meta.url),'utf8'));
const media=JSON.parse(await readFile(new URL('./media.json',import.meta.url),'utf8'));
const atlas=JSON.parse(await readFile(new URL('./atlas.json',import.meta.url),'utf8'));
test('each record has a bundled licensed organism reference and traceable occurrence snapshot',async()=>{
 assert.equal(Object.keys(media.photos).length,50);assert.equal(Object.keys(atlas.species).length,50);
 for(const s of archive.species){
  const p=media.photos[s.id],a=atlas.species[s.id];assert.ok(p.author);assert.match(p.license,/CC BY|CC0|Public domain/);assert.equal(new URL(p.source).hostname,'commons.wikimedia.org');assert.ok(p.licenseUrl);
  assert.equal(p.localFile,s.photograph.localFile);const bytes=await readFile(new URL('./'+p.localFile,import.meta.url));assert.ok(bytes.length>1000);assert.ok((bytes[0]===255&&bytes[1]===216)||(bytes[0]===137&&bytes[1]===80),`${s.id}: invalid photograph file`);
  assert.equal(a.taxonKey,s.taxonomy.acceptedUsageKey||s.taxonomy.usageKey);assert.ok(Number.isInteger(a.count)&&a.count>=0);assert.equal(new URL(a.query).hostname,'api.gbif.org');assert.equal(new URL(a.query).searchParams.get('hasGeospatialIssue'),'false');assert.ok(a.retrieved);assert.deepEqual(s.occurrences,a);
 }
});
test('detailed reconstructions have resettable articulated limbs and remain explicitly unvalidated',()=>{
 for(const id of ['canis-lupus','vulpes-vulpes','panthera-tigris']){
  const s=archive.species.find(s=>s.id===id),m=buildSpecimen(s);assert.equal(m.natural,true);assert.equal(m.parts.limbs.length,4);assert.ok(s.visual.referencePhoto);assert.equal(s.review.animationValidated,false);
  animateSpecimen(m,'walk',.3);const moved=m.parts.limbs[0].paw.position.clone();animateSpecimen(m,'observe',0);assert.notDeepEqual(moved.toArray(),m.parts.limbs[0].paw.position.toArray());
  m.root.traverse(o=>{if(o.geometry){const p=o.geometry.attributes.position;for(const n of p.array)assert.ok(Number.isFinite(n),`${id}: invalid mesh vertex`);}});
 }
});
test('external surface assets preserve author, license and separate animation scope',async()=>{
 const assets=JSON.parse(await readFile(new URL('./model-assets.json',import.meta.url),'utf8'));
 for(const [id,a] of Object.entries(assets.models)){assert.ok(a.author);assert.equal(a.license,'CC BY 4.0');assert.equal(new URL(a.source).hostname,'sketchfab.com');assert.equal(new URL(a.embed).hostname,'sketchfab.com');assert.match(a.delivery,/not bundled/);assert.match(a.clips,/Local behavior controls/);assert.deepEqual(archive.species.find(s=>s.id===id).modelAsset,a);}
});
test('50 unique species across the three domains with complete source provenance',()=>{
 assert.equal(archive.species.length,50);assert.equal(new Set(archive.species.map(s=>s.id)).size,50);
 assert.deepEqual([...new Set(archive.species.map(s=>s.domain))].sort(),['Archaea','Bacteria','Eukaryota']);
 for(const s of archive.species){
  assert.equal(s.anatomy.length,3);assert.ok(s.behaviors.length>0);assert.ok(modelKinds.includes(s.visual.kind));
  assert.equal(new Set(s.sources.map(r=>r.id)).size,s.sources.length,`${s.id}: duplicate source IDs`);
  assert.equal(s.review.animationValidated,false);assert.equal(s.taxonomy.provider,'GBIF backbone');assert.equal(s.family,s.taxonomy.family);
  for(const source of s.sources){assert.equal(new URL(source.url).protocol,'https:');assert.ok(source.accessed);assert.ok(source.scope);}
  for(const b of s.behaviors){assert.ok(b.sourceIds.length>0);for(const id of b.sourceIds)assert.ok(s.sources.some(r=>r.id===id),`${s.id}: orphan reference ${id}`);assert.ok(b.timeScale.includes('uncalibrated'));}
 }
});
test('non-animal processes exclude walking, jumping, sleeping and animal escape',()=>{
 for(const s of archive.species.filter(s=>s.group!=='Animalia'))for(const b of s.behaviors)assert.ok(!['walk','run','jump','sleep','escape','fly'].includes(b.id),`${s.id}: ${b.id}`);
 assert.ok(archive.species.some(s=>s.behaviors.some(b=>b.id==='sleep')));
 assert.ok(archive.species.some(s=>s.behaviors.some(b=>b.id==='escape')));
});
test('all models and all authored motion modes produce finite transforms over playback',()=>{
 for(const s of archive.species){
  const m=buildSpecimen(s);let meshes=0;m.root.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes>0,`${s.id} missing geometry`);assert.equal(m.features.length,3);
  for(const action of ['observe',...s.behaviors.map(b=>b.id)])for(const t of [0,.5,2.3,8.99,20.1]){
   animateSpecimen(m,action,t);
   m.root.traverse(o=>{for(const n of [...o.position.toArray(),...o.scale.toArray(),o.rotation.x,o.rotation.y,o.rotation.z])assert.ok(Number.isFinite(n),`${s.id} ${action} nonfinite transform`);assert.ok(o.scale.x>0&&o.scale.y>0&&o.scale.z>0,`${s.id} degenerate model`);});
  }
  animateSpecimen(m,'observe',0);assert.equal(m.root.position.x,0);assert.equal(m.root.scale.x,1);
  const geo=new Set(),mat=new Set();m.root.traverse(o=>{if(o.geometry)geo.add(o.geometry);if(o.material)mat.add(o.material);});geo.forEach(x=>x.dispose());mat.forEach(x=>x.dispose());
 }
});
