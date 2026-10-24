import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import crypto from'node:crypto';import * as T from'three';import{buildSpecimen,animateSpecimen}from'./models.js';import{velvetRig}from'./velvet-crab.js';import{mittenRig}from'./mitten-crab.js';import{asianShoreRig}from'./asian-shore-crab.js';import{renderedBounds}from'./camera-fit.js';
const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const[id,getRig,pairs]of[['necora-puber',velvetRig,3],['eriocheir-sinensis',mittenRig,4],['hemigrapsus-sanguineus',asianShoreRig,4]]){
const s=db.species.find(s=>s.id===id);
test(id+': authored support preserves fixed segment lengths and planted world contacts on the same geometry',()=>{
 const m=buildSpecimen(s),r=getRig(m.root),scale=m.root.scale.x,previous=new Map(),meshes=[];m.root.traverse(o=>{if(o.isMesh)meshes.push([o,o.geometry,o.material]);});assert.equal(r.legs.length,pairs*2);let minimum=pairs*2;
 for(let t=0;t<7.11;t+=.025){animateSpecimen(m,'walk',t);minimum=Math.min(minimum,r.legs.filter(l=>l.contact).length);for(const l of r.legs){const foot=m.root.localToWorld(l.foot.clone());assert(foot.y>=.13999);if(l.contact&&previous.get(l)?.contact)assert(foot.distanceTo(previous.get(l).foot)<.00002,id+' stance drift');previous.set(l,{contact:l.contact,foot});const p=l.segments.map(o=>o.getWorldPosition(new T.Vector3()));for(const[i,n]of[[1,l.A],[2,l.C],[3,l.B-l.C]])assert(Math.abs(p[i].distanceTo(p[i+1])-n*scale)<1e-6);assert(Math.abs(p[4].distanceTo(foot)-l.D*scale)<1e-6);}}
 assert(minimum>=3);for(const[o,g,mat]of meshes){assert.equal(o.geometry,g);assert.equal(o.material,mat);}
});
test(id+': advertised actions stay finite above the floor, settle and reset without changing the organism',()=>{
 const m=buildSpecimen(s),r=getRig(m.root),neutral=[];animateSpecimen(m,'observe',0);m.root.traverse(o=>neutral.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]));
 for(const a of s.behaviors.map(b=>b.id))for(const t of [0,.8,2.6,4.8,7,20]){animateSpecimen(m,a,t);const bounds=renderedBounds(m.root);assert(bounds.min.y>=.1399,a+' floor intersection '+bounds.min.y);m.root.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));if(a==='swim'){assert(r.legs.every(l=>!l.contact));assert.equal(r.paddles.length,2);for(const p of r.paddles)for(let j=0;j<4;j++)assert(Math.abs(p.tips[j].distanceTo(p.tips[j+1])-p.lengths[j])<1e-7);}}
 animateSpecimen(m,'walk',7);const end=m.root.position.clone();animateSpecimen(m,'walk',100);assert(end.distanceTo(m.root.position)<1e-8);animateSpecimen(m,'observe',0);for(const[o,p,q,sc]of neutral){assert(o.position.distanceTo(p)<1e-8);assert(1-Math.abs(o.quaternion.dot(q))<1e-8);assert(o.scale.distanceTo(sc)<1e-8);}
});
test(id+': accepted species and authentic licensed photo retain exact provenance and disclose limits',()=>{
 assert.equal(s.taxonomy.canonicalName,s.scientificName);assert.equal(s.taxonomy.status,'ACCEPTED');assert.equal(s.scientificName.split(' ').length,2);assert.equal(hash(fs.readFileSync(new URL('./'+s.photograph.localFile,import.meta.url))),s.photograph.sha256);assert(s.photograph.author&&s.photograph.licenseUrl&&s.photograph.downloadSha256);assert.equal(s.review.independentlyValidated,false);assert.equal(s.review.accuracyPercent,null);assert(s.behaviors.every(b=>b.rendering.status==='partial'));assert.match(s.visual.viewerRig.scope,/unmeasured|uncalibrat|No biological timing|no measured gait/);
});
}

