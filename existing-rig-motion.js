import * as T from 'three';
import {aimJoint,rotateJoint} from './mammal-postures.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export const largeMammalPhase=(kind,index,t)=>(t*.48-(kind==='giraffe'?[.16,0,.66,.50]:[.22,0,.72,.50])[index]+10)%1;
export function repairExistingHierarchy(scene,id){
 if(id!=='giraffa-camelopardalis')return;
 scene.updateMatrixWorld(true);
 const bone=n=>scene.getObjectByName(`Bone${String(n).padStart(3,'0')}_Armature`);
 // The imported limb joints were siblings. Preserve bind-world transforms while
 // restoring four chains, so a proximal joint can carry its distal segments.
 for(const n of [17,20,23,26]){bone(n)?.attach(bone(n+1));bone(n+1)?.attach(bone(n+2));}
 scene.updateMatrixWorld(true);
}
export function configureExistingRig(m){
 const find=re=>m.bones.find(b=>re.test(b.name)),make=(chain,end,front)=>{if(!end||chain.some(b=>!b))return;return {chain,end,front,home:m.root.worldToLocal(end.getWorldPosition(V()))};};
 if(m.id==='loxodonta-africana'){
  for(const side of ['L','R']){m.limbs.push(make([find(new RegExp('Bip01_'+side+'_UpperArm_')),find(new RegExp('Bip01_'+side+'_Forearm_'))],find(new RegExp('Bip01_'+side+'_Hand_')),true));m.limbs.push(make([find(new RegExp('Bip01_'+side+'_Thigh_')),find(new RegExp('Bip01_'+side+'_Calf_'))],find(new RegExp('Bip01_'+side+'_Foot_')),false));}
  m.neck=find(/Bip01_Neck_/);m.head=find(/Bip01_Head_/);m.existingRig='elephant';m.forward=1;
 }else if(m.id==='giraffa-camelopardalis'){
  const b=n=>find(new RegExp(`^Bone${String(n).padStart(3,'0')}_Armature$`));
  for(const n of [17,23,20,26])m.limbs.push(make([b(n),b(n+1)],b(n+2),n===17||n===20));
  m.neck=b(30);m.head=b(35);m.existingRig='giraffe';m.forward=-1;
 }else if(m.id==='oryctolagus-cuniculus'){
  for(const side of ['L','R']){m.limbs.push(make([find(new RegExp('upper_arm'+side+'_')),find(new RegExp('forearm'+side+'_')),find(new RegExp('hand'+side+'_'))],find(new RegExp('f_toe'+side+'_')),true));m.limbs.push(make([find(new RegExp('thigh'+side+'_')),find(new RegExp('shin'+side+'_')),find(new RegExp('foot'+side+'_'))],find(new RegExp('r_toe'+side+'_')),false));}
  m.head=find(/^spine005_/);m.existingRig='rabbit';m.forward=-1;
 }
 if(['elephant','giraffe'].includes(m.existingRig)){
  m.root.updateMatrixWorld(true);
  for(const l of m.limbs.filter(Boolean)){l.frame=l.end.getWorldQuaternion(new T.Quaternion());l.samples=[];const region=new Set();l.end.traverse(b=>{if(b.isBone)region.add(b);});
   m.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const a=mesh.geometry.attributes,used=new Set(mesh.geometry.index?.array||Array.from({length:a.position.count},(_,i)=>i));for(const i of used){let weight=0;for(const k of ['getX','getY','getZ','getW'])if(region.has(mesh.skeleton.bones[a.skinIndex[k](i)]))weight+=a.skinWeight[k](i);if(weight<.20)continue;const point=m.root.worldToLocal(mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld));if(point.y<.60)l.samples.push([mesh,i]);}});
  }
 }
}
function restoreFoot(m,l){if(!l.frame)return;const parent=l.end.parent.getWorldQuaternion(new T.Quaternion()),frame=m.root.getWorldQuaternion(new T.Quaternion()).multiply(l.frame);l.end.quaternion.copy(parent.invert().multiply(frame));m.root.updateMatrixWorld(true);}
function settleLargeFoot(m,l,desired){if(!l.samples.length)return;for(let pass=0;pass<5;pass++){m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});let min=Infinity;for(const[mesh,i]of l.samples)min=Math.min(min,mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).y);if(!Number.isFinite(min)||Math.abs(min-desired)<.002)break;const target=m.root.worldToLocal(l.end.getWorldPosition(V()));target.y+=desired-min;twoLink(m,l,target);restoreFoot(m,l);}}
function twoLink(m,l,target){
 const [a,b]=l.chain,c=l.end;m.root.updateMatrixWorld(true);
 const p=m.root.worldToLocal(a.getWorldPosition(V())),joint=m.root.worldToLocal(b.getWorldPosition(V())),end=m.root.worldToLocal(c.getWorldPosition(V())),L1=p.distanceTo(joint),L2=joint.distanceTo(end),delta=target.clone().sub(p),d=T.MathUtils.clamp(delta.length(),Math.abs(L1-L2)+.0001,L1+L2-.0001),dir=delta.normalize();
 let pole=joint.clone().sub(p);pole.addScaledVector(dir,-pole.dot(dir));if(pole.lengthSq()<1e-6)pole=V(m.forward*(l.front?-1:1),0,0).addScaledVector(dir,-dir.x*m.forward*(l.front?-1:1));pole.normalize();
 const along=(L1*L1+d*d-L2*L2)/(2*d),height=Math.sqrt(Math.max(0,L1*L1-along*along)),knee=p.clone().addScaledVector(dir,along).addScaledVector(pole,height);
 aimJoint(m,a,b,knee);aimJoint(m,b,c,p.clone().addScaledVector(dir,d));
}
export function animateExistingRig(m,action,t,{solveLimb}){
 if(!m.existingRig)return false;
 if(m.existingRig==='rabbit'){
  if(action==='forage')rotateJoint(m,m.head,V(0,0,1),.18+.035*Math.sin(t*2));
  if(['jump','escape'].includes(action)){const u=(t*(action==='escape'?1.5:.85))%1,height=Math.sin(u*Math.PI)*.44;m.root.position.y=height;
   for(const l of m.limbs){const p=l.home.clone(),drive=Math.sin(u*Math.PI*2);p.x+=m.forward*drive*(l.front?.15:.26);p.y+=Math.max(0,-drive)*(l.front?.08:.16);solveLimb(m,l,p);}
  }
 }else{
  if(action==='walk'){
   // A slight authored support-height allowance avoids trying to extend a
   // nearly straight source limb beyond its fixed segment lengths.
   m.root.position.y=-.018;
   for(const [i,l] of m.limbs.entries()){const u=largeMammalPhase(m.existingRig,i,t),stance=.78,p=l.home.clone(),clearance=u<stance?0:Math.sin((u-stance)/(1-stance)*Math.PI)*.12;p.x+=m.forward*(u<stance?.18*(.5-u/stance):.18*(-.5+(u-stance)/(1-stance)));p.y+=clearance;twoLink(m,l,p);restoreFoot(m,l);settleLargeFoot(m,l,.13+clearance);}
  }
  if(m.existingRig==='elephant'){
   const curl=action==='forage'?.5+.5*Math.sin(t*.8):0;
   for(const [i,b] of m.bones.filter(b=>/^BN_Nose_0[1-6]_/.test(b.name)).entries())rotateJoint(m,b,V(0,0,1),-curl*[.08,.22,.30,.26,.15,.05][i]);
   if(['walk','forage'].includes(action))for(const b of m.bones.filter(b=>/^BN_Ear_[LR]_01_/.test(b.name)))rotateJoint(m,b,V(0,1,0),Math.sin(t*1.8)*.09);
  }else if(action==='forage')rotateJoint(m,m.neck,V(0,0,1),.35+.06*Math.sin(t*.7));
 }
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 // No fabricated recumbency: elephant/giraffe rest/sleep retain their standing
 // support pose, and the rabbit retains its creator-authored crouch.
 return true;
}
