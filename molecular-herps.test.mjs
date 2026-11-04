import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {herpAt673,herpDatabaseAt673} from './herp-history.mjs';
import {featureSequence,translateMito,findMotifs,toFasta} from './molecular-core.js';
const records=JSON.parse(fs.readFileSync('molecular-data-v0674.json')).records,hash=v=>crypto.createHash('sha256').update(v).digest('hex');
test('Three revisions strictly restore the published parent and preserve338 other species and341 identities',()=>{
 const db=JSON.parse(fs.readFileSync('species.json')),ledger=JSON.parse(fs.readFileSync('herpetofauna-revisions-v0674.json')),before=herpDatabaseAt673(db);
 assert.equal(db.version,'0.6.74');assert.equal(db.species.length,341);assert.equal(hash(JSON.stringify(before)),ledger.parentDatabaseJsonSha256);assert.equal(hash(JSON.stringify(db.species.filter(s=>!ledger.revisedSpecies.includes(s.id)))),ledger.unchanged338Sha256);
 for(const s of db.species){const old=before.species.find(r=>r.id===s.id);for(const key of ['id','commonName','scientificName','taxonomy','photograph','occurrences'])assert.deepEqual(s[key],old[key]);}
 for(const id of ledger.revisedSpecies){const s=structuredClone(db.species.find(s=>s.id===id));s.modelAsset.sha256='undocumented';assert.throws(()=>herpAt673(s));}
});
test('New reference records retain exact source taxon, accession, DNA and raw GenBank hashes',()=>{
 assert.deepEqual(Object.values(records).map(r=>[r.speciesId,r.accession,r.taxonId,r.length]),[['chelonia-mydas','NC_000886.1',8469,16497],['ambystoma-mexicanum','NC_005797.1',8296,16369],['agalychnis-callidryas','DQ283423.1',197464,2417]]);
 for(const r of Object.values(records)){assert.equal(r.length,r.sequence.length);assert.match(r.sequence,/^[ACGT]+$/);assert.equal(hash(r.sequence),r.sequenceSha256);assert.equal(hash(fs.readFileSync(r.rawGenbank)),r.rawSha256);assert.equal(fs.readFileSync(r.fasta,'utf8').split('\n').slice(1).join(''),r.sequence);for(const f of r.features)for(const s of f.segments)assert.ok(s.start>=1&&s.start<=s.end&&s.end<=r.length);}
});
test('Turtle and axolotl reproduce26 deposited proteins; the partial frog ribosomal region has no invented CDS or gene boundaries',()=>{
 let translated=0;
 for(const id of ['chelonia-mydas','ambystoma-mexicanum']){const r=records[id];assert.equal(r.completeness,'complete');assert.equal(r.topology,'circular');const cds=r.features.filter(f=>f.type==='CDS');assert.equal(cds.length,13);for(const f of cds){assert.equal(f.translationTable,2);assert.equal(translateMito(featureSequence(r,f)).replace(/\*$/,''),f.translation,r.accession+' '+f.name);translated++;}}
 assert.equal(translated,26);const f=records['agalychnis-callidryas'];assert.equal(f.completeness,'partial');assert.equal(f.topology,'linear');assert.equal(f.features.length,1);assert.equal(f.features[0].type,'misc_feature');assert.equal(f.features[0].location,'<1..>2417');assert.equal(f.features[0].translation,null);assert.match(toFasta(f).split('\n')[0],/fragment \(partial record\)/);assert.match(f.features[0].notes.join(' '),/12S.*tRNA-Val.*16S/);assert.ok(!findMotifs(f.sequence,f.sequence.slice(-3)+f.sequence.slice(0,3)).some(m=>m.wrapsOrigin));
 const control=records['chelonia-mydas'].features.find(f=>f.type==='misc_feature');assert.equal(control.location,'15516..16497');assert.equal(control.name,'control region');assert.equal(control.product,'control region');assert.equal(control.translation,null);assert.ok(!records['chelonia-mydas'].features.some(f=>/RNA boundaries unresolved/.test(f.name)));
});
