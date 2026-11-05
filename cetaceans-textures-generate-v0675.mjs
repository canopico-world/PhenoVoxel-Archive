import fs from 'node:fs';import crypto from 'node:crypto';import sharp from 'sharp';import * as T from 'three';
import {cet16Profiles} from './cetaceans-config-v0675.js';import {surfaceColour} from './cetacean-models.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),selected=process.argv.slice(2),assets=selected.length?JSON.parse(fs.readFileSync('cetaceans-textures-v0675.json')).assets:{},W=2048,H=1024;
for(const [id,c] of Object.entries(cet16Profiles)){
 if(selected.length&&!selected.includes(id))continue;
 for(const kind of ['body','flipper','fluke']){const w=kind==='body'?W:1024,h=kind==='body'?H:128,data=Buffer.alloc(w*h*3),out=new T.Color();
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const u=i/(w-1),a=j===h-1?0:j/(h-1)*Math.PI*2,q=Math.cos(a);surfaceColour(c,u,a,out,kind,u);
   // Gray's spinner has three longitudinal fields, not a two-tone generic dolphin.
   if(kind==='body'&&c.tripartite){const t=T.MathUtils.smoothstep(-q,-.48,-.27);out.set(c.back).lerp(new T.Color(c.side),t);out.lerp(new T.Color(c.belly),T.MathUtils.smoothstep(-q,.50,.69));}
   // Sei bite scars are selected irregular oval surface marks, not barnacles.
   if(kind==='body'&&c.ovalScars){let v=0;for(let k=0;k<15;k++){const x=.27+.61*((k*.61803399)%1),b=1+4.2*((k*.41421356)%1),da=Math.atan2(Math.sin(a-b),Math.cos(a-b)),d=((u-x)/(.004+k%3*.001))**2+(da/.042)**2;v=Math.max(v,Math.exp(-(((Math.sqrt(d)-1)/.25)**2)));}out.lerp(new T.Color('#a3aca9'),v*.58);}
   out.convertLinearToSRGB();const k=(j*w+i)*3;data[k]=Math.round(T.MathUtils.clamp(out.r,0,1)*255);data[k+1]=Math.round(T.MathUtils.clamp(out.g,0,1)*255);data[k+2]=Math.round(T.MathUtils.clamp(out.b,0,1)*255);
  }
  const file=`skin-cet16-v0675-${id}-${kind}.webp`,bytes=await sharp(data,{raw:{width:w,height:h,channels:3}}).webp({quality:96}).toBuffer();fs.writeFileSync(file,bytes);assets[id+':'+kind]={file,width:w,height:h,sha256:hash(bytes)};
 }
 console.log(id);
}
// Shared low-relief skin detail. Seam-periodic in angle, no raised scales or
// coarse stone pattern; amplitude is an artistic optical selection, not microns.
for(const kind of ['normal','roughness']){const data=Buffer.alloc(W*H*3);for(let j=0;j<H;j++)for(let i=0;i<W;i++){const a=j/(H-1)*Math.PI*2,u=i/(W-1),v=Math.sin(u*720+Math.sin(a*93)*2)*Math.sin(a*191+u*87),b=Math.sin(u*1131+Math.cos(a*137));const k=(j*W+i)*3;if(kind==='normal'){data[k]=128+Math.round(v*3);data[k+1]=128+Math.round(b*3);data[k+2]=255;}else{data[k]=data[k+1]=data[k+2]=118+Math.round(v*5+b*3);}}
 const file=`skin-cet16-v0675-${kind}.png`,bytes=await sharp(data,{raw:{width:W,height:H,channels:3}}).png().toBuffer();fs.writeFileSync(file,bytes);assets[kind]={file,width:W,height:H,sha256:hash(bytes)};
}
fs.writeFileSync('cetaceans-textures-v0675.json',JSON.stringify({version:'0.6.75',author:'PhenoVoxel Archive',license:'MIT',scope:'Original deterministic artistic PBR maps; no photo pixels or measured skin reflectance.',assets},null,2)+'\n');
