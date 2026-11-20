import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {Document,NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression} from '@gltf-transform/extensions';
import {compactPrimitive,prune,reorder,simplifyPrimitive} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
import {Matrix4} from 'three';
import {anatomyBones,anatomyWeights,rigidAnatomyBone} from './anatomy-rig-v0728.js';
import {anatomySystem} from './anatomy-classification-v0728.mjs';

const raw='research-cache/anatomy-v0728/raw';
const output=process.argv[2]||'anatomy-assets-v0728';
mkdirSync(output,{recursive:true});
const input=JSON.parse(readFileSync(join(raw,'structures.json')));
const source=JSON.parse(readFileSync('research-cache/anatomy-v0728/source/source-manifest.json'));
const digest=b=>createHash('sha256').update(b).digest('hex');
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const systemNames={surface:'Body surface',skeleton:'Bones and teeth',muscles:'Muscles',connective:'Ligaments and fascia',attachments:'Muscle attachments',organs:'Internal organs',arteries:'Arteries',veins:'Veins',lymphatic:'Lymphatics',cns:'Brain and spinal cord',nerves:'Peripheral nerves',senses:'Sense organs',landmarks:'Anatomical landmarks'};
const palette={surface:[.57,.36,.24],skeleton:[.78,.72,.59],muscles:[.47,.10,.075],connective:[.63,.67,.60],attachments:[.39,.31,.09],arteries:[.56,.045,.035],veins:[.045,.13,.38],lymphatic:[.07,.35,.13],nerves:[.65,.39,.035]};
const structures=[],layers=[];

function floats(prefix,name){
  const bytes=readFileSync(join(raw,prefix+'-'+name+'.bin'));
  return new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
}
function integers(prefix){
  const bytes=readFileSync(join(raw,prefix+'-index.bin'));
  return new Uint32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
}
function makeRig(document){
  const buffer=document.createBuffer();
  const scene=document.createScene('Human anatomy reference');
  const nodes=anatomyBones.map(b=>document.createNode(b.name));
  const matrices=new Float32Array(nodes.length*16);
  const inverse=new Matrix4();
  for(const[i,b]of anatomyBones.entries()){
    const parent=b.parent<0?scene:nodes[b.parent];
    const origin=b.parent<0?[0,0,0]:anatomyBones[b.parent].point;
    nodes[i].setTranslation(b.point.map((v,k)=>v-origin[k]));
    parent.addChild(nodes[i]);
    inverse.makeTranslation(-b.point[0],-b.point[1],-b.point[2]).toArray(matrices,i*16);
  }
  const skin=document.createSkin('Shared human reference joints').setSkeleton(nodes[0])
    .setInverseBindMatrices(document.createAccessor('Inverse bind matrices').setType('MAT4').setArray(matrices).setBuffer(buffer));
  nodes.forEach(n=>skin.addJoint(n));
  return {buffer,scene,skin};
}

for(const[system,label]of Object.entries(systemNames)){
  const records=input.structures.filter(r=>anatomySystem(r)===system);
  if(!records.length)continue;
  const document=new Document();
  const {buffer,scene,skin}=makeRig(document);
  const material=document.createMaterial(label+' instructional colours').setMetallicFactor(0)
    .setRoughnessFactor(system==='organs'?.51:system==='surface'?.82:.67).setDoubleSided(true);
  const pieces=[];
  const accessor=(name,type,array)=>document.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
  let originalTriangles=0;
  for(const original of records){
    const record={...original,system};
    const position=floats(record.prefix,'position'),normal=floats(record.prefix,'normal'),color=floats(record.prefix,'color');
    const index=integers(record.prefix);
    const rigid=rigidAnatomyBone(record);
    const ids=new Uint8Array(position.length/3*4),weights=new Uint16Array(ids.length),packedColor=new Uint8Array(color.length);
    const structure=new Uint16Array(position.length/3).fill(record.index);
    const tint=palette[system];
    for(let i=0;i<position.length/3;i++){
      const influence=anatomyWeights(position[i*3],position[i*3+1],position[i*3+2],rigid);
      influence.forEach(([bone,weight],slot)=>{ids[i*4+slot]=bone;weights[i*4+slot]=Math.round(weight*65535);});
      const total=weights[i*4]+weights[i*4+1]+weights[i*4+2]+weights[i*4+3];
      weights[i*4]+=65535-total;
      for(let k=0;k<3;k++){
        position[i*3+k]=Math.round(position[i*3+k]*100000)/100000;
        normal[i*3+k]=Math.round(normal[i*3+k]*4096)/4096;
        if(tint)color[i*3+k]=tint[k]*(.95+.10*((record.index%7)/6));
        packedColor[i*3+k]=Math.round(Math.max(0,Math.min(1,color[i*3+k]))*255);
      }
    }
    const p=document.createPrimitive().setMaterial(material).setIndices(accessor('Triangles','SCALAR',index))
      .setAttribute('POSITION',accessor('Positions','VEC3',position))
      .setAttribute('NORMAL',accessor('Normals','VEC3',normal))
      .setAttribute('COLOR_0',accessor('Instructional tissue colours','VEC3',packedColor).setNormalized(true))
      .setAttribute('JOINTS_0',accessor('Shared joint indices','VEC4',ids))
      .setAttribute('WEIGHTS_0',accessor('Shared weights','VEC4',weights).setNormalized(true))
      .setAttribute('_STRUCTURE',accessor('Source structure index','SCALAR',structure));
    const extent=Math.max(...record.high.map((v,k)=>v-record.low[k]));
    const tolerance=['arteries','veins','nerves','lymphatic'].includes(system)?.00006:system==='muscles'?.00035:.0002;
    simplifyPrimitive(p,{simplifier:MeshoptSimplifier,ratio:.15,error:Math.min(.025,tolerance/Math.max(extent,.001)),lockBorder:true});
    compactPrimitive(p);
    const count=p.getAttribute('POSITION').getCount();
    const fields={};
    for(const semantic of p.listSemantics())fields[semantic]=p.getAttribute(semantic).getArray();
    pieces.push({fields,index:p.getIndices().getArray(),vertices:count});
    const part={index:record.index,id:record.id,name:record.name,sourceName:record.sourceName,system,region:record.region,side:record.side,
      latin:record.term?.latin,ta2:record.term?.id,originalTriangles:record.triangles,triangles:p.getIndices().getCount()/3,
      low:record.low.map(v=>+v.toFixed(5)),high:record.high.map(v=>+v.toFixed(5)),sourceType:record.sourceType};
    if(record.componentNotice)part.componentNotice=record.componentNotice;
    structures.push(part);
    originalTriangles+=record.triangles;
    p.dispose();
  }
  const vertexCount=pieces.reduce((sum,p)=>sum+p.vertices,0),indexCount=pieces.reduce((sum,p)=>sum+p.index.length,0);
  const fields={POSITION:new Float32Array(vertexCount*3),NORMAL:new Float32Array(vertexCount*3),COLOR_0:new Uint8Array(vertexCount*3),
    JOINTS_0:new Uint8Array(vertexCount*4),WEIGHTS_0:new Uint16Array(vertexCount*4),_STRUCTURE:new Uint16Array(vertexCount)};
  const sizes={POSITION:3,NORMAL:3,COLOR_0:3,JOINTS_0:4,WEIGHTS_0:4,_STRUCTURE:1};
  const indices=new Uint32Array(indexCount);
  let vertexOffset=0,indexOffset=0;
  for(const part of pieces){
    for(const[key,values]of Object.entries(part.fields))fields[key].set(values,vertexOffset*sizes[key]);
    for(let i=0;i<part.index.length;i++)indices[indexOffset+i]=part.index[i]+vertexOffset;
    vertexOffset+=part.vertices;indexOffset+=part.index.length;
  }
  const primitive=document.createPrimitive().setMaterial(material).setIndices(accessor('Combined system triangles','SCALAR',indices));
  for(const[key,values]of Object.entries(fields)){
    const attr=accessor(key,sizes[key]===1?'SCALAR':sizes[key]===3?'VEC3':'VEC4',values);
    if(key==='COLOR_0'||key==='WEIGHTS_0')attr.setNormalized(true);
    primitive.setAttribute(key,attr);
  }
  const mesh=document.createMesh(label).addPrimitive(primitive).setExtras({anatomySystem:system});
  scene.addChild(document.createNode(label).setMesh(mesh).setSkin(skin).setExtras({anatomySystem:system}));
  document.getRoot().setExtras({species:'Homo sapiens',referenceSex:'Adult male atlas',version:'0.7.28',units:'metres',system,
    source:source.repository,sourceCommit:source.commit,sourceArchiveSha256:source.files['Z-Anatomy.zip'].sha256,
    license:'CC BY-SA 4.0 with the component-specific source notices',rig:'Shared authored joint controls using Z-Biomechanics pivot positions',
    geometry:'Source atlas surfaces with bounded display simplification and shared skin weights',physiologicalValidation:false});
  await document.transform(prune(),reorder({encoder:MeshoptEncoder,target:'size'}));
  document.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  const file='human-'+system+'-v0728.glb';
  await io.write(join(output,file),document);
  const bytes=readFileSync(join(output,file));
  layers.push({id:system,label,file,bytes:bytes.length,sha256:digest(bytes),structures:records.length,triangles:indexCount/3,originalTriangles,vertices:vertexCount});
  console.log(system,records.length,'components',indexCount/3,'triangles',bytes.length,'bytes');
}
structures.sort((a,b)=>a.index-b.index);
const catalog={species:'Homo sapiens',referenceSex:'Adult male atlas',version:'0.7.28',units:'metres',sourceCommit:source.commit,layers,structures,
  sources:[{title:'Z-Anatomy / BodyParts3D',url:'https://github.com/Z-Anatomy/Models-of-human-anatomy',license:'CC BY-SA 4.0 and source component notices'},
    {title:'BodyParts3D',url:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html',license:'See pinned source notice'}],
  motionScope:'Shared joint demonstration. Angles, tissue deformation and timing are authored. Bone, organ and neurovascular geometry use the registered reference atlas.'};
const data=Buffer.from(JSON.stringify(catalog));
writeFileSync(join(output,'human-anatomy-catalog-v0728.json'),data);
const delivery={version:'0.7.28',initial:['surface','skeleton','organs','cns'],layers,catalog:{file:'human-anatomy-catalog-v0728.json',bytes:data.length,sha256:digest(data)},baseUrl:'./anatomy-assets-v0728/'};
writeFileSync('anatomy-delivery-v0728.json',JSON.stringify(delivery,null,2)+'\n');
console.log('Total',structures.length,'components',layers.reduce((n,l)=>n+l.bytes,0),'model bytes',data.length,'catalog bytes');
