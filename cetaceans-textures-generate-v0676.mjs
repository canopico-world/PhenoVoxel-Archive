import fs from 'node:fs';import crypto from 'node:crypto';import sharp from 'sharp';import * as T from 'three';
import {cetacean676Profiles} from './cetaceans-config-v0676.js';import {skinSample,mouthQ} from './cetaceans-skin-v0676.js';
const manifest={version:'0.6.76',author:'PhenoVoxel Archive',license:'MIT',scope:'Original reference-led pigment, scar relief and spatially varying roughness. No photograph pixels or baked illumination; optical values are authored, not measured.',assets:{}};
const selected=process.argv.slice(2),old='cetaceans-textures-v0676.json';if(fs.existsSync(old)){const prior=JSON.parse(fs.readFileSync(old));if(prior.detailLayer)manifest.detailLayer=prior.detailLayer;}if(selected.length&&fs.existsSync(old))Object.assign(manifest.assets,JSON.parse(fs.readFileSync(old)).assets);
for(const [id,c]of Object.entries(cetacean676Profiles)){
 if(selected.length&&!selected.includes(id))continue;
 for(const kind of ['body','flipper','fluke','dorsal']){
  const w=kind==='body'?4096:1024,h=kind==='body'?2048:256; c.skinMouthQ=Array.from({length:w},(_,i)=>mouthQ(c,i/(w-1))); const base=new Uint8Array(w*h*3),rough=new Uint8Array(w*h*3),height=new Float32Array(w*h),normal=new Uint8Array(w*h*3),out=new T.Color();
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const a=(j===h-1?0:j/(h-1))*Math.PI*2,k=j*w+i,p=skinSample(c,i/(w-1),a,kind,out);height[k]=p.relief;out.convertLinearToSRGB();base[k*3]=Math.round(T.MathUtils.clamp(out.r,0,1)*255);base[k*3+1]=Math.round(T.MathUtils.clamp(out.g,0,1)*255);base[k*3+2]=Math.round(T.MathUtils.clamp(out.b,0,1)*255);rough.fill(Math.round(p.roughness*255),k*3,k*3+3);}
  const circumference=kind==='body'?2.1:.20,length=kind==='body'?3.85:.65;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*w+i,dx=(height[j*w+Math.min(w-1,i+1)]-height[j*w+Math.max(0,i-1)])*w/(2*length),dy=(height[((j+1)%(h-1))*w+i]-height[((j+h-2)%(h-1))*w+i])*h/(2*circumference),v=new T.Vector3(-dx,-dy,1).normalize();normal[k*3]=Math.round((v.x*.5+.5)*255);normal[k*3+1]=Math.round((v.y*.5+.5)*255);normal[k*3+2]=Math.round((v.z*.5+.5)*255);}
  for(const [channel,data]of [['color',base],['roughness',rough],['normal',normal]]){const file=`skin-cet16-v0676-${id}-${kind}-${channel}.webp`,width=channel==='color'?w:w/2,height=channel==='color'?h:h/2,bytes=await sharp(data,{raw:{width:w,height:h,channels:3}}).resize(width,height).webp({quality:channel==='normal'?96:95}).toBuffer();fs.writeFileSync(file,bytes);manifest.assets[`${id}:${kind}:${channel}`]={file,width,height,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};}
 }
 console.log(id+' skin complete');fs.writeFileSync(old,JSON.stringify(manifest,null,2)+'\n');
}
