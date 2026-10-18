import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {buildSpecimen,animateSpecimen} from './models.js';
import {echinodermRig,revisedEchinoderms} from './echinoderm-revision.js';
const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url)));
const make=id=>buildSpecimen(db.species.find(s=>s.id===id));
const poses=m=>{const out=[];m.root.traverse(o=>{out.push(...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray());});return out;};
test('six echinoderms retain every surface across their enabled actions and reset completely',()=>{
 for(const id of revisedEchinoderms){const s=db.species.find(s=>s.id===id),m=make(id),rig=echinodermRig(m.root),surfaces=[];assert.ok(rig);
  animateSpecimen(m,'observe',0);const neutral=poses(m);m.root.traverse(o=>{if(o.isMesh)surfaces.push([o,o.geometry,o.material,o.geometry.attributes.position.array.slice()]);});
  for(const b of s.behaviors.filter(b=>b.rendering.status!=='unavailable'))for(const t of [0,.5,1.4,3.5,30]){animateSpecimen(m,b.id,t);for(const[o,g,mat]of surfaces){assert.equal(o.geometry,g);assert.equal(o.material,mat);assert.ok(g.attributes.position.array.every(Number.isFinite));assert.ok(o.matrixWorld.elements.every(Number.isFinite));}}
  animateSpecimen(m,'observe',0);assert.deepEqual(poses(m),neutral,id);for(const[o,g,mat,p]of surfaces)assert.deepEqual(g.attributes.position.array,p,id+' reset geometry');
  assert.doesNotThrow(()=>JSON.stringify(m.root.userData),'export metadata contains cycles');
 }
});
test('tube-foot recovery lifts tips while support stays on the same floor without root translation',()=>{
 for(const id of ['asterias-rubens','luidia-ciliaris','echinus-esculentus']){const m=make(id),r=echinodermRig(m.root),home=m.root.position.clone();let lifted=0,supported=0;
  for(const t of [0,.5,1.4,3.5,8]){animateSpecimen(m,'crawl',t);for(const f of r.feet){assert.ok(f.tip.position.y>=f.end.y-1e-7);if(f.tip.position.y>f.end.y+.002)lifted++;else supported++;assert.ok(f.stem.scale.y>0);const upper=new T.Vector3(0,.5,0).applyMatrix4(f.stem.matrix),lower=new T.Vector3(0,-.5,0).applyMatrix4(f.stem.matrix);assert.ok(Math.min(upper.distanceTo(f.anchor),lower.distanceTo(f.anchor))<1e-6);}}
  assert.ok(lifted&&supported);assert.deepEqual(m.root.position.toArray(),home.toArray());
 }
});
test('Luidia has seven narrow arms and pointed feet; Asterias five arms with adhesive-disc cues',()=>{
 const a=echinodermRig(make('asterias-rubens').root),l=echinodermRig(make('luidia-ciliaris').root);
 assert.equal(a.armCount,5);assert.equal(l.armCount,7);assert.ok(a.feet.every(f=>f.disc));assert.ok(l.feet.every(f=>!f.disc));assert.notEqual(a.body.geometry.attributes.position.count,0);
 assert.notDeepEqual(a.body.geometry.attributes.position.array,l.body.geometry.attributes.position.array);
});
test('brittle-star arm plates and spine instances inherit the articulated chain',()=>{
 const m=make('ophiothrix-fragilis'),r=echinodermRig(m.root);assert.equal(r.joints.length,110);const j=r.joints[55],spines=j.object.children.find(o=>o.isInstancedMesh);assert.equal(spines.count,14);
 animateSpecimen(m,'observe',0);const before=spines.matrixWorld.clone();animateSpecimen(m,'arms',1.4);assert.ok(!before.equals(spines.matrixWorld));assert.equal(spines.parent,j.object);
});
test('living sand-dollar spines move on the retained flattened test without enabling particle capture',()=>{
 const m=make('dendraster-excentricus'),r=echinodermRig(m.root),s=db.species.find(s=>s.id===m.id);assert.equal(s.behaviors.find(b=>b.id==='feed').rendering.status,'unavailable');
 animateSpecimen(m,'observe',0);const before=r.spineMesh.instanceMatrix.array.slice(),g=r.body.geometry;animateSpecimen(m,'spines',1.4);assert.notDeepEqual(r.spineMesh.instanceMatrix.array,before);assert.equal(r.body.geometry,g);animateSpecimen(m,'observe',0);assert.deepEqual(r.spineMesh.instanceMatrix.array,before);
});
