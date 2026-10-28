import * as T from 'three';
import {configureFineAnatomy,animateFineFeeding} from './cetacean-fine-anatomy.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
import {smoothSurfaceSeams} from './cetacean-models.js';
const V=(...a)=>new T.Vector3(...a),S=T.MathUtils.smoothstep,C=T.MathUtils.clamp;

// Johann Woelper's CC BY-NC4 exterior and original maps, supplied by the user.
// Refinement is a disclosed Catmull-Clark derivative of the source control cage.
export function prepareSuppliedFin(gltf,s,asset){
 const root=new T.Group();root.add(gltf.scene);root.updateMatrixWorld(true);
 const body=gltf.scene.children[0];if(!body.isMesh)throw Error('Supplied fin exterior is missing');
 body.geometry=body.geometry.clone();body.material=body.material.clone();body.material.metalness=0;body.material.roughness=.62;body.material.normalScale.set(.65,.65);body.material.userData.compatibilitySurfaceDetail=true;body.material.userData.compatibilityWetSkin=true;
 const p=body.geometry.attributes.position,box=new T.Box3().setFromObject(root,true),length=box.max.x-box.min.x,cy=1.45,profile=[];
 for(let j=0;j<=80;j++){const u=j/80,x=length*(.5-u),indices=[];for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)-x)<.035&&Math.abs(p.getZ(i))<.36)indices.push(i);if(indices.length){const top=Math.max(...indices.map(i=>p.getY(i)))-cy,bottom=Math.min(...indices.map(i=>p.getY(i)))-cy;profile.push([u,Math.max(.002,...indices.map(i=>Math.abs(p.getZ(i)))),top,bottom]);}}
 const c={id:s.id,length,y:cy,profile,headEnd:.27,eyeU:.235,mouthQ:.14,mouthArch:.25},r={c,body,sourceOralEdges:true,feedingOverrides:{plates:300,gape:.78,upper:.04,throat:.51,depth:.44,width:.85},parts:[{mesh:body,neutral:p.array.slice()}]},m={id:s.id,root,gltf,asset,kind:'cetacean',forward:1,natural:true,textured:true,surfaceDetailed:true,parts:{},features:[],current:'observe',bones:[],limbs:[],clipMap:{}};
 const targets=[V(length*.30,cy+.04,.20),V(-length*.45,cy-.01,0),V(-length*.21,box.max.y,0)];
 m.featureBindings=targets.map(target=>{let best=0,d=Infinity;for(let i=0;i<p.count;i++){const q=V().fromBufferAttribute(p,i),dist=q.distanceToSquared(target);if(dist<d){d=dist;best=i;}}return{mesh:body,indices:[best],sourceTarget:target.clone(),kind:'Selected source-surface landmark; not a measured specimen'};});m.features=targets.map(()=>V());
 configureFineAnatomy(m,r);root.userData.aquaticStudy=true;root.userData.focusAnatomy=true;root.userData.anatomyViewDirections=[[.4,.18,1],[0,.65,1],[0,.2,1]];root.userData.anatomyFocusScale=[.77,.62,.58];
 m.suppliedFin={r,body,parts:r.parts.map(p=>({...p,normal:p.mesh.geometry.attributes.normal.array.slice()})),poseKey:null,source:'Johann Woelper / CC BY-NC4.0',scope:'Disclosed UV-bound albedo derivative and retained original normal, roughness and ambient-occlusion images; two subdivision levels and authored local deformation, not fitted living kinematics.'};
 animateSuppliedFin(m,'observe',0);return m;
}
export function suppliedFinLine(action,t,length){
 const clock=C(t,0,12),q=clock/12,env=clock<=0||clock>=12?0:Math.sin(Math.PI*q)**2,stroke=action==='glide'?1-S(clock,5,6):1,wave=['swim','glide'].includes(action),n=180,line=[];let x=length*.5,y=0;
 for(let i=0;i<=n;i++){const u=i/n,tail=S(u,.43,1),a=wave?.22*env*stroke*tail**1.5*Math.sin(clock*2*Math.PI*.29-u*2.3):0;if(i){const ds=length/n;x-=ds*Math.cos(a);y-=ds*Math.sin(a);}line.push({x,y,a});}
 return{line,env,stroke,wave,clock};
}
export function animateSuppliedFin(m,action,t){
 const f=m.suppliedFin;if(!f)return false;const key=action==='observe'?'observe':action+':'+C(t,0,action==='forage'?24:12);if(key===f.poseKey)return true;
 if(animateFineFeeding(m,action,t)){f.poseKey=key;return true;}
 const len=f.r.c.length,{line,env,stroke,wave,clock}=suppliedFinLine(action,t,len),n=line.length-1;
 // Integrate fixed-length centreline stations rather than rotating each body
 // section about one remote pivot. The additional distal pitch is selected,
 // not fitted from measured fin-whale fluke kinematics.
 const point=(u,dy)=>{const k=C(u,0,1)*n,j=Math.min(n-1,Math.floor(k)),v=k-j,a=T.MathUtils.lerp(line[j].a,line[j+1].a,v);return V(T.MathUtils.lerp(line[j].x,line[j+1].x,v)-dy*Math.sin(a),1.45+T.MathUtils.lerp(line[j].y,line[j+1].y,v)+dy*Math.cos(a),0);};
 for(const part of f.parts){const g=part.mesh.geometry,p=g.attributes.position;p.array.set(part.neutral);if(env&&wave&&stroke)for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),u=C(.5-x/len,0,1),v=point(u,y-1.45),tailPitch=.14*env*stroke*S(u,.87,.96)*Math.sin(clock*2*Math.PI*.29-2.3+Math.PI*.5),pivot=point(.9,0),dx=v.x-pivot.x,dy=v.y-pivot.y;v.set(pivot.x+dx*Math.cos(tailPitch)-dy*Math.sin(tailPitch),pivot.y+dx*Math.sin(tailPitch)+dy*Math.cos(tailPitch),z);p.setXYZ(i,...v);}p.needsUpdate=true;if(env&&wave&&stroke){g.computeVertexNormals();smoothSurfaceSeams(g);}else if(part.normal){g.attributes.normal.array.set(part.normal);g.attributes.normal.needsUpdate=true;}g.computeBoundingBox();g.computeBoundingSphere();}
 m.root.position.set(0,0,0);m.root.rotation.set(0,action==='turn'?.24*env:0,0);m.root.updateMatrixWorld(true);updateSpecimenLandmarks(m);f.poseKey=key;return true;
}
