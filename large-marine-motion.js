import * as T from 'three';

// Authored swimming studies on the credited artist surfaces. No fitted animal
// trajectory, biological clock, force field or physiological solver is implied.
const configs={
 'orcinus-orca':{plane:'vertical',head:1,start:.40,frequency:.42,angle:.40},
 'rhincodon-typus':{plane:'lateral',head:1,start:.34,frequency:.30,angle:.42},
 'carcharodon-carcharias':{creator:true}
};
export function configureLargeMarine(m){
 const c=configs[m.id];if(!c)return;
 m.largeMarine={...c,meshes:[],landmarks:m.features.map(p=>p.clone())};
 m.root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(m.root,true),size=b.getSize(new T.Vector3());
 const targets=[new T.Vector3(b.max.x-size.x*.08,b.min.y+size.y*.38,size.z*.20),new T.Vector3(b.min.x+size.x*.05,b.min.y+size.y*.30,size.z*.15),m.id==='orcinus-orca'?new T.Vector3(0,b.max.y,0):new T.Vector3(b.max.x-size.x*.30,b.min.y+size.y*.40,size.z*.30)];
 const surfaces=[];m.root.traverse(o=>{if(o.isMesh)surfaces.push(o);});m.featureBindings=targets.map(target=>{let best=null;for(const mesh of surfaces){const p=mesh.geometry.attributes.position,samples=[];for(let i=0;i<p.count;i++){const v=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);samples.push({i,d:v.distanceToSquared(target)});}samples.sort((a,b)=>a.d-b.d);if(!best||samples[0].d<best.distance)best={mesh,indices:samples.slice(0,8).map(x=>x.i),distance:samples[0].d,kind:'Approximate source-surface region, not measured anatomy'};}return best;});Object.assign(m.root.userData,{focusAnatomy:true,anatomyFocusScale:[.34,.48,m.id==='orcinus-orca'?.42:.30],foliageViewDirection:m.id==='orcinus-orca'?[0,1,.6]:[0,.25,1],reproductiveViewDirection:[0,.2,1]});
 // The source white-shark skeleton already carries a distinct swimming clip.
 if(c.creator){m.clipMap.swim=m.gltf.animations.find(a=>/^Swimming$/i.test(a.name));return;}
 const r=m.largeMarine;Object.assign(r,{min:b.min.x,max:b.max.x,length:size.x,centerY:(b.min.y+b.max.y)/2,centerZ:(b.min.z+b.max.z)/2});
 m.gltf.scene.traverse(mesh=>{if(!mesh.isMesh||mesh.isSkinnedMesh)return;mesh.geometry=mesh.geometry.clone();const p=mesh.geometry.attributes.position,neutral=p.array.slice(),world=[];for(let i=0;i<p.count;i++)world.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));r.meshes.push({mesh,neutral,world,inverse:mesh.matrixWorld.clone().invert()});});
 m.root.userData.swimmingScope='Same credited source mesh and atlas; authored continuous posterior bending, no calibrated kinematics or hydrodynamics.';
}
export function marineCenterline(r,t){
 const count=180,stations=[],head=r.head>0?r.max:r.min,tail=r.head>0?r.min:r.max,delta=(tail-head)/count;
 let x=head,q=0;for(let i=0;i<=count;i++){const u=i/count,w=T.MathUtils.smoothstep(u,r.start,1),angle=r.angle*w*w*Math.sin(t*Math.PI*2*r.frequency-u*4.0);if(i){x+=delta*Math.cos(angle);q+=Math.abs(delta)*Math.sin(angle);}stations.push({x,q,angle,u});}return stations;
}
function deform(v,r,line){
 const u=T.MathUtils.clamp(r.head>0?(r.max-v.x)/r.length:(v.x-r.min)/r.length,0,1),f=u*(line.length-1),i=Math.floor(f),j=Math.min(i+1,line.length-1),w=f-i,a=line[i],b=line[j],x=T.MathUtils.lerp(a.x,b.x,w),q=T.MathUtils.lerp(a.q,b.q,w),angle=T.MathUtils.lerp(a.angle,b.angle,w),sign=r.head>0?-1:1;
 if(r.plane==='vertical'){const y=v.y-r.centerY;return new T.Vector3(x-sign*y*Math.sin(angle),r.centerY+q+y*Math.cos(angle),v.z);}
 const z=v.z-r.centerZ;return new T.Vector3(x-sign*z*Math.sin(angle),v.y,r.centerZ+q+z*Math.cos(angle));
}
export function animateLargeMarine(m,action,t){
 const r=m.largeMarine;if(!r||r.creator)return false;
 const active=action==='swim',line=active?marineCenterline(r,t):null;
 // Keep the aquatic animal above the specimen desk through every tail phase.
 m.root.position.set(0,.60,0);m.root.rotation.set(0,0,0);m.root.scale.setScalar(1);
 for(const {mesh,neutral,world,inverse}of r.meshes){const p=mesh.geometry.attributes.position;if(!active)p.array.set(neutral);else for(let i=0;i<p.count;i++){const v=deform(world[i],r,line).applyMatrix4(inverse);p.setXYZ(i,v.x,v.y,v.z);}p.needsUpdate=true;if(active)mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
 m.features=r.landmarks.map(p=>active?deform(p,r,line):p.clone());m.root.updateMatrixWorld(true);return true;
}
