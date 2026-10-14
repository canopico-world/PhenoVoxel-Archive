// These solid-body atlases were incorrectly imported as blended surfaces.
// Keep alpha cutouts (fur edges / branch silhouettes), original textures and UVs.
function smoothCoincidentNormals(mesh){
 const g=mesh.geometry.clone(),p=g.attributes.position,n=g.attributes.normal,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;if(!n)return;const groups=new Map();
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',')+(si?'|'+['getX','getY','getZ','getW'].map(k=>si[k](i)+':'+Math.round(sw[k](i)*1e4)).join(','):'');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
 for(const indices of groups.values()){if(indices.length<2)continue;const mean=[0,0,0];for(const i of indices){mean[0]+=n.getX(i);mean[1]+=n.getY(i);mean[2]+=n.getZ(i);}const length=Math.hypot(...mean);if(length<1e-8)continue;const a=mean.map(v=>v/length);if(indices.some(i=>n.getX(i)*a[0]+n.getY(i)*a[1]+n.getZ(i)*a[2]<.85))continue;for(const i of indices)n.setXYZ(i,...a);}
 n.needsUpdate=true;mesh.geometry=g;mesh.userData={...mesh.userData,surfaceChanges:'Coincident smooth-region normal continuity; original positions, UVs, weights and atlas retained'};
}
export function correctAssetSurface(scene,id){
 if(id==='arabidopsis-thaliana'){
  // Both source groups resolve to the same world-space plant. Keeping both
  // causes coincident petals/leaves and doubled stems, not a second specimen.
  scene.getObjectByName('Leaf_0')?.removeFromParent();
 }
 if(id==='canis-lupus'){
  // The source includes an unlit white outline shell and a second textured
  // shell overlapping the complete hero mesh. In a standard physical viewer
  // these obscure the muzzle and produce a false exposed-teeth silhouette.
  const duplicates=[];scene.traverse(o=>{if(o.isMesh&&['Object_74','Object_76'].includes(o.name))duplicates.push(o);});duplicates.forEach(o=>o.removeFromParent());
 }
 if(!['panthera-tigris','loxodonta-africana','giraffa-camelopardalis','quercus-robur'].includes(id))return;
 scene.traverse(o=>{if(!o.isMesh)return;if(id==='loxodonta-africana')smoothCoincidentNormals(o);for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(m.transparent&&m.opacity===1){m.transparent=false;m.depthWrite=true;m.alphaTest=.4;m.needsUpdate=true;}
  if(id==='loxodonta-africana'){m.roughness=.9;m.metalness=0;if(m.normalScale)m.normalScale.setScalar(.35);}
 }});
}
