import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression} from '@gltf-transform/extensions';
import {dedup,prune,reorder} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';
import {MathUtils,Matrix4,Vector3,Matrix3} from 'three';
import {eagleSkeleton,EAGLE_SIDES,HEAD,TAIL,FOOT_SCALE,FOOT_REFERENCE_Y} from './eagle-rig-v0725.js';
import {eagleWingFold,STANDING_POSE} from './eagle-motion-v0725.js';

const input = 'model-bald-eagle-v0724.glb';
const output = process.argv[2] || 'model-bald-eagle-v0725.glb';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const smooth = MathUtils.smoothstep;
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({
  'meshopt.decoder':MeshoptDecoder, 'meshopt.encoder':MeshoptEncoder
});
const doc = await io.read(input), root = doc.getRoot(), scene = root.getDefaultScene()||root.listScenes()[0];
const buffer = root.listBuffers()[0];
const oldNodes = root.listNodes();
const body = oldNodes.find(node=>node.getName()==='Revised bird body');
const oldSkin = body.getSkin();
const oldBones = oldSkin.listJoints();
const definition = eagleSkeleton();
const joints = definition.map(({name})=>doc.createNode(name));
const skin = doc.createSkin('One adult bald eagle rig').setSkeleton(joints[0]);
const matrices = new Float32Array(joints.length*16);
const inverse = new Matrix4();

function accessor(name,type,array) {
  return doc.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
}
for (const [i,{parent,point}] of definition.entries()) {
  const attach = parent<0 ? scene : joints[parent];
  const origin = parent<0 ? [0,0,0] : definition[parent].point;
  attach.addChild(joints[i]);
  joints[i].setTranslation(point.map((v,k)=>v-origin[k]));
  inverse.makeTranslation(-point[0],-point[1],-point[2]).toArray(matrices,i*16);
  skin.addJoint(joints[i]);
}
skin.setInverseBindMatrices(accessor('Adult inverse bind matrices','MAT4',matrices));

function writeSkin(primitive,createWeights) {
  const position = primitive.getAttribute('POSITION').getArray();
  const count = position.length/3;
  const jointIds = new Uint8Array(count*4), weights = new Float32Array(count*4);
  for (let i=0;i<count;i++) {
    const contributions = createWeights(i,position);
    const values = Array.from(contributions).sort((a,b)=>b[1]-a[1]).slice(0,4);
    const total = values.reduce((sum,[,weight])=>sum+weight,0);
    for (const [slot,[joint,weight]] of values.entries()) {
      jointIds[i*4+slot] = joint;
      weights[i*4+slot] = weight/total;
    }
  }
  primitive.setAttribute('JOINTS_0',accessor('Adult joints','VEC4',jointIds));
  primitive.setAttribute('WEIGHTS_0',accessor('Adult weights','VEC4',weights));
}

function softenWingRoot(primitive) {
  const p=primitive.getAttribute('POSITION').getArray();
  const n=primitive.getAttribute('NORMAL').getArray();
  const reshape=(x,y,z)=>.082*smooth(-x,.43,.59)*(1-smooth(y,.31,.44))
    *smooth(Math.abs(z),.26,.33)*(1-smooth(Math.abs(z),.43,.51));
  const point=new Vector3(), step=.00008;
  for (let i=0;i<p.length;i+=3) {
    const [x,y,z]=p.subarray(i,i+3);
    const lift=reshape(x,y,z);
    if (!lift) continue;
    const dx=(reshape(x+step,y,z)-lift)/step;
    const dy=(reshape(x,y+step,z)-lift)/step;
    const dz=(reshape(x,y,z+step)-lift)/step;
    point.set(n[i]*(1+dy)-dx*n[i+1],n[i+1],n[i+2]*(1+dy)-dz*n[i+1]).normalize().toArray(n,i);
    p[i+1]+=lift;
  }
}

function reweightPlumage(node) {
  const primitive = node.getMesh().listPrimitives()[0];
  if (node===body) softenWingRoot(primitive);
  const original = primitive.getAttribute('JOINTS_0').getArray();
  const oldWeights = primitive.getAttribute('WEIGHTS_0').getArray();
  const position = primitive.getAttribute('POSITION').getArray();
  const tailDeltas = new Float32Array(position.length);
  writeSkin(primitive,(i,p)=>{
    const result = new Map();
    const add = (joint,amount) => {
      if (amount>1e-6) result.set(joint,(result.get(joint)||0)+amount);
    };
    for (let k=0;k<4;k++) {
      const j = original[i*4+k], w = oldWeights[i*4+k];
      if (j>=1 && j<=4) {
        const side = EAGLE_SIDES[j<=2?0:1];
        const span = Math.abs(p[i*3+2]);
        const middle = smooth(span,.495,.68);
        const distal = smooth(span,.855,1.028);
        add(side.shoulder,w*(1-middle));
        add(side.elbow,w*middle*(1-distal));
        add(side.wrist,w*middle*distal);
      } else if (j>=5 && j<=8) {
        add(EAGLE_SIDES[j<=6?0:1].hip,w);
      } else {
        add(j===9?HEAD:j===10?TAIL:0,w);
      }
    }
    const tail = (result.get(TAIL)||0)*smooth(-p[i*3],.37,.61);
    tailDeltas[i*3+2] = p[i*3+2]*.26*tail;
    return result;
  });
  if (node===body) {
    const target = doc.createPrimitiveTarget('Tail fan');
    target.setAttribute('POSITION',accessor('Tail feather fan displacement','VEC3',tailDeltas));
    primitive.addTarget(target);
    node.getMesh().setWeights([0]);
    node.getMesh().setExtras({...node.getMesh().getExtras(),targetNames:['Tail fan']});
  }
  node.setSkin(skin);
}

function foldedPlumage() {
  const primitive=body.getMesh().listPrimitives()[0];
  const positions=primitive.getAttribute('POSITION').getArray();
  const normals=primitive.getAttribute('NORMAL').getArray();
  const indices=primitive.getIndices().getArray();
  const jointIds=primitive.getAttribute('JOINTS_0').getArray();
  const weights=primitive.getAttribute('WEIGHTS_0').getArray();
  const vector=values=>new Vector3(...values);
  const identity=new Matrix4(), unit=vector([1,1,1]);
  const transforms=definition.map(()=>identity);
  const wingJoints=new Set();
  for (const side of EAGLE_SIDES) {
    const wing=[side.shoulder,side.elbow,side.wrist];
    const rotations=eagleWingFold(side);
    for (const [i,index] of wing.entries()) {
      const point=vector(definition[index].point);
      const position=point.clone().applyMatrix4(transforms[definition[index].parent]);
      transforms[index]=new Matrix4().compose(position,rotations[i],unit)
        .multiply(new Matrix4().makeTranslation(-point.x,-point.y,-point.z));
      wingJoints.add(index);
    }
  }

  // Pack the separated flight-feather edges along the flank. The correction is
  // authored in the folded pose, then transformed back into skinned bind space.
  const {x,y,pitch}=STANDING_POSE;
  const up=vector([0,0,1]), offset=vector([x,y,0]);
  const posed=new Float32Array(positions.length), deltas=new Float32Array(positions.length);
  const blend=new Matrix4(), linear=new Matrix3(), inverted=new Matrix3();
  const closeness=new Float32Array(positions.length/3);
  const shape=Array.from({length:closeness.length},()=>null);
  const p=new Vector3(), target=new Vector3(), local=new Vector3();
  function boneBlend(i) {
    const m=blend.elements;
    m.fill(0);
    for (let j=0;j<4;j++) {
      const k=i*4+j, matrix=transforms[jointIds[k]].elements;
      for (let n=0;n<16;n++) m[n]+=weights[k]*matrix[n];
    }
    return blend;
  }
  for (let i=0;i<closeness.length;i++) {
    const a=i*3;
    const wingWeight=[0,1,2,3].reduce((sum,k)=>sum+(wingJoints.has(jointIds[i*4+k])?weights[i*4+k]:0),0);
    const factor=smooth(wingWeight,.18,.83);
    closeness[i]=factor;
    p.fromArray(positions,a).applyMatrix4(boneBlend(i));
    target.copy(p);
    if (factor>0) {
      target.applyAxisAngle(up,pitch).add(offset);
      const xAlong=MathUtils.lerp(-.10,target.x,.80);
      const u=MathUtils.clamp((xAlong+.865)/.95,0,1);
      const profile=Math.pow(Math.sin(Math.PI*u),.72);
      const ridge=.273+.455*u;
      const width=.033+.123*profile;
      const cover=.177+.13*profile;
      target.set(xAlong,ridge+width*Math.tanh((target.y-ridge)/.215),
        Math.sign(positions[a+2])*(cover+.032*Math.tanh((Math.abs(target.z)-cover)/.18)
          +.025*(1-smooth(Math.abs(positions[a+2]),.87,1.52))));
      target.sub(offset).applyAxisAngle(up,-pitch).lerp(p,1-factor);
      linear.setFromMatrix4(blend);
      if (Math.abs(linear.determinant())>1e-4) {
        inverted.copy(linear).invert();
        local.copy(target).sub(p).applyMatrix3(inverted).toArray(deltas,a);
        shape[i]=inverted.clone();
      } else {
        target.copy(p);
      }
    }
    target.toArray(posed,a);
  }

  const accumulated=new Float32Array(positions.length);
  const a=new Vector3(), b=new Vector3(), c=new Vector3(), surface=new Vector3();
  for (let i=0;i<indices.length;i+=3) {
    const j=indices[i],k=indices[i+1],l=indices[i+2];
    if (!closeness[j]&&!closeness[k]&&!closeness[l]) continue;
    a.fromArray(posed,j*3); b.fromArray(posed,k*3); c.fromArray(posed,l*3);
    surface.crossVectors(b.sub(a),c.sub(a));
    for (const index of [j,k,l]) {
      accumulated[index*3]+=surface.x;
      accumulated[index*3+1]+=surface.y;
      accumulated[index*3+2]+=surface.z;
    }
  }
  const relief=new Float32Array(positions.length);
  for (let i=0;i<closeness.length;i++) {
    if (!shape[i]) continue;
    const a=i*3;
    surface.fromArray(accumulated,a);
    if (surface.lengthSq()<1e-12) continue;
    const previous=local.fromArray(normals,a);
    surface.normalize().applyMatrix3(shape[i]).normalize().sub(previous)
      .multiplyScalar(.72*closeness[i]).toArray(relief,a);
  }
  const fold=doc.createPrimitiveTarget('Folded feather overlap');
  fold.setAttribute('POSITION',accessor('Folded feather packing','VEC3',deltas));
  fold.setAttribute('NORMAL',accessor('Folded feather normals','VEC3',relief));
  primitive.addTarget(fold);
  body.getMesh().setWeights([0,0]).setExtras({...body.getMesh().getExtras(),targetNames:['Tail fan','Folded feather overlap']});
}

function components(primitive) {
  const count = primitive.getAttribute('POSITION').getCount();
  const parent = Uint32Array.from({length:count},(_,i)=>i);
  const find = i => {
    while (parent[i]!==i) { parent[i]=parent[parent[i]]; i=parent[i]; }
    return i;
  };
  const index = primitive.getIndices().getArray();
  for (let i=0;i<index.length;i+=3) {
    const a=find(index[i]);
    parent[find(index[i+1])]=a;
    parent[find(index[i+2])]=a;
  }
  const groups = new Map();
  for (let i=0;i<count;i++) {
    const key=find(i);
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(i);
  }
  return [...groups.values()];
}

const legacyFootX = .199, legacyFootZ = .132;
const digitDirections = [[-.12,-.043],[.138,-.076],[.174,.014],[.112,.101]];
function digitIndex(x,z) {
  const ax=x-legacyFootX, az=Math.abs(z)-legacyFootZ;
  let digit=0, best=-Infinity;
  for (const [i,[dx,dz]] of digitDirections.entries()) {
    const score=(dx*ax+dz*az)/Math.hypot(dx,dz);
    if (score>best) { best=score; digit=i; }
  }
  return digit;
}
function reuseFeet(node,claws) {
  const p = node.getMesh().listPrimitives()[0];
  const a = p.getAttribute('POSITION').getArray();
  const normals = p.getAttribute('NORMAL').getArray();
  const groups = components(p);
  if (groups.length!==(claws?8:10)) throw Error('Expected separate digits and tarsi in the adult foot source');
  const assignment = new Array(a.length/3);
  const scale = FOOT_SCALE;
  const pieces = new Set();
  for (const indices of groups) {
    let x=0,z=0,highest=-Infinity;
    for (const i of indices) {
      x+=a[i*3]; z+=a[i*3+2]; highest=Math.max(highest,a[i*3+1]);
    }
    x/=indices.length; z/=indices.length;
    const side = EAGLE_SIDES[z<0?0:1], ankle = definition[side.ankle].point;
    const tarsus = highest>.12;
    const digit = tarsus ? -1 : digitIndex(x,z);
    const name = side.sign+':'+digit;
    if (pieces.has(name)) throw Error('Duplicate source foot component '+name);
    pieces.add(name);
    for (const i of indices) {
      const q=i*3;
      const sourceY = a[q+1];
      a[q] = ankle[0]+(a[q]-legacyFootX)*scale;
      a[q+1] = ankle[1]+(sourceY-FOOT_REFERENCE_Y)*(tarsus?1.33:scale);
      a[q+2] = ankle[2]+(a[q+2]-side.sign*legacyFootZ)*scale;
      if (tarsus) {
        const normalY=normals[q+1]*scale/1.33;
        const length=Math.hypot(normals[q],normalY,normals[q+2]);
        normals[q]/=length; normals[q+1]=normalY/length; normals[q+2]/=length;
        const main=smooth(sourceY,.048,.082);
        assignment[i]=[[side.hock,main],[side.ankle,1-main]].filter(([,w])=>w>1e-6);
      } else {
        const toe=side.toes[digit];
        const pad=definition[toe].point;
        const main=claws?1:smooth(Math.hypot(a[q]-pad[0],a[q+2]-pad[2]),.007,.045);
        assignment[i]=[[toe,main],[side.ankle,1-main]].filter(([,w])=>w>1e-6);
      }
    }
  }
  p.getAttribute('POSITION').setArray(a);
  p.getAttribute('NORMAL').setArray(normals);
  writeSkin(p,i=>assignment[i]);
  node.setSkin(skin).setScale([1,1,1]);
  node.setName(claws?'Adult curved talons':'Adult scuted feet and toes');
  node.getMesh().setName(node.getName());
  node.setExtras({digitLayout:'I hallux opposed to II, III and IV',connectedParts:groups.length});
}

const feet=oldNodes.find(n=>n.getName()==='Rebuilt standing scuted feet');
const talons=oldNodes.find(n=>n.getName()==='Rebuilt standing curved talons');
for (const node of oldNodes) {
  if (node===feet || node===talons) continue;
  if (node.getSkin()===oldSkin) {
    if (node.getName().startsWith('Flight scuted')||node.getName().startsWith('Flight curved')) node.dispose();
    else reweightPlumage(node);
  } else if (node.getMesh()) {
    node.dispose();
  }
}
reuseFeet(feet,false);
reuseFeet(talons,true);
foldedPlumage();
oldSkin.dispose();
for (const joint of oldBones.reverse()) joint.dispose();

const provenance = {
  version:'0.7.25',sourceFile:input,sourceSha256:sha256(readFileSync(input)),
  bodySource:'Pigcraft / Bald Eagle Flying Bird Model / CC BY 4.0',
  feetSource:'PhenoVoxel Archive authored four-digit feet and talons, adapted to one rig',
  rig:'Single exterior across ground and air poses, paired wing shoulders/elbows/wrists, hocks, toe controls and tail fan',
  groundIncluded:false
};
root.setExtras(provenance);
await doc.transform(prune(),dedup(),reorder({encoder:MeshoptEncoder,target:'size'}));
doc.createExtension(EXTMeshoptCompression).setRequired(true)
  .setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
await io.write(output,doc);
const data = readFileSync(output);
const manifest = {...provenance,bytes:data.length,sha256:sha256(data),joints:skin.listJoints().length,
  meshes:root.listMeshes().map(model=>({name:model.getName(),triangles:model.listPrimitives().reduce((n,p)=>n+p.getIndices().getCount()/3,0)})),
  maps:root.listTextures().map(map=>({name:map.getName(),sha256:sha256(map.getImage()),bytes:map.getImage().length}))};
if (process.argv[3]) writeFileSync(process.argv[3],JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
