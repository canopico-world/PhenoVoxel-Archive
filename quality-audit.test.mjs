import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {taxonomicPath,taxonomySections,animalLineage} from './taxonomic-navigation.js';
const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))),audit=JSON.parse(fs.readFileSync(new URL('./taxonomy-audit.json',import.meta.url))),ledger=JSON.parse(fs.readFileSync(new URL('./species-revisions.json',import.meta.url)));
test('every species has a binomial/rank audit with explicit unresolved occurrence associations',()=>{assert.equal(Object.keys(audit.records).length,db.species.length);let withheld=0;for(const s of db.species){const a=audit.records[s.id];assert.equal(a.scientificName,s.scientificName);assert.equal(a.binomial,true);assert.equal(a.rank,'species');assert.equal(a.independentlyValidated,false);if(a.resolution.url)assert.equal(new URL(a.resolution.url).protocol,'https:');if(a.resolution.status==='occurrence-association-unresolved'){withheld++;if(s.id==='hericium-erinaceus'){assert.equal(a.resolution.authority,'Koga, Thorn and Langer2025');assert.equal(a.resolution.url,'https://pmc.ncbi.nlm.nih.gov/articles/PMC12798842/');assert.equal(s.taxonomy.occurrenceMatchStatus,'unresolved');assert.match(s.taxonomy.occurrenceScopeNote,/historical broad-name/);}else{assert.equal(a.resolution.authority,'LPSN');assert.match(a.gbif.canonicalName,/ spec\.$/);}}}assert.equal(withheld,4);assert.equal(audit.counts.exactItis,190);});
test('explicit ITIS rank corrections keep turtles/crocodiles together and resolve fish class',()=>{const find=id=>db.species.find(s=>s.id===id);assert.equal(taxonomicPath(find('chelonia-mydas'),audit.records)[3],'Reptilia');assert.equal(taxonomicPath(find('crocodylus-niloticus'),audit.records)[3],'Reptilia');assert.equal(taxonomicPath(find('danio-rerio'),audit.records)[3],'Teleostei');const sections=taxonomySections(db.species,audit.records),reptiles={species:sections.filter(s=>s.path.at(-1)==='Reptilia').flatMap(s=>s.species)};assert.deepEqual(new Set(reptiles.species.map(s=>s.id)),new Set(['chelonia-mydas','crocodylus-niloticus']));});
test('metadata revisions preserve source provenance and cannot conceal biological/name edits',()=>{
 const allowed=new Set(['modelAsset','visual.description','visual.viewerRig','visual.rigScope','visual.fidelity','visual.version','behaviors','taxonomy','occurrences','anatomy','sources']);assert.equal(ledger.revisions.filter(r=>!['development-capability-correction','abalone-anatomy-correction'].includes(r.kind)).length,40);assert.equal(ledger.revisions.filter(r=>r.kind==='development-capability-correction').length,72);assert.equal(ledger.revisions.filter(r=>r.kind==='abalone-anatomy-correction').length,2);
 for(const r of ledger.revisions){
  for(const f of r.fields)assert.ok(allowed.has(f.path));const asset=r.fields.find(f=>f.path==='modelAsset');
  if(r.kind==='abalone-anatomy-correction'){
   assert.ok(['haliotis-rufescens','haliotis-tuberculata'].includes(r.id));assert.deepEqual(r.fields.map(f=>f.path).sort(),['sources','visual.description','visual.version','visual.viewerRig','anatomy','behaviors'].sort());
   const sources=r.fields.find(f=>f.path==='sources');assert.deepEqual(sources.after.slice(0,sources.before.length),sources.before);assert.equal(r.fields.find(f=>f.path==='visual.viewerRig').after.animationValidated,false);
   const behaviors=r.fields.find(f=>f.path==='behaviors');assert.deepEqual(behaviors.after.map(b=>[b.id,b.rendering]),behaviors.before.map(b=>[b.id,b.rendering]));assert.match(behaviors.after[0].label,/Algal grazing/);
   const anatomy=r.fields.find(f=>f.path==='anatomy');assert.deepEqual(anatomy.after.map(({description,...a})=>a),anatomy.before.map(({description,...a})=>a));continue;
  }
  if(r.kind==='development-capability-correction'){
   const s=db.species.find(s=>s.id===r.id);assert.equal(s.group,'Plantae');
   const b=r.fields.find(f=>f.path==='behaviors');assert.deepEqual(b.after.map(x=>x.id),b.before.map(x=>x.id));
   const staged=['helianthus-annuus','arabidopsis-thaliana'].includes(r.id);
   assert.deepEqual(r.fields.map(f=>f.path).sort(),(staged?['sources','visual.description','visual.version','visual.viewerRig','behaviors']:['behaviors']).sort());
   for(let i=0;i<b.before.length;i++){const before=b.before[i],after=b.after[i];if(!['grow','unfurl'].includes(before.id)||r.id==='dryopteris-filix-mas'&&before.id==='unfurl')assert.deepEqual(after,before);else assert.equal(after.rendering.status,staged?'partial':'unavailable');}
   if(staged){const sources=r.fields.find(f=>f.path==='sources');assert.deepEqual(sources.after.slice(0,sources.before.length),sources.before);assert.equal(r.fields.find(f=>f.path==='visual.viewerRig').after.animationValidated,false);assert.match(b.after.find(b=>b.id==='grow').timeScale,/not calendar time/);}
   continue;
  }
  if(r.kind==='evidence-linked-model-correction'){
   assert.ok(['asterias-rubens','echinus-esculentus','dendraster-excentricus','holothuria-tubulosa','luidia-ciliaris','ophiothrix-fragilis','acropora-cervicornis','porites-porites','gorgonia-ventalina','metridium-senile','actinia-equina','hydra-vulgaris','caenorhabditis-elegans','schmidtea-mediterranea','lymnaea-stagnalis','cornu-aspersum','mytilus-edulis','pecten-maximus','ostrea-edulis','daphnia-magna','pisaster-ochraceus','patiria-miniata','linckia-laevigata','acanthaster-planci','astropecten-irregularis','strongylocentrotus-purpuratus','paracentrotus-lividus','diadema-setosum','echinometra-mathaei','clypeaster-rosaceus','cucumaria-frondosa','holothuria-atra','apostichopus-japonicus','ophiocomina-nigra','antedon-bifida'].includes(r.id));
   assert.deepEqual(r.fields.map(f=>f.path).sort(),['visual.description','visual.fidelity','visual.version','visual.viewerRig','anatomy','behaviors','sources'].sort());
   const get=path=>r.fields.find(f=>f.path===path),sources=get('sources');assert.deepEqual(sources.after.slice(0,sources.before.length),sources.before);assert.equal(get('visual.viewerRig').after.animationValidated,false);
   const anatomy=get('anatomy');assert.deepEqual(anatomy.after.map(({description,...a})=>a),anatomy.before.map(({description,...a})=>a));
   const behaviors=get('behaviors'),stable=b=>{const {description,evidence,sourceIds,...out}=b;if(r.id==='gorgonia-ventalina')delete out.rendering;return out;};assert.deepEqual(behaviors.after.slice(0,behaviors.before.length).map(stable),behaviors.before.map(stable));
   if(r.id==='gorgonia-ventalina'){assert.equal(behaviors.before[0].rendering.status,'unavailable');assert.equal(behaviors.after[0].rendering.status,'partial');assert.match(behaviors.after[0].rendering.reason,/Local polyp extension/);}
   assert.equal(behaviors.after.length,behaviors.before.length+(['dendraster-excentricus','mytilus-edulis','ostrea-edulis','clypeaster-rosaceus'].includes(r.id)?1:0));for(const b of behaviors.after)for(const id of b.sourceIds)assert.ok(sources.after.some(s=>s.id===id));
   continue;
  }
  if(!asset){const t=r.fields.find(f=>f.path==='taxonomy');for(const f of r.fields)for(const k of Object.keys(f.before))assert.deepEqual(f.after[k],f.before[k]);const occurrences=r.fields.find(f=>f.path==='occurrences');assert.equal(occurrences.after.eligibleForSpeciesMap,false);assert.equal(t.after.occurrenceMatchStatus,'unresolved');assert.equal(t.after.identityAuthority.provider,'LPSN');continue;}
  for(const k of ['uid','author','source','license','licenseUrl','sha256','sourceSha256','localFile','download','bytes'])assert.deepEqual(asset.before[k],asset.after[k],r.id+'/'+k);assert.equal(asset.after.viewerRig.animationValidated,false);
  const behaviors=r.fields.find(f=>f.path==='behaviors');if(behaviors){assert.equal(r.id,'oryctolagus-cuniculus');assert.deepEqual(behaviors.after,behaviors.before.map(b=>({...b,description:b.description.replace('Same creator skeleton and pied surface','Same creator skeleton and surface with the current gray-brown coat derivative')})));assert.equal(behaviors.before.filter((b,i)=>b.description!==behaviors.after[i].description).length,2);}
  const fidelity=r.fields.find(f=>f.path==='visual.fidelity');if(fidelity){assert.equal(r.id,'oryctolagus-cuniculus');assert.match(fidelity.after,/source pied atlas remains unchanged on disk/i);assert.match(fidelity.after,/remain unvalidated/);}
 }
});



