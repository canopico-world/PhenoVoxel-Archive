// These solid-body atlases were incorrectly imported as blended surfaces.
// Keep alpha cutouts (fur edges / branch silhouettes), original textures and UVs.
export function correctAssetSurface(scene,id){
 if(!['panthera-tigris','loxodonta-africana','giraffa-camelopardalis','quercus-robur'].includes(id))return;
 scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(m.transparent&&m.opacity===1){m.transparent=false;m.depthWrite=true;m.alphaTest=.4;m.needsUpdate=true;}
  if(id==='loxodonta-africana'){m.roughness=.9;m.metalness=0;if(m.normalScale)m.normalScale.setScalar(.65);}
 }});
}
