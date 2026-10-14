import * as T from 'three';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep;
const points=[[0,0,0],[.02,2.84,0],[.10,3.24,0],[-.12,2.60,-.60],[-.47,2.07,-.67],[-.63,1.50,-.65],[-.12,2.60,.60],[-.47,2.07,.67],[-.63,1.50,.65],[-.65,1.45,0],[.02,1.32,-.23],[.28,1.02,-.25],[.45,.88,-.25],[.02,1.32,.23],[.28,1.02,.25],[.45,.88,.25]];
const parents=[-1,0,1,0,3,4,0,6,7,0,0,10,11,0,13,14];
export function createOwlRig(m){
 m.root.updateMatrixWorld(true);const inverse=m.root.matrixWorld.clone().invert(),turn=new T.Matrix4().makeRotationY(Math.PI/2),sources=[];m.root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)sources.push(o);});
 const bones=points.map((p,i)=>{const b=new T.Bone();b.name=`PV_owl_${['body','neck','head','shoulder_L','elbow_L','wrist_L','shoulder_R','elbow_R','wrist_R','tail','hip_L','ankle_L','toes_L','hip_R','ankle_R','toes_R'][i]}`;b.position.copy(V(...p).sub(parents[i]<0?V():V(...points[parents[i]])));return b;});bones.forEach((b,i)=>{if(parents[i]>=0)bones[parents[i]].add(b);});m.root.add(bones[0]);m.root.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones),rigs=[];
 for(const source of sources){const g=source.geometry.clone().applyMatrix4(turn.clone().multiply(inverse).multiply(source.matrixWorld)),p=g.attributes.position,si=[],sw=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),side=z<0?0:1;let a=0,b=0,w=0,c=0,wc=0;
   if(y>2.75){b=1;w=smooth(y,2.75,3.07);if(y>3.07){a=1;b=2;w=smooth(y,3.07,3.45);}}
   else if(Math.abs(z)>.47&&y>1.13&&y<2.75&&x<.15){const cover=smooth(Math.abs(z),.47,.66)*(1-smooth(y,2.48,2.75))*smooth(y,1.13,1.40)*(1-smooth(x,-.12,.15)),start=side?6:3;a=y>2.05?start:start+1;b=a+1;w=y>2.05?1-smooth(y,2.05,2.50):1-smooth(y,1.40,2.05);wc=1-cover;c=0;w*=cover;si.push(a,b,c,0);sw.push(cover-w,w,wc,0);continue;}
   else if(y>.88&&y<1.35&&x>-.15&&Math.abs(z)>.10&&Math.abs(z)<.44){a=10+side*3;b=a+1;w=1-smooth(y,1.00,1.32);if(y<1.00){a++;b++;w=1-smooth(y,.88,1.00);}}
   else if(y>1.12&&y<1.72&&x<-.61&&Math.abs(z)<.45){b=9;w=smooth(-x,.61,.87)*smooth(y,1.12,1.32);}
   si.push(a,b,c,0);sw.push(1-w,w,wc,0);
  }
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));const mesh=new T.SkinnedMesh(g,source.material);mesh.name=source.name;mesh.userData={...source.userData,viewerRigAuthor:'PhenoVoxel Archive contributors',viewerRig:'Connected perched owl articulation; qualitative and unvalidated'};source.removeFromParent();m.root.add(mesh);mesh.bind(skeleton);mesh.normalizeSkinWeights();mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.7;rigs.push({mesh,bones,home:bones.map(b=>b.position.clone())});
 }
 m.featureBindings=[{bone:bones[2],offset:V(.30,.08,0)},{bone:bones[11],offset:V(.14,-.12,0)},{bone:bones[4],offset:V(-.12,-.05,-.10)}];return {kind:'owl',rigs,bases:[],bones,home:bones.map(b=>b.position.clone())};
}
export function animateOwlRig(m,action,t){const rig=m.surfaceRig,{bones,home}=rig;bones.forEach((b,i)=>{b.quaternion.identity();b.position.copy(home[i]);});
 if(action==='forage'){bones[1].rotation.y=Math.sin(t*.72)*.16;bones[2].rotation.y=Math.sin(t*.72+.4)*.18;bones[2].rotation.z=-.06+.025*Math.sin(t*1.1);}
 if(action==='stretch'){const u=t%7,opening=u<2?smooth(u,0,2):u<4?1:1-smooth(u,4,6);for(const [side,a]of [[-1,3],[1,6]]){bones[a].rotation.x=-side*opening*.28;bones[a].rotation.y=-side*opening*.15;bones[a+1].rotation.x=side*opening*.06;bones[a+2].rotation.x=-side*opening*.035;}bones[9].rotation.y=Math.sin(t*.8)*.025;}
 if(action==='shift'){const p=t*1.0,u=Math.max(0,Math.sin(p)),v=Math.max(0,-Math.sin(p));for(const [a,lift]of [[10,u],[13,v]]){bones[a].rotation.z=lift*.025;bones[a+1].rotation.z=-lift*.04;bones[a+2].rotation.z=lift*.018;}bones[1].rotation.y=Math.sin(t*.5)*.045;}
 if(action==='rest'){bones[1].rotation.z=-.045;bones[2].rotation.z=-.06;}
 m.root.updateMatrixWorld(true);rig.rigs.forEach(r=>r.mesh.skeleton.update());return true;
}
