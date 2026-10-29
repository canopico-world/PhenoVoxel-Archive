import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareSuppliedGray,animateSuppliedGray,grayWhaleLine,grayWhalePhase} from './gray-whale-supplied.js';
import {grayAt655} from './gray-whale-history.mjs';
import {belugaAt657} from './beluga-history.mjs';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function source(){const b=fs.readFileSync(new URL('./model-gray-whale-digitallife.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
async function make(){return prepareSuppliedGray(await source(),{id:'eschrichtius-robustus'},{});}
test('only the audited gray fields change; all other336 records and gray identity/taxon/photo/occurrence fields retain exact prior values',()=>{
 const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))),revisions=JSON.parse(fs.readFileSync(new URL('./gray-whale-revisions-v0656.json',import.meta.url))),others=db.species.map(belugaAt657).filter(s=>s.id!=='eschrichtius-robustus');assert.equal(db.species.length,337);assert.equal(revisions.revisions.length,1);assert.equal(hash(JSON.stringify(others)),'2ac4ae0de5014a30e5aa55f4707665a8ab24a7b15f417d80a01d33f6968036f8');
 const s=db.species.find(s=>s.id==='eschrichtius-robustus'),old=grayAt655(s);for(const k of['id','scientificName','commonName','taxonomy','domain','group','family','photograph','occurrences'])assert.deepEqual(s[k],old[k]);assert.equal(s.modelAsset.uid,'f59500b45e9143b399ed8f2c1357f66d');assert.equal(s.review.independentlyValidated,false);assert.equal(s.review.accuracyPercent,null);assert(s.behaviors.every(b=>b.rendering.status==='partial'));assert(s.behaviors.every(b=>b.timeScale.includes('uncalibrated')));
});
test('gray delivery preserves the entire supplied GLB, two original images and exact noncommercial grant',()=>{
 const b=fs.readFileSync(new URL('./model-gray-whale-digitallife.glb',import.meta.url));assert.equal(b.length,20494184);assert.equal(hash(b),'2ee3a1c8d10e28f8b3bfd9de012fc93311b5ec8812ef172903741e88952a10a0');const n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n)),start=28+n;
 assert.match(j.asset.extras.license,/CC-BY-NC-4.0/);assert.match(j.asset.extras.author,/DigitalLife3D/);assert.equal(j.skins?.length||0,0);assert.equal(j.animations?.length||0,0);assert.equal(j.meshes.length,7);
 const images=j.images.map(im=>{const v=j.bufferViews[im.bufferView];return hash(b.subarray(start+(v.byteOffset||0),start+(v.byteOffset||0)+v.byteLength));});assert.deepEqual(images,['9439b2248835065d9c3af44ae646d12348bfe67323321469915b013be4b95a87','540179ba9f6a8ec166cc5edfcd216c0fb9b4afab71072232fe1fcfaae5e9adc7']);
});
test('source has a real separate anterior oral floor and roof; jaw membership comes from unchanged source adjacency',async()=>{
 const m=await make(),f=m.suppliedGray;assert.equal(f.parts.length,7);assert.equal(f.jaw.anteriorComponents,2);assert(f.jaw.lowerVertices>20000&&f.jaw.upperVertices>40000);assert.equal(f.parts.filter(p=>p.mesh.name.includes('_baleen_')).length,2);
 assert(f.parts.every(p=>p.mesh.material.map&&p.mesh.material.roughnessMap));const b=new T.Box3().setFromObject(m.root,true),size=b.getSize(new T.Vector3());assert(Math.abs(size.x-3.85)<1e-5);assert(size.y<.85&&size.z>1.5);assert(m.features[0].distanceTo(m.features[1])>2.5);assert(m.features[1].distanceTo(m.features[2])>.8);
});
test('all finite studies keep original surfaces, image bindings and UVs and recover every source vertex and normal',async()=>{
 const m=await make(),parts=m.suppliedGray.parts,saved=parts.map(p=>({geometry:p.mesh.geometry,uv:p.mesh.geometry.attributes.uv.array.slice(),map:p.mesh.material.map,rough:p.mesh.material.roughnessMap,index:p.mesh.geometry.index.array.slice()}));let changed=false;
 for(const action of['swim','glide','turn','roll','forage']){
  for(const time of action==='forage'?[0,3,4.8,5.6,8,12,16,300]:[0,3,5,8,12,300]){animateSuppliedGray(m,action,time);for(const[i,p]of parts.entries()){const g=p.mesh.geometry;assert.equal(g,saved[i].geometry);assert.equal(p.mesh.material.map,saved[i].map);assert.equal(p.mesh.material.roughnessMap,saved[i].rough);assert.deepEqual(g.attributes.uv.array,saved[i].uv);assert.deepEqual(g.index.array,saved[i].index);assert(g.attributes.position.array.every(Number.isFinite));changed ||= g.attributes.position.array.some((v,j)=>Math.abs(v-p.neutral[j])>.003);}assert(new T.Box3().setFromObject(m.root,true).getSize(new T.Vector3()).length()<5);}
  animateSuppliedGray(m,'observe',0);for(const p of parts){assert.deepEqual(p.mesh.geometry.attributes.position.array,p.neutral);assert.deepEqual(p.mesh.geometry.attributes.normal.array,p.normal);}assert(m.root.position.length()<1e-12);
 }assert(changed);
});
test('benthic study opens only the real anterior lower-jaw component, leaves racks and trunk fixed and does not inflate a rorqual pouch',async()=>{
 const m=await make();animateSuppliedGray(m,'forage',5.6);let moved=0,max=0;
 for(const part of m.suppliedGray.parts){const p=part.mesh.geometry.attributes.position,b=part.neutral;for(let i=0;i<p.count;i++){const u=.5-b[i*3]/3.85,d=new T.Vector3().fromBufferAttribute(p,i).distanceTo(new T.Vector3(...b.subarray(i*3,i*3+3)));if(u>.31||part.mesh.name.includes('_baleen_')||part.mesh.name.includes('_eyes_'))assert(d<1e-7);if(part.jaw?.[i]>.9){max=Math.max(max,d);if(d>.01)moved++;}}}
 assert(moved>1000&&max>.13&&max<.20);assert.equal(m.root.scale.x,1);assert(grayWhalePhase(10).gape===0);assert(grayWhalePhase(10).hold===1);
 // Forward +X, up +Y and anatomical right +Z: the selected right side is down.
 const c=new T.Vector3(0,1.45,0).applyMatrix4(m.root.matrixWorld),r=new T.Vector3(0,1.45,.3).applyMatrix4(m.root.matrixWorld);assert(r.y<c.y-.25);
});
test('stroke centreline station lengths remain fixed, anterior stations remain still and glide stops after six selected seconds',()=>{
 for(const action of['swim','glide'])for(const t of[0,3,5,5.8,6,8,12,99]){const{line}=grayWhaleLine(action,t,3.85);for(let i=1;i<line.length;i++)assert(Math.abs(Math.hypot(line[i].x-line[i-1].x,line[i].y-line[i-1].y)-3.85/180)<1e-12);assert(line.slice(0,75).every(p=>Math.abs(p.y)<1e-14));if(action==='glide'&&t>=6)assert(line.every(p=>p.a===0&&p.y===0));}assert(grayWhaleLine('swim',5,3.85).line.some(p=>Math.abs(p.y)>.02));
});
test('source body chunk and UV duplicate vertices stay coincident through the actual swimming and jaw deformations',async()=>{
 const m=await make(),body=m.suppliedGray.parts.filter(p=>p.mesh.name.includes('_body_'));
 for(const[action,time]of[['swim',3],['swim',8],['forage',5.6]]){animateSuppliedGray(m,action,time);const seen=new Map();let checked=0;for(const part of body){const p=part.mesh.geometry.attributes.position,b=part.neutral;for(let i=0;i<p.count;i++){const k=i*3,key=[b[k],b[k+1],b[k+2]].map(v=>Math.round(v*1e6)).join(':'),posed=new T.Vector3().fromBufferAttribute(p,i);if(seen.has(key)){assert(posed.distanceTo(seen.get(key))<2e-6,'source seam opens during deformation');checked++;}else seen.set(key,posed);}}assert(checked>10000);}
});
