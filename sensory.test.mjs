import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {photonEnergyEV,FrameHistory,transformFrame,spectrumSummary,LocalMediaSession,observationRecord} from './sensory-core.js';
import {sensoryProfile,STUDY_SPECIES} from './sensory-evidence.js';
import {visualDefaults,SCENES,VISUAL_MODES} from './sensory-views.js';
import {sensoryAccess,maintenanceMarkup} from './sensory-access.js';
import {RESEARCH_SPECIES,WAVELENGTHS,pigmentSensitivity,photonIlluminant,syntheticPair,compareSpectra,parseSpectralCSV,spectraCSV,integrate} from './sensory-research.js';
import {echoGeometry,equalRangeTargets,thermalContrast,bandContrast} from './sensory-physics.js';
const supplement=JSON.parse(fs.readFileSync(new URL('./sensory-specimens-v0705.json',import.meta.url))).species;
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
 const species=[...JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))).species,...supplement];
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

test('bee colour proxy preserves blue/green differences without inferring UV or using camera red',()=>{
 const a=Uint8ClampedArray.from([0,120,210,91,255,120,210,255,0,210,120,255]);
 const original=[...a],bee=transformFrame(a,3,1,'bee-visible').pixels;
 assert.deepEqual([...bee],[120,120,210,91,120,120,210,255,210,210,120,255]);
 assert.deepEqual([...a],original);
 assert.notEqual(bee[1],bee[2]);
 assert.notDeepEqual(bee,transformFrame(a,3,1,'dolphin-achromatic').pixels);
 assert.match(VISUAL_MODES['bee-visible'].method,/UV is unknown, not zero/);
});
test('dolphin hypothesis stays achromatic and is not labelled a fitted spectral response',()=>{
 const a=Uint8ClampedArray.from([200,120,45,128]);
 assert.deepEqual(transformFrame(a,1,1,'dolphin-achromatic').pixels,transformFrame(a,1,1,'achromatic').pixels);
 assert.match(VISUAL_MODES['dolphin-achromatic'].method,/not dolphin spectral sensitivity/);
 assert.ok(sensoryProfile({id:'tursiops-truncatus'}).references.some(r=>r.url.includes('1023624021000014716')));
});
test('species start with distinct full-image views and photographs; unknown species retain original RGB',()=>{
 const bee=visualDefaults('apis-mellifera'),dolphin=visualDefaults('tursiops-truncatus');
 assert.equal(bee.mode,'bee-visible');assert.equal(dolphin.mode,'dolphin-baseline');
 assert.equal(bee.split,0);assert.equal(dolphin.split,0);assert.notEqual(bee.scene,dolphin.scene);
 for(const p of [bee,dolphin]){assert.ok(fs.existsSync(new URL(SCENES[p.scene].url)));assert.ok(SCENES[p.scene].license);}
 for(const id of ['other-dolphin','arabidopsis-thaliana','neurospora-crassa']){assert.equal(visualDefaults(id).mode,'rgb');assert.equal(visualDefaults(id).scene,null);}
});

test('every archive species is gated by reviewed evidence; methods and cross-species citations cannot unlock labs',()=>{
 const species=[...JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))).species,...supplement];
 const states=species.map(s=>({id:s.id,...sensoryAccess(sensoryProfile(s))}));
 assert.equal(states.filter(s=>s.maintenance).length,356);
 assert.deepEqual(states.filter(s=>!s.maintenance).map(s=>s.id).sort(),STUDY_SPECIES.map(s=>s[0]).sort());
 for(const id of ['physeter-macrocephalus','grampus-griseus','other-plant','other-fungus'])assert.equal(sensoryAccess(sensoryProfile({id,group:id.includes('plant')?'Plantae':'Fungi'})).maintenance,true);
 assert.equal(sensoryAccess({curated:true,references:[{url:'a-paper'}]}).maintenance,true);
 assert.equal(sensoryAccess({curated:false,studyChannels:['vision']}).maintenance,true);
});
test('channel availability distinguishes visual illustrations from cellular signalling and unsupported hearing',()=>{
 assert.deepEqual(sensoryAccess(sensoryProfile({id:'apis-mellifera'})).channels,['vision','signals']);
 assert.deepEqual(sensoryAccess(sensoryProfile({id:'tursiops-truncatus'})).channels,['vision','sound','signals']);
 for(const id of ['arabidopsis-thaliana','neurospora-crassa']){const a=sensoryAccess(sensoryProfile({id}));assert.deepEqual(a.channels,['signals']);assert.equal(a.initialChannel,'signals');}
 for(const [id] of STUDY_SPECIES)assert.equal(sensoryAccess(sensoryProfile({id})).channels.includes('sound'),id==='tursiops-truncatus');
});
test('maintenance content has no sensor controls or generic canvas and escapes species text',()=>{
 const html=maintenanceMarkup({scientificName:'<img src=x onerror=alert(1)>'});
 assert.match(html,/Under maintenance/);assert.match(html,/&lt;img/);
 assert.doesNotMatch(html,/<(?:canvas|input|button|video|audio|img)\b/);
 assert.doesNotMatch(html,/data-camera|data-mic|data-open/);
});

test('new studies unlock vision only and preserve species/age/assumption provenance',()=>{
 for(const [id,p] of Object.entries(RESEARCH_SPECIES)){
  assert.deepEqual(sensoryAccess(sensoryProfile({id})).channels,['vision']);
  assert.equal(visualDefaults(id).mode,p.mode);assert.ok(VISUAL_MODES[p.mode]);
  assert.ok(sensoryProfile({id}).references.length>=3);assert.ok(p.limits.length>60);
 }
 assert.match(RESEARCH_SPECIES['danio-rerio'].scope,/1–2 years/);
 assert.match(RESEARCH_SPECIES['chelonia-mydas'].limits,/not measured/);
 assert.match(RESEARCH_SPECIES['danaus-plexippus'].limits,/incomplete/);
});
test('pigment templates remain finite and peak in the expected neighbourhood',()=>{
 for(const p of Object.values(RESEARCH_SPECIES))for(const c of p.peaks){
  const values=WAVELENGTHS.map(n=>pigmentSensitivity(n,c.nm,p.template));
  assert.ok(values.every(x=>Number.isFinite(x)&&x>=0&&x<1.01));
  const peak=WAVELENGTHS[values.indexOf(Math.max(...values))];assert.ok(Math.abs(peak-c.nm)<=5);
 }
 close(pigmentSensitivity(540,540,'stavenga-alpha'),1);
 assert.throws(()=>pigmentSensitivity(NaN,430,'govardovskii-alpha'));
 assert.throws(()=>pigmentSensitivity(400,430,'unreviewed-template'));
});
test('trapezoidal integration is exact for constant and linear functions on irregular grids',()=>{
 close(integrate([2,2,2],[300,317,750]),900);
 close(integrate([300,317,750],[300,317,750]),(750**2-300**2)/2);
 assert.throws(()=>integrate([1,2],[300,299]));assert.throws(()=>integrate([NaN,2],[300,750]));
});
test('white-normalized responses preserve uniform reflectance and illumination scale',()=>{
 for(const id of Object.keys(RESEARCH_SPECIES)){
  const input=syntheticPair('fruit');input.a.fill(.25);input.b.fill(.75);
  const before=JSON.stringify(input),one=compareSpectra(id,input);
  for(const c of one.channels){close(c.a,.25);close(c.b,.75);}
  const brighter={...input,illuminant:input.illuminant.map(x=>x*71)};
  const two=compareSpectra(id,brighter);close(two.distance,one.distance);
  one.channels.forEach((c,i)=>{close(two.channels[i].qA,c.qA*71);close(two.channels[i].a,c.a);});
  assert.equal(JSON.stringify(input),before);
 }
});
test('UV uncertainty changes UV-channel predictions without adding visible differences',()=>{
 const same=syntheticPair('uv',.2),different=syntheticPair('uv',.8);
 for(const id of ['danaus-plexippus','danio-rerio']){
  close(compareSpectra(id,same).distance,0);const result=compareSpectra(id,different);
  close(result.visibleDifference,0);assert.ok(result.channels[0].b-result.channels[0].a>.3);
  assert.ok(result.distance>.3);assert.match(result.units,/not JND/);
 }
 const base=compareSpectra('chelonia-mydas',different),hyp=compareSpectra('chelonia-mydas',different,{turtleUV:true});
 assert.equal(base.channels.length,3);assert.equal(hyp.channels.length,4);assert.match(hyp.channels[0].basis,/not measured/);
 assert.equal(compareSpectra('pan-troglodytes',same,{turtleUV:true}).channels.length,3);
});
test('zero light is undefined, and peak perturbations never silently change reference peaks',()=>{
 const input=syntheticPair('fruit');input.illuminant.fill(0);const dark=compareSpectra('pan-troglodytes',input);
 assert.equal(dark.distance,null);assert.ok(dark.channels.every(c=>c.a===null&&c.white===0));
 const r=compareSpectra('danio-rerio',syntheticPair('fruit'),{peakShift:10});
 assert.equal(r.channels[0].nm,365);assert.equal(r.channels[0].modelPeakNm,375);
 assert.throws(()=>compareSpectra('danio-rerio',input,{peakShift:11}));
 assert.throws(()=>compareSpectra('unknown',input));
});
test('spectral CSV round-trips all inputs and rejects missing bands or invalid units/ranges',()=>{
 const source=syntheticPair('uv',.6,'thermal'),csv=spectraCSV(source),parsed=parseSpectralCSV(csv);
 for(const k of ['a','b','illuminant','transmission'])assert.deepEqual(parsed[k],source[k]);
 const header=csv.split('\n')[0];const linear=parseSpectralCSV(header+'\n300,0,1,1,1\n750,1,0,1,1');
 close(linear.a[45],.5);close(linear.b[45],.5);
 for(const bad of [header+'\n400,0,0,1,1\n750,1,1,1,1',header+'\n300,0,0,1,1\n300,1,1,1,1\n750,1,1,1,1',header+'\n300,2,0,1,1\n750,1,1,1,1',header+'\n300,0,0,0,1\n750,1,1,0,1',header+'\n300,,0,1,1\n750,1,1,1,1',header+'\n300,NaN,0,1,1\n750,1,1,1,1'])assert.throws(()=>parseSpectralCSV(bad));
 assert.throws(()=>parseSpectralCSV('x'.repeat(100001)));
});
test('thermal photon spectrum is finite, normalized and distinct from equal-photon light',()=>{
 const thermal=photonIlluminant('thermal');assert.equal(thermal.length,91);close(Math.max(...thermal),1);
 assert.ok(thermal.every(x=>Number.isFinite(x)&&x>0));assert.notDeepEqual(thermal,photonIlluminant('equal'));
 assert.ok(thermal[0]<thermal[40]);assert.throws(()=>photonIlluminant('daylight-measurement'));
});
test('new baseline modes preserve RGB and partial monarch mode keeps UV unknown',()=>{
 const pixels=Uint8ClampedArray.from([210,110,35,150]);
 for(const mode of ['chimp-baseline','zebrafish-baseline','turtle-baseline'])assert.deepEqual(transformFrame(pixels,1,1,mode).pixels,pixels);
 assert.deepEqual([...transformFrame(pixels,1,1,'monarch-visible').pixels],[110,110,35,150]);
 assert.match(VISUAL_MODES['monarch-visible'].method,/incomplete/);
});

test('forward acoustic model preserves units and equal-range ambiguity',()=>{
 const r=echoGeometry();close(r.delayMs,20);close(r.wavelengthMm,15);close(r.idealRangeCellM,.01875);
 close(echoGeometry({rangeM:30}).delayMs,2*r.delayMs);close(echoGeometry({bandwidthKHz:80}).idealRangeCellM,r.idealRangeCellM/2);
 const [a,b]=equalRangeTargets(15);close(Math.hypot(a.x,a.y),Math.hypot(b.x,b.y));assert.notEqual(a.y,b.y);
 for(const input of [{rangeM:NaN},{soundSpeed:0},{frequencyKHz:Infinity},{bandwidthKHz:0},{separationM:-1}])assert.throws(()=>echoGeometry(input));
});
test('thermal hypothesis respects zero contrast, emissivity and temperature reversal',()=>{
 close(thermalContrast(20,20).netExitanceWm2,0);const r=thermalContrast(35,20,1);assert.ok(r.netExitanceWm2>0);
 close(thermalContrast(20,35,1).netExitanceWm2,-r.netExitanceWm2);close(thermalContrast(35,20,.5).netExitanceWm2,r.netExitanceWm2/2);
 close(thermalContrast(35,20).peakWavelengthMicrometres,2897.771955/308.15);assert.throws(()=>thermalContrast(NaN,20));assert.throws(()=>thermalContrast(30,20,2));
});
test('missing bands remain independent hypotheses, with source-limited species identities',()=>{
 close(bandContrast(.6,.6).weber,0);assert.ok(bandContrast(.15,.8).weber<0);assert.throws(()=>bandContrast(.3,0));
 assert.deepEqual(RESEARCH_SPECIES['squilla-empusa'].peaks.map(p=>p.nm),[517]);
 assert.deepEqual(sensoryProfile({id:'rangifer-tarandus'}).peaks,[]);
 for(const s of supplement){assert.equal(s.molecularStatus,'verified-deposited-record');if(s.id==='rangifer-tarandus'){assert.ok(s.referenceOnly);assert.equal(s.modelAsset,undefined);assert.ok(s.behaviors.every(b=>b.rendering.status==='unavailable'));}else{assert.equal(s.referenceOnly,false);assert.equal(s.modelAsset.specimenVersion,s.id==='oratosquilla-oratoria'?'0.7.9':'0.7.7');}}
});

import {validateViewSettings,viewSettings,spectralMetadata,SESSION_VERSION} from './sensory-session.js';
import {importSpectralDataset,restoreSpectralStudy,RESEARCH_VERSION} from './sensory-research.js';
import {createHash} from 'node:crypto';
import {featureSequence,translateDNA} from './molecular-core.js';
import {readFileSync} from 'node:fs';
test('portable view settings reject foreign species, unsafe values and sensor flags',()=>{
 const settings={mode:'rgb',layout:'paired',split:.5,detail:2,facing:'environment',rate:6};
 const record=viewSettings('danio-rerio',settings);assert.deepEqual(validateViewSettings(record,'danio-rerio',['rgb']),settings);assert.equal(record.permissionIncluded,false);
 assert.throws(()=>validateViewSettings(record,'chelonia-mydas',['rgb']));
 for(const patch of [{split:NaN},{detail:0},{rate:60},{facing:'invented'},{mode:'thermal-detector'}])assert.throws(()=>validateViewSettings({...record,settings:{...settings,...patch}},'danio-rerio',['rgb']));
});
test('spectral import preserves source and converts energy to photon weighting',()=>{
 const metadata=spectralMetadata({citation:'synthetic unit test',kind:'synthetic',units:'energy'});
 const csv='wavelength_nm,reflectance_a,reflectance_b,illuminant_energy,transmission\n300,.2,.4,1,1\n750,.6,.8,1,1';
 const input=importSpectralDataset(csv,metadata);close(input.illuminant[0],300/550);close(input.illuminant.at(-1),750/550);assert.equal(input.originalCSV,csv);assert.equal(input.metadata.independentlyVerified,false);
 assert.throws(()=>spectralMetadata({citation:'DOI',kind:'measured',units:'energy'}));
 assert.throws(()=>importSpectralDataset(csv,{...metadata,inputUnits:'photons'}));
 assert.throws(()=>importSpectralDataset(csv.replace('750,.6,.8,1,1','750,.6,.8,-1,1'),metadata));
 const result=compareSpectra('danio-rerio',input,{peakShift:3});
 const saved={schema:'phenovoxel-spectral-study/1',speciesId:'danio-rerio',software:RESEARCH_VERSION,input,result:{...result,distance:999}};
 close(restoreSpectralStudy(saved,'danio-rerio').result.distance,result.distance);
 assert.throws(()=>restoreSpectralStudy(saved,'chelonia-mydas'));
 assert.throws(()=>restoreSpectralStudy({...saved,software:'old-version'},'danio-rerio'));
});
test('new DNA source records retain exact species, sequence integrity and partial limits',()=>{
 const records=JSON.parse(readFileSync(new URL('./molecular-records-v0706.json',import.meta.url))).records;
 const index=JSON.parse(readFileSync(new URL('./molecular-index-v0706.json',import.meta.url))).records;
 for(const [id,r] of Object.entries(records)){assert.equal(r.taxonId,r.sourceTaxonId);assert.equal(r.archiveScientificName,r.organism);assert.equal(r.sequence.length,r.length);assert.equal(createHash('sha256').update(r.sourceXml).digest('hex'),r.sourceXmlSha256);assert.ok(r.sourceXml.includes('taxon:'+r.sourceTaxonId));for(const f of r.features)if(f.type==='CDS'&&!f.translationRestriction)assert.equal(translateDNA(featureSequence(r,f),f.translationTable).replace(/\*$/,''),f.translation);assert.equal(createHash('sha256').update(r.sequence).digest('hex'),index[id].sequenceSha256);for(const f of r.features)for(const seg of f.segments){assert.ok(seg.start>=1&&seg.end<=r.length);}}
 assert.equal(records['gloydius-blomhoffii'].completeness,'partial');assert.equal(records['gloydius-blomhoffii'].length,657);assert.ok(records['gloydius-blomhoffii'].features[0].translationRestriction);
});
