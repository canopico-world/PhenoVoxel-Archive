// Original numerical surface artwork, not organism photographs or tissue data.
// Rebuild with Node and the archive's existing Three dependency; no paid tools.
import fs from 'node:fs';import {deflateSync} from 'node:zlib';import crypto from 'node:crypto';
import * as T from 'three';import {noise,hash,mix} from './mollusca-surfaces.js';
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function chunk(type,data){const kind=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);kind.copy(out,4);data.copy(out,8);let crc=0xffffffff;for(const byte of Buffer.concat([kind,data]))crc=crcTable[(crc^byte)&255]^(crc>>>8);out.writeUInt32BE((crc^0xffffffff)>>>0,data.length+8);return out;}
function png(file,bytes,w,h){const head=Buffer.alloc(13);head.writeUInt32BE(w);head.writeUInt32BE(h,4);head[8]=8;head[9]=6;const scan=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++){const start=y*(w*4+1);scan[start]=1;for(let x=0;x<w*4;x++){const i=y*w*4+x;scan[start+1+x]=(bytes[i]-(x>=4?bytes[i-4]:0)+256)&255;}}const out=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(scan,{level:9})),chunk('IEND',Buffer.alloc(0))]);fs.writeFileSync(file,out);return{file,width:w,height:h,bytes:out.length,sha256:crypto.createHash('sha256').update(out).digest('hex'),pixelSha256:crypto.createHash('sha256').update(bytes).digest('hex')};}
const textures=[];
{
 const w=2048,h=512,bytes=new Uint8Array(w*h*4),locations=[.055,.20,.39,.58,.76],spread=[.038,.030,.05,.04,.035];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/(w-1),v=y/h;let band=0;
  for(let j=0;j<locations.length;j++){const p=locations[j]+.003*Math.sin(u*147+j)+.004*noise(u*183,j*9);band=Math.max(band,Math.exp(-Math.pow((v-p)/spread[j],4)));}
  const patches=noise(u*911+3,v*77),streaks=noise(u*1801,v*19),c=mix('#b18a4d','#634429',.37+.35*noise(u*137,v*39));
  c.lerp(new T.Color('#281b12'),band*T.MathUtils.smoothstep(patches,.14,.47)*.94).lerp(new T.Color('#cfb271'),.5*Math.pow(streaks,5)).convertLinearToSRGB();
  const i=(y*w+x)*4;bytes[i]=Math.round(c.r*255);bytes[i+1]=Math.round(c.g*255);bytes[i+2]=Math.round(c.b*255);bytes[i+3]=255;
 }
 textures.push({...png('texture-cornu-shell-v0634.png',bytes,w,h),encoding:'sRGB colour'});
}
{
 const w=512,h=512,color=new Uint8Array(w*h*4),height=new Uint8Array(w*h*4),points=new Map();
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/h,px=u*67,py=v*34,ix=Math.floor(px),iy=Math.floor(py);let first=Infinity,second=Infinity;
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
   const nx=ix+a,ny=iy+b,wx=(nx+670)%67,wy=(ny+340)%34,key=wx+':'+wy;let p=points.get(key);
   if(!p){p=[.1+.8*hash(wx*137+wy*53),.1+.8*hash(wx*71+wy*197)];points.set(key,p);}
   const d=(nx+p[0]-px)**2+(ny+p[1]-py)**2;if(d<first){second=first;first=d;}else if(d<second)second=d;
  }
  const q=Math.min(1,Math.exp(-first*7)+.30*Math.exp(-second*7)),c=mix('#37382f','#999578',.08+.45*q+.10*noise(u*71+18,v*71)),i=(y*w+x)*4;
  // Preserve the candidate's linear-byte selection before sRGB delivery.
  c.setRGB(Math.round(c.r*255)/255,Math.round(c.g*255)/255,Math.round(c.b*255)/255).convertLinearToSRGB();
  color[i]=Math.round(c.r*255);color[i+1]=Math.round(c.g*255);color[i+2]=Math.round(c.b*255);color[i+3]=255;
  height[i]=height[i+1]=height[i+2]=Math.round(255*q);height[i+3]=255;
 }
 textures.push({...png('texture-cornu-skin-color-v0634.png',color,w,h),encoding:'sRGB colour'},{...png('texture-cornu-skin-height-v0634.png',height,w,h),encoding:'linear numerical height'});
}
const manifest={version:'0.6.34',creator:'PhenoVoxel Archive contributors',license:'MIT for original numerical texture assets and generation code',source:'texture-cornu-generate.mjs and mollusca-surfaces.js; independently authored numeric functions',photographicPixels:false,aiGeneratedMedia:false,measuredTissueData:false,scope:'Qualitative selected shell pigment and skin relief artwork. Neither a photograph nor a measured biological surface.',textures};
fs.writeFileSync('texture-cornu-v0634.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(textures.map(t=>({file:t.file,bytes:t.bytes}))));
