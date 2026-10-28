import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareSuppliedFin,animateSuppliedFin,suppliedFinLine} from './fin-whale-supplied.js';
import sharp from 'sharp';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function source(){const b=fs.readFileSync(new URL('./model-fin-whale-woelper.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
async function make(){return prepareSuppliedFin(await source(),{id:'balaenoptera-physalus'},{author:'Johann Woelper',license:'CC BY-NC 4.0'});}
test('supplied fin preserves three active original detail maps and discloses its albedo derivative and explicitly separates artist rights from software',()=>{
 const b=fs.readFileSync(new URL('./model-fin-whale-woelper.glb',import.meta.url)),n=b.readUInt32LE(12),d=JSON.parse(b.subarray(20,20+n)),start=28+n;
 const hashes=d.images.map(im=>{const v=d.bufferViews[im.bufferView];return hash(b.subarray(start+(v.byteOffset||0),start+(v.byteOffset||0)+v.byteLength));});
 assert.deepEqual(new Set(hashes),new Set(['a7b91f8e6c7c42945f4aa6748253262b68333eed301fe994d7fd1908aa3c7f97','0cddd59591dc2e90f8fd3d318796d145ef7dab99cf7a439b4365bbd8c9569f2a','61bf1bfd18365230a264af8b0dc43692eda1990d8776927684f6448f2a609520','8775c0f1984c9f25b91076c6a8663f3eafbb720b3889c915efc3fd93a5e51e27']));
 assert.match(d.extras.license,/BY-NC/);assert.equal(d.materials[0].pbrMetallicRoughness.metallicFactor,0);
});
test('source cage refinement retains a species-distinct closed source silhouette and coherent image UVs',async()=>{
 const raw=await source(),g=raw.scene.children[0].geometry,positions=g.attributes.position,keys=new Map(),ids=[];
 for(let i=0;i<positions.count;i++){const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>Math.round(v*1e6)).join(':');if(!keys.has(key))keys.set(key,keys.size);ids.push(keys.get(key));}
 const edges=new Map(),neighbors=Array.from({length:keys.size},()=>new Set());for(let i=0;i<g.index.count;i+=3){const tri=[0,1,2].map(j=>ids[g.index.getX(i+j)]);assert.equal(new Set(tri).size,3);for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],key=[a,b].sort((a,b)=>a-b).join(':');edges.set(key,(edges.get(key)||0)+1);neighbors[a].add(b);neighbors[b].add(a);}}
 assert([...edges.values()].every(n=>n===2),'source has an unreported open or nonmanifold edge');const seen=new Set([0]),queue=[0];for(let i=0;i<queue.length;i++)for(const j of neighbors[queue[i]])if(!seen.has(j)){seen.add(j);queue.push(j);}assert.equal(seen.size,keys.size,'source exterior has detached islands');
 const m=await make(),b=m.suppliedFin.body,p=b.geometry.attributes.position,u=b.geometry.attributes.uv;
 assert(p.count>27000&&p.count<45000);assert(p.array.every(Number.isFinite));assert(u.array.every(Number.isFinite));assert(b.material.map&&b.material.normalMap&&b.material.roughnessMap);assert.equal(b.material.userData.compatibilitySurfaceDetail,true);
 const box=new T.Box3().setFromObject(m.root,true),size=box.getSize(new T.Vector3());assert(Math.abs(size.x-3.85)<.01);assert(size.y<1&&size.z<2.0);assert.equal(m.fineAnatomy.k.plates,300);assert.equal(m.fineAnatomy.k.teeth,0);assert.equal(m.root.userData.aquaticStudy,true);
});
test('new fin jaw/lining attach to source cut edges rather than an unrelated ellipse',async()=>{
 const m=await make(),f=m.fineAnatomy;assert(f.r.sourceOralEdge);const samples=[];
 for(const u of[.03,.08,.13,.18,.23]){const a=f.r.sourceOralEdge(u,0),b=f.r.sourceOralEdge(u,1);assert(a.z<0&&b.z>0);assert(Math.abs(a.x-b.x)<.01);assert(a.distanceTo(b)<.8);samples.push(a.distanceTo(b));}
 assert(samples[2]>samples[0]);assert(f.oral.pieces.some(p=>p.mesh.name.startsWith('Paired baleen')));
});
test('swim, glide and feeding retain the same source skin/maps and recover every neutral vertex',async()=>{
 const m=await make(),body=m.suppliedFin.body,g=body.geometry,map=body.material.map,uv=g.attributes.uv.array.slice(),neutral=g.attributes.position.array.slice();let motion=false;
 for(const action of['swim','glide','turn','forage']){for(const t of action==='forage'?[0,5.52,9.6,15.84,24,300]:[0,2,5,8,12,300]){animateSuppliedFin(m,action,t);assert.equal(body.geometry,g);assert.equal(body.material.map,map);assert.deepEqual(g.attributes.uv.array,uv);assert(g.attributes.position.array.every(Number.isFinite));if(g.attributes.position.array.some((v,i)=>Math.abs(v-neutral[i])>.003))motion=true;assert(new T.Box3().setFromObject(m.root,true).getSize(new T.Vector3()).length()<6);}animateSuppliedFin(m,'observe',0);assert.deepEqual(g.attributes.position.array,neutral);}
 assert(motion);animateSuppliedFin(m,'glide',8);assert.deepEqual(g.attributes.position.array,neutral);
});
test('pouch distension stays anterior and persists after the selected jaw closure',async()=>{
 const m=await make(),f=m.fineAnatomy,base=m.suppliedFin.body.geometry.attributes.position.array.slice();animateSuppliedFin(m,'forage',12);const p=m.suppliedFin.body.geometry.attributes.position;let anterior=0;
 for(let i=0;i<p.count;i++){const u=.5-base[i*3]/f.c.length;if(u>.54)assert(Math.abs(p.getY(i)-base[i*3+1])<1e-6);if(u>.08&&u<.40)anterior=Math.max(anterior,base[i*3+1]-p.getY(i));}assert(anterior>.1);assert(f.current.pouch>f.current.gape);assert.equal(m.root.scale.x,1);
});
test('the delivered atlas has a dark anatomical-left mandible, pale right jaw and three distinct source-bound landmarks',async()=>{
 const m=await make(),g=m.suppliedFin.body.geometry,p=g.attributes.position,uv=g.attributes.uv,{data,info}=await sharp(new URL('./fin-whale-albedo-v0655.png',import.meta.url).pathname.replace(/^\/(\w:)/,'$1')).ensureAlpha().raw().toBuffer({resolveWithObject:true}),sides=[[],[]];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),u=.5-x/m.fineAnatomy.c.length;if(u>.06&&u<.18&&y<1.50&&Math.abs(z)>.09){const px=Math.max(0,Math.min(info.width-1,Math.round(uv.getX(i)*(info.width-1)))),py=Math.max(0,Math.min(info.height-1,Math.round(uv.getY(i)*(info.height-1)))),j=(py*info.width+px)*4;sides[z<0?0:1].push((data[j]+data[j+1]+data[j+2])/3);}}
 assert(sides.every(a=>a.length>20));const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;assert(mean(sides[0])<mean(sides[1])*.65,'bilaterally white lower jaws returned');assert(m.features[0].distanceTo(m.features[1])>2);assert(m.features[1].distanceTo(m.features[2])>.3);
});

test('posterior stroke uses fixed-length centreline stations, a fixed anterior and a stopped glide',()=>{
 for(const action of ['swim','glide'])for(const t of [0,2,5,5.8,6,8,12,99]){
  const {line}=suppliedFinLine(action,t,3.85);for(let i=1;i<line.length;i++)assert(Math.abs(Math.hypot(line[i].x-line[i-1].x,line[i].y-line[i-1].y)-3.85/(line.length-1))<1e-12);
  assert(line.slice(0,70).every(p=>Math.abs(p.y)<1e-14));if(action==='glide'&&t>=6)assert(line.every(p=>p.a===0&&p.y===0));
 }
 assert(suppliedFinLine('swim',5,3.85).line.some(p=>Math.abs(p.y)>.015));
});
