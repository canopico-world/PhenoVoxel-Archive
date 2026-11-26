// Approximate one fixation using uniform acute-zone sampling across an assumed angular field.
export const reefOptics = Object.freeze({
  fieldDegrees: 90, spacingDegrees: 0.5, acceptanceFwhmDegrees: 0.6,
  source: 'https://doi.org/10.1007/s00359-019-01341-5'
});

const linear = Float32Array.from({length:256}, (_,i)=>{
  const v=i/255;
  return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
});
const display = Uint8Array.from({length:4097}, (_,i)=>{
  const v=i/4096;
  return Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055));
});

function gaussianSamples(length, count, sigma) {
  return Array.from({length:count}, (_,i)=>{
    const center=(i+.5)*length/count-.5;
    const start=Math.max(0,Math.ceil(center-3*sigma));
    const end=Math.min(length-1,Math.floor(center+3*sigma));
    const weights=Array.from({length:end-start+1},(_,j)=>Math.exp(-.5*((start+j-center)/sigma)**2));
    const sum=weights.reduce((a,b)=>a+b,0);
    return {start,weights:weights.map(v=>v/sum)};
  });
}

export function reefSampler(w,h) {
  const {fieldDegrees,spacingDegrees,acceptanceFwhmDegrees}=reefOptics;
  const width=Math.min(w,Math.round(fieldDegrees/spacingDegrees));
  const height=Math.max(1,Math.round(h*width/w));
  const sigma=w/fieldDegrees*acceptanceFwhmDegrees/Math.sqrt(8*Math.log(2));
  const xKernel=gaussianSamples(w,width,sigma),yKernel=gaussianSamples(h,height,sigma);
  const rows=new Float32Array(3*width*h),out=new Uint8ClampedArray(4*width*height);
  return {width,height,process(pixels){
    for(let y=0;y<h;y++)for(let x=0;x<width;x++){
      const {start,weights}=xKernel[x],offset=(y*width+x)*3;
      for(let c=0;c<3;c++){
        let v=0,at=(y*w+start)*4+c;
        for(const weight of weights){v+=linear[pixels[at]]*weight;at+=4;}
        rows[offset+c]=v;
      }
    }
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const {start,weights}=yKernel[y],offset=(y*width+x)*4;
      for(let c=0;c<3;c++){
        let v=0,at=(start*width+x)*3+c;
        for(const weight of weights){v+=rows[at]*weight;at+=3*width;}
        out[offset+c]=display[Math.round(Math.max(0,Math.min(1,v))*4096)];
      }
      out[offset+3]=255;
    }
    return out;
  }};
}

export function createReefView(){
  const buffer=document.createElement('canvas'),bc=buffer.getContext('2d');
  let sampler,previousWidth,previousHeight;
  return (ctx,rect)=>{
    const {x,y,width,height}=rect;
    if(!sampler||width!==previousWidth||height!==previousHeight){
      sampler=reefSampler(width,height);previousWidth=width;previousHeight=height;
      buffer.width=sampler.width;buffer.height=sampler.height;
    }
    const samples=sampler.process(ctx.getImageData(x,y,width,height).data);
    bc.putImageData(new ImageData(samples,sampler.width,sampler.height),0,0);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(buffer,x,y,width,height);ctx.restore();
  };
}
