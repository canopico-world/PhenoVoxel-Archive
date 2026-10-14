import * as T from 'three';
import {solveTwoLink,rotateJoint} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=u=>u*u*(3-2*u);
const strideX=(u,start,duty,stride)=>{const v=(u-start+1)%1;return v<=duty?stride*(v/duty-.5):stride*(.5-smooth((v-duty)/(1-duty)));};
// Support/takeoff/flight/forelimb landing/hindlimb recovery are authored phases.
// Hall et al. (2022) informs hindfoot contact, not these timings or flight height.
export const rabbitPhase=(action,t)=>(t*(action==='escape'?1.35:.72))%1;
export const rabbitSupport=(u,front)=>front?u<=.12||u>=.64:u<=.24||u>=.88;
export function configureRabbit(m){
 m.root.updateMatrixWorld(true);const meshes=[];m.root.traverse(mesh=>{if(mesh.isSkinnedMesh)meshes.push(mesh);});
 for(const l of m.limbs){const foot=l.chain.at(-1);l.ankleHome=m.root.worldToLocal(foot.getWorldPosition(V()));l.frame=foot.getWorldQuaternion(new T.Quaternion());l.samples=[];const region=new Set();foot.traverse(b=>{if(b.isBone)region.add(b);});
  for(const mesh of meshes){const a=mesh.geometry.attributes,used=new Set(mesh.geometry.index?.array||Array.from({length:a.position.count},(_,i)=>i));for(const i of used){let weight=0;for(const k of ['getX','getY','getZ','getW'])if(region.has(mesh.skeleton.bones[a.skinIndex[k](i)]))weight+=a.skinWeight[k](i);if(weight<.40)continue;const p=m.root.worldToLocal(mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld));if(p.y<.65)l.samples.push([mesh,i]);}}
 }
 m.rabbitRig={sourceMeshes:meshes,ears:[m.bones.find(b=>/^Bone_3$/.test(b.name)),m.bones.find(b=>/^Bone002_5$/.test(b.name))].filter(Boolean)};
}
export function animateRabbit(m,action,t){
 const moving=['jump','escape'].includes(action),u=rabbitPhase(action,t),flight=u>.24&&u<.64?Math.sin((u-.24)/.40*Math.PI):0,lift=flight*.46;
 m.root.position.y=-.16+lift-(moving&&u<=.24?.08*Math.sin(u/.24*Math.PI):0)-(action==='forage'?.04:0);
 for(const l of m.limbs){
  const supported=!moving||rabbitSupport(u,l.front),v=l.front?(u-.12)/.52:(u-.24)/.64,swing=supported?0:Math.sin(v*Math.PI),clearance=supported?0:lift+swing*(l.front?.16:.23),target=l.ankleHome.clone();
  if(!l.front)target.x-=.16;
  if(moving)target.x+=l.front?strideX(u,.64,.48,.28):strideX(u,.88,.36,.35);
  target.y+=.16+clearance-lift;
  const foot=l.chain.at(-1),frame=()=>{setWorldFrame(foot,m.root.getWorldQuaternion(new T.Quaternion()).multiply(l.frame));if(moving&&!l.front)rotateJoint(m,foot,V(0,0,1),u<=.24?.10+.50*smooth(u/.24):u<.88?.60-.50*smooth((u-.24)/.64):.10);if(moving&&l.front&&!supported)rotateJoint(m,foot,V(0,0,1),-.16*swing);};
  const solve=p=>solveTwoLink(m,l.chain[0],l.chain[1],foot,p,V(l.front?1:-1,0,0));solve(target);frame();
  // Positional support of original furry surfaces; no fabricated pressure data.
  for(let pass=0;pass<7;pass++){m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});let low=Infinity;for(const[mesh,i]of l.samples)low=Math.min(low,mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).y);if(!Number.isFinite(low)||Math.abs(.13+clearance-low)<.002)break;const p=m.root.worldToLocal(foot.getWorldPosition(V()));p.y+=.13+clearance-low;solve(p);frame();}
 }
 if(action==='forage')rotateJoint(m,m.head,V(0,0,1),.16+.018*Math.sin(t*1.6));
 if(action==='rest')rotateJoint(m,m.head,V(0,0,1),.035);
 // Quiet erect/listening pinnae instead of treating the source's broad splay
 // as the neutral posture in every action. Angles are qualitative, not measured.
 for(const [i,ear]of m.rabbitRig.ears.entries()){
  rotateJoint(m,ear,V(1,0,0),(i?-1:1)*(action==='forage'?.28:moving?.38:.45)+(action==='observe'?.015*Math.sin(t*.7+i):0));
  const child=ear.children.find(b=>b.isBone);if(child){m.root.updateMatrixWorld(true);const axis=child.getWorldPosition(V()).sub(ear.getWorldPosition(V())).normalize().applyQuaternion(m.root.getWorldQuaternion(new T.Quaternion()).invert());rotateJoint(m,ear,axis,(i?-1:1)*Math.PI/2);}
 }
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});return true;
}
