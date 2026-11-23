import {loadHumanExterior} from './specimen-exteriors.js';
import {attachScapularPivot,switchShoulderBinding} from './human-shoulder.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import delivery from './anatomy-delivery-v0728.json' with {type:'json'};
import {anatomyPose,ANATOMY_DURATION} from './anatomy-rig-v0728.js';

export const ANATOMY_ID='homo-sapiens';
export const anatomyPresets={
  overview:{surface:1},
  xray:{surface:.08,skeleton:.32,organs:1,cns:1},
  bones:{surface:.06,skeleton:1},
  muscles:{surface:.04,muscles:1,skeleton:.15,connective:.55},
  organs:{surface:.04,skeleton:.12,organs:1},
  neural:{surface:.035,cns:1,nerves:1,senses:1},
  circulation:{surface:.035,arteries:1,veins:1,lymphatic:1,organs:.12},
  connective:{surface:.04,skeleton:.18,connective:1,attachments:1},
  neuron:{neuron:1}
};
const V=()=>new T.Vector3();
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
function assetURL(file){
  const local=import.meta.env?.DEV&&delivery.baseUrl.startsWith('https:');
  return new URL((local?'./anatomy-assets-v0728/':delivery.baseUrl)+file,new URL(import.meta.env?.BASE_URL||'./',location.href)).href;
}
async function checkedFile(spec,signal){
  const response=await fetch(assetURL(spec.file),{signal});
  if(!response.ok)throw Error('Anatomy download returned '+response.status);
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength!==spec.bytes||await sha(bytes)!==spec.sha256)throw Error('Anatomy file integrity check failed: '+spec.file);
  return bytes;
}

// Group triangles by their stable source identifier once. Individual visibility
// then changes only the index buffer; source vertices and skinning stay intact.
export function indexAnatomyMesh(mesh){
  const g=mesh.geometry,id=g.getAttribute('_structure')||g.getAttribute('_STRUCTURE');
  if(!id||!g.index)throw Error('Anatomical component identifiers are missing');
  const src=g.index.array,counts=new Map();
  for(let i=0;i<src.length;i+=3){
    const n=id.getX(src[i]);
    if(n!==id.getX(src[i+1])||n!==id.getX(src[i+2]))throw Error('A triangle crosses anatomical component identifiers');
    counts.set(n,(counts.get(n)||0)+3);
  }
  const spans=new Map();let offset=0;
  for(const[n,count]of counts){spans.set(n,{offset,count,cursor:offset});offset+=count;}
  const grouped=new src.constructor(src.length);
  for(let i=0;i<src.length;i+=3){const span=spans.get(id.getX(src[i]));grouped.set(src.subarray(i,i+3),span.cursor);span.cursor+=3;}
  for(const span of spans.values())delete span.cursor;
  src.set(grouped);g.index.needsUpdate=true;g.setDrawRange(0,src.length);
  const color=g.getAttribute('color');
  return {mesh,id,spans,grouped,baseColors:color?.array.slice()};
}
export function filterAnatomyMesh(batch,hidden,isolate=null){
  const index=batch.mesh.geometry.index;let length=0;
  for(const[id,span]of batch.spans){
    if(hidden.has(id)||isolate!==null&&id!==isolate)continue;
    index.array.set(batch.grouped.subarray(span.offset,span.offset+span.count),length);length+=span.count;
  }
  batch.mesh.geometry.setDrawRange(0,length);index.needsUpdate=true;
  return length/3;
}
function appearance(batch,opacity,plane){
  const mesh=batch.mesh,material=mesh.material;
  mesh.visible=opacity>0;
  material.opacity=opacity;material.transparent=opacity<.99;
  material.depthWrite=opacity>=.99;material.side=T.DoubleSide;
  material.clippingPlanes=plane?[plane]:[];
  material.needsUpdate=true;mesh.renderOrder=opacity<.99?2:0;
}
function updateLayers(m){
  const a=m.anatomyRevision;
  const outside=a.preset==='overview';
  if(a.cover)a.cover.visible=outside;
  for(const[id,batch]of a.batches){
    appearance(batch,outside?0:a.opacities[id]||0,a.section===null?null:a.plane);
    const triangles=filterAnatomyMesh(batch,a.hidden,a.isolate);
    for(const guide of batch.guides||[])guide.visible=!outside&&(a.opacities[id]||0)>0&&triangles>0;
  }
}
function notify(m){m.anatomyRevision.onChange?.();}
function highlight(m){
  const a=m.anatomyRevision;
  for(const batch of a.batches.values()){
    const color=batch.mesh.geometry.getAttribute('color');
    if(!color||!batch.baseColors)continue;
    color.array.set(batch.baseColors);
    const span=batch.spans.get(a.selected);
    if(span)for(let i=span.offset;i<span.offset+span.count;i++){const vertex=batch.grouped[i];color.setXYZ(vertex,.95,.65,.18);}
    color.needsUpdate=true;
  }
}
export async function loadHumanAnatomy(species,exteriorLoader=loadHumanExterior){
  const abort=new AbortController();
  const bytes=await checkedFile(delivery.catalog,abort.signal);
  const catalog=JSON.parse(new TextDecoder().decode(bytes));
  const root=new T.Group();root.name='Human anatomy atlas';
  root.userData={hideStudioGround:true,anatomyVersion:'0.7.28',staticLocalBounds:{min:[-.37,0,-.55],max:[.35,1.89,.55]},
    anatomyScope:'Reference atlas; shared authored joint motion. No tissue mechanics, blood flow or neural activity simulation.',
    license:'Clothed exterior: Microsoft Rocketbox MIT. Atlas: Z-Anatomy CC BY-SA 4.0; BodyParts3D CC BY-SA 2.1 Japan; component notices and Allen data terms apply.'};
  const m={id:species.id,kind:'human',root,natural:true,forward:1,textured:true,asset:species.modelAsset,
    features:[new T.Vector3(0,1.7,0),new T.Vector3(0,1.31,0),new T.Vector3(0,.95,0)],
    movementStudy:{duration:0},motionBounds:{},current:'observe'};
  const a=m.anatomyRevision={catalog,records:new Map(catalog.structures.map(r=>[r.index,r])),abort,batches:new Map(),pending:new Map(),errors:{},opacities:{...anatomyPresets.overview},
    hidden:new Set(),selected:null,isolate:null,section:null,plane:new T.Plane(new T.Vector3(-1,0,0),0),bones:null,rest:null,
    preset:'overview',microscopy:false,onChange:null};
  root.userData.disposeAnatomy=()=>{abort.abort();a.onChange=null;};
  await loadAnatomyLayer(m,'surface');
  a.cover=await exteriorLoader(a.skeleton);root.add(a.cover);
  // Additional atlas layers load when the visitor opens an anatomy view.
  for(const action of ['observe','stand','elbow','shoulder','knee'])m.motionBounds[action]=new T.Box3(new T.Vector3(-.4,0,-.6),new T.Vector3(.7,1.91,.6));
  animateAnatomy(m,'observe',0);return m;
}
export async function loadAnatomyLayer(m,id){
  const a=m.anatomyRevision;
  if(a.batches.has(id))return a.batches.get(id);
  if(a.pending.has(id))return a.pending.get(id);
  const spec=delivery.layers.find(layer=>layer.id===id);
  if(!spec)throw Error('Unknown anatomy layer');
  const pending=(async()=>{
    try{
      delete a.errors[id];
      const bytes=await checkedFile(spec,a.abort.signal);
      const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const gltf=await loader.parseAsync(bytes,assetURL(''));
      if(a.abort.signal.aborted){gltf.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});throw new DOMException('Anatomy view closed','AbortError');}
      let mesh;gltf.scene.traverse(o=>{if(o.isMesh)mesh=o;});
      if(!mesh)throw Error('Anatomical surfaces are missing');
      if(id==='neuron'){
        // Real cell units are micrometres. The cortical anchor is illustrative;
        // this separate specimen is never claimed to be registered to the atlas.
        const anchor=new T.Group();anchor.name='Illustrative cortical anchor';
        anchor.position.set(-.014,.021,.04);anchor.scale.setScalar(1e-6);
        a.bones[4].add(anchor);anchor.add(gltf.scene);
        mesh.material=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
      }else if(!a.bones){
        m.root.add(gltf.scene);a.skeleton=attachScapularPivot(mesh);a.bones=a.skeleton.bones;
        a.rest=a.bones.map(b=>b.quaternion.clone());
      }else{
        m.root.add(mesh);mesh.bind(a.skeleton,new T.Matrix4());
      }
      mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
      mesh.userData.anatomyLayer=id;
      const batch=indexAnatomyMesh(mesh);
      if(id==='neuron'){batch.guides=[];gltf.scene.traverse(o=>{if(o.isLineSegments){o.material=new T.LineBasicMaterial({vertexColors:true,toneMapped:false});batch.guides.push(o);}});}
      a.batches.set(id,batch);switchShoulderBinding(batch,m.current==='shoulder',a.records);
      updateLayers(m);highlight(m);return batch;
    }catch(error){if(error.name!=='AbortError')a.errors[id]=String(error.message||error);throw error;}
    finally{a.pending.delete(id);notify(m);}
  })();
  a.pending.set(id,pending);notify(m);return pending;
}
export function animateAnatomy(m,action,time){
  const a=m.anatomyRevision,p=anatomyPose(action,time);
  m.current=action;m.movementStudy.duration=p.duration;
  for(const batch of a.batches?.values()||[])switchShoulderBinding(batch,action==='shoulder',a.records);
  a.bones.forEach((bone,i)=>bone.quaternion.copy(a.rest[i]));
  for(const[i,x,y,z]of p.turns)a.bones[i].rotation.set(x,y,z);
  m.root.userData.movementStudy={stage:p.stage,time:p.time,duration:p.duration};
  m.root.updateMatrixWorld(true);a.skeleton.update();
}
export function anatomyState(m){
  const a=m?.anatomyRevision;if(!a)return null;
  return {version:'0.7.28',preset:a.preset,selected:a.selected,isolate:a.isolate,section:a.section,
    microscopy:a.microscopy,opacities:{...a.opacities},hidden:[...a.hidden],loaded:[...a.batches.keys()],loading:[...a.pending.keys()],errors:{...a.errors},
    catalog:a.catalog,stage:m.root.userData.movementStudy?.stage};
}
export async function changeAnatomy(m,change){
  const a=m.anatomyRevision;
  if(change.preset){
    if(!anatomyPresets[change.preset])return;
    a.preset=change.preset;a.opacities={...anatomyPresets[change.preset]};a.isolate=null;a.hidden.clear();
    a.section=null;a.selected=null;a.microscopy=change.preset==='neuron';
    if(a.microscopy)a.selected=a.catalog.structures.find(s=>s.system==='neuron').index;
  }
  if(a.preset==='overview'&&(change.layer||change.structure!==undefined||change.isolate!=null||change.section!=null||change.exterior<1)){
    a.preset='custom';a.opacities={...anatomyPresets.xray};
  }
  if(change.layer){a.preset='custom';a.opacities[change.layer]=Math.max(0,Math.min(1,change.opacity??1));if(change.layer!=='neuron'&&a.opacities[change.layer]>0)a.microscopy=false;}
  if(change.exterior!==undefined)a.opacities.surface=Math.max(0,Math.min(1,change.exterior));
  if(change.select!==undefined){a.selected=change.select;if(a.isolate!==change.select)a.isolate=null;if(a.catalog.structures.find(r=>r.index===change.select)?.system!=='neuron')a.microscopy=false;highlight(m);}
  if(change.structure!==undefined){
    if(change.visible)a.hidden.delete(change.structure);else a.hidden.add(change.structure);
  }
  if(change.isolate!==undefined){a.isolate=change.isolate;const record=a.catalog.structures.find(r=>r.index===change.isolate);if(record)a.opacities[record.system]=1;}
  if(change.section!==undefined){a.section=change.section;if(a.section!==null)a.plane.constant=a.section;}
  if(change.restore){a.hidden.clear();a.isolate=null;}
  updateLayers(m);notify(m);
  await Promise.all(Object.entries(a.opacities).filter(([,opacity])=>opacity>0).map(([id])=>loadAnatomyLayer(m,id)));
  updateLayers(m);highlight(m);notify(m);
  return anatomyState(m);
}
export function pickAnatomy(m,hits){
  const a=m.anatomyRevision;
  if(a.preset==='overview')return null;
  const visible=hits.filter(hit=>hit.object.userData.anatomyLayer&&hit.object.visible&&hit.object.material.opacity>.16&&hit.face);
  if(!visible.length)return null;
  const hit=visible[0],attr=hit.object.geometry.getAttribute('_structure');
  return attr?attr.getX(hit.face.a):null;
}
export function anatomyFocusBounds(m,index){
  const a=m.anatomyRevision,record=a.catalog.structures.find(r=>r.index===index),batch=record&&a.batches.get(record.system);
  if(!batch)return null;
  const span=batch.spans.get(index);if(!span)return null;
  m.root.updateMatrixWorld(true);a.skeleton.update();
  const box=new T.Box3(),point=V();
  for(let i=span.offset;i<span.offset+span.count;i++)box.expandByPoint(batch.mesh.getVertexPosition(batch.grouped[i],point).applyMatrix4(batch.mesh.matrixWorld));
  return box;
}
export function anatomyExportMetadata(m){
  const a=m.anatomyRevision;
  return {viewerVersion:'0.7.28',fidelity:'Source-derived anatomical atlas with display reduction and authored joint controls',
    licenseUrl:'https://www.canopico.tech/phenovoxel/anatomy-notices-v0728.txt',physiologicalValidation:false,
    exterior:a.preset==='overview'?a.cover.userData:undefined,
    anatomy:{sourceCommit:a.catalog.sourceCommit,referenceSex:a.catalog.referenceSex,catalog:delivery.baseUrl+delivery.catalog.file,
      catalogSha256:delivery.catalog.sha256,loadedLayers:delivery.layers.filter(l=>a.batches.has(l.id)),
      opacities:{...a.opacities},hiddenStructures:[...a.hidden],isolatedStructure:a.isolate,
      motionScope:a.catalog.motionScope,neuronScope:'Independent Allen specimen 571430815. Micrometre source coordinates with 1e-6 scene scaling; body anchor illustrative.'}};
}
export function trimAnatomyExport(mesh){
  const geometry=mesh.geometry;
  if(!geometry?.index||!Number.isFinite(geometry.drawRange.count))return;
  const {start,count}=geometry.drawRange;
  // GLTFExporter omits empty index accessors. Leaving such a mesh visible
  // would reinterpret its full vertex buffer as non-indexed triangles.
  if(count===0){mesh.visible=false;return;}
  const original=geometry.index.array,indices=original.slice(start,start+count);
  if(count<original.length){
    const mapping=new Int32Array(geometry.attributes.position.count).fill(-1),used=[];
    for(let i=0;i<indices.length;i++){
      const old=indices[i];if(mapping[old]<0){mapping[old]=used.length;used.push(old);}indices[i]=mapping[old];
    }
    for(const[name,attribute]of Object.entries(geometry.attributes)){
      const source=attribute.isInterleavedBufferAttribute?attribute.data.array:attribute.array;
      const stride=attribute.isInterleavedBufferAttribute?attribute.data.stride:attribute.itemSize;
      const offset=attribute.isInterleavedBufferAttribute?attribute.offset:0;
      const values=new source.constructor(used.length*attribute.itemSize);
      for(let i=0;i<used.length;i++)for(let k=0;k<attribute.itemSize;k++)values[i*attribute.itemSize+k]=source[used[i]*stride+offset+k];
      const copy=new T.BufferAttribute(values,attribute.itemSize,attribute.normalized);copy.name=attribute.name;copy.gpuType=attribute.gpuType;
      geometry.setAttribute(name,copy);
    }
  }
  geometry.setIndex(new T.BufferAttribute(indices,1));
  geometry.setDrawRange(0,count);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
}
export {delivery as anatomyDelivery,ANATOMY_DURATION};
