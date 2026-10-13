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
test('mammal repose preserves limb lengths, supports the torso and forepaws, and prevents inverted wrists',async()=>{
 for(const id of ['canis-lupus','panthera-tigris']){
  const m=await assetModel(archive.species.find(s=>s.id===id));animateAsset(m,'observe',0);m.root.updateMatrixWorld(true);
  const limbBones=new Set(m.limbs.flatMap(l=>[...l.chain.slice(1),l.end,...l.end.children.filter(b=>b.isBone)]));
  const links=[...limbBones].map(b=>[b,b.getWorldPosition(new THREE.Vector3()).distanceTo(b.parent.getWorldPosition(new THREE.Vector3()))]);
  for(const action of ['sit','rest','sleep']){animateAsset(m,action,0);m.root.updateMatrixWorld(true);
   for(const [bone,length] of links)assert.ok(Math.abs(bone.getWorldPosition(new THREE.Vector3()).distanceTo(bone.parent.getWorldPosition(new THREE.Vector3()))-length)<1e-5,id+': altered segment length');
   for(const [i,l] of m.limbs.entries()){
    const toe=l.digits,child=toe.children.find(b=>b.isBone),direction=child.getWorldPosition(new THREE.Vector3()).sub(toe.getWorldPosition(new THREE.Vector3()));
    assert.ok(direction.x>.01&&direction.y>-.035,id+': digit axis is inverted or points through floor');if(l.front||action==='sit')assert.ok(Math.abs(direction.y)<.035,id+': supporting digits are pitched away from floor');
    if(l.front){const carpus=toe.getWorldPosition(new THREE.Vector3()).sub(l.wrist.getWorldPosition(new THREE.Vector3()));assert.ok(carpus.x>0&&carpus.y<-.05,id+': wrist folds backward');const elbow=id==='canis-lupus'?l.chain[2]:l.chain[1];assert.ok(elbow.getWorldPosition(new THREE.Vector3()).x<l.wrist.getWorldPosition(new THREE.Vector3()).x,id+': elbow inverted');}
    let min=Infinity;for(const [mesh,index] of m.pawSamples[i])min=Math.min(min,mesh.getVertexPosition(index,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).y);
    assert.ok(min>=.12,`${id} ${action}: paw penetrates floor ${min}`);if(l.front||action==='sit')assert.ok(min<=.145,`${id} ${action}: supporting paw floats ${min}`);
   }
   assert.ok(new THREE.Box3().setFromObject(m.root,true).min.y>=.12,id+': folded limb or torso penetrates floor');
  }
 }
});
test('bear gait articulates four limbs with alternating support and planted paw surfaces',async()=>{
 const s=archive.species.find(s=>s.id==='ursus-arctos'),m=await assetModel(s),rig=m.surfaceRig.rigs[0],geometry=rig.mesh.geometry,material=rig.mesh.material,{skinIndex:si,skinWeight:sw}=geometry.attributes;
 assert.equal(rig.bones.length,15);const pawSamples=[5,8,11,14].map(bone=>{const samples=[];for(let i=0;i<si.count;i++){let weight=0;for(const k of ['getX','getY','getZ','getW'])if(si[k](i)===bone)weight+=sw[k](i);if(weight>.8)samples.push(i);}return samples;});assert.ok(pawSamples.every(s=>s.length>10));
 const trajectories=[[],[],[],[]];for(const t of [0,.25,.5,.75,1,1.25,1.5,1.75]){animateAsset(m,'walk',t);rig.mesh.skeleton.update();assert.equal(rig.mesh.geometry,geometry);assert.equal(rig.mesh.material,material);let support=0;for(const [j,indices]of pawSamples.entries()){const min=Math.min(...indices.map(i=>rig.mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(rig.mesh.matrixWorld).y));assert.ok(min>=.11,'bear paw crosses floor');if(min<.155)support++;trajectories[j].push(rig.bones[[5,8,11,14][j]].getWorldPosition(new THREE.Vector3()).x);}assert.ok(support>=2,'walking bear has no supported stance');}
 assert.ok(trajectories.every(values=>Math.max(...values)-Math.min(...values)>.15),'bear limb is static');assert.notDeepEqual(trajectories[0],trajectories[1],'opposite forelimbs move in lockstep');
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

test('chimpanzee shares one articulated skeleton and preserves curled-digit and foot support through gait',async()=>{
 const s=archive.species.find(s=>s.id==='pan-troglodytes'),m=await assetModel(s),rig=m.surfaceRig,bones=rig.rigs[0].bones;assert.equal(bones.length,22);assert.ok(rig.rigs.every(r=>r.bones===bones));assert.ok(rig.rigs.some(r=>r.fur));const surfaces=[];m.root.traverse(o=>{if(o.isSkinnedMesh){surfaces.push([o,o.geometry,o.material]);const {skinIndex:si,skinWeight:sw}=o.geometry.attributes;for(let i=0;i<si.count;i++){const ix=[si.getX(i),si.getY(i),si.getZ(i),si.getW(i)],w=[sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)];assert.ok(ix.every(n=>n>=0&&n<22));assert.ok(Math.abs(w.reduce((a,b)=>a+b,0)-1)<1e-5);}}});
 animateAsset(m,'observe',0);const lengths=bones.slice(1).map(b=>b.position.length()),xs=rig.contacts.map(()=>[]);for(const t of [0,.25,.50,.75,1,1.25,1.50,1.75]){animateAsset(m,'walk',t);let supported=0;for(const [j,foot]of rig.contacts.entries()){const min=Math.min(...foot.samples.map(i=>rig.contactMesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(rig.contactMesh.matrixWorld).y));assert.ok(min>=.115,'chimp hand/foot penetrates floor');if(min<.155)supported++;xs[j].push(bones[foot.upper+2].getWorldPosition(new THREE.Vector3()).x);}assert.ok(supported>=2,'chimp stance lacks two limb supports');for(const [i,b]of bones.slice(1).entries())assert.ok(Math.abs(b.position.length()-lengths[i])<1e-6);for(const [o,g,mat]of surfaces){assert.equal(o.geometry,g);assert.equal(o.material,mat);}}
 assert.ok(xs.every(v=>Math.max(...v)-Math.min(...v)>.12),'a chimp limb is static');assert.notDeepEqual(xs[0],xs[1]);assert.ok(bones[8].rotation.z>1,'chimp distal digits do not curl');animateAsset(m,'rest',0);assert.ok(new THREE.Box3().setFromObject(m.root,true).min.y>=.115,'seated chimp penetrates floor');const seat=Math.min(...rig.seatSamples.map(([mesh,i])=>mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).y));assert.ok(seat>=.115&&seat<.15,'resting chimp pelvis floats above support');assert.equal(s.review.animationValidated,false);
});
test('kangaroo retains its standing surface through paired hopping and tail-assisted slow travel',async()=>{
 const s=archive.species.find(s=>s.id==='osphranter-rufus'),m=await assetModel(s),r=m.surfaceRig.rigs[0],geometry=r.mesh.geometry,material=r.mesh.material;assert.equal(r.bones.length,27);assert.equal(m.asset.uid,'580f30f0910948d8bd757109379f52d6');assert.ok(r.feet.every(f=>f.samples.length>10)&&r.tailSamples.length>10);let highest=0;
 for(const t of [0,.20,.40,.60,.80,1,1.20]){animateAsset(m,'jump',t);assert.equal(r.mesh.geometry,geometry);assert.equal(r.mesh.material,material);const left=r.bones[21].getWorldPosition(new THREE.Vector3()),right=r.bones[25].getWorldPosition(new THREE.Vector3());assert.ok(Math.abs(left.x-right.x)<1e-5&&Math.abs(left.y-right.y)<.04,'hindlimbs do not hop together (source soles have unequal heights)');const min=Math.min(...r.feet.filter(f=>!f.front).flatMap(f=>f.samples.map(i=>r.mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(r.mesh.matrixWorld).y)));assert.ok(min>=.115,'hopping foot penetrates floor');highest=Math.max(highest,min);}
 assert.ok(highest>.35,'kangaroo has no airborne phase');for(const t of [0,.3,.6,.9,1.2,1.5,1.8,2.1]){animateAsset(m,'walk',t);const phase=(t*.40)%1;for(const f of r.feet){const min=Math.min(...f.samples.map(i=>r.mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(r.mesh.matrixWorld).y));assert.ok(min>=.115,'slow-travel limb penetrates floor');}if(phase>.16&&phase<.53){const tail=Math.min(...r.tailSamples.map(i=>r.mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(r.mesh.matrixWorld).y));assert.ok(tail>=.115&&tail<.16,'tail fails support phase during hindlimb swing');}}
 assert.ok(s.behaviors.find(b=>b.id==='walk').sourceIds.includes('osphranter-rufus-tail-2014'));assert.equal(s.review.animationValidated,false);
});
