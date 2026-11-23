import {mouseMuseumExterior} from './mouse-museum-coat.js';
import {mouseExteriorIds,mouseCoatTextures,coatSurface} from './specimen-exteriors.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

const atlasURL=new URL('./mouse-atlas-v0729.glb',import.meta.url).href;
const neuronURL=new URL('./mouse-nmo130632.swc.txt',import.meta.url).href;
const cellSource='https://neuromorpho.org/api/neuron/id/130632';
export {cellSource};

// Apply identical displacement to coincident surface and internal tail points.
// All other vertices remain at their deposited positions.
export function tailOffset(x,y){
  const d=Math.max(0,y-.087);
  const u=Math.min(1,d/.054);
  const angle=.38*u*u*(3-2*u);
  const lateral=x-.018;
  return [(Math.cos(angle)-1)*lateral-Math.sin(angle)*d,Math.sin(angle)*lateral+(Math.cos(angle)-1)*d];
}
export async function loadMouseAtlas(s){
  const [gltf,{default:catalog},maps]=await Promise.all([
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(atlasURL),import('./mouse-anatomy-catalog.json'),mouseCoatTextures()
  ]);
  const mouseStructures=catalog.structures,records=new Map(mouseStructures.map(r=>[r.id,r]));
  const root=new T.Group(),body=gltf.scene;
  // Native y runs towards the tail, z dorsally. Present dorsal up and the nose left.
  body.quaternion.setFromRotationMatrix(new T.Matrix4().set(0,1,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,1));
  body.scale.setScalar(31);body.position.set(-2.15,.45,-.57);
  root.add(body);root.userData.hideStudioGround=true;
  const parts=new Map(),moving=[];
  body.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const r=records.get(mesh.userData.structureId);
    if(!r)throw Error('Mouse component missing its source ID');
    parts.set(r.id,mesh);
    mesh.material=new T.MeshStandardMaterial({color:r.color,roughness:.76,side:T.DoubleSide});
    if(r.id==='living:tail')coatSurface(mesh,true,maps[1]);
    if(r.id==='living:eyes'){mesh.material.color.set('#221b18');mesh.material.roughness=.18;}
    const p=mesh.geometry.attributes.position; mesh.geometry.computeBoundingBox();
    if(r.id.includes('tail')&&mesh.geometry.boundingBox.max.y>.087){
      const offsets=new Float32Array(p.count*3);
      for(let i=0;i<p.count;i++){const [dx,dy]=tailOffset(p.getX(i),p.getY(i));offsets[3*i]=dx;offsets[3*i+1]=dy;}
      mesh.geometry.morphTargetsRelative=true;
      mesh.geometry.morphAttributes.position=[new T.BufferAttribute(offsets,3)];mesh.updateMorphTargets();moving.push(mesh);
    }
  });
  if(parts.size!==records.size)throw Error('Mouse component count mismatch');
  const exterior=mouseMuseumExterior(parts,maps[0]);
  for(const group of exterior.values())body.add(group);
  const shafts=[];exterior.get('living:vibrissae').traverse(o=>{if(o.userData.whiskSide)shafts.push(o);});
  const visible=new Set(mouseExteriorIds);
  const m={id:s.id,kind:'mouse',forward:-1,root,asset:s.modelAsset,natural:true,textured:true,features:[],current:'observe',movementStudy:{duration:0},motionBounds:{},
    mouseAtlas:{parts,exterior,shafts,visible,structures:mouseStructures,defaults:new Set(visible),body,moving,opacity:1,cell:null,cellMode:false,closed:false}};
  root.userData.disposeAnatomy=()=>{m.mouseAtlas.closed=true};
  applyMouseVisibility(m);return m;
}
export function applyMouseVisibility(m){
  const a=m.mouseAtlas;
  a.body.visible=!a.cellMode;
  if(a.cell)a.cell.visible=a.cellMode;
  const museum=a.opacity===1&&[...a.visible].every(id=>a.defaults.has(id))&&a.visible.size>1;
  for(const[id,mesh]of a.parts){
    const cover=a.exterior.get(id);
    if(cover)cover.visible=museum&&a.visible.has(id);
    mesh.visible=a.visible.has(id)&&!(museum&&cover);
    mesh.material.emissive.setHex(id===a.selected?0x51361b:0);
    const alpha=['living:skin','living:tail'].includes(id)?a.opacity:1;
    mesh.material.opacity=alpha;mesh.material.transparent=alpha<1;mesh.material.depthWrite=alpha>=1;
    mesh.renderOrder=alpha<1?1:0;
  }
}
export async function showMouseCell(m){
  const a=m.mouseAtlas;
  if(!a.cell){
    const res=await fetch(neuronURL);if(!res.ok)throw Error('Cell tracing unavailable');
    const rows=(await res.text()).trim().split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>l.trim().split(/\s+/).map(Number));
    if(a.closed||a.cell)return;
    const points=new Map(),vertices=[];
    for(const[id,,x,y,z,,parent]of rows){if(parent!==-1){const p=points.get(parent);if(!p)throw Error('Invalid neuron parent');vertices.push(...p,x,y,z);}points.set(id,[x,y,z]);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeBoundingBox();
    const center=g.boundingBox.getCenter(new T.Vector3()),size=g.boundingBox.getSize(new T.Vector3());
    g.translate(-center.x,-center.y,-center.z);
    const cell=new T.LineSegments(g,new T.LineBasicMaterial({color:0x96e9d9}));
    cell.scale.setScalar(2.7/Math.max(size.x,size.y,size.z));cell.position.y=1;cell.visible=false;
    cell.userData={specimen:'NMO_130632',sourceUnits:'unverified',registration:'independent specimen',nodes:points.size,source:cellSource,license:'CC BY 4.0'};
    m.root.add(cell);a.cell=cell;
  }
}
export function animateMouse(m,action,time){
  const active=action==='tail-sweep',t=Math.max(0,Math.min(6,time));
  const k=active?Math.sin(Math.PI*t/6)**2:0;
  for(const mesh of m.mouseAtlas.moving)mesh.morphTargetInfluences[0]=k;
  const whisk=action==='whisk'||action==='steer-whisk';
  const sweep=whisk&&t>0&&t<6?Math.sin(t*Math.PI):0;
  const steering=action==='steer-whisk'?Math.sin(Math.PI*t/6)**2:0;
  for(const shaft of m.mouseAtlas.shafts){
    const side=shaft.userData.whiskSide;
    shaft.rotation.z=T.MathUtils.degToRad(-side*9.3*sweep+14*steering);
  }
  m.current=action;m.movementStudy.duration=active||whisk?6:0;
  if(whisk){
    m.root.userData.movementStudy={time:t,duration:6,stage:t===0||t===6?'Reference whisker position':action==='steer-whisk'?'Unequal left and right sweep centres':Math.cos(Math.PI*t)>0?'Whiskers sweep forward':'Whiskers sweep back'};
    return;
  }
  m.root.userData.movementStudy={time:t,duration:active?6:0,stage:active?(t<3?'Tail bends laterally':t<6?'Tail returns':'Reference posture'):'Atlas reference posture'};
}

