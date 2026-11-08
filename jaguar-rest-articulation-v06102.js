import{prepareRestWeights,applyRestWeights}from './jaguar-rest-weights-v06102.js';
import * as T from 'three';import{aimJoint,solveTwoLink,rotateJoint}from './joint-kinematics.js';import{setWorldFrame}from './paw-frames.js';
const V=(...a)=>new T.Vector3(...a),sm=T.MathUtils.smoothstep;
function update(m){m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});}
export function poseJaguarRest(m,time,options={}){
 const r=m.jaguarWalk;for(const[o,p]of r.neutral){o.position.copy(p.position);o.quaternion.copy(p.quaternion);o.scale.copy(p.scale);}m.root.position.set(0,0,0);m.root.quaternion.identity();m.root.scale.setScalar(1);update(m);
 const distalFrames=new Map();if(options.distalSupport)for(const l of r.limbs.filter(l=>l.front)){const distal=l.paw.children.find(o=>o.isBone&&/^Fingers1_/.test(o.name));if(distal)distalFrames.set(distal,distal.getWorldQuaternion(new T.Quaternion()));}const t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,8),lower=sm(t,2.2,6.5),drop=(options.drop??.74)*lower;m.root.position.y=-drop;update(m);
 if(!m.jaguarRestWeights){m.root.position.y=0;update(m);m.jaguarRestWeights=prepareRestWeights(m);m.root.position.y=-drop;update(m);}applyRestWeights(m.jaguarRestWeights,lower);
 for(const bone of m.bones.filter(x=>/^Scapula_[LR]_/.test(x.name)))rotateJoint(m,bone,V(0,0,1),(options.scapula??.50)*lower);update(m);
 const states=[];
 for(const l of r.limbs){const start=l.side==='L'?2.2:4.4,duration=l.side==='L'?2.2:1.5,u=l.front?T.MathUtils.clamp((t-start)/duration,0,1):0,step=((options.pawX??1.65)-l.home.x)*sm(u,0,1),lift=.12*Math.sin(Math.PI*u)**2,target=l.home.clone().add(V(step,drop+lift,0));
  const ankle=l.front?null:l.ankle.clone().lerp(V(l.ankle.length(),-.04,l.ankle.z).normalize().multiplyScalar(l.ankle.length()),lower).normalize().multiplyScalar(l.ankle.length());
  const place=()=>{if(l.front)solveTwoLink(m,l.upper,l.middle,l.paw,target,l.pole);else{solveTwoLink(m,l.upper,l.middle,l.hock,target.clone().sub(ankle),l.pole.clone().lerp(V(1,0,l.side==='L'?-.1:.1),lower).normalize());aimJoint(m,l.hock,l.paw,target);}const frame=l.frame.clone();if(l.front&&options.wristTilt)frame.premultiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),options.wristTilt*lower));setWorldFrame(l.paw,frame);if(l.front&&options.distalSupport)for(const[bone,q]of distalFrames)if(bone.parent===l.paw)setWorldFrame(bone,q);update(m);};place();
  for(let k=0;k<8;k++){const low=Math.min(...l.samples.map(([mesh,i])=>mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).y)),error=l.sole+lift-low;if(Math.abs(error)<.0002)break;target.y+=T.MathUtils.clamp(error,-.04,.04);place();}
  states.push({front:l.front,side:l.side,targetError:m.root.worldToLocal(l.paw.getWorldPosition(V())).distanceTo(target),sole:Math.min(...l.samples.map(([mesh,i])=>mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).y)),lift});
 }
 for(const bone of m.bones.filter(x=>/^Tail/.test(x.name)&&!x.name.includes('end'))){const child=bone.children.find(x=>x.isBone);if(!child)continue;const p=m.root.worldToLocal(bone.getWorldPosition(V())),c=m.root.worldToLocal(child.getWorldPosition(V())),dir=c.clone().sub(p),length=dir.length();dir.normalize().lerp(V(-.25,Math.min(0,drop+.24-p.y),.06).normalize(),lower).normalize();aimJoint(m,bone,child,p.addScaledVector(dir,length));}
 update(m);return{t,lower,drop,states,scope:'Authored external posture; no measured kinematics or physiological sleep claim'};
}
