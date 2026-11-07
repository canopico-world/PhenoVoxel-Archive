import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,dedup,weld,simplify,quantize,metalRough} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
const P='research-cache/digitallife-v0684/';
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const selection=read(P+'selection.json'),downloads='C:/Users/Fourthyz/Downloads';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
const proofs=fs.existsSync(P+'processed.json')?read(P+'processed.json'):[];
for(const s of selection){
 if(proofs.some(p=>p.id===s.id))continue;
 const source=P+s.id+'-converted.glb';
 if(!fs.existsSync(source)){console.log('PENDING',s.id);continue;}
 const original=fs.readFileSync(source);if(original.readUInt32LE(0)!==0x46546c67||original.readUInt32LE(8)!==original.length)throw Error('Incomplete GLB '+source);
 const d=await io.read(source);await d.transform(metalRough());const root=d.getRoot(),materials=[];
 for(const m of root.listMaterials()){
  const eye=/cornea|eyes?\.|eyeouter|eye_outer/i.test(m.getName());
  const amphibian=['frog','axolotl'].includes(s.kind);
  const rough=eye?.24:amphibian?.48:['fish','shark','dolphin','otter'].includes(s.kind)?.49:.72;
  materials.push({name:m.getName(),originalRoughness:m.getRoughnessFactor(),roughness:rough,hasSourceNormal:!!m.getNormalTexture()});
  m.setMetallicFactor(0).setRoughnessFactor(rough);
 }
 const sourceTextures=[];
 for(const t of root.listTextures()){
  const originalImage=t.getImage(),meta=await sharp(originalImage).metadata();
  const isColor=root.listMaterials().some(m=>m.getBaseColorTexture()===t||m.getEmissiveTexture()===t);
  const usesAlpha=root.listMaterials().some(m=>m.getBaseColorTexture()===t&&m.getAlphaMode()!=='OPAQUE');
  const needsAlpha=usesAlpha&&meta.hasAlpha && !(await sharp(originalImage).stats()).isOpaque;
  let pipeline=sharp(originalImage),out;
  // Browser derivatives retain source pigment; exceptionally large atlases are sampled at 4K.
  if(isColor&&Math.max(meta.width,meta.height)>4096)pipeline=pipeline.resize({width:4096,height:4096,fit:'inside'});
  const users=root.listMaterials().filter(m=>m.getBaseColorTexture()===t),finOnly=users.length&&users.every(m=>/fin cutout/i.test(m.getName()));
  if(finOnly&&Math.max(meta.width,meta.height)>2048)pipeline=pipeline.resize({width:2048,height:2048,fit:'inside'});
  if(!isColor&&Math.max(meta.width,meta.height)>2048)pipeline=pipeline.resize({width:2048,height:2048,fit:'inside'});
  if(isColor&&!needsAlpha){out=await pipeline.removeAlpha().jpeg({quality:s.id==='dermochelys-coriacea'?92:95,chromaSubsampling:'4:4:4'}).toBuffer();t.setMimeType('image/jpeg');}
  else{out=await pipeline.png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();t.setMimeType('image/png');}
  t.setImage(out);const final=await sharp(out).metadata();
  sourceTextures.push({name:t.getName(),sourceSha256:sha(originalImage),sourceDimensions:[meta.width,meta.height],dimensions:[final.width,final.height],role:/Reconstructed/i.test(t.getName())?'reconstructed unphotographed contact material':isColor?'source pigment':'source material map',sha256:sha(out)});
 }
 const before=root.listMeshes().map(m=>({name:m.getName(),vertices:m.listPrimitives().reduce((n,p)=>n+p.getAttribute('POSITION').getCount(),0)}));
 const total=before.reduce((n,m)=>n+m.vertices,0);
 // Static raw scans are reduced with UV-aware simplification; creator rigs stay intact.
 if(!root.listSkins().length&&total>180000)await d.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:Math.min(1,150000/total),error:.001,lockBorder:true}));
 await d.transform(dedup(),prune());
 if(total>180000)await d.transform(quantize({quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16}));
 const filename='model-digitallife-'+s.id+'-v0684.glb';
 root.listScenes()[0].setExtras({...root.listScenes()[0].getExtras(),author:'DigitalLife3D; PhenoVoxel Archive (material preparation and support cleanup)',source:s.source,license:s.label,version:'0.6.84',scope:'Source-derived exterior; artist animation is not measured physiology.',photorealismValidated:false});
 await io.write(filename,d);
 const proof={id:s.id,uid:s.uid,sourceFile:source,sourceSha256:sha(original),file:filename,bytes:fs.statSync(filename).size,sha256:sha(fs.readFileSync(filename)),materials,textures:sourceTextures,originalMeshes:before,meshes:root.listMeshes().map(m=>({name:m.getName(),vertices:m.listPrimitives().reduce((n,p)=>n+p.getAttribute('POSITION').getCount(),0)})),clips:root.listAnimations().map(a=>a.getName()),skins:root.listSkins().length,supportReview:'pending visual review',removedSupports:[],visualReview:'pending'};
 proofs.push(proof);fs.writeFileSync(P+'processed.json',JSON.stringify(proofs,null,2));console.log('PREPARED',s.id,proof.bytes,proof.clips);
}
