import * as T from 'three';
import {aimJoint,solveTwoLink} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
const V=(...a)=>new T.Vector3(...a),sm=T.MathUtils.smoothstep,cl=T.MathUtils.clamp;
// A finite, authored phase study: one rotary sequence already in progress, not start/stop running.
// Order RF, LF, LH, RH. Durations and normalized paths are authored, not measured.
const periodic=(p,c,w)=>Math.exp(-((Math.sin(Math.PI*(p-c))/Math.PI/w)**2));
const contacts=[.50,.08,.58,0],stance=.18,stride=3.0;
export function cheetahGallopPhase(index,time){const p=cl(time/4,0,1),q=((p-contacts[index])%1+1)%1;return {p,q,support:q<=stance,swing:cl((q-stance)/(1-stance),0,1)};}
export function animateCheetahGallop(m,time){
 const t=cl(Number.isFinite(time)?time:0,0,4),p=t/4,flex=Math.cos((p-.40)*Math.PI*2),travel=stride*p;
 m.root.position.set(travel,0,0);
 for(const r of m.surfaceRig.rigs){const {bones,home,feet}=r;
 bones.forEach((b,i)=>{b.position.copy(home[i]);b.quaternion.identity();});
 bones[0].position.y+=-.22+.04*Math.cos(4*Math.PI*(p-.38));
 bones[0].rotation.z=.14*flex;bones[1].rotation.z=-.14*flex;bones[2].rotation.z=-.14*flex;bones[3].rotation.z=.14*flex;
 for(let k=5;k<=8;k++)bones[k].rotation.z=[-.85,-.16,.12,.08][k-5]-.04*flex;
 m.root.updateMatrixWorld(true);
 for(const f of feet){const q=cheetahGallopPhase(f.index,t),hip=m.root.worldToLocal(bones[f.upper].getWorldPosition(V())),touchX=(f.front?.95:-.68)+stride*stance/2;
 let x,y,pitchAngle=0,spread=0;
 if(q.support){x=touchX-stride*q.q;y=.13;}
 else{const u=q.swing;x=touchX-stride*stance+(stride*stance)*sm(u,0,1)-stride*(1-stance)*(2*u*u*u-3*u*u+u);y=.13+(f.front?.32:.58)*Math.sin(Math.PI*u)**2;pitchAngle=(f.front?-.40:.45)*Math.sin(Math.PI*u)**2;}
 // Gather the limbs during the intervening aerial phase without changing lengths.
 if(!q.support){const gather=periodic(p,.40,.16);const envelope=sm(q.swing,0,.12)*(1-sm(q.swing,.88,1));x+=(f.front?-.40:.36)*gather*envelope;if(!f.front)y+=.40*gather*envelope;spread=(f.front?-.04:.25)*Math.sign(f.paw.z)*gather*envelope;const extended=periodic(p,.87,.12);x+=(f.front?.60:-.50)*extended*envelope;y+=(f.front?.25:.15)*extended*envelope;}
 const pitch=new T.Quaternion().setFromAxisAngle(V(0,0,1),pitchAngle),sole=Math.min(...f.solePoints.map(v=>v.clone().applyQuaternion(pitch).y));
 const paw=V(x,y-sole,f.paw.z+spread+(f.front?0:.18*Math.sign(f.paw.z))),ankle=paw.clone().sub(f.ankleOffset.clone().applyQuaternion(pitch));
 solveTwoLink(m,bones[f.upper],bones[f.upper+1],bones[f.upper+2],ankle,V(f.front?-1:1,0,0));aimJoint(m,bones[f.upper+2],bones[f.upper+3],paw);setWorldFrame(bones[f.upper+3],m.root.getWorldQuaternion(new T.Quaternion()).multiply(pitch).multiply(f.frame));f.gallopTarget=paw;f.gallopPhase=q;
 }
 }
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 const stage=t>=4?'Study complete':p<.26?'Sequential forelimb contacts':p<.50?'Gathered aerial phase':p<.76?'Sequential hindlimb contacts':'Extended aerial phase';
 m.movementStudy={duration:4,time:t,stage};m.root.userData.movementStudy={...m.movementStudy,finite:true,measured:false};m.root.userData.cheetahGallopStudy={version:'0.6.91',phase:p,travel,measured:false};
 return {time:t,p,flex,travel};
}
