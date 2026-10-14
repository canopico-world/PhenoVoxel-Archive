import * as T from 'three';
const Q=()=>new T.Quaternion();
export function capturePawFrames(m){
 if(!['canis-lupus','panthera-tigris'].includes(m.id))return;
 m.root.updateMatrixWorld(true);
 for(const l of m.limbs){
  const tiger=m.id==='panthera-tigris';
  l.wrist=tiger?l.chain.at(-1):l.end;
  l.digits=l.front&&!tiger?l.end.children.find(b=>b.isBone):l.end;
  l.wristFrame=l.wrist.getWorldQuaternion(Q());l.digitFrame=l.digits.getWorldQuaternion(Q());
 }
 const bodyNames=new Set(m.bones.filter(b=>m.id==='canis-lupus'?/^(spine00[4-8]_|breast[LR]_)/.test(b.name):/^Bip01_(Pelvis|Spine[012]?)_/.test(b.name)).map(b=>b.name));
 const feet=m.limbs.map(l=>({names:new Set((m.id==='canis-lupus'?[l.digits,...l.digits.children.filter(b=>b.isBone)]:[l.end,l.wrist,l.digits,...l.digits.children.filter(b=>b.isBone)]).map(b=>b.name))}));
 const hips=m.limbs.filter(l=>!l.front).map(l=>({name:l.chain[0].name,point:l.chain[0].getWorldPosition(new T.Vector3())}));m.pawSamples=m.limbs.map(()=>[]);m.trunkSamples={rest:[],sit:[]};
 const hipNames=new Set([...hips.map(h=>h.name),...m.bones.filter(b=>/^pelvis[LR]_/.test(b.name)).map(b=>b.name)]);
 m.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const {position:p,skinIndex:si,skinWeight:sw}=mesh.geometry.attributes,indices=new Set(mesh.geometry.index?.array||Array.from({length:p.count},(_,i)=>i));
  for(const i of indices){const point=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld),weights=['getX','getY','getZ','getW'].map(k=>({name:mesh.skeleton.bones[si[k](i)]?.name,weight:sw[k](i)})),core=weights.reduce((sum,b)=>sum+(bodyNames.has(b.name)?b.weight:0),0);
   if(core>.7){m.trunkSamples.rest.push([mesh,i]);m.trunkSamples.sit.push([mesh,i]);}
   else if(hips.some(h=>point.distanceTo(h.point)<.52)&&core+weights.reduce((sum,b)=>sum+(hipNames.has(b.name)?b.weight:0),0)>.6)m.trunkSamples.sit.push([mesh,i]);
   for(const [j,f] of feet.entries())if(weights.reduce((sum,b)=>sum+(f.names.has(b.name)?b.weight:0),0)>(m.id==='canis-lupus'?.2:.5))m.pawSamples[j].push([mesh,i]);
  }
 });
}
export function setWorldFrame(bone,q){if(!bone)return;bone.updateWorldMatrix(true,false);bone.quaternion.copy(bone.parent.getWorldQuaternion(Q()).invert().multiply(q));bone.updateWorldMatrix(false,true);}
export function restorePawFrame(m,l,sideRoll=0){
 if(!l.wristFrame)return;
 const roll=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),sideRoll);
 const repose=['rest','sleep'].includes(m.current),pitch=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),repose?(l.front?.95:.40):0);
 setWorldFrame(l.wrist,pitch.multiply(roll).multiply(l.wristFrame));
 if(l.digits!==l.wrist)setWorldFrame(l.digits,roll.clone().multiply(l.digitFrame));
}
