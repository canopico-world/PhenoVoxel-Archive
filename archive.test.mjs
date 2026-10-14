import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareAsset,animateAsset} from './asset-motion.js';
import { readFile } from 'node:fs/promises';
import { buildSpecimen, animateSpecimen, modelKinds } from './models.js';
import {fitSpecimenCamera,renderedBounds} from './camera-fit.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
const archive=JSON.parse(await readFile(new URL('./species.json',import.meta.url),'utf8'));
const media=JSON.parse(await readFile(new URL('./media.json',import.meta.url),'utf8'));
const atlas=JSON.parse(await readFile(new URL('./atlas.json',import.meta.url),'utf8'));
test('zebrafish retains its striped body and seven articulated fins across all actions',()=>{
 const s=archive.species.find(s=>s.id==='danio-rerio'),m=buildSpecimen(s),r=m.zebrafishRig;
 assert.equal(r.bones.length,12);assert.equal(r.fins.length,7);const surfaces=[];
 m.root.traverse(o=>{if(!o.isSkinnedMesh)return;surfaces.push([o,o.geometry,o.material]);const{position:p,skinIndex:ix,skinWeight:w,color:c}=o.geometry.attributes;assert.equal(c.count,p.count);for(let i=0;i<p.count;i++){const a=[ix.getX(i),ix.getY(i),ix.getZ(i),ix.getW(i)],weights=[w.getX(i),w.getY(i),w.getZ(i),w.getW(i)];assert.ok(a.every(v=>v>=0&&v<12));assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-6);}});
 const at=(mesh,i)=>mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld),body=r.body,tail=r.fins[0],tip=tail.geometry.attributes.position.count-1,neutral=at(tail,tip),head=at(body,0),limb=r.fins[3],finNeutral=at(limb,limb.geometry.attributes.position.count-10);let tailMotion=0,finMotion=0;
 for(const action of ['swim','forage','escape'])for(const t of [.35,1.1,2.3]){animateSpecimen(m,action,t);tailMotion=Math.max(tailMotion,at(tail,tip).distanceTo(neutral));finMotion=Math.max(finMotion,at(limb,limb.geometry.attributes.position.count-10).distanceTo(finNeutral));for(const[o,g,mat]of surfaces){assert.equal(o.geometry,g);assert.equal(o.material,mat);for(let i=0;i<g.attributes.position.count;i+=13)assert.ok(at(o,i).toArray().every(Number.isFinite));}if(action!=='forage')assert.ok(at(body,0).distanceTo(head)<1e-6,'head translates while axial wave should remain in place');}
 assert.ok(tailMotion>.03&&finMotion>.005,'tail or paired fins stay rigid');animateSpecimen(m,'observe',0);assert.ok(at(tail,tip).distanceTo(neutral)<1e-6);
 // Check longitudinal stripe stability over the trunk, where the old coarse
 // circular sampling produced large triangle-shaped breaks in each band.
 const p=body.geometry.attributes.position,c=body.geometry.attributes.color;for(const y of [1.20,1.275,1.35,1.425,1.50]){let n=0;for(let i=0;i<p.count;i++){if(p.getX(i)>-.6&&p.getX(i)<.5&&p.getZ(i)>.03&&Math.abs(p.getY(i)-y)<.004){assert.ok(c.getX(i)<.12,'longitudinal dark band breaks across trunk');n++;}}assert.ok(n>20);}
 assert.equal(s.review.animationValidated,false);
});
test('camera fits posed organisms above controls across narrow, wide and anatomical views',()=>{
 const boxes=[new THREE.Box3(new THREE.Vector3(-1.4,.13,-.8),new THREE.Vector3(2.2,1.2,.7)),new THREE.Box3(new THREE.Vector3(-1,.13,-1),new THREE.Vector3(1,3.88,1)),new THREE.Box3(new THREE.Vector3(-2,.3,-2),new THREE.Vector3(2,1.2,2))];
 for(const box of boxes)for(const aspect of [.45,.67,1.1,1.8])for(const direction of [[3.5,1.5,6],[7.4,.6,0],[0,.6,7.4],[0,8,.01]]){const camera=new THREE.PerspectiveCamera(38,aspect,.01,100),controls={target:new THREE.Vector3(),update(){}};camera.position.set(...direction);fitSpecimenCamera(camera,controls,box,{bottomLimit:-.28});camera.updateMatrixWorld(true);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=.861,'organism is clipped horizontally');assert.ok(p.y<=.861&&p.y>=-.281,'organism is clipped or behind controls');assert.ok(p.z>-1&&p.z<1);}}
 const root=new THREE.Group(),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,100,100,100],3));g.setIndex([0,1,2]);root.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial()));const hidden=new THREE.Mesh(new THREE.BoxGeometry(30,30,30),new THREE.MeshBasicMaterial());hidden.visible=false;root.add(hidden);assert.deepEqual(renderedBounds(root).max.toArray(),[1,1,0],'invisible or unreferenced geometry affects framing');
});
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
test('behavior rendering metadata respects the published schema contract',()=>{
 for(const s of archive.species)for(const b of s.behaviors)if(b.rendering){assert.ok(['available','partial','unavailable'].includes(b.rendering.status),s.id+': invalid rendering status');assert.equal(typeof b.rendering.reason,'string',s.id+': rendering reason required by schema');assert.ok(b.rendering.reason.length);}
});
test('continuous axolotl keeps its surfaces, typical digits and support through distinct aquatic modes',()=>{
 const s=archive.species.find(s=>s.id==='ambystoma-mexicanum'),m=buildSpecimen(s),rig=m.axolotlRig,surfaces=[];m.root.traverse(o=>{if(o.isMesh)surfaces.push([o,o.geometry,o.material]);});assert.equal(rig.skeleton.bones.length,21);assert.deepEqual(rig.limbs.map(l=>l.toes.length),[4,4,5,5]);
 for(const[o,g]of surfaces){assert.strictEqual(o.skeleton,rig.skeleton);const p=g.attributes.position,w=g.attributes.skinWeight;for(let i=0;i<p.count;i++){assert.ok(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<1e-5);for(const k of ['getX','getY','getZ','getW'])assert.ok(g.attributes.skinIndex[k](i)<21);}}
 const body=rig.body,p=body.geometry.attributes.position;let tail=0;for(let i=0;i<p.count;i++)if(p.getX(i)<p.getX(tail))tail=i;animateSpecimen(m,'observe',0);const at=i=>body.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(body.matrixWorld),neutral=at(tail),lengths=rig.limbs.flatMap(l=>l.chain.slice(1).map(b=>[b,b.getWorldPosition(new THREE.Vector3()).distanceTo(b.parent.getWorldPosition(new THREE.Vector3()))]));
 for(const t of [.1,.5,1.1,1.7,2.2,2.6]){animateSpecimen(m,'walk',t);for(const[i,l]of rig.limbs.entries()){let min=Infinity;for(const[mesh,index]of l.samples)min=Math.min(min,mesh.getVertexPosition(index,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).y);assert.ok(min>.12,'axolotl distal limb penetrates floor');if((t*.36+[0,.5,.75,.25][i])%1<=.78)assert.ok(min<.15,'axolotl supporting distal limb floats');}for(const[b,length]of lengths)assert.ok(Math.abs(b.getWorldPosition(new THREE.Vector3()).distanceTo(b.parent.getWorldPosition(new THREE.Vector3()))-length)<1e-5,'axolotl segment length changed');}
 animateSpecimen(m,'swim',.3);const first=at(tail);for(const l of rig.limbs)assert.ok(l.chain[2].getWorldPosition(new THREE.Vector3()).x<l.chain[0].getWorldPosition(new THREE.Vector3()).x-.45,'swimming limb is not directed rearward');animateSpecimen(m,'swim',1.3);assert.ok(Math.abs(at(tail).z-first.z)>.035,'axolotl tail lacks lateral propulsion illustration');
 animateSpecimen(m,'forage',.4);assert.ok(new THREE.Box3().setFromObject(m.root,true).min.y>.12);animateSpecimen(m,'observe',0);assert.ok(at(tail).distanceTo(neutral)<1e-6,'axolotl does not restore neutral surface');for(const[o,g,mat]of surfaces){assert.strictEqual(o.geometry,g);assert.strictEqual(o.material,mat);}assert.equal(s.visual.viewerRig.animationValidated,false);assert.ok(s.behaviors.find(b=>b.id==='swim').sourceIds.includes('ambystoma-mexicanum-swimming-1997'));
});
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
 assert.equal(Object.keys(assets.models).length,21);
 for(const [id,a] of Object.entries(assets.models)){assert.ok(a.author);assert.equal(a.license,'CC BY 4.0');assert.equal(new URL(a.download).protocol,'https:');assert.match(a.delivery,/Bundled (?:optimized )?GLB/);assert.deepEqual(archive.species.find(s=>s.id===id).modelAsset,a);
  const bytes=await readFile(new URL('./'+a.localFile,import.meta.url));assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);const j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));assert.ok(j.meshes.length);assert.ok(j.materials?.length,id+': missing surface materials');if(['canis-lupus','panthera-tigris'].includes(id))assert.ok(j.images?.length,id+': no texture');assert.ok((j.images||[]).every(i=>i.bufferView!==undefined),id+': external texture dependency');assert.match(j.asset.extras.license,/CC.BY.4.0|CC BY 4.0|creativecommons.org\/licenses\/by\/4.0\//);
 }
});
test('textured fox retains its source skeleton through supported gait, search and creator repose',async()=>{
 const s=archive.species.find(s=>s.id==='vulpes-vulpes'),m=await assetModel(s),surfaces=[];m.root.traverse(o=>{if(o.isMesh)surfaces.push([o,o.geometry,o.material]);});
 assert.equal(m.foxRig,true);assert.equal(m.limbs.length,4);assert.equal(surfaces.length,2);assert.equal(surfaces.find(([o])=>o.isSkinnedMesh)[0].skeleton.bones.length,40);
 animateAsset(m,'observe',0);m.root.updateMatrixWorld(true);const standing=new THREE.Box3().setFromObject(m.root,true),lengths=m.limbs.flatMap(l=>l.chain.slice(1).map(b=>[b,b.getWorldPosition(new THREE.Vector3()).distanceTo(b.parent.getWorldPosition(new THREE.Vector3()))]));const foot=m.limbs[0].wrist.getWorldPosition(new THREE.Vector3());
 for(const t of [.1,.4,.9,1.3,1.8]){animateAsset(m,'walk',t);for(const[i,l]of m.limbs.entries()){const u=(t*.65+[0,.75,.5,.25][i])%1;let min=Infinity;for(const[mesh,index]of m.pawSamples[i])min=Math.min(min,mesh.getVertexPosition(index,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).y);assert.ok(min>.118,`fox walking paw penetrates floor: ${min}`);if(u<.76)assert.ok(min<.15,`fox supporting paw floats: ${min}`);}for(const[b,length]of lengths)assert.ok(Math.abs(b.getWorldPosition(new THREE.Vector3()).distanceTo(b.parent.getWorldPosition(new THREE.Vector3()))-length)<1e-5,'fox segment length changed');}
 assert.ok(m.limbs[0].wrist.getWorldPosition(new THREE.Vector3()).distanceTo(foot)>.025,'fox gait is static');
 animateAsset(m,'forage',.3);const head=m.head.getWorldPosition(new THREE.Vector3());animateAsset(m,'observe',0);assert.ok(m.head.getWorldPosition(new THREE.Vector3()).distanceTo(head)>.1,'fox head search is static');
 animateAsset(m,'rest',0);const repose=new THREE.Box3().setFromObject(m.root,true);assert.ok(repose.getSize(new THREE.Vector3()).y<standing.getSize(new THREE.Vector3()).y*.7);assert.ok(Math.abs(repose.min.y-.13)<.005);
 for(const[o,g,mat]of surfaces){assert.strictEqual(o.geometry,g);assert.strictEqual(o.material,mat);}animateAsset(m,'observe',0);assert.ok(m.limbs[0].wrist.getWorldPosition(new THREE.Vector3()).distanceTo(foot)<1e-5,'fox neutral pose did not reset');assert.equal(s.behaviors.find(b=>b.id==='jump').rendering.status,'unavailable');assert.equal(s.review.animationValidated,false);
});
test('wolf tiger and fox landmarks follow original posed surfaces and claw morphs',async()=>{
 for(const id of ['canis-lupus','panthera-tigris','vulpes-vulpes']){
  const s=archive.species.find(s=>s.id===id),m=await assetModel(s);assert.equal(m.featureBindings.length,3);assert.ok(m.featureBindings.every(b=>b.mesh&&b.indices.length));const states=[];
  for(const action of ['observe','walk','forage','rest']){animateAsset(m,action,.6);updateSpecimenLandmarks(m);states.push(m.features.map(p=>p.clone()));for(const[i,b]of m.featureBindings.entries()){const world=new THREE.Vector3();for(const n of b.indices)world.add(b.mesh.getVertexPosition(n,new THREE.Vector3()).applyMatrix4(b.mesh.matrixWorld));world.divideScalar(b.indices.length);assert.ok(m.root.localToWorld(m.features[i].clone()).distanceTo(world)<1e-6,'label detaches from posed source surface');}}
  assert.ok(states[0].some((p,i)=>p.distanceTo(states[3][i])>.1),'resting annotations retain standing coordinates');
 }
 const pouch=archive.species.find(s=>s.id==='osphranter-rufus').anatomy[2];assert.equal(pouch.modelVisibility,'not-modeled');
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
test('tiger keeps its source claws while quiet poses fold them dorsally and walking retains paw support',async()=>{
 const m=await assetModel(archive.species.find(s=>s.id==='panthera-tigris')),f=m.tigerClaws,mesh=f.mesh,g=mesh.geometry,material=mesh.material;assert.equal(f.groups.length,16);animateAsset(m,'observe',0);assert.equal(mesh.morphTargetInfluences[0],1);const at=i=>mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld),mean=group=>group.reduce((sum,i)=>sum.add(at(i)),new THREE.Vector3()).divideScalar(group.length),quiet=f.groups.map(mean);mesh.morphTargetInfluences[0]=0;const exposed=f.groups.map(mean);for(let i=0;i<quiet.length;i++){assert.ok(quiet[i].x<exposed[i].x-.005,'claw does not fold back');assert.ok(quiet[i].y>exposed[i].y+.01,'claw does not fold dorsally');}
 for(const mode of ['walk','rest','sit','sleep']){animateAsset(m,mode,.5);assert.equal(mesh.morphTargetInfluences[0],1);assert.equal(mesh.geometry,g);assert.equal(mesh.material,material);}animateAsset(m,'run',.5);assert.equal(mesh.morphTargetInfluences[0],0);assert.ok(m.sourceClip,'creator run cycle is missing');
});
test('tiger eyelid covers track retained eyeballs and sleep keeps supported limb lengths',async()=>{
 const m=await assetModel(archive.species.find(s=>s.id==='panthera-tigris')),source=[];m.root.traverse(o=>{if(o.isSkinnedMesh)source.push(o);});const original=source.map(o=>[o,o.geometry,o.material]);assert.equal(m.tigerEyelids.length,4);const attachments=m.tigerEyelids.map(o=>[o,o.geometry,o.material]);animateAsset(m,'rest',0);const rest=m.body.getWorldQuaternion(new THREE.Quaternion());assert.ok(m.tigerEyelids.every(o=>!o.visible));animateAsset(m,'sleep',0);assert.ok(m.tigerEyelids.every(o=>o.visible));assert.ok(rest.angleTo(m.body.getWorldQuaternion(new THREE.Quaternion()))>.25,'sleep has no relaxed torso lean');
 for(const [o,g,mat]of [...original,...attachments]){assert.equal(o.geometry,g);assert.equal(o.material,mat);}const mesh=source[0];for(const [side,anchor]of m.tigerEyeCentroids.entries()){const points=m.tigerEyeIndices[side].map(i=>mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));assert.ok(points.length>15);const center=points.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(points.length),error=center.distanceTo(m.head.localToWorld(anchor.clone()));assert.ok(error<1e-5,`source eye and head attachment diverge: ${error}`);const lidCenter=new THREE.Box3().setFromObject(m.tigerEyelids[side*2],true).getCenter(new THREE.Vector3());assert.ok(lidCenter.distanceTo(center)<.055,'lid surface is outside the source orbital region');}
 assert.ok(new THREE.Box3().setFromObject(m.root,true).min.y>=.12);animateAsset(m,'walk',.55);assert.ok(m.tigerEyelids.every(o=>!o.visible));
});
test('wolf quiet expression preserves teeth, texture coordinates and stable jaw playback',async()=>{
 const m=await assetModel(archive.species.find(s=>s.id==='canis-lupus')),f=m.wolfFace,mesh=f.mesh,g=mesh.geometry,delta=g.morphAttributes.position[0],si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
 assert.ok(f.affected.length>10);assert.equal(delta.count,g.attributes.position.count);assert.equal(g.attributes.uv.count,delta.count);for(let i=0;i<delta.count;i++){assert.ok(Number.isFinite(delta.getY(i)));let total=0;for(const k of ['getX','getY','getZ','getW']){assert.ok(si[k](i)<mesh.skeleton.bones.length);total+=sw[k](i);}assert.ok(Math.abs(total-1)<1e-5);}
 for(const mode of ['observe','walk','rest','sleep']){animateAsset(m,mode,.55);assert.equal(mesh.morphTargetInfluences[0],1);const jaw=f.jaw.quaternion.clone();for(let i=0;i<8;i++)animateAsset(m,mode,.55);assert.ok(jaw.clone().normalize().angleTo(f.jaw.quaternion.clone().normalize())<1e-6,`${mode}: jaw changes across repeated frames ${jaw.toArray()} -> ${f.jaw.quaternion.toArray()}`);assert.equal(mesh.geometry,g);}
 animateAsset(m,'forage',.55);assert.equal(mesh.morphTargetInfluences[0],0,'source feeding mouth is forced closed');assert.ok(m.sourceClip,'feeding creator clip was lost');
});
test('perched owl retains textured surfaces and mount while its wings, head and feet articulate',async()=>{
 const m=await assetModel(archive.species.find(s=>s.id==='tyto-alba')),r=m.surfaceRig.rigs[0],{mesh,bones}=r,g=mesh.geometry,material=mesh.material,p=g.attributes.position,sw=g.attributes.skinWeight,si=g.attributes.skinIndex;
 assert.equal(bones.length,16);const regions={wing:[],head:[],feet:[],mount:[]};for(let i=0;i<p.count;i++){let wing=0,head=0,feet=0;for(const k of ['getX','getY','getZ','getW']){const b=si[k](i),w=sw[k](i);if(b>=3&&b<=8)wing+=w;if(b===1||b===2)head+=w;if(b>=10)feet+=w;}if(wing>.6)regions.wing.push(i);if(head>.6)regions.head.push(i);if(feet>.6)regions.feet.push(i);if(p.getY(i)<.65)regions.mount.push(i);}
 assert.ok(Object.values(regions).every(v=>v.length>8));animateAsset(m,'observe',0);const at=i=>mesh.getVertexPosition(i,new THREE.Vector3()),neutral=new Map(Object.values(regions).flat().map(i=>[i,at(i)]));for(const [mode,region]of [['stretch','wing'],['forage','head'],['shift','feet']]){let movement=0;for(const t of [1.5,2.8,3.5,5.2]){animateAsset(m,mode,t);assert.equal(mesh.geometry,g);assert.equal(mesh.material,material);for(const i of regions[region])movement=Math.max(movement,at(i).distanceTo(neutral.get(i)));for(const i of regions.mount)assert.ok(at(i).distanceTo(neutral.get(i))<1e-6,'mount deforms with living anatomy');}assert.ok(movement>.003,mode+': target tissue remains static');}
 animateAsset(m,'observe',0);for(const [i,v]of neutral)assert.ok(at(i).distanceTo(v)<1e-5);assert.equal(archive.species.find(s=>s.id==='tyto-alba').behaviors.find(b=>b.id==='fly').rendering.status,'unavailable');
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
