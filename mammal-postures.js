import * as T from 'three';
import {restorePawFrame} from './paw-frames.js';
import {aimJoint as aim,rotateJoint as rotate,solveTwoLink} from './joint-kinematics.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const resting=new Set(['sit','rest','sleep']);
export const hasMammalPosture=(m,action)=>['canis-lupus','panthera-tigris'].includes(m.id)&&resting.has(action);

// Joint directions and elbow/knee poles preserve the source segment lengths.
// Support cues are display constraints, not validated biomechanics.
function move(m,bone,dy){if(!bone)return;m.root.updateMatrixWorld(true);const p=bone.getWorldPosition(V()).add(V(0,dy,0));bone.position.copy(bone.parent.worldToLocal(p));}
function groundTrunk(m,action){
 const key=action==='sit'?'sit':'rest';if(!m.trunkSamples?.[key]?.length)throw Error('Source rig has no defined torso support region.');
 let min=Infinity;for(const [mesh,index] of m.trunkSamples[key])min=Math.min(min,mesh.getVertexPosition(index,V()).applyMatrix4(mesh.matrixWorld).y);
 if(Number.isFinite(min))m.root.position.y+=.13-min;
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 return Number.isFinite(min)?.13-min:0;
}
function foldedHind(m,l,target){
 const c=l.chain,hock=c[2],effector=l.wrist||l.end;
 m.root.updateMatrixWorld(true);const length=hock.getWorldPosition(V()).distanceTo(effector.getWorldPosition(V())),metatarsus=V(1,-.23,0).normalize().multiplyScalar(length),hockTarget=target.clone().sub(metatarsus);
 solveTwoLink(m,c[0],c[1],hock,hockTarget,V(1,0,0));aim(m,hock,effector,target);restorePawFrame(m,l);
}
function settlePaws(m,action){
 if(!m.pawSamples?.every(s=>s.length))throw Error('Source rig has no defined digit/paw regions.');
 for(let n=0;n<30;n++){let adjusted=false;for(let i=0;i<m.limbs.length;i++){
  const l=m.limbs[i];m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  // Forepaws support sternal repose. Folded hind feet may rest on their sides;
  // enforcing four plantar contacts distorts a cat's relaxed hind-limb fold.
  if(!l.front&&action!=='sit')continue;
  let min=Infinity;for(const [mesh,index] of m.pawSamples[i])min=Math.min(min,mesh.getVertexPosition(index,V()).applyMatrix4(mesh.matrixWorld).y);
  if(!Number.isFinite(min)||Math.abs(min-.135)<.004)continue;
  adjusted=true;
  const effector=l.wrist||l.end,target=effector.getWorldPosition(V());target.y+=Math.max(-.045,Math.min(.045,.135-min));m.root.worldToLocal(target);
  if(l.front){const c=l.chain;m.id==='canis-lupus'?solveTwoLink(m,c[1],c[2],effector,target,V(-1,0,0)):solveTwoLink(m,c[0],c[1],effector,target,V(-1,0,0));}
  else foldedHind(m,l,target);
  restorePawFrame(m,l);
 }if(!adjusted)break;}
}
export {aim as aimJoint,rotate as rotateJoint};

export function applyMammalPosture(m,action){
 if(!hasMammalPosture(m,action))return false;
 const wolf=m.id==='canis-lupus',sitting=action==='sit',sleeping=action==='sleep';
 move(m,m.body,sitting?(wolf?-1.0:-.95):(wolf?-1.18:-.78));
 if(sleeping&&!wolf)rotate(m,m.body,V(1,0,0),.35);
 if(sitting)rotate(m,m.body,V(0,0,1),wolf?.43:.55);
 else{rotate(m,m.neck,V(0,0,1),sleeping?-.27:-.08);rotate(m,m.head,V(0,0,1),sleeping?-.42:-.08);}
 const jaw=m.bones.find(b=>wolf?/^jaw_/.test(b.name):/^Bone03_/.test(b.name));rotate(m,jaw,V(0,0,1),wolf?.14:.12);
 m.root.updateMatrixWorld(true);
 for(const l of m.limbs){
  const side=Math.sign(l.home.z)||1,c=l.chain;
  if(l.front){
   if(wolf){
    const shoulder=m.root.worldToLocal(c[0].getWorldPosition(V())),x=sitting?shoulder.x+.12:shoulder.x+.42;
    aim(m,c[0],c[1],V(x,sitting?1.38:shoulder.y-.10,side*.28));
    if(sitting){aim(m,c[1],c[2],V(x+.04,.84,side*.30));aim(m,c[2],l.end,V(x+.04,.36,side*.30));}
    else{const upper=m.root.worldToLocal(c[1].getWorldPosition(V()));solveTwoLink(m,c[1],c[2],l.end,V(upper.x+.16,.32,side*.30),V(-1,0,0));}
   }else{
    const shoulder=m.root.worldToLocal(c[0].getWorldPosition(V())),x=sitting?shoulder.x-.1:.61;
    aim(m,c[0],c[1],V(x,sitting?.82:.28,side*.30));
    aim(m,c[1],c[2],V(sitting?x+.06:1.10,sitting?.30:.21,side*.32));
   }
  }else{
   const hip=m.root.worldToLocal(c[0].getWorldPosition(V())),kneeX=hip.x+(wolf?.48:.44);
   if(!wolf&&!sitting){
    solveTwoLink(m,c[0],c[1],c[2],V(hip.x+.10,.13,side*.43),V(1,0,0));
    const hock=m.root.worldToLocal(c[2].getWorldPosition(V()));aim(m,c[2],c[3],hock.clone().add(V(.4,0,0)));
   }else{
    aim(m,c[0],c[1],V(kneeX,sitting?.38:.38,side*(sitting?.38:.46)));
    aim(m,c[1],c[2],V(hip.x-.12,sitting?.22:.28,side*(sitting?.42:.61)));
    if(wolf)aim(m,c[2],l.end,V(hip.x+.40,.20,side*(sitting?.43:.63)));
    else aim(m,c[2],c[3],V(hip.x+.18,.24,side*.43));
   }
  }
  restorePawFrame(m,l,!l.front&&!sitting?(wolf?0:side*.35):0);
 }
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});groundTrunk(m,action);
 // The torso establishes support height; the flexible tail must adapt to it.
 const tailNames=wolf?[/^spine003_/,/^spine002_/,/^spine001_/,/^spine_/,/^spine_end_/]:[/^Bip01_Tail_/,/^Bip01_Tail1_/,/^Bip01_Tail2_/,/^Bip01_Tail3_/,/^Bip01_TailNub_/];
 const tail=tailNames.map(re=>m.bones.find(b=>re.test(b.name))),hip=tail[0]?m.root.worldToLocal(tail[0].getWorldPosition(V())):V();
 const floor=.13-m.root.position.y,targets=[V(hip.x-.25,floor+.32,-.17),V(hip.x-.44,floor+.25,-.42),V(hip.x-.46,floor+.20,-.80),V(hip.x-.12,floor+.20,-1.02)];
 for(let i=0;i<tail.length-1;i++)aim(m,tail[i],tail[i+1],targets[i]);
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 settlePaws(m,action);
 if(sitting)for(let i=0;i<6;i++){const correction=groundTrunk(m,action);if(Math.abs(correction)<.002)break;settlePaws(m,action);}
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 return true;
}
