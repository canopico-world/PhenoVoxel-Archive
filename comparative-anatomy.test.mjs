import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import catalog from './mouse-anatomy-catalog.json' with {type:'json'};
const mouseStructures=catalog.structures;
import {mouseMuseumExterior} from './mouse-museum-coat.js';
import {animateMouse,applyMouseVisibility,tailOffset} from './mouse-anatomy.js';
import {spectralEfficiency,arrivalDifference} from './human-sensory-study.js';
import human from './anatomy-data-v0728.json' with {type:'json'};
import {loadHumanAnatomy,loadAnatomyLayer,animateAnatomy,changeAnatomy} from './anatomy-model-v0728.js';
import * as T from 'three';

test('every mouse source component maps to a distinct selectable, nonempty mesh',async()=>{
  await MeshoptDecoder.ready;
  const doc=await new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({'meshopt.decoder':MeshoptDecoder}).read('mouse-atlas-v0729.glb');
  const nodes=doc.getRoot().listNodes(),ids=nodes.map(n=>n.getExtras().structureId);
  assert.equal(new Set(ids).size,434);assert.deepEqual(new Set(ids),new Set(mouseStructures.map(s=>s.id)));
  for(const n of nodes)assert.ok(n.getMesh().listPrimitives()[0].getIndices().getCount()>=3);
  const counts=Object.fromEntries(['source','traced','simulated'].map(k=>[k,mouseStructures.filter(r=>r.evidence===k).length]));
  assert.deepEqual(counts,{source:36,traced:152,simulated:246});
  let moving=0;
  for(const n of nodes.filter(n=>n.getExtras().structureId.includes('tail'))){
    const p=n.getMesh().listPrimitives()[0].getAttribute('POSITION'),point=[];
    if(p.getMax([])[1]>.1){p.getElement(p.getCount()-1,point);assert.ok(tailOffset(.025,.13).every(Number.isFinite));moving++;}
  }
  assert.ok(moving>=4);assert.deepEqual(tailOffset(.018,.08),[0,0]);assert.ok(Math.abs(tailOffset(.04,.14)[0])>.01);
});
test('the museum coat surrounds the registered torso and switches back to the source skin for anatomy',async()=>{
  await MeshoptDecoder.ready;
  const doc=await new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({'meshopt.decoder':MeshoptDecoder}).read('mouse-atlas-v0729.glb');
  const source=doc.getRoot().listNodes().find(n=>n.getExtras().structureId==='living:skin').getMesh().listPrimitives()[0];
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(source.getAttribute('POSITION').getArray(),3));
  geometry.setIndex(new T.BufferAttribute(source.getIndices().getArray(),1));
  geometry.computeBoundingBox();
  const skin=new T.Mesh(geometry,new T.MeshStandardMaterial()),parts=new Map([['living:skin',skin]]);
  const sourceBytes=geometry.attributes.position.array.slice();
  const exterior=mouseMuseumExterior(parts,new T.Texture()),surface=exterior.get('living:skin').children[0];
  surface.geometry.computeBoundingBox();
  const size=g=>g.boundingBox.getSize(new T.Vector3());
  assert.ok(size(surface.geometry).x>size(geometry).x*1.15);
  assert.ok(size(surface.geometry).z>size(geometry).z*1.15);
  assert.deepEqual(sourceBytes,geometry.attributes.position.array);
  const hairs=exterior.get('living:skin').children[1].geometry;
  assert.ok(hairs.index.count>100000);
  const n=hairs.attributes.normal;
  for(let i=0;i<n.count;i+=89)assert.ok(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))>.98);
  const shafts=[];
  exterior.get('living:vibrissae').traverse(o=>{if(o.userData.whiskSide)shafts.push(o)});
  assert.ok(shafts.length>=32);
  const study={root:new T.Group(),movementStudy:{},mouseAtlas:{shafts,moving:[]}};
  const anchors=shafts.map(s=>s.position.clone());
  for(const action of ['whisk','steer-whisk']){
    animateMouse(study,action,.5);
    assert.equal(study.movementStudy.duration,6);
    assert.ok(shafts.every(s=>Math.abs(s.rotation.z)>.1));
    const left=shafts.find(s=>s.userData.whiskSide<0),right=shafts.find(s=>s.userData.whiskSide>0);
    if(action==='whisk')assert.ok(Math.abs(left.rotation.z+right.rotation.z)<1e-9);
    else assert.ok(Math.abs(left.rotation.z+right.rotation.z)>.01);
    animateMouse(study,action,6);
    assert.ok(shafts.every((s,i)=>Math.abs(s.rotation.z)<1e-9&&s.position.equals(anchors[i])));
  }
  const neutral=new Set(exterior.keys());
  const m={mouseAtlas:{body:new T.Group(),parts,exterior,defaults:neutral,visible:new Set(neutral),opacity:1}};
  applyMouseVisibility(m);assert.equal(skin.visible,false);assert.equal(exterior.get('living:skin').visible,true);
  m.mouseAtlas.opacity=.13;applyMouseVisibility(m);
  assert.equal(skin.visible,true);assert.equal(exterior.get('living:skin').visible,false);
});
test('mouse neuron topology and the two deposited DNA sequences match their source records',()=>{
  const swc=readFileSync('mouse-nmo130632.swc.txt');
  assert.equal(createHash('sha256').update(swc).digest('hex'),'0dd36d6518aacd6338d16c76318d6ed0fd24419a0551417fdf639a8323c6ede5');
  const seen=new Set();let roots=0;
  for(const row of swc.toString().trim().split(/\r?\n/)){
    const [id,,x,y,z,r,parent]=row.split(/\s+/).map(Number);
    assert.ok(!seen.has(id)&&[x,y,z,r].every(Number.isFinite));if(parent===-1)roots++;else assert.ok(seen.has(parent));seen.add(id);
  }
  assert.equal(seen.size,11650);assert.equal(roots,1);
  const {records}=JSON.parse(readFileSync('molecular-records-v0729.json'));
  for(const [id,acc,len,taxon]of [['homo-sapiens','NC_012920.1',16569,9606],['mus-musculus','NC_005089.1',16299,10090]]){
    const r=records[id];assert.equal(r.accession,acc);assert.equal(r.sequence.length,len);assert.equal(r.sourceTaxonId,taxon);assert.equal(createHash('sha256').update(r.sequence).digest('hex'),r.sequenceSha256);
    for(const f of r.features)for(const seg of f.segments)assert.ok(seg.start>=1&&seg.start<=seg.end&&seg.end<=len);
  }
});
test('human sensory calculations reproduce their reference peaks and acoustic symmetry',()=>{
  assert.equal(spectralEfficiency(555)[0],1);assert.equal(spectralEfficiency(507)[1],1);
  assert.equal(arrivalDifference(0),0);assert.equal(arrivalDifference(-40),-arrivalDifference(40));assert.ok(Math.abs(arrivalDifference(90)-524.78)<.02);
});
test('human shoulder moves the arm while the lung stays fixed, including late-loaded layers and reset',async()=>{
 const prev=globalThis.fetch,loc=globalThis.location;
 globalThis.location={href:'http://localhost/'};globalThis.fetch=async url=>{const name=new URL(url).pathname.split('/').pop();const path='anatomy-assets-v0728/'+name;return existsSync(path)?new Response(readFileSync(path)):prev(url);};
 let m;
 try{
  m=await loadHumanAnatomy(human.species,async()=>new T.Group());
  const a=m.anatomyRevision;
  assert.equal(a.preset,'overview');assert.equal(a.cover.visible,true);
  assert.deepEqual([...a.batches.keys()],['surface']);assert.equal(a.batches.get('surface').mesh.visible,false);
  await changeAnatomy(m,{preset:'xray'});assert.equal(a.cover.visible,false);
  assert.equal(a.batches.get('organs').mesh.visible,true);
  await changeAnatomy(m,{section:.03});await changeAnatomy(m,{preset:'overview'});
  assert.equal(a.cover.visible,true);assert.equal(a.section,null);
  for(const batch of a.batches.values())assert.equal(batch.mesh.visible,false);
  const sample=(name,system)=>{
    const row=a.catalog.structures.find(r=>r.name===name&&r.side==='right')||a.catalog.structures.find(r=>r.name===name);
    const b=a.batches.get(system);const span=b.spans.get(row.index);
    return b.mesh.getVertexPosition(b.grouped[span.offset],new T.Vector3());
  };
  const hand=sample('Radius','skeleton'),lung=sample('Middle lobe of right lung','organs');
  animateAnatomy(m,'shoulder',3.2);assert.ok(sample('Radius','skeleton').distanceTo(hand)>.08);
  assert.ok(sample('Middle lobe of right lung','organs').distanceTo(lung)<1e-6);
  await loadAnatomyLayer(m,'connective');assert.equal(a.batches.get('connective').shoulderMode,true);
  for(const b of a.batches.values())assert.equal(b.mesh.skeleton,a.skeleton);
  animateAnatomy(m,'shoulder',8);assert.ok(sample('Radius','skeleton').distanceTo(hand)<1e-6);
  animateAnatomy(m,'elbow',3.2);assert.equal(a.batches.get('connective').shoulderMode,false);
 }finally{m?.root.userData.disposeAnatomy();globalThis.fetch=prev;if(loc===undefined)delete globalThis.location;else globalThis.location=loc;}
});
