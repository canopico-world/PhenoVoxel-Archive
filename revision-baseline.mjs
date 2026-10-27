import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./species-revisions.json',import.meta.url)));
export function beforeAnthozoa(records){const restored=beforeRorqualFeeding(records);for(const r of [...ledger.revisions].reverse().filter(r=>['cyanea-oral-curtain-correction','chrysaora-oral-field-correction'].includes(r.kind))){assert.equal(r.id,r.kind==='cyanea-oral-curtain-correction'?'cyanea-capillata':'chrysaora-hysoscella');const s=restored.find(s=>s.id===r.id);assert(s);for(const f of r.fields){assert(['visual','review','sources','anatomy','behaviors'].includes(f.path));assert.deepEqual(s[f.path],f.after,'Undocumented later change: '+s.id+'/'+f.path);s[f.path]=structuredClone(f.before);}}return restored;}
export function expansionBaseline(records){const restored=structuredClone(records);for(const revision of [...ledger.revisions].reverse()){const s=restored.find(s=>s.id===revision.id);if(!s)continue;for(const f of revision.fields){const keys=f.path.split('.');let owner=s;for(const key of keys.slice(0,-1))owner=owner[key];const key=keys.at(-1);assert.deepEqual(owner[key],f.after,'Unrecorded change after approved revision: '+s.id+'/'+f.path);if(f.existed)owner[key]=structuredClone(f.before);else delete owner[key];}}return restored;}

// Later external-form corrections must restore exact documented prior values.
export function beforeMollusca(records){const restored=beforeRorqualFeeding(records);for(const r of [...ledger.revisions].reverse().filter(r=>['cyanea-oral-curtain-correction','chrysaora-oral-field-correction','anthozoa-box-exterior-correction','rhizostoma-oral-field-correction','cotylorhiza-oral-field-correction','cassiopea-oral-field-correction','jellyfish-exterior-correction','fungal-exterior-correction','mollusca-external-form-correction','mollusca-anatomy-correction','cornu-adult-form-correction','octopus-exterior-correction','octopus-arm-body-correction','lymnaea-adult-form-correction','littorina-adult-form-correction'].includes(r.kind))){const s=restored.find(s=>s.id===r.id);if(!s)continue;for(const f of r.fields){const keys=f.path.split('.');let owner=s;for(const k of keys.slice(0,-1))owner=owner[k];const key=keys.at(-1);assert.deepEqual(owner[key],f.after,'Undocumented later change: '+s.id+'/'+f.path);if(f.existed)owner[key]=structuredClone(f.before);else delete owner[key];}}return restored;}

// Replay only this documented correction before historical preservation checks.
// Assertions still detect any undocumented later modification of these fields.
export function beforeRorqualFeeding(records){
 const restored=structuredClone(records);
 for(const r of [...ledger.revisions].reverse().filter(r=>r.kind==='rorqual-feeding-study')){
  assert(['balaenoptera-musculus','megaptera-novaeangliae'].includes(r.id));const s=restored.find(s=>s.id===r.id);if(!s)continue;
  for(const f of r.fields){assert(['visual','review','sources','anatomy','behaviors','modelAsset'].includes(f.path));assert.deepEqual(s[f.path],f.after,'Undocumented later change: '+s.id+'/'+f.path);if(f.existed)s[f.path]=structuredClone(f.before);else delete s[f.path];}
 }
 return restored;
}
