import * as T from 'three';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const resting=new Set(['sit','rest','sleep']);
export const hasMammalPosture=(m,action)=>['canis-lupus','panthera-tigris'].includes(m.id)&&resting.has(action);

// Curated joint directions preserve source segment lengths. Unlike a free CCD
// solve, explicit elbow/knee/hock targets prevent the folded limb from inverting.
function aim(m,bone,child,target){
 if(!bone||!child)return;m.root.updateMatrixWorld(true);
 const p=bone.getWorldPosition(V()),from=child.getWorldPosition(V()).sub(p),to=m.root.localToWorld(target.clone()).sub(p);
 if(from.lengthSq()<1e-10||to.lengthSq()<1e-10)return;
 const q=new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize()),parent=bone.parent.getWorldQuaternion(new T.Quaternion());
 bone.quaternion.premultiply(parent.clone().invert().multiply(q).multiply(parent));bone.updateWorldMatrix(false,true);
}
function rotate(m,bone,axis,angle){if(!bone)return;m.root.updateMatrixWorld(true);const a=axis.clone().applyQuaternion(m.root.getWorldQuaternion(new T.Quaternion())).applyQuaternion(bone.parent.getWorldQuaternion(new T.Quaternion()).invert());bone.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(a,angle));}
function move(m,bone,dy){if(!bone)return;m.root.updateMatrixWorld(true);const p=bone.getWorldPosition(V()).add(V(0,dy,0));bone.position.copy(bone.parent.worldToLocal(p));}
function flattenToe(m,bone){const child=bone?.children.find(b=>b.isBone);if(!child)return;const p=m.root.worldToLocal(bone.getWorldPosition(V()));aim(m,bone,child,p.clone().add(V(.2,0,0)));}
function pawVertices(m,l){
 const names=new Set([l.end,...l.end.children.filter(b=>b.isBone),...(!l.front||m.id==='panthera-tigris'?[l.chain.at(-1)]:[])].map(b=>b.name)),out=[];
 m.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const {skinIndex:si,skinWeight:sw,position:p}=mesh.geometry.attributes;const indices=['getX','getY','getZ','getW'];for(let i=0;i<p.count;i++){let weight=0;for(const k of indices)if(names.has(mesh.skeleton.bones[si[k](i)]?.name))weight+=sw[k](i);if(weight>.5)out.push([mesh,i]);}});return out;
}
function settlePaws(m){
 m.pawSamples??=m.limbs.map(l=>pawVertices(m,l));
 for(let n=0;n<12;n++)for(let i=0;i<m.limbs.length;i++){
  const l=m.limbs[i];m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  let min=Infinity;for(const [mesh,index] of m.pawSamples[i])min=Math.min(min,mesh.getVertexPosition(index,V()).applyMatrix4(mesh.matrixWorld).y);
  if(!Number.isFinite(min)||Math.abs(min-.135)<.004)continue;
  const target=l.end.getWorldPosition(V());target.y+=Math.max(-.045,Math.min(.045,.135-min));m.root.worldToLocal(target);
  for(const joint of [...l.chain].reverse().filter(b=>b!==l.end))aim(m,joint,l.end,target);
  flattenToe(m,l.front&&m.id==='canis-lupus'?l.end.children.find(b=>b.isBone):l.end);
 }
}
export {aim as aimJoint,rotate as rotateJoint};

export function applyMammalPosture(m,action){
 if(!hasMammalPosture(m,action))return false;
 const wolf=m.id==='canis-lupus',sitting=action==='sit',sleeping=action==='sleep';
 move(m,m.body,sitting?(wolf?-1.0:-.95):(wolf?-1.18:-.78));
 if(sitting)rotate(m,m.body,V(0,0,1),wolf?.43:.55);
 else{rotate(m,m.neck,V(0,0,1),sleeping?-.27:-.08);rotate(m,m.head,V(0,0,1),sleeping?-.42:-.08);}
 const jaw=m.bones.find(b=>wolf?/^jaw_/.test(b.name):/^Bone03_/.test(b.name));rotate(m,jaw,V(0,0,1),wolf?.19:.12);
 m.root.updateMatrixWorld(true);
 for(const l of m.limbs){
  const side=Math.sign(l.home.z)||1,c=l.chain;
  if(l.front){
   if(wolf){
    const shoulder=m.root.worldToLocal(c[0].getWorldPosition(V())),x=sitting?shoulder.x+.12:.18;
    aim(m,c[0],c[1],V(x,sitting?1.38:.53,side*.28));
    aim(m,c[1],c[2],V(sitting?x+.04:.43,sitting?.84:.22,side*.30));
    aim(m,c[2],l.end,V(sitting?x+.04:1.01,sitting?.27:.20,side*.30));
    const toe=l.end.children.find(b=>b.isBone);aim(m,l.end,toe,V(sitting?x+.18:1.25,.20,side*.30));flattenToe(m,toe);
   }else{
    const shoulder=m.root.worldToLocal(c[0].getWorldPosition(V())),x=sitting?shoulder.x-.1:.61;
    aim(m,c[0],c[1],V(x,sitting?.82:.28,side*.30));
    aim(m,c[1],c[2],V(sitting?x+.06:1.10,sitting?.30:.21,side*.32));
    aim(m,c[2],l.end,V(sitting?x+.14:1.31,.18,side*.32));flattenToe(m,l.end);
   }
  }else{
   const hip=m.root.worldToLocal(c[0].getWorldPosition(V())),kneeX=hip.x+(wolf?.48:.44),z=side*(sitting?.38:.46);
   aim(m,c[0],c[1],V(kneeX,.29,z));
   aim(m,c[1],c[2],V(hip.x-.12,.22,side*(sitting?.42:.61)));
   if(wolf){aim(m,c[2],l.end,V(hip.x+.40,.20,side*(sitting?.43:.63)));flattenToe(m,l.end);}
   else{aim(m,c[2],c[3],V(hip.x+.18,.21,side*(sitting?.43:.66)));aim(m,c[3],l.end,V(hip.x+.38,.18,side*(sitting?.44:.67)));flattenToe(m,l.end);}
  }
 }
 // Lay the flexible tail beside the hips rather than lowering it through the floor.
 const tailNames=wolf?[/^spine003_/,/^spine002_/,/^spine001_/,/^spine_/,/^spine_end_/]:[/^Bip01_Tail_/,/^Bip01_Tail1_/,/^Bip01_Tail2_/,/^Bip01_Tail3_/,/^Bip01_TailNub_/];
 const tail=tailNames.map(re=>m.bones.find(b=>re.test(b.name))),hip=tail[0]?m.root.worldToLocal(tail[0].getWorldPosition(V())):V();
 const targets=[V(hip.x-.25,.44,-.17),V(hip.x-.44,.25,-.42),V(hip.x-.46,.20,-.80),V(hip.x-.12,.20,-1.02)];
 for(let i=0;i<tail.length-1;i++)aim(m,tail[i],tail[i+1],targets[i]);
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 const min=new T.Box3().setFromObject(m.root,true).min.y;m.root.position.y=.13-min;
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 settlePaws(m);
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 return true;
}
