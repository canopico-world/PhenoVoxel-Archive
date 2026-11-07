import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';
import {buildSpecimen,animateSpecimen} from './models.js';import {hermitRig} from './hermit-crab.js';import {renderedBounds} from './camera-fit.js';
import {movementRecordAt684} from './movement-record-history.mjs';import {movementDatabaseAt686} from './movement-history-v0687.mjs';
const db=JSON.parse(fs.readFileSync('species.json'));
const make=()=>buildSpecimen(db.species.find(s=>s.id==='pagurus-bernhardus'));
test('Withdrawal ledger preserves unrelated records and rejects undocumented changes in both history APIs',()=>{
 const prior=movementDatabaseAt686(db);assert.equal(prior.version,'0.6.86');const s=db.species.find(s=>s.id==='pagurus-bernhardus');assert.equal(s.behaviors.find(b=>b.id==='withdraw').rendering.status,'partial');assert.equal(prior.species.find(s=>s.id==='pagurus-bernhardus').behaviors.find(b=>b.id==='withdraw').rendering.status,'unavailable');assert.equal(s.review.independentlyValidated,false);
 const record=structuredClone(s);record.summary+=' undocumented';assert.throws(()=>movementRecordAt684(record));const bad=structuredClone(db);bad.species[0].summary+=' undocumented';assert.throws(()=>movementDatabaseAt686(bad));
 for(const id of ['palaemon-serratus','crangon-crangon','pagurus-bernhardus'])assert.equal(movementRecordAt684(db.species.find(s=>s.id===id)).review.movementStudyVersion,undefined);
});
function points(m){const a=[];m.root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i+=Math.max(1,Math.floor(p.count/11)))a.push(...new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).toArray());});return a;}
test('Withdrawal retains joint lengths, shell position and material/UV/pigment identity',()=>{
 const m=make(),r=hermitRig(m.root),surfaces=[];m.root.traverse(o=>{if(o.isMesh)surfaces.push([o,o.geometry,o.material,o.geometry.attributes.uv?.array.slice(),o.geometry.attributes.color?.array.slice()]);});
 const shell=r.shellGroup.matrixWorld.clone();let maxRetreat=0;
 for(let t=0;t<=9.01;t+=.05){animateSpecimen(m,'withdraw',t);assert(renderedBounds(m.root).min.y>=.1399);for(let i=0;i<16;i++)if(i!==13)assert.equal(r.shellGroup.matrixWorld.elements[i],shell.elements[i]);assert(shell.elements[13]-r.shellGroup.matrixWorld.elements[13]<=.17*m.root.scale.y+1e-8);maxRetreat=Math.max(maxRetreat,-r.body.position.x);
  for(const l of r.legs){const p=l.segments.map(o=>o.getWorldPosition(new T.Vector3())),f=l.foot.clone().applyMatrix4(r.body.matrixWorld);for(const [d,L]of [[p[0].distanceTo(p[1]),l.A],[p[1].distanceTo(p[2]),l.B],[p[2].distanceTo(f),l.D]])assert(Math.abs(d-L*m.root.scale.x)<1e-8);}
  for(const c of r.claws){const p=c.arm.map(o=>o.getWorldPosition(new T.Vector3())),w=c.hand.getWorldPosition(new T.Vector3());for(const[d,L]of[[p[0].distanceTo(p[1]),c.armLengths[0]],[p[1].distanceTo(w),c.armLengths[1]]])assert(Math.abs(d-L*m.root.scale.x)<1e-8);}
 }
 assert(maxRetreat>.65);for(const[o,g,mat,uv,color]of surfaces){assert.equal(o.geometry,g);assert.equal(o.material,mat);if(uv)assert.deepEqual(g.attributes.uv.array,uv);if(color)assert.deepEqual(g.attributes.color.array,color);}
});
test('Withdrawal supports finite playback, backwards seeking and exact exterior recovery',()=>{
 const m=make(),r=hermitRig(m.root);animateSpecimen(m,'observe',0);const initial=points(m);
 animateSpecimen(m,'withdraw',3);const folded=points(m);assert(folded.every(Number.isFinite));assert(folded.some((v,i)=>Math.abs(v-initial[i])>.2));assert.equal(m.movementStudy.duration,9);assert.equal(m.root.userData.withdrawalStudy.measured,false);
 assert(Math.abs(renderedBounds(m.root).min.y-.14)<.001,'shell lip supports the retracted animal');
 assert(r.claws.find(c=>c.major).hand.rotation.z>1.5);assert(r.eyes.every(e=>Math.abs(e.o.rotation.y)>1));
 animateSpecimen(m,'withdraw',7);animateSpecimen(m,'withdraw',3);assert.deepEqual(points(m),folded);
 animateSpecimen(m,'withdraw',9);const end=points(m);animateSpecimen(m,'withdraw',999);assert.deepEqual(points(m),end);
 animateSpecimen(m,'observe',0);assert.deepEqual(points(m),initial);assert.equal(m.movementStudy,undefined);
 animateSpecimen(m,'withdraw',0);const start=points(m);assert(start.every((v,i)=>Math.abs(v-initial[i])<1e-6));
});

