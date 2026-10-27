import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {prepareAsset,animateAsset} from './asset-motion.js';import {rorqualFeedingState} from './rorqual-feeding.js';
const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))),ids=['balaenoptera-musculus','megaptera-novaeangliae'];globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const loaded=new Map();async function model(id){if(loaded.has(id))return loaded.get(id);const s=db.species.find(s=>s.id===id),bytes=fs.readFileSync(new URL('./'+s.modelAsset.localFile,import.meta.url)),g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),m=prepareAsset(g,s,s.modelAsset);loaded.set(id,m);return m;}
function points(m,p){m.root.updateMatrixWorld(true);p.mesh.skeleton?.update();return p.result.map((_,i)=>m.root.worldToLocal(p.mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(p.mesh.matrixWorld)));}
for(const id of ids){
 test(id+': closed-pouch inflation is anterior and leaves the dorsal trunk undistended',async()=>{
  const m=await model(id),r=m.rorqualFeeding,p=r.parts.filter(p=>p.original).reduce((a,b)=>a.result.length>b.result.length?a:b),c=r.settings;
  animateAsset(m,'observe',0);const neutral=points(m,p);animateAsset(m,'forage',c.start+c.engulf+c.close);const filled=points(m,p),displacement=p.result.map((v,i)=>({x:v.p.x,y:v.p.y,z:v.p.z,side:v.side,drop:neutral[i].y-filled[i].y,wide:Math.abs(filled[i].z)-Math.abs(neutral[i].z)}));
  const peak=displacement.reduce((a,b)=>a.drop>b.drop?a:b);assert(peak.x>.9&&peak.drop>.18,'largest pouch displacement is not beneath the anterior jaw');
  const mid=displacement.filter(v=>v.x>-.2&&v.x<.12&&Math.abs(v.z)<.13);assert(mid.length>0);assert(Math.max(...mid.map(v=>v.drop))<peak.drop*.12,'middle trunk inflates like the pouch');
  const front=displacement.filter(v=>v.x>.95&&v.x<1.55&&v.side<0);assert(Math.max(...front.map(v=>v.wide))>.08,'pouch has no transverse expansion');
  const dorsal=displacement.filter(v=>v.x>0&&v.x<1.5&&v.side>0);assert(dorsal.length>0);assert(Math.max(...dorsal.map(v=>Math.abs(v.drop)))<1e-5,'closed-pouch change swells the dorsal body');
  assert(new T.Box3().setFromObject(m.root,true).min.y>.12,'pouch intersects the contextual platform');
 });
 test(id+': conformal pleats retain the credited atlas, normalized skinning and outward winding',async()=>{
  const m=await model(id),r=m.rorqualFeeding,p=r.parts.find(p=>p.kind),body=r.parts.filter(p=>p.original).reduce((a,b)=>a.result.length>b.result.length?a:b),g=p.mesh.geometry;assert.equal(p.mesh.material.map,body.mesh.material.map);assert(g.attributes.uv.array.every(Number.isFinite));assert(p.result.length>7000);
  const index=g.index.array;let checked=0;for(let i=0;i<index.length;i+=99){const vs=Array.from(index.slice(i,i+3),j=>p.result[j].p);if(vs[0].x<.8||vs[0].x>1.5)continue;const cross=vs[1].clone().sub(vs[0]).cross(vs[2].clone().sub(vs[0])),middle=vs.reduce((a,v)=>a.add(v),new T.Vector3()).multiplyScalar(1/3),radial=new T.Vector3(0,middle.y-(r.settings.y+r.settings.slope*(middle.x-r.settings.hinge)-.015),middle.z);assert(cross.dot(radial)>0,'pleat face points into the mouth');checked++;}assert(checked>40);
  const geometry=p.mesh.geometry,uv=g.attributes.uv.array.slice();for(const t of[r.settings.start+.7,r.settings.start+r.settings.engulf-.35,r.settings.start+r.settings.engulf+r.settings.close,60]){animateAsset(m,'forage',t);assert.equal(p.mesh.geometry,geometry);assert.deepEqual(g.attributes.uv.array,uv);assert(g.attributes.position.array.every(Number.isFinite));}animateAsset(m,'observe',0);assert.deepEqual(g.attributes.position.array,p.basePosition);
 });
 test(id+': rounded lip cross-sections stay narrow through outward jaw rotation',async()=>{
  const m=await model(id),r=m.rorqualFeeding;animateAsset(m,'forage',r.settings.start+r.settings.engulf-.35);const lips=r.oral.pieces.filter(x=>/rounded lip/.test(x.mesh.name));assert.equal(lips.length,4);
  for(const lip of lips){const a=lip.mesh.geometry.attributes.position;for(let i=0;i<a.count;i+=9){const ring=Array.from({length:9},(_,j)=>new T.Vector3().fromBufferAttribute(a,i+j));let diameter=0;for(const x of ring)for(const y of ring)diameter=Math.max(diameter,x.distanceTo(y));assert(diameter<.045,'lip cross-section stretches into a flat membrane');}}assert(r.oral.group.visible);
 });
}
test('anterior inflation leads posterior expansion and both recover to a finite neutral hold',()=>{for(const id of ids){const c=id===ids[0]?10:6,early=rorqualFeedingState(id,c+1);assert(early.pouch>early.posterior);const drain=rorqualFeedingState(id,id===ids[0]?27:21);assert(drain.pouch>drain.posterior);const end=rorqualFeedingState(id,1000);assert.equal(end.gape,0);assert.equal(end.pouch,0);assert.equal(end.posterior,0);}});
