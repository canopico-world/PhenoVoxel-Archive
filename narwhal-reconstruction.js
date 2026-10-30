import * as T from 'three';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),S=T.MathUtils.smoothstep,C=T.MathUtils.clamp,L=T.MathUtils.lerp;
export const narwhalEvidence={version:'0.6.61',bodyLength:4.5,centreY:1.45,strokeHz:.4,strokeSource:'Tervo et al. 2021, Table 2: surface median 24 strokes/min in the instrumented cohort. Amplitude and playback envelope are authored.',metricCalibration:false,physiologicalSolver:false,sourceAnimation:false};
const files={map:new URL('./narwhal-albedo-v0661.jpg',import.meta.url).href,normalMap:new URL('./narwhal-normal-v0661.png',import.meta.url).href,roughnessMap:new URL('./narwhal-roughness-v0661.png',import.meta.url).href,aoMap:new URL('./narwhal-occlusion-v0661.png',import.meta.url).href};
function materials(m){
 const pending=[],maps={};for(const[key,url]of Object.entries(files)){let t;if(typeof document==='undefined')t=new T.Texture();else pending.push(new Promise((resolve,reject)=>{t=new T.TextureLoader().load(url,resolve,undefined,reject);}));t.flipY=false;t.colorSpace=key==='map'?T.SRGBColorSpace:T.NoColorSpace;t.userData={file:url.split('/').at(-1),compatibilityResolution:2048};maps[key]=t;}
 const skin=new T.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:.88,ior:1.38,clearcoat:.28,clearcoatRoughness:.19,specularIntensity:.8,...maps,aoMapIntensity:.35});skin.normalScale.set(.28,.28);
 skin.userData={compatibilityWetSkin:true,compatibilityMarineOptics:true,compatibilitySurfaceDetail:true,compatibilityLinearTexture:true};
 const ivory=skin.clone();ivory.roughness=.93;ivory.clearcoat=.16;ivory.normalScale.set(.34,.34);ivory.userData={...skin.userData};
 const eye=new T.MeshPhysicalMaterial({color:'#131e23',metalness:0,roughness:.16,ior:1.38,clearcoat:.75,clearcoatRoughness:.10});eye.userData={compatibilityWetSkin:true,compatibilityMarineOptics:true,compatibilitySurfaceDetail:true};
 m.textureReady=Promise.all(pending);return{skin,ivory,eye,maps};
}
export function prepareSuppliedNarwhal(gltf,s,asset){
 const root=new T.Group(),pivot=new T.Group();pivot.position.y=narwhalEvidence.centreY;root.add(pivot);const m={id:s.id,root,gltf,asset,kind:'cetacean',forward:1,natural:true,textured:true,surfaceDetailed:true,bones:[],limbs:[],parts:{},clipMap:{},features:[],featureBindings:[],current:'observe'};
 const {skin,ivory,eye,maps}=materials(m),parts=[];let body,leftTusk,rightTusk;
 gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(!o.isMesh)return;const mesh=o.clone();mesh.geometry=o.geometry.clone();mesh.geometry.applyMatrix4(o.matrixWorld);mesh.position.set(0,-narwhalEvidence.centreY,0);mesh.quaternion.identity();mesh.scale.setScalar(1);mesh.castShadow=mesh.receiveShadow=true;
  const role=o.name.includes('tusk')?'tusk':o.name.includes('eye')?'eye':'body';mesh.material=role==='body'?skin:role==='tusk'?ivory:eye;pivot.add(mesh);parts.push({mesh,role});if(role==='body')body=mesh;if(o.name==='narwhal-left-tusk')leftTusk=mesh;if(o.name==='narwhal-right-tusk')rightTusk=mesh;});
 if(!body||!leftTusk||!rightTusk)throw Error('The supplied narwhal must retain its body and both anatomical tusks.');
 const variant=s.activeSpecimen?.id==='two-tusks'?'two-tusks':'left-tusk';rightTusk.visible=variant==='two-tusks';root.updateMatrixWorld(true);
 const targets=[V(1.87,1.49,-.28),V(-2.15,1.45,0),V(-.20,1.88,0),new T.Box3().setFromObject(leftTusk,true).getCenter(V())];
 m.featureBindings=targets.map((target,j)=>{const mesh=j===3?leftTusk:body,a=mesh.geometry.attributes.position;let best=0,dist=Infinity;for(let i=0;i<a.count;i++){const d=V().fromBufferAttribute(a,i).distanceToSquared(target);if(d<dist){dist=d;best=i;}}return{mesh,indices:[best],sourceTarget:target,kind:'Approximate retained artist-surface region; unmeasured'};});m.features=targets.map(()=>V());
 for(const q of parts){const g=q.mesh.geometry;q.neutral=g.attributes.position.array.slice();q.normal=g.attributes.normal.array.slice();}
 m.narwhalReconstruction={body,leftTusk,rightTusk,pivot,parts,maps,variant,version:'0.6.61',current:null};m.narwhalSurface={pivot};
 Object.assign(root.userData,{aquaticStudy:true,compatibilityMarineShadows:true,focusAnatomy:true,anatomyFocusScale:[.62,.60,.68,.65],anatomyViewDirections:[[.6,.1,1],[0,1,.03],[0,.7,1],[0,.15,1]],narwhalScope:'Supplied Cosmic_dust CC BY 4 artist exterior and both original tusks; same-artist eye repair and capped tips; original regional material derivative; finite authored studies, not a measured animal or physiology simulation.'});
 root.updateMatrixWorld(true);m.extent=new T.Box3().setFromObject(root,true).getSize(V());m.motionBounds={forage:new T.Box3().setFromObject(root,true)};animateSuppliedNarwhal(m,'observe',0);return m;
}
export function narwhalLine(action,time){
 const t=C(time,0,12),envelope=t<=0||t>=12?0:Math.sin(Math.PI*t/12)**2,stroke=action==='glide'?1-S(t,3.5,5.5):1,n=160,line=[];let x=2.25,y=0;
 for(let i=0;i<=n;i++){const u=i/n,w=S(u,.40,1),a=['swim','glide'].includes(action)?.26*envelope*stroke*w*w*Math.sin(2*Math.PI*narwhalEvidence.strokeHz*t-u*2.1):0;if(i){x-=4.5/n*Math.cos(a);y-=4.5/n*Math.sin(a);}line.push({x,y,a});}return{line,t,envelope};
}
export function animateSuppliedNarwhal(m,action,time){
 const f=m.narwhalReconstruction,t=C(time,0,12),poseKey=action==='observe'?'observe':action+':'+t;if(f.poseKey===poseKey)return true;
 m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);m.root.scale.setScalar(1);f.pivot.rotation.set(0,0,0);
 const{line,envelope}=narwhalLine(action,t),n=line.length-1;for(const part of f.parts){const g=part.mesh.geometry,p=g.attributes.position;p.array.set(part.neutral);if(part.role==='body'&&envelope>0&&['swim','glide'].includes(action)){for(let i=0;i<p.count;i++){const x=part.neutral[i*3],y=part.neutral[i*3+1]-1.45,z=part.neutral[i*3+2],u=C(.5-x/4.5,0,1);if(u<=.4)continue;const q=u*n,k=Math.min(n-1,Math.floor(q)),w=q-k,a=L(line[k].a,line[k+1].a,w);p.setXYZ(i,L(line[k].x,line[k+1].x,w)-y*Math.sin(a),1.45+L(line[k].y,line[k+1].y,w)+y*Math.cos(a),z);}g.computeVertexNormals();}else{g.attributes.normal.array.set(part.normal);g.attributes.normal.needsUpdate=true;}p.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();}
 if(action==='turn')f.pivot.rotation.y=.32*envelope;
 if(action==='roll')f.pivot.rotation.x=Math.PI*S(t,0,3.6)*(1-S(t,8.4,12));
 // The source is a closed-mouth sculpture. Show a modest orientation change
 // with the upper teeth fixed; do not fabricate an unobserved jaw/intake rig.
 if(action==='forage'){f.pivot.rotation.y=.15*envelope*Math.sin(Math.PI*t/6);f.pivot.rotation.z=-.065*envelope;}
 m.root.updateMatrixWorld(true);f.current={action,time:t,finished:time>=12,stage:action==='forage'?'Tusk orientation · closed mouth':null,scope:'Finite authored exterior/posture study. No jaw/intake animation, prey capture, suction pressure, echolocation or dive physiology calculation.'};f.poseKey=poseKey;updateSpecimenLandmarks(m);return true;
}
