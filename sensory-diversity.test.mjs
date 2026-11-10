import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {DIVERSITY_SPECIES,DIVERSITY_REFERENCES} from './sensory-diversity.js';
import {diversityDefaults,diversityCalculation,renderDiversity,validateDiversity} from './sensory-diversity-core.js';
import {STUDY_SPECIES,sensoryProfile} from './sensory-evidence.js';
import {sensoryAccess} from './sensory-access.js';
import {visualDefaults,SCENES} from './sensory-views.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const frame=Uint8ClampedArray.from([0,0,0,55,255,255,255,123,255,0,0,240,0,255,0,255]);
test('ten new species have distinct modes, evidence and implemented scene calculations',()=>{
 assert.equal(Object.keys(DIVERSITY_SPECIES).length,10);assert.equal(new Set(Object.values(DIVERSITY_SPECIES).map(p=>p.mode)).size,10);
 for(const [id,p] of Object.entries(DIVERSITY_SPECIES)){assert.deepEqual(sensoryAccess(sensoryProfile({id})).channels,['vision']);assert.ok(p.sources.every(k=>DIVERSITY_REFERENCES[k]?.url.startsWith('https://')));const r=diversityCalculation(id);assert.ok(r.rows.every(x=>Number.isFinite(x.value)));assert.equal(r.perceptual95CI,null);assert.equal(r.rawMediaIncluded,false);}
});
test('every enabled visual lab has a licensed habitat photograph; nonvisual and unknown species do not acquire eyes',()=>{
 let count=0;for(const [id] of STUDY_SPECIES){const access=sensoryAccess(sensoryProfile({id})),view=visualDefaults(id);if(access.channels.includes('vision')){const scene=SCENES[view.scene];assert.ok(scene,id);assert.ok(fs.existsSync(new URL(scene.url)),id);assert.ok(scene.source&&scene.credit&&scene.license,id);count++;}}
 assert.equal(count,28);for(const id of ['caenorhabditis-elegans','arabidopsis-thaliana','neurospora-crassa'])assert.equal(sensoryAccess(sensoryProfile({id})).channels.includes('vision'),false);
 assert.equal(sensoryAccess(sensoryProfile({id:'unknown'})).maintenance,true);
 const source=fs.readFileSync(new URL('./sensory-lab.js',import.meta.url),'utf8');assert.doesNotMatch(source,/Use test chart|for\(let j=0;j<9;j\+\+\)|Showing a labelled test chart/);
});
test('photographic bytes and reuse licences match the saved provenance',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('./sensory-habitat-sources-v0711.json',import.meta.url)));
 for(const v of Object.values(p.images)){const data=fs.readFileSync(new URL('./'+v.file,import.meta.url));assert.equal(data.length,v.bytes);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),v.sha256);assert.ok(v.license&&v.credit&&v.source&&v.licenseUrl);}
});
test('all image experiments preserve input bytes and alpha and remain finite at control endpoints',()=>{
 for(const [id,p] of Object.entries(DIVERSITY_SPECIES)){const original=[...frame];for(const bound of [2,3]){const s=Object.fromEntries(p.controls.map(c=>[c[0],c[bound]]));const r=renderDiversity(frame,2,2,id,s);assert.equal(r.pixels.length,frame.length);assert.deepEqual([...frame],original);for(let i=3;i<frame.length;i+=4)assert.equal(r.pixels[i],frame[i]);assert.ok(r.rows.every(x=>Number.isFinite(x.value)));}}
});
test('pupil area obeys the square law, gain clips explicitly and unity is identity',()=>{
 close(diversityCalculation('chironex-fleckeri',{diameter:.5}).rows[0].value,.25);
 assert.deepEqual(renderDiversity(frame,2,2,'chironex-fleckeri',{diameter:1}).pixels,frame);
 assert.deepEqual(renderDiversity(frame,2,2,'homarus-americanus',{gain:1}).pixels,frame);
 const r=renderDiversity(frame,2,2,'homarus-americanus',{gain:2});assert.ok(r.clippedFraction>0&&r.clippedFraction<1);assert.equal(r.pixels[0],0);
});
test('spatial averages use linear light and do not wrap image rows',()=>{
 const b=Uint8ClampedArray.from([0,0,0,255,255,255,255,255]);const r=renderDiversity(b,2,1,'strongylocentrotus-purpuratus',{fov:30,angle:20});
 // One-pixel cells retain the source at this low resolution.
 assert.deepEqual(r.pixels,b);
 const bigger=Uint8ClampedArray.from([...b,...b]);const q=renderDiversity(bigger,4,1,'strongylocentrotus-purpuratus',{fov:30,angle:20});assert.ok(q.pixels[0]>128);assert.equal(q.pixels[12],255);
});
test('spectral proxies differ and the wavelength calculation never pretends to recover pixel spectra',()=>{
 const rabbit=renderDiversity(frame,2,2,'oryctolagus-cuniculus'),fish=renderDiversity(frame,2,2,'lepomis-macrochirus');assert.notDeepEqual(rabbit.pixels,fish.pixels);
 assert.deepEqual(renderDiversity(frame,2,2,'oryctolagus-cuniculus',{wavelength:350}).pixels,renderDiversity(frame,2,2,'oryctolagus-cuniculus',{wavelength:700}).pixels);
 assert.notDeepEqual(diversityCalculation('oryctolagus-cuniculus',{wavelength:425}).rows,diversityCalculation('oryctolagus-cuniculus',{wavelength:523}).rows);
 assert.deepEqual(renderDiversity(frame,2,2,'oryzias-latipes').pixels,frame);
});
test('temporal illustration uses supplied motion and zero motion or integration restores the image',()=>{
 const id='dermochelys-coriacea';assert.deepEqual(renderDiversity(frame,2,2,id,{fov:60,speed:0,integration:100}).pixels,frame);assert.deepEqual(renderDiversity(frame,2,2,id,{fov:60,speed:20,integration:0}).pixels,frame);
 close(diversityCalculation(id,{fov:60,speed:20,integration:100}).rows[0].value,2);
 const uniform=new Uint8ClampedArray(80).fill(128);assert.deepEqual(renderDiversity(uniform,20,1,id,{fov:30,speed:60,integration:250}).pixels,uniform);
});
test('invalid assumptions and image dimensions are rejected before rendering',()=>{
 for(const [id,p] of Object.entries(DIVERSITY_SPECIES))for(const [key,,min,max] of p.controls)for(const value of [NaN,Infinity,min-1,max+1])assert.throws(()=>validateDiversity(id,{...diversityDefaults(id),[key]:value}));
 assert.throws(()=>validateDiversity('pecten-maximus',{center:.4,blur:12,plane:.5}));assert.throws(()=>renderDiversity(frame,3,2,'pecten-maximus'));assert.throws(()=>validateDiversity('schmidtea-mediterranea',{sectors:2.5}));
});
