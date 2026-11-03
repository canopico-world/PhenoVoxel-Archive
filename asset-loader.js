import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareAsset} from './asset-motion.js';
import assets from './model-assets.json';
import narwhal from './narwhal-asset-v0661.json';
import dolphin from './dolphin-asset-v0663.json';
import northernRight from './right-whale-assets-v0664.json';
import bowhead from './bowhead-asset-v0665.json';
import whaleShark from './whale-shark-asset-v0666.json';
import birds from './bird-assets-v0668.json';
const urls=import.meta.glob('./model-*.glb',{eager:true,query:'?url',import:'default'});
export const hasTexturedAsset=s=>s.id==='balaena-mysticetus'||s.id==='delphinus-delphis'||!!northernRight.models[s.id]||!!assets.models[s.id];
export async function loadTexturedSpecimen(s){const asset=birds.models[s.id]||(s.id==='rhincodon-typus'?whaleShark:s.id==='balaena-mysticetus'?bowhead:northernRight.models[s.id]||(s.id==='delphinus-delphis'?dolphin:s.id==='monodon-monoceros'?narwhal:assets.models[s.id])),url=urls['./'+asset.localFile];if(!url)throw Error('Bundled model file is missing.');const gltf=await new GLTFLoader().loadAsync(url);return prepareAsset(gltf,s,asset);}
