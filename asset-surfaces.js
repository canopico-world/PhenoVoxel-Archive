// These solid-body atlases were incorrectly imported as blended surfaces.
// Keep alpha cutouts (fur edges / branch silhouettes), original textures and UVs.
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
 scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(m.transparent&&m.opacity===1){m.transparent=false;m.depthWrite=true;m.alphaTest=.4;m.needsUpdate=true;}
  if(id==='loxodonta-africana'){m.roughness=.9;m.metalness=0;if(m.normalScale)m.normalScale.setScalar(.65);}
 }});
}
