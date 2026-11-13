import * as T from 'three';
import data from './salamander-data-v0721.json' with {type:'json'};
import {prepareDigitalLife,animateDigitalLife} from './digitallife-source-v0682.js';
import {renderedBounds} from './camera-fit.js';

// Overlay the current specimen without rewriting the preserved historical database.
export function revisedSalamander(s){
 if(s.id!==data.id)return s;
 return {...s,modelAsset:data.modelAsset,behaviors:[data.behavior],
  visual:{...s.visual,version:data.version,description:data.modelAsset.surfaceType},
  sources:[...s.sources,...data.sources],
  review:{...s.review,status:'Repaired source skeleton; preserved photographic skin; independent locomotor validation pending',latestReviewPath:'salamander-review-v0721.html',reviewPath:'salamander-review-v0721.html'}};
}
export function prepareSalamander(gltf,s,asset){
 const m=prepareDigitalLife(gltf,s,asset);m.salamanderRevision=true;
 m.movementStudy={duration:gltf.animations[0]?.duration||0};
 m.motionBounds={walk:new T.Box3()};
 for(let i=0;i<=8;i++){animateSalamander(m,'walk',m.movementStudy.duration*i/8);m.motionBounds.walk.union(renderedBounds(m.root));}
 m.motionBounds.walk.expandByScalar(.05);animateSalamander(m,'observe',0);return m;
}
export function animateSalamander(m,motion,t){
 const duration=m.gltf.animations[0]?.duration||0;
 const time=motion==='walk'?T.MathUtils.clamp(Number.isFinite(t)?t:0,0,duration):0;
 animateDigitalLife(m,motion,time);m.movementStudy.duration=duration;
 m.root.userData.movementStudy={duration,time,finite:true,measured:false,
  stage:motion!=='walk'?'Source exterior · held initial pose':time>=duration?'Source clip complete':`Underwater walking reconstruction · ${time.toFixed(2)} / ${duration.toFixed(2)} s`};
}
