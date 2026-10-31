import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import * as T from 'three';import sharp from 'sharp';import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import{NodeIO}from'@gltf-transform/core';
import{prepareAsset,animateAsset}from'./asset-motion.js';import{rightWhalesAt663}from'./right-whale-history.mjs';
const bytes=f=>fs.readFileSync(new URL('./'+f,import.meta.url)),json=f=>JSON.parse(bytes(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),digest=o=>sha(JSON.stringify(o)),db=json('species.json'),assets=json('right-whale-assets-v0664.json').models,proof=json('right-whale-source-v0664.json'),ids=Object.keys(assets);
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
async function make(id){const b=bytes(assets[id].localFile),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');return prepareAsset(g,db.species.find(s=>s.id===id),assets[id]);}
function dispose(m){const mats=new Set(),maps=new Set();m.root.traverse(o=>{o.geometry?.dispose();if(o.material)mats.add(o.material);});for(const mat of mats){for(const x of Object.values(mat))if(x?.isTexture)maps.add(x);mat.dispose();}maps.forEach(t=>t.dispose());}

test('northern revision strictly restores both records and preserves335 others,337 identities and37 registered sources',()=>{
 assert.equal(db.version,'0.6.64');assert.equal(db.species.length,337);assert.equal(digest(db.species.filter(s=>!ids.includes(s.id))),proof.other335Sha256);assert.equal(digest(json('model-assets.json')),proof.all37RegisteredModelsSha256);
 const identity=s=>({id:s.id,commonName:s.commonName,scientificName:s.scientificName,domain:s.domain,group:s.group,family:s.family,taxonomy:s.taxonomy,photograph:s.photograph,occurrences:s.occurrences});assert.equal(digest(db.species.map(identity)),proof.all337IdentitySha256);
 for(const a of proof.registeredSourcePayloads){const b=bytes(a.file);assert.equal(b.length,a.bytes);assert.equal(sha(b),a.sha256,a.file);}
 for(const id of ids){const s=db.species.find(s=>s.id===id),old=rightWhalesAt663(s);assert.equal(old.visual.version,'0.6.51');assert.equal(old.modelAsset,undefined);assert.equal(s.modelAsset.sourceFile,'model-eubalaena-australis.glb');const bad=structuredClone(s);bad.anatomy[0].description+=' changed';assert.throws(()=>rightWhalesAt663(bad));}
});

test('each northern GLB has a distinct body and exact embedded skin maps with explicit Southern lineage and retained grant',async()=>{
 const shapes=new Set(),skins=new Set();for(const id of ids){const a=assets[id],b=bytes(a.localFile);assert.equal(sha(b),a.sha256);assert.equal(b.length,a.bytes);assert.equal(a.license,'CC BY-NC 4.0');assert.equal(a.sourceAnimationUsed,false);assert.equal(a.derivedFromSpecies,'Eubalaena australis');assert.equal(a.sourceSha256,sha(bytes(a.sourceFile)));
  const d=await new NodeIO().readBinary(b),root=d.getRoot(),body=root.listMeshes().find(x=>x.getName()==='Whale_Bake_0').listPrimitives()[0];assert.equal(body.getIndices().getCount()/3,31296);assert.equal(body.getAttribute('POSITION').getCount(),19430);assert.equal(root.listAnimations().length,0);assert.equal(root.listSkins().length,0);shapes.add(sha(Buffer.from(body.getAttribute('POSITION').getArray().buffer)));
  const p=body.getAttribute('POSITION').getArray(),idx=body.getIndices().getArray();for(let i=0;i<idx.length;i+=3){const a=new T.Vector3().fromArray(p,idx[i]*3),b=new T.Vector3().fromArray(p,idx[i+1]*3),c=new T.Vector3().fromArray(p,idx[i+2]*3);assert(b.sub(a).cross(c.sub(a)).lengthSq()>1e-18,'collapsed source-derived face');}
  const textures=root.listTextures();assert.equal(textures.length,3);for(const map of a.maps){const t=textures.find(t=>t.getName()===map.file);assert(t);assert.equal(sha(t.getImage()),map.sha256);assert.equal(sha(bytes(map.file)),map.sha256);skins.add(map.sha256);}assert.equal(a.independentlyIdentified,false);
 }
 assert.equal(shapes.size,2);assert.equal(skins.size,6);
});

test('skin-chart boundaries retain continuous pigment in the actual delivered atlas',async()=>{
 for(const id of ids){const m=await make(id),body=m.root.getObjectByName('Whale_Bake_0'),p=body.geometry.attributes.position,uv=body.geometry.attributes.uv,{data,info}=await sharp(bytes(assets[id].maps[0].file)).removeAlpha().raw().toBuffer({resolveWithObject:true}),groups=new Map();
  for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
  const sample=i=>{const x=Math.max(0,Math.min(info.width-1,uv.getX(i)*info.width-.5)),y=Math.max(0,Math.min(info.height-1,uv.getY(i)*info.height-.5)),xx=Math.floor(x),yy=Math.floor(y),fx=x-xx,fy=y-yy,out=[0,0,0];for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const at=(Math.min(info.height-1,yy+dy)*info.width+Math.min(info.width-1,xx+dx))*3,w=(dx?fx:1-fx)*(dy?fy:1-fy);for(let k=0;k<3;k++)out[k]+=data[at+k]*w/255;}return out;},deltas=[];
  for(const list of groups.values()){if(list.length<2)continue;const c=list.map(sample);for(let i=1;i<c.length;i++)deltas.push(Math.max(...c[i].map((v,k)=>Math.abs(v-c[0][k]))));}deltas.sort((a,b)=>a-b);assert(deltas.length>1000);assert(deltas[Math.floor(deltas.length*.95)]<.03,id+' pigment seams');assert(deltas.at(-1)<.20,id+' large pigment seam');dispose(m);
 }
});

test('finite studies keep the detailed body and maps, bend only the posterior vertically, join chart normals and restore the exterior',async()=>{
 for(const id of ids){const m=await make(id),r=m.cetaceanSurface,saved=r.meshes.map(p=>({part:p,g:p.mesh.geometry,mat:p.mesh.material,map:p.mesh.material.map,uv:p.mesh.geometry.attributes.uv.array.slice(),p:p.mesh.geometry.attributes.position.array.slice()}));let movement=0;
  for(const action of['swim','turn'])for(const t of[0,2,5,8,12,100]){animateAsset(m,action,t);for(const s of saved){const g=s.part.mesh.geometry,p=g.attributes.position,n=g.attributes.normal;assert.equal(g,s.g);assert.equal(s.part.mesh.material,s.mat);assert.equal(s.mat.map,s.map);assert.deepEqual(g.attributes.uv.array,s.uv);assert(p.array.every(Number.isFinite));
    if(action==='swim')for(let i=0;i<p.count;i++){const u=(r.max-s.part.world[i*3])/r.length;assert(Math.abs(p.getZ(i)-s.p[i*3+2])<2e-5);if(u<.38)assert(Math.abs(p.getY(i)-s.p[i*3+1])<2e-5);if(u>.85)movement=Math.max(movement,Math.abs(p.getY(i)-s.p[i*3+1]));}
    for(const list of s.part.northernWeld){const first=new T.Vector3().fromBufferAttribute(n,list[0]);for(const i of list)assert(first.distanceTo(new T.Vector3().fromBufferAttribute(n,i))<1e-5,'UV chart shading crack');}
   }assert(new T.Box3().setFromObject(m.root,true).min.y>.13);}
  assert(movement>.03);animateAsset(m,'observe',0);for(const s of saved)assert.deepEqual(s.part.mesh.geometry.attributes.position.array,s.p);assert.equal(m.sourceClip,null);dispose(m);
 }
});

test('biological scope distinguishes cyamid callosities, overlapping morphology and incomplete feeding mechanics',()=>{
 for(const id of ids){const s=db.species.find(s=>s.id===id);assert.match(s.anatomy[0].description,/cyamid|whale lice/i);assert.match(s.anatomy[2].description,/overlap/);assert(s.sources.some(s=>s.id==='right-whale-callosities'));assert.equal(s.behaviors.find(b=>b.id==='forage').rendering.status,'unavailable');assert.equal(s.review.independentlyValidated,false);assert.equal(s.review.accuracyPercent,null);}
 const mat=json('right-whale-material-v0664.json');assert.equal(mat.uvOverlapPixels,0);assert.equal(mat.chartCount,137);assert.equal(mat.paidCreditsSpent,0);assert.equal(mat.photographPixelsUsed,false);assert.equal(mat.generatedImageModelUsed,false);
});
