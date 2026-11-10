import {SESSION_VERSION} from './sensory-session.js';
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const linear=new Float32Array(256);for(let i=0;i<256;i++){const v=i/255;linear[i]=v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}
const encode=x=>Math.round(255*(x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055));
export function photonEnergyEV(nm){return Number.isFinite(nm)&&nm>0?1239.8419843320026/nm:null;}
// Processed RGB is a display signal: none of these outputs is a receptor catch.
export function transformFrame(pixels,width,height,mode='achromatic',previous=null){
 if(pixels.length!==width*height*4)throw Error('Frame dimensions do not match');
 const out=new Uint8ClampedArray(pixels),luma=new Float32Array(width*height);let sum=0,sumSq=0;
 for(let n=0;n<luma.length;n++){const i=n*4,y=.2126*linear[pixels[i]]+.7152*linear[pixels[i+1]]+.0722*linear[pixels[i+2]];luma[n]=y;sum+=y;sumSq+=y*y;if(mode==='achromatic'||mode==='dolphin-achromatic'||mode==='squilla-achromatic'){out[i]=out[i+1]=out[i+2]=encode(y);}else if((mode==='bee-visible'||mode==='monarch-visible')){out[i]=pixels[i+1];out[i+1]=pixels[i+1];out[i+2]=pixels[i+2];}}
 if(mode==='edges'||mode==='change')for(let y=0;y<height;y++)for(let x=0;x<width;x++){const n=y*width+x,i=n*4;let value=0;if(mode==='edges')value=Math.hypot(luma[n]-luma[y*width+Math.min(width-1,x+1)],luma[n]-luma[Math.min(height-1,y+1)*width+x]);else if(previous?.length===luma.length)value=Math.abs(luma[n]-previous[n]);const v=clamp(value*4,0,1);out[i]=Math.round(28+v*177);out[i+1]=Math.round(42+v*189);out[i+2]=Math.round(49+v*155);}
 const mean=sum/luma.length,sd=Math.sqrt(Math.max(0,sumSq/luma.length-mean*mean));
 return{pixels:out,luma,metrics:{meanRelativeLuminance:mean,rmsContrast:mean>.0001?sd/mean:null,unit:'relative processed-image signal; not lux or radiance'}};
}
export function spectrumSummary(db,sampleRate,fftSize){
 const maxHz=Math.min(20000,sampleRate/2),binHz=sampleRate/fftSize;let peak=-Infinity,index=-1;
 for(let i=Math.ceil(30/binHz);i<db.length&&i*binHz<=maxHz;i++)if(Number.isFinite(db[i])&&db[i]>peak){peak=db[i];index=i;}
 return{peakHz:index>=0&&peak>-95?index*binHz:null,peakDb:index>=0&&peak>-95?peak:null,binHz,nyquistHz:sampleRate/2,displayMaxHz:maxHz,calibrated:false};
}
// A frozen comparison retains the baseline used for the last captured frame.
// Redrawing a split or exporting must not turn a recorded change into zero.
export class FrameHistory{
 constructor(){this.reset();}
 reset(){this.previous=null;this.baseline=null;}
 process(pixels,width,height,mode,newSample=true){
  if(newSample)this.baseline=this.previous;
  const result=transformFrame(pixels,width,height,mode,this.baseline);
  if(newSample)this.previous=result.luma;
  return result;
 }
}
// The generation token stops a permission response arriving after stop/navigation.
export class LocalMediaSession{
 constructor(request){this.request=request;this.generation=0;this.stream=null;}
 stop(){this.generation++;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;}
 async start(constraints){this.stop();const token=this.generation;const stream=await this.request(constraints);if(token!==this.generation){stream.getTracks().forEach(t=>t.stop());return null;}this.stream=stream;return stream;}
}
export function observationRecord({profile,mode,source,parameters,metrics,question,observation,sampleTime=null,releaseVersion=SESSION_VERSION}){
 return{schema:'phenovoxel-sensory-observation/1',software:{module:'sensory-lab',version:releaseVersion,settingsSchemaVersion:SESSION_VERSION,transform:mode.startsWith('diversity-')?'habitat-scene-experiments-v1':'species-display-proxies-v2'},createdAt:new Date().toISOString(),species:{id:profile.speciesId,scientificName:profile.scientificName},source,mode,parameters,metrics,sampleTime,question,observation,evidence:profile.references,limitations:['Uncalibrated phone/browser capture.','Image processing is not a reconstruction of subjective experience.','No UV, polarization, underwater sonar, molecular concentration or membrane-voltage measurement.','An observation or a model output is not evidence of animal communication.'],rawMediaIncluded:false};
}
