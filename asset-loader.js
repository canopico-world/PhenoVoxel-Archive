import sourceCetaceans from './cetaceans-assets-v0677.json';
import herps from './herp-assets-v0674.json';
import mammals from './mammal-assets-v0673.json';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareAsset} from './asset-motion.js';
import assets from './model-assets.json';
import narwhal from './narwhal-asset-v0661.json';
import dolphin from './dolphin-asset-v0663.json';
import northernRight from './right-whale-assets-v0664.json';
import bowhead from './bowhead-asset-v0665.json';
import whaleShark from './whale-shark-asset-v0666.json';
import birds from './bird-assets-v0670.json';
import fish from './fish-assets-v0671.json';
import organisms from './organism-assets-v0672.json';
const urls=import.meta.glob('./model-*.glb',{eager:true,query:'?url',import:'default'});
export const hasTexturedAsset=s=>s.visual?.cetaceanVersion==='0.6.77'&&!!sourceCetaceans.models[s.id]||!!herps.models[s.id]||!!organisms.models[s.id]||!!fish.models[s.id]||s.id==='balaena-mysticetus'||s.id==='delphinus-delphis'||!!northernRight.models[s.id]||!!assets.models[s.id];
export async function loadTexturedSpecimen(s){const asset=(s.visual?.cetaceanVersion==='0.6.77'?sourceCetaceans.profiles[s.visual.cetaceanProfile||s.id]:null)||herps.models[s.id]||mammals.models[s.id]||organisms.models[s.id]||fish.models[s.id]||birds.models[s.id]||(s.id==='rhincodon-typus'?whaleShark:s.id==='balaena-mysticetus'?bowhead:northernRight.models[s.id]||(s.id==='delphinus-delphis'?dolphin:s.id==='monodon-monoceros'?narwhal:assets.models[s.id])),url=urls['./'+asset.localFile];if(!url)throw Error('Bundled model file is missing.');if(asset.herpVersion){const response=await fetch(url);if(!response.ok)throw Error('Source model download failed.');const bytes=await response.arrayBuffer(),gltf=await new GLTFLoader().parseAsync(bytes,''),model=prepareAsset(gltf,s,asset);if(asset.originalSourceExport)model.sourceBinary=bytes;return model;}const gltf=await new GLTFLoader().loadAsync(url);return prepareAsset(gltf,s,asset);}
