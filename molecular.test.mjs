import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {complement,reverseComplement,sequenceWindow,featurePositions,featureSequence,translateMito,codonAt,findMotifs,toFasta} from './molecular-core.js';
import {mammalAt672,mammalDatabaseAt672} from './mammal-history.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./molecular-data-v0673.json',import.meta.url))),records=Object.values(data.records);
test('The two animal revisions strictly restore v0.6.72 and preserve all339 other records and341 taxon/photo identities',()=>{
 const db=JSON.parse(fs.readFileSync('species.json')),ledger=JSON.parse(fs.readFileSync('mammals-revisions-v0673.json')),hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
 assert.equal(db.version,'0.6.73');assert.equal(db.species.length,341);assert.equal(hash(mammalDatabaseAt672(db)),ledger.parentDatabaseJsonSha256);assert.equal(hash(db.species.filter(s=>!ledger.revisedSpecies.includes(s.id))),ledger.unchanged339Sha256);
 const before=mammalDatabaseAt672(db);for(const s of db.species){const old=before.species.find(r=>r.id===s.id);for(const k of ['id','commonName','scientificName','taxonomy','photograph','occurrences'])assert.deepEqual(s[k],old[k]);}
 for(const id of ledger.revisedSpecies){const s=structuredClone(db.species.find(s=>s.id===id));s.visual.description+=' hidden modification';assert.throws(()=>mammalAt672(s));}
});
test('Versioned records resolve to the exact requested species and immutable sequence hashes',()=>{
 assert.deepEqual(records.map(r=>[r.speciesId,r.accession,r.taxonId,r.length]),[['osphranter-rufus','KY996501.1',9321,17014],['pan-troglodytes','NC_001643.1',9598,16554]]);
 for(const r of records){assert.equal(r.sequence.length,r.length);assert.match(r.sequence,/^[ACGT]+$/);assert.equal(crypto.createHash('sha256').update(r.sequence).digest('hex'),r.sequenceSha256);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(r.rawGenbank)).digest('hex'),r.rawSha256);const fasta=fs.readFileSync(r.fasta,'utf8').split('\n').slice(1).join('');assert.equal(fasta,r.sequence);}
});
test('All 26 annotated coding sequences reproduce their deposited protein translations',()=>{
 for(const r of records){const cds=r.features.filter(f=>f.type==='CDS');assert.equal(cds.length,13);assert.equal(r.features.filter(f=>f.type==='tRNA').length,22);assert.equal(r.features.filter(f=>f.type==='rRNA').length,2);for(const f of cds){assert.equal(f.translationTable,2);assert.equal(translateMito(featureSequence(r,f)).replace(/\*$/,''),f.translation,r.accession+' '+f.name);for(const s of f.segments){assert.ok(s.start<=s.end);assert.ok(s.start>=1&&s.end<=r.length);}}}
});
test('Mitochondrial decoding uses table 2, initiation and explicit stop markers',()=>{
 assert.equal(translateMito('ATATGATGAAGAAGG',false),'MWW**');assert.equal(translateMito('ATTATCGTG',true),'MIV');assert.equal(translateMito('ATTATCGTG',false),'IIV');assert.equal(translateMito('TAN',false),'X');
});
test('Window orientations preserve one-based reference coordinates and antiparallel complement',()=>{
 const r=records[0],forward=sequenceWindow(r,1,36),back=sequenceWindow(r,1,36,true);
 assert.deepEqual(back.map(x=>x.position),forward.map(x=>x.position).reverse());assert.equal(back.map(x=>x.base).join(''),reverseComplement(forward.map(x=>x.base).join('')));assert.equal(sequenceWindow(r,r.length,36).at(-1).position,r.length);assert.equal(complement('C'),'G');
});
test('Reverse-strand ND6 codons address the deposited coordinate and complement substitutions',()=>{
 for(const r of records){const f=r.features.find(f=>f.name==='ND6'),positions=featurePositions(f),p=positions[4],before=codonAt(r,f,p),changes=new Map([[p,r.sequence[p-1]==='A'?'C':'A']]),after=codonAt(r,f,p,changes);assert.equal(positions[0],f.segments[0].end);assert.ok(positions[0]>positions.at(-1));assert.notEqual(before.codon,after.codon);assert.equal(after.codon[1],complement(changes.get(p)));}
});
test('Motif search includes overlaps and reverse complement without double-counting palindromes',()=>{
 assert.deepEqual(findMotifs('AAAA','AAA'),[{position:1,strand:'+'},{position:2,strand:'+'}]);assert.deepEqual(findMotifs('ATGCAT','ATG'),[{position:1,strand:'+'},{position:4,strand:'−'}]);assert.equal(findMotifs('ATAT','AT').length,2);assert.throws(()=>findMotifs('AAAA','AX'));assert.throws(()=>findMotifs('AAAA',''));
});
test('Circular mitochondrial motif searches include origin-spanning matches exactly once',()=>{
 assert.deepEqual(findMotifs('TAAA','AAT',{circular:true}),[{position:3,strand:'+',wrapsOrigin:true}]);assert.deepEqual(findMotifs('TAAA','AAT'),[]);assert.equal(findMotifs('AAAA','AAA',{circular:true}).length,4);
});
test('Sandbox FASTA is labeled, leaves reference immutable and preserves sequence length',()=>{
 const r=records[1],before=JSON.stringify(r),mutant=r.sequence[100]==='A'?'C':'A',changes=new Map([[101,mutant]]),out=toFasta(r,changes);assert.match(out,/^>HYPOTHETICAL_SANDBOX/);assert.equal(out.split('\n').slice(1).join('').length,r.length);assert.equal(JSON.stringify(r),before);assert.ok(!toFasta(r).includes('HYPOTHETICAL'));
});
