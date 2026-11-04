import {addChimpShoulderCorrective} from './chimp-pose-correctives.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createChimpRig,animateChimpRig} from './chimp-rig.js';
import {createKangarooRig,animateKangarooRig} from './kangaroo-rig.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep;
export function prepareTexturedMammal(gltf,s,asset){
 const chimp=s.id==='pan-troglodytes',root=new T.Group(),content=new T.Group();root.add(content);content.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(gltf.scene,true),height=box.max.y-box.min.y,scale=(chimp?3.5:3.05)/height,zmid=(box.min.z+box.max.z)/2,geometries=[],materials=[],objects=[];
 gltf.scene.traverse(o=>{if(o.isMesh)objects.push(o);});
 for(const o of objects){
  let g=o.geometry.clone().applyMatrix4(o.matrixWorld);const p=g.attributes.position,armMasks=[];
  for(let i=0;i<p.count;i++){
   let x=p.getX(i)*scale,y=(p.getY(i)-box.min.y)*scale+.13,z=(p.getZ(i)-zmid)*scale;
   if(chimp){
    const d=Math.abs(z),side=z<0?-1:1,blend=smooth(d,.48,.72)*smooth(y,2.20,2.55);
    armMasks.push(blend);const theta=1.50*blend,dy=y-2.84,dz=d-.58;const yy=2.84+dy*Math.cos(theta)-dz*Math.sin(theta),zz=side*(.58+dy*Math.sin(theta)+dz*Math.cos(theta));y=yy;z=zz;x-=.14;
   }else{x=-x+.27;if(x<-.20)x=-.20+(x+.20)*.80;z*=.85;}
   p.setXYZ(i,x,y,z);
  }
  g.computeVertexNormals();
  for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key);
  if(chimp)g.setAttribute('pvArm',new T.Float32BufferAttribute(armMasks,1));
  if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(p.count*2),2));
  if(!g.index)g.setIndex(Array.from({length:p.count},(_,i)=>i));
  const sourceMat=Array.isArray(o.material)?o.material[0]:o.material,mat=sourceMat.clone();mat.name=chimp?'Skin · credited chimpanzee atlas':sourceMat.name;mat.metalness=0;mat.roughness=/eyes/i.test(mat.name)?.20:.83;mat.envMapIntensity=.32;mat.userData={...mat.userData,compatibilitySurfaceDetail:true,compatibilityLinearTexture:true};if(mat.map){mat.map.colorSpace=T.SRGBColorSpace;mat.map.anisotropy=8;}
  geometries.push(g);materials.push(mat);
 }
 const merged=mergeGeometries(geometries,true);const mesh=new T.Mesh(merged,chimp?materials[0]:materials);mesh.name='PV source-textured '+s.id;for(const o of objects)o.removeFromParent();root.add(mesh);if(chimp)mesh.material=materials[0];geometries.forEach(g=>g.dispose());
 const m={id:s.id,kind:s.visual.kind,root,content,gltf,asset,mammalVersion:'0.6.73',natural:true,textured:true,parts:{},features:[V(),V(),V()],limbs:[],bones:[],extent:new T.Box3().setFromObject(root,true).getSize(V()),current:'observe',forward:1};
 m.surfaceRig=chimp?createChimpRig(m):createKangarooRig(m);if(chimp){animateChimpRig(m,'walk',0);addChimpShoulderCorrective(m);}for(const r of m.surfaceRig.rigs)r.mesh.geometry.deleteAttribute('pvArm');root.userData.compatibilityMammalDetail=true;root.userData.reconstruction={method:asset.changes,source:asset.source,sourceAIgenerated:asset.sourceAIgenerated,measured:false};animateTexturedMammal(m,'observe',0);return m;
}
export function animateTexturedMammal(m,motion,t){m.current=motion;(m.id==='pan-troglodytes'?animateChimpRig:animateKangarooRig)(m,motion,t);}
