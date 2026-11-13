import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONDITIONS,mean,curve,modelCurve,sampleAt,validateSkeleton,sourceEdges,timingSummary,exportStudy} from './motor-core-v0719.js';
import {benchmarkLink} from './sensory-benchmark-link.js';
const behavior=JSON.parse(fs.readFileSync('motor-behavior-v0719.json','utf8'));
const neural=JSON.parse(fs.readFileSync('motor-neurons-v0719.json','utf8'));
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('trial summaries reconstruct fly means without treating repeated trials as independent flies',()=>{
 const rows=fs.readFileSync('motor-trials-v0719.csv','utf8').trim().split(/\r?\n/).slice(1).map(l=>l.split(','));
 assert.equal(rows.length,1519);assert.equal(behavior.flies.length,17);
 behavior.flies.forEach((fly,f)=>CONDITIONS.forEach((c,j)=>{
  const matches=rows.filter(r=>+r[0]===fly&&r[1]===c);assert.equal(matches.length,behavior.counts[f][j]);
  assert.equal(new Set(matches.map(r=>r[2])).size,matches.length);
  near(mean(matches.map(r=>+r[3])),behavior.scalarResponses[f][j]);
  near(mean(behavior.traces[f][j].slice(120)),behavior.scalarResponses[f][j],1e-5);
  near(mean(behavior.traces[f][j].slice(0,120)),0,1e-5);
 }));
 assert.equal(behavior.bootstrap.unit,'fly');assert.equal(behavior.bootstrap.replicates,10000);
});
test('every held-out prediction excludes that fly in every training condition',()=>{
 behavior.heldOut.forEach((r,i)=>{
  assert.equal(r.trainingFlies.length,16);assert.ok(!r.trainingFlies.includes(r.fly));
  const train=behavior.scalarResponses.filter((_,j)=>j!==i);
  for(let c=0;c<3;c++){near(r.conditionMean[c],mean(train.map(x=>x[c])));near(mean(modelCurve(behavior,CONDITIONS[c],r.fly,'condition').slice(120)),r.conditionMean[c],1e-5);}
  near(r.additiveFull,mean(train.map(x=>x[0]+x[1])));
  near(mean(modelCurve(behavior,'FullRotation',r.fly,'additive').slice(120)),r.additiveFull,1e-5);
 });
 for(let c=0;c<3;c++)near(behavior.metrics.conditionMeanMAE[c],mean(behavior.heldOut.map(r=>Math.abs(r.conditionMean[c]-r.observed[c]))));
 near(behavior.metrics.additiveFullMAE,mean(behavior.heldOut.map(r=>Math.abs(r.additiveFull-r.observed[2]))));
 assert.ok(behavior.metrics.additiveFullMAE>behavior.metrics.conditionMeanMAE[2]);
});
test('timeline preserves the sampled source window and rejects unsupported inputs',()=>{
 const a=curve(behavior,'FullRotation',1);assert.equal(a.length,420);
 assert.equal(sampleAt(behavior,a,-2),a[0]);assert.equal(sampleAt(behavior,a,0),a[120]);
 assert.equal(sampleAt(behavior,a,4.999),a[419]);assert.equal(sampleAt(behavior,a,5),null);
 assert.equal(sampleAt(behavior,a,-2.001),null);assert.equal(sampleAt(behavior,a,NaN),null);
 assert.equal(modelCurve(behavior,'FrontToBack',1,'additive'),null);
 assert.throws(()=>curve(behavior,'invented',1));assert.throws(()=>modelCurve(behavior,'FullRotation',999));
 assert.throws(()=>modelCurve(behavior,'FullRotation',1,'invented'));
});
test('exports distinguish mean intervals from individual held-out predictions',()=>{
 const r=exportStudy(behavior,{condition:'FullRotation',fly:'1',model:'additive'});
 assert.equal(r.confidenceInterval95ForMean,null);assert.ok(!r.trainingFlyIds.includes(1));
 assert.equal(r.neuralSimulation,false);assert.equal(r.subjectiveVision,false);
 const m=exportStudy(behavior,{condition:'FullRotation',fly:'mean',model:'condition'});
 assert.deepEqual(m.confidenceInterval95ForMean,behavior.meanCI95[2]);
 near(m.scalarObserved,39.15192815393376);assert.equal(m.trainingFlyIds.length,17);
 assert.match(m.sourceSha256,/^[a-f0-9]{64}$/);
});
test('source skeletons retain valid tree identities and separate descending, intrinsic and motor cells',()=>{
 const sizes=[13170,7510,12310,9752,4694,5698];
 neural.neurons.forEach((n,i)=>{validateSkeleton(n);assert.equal(n.nodes.length,sizes[i]);assert.match(n.source.sha256,/^[a-f0-9]{64}$/);assert.match(n.source.url,new RegExp(n.id+'\\.swc$'));});
 for(const p of neural.paths){const n=p.ids.map(id=>neural.neurons.find(n=>n.id===String(id)));assert.deepEqual(n.map(n=>n.superclass),['descending_neuron','vnc_intrinsic','vnc_motor']);assert.equal(n[2].neuromere,'T1');assert.ok(n[0].statusLabel.includes('Prelim'));}
 assert.throws(()=>validateSkeleton({nodes:[[1,-1,0,0,0],[1,-1,0,0,0]]}));
 assert.throws(()=>validateSkeleton({nodes:[[1,2,0,0,0]]}));
 assert.throws(()=>validateSkeleton({nodes:[[1,-1,Infinity,0,0]]}));
});
test('anatomical edges preserve counts without inventing functional signs or cross-study links',()=>{
 assert.deepEqual(neural.paths.map(p=>sourceEdges(neural,p).map(e=>[e.pre,e.post,e.synapses])),[[['10360','801437',195],['801437','801469',442]],[['11074','802562',69],['802562','805313',185]]]);
 for(const p of neural.paths)for(const e of sourceEdges(neural,p))assert.equal(e.functionalSign,null);
 assert.equal(neural.unitToMicrometres,.008);assert.equal(neural.license,'CC BY 4.0');
});
test('device timing reports incomplete samples without claiming thermal validation',()=>{
 const empty=timingSummary([]);assert.equal(empty.frames,0);assert.equal(empty.p95Ms,null);
 const s=timingSummary([10,20,30,60,NaN,0,-3]);assert.equal(s.frames,4);assert.equal(s.medianMs,25);near(s.p95Ms,55.5);assert.equal(s.intervalsOver50ms,1);assert.equal(s.measuredTemperature,null);assert.equal(s.thermalThrottlingEstablished,false);
});
test('fruit fly entry exposes the study without claiming other species share it',()=>{
 assert.match(benchmarkLink('drosophila-melanogaster'),/motor-lab-v0719/);
 assert.doesNotMatch(benchmarkLink('apis-mellifera'),/motor-lab-v0719/);
 assert.equal(benchmarkLink('unknown'),'');
});
