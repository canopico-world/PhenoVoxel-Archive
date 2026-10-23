import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildSpecimen,animateSpecimen} from './models.js';import {prepareAsset,animateAsset} from './asset-motion.js';import {plantAction,blockedPlantDevelopment} from './plant-development-policy.js';import {renderedBounds,fitSpecimenCamera} from './camera-fit.js';
const db=JSON.parse(fs.readFileSync(new URL('./species.json',import.meta.url))),assets=JSON.parse(fs.readFileSync(new URL('./model-assets.json',import.meta.url))),get=id=>db.species.find(s=>s.id===id);
const visible=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
function snapshot(m){const out=[];m.root.traverse(o=>{if(o.isMesh)out.push({o,g:o.geometry,mat:o.material,vertices:o.geometry.attributes.position.array.slice(),uv:o.geometry.attributes.uv?.array.slice()});});return out;}
function stable(snap){for(const {o,g,mat}of snap){assert.equal(o.geometry,g);assert.equal(o.material,mat);assert.ok(g.attributes.position.array.every(Number.isFinite));assert.ok(o.matrixWorld.elements.every(Number.isFinite));}}
function dispose(m){const gs=new Set(),ms=new Set();m.root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(x=>ms.add(x));});gs.forEach(x=>x.dispose());ms.forEach(x=>{for(const v of Object.values(x))if(v?.isTexture)v.dispose();x.dispose();});}
test('sunflower starts with seed-containing fruit, then cotyledons and true leaves before a green bud and florets',()=>{
 const m=buildSpecimen(get('helianthus-annuus')),r=m.botanicalRig.development,snap=snapshot(m),scale=m.root.scale.clone(),pos=m.root.position.clone();
 animateSpecimen(m,'grow',0);assert.ok(visible(r.earlyParts.fruit));assert.ok(!visible(r.head.group));assert.ok(r.leaves.every(n=>!visible(n.group)));assert.ok(r.earlyParts.cotyledons.every(n=>!visible(n.hinge)));
 animateSpecimen(m,'grow',3.3);assert.ok(r.earlyParts.cotyledons.every(n=>visible(n.hinge)));assert.ok(!visible(r.earlyParts.fruit),'the illustrative discarded fruit coat must not stay attached to the seedling base');assert.ok(r.leaves.every(n=>!visible(n.group)));assert.ok(m.botanicalRig.stems.every(n=>!visible(n.mesh)),'a mature flowering stalk must not protrude above the cotyledon-stage seedling');
 animateSpecimen(m,'grow',6.5);assert.ok(r.leaves.slice(0,4).every(n=>visible(n.group)));assert.ok(!visible(r.head.group));
 animateSpecimen(m,'grow',9.4);assert.ok(visible(r.cover));assert.ok(r.rays.every(n=>!visible(n.petal)));assert.ok(!visible(r.florets));
 animateSpecimen(m,'grow',12);assert.ok(r.rays.every(n=>visible(n.petal)));assert.ok(visible(r.florets));assert.ok(!visible(r.cover));
 for(let t=0;t<=14;t+=.175){animateSpecimen(m,'grow',t);stable(snap);assert.deepEqual(m.root.scale.toArray(),scale.toArray());assert.deepEqual(m.root.position.toArray(),pos.toArray());const b=renderedBounds(m.root);assert.ok(b.min.y>=.129,'exposed tissue penetrates the display floor: '+b.min.y);}
 // Two selected early opposite pairs, followed by alternate mature leaves.
 assert.ok(Math.abs(Math.abs(r.leaves[0].group.rotation.y-r.leaves[1].group.rotation.y)-Math.PI)<1e-8);assert.ok(Math.abs(Math.abs(r.leaves[2].group.rotation.y-r.leaves[3].group.rotation.y)-Math.PI)<1e-8);
 animateSpecimen(m,'grow',12);const full=renderedBounds(m.root);animateSpecimen(m,'grow',100);const held=renderedBounds(m.root);assert.ok(full.min.distanceTo(held.min)<1e-6&&full.max.distanceTo(held.max)<1e-6);dispose(m);
});
test('Arabidopsis keeps credited adult topology while seedling, rosette and reproductive stages are separated',async()=>{
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
 const s=get('arabidopsis-thaliana'),asset=assets.models[s.id],bytes=fs.readFileSync(new URL('./'+asset.localFile,import.meta.url)),gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const m=prepareAsset(gltf,s,asset),r=m.botanicalAssetRig,d=r.development,snap=snapshot(m);assert.ok(d.buds.length>0);assert.equal(m.root.userData.development.validated,false);
 assert.ok(r.sourceCotyledons.length>0,'the source cotyledon material must be included in stage visibility');
 animateAsset(m,'grow',0);const seedMeshes=[];m.root.traverseVisible(o=>{if(o.isMesh)seedMeshes.push(o);});assert.deepEqual(seedMeshes,[d.seed],'the seed stage must contain no mature artist leaves');
 animateAsset(m,'grow',3.3);assert.ok(!visible(d.seed));assert.ok(r.sourceCotyledons.every(o=>!visible(o)),'adult source cotyledons must not duplicate the juvenile pair');
 for(const t of [0,2.5,3.3,6.5,9.4,10.6,12,100]){animateAsset(m,'grow',t);stable(snap);assert.deepEqual(m.root.scale.toArray(),[1,1,1]);if(t<=6.5)assert.ok(r.meshes.filter(x=>x.flower||x.stem).every(x=>!visible(x.mesh)));if(t===6.5)assert.ok(r.meshes.some(x=>x.leaf&&visible(x.mesh)));if(t===9.4)assert.ok(d.buds.some(x=>visible(x.bud)));if(t===12)assert.ok(r.meshes.some(x=>x.flower&&visible(x.mesh)));}
 animateAsset(m,'observe',0);for(const x of snap.filter(x=>r.meshes.some(r=>r.mesh===x.o))){assert.deepEqual(x.g.attributes.uv.array,x.uv);assert.ok(x.g.attributes.position.array.every((v,i)=>Math.abs(v-x.vertices[i])<2e-6));}assert.ok(!visible(d.early));assert.ok(d.buds.every(x=>!visible(x.bud)));dispose(m);
});
test('small paused developmental organs can be inspected closely without changing the default specimen framing',()=>{
 const box=new T.Box3(new T.Vector3(-.023,.14,-.012),new T.Vector3(.023,.17,.012));
 const camera=new T.PerspectiveCamera(38,1,.1,100),controls={target:new T.Vector3(),update(){camera.lookAt(this.target);camera.updateMatrixWorld(true);}};camera.position.set(0,.3,4);
 const ordinary=fitSpecimenCamera(camera,controls,box),close=fitSpecimenCamera(camera,controls,box,{minDistance:.3});assert.ok(close<ordinary/2);
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.87&&p.y<.87&&p.y>-.34&&Math.abs(p.z)<1,'close inspection clipped a visible seed surface');}
});
test('all other live plants reject unsupported development through direct model calls, while local organ responses stay available',()=>{
 assert.equal(Object.keys(blockedPlantDevelopment).length,70);assert.equal(db.species.filter(s=>s.group==='Plantae').length,72);
 for(const s of db.species.filter(s=>s.group==='Plantae'&&blockedPlantDevelopment[s.id])){const m=buildSpecimen(s);animateSpecimen(m,'observe',0);const snap=snapshot(m),matrix=m.root.matrixWorld.clone();for(const action of blockedPlantDevelopment[s.id]){assert.equal(s.behaviors.find(b=>b.id===action).rendering.status,'unavailable');for(const t of [0,3.5,7,30]){animateSpecimen(m,action,t);m.root.updateMatrixWorld(true);assert.deepEqual(m.root.matrixWorld.elements,matrix.elements);for(const x of snap)assert.deepEqual(x.g.attributes.position.array,x.vertices);}}dispose(m);}
 assert.equal(plantAction('mimosa-pudica','fold'),'fold');assert.equal(plantAction('dionaea-muscipula','trap'),'trap');assert.equal(plantAction('dryopteris-filix-mas','unfurl'),'unfurl');assert.equal(plantAction('pteridium-aquilinum','unfurl'),'observe');assert.equal(plantAction('panthera-tigris','run'),'run');
});
