// Qualitative external jump on the retained artist skeleton. No snow penetration,
// prey capture, measured trajectory, muscle forces or impact prediction.
import * as T from 'three';import {aimJoint,solveTwoLink,rotateJoint} from './joint-kinematics.js';import {setWorldFrame} from './paw-frames.js';
const V=(...a)=>new T.Vector3(...a),sm=T.MathUtils.smoothstep;
function update(m){m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});}
function place(m,l,target,frame,digits){const c=l.chain;if(l.front)solveTwoLink(m,c[0],c[1],l.wrist,target,V(-1,0,0));else{const hock=target.clone().sub(l.ankle);solveTwoLink(m,c[0],c[1],c[2],hock,V(1,0,0));aimJoint(m,c[2],l.wrist,target);}setWorldFrame(l.wrist,frame);setWorldFrame(l.digits,digits);update(m);}
export function foxJump(m,time){
 if(!m.foxJumpHomes){m.foxJumpHomes=m.limbs.map((l,i)=>{const target=l.home.clone();for(let pass=0;pass<10;pass++){place(m,l,target,l.frame,l.digitFrame);let low=Infinity;for(const[mesh,index]of m.pawSamples[i])low=Math.min(low,mesh.getVertexPosition(index,V()).applyMatrix4(mesh.matrixWorld).y);const error=.135-low;if(Math.abs(error)<.0001)break;target.y+=T.MathUtils.clamp(error,-.045,.045);}return target;});}
 const t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,5),u=T.MathUtils.clamp((t-2)/1.6,0,1),air=t>2&&t<3.6;
 const crouch=sm(t,.6,1.4)*(1-sm(t,1.4,2)),compress=sm(t,3.6,3.85)*(1-sm(t,3.85,4.7));
 const pitch=.28*Math.sin(2*Math.PI*u),rotation=new T.Quaternion().setFromAxisAngle(V(0,0,1),pitch),center=V(0,.8,0);
 m.root.position.set(.9*u,.8*4*u*(1-u)-.12*crouch-.10*compress,0);m.root.quaternion.copy(rotation);m.root.position.add(center.clone().sub(center.clone().applyQuaternion(rotation)));update(m);
 for(const [i,l]of m.limbs.entries()){
  const initialFrontLift=.05*sm(t,1.6,2),endingHindLift=.08*sm(u,.7,1)*(1-sm(t,3.6,3.9));
  const lift=air?.20*Math.sin(Math.PI*u)+(l.front?.05*(1-u):endingHindLift):t<=2?(l.front?initialFrontLift:0):(l.front?0:endingHindLift);
  const target=m.foxJumpHomes[i].clone();let frame=l.frame.clone(),digits=l.digitFrame.clone();
  if(air){target.y+=lift;target.x+=(l.front?-.10:.07)*Math.sin(Math.PI*u);const blend=1-sm(u,.65,1);frame=rotation.clone().multiply(frame).slerp(l.frame,1-blend);digits=rotation.clone().multiply(digits).slerp(l.digitFrame,1-blend);}
  else {target.x+=.9*u;target.y+=lift;target.copy(m.root.worldToLocal(target));}
  place(m,l,target,frame,digits);
  if(!air){for(let pass=0;pass<10;pass++){let low=Infinity;for(const[mesh,index]of m.pawSamples[i])low=Math.min(low,mesh.getVertexPosition(index,V()).applyMatrix4(mesh.matrixWorld).y);const error=.135+lift-low;if(Math.abs(error)<.002)break;target.y+=T.MathUtils.clamp(error,-.045,.045);place(m,l,target,frame,digits);}}
 }
 rotateJoint(m,m.neck,V(0,0,1),-.10*crouch);rotateJoint(m,m.tail,V(0,0,1),-.18*Math.sin(Math.PI*u));update(m);
 const stage=t>=5?'Study complete':t<.6?'Supported start':t<1.4?'Preparatory crouch':t<2?'Extension and forepaw release':t<3.6?'Airborne limb folding':t<3.9?'Forepaw support and hindpaw recovery':'Supported recovery';
 m.movementStudy={duration:5,time:t,stage};m.root.userData.movementStudy={...m.movementStudy,finite:true,measured:false};m.root.userData.foxJumpStudy={air,crouch,pitch,u,compress,version:'0.6.88',measured:false};
 m.motionBounds??={};m.motionBounds.jump??=new T.Box3(V(-1.9450000006005081,0.06499996561465465,-0.9281025501184919),V(2.8638879687318073,3.5125569469543314,0.9313472572071149));
 return{time:t,air,crouch,pitch,u,compress};
}
