import * as T from 'three';
import {solveTwoLink,rotateJoint} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
// Qualitative lateral walk/running-walk, not a force or measured-trajectory model.
export const bearPhase=(index,t,running=false)=>(t*(running?1.05:.55)-[.24,.74,0,.50][index]+10)%1;
export function bearFeet(mesh,bones){
 const g=mesh.geometry,a=g.attributes,used=[...new Set(g.index?.array||Array.from({length:a.position.count},(_,i)=>i))];
 return [3,6,9,12].map((upper,i)=>({upper,front:i<2,side:i%2?1:-1,home:bones[upper+2].getWorldPosition(V()),frame:bones[upper+2].getWorldQuaternion(new T.Quaternion()),samples:used.filter(index=>{let weight=0;for(const k of ['getX','getY','getZ','getW'])if(a.skinIndex[k](index)===upper+2)weight+=a.skinWeight[k](index);return weight>.45&&a.position.getY(index)<.65;})}));
}
export function animateBear(m,r,action,t){
 const {bones,mesh,feet}=r,moving=['walk','run'].includes(action),running=action==='run',stance=running?.48:.72,stride=running?.44:.28,lift=running?.18:.12;
 if(moving)m.root.position.y=-.012;
 bones[0].rotation.z=action==='forage'?-.06:moving?Math.sin(t*(running?1.05:.55)*Math.PI*2)*(running?.016:.008):0;
 for(const [i,f]of feet.entries()){
  const u=bearPhase(i,t,running),swing=moving&&u>stance?(u-stance)/(1-stance):0,clearance=moving?Math.sin(swing*Math.PI)*lift:0,target=f.home.clone();
  if(moving){target.x+=u<stance?stride*(.5-u/stance):stride*(-.5+swing);target.y+=clearance;}
  const frame=()=>{setWorldFrame(bones[f.upper+2],m.root.getWorldQuaternion(new T.Quaternion()).multiply(f.frame));if(f.front)rotateJoint(m,bones[f.upper+2],V(0,1,0),f.side*(.10+.05*Math.sin(swing*Math.PI)));if(swing)rotateJoint(m,bones[f.upper+2],V(0,0,1),-.10*Math.sin(swing*Math.PI));};
  solveTwoLink(m,bones[f.upper],bones[f.upper+1],bones[f.upper+2],target,V(f.front?-1:1,0,0));frame();
  // Use the retained paw surface, not just an ankle joint, for support.
  for(let pass=0;pass<5;pass++){m.root.updateMatrixWorld(true);mesh.skeleton.update();let min=Infinity;for(const j of f.samples)min=Math.min(min,mesh.getVertexPosition(j,V()).applyMatrix4(mesh.matrixWorld).y);if(!Number.isFinite(min)||Math.abs(.13+clearance-min)<.002)break;const p=m.root.worldToLocal(bones[f.upper+2].getWorldPosition(V()));p.y+=.13+clearance-min;solveTwoLink(m,bones[f.upper],bones[f.upper+1],bones[f.upper+2],p,V(f.front?-1:1,0,0));frame();}
 }
 if(action==='forage'){rotateJoint(m,bones[1],V(0,0,1),-.50);rotateJoint(m,bones[2],V(0,0,1),-.25+.025*Math.sin(t*1.2));rotateJoint(m,bones[2],V(0,1,0),.12*Math.sin(t*.7));}
 if(action==='rest')rotateJoint(m,bones[2],V(0,0,1),-.10);
}
