import * as T from 'three';
import {restorePawFrame} from './paw-frames.js';
// In-place authored takeoff/flight/landing phases, not a measured trajectory,
// force solution or a biological time scale. Source skin/materials stay intact.
export function animateMammalJump(m,t,solveLimb){
 const u=(t/3.8)%1,flight=u>=.24&&u<.70,f=flight?(u-.24)/.46:0,
  compression=u<.24?Math.sin(Math.PI*u/.24):u>=.70&&u<.88?Math.sin(Math.PI*(u-.70)/.18):0,
  retract=flight?Math.sin(Math.PI*f):0,lift=flight?4*.72*f*(1-f):-.11*compression;
 m.root.position.y=lift;
 for(const l of m.limbs){const p=l.home.clone();p.y+=.11*compression+.40*retract;p.x+=(l.front?-.23:.14)*retract;
  // Alternating solve/frame passes keep the source carpus and digit posture
  // coherent while lifting/folding the limbs, without stretching segments.
  for(let i=0;i<3;i++){solveLimb(m,l,p);restorePawFrame(m,l);}
 }
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 // A penetration correction adds to the flight lift. The old absolute floor
 // assignment erased it and made every airborne frame look almost static.
 const floor=.13-new T.Box3().setFromObject(m.root,true).min.y;m.root.position.y+=Math.max(0,floor);m.root.updateMatrixWorld(true);
 m.jumpPhase=flight?'flight':u<.24?'compression / takeoff':u<.88?'landing / compression':'supported pause';return true;
}
