import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {photonEnergyEV,FrameHistory,transformFrame,spectrumSummary,LocalMediaSession,observationRecord} from './sensory-core.js';
import {sensoryProfile,STUDY_SPECIES} from './sensory-evidence.js';
const close=(actual,expected,tolerance=1e-6)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} ≠ ${expected}`);
test('photon energy follows Planck relation; invalid wavelengths have no estimate',()=>{
 close(photonEnergyEV(500),2.479683968664005);close(photonEnergyEV(1000),photonEnergyEV(500)/2);
 for(const n of [0,-1,NaN,Infinity])assert.equal(photonEnergyEV(n),null);
});
test('luminance linearizes sRGB; black/white contrast and alpha are preserved',()=>{
 const data=Uint8ClampedArray.from([0,0,0,255,255,255,255,64]);const before=[...data];
 const r=transformFrame(data,2,1);close(r.metrics.meanRelativeLuminance,.5);close(r.metrics.rmsContrast,1);
 assert.deepEqual([...r.pixels],before);assert.deepEqual([...data],before);
 const red=transformFrame(Uint8ClampedArray.from([255,0,0,255]),1,1);close(red.metrics.meanRelativeLuminance,.2126);assert.equal(red.pixels[0],127);assert.equal(red.pixels[1],127);
 const gray=transformFrame(Uint8ClampedArray.from([128,128,128,255]),1,1);close(gray.metrics.meanRelativeLuminance,.2158605);assert.equal(gray.pixels[0],128);
 assert.equal(transformFrame(new Uint8ClampedArray(4),1,1).metrics.rmsContrast,null);
 assert.throws(()=>transformFrame(data,3,1),/dimensions/);
});
test('frame-change needs a previous frame and spatial edges do not wrap rows',()=>{
 const data=Uint8ClampedArray.from([0,0,0,255,255,255,255,255]);
 const first=transformFrame(data,2,1,'change');assert.deepEqual([...first.pixels],[28,42,49,255,28,42,49,255]);
 assert.deepEqual([...transformFrame(data,2,1,'change',first.luma).pixels],[...first.pixels]);
 const edge=transformFrame(data,2,1,'edges');assert.equal(edge.pixels[0],205);assert.equal(edge.pixels[4],28);
 const changed=transformFrame(new Uint8ClampedArray(8),2,1,'change',first.luma);assert.equal(changed.pixels[4],205);
});
test('audio bins honor actual sample rate and Nyquist; silence has no identified peak',()=>{
 for(const sr of [16000,44100,48000]){const db=new Float32Array(1024).fill(-Infinity);db[64]=-30;const r=spectrumSummary(db,sr,2048);close(r.peakHz,64*sr/2048);close(r.binHz,sr/2048);assert.equal(r.displayMaxHz,Math.min(20000,sr/2));assert.equal(r.calibrated,false);}
 assert.equal(spectrumSummary(new Float32Array(1024).fill(-Infinity),48000,2048).peakHz,null);
});
const fakeStream=()=>{const t={stops:0,stop(){this.stops++;}};return{track:t,getTracks:()=>[t]};};
test('stopping while permission is pending releases a late stream',async()=>{
 let resolve;const media=new LocalMediaSession(()=>new Promise(r=>{resolve=r;}));const pending=media.start({video:true});media.stop();const stream=fakeStream();resolve(stream);assert.equal(await pending,null);assert.equal(stream.track.stops,1);assert.equal(media.stream,null);
});
test('overlapping requests cannot replace a newer stream; stop is idempotent',async()=>{
 const resolvers=[];const media=new LocalMediaSession(()=>new Promise(r=>resolvers.push(r)));
 const first=media.start({video:true}),second=media.start({video:true}),old=fakeStream(),current=fakeStream();
 resolvers[1](current);assert.equal(await second,current);resolvers[0](old);assert.equal(await first,null);assert.equal(old.track.stops,1);assert.equal(media.stream,current);media.stop();media.stop();assert.equal(current.track.stops,1);
});
test('request failures remain recoverable',async()=>{
 let fail=true;const stream=fakeStream(),media=new LocalMediaSession(async()=>{if(fail)throw Error('denied');return stream;});await assert.rejects(media.start({}),/denied/);assert.equal(media.stream,null);fail=false;assert.equal(await media.start({}),stream);media.stop();
});
test('evidence profiles resolve actual archive species without transferring receptor peaks',()=>{
 const {species}=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url)));
 for(const [id] of STUDY_SPECIES){const s=species.find(x=>x.id===id);assert.ok(s,id);assert.equal(sensoryProfile(s).curated,true);}
 const unknown=sensoryProfile({id:'other-dolphin',scientificName:'Other dolphin',group:'Animalia'});assert.equal(unknown.curated,false);assert.deepEqual(unknown.peaks,[]);assert.match(unknown.tag,/pending/);
 const fungus=sensoryProfile({id:'other-fungus',scientificName:'Other fungus',group:'Fungi'});assert.match(fungus.scheme.detail,/Reference organism: Neurospora/);assert.equal(fungus.curated,false);
 assert.deepEqual(sensoryProfile({id:'tursiops-truncatus'}).peaks.map(p=>p.nm),[488,524]);
});
test('notebook identifies source and uncertainty without raw media',()=>{
 const profile=sensoryProfile({id:'apis-mellifera',scientificName:'Apis mellifera'});const record=observationRecord({profile,source:'synthetic-demo',mode:'achromatic',parameters:{spatialReductionPixels:1},metrics:{meanRelativeLuminance:.3},question:'Contrast?',observation:'Demo only'});
 assert.equal(record.rawMediaIncluded,false);assert.equal(record.sampleTime,null);assert.equal(record.source,'synthetic-demo');assert.ok(record.evidence.length);assert.ok(record.limitations.some(s=>s.includes('not a reconstruction')));assert.equal(record.species.id,profile.speciesId);
});

test('frozen temporal comparisons preserve the captured difference across redraw/export',()=>{
 const history=new FrameHistory(),black=Uint8ClampedArray.from([0,0,0,255]),white=Uint8ClampedArray.from([255,255,255,255]);
 history.process(black,1,1,'change');const live=history.process(white,1,1,'change');assert.equal(live.pixels[0],205);
 assert.deepEqual(history.process(white,1,1,'change',false).pixels,live.pixels);
 assert.deepEqual(history.process(white,1,1,'change',false).pixels,live.pixels);
 assert.equal(history.process(white,1,1,'change',true).pixels[0],28);
 history.reset();assert.equal(history.process(white,1,1,'change',false).pixels[0],28);
});
