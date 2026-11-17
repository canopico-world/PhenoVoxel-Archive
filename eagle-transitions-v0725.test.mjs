import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {prepareAsset,animateAsset} from './asset-motion.js';
import {renderedBounds} from './camera-fit.js';
import {unifiedEagle} from './eagle-source-v0725.js';
import {EAGLE_SIDES,TAIL,SUPPORT_Y,FOOT_ANCHOR_X,eagleSkeleton} from './eagle-rig-v0725.js';
import {unifiedEaglePose,TAKEOFF_RELEASE,LANDING_CONTACT,TRANSITION_DURATION} from './eagle-motion-v0725.js';
import revision from './eagle-data-v0725.json' with {type:'json'};

globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:128,height:128,close(){}});
const baseline=JSON.parse(readFileSync('species.json')).species.find(s=>s.id===revision.id);
const eagle=unifiedEagle(baseline), asset=eagle.modelAsset;
const raw=readFileSync(asset.localFile);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const original=readFileSync(asset.sourceFile);
const vector=()=>new T.Vector3();
const world=(mesh,index,p=vector())=>mesh.getVertexPosition(index,p).applyMatrix4(mesh.matrixWorld);
async function model() {
  const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
  return prepareAsset(gltf,eagle,asset);
}
function sole(mesh,sign) {
  const p=vector();
  const positions=mesh.geometry.getAttribute('position');
  let height=Infinity,index=-1;
  for (let i=0;i<positions.count;i++) {
    if (Math.sign(positions.getZ(i))!==sign) continue;
    world(mesh,i,p);
    if (p.y<height) { height=p.y; index=i; }
  }
  return {height,index,point:world(mesh,index)};
}

test('the release ships one credited adult body and one skeleton across every pose',async()=>{
  assert.equal(raw.length,asset.bytes);
  assert.equal(digest(raw),asset.sha256);
  assert.equal(digest(original),asset.derivedFromSha256);
  const json=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString('utf8'));
  assert.equal(json.skins.length,1);
  assert.equal(json.skins[0].joints.length,eagleSkeleton().length);
  assert(!json.nodes.some(n=>/Rebuilt standing|Flight scuted feet|Flight curved talons/.test(n.name||'')));
  assert.equal(json.extras.groundIncluded,false);
  assert.equal(asset.license,'CC BY 4.0');
  const keys=json.meshes.find(m=>m.name==='Revised bird body').extras.targetNames;
  assert.deepEqual(keys,['Tail fan','Folded feather overlap']);
  const offset=20+raw.readUInt32LE(12)+8;
  for (const [index,img] of json.images.entries()) {
    const view=json.bufferViews[img.bufferView];
    const texture=raw.subarray(offset+(view.byteOffset||0),offset+(view.byteOffset||0)+view.byteLength);
    assert(asset.maps.map(m=>m.sha256).includes(digest(texture)),String(index));
  }

  const m=await model(), r=m.birdRevision;
  assert(r.unifiedEagle&&r.rebuilt);
  const geometries=r.parts.map(part=>part.geometry);
  const materials=r.parts.map(part=>part.material);
  const uv=Array.from(r.body.geometry.attributes.uv.array);
  for (const [action,time] of [['stand',0],['takeoff',.68],['takeoff',1.2],['fly',1.09],['glide',3],['landing',2.16],['landing',4.4]]) {
    animateAsset(m,action,time);
    assert(r.parts.every((mesh,i)=>mesh.visible && mesh.geometry===geometries[i] && mesh.material===materials[i] &&
      mesh.skeleton.bones.every((bone,j)=>bone===r.bones[j])));
  }
  assert.deepEqual(Array.from(r.body.geometry.attributes.uv.array),uv);
});

test('takeoff crouches with fixed soles, releases once, and retracts the feet during the climb',async()=>{
  const m=await model(), r=m.birdRevision;
  animateAsset(m,'stand',0);
  const contact=EAGLE_SIDES.map(({sign})=>sole(r.feet,sign));
  assert(r.ground.visible);
  for (const t of [0,.3,.68,.84,.96,TAKEOFF_RELEASE]) {
    animateAsset(m,'takeoff',t);
    for(const [i,s] of EAGLE_SIDES.entries()) {
      assert(Math.abs(sole(r.feet,s.sign).height-SUPPORT_Y)<.0002,t);
      assert(world(r.feet,contact[i].index).distanceTo(contact[i].point)<.0003,t);
      assert(sole(r.talons,s.sign).height>SUPPORT_Y,t);
    }
  }
  const hipGap=()=>{
    const side=EAGLE_SIDES[0];
    return r.bones[side.hip].getWorldPosition(vector()).distanceTo(r.bones[side.ankle].getWorldPosition(vector()));
  };
  const extended=hipGap();
  animateAsset(m,'takeoff',.68);
  assert(extended-hipGap()>.052);
  const base=r.ground.position.clone();
  for(const [time,minimum] of [[1.06,.012],[1.2,.095],[2.05,.69]]) {
    animateAsset(m,'takeoff',time);
    for (const {sign} of EAGLE_SIDES) assert(sole(r.feet,sign).height>minimum,time);
    assert.equal(r.ground.position.distanceTo(base),0);
  }
  animateAsset(m,'takeoff',2.05);
  for(const s of EAGLE_SIDES) assert(Math.abs(r.bones[s.toes[2]].rotation.z)>.75);
  assert.equal(unifiedEaglePose('takeoff',TAKEOFF_RELEASE).grounded,true);
  assert.equal(unifiedEaglePose('takeoff',TAKEOFF_RELEASE+.02).grounded,false);
});

test('landing flares, places the feet before folding the wings, and settles to the identical stance',async()=>{
  const m=await model(), r=m.birdRevision;
  const sample=t=>unifiedEaglePose('landing',t);
  assert(sample(1.80).pitch>sample(.60).pitch+.42);
  assert(sample(1.80).tailFan>.65);
  assert(sample(1.80).footMix>.97);
  assert(1.80<LANDING_CONTACT);
  animateAsset(m,'landing',2.10);
  assert(sole(r.feet,-1).height>.017);
  animateAsset(m,'landing',LANDING_CONTACT);
  const left=EAGLE_SIDES[0];
  assert(Math.abs(r.bones[left.ankle].getWorldPosition(vector()).x-FOOT_ANCHOR_X)<.0002);
  assert.equal(r.body.morphTargetInfluences[1],0);
  const contact=EAGLE_SIDES.map(({sign})=>sole(r.feet,sign));
  for (const t of [LANDING_CONTACT,2.27,2.4,2.58,2.9,3.12,3.5,4.4]) {
    animateAsset(m,'landing',t);
    for (const [i,s] of EAGLE_SIDES.entries()) {
      assert(Math.abs(sole(r.feet,s.sign).height-SUPPORT_Y)<.0002,t);
      assert(world(r.feet,contact[i].index).distanceTo(contact[i].point)<.0003,t);
    }
  }
  const endpoints=r.bones.map(b=>b.getWorldPosition(vector()));
  const folded=renderedBounds(m.root);
  assert.equal(r.body.morphTargetInfluences[1],1);
  animateAsset(m,'stand',0);
  assert(r.bones.every((b,i)=>b.getWorldPosition(vector()).distanceTo(endpoints[i])<1e-8));
  assert(renderedBounds(m.root).equals(folded));
  animateAsset(m,'landing',28);
  assert.equal(m.movementStudy.time,TRANSITION_DURATION);
  assert(m.movementStudy.complete);
  animateAsset(m,'landing',0);
  assert.equal(m.movementStudy.time,0);
  assert(!m.movementStudy.complete);
});

test('sampled transitions remain above the contact plane and fit their camera envelopes',async()=>{
  const m=await model();
  for (const action of ['takeoff','landing']) {
    for (let i=0;i<=110;i++) {
      const t=i/25;
      animateAsset(m,action,t);
      const bounds=renderedBounds(m.root);
      assert(bounds.min.y>SUPPORT_Y-.0005,action+' floor at '+t);
      assert(m.motionBounds[action].containsBox(bounds),action+' camera at '+t);
    }
  }
  animateAsset(m,'stand',0);
  const closed=renderedBounds(m.root).getSize(vector()).z;
  animateAsset(m,'glide',0);
  assert(renderedBounds(m.root).getSize(vector()).z>closed*4.7);
  assert(!m.birdRevision.ground.visible);
});

test('the live data labels the reference evidence and the authored kinematics',()=>{
  const ids=new Set(eagle.sources.map(s=>s.id));
  for(const action of ['takeoff','landing']) {
    const study=eagle.behaviors.find(b=>b.id===action);
    assert.equal(study.studyDuration,TRANSITION_DURATION);
    assert(study.studyStages.every(phase=>phase.time<=TRANSITION_DURATION));
    assert(study.sourceIds.every(id=>ids.has(id)));
    assert.equal(study.rendering.status,'partial');
    assert.match(study.rendering.reason,/illustrative/i);
  }
  assert.equal(asset.viewerRig.animationValidated,false);
  assert.equal(eagle.behaviors.find(b=>b.id==='forage').rendering.status,'unavailable');
});
