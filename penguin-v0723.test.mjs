import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { NodeIO } from '@gltf-transform/core';
import { prepareAsset, animateAsset } from './asset-motion.js';
import { renderedBounds } from './camera-fit.js';
import { emperorSwim } from './penguin-motion-v0723.js';
import data from './penguin-data-v0723.json' with { type: 'json' };
import { revisedPenguin } from './penguin-source-v0723.js';

globalThis.self = globalThis;
globalThis.createImageBitmap = async () => ({ width: 512, height: 512, close(){} });
const bytes = fs.readFileSync(data.modelAsset.localFile);
const sha = b => createHash('sha256').update(b).digest('hex');
const rawSpecies = JSON.parse(fs.readFileSync('species.json')).species.find(s => s.id === data.id);
const species = revisedPenguin(rawSpecies);
async function makeModel() {
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  return prepareAsset(gltf, species, species.modelAsset);
}

test('retains the credited source images, UVs and seven joints while adding plumage and foot shading', async () => {
  const io = new NodeIO(), root = (await io.readBinary(bytes)).getRoot();
  const baseline = (await io.read('model-emperor-penguin-v0695.glb')).getRoot();
  assert.equal(sha(bytes), data.modelAsset.sha256);
  assert.equal(bytes.length, data.modelAsset.bytes);
  assert.equal(root.getExtras().license, 'CC BY-NC 4.0');
  assert.equal(root.listSkins()[0].listJoints().length, 7);
  const imageHashes = root.listTextures().map(t => sha(t.getImage()));
  for (const map of data.modelAsset.maps) assert(imageHashes.includes(map.sha256));
  for (const mesh of root.listMeshes()) {
    const p = mesh.listPrimitives()[0];
    const old = baseline.listMeshes().find(m => m.getName() === mesh.getName()).listPrimitives()[0];
    for (const attr of ['TEXCOORD_0','JOINTS_0','WEIGHTS_0']) assert.deepEqual(p.getAttribute(attr).getArray(), old.getAttribute(attr).getArray());
    assert.deepEqual(p.getIndices().getArray(), old.getIndices().getArray());
    if (mesh.getName() === 'Webbed_feet') {
      const colors = p.getAttribute('COLOR_0').getArray();
      assert(p.getMaterial().getBaseColorTexture());
      assert.equal(p.getMaterial().getBaseColorTextureInfo().getTexCoord(),1);
      assert(Math.max(...colors.filter((_,i) => i%3 === 0)) > .045);
    } else assert(p.getMaterial().getNormalTexture());
    assert(p.listTargets()[0].getAttribute('NORMAL'));
    assert.notDeepEqual(p.getAttribute('POSITION').getArray(), old.getAttribute('POSITION').getArray());
  }
});

test('revision is scoped to the emperor and cites the measured cadence without implying validated movement', () => {
  assert.equal(species.modelAsset.independentlyValidated, false);
  assert.equal(species.modelAsset.viewerRig.animationValidated, false);
  assert.equal(emperorSwim.cadence, 1.35);
  assert(rawSpecies.behaviors.every(b => species.behaviors.some(v => v.id === b.id)));
  const unrelated = { id: 'haliaeetus-leucocephalus' };
  assert.equal(revisedPenguin(unrelated), unrelated);
  for (const behavior of data.behaviors) {
    assert.equal(behavior.rendering.status, 'partial');
    assert(behavior.sourceIds.every(id => species.sources.some(source => source.id === id)));
  }
});

test('feet support the stance and trail underwater, with phased flippers and deterministic travel', async () => {
  const m = await makeModel();
  const feet = m.birdRevision.parts.find(p => p.name === 'Webbed_feet');
  const source = feet.geometry.attributes.position;
  const point = new T.Vector3();
  const landmarks = (filter) => {
    const output = [];
    for (let i = 0; i < source.count; i++) {
      if (filter(source.getX(i), source.getY(i), source.getZ(i))) output.push(feet.getVertexPosition(i,point).applyMatrix4(feet.matrixWorld).toArray());
    }
    return output;
  };
  const centroid = (verts, axis) => verts.reduce((sum,p) => sum+p[axis],0)/verts.length;
  const soles = side => landmarks((x,y,z) => Math.sign(z) === side && y < .008);
  const toes = side => landmarks((x,y,z) => Math.sign(z) === side && x < -.285);
  const ankles = side => landmarks((x,y,z) => Math.sign(z) === side && y > .195);
  animateAsset(m,'stand',0);
  for (const side of [-1,1]) {
    assert(soles(side).length > 100);
    assert(Math.abs(centroid(soles(side),1)) < .01);
    assert(centroid(toes(side),0) < centroid(ankles(side),0) - .30);
  }
  animateAsset(m,'glide',1.5);
  for (const side of [-1,1]) assert(centroid(toes(side),0) > centroid(ankles(side),0) + .32);
  const wing = m.birdRevision.bones[4];
  const glide = wing.quaternion.clone();
  animateAsset(m,'swim',1.28);
  const up = wing.quaternion.clone();
  animateAsset(m,'swim',1.65);
  assert(wing.quaternion.angleTo(up) > 1.1);
  animateAsset(m,'swim',7.2);
  assert(wing.quaternion.angleTo(glide) < .0001);
  const stage = m.root.userData.movementStudy;
  assert.equal(stage.stage,'Passive underwater glide');
  assert.equal(stage.measured,false);
  for (const [action, times] of [
    ['stand',[0]],
    ['glide',[0,1.5,3,20]],
    ['swim',[0,.12,1.28,1.65,2.17,4.63,5.9,6.7,8,40]],
    ['walk',[0,.5,1.2,2.89,8]]
  ]) {
    for (const time of times) {
      animateAsset(m,action,time);
      assert(m.motionBounds[action].containsBox(renderedBounds(m.root)), action+' '+time);
    }
  }
  animateAsset(m,'swim',1.28);
  assert(wing.quaternion.angleTo(up) < .0001);
  animateAsset(m,'swim',30);
  assert.equal(m.movementStudy.time,8);
  assert(m.movementStudy.complete);
  animateAsset(m,'observe',0);
  assert.equal(m.movementStudy,undefined);
  assert.deepEqual(m.root.position.toArray(),[0,0,0]);
  assert.equal(feet.morphTargetInfluences[0],0);
});

