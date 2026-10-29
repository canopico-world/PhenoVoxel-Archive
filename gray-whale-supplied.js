import * as T from 'three';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
import {configureGraySkin,configureGrayBarnacles,updateGrayBarnacles} from './gray-whale-skin.js';
const V=(...v)=>new T.Vector3(...v),S=T.MathUtils.smoothstep,C=T.MathUtils.clamp,L=T.MathUtils.lerp;

// The supplied closed exterior already contains a roof and lower oral floor.
// Identify the lower anterior component through real source triangle adjacency,
// rather than clipping a new mouth across its sculpted lips and original UVs.
function bindJaw(parts,length){
 const keys=new Map(),points=[],ids=new Map();
 for(const part of parts){const p=part.mesh.geometry.attributes.position,indices=new Int32Array(p.count).fill(-1);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(.5-x/length>=.245)continue;const key=[x,y,z].map(v=>Math.round(v*1e6)).join(':');if(!keys.has(key)){keys.set(key,points.length);points.push([x,y,z]);}indices[i]=keys.get(key);}ids.set(part,indices);}
 const parent=Int32Array.from({length:points.length},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(const part of parts){const ix=part.mesh.geometry.index.array,v=ids.get(part);for(let i=0;i<ix.length;i+=3){const a=v[ix[i]],b=v[ix[i+1]],c=v[ix[i+2]];if(a<0||b<0||c<0)continue;const ar=find(a),br=find(b),cr=find(c);parent[br]=ar;parent[cr]=ar;}}
 const groups=new Map();for(let i=0;i<points.length;i++){const key=find(i);if(!groups.has(key))groups.set(key,{count:0,y:0});const q=groups.get(key);q.count++;q.y+=points[i][1];}
 const main=[...groups].filter(([,v])=>v.count>1000).sort((a,b)=>a[1].y/a[1].count-b[1].y/b[1].count);if(main.length!==2)throw Error('Gray-whale source oral topology differs from the inspected body');const lower=main[0][0];
 for(const part of parts){const p=part.mesh.geometry.attributes.position,v=ids.get(part);part.jaw=new Float32Array(p.count);for(let i=0;i<p.count;i++)if(v[i]>=0&&find(v[i])===lower)part.jaw[i]=1-S(.5-p.getX(i)/length,.19,.245);}
 return {anteriorComponents:main.length,lowerVertices:main[0][1].count,upperVertices:main[1][1].count,scope:'Source-adjacency membership anterior to selected commissure; posterior weights taper to zero. Not a measured jaw joint or tissue model.'};
}

export function grayWhalePhase(t){
 const time=C(t,0,16),q=time/16,hold=S(q,.02,.18)*(1-S(q,.80,1)),gape=S(q,.20,.30)*(1-S(q,.40,.56));
 return{time,q,hold,gape,stage:q<.02?'Neutral approach':q<.20?'Right-side roll and slight head-down posture':q<.40?'Jaw opening · short baleen exposed':q<.56?'Selected aperture closure':q<.80?'Closed-mouth benthic posture':q<1?'Level recovery':'Study complete'};
}
export function grayWhaleLine(action,t,length){
 const clock=C(t,0,12),env=clock===0||clock===12?0:Math.sin(Math.PI*clock/12)**2,stroke=action==='glide'?1-S(clock,5,6):1,wave=['swim','glide'].includes(action),line=[],n=180;let x=length*.5,y=0;
 for(let i=0;i<=n;i++){const u=i/n,a=wave?.24*env*stroke*S(u,.43,1)**1.5*Math.sin(clock*2*Math.PI*.225-u*2.2):0;if(i){const ds=length/n;x-=ds*Math.cos(a);y-=ds*Math.sin(a);}line.push({x,y,a});}return{clock,line,env,stroke,wave};
}

// Digital Life / Johnson Martin, CC BY-NC4.0. Original supplied GLB and
// embedded images remain unchanged in the delivered source. Active skin/baleen
// textures and attached shell geometry are disclosed display derivatives.
export function prepareSuppliedGray(gltf,s,asset){
 const source=gltf.scene,root=new T.Group();source.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(source,true),center=box.getCenter(V()),fit=3.85/(box.max.z-box.min.z),cy=1.45;
 const transform=new T.Matrix4().makeTranslation(0,cy,0).multiply(new T.Matrix4().makeScale(fit,fit,fit)).multiply(new T.Matrix4().makeRotationY(Math.PI/2)).multiply(new T.Matrix4().makeTranslation(-center.x,-center.y,-center.z));
 const parts=[];source.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(transform.clone().multiply(o.matrixWorld));const mat=o.material.clone();mat.metalness=0;mat.userData.compatibilityWetSkin=true;mat.userData.compatibilitySurfaceDetail=true;const mesh=new T.Mesh(g,mat);mesh.name=o.name;mesh.userData.sourcePart=o.name;root.add(mesh);parts.push({mesh,neutral:g.attributes.position.array.slice(),normal:g.attributes.normal.array.slice()});});
 const m={id:s.id,root,gltf,asset,kind:'cetacean',forward:1,natural:true,textured:true,surfaceDetailed:true,parts:{},features:[V(),V(),V()],current:'observe',bones:[],limbs:[],clipMap:{}};
 const targets=[V(1.30,cy+.01,.25),V(-1.77,cy,0),V(-.60,cy+.29,0),V(1.48,cy+.18,.18),V(1.43,cy+.01,.20)];
 const body=parts.filter(p=>p.mesh.name.includes('_body_'));
 m.featureBindings=targets.map(target=>{let nearest=null,d=Infinity;for(const part of body){const p=part.mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const q=V().fromBufferAttribute(p,i),dd=q.distanceToSquared(target);if(dd<d){nearest={mesh:part.mesh,indices:[i],kind:'Selected Digital Life surface landmark; not a measured specimen'};d=dd;}}}return nearest;});
 m.features=targets.map(()=>V());root.userData.aquaticStudy=true;root.userData.focusAnatomy=true;root.userData.anatomyViewDirections=[[.4,.10,1],[0,.65,1],[0,.2,1],[.2,.65,1],[.35,-.15,1]];root.userData.anatomyFocusScale=[.43,.62,.58,.16,.33];
 const jaw=bindJaw(body,3.85);
 m.suppliedGray={parts,length:3.85,cy,jaw,poseKey:null};
 configureGraySkin(m);configureGrayBarnacles(m);
 m.motionBounds={forage:new T.Box3(V(-2.05,.65,-.85),V(2.15,2.15,.85)),roll:new T.Box3(V(-2.05,.65,-.85),V(2.15,2.15,.85))};
 animateSuppliedGray(m,'observe',0);return m;
}
export function animateSuppliedGray(m,action,t){
 const f=m.suppliedGray;if(!f)return false;
 const oral=action==='mouth',feeding=action==='forage'||oral;const key=action==='observe'?'observe':action+':'+C(t,0,feeding?16:12);if(key===f.poseKey)return true;
 const {length,cy}=f,st=grayWhalePhase(t),{line,env,stroke,wave,clock}=grayWhaleLine(action,t,length),n=line.length-1;
 const point=(u,dy)=>{const k=C(u,0,1)*n,j=Math.min(n-1,Math.floor(k)),v=k-j,a=L(line[j].a,line[j+1].a,v);return {x:L(line[j].x,line[j+1].x,v)-dy*Math.sin(a),y:cy+L(line[j].y,line[j+1].y,v)+dy*Math.cos(a),a};};
 const distalPivot=point(.90,0),jawX=length*(.5-.255),jawY=cy-.035;
 for(const part of f.parts){const g=part.mesh.geometry,p=g.attributes.position,normal=g.attributes.normal,base=part.neutral,bn=part.normal;p.array.set(base);normal.array.set(bn);
  if(feeding&&st.gape){for(let i=0;i<p.count;i++){const k=i*3,u=.5-base[k]/length,w=part.jaw?.[i]||0,angle=-(oral?.48:.16)*st.gape*w,ca=Math.cos(angle),sa=Math.sin(angle),dx=base[k]-jawX,dy=base[k+1]-jawY;if(w){p.setXYZ(i,jawX+dx*ca-dy*sa,jawY+dx*sa+dy*ca,base[k+2]);normal.setXYZ(i,bn[k]*ca-bn[k+1]*sa,bn[k]*sa+bn[k+1]*ca,bn[k+2]);}
    // A small, anterior gular-floor change; no rorqual-style body inflation.
    const throat=S(u,.19,.23)*(1-S(u,.27,.31))*(1-S(Math.abs(base[k+2]),.16,.26))*S(cy-base[k+1],.15,.25);if(throat)p.setY(i,p.getY(i)-.007*st.gape*throat);
  }}else if(wave&&env&&stroke){for(let i=0;i<p.count;i++){const k=i*3,x=base[k],y=base[k+1],z=base[k+2],u=C(.5-x/length,0,1),q=point(u,y-cy),pitch=.14*env*stroke*S(u,.87,.96)*Math.sin(clock*2*Math.PI*.225-2.2+Math.PI*.5),dx=q.x-distalPivot.x,dy=q.y-distalPivot.y,ca=Math.cos(pitch),sa=Math.sin(pitch),a=q.a+pitch;p.setXYZ(i,distalPivot.x+dx*ca-dy*sa,distalPivot.y+dx*sa+dy*ca,z);normal.setXYZ(i,bn[k]*Math.cos(a)-bn[k+1]*Math.sin(a),bn[k]*Math.sin(a)+bn[k+1]*Math.cos(a),bn[k+2]);
    const flipper=S(Math.abs(z),.33,.60)*S(u,.22,.27)*(1-S(u,.38,.43)),roll=.045*env*stroke*flipper*Math.sin(clock*2*Math.PI*.225+.5)*Math.sign(z),ry=y-(cy-.22),rz=z-Math.sign(z)*.32;if(flipper){p.setY(i,cy-.22+ry*Math.cos(roll)-rz*Math.sin(roll));p.setZ(i,Math.sign(z)*.32+ry*Math.sin(roll)+rz*Math.cos(roll));normal.setXYZ(i,normal.getX(i),normal.getY(i)*Math.cos(roll)-normal.getZ(i)*Math.sin(roll),normal.getY(i)*Math.sin(roll)+normal.getZ(i)*Math.cos(roll));}
  }}
  p.needsUpdate=true;normal.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
 }
 const roll=action==='forage'?107.5*Math.PI/180*st.hold:action==='roll'?Math.PI/2*env:0,pitch=action==='forage'?-14*Math.PI/180*st.hold:0;
 m.root.rotation.set(roll,action==='turn'?.24*env:0,pitch,'ZXY');const center=V(0,cy,0);m.root.position.copy(center.clone().sub(center.applyEuler(m.root.rotation)));m.root.scale.setScalar(1);m.root.updateMatrixWorld(true);
 f.current=feeding?{...st,stage:oral?(st.gape>.98?'Open mouth · cream baleen and oral floor':st.gape>0?'Opening / closing the source lower jaw':st.time===16?'Study complete':'Closed source mouth'):st.stage}:null;f.poseKey=key;updateGrayBarnacles(m);updateSpecimenLandmarks(m);return true;
}
