import fs from 'node:fs';import crypto from 'node:crypto';import test from 'node:test';import assert from 'node:assert/strict';
import {buildSpecimen,animateSpecimen} from './models.js';import {molluscRig} from './mollusca-models.js';import {renderedBounds} from './camera-fit.js';
const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))),s=db.species.find(s=>s.id==='cornu-aspersum');
const dispose=m=>{m.root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const mat of Array.isArray(o.material)?o.material:[o.material])mat.dispose();}});};
test('Cornu external head-foot-mantle is one connected closed mesh, not intersecting separate head and foot primitives',()=>{
 const m=buildSpecimen(s),r=molluscRig(m.root),g=r.foot.geometry,p=g.attributes.position,index=g.index.array,edges=new Map(),adj=Array.from({length:p.count},()=>[]);
 for(let i=0;i<index.length;i+=3)for(let j=0;j<3;j++){const a=index[i+j],b=index[i+(j+1)%3];assert.notEqual(a,b,'Degenerate body edge');const key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);adj[a].push(b);adj[b].push(a);}
 for(const count of edges.values())assert.equal(count,2,'Open or non-manifold external skin edge');const seen=new Set([0]),queue=[0];for(let i=0;i<queue.length;i++)for(const next of adj[queue[i]])if(!seen.has(next)){seen.add(next);queue.push(next);}assert.equal(seen.size,p.count,'Disconnected skin components');
 assert(m.root.getObjectByName('Closed selected protoconch exterior'));assert.equal(m.root.getObjectByName('Shell'),r.shell);dispose(m);
});
test('Cornu retained surfaces, support and exact reset survive finite glide and surface-bound anatomy',()=>{
 const m=buildSpecimen(s);animateSpecimen(m,'observe',0);const meshes=[];m.root.traverse(o=>{if(o.isMesh)meshes.push({o,g:o.geometry,material:o.material,positions:o.geometry.attributes.position.array.slice(),matrix:o.matrixWorld.elements.slice()});});
 for(const t of [0,.7,1.8,3.4,5,30]){animateSpecimen(m,'glide',t);assert(renderedBounds(m.root).min.y>=.13);for(const x of meshes){assert.equal(x.o.geometry,x.g);assert.equal(x.o.material,x.material);assert(x.g.attributes.position.array.every(Number.isFinite));assert(x.g.attributes.normal.array.every(Number.isFinite));}assert(m.features.every(f=>f.toArray().every(Number.isFinite)));}
 animateSpecimen(m,'observe',0);for(const x of meshes){assert.deepEqual(x.g.attributes.position.array,x.positions);assert.deepEqual(x.o.matrixWorld.elements,x.matrix);}assert.equal(molluscRig(m.root).appendages.length,4);assert.equal(molluscRig(m.root).appendages.filter(a=>a.eye).length,2);assert(m.textureReady instanceof Promise);dispose(m);
});
test('Cornu correction retains its real photograph and partial action rather than claiming pedal mechanics',()=>{
 const ledger=JSON.parse(fs.readFileSync(new URL('./species-revisions.json',import.meta.url))),revision=ledger.revisions.find(r=>r.kind==='cornu-adult-form-correction');assert.equal(revision.id,s.id);assert.equal(revision.fields.length,6);assert(!revision.fields.some(f=>['behaviors','photograph','taxonomy'].includes(f.path)));assert.equal(s.behaviors[0].rendering.status,'partial');assert.match(s.behaviors[0].description,/No ventral pedal wave/);assert.equal(s.visual.viewerRig.animationValidated,false);const bytes=fs.readFileSync(new URL(s.photograph.localFile,import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),s.photograph.sha256);
});
test('delivered Cornu numerical maps match their provenance checksums and PNG dimensions',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('./texture-cornu-v0634.json',import.meta.url)));assert.equal(manifest.textures.length,3);for(const item of manifest.textures){const b=fs.readFileSync(new URL('./'+item.file,import.meta.url));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),item.sha256);assert.equal(b.readUInt32BE(16),item.width);assert.equal(b.readUInt32BE(20),item.height);}
});
