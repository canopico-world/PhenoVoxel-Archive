import * as T from 'three';
import {rotateJoint} from './joint-kinematics.js';
import {refineSkinnedSurface} from './skinned-refinement.js';
// Authored soft-lip closure on the source body component. Teeth and eyeballs
// are separate connected components and never receive this tissue morph.
export function prepareWolfFace(m){
 if(m.id!=='canis-lupus')return;const mesh=m.root.getObjectByName('Object_9');if(!mesh?.isSkinnedMesh)return;
 const g=refineSkinnedSurface(mesh.geometry,v=>v.x>2.12&&v.y>1.20),p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,parents=[],map=[],lookup=new Map();
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e5)).join(',');if(!lookup.has(key)){lookup.set(key,parents.length);parents.push(parents.length);}map.push(lookup.get(key));}
 const find=i=>parents[i]===i?i:parents[i]=find(parents[i]),indices=g.index.array;for(let i=0;i<indices.length;i+=3){const root=find(map[indices[i]]);for(let j=1;j<3;j++)parents[find(map[indices[i+j]])]=root;}
 const counts=new Map();map.forEach(i=>counts.set(find(i),(counts.get(find(i))||0)+1));const body=[...counts].sort((a,b)=>b[1]-a[1])[0][0],delta=[],affected=[];
 for(let i=0;i<p.count;i++){let lip=0;for(const k of ['getX','getY','getZ','getW'])if(/^(lipT[LR]_|nose004_)/.test(mesh.skeleton.bones[si[k](i)].name))lip+=sw[k](i);const x=p.getX(i),y=p.getY(i),z=p.getZ(i),edge=T.MathUtils.smoothstep(x,2.72,3.08)*(1-T.MathUtils.smoothstep(x,3.70,3.87))*(1-T.MathUtils.smoothstep(y,1.04,1.25))*T.MathUtils.smoothstep(y,.84,.97),amount=find(map[i])===body?lip*edge:0;delta.push(0,-.08*amount,Math.sign(z)*.012*amount);if(amount>.01)affected.push(i);}
 g.morphAttributes.position=[new T.Float32BufferAttribute(delta,3)];g.morphTargetsRelative=true;mesh.geometry=g;mesh.updateMorphTargets();mesh.morphTargetDictionary={SoftLipClosure:0};mesh.userData={...mesh.userData,facialDerivative:'Source soft-lip morph; oral components and texture retained; unvalidated'};
 const jaw=m.bones.find(b=>/^jaw_/.test(b.name)),pivot=new T.Bone();pivot.name='PV_WolfJawExpression';const parent=jaw.parent;parent.add(pivot);pivot.add(jaw);const neutral={position:new T.Vector3(),quaternion:new T.Quaternion(),scale:new T.Vector3(1,1,1)};m.bind.set(pivot,neutral);m.rest.set(pivot,neutral);m.bones.push(pivot);m.wolfFace={mesh,affected,jaw,pivot};
}
export function setWolfExpression(m,mode){if(m.wolfFace){m.wolfFace.pivot.quaternion.identity();m.wolfFace.pivot.position.set(0,0,0);m.wolfFace.mesh.morphTargetInfluences[0]=['observe','walk','sit','rest','sleep'].includes(mode)?1:mode==='run'?.30:0;}}
export function closeWolfJaw(m,mode){if(!m.wolfFace||!['observe','walk','run'].includes(mode))return;const {jaw,pivot}=m.wolfFace;rotateJoint(m,pivot,new T.Vector3(0,0,1),mode==='run'?.05:.14);const p=jaw.position.clone();pivot.position.copy(p).sub(p.clone().applyQuaternion(pivot.quaternion));}
