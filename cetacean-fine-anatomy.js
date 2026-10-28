import * as T from 'three';
import {cetaceanBodyPoint,cetaceanSection,smoothSurfaceSeams} from './cetacean-models.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
import {fineTexture} from './cetacean-fine-textures.js';

// Original reference-led exterior derivatives. Coordinates and display timing
// are authored selections, not fitted specimens, CFD or validated motor control.
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),S=T.MathUtils.smoothstep,C=T.MathUtils.clamp,L=T.MathUtils.lerp;
const G=(v,s)=>Math.exp(-((v/s)**2)),TAU=2*Math.PI;
export const fineSpecies=new Set(['balaenoptera-physalus','eschrichtius-robustus','delphinapterus-leucas','monodon-monoceros','delphinus-delphis']);
export const fineNoise=(x,y,z)=>{
 const h=(i,j,k)=>{const n=Math.sin(i*127.1+j*311.7+k*74.7+73.1)*43758.5453;return n-Math.floor(n);},i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),u=S(x-i,0,1),v=S(y-j,0,1),w=S(z-k,0,1);
 return L(L(L(h(i,j,k),h(i+1,j,k),u),L(h(i,j+1,k),h(i+1,j+1,k),u),v),L(L(h(i,j,k+1),h(i+1,j,k+1),u),L(h(i,j+1,k+1),h(i+1,j+1,k+1),u),v),w);
};
const specs={
 'balaenoptera-physalus':{mode:'lunge',gape:.66,upper:.18,hinge:.255,throat:.52,seconds:24,depth:.50,width:.95,plates:110,teeth:0},
 'eschrichtius-robustus':{mode:'benthic',gape:.16,upper:0,hinge:.255,throat:.31,seconds:16,depth:.025,width:0,plates:76,teeth:0},
 'delphinapterus-leucas':{mode:'pursed',gape:.25,upper:0,hinge:.125,throat:.26,seconds:8,depth:.035,width:0,plates:0,teeth:9},
 'monodon-monoceros':{mode:'subterminal',gape:.13,upper:0,hinge:.103,throat:.22,seconds:12,depth:.025,width:0,plates:0,teeth:0},
 'delphinus-delphis':{mode:'ram',gape:.30,upper:.025,hinge:.16,throat:.24,seconds:10,depth:.014,width:0,plates:0,teeth:42}
};
export function feedingPhase(id,t){
 const c=specs[id],q=C(t/c.seconds,0,1),pulse=S(q,.12,.30)*(1-S(q,.38,.53)),distension=S(q,.16,.36)*(1-S(q,.61,.86)),draining=S(q,.53,.61)*(1-S(q,.79,.91)),recovery=S(q,.88,1);
 const stage=q<.12?'Approach':q<.30?(c.mode==='lunge'?'Jaw opening and anterior pouch filling':c.mode==='benthic'?'Lateral mouth opening near the benthos':c.mode==='pursed'?'Lip pursing and aperture opening':c.mode==='subterminal'?'Subterminal mouth opening':'Jaw opening during pursuit'):q<.53?(c.mode==='lunge'?'Jaw closure with pouch still expanded':c.mode==='ram'?'Jaw capture and closure':'Selected intake and jaw closure'):q<.86?(c.plates?'Selected draining and recovery':'Closed-mouth recovery'):q<1?'Return to neutral':'Study complete';
 return{q,time:C(t,0,c.seconds),seconds:c.seconds,gape:q===0||q===1?0:pulse,pouch:q===0||q===1?0:distension,draining,recovery,stage};
}

function mouthAt(c,u){const s=cetaceanSection(c,u),q=c.mouthQ+(c.mouthArch??.055)*Math.sin(C(u/c.headEnd,0,1)*Math.PI);return c.y+(s.top+s.bottom)*.5+(s.top-s.bottom)*.5*q;}
function splitOralBody(mesh,c,config){
 const src=mesh.geometry,attrs=src.attributes,p=attrs.position,rows=[],indices=[],look=new Map(),cuts=new Map();
 const vertex=i=>({id:String(i),p:V().fromBufferAttribute(p,i),uv:attrs.uv?[attrs.uv.getX(i),attrs.uv.getY(i)]:[0,0],n:V().fromBufferAttribute(attrs.normal,i),color:attrs.color?[attrs.color.getX(i),attrs.color.getY(i),attrs.color.getZ(i)]:null});
 const source=Array.from({length:p.count},(_,i)=>vertex(i)),ix=src.index?.array||source.map((_,i)=>i),hingeX=c.length*(.5-config.hinge);
 function add(poly,side){for(let j=1;j<poly.length-1;j++){const tri=[poly[0],poly[j],poly[j+1]];if(tri[1].p.clone().sub(tri[0].p).cross(tri[2].p.clone().sub(tri[0].p)).lengthSq()<1e-28)continue;for(const v of tri){const key=side+':'+v.id;let n=look.get(key);if(n===undefined){n=rows.length;rows.push({...v,side});look.set(key,n);}indices.push(n);}}}
 const scalar=v=>v.p.y-mouthAt(c,C(.5-v.p.x/c.length,0,1));
 // Split every intersecting source edge consistently. The posterior copies
 // coincide and stay joined; stopping clipping at a row produced T junctions.
 for(let k=0;k<ix.length;k+=3){const tri=Array.from(ix.slice(k,k+3),i=>source[i]);
  for(const side of[-1,1]){const poly=[];for(let i=0;i<3;i++){const a=tri[i],b=tri[(i+1)%3],fa=scalar(a)*side,fb=scalar(b)*side;if(fa>=0)poly.push(a);if(fa*fb<0){const f=fa/(fa-fb),key='cut:'+ [a.id,b.id].sort().join(':');if(!cuts.has(key)){const point=a.p.clone().lerp(b.p,f);cuts.set(key,{id:key,p:point,uv:a.uv.map((x,j)=>L(x,b.uv[j],f)),n:a.n.clone().lerp(b.n,f).normalize(),color:a.color?.map((x,j)=>L(x,b.color[j],f))||null});}poly.push(cuts.get(key));}}if(poly.length>2)add(poly,side);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(rows.flatMap(v=>v.p.toArray()),3));g.setAttribute('normal',new T.Float32BufferAttribute(rows.flatMap(v=>v.n.toArray()),3));g.setAttribute('uv',new T.Float32BufferAttribute(rows.flatMap(v=>v.uv),2));if(rows[0].color)g.setAttribute('color',new T.Float32BufferAttribute(rows.flatMap(v=>v.color),3));g.setIndex(indices);g.userData={oralExterior:true,source:'Reference-led split at the retained anatomical commissure; intentional oral boundary with separately attached inner surfaces.'};g.computeBoundingBox();g.computeBoundingSphere();mesh.geometry=g;
 return{rows,neutral:g.attributes.position.array.slice(),normal:g.attributes.normal.array.slice()};
}
function grid(nx,nz,fn){const p=[],uv=[],ix=[];for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){p.push(...fn(i/nx,j/nz));uv.push(i/nx,j/nz);}for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j,b=a+nz+1;ix.push(a,b,a+1,b,b+1,a+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
function updateGeometry(g){g.attributes.position.needsUpdate=true;g.computeVertexNormals();smoothSurfaceSeams(g);g.computeBoundingBox();g.computeBoundingSphere();}

// Finite, species-distinct jaw/throat morphs. These do not calculate suction,
// transported water/prey, filtration efficiency, pressure or swallowing.
function oralPoint(p,side,c,k,state){
 const u=C(.5-p.x/c.length,0,1),weight=1-S(u,k.hinge-.025,k.hinge+.012),hx=c.length*(.5-k.hinge),hy=mouthAt(c,k.hinge),out=p.clone();
 const aperture=k.mode==='pursed'?1-S(u,.035,.085):1,angle=(side>0?k.upper:side<0?-k.gape:0)*state.gape*weight*aperture,dx=p.x-hx,dy=p.y-hy;out.x=hx+dx*Math.cos(angle)-dy*Math.sin(angle);out.y=hy+dx*Math.sin(angle)+dy*Math.cos(angle);
 if(side<=0){
  const anterior=S(u,.005,.045)*(1-S(u,k.throat-.06,k.throat)),ventral=S(mouthAt(c,u)-p.y,0,.1),front=G(u-.17,.15);
  const amount=k.mode==='lunge'?state.pouch:state.gape;out.y-=k.depth*amount*anterior*ventral*front;out.z*=1+k.width*state.gape*anterior*ventral;
 }
 if(k.mode==='pursed'&&u<.07){const front=1-S(u,.026,.07),purse=.58*state.gape*front;out.z*=1-purse;out.x+=.038*state.gape*front;}
 return out;
}
function createOralSurfaces(m,r,k){
 const c=r.c,pieces=[],group=new T.Group();group.name='Species-specific oral exterior and lining';m.root.add(group);
 const add=(g,mat,side,name)=>{const mesh=new T.Mesh(g,mat);mesh.name=name;group.add(mesh);const p={mesh,side,neutral:g.attributes.position.array.slice()};pieces.push(p);return p;};
 const at=(u,v)=>{const along=.004+(k.hinge-.006)*u,q=c.mouthQ+(c.mouthArch??.055)*Math.sin(C(along/c.headEnd,0,1)*Math.PI),p=cetaceanBodyPoint(c,along,Math.acos(C(q,-.99,.99)));return V(p.x,p.y,Math.abs(p.z)*(v*2-1));};
 const lining=new T.MeshStandardMaterial({color:k.plates?'#28282a':'#555352',roughness:.57,side:T.DoubleSide});
 for(const side of[-1,1]){
  if(side>0||!k.plates){const g=grid(96,32,(u,v)=>{const p=at(u,v),arch=Math.sin(Math.PI*v)*Math.sin(Math.PI*u);p.y+=(side>0?1:-1)*(k.plates?.040:.018)*arch;return p;});add(g,lining.clone(),side,side>0?'Selected inner palate':'Selected oral floor');}
  else{
   // The interior follows the distensible lower shell. A flat sheet left the
   // exposed cavity looking like a pale, straight curtain across the mouth.
   const src=r.body.geometry,p=src.attributes.position,ix=src.index.array,positions=[],indices=[],used=new Map();
   for(let i=0;i<ix.length;i+=3){const tri=Array.from(ix.slice(i,i+3));if(!tri.every(j=>{const u=C(.5-p.getX(j)/c.length,0,1);return u<k.throat&&p.getY(j)<=mouthAt(c,u)+.000001;}))continue;const out=[];for(const j of tri){if(!used.has(j)){used.set(j,positions.length/3);positions.push(p.getX(j),p.getY(j)+.003,p.getZ(j)*.985);}out.push(used.get(j));}indices.push(out[0],out[2],out[1]);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const mat=lining.clone();mat.side=T.FrontSide;add(g,mat,-1,'Selected inner lining following the distensible lower shell');
  }
  for(const sign of[-1,1]){const g=grid(96,12,(u,v)=>{const p=at(u,sign>0?1:0),theta=v*TAU,rad=(k.mode==='pursed'?.009:.0035)*(.25+.75*Math.sin(Math.PI*u)**.5);p.y+=Math.sin(theta)*rad;p.z+=Math.cos(theta)*rad;return p;});add(g,new T.MeshStandardMaterial({color:k.mode==='pursed'?'#a6aaa2':k.mode==='ram'?'#404c4f':'#647071',roughness:.4,side:T.DoubleSide}),side,(side>0?'Upper':'Lower')+' attached rounded lip '+sign);}
 }
 if(k.plates){const pp=[],ix=[];for(const sign of[-1,1])for(let i=0;i<k.plates;i++){const u=.09+.82*i/(k.plates-1),p=at(u,sign>0?.98:.02),drop=(k.mode==='lunge'?.105:.061)*Math.sin(Math.PI*u)**.5,n=pp.length/3;pp.push(p.x-.001,p.y,p.z,p.x+.001,p.y,p.z,p.x-.001,p.y-drop,p.z-sign*.012,p.x+.001,p.y-drop,p.z-sign*.012);ix.push(n,n+1,n+2,n+1,n+3,n+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setIndex(ix);g.computeVertexNormals();add(g,new T.MeshStandardMaterial({color:k.mode==='lunge'?'#555044':'#b3ac8c',roughness:.82,side:T.DoubleSide}),1,'Paired baleen racks; selected display density');}
 if(k.teeth){for(const sign of[-1,1])for(const side of[-1,1]){const pp=[],ix=[];for(let i=0;i<k.teeth;i++){const u=.12+.68*i/(k.teeth-1),p=at(u,sign>0?.97:.03),h=k.mode==='ram'?.012:.013,g=new T.ConeGeometry(k.mode==='ram'?.0028:.005,h,8,1);g.rotateZ(side>0?Math.PI:0);g.translate(p.x,p.y-side*h*.48,p.z);const a=g.attributes.position,n=pp.length/3;pp.push(...a.array);ix.push(...Array.from(g.index.array,j=>j+n));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setIndex(ix);g.computeVertexNormals();add(g,new T.MeshStandardMaterial({color:'#c8c3a9',roughness:.51}),side,'Selected conical tooth row '+side+':'+sign);}}
 // Rounded posterior lining bridges both moving halves, hiding a hollow shell.
 const back=add(grid(8,24,(u,v)=>at(.99,v)),lining.clone(),0,'Selected rear oral lining');back.bridge=true;
 for(const p of pieces)p.mesh.visible=p.mesh.name.includes('rounded lip');return{group,pieces,at};
}
export function configureFineAnatomy(m,r){
 const k=specs[m.id];if(!k)return;
 // Fin-whale folds are sculpted into the one body exterior, avoiding a second
 // nearly coincident shell and its raster interference patterns.
 const cut=splitOralBody(r.body,r.c,k),bodyPart=r.parts.find(p=>p.mesh===r.body);bodyPart.neutral=cut.neutral;
 const oral=createOralSurfaces(m,r,k),parts=r.parts.map(p=>({...p,normal:p.mesh.geometry.attributes.normal?.array.slice(),sides:p.mesh===r.body?cut.rows.map(v=>v.side):null}));
 for(const p of oral.pieces)if(p.mesh.name.includes('rounded lip'))r.parts.push({mesh:p.mesh,neutral:p.neutral});
 m.fineAnatomy={k,c:r.c,r,parts,oral,clock:null,changed:false,version:'0.6.54'};
 m.root.userData.aquaticStudy=true;m.root.userData.fineAnatomy=true;
 // Rebind the previous three anatomical locators to actual retained vertices.
 m.featureBindings=m.featureBindings.map((b,j)=>{if(b.mesh!==r.body)return b;const target=j===0?cetaceanBodyPoint(r.c,r.c.eyeU,Math.PI*.5):cetaceanBodyPoint(r.c,.60,0),p=r.body.geometry.attributes.position;let best=0,dist=Infinity;for(let i=0;i<p.count;i++){const d=V().fromBufferAttribute(p,i).distanceToSquared(target);if(d<dist){best=i;dist=d;}}return{...b,indices:[best]};});
 m.motionBounds={...m.motionBounds,forage:new T.Box3(V(-2.18,r.c.y-.98,-1.15),V(2.30,r.c.y+.80,1.15))};
}
export function restoreFineAnatomy(m){const f=m.fineAnatomy;if(!f)return;f.oral.group.visible=true;for(const p of f.oral.pieces){p.mesh.visible=p.mesh.name.includes('rounded lip');if(p.mesh.visible){p.mesh.geometry.attributes.position.array.set(p.neutral);updateGeometry(p.mesh.geometry);}}if(f.changed){for(const p of f.parts){const g=p.mesh.geometry;g.attributes.position.array.set(p.neutral);g.attributes.position.needsUpdate=true;if(p.normal){g.attributes.normal.array.set(p.normal);g.attributes.normal.needsUpdate=true;}g.computeBoundingBox();g.computeBoundingSphere();}f.changed=false;}f.clock=null;}
export function animateFineFeeding(m,action,t){
 const f=m.fineAnatomy;if(!f)return false;if(action!=='forage'){restoreFineAnatomy(m);return false;}
 const st=feedingPhase(m.id,t);if(f.changed&&f.clock===st.time)return true;const {c,k}=f;
 for(const part of f.parts){const g=part.mesh.geometry,p=g.attributes.position;if(m.id==='monodon-monoceros'&&part.mesh!==f.r.body){p.array.set(part.neutral);updateGeometry(g);continue;}for(let i=0;i<p.count;i++){const v=V(...part.neutral.slice(i*3,i*3+3)),u=.5-v.x/c.length,side=part.sides?.[i]??(v.y<mouthAt(c,u)?-1:1),v2=oralPoint(v,side,c,k,st);if(k.mode==='lunge'||k.mode==='ram'){const stroke=S(st.q,0,.04)*(1-S(st.q,.24,.40)),w=S(u,.43,1)**2,angle=.12*stroke*w*Math.sin(st.time*(k.mode==='lunge'?1.8:2.7)-u*2.1),hx=c.length*(.5-.43),dx=v2.x-hx,dy=v2.y-c.y;v2.x=hx+dx*Math.cos(angle)-dy*Math.sin(angle);v2.y=c.y+dx*Math.sin(angle)+dy*Math.cos(angle);}p.setXYZ(i,...v2);}updateGeometry(g);}
 for(const part of f.oral.pieces){const g=part.mesh.geometry,p=g.attributes.position;for(let i=0;i<p.count;i++){const v=V(...part.neutral.slice(i*3,i*3+3));let v2;if(part.bridge){const nz=24,j=i%(nz+1),row=Math.floor(i/(nz+1)),a=oralPoint(v,1,c,k,st),b=oralPoint(v,-1,c,k,st);v2=a.lerp(b,row/8);}else v2=oralPoint(v,part.side,c,k,st);p.setXYZ(i,...v2);}updateGeometry(g);}
 f.oral.group.visible=true;for(const p of f.oral.pieces)p.mesh.visible=p.mesh.name.includes('rounded lip')||st.gape>.001;const positionHold=S(st.q,.02,.13)*(1-S(st.q,.86,1)),roll=k.mode==='benthic'?107.5*Math.PI/180*positionHold:0;
 const lungeRoll=k.mode==='lunge'?87*Math.PI/180*S(st.q,.15,.36)*(1-S(st.q,.66,.91)):0,lungePitch=k.mode==='lunge'?.28*S(st.q,.32,.60)*(1-S(st.q,.78,1)):0;
 // Apply longitudinal roll before world-vertical pitch. XYZ would reverse the
 // visible pitch after a >90-degree gray-whale roll, lifting its rostrum.
 m.root.rotation.set(roll+lungeRoll,0,k.mode==='benthic'?-14*Math.PI/180*positionHold:lungePitch,'ZXY');const center=V(0,c.y,0);m.root.position.copy(center.clone().sub(center.applyEuler(m.root.rotation)));m.root.position.x+=k.mode==='lunge'?.24*S(st.q,0,.22)*(1-S(st.q,.88,1)):k.mode==='ram'?.18*Math.sin(Math.PI*st.q)**2:0;
 m.root.scale.setScalar(1);m.root.updateMatrixWorld(true);f.clock=st.time;f.changed=true;f.current=st;updateSpecimenLandmarks(m);return true;
}

// Body-relative normal/roughness fields follow the same UVs in both renderers.
// Their low relief is selected to avoid turning naturally smooth skin into stone.
const details=new Map();
export function skinDetailMaps(c,kind='body'){
 const n=fineTexture(c.id,'normal-'+kind),r=fineTexture(c.id,'roughness-'+kind);if(n&&r)return[n,r];
 const key=c.id+kind;if(details.has(key))return details.get(key).map(t=>t.clone());
 const w=kind==='body'?1024:256,h=kind==='body'?512:128,normal=new Uint8Array(w*h*4),rough=new Uint8Array(w*h*4);
 const height=(u,a)=>{const q=Math.cos(a),z=Math.sin(a),coarse=fineNoise(u*240,z*55,q*55)-.5,fine=fineNoise(u*850,z*230,q*230)-.5;let relief=coarse*.20+fine*.035;
  if(c.id==='eschrichtius-robustus')relief*=2.1;
  if(c.id==='delphinapterus-leucas')relief*=.43;
  // Longitudinal rorqual folds use their own geometry, not a duplicate normal
  // frequency that interferes with it in the compatibility renderer.
  return relief;};
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const u=i/(w-1),a=j/(h-1)*TAU,k=(j*w+i)*4,du=(height(u+1/w,a)-height(u-1/w,a))*.35,dv=(height(u,a+TAU/h)-height(u,a-TAU/h))*.35,n=V(-du,-dv,1).normalize();normal[k]=Math.round((n.x*.5+.5)*255);normal[k+1]=Math.round((n.y*.5+.5)*255);normal[k+2]=Math.round((n.z*.5+.5)*255);normal[k+3]=255;const r=Math.round(255*(.72+.18*fineNoise(u*85,Math.sin(a)*18,Math.cos(a)*18)));rough[k]=rough[k+1]=rough[k+2]=r;rough[k+3]=255;}
 const maps=[normal,rough].map(d=>{const t=new T.DataTexture(d,w,h);t.flipY=false;t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;});details.set(key,maps);return maps.map(t=>t.clone());
}
export function applyFineMaterial(mat,c,kind='body'){
 const[n,r]=skinDetailMaps(c,kind);mat.normalMap=n;mat.roughnessMap=r;mat.normalScale.set(.65,.65);mat.roughness=c.id==='delphinapterus-leucas'?.42:.39;mat.metalness=0;mat.userData.compatibilitySurfaceDetail=true;mat.userData.compatibilityWetSkin=true;mat.needsUpdate=true;
}

export function refineFlukePitch(r,action,t){
 if(!['swim','glide'].includes(action))return;
 const clock=C(t,0,12),envelope=t<=0||t>=12?0:Math.sin(Math.PI*clock/12)**2,stroke=action==='glide'?S(clock,0,1)*(1-S(clock,5,6)):1,phase=TAU*r.c.rate*clock-(r.c.lag||2.1),pitch=.18*envelope*stroke*Math.sin(phase+Math.PI*.5);
 if(!pitch)return;
 for(const mesh of r.flukes){const p=mesh.geometry.attributes.position;let sumX=0,sumY=0,n=0;for(let i=0;i<p.count;i++)if(Math.abs(p.getZ(i))<.04){sumX+=p.getX(i);sumY+=p.getY(i);n++;}const x=sumX/(n||1),y=sumY/(n||1);for(let i=0;i<p.count;i++){const dx=p.getX(i)-x,dy=p.getY(i)-y;p.setXYZ(i,x+dx*Math.cos(pitch)-dy*Math.sin(pitch),y+dx*Math.sin(pitch)+dy*Math.cos(pitch),p.getZ(i));}updateGeometry(mesh.geometry);}
}
