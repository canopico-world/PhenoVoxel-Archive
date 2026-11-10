import {HYPOTHESIS_SPECIES,HYPOTHESIS_VERSION} from './sensory-hypotheses.js';
import {pigmentSensitivity} from './sensory-research.js';
import {CLOWNFISH_CURVES,CLOWNFISH_CURVE_SOURCE} from './sensory-clownfish-curves.js';
const finite=(v,min,max,name)=>{if(!Number.isFinite(v)||v<min||v>max)throw Error(`${name} must be ${min}–${max}.`);return v;};
export const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
export function fisherInterval(r,n){
 finite(r,-.999999,.999999,'Correlation');if(!Number.isInteger(n)||n<4)throw Error('At least four independent units required.');
 const z=Math.atanh(r),h=1.959963984540054/Math.sqrt(n-3);
 return{estimate:r,lower:Math.tanh(z-h),upper:Math.tanh(z+h),n,level:.95,method:'Approximate Fisher-z interval from rounded summary; independent bivariate-normal units assumed'};
}
export function lensInterval(){
 const values=[322,340,341],estimate=mean(values),sd=Math.sqrt(values.reduce((a,x)=>a+(x-estimate)**2,0)/2),h=4.302652729911275*sd/Math.sqrt(3);
 return{estimate,lower:estimate-h,upper:estimate+h,sd,n:3,values,units:'nm',level:.95,method:'Student t interval for a population mean; df=2; iid normal fish assumed; small sample and rounding limit inference'};
}
export function bootstrapFish(rows,{iterations=20000,seed=710}={}){
 if(!Number.isInteger(iterations)||iterations<1000||iterations>100000)throw Error('Use 1,000–100,000 replicates.');
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Seed must be an unsigned 32-bit integer.');
 const fish=new Map(),seen=new Set();
 for(const row of rows){const [color,contrast,id,value,noise]=row;if(!['UV','UV_neg','neutral'].includes(contrast)||!id||!color||noise!=='0.11_0.1_0.14_0.14'||String(value).trim()==='')throw Error('Unexpected source row.');const v=finite(Number(value),0,100,'Threshold');const key=id+'|'+color;if(seen.has(key))throw Error('Duplicate fish/color row.');seen.add(key);if(!fish.has(id))fish.set(id,{id,UV:[],UV_neg:[]});if(contrast!=='neutral')fish.get(id)[contrast].push(v);}
 const paired=[...fish.values()].filter(f=>f.UV.length&&f.UV_neg.length).map(f=>({id:f.id,positiveMean:mean(f.UV),negativeMean:mean(f.UV_neg),difference:mean(f.UV)-mean(f.UV_neg)}));
 if(paired.length<3)throw Error('At least three paired fish required.');
 let state=seed>>>0;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 const values=paired.map(f=>f.difference),draws=[];
 for(let b=0;b<iterations;b++){let sum=0;for(let i=0;i<values.length;i++)sum+=values[Math.floor(random()*values.length)];draws.push(sum/values.length);}
 draws.sort((a,b)=>a-b);const quantile=p=>{const t=(draws.length-1)*p,i=Math.floor(t);return draws[i]+(draws[Math.min(i+1,draws.length-1)]-draws[i])*(t-i);};
 return{estimate:mean(values),lower:quantile(.025),upper:quantile(.975),level:.95,n:paired.length,paired,excludedUnpaired:fish.size-paired.length,iterations,seed,units:'ΔS (published fitted thresholds)',method:'Exploratory paired fish-level percentile bootstrap: mean UV-positive minus mean UV-negative threshold per fish, then equal weight across fish',limits:'Convenience sample; color sets differ and order/learning may confound contrast. Threshold-fit uncertainty and receptor-noise uncertainty are not propagated. Not a reproduction of the paper’s mixed-effects analysis, a causal UV effect, or independent validation.'};
}
export function hypothesisDefaults(id){const p=HYPOTHESIS_SPECIES[id];if(!p)throw Error('Unknown study.');return p.kind==='spectral'?{a:380,b:550,shift:0}:p.kind==='polarization'?{angle:45,orientation:0,degree:.8}:p.kind==='spatial'?{distance:2,acuity:3.3}:p.kind==='action-range'?{wavelength:630}:{ratio:4,context:1};}
export function clownfishSensitivity(nm,channel,shift=0){
 finite(nm,250,850,'Wavelength');if(!Number.isInteger(channel)||channel<0||channel>3)throw Error('Invalid cone index.');finite(shift,-10,10,'Curve shift');
 const index=nm-shift-300;if(index<0||index>500)return 0;const low=Math.floor(index),high=Math.min(500,low+1),t=index-low;
 return CLOWNFISH_CURVES[low][channel+1]*(1-t)+CLOWNFISH_CURVES[high][channel+1]*t;
}
function bandCatch(center,peak,template,channel=null,shift=0){let q=0,total=0;for(let nm=300;nm<=(channel===null?750:800);nm++){const photons=Math.exp(-.5*((nm-center)/10)**2);total+=photons;q+=photons*(channel===null?pigmentSensitivity(nm,peak,template):clownfishSensitivity(nm,channel,shift));}return q/total;}
export function runHypothesis(id,input=hypothesisDefaults(id)){
 const p=HYPOTHESIS_SPECIES[id];if(!p)throw Error('Unknown study.');let rows=[],description='',method='',extra={};
 if(p.kind==='spectral'){
  const a=finite(input.a,320,700,'Stimulus A center'),b=finite(input.b,320,700,'Stimulus B center'),shift=finite(input.shift,-10,10,'Peak shift');
  const catchFor=(center,peak,i,s)=>bandCatch(center,peak+s,p.template,p.sourceCurves?i:null,s);
  rows=p.peaks.map((peak,i)=>{const x=catchFor(a,peak,i,shift),y=catchFor(b,peak,i,shift);return{label:`Channel ${i+1} · ~${peak+shift} nm`,a:x,b:y,difference:x-y};});
  if(id==='carcinus-maenas'){const x=bandCatch(a,504+shift,p.template),y=bandCatch(b,504+shift,p.template);extra.singleChannel={peak:504+shift,a:x,b:y,difference:x-y};}
  description='Relative template excitation under two equal-photon synthetic bands. Differences are not just-noticeable differences or probabilities.';
  method='Unit-integral Gaussian photon bands (SD 10 nm), sampled 300–750 nm at 1 nm; integrate against peak-normalized alpha-band templates. Uniform transmission, equal gain; no beta bands. Peak shifts are assumption tests, not confidence intervals.';
  if(p.sourceCurves){method='Unit-integral synthetic Gaussian photon bands (SD 10 nm), integrated at 1 nm over 300–800 nm against the authors’ published fitted cone curves (U, M1, M2, L). Equal gains; no added ocular filter or neural noise. Shifted curves use linear interpolation, zero outside source support. Curve shifts are assumption tests, not confidence intervals.';extra.curveSource=CLOWNFISH_CURVE_SOURCE;}
  extra.sensitivity=[-10,0,10].map(s=>({shift:s,differences:p.peaks.map((n,i)=>catchFor(a,n,i,s)-catchFor(b,n,i,s))}));
 }else if(p.kind==='polarization'){
  const a=finite(input.angle,0,180,'Target angle'),o=finite(input.orientation,0,180,'Analyzer orientation'),d=finite(input.degree,0,1,'Degree of linear polarization');
  const intensity=(theta,axis)=>(1+d*Math.cos(2*(theta-axis)*Math.PI/180))/2;
  rows=[o,o+90].map((axis,i)=>({label:`Ideal analyzer ${i+1}`,a:intensity(a,axis),b:intensity(0,axis),difference:intensity(a,axis)-intensity(0,axis)}));
  description='Target and background have equal total intensity. Bars show ideal analyzer transmission; screen colors are diagram colors.';
  method='Iout/Iin = [1 + DoLP × cos(2(θ − α))]/2. Background θ=0°. Ideal optics; no biological gain, noise or perception fitted.';
 }else if(p.kind==='spatial'){
  const d=finite(input.distance,.1,20,'Viewing distance'),a=finite(input.acuity,2.6,4,'Acuity');const period=2*d*Math.tan(Math.PI/(360*a))*1000;
  rows=[{label:'One grating period',value:period,unit:'mm'},{label:'Half-period (one bar)',value:period/2,unit:'mm'}];description='Physical grating size subtending one cycle at the assumed distance. This is not a detection guarantee.';method='Period = 2 × distance × tan[(1 / cycles-per-degree) × π / 360]. The 2.6–4.0 range is published observations, not a 95% interval.';
 }else if(p.kind==='action-range'){
  const w=finite(input.wavelength,400,700,'Wavelength');rows=[{label:'Candidate wavelength',value:w,unit:'nm'},{label:'Distance to reported maximum region',value:w<625?625-w:w>640?w-640:0,unit:'nm'}];description=w>=625&&w<=640?'Inside the reported photopic maximum region; no response amplitude inferred.':'Outside the reported maximum region; this does not imply invisibility.';method='Distance to the reported closed interval [625,640] nm. No curve or confidence distribution fitted.';
 }else{
  const ratio=finite(input.ratio,.25,8,'Blue:amber ratio'),context=finite(input.context,0,1,'Chemical context');if(![0,1].includes(context))throw Error('Context must be 0 or 1.');rows=[{label:'Assumed blue photon share',value:ratio/(1+ratio),unit:'fraction'},{label:'Assumed amber photon share',value:1/(1+ratio),unit:'fraction'}];description=context?'Aversive chemical context selected. Avoidance remains unestimated: no dose-response fit is available.':'No aversive chemical context selected. Spectrum alone does not specify avoidance.';method='Normalize a user-assigned blue:amber photon ratio. This is a hypothetical input convention, not a conversion of the paper’s calibrated light settings or camera color.';
 }
 return{schema:'phenovoxel-hypothesis/1',version:HYPOTHESIS_VERSION,species:id,kind:p.kind,inputs:{...input},rows,description,method,...extra,predictionStatus:'Computational hypothesis; no independent biological validation',perceptual95CI:null,intervalReason:'No dataset linking this model to subjective appearance; a 95% accuracy claim is not estimable.',references:p.sources,limits:p.limits};
}
