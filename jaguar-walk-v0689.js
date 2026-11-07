import * as T from 'three';
import {aimJoint,solveTwoLink} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
const V=(...a)=>new T.Vector3(...a),Q=()=>new T.Quaternion(),sm=T.MathUtils.smoothstep;
function update(m){m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});}
function place(m,l,target){
 if(l.front)solveTwoLink(m,l.upper,l.middle,l.paw,target,l.pole);
 else{solveTwoLink(m,l.upper,l.middle,l.hock,target.clone().sub(l.ankle),l.pole);aimJoint(m,l.hock,l.paw,target);}
 setWorldFrame(l.paw,l.frame);update(m);
}
export function configureJaguarWalk(m){
 const clip=m.mixer.clipAction(m.jaguarSequence.clip);clip.reset().play();m.mixer.setTime(0);update(m);
 const neutral=new Map();m.gltf.scene.traverse(o=>neutral.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()}));clip.stop();
 for(const[o,p]of neutral){o.position.copy(p.position);o.quaternion.copy(p.quaternion);o.scale.copy(p.scale);}update(m);
 const find=(name,side)=>m.bones.find(b=>b.name.startsWith(name+'_'+side+'_'));
 const limbs=[];
 for(const side of ['L','R'])for(const front of [false,true]){
  const upper=find(front?'Shoulder':'Hip',side),middle=find(front?'Elbow':'Knee',side),hock=front?null:find('Ankle',side),paw=find(front?'Wrist':'Toes1',side);
  if(!upper||!middle||!paw||(!front&&!hock))throw Error('Incomplete jaguar limb');
  const pos=o=>m.root.worldToLocal(o.getWorldPosition(V())),home=pos(paw),axis=pos(front?paw:hock).sub(pos(upper)).normalize(),pole=pos(middle).sub(pos(upper));pole.addScaledVector(axis,-pole.dot(axis)).normalize();
  const names=new Set();paw.traverse(o=>{if(o.isBone)names.add(o.name);});const samples=[];
  m.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const{position:p,skinIndex:si,skinWeight:sw}=mesh.geometry.attributes;for(let i=0;i<p.count;i++){let w=0;for(const k of ['getX','getY','getZ','getW'])if(names.has(mesh.skeleton.bones[si[k](i)]?.name))w+=sw[k](i);if(w>.7)samples.push([mesh,i]);}});
  limbs.push({side,front,upper,middle,hock,paw,home,frame:paw.getWorldQuaternion(Q()),pole,ankle:front?null:home.clone().sub(pos(hock)),samples});
 }
 m.jaguarWalk={neutral,limbs};
 for(const l of limbs){let low=Infinity;for(const[mesh,i]of l.samples)low=Math.min(low,mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).y);l.sole=low;}
 delete m.clipMap.walk;
 m.motionBounds.walk=new T.Box3(V(-1.945,.06,-.527),V(2.825,2.054,.527));
}
// Slow lateral-sequence walking is a comparative felid reconstruction. No fitted
// jaguar timing, force balance, muscle activity, or physiological validation.
export function jaguarWalk(m,time){
 const r=m.jaguarWalk;for(const[o,p]of r.neutral){o.position.copy(p.position);o.quaternion.copy(p.quaternion);o.scale.copy(p.scale);}m.root.position.set(0,0,0);m.root.quaternion.identity();m.root.scale.setScalar(1);update(m);
 const t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,9),progress=sm(t,.4,8.6),travel=.88*progress;
 m.root.position.x=travel;update(m);const states=[];
 for(const [index,l]of r.limbs.entries()){
  let step=0,lift=0,swing=false;for(let cycle=0;cycle<2;cycle++){const start=.6+index+cycle*4,u=T.MathUtils.clamp((t-start)/.75,0,1);step+=.44*sm(u,0,1);if(u>0&&u<1){swing=true;lift=.14*Math.pow(Math.sin(Math.PI*u),2);}}
  const target=l.home.clone().add(V(step-travel,lift,0));place(m,l,target);
  // Retain each original paw's support datum; correction is local to its limb.
  for(let pass=0;pass<8;pass++){let low=Infinity;for(const[mesh,i]of l.samples)low=Math.min(low,mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).y);const error=l.sole+lift-low;if(Math.abs(error)<.0002)break;target.y+=T.MathUtils.clamp(error,-.035,.035);place(m,l,target);}
  states.push({side:l.side,front:l.front,swing,step,lift,target:target.clone().add(V(travel,0,0)).toArray()});
 }
 const moving=states.find(l=>l.swing),stage=t>=9?'Study complete':moving?`${moving.side==='L'?'Left':'Right'} ${moving.front?'forepaw':'hindpaw'} swing`:'Planted-paw support';
 m.movementStudy={duration:9,time:t,stage};m.root.userData.movementStudy={...m.movementStudy,finite:true,measured:false};m.root.userData.jaguarWalkStudy={version:'0.6.89',states,travel,measured:false};
 return {time:t,states,travel};
}
