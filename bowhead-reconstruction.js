import * as T from 'three';
import {updateSpecimenLandmarks} from './surface-landmarks.js';

const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),C=T.MathUtils.clamp,S=T.MathUtils.smoothstep;
export const BOWHEAD_STUDY_SECONDS=12;
// These bounded educational poses use a reconstructed exterior. They do not
// solve forces, filtration, lung volumes, ice contact or measured trajectories.
export function bowheadPose(action,time){
 const t=C(time,0,12),e=t<=0||t>=12?0:Math.sin(Math.PI*t/12)**2;
 const p={time:t,envelope:e,jaw:0,pitch:0,yaw:0,roll:0,rise:0,stroke:0,blowhole:0,finished:time>=12};
 if(!e)return p;
 if(action==='swim')p.stroke=e;
 if(action==='forage'){p.stroke=e*.78;p.jaw=.22*S(t,.5,2)*(1-S(t,10,11.7));}
 if(action==='baleen')p.jaw=.34*e;
 if(action==='turn'){p.stroke=e*.45;p.yaw=.36*e;p.roll=-.13*e;}
 if(action==='roll'){p.roll=1.15*e;p.stroke=.25*e;}
 if(action==='surface'){p.pitch=.10*e*Math.sin(Math.PI*t/6);p.rise=.15*e;p.stroke=e*.35;p.blowhole=S(t,4.8,5.2)*(1-S(t,6.0,6.4));}
 if(action==='breach'){
  // Partial emergence with a closed mouth and a return to the initial pose.
  // Phase order follows observed behavior; this is not a ballistic solution.
  p.pitch=1.00*S(t,1.8,4.7)*(1-S(t,6.1,10.7));p.rise=.17*S(t,2.2,4.7)*(1-S(t,6.0,10.4));p.roll=.12*e;
  p.stroke=e*(1-S(t,3.8,4.9))+e*S(t,8.0,10.0)*.45;
 }
 return p;
}

export function prepareBowhead(gltf,s,asset){
 const root=new T.Group(),pivot=new T.Group(),content=new T.Group();root.add(pivot);pivot.position.y=1.45;pivot.add(content);content.position.y=-1.45;content.add(gltf.scene);
 const parts=[],textures=new Map();
 gltf.scene.traverse(mesh=>{
  if(!mesh.isMesh)return;mesh.geometry=mesh.geometry.clone();
  for(const[name,a]of Object.entries(mesh.geometry.attributes))if(a.isInterleavedBufferAttribute){const values=new a.data.array.constructor(a.count*a.itemSize);for(let i=0;i<a.count;i++)for(let k=0;k<a.itemSize;k++)values[i*a.itemSize+k]=a.data.array[i*a.data.stride+a.offset+k];mesh.geometry.setAttribute(name,new T.BufferAttribute(values,a.itemSize,a.normalized));}
  mesh.geometry.deleteAttribute('color');
  const role=mesh.userData.role||(/lower_jaw/.test(mesh.name)?'jaw':/eyes/.test(mesh.name)?'eye':/lingual_fringes/.test(mesh.name)?'fringe':/baleen_/.test(mesh.name)?'baleen':/oral_floor/.test(mesh.name)?'floor':/tongue/.test(mesh.name)?'tongue':/palate/.test(mesh.name)?'palate':/blowhole/.test(mesh.name)?'blowhole':'body'),old=mesh.material,skin=['body','jaw'].includes(role),eye=role==='eye';
  const mat=new T.MeshPhysicalMaterial({name:old.name,color:old.color,map:old.map,normalMap:old.normalMap,roughnessMap:old.roughnessMap,metalness:0,roughness:skin?1:old.roughness,ior:1.36,clearcoat:skin?.10:eye?.55:0,clearcoatRoughness:skin?.34:.14,specularIntensity:skin?.63:1,side:old.side});
  mat.normalScale.setScalar(skin?.45:1);mat.envMapIntensity=skin||eye?.5:.18;mat.specularIntensity=skin?.63:eye?1:.28;mat.userData={compatibilityWetSkin:skin||eye,compatibilityMarineOptics:skin||eye,compatibilitySurfaceDetail:skin,compatibilityLinearTexture:skin};
  for(const[key,role]of[['map','albedo'],['normalMap','normal'],['roughnessMap','roughness']])if(mat[key]){mat[key].anisotropy=8;mat[key].userData={...mat[key].userData,file:mat[key].name,role,compatibilityResolution:key==='map'?4096:2048};textures.set(mat[key].uuid,mat[key]);}
  mesh.material=mat;old.dispose();mesh.castShadow=mesh.receiveShadow=true;
  const a=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
  parts.push({mesh,role,neutral:a.array.slice(),normal:n.array.slice()});
 });
 const m={root,pivot,content,gltf,asset,id:s.id,kind:'cetacean',forward:1,natural:true,textured:true,surfaceDetailed:true,parts:{},bones:[],limbs:[],features:[],clipMap:{},current:'observe',action:null,sourceClip:null};
 m.bowhead={version:'0.6.65',parts,pivot,seconds:12,originalColorUsed:false,sourceAnimationUsed:false,metricCalibration:false,physiologyValidated:false};
 root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root,true);m.extent=box.getSize(V());
 const targets=[{p:V(1.30,1.48,.18),role:'jaw'},{p:V(1.10,1.55,.11),role:'baleen'},{p:V(-1.52,1.30,.35),role:'body'}];
 m.featureBindings=targets.map(({p,role})=>{let best;for(const part of parts.filter(q=>q.role===role)){const a=part.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const v=V().fromBufferAttribute(a,i),d=v.distanceToSquared(p);if(!best||d<best.d)best={mesh:part.mesh,indices:[i],d,kind:'Selected reconstructed exterior region; not a measured anatomical landmark'};}}return best;});m.features=targets.map(()=>V());
 Object.assign(root.userData,{aquaticStudy:true,focusAnatomy:true,anatomyFocusScale:[.43,.36,.58],anatomyViewDirections:[[.40,.13,1],[.55,-.14,1],[0,.55,1]],compatibilityMarineShadows:true,bowheadScope:'Photo-guided selected adult bowhead. New dark skin, irregular grey sloughing, white chin with dark islands, separately moving lower jaw and paired long baleen racks. No source colors, photo pixels, teeth, dorsal fin, throat pleats or right-whale callosities. Body, skin, oral dimensions and display poses are authored; no physiological or hydrodynamic calibration.'});
 const aerial=new T.Box3();for(let time=0;time<=12;time+=.4){const p=bowheadPose('breach',time),rotation=new T.Euler(p.roll,p.yaw,p.pitch);for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])aerial.expandByPoint(V(x,y-1.45,z).applyEuler(rotation).add(V(0,1.45+p.rise,0)));}m.motionBounds={breach:aerial};
 animateBowhead(m,'observe',0);return m;
}

export function animateBowhead(m,action,time){
 const r=m.bowhead;if(!r)return false;const pose=bowheadPose(action,time),t=pose.time;
 m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);m.root.scale.setScalar(1);r.pivot.position.set(0,1.45+pose.rise,0);r.pivot.rotation.set(pose.roll,pose.yaw,pose.pitch);
 const line=[],steps=140;let x=1.875,y=0;
 for(let i=0;i<=steps;i++){const u=i/steps,w=S(u,.40,1),a=.16*pose.stroke*w*w*Math.sin(t*Math.PI*(action==='forage'?.30:.40)-u*2.0);if(i){const ds=3.75/steps;x-=ds*Math.cos(a);y-=ds*Math.sin(a);}line.push({x,y,a});}
 for(const part of r.parts){const{mesh,neutral,normal,role}=part,p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,movingJaw=['jaw','floor','tongue'].includes(role);
  mesh.visible=!['palate','floor','tongue','baleen','fringe'].includes(role)||pose.jaw>.0001;
  if(!pose.envelope){p.array.set(neutral);n.array.set(normal);}
  else for(let i=0;i<p.count;i++){
   let x=neutral[i*3],y=neutral[i*3+1],z=neutral[i*3+2],nx=normal[i*3],ny=normal[i*3+1],nz=normal[i*3+2],u=C((1.875-x)/3.75,0,1);
   if(movingJaw&&pose.jaw){const a=-pose.jaw*(1-S(u,.29,.35)),co=Math.cos(a),si=Math.sin(a),dx=x-.5625,dy=y-1.36;x=.5625+dx*co-dy*si;y=1.36+dx*si+dy*co;const xx=nx*co-ny*si;ny=nx*si+ny*co;nx=xx;}
   if(pose.stroke&&u>.40){const f=u*steps,k=Math.min(steps-1,Math.floor(f)),w=f-k,a=T.MathUtils.lerp(line[k].a,line[k+1].a,w),dy=y-1.45,co=Math.cos(a),si=Math.sin(a);x=T.MathUtils.lerp(line[k].x,line[k+1].x,w)-dy*si;y=1.45+T.MathUtils.lerp(line[k].y,line[k+1].y,w)+dy*co;const xx=nx*co-ny*si;ny=nx*si+ny*co;nx=xx;}
   if(role==='blowhole'&&pose.blowhole){let center=0;for(let j=2;j<neutral.length;j+=3)center+=neutral[j];center/=p.count;z=center+(z-center)*(1+1.25*pose.blowhole);}
   p.setXYZ(i,x,y,z);n.setXYZ(i,nx,ny,nz);
  }
  p.needsUpdate=n.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
 }
 r.current={action,...pose,scope:action==='forage'?'Open-mouth slow ram-filtration posture; no computed flow or prey capture':action==='baleen'?'Selected open-mouth anatomy pose':'Finite authored exterior posture; not measured animal kinematics'};m.root.updateMatrixWorld(true);updateSpecimenLandmarks(m);return true;
}
