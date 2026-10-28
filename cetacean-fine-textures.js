import * as T from 'three';
const loaded=new Map(),pending=new Map();
export function fineTexture(id,kind){return loaded.get(id+':'+kind)?.clone()||null;}
export async function preloadFineTextures(id){
 if(typeof document==='undefined')return;
 const ids=['balaenoptera-physalus','eschrichtius-robustus','delphinapterus-leucas','monodon-monoceros','delphinus-delphis'];if(!ids.includes(id))return;
 if(pending.has(id))return pending.get(id);
 const kinds=id==='monodon-monoceros'?['normal-body','roughness-body']:['base-body','base-flipper','base-fluke','normal-body','roughness-body','normal-appendage','roughness-appendage'];
 const task=Promise.all(kinds.map(async kind=>{const texture=await new T.TextureLoader().loadAsync('./skin-cetacean-v0654-'+id+'-'+kind+'.png');texture.flipY=false;texture.wrapT=T.RepeatWrapping;texture.colorSpace=kind.startsWith('base-')?T.SRGBColorSpace:T.NoColorSpace;texture.userData={author:'PhenoVoxel Archive',license:'MIT',source:'Original reproducible reference-led pigment/normal/roughness field, not an organism photograph or measured optical map.'};loaded.set(id+':'+kind,texture);}));pending.set(id,task);return task;
}
