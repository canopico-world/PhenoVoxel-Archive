import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareAsset,animateAsset} from './asset-motion.js';
import { readFile } from 'node:fs/promises';
import { buildSpecimen, animateSpecimen, modelKinds } from './models.js';
const archive=JSON.parse(await readFile(new URL('./species.json',import.meta.url),'utf8'));
const media=JSON.parse(await readFile(new URL('./media.json',import.meta.url),'utf8'));
const atlas=JSON.parse(await readFile(new URL('./atlas.json',import.meta.url),'utf8'));
test('each record has a bundled licensed organism reference and traceable occurrence snapshot',async()=>{
 assert.equal(Object.keys(media.photos).length,50);assert.equal(Object.keys(atlas.species).length,50);
 for(const s of archive.species){
  const p=media.photos[s.id],a=atlas.species[s.id];assert.ok(p.author);assert.match(p.license,/CC BY|CC0|Public domain/);assert.equal(new URL(p.source).hostname,'commons.wikimedia.org');assert.ok(p.licenseUrl);
  assert.equal(p.localFile,s.photograph.localFile);const bytes=await readFile(new URL('./'+p.localFile,import.meta.url));assert.ok(bytes.length>1000);assert.ok((bytes[0]===255&&bytes[1]===216)||(bytes[0]===137&&bytes[1]===80),`${s.id}: invalid photograph file`);
  assert.equal(a.taxonKey,s.taxonomy.acceptedUsageKey||s.taxonomy.usageKey);assert.ok(Number.isInteger(a.count)&&a.count>=0);assert.equal(new URL(a.query).hostname,'api.gbif.org');assert.equal(new URL(a.query).searchParams.get('hasGeospatialIssue'),'false');assert.ok(a.retrieved);assert.deepEqual(s.occurrences,a);
 }
});
test('detailed reconstructions have resettable articulated limbs and remain explicitly unvalidated',()=>{
 for(const id of ['canis-lupus','vulpes-vulpes','panthera-tigris']){
  const s=archive.species.find(s=>s.id===id),m=buildSpecimen(s);assert.equal(m.natural,true);assert.equal(m.parts.limbs.length,4);assert.ok(s.visual.referencePhoto);assert.equal(s.review.animationValidated,false);
  animateSpecimen(m,'walk',.3);const moved=m.parts.limbs[0].paw.position.clone();animateSpecimen(m,'observe',0);assert.notDeepEqual(moved.toArray(),m.parts.limbs[0].paw.position.toArray());
  m.root.traverse(o=>{if(o.geometry){const p=o.geometry.attributes.position;for(const n of p.array)assert.ok(Number.isFinite(n),`${id}: invalid mesh vertex`);}});
 }
});
const assets=JSON.parse(await readFile(new URL('./model-assets.json',import.meta.url),'utf8'));
// Headless parsing checks the real binary mesh/rig. Pixel appearance is reviewed separately in-browser.
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const parsed=new Map();async function assetModel(s){if(!parsed.has(s.id)){const bytes=await readFile(new URL('./'+assets.models[s.id].localFile,import.meta.url));const g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');parsed.set(s.id,prepareAsset(g,s,assets.models[s.id]));}return parsed.get(s.id);}

test('clownfish deforms its retained surface with paired fin and tail motion, and restores the neutral pose',async()=>{
 const s=archive.species.find(s=>s.id==='amphiprion-ocellaris'),m=await assetModel(s);
 assert.equal(s.modelAsset.rigged,false);assert.equal(s.modelAsset.viewerRig.animationValidated,false);assert.equal(m.fishRig.length,2);
 for(const {mesh,bones} of m.fishRig){
  const geometry=mesh.geometry,material=mesh.material,p=geometry.attributes.position,w=geometry.attributes.skinWeight,indices=geometry.attributes.skinIndex;
  if(material.name==='Default'){assert.equal(material.transparent,false);assert.equal(material.depthWrite,true);}else assert.equal(material.depthWrite,false);
  assert.equal(bones.length,7);let head=0,tail=0,fin=0;
  for(let i=0;i<p.count;i++){if(p.getZ(i)>p.getZ(head))head=i;if(p.getZ(i)<p.getZ(tail))tail=i;if(p.getX(i)>p.getX(fin))fin=i;assert.ok(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<1e-6);for(const value of [indices.getX(i),indices.getY(i),indices.getZ(i),indices.getW(i)])assert.ok(value>=0&&value<7);}
  animateAsset(m,'observe',0);const at=i=>mesh.getVertexPosition(i,new THREE.Vector3());const neutral=[at(head),at(tail),at(fin)];
  for(const action of ['swim','forage','escape']){let tailMotion=0,finMotion=0;for(const t of [.11,.37,.63]){animateAsset(m,action,t);assert.strictEqual(mesh.geometry,geometry);assert.strictEqual(mesh.material,material);if(mesh.parent.name==='RetopoGroup1')assert.ok(at(head).distanceTo(neutral[0])<1e-6,'head moves despite neutral forebody');tailMotion=Math.max(tailMotion,at(tail).distanceTo(neutral[1]));finMotion=Math.max(finMotion,at(fin).distanceTo(neutral[2]));}assert.ok(tailMotion>.01,'tail is still rigid');assert.ok(finMotion>.01,'pectoral fin is still rigid');}
  animateAsset(m,'observe',0);for(const [i,index] of [head,tail,fin].entries())assert.ok(at(index).distanceTo(neutral[i])<1e-6,'neutral pose was not restored');
 }
 assert.ok(s.behaviors.find(b=>b.id==='swim').sourceIds.includes('amphiprion-ocellaris-swimming-2019'));
});
test('bundled surfaces preserve source licenses, embedded textures and exact byte provenance',async()=>{
 assert.equal(Object.keys(assets.models).length,20);
 for(const [id,a] of Object.entries(assets.models)){assert.ok(a.author);assert.equal(a.license,'CC BY 4.0');assert.equal(new URL(a.download).protocol,'https:');assert.match(a.delivery,/Bundled (?:optimized )?GLB/);assert.deepEqual(archive.species.find(s=>s.id===id).modelAsset,a);
  const bytes=await readFile(new URL('./'+a.localFile,import.meta.url));assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);const j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));assert.ok(j.meshes.length);assert.ok(j.materials?.length,id+': missing surface materials');if(['canis-lupus','panthera-tigris'].includes(id))assert.ok(j.images?.length,id+': no texture');assert.ok((j.images||[]).every(i=>i.bufferView!==undefined),id+': external texture dependency');assert.match(j.asset.extras.license,/CC.BY.4.0|CC BY 4.0|creativecommons.org\/licenses\/by\/4.0\//);
 }
});
test('wolf and tiger retain mesh, materials and skeleton across distinct behaviors',async()=>{
 for(const id of ['canis-lupus','panthera-tigris']){
  const s=archive.species.find(s=>s.id===id),m=await assetModel(s),meshes=[];m.root.traverse(o=>{if(o.isMesh)meshes.push([o,o.geometry,o.material]);});assert.equal(m.limbs.length,4);assert.equal(new Set(m.limbs.map(l=>l.end)).size,4);
  const poses=[];for(const mode of ['observe','walk','run','forage','rest']){animateAsset(m,mode,.55);m.root.updateMatrixWorld(true);const pose=m.bones.flatMap(b=>b.quaternion.toArray());poses.push(pose);assert.equal(m.id,id);for(const [o,g,mat] of meshes){assert.equal(o.geometry,g);assert.equal(o.material,mat);}assert.ok(pose.every(Number.isFinite));}
  for(let i=1;i<poses.length;i++)assert.notDeepEqual(poses[i],poses[0],id+': action retained observe pose');
  animateAsset(m,'walk',.2);const foot=m.limbs[0].end.getWorldPosition(new THREE.Vector3());animateAsset(m,'walk',.7);assert.ok(foot.distanceTo(m.limbs[0].end.getWorldPosition(new THREE.Vector3()))>.025,id+': walking paw did not move');
  if(id==='canis-lupus')for(const action of ['forage','rest']){animateAsset(m,action,.55);m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});assert.ok(Math.abs(new THREE.Box3().setFromObject(m.root,true).min.y-.13)<.005,id+': creator pose floats above the display floor');}
  animateAsset(m,'rest',0);m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});const height=new THREE.Box3().setFromObject(m.root,true).getSize(new THREE.Vector3()).y;animateAsset(m,'observe',0);m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});assert.ok(height<new THREE.Box3().setFromObject(m.root,true).getSize(new THREE.Vector3()).y*.85,id+': resting body not lowered');
 }
});
test('seated and recumbent mammal postures preserve bone lengths, flatten toes and settle paw surfaces',async()=>{
 for(const id of ['canis-lupus','panthera-tigris']){
  const m=await assetModel(archive.species.find(s=>s.id===id));animateAsset(m,'observe',0);m.root.updateMatrixWorld(true);
  const limbBones=new Set(m.limbs.flatMap(l=>[...l.chain.slice(1),l.end,...l.end.children.filter(b=>b.isBone)]));
  const links=[...limbBones].map(b=>[b,b.getWorldPosition(new THREE.Vector3()).distanceTo(b.parent.getWorldPosition(new THREE.Vector3()))]);
  for(const action of ['sit','rest','sleep']){animateAsset(m,action,0);m.root.updateMatrixWorld(true);
   for(const [bone,length] of links)assert.ok(Math.abs(bone.getWorldPosition(new THREE.Vector3()).distanceTo(bone.parent.getWorldPosition(new THREE.Vector3()))-length)<1e-5,id+': altered segment length');
   for(const [i,l] of m.limbs.entries()){
    const toe=id==='canis-lupus'&&l.front?l.end.children.find(b=>b.isBone):l.end,child=toe.children.find(b=>b.isBone);
    assert.ok(Math.abs(child.getWorldPosition(new THREE.Vector3()).y-toe.getWorldPosition(new THREE.Vector3()).y)<1e-5,id+': toe pitched through floor');
    let min=Infinity;for(const [mesh,index] of m.pawSamples[i])min=Math.min(min,mesh.getVertexPosition(index,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).y);
    assert.ok(min>=.125&&min<=.16,`${id} ${action}: paw surface ${min}`);
   }
  }
 }
});
test('new surface rigs deform source vertices, use valid skin weights, and return to neutral',async()=>{
 for(const [id,action] of Object.entries({'megaptera-novaeangliae':'swim','chelonia-mydas':'swim','danaus-plexippus':'fly','haliaeetus-leucocephalus':'fly','aptenodytes-forsteri':'swim','tyto-alba':'forage','ursus-arctos':'forage','pan-troglodytes':'forage'})){
  const s=archive.species.find(s=>s.id===id),m=await assetModel(s);assert.equal(s.modelAsset.rigged,false);assert.equal(s.modelAsset.viewerRig.animationValidated,false);
  let movement=0;
  for(const {mesh,bones} of m.surfaceRig.rigs){const {position:p,skinWeight:w,skinIndex:si}=mesh.geometry.attributes;assert.equal(bones.length,s.modelAsset.viewerRig.jointsPerMesh);const samples=new Map();
   for(let i=0;i<p.count;i++){assert.ok(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<1e-6);for(const k of ['getX','getY','getZ','getW']){const b=si[k](i),weight=w[k](i);assert.ok(b<bones.length);if(b&&weight>(samples.get(b)?.weight||0))samples.set(b,{index:i,weight});}}
   animateAsset(m,'observe',0);const neutral=[...samples.values()].map(v=>mesh.getVertexPosition(v.index,new THREE.Vector3()));const geometry=mesh.geometry,material=mesh.material;
   for(const t of [.13,.47,1.21]){animateAsset(m,action,t);assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);[...samples.values()].forEach((v,i)=>movement=Math.max(movement,mesh.getVertexPosition(v.index,new THREE.Vector3()).distanceTo(neutral[i])));}
   animateAsset(m,'observe',0);[...samples.values()].forEach((v,i)=>assert.ok(mesh.getVertexPosition(v.index,new THREE.Vector3()).distanceTo(neutral[i])<1e-5,id+': neutral reset failed'));
  }assert.ok(movement>.003,id+': no source vertex articulation');
 }
});
test('microbial appendages distinguish rotary propulsion from flexible flagella and reset surfaces',()=>{
 for(const id of ['escherichia-coli','bacillus-subtilis','halobacterium-salinarum']){const m=buildSpecimen(archive.species.find(s=>s.id===id));animateSpecimen(m,'tumble',.37);assert.ok(m.parts.tails.length);assert.equal(m.parts.tails[0].rotation.y,0);assert.ok(Math.abs(m.parts.tails[0].rotation.x)>.1);animateSpecimen(m,'observe',0);assert.equal(m.parts.tails[0].rotation.x,0);}
 for(const id of ['euglena-gracilis','chlamydomonas-reinhardtii']){const m=buildSpecimen(archive.species.find(s=>s.id===id)),mesh=m.parts.tails[0].children.find(o=>o.isMesh),p=mesh.geometry.attributes.position,neutral=p.array.slice();animateSpecimen(m,'swim',.37);assert.notDeepEqual(p.array,neutral);animateSpecimen(m,'observe',0);assert.deepEqual(p.array,neutral);}
 const m=buildSpecimen(archive.species.find(s=>s.id==='amoeba-proteus'));animateSpecimen(m,'observe',0);const field=m.parts.body.field.slice();animateSpecimen(m,'crawl',1.2);assert.notDeepEqual(m.parts.body.field,field);animateSpecimen(m,'observe',0);assert.deepEqual(m.parts.body.field,field);
});
test('50 unique species across the three domains with complete source provenance',()=>{
 assert.equal(archive.species.length,50);assert.equal(new Set(archive.species.map(s=>s.id)).size,50);
 assert.deepEqual([...new Set(archive.species.map(s=>s.domain))].sort(),['Archaea','Bacteria','Eukaryota']);
 for(const s of archive.species){
  assert.equal(s.anatomy.length,3);assert.ok(s.behaviors.length>0);assert.ok(modelKinds.includes(s.visual.kind));
  assert.equal(new Set(s.sources.map(r=>r.id)).size,s.sources.length,`${s.id}: duplicate source IDs`);
  assert.equal(s.review.animationValidated,false);assert.equal(s.taxonomy.provider,'GBIF backbone');assert.equal(s.family,s.taxonomy.family);
  for(const source of s.sources){assert.equal(new URL(source.url).protocol,'https:');assert.ok(source.accessed);assert.ok(source.scope);}
  for(const b of s.behaviors){assert.ok(b.sourceIds.length>0);for(const id of b.sourceIds)assert.ok(s.sources.some(r=>r.id===id),`${s.id}: orphan reference ${id}`);assert.ok(b.timeScale.includes('uncalibrated'));}
 }
});
test('non-animal processes exclude walking, jumping, sleeping and animal escape',()=>{
 for(const s of archive.species.filter(s=>s.group!=='Animalia'))for(const b of s.behaviors)assert.ok(!['walk','run','jump','sleep','escape','fly'].includes(b.id),`${s.id}: ${b.id}`);
 assert.ok(archive.species.some(s=>s.behaviors.some(b=>b.id==='sleep')));
 assert.ok(archive.species.some(s=>s.behaviors.some(b=>b.id==='escape')));
});
test('all displayed surfaces and authored motion modes produce finite transforms over playback',async()=>{
 for(const s of archive.species){
  const m=assets.models[s.id]?await assetModel(s):buildSpecimen(s);if(!m.textured)assert.ok(m.surfaceDetailed||m.reference,s.id+': surface has not been upgraded');assert.equal(m.id,s.id,s.id+': incorrect exported identifier');let meshes=0;m.root.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes>0,`${s.id} missing geometry`);assert.equal(m.features.length,3);
  for(const action of ['observe',...s.behaviors.map(b=>b.id)])for(const t of [0,.5,2.3,8.99,20.1]){
   if(m.textured)animateAsset(m,action,t);else animateSpecimen(m,action,t);
   m.root.traverse(o=>{for(const n of [...o.position.toArray(),...o.scale.toArray(),o.rotation.x,o.rotation.y,o.rotation.z])assert.ok(Number.isFinite(n),`${s.id} ${action} nonfinite transform`);assert.ok(Math.abs(o.scale.x)>1e-10&&Math.abs(o.scale.y)>1e-10&&Math.abs(o.scale.z)>1e-10,`${s.id} degenerate model`);});
  }
  if(m.textured)animateAsset(m,'observe',0);else animateSpecimen(m,'observe',0);assert.equal(m.root.position.x,0);assert.equal(m.root.scale.x,1);
  const geo=new Set(),mat=new Set();m.root.traverse(o=>{if(o.geometry)geo.add(o.geometry);if(o.material)mat.add(o.material);});geo.forEach(x=>x.dispose());mat.forEach(x=>x.dispose());
 }
});
