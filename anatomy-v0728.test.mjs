import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {anatomyBones,anatomyPose} from './anatomy-rig-v0728.js';
import {indexAnatomyMesh,filterAnatomyMesh,animateAnatomy,loadHumanAnatomy,loadAnatomyLayer,trimAnatomyExport} from './anatomy-model-v0728.js';
import human from './anatomy-data-v0728.json' with {type:'json'};
const delivery=JSON.parse(readFileSync('anatomy-delivery-v0728.json'));
const folder='anatomy-assets-v0728/';
const delivered=new Map();
async function bytesFor(file){
  if(delivered.has(file))return delivered.get(file);
  let bytes;
  if(existsSync(folder+file))bytes=readFileSync(folder+file);
  else{
    assert.match(delivery.baseUrl,/^https:\/\/raw\.githubusercontent\.com\/canopico-world\/PhenoVoxel-Archive\/[a-f0-9]{40}\//,'tests require a pinned asset commit');
    const response=await fetch(delivery.baseUrl+file);assert.equal(response.status,200,file);bytes=Buffer.from(await response.arrayBuffer());
  }
  delivered.set(file,bytes);return bytes;
}
const catalog=JSON.parse(await bytesFor(delivery.catalog.file));
const sha=b=>createHash('sha256').update(b).digest('hex');
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const parsed=new Map();
async function model(id){
  if(parsed.has(id))return parsed.get(id);
  const layer=delivery.layers.find(l=>l.id===id),b=await bytesFor(layer.file);
  const gltf=await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  let mesh;gltf.scene.traverse(o=>{if(o.isMesh)mesh=o;});
  const result={root:gltf.scene,mesh,batch:indexAnatomyMesh(mesh)};parsed.set(id,result);return result;
}
test('all delivered anatomy files match pinned bytes and hashes',async()=>{
  for(const file of [...delivery.layers,delivery.catalog]){const bytes=await bytesFor(file.file);assert.equal(bytes.length,file.bytes);assert.equal(sha(bytes),file.sha256);}
  assert.equal(catalog.structures.length,3876);assert.equal(new Set(catalog.structures.map(s=>s.index)).size,3876);
  assert.ok(catalog.structures.every(s=>s.triangles>0));
  assert.equal(catalog.structures.filter(s=>s.latin).length,2889);
  assert.equal(catalog.terminology.componentsMatched,2889);
  assert.equal(catalog.structures.find(s=>s.name==='Radius').latin,'Radius');
});
test('each rendered triangle belongs to exactly one named component',async()=>{
  for(const layer of delivery.layers){
    const {mesh,batch}=await model(layer.id);
    const source=catalog.structures.filter(r=>r.system===layer.id);
    assert.equal(batch.spans.size,source.length,layer.id);
    assert.equal(mesh.geometry.index.count/3,layer.triangles,layer.id);
    for(const record of source)assert.equal(batch.spans.get(record.index)?.count/3,record.triangles,record.name);
    const positions=mesh.geometry.attributes.position;
    for(let i=0;i<positions.array.length;i++)assert.ok(Number.isFinite(positions.array[i]));
  }
});
test('all body systems use the same physical joints and normalized weights',async()=>{
  for(const layer of delivery.layers.filter(l=>l.id!=='neuron')){
    const {mesh,root}=await model(layer.id);root.updateMatrixWorld(true);
    assert.equal(mesh.skeleton.bones.length,anatomyBones.length);
    mesh.skeleton.bones.forEach((bone,i)=>assert.ok(bone.getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(...anatomyBones[i].point))<1e-6));
    const weight=mesh.geometry.attributes.skinWeight;
    for(let i=0;i<weight.count;i++)assert.ok(Math.abs(weight.getX(i)+weight.getY(i)+weight.getZ(i)+weight.getW(i)-1)<.00005);
  }
});
test('hide, isolate and restore preserve source vertices, colors and skin data',async()=>{
  const {mesh,batch}=await model('skeleton'),attributes=mesh.geometry.attributes;
  const before=Object.fromEntries(Object.entries(attributes).map(([name,a])=>[name,sha(new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength))]));
  const [index,span]=batch.spans.entries().next().value;
  const total=batch.grouped.length/3;
  assert.equal(filterAnatomyMesh(batch,new Set([index])),total-span.count/3);
  assert.equal(filterAnatomyMesh(batch,new Set(),index),span.count/3);
  assert.equal(filterAnatomyMesh(batch,new Set()),total);
  assert.deepEqual(mesh.geometry.index.array,batch.grouped);
  for(const[name,a]of Object.entries(attributes))assert.equal(sha(new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength)),before[name]);
});
test('right forearm bones remain rigid through finite joint motion and return exactly',async()=>{
  const {root,mesh,batch}=await model('skeleton');
  const bones=mesh.skeleton.bones,rest=bones.map(b=>b.quaternion.clone());
  const m={root,anatomyRevision:{bones,rest,skeleton:mesh.skeleton},movementStudy:{}};
  const radius=catalog.structures.find(s=>s.name==='Radius'&&s.side==='right');assert.ok(radius);
  const span=batch.spans.get(radius.index);assert.ok(span);
  const vertices=[...new Set(batch.grouped.subarray(span.offset,span.offset+span.count))];
  const sample=[vertices[0],vertices[Math.floor(vertices.length/2)],vertices.at(-1)];
  const points=()=>sample.map(i=>mesh.getVertexPosition(i,new T.Vector3()));
  animateAnatomy(m,'elbow',0);const initial=points();
  for(const time of [1.6,3.2,6.1]){
    animateAnatomy(m,'elbow',time);const moved=points();
    for(let i=1;i<moved.length;i++)assert.ok(Math.abs(moved[0].distanceTo(moved[i])-initial[0].distanceTo(initial[i]))<1e-6);
    if(time===3.2)assert.ok(moved[0].distanceTo(initial[0])>.04);
  }
  animateAnatomy(m,'elbow',8);points().forEach((p,i)=>assert.ok(p.distanceTo(initial[i])<1e-7));
  for(const action of ['elbow','knee']){assert.equal(anatomyPose(action,8).complete,true);assert.ok(anatomyPose(action,8).turns.every(row=>row.slice(1).every(v=>v===0)));}
  assert.equal(anatomyPose('shoulder',3.2).duration,0);assert.equal(anatomyPose('shoulder',3.2).turns.length,0);
});
test('anatomical system assignment separates cortical regions from peripheral nerves',()=>{
  for(const s of catalog.structures.filter(s=>['cns','nerves','senses'].includes(s.system)&&/cerebell|cerebr|gyrus|sulcus|spinal cord|corticospinal/i.test(s.name)))assert.equal(s.system,'cns',s.name);
  for(const s of catalog.structures.filter(s=>/^sciatic nerve$|^femoral nerve$/i.test(s.name)))assert.equal(s.system,'nerves');
  for(const s of catalog.structures.filter(s=>/vitreous body|auditory tube|zonular fibres/i.test(s.name)))assert.equal(s.system,'senses');
});
test('microscopic morphology retains source node count and measured spatial scale',async()=>{
  const source=await bytesFor('human-neuron-source-v0728.swc');
  assert.equal(sha(source),delivery.neuronSource.sha256);
  const text=source.toString('utf8');
  const rows=text.split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>l.trim().split(/\s+/).map(Number));
  assert.equal(rows.length,7641);const soma=rows.find(r=>r[6]===-1);
  const {mesh}=await model('neuron');mesh.geometry.computeBoundingBox();
  const size=mesh.geometry.boundingBox.getSize(new T.Vector3());
  assert.ok(size.length()>100&&size.length()<4000,'source geometry is in micrometres');
  for(let k=0;k<3;k++){
    const values=rows.map(r=>r[k+2]-soma[k+2]);
    assert.ok(mesh.geometry.boundingBox.min.getComponent(k)<=Math.min(...values)+1);
    assert.ok(mesh.geometry.boundingBox.max.getComponent(k)>=Math.max(...values)-1);
  }
  assert.match(catalog.structures.find(s=>s.system==='neuron').evidence,/Separate source specimen/);
});
test('the actual loading path binds delayed systems to the same moving skeleton',async()=>{
  const previousFetch=globalThis.fetch,previousLocation=globalThis.location;
  globalThis.location={href:'http://127.0.0.1/'};
  globalThis.fetch=async url=>{const file=new URL(url).pathname.split('/').pop();return new Response(await bytesFor(file));};
  let m;
  try{
    m=await loadHumanAnatomy(human.species);await loadAnatomyLayer(m,'nerves');
    const skeleton=m.anatomyRevision.skeleton;
    assert.equal(m.anatomyRevision.batches.size,5);
    for(const batch of m.anatomyRevision.batches.values()){
      assert.equal(batch.mesh.skeleton,skeleton);
      const original=new T.Vector3().fromBufferAttribute(batch.mesh.geometry.attributes.position,0);
      assert.ok(batch.mesh.getVertexPosition(0,new T.Vector3()).distanceTo(original)<1e-6,'registration survives shared binding');
    }
    const before=skeleton.bones[12].getWorldQuaternion(new T.Quaternion());
    animateAnatomy(m,'elbow',3.2);
    assert.ok(skeleton.bones[12].getWorldQuaternion(new T.Quaternion()).angleTo(before)>1);
    animateAnatomy(m,'elbow',8);
    assert.ok(skeleton.bones[12].getWorldQuaternion(new T.Quaternion()).angleTo(before)<1e-6);
  }finally{m?.root.userData.disposeAnatomy();globalThis.fetch=previousFetch;if(previousLocation===undefined)delete globalThis.location;else globalThis.location=previousLocation;}
});
test('isolated exports omit empty systems and retain only selected source triangles',async()=>{
  const {mesh,batch}=await model('skeleton');
  const radius=catalog.structures.find(s=>s.name==='Radius'&&s.side==='right');
  filterAnatomyMesh(batch,new Set(),radius.index);
  const selected=mesh.clone();selected.geometry=mesh.geometry.clone();trimAnatomyExport(selected);
  assert.equal(selected.geometry.index.count,radius.triangles*3);
  assert.ok(selected.geometry.attributes.position.count<mesh.geometry.attributes.position.count/20,'unreferenced body vertices are omitted');
  const ids=selected.geometry.attributes._structure;
  for(const index of selected.geometry.index.array)assert.equal(ids.getX(index),radius.index);
  filterAnatomyMesh(batch,new Set(),-1);
  const empty=mesh.clone();empty.geometry=mesh.geometry.clone();trimAnatomyExport(empty);
  assert.equal(empty.visible,false,'empty systems cannot become non-indexed geometry');
  assert.equal(mesh.visible,true,'the live source remains unchanged');
  filterAnatomyMesh(batch,new Set());
});
