import fs from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { mouseExteriorIds } from './specimen-exteriors.js';
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io=new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read('mouse-atlas-v0729.glb');
const ids=new Set(mouseExteriorIds);
for(const node of doc.getRoot().listNodes()){
  if(node.getMesh() && !ids.has(node.getExtras().structureId))node.dispose();
}
await doc.transform(prune({keepAttributes:true}));
if(doc.getRoot().listMeshes().length!==ids.size)throw Error('Missing exterior part');
await io.write('mouse-exterior-v0732.glb',doc);
console.log('Exterior bytes:',(await fs.stat('mouse-exterior-v0732.glb')).size);

