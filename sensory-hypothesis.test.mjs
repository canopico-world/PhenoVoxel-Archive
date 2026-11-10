import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {CLOWNFISH_CURVES,CLOWNFISH_CURVE_SOURCE} from './sensory-clownfish-curves.js';
import {HYPOTHESIS_SPECIES} from './sensory-hypotheses.js';
import {hypothesisDefaults,runHypothesis,bootstrapFish,fisherInterval,lensInterval,clownfishSensitivity} from './sensory-hypothesis-core.js';
import {sensoryProfile} from './sensory-evidence.js';
import {sensoryAccess} from './sensory-access.js';
const close=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const data=JSON.parse(fs.readFileSync(new URL('./sensory-data-v0710.json',import.meta.url)));
test('published source curves and thresholds preserve every downloaded numeric record',()=>{
 const curveBytes=fs.readFileSync(new URL('./sensory-clownfish-curves-v0710.csv',import.meta.url));assert.equal(crypto.createHash('sha256').update(curveBytes).digest('hex'),CLOWNFISH_CURVE_SOURCE.sha256);
 const rows=curveBytes.toString().trim().split(/\r?\n/).slice(1).map(r=>r.split(',').map(Number));assert.deepEqual(rows,CLOWNFISH_CURVES);assert.equal(rows.length,501);
 for(let i=0;i<4;i++){close(clownfishSensitivity(300,i),rows[0][i+1]);close(clownfishSensitivity(400.5,i),(rows[100][i+1]+rows[101][i+1])/2);close(clownfishSensitivity(410,i,10),rows[100][i+1]);}
 const b=fs.readFileSync(new URL('./sensory-clownfish-thresholds-v0710.csv',import.meta.url));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),data.sourceFileSha256);assert.deepEqual(b.toString().trim().split(/\r?\n/).slice(1).map(r=>r.split(',')),data.rows);
});
test('ten distinct implemented hypotheses resolve evidence and preserve unsupported channels',()=>{
 assert.equal(Object.keys(HYPOTHESIS_SPECIES).length,10);
 for(const [id,p] of Object.entries(HYPOTHESIS_SPECIES)){const profile=sensoryProfile({id});assert.ok(profile.references.every(r=>r?.url?.startsWith('https://')),id);assert.deepEqual(sensoryAccess(profile).channels,p.channels);assert.equal(sensoryAccess(profile).channels.includes('sound'),false);const result=runHypothesis(id);assert.equal(result.perceptual95CI,null);assert.ok(result.rows.length);assert.match(result.predictionStatus,/no independent/);}
 assert.deepEqual(sensoryAccess(sensoryProfile({id:'caenorhabditis-elegans'})).channels,['signals']);
 assert.equal(sensoryAccess(sensoryProfile({id:'unknown-fish'})).maintenance,true);
});
test('polarization obeys conservation and orientation symmetry, and loses contrast without polarization',()=>{
 for(const id of ['oratosquilla-oratoria','octopus-vulgaris']){const full=runHypothesis(id,{angle:90,orientation:0,degree:1});close(full.rows[0].a,0);close(full.rows[0].b,1);close(full.rows[0].a+full.rows[1].a,1);for(const row of runHypothesis(id,{angle:90,orientation:45,degree:1}).rows)close(row.difference,0);for(const row of runHypothesis(id,{angle:90,orientation:0,degree:0}).rows)close(row.difference,0);}
});
test('equal spectra have zero differential response and valid stimuli stay bounded',()=>{
 for(const [id,p] of Object.entries(HYPOTHESIS_SPECIES).filter(([,p])=>p.kind==='spectral')){for(const row of runHypothesis(id,{a:500,b:500,shift:0}).rows)close(row.difference,0);for(const a of [320,386,550,700])for(const row of runHypothesis(id,{a,b:550,shift:10}).rows){assert.ok(row.a>=0&&row.a<=1.01);assert.ok(row.b>=0&&row.b<=1.01);}assert.equal(runHypothesis(id).sensitivity.length,3);}
 const crab=runHypothesis('carcinus-maenas');assert.equal(crab.rows.length,2);assert.equal(crab.singleChannel.peak,504);
});
test('geometry scales with distance without relabeling observed range as confidence',()=>{
 const a=runHypothesis('tyto-alba',{distance:1,acuity:4}),b=runHypothesis('tyto-alba',{distance:2,acuity:4});close(b.rows[0].value,2*a.rows[0].value);close(a.rows[1].value,a.rows[0].value/2);assert.match(a.method,/not a 95%/);
 const t=runHypothesis('chrysemys-picta',{wavelength:620});assert.equal(t.rows[1].value,5);assert.match(t.description,/does not imply invisibility/);assert.equal(runHypothesis('chrysemys-picta',{wavelength:640}).rows[1].value,0);
});
test('worm model reports physical inputs without invented behavioral probabilities',()=>{
 const r=runHypothesis('caenorhabditis-elegans',{ratio:4,context:0});close(r.rows[0].value,.8);close(r.rows[0].value+r.rows[1].value,1);assert.match(r.description,/does not specify avoidance/);assert.equal(r.avoidanceProbability,undefined);
});
test('invalid numerical inputs are rejected rather than generating plausible output',()=>{
 for(const [id,key] of [['vulpes-vulpes','a'],['octopus-vulgaris','degree'],['tyto-alba','distance'],['chrysemys-picta','wavelength'],['caenorhabditis-elegans','ratio']])for(const value of [NaN,Infinity,-100])assert.throws(()=>runHypothesis(id,{...hypothesisDefaults(id),[key]:value}));assert.throws(()=>fisherInterval(1,59));assert.throws(()=>fisherInterval(.2,3));
});
test('independent statistical benchmarks and deterministic fish-level resampling',()=>{
 const lens=lensInterval();close(lens.estimate,334.3333333333333);close(lens.lower,307.77125209715706,1e-8);close(lens.upper,360.89541456950957,1e-8);
 const corr=fisherInterval(.24,59);assert.ok(corr.lower<0&&corr.upper>.46);close(corr.lower,-.017135414237083337);
 const b=bootstrapFish(data.rows);assert.equal(data.rows.length,49);assert.equal(b.n,11);close(b.estimate,-.7586363636363636);assert.deepEqual(b,bootstrapFish(data.rows));assert.ok(b.lower<b.estimate&&b.upper>b.estimate);assert.equal(b.excludedUnpaired,0);
 const out=JSON.parse(fs.readFileSync(new URL('./sensory-results-v0710.json',import.meta.url)));assert.deepEqual(out.clownfish,b);assert.deepEqual(out.lens,lens);assert.deepEqual(out.worm,corr);
});
test('duplicate and malformed experimental units are rejected',()=>{
 assert.throws(()=>bootstrapFish([...data.rows,data.rows[0]]),/Duplicate/);const x=data.rows.map(r=>[...r]);x[0][3]='';assert.throws(()=>bootstrapFish(x));x[0][3]='NaN';assert.throws(()=>bootstrapFish(x));assert.throws(()=>bootstrapFish(data.rows,{seed:-1}));
});
