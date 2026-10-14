import * as T from 'three';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep,TAU=Math.PI*2;
// Original pigmentation on the retained sculpt: a morphological illustration,
// not a photo texture or an identification of this artist's individual.
function pigment(p,n){
 const shell=p.y>.67&&p.x<1.08&&p.x>-1.44&&Math.abs(p.z)<.95;
 const noise=Math.sin(p.x*47+p.z*37)*Math.cos(p.y*59-p.z*31);
 if(shell){const centers=[];for(const x of [-.93,-.52,-.12,.30,.68])centers.push([x,0]);for(const side of [-1,1])for(const x of [-.9,-.43,.06,.54])centers.push([x,side*.54]);for(let i=0;i<24;i++){const a=i/24*TAU;centers.push([-.15+1.14*Math.cos(a),.79*Math.sin(a)]);}const ranked=centers.map(([x,z],i)=>({i,x,z,d:Math.hypot((p.x-x)*1.02,p.z-z)})).sort((a,b)=>a.d-b.d),cell=ranked[0],edge=1-smooth(ranked[1].d-cell.d,.006,.035),angle=Math.atan2(p.z-cell.z,p.x-cell.x),streak=Math.sin(angle*31+cell.d*22+cell.i)*.5+.5;const c=new T.Color('#635038').lerp(new T.Color('#958358'),.22+.35*streak+.12*noise);return c.lerp(new T.Color('#302d22'),edge*.78);}
 if(n.y<-.15||p.y<.37&&Math.abs(p.z)<.70&&p.x<1.1)return new T.Color('#c5b98e').multiplyScalar(.95+noise*.035);
 // Irregular two-dimensional scale cells on the dorsal head and flippers.
 const size=p.x>1.1?.095:.052,ux=p.x/size,uz=(p.z+p.y*.38)/size,ix=Math.floor(ux),iz=Math.floor(uz),d=[];const hash=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const x=ix+a,z=iz+b;d.push(Math.hypot(ux-x-.2-.6*hash(x,z),uz-z-.2-.6*hash(z,x)));}d.sort((a,b)=>a-b);const gap=smooth(d[1]-d[0],.015,.16),c=new T.Color('#c4b381').lerp(new T.Color('#556044'),gap*.87);return c.multiplyScalar(.94+noise*.055);
}
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
   for(let k=0;k<4;k++){ix.push(influences[k]?.[0]||0);w.push(influences[k]?.[1]||0);}const c=pigment(v,V(n.getX(i),n.getY(i),n.getZ(i)));colors.push(c.r,c.g,c.b);
  }
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ix,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(w,4));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const material=source.material.clone();material.color.set('#ffffff');material.vertexColors=true;material.roughness=.64;material.metalness=0;const mesh=new T.SkinnedMesh(g,material);mesh.name=source.name;mesh.userData={...source.userData,viewerRigAuthor:'PhenoVoxel Archive contributors',viewerRig:'Original nine-joint green-turtle derivative, authored shell and skin pigmentation; unvalidated'};mesh.castShadow=true;root.add(mesh);mesh.bind(skeleton);meshes.push(mesh);source.removeFromParent();
 }
 root.updateMatrixWorld(true);skeleton.calculateInverses();const home=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));m.features=[V(0,1.30,.08),V(.28,.38,-1.30),V(1.63,.61,-.15)];m.featureBindings=[{bone:body,offset:m.features[0].clone()},{bone:front[0].chain[1],offset:front[0].chain[1].worldToLocal(m.features[1].clone())},{bone:head,offset:head.worldToLocal(m.features[2].clone())}];m.turtleRig={bones,skeleton,front,hind,head,neck,body,home,meshes};return{kind:'turtle',rigs:meshes.map(mesh=>({mesh,bones})),bases:[]};
}
export function animateTurtle(m,action,t){
 const r=m.turtleRig;if(!r)return false;const{bones,home,front,hind,neck,head,skeleton}=r;bones.forEach((b,i)=>{b.position.copy(home[i].p);b.quaternion.copy(home[i].q);});m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);
 if(['swim','forage'].includes(action)){m.root.position.y=.60;const search=action==='forage',u=(t*(search?.22:.35))%1,phase=u*TAU,flap=Math.sin(phase)*(search?.18:.40),sweep=Math.sin(phase+.70)*(search?.09:.19),twist=Math.sin(phase+.9)*(search?.075:.13);
  for(const{side,chain:[a,b]}of front){a.rotation.x=-side*flap;a.rotation.y=side*sweep;b.rotation.x=-side*Math.sin(phase-.25)*(search?.035:.085);b.rotation.z=side*twist;}
  for(const{side,bone}of hind)bone.rotation.y=side*Math.sin(phase*.5)*.07;
  if(search){neck.rotation.z=-.10;head.rotation.y=Math.sin(t*.6)*.08;}
 }
 m.root.updateMatrixWorld(true);skeleton.update();return true;
}
