import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';
import {buildSpecimen,animateSpecimen} from './models.js';import {fungalExteriorRig} from './fungal-exteriors.js';
const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url)));
test('selected fungal exteriors retain closed cap volumes, supported stipes and distinct fertile surfaces',()=>{
 for(const[id,count,lamellae]of[['pleurotus-ostreatus',5,5],['agaricus-bisporus',3,1],['trametes-versicolor',6,0]]){
  const m=buildSpecimen(db.species.find(s=>s.id===id)),r=fungalExteriorRig(m.root);assert.equal(r.caps.length,count);assert.equal(r.gills.length,lamellae);
  for(const c of r.caps){const g=c.geometry,p=g.attributes.position,idx=g.index.array,edges=new Map();let volume=0;for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],d=idx[i+2];const A=new T.Vector3().fromBufferAttribute(p,a),B=new T.Vector3().fromBufferAttribute(p,b),C=new T.Vector3().fromBufferAttribute(p,d);assert.ok(B.clone().sub(A).cross(C.clone().sub(A)).lengthSq()>1e-17,'collapsed cap face');volume+=A.dot(B.cross(C))/6;for(const[x,y]of[[a,b],[b,d],[d,a]]){const key=x<y?x+','+y:y+','+x;edges.set(key,(edges.get(key)||0)+1);}}assert.ok([...edges.values()].every(x=>x===2),'cap is not closed manifold');assert.ok(volume>0,'cap normals face inward');assert.ok(g.attributes.color&&c.material.bumpMap);}
  const box=new T.Box3().setFromObject(m.root,true);assert.ok(Math.abs(box.min.y-.14)<.001,'attachment support floats');
  for(const plate of r.gills){const p=plate.geometry.attributes.position,idx=plate.geometry.index.array;let volume=0;for(let i=0;i<idx.length;i+=3){const a=new T.Vector3().fromBufferAttribute(p,idx[i]),b=new T.Vector3().fromBufferAttribute(p,idx[i+1]),c=new T.Vector3().fromBufferAttribute(p,idx[i+2]);volume+=a.dot(b.cross(c));}assert.ok(volume>0,'fertile plates face inward');}
  assert.equal(m.root.userData.focusAnatomy,true);assert.deepEqual(m.root.userData.anatomyUnderside,id==='trametes-versicolor'?[2]:[1]);
  const names=[];m.root.traverse(o=>names.push(o.name));if(id==='agaricus-bisporus'){assert.equal(names.filter(n=>n==='selected-unbroken-partial-veil').length,2);assert.ok(names.includes('thin-membranous-annulus'));}if(id==='trametes-versicolor'){assert.equal(names.filter(n=>n==='fine-underside-pore-mouths').length,6);assert.equal(names.filter(n=>n==='short-attached-velvety-pileus-relief').length,6);}
 }
});
test('fruit bodies never resize as development; finite overlay retains all surfaces and resets',()=>{
 for(const id of['pleurotus-ostreatus','agaricus-bisporus','trametes-versicolor']){const s=db.species.find(s=>s.id===id),m=buildSpecimen(s),r=fungalExteriorRig(m.root),retained=[];m.root.traverse(o=>{if(o.isMesh)retained.push([o,o.geometry,o.material,o.position.clone(),o.scale.clone()]);});
  for(const action of['grow','spread','spores','observe'])for(const t of[0,.25,1,2,4,25]){animateSpecimen(m,action,t);for(const[o,g,mat,pos,scale]of retained){assert.equal(o.geometry,g);assert.equal(o.material,mat);assert.ok(o.position.equals(pos));assert.ok(o.scale.equals(scale));}assert.equal(r.points.visible,action==='spores');}
  animateSpecimen(m,'spores',4);const end=r.points.geometry.attributes.position.array.slice();animateSpecimen(m,'spores',100);assert.deepEqual(r.points.geometry.attributes.position.array,end);animateSpecimen(m,'observe',0);assert.equal(r.points.visible,false);assert.ok(s.behaviors.filter(b=>['grow','spread'].includes(b.id)).every(b=>b.rendering.status==='unavailable'));
 }
});
