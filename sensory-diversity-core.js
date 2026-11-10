import {DIVERSITY_SPECIES,DIVERSITY_VERSION} from './sensory-diversity.js';
import {pigmentSensitivity} from './sensory-research.js';
const linear=Float64Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
const encode=x=>Math.round(255*(x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055));
export function diversityDefaults(id){const p=DIVERSITY_SPECIES[id];if(!p)throw Error('Unknown sensory study');return Object.fromEntries(p.controls.map(([k,,,,,value])=>[k,value]));}
export function validateDiversity(id,input){const p=DIVERSITY_SPECIES[id];if(!p||!input)throw Error('Unknown sensory study or missing inputs');for(const [k,,min,max] of p.controls)if(!Number.isFinite(input[k])||input[k]<min||input[k]>max)throw Error('Invalid '+k);if(p.kind==='direction'&&!Number.isInteger(input.sectors))throw Error('Sectors must be whole');if(p.kind==='mirror'&&!Number.isInteger(input.plane))throw Error('Plane must be 0 or 1');return Object.fromEntries(p.controls.map(([k])=>[k,input[k]]));}
export function diversityCalculation(id,input=diversityDefaults(id)){
 const p=DIVERSITY_SPECIES[id],s=validateDiversity(id,input);let rows=[];
 if(p.kind==='spatial')rows=[['Horizontal pooling cells',Math.ceil(s.fov/s.angle),'cells'],['Assumed scene span',s.fov,'degrees']];
 else if(p.kind==='pupil')rows=[['Relative admitted light (fixed irradiance)',s.diameter**2,'fraction']];
 else if(p.kind==='mirror')rows=[['Assigned central-field radius',s.center,'image fraction'],['Assigned defocus',s.blur,'analysis pixels']];
 else if(p.kind==='direction')rows=[['Assigned directional sectors',s.sectors,'sectors']];
 else if(p.kind==='spectral')rows=p.peaks.map(n=>['Nominal pigment '+n+' nm',pigmentSensitivity(s.wavelength,n,'govardovskii-alpha'),'relative absorbance']);
 else if(p.kind==='genetic')rows=[['Relative to mutant assay endpoint',s.wavelength-740,'nm above 740 (negative = below)'],['Relative to control assay endpoint',s.wavelength-830,'nm above 830 (negative = below)']];
 else if(p.kind==='gain')rows=[['Assigned linear gain',s.gain,'× (not an ERG fit)']];
 else if(p.kind==='temporal')rows=[['Assigned motion smear',s.speed*s.integration/1000,'degrees'],['Horizontal scene fraction',s.speed*s.integration/1000/s.fov,'fraction']];
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
 if(p.kind==='spatial'){const cell=Math.max(1,Math.round(w*s.angle/s.fov));out=pooled(pixels,w,h,cell,cell);}
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
 return{pixels:out,clippedFraction:clipped/(w*h*3),...diversityCalculation(id,s)};
}
