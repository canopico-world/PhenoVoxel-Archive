import * as T from 'three';
import data from './fish-data-v0722.json' with {type:'json'};
import {prepareDigitalLife,animateDigitalLife} from './digitallife-source-v0682.js';
import {renderedBounds} from './camera-fit.js';

// Current source-file repairs; historical database and source downloads stay intact.
export function revisedFish(s){
 const d=data.species[s.id];if(!d)return s;
 return {...s,modelAsset:d.modelAsset,behaviors:d.behaviors,
  visual:{...s.visual,version:data.version,description:d.modelAsset.surfaceType},
  sources:[...s.sources,...d.sources],
  review:{...s.review,status:'Source Blender rig and materials restored; independent swimming validation pending',latestReviewPath:'fish-review-v0722.html',reviewPath:'fish-review-v0722.html'}};
}
export function prepareRepairedFish(gltf,s,asset){
 const m=prepareDigitalLife(gltf,s,asset);m.fishRevision=true;m.motionBounds={};
 // Frame the whole finite study, including lateral tail sweep and spread paired fins.
 for(const [motion,spec] of Object.entries(asset.nativeMotion)){
  if(motion==='observe')continue;
  const clip=gltf.animations.find(c=>c.name===spec.clip);if(!clip)throw Error('Missing fish source clip: '+spec.clip);
  const bounds=new T.Box3();
  for(let i=0;i<=24;i++){animateDigitalLife(m,motion,clip.duration*i/24);bounds.union(renderedBounds(m.root));}
  m.motionBounds[motion]=bounds.expandByScalar(.15);
 }
 animateDigitalLife(m,'observe',0);return m;
}
