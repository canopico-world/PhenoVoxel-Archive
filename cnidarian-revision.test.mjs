import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {buildSpecimen,animateSpecimen} from './models.js';
import {cnidarianRig,revisedCnidarians} from './cnidarian-revision.js';
const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))),make=id=>buildSpecimen(db.species.find(s=>s.id===id));
const poses=m=>{const p=[];m.root.traverse(o=>p.push(...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()));return p;};
test('six cnidarians retain surfaces/materials through every available action and reset geometry and instances',()=>{
 for(const id of revisedCnidarians){const s=db.species.find(s=>s.id===id),m=make(id),surfaces=[];animateSpecimen(m,'observe',0);const neutral=poses(m);
  m.root.traverse(o=>{if(o.isMesh)surfaces.push({o,g:o.geometry,mat:o.material,p:o.geometry.attributes.position.array.slice(),instances:o.instanceMatrix?.array.slice()});});
  for(const b of s.behaviors.filter(b=>b.rendering.status!=='unavailable'))for(const t of [0,.5,1.4,3,30]){animateSpecimen(m,b.id,t);for(const{o,g,mat}of surfaces){assert.equal(o.geometry,g);assert.equal(o.material,mat);assert.ok(g.attributes.position.array.every(Number.isFinite),id);assert.ok(o.matrixWorld.elements.every(Number.isFinite),id);if(o.instanceMatrix)assert.ok(o.instanceMatrix.array.every(Number.isFinite));}}
  animateSpecimen(m,'observe',0);assert.deepEqual(poses(m),neutral,id);for(const{o,g,p,instances}of surfaces){assert.deepEqual(g.attributes.position.array,p,id+' neutral vertices');if(instances)assert.deepEqual(o.instanceMatrix.array,instances,id+' neutral instances');}
  assert.doesNotThrow(()=>JSON.stringify(m.root.userData));
 }
});
test('both coral bodies are closed continuous surfaces with a flat basal contact and local-only extension',()=>{
 for(const id of ['acropora-cervicornis','porites-porites']){const m=make(id),r=cnidarianRig(m.root),g=r.body.geometry,edges=new Map(),ix=g.index.array;
  for(let i=0;i<ix.length;i+=3)for(const[a,b]of [[ix[i],ix[i+1]],[ix[i+1],ix[i+2]],[ix[i+2],ix[i]]]){const key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);}
  assert.ok([...edges.values()].every(n=>n===2),id+' open/duplicate mesh edge');
  const a=g.attributes.position,min=Math.min(...Array.from({length:a.count},(_,i)=>a.getY(i))),floor=[];for(let i=0;i<a.count;i++)if(Math.abs(a.getY(i)-min)<1e-5)floor.push([a.getX(i),a.getZ(i)]);
  assert.ok(floor.length>8,id+' basal attachment');assert.ok(new T.Box3().setFromObject(r.body,true).min.y<=.140001);
  const body=a.array.slice(),cups=r.cups.instanceMatrix.array.slice(),polyps=r.polypMeshes[0].mesh.instanceMatrix.array.slice();animateSpecimen(m,'polyps',1.4);assert.deepEqual(a.array,body);assert.deepEqual(r.cups.instanceMatrix.array,cups);assert.notDeepEqual(r.polypMeshes[0].mesh.instanceMatrix.array,polyps);
 }
});
test('sea-fan polyp extension retains the same irregular rigid network and pinnate polyp geometry',()=>{
 const m=make('gorgonia-ventalina'),r=cnidarianRig(m.root),p=r.polypMeshes[0],network=r.body.geometry.attributes.position.array.slice(),pg=p.mesh.geometry,original=p.mesh.instanceMatrix.array.slice();
 assert.equal(db.species.find(s=>s.id===m.id).behaviors[0].rendering.status,'partial');assert.ok(pg.attributes.position.count>1000);assert.ok(p.entries.some(e=>e.n.z<0)&&p.entries.some(e=>e.n.z>0));animateSpecimen(m,'polyps',1.4);assert.deepEqual(r.body.geometry.attributes.position.array,network);assert.equal(p.mesh.geometry,pg);assert.notDeepEqual(p.mesh.instanceMatrix.array,original);
});
test('dense anemone tentacles share a surface while their attached bases remain fixed under local bending',()=>{
 for(const[id,count]of [['metridium-senile',780],['actinia-equina',192]]){const m=make(id),r=cnidarianRig(m.root);assert.equal(r.tentacleCount,count);let meshes=0;m.root.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes<40,'avoid hundreds of independent draw calls');const b=r.tentacleBase,p=r.tentacleMesh.geometry.attributes.position;animateSpecimen(m,'tentacles',1.4);let moved=0;
  for(const s of r.tentacleSections){for(let i=s.start;i<s.start+7;i++){assert.ok(Math.abs(p.getX(i)-b[i*3])<1e-6);assert.ok(Math.abs(p.getZ(i)-b[i*3+2])<1e-6);}for(let i=s.start+7;i<s.start+s.count;i++)if(Math.abs(p.getX(i)-b[i*3])>1e-5||Math.abs(p.getZ(i)-b[i*3+2])>1e-5)moved++;}
  assert.ok(moved>count);
 }
});
test('Hydra shortens and widens locally while retaining its basal attachment and root transform',()=>{
 const m=make('hydra-vulgaris'),r=cnidarianRig(m.root);animateSpecimen(m,'observe',0);const base=r.base.matrixWorld.clone(),root=m.root.matrixWorld.clone(),head=r.head.position.y,b=r.bodyBase,p=r.body.geometry.attributes.position;
 animateSpecimen(m,'contract',3);assert.deepEqual(r.base.matrixWorld.elements,base.elements);assert.deepEqual(m.root.matrixWorld.elements,root.elements);assert.ok(r.head.position.y<head*.7);
 let shorter=0,wider=0;for(let i=0;i<p.count;i++){const y=b[i*3+1],u=(y-.045)/r.height;if(u>.4&&u<.6){if(p.getY(i)<y*.75)shorter++;if(Math.hypot(p.getX(i),p.getZ(i))>Math.hypot(b[i*3],b[i*3+2])*1.2)wider++;}}
 assert.ok(shorter>20&&wider>20);assert.equal(r.tentacles.length,7);
});
