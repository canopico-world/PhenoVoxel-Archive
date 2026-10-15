import * as T from 'three';
import {greenTurtlePigment,greenTurtleStroke,addTurtleEyes} from './turtle-detail.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep,TAU=Math.PI*2;
// Original pigmentation on the retained sculpt: a morphological illustration,
// not a photo texture or an identification of this artist's individual.
export function createTurtleRig(m){
 const root=m.root,bones=[],sources=[],turn=new T.Matrix4().makeRotationY(Math.PI/2);root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)sources.push(o);});
 function bone(name,p,parent){const b=new T.Bone();b.name='PV_GreenTurtle_'+name;b.position.copy(p);if(parent){b.position.sub(parent.getWorldPosition(V()));parent.add(b);}else root.add(b);root.updateMatrixWorld(true);bones.push(b);return b;}
 const body=bone('RigidShell',V()),front=[],hind=[];
 for(const side of [-1,1]){const a=bone('Foreflipper'+side,V(.58,.54,.60*side),body),b=bone('ForeflipperDistal'+side,V(.27,.39,1.02*side),a);front.push({side,chain:[a,b]});}
 for(const side of [-1,1])hind.push({side,bone:bone('RearSteeringFlipper'+side,V(-1.0,.40,.60*side),body)});
 const neck=bone('Neck',V(1.07,.55,0),body),head=bone('Head',V(1.43,.55,0),neck),skeleton=new T.Skeleton(bones),meshes=[];
 for(const source of sources){const g=source.geometry.clone().applyMatrix4(turn.clone().multiply(inverse).multiply(source.matrixWorld)),p=g.attributes.position,n=g.attributes.normal,ix=[],w=[],colors=[];
  for(let i=0;i<p.count;i++){const v=V(p.getX(i),p.getY(i),p.getZ(i)),side=v.z<0?-1:1,span=Math.abs(v.z);let influences=[[0,1]];
   if(v.x>1.03&&span<.55){const a=smooth(v.x,1.03,1.28),b=smooth(v.x,1.28,1.53);influences=[[0,1-a],[7,a*(1-b)],[8,a*b]];}
   else if(v.y<.83&&span>.58){const shell=((v.x+.15)/1.20)**2+(v.z/.83)**2<1.0&&v.y>.54,amount=shell?0:smooth(span,.58,.90)*(1-smooth(v.y,.66,.86));if(v.x>-.78){const a=side<0?1:3,u=smooth(span,.97,1.48);influences=[[0,1-amount],[a,amount*(1-u)],[a+1,amount*u]];}else influences=[[0,1-amount],[side<0?5:6,amount]];}
   for(let k=0;k<4;k++){ix.push(influences[k]?.[0]||0);w.push(influences[k]?.[1]||0);}const c=greenTurtlePigment(v,V(n.getX(i),n.getY(i),n.getZ(i)));colors.push(c.r,c.g,c.b);
  }
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ix,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(w,4));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const material=source.material.clone();material.color.set('#ffffff');material.vertexColors=true;material.roughness=.64;material.metalness=0;const mesh=new T.SkinnedMesh(g,material);mesh.name=source.name;mesh.userData={...source.userData,viewerRigAuthor:'PhenoVoxel Archive contributors',viewerRig:'Original nine-joint green-turtle derivative, authored shell and skin pigmentation; unvalidated'};mesh.castShadow=true;root.add(mesh);mesh.bind(skeleton);meshes.push(mesh);source.removeFromParent();
 }
 root.updateMatrixWorld(true);skeleton.calculateInverses();const home=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));m.features=[V(0,1.30,.08),V(.28,.38,-1.30),V(1.63,.61,-.15)];m.featureBindings=[{bone:body,offset:m.features[0].clone()},{bone:front[0].chain[1],offset:front[0].chain[1].worldToLocal(m.features[1].clone())},{bone:head,offset:head.worldToLocal(m.features[2].clone())}];m.turtleRig={bones,skeleton,front,hind,head,neck,body,home,meshes};addTurtleEyes(m);return{kind:'turtle',rigs:meshes.map(mesh=>({mesh,bones})),bases:[]};
}
export function animateTurtle(m,action,t){
 const r=m.turtleRig;if(!r)return false;const{bones,home,front,hind,neck,head,skeleton}=r;bones.forEach((b,i)=>{b.position.copy(home[i].p);b.quaternion.copy(home[i].q);});m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);
 if(['swim','forage','glide'].includes(action)){m.root.position.y=.60;const search=action==='forage',u=(t*(search?.16:.26))%1,pose=action==='glide'?{flap:-.06,sweep:-.04,twist:.02}:greenTurtleStroke(u),strength=search?.55:1;
  for(const{side,chain:[a,b]}of front){a.rotation.x=-side*pose.flap*strength;a.rotation.y=side*pose.sweep*strength;b.rotation.x=-side*pose.flap*.18*strength;b.rotation.z=side*pose.twist*strength;}
  for(const{side,bone}of hind)bone.rotation.y=-side*.12;
  if(search){neck.rotation.z=-.10;head.rotation.y=Math.sin(t*.6)*.08;}
 }
 m.root.updateMatrixWorld(true);skeleton.update();return true;
}

