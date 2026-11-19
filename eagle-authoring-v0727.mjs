import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression} from '@gltf-transform/extensions';
import {compactPrimitive,prune,reorder,simplifyPrimitive} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder as BrowserDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import * as T from 'three';
import sharp from 'sharp';
import {prepareUnifiedEagle,animateUnifiedEagle,STANDING_POSE} from './eagle-motion-v0725.js';
import {HEAD,eagleSkeleton} from './eagle-rig-v0725.js';

const [mode,folder='research-cache/eagle-v0727/geometry',output='model-bald-eagle-v0727.glb',manifestPath]=process.argv.slice(2);
if (!['prepare','pack'].includes(mode)) throw Error('Use prepare or pack, followed by the working directory');
const sourceFile='model-bald-eagle-v0726.glb', donorFile='model-bald-eagle-v0724.glb';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceBytes=readFileSync(sourceFile),donorBytes=readFileSync(donorFile);
const provenance={sourceFile,sourceSha256:digest(sourceBytes),donorFile,donorSha256:digest(donorBytes)};
mkdirSync(folder,{recursive:true});
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const doc=await io.read(sourceFile),donor=await io.read(donorFile);
const root=doc.getRoot(),buffer=root.listBuffers()[0],scene=root.getDefaultScene()||root.listScenes()[0];
const wingsNode=root.listNodes().find(n=>n.getName()==='Revised bird body');
const wings=wingsNode.getMesh().listPrimitives()[0],skin=wingsNode.getSkin();
const reference=donor.getRoot().listNodes().find(n=>n.getName()==='Rebuilt standing credited folded-wing adult').getMesh().listPrimitives()[0];
const file=name=>join(folder,name);
const binary=(name,array)=>writeFileSync(file(name),Buffer.from(array.buffer,array.byteOffset,array.byteLength));
const attribute=(name,type,array)=>doc.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
const smooth=T.MathUtils.smoothstep;
const registration=new T.Matrix4().makeScale(.88,.80,.86).setPosition(-.322,.002,0);

async function prepare() {
  globalThis.self=globalThis;
  globalThis.createImageBitmap=async()=>({width:64,height:64,close(){}});
  const raw=sourceBytes.buffer.slice(sourceBytes.byteOffset,sourceBytes.byteOffset+sourceBytes.byteLength);
  const gltf=await new GLTFLoader().setMeshoptDecoder(BrowserDecoder).parseAsync(raw,'');
  const m=prepareUnifiedEagle(gltf,{id:'haliaeetus-leucocephalus'},{eagleVersion:'0.7.26',motionBounds:{}});
  animateUnifiedEagle(m,'stand',0);
  const mesh=m.birdRevision.body,point=new T.Vector3(),normal=new T.Vector3();
  const count=mesh.geometry.attributes.position.count;
  const positions=new Float32Array(count*3),transforms=new Float32Array(count*9);
  const mixed=new T.Matrix4(),world=new T.Matrix4(),linear=new T.Matrix3();
  const {skinIndex,skinWeight}=mesh.geometry.attributes;
  for(let i=0;i<count;i++) {
    mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld).toArray(positions,i*3);
    mixed.elements.fill(0);
    for(let slot=0;slot<4;slot++) {
      const offset=16*skinIndex.getComponent(i,slot),weight=skinWeight.getComponent(i,slot);
      for(let k=0;k<16;k++)mixed.elements[k]+=mesh.skeleton.boneMatrices[offset+k]*weight;
    }
    world.copy(mesh.matrixWorld).multiply(mesh.bindMatrixInverse).multiply(mixed).multiply(mesh.bindMatrix);
    linear.setFromMatrix4(world).toArray(transforms,i*9);
  }
  binary('wing-closed.bin',positions);
  binary('wing-transform.bin',transforms);
  for(const [semantic,name] of [['POSITION','position'],['NORMAL','normal'],['JOINTS_0','joints'],['WEIGHTS_0','weights']]) {
    const values=wings.getAttribute(semantic).getArray();
    binary('wing-'+name+'.bin',semantic==='JOINTS_0'?Uint8Array.from(values):Float32Array.from(values));
  }
  binary('wing-fold.bin',Float32Array.from(wings.listTargets()[2].getAttribute('POSITION').getArray()));
  binary('wing-prior-normal.bin',Float32Array.from(wings.listTargets()[1].getAttribute('NORMAL').getArray()));
  const p=reference.getAttribute('POSITION').getArray(),n=reference.getAttribute('NORMAL').getArray();
  const fitted=new Float32Array(p.length),normals=new Float32Array(p.length),normalMatrix=new T.Matrix3().getNormalMatrix(registration);
  for(let i=0;i<p.length;i+=3) {
    point.fromArray(p,i).applyMatrix4(registration).toArray(fitted,i);
    normal.fromArray(n,i).applyMatrix3(normalMatrix).normalize().toArray(normals,i);
  }
  binary('donor-position.bin',fitted);
  binary('donor-normal.bin',normals);
  binary('donor-index.bin',Uint32Array.from(reference.getIndices().getArray()));
  writeFileSync(file('inputs.json'),JSON.stringify(provenance,null,2)+'\n');
  console.log('Exported folded wing and standing reference geometry');
}

function readFloats(name) {
  const b=readFileSync(file(name));
  return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
}

function retainFlightFeathers() {
  const p=wings.getAttribute('POSITION'),joints=wings.getAttribute('JOINTS_0').getArray(),weights=wings.getAttribute('WEIGHTS_0').getArray();
  const amount=new Float32Array(p.getCount());
  for(let i=0;i<amount.length;i++)for(let k=0;k<4;k++)if(joints[i*4+k]>=1&&joints[i*4+k]<=6)amount[i]+=weights[i*4+k];
  const indices=wings.getIndices().getArray(),kept=[];
  const posteriorRoot=new Uint8Array(p.getCount());
  const coordinates=p.getArray();
  for(let i=0;i<p.getCount();i++) {
    posteriorRoot[i]=Number(coordinates[i*3]<-.33&&coordinates[i*3+1]<.47&&Math.abs(coordinates[i*3+2])<.53);
  }
  for(let i=0;i<indices.length;i+=3) {
    const a=indices[i],b=indices[i+1],c=indices[i+2];
    if(Math.max(amount[a],amount[b],amount[c])>.025&&!(posteriorRoot[a]||posteriorRoot[b]||posteriorRoot[c]))kept.push(a,b,c);
  }
  wings.getIndices().setArray(new indices.constructor(kept));
  const corrected=readFloats('wing-corrected-fold.bin');
  if(corrected.length!==p.getCount()*3||!corrected.every(Number.isFinite))throw Error('Folded wing correction is invalid');
  for(let i=0;i<corrected.length;i++)corrected[i]=Math.round(corrected[i]*10000)/10000;
  wings.listTargets()[2].getAttribute('POSITION').setArray(corrected);
  // Recomputed normals are stored in the same bind-space basis as the original.
  const normal=readFloats('wing-corrected-normal.bin');
  for(let i=0;i<normal.length;i++)normal[i]=Math.round(normal[i]*4096)/4096;
  wings.listTargets()[2].getAttribute('NORMAL').setArray(normal);
  wings.getMaterial().setDoubleSided(true);
  compactPrimitive(wings);
  simplifyPrimitive(wings,{simplifier:MeshoptSimplifier,ratio:.65,error:.0007,lockBorder:true});
  wingsNode.setName('Continuous flight feathers');
  wingsNode.getMesh().setName('Continuous flight feathers');
  return wings.getIndices().getCount()/3;
}

async function addBody() {
  const world=readFloats('donor-position.bin'),worldNormal=readFloats('donor-normal.bin');
  const count=world.length/3,point=new T.Vector3(),normal=new T.Vector3();
  const p=new Float32Array(world.length),n=new Float32Array(world.length),folded=new Float32Array(world.length);
  const ids=new Uint8Array(count*4),weights=new Float32Array(count*4);
  const bodyPose=new T.Matrix4().makeRotationZ(STANDING_POSE.pitch).setPosition(STANDING_POSE.x,STANDING_POSE.y,0);
  const pivot=new T.Vector3(...eagleSkeleton()[HEAD].point);
  const headPose=new T.Matrix4().makeTranslation(pivot.x,pivot.y,pivot.z)
    .multiply(new T.Matrix4().makeRotationZ(-.85*STANDING_POSE.pitch))
    .multiply(new T.Matrix4().makeTranslation(-pivot.x,-pivot.y,-pivot.z));
  const mixed=new T.Matrix4(),normalMatrix=new T.Matrix3();
  const prior=new T.Vector3(),extended=new T.Vector3();
  for(let i=0;i<count;i++) {
    const offset=i*3;
    point.fromArray(world,offset);
    const head=smooth(point.y,.665,.828)*smooth(point.x,-.26,-.045);
    ids[i*4]=0;ids[i*4+1]=HEAD;weights[i*4]=1-head;weights[i*4+1]=head;
    mixed.identity();
    const elements=mixed.elements;
    for(let k=0;k<16;k++)elements[k]=elements[k]*(1-head)+headPose.elements[k]*head;
    mixed.premultiply(bodyPose).invert();
    prior.copy(point).applyMatrix4(mixed);
    normalMatrix.getNormalMatrix(mixed);
    normal.fromArray(worldNormal,offset).applyMatrix3(normalMatrix).normalize();
    // Folded coverts settle onto a continuous, narrower mantle as the flight
    // feathers deploy. The head, neck and breast preserve the source contour.
    const back=(1-head)*(1-smooth(prior.x,.16,.32));
    extended.copy(prior);
    const posterior=smooth(-prior.x,.35,.66)*back;
    extended.x=T.MathUtils.lerp(prior.x,-.397+(prior.x+.397)*.18,posterior);
    extended.y=T.MathUtils.lerp(prior.y,.515+(prior.y-.515)*.36,posterior);
    const sideCoverts=smooth(Math.abs(prior.z),.10,.245)*back;
    extended.y=T.MathUtils.lerp(extended.y,.58+(extended.y-.58)*.50,sideCoverts);
    extended.z=T.MathUtils.lerp(prior.z,.143*Math.tanh(prior.z/.143),back);
    extended.toArray(p,offset);
    prior.sub(extended).toArray(folded,offset);
    normal.toArray(n,offset);
  }
  for(let i=0;i<p.length;i++) {
    p[i]=Math.round(p[i]*100000)/100000;
    folded[i]=Math.round(folded[i]*10000)/10000;
    n[i]=Math.round(n[i]*4096)/4096;
  }
  const original=reference.getIndices().getArray(),kept=[];
  const excluded=new Uint8Array(count);
  const referenceUV=reference.getAttribute('TEXCOORD_0').getArray();
  const pigment=await sharp(reference.getMaterial().getBaseColorTexture().getImage()).removeAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=0;i<count;i++) {
    const x=world[i*3],y=world[i*3+1];
    const u=Math.min(pigment.info.width-1,Math.max(0,Math.floor(referenceUV[i*2]*pigment.info.width)));
    const v=Math.min(pigment.info.height-1,Math.max(0,Math.floor(referenceUV[i*2+1]*pigment.info.height)));
    const pixel=(v*pigment.info.width+u)*pigment.info.channels;
    const brightness=.2126*pigment.data[pixel]+.7152*pigment.data[pixel+1]+.0722*pigment.data[pixel+2];
    // The permanent twelve-feather tail uses the existing articulated fan.
    const oldTail=x<-.59&&y<.285;
    const looseWhiteTail=x<-.45&&y<.45&&brightness>148;
    excluded[i]=Number(oldTail||looseWhiteTail);
  }
  for(let i=0;i<original.length;i+=3) {
    const a=original[i],b=original[i+1],c=original[i+2];
    if(!(excluded[a]||excluded[b]||excluded[c]))kept.push(a,b,c);
  }
  const oldMaterial=reference.getMaterial();
  const color=doc.createTexture('Standing reference body and head pigment').setMimeType(oldMaterial.getBaseColorTexture().getMimeType()).setImage(oldMaterial.getBaseColorTexture().getImage());
  const relief=doc.createTexture('Standing reference body and head relief').setMimeType(oldMaterial.getNormalTexture().getMimeType()).setImage(oldMaterial.getNormalTexture().getImage());
  const material=doc.createMaterial('Continuous head neck and body plumage').setBaseColorTexture(color)
    .setNormalTexture(relief).setNormalScale(.20).setRoughnessFactor(.83).setMetallicFactor(0).setDoubleSided(oldMaterial.getDoubleSided());
  const core=doc.createPrimitive().setMaterial(material)
    .setIndices(attribute('Body plumage triangles','SCALAR',new Uint16Array(kept)))
    .setAttribute('POSITION',attribute('Body flight positions','VEC3',p))
    .setAttribute('NORMAL',attribute('Body normals','VEC3',n))
    .setAttribute('TEXCOORD_0',attribute('Body reference UVs','VEC2',Float32Array.from(reference.getAttribute('TEXCOORD_0').getArray())))
    .setAttribute('JOINTS_0',attribute('Body neck and head joints','VEC4',ids))
    .setAttribute('WEIGHTS_0',attribute('Body neck and head weights','VEC4',weights));
  for(const name of ['Tail fan','Folded feather overlap'])core.addTarget(doc.createPrimitiveTarget(name)
    .setAttribute('POSITION',attribute(name+' body delta','VEC3',new Float32Array(world.length))));
  core.addTarget(doc.createPrimitiveTarget('Standing scan contour').setAttribute('POSITION',attribute('Resting mantle contour','VEC3',folded)));
  compactPrimitive(core);
  const mesh=doc.createMesh('Continuous body and head').addPrimitive(core).setWeights([0,0,0])
    .setExtras({targetNames:['Tail fan','Folded feather overlap','Standing scan contour'],standingDonor:true});
  scene.addChild(doc.createNode('Revised bird body').setMesh(mesh).setSkin(skin));
  return kept.length/3;
}

async function pack() {
  const inputs=JSON.parse(readFileSync(file('inputs.json')));
  if(JSON.stringify(inputs)!==JSON.stringify(provenance))throw Error('Source assets changed after preparation');
  for(const node of root.listNodes())if(/ eye (rim|iris|pupil)$/.test(node.getName()))node.dispose();
  const wingFaces=retainFlightFeathers(),bodyFaces=await addBody();
  root.setExtras({...provenance,version:'0.7.27',
    anatomy:'The older standing head, neck and torso re-skinned to the persistent 23-joint rig. Continuous flight feathers deploy from the same shoulders.',
    texture:'Original CC0 body and head pigment, persistent flight feather and tail maps in every pose.',
    groundIncluded:false});
  await doc.transform(prune(),reorder({encoder:MeshoptEncoder,target:'size'}));
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  await io.write(output,doc);
  const bytes=readFileSync(output),manifest={...root.getExtras(),bytes:bytes.length,sha256:digest(bytes),joints:skin.listJoints().length,wingFaces,bodyFaces,
    meshes:root.listMeshes().map(m=>({name:m.getName(),triangles:m.listPrimitives().reduce((sum,p)=>sum+p.getIndices().getCount()/3,0)})),
    maps:root.listTextures().map(t=>({name:t.getName(),bytes:t.getImage().length,sha256:digest(t.getImage())}))};
  if(manifestPath)writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(manifest,null,2));
}

await (mode==='prepare'?prepare():pack());
