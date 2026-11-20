import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Document,NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression} from '@gltf-transform/extensions';
import {prune,reorder} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';
import {Vector3} from 'three';

const folder='anatomy-assets-v0728';
const sourceFile='research-cache/anatomy-v0728/source/allen-human-571430815.swc';
const text=readFileSync(sourceFile,'utf8');
const points=text.split(/\r?\n/).filter(line=>line.trim()&&!line.startsWith('#')).map(line=>line.trim().split(/\s+/).map(Number));
const lookup=new Map(points.map(row=>[row[0],row]));
const soma=points.find(row=>row[1]===1&&row[6]===-1);
if(!soma||points.some(row=>row.length!==7||row.some(n=>!Number.isFinite(n))))throw Error('Malformed neuron reconstruction');
const catalog=JSON.parse(readFileSync(folder+'/human-anatomy-catalog-v0728.json'));
catalog.layers=catalog.layers.filter(l=>l.id!=='neuron');
catalog.structures=catalog.structures.filter(s=>s.id!=='allen-571430815');
const index=Math.max(...catalog.structures.map(s=>s.index))+1;
const position=[],normal=[],color=[],triangles=[],tracePosition=[],traceColor=[];
const a=new Vector3(),b=new Vector3(),direction=new Vector3(),u=new Vector3(),v=new Vector3(),point=new Vector3();
const sides=6;
const colors={2:[.85,.42,.08],3:[.12,.50,.43],4:[.23,.67,.60]};
for(const row of points){
  if(row[6]===-1)continue;
  const parent=lookup.get(row[6]);
  if(!parent)throw Error('Neuron parent is missing');
  a.set(parent[2]-soma[2],parent[3]-soma[3],parent[4]-soma[4]);
  b.set(row[2]-soma[2],row[3]-soma[3],row[4]-soma[4]);
  direction.copy(b).sub(a);
  if(direction.lengthSq()<1e-12)continue;
  direction.normalize();
  u.set(0,0,1);if(Math.abs(direction.z)>.9)u.set(0,1,0);
  u.cross(direction).normalize();v.crossVectors(direction,u).normalize();
  const offset=position.length/3,tint=colors[row[1]]||[.45,.5,.5];
  tracePosition.push(...a,...b);traceColor.push(...tint,...tint);
  for(const[end,radius]of [[a,parent[5]],[b,row[5]]])for(let j=0;j<sides;j++){
    const angle=j/sides*Math.PI*2;
    const n=u.clone().multiplyScalar(Math.cos(angle)).addScaledVector(v,Math.sin(angle));
    point.copy(end).addScaledVector(n,radius);
    position.push(...point);normal.push(...n);color.push(...tint);
  }
  for(let j=0;j<sides;j++){
    const next=(j+1)%sides;
    triangles.push(offset+j,offset+sides+j,offset+next,offset+next,offset+sides+j,offset+sides+next);
  }
}
// The measured soma radius uses the same micrometre coordinate system.
const ring=12,stacks=8,offset=position.length/3;
for(let i=0;i<=stacks;i++)for(let j=0;j<=ring;j++){
  const latitude=i/stacks*Math.PI,longitude=j/ring*Math.PI*2;
  const n=[Math.sin(latitude)*Math.cos(longitude),Math.cos(latitude),Math.sin(latitude)*Math.sin(longitude)];
  position.push(...n.map(v=>v*soma[5]));normal.push(...n);color.push(.83,.68,.26);
}
for(let i=0;i<stacks;i++)for(let j=0;j<ring;j++){
  const a=offset+i*(ring+1)+j,b=a+ring+1;
  triangles.push(a,b,a+1,a+1,b,b+1);
}
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
const io=new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene('Human cortical neuron microscopy');
const attribute=(name,type,values)=>doc.createAccessor(name).setType(type).setArray(values).setBuffer(buffer);
const material=doc.createMaterial('SWC compartments, instructional colour').setRoughnessFactor(.62).setMetallicFactor(0).setDoubleSided(true);
const primitive=doc.createPrimitive().setMaterial(material).setIndices(attribute('SWC tube triangles','SCALAR',new Uint32Array(triangles)))
  .setAttribute('POSITION',attribute('Measured positions in micrometres','VEC3',new Float32Array(position)))
  .setAttribute('NORMAL',attribute('Compartment surface normals','VEC3',new Float32Array(normal)))
  .setAttribute('COLOR_0',attribute('SWC compartment colours','VEC3',new Float32Array(color)))
  .setAttribute('_STRUCTURE',attribute('Source specimen index','SCALAR',new Uint16Array(position.length/3).fill(index)));
scene.addChild(doc.createNode('Human cortical neuron 571430815').setMesh(doc.createMesh('Human cortical neuron 571430815').addPrimitive(primitive)));
// A one-pixel guide makes subpixel branches legible at low magnification.
// The adjacent triangle surface retains the measured SWC tube radii.
const guideMaterial=doc.createMaterial('One-pixel morphology guide').setBaseColorFactor([1,1,1,1]);
const guide=doc.createPrimitive().setMode(1).setMaterial(guideMaterial)
  .setAttribute('POSITION',attribute('SWC centreline in micrometres','VEC3',new Float32Array(tracePosition)))
  .setAttribute('COLOR_0',attribute('Compartment guide colours','VEC3',new Float32Array(traceColor)));
scene.addChild(doc.createNode('One-pixel traced morphology guide').setMesh(doc.createMesh('SWC trace guide').addPrimitive(guide)));
const sourceUrl='https://api.brain-map.org/api/v2/well_known_file_download/584238112';
doc.getRoot().setExtras({species:'Homo sapiens',specimenId:571430815,region:'Middle temporal gyrus, cortical layer 3',units:'micrometres',
  sourceUrl,sourceSha256:createHash('sha256').update(readFileSync(sourceFile)).digest('hex'),
  source:'Allen Cell Types Database, Allen Institute for Brain Science',sourceNodes:points.length,sourceSomaRadius:soma[5],
  placement:'Independent cell reconstruction. The whole-body atlas position is an illustrative cortical anchor and is not a measured registration.',
  license:'Allen Institute Terms of Use, research and noncommercial use',licenseUrl:'https://alleninstitute.org/legal/terms-of-use'});
await doc.transform(prune(),reorder({encoder:MeshoptEncoder,target:'size'}));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
const file='human-neuron-v0728.glb';await io.write(folder+'/'+file,doc);
const bytes=readFileSync(folder+'/'+file),sha256=createHash('sha256').update(bytes).digest('hex');
const layer={id:'neuron',label:'Cortical neuron',file,bytes:bytes.length,sha256,structures:1,triangles:triangles.length/3,sourceNodes:points.length,units:'micrometres'};
catalog.layers.push(layer);
catalog.structures.push({index,id:'allen-571430815',name:'Human cortical neuron - specimen 571430815',sourceName:'Allen Cell Types specimen 571430815',
  system:'neuron',region:'head-neck',side:null,triangles:triangles.length/3,sourceNodes:points.length,
  source:'Allen Cell Types Database',sourceUrl,license:'Allen Institute Terms of Use - research and noncommercial use',
  evidence:'Measured SWC morphology from middle temporal gyrus, layer 3. Separate source specimen. Cortical placement within this body is illustrative.',
  compartmentColours:{axon:'orange',basalDendrites:'teal',apicalDendrites:'light teal',soma:'gold'},scale:'Geometry in micrometres. Source sample is shown at its physical size.'});
const catalogBytes=Buffer.from(JSON.stringify(catalog));writeFileSync(folder+'/human-anatomy-catalog-v0728.json',catalogBytes);
const delivery=JSON.parse(readFileSync('anatomy-delivery-v0728.json'));delivery.layers=delivery.layers.filter(l=>l.id!=='neuron');delivery.layers.push(layer);
delivery.catalog={file:'human-anatomy-catalog-v0728.json',bytes:catalogBytes.length,sha256:createHash('sha256').update(catalogBytes).digest('hex')};
writeFileSync('anatomy-delivery-v0728.json',JSON.stringify(delivery,null,2)+'\n');
console.log('Human neuron',points.length,'source nodes',triangles.length/3,'surface triangles',bytes.length,'bytes');
