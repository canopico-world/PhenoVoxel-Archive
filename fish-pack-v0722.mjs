import fs from 'node:fs';import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import sharp from 'sharp';import crypto from 'node:crypto';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),summary={};
// Blender's sturgeon material decodes the packed sRGB grayscale image and
// inverts it before the roughness input. glTF reads roughness as linear data.
async function bakeSturgeonRoughness(src){
 const {data,info}=await sharp(src).resize(2048,2048).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 for(let i=1;i<data.length;i+=info.channels){
  const s=data[i]/255;
  const linear=s<=.04045?s/12.92:((s+.055)/1.055)**2.4;
  data[i]=Math.round(255*(1-linear));
 }
 return sharp(data,{raw:info}).png({compressionLevel:9}).toBuffer();
}
for(const [n,id] of [['sturgeon','acipenser-oxyrinchus'],['eel','anguilla-rostrata']]){
 const d=await io.read('research-cache/fish-v0722/'+n+'-raw.glb'),r=d.getRoot(),textures=[];
 for(const t of r.listTextures()){
  const color=r.listMaterials().some(m=>m.getBaseColorTexture()===t),src=t.getImage();
  const roughness=r.listMaterials().some(m=>m.getMetallicRoughnessTexture()===t);
  const image=color?await sharp(src).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toBuffer()
   :n==='sturgeon'&&roughness?await bakeSturgeonRoughness(src)
   :await sharp(src).resize(2048,2048).toColourspace('srgb').png({compressionLevel:9}).toBuffer();
  t.setImage(image).setMimeType(color?'image/jpeg':'image/png');textures.push({name:t.getName(),sourceSha256:crypto.createHash('sha256').update(src).digest('hex'),width:color?4096:2048,bytes:image.length});
 }
 // Distinct ocular finish, retaining original UVs and photographed pigmentation.
 const eye=r.listNodes().find(n=>/eye/i.test(n.getName()));if(eye?.getMesh())for(const p of eye.getMesh().listPrimitives()){
  const m=p.getMaterial().clone().setName('Source eye pigmentation - ocular finish');m.setRoughnessFactor(.22).setMetallicFactor(0).setNormalTexture(null).setMetallicRoughnessTexture(null);p.setMaterial(m);
 }
 const file='model-'+id+'-v0722.glb';await io.write(file,d);summary[id]={file,bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),textures,clips:r.listAnimations().map(a=>a.getName())};
}
fs.writeFileSync('research-cache/fish-v0722/conversion.json',JSON.stringify(summary,null,2));console.log(summary);
