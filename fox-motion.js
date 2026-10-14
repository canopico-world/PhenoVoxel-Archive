import * as T from 'three';
import {aimJoint,rotateJoint,solveTwoLink} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const uid='4e37c303f8a241aaa2511bd9f3019273';
// The artist's clip has a reset near its end. Sample its stable standing section;
// its original bind pose is retained separately for repose, without stretching joints.
export function prepareFoxStanding(gltf,mixer,asset){
 if(asset.uid!==uid)return;
 const clip=gltf.animations[0],action=mixer.clipAction(clip);action.play();mixer.setTime(19);
 const pose=[];gltf.scene.traverse(o=>pose.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]));action.stop();
 for(const[o,p,q,s]of pose){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}
 gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
}
export function configureFoxRig(m){
 if(m.asset.uid!==uid)return;
 const find=re=>m.bones.find(b=>re.test(b.name));m.limbs=[];
 for(const side of ['L','R'])for(const front of [true,false]){
  const names=front?['UpperArm','Forearm','Hand']:['Thigh','Calf','HorseLink','Foot'];
  const chain=names.map(n=>find(new RegExp(`^Fox__${side}_${n}_`))),digits=find(new RegExp(`^Fox__${side}_${front?'Finger0':'Foot_end'}_`)),wrist=chain.at(-1);
  if(chain.some(b=>!b)||!digits)throw Error('Fox source limb chain is incomplete.');
  m.limbs.push({chain,end:digits,wrist,digits,front,home:m.root.worldToLocal(wrist.getWorldPosition(V())),frame:wrist.getWorldQuaternion(new T.Quaternion()),digitFrame:digits.getWorldQuaternion(new T.Quaternion()),ankle:front?null:wrist.getWorldPosition(V()).sub(chain[2].getWorldPosition(V()))});
 }
 m.head=find(/^Fox__Head_/);m.neck=find(/^Fox__Neck_/);m.body=find(/^Fox__01$/);m.tail=find(/^Fox__Tail_/);m.existingRig='fox';m.foxRig=true;
 m.pawSamples=m.limbs.map(()=>[]);m.root.updateMatrixWorld(true);
 m.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const {position:p,skinIndex:si,skinWeight:sw}=mesh.geometry.attributes;
  for(let i=0;i<p.count;i++)for(const [j,l]of m.limbs.entries()){let weight=0;for(const k of ['getX','getY','getZ','getW']){const bone=mesh.skeleton.bones[si[k](i)];if(bone===l.wrist||bone===l.digits||l.digits.children.includes(bone))weight+=sw[k](i);}if(weight>.45)m.pawSamples[j].push([mesh,i]);}
 });
 m.featureBindings=[{bone:m.head,offset:V(.0,.0,.0)},{bone:m.tail,offset:V()},{bone:m.head,offset:V()}];
}
function update(m){m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});}
function placePaw(m,l,target){
 const c=l.chain;
 if(l.front)solveTwoLink(m,c[0],c[1],l.wrist,target,V(-1,0,0));
 else{const hock=target.clone().sub(l.ankle);solveTwoLink(m,c[0],c[1],c[2],hock,V(1,0,0));aimJoint(m,c[2],l.wrist,target);}
 setWorldFrame(l.wrist,l.frame);setWorldFrame(l.digits,l.digitFrame);update(m);
}
export function animateFox(m,action,t){
 if(!m.foxRig)return false;
 if(action==='rest'){
  for(const[o,b]of m.bind){o.position.copy(b.position);o.quaternion.copy(b.quaternion);o.scale.copy(b.scale);}
  update(m);m.root.position.y=.13-new T.Box3().setFromObject(m.root,true).min.y;update(m);return true;
 }
 if(action==='forage'){
  rotateJoint(m,m.neck,V(0,0,1),-.36+.04*Math.sin(t*1.3));rotateJoint(m,m.head,V(0,0,1),-.18);rotateJoint(m,m.head,V(0,1,0),.10*Math.sin(t*.7));
 }
 if(action==='walk')for(const[i,l]of m.limbs.entries()){
  // A qualitative four-beat walk in place, with elbow and stifle bending poles.
  // No animal trajectories, measured duty factor, speed or forces are imported.
  const u=(t*.65+[0,.75,.5,.25][i])%1,stance=.76,swing=u>=stance,target=l.home.clone();
  target.x+=.28*(swing?-.5+(u-stance)/(1-stance):.5-u/stance);target.y+=swing?.105*Math.sin((u-stance)/(1-stance)*Math.PI):0;
  placePaw(m,l,target);
  if(!swing)for(let pass=0;pass<5;pass++){
   let min=Infinity;for(const[mesh,index]of m.pawSamples[i])min=Math.min(min,mesh.getVertexPosition(index,V()).applyMatrix4(mesh.matrixWorld).y);
   if(!Number.isFinite(min)||Math.abs(min-.135)<.004)break;target.y+=T.MathUtils.clamp(.135-min,-.045,.045);placePaw(m,l,target);
  }
 }
 if(action==='walk'||action==='forage')rotateJoint(m,m.tail,V(0,1,0),.055*Math.sin(t*1.5));
 update(m);return true;
}
