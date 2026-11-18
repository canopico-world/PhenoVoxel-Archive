import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {Box3,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {prepareAsset,animateAsset} from './asset-motion.js';
import {renderedBounds} from './camera-fit.js';
import {EAGLE_SIDES,SUPPORT_Y} from './eagle-rig-v0725.js';
import {featheredEagle} from './eagle-source-v0726.js';
import previous from './eagle-data-v0725.json' with {type:'json'};
import release from './eagle-data-v0726.json' with {type:'json'};

globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:128,height:128,close(){}});
const original=JSON.parse(readFileSync('species.json')).species.find(s=>s.id===release.id);
const species=featheredEagle(original);
const asset=release.modelAsset;
const buffer=readFileSync(asset.localFile);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const history=readFileSync(previous.modelAsset.localFile);
const oldStanding=readFileSync(asset.standingReference.archive);
const point=()=>new Vector3();

async function read(bytes) {
  const binary=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(binary,'');
}
async function model(raw=buffer,metadata=asset) {
  return prepareAsset(await read(raw),species,metadata);
}

function feetSample(mesh,sign) {
  const p=point();
  let selected=-1, lowest=Infinity;
  const positions=mesh.geometry.attributes.position;
  for (let i=0;i<positions.count;i++) {
    if (Math.sign(positions.getZ(i))!==sign) continue;
    mesh.getVertexPosition(i,p).applyMatrix4(mesh.matrixWorld);
    if (p.y<lowest) { lowest=p.y; selected=i; }
  }
  return [selected,mesh.getVertexPosition(selected,point()).applyMatrix4(mesh.matrixWorld)];
}

function geometryProfile(mesh,{posed=false,reference=false}={}) {
  const bands=[.11,.23,.36,.49,.54];
  const rows=bands.map(()=>[Infinity,-Infinity,-Infinity]);
  const positions=mesh.geometry.attributes.position;
  const p=point();
  const sine=Math.sqrt(1-.66**2);
  for (let i=0;i<positions.count;i++) {
    if (posed) mesh.getVertexPosition(i,p).applyMatrix4(mesh.matrixWorld);
    else p.fromBufferAttribute(positions,i);
    if (reference) p.set(.88*p.x-.322,.80*p.y+.002,.86*p.z);
    const axis=.66*p.x+sine*p.y, depth=sine*p.x-.66*p.y;
    for (const [index,s] of bands.entries()) {
      if (Math.abs(axis-s)>.028) continue;
      const band=rows[index];
      band[0]=Math.min(band[0],depth);
      band[1]=Math.max(band[1],depth);
      band[2]=Math.max(band[2],Math.abs(p.z));
    }
  }
  assert(rows.flat().every(Number.isFinite));
  return rows.flat();
}

test('the shared asset preserves provenance and contains one skeleton with the same skinned pieces in every phase',async()=>{
  assert.equal(buffer.length,asset.bytes);
  assert.equal(hash(buffer),asset.sha256);
  assert.equal(hash(history),asset.derivedFromSha256);
  assert.equal(hash(oldStanding),asset.standingReference.sha256);
  assert.equal(asset.standingReference.license,'CC0 1.0');
  const json=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString('utf8'));
  assert.equal(json.skins.length,1);
  assert.equal(json.skins[0].joints.length,23);
  assert.equal(json.meshes.find(m=>m.name==='Adult tail rectrices').extras.feathers,12);
  assert.equal(json.images.length,3);
  const start=20+buffer.readUInt32LE(12)+8;
  const hashes=json.images.map(image=>{
    const v=json.bufferViews[image.bufferView];
    return hash(buffer.subarray(start+(v.byteOffset||0),start+(v.byteOffset||0)+v.byteLength));
  });
  assert.deepEqual(hashes.sort(),asset.maps.map(image=>image.sha256).sort());
  assert.notEqual(asset.maps[0].sha256,previous.modelAsset.maps[0].sha256);
  const m=await model();
  const r=m.birdRevision;
  assert(r.unifiedEagle&&r.standingScan);
  assert.equal(r.parts.length,10);
  const geometry=r.parts.map(p=>p.geometry);
  const materials=r.parts.map(p=>p.material);
  for (const [action,t] of [['stand',0],['takeoff',.68],['takeoff',1.2],['fly',1.09],['landing',2.16],['landing',3.10],['landing',4.4]]) {
    animateAsset(m,action,t);
    assert(r.parts.every((p,i)=>p.visible&&p.geometry===geometry[i]&&p.material===materials[i]&&
      p.skeleton.bones.every((bone,j)=>bone===r.bones[j])));
  }
});

test('the fitted body profile is closer to the older standing reference',async()=>{
  const reference=await read(oldStanding);
  let donor;
  reference.scene.traverse(n=>{if(n.name.startsWith('Rebuilt_standing_credited'))donor=n;});
  assert(donor);
  const fitted=await model(),before=await model(history,previous.modelAsset);
  animateAsset(fitted,'stand',0);
  animateAsset(before,'stand',0);
  const target=geometryProfile(donor,{reference:true});
  const error=profile=>Math.sqrt(profile.reduce((sum,value,i)=>sum+(value-target[i])**2,0)/profile.length);
  const updated=error(geometryProfile(fitted.birdRevision.body,{posed:true}));
  const prior=error(geometryProfile(before.birdRevision.body,{posed:true}));
  assert(updated<prior*.85,{cause:{updated,prior}});
});

test('pose trajectories stay identical and the contour correction fades as the wings open',async()=>{
  const m=await model(), prior=await model(history,previous.modelAsset);
  const r=m.birdRevision;
  for(const [action,times] of [['stand',[0]],['takeoff',[0,.5,1,1.2,4.4]],['fly',[0,1.09,1.29]],['landing',[0,1.76,2.16,3.15,4.4]]]) {
    for(const time of times) {
      animateAsset(m,action,time);
      animateAsset(prior,action,time);
      assert(r.bones.every((b,i)=>b.getWorldPosition(point()).distanceTo(prior.birdRevision.bones[i].getWorldPosition(point()))<1e-7),action+' '+time);
      assert.equal(r.rectrices.morphTargetInfluences[2],r.body.morphTargetInfluences[2]);
    }
  }
  assert.equal(r.body.morphTargetInfluences[2],1);
  const endpoint=renderedBounds(m.root);
  animateAsset(m,'stand',0);
  const held=renderedBounds(m.root);
  assert(endpoint.min.distanceTo(held.min)<1e-8&&endpoint.max.distanceTo(held.max)<1e-8);
  const packed=new Box3().setFromObject(r.rectrices,true).getSize(point()).z;
  animateAsset(m,'landing',1.9);
  assert.equal(r.body.morphTargetInfluences[2],0);
  assert(r.rectrices.morphTargetInfluences[0]>.60);
  assert(new Box3().setFromObject(r.rectrices,true).getSize(point()).z>packed*2);
});

test('both feet hold contact and the folded wing and tail clear the platform during transitions',async()=>{
  const m=await model(),r=m.birdRevision;
  animateAsset(m,'stand',0);
  const samples=EAGLE_SIDES.map(s=>feetSample(r.feet,s.sign));
  for (const action of ['takeoff','landing']) {
    for (let i=0;i<=110;i++) {
      const t=i*.04;
      animateAsset(m,action,t);
      const bounds=renderedBounds(m.root);
      assert(bounds.min.y>SUPPORT_Y-.0005,action+' floor '+t);
      assert(m.motionBounds[action].containsBox(bounds),action+' camera '+t);
      if ((action==='takeoff'&&t<=1)||(action==='landing'&&t>=2.16)) {
        for (const [index,anchor] of samples) {
          const here=r.feet.getVertexPosition(index,point()).applyMatrix4(r.feet.matrixWorld);
          assert(here.distanceTo(anchor)<.0005,action+' foot '+t);
        }
      }
    }
  }
  const id=new Set(species.sources.map(s=>s.id));
  assert(species.behaviors.every(behavior=>behavior.sourceIds.every(source=>id.has(source))));
  assert.equal(species.modelAsset.viewerRig.animationValidated,false);
});
