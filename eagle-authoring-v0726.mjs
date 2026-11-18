import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression} from '@gltf-transform/extensions';
import {prune,reorder} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';
import {MeshoptDecoder as ViewerDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as T from 'three';
import sharp from 'sharp';
import {prepareUnifiedEagle,animateUnifiedEagle,unifiedEaglePose} from './eagle-motion-v0725.js';
import {eagleSkeleton,TAIL} from './eagle-rig-v0725.js';

const [mode,folder,output='model-bald-eagle-v0726.glb',manifestPath]=process.argv.slice(2);
if (!['prepare','pack'].includes(mode)||!folder) {
  throw Error('Usage: node eagle-authoring-v0726.mjs prepare|pack working-directory [model.glb] [manifest.json]');
}
const donorFile='model-bald-eagle-v0724.glb';
const sourceFile='model-bald-eagle-v0725.glb';
const sourceBytes=readFileSync(sourceFile);
const donorBytes=readFileSync(donorFile);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashes={donorSha256:digest(donorBytes),sourceSha256:digest(sourceBytes)};
const file=name=>join(folder,name);
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
const io=new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({
  'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder
});
const source=await io.read(sourceFile), root=source.getRoot();
const body=root.listNodes().find(node=>node.getName()==='Revised bird body');
const primitive=body.getMesh().listPrimitives()[0];
const buffer=root.listBuffers()[0];
const binary=(name,array)=>writeFileSync(file(name),Buffer.from(array.buffer,array.byteOffset,array.byteLength));

async function prepare() {
  mkdirSync(folder,{recursive:true});
  const donor=await io.read(donorFile);
  const perched=donor.getRoot().listNodes().find(node=>node.getName()==='Rebuilt standing credited folded-wing adult');
  const meta={...hashes};
  for (const [prefix,node] of [['donor',perched],['source',body]]) {
    const p=node.getMesh().listPrimitives()[0], material=p.getMaterial();
    for (const [key,name] of [['POSITION','position'],['NORMAL','normal'],['TEXCOORD_0','uv']]) {
      binary(prefix+'-'+name+'.bin',Float32Array.from(p.getAttribute(key).getArray()));
    }
    binary(prefix+'-index.bin',Uint32Array.from(p.getIndices().getArray()));
    writeFileSync(file(prefix+'-base.jpg'),material.getBaseColorTexture().getImage());
    writeFileSync(file(prefix+'-normal.jpg'),material.getNormalTexture().getImage());
    meta[prefix]={vertices:p.getAttribute('POSITION').getCount(),triangles:p.getIndices().getCount()/3};
  }

  globalThis.self=globalThis;
  globalThis.createImageBitmap=async()=>({width:64,height:64,close(){}});
  const bytes=sourceBytes.buffer.slice(sourceBytes.byteOffset,sourceBytes.byteOffset+sourceBytes.byteLength);
  const gltf=await new GLTFLoader().setMeshoptDecoder(ViewerDecoder).parseAsync(bytes,'');
  const m=prepareUnifiedEagle(gltf,{id:'haliaeetus-leucocephalus'},{eagleVersion:'0.7.25',motionBounds:{}});
  animateUnifiedEagle(m,'stand',0);
  const skin=m.birdRevision.body;
  const {position,skinIndex,skinWeight}=skin.geometry.attributes;
  const posed=new Float32Array(3*position.count), transform=new Float32Array(9*position.count);
  const a=primitive.getAttribute('POSITION').getArray();
  const point=new T.Vector3(), mixed=new T.Matrix4(), world=new T.Matrix4(), linear=new T.Matrix3();
  for (let i=0;i<position.count;i++) {
    if (a[i*3]!==position.getX(i)||a[i*3+1]!==position.getY(i)||a[i*3+2]!==position.getZ(i)) {
      throw Error('Skin vertex order differs from source');
    }
    skin.getVertexPosition(i,point).applyMatrix4(skin.matrixWorld).toArray(posed,i*3);
    mixed.elements.fill(0);
    for (let j=0;j<4;j++) {
      const offset=16*skinIndex.getComponent(i,j);
      const weight=skinWeight.getComponent(i,j);
      for (let k=0;k<16;k++) mixed.elements[k]+=skin.skeleton.boneMatrices[offset+k]*weight;
    }
    world.copy(skin.matrixWorld).multiply(skin.bindMatrixInverse).multiply(mixed).multiply(skin.bindMatrix);
    linear.setFromMatrix4(world).toArray(transform,i*9);
  }
  binary('source-closed.bin',posed);
  binary('source-closed-transform.bin',transform);
  binary('source-joints.bin',Uint8Array.from(skinIndex.array));
  binary('source-weights.bin',Float32Array.from(skinWeight.array));
  binary('source-fold-normals.bin',Float32Array.from(skin.geometry.morphAttributes.normal[1].array));
  writeFileSync(file('manifest.json'),JSON.stringify(meta,null,2)+'\n');
  console.log(JSON.stringify(meta));
}

function delta(name) {
  const data=readFileSync(file(name));
  const arr=new Float32Array(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));
  if (arr.length!==primitive.getAttribute('POSITION').getCount()*3||!arr.every(Number.isFinite)) {
    throw Error('Invalid standing scan displacement '+name);
  }
  // Subpixel quantization keeps the correction small and deterministic.
  const samples=name.endsWith('normal.bin')?2048:10000;
  for (let i=0;i<arr.length;i++) arr[i]=Math.round(arr[i]*samples)/samples;
  return arr;
}

const smooth=T.MathUtils.smoothstep;
const lerp=T.MathUtils.lerp;

function reshapeTailCoverts() {
  const p=primitive.getAttribute('POSITION').getArray();
  const ids=primitive.getAttribute('JOINTS_0').getArray(), weights=primitive.getAttribute('WEIGHTS_0').getArray();
  const fields=primitive.listTargets().flatMap(target=>['POSITION','NORMAL'].map(key=>
    target.getAttribute(key)?.getArray()).filter(Boolean));
  for (let i=0;i<p.length/3;i++) {
    let tail=0;
    for (let j=0;j<4;j++) if (ids[i*4+j]===TAIL) tail+=weights[i*4+j];
    const k=i*3, x=p[k],y=p[k+1],z=p[k+2];
    const tuck=smooth(tail,.18,.68)*smooth(-x,.303,.447);
    const rump=smooth(-x,.21,.287)*(1-smooth(-x,.372,.459))*
      smooth(y,.332,.373)*(1-smooth(y,.419,.474))*(1-smooth(Math.abs(z),.277,.42));
    p[k]=lerp(x,-.354+(x+.40)*.19,tuck);
    p[k+1]=lerp(y,.494+(y-.376)*.25,tuck)+.030*rump;
    p[k+2]=lerp(z,z*.20,tuck);
    for (const values of fields) {
      for (let n=k;n<k+3;n++) values[n]*=1-.97*tuck;
    }
  }
}

function normalsFor(position,indices) {
  const normals=new Float32Array(position.length);
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  for (let i=0;i<indices.length;i+=3) {
    const j=indices[i]*3,k=indices[i+1]*3,l=indices[i+2]*3;
    a.fromArray(position,j); b.fromArray(position,k).sub(a); c.fromArray(position,l).sub(a);
    b.cross(c);
    for(const offset of [j,k,l]) {
      normals[offset]+=b.x; normals[offset+1]+=b.y; normals[offset+2]+=b.z;
    }
  }
  for(let i=0;i<normals.length;i+=3) a.fromArray(normals,i).normalize().toArray(normals,i);
  return normals;
}

async function addRectrices() {
  const bodyPose=unifiedEaglePose('stand',0);
  const pivot=new T.Vector3(...eagleSkeleton()[TAIL].point);
  const position=new T.Matrix4().makeTranslation(bodyPose.x,bodyPose.y,0);
  const unpose=position.multiply(new T.Matrix4().makeRotationZ(bodyPose.pitch))
    .multiply(new T.Matrix4().makeTranslation(pivot.x,pivot.y,pivot.z))
    .multiply(new T.Matrix4().makeRotationZ(bodyPose.tailPitch))
    .multiply(new T.Matrix4().makeTranslation(-pivot.x,-pivot.y,-pivot.z)).invert();
  const positions=[], closed=[], uv=[], index=[], expansion=[];
  const joints=[], weights=[];
  const rows=26,cols=8, size=(rows+1)*(cols+1);
  const p=new T.Vector3(), final=new T.Vector3();

  function featherPoint(u,edge,r,side,packed,out) {
    const outer=Math.abs(r), lateral=r*.053;
    const rootX=packed?-.525:-.342, rootY=packed?.326:.427;
    const tipX=packed?-.826+.044*outer**1.65:-.731+.077*outer**1.65;
    const tipY=packed?.177-.013*outer:.328-.021*outer;
    const tipZ=r*(packed?.089:.279);
    const duX=tipX-rootX,duZ=tipZ-lateral;
    const direction=Math.hypot(duX,duZ);
    const t=u-.092*u**9*edge**2;
    const wide=(.015+.025*smooth(t,.08,.58)-.004*smooth(t,.78,1))*(packed?.62:1);
    const layer=(1-outer)*(.011+.019*smooth(t,.17,.75))+.0014*r;
    const featherY=lerp(rootY,tipY,t)+.021*Math.sin(Math.PI*t)+layer-.009*edge*edge;
    out.set(lerp(rootX,tipX,t)+duZ/direction*wide*edge,
      featherY+side*(.0013+.0022*(1-t)),
      lerp(lateral,tipZ,t)-duX/direction*wide*edge);
  }

  for (let feather=0;feather<12;feather++) {
    const offset=positions.length/3, r=(feather-5.5)/5.5;
    for (let side=0;side<2;side++) for (let i=0;i<=rows;i++) for (let j=0;j<=cols;j++) {
      const u=i/rows, edge=2*j/cols-1;
      featherPoint(u,edge,r,side===0?1:-1,false,p);
      featherPoint(u,edge,r,side===0?1:-1,true,final);
      positions.push(...p);
      const fan=.26*p.z*smooth(u,.13,1);
      expansion.push(0,0,fan);
      final.applyMatrix4(unpose);
      closed.push(final.x,final.y,final.z+.45*fan);
      uv.push(j/cols,u);
      joints.push(TAIL,0,0,0);
      weights.push(1,0,0,0);
    }
    for (let side=0;side<2;side++) for (let i=0;i<rows;i++) for (let j=0;j<cols;j++) {
      const a=offset+side*size+i*(cols+1)+j,b=a+1,c=a+cols+1,d=c+1;
      if(side===0) index.push(a,c,b,b,c,d);
      else index.push(a,b,c,b,d,c);
    }
    const edges=[
      Array.from({length:rows+1},(_,i)=>i*(cols+1)),
      Array.from({length:cols+1},(_,i)=>rows*(cols+1)+i),
      Array.from({length:rows+1},(_,i)=>(rows-i)*(cols+1)+cols),
      Array.from({length:cols+1},(_,i)=>cols-i)
    ];
    for(const edge of edges) for(let i=0;i<edge.length-1;i++){
      const a=offset+edge[i],b=offset+edge[i+1];
      index.push(a,b,a+size,b,b+size,a+size);
    }
  }
  const access=(name,type,array)=>source.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
  const normal=normalsFor(positions,index);
  const n2=normalsFor(closed,index);
  const pigment=source.createTexture('Rectrix pigment derived from standing scan').setMimeType('image/jpeg')
    .setImage(readFileSync(file('rectrix-pigment.jpg')));
  const material=source.createMaterial('Matte adult white tail feathers').setBaseColorTexture(pigment)
    .setMetallicFactor(0).setRoughnessFactor(.87);
  const feathers=source.createPrimitive().setMaterial(material).setIndices(access('Rectrix triangles','SCALAR',new Uint16Array(index)))
    .setAttribute('POSITION',access('Rectrix positions','VEC3',new Float32Array(positions)))
    .setAttribute('NORMAL',access('Rectrix normals','VEC3',normal))
    .setAttribute('TEXCOORD_0',access('Rectrix texture coordinates','VEC2',new Float32Array(uv)))
    .setAttribute('JOINTS_0',access('Tail joint','VEC4',new Uint8Array(joints)))
    .setAttribute('WEIGHTS_0',access('Tail weights','VEC4',new Float32Array(weights)));
  feathers.addTarget(source.createPrimitiveTarget('Tail fan').setAttribute('POSITION',
    access('Tail fan','VEC3',new Float32Array(expansion))));
  feathers.addTarget(source.createPrimitiveTarget('Folded feather overlap').setAttribute('POSITION',
    access('Fixed tail under the folded wing','VEC3',new Float32Array(positions.length))));
  feathers.addTarget(source.createPrimitiveTarget('Standing scan contour')
    .setAttribute('POSITION',access('Narrow standing fan','VEC3',Float32Array.from(closed,(x,i)=>x-positions[i])))
    .setAttribute('NORMAL',access('Folded rectrix normals','VEC3',n2.map((x,i)=>x-normal[i]))));
  const mesh=source.createMesh('Adult tail rectrices').addPrimitive(feathers).setWeights([0,0,0])
    .setExtras({targetNames:['Tail fan','Folded feather overlap','Standing scan contour'],feathers:12});
  const scene=root.getDefaultScene()||root.listScenes()[0];
  scene.addChild(source.createNode('Adult tail rectrices').setMesh(mesh).setSkin(body.getSkin()));
}

async function pack() {
  const inputs=JSON.parse(readFileSync(file('manifest.json')));
  if (inputs.donorSha256!==hashes.donorSha256||inputs.sourceSha256!==hashes.sourceSha256) {
    throw Error('Geometry and textures must be baked from these exact source models');
  }
  const scan=source.createPrimitiveTarget('Standing scan contour');
  for (const [semantic,name] of [['POSITION','standing-scan-position.bin'],['NORMAL','standing-scan-normal.bin']]) {
    scan.setAttribute(semantic,source.createAccessor(name).setType('VEC3').setArray(delta(name)).setBuffer(buffer));
  }
  primitive.addTarget(scan);
  const mesh=body.getMesh();
  mesh.setWeights([0,0,0]).setExtras({...mesh.getExtras(),targetNames:['Tail fan','Folded feather overlap','Standing scan contour']});
  reshapeTailCoverts();
  await addRectrices();
  const material=primitive.getMaterial();
  const color=material.getBaseColorTexture(), normals=material.getNormalTexture();
  color.setName('Standing scan feather pigment across all poses').setImage(await sharp(file('shared-feather-color.jpg'))
    .jpeg({quality:90,mozjpeg:true,chromaSubsampling:'4:4:4'}).toBuffer());
  normals.setName('Flight relief with plumage microdetail').setImage(await sharp(file('shared-feather-normal.jpg'))
    .resize({width:1408,withoutEnlargement:true}).jpeg({quality:86,mozjpeg:true,chromaSubsampling:'4:4:4'}).toBuffer());
  material.setNormalScale(.24);
  root.setExtras({...root.getExtras(),...hashes,version:'0.7.26',
    sourceFile,donorFile,standingReference:'Grab3D Eagle CC0 1.0, prepared standing mesh and atlas in v0.7.24',
    materialScope:'Standing-scan pigment baked into the persistent model atlas, blended with existing flight feather definition',
    shapeScope:'Scan-fitted contour applied as a corrective morph during the final wing fold. One skinned fan of twelve layered tail feathers.'});
  await source.transform(prune(),reorder({encoder:MeshoptEncoder,target:'size'}));
  source.createExtension(EXTMeshoptCompression).setRequired(true)
    .setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  await io.write(output,source);
  const bytes=readFileSync(output);
  const manifest={...root.getExtras(),bytes:bytes.length,sha256:digest(bytes),
    joints:root.listSkins()[0].listJoints().length,
    meshes:root.listMeshes().map(m=>({name:m.getName(),triangles:m.listPrimitives().reduce((sum,p)=>sum+p.getIndices().getCount()/3,0)})),
    maps:root.listTextures().map(map=>({name:map.getName(),sha256:digest(map.getImage()),bytes:map.getImage().length}))};
  if (manifestPath) writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(manifest,null,2));
}

await (mode==='prepare'?prepare():pack());
