import * as THREE from 'three';

// Explicitly curated for Bindestrek's clownfish, not a generic fish auto-rigger.
// Source coordinates: +Z snout, -Z tail, Y dorsal, X lateral. Original UVs,
// positions, indices, textures and artist materials survive the viewer rig.
export function buildClownfishRig(scene) {
 const meshes=[];scene.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)meshes.push(o);});
 const rigs=[];
 for(const source of meshes){
  const geometry=source.geometry,position=geometry.attributes.position;
  const joints=[.25,-.05,-.30,-.55,-.68];
  const bones=joints.map((z,i)=>{const b=new THREE.Bone();b.name=`PV_clownfish_${source.parent.name}_axis_${i}`;b.position.z=i?z-joints[i-1]:z;return b;});
  for(let i=1;i<bones.length;i++)bones[i-1].add(bones[i]);
  for(const side of [-1,1]){const fin=new THREE.Bone();fin.name=`PV_clownfish_${source.parent.name}_pectoral_${side<0?'L':'R'}`;fin.position.set(side*.235,.025,.385-joints[0]);bones[0].add(fin);bones.push(fin);}
  const indices=[],weights=[];
  for(let i=0;i<position.count;i++){
   const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
   let a=0,b=0,mix=0;
   if(z<joints[0]){a=joints.length-1;b=a;for(let k=0;k<joints.length-1;k++)if(z<=joints[k]&&z>=joints[k+1]){a=k;b=k+1;mix=(joints[k]-z)/(joints[k]-joints[k+1]);break;}}
   // Feather fin-base weights into the forebody instead of tearing the skin.
   const finRegion=z>.16&&z<.45&&y<.09&&y>-.31;
   const finWeight=finRegion?THREE.MathUtils.smoothstep(Math.abs(x),.235,.30):0;
   indices.push(a,b,x<0?5:6,0);
   weights.push((1-mix)*(1-finWeight),mix*(1-finWeight),finWeight,0);
  }
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const mesh=new THREE.SkinnedMesh(geometry,source.material);
  mesh.name=source.name;mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.scale.copy(source.scale);
  mesh.userData={...source.userData,viewerRigAuthor:'PhenoVoxel Archive contributors',viewerRig:'Authored clownfish axial and paired pectoral study; unvalidated'};
  mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;
  // The source body texture is opaque RGB despite its GLB BLEND flag. Drawing
  // it as opaque fixes overlapping-fin sorting artifacts. Preserve the separate
  // translucent fin material but prevent it from occluding the opaque body.
  for(const material of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){
   if(material.name==='Default'){material.transparent=false;material.depthWrite=true;}
   else if(material.name==='transparent')material.depthWrite=false;
  }
  const parent=source.parent;source.removeFromParent();parent.add(mesh);mesh.add(bones[0]);
  scene.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));mesh.normalizeSkinWeights();
  // Cover the modest authored bend so culling never uses stale neutral bounds.
  mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.boundingSphere.radius*=1.25;
  rigs.push({mesh,bones});
 }
 return rigs;
}

export function animateClownfish(rigs,motion,t){
 const active=['swim','forage','escape'].includes(motion);
 const escape=motion==='escape',forage=motion==='forage';
 const frequency=escape?2.8:forage?.8:1.25;
 const strength=escape?.55+.45*Math.cos(t*Math.PI/1.2)**2:forage?.45:1;
 const phase=t*frequency*Math.PI*2;
 for(const {mesh,bones} of rigs){
  bones.forEach(b=>b.quaternion.identity());
  if(active){
   for(let i=1;i<5;i++)bones[i].rotation.y=Math.sin(phase-i*.48)*[0,.025,.05,.09,.17][i]*strength*(escape?1.6:1);
   for(let i=5;i<7;i++){const side=i===5?-1:1;const beat=Math.sin(phase+.5);bones[i].rotation.z=side*beat*.22*strength;bones[i].rotation.y=side*Math.cos(phase+.5)*.12*strength;}
  }
  mesh.updateWorldMatrix(true,true);mesh.skeleton.update();
 }
}
