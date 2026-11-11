import {DIVERSITY_SPECIES,DIVERSITY_VERSION} from './sensory-diversity.js';
import {pigmentSensitivity} from './sensory-research.js';
const linear=Float64Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
const encode=x=>Math.round(255*(x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055));
export function diversityDefaults(id){const p=DIVERSITY_SPECIES[id];if(!p)throw Error('Unknown sensory study');return Object.fromEntries(p.controls.map(([k,,,,,value])=>[k,value]));}
export function validateDiversity(id,input){const p=DIVERSITY_SPECIES[id];if(!p||!input)throw Error('Unknown sensory study or missing inputs');for(const [k,,min,max] of p.controls)if(!Number.isFinite(input[k])||input[k]<min||input[k]>max)throw Error('Invalid '+k);if(p.kind==='direction'&&!Number.isInteger(input.sectors))throw Error('Sectors must be whole');if(p.kind==='acceptance'&&!Number.isInteger(input.adapted))throw Error('Adaptation anchor must be 0 or 1');if(p.kind==='mirror'&&!Number.isInteger(input.plane))throw Error('Plane must be 0 or 1');return Object.fromEntries(p.controls.map(([k])=>[k,input[k]]));}
export function diversityCalculation(id,input=diversityDefaults(id)){
 const p=DIVERSITY_SPECIES[id],s=validateDiversity(id,input);let rows=[];
 if(p.kind==='aperture')rows=[['Relative diamond aperture area',s.width*s.height,'fraction; assigned geometry']];
 else if(p.kind==='rodTemplate')rows=[['478 nm rod-template response',pigmentSensitivity(s.wavelength,478,'govardovskii-alpha'),'relative absorbance; not pixel intensity']];
 else if(p.kind==='acuteZone')rows=[['Assigned sharp-region radius',s.radius,'image fraction'],['Peripheral pooling',s.blur,'analysis pixels']];
 else if(p.kind==='polarInput'){const d=s.degree*Math.cos(2*s.angle*Math.PI/180);rows=[['Ideal analyzer 0°',(1+d)/2,'normalized intensity'],['Ideal analyzer 90°',(1-d)/2,'normalized intensity'],['Analyzer difference',d,'not behavioral response']];}
 else if(p.kind==='lightGate')rows=[['Hypothetical gate',1/(1+s.sensitivity*s.illumination),'not firing probability']];
 else if(p.kind==='shadowStep')rows=[['Absolute light decrease',Math.max(0,s.before-s.after),'relative units'],['Relative decrease',s.before?Math.max(0,s.before-s.after)/s.before:0,'earlier zero: undefined, displayed as 0']];
 else if(p.kind==='lightDose')rows=[['Assigned exposure integral',s.lux*s.hours,'lux hours; not biological dose'],['Study comparison illumination',10,'lux; context-specific, not universal threshold']];
 else if(p.kind==='spatial')rows=[['Horizontal pooling cells',Math.ceil(s.fov/s.angle),'cells'],['Assumed scene span',s.fov,'degrees']];
 else if(p.kind==='pupil')rows=[['Relative admitted light (fixed irradiance)',s.diameter**2,'fraction']];
 else if(p.kind==='mirror')rows=[['Assigned central-field radius',s.center,'image fraction'],['Assigned defocus',s.blur,'analysis pixels']];
 else if(p.kind==='direction')rows=[['Assigned directional sectors',s.sectors,'sectors']];
 else if(p.kind==='spectral')rows=p.peaks.map(n=>['Nominal pigment '+n+' nm',pigmentSensitivity(s.wavelength,n,'govardovskii-alpha'),'relative absorbance']);
 else if(p.kind==='genetic')rows=[['Relative to mutant assay endpoint',s.wavelength-740,'nm above 740 (negative = below)'],['Relative to control assay endpoint',s.wavelength-830,'nm above 830 (negative = below)']];
 else if(p.kind==='gain')rows=[['Assigned linear gain',s.gain,'× (not an ERG fit)']];
 else if(p.kind==='temporal')rows=[['Assigned motion smear',s.speed*s.integration/1000,'degrees'],['Horizontal scene fraction',s.speed*s.integration/1000/s.fov,'fraction']];
 else if(p.kind==='missingUV')rows=[['Hypothetical UV contrast',s.targetUV+s.backgroundUV?(s.targetUV-s.backgroundUV)/(s.targetUV+s.backgroundUV):0,'Michelson contrast; both zero → undefined, displayed as 0'],['Measured camera UV channels',0,'channels']];
 else if(p.kind==='adaptation')rows=[['Assigned chromatic cue removal',s.weight,'fraction'],['Reported dark-adapted ERG peak',520,'nm'],['Reported light-adapted flicker peak',550,'nm']];
 else if(p.kind==='cueAblation')rows=[['Retained camera chromatic cues',1-s.weight,'fraction; not animal cone contrast']];
 else if(p.kind==='horizon')rows=[['Assigned horizon height',s.horizon,'image fraction'],['Assigned detailed band',s.band,'image fraction']];
 else if(p.kind==='acceptance')rows=[['Reported acceptance-angle anchor',s.adapted?8.85:11.3,'degrees; not acuity'],['Illustrative pooling cells',Math.ceil(s.fov/(s.adapted?8.85:11.3)),'cells']];
 else if(p.kind==='defocus')rows=[['Paraxial angular blur diameter',s.pupil*.001*s.diopters*180/Math.PI,'degrees; illustrative'],['Assigned defocus',s.diopters,'diopters']];
 else if(p.kind==='lightSensor')rows=[['Assigned directional factor',(1+s.screening*Math.cos(s.angle*Math.PI/180))/(1+s.screening),'relative, not measured current']];
 else if(p.kind==='photoStep')rows=[['Hypothetical step-up input',Math.max(0,s.after-s.before),'relative; not cAMP or response probability']];
 return{schema:'phenovoxel-scene-study/1',version:DIVERSITY_VERSION,species:id,kind:p.kind,inputs:s,rows:rows.map(([label,value,unit])=>({label,value,unit})),method:p.method,evidence:p.evidence,limits:p.limits,validation:p.validation,perceptual95CI:null,uncertainty:'Scenario controls are not confidence intervals. No fitted perceptual dataset or independent validation.',rawMediaIncluded:false};
}
// Box averaging in linear RGB. Alpha is retained at each output pixel.
function pooled(src,w,h,cellX,cellY){
 const out=new Uint8ClampedArray(src);
 for(let y=0;y<h;y+=cellY)for(let x=0;x<w;x+=cellX){const xe=Math.min(w,x+cellX),ye=Math.min(h,y+cellY),sum=[0,0,0],count=(xe-x)*(ye-y);for(let j=y;j<ye;j++)for(let i=x;i<xe;i++)for(let c=0;c<3;c++)sum[c]+=linear[src[(j*w+i)*4+c]];const rgb=sum.map(v=>encode(v/count));for(let j=y;j<ye;j++)for(let i=x;i<xe;i++)for(let c=0;c<3;c++)out[(j*w+i)*4+c]=rgb[c];}
 return out;
}
export function renderDiversity(pixels,w,h,id,input=diversityDefaults(id)){
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||pixels.length!==w*h*4)throw Error('Invalid image dimensions');
 const p=DIVERSITY_SPECIES[id],s=validateDiversity(id,input);let out=new Uint8ClampedArray(pixels),clipped=0;
 if(p.kind==='aperture'){for(let i=0;i<out.length;i+=4)for(let c=0;c<3;c++)out[i+c]=encode(linear[pixels[i+c]]*s.width*s.height);}
 else if(p.kind==='acuteZone'){const blurred=pooled(pixels,w,h,Math.round(s.blur),Math.round(s.blur));for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(Math.hypot((x/w-s.center)*2,(y/h-.5)*2)>s.radius)for(let c=0;c<3;c++){const i=(y*w+x)*4+c;out[i]=blurred[i];}}
 else if(['lightGate','shadowStep','lightDose'].includes(p.kind)){const value=p.kind==='lightGate'?1/(1+s.sensitivity*s.illumination):p.kind==='shadowStep'?Math.max(0,s.before-s.after):s.lux/50;for(let i=0;i<out.length;i+=4)out[i]=out[i+1]=out[i+2]=encode(value);}
 else if(p.kind==='spatial'){const cell=Math.max(1,Math.round(w*s.angle/s.fov));out=pooled(pixels,w,h,cell,cell);}
 else if(p.kind==='mirror'){
  const blurred=pooled(pixels,w,h,Math.round(s.blur),Math.round(s.blur));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const r=Math.hypot((x-w/2)/(w/2),(y-h/2)/(h/2)),outside=Math.max(0,Math.min(1,(r-s.center)*8+.5)),mix=s.plane===1?1-outside:outside;for(let c=0;c<3;c++){const i=(y*w+x)*4+c;out[i]=encode(linear[pixels[i]]*(1-mix)+linear[blurred[i]]*mix);}}
 }else if(p.kind==='direction'){
  const count=Math.round(s.sectors);out=pooled(pixels,w,h,Math.ceil(w/count),h);
  for(let i=0;i<out.length;i+=4){const y=.2126*linear[out[i]]+.7152*linear[out[i+1]]+.0722*linear[out[i+2]];out[i]=out[i+1]=out[i+2]=encode(y);}
 }else if(p.kind==='spectral'){
  for(let i=0;i<out.length;i+=4)if(p.proxy==='blue-green'){out[i]=pixels[i+1];out[i+1]=pixels[i+1];out[i+2]=pixels[i+2];}else{out[i]=pixels[i];out[i+1]=pixels[i+1];out[i+2]=pixels[i+1];}
 }else if(p.kind==='pupil'||p.kind==='gain'){
  const gain=p.kind==='pupil'?s.diameter**2:s.gain;for(let i=0;i<out.length;i+=4)for(let c=0;c<3;c++){const v=linear[pixels[i+c]]*gain;if(v>1)clipped++;out[i+c]=encode(Math.min(1,v));}
 }else if(p.kind==='temporal'){
  // Exact uniform average over an integer translation window, edge replicated.
  const span=w*s.speed*(s.integration/1000)/s.fov,window=Math.round(span);
  if(window>0){const left=Math.floor(window/2),right=window-left;for(let y=0;y<h;y++)for(let c=0;c<3;c++){const prefix=new Float64Array(w+1);for(let x=0;x<w;x++)prefix[x+1]=prefix[x]+linear[pixels[(y*w+x)*4+c]];for(let x=0;x<w;x++){const lo=x-left,hi=x+right,a=Math.max(0,lo),b=Math.min(w-1,hi);let sum=prefix[b+1]-prefix[a];if(lo<0)sum+=-lo*linear[pixels[y*w*4+c]];if(hi>=w)sum+=(hi-w+1)*linear[pixels[(y*w+w-1)*4+c]];out[(y*w+x)*4+c]=encode(sum/(window+1));}}}
 }
 if(p.kind==='cueAblation'||p.kind==='adaptation'){
  for(let i=0;i<out.length;i+=4){const y=.2126*linear[pixels[i]]+.7152*linear[pixels[i+1]]+.0722*linear[pixels[i+2]];for(let c=0;c<3;c++)out[i+c]=encode(linear[pixels[i+c]]*(1-s.weight)+y*s.weight);}
 }else if(p.kind==='acceptance'||p.kind==='defocus'){
  const angle=p.kind==='acceptance'?(s.adapted?8.85:11.3):s.pupil*.001*s.diopters*180/Math.PI,cell=Math.max(1,Math.round(w*angle/s.fov));out=pooled(pixels,w,h,cell,cell);
 }else if(p.kind==='horizon'){
  const blur=pooled(pixels,w,h,1,Math.round(s.blur));for(let y=0;y<h;y++)if(Math.abs(y/h-s.horizon)>s.band/2)for(let x=0;x<w;x++)for(let c=0;c<3;c++){const i=(y*w+x)*4+c;out[i]=blur[i];}
 }else if(p.kind==='lightSensor'||p.kind==='photoStep'){
  const channel=p.kind==='lightSensor'?1:2;let mean=0;for(let i=0;i<pixels.length;i+=4)mean+=linear[pixels[i+channel]];mean/=w*h;
  if(p.kind==='lightSensor')mean*=(1+s.screening*Math.cos(s.angle*Math.PI/180))/(1+s.screening);
  for(let i=0;i<out.length;i+=4)out[i]=out[i+1]=out[i+2]=encode(mean);
 }
 return{pixels:out,clippedFraction:clipped/(w*h*3),...diversityCalculation(id,s)};
}
