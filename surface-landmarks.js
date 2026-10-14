import * as T from 'three';
const V=()=>new T.Vector3();
// Landmarks link written anatomy to approximate regions of the posed artist
// surface. They are neither measured anatomical coordinates nor tissue labels.
export function configureSurfaceLandmarks(m){
 if(!['canis-lupus','panthera-tigris','vulpes-vulpes'].includes(m.id))return;
 const meshes=[];m.root.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});const mesh=m.id==='canis-lupus'?m.root.getObjectByName('Object_9'):m.id==='panthera-tigris'?m.tigerClaws.mesh:meshes[0];
 m.root.updateMatrixWorld(true);mesh.skeleton.update();const{position:p,skinIndex:si,skinWeight:sw,uv}=mesh.geometry.attributes,used=[...new Set(mesh.geometry.index?.array||Array.from({length:p.count},(_,i)=>i))];
 const weight=(i,test)=>['getX','getY','getZ','getW'].reduce((sum,k)=>sum+(test(mesh.skeleton.bones[si[k](i)])?sw[k](i):0),0);
 const point=i=>mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld);
 function nearest(test,target,count=12){const indices=used.filter(i=>test(i,point(i))).map(i=>({i,d:point(i).distanceToSquared(target)})).sort((a,b)=>a.d-b.d).slice(0,count).map(a=>a.i);if(!indices.length)throw Error(m.id+': source surface landmark is unavailable');return{mesh,indices,kind:'approximate posed surface region'};}
 if(m.id==='panthera-tigris'){
  const digit=m.limbs.find(l=>l.front).digits,claws=m.tigerClaws.groups.filter(g=>g.some(i=>weight(i,b=>b===digit)>.8)).flat();if(!claws.length)throw Error('Tiger source claw landmark is unavailable');
  const teeth=used.filter(i=>uv.getX(i)>.252&&uv.getX(i)<.305&&uv.getY(i)>.59&&uv.getY(i)<.643&&weight(i,b=>b===m.head)>.95&&point(i).z>0);if(!teeth.length)throw Error('Tiger source tooth landmark is unavailable');
  m.featureBindings=[{mesh,indices:claws,kind:'retained source claw region'},{mesh,indices:teeth,kind:'retained source upper canine region'},nearest((i,v)=>weight(i,b=>/^Bip01_Spine/.test(b.name))>.6,new T.Vector3(0,1.30,.45))];
 }else if(m.id==='canis-lupus'){
  const bounds=new T.Box3().setFromObject(m.root,true),nose=new T.Vector3(bounds.max.x,2.05,0),shin=m.limbs.find(l=>l.front).chain[2];
  m.featureBindings=[nearest((i,v)=>v.x>bounds.max.x-.16,nose,16),nearest(i=>weight(i,b=>b===shin)>.6,shin.getWorldPosition(V()),20),nearest(i=>weight(i,b=>/^(spine00[5-7]_|breast)/.test(b.name))>.6,new T.Vector3(-.15,1.50,.42),16)];
 }else{
  const head=m.head.getWorldPosition(V()),tail=m.bones.find(b=>/^Fox__Tail2_/.test(b.name));
  m.featureBindings=[nearest((i,v)=>weight(i,b=>b===m.head)>.8,head.clone().add(new T.Vector3(-.15,.40,.16)),8),nearest(i=>weight(i,b=>/Fox__Tail[234]_/.test(b.name))>.5,tail.getWorldPosition(V()),16),nearest((i,v)=>weight(i,b=>b===m.head)>.8,head.clone().add(new T.Vector3(.40,-.08,0)),12)];
 }
 m.surfaceLandmarks={author:'PhenoVoxel Archive contributors',scope:'Approximate artist-surface regions follow original skin deformation and authored morphs; anatomy remains unvalidated',features:m.featureBindings.map(b=>({kind:b.kind,vertexSamples:b.indices.length}))};updateSpecimenLandmarks(m);
}
export function updateSpecimenLandmarks(m){
 if(!m.featureBindings)return;m.root.updateMatrixWorld(true);const meshes=new Set(m.featureBindings.map(b=>b?.mesh).filter(Boolean));meshes.forEach(mesh=>mesh.skeleton?.update());
 for(const[i,binding]of m.featureBindings.entries()){
  if(!binding)continue;if(binding.mesh){const world=V(),instance=new T.Matrix4();if(binding.instance!==undefined)binding.mesh.getMatrixAt(binding.instance,instance);for(const index of binding.indices){const p=binding.mesh.getVertexPosition(index,V());if(binding.instance!==undefined)p.applyMatrix4(instance);world.add(p.applyMatrix4(binding.mesh.matrixWorld));}m.features[i].copy(m.root.worldToLocal(world.divideScalar(binding.indices.length)));}
  else if(binding.bone)m.features[i].copy(m.root.worldToLocal(binding.bone.localToWorld(binding.offset.clone())));
 }
}
