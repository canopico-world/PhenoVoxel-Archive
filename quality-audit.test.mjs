import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {taxonomicPath,taxonomySections,animalLineage} from './taxonomic-navigation.js';
const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))),audit=JSON.parse(fs.readFileSync(new URL('./taxonomy-audit.json',import.meta.url))),ledger=JSON.parse(fs.readFileSync(new URL('./species-revisions.json',import.meta.url)));
test('every species has a binomial/rank audit with explicit unresolved occurrence associations',()=>{assert.equal(Object.keys(audit.records).length,db.species.length);let withheld=0;for(const s of db.species){const a=audit.records[s.id];assert.equal(a.scientificName,s.scientificName);assert.equal(a.binomial,true);assert.equal(a.rank,'species');assert.equal(a.independentlyValidated,false);if(a.resolution.url)assert.equal(new URL(a.resolution.url).protocol,'https:');if(a.resolution.status==='occurrence-association-unresolved'){withheld++;assert.equal(a.resolution.authority,'LPSN');assert.match(a.gbif.canonicalName,/ spec\.$/);}}assert.equal(withheld,3);assert.equal(audit.counts.exactItis,190);});
test('explicit ITIS rank corrections keep turtles/crocodiles together and resolve fish class',()=>{const find=id=>db.species.find(s=>s.id===id);assert.equal(taxonomicPath(find('chelonia-mydas'),audit.records)[3],'Reptilia');assert.equal(taxonomicPath(find('crocodylus-niloticus'),audit.records)[3],'Reptilia');assert.equal(taxonomicPath(find('danio-rerio'),audit.records)[3],'Teleostei');const sections=taxonomySections(db.species,audit.records),reptiles={species:sections.filter(s=>s.path.at(-1)==='Reptilia').flatMap(s=>s.species)};assert.deepEqual(new Set(reptiles.species.map(s=>s.id)),new Set(['chelonia-mydas','crocodylus-niloticus']));});
test('metadata revisions preserve source provenance and cannot conceal biological/name edits',()=>{
 const allowed=new Set(['modelAsset','visual.description','visual.viewerRig','visual.rigScope','visual.fidelity','behaviors','taxonomy','occurrences']);assert.equal(ledger.revisions.length,5);
 for(const r of ledger.revisions){
  for(const f of r.fields)assert.ok(allowed.has(f.path));const asset=r.fields.find(f=>f.path==='modelAsset');
  if(!asset){const t=r.fields.find(f=>f.path==='taxonomy');for(const f of r.fields)for(const k of Object.keys(f.before))assert.deepEqual(f.after[k],f.before[k]);const occurrences=r.fields.find(f=>f.path==='occurrences');assert.equal(occurrences.after.eligibleForSpeciesMap,false);assert.equal(t.after.occurrenceMatchStatus,'unresolved');assert.equal(t.after.identityAuthority.provider,'LPSN');continue;}
  for(const k of ['uid','author','source','license','licenseUrl','sha256','sourceSha256','localFile','download','bytes'])assert.deepEqual(asset.before[k],asset.after[k],r.id+'/'+k);assert.equal(asset.after.viewerRig.animationValidated,false);
  const behaviors=r.fields.find(f=>f.path==='behaviors');if(behaviors){assert.equal(r.id,'oryctolagus-cuniculus');assert.deepEqual(behaviors.after,behaviors.before.map(b=>({...b,description:b.description.replace('Same creator skeleton and pied surface','Same creator skeleton and surface with the current gray-brown coat derivative')})));assert.equal(behaviors.before.filter((b,i)=>b.description!==behaviors.after[i].description).length,2);}
  const fidelity=r.fields.find(f=>f.path==='visual.fidelity');if(fidelity){assert.equal(r.id,'oryctolagus-cuniculus');assert.match(fidelity.after,/source pied atlas remains unchanged on disk/i);assert.match(fidelity.after,/remain unvalidated/);}
 }
});



