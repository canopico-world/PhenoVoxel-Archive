import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
import { compactPrimitive, dedup, prune, reorder, simplifyPrimitive, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { CatmullRomCurve3, Color, MathUtils, Vector3 } from 'three';
import sharp from 'sharp';

const source = 'model-bald-eagle-v0669.glb';
const output = process.argv[2] || 'model-bald-eagle-v0724.glb';
const digest = value => createHash('sha256').update(value).digest('hex');
const s = (x, a, b) => MathUtils.smoothstep(x, a, b);
const lerp = MathUtils.lerp;
const plane = .0025;
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptDecoder
});
const doc = await io.read(source);
const root = doc.getRoot();
const scene = root.getDefaultScene() || root.listScenes()[0];
const buffer = root.listBuffers()[0];
const flightNode = root.listNodes().find(n => n.getName() === 'Revised bird body');
const standNode = root.listNodes().find(n => n.getName().startsWith('Rebuilt standing'));
const stand = standNode.getMesh().listPrimitives()[0];
const flight = flightNode.getMesh().listPrimitives()[0];

function standingContour(x, y, z, out) {
  const trunk = s(y, .23, .47) * (1 - s(y, .78, 1.03));
  const breast = s(x, -.02, .36) * trunk;
  const tail = (1 - s(x, -.55, -.29)) * (1 - s(y, .21, .43));
  const tailEdge = s(Math.abs(z), .02, .127);
  // Lift the folded tail clear of the standing surface and soften its outer edge.
  out.set(x + .055 * breast + .059 * tail * (.62 + .38 * tailEdge),
    y - .034 * trunk + .151 * tail,
    z * (1 + .125 * trunk - .095 * tail));
}

function flightContour(x, y, z, out) {
  const span = Math.abs(z);
  const chord = s(span, .22, .59) * (1 - s(span, 1.27, 1.82));
  const trailing = 1 - s(x, -.13, .21);
  const core = (1 - s(span, .12, .32)) * s(x, -.42, -.20) * (1 - s(x, .27, .43)) * s(y, .27, .43);
  const breast = core * (1 - s(y, .54, .72));
  const tip = s(span, 1.18, 1.875);
  const tail = (1 - s(x, -.61, -.36)) * (1 - s(span, .22, .34));
  out.set(x - .093 * chord * trailing - .065 * tip + .023 * tail * s(span, .04, .20),
    y - .054 * breast + .019 * chord * trailing - .077 * tip,
    z * (1 + .105 * core - .055 * tail));
}

function omitFootFaces(primitive, remove) {
  const p = primitive.getAttribute('POSITION').getArray();
  const indices = primitive.getIndices();
  const original = indices.getArray();
  const rejected = new Uint8Array(p.length / 3);
  for (let i = 0; i < rejected.length; i++) {
    rejected[i] = Number(remove(p[i * 3], p[i * 3 + 1], p[i * 3 + 2], i));
  }
  const kept = [];
  for (let i = 0; i < original.length; i += 3) {
    const a = original[i], b = original[i + 1], c = original[i + 2];
    if (!(rejected[a] || rejected[b] || rejected[c])) kept.push(a, b, c);
  }
  indices.setArray(new original.constructor(kept));
  compactPrimitive(primitive);
}

omitFootFaces(stand, (x, y, z) => x > -.16 && Math.abs(z) > .041 && y < .155);
const jointSource = flight.getAttribute('JOINTS_0').getArray();
const weightSource = flight.getAttribute('WEIGHTS_0').getArray();
omitFootFaces(flight, (x, y, z, i) => {
  if (y >= .246 || x < -.34 || Math.abs(z) > .19) return false;
  let foot = 0;
  for (let k = 0; k < 4; k++) {
    if (jointSource[i * 4 + k] >= 5 && jointSource[i * 4 + k] <= 8) foot += weightSource[i * 4 + k];
  }
  return foot > .65;
});

function warp(primitive, contour) {
  const p = primitive.getAttribute('POSITION').getArray();
  const n = primitive.getAttribute('NORMAL').getArray();
  const centre = new Vector3(), dx = new Vector3(), dy = new Vector3(), dz = new Vector3();
  const result = new Vector3(), tangent = new Vector3();
  const epsilon = .00002;
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2];
    contour(x, y, z, centre);
    contour(x + epsilon, y, z, dx);
    contour(x, y + epsilon, z, dy);
    contour(x, y, z + epsilon, dz);
    dx.sub(centre); dy.sub(centre); dz.sub(centre);
    // Cofactor transform maps each original surface normal through the local deformation.
    result.crossVectors(dy, dz).multiplyScalar(n[i]);
    result.addScaledVector(tangent.crossVectors(dz, dx), n[i + 1]);
    result.addScaledVector(tangent.crossVectors(dx, dy), n[i + 2]);
    result.normalize().toArray(n, i);
    centre.toArray(p, i);
  }
}

warp(stand, standingContour);
for (const node of root.listNodes()) {
  if (node !== standNode && node.getMesh()) {
    for (const primitive of node.getMesh().listPrimitives()) warp(primitive, flightContour);
  }
}
await doc.transform(weld());
simplifyPrimitive(flight, {simplifier:MeshoptSimplifier, ratio:.52, error:.0014, lockBorder:true});
simplifyPrimitive(stand, {simplifier:MeshoptSimplifier, ratio:.68, error:.0013, lockBorder:true});

function flightTailMask(primitive, width, height) {
  const position=primitive.getAttribute('POSITION').getArray();
  const uv=primitive.getAttribute('TEXCOORD_0').getArray();
  const indices=primitive.getIndices().getArray();
  const joints=primitive.getAttribute('JOINTS_0').getArray();
  const weights=primitive.getAttribute('WEIGHTS_0').getArray();
  const mask=new Uint8Array(width*height);
  const coverage=new Float32Array(position.length/3);
  for(let i=0;i<coverage.length;i++){
    let bound=0;
    for(let k=0;k<4;k++)if(joints[i*4+k]===10)bound+=weights[i*4+k];
    coverage[i]=s(-position[i*3],.376,.492)*s(bound,.48,.92);
  }
  for(let i=0;i<indices.length;i+=3){
    const a=indices[i], b=indices[i+1], c=indices[i+2];
    const ca=coverage[a], cb=coverage[b], cc=coverage[c];
    if(Math.max(ca,cb,cc)<.05)continue;
    const x0=uv[a*2]*width, x1=uv[b*2]*width, x2=uv[c*2]*width;
    const y0=uv[a*2+1]*height,y1=uv[b*2+1]*height,y2=uv[c*2+1]*height;
    const denom=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2);
    if(Math.abs(denom)<.0001)continue;
    const minX=Math.max(0,Math.floor(Math.min(x0,x1,x2)-.8)),maxX=Math.min(width-1,Math.ceil(Math.max(x0,x1,x2)+.8));
    const minY=Math.max(0,Math.floor(Math.min(y0,y1,y2)-.8)),maxY=Math.min(height-1,Math.ceil(Math.max(y0,y1,y2)+.8));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const u=((y1-y2)*(x+.5-x2)+(x2-x1)*(y+.5-y2))/denom;
      const v=((y2-y0)*(x+.5-x2)+(x0-x2)*(y+.5-y2))/denom;
      const w=1-u-v;
      if(Math.min(u,v,w)<-.015)continue;
      const pixel=y*width+x;
      mask[pixel]=Math.max(mask[pixel],Math.round(255*(u*ca+v*cb+w*cc)));
    }
  }
  return mask;
}

async function finishPlumage(material, standing) {
  const albedo = material.getBaseColorTexture();
  const size = standing ? 1664 : 2048;
  const { data, info } = await sharp(albedo.getImage()).removeAlpha()
    .resize(size, size, {fit:'inside'}).raw().toBuffer({resolveWithObject:true});
  const tailMask = standing ? null : flightTailMask(flight,info.width,info.height);
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const value = .25 * r + .61 * g + .14 * b;
    const skin = s(r - b, .17, .35) * s(g - b, .12, .27) * s(value, .35, .56);
    const feather = (1 - skin) * (1 - s(value, .61, .85));
    const raised = feather * (.014 + (standing?.077:.104) * (1 - s(value, .12, .61)));
    const warm = (1 - skin) * s(value, .68, .92);
    const saturation = 1 - .17 * feather;
    const tail = tailMask ? tailMask[i/3]/255 : 0;
    const tailWhite = MathUtils.clamp(.80 + .27*(value - .48), .70, .96);
    data[i] = Math.round(255 * Math.min(1, lerp(lerp(value, r, saturation) + raised - .012 * warm,tailWhite+.019,tail)));
    data[i+1] = Math.round(255 * Math.min(1, lerp(lerp(value, g, saturation) + raised * .94 - .018 * warm,tailWhite+.014,tail)));
    data[i+2] = Math.round(255 * Math.min(1, lerp(lerp(value, b, saturation) + raised * .92 - .027 * warm,tailWhite,tail)));
  }
  albedo.setName(standing ? 'Folded-wing feather pigment' : 'Flight feather pigment').setMimeType('image/jpeg')
    .setImage(await sharp(data, {raw: info}).jpeg({quality:87, mozjpeg:true, chromaSubsampling:'4:4:4'}).toBuffer());
  const normal = material.getNormalTexture();
  if (normal) {
    normal.setName(standing ? 'Folded-wing feather relief' : 'Flight feather relief').setMimeType('image/jpeg')
      .setImage(await sharp(normal.getImage()).removeAlpha().resize(size, size, {fit:'inside',withoutEnlargement:true})
        .jpeg({quality:89, mozjpeg:true, chromaSubsampling:'4:4:4'}).toBuffer());
  }
  // Stand and flight use the same matte finish. Baked relief stays in the normal maps.
  material.setMetallicRoughnessTexture(null).setMetallicFactor(0).setRoughnessFactor(.83).setNormalScale(.32);
}
await Promise.all([finishPlumage(stand.getMaterial(), true), finishPlumage(flight.getMaterial(), false)]);

// Adult anisodactyl layout: hallux behind, digits II–IV forward.
// Each path is in a symmetric foot-local frame with +X forward and +Z outboard.
const digits = [
  { name:'I', toe:[[-.011,.046,-.008],[-.056,.031,-.021],[-.101,.028,-.036],[-.121,.034,-.043]], radii:[.023,.021,.019,.015], claw:[[-.116,.037,-.042],[-.147,.045,-.051],[-.163,.031,-.055],[-.161,.005,-.055]], horn:[.017,.014,.009,.0009] },
  { name:'II', toe:[[.005,.045,-.021],[.054,.035,-.046],[.103,.029,-.067],[.138,.032,-.076]], radii:[.022,.020,.017,.013], claw:[[.132,.036,-.075],[.159,.044,-.083],[.181,.030,-.089],[.180,.005,-.089]], horn:[.016,.012,.0075,.00085] },
  { name:'III', toe:[[.011,.046,.001],[.066,.036,.004],[.135,.028,.008],[.174,.031,.014]], radii:[.0215,.019,.017,.012], claw:[[.168,.034,.013],[.191,.041,.019],[.210,.028,.022],[.208,.005,.022]], horn:[.014,.010,.0065,.00065] },
  { name:'IV', toe:[[.002,.044,.022],[.041,.036,.057],[.083,.027,.087],[.112,.031,.101]], radii:[.020,.018,.015,.0115], claw:[[.108,.035,.098],[.129,.039,.110],[.147,.026,.118],[.143,.005,.118]], horn:[.013,.009,.0055,.00065] }
];
const shank = [[-.004,.216,-.004],[.006,.162,-.004],[.001,.101,.002],[-.009,.049,.007]];
const tarsusRadii = [.032,.033,.032,.040];
const skinGold = new Color('#c59a48'), skinShade = new Color('#846137');
const hornLit = new Color('#464038'), hornDark = new Color('#211f1b');
const createGeometry = () => ({ positions:[], normals:[], colors:[], indices:[], joints:[], weights:[] });
const surface = doc.createMaterial('Yellow scutes and toe pads').setBaseColorFactor([1,1,1,1]).setMetallicFactor(0).setRoughnessFactor(.71);
const horn = doc.createMaterial('Dark keratin talons').setBaseColorFactor([1,1,1,1]).setMetallicFactor(0).setRoughnessFactor(.55);
const up = new Vector3(0,1,0), forward = new Vector3(1,0,0);

function footPoint([x,y,z], side, airborne) {
  if (airborne) {
    // Shorten the foot's apparent reach by curling the digits below the rear-facing palm.
    const toeCurl = (1 - s(y,.044,.145)) * s(Math.abs(x),.031,.197);
    const reach = .50 - .25*toeCurl;
    return new Vector3(-.181 - reach*x + .022*s(y,.145,.216), .170 + .48*y + .043*toeCurl, side*(.105 + (.54-.13*toeCurl)*z));
  }
  return new Vector3(.199 + x, y, side*(.132 + z));
}

function tube(target, points, radii, { side, airborne, claw=false, scales=11, tarsus=false }) {
  const curve = new CatmullRomCurve3(points.map(p=>footPoint(p, side, airborne)));
  const start = target.positions.length / 3;
  const rowCount = claw ? 28 : 36, circleCount = 16;
  const normal = new Vector3(), lateral = new Vector3(), radial = new Vector3(), p = new Vector3(), color = new Color();
  for (let j=0;j<=rowCount;j++) {
    const u = j/rowCount, count = u*(radii.length-1), index = Math.min(radii.length-2,Math.floor(count));
    const radius = lerp(radii[index],radii[index+1],count-index)*(airborne?.63:1);
    const t = curve.getTangent(u), center = curve.getPoint(u);
    normal.copy(Math.abs(t.y)>.80 ? forward : up).addScaledVector(t,-t.dot(Math.abs(t.y)>.80 ? forward : up)).normalize();
    lateral.crossVectors(t,normal).normalize();
    const scaleSeam = Math.exp(-Math.pow(Math.sin(Math.PI * u * scales)*4.6,2)) * s(u,.025,.16);
    for(let i=0;i<circleCount;i++){
      const a=2*Math.PI*i/circleCount, dorsal=Math.max(0,Math.cos(a));
      radial.copy(normal).multiplyScalar(Math.cos(a)).addScaledVector(lateral,Math.sin(a)).normalize();
      const ridge = claw ? 0 : -.088*scaleSeam*dorsal + .025*Math.sin(3*a+u*9);
      const flatten = tarsus ? 1 : .79;
      p.copy(center).addScaledVector(radial,radius*(1+ridge));
      if (!tarsus) p.y=center.y+(p.y-center.y)*flatten;
      if (!airborne) {
        const soleFlatten = claw ? 0 : .013*(1-s(p.y,.044,.092));
        p.y=Math.max(plane,p.y-soleFlatten);
      }
      target.positions.push(p.x,p.y,p.z);
      target.normals.push(radial.x,radial.y,radial.z);
      if (claw) color.copy(hornDark).lerp(hornLit,.27+.30*dorsal+.14*u);
      else color.copy(skinGold).lerp(skinShade,.33*(1-dorsal)+.19*scaleSeam*dorsal+.09*Math.sin(8*a+u*23)**2);
      target.colors.push(color.r,color.g,color.b);
      if (airborne) {
        const lower = side<0?6:8, weight = 1-s(p.y,.238,.266);
        target.joints.push(lower,lower-1,0,0);
        target.weights.push(weight,1-weight,0,0);
      }
    }
    if(j>0) for(let i=0;i<circleCount;i++){
      const a=start+(j-1)*circleCount+i,b=start+(j-1)*circleCount+(i+1)%circleCount;
      target.indices.push(a,b,a+circleCount,b,b+circleCount,a+circleCount);
    }
  }
  // Close each end. Proximal rings remain embedded in the toe or tarsus.
  for(let i=1;i<circleCount-1;i++){
    const end=start+rowCount*circleCount;
    target.indices.push(start,start+i+1,start+i,end,end+i,end+i+1);
  }
}

function addFootMesh(name, data, material, airborne, extras) {
  const access = (label, type, array) => doc.createAccessor(label).setType(type).setArray(array).setBuffer(buffer);
  const primitive = doc.createPrimitive().setMaterial(material)
    .setAttribute('POSITION',access(name+' positions','VEC3',new Float32Array(data.positions)))
    .setAttribute('NORMAL',access(name+' normals','VEC3',new Float32Array(data.normals)))
    .setAttribute('COLOR_0',access(name+' pigmentation','VEC3',new Float32Array(data.colors)))
    .setIndices(access(name+' triangles','SCALAR',new Uint16Array(data.indices)));
  if(airborne) primitive
    .setAttribute('JOINTS_0',access(name+' joints','VEC4',new Uint8Array(data.joints)))
    .setAttribute('WEIGHTS_0',access(name+' weights','VEC4',new Float32Array(data.weights)));
  const mesh = doc.createMesh(name).addPrimitive(primitive);
  const node = doc.createNode(name).setMesh(mesh).setExtras(extras);
  if(airborne) node.setSkin(flightNode.getSkin());
  else node.setScale([0,0,0]);
  scene.addChild(node);
}

for(const airborne of [false,true]){
  const prefix = airborne ? 'Flight' : 'Rebuilt standing';
  const skin=createGeometry(), claws=createGeometry();
  for(const side of [-1,1]){
    tube(skin,shank,tarsusRadii,{side,airborne,scales:12,tarsus:true});
    for (const digit of digits) tube(skin,digit.toe,digit.radii,{side,airborne,scales:10});
  }
  for(const side of [-1,1]) for(const digit of digits){
    tube(claws,digit.claw,digit.horn,{side,airborne,claw:true});
    claws.parts ||= [];
    claws.parts.push({
      side,digit:digit.name,
      base:footPoint(digit.claw[0],side,airborne).toArray(),
      tip:footPoint(digit.claw.at(-1),side,airborne).toArray(),
      baseRadius:digit.horn[0]*(airborne?.63:1)
    });
  }
  addFootMesh(prefix+' scuted feet',skin,surface,airborne,{digitLayout:'Three forward digits and a posterior hallux',standingOnly:!airborne,supportPlane:airborne?null:plane});
  addFootMesh(prefix+' curved talons',claws,horn,airborne,{standingOnly:!airborne,talons:claws.parts});
}
root.setExtras({
  ...root.getExtras(), version:'0.7.24', parentSha256:digest(readFileSync(source)),
  standingExterior:'Recontoured Grab3D CC0 adult, raised folded tail and locally rebuilt scuted feet.',
  flightExterior:'Recontoured Pigcraft CC BY 4.0 adult, broad inner wings and articulated folded feet.',
  groundIncluded:false
});
await doc.transform(dedup(), prune(), reorder({encoder:MeshoptEncoder,target:'size'}));
doc.createExtension(EXTMeshoptCompression).setRequired(true)
  .setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
await io.write(output, doc);
const bytes=readFileSync(output);
const manifest={
  file:output, bytes:bytes.length, sha256:digest(bytes),
  sourceSha256:digest(readFileSync(source)),
  meshes:root.listMeshes().map(m=>({name:m.getName(),triangles:m.listPrimitives().reduce((sum,p)=>sum+p.getIndices().getCount()/3,0)})),
  maps:root.listTextures().map(t=>({name:t.getName(),bytes:t.getImage().length,sha256:digest(t.getImage())}))
};
if (process.argv[3]) writeFileSync(process.argv[3],JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));

