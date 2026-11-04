import fs from 'node:fs';
import crypto from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,resample,textureCompress} from '@gltf-transform/functions';
import sharp from 'sharp';
const cache='research-cache/herpetofauna-molecular-v0674/',io=new NodeIO().registerExtensions(ALL_EXTENSIONS),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
// Keep UV padding colors under transparent texels: opaque body materials may
// share the atlas with an alpha-blended fin, and filtering needs that padding.
const exactSharp=(input,options)=>{const image=sharp(input,options),toFormat=image.toFormat;image.toFormat=function(format,settings){return toFormat.call(this,format,format==='webp'?{...settings,exact:true}:settings);};return image;};
const proof={version:'0.6.74',models:{}};
for(const [id,source,target,untouched] of [
 ['chelonia-mydas','turtle-4k-source.glb','model-chelonia-mydas-v0674.glb',false],
 ['ambystoma-mexicanum','axolotl-source.glb','model-ambystoma-mexicanum-v0674.glb',false],
 ['agalychnis-callidryas','frog-source.glb','model-agalychnis-callidryas-v0674.glb',true]
]){
 const raw=fs.readFileSync(cache+source),doc=await io.readBinary(raw),root=doc.getRoot(),images=[];
 for(const t of root.listTextures()){const data=t.getImage(),m=await sharp(data).metadata(),rgba=await sharp(data).ensureAlpha().raw().toBuffer(),normal=root.listMaterials().some(mat=>mat.getNormalTexture()===t);images.push({name:t.getName(),width:m.width,height:m.height,normal,sourceImageSha256:hash(data),decodedRgbaSha256:hash(rgba),rgba});}
 const animations=root.listAnimations().map(a=>({name:a.getName(),channels:a.listChannels().length}));
 if(untouched)fs.copyFileSync(cache+source,target);
 else {await doc.transform(resample(),dedup(),prune(),textureCompress({encoder:exactSharp,targetFormat:'webp',lossless:true}),textureCompress({encoder:exactSharp,targetFormat:'webp',slots:/baseColorTexture|metallicRoughnessTexture|occlusionTexture/,quality:96,lossless:false}));await io.write(target,doc);}
 const delivered=fs.readFileSync(target),check=await io.readBinary(delivered),outImages=[];
 for(const t of check.getRoot().listTextures()){const data=t.getImage(),m=await sharp(data).metadata(),rgba=await sharp(data).ensureAlpha().raw().toBuffer();outImages.push({name:t.getName(),width:m.width,height:m.height,deliveredImageSha256:hash(data),decodedRgbaSha256:hash(rgba),rgba});}
 for(const [i,im] of images.entries()){const out=outImages.find(x=>x.decodedRgbaSha256===im.decodedRgbaSha256)||(im.name?outImages.find(x=>x.name===im.name):null)||outImages[i];if(out.width!==im.width||out.height!==im.height)throw Error('Texture dimensions changed: '+id);im.deliveredImageSha256=out.deliveredImageSha256;im.deliveredDecodedRgbaSha256=out.decodedRgbaSha256;im.pixelsExact=im.decodedRgbaSha256===out.decodedRgbaSha256;if((im.normal||untouched)&&!im.pixelsExact)throw Error('Protected normal/source texture changed: '+id);let error=0;for(let k=0;k<im.rgba.length;k++)error+=(im.rgba[k]-out.rgba[k])**2;im.psnrDb=error===0?null:10*Math.log10(255**2/(error/im.rgba.length));delete im.rgba;}
 if(delivered.length>=25*1024*1024)throw Error('Asset needs a smaller lossless package: '+id+' '+delivered.length);
 proof.models[id]={sourceFile:source,sourceSha256:hash(raw),sourceBytes:raw.length,localFile:target,sha256:hash(delivered),bytes:delivered.length,sourceBinaryUnmodified:untouched,animations,images,changes:untouched?'Original creator GLB retained byte for byte; original geometry, materials, skinning and authored clips.':'4k source dimensions retained. Normal maps converted losslessly; color/roughness maps use quality-96 WebP. Redundant animation keys resampled and unused resources cleaned; source topology, rig and authored clips retained.'};
 console.log(id,raw.length,'→',delivered.length,animations.map(a=>a.name).join(', '));
}
fs.writeFileSync('herp-source-v0674.json',JSON.stringify(proof,null,2)+'\n');
