import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareAsset} from './asset-motion.js';
import assets from './model-assets.json';
import narwhal from './narwhal-asset-v0661.json';
import dolphin from './dolphin-asset-v0662.json';
const urls=import.meta.glob('./model-*.glb',{eager:true,query:'?url',import:'default'});
export const hasTexturedAsset=s=>s.id==='delphinus-delphis'||!!assets.models[s.id];
export async function loadTexturedSpecimen(s){const asset=s.id==='delphinus-delphis'?dolphin:s.id==='monodon-monoceros'?narwhal:assets.models[s.id],url=urls['./'+asset.localFile];if(!url)throw Error('Bundled model file is missing.');const gltf=await new GLTFLoader().loadAsync(url);return prepareAsset(gltf,s,asset);}
