import * as T from 'three';
import {solveTwoLink,aimJoint} from './joint-kinematics.js';
import {restorePawFrame} from './paw-frames.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
// Limb order is left fore, left hind, right fore, right hind. This authored
// lateral-sequence walk is not a digitized tiger gait or a force simulation.
export const tigerWalkPhase=(index,t)=>((t*.62-[.25,0,.75,.50][index])%1+1)%1;
export const tigerWalkStance=.70;
export function configureTigerWalk(m){
 if(m.id!=='panthera-tigris')return;
 m.root.updateMatrixWorld(true);
 m.tigerWalk=m.limbs.map((l,i)=>({limb:l,home:m.root.worldToLocal(l.wrist.getWorldPosition(V())),samples:m.pawSamples[i],hockOffset:l.front?null:m.root.worldToLocal(l.wrist.getWorldPosition(V())).sub(m.root.worldToLocal(l.chain[2].getWorldPosition(V())))}));
}
function pose(m,r,target){const l=r.limb,c=l.chain;
 if(l.front)solveTwoLink(m,c[0],c[1],l.wrist,target,V(-1,0,0));
 else{const hock=target.clone().sub(r.hockOffset);solveTwoLink(m,c[0],c[1],c[2],hock,V(1,0,0));aimJoint(m,c[2],l.wrist,target);}
 restorePawFrame(m,l);
}
function lowest(m,samples){m.root.updateMatrixWorld(true);for(const skeleton of new Set(samples.map(([mesh])=>mesh.skeleton)))skeleton.update();let min=Infinity;for(const[mesh,i]of samples)min=Math.min(min,mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).y);return min;}
export function animateTigerWalk(m,action,t){
 if(!m.tigerWalk||action!=='walk')return false;
 m.root.position.y=-.035;
 for(const[i,r]of m.tigerWalk.entries()){
  const u=tigerWalkPhase(i,t),stance=u<tigerWalkStance,v=stance?u/tigerWalkStance:(u-tigerWalkStance)/(1-tigerWalkStance),clearance=stance?0:.14*Math.sin(v*Math.PI)**2,target=r.home.clone();
  target.x+=.38*(stance?.5-v:-.5+T.MathUtils.smoothstep(v,0,1));target.y+=clearance;
  for(let pass=0;pass<8;pass++){pose(m,r,target);const error=.135+clearance-lowest(m,r.samples);if(!Number.isFinite(error)||Math.abs(error)<.002)break;target.y+=T.MathUtils.clamp(error,-.06,.06);}
 }
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});return true;
}
