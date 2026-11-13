import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {responses,sampleCurve,phaseAt,runRecord,observation,SPECIES_IDS,formatValue} from './sense-learning-core-v0718.js';
import {readBenchmarkBundle} from './sensory-benchmark-v0714.mjs';
import {benchmarkLink} from './sensory-benchmark-link.js';
const data=JSON.parse(fs.readFileSync('sense-learning-data-v0718.json','utf8'));
const raw=Object.fromEntries(readBenchmarkBundle().map(f=>[f.path,f.bytes]));
const original=n=>JSON.parse(raw[n]);
test('exhibit derives its curves and molecular records exactly from the frozen evidence',()=>{
 for(const [name,hash] of Object.entries(data.sourceHashes))assert.equal(crypto.createHash('sha256').update(raw[name]).digest('hex'),hash);
 assert.deepEqual(data.curves,original('curves.json'));
 for(const s of data.species){assert.deepEqual(s.chain,original('atlas.json').species.find(o=>o.id===s.id).chain);for(const r of s.molecules){const source=original('sequences.json').records.find(o=>o.accession===r.accession);assert.ok(source);assert.equal(r.protein,source.protein);assert.equal(r.codingSequence,source.codingSequence);assert.ok(r.protein.length>100);}}
});
test('wavelength lookup interpolates and never extrapolates unsupported fly measurements',()=>{
 assert.notEqual(formatValue(.000001),'0.000');assert.equal(formatValue(0),'0');
 assert.equal(sampleCurve([300,301],[.2,.8],300.5,[300,301]),.5);
 assert.equal(sampleCurve([300,301],[.2,.8],299,[300,301]),null);
 assert.equal(sampleCurve([300,301],[.2,.8],NaN,[300,301]),null);
 assert.deepEqual(responses(data,'drosophila-melanogaster',600),[null,null,null]);
 for(const s of data.species)for(let n=s.domain[0];n<=s.domain[1];n++)assert.deepEqual(responses(data,s.id,n),data.curves[s.curveKey].map(c=>c[n-300]));
 assert.throws(()=>responses(data,'unknown',400));
});
test('descriptive behavior groups reproduce raw nonzero-contrast outcomes without pooled controls',()=>{
 const rows=original('inputs.json').behavior.rows;assert.equal(rows.length,4411);assert.equal(data.observations.reduce((n,r)=>n+r.n,0),3921);
 assert.equal(new Set(data.observations.map(r=>r.fish)).size,11);
 for(const r of data.observations){const matches=rows.filter(x=>x.fish===r.fish&&x.color===r.color&&x.jnd>0);assert.equal(r.n,matches.length);assert.equal(r.successes,matches.reduce((s,x)=>s+x.success,0));assert.deepEqual(observation(data,r.fish,r.color),r);}
 assert.equal(observation(data,'unknown','blue'),null);
});
test('export preserves measured scale and does not claim a behavioral or neural prediction',()=>{
 for(const id of SPECIES_IDS){const out=runRecord(data,{id,nm:350});assert.deepEqual(out.values,responses(data,id,350));assert.equal(out.neuralPrediction,false);assert.equal(out.behaviorPrediction,false);assert.equal(out.subjectivePerception,false);assert.equal(out.confidenceInterval,null);}
 assert.deepEqual([-1,0,.24,.25,.5,.75,1,2].map(phaseAt),[0,0,0,1,2,3,3,3]);
});
test('entry preserves original atlas while exposing guided lab and standalone dependencies',()=>{
 for(const id of SPECIES_IDS){assert.ok(benchmarkLink(id).includes(`sense-learning-v0718.html#${id}`));assert.ok(benchmarkLink(id).includes(`sensory-benchmark-v1/index.html#${id}`));}
 const html=fs.readFileSync('sense-learning-v0718.html','utf8');
 for(const m of html.matchAll(/(?:href|src)="\.\/(sense-learning[^"#?]+)"/g))assert.ok(fs.existsSync(m[1]),m[1]);
 const js=fs.readFileSync('sense-learning-v0718.js','utf8');assert.ok(!js.includes('getUserMedia'));assert.ok(js.includes('document.hidden'));assert.ok(js.includes('cancelAnimationFrame'));assert.ok(js.includes('6000'));assert.ok(html.includes('not ultraviolet light'));assert.ok(html.includes('No fitted neural circuit'));assert.ok(html.includes('skip'));assert.ok(html.includes('role="status"'));
});
