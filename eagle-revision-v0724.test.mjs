import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder as ViewerDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {prepareAsset,animateAsset} from './asset-motion.js';
import {renderedBounds} from './camera-fit.js';
import {baldEagleFlightPose,BALD_EAGLE_WINGBEAT_HZ} from './eagle-motion-v0724.js';
import {revisedEagle} from './eagle-source-v0724.js';
import revision from './eagle-data-v0724.json' with {type:'json'};

globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:128,height:128,close(){}});
const original=JSON.parse(readFileSync('species.json')).species.find(s=>s.id===revision.id);
const asset=revision.modelAsset;
const specimen=revisedEagle(original);
const raw=readFileSync(asset.localFile);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function model(){
  const array=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);
  const gltf=await new GLTFLoader().setMeshoptDecoder(ViewerDecoder).parseAsync(array,'');
  return prepareAsset(gltf,specimen,asset);
}

function connectedPieces(primitive) {
  const parents=Uint32Array.from({length:primitive.getAttribute('POSITION').getCount()},(_,i)=>i);
  const find=i=>{
    while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}
    return i;
  };
  const a=primitive.getIndices().getArray();
  for(let i=0;i<a.length;i+=3){
    const root=find(a[i]);
    parents[find(a[i+1])]=root;
    parents[find(a[i+2])]=root;
  }
  return new Set(Array.from(parents,(_,i)=>find(i))).size;
}
function yMin(mesh,side) {
  const point=new T.Vector3();
  let min=Infinity;
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);
    if(Math.sign(point.z)===side)min=Math.min(min,point.y);
  }
  return min;
}

test('the packed dual exterior keeps its sources and adds four separate talons per foot',async()=>{
  assert.equal(raw.length,asset.bytes);
  assert.equal(sha(raw),asset.sha256);
  assert.equal(sha(readFileSync('model-bald-eagle-v0669.glb')),asset.derivedFromSha256);
  assert.equal(asset.license,'CC BY 4.0');
  assert.equal(asset.standingSource.license,'CC0 1.0');
  await MeshoptDecoder.ready;
  const document=await new NodeIO().registerExtensions([EXTMeshoptCompression])
    .registerDependencies({'meshopt.decoder':MeshoptDecoder}).readBinary(raw);
  const root=document.getRoot();
  assert.equal(root.listSkins()[0].listJoints().length,11);
  assert(root.listExtensionsRequired().some(e=>e.extensionName==='EXT_meshopt_compression'));
  for(const node of root.listNodes().filter(n=>n.getName().endsWith('curved talons'))){
    const talons=node.getExtras().talons;
    assert.equal(talons.length,8);
    assert.equal(connectedPieces(node.getMesh().listPrimitives()[0]),8);
    for(const side of [-1,1]){
      const perFoot=talons.filter(t=>t.side===side);
      assert.deepEqual(perFoot.map(t=>t.digit),['I','II','III','IV']);
      const [hallux,second,third,fourth]=perFoot;
      assert(Math.sign(hallux.tip[0]-hallux.base[0])===-Math.sign(third.tip[0]-third.base[0]));
      assert(hallux.baseRadius>third.baseRadius && second.baseRadius>fourth.baseRadius);
    }
  }
  const mapHashes=root.listTextures().map(texture=>sha(texture.getImage()));
  for(const map of asset.maps) assert(mapHashes.includes(map.sha256));
});

test('both feet plant on the support, talons clear it, and head turn leaves foot contact fixed',async()=>{
  const m=await model();
  const r=m.birdRevision;
  assert(r.revisedEagle);
  const supportTop=r.ground.position.y+r.ground.geometry.parameters.height/2;
  const feet=r.standingParts.find(mesh=>mesh.name.includes('scuted_feet'));
  const talons=r.standingParts.find(mesh=>mesh.name.includes('curved_talons'));
  animateAsset(m,'stand',0);
  assert(r.ground.visible);
  for(const side of [-1,1]){
    assert(Math.abs(yMin(feet,side)-supportTop)<.001);
    assert(yMin(talons,side)>supportTop+.001);
  }
  const contact=yMin(feet,1);
  animateAsset(m,'look',2);
  assert(Math.abs(r.standingRigs[0].bones[2].rotation.y)>.1);
  assert.equal(yMin(feet,1),contact);
  assert(r.ground.visible);
  assert(r.flightParts.every(part=>!part.visible));
});

test('paired wingbeats follow the sample cadence, then glide with tucked feet and no flap',async()=>{
  const m=await model();
  const r=m.birdRevision;
  const cycle=1/BALD_EAGLE_WINGBEAT_HZ;
  assert.equal(BALD_EAGLE_WINGBEAT_HZ,2.53);
  assert(Math.abs(baldEagleFlightPose('fly',1.09+cycle).arm-baldEagleFlightPose('fly',1.09).arm)<1e-8);
  animateAsset(m,'fly',1.09);
  assert(!r.ground.visible);
  const elevated=r.bones[3].rotation.x;
  assert(elevated<-.3&&r.bones[1].rotation.x>.3);
  animateAsset(m,'fly',1.29);
  assert(r.bones[3].rotation.x>.29&&r.bones[1].rotation.x<-.29);
  assert(r.bones[3].rotation.x-elevated>.65);
  animateAsset(m,'glide',0);
  const flightFeet=r.flightParts.find(mesh=>mesh.name.includes('scuted_feet'));
  assert(flightFeet.visible&&flightFeet.isSkinnedMesh);
  assert(r.standingParts.every(part=>!part.visible));
  assert(yMin(flightFeet,1)-m.root.position.y>.24);
  const neutral=r.bones[3].quaternion.clone(), relativeX=m.root.position.x, height=m.root.position.y;
  animateAsset(m,'glide',4);
  assert(r.bones[3].quaternion.angleTo(neutral)<.0001);
  assert(m.root.position.x>relativeX && m.root.position.y<height);
  assert.equal(m.movementStudy.stage,'Broad-wing glide');
  animateAsset(m,'fly',29);
  assert.equal(m.movementStudy.time,8);
  assert.equal(m.movementStudy.complete,true);
  assert(r.bones[3].quaternion.angleTo(neutral)<.0001);
  animateAsset(m,'observe',0);
  assert.equal(m.movementStudy,undefined);
});

test('camera bounds hold all published phases and evidence flags retain the model limits',async()=>{
  const m=await model();
  for(const [act,times] of [['stand',[0]],['look',[0,2,6]],['fly',[0,1.09,1.29,3.35,4.65,7,8]],['glide',[0,4,8]],['bank',[0,2,4,6,8]]]){
    for(const t of times){
      animateAsset(m,act,t);
      assert(m.motionBounds[act].containsBox(renderedBounds(m.root)),act+' time '+t);
    }
  }
  assert.equal(asset.viewerRig.animationValidated,false);
  assert.equal(asset.independentlyValidated,false);
  assert(specimen.behaviors.every(b=>b.sourceIds.every(id=>specimen.sources.some(s=>s.id===id))));
  assert.equal(specimen.behaviors.find(b=>b.id==='forage').rendering.status,'unavailable');
});

