import * as T from 'three';
import {aimJoint,solveTwoLink,rotateJoint} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep,origin=[.26,1.46,0];
// Independently authored desk-space joints. The artist surface is not a scan of a measured red kangaroo.
const joints=[[.70,1.97,0],[1.04,2.33,0],[1.38,2.58,0],[1.42,2.90,-.20],[1.42,2.90,.20],[-.10,1.25,0],[-.50,.86,0],[-.89,.52,0],[-1.30,.28,0],[-1.77,.21,0],[.85,2.02,-.32],[1.01,1.58,-.34],[1.03,1.29,-.36],[1.02,1.19,-.36],[.85,2.02,.32],[1.01,1.58,.34],[1.03,1.29,.36],[1.02,1.19,.36],[.25,1.43,-.40],[.67,1.09,-.44],[.50,.34,-.45],[1.0,.20,-.45],[.25,1.43,.40],[.67,1.09,.44],[.50,.34,.45],[1.0,.20,.45]],parents=[0,1,2,3,3,0,6,7,8,9,1,11,12,13,1,15,16,17,0,19,20,21,0,23,24,25];
function gaitStep(u,start,duty,stride,lift){const v=(u-start+1)%1;if(v<duty)return [stride*(.5-v/duty),0];const swing=(v-duty)/(1-duty);return [stride*(-.5+swing),lift*Math.sin(swing*Math.PI)];}
export const kangarooSupport=(action,t,front)=>{const phase=(t*.40)%1,hop=(t*.75)%1;return front?(action==='forage'||action==='walk'&&(phase<=.60||phase>=.92)):action==='walk'?(phase<=.16||phase>=.53):action!=='jump'||hop<=.43;};
export function createKangarooRig(m){
 const sources=[];m.root.updateMatrixWorld(true);const turn=new T.Matrix4().makeRotationY(Math.PI/2),inverse=m.root.matrixWorld.clone().invert();m.root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)sources.push(o);});const rigs=[];
 for(const source of sources){const geometry=source.geometry.clone().applyMatrix4(turn.clone().multiply(inverse).multiply(source.matrixWorld)),p=geometry.attributes.position,color=geometry.attributes.color,bones=[new T.Bone()];bones[0].name='PV_kangaroo_pelvis';bones[0].position.copy(V(...origin));joints.forEach((point,i)=>{const bone=new T.Bone(),parent=parents[i];bone.name=`PV_kangaroo_joint_${i+1}`;bone.position.copy(V(...point).sub(V(...(parent?joints[parent-1]:origin))));bones[parent].add(bone);bones.push(bone);});const si=[],sw=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),side=z<0?0:1;let a=0,b=0,c=0,wa=1,wb=0,wc=0;
   if(x<-.10){const nodes=[-.10,-.50,-.89,-1.30,-1.77];let k=0;while(k<3&&x<nodes[k+1])k++;a=6+k;b=Math.min(10,a+1);wb=T.MathUtils.clamp((nodes[k]-x)/(nodes[k]-nodes[k+1]),0,1);wa=1-wb;const tail=smooth(-x,.10,.37);wa*=tail;wb*=tail;wc=1-tail;}
   else if(y>2.48&&x>1.1){a=3;if(y>2.84&&Math.abs(z)>.11){b=4+side;wb=smooth(y,2.82,2.96);wa=1-wb;}}
   else if(y>2.2){a=1;b=2;wb=smooth(y,2.15,2.47);wa=1-wb;}
   else if(x>.78&&y>1.09&&y<2.13&&Math.abs(z)>.20){const arm=smooth(x,.72,.90)*smooth(Math.abs(z),.18,.31)*(1-smooth(y,1.94,2.17)),u=11+side*4;if(y>1.42){a=u;b=u+1;wb=1-smooth(y,1.53,1.78);wa=1-wb;}else{a=u+1;b=u+2;wb=1-smooth(y,1.24,1.44);wa=1-wb;}wa*=arm;wb*=arm;c=1;wc=1-arm;}
   else if(y<1.63&&Math.abs(z)>.15){const leg=(1-smooth(y,1.28,1.68))*smooth(Math.abs(z),.12,.30),u=19+side*4;if(y>.53){a=u;b=u+1;wb=1-smooth(y,.89,1.14);wa=1-wb;}else{a=u+1;b=u+2;wb=1-smooth(y,.29,.52);wa=1-wb;}wa*=leg;wb*=leg;wc=1-leg;}
   else{b=1;wb=smooth(y,1.55,1.95);wa=1-wb;}
   if(y<.32&&x>.90&&Math.abs(z)>.25){a=21+side*4;b=a+1;wb=smooth(x,.90,1.14);wa=1-wb;c=0;wc=0;}
   if(y>1.07&&y<1.24&&x>.90&&Math.abs(z)>.25){a=13+side*4;b=a+1;wb=1-smooth(y,1.10,1.24);wa=1-wb;c=0;wc=0;}
   si.push(a,b,c,0);sw.push(wa,wb,wc,0);
   if(color){const belly=smooth(x,.72,1.05)*(1-smooth(Math.abs(z),.16,.31))*(1-smooth(y,2.09,2.30)),coeff=[.65+.19*belly,.45+.28*belly,.35+.37*belly];color.setXYZ(i,color.getX(i)*coeff[0],color.getY(i)*coeff[1],color.getZ(i)*coeff[2]);}
  }
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));const material=source.material.clone();material.metalness=0;material.roughness=.9;material.vertexColors=true;material.color.set('#ffffff');const mesh=new T.SkinnedMesh(geometry,material);mesh.name=source.name;mesh.userData={...source.userData,viewerRigAuthor:'PhenoVoxel Archive contributors',viewerRig:'Kangaroo limb, tail, head and ear articulation; unvalidated'};source.removeFromParent();m.root.add(mesh);mesh.add(bones[0]);m.root.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));mesh.normalizeSkinWeights();mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius*=2;const used=new Set(geometry.index?.array||Array.from({length:p.count},(_,i)=>i)),feet=[11,15,19,23].map(upper=>({upper,front:upper<19,samples:[...used].filter(i=>{const z=p.getZ(i),side=upper===11||upper===19?-1:1;return z*side>.25&&(upper<19?p.getY(i)>1.07&&p.getY(i)<1.37&&p.getX(i)>.90:p.getY(i)<.47&&p.getX(i)>.24);})}));rigs.push({kind:'kangaroo',mesh,bones,feet,tailSamples:[...used].filter(i=>p.getX(i)<-1.30),home:bones.map(b=>b.position.clone())});
 }
 const bones=rigs[0].bones;m.featureBindings=[{bone:bones[20],offset:V()},{bone:bones[8],offset:V()},{bone:bones[0],offset:V(.40,.15,0)}];return {kind:'kangaroo',rigs,bases:[]};
}
export function animateKangarooRig(m,action,t){
 for(const {bones,home,mesh,feet,tailSamples}of m.surfaceRig.rigs){bones.forEach((b,i)=>{b.quaternion.identity();b.position.copy(home[i]);});
  if(action==='jump'){
   const u=(t*.75)%1,stance=.43,v=u>stance?(u-stance)/(1-stance):0,flight=u>stance?Math.sin(v*Math.PI):0,lift=flight*.60;bones[0].position.y+=lift-(u<stance?.16*Math.sin(u/stance*Math.PI):0);bones[0].rotation.z=.06*Math.sin(u*Math.PI*2);
   for(const upper of [19,23]){const side=upper===19?-1:1,target=V(u<stance?.78-.57*u/stance:.21+.57*v,.34+lift+flight*.28,side*.45);solveTwoLink(m,bones[upper],bones[upper+1],bones[upper+2],target,V(1,0,0));setWorldFrame(bones[upper+2],m.root.getWorldQuaternion(new T.Quaternion()));rotateJoint(m,bones[upper+2],V(0,0,1),flight*.15);rotateJoint(m,bones[upper+3],V(0,0,1),-flight*.10);}
   const ys=[1.18,1.03,.90,.78,.70];for(let i=6;i<10;i++)aimJoint(m,bones[i],bones[i+1],V(joints[i][0],ys[i-5]+lift,0));
   for(const upper of [11,15]){rotateJoint(m,bones[upper],V(0,0,1),.12);rotateJoint(m,bones[upper+1],V(0,0,1),-.35);}
  }else if(action==='forage'||action==='walk'){
   const u=(t*.40)%1; bones[0].position.y=1.00;bones[0].rotation.z=-.95;rotateJoint(m,bones[2],V(0,0,1),action==='forage'?-.22:1.05);rotateJoint(m,bones[3],V(0,0,1),action==='forage'?-.10+.02*Math.sin(t*1.2):.03);
   for(const upper of [19,23]){solveTwoLink(m,bones[upper],bones[upper+1],bones[upper+2],V(.50+(action==='walk'?gaitStep(u,.53,.63,.40,.25)[0]:0),.34+(action==='walk'?gaitStep(u,.53,.63,.40,.25)[1]:0),upper===19?-.45:.45),V(1,0,0));setWorldFrame(bones[upper+2],m.root.getWorldQuaternion(new T.Quaternion()));}
   for(const upper of [11,15]){const target=V(1.24+(action==='walk'?gaitStep(u,.92,.68,.30,.16)[0]:0),.36+(action==='walk'?gaitStep(u,.92,.68,.30,.16)[1]:0),upper===11?-.32:.32);solveTwoLink(m,bones[upper],bones[upper+1],bones[upper+2],target,V(-1,0,0));setWorldFrame(bones[upper+2],m.root.getWorldQuaternion(new T.Quaternion()));}
   const ty=[1.08,.74,.42,.21,.15];for(let i=6;i<10;i++)aimJoint(m,bones[i],bones[i+1],V(joints[i][0],ty[i-5]+(action==='walk'&&(u>.76||u<.10)?.14*Math.sin(((u-.76+1)%1)/.34*Math.PI):0),0));
  }else if(action==='rest'){rotateJoint(m,bones[2],V(0,0,1),-.07);}
  if(action==='observe'||action==='rest'){bones[4].rotation.x=.025*Math.sin(t*.45);bones[5].rotation.x=-.025*Math.sin(t*.45);}
  const phase=(t*.40)%1;for(const foot of feet){if(foot.front&&!['walk','forage'].includes(action)||!foot.samples.length)continue;const hop=(t*.75)%1,flight=action==='jump'&&hop>.43?Math.sin((hop-.43)/.57*Math.PI):0,clearance=action==='walk'?gaitStep(phase,foot.front?.92:.53,foot.front?.68:.63,foot.front?.30:.40,foot.front?.16:.25)[1]:foot.front?0:flight*.88,desired=.13+clearance;for(let pass=0;pass<5;pass++){m.root.updateMatrixWorld(true);mesh.skeleton.update();let low=Infinity;for(const i of foot.samples)low=Math.min(low,mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).y);if(Math.abs(low-desired)<.002)break;const target=m.root.worldToLocal(bones[foot.upper+2].getWorldPosition(V()));target.y+=desired-low;solveTwoLink(m,bones[foot.upper],bones[foot.upper+1],bones[foot.upper+2],target,V(foot.front?-1:1,0,0));setWorldFrame(bones[foot.upper+2],m.root.getWorldQuaternion(new T.Quaternion()));if(flight)rotateJoint(m,bones[foot.upper+2],V(0,0,1),flight*.15);}}
  if(action==='forage'||action==='walk'&&phase>=.10&&phase<=.76)for(let pass=0;pass<4;pass++){m.root.updateMatrixWorld(true);mesh.skeleton.update();let min=Infinity;for(const index of tailSamples)min=Math.min(min,mesh.getVertexPosition(index,V()).applyMatrix4(mesh.matrixWorld).y);if(Math.abs(min-.13)<.003)break;const target=m.root.worldToLocal(bones[10].getWorldPosition(V()));target.y+=.13-min;aimJoint(m,bones[9],bones[10],target);}
 }
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});return true;
}
