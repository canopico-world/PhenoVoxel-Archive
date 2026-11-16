import { NodeIO, PropertyType } from '@gltf-transform/core';
import { dedup, prune } from '@gltf-transform/functions';
import sharp from 'sharp';
import { MathUtils, Vector3 } from 'three';

const input = 'model-emperor-penguin-v0695.glb';
const output = 'model-emperor-penguin-v0723.glb';
const io = new NodeIO();
const doc = await io.read(input);
const root = doc.getRoot();
const smooth = MathUtils.smoothstep;
const mix = MathUtils.lerp;
const normalsKey = (a, i) => [a[i], a[i + 1], a[i + 2]].map(v => Math.round(v * 1e5)).join(',');
const gaussian = (x, radius) => Math.exp(-((x / radius) ** 2));
const hash = (x, y) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

function standingPosition(x, y, z, wing, foot) {
  const trunk = (1 - wing) * (1 - foot);
  const chest = gaussian(y - 2.05, .87) * trunk;
  const lowerAbdomen = gaussian(y - .92, .52) * smooth(y, .28, .63) * trunk;
  const fore = 1 - smooth(x, -.23, .33);
  const shapeX = x - fore * (.13 * lowerAbdomen + .09 * chest) + (1 - fore) * .058 * chest;
  const shapeZ = z * (1 + .15 * lowerAbdomen + .105 * chest);
  const toe = 1 - smooth(x, -.20, .14);
  const ankle = smooth(y, .07, .28);
  const side = Math.sign(z);
  const exposedLeg = smooth(y, .035, .245) * (1 - smooth(y, .40, .77));
  return [
    shapeX - foot * (.052 + .050 * toe) * (1 - .87 * ankle),
    y - foot * .070 * exposedLeg,
    shapeZ + foot * (side * (.027 * toe + .018) + (z - side * .245) * .41 * toe)
  ];
}

function swimmingPosition(x, y, z, base, prior, wing, foot, isFoot) {
  const body = 1 - wing;
  const trunk = gaussian(y - 1.47, 1.1) * body;
  const front = smooth(y, 2.35, 3.14);
  const [wx, wy, wz] = prior;
  const back = smooth(wx, -.12, .46);
  const bodyPose = [
    wx + (back - .68) * .12 * trunk + .20 * front * body,
    wy + .042 * trunk,
    wz + base[2] - z
  ];
  // Relax the old dorsal flipper displacement while proportionally retaining
  // the shoulder's connection to the continuous torso field.
  bodyPose[0] -= .296 * wing;
  const ankleRotation = 1.27;
  const gx = base[0] - .175;
  const gy = base[1] - .265;
  const trailing = [
    -.193 + gx * Math.cos(ankleRotation) - gy * Math.sin(ankleRotation),
    .346 + gx * Math.sin(ankleRotation) + gy * Math.cos(ankleRotation),
    z + (z - Math.sign(z) * .245) * .11 - Math.sign(z) * .006
  ];
  // Use the same ankle field on the visible legs and their body attachment.
  const leg = isFoot ? 1 : smooth(foot, .22, .86) * (1 - smooth(y, .33, .56));
  const posed = bodyPose.map((v, axis) => mix(v, trailing[axis], leg));
  if (!isFoot) {
    const taper = (1 - smooth(y, .37, .68)) * smooth(foot, .12, .8);
    posed[0] += .055 * taper;
    posed[2] *= 1 - .10 * taper;
  }
  return posed;
}

function attachmentWeights(p, v) {
  const joints = p.getAttribute('JOINTS_0').getArray();
  const weights = p.getAttribute('WEIGHTS_0').getArray();
  let wing = 0;
  let foot = 0;
  for (let k = 0; k < 4; k++) {
    const j = joints[v * 4 + k], w = weights[v * 4 + k];
    if (j === 3 || j === 4) wing += w;
    if (j === 5 || j === 6) foot += w;
  }
  return [wing, foot];
}

function footColors(x, y, z) {
  const top = smooth(y, .025, .09);
  const tileX = x * 81, tileZ = z * 89;
  const band = Math.floor(tileX);
  const az = tileZ + (band % 2) * .5;
  const relief = Math.sin(Math.PI * (tileX - band)) ** .58 *
    Math.sin(Math.PI * (az - Math.floor(az))) ** .64;
  const tip = (1 - smooth(x, -.265, -.215)) * (1 - smooth(y, .045, .095));
  const web = (1 - top) * smooth(x, -.28, -.07);
  const scale = mix((.021 + .030 * relief + .007 * hash(band, Math.floor(az))) * (.76 + .24 * top), .009, tip);
  return [scale + .007 * web, scale * .97 + .002 * web, scale * .92, 1];
}

const items = [];
for (const mesh of root.listMeshes()) {
  const p = mesh.listPrimitives()[0];
  const target = p.listTargets()[0];
  const p0 = p.getAttribute('POSITION');
  const old = p0.getArray(), delta = target.getAttribute('POSITION').getArray();
  const base = new Float32Array(old.length), water = new Float32Array(old.length);
  const isFoot = mesh.getName() === 'Webbed_feet';
  const originalColors = p.getAttribute('COLOR_0').getArray();
  const colors = new Float32Array(p0.getCount() * 3);
  const skinUV = isFoot ? new Float32Array(p0.getCount() * 2) : null;
  for (let i = 0; i < old.length; i += 3) {
    const [x, y, z] = old.slice(i, i + 3);
    const [wing, foot] = attachmentWeights(p, i / 3);
    const stood = standingPosition(x, y, z, wing, foot);
    base.set(stood, i);
    const prior = [x + delta[i], y + delta[i + 1], z + delta[i + 2]];
    water.set(swimmingPosition(x, y, z, stood, prior, wing, foot, isFoot), i);
    if (isFoot) {
      colors.set(footColors(x, y, z).slice(0, 3), i);
      skinUV.set([(x - .55 * y + .40) / .70, (Math.abs(z) - .10) / .29], (i / 3) * 2);
    } else {
      const dorsal = mesh.getName().startsWith('Feathered_exterior')
        ? smooth(y, .28, .73) * (1 - smooth(y, 2.62, 2.95)) * smooth(x, -.12, .37) : 0;
      const tint = [.82, .74, .62];
      for (let k = 0; k < 3; k++) colors[i + k] = originalColors[i + k] * mix(1, tint[k], dorsal);
    }
  }
  const buffer = p0.getBuffer();
  const accessor = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  p.setAttribute('POSITION', accessor('VEC3', base));
  target.setAttribute('POSITION', accessor('VEC3', water.map((v, i) => v - base[i])));
  p.setAttribute('COLOR_0', accessor('VEC3', colors));
  if (skinUV) {
    p.setAttribute('TEXCOORD_1', accessor('VEC2', skinUV));
    p.getMaterial().setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(.82);
  }
  items.push({ mesh, p, target, accessor, base, water, isFoot });
}

// Build coherent, area-weighted normals across UV/material boundaries and
// count pigment copies only once. Feet use a separate weld group.
function posedNormals(pose) {
  const sums = new Map();
  for (const item of items.filter(x => !x.mesh.getName().endsWith('_Pigment'))) {
    const a = item[pose], ix = item.p.getIndices().getArray();
    const prefix = item.isFoot ? 'foot:' : '';
    const v = new Vector3(), u = new Vector3(), w = new Vector3();
    for (let i = 0; i < ix.length; i += 3) {
      v.fromArray(a, ix[i] * 3);
      const n = u.fromArray(a, ix[i + 1] * 3).sub(v).cross(w.fromArray(a, ix[i + 2] * 3).sub(v));
      for (let j = 0; j < 3; j++) {
        const key = prefix + normalsKey(a, 3 * ix[i + j]);
        if (!sums.has(key)) sums.set(key, new Vector3());
        sums.get(key).add(n);
      }
    }
  }
  return sums;
}
const landNormals = posedNormals('base'), waterNormals = posedNormals('water');
for (const {p, target, accessor, base, water, isFoot} of items) {
  const original = p.getAttribute('NORMAL').getArray();
  const a = new Float32Array(base.length), b = new Float32Array(water.length);
  const prefix = isFoot ? 'foot:' : '';
  for (let i = 0; i < base.length; i += 3) {
    const before = new Vector3().fromArray(original, i);
    const land = landNormals.get(prefix + normalsKey(base, i))?.clone().normalize() ?? before.clone();
    const aquatic = waterNormals.get(prefix + normalsKey(water, i))?.clone().normalize() ?? before.clone();
    if (land.lengthSq() < .5) land.copy(before);
    if (aquatic.lengthSq() < .5) aquatic.copy(before);
    land.toArray(a, i);
    aquatic.sub(land).toArray(b, i);
  }
  p.setAttribute('NORMAL', accessor('VEC3', a));
  target.setAttribute('NORMAL', accessor('VEC3', b));
}

// Fine authored feather relief is independent of the unaltered source
// reflectance images. Direction follows the local UV islands.
const size = 512;
const relief = new Float32Array(size * size);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const row = Math.floor(y / 10);
    const offset = x + 2.5 * (row % 2) + 1.1 * Math.sin(y * .12);
    const taper = Math.sin(Math.PI * ((y % 10) + .5) / 10) ** .7;
    relief[y * size + x] = .30 * Math.cos(offset * Math.PI / 2.8) * taper
      + .10 * (hash(x, y) - .5) + .17 * hash(Math.floor(offset / 5.6), row) * taper;
  }
}
const sample = (x, y) => relief[((y + size) % size) * size + ((x + size) % size)];
const pixels = Buffer.alloc(size * size * 3);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const dx = (sample(x - 1, y) - sample(x + 1, y)) * .30;
    const dy = (sample(x, y - 1) - sample(x, y + 1)) * .30;
    const n = new Vector3(dx, dy, 1).normalize();
    [n.x, n.y, n.z].forEach((v, k) => { pixels[(y * size + x) * 3 + k] = Math.round((v + 1) * 127.5); });
  }
}
const featherMap = doc.createTexture('Authored feather microrelief')
  .setMimeType('image/png').setImage(await sharp(pixels, {raw: {width: size, height: size, channels: 3}}).png().toBuffer());
for (const material of root.listMaterials().filter(m => m.getName() !== 'pinguin1')) {
  material.setNormalTexture(featherMap).setNormalScale(.72).setRoughnessFactor(.81);
}

// An independent scute texture at UV1 breaks up the source ankle's long
// polygons while the three-dimensional web and claw contours carry the form.
const scuteSize = 512;
const scutes = Buffer.alloc(scuteSize * scuteSize * 3);
for (let y = 0; y < scuteSize; y++) {
  for (let x = 0; x < scuteSize; x++) {
    const row = Math.floor(x / 11), az = y + (row % 2) * 4;
    const v = (x % 11 + .5) / 11, u = (az % 8 + .5) / 8;
    const cell = (Math.sin(Math.PI * u) * Math.sin(Math.PI * v)) ** .27;
    const tone = Math.round(144 + 86 * cell + 12 * hash(row, Math.floor(az / 8)) + 7 * hash(x, y));
    const at = (y * scuteSize + x) * 3;
    scutes.set([tone, tone, tone], at);
  }
}
const skinMap = doc.createTexture('Ankle and webbed-foot scutes')
  .setMimeType('image/png').setImage(await sharp(scutes, {raw: {width: scuteSize, height: scuteSize, channels: 3}}).png().toBuffer());
const feet = root.listMaterials().find(material => material.getName() === 'pinguin1');
feet.setBaseColorTexture(skinMap);
feet.getBaseColorTextureInfo().setTexCoord(1);

root.setExtras({
  ...root.getExtras(),
  postureCorrectionVersion: '0.7.23',
  postureCorrection: 'Reshaped trunk and lower abdomen, revised ankle and trailing webbed feet, continuous underwater contour, authored feather microrelief and foot pigmentation. Source UVs and both source images preserved.'
});
await doc.transform(dedup({propertyTypes: [PropertyType.ACCESSOR]}), prune({keepAttributes: true}));
await io.write(output, doc);
console.log(output);

