import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld,simplify,textureCompress,prune} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),d=await io.read('research-cache/specimens-v0709/source/QS1104-W01.gltf'),r=d.getRoot();
const before=r.listMeshes().flatMap(m=>m.listPrimitives()).reduce((a,p)=>a+p.getIndices().getCount()/3,0);
for(const n of [...r.listNodes()])if(n.getName()==='Cube'||!n.getMesh())n.dispose();
await MeshoptSimplifier.ready;
await d.transform(prune(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.15,error:.001,lockBorder:true}),textureCompress({encoder:sharp,targetFormat:'jpeg',resize:[3072,3072],quality:74}),prune());
const after=r.listMeshes().flatMap(m=>m.listPrimitives()).reduce((a,p)=>a+p.getIndices().getCount()/3,0);
r.setExtras({source:'https://sketchfab.com/3d-models/cc0-japanese-mantis-shrimp-o-oratoria-5aa726fd3a0842e0b6e35681134ea2c5',license:'CC0',changes:'Scene prop removed; surface simplified with locked primitive borders, original six photographic maps resized to max3072 pixels. Static source pose; no calibrated reflectance or behavior validation.'});
const raw=await io.writeBinary(d);
fs.writeFileSync('research-cache/specimens-v0709/oratosquilla-source-web.glb',raw);
const packed=gzipSync(raw,{level:9});
for(let i=0;i<Math.ceil(packed.length/20000000);i++)fs.writeFileSync(`model-source-oratosquilla-oratoria-v0709.part${i+1}.bin`,packed.subarray(i*20000000,(i+1)*20000000));
const report={sourceTriangles:before,webTriangles:after,materials:r.listMaterials().length,textures:r.listTextures().map(t=>({name:t.getName(),size:t.getSize(),bytes:t.getImage().length})),bytes:packed.length,sourceDownloadsPreserved:true,removedObjects:['Cube: 12-triangle scene prop','source camera/light nodes'],movement:'static source pose; no animation'};
fs.writeFileSync('research-cache/specimens-v0709/optimization.json',JSON.stringify(report,null,2));console.log(report);



