import * as T from 'three';
import {createChimpRig,animateChimpRig} from './chimp-rig.js';
import {createKangarooRig,animateKangarooRig} from './kangaroo-rig.js';
import {createOwlRig,animateOwlRig} from './owl-rig.js';
import {createCrocodileRig,animateCrocodile} from './crocodile-rig.js';
import {createTurtleRig,animateTurtle} from './turtle-rig.js';
import {solveTwoLink,rotateJoint} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
import {bearFeet,animateBear} from './bear-motion.js';
import {preparePenguinSupport,animatePenguinFeet,eagleWingPose} from './bird-motion.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep;
const configurations={
 'megaptera-novaeangliae':{kind:'whale',yaw:0,joints:[[-.55,.5,0],[-1.05,.5,0],[-1.5,.5,0],[.5,.45,-.29],[.5,.45,.29]],parents:[0,1,2,0,0]},
 'chelonia-mydas':{kind:'turtle',yaw:Math.PI/2,joints:[[.6,.5,-.65],[.6,.5,.65],[-1,.4,-.6],[-1,.4,.6],[1.12,.55,0]],parents:[0,0,0,0,0]},
 'danaus-plexippus':{kind:'butterfly',yaw:0,joints:[[.15,.6,-.08],[.15,.6,.08]],parents:[0,0]},
 'haliaeetus-leucocephalus':{kind:'eagle',yaw:Math.PI/2,joints:[[.2,.6,-.3],[.12,.6,-.85],[.2,.6,.3],[.12,.6,.85],[.42,.57,-.11],[.51,.17,-.11],[.42,.57,.11],[.51,.17,.11]],parents:[0,1,0,3,0,5,0,7]},
 'aptenodytes-forsteri':{kind:'penguin',yaw:0,joints:[[0,2.35,-.43],[0,2.35,.43],[0,.55,-.23],[0,.55,.23],[0,3.50,0]],parents:[0,0,0,0,0]},
 'tyto-alba':{kind:'owl',yaw:-Math.PI/2,joints:[[0,3.0,0]],parents:[0]},
 'ursus-arctos':{kind:'bear',yaw:0,joints:[[.64,1.83,0],[1.09,1.94,0],[.72,1.75,-.46],[.58,1.02,-.46],[.87,.32,-.45],[.72,1.75,.46],[.58,1.02,.46],[.87,.32,.45],[-.85,1.65,-.44],[-.62,1.0,-.44],[-.93,.32,-.46],[-.85,1.65,.44],[-.62,1.0,.44],[-.93,.32,.46]],parents:[0,1,0,3,4,0,6,7,0,9,10,0,12,13]}

};
export const hasSurfaceRig=id=>['osphranter-rufus','pan-troglodytes','crocodylus-niloticus'].includes(id)||!!configurations[id];
export function createSurfaceRig(m){
 if(m.id==='chelonia-mydas')return createTurtleRig(m);
 if(m.id==='crocodylus-niloticus')return createCrocodileRig(m);
 if(m.id==='tyto-alba')return createOwlRig(m);
 if(m.id==='pan-troglodytes')return createChimpRig(m);
 if(m.id==='osphranter-rufus')return createKangarooRig(m);
 const cfg=configurations[m.id];if(!cfg)return null;
 if(cfg.kind==='penguin')m.forward=-1;
 m.root.updateMatrixWorld(true);const inverse=m.root.matrixWorld.clone().invert(),turn=new T.Matrix4().makeRotationY(cfg.yaw),sources=[];
 m.root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)sources.push(o);});
 const rigs=[],bases=[];
 for(const source of sources){
  const geometry=source.geometry.clone().applyMatrix4(turn.clone().multiply(inverse).multiply(source.matrixWorld)),p=geometry.attributes.position;
  // Separate the scan's ice fragment. Preserve it for standing inspection, and
  // omit it in swimming; the source file itself is never changed.
  if(cfg.kind==='penguin'){
   const indices=geometry.index?.array||Array.from({length:p.count},(_,i)=>i),body=[],base=[];
   for(let i=0;i<indices.length;i+=3){const tri=[indices[i],indices[i+1],indices[i+2]],ys=tri.map(v=>p.getY(v));(Math.max(...ys)<.58&&ys.reduce((a,b)=>a+b,0)/3<.43?base:body).push(...tri);}
   if(base.length){const g=geometry.clone();g.setIndex(base);const mesh=new T.Mesh(g,source.material);mesh.name='Credited scan ice fragment';m.root.add(mesh);bases.push(mesh);}geometry.setIndex(body);
  }
  const bones=[new T.Bone()];bones[0].name=`PV_${cfg.kind}_${source.name}_body`;
  cfg.joints.forEach((point,i)=>{const bone=new T.Bone(),parent=cfg.parents[i],parentPoint=parent?cfg.joints[parent-1]:[0,0,0];bone.name=`PV_${cfg.kind}_${source.name}_joint_${i+1}`;bone.position.copy(V(...point).sub(V(...parentPoint)));bones[parent].add(bone);bones.push(bone);});
  const skinIndex=[],skinWeight=[];
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),side=z<0?0:1;let a=0,b=0,c=0,wa=1,wb=0,wc=0;
   if(cfg.kind==='whale'){
    if(x<-.45){const u=T.MathUtils.clamp((-x-.55)/.5,0,2);a=1+Math.min(2,Math.floor(u));b=Math.min(3,a+1);wb=a===3?0:u-Math.floor(u);wa=1-wb;if(x>-.55){a=0;b=1;wb=smooth(-x,.45,.55);wa=1-wb;}}
    else if(x<.8&&x>-.45){wb=smooth(Math.abs(z),.28,.55);b=4+side;wa=1-wb;}
   }else if(cfg.kind==='turtle'){
    if(y<.85&&Math.abs(z)>.55){b=(x>-.68?1:3)+side;wb=smooth(Math.abs(z),.55,1.0)*(1-smooth(y,.6,.85));wa=1-wb;}
    else if(x>1.08&&Math.abs(z)<.55){b=5;wb=smooth(x,1.08,1.3);wa=1-wb;}
   }else if(cfg.kind==='butterfly'){
    if(source.name==='Object_2'){b=1+side;wb=smooth(Math.abs(z),.04,.3);wa=1-wb;}
   }else if(cfg.kind==='eagle'){
    const span=Math.abs(z);if(y<.43&&x>.12&&span<.28){const leg=1-smooth(y,.25,.43),ankle=1-smooth(y,.14,.32);a=5+side*2;b=a+1;c=0;wa=leg*(1-ankle);wb=leg*ankle;wc=1-leg;}else if(span>.28){const u=smooth(span,.28,.62),distal=smooth(span,.75,1.12);a=side?3:1;b=a+1;wa=1-distal;wb=distal;if(u<1){a=0;b=side?3:1;wa=1-u;wb=u;}}
   }else if(cfg.kind==='penguin'){
    if(y>3.20){b=5;wb=smooth(y,3.20,3.55);wa=1-wb;}
    else if(y<.75){b=3+side;wb=1-smooth(y,.42,.75);wa=1-wb;}
    else if(y<2.85&&Math.abs(z)>.46){b=1+side;wb=smooth(Math.abs(z),.46,.63)*(1-smooth(y,2.45,2.85));wa=1-wb;}
   }else if(cfg.kind==='owl'||cfg.kind==='chimp'){b=1;wb=smooth(y,cfg.kind==='owl'?2.6:2.96,cfg.kind==='owl'?3.12:3.36);wa=1-wb;}
   else if(cfg.kind==='bear'){
    if((x>.78&&y>1.48)||(x>1.2&&y>1.1)){a=1;b=2;wb=smooth(x,.76,1.15);wa=1-wb;const neck=smooth(x,.47,.83);wa*=neck;wb*=neck;wc=1-neck;}
    else{const leg=(1-smooth(y,1.17,1.68))*smooth(Math.abs(z),.17,.39)*smooth(Math.abs(x),.18,.42),upper=(x>0?3:9)+side*3;
     if(y>.66){a=upper;b=upper+1;wb=1-smooth(y,.87,1.21);wa=1-wb;}else{a=upper+1;b=upper+2;wb=1-smooth(y,.29,.61);wa=1-wb;}
     wa*=leg;wb*=leg;wc=1-leg;
    }
   }
   skinIndex.push(a,b,c,0);skinWeight.push(wa,wb,wc,0);
  }
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndex,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(skinWeight,4));
  const mesh=new T.SkinnedMesh(geometry,source.material);mesh.name=source.name;mesh.userData={...source.userData,viewerRigAuthor:'PhenoVoxel Archive contributors',viewerRig:`Curated ${cfg.kind} surface articulation; unvalidated`};mesh.castShadow=true;mesh.receiveShadow=true;source.removeFromParent();m.root.add(mesh);mesh.add(bones[0]);m.root.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));mesh.normalizeSkinWeights();mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.boundingSphere.radius*=1.7;
  rigs.push({mesh,bones,home:bones.map(b=>b.position.clone()),...(cfg.kind==='bear'?{feet:bearFeet(mesh,bones)}:{}),...(cfg.kind==='penguin'?{penguinFeet:preparePenguinSupport(mesh,bones)}:{})});
 }
 return {kind:cfg.kind,rigs,bases};
}
export function animateSurfaceRig(m,action,t){
 if(m.turtleRig)return animateTurtle(m,action,t);
 if(m.crocodileRig)return animateCrocodile(m,action,t);
 const rig=m.surfaceRig;if(!rig)return false;
 if(rig.kind==='chimp')return animateChimpRig(m,action,t);
 if(rig.kind==='kangaroo')return animateKangarooRig(m,action,t);
 if(rig.kind==='owl')return animateOwlRig(m,action,t);
 for(const r of rig.rigs){const {bones,home}=r;bones.forEach((b,i)=>{b.quaternion.identity();b.position.copy(home[i]);});
  if(rig.kind==='whale'){
   const active=['swim','forage'].includes(action),p=t*(action==='forage'?1.7:2.1);
   if(active){bones[0].rotation.z=Math.sin(p)*.012;for(let i=1;i<=3;i++)bones[i].rotation.z=Math.sin(p-i*.28)*[0,.045,.085,.12][i];for(let i=4;i<=5;i++)bones[i].rotation.x=(i===4?-1:1)*(.035+(action==='forage'?Math.sin(t*.55)*.055:0));}
  }else if(rig.kind==='turtle'){
   if(['swim','forage'].includes(action)){const phase=t*(action==='forage'?1.5:2.6),amplitude=action==='forage'?.16:.36;for(let i=1;i<=2;i++){const side=i===1?-1:1;bones[i].rotation.x=side*Math.sin(phase)*amplitude;bones[i].rotation.y=side*Math.cos(phase)*.08;}for(let i=3;i<=4;i++)bones[i].rotation.y=(i===3?-1:1)*Math.sin(phase*.5)*.06;if(action==='forage')bones[5].rotation.z=-.12-.035*Math.sin(phase);}
  }else if(rig.kind==='butterfly'){
   if(action==='fly')for(let i=1;i<=2;i++)bones[i].rotation.x=(i===1?-1:1)*(.35+.60*Math.sin(t*8));
   if(action==='forage')for(let i=1;i<=2;i++)bones[i].rotation.x=(i===1?-1:1)*(.08+.05*Math.sin(t*1.5));
  }else if(rig.kind==='eagle'){
   if(['fly','glide'].includes(action)){const pose=eagleWingPose(action,t);for(const [side,a,b,leg]of [[-1,1,2,5],[1,3,4,7]]){bones[a].rotation.x=-side*pose.arm;bones[b].rotation.x=-side*pose.hand;bones[b].rotation.z=side*pose.twist;bones[leg].rotation.z=pose.leg;bones[leg+1].rotation.z=-pose.leg*.55;}}
  }else if(rig.kind==='penguin'){
   if(action==='swim'){for(let i=1;i<=2;i++){const side=i===1?-1:1;bones[i].rotation.x=-side*.85;bones[i].rotation.y=side*Math.sin(t*4)*.40;}bones[5].rotation.z=-Math.PI/2;}
   if(action==='walk')animatePenguinFeet(m,r,t);
  }else if(rig.kind==='bear'){
   animateBear(m,r,action,t);
  }else if(action==='forage'){bones[1].rotation.y=Math.sin(t*.8)*.22;bones[1].rotation.z=-.10+.035*Math.sin(t*1.2);}
 }
 if(['whale','turtle'].includes(rig.kind))m.root.position.y=.60;
 if((action==='fly'||action==='glide')&&['eagle','butterfly'].includes(rig.kind))m.root.position.y=rig.kind==='butterfly'?.8:.65;
 if(rig.kind==='penguin'){const swim=action==='swim';rig.bases.forEach(b=>b.visible=!swim);if(swim){m.root.rotation.z=Math.PI/2;m.root.position.set(2.0,1.1,0);}}
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 return true;
}
