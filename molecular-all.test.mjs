import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {complement,reverseComplement,translateDNA,codonAt,featureSequence,toFasta,sequenceWindow} from './molecular-core.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const db=read('species.json'),index=read('molecular-index-v0683.json');
const legacy=Object.assign({},...['0673','0674','0675'].map(v=>read(`molecular-data-v${v}.json`).records));
const newFiles=[...new Set(Object.values(index.records).filter(e=>e.status==='verified'&&!e.legacy).map(e=>e.dataFile))];
const records=Object.assign({},...newFiles.map(f=>read(f).records));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');

test('Every archive species has a completed molecular audit, with no substitute taxon and all legacy records retained',()=>{
 assert.equal(Object.keys(index.records).length,db.species.length);
 assert.deepEqual(Object.keys(index.records).sort(),db.species.map(s=>s.id).sort());
 for(const s of db.species){const e=index.records[s.id];assert.equal(e.scientificName,s.scientificName);assert.ok(['verified','unavailable'].includes(e.status),s.id+' audit unfinished');if(e.status==='unavailable'){assert.ok(e.reason);assert.ok(!e.accession);}}
 for(const [id,r]of Object.entries(legacy)){assert.equal(index.records[id].accession,r.accession);assert.equal(index.records[id].sequenceSha256,r.sequenceSha256);assert.ok(index.records[id].legacy);assert.ok(!records[id]);}
 assert.equal(Object.values(index.counts).reduce((a,b)=>a+b,0),db.species.length);
});
test('All new DNA is traceable to source XML, source species identity and an immutable sequence hash',()=>{
 for(const [id,r]of Object.entries(records)){
  const e=index.records[id];assert.equal(r.speciesId,id);assert.equal(r.archiveScientificName,e.scientificName);assert.match(r.accession,/^[A-Z_]+\d+\.\d+$/);assert.ok(r.taxonId>0&&r.sourceTaxonId>0);assert.equal(r.taxonId,e.taxonId);
  assert.equal(r.sequence.length,r.length);assert.match(r.sequence,/^[ACGTRYSWKMBDHVN]+$/);assert.equal(sha(r.sequence),e.sequenceSha256);assert.equal(sha(r.sourceXml),r.sourceXmlSha256);
  assert.equal(r.sourceXml.match(/<GBSeq_sequence>([^<]+)<\/GBSeq_sequence>/)?.[1].toUpperCase(),r.sequence);
  assert.ok(r.sourceXml.includes('<GBSeq_accession-version>'+r.accession+'</GBSeq_accession-version>'));
  assert.ok(r.sourceXml.includes('taxon:'+r.sourceTaxonId));
  assert.ok(r.sourceUrl.endsWith('/'+r.accession));assert.ok(r.features.length);
  for(const f of r.features){assert.ok(f.segments.length);for(const s of f.segments){assert.ok(s.start>=1&&s.start<=s.end&&s.end<=r.length);assert.ok([-1,1].includes(s.strand));}if(f.type==='CDS'){assert.ok(f.translationTable>0);assert.ok(f.translationCheck);if(!f.translationRestriction){assert.equal(f.translationCheck,'matches deposited protein');assert.equal(translateDNA(featureSequence(r,f),f.translationTable).replace(/\*$/,''),f.translation,id+' '+f.name);}}}
 }
});
test('Translation uses the deposited code, preserves ambiguous DNA and withholds uncertain CDS effects',()=>{
 assert.equal(translateDNA('ATATGAAGA',1,false),'I*R');
 assert.equal(translateDNA('ATATGAAGA',2,false),'MW*');
 assert.equal(translateDNA('ATATGAAGA',5,false),'MWS');
 assert.equal(translateDNA('GTGTAA',11,true),'M*');
 assert.equal(translateDNA('GTGTAA',11,false),'V*');
 assert.equal(translateDNA('TGA',27,false),null);
 assert.equal(translateDNA('ACN',1,false),'X');
 assert.equal(translateDNA('ATG',999),null);
 const seq='ACGTRYSWKMBDHVN';assert.equal(reverseComplement(reverseComplement(seq)),seq);assert.equal(complement('R'),'Y');assert.equal(complement('B'),'V');
 const record={sequence:'ATATGAAGA',length:9},f={type:'CDS',segments:[{start:1,end:9,strand:1}],codonStart:1,translationTable:5};
 assert.equal(codonAt(record,f,7).amino,'S');assert.equal(codonAt(record,{...f,translationTable:2},7).amino,'*');assert.equal(codonAt(record,{...f,translationRestriction:'partial annotation'},7).amino,null);
 const reverse={...f,segments:[{start:1,end:9,strand:-1}]};assert.equal(featureSequence(record,reverse),reverseComplement(record.sequence));
});
test('Reference/sandbox exports and linear interval windows retain record type, bases and coordinate limits',()=>{
 for(const r of Object.values(records)){
  const before=sha(r.sequence),ref=toFasta(r),edit=toFasta(r,new Map([[1,r.sequence[0]==='A'?'C':'A']]));
  assert.ok(ref.split('\n')[0].includes(r.molecule));assert.equal(ref.split('\n').slice(1).join(''),r.sequence);assert.match(edit,/^>HYPOTHETICAL_SANDBOX/);assert.equal(sha(r.sequence),before);
  assert.equal(sequenceWindow(r,r.length,36).at(-1).position,r.length);assert.equal(sequenceWindow(r,1,36,true).at(-1).position,1);
 }
});
test('Source datasets are lazy-loaded, every species has a study entry, and UI wording does not mislabel all DNA as mitochondria',()=>{
 const ui=fs.readFileSync('molecular-ui.js','utf8'),registry=fs.readFileSync('molecular-registry-v0683.js','utf8'),app=fs.readFileSync('app.js','utf8');
 assert.ok(registry.includes('document.baseURI'));assert.ok(registry.includes('crypto.subtle.digest'));assert.ok(!registry.includes("import records from './molecular-records"));
 assert.ok(ui.includes('Verified sequence not available'));assert.ok(ui.includes('translation withheld'));assert.ok(ui.includes('mol-source-xml'));assert.ok(!ui.includes('Coding examples use table 2'));
 assert.ok(app.includes('tab.hidden=!hasMolecularStudy(s.id)'));assert.ok(app.includes('hasLegacyMolecularRecord(s.id)){const head='));
});
