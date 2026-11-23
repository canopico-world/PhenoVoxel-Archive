import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression} from '@gltf-transform/extensions';
import {simplifyPrimitive,compactPrimitive,prune,reorder} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
const cache='research-cache/anatomy-v0729/';
const atlas=JSON.parse(readFileSync(cache+'upstream.json'));
const input=readFileSync(cache+'mouse.glb');
if(createHash('sha256').update(input).digest('hex')!==atlas.statistics.glbSha256)throw Error('Source checksum mismatch');
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.readBinary(input);
const records=new Map(atlas.structures.map(s=>[s.id,s]));
for(const n of doc.getRoot().listNodes()){
  const id=n.getExtras().structureId;
  const s=records.get(id);
  if(!s)throw Error(n.getName());
  for(const p of n.getMesh().listPrimitives()){
    p.setAttribute('_FUR',null).setAttribute('_COAT',null);
    simplifyPrimitive(p,{simplifier:MeshoptSimplifier,ratio:.17,error:.012,lockBorder:true});
    compactPrimitive(p);
    if(p.getIndices().getCount()<3)throw Error('Lost structure '+id);
  }
}
await doc.transform(prune({keepAttributes:true}),reorder({encoder:MeshoptEncoder}));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.FILTER});
await io.write('mouse-atlas-v0729.glb',doc);
writeFileSync('mouse-anatomy-catalog.json',JSON.stringify({source:atlas.source,sourceSha256:atlas.statistics.glbSha256,limitations:atlas.limitations,
  structures:atlas.structures.map(({id,name,systems,sourceLabel,evidence,description,basis,color})=>({id,name,systems:[...systems,...(/tendon|connective tissue|cartilage/i.test(name)?['connective']:[])],sourceLabel,evidence,description,basis,color}))}));
console.log('Packed',records.size,'components');
