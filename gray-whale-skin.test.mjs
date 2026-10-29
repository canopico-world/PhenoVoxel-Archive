import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import sharp from 'sharp';import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareSuppliedGray,animateSuppliedGray} from './gray-whale-supplied.js';import {grayAt656} from './gray-whale-skin-history.mjs';import {filteredTextureRGB} from './software-renderer.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const read=n=>fs.readFileSync(new URL(n,import.meta.url)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function make(){const b=read('./model-gray-whale-digitallife.glb');return prepareSuppliedGray(await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''),{id:'eschrichtius-robustus'},{});}
test('gray skin revision strictly restores v656 while preserving all other336 objects and all identity/photo fields',()=>{
 const d=JSON.parse(read('./species.json')),s=d.species.find(s=>s.id==='eschrichtius-robustus'),prior=grayAt656(s),ledger=JSON.parse(read('./gray-whale-revisions-v0657.json'));
 assert.equal(d.species.length,337);assert.equal(sha(JSON.stringify(d.species.filter(s=>s.id!=='eschrichtius-robustus'))),'2ac4ae0de5014a30e5aa55f4707665a8ab24a7b15f417d80a01d33f6968036f8');
 for(const k of['id','scientificName','commonName','domain','group','family','taxonomy','photograph','occurrences'])assert.deepEqual(s[k],prior[k]);assert.equal(ledger.revisions.length,1);assert.equal(prior.review.correctionVersion,'0.6.56');assert.equal(s.anatomy.length,5);assert(s.behaviors.some(b=>b.id==='mouth'&&/baleen/.test(b.label)));assert.equal(s.review.independentlyValidated,false);assert(s.behaviors.every(b=>b.rendering.status==='partial'));assert(s.review.remaining.some(x=>/Orange cyamids/.test(x)));
});
test('selected skin removes warm painted points, raises gray values and retains a nonuniform scar field',async()=>{
 const {data,info}=await sharp(read('./gray-whale-skin-v0657.png')).removeAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,2048);assert.equal(info.height,2048);let n=0,l=0,l2=0,warm=0;
 for(let i=0;i<data.length;i+=3)if(data[i]+data[i+1]+data[i+2]>30){const v=(data[i]+data[i+1]+data[i+2])/3;n++;l+=v;l2+=v*v;if(data[i]>data[i+1]+8&&data[i]>data[i+2]+8)warm++;}assert(n>2e6);assert(l/n>95&&l/n<125);assert(Math.sqrt(l2/n-(l/n)**2)>20);assert.equal(warm,0);
});
test('skin, eyes and baleen keep separate active material bindings and retain original source UV/index arrays',async()=>{
 const m=await make(),f=m.suppliedGray;
 for(const p of f.parts){const mat=p.mesh.material;if(p.mesh.name.includes('_body_')){assert.match(mat.map.userData.file,/gray-whale-skin/);assert.match(mat.normalMap.userData.file,/gray-whale-normal/);assert.match(mat.roughnessMap.userData.file,/gray-whale-roughness/);}else if(p.mesh.name.includes('_baleen_'))assert.match(mat.map.userData.file,/gray-whale-baleen/);else{assert(!mat.map.userData.file);assert(!mat.normalMap);}assert.equal(mat.metalness,0);}
 assert.equal(f.textures.skin.flipY,false);assert.equal(f.textures.baleen.colorSpace,T.SRGBColorSpace);assert.equal(f.parts.length,7);
});
test('all193 low-profile shells remain attached to their actual source triangles through jaw and swimming motion',async()=>{
 const m=await make(),f=m.suppliedGray,b=f.barnacles,ix=b.mesh.geometry.index.array;assert.equal(b.anchors.length,193);assert(ix.length>500);const bounds=new T.Box3().setFromBufferAttribute(b.mesh.geometry.attributes.position),size=bounds.getSize(new T.Vector3());assert(size.z<size.x*.2);const neutral=b.mesh.instanceMatrix.array.slice(),matrix=new T.Matrix4(),pos=new T.Vector3();
 for(const[action,t]of[['forage',5.6],['mouth',5.6],['swim',5],['roll',6],['mouth',16]]){animateSuppliedGray(m,action,t);for(let i=0;i<b.anchors.length;i++){const a=b.anchors[i],g=f.parts[a.part].mesh.geometry,p=new T.Vector3(),v=new T.Vector3();for(let k=0;k<3;k++)p.addScaledVector(v.fromBufferAttribute(g.attributes.position,a.indices[k]),a.bary[k]);b.mesh.getMatrixAt(i,matrix);pos.setFromMatrixPosition(matrix);assert(pos.distanceTo(p)<2e-7,'shell base detaches');assert(a.indices.every(index=>g.index.array.includes(index)));}assert(b.mesh.instanceMatrix.array.every(Number.isFinite));}
 animateSuppliedGray(m,'observe',0);assert.deepEqual(b.mesh.instanceMatrix.array,neutral);
});
test('wider oral study opens only the real lower source floor, exposes stationary upper racks and resets exactly',async()=>{
 const m=await make(),f=m.suppliedGray;animateSuppliedGray(m,'mouth',5.6);let lowerMax=0,bodyMoved=0;
 for(const p of f.parts){const a=p.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const k=i*3,d=Math.hypot(a.getX(i)-p.neutral[k],a.getY(i)-p.neutral[k+1],a.getZ(i)-p.neutral[k+2]);if(p.mesh.name.includes('_baleen_')||p.mesh.name.includes('_eyes_'))assert(d<1e-7);if(p.jaw?.[i]>.9){lowerMax=Math.max(lowerMax,d);if(d>.1)bodyMoved++;}if(.5-p.neutral[k]/3.85>.31)assert(d<1e-7);}}
 assert(lowerMax>.4&&lowerMax<.55&&bodyMoved>1000);assert.equal(m.root.scale.x,1);assert.equal(m.root.rotation.x,0);assert.match(f.current.stage,/cream baleen/);
 for(const t of[16,200]){animateSuppliedGray(m,'mouth',t);for(const p of f.parts){assert.deepEqual(p.mesh.geometry.attributes.position.array,p.neutral);assert.deepEqual(p.mesh.geometry.attributes.normal.array,p.normal);}}
});
test('opt-in compatibility filtering blends adjacent source texels in linear light without changing stored pixels',()=>{
 const data=new Uint8Array([0,0,0,255,255,255,255,255,255,0,0,255,0,0,255,255]),saved=data.slice(),t={data,width:2,height:2,linear:false};const middle=filteredTextureRGB(t,.5,.5);assert.deepEqual(middle,[.5,.25,.5]);assert.deepEqual(filteredTextureRGB(t,0,0),[0,0,0]);assert.deepEqual(filteredTextureRGB(t,1,1),[0,0,1]);assert.deepEqual(data,saved);
});
