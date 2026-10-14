import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {botanicalMaterial,botanicalLeaf} from './botanical-models.js';
const V=()=>new T.Vector3(),clamp=T.MathUtils.clamp;
function components(geometry){
 const p=geometry.attributes.position,parents=Array.from({length:p.count},(_,i)=>i),find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;},join=(a,b)=>parents[find(b)]=find(a),coords=new Map();
 for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e5)).join(',');if(coords.has(k))join(i,coords.get(k));else coords.set(k,i);}
 const ix=geometry.index?.array||Array.from({length:p.count},(_,i)=>i);for(let i=0;i<ix.length;i+=3){join(ix[i],ix[i+1]);join(ix[i],ix[i+2]);}
 const groups=new Map();for(let i=0;i<p.count;i++){const k=find(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);}return [...groups.values()];
}
export function curateOakSource(scene){
 const cards=scene.getObjectByName('Object_6'),wood=scene.getObjectByName('Object_4');if(!cards||!wood)return;scene.updateMatrixWorld(true);
 const p=cards.geometry.attributes.position,anchors=[];
 for(const indices of components(cards.geometry)){const box=new T.Box3();indices.forEach(i=>box.expandByPoint(cards.localToWorld(V().fromBufferAttribute(p,i))));const center=scene.worldToLocal(box.getCenter(V()));if(center.x<10&&!anchors.some(a=>a.distanceTo(center)<.035))anchors.push(center);}
 for(const name of ['Object_2','Object_3','Object_5','Object_6'])scene.getObjectByName(name)?.removeFromParent();
 // The creator's foliage atlas contains nearly transparent, polygon-colored
 // branch cards, not reusable opaque leaf tissue. Keep one original woody
 // specimen and disclose new authored laminae; do not invent missing pixels.
 const mat=botanicalMaterial('leaf','#4b702b'),geometry=botanicalLeaf({length:.90,width:.30,arch:.04,droop:.12,lobes:4.5,cordate:true,material:mat}).geometry,
  leaves=new T.InstancedMesh(geometry,mat,anchors.length*28),helper=new T.Object3D(),matrices=[],branchGeometry=[],trunkPoints=[];
 const wp=wood.geometry.attributes.position;for(let i=0;i<wp.count;i+=4)trunkPoints.push(scene.worldToLocal(wood.localToWorld(V().fromBufferAttribute(wp,i))));
 for(const [i,anchor] of anchors.entries()){
  const nearest=trunkPoints.reduce((a,p)=>p.distanceToSquared(anchor)<a.distanceToSquared(anchor)?p:a,trunkPoints[0]),curve=new T.CatmullRomCurve3([nearest,nearest.clone().lerp(anchor,.55).add(new T.Vector3(0,.25,0)),anchor]);branchGeometry.push(new T.TubeGeometry(curve,12,.025,6,false));
  for(let j=0;j<28;j++){const a=j*2.39996,spread=.15+(j%7)*.17,position=anchor.clone().add(new T.Vector3(Math.cos(a)*spread,Math.sin(j*2.1)*spread*.6,Math.sin(a)*spread));helper.position.copy(position);helper.rotation.set(-.45+.65*Math.sin(i+j),a+.23*Math.sin(i),.18*Math.cos(i+j));helper.scale.setScalar(.68+.23*Math.sin(j*1.7)**2);helper.updateMatrix();leaves.setMatrixAt(matrices.length,helper.matrix);matrices.push(helper.matrix.clone());const petiole=new T.CatmullRomCurve3([anchor,position]);branchGeometry.push(new T.TubeGeometry(petiole,3,.007,4,false));}
 }
 leaves.name='Original lobed oak leaves · retained artist wood';leaves.castShadow=leaves.receiveShadow=true;scene.add(leaves);
 // Merge authored branchlets, preserving the credited source trunk untouched.
 const twigs=new T.Mesh(mergeGeometries(branchGeometry),botanicalMaterial('bark','#66533c'));twigs.name='Original branchlets supporting oak foliage';twigs.castShadow=true;scene.add(twigs);branchGeometry.forEach(g=>g.dispose());
 scene.oakFoliage={leaves,matrices,wood,twigs};
}
export function configureBotanicalAsset(m){
 if(m.id==='quercus-robur'){
  const foliage=m.gltf.scene.oakFoliage;if(!foliage)return;
  m.botanicalAssetRig={oak:foliage,version:'0.5.0',description:'One retained creator woody tree with original lobed foliage and illustrative leaf flush; age/height and phenology uncalibrated'};
  m.featureBindings=[{mesh:foliage.leaves,indices:[15*13+6],instance:30,kind:'Original oak lamina on retained source tree'},null,{mesh:foliage.wood,indices:[50,70,90],kind:'Retained creator bark region'}];return;
 }
 if(m.id!=='arabidopsis-thaliana')return;
 const meshes=[],rosette=botanicalMaterial('leaf','#507835'),petal=botanicalMaterial('petal','#e7e9d6');m.root.updateMatrixWorld(true);
 m.gltf.scene.traverse(mesh=>{
  if(!mesh.isMesh)return;const name=mesh.material.name,leaf=/Rosette/.test(name),flower=/Petal/.test(name),stem=/Flower_stem/.test(name);
  if(leaf||flower){const material=(leaf?rosette:petal).clone();material.name=name;mesh.material=material;}
  if(!leaf&&!flower&&!stem)return;
  // Keep creator topology/UVs. Store neutral vertices in the normalized desk
  // so stage changes preserve source attachment rather than scale the set.
  const g=mesh.geometry.clone();mesh.geometry=g;const p=g.attributes.position,world=Array.from({length:p.count},(_,i)=>m.root.worldToLocal(mesh.localToWorld(V().fromBufferAttribute(p,i)))),groups=components(g).map(indices=>{
   const box=new T.Box3();indices.forEach(i=>box.expandByPoint(world[i]));const center=box.getCenter(V());let anchor=world[indices[0]];
   if(leaf)anchor=world[indices.reduce((best,i)=>world[i].x**2+world[i].z**2<world[best].x**2+world[best].z**2?i:best,indices[0])];else anchor=center;
   const lowLeaf=leaf&&box.max.y<.75,start=flower?.72:leaf?(lowLeaf?.02+meshes.length*.012:.48):0;
   return {indices,anchor:anchor.clone(),start,lowLeaf};
  });
  if(flower){const petals=groups.filter(g=>g.indices.length>250);for(let i=0;i<petals.length;i+=4){const peers=petals.slice(i,i+4),box=new T.Box3();peers.forEach(g=>g.indices.forEach(i=>box.expandByPoint(world[i])));const anchor=box.getCenter(V());anchor.y=box.min.y;peers.forEach(g=>g.anchor.copy(anchor));}}
  meshes.push({mesh,world,groups,leaf,flower,stem});
 });
 m.botanicalAssetRig={meshes,version:'0.5.0',description:'Retained creator vertices with original leaf/petal surface fields; anchored rosette expansion and flowering-shoot emergence, not calibrated ontogeny'};
 const rosetteMesh=meshes.find(x=>x.leaf),flowerMesh=meshes.find(x=>x.flower);const centroidBinding=(r,indices)=>({mesh:r.mesh,indices,kind:'Approximate retained creator organ'});
 m.featureBindings=[centroidBinding(rosetteMesh,rosetteMesh.groups[0].indices.filter((_,i)=>i%18===0)),centroidBinding(flowerMesh,flowerMesh.groups[1].indices.filter((_,i)=>i%18===0)),null];
}
export function animateBotanicalAsset(m,action,t){
 if(m.botanicalAssetRig.oak){const r=m.botanicalAssetRig.oak,progress=action==='grow'?clamp(t/9,0,1):1,helper=new T.Object3D();r.matrices.forEach((matrix,i)=>{matrix.decompose(helper.position,helper.quaternion,helper.scale);helper.scale.multiplyScalar(action==='grow'?clamp(progress*1.35-(i%7)*.035,.015,1):1);helper.updateMatrix();r.leaves.setMatrixAt(i,helper.matrix);});r.leaves.instanceMatrix.needsUpdate=true;r.leaves.computeBoundingSphere();return;}
 const progress=action==='grow'?clamp(t/9,0,1):1,height=.12+.88*progress;
 m.root.updateMatrixWorld(true);
 for(const r of m.botanicalAssetRig.meshes){const p=r.mesh.geometry.attributes.position;
  for(const g of r.groups){const stage=action==='grow'&&!r.stem?clamp((progress-g.start)/(1-g.start),.006,1):1,anchor=g.anchor.clone();anchor.y=.13+(anchor.y-.13)*height;
   for(const i of g.indices){const target=r.world[i].clone();if(r.leaf||r.flower){target.sub(g.anchor).multiplyScalar(stage).add(anchor);if(!g.lowLeaf)target.y=anchor.y+(r.world[i].y-g.anchor.y)*stage*height;}else target.y=.13+(target.y-.13)*height;
    p.setXYZ(i,...r.mesh.worldToLocal(m.root.localToWorld(target)).toArray());
   }
  }p.needsUpdate=true;r.mesh.geometry.computeVertexNormals();r.mesh.geometry.computeBoundingBox();r.mesh.geometry.computeBoundingSphere();
 }m.root.updateMatrixWorld(true);
}
