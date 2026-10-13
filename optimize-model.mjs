import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld,simplify,textureCompress,dedup,prune} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
// Explicit input/output paths; preserves original creator/license extras in the derived GLB.
const [input,output]=process.argv.slice(2);if(!input||!output||input===output)throw Error('Provide distinct input.glb and output.glb paths.');
const source=await fs.readFile(input),original=JSON.parse(source.subarray(20,20+source.readUInt32LE(12))),io=new NodeIO().registerExtensions(ALL_EXTENSIONS),document=await io.readBinary(source);
await MeshoptSimplifier.ready;
await document.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.18,error:.001}),dedup(),prune(),textureCompress({encoder:sharp,resize:[1024,1024]}));
const raw=Buffer.from(await io.writeBinary(document)),jsonLength=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+jsonLength));json.asset.extras={...original.asset.extras,sourceSha256:createHash('sha256').update(source).digest('hex'),changes:'Mesh simplified with ratio 0.18 / error 0.001; image textures resized to at most 1024 pixels. Visual educational derivative; not a measured anatomical model.'};
const content=Buffer.from(JSON.stringify(json)),padded=Buffer.alloc(Math.ceil(content.length/4)*4,32);content.copy(padded);const binary=raw.subarray(20+jsonLength),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+padded.length+binary.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16);const result=Buffer.concat([header,padded,binary]);await fs.writeFile(output,result);console.log(JSON.stringify({inputBytes:source.length,outputBytes:result.length,sourceSha256:json.asset.extras.sourceSha256,sha256:createHash('sha256').update(result).digest('hex')}));
