import * as T from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),C=T.MathUtils.clamp,S=T.MathUtils.smoothstep,L=T.MathUtils.lerp,TAU=Math.PI*2,G=(x,s)=>Math.exp(-((x/s)**2));
export const belugaDimensions={length:5.15,cy:1.45,flukeSpan:1.16,flukeChord:.39,flipperSpan:.515,flipperChord:.36,
 scope:'Selected normalized adult exterior, independently authored as a continuous implicit surface against qualitative photographs and cohort context. Original CC0 reference retained separately. Not photogrammetry or a measured individual.'};
export const belugaEvidence={sourceUid:'3dassets-39327',sourceLicense:'CC0 1.0',sourceAI:true,referenceLengthM:3.64,referenceAnimals:3,referenceBouts:19,selectedRelativeSpeed:.5,
 frequencyHz:.143+1.454*.5,heaveM:.448-.134*.5,pitchDegrees:42.113-16.459*.5,
 feedingContext:'Kane and Marshall2009 abstract: preparatory, jaw opening, gular depression, closure; lateral gape occlusion. SICB preliminary means guide scale/order only, not a fitted individual.',
 fittedIndividual:false,fluidSolver:false,sourceAnimation:false};
// Model in the established control frame, then lengthen the trunk only.
// Head, lips and appendage chords retain their physical size.
const controlDimensions={...belugaDimensions,length:4.50};
export const belugaLongitudinalX=x=>x+.325*(2*S(x,-1.40,1.20)-1);
const bodyFullness=x=>1+.08*S(x,-1.90,-1.15)*(1-S(x,.65,1.30));
const displayPoint=p=>{const f=bodyFullness(p.x);p.y=controlDimensions.cy+(p.y-controlDimensions.cy)*f;p.z*=f;p.x=belugaLongitudinalX(p.x);return p;};
// [u, half width, dorsal height, ventral height], in normalized display units.
// Selected adult surface controls, not dimensions recovered from the images.
const profile=[[0,0,-.115,-.115],[.0005,.036,-.060,-.143],[.001,.053,-.025,-.154],[.003,.092,.040,-.172],[.008,.154,.160,-.203],[.018,.218,.280,-.239],[.035,.251,.360,-.266],[.060,.263,.370,-.283],[.086,.263,.345,-.296],[.115,.263,.307,-.304],[.150,.284,.316,-.324],[.182,.327,.329,-.367],[.22,.385,.363,-.418],[.29,.433,.415,-.467],[.38,.473,.459,-.502],[.47,.476,.461,-.498],[.56,.442,.427,-.459],[.65,.366,.358,-.377],[.74,.267,.261,-.279],[.82,.171,.174,-.183],[.89,.087,.103,-.107],[.96,.042,.061,-.052],[1,0,0,0]];
function interp(rows,u,k){let i=0;while(i<rows.length-2&&u>rows[i+1][0])i++;const a=rows[i],b=rows[i+1],h=b[0]-a[0],q=C((u-a[0])/h,0,1),slope=n=>{if(n===0)return(rows[1][k]-rows[0][k])/(rows[1][0]-rows[0][0]);if(n===rows.length-1)return(rows[n][k]-rows[n-1][k])/(rows[n][0]-rows[n-1][0]);const p=rows[n-1],r=rows[n],s=rows[n+1],h0=r[0]-p[0],h1=s[0]-r[0],d0=(r[k]-p[k])/h0,d1=(s[k]-r[k])/h1;return d0*d1<=0?0:3*(h0+h1)/((2*h1+h0)/d0+(h1+2*h0)/d1);};return(2*q**3-3*q*q+1)*a[k]+(q**3-2*q*q+q)*h*slope(i)+(-2*q**3+3*q*q)*b[k]+(q**3-q*q)*h*slope(i+1);}
export function belugaSection(u){
 u=C(u,0,1);let w=Math.max(0,interp(profile,u,1)),top=interp(profile,u,2),bottom=interp(profile,u,3);
 return{w,top,bottom};
}
const mouthY=(u,z=0)=>controlDimensions.cy-.125-.018*G(u-.065,.040)+.048*S(u,.085,.156)+.018*G(z,.052)*(1-S(u,.035,.080));
const smoothUnion=(a,b,k)=>{const h=C(.5+.5*(b-a)/k,0,1);return L(b,a,h)-k*h*(1-h);};
function ellipsoidDistance(x,y,z,cx,dy,rx,ry,rz){const yy=y-controlDimensions.cy-dy,xx=x-cx,k0=Math.hypot(xx/rx,yy/ry,z/rz),k1=Math.hypot(xx/(rx*rx),yy/(ry*ry),z/(rz*rz));return k1?k0*(k0-1)/k1:-Math.min(rx,ry,rz);}
function surfaceDistance(x,y,z,section=null){
 const {length,cy}=controlDimensions,u=C(.5-x/length,0,1),r=section||belugaSection(u),mid=cy+(r.top+r.bottom)/2,ry=Math.max(.001,(r.top-r.bottom)/2),w=Math.max(.001,r.w),angle=Math.atan2(Math.abs(z)/w,(y-mid)/ry),foldMask=S(u,.23,.34)*(1-S(u,.70,.85)),bend=.082*Math.sin((u-.26)*5.8)+.015*Math.sin(u*17.3);let relief=0;
 for(const [at,amp,sd]of[[1.80,.014,.145],[2.15,.019,.16]])relief-=amp*G(angle-at-bend,sd)*foldMask*(.73+.27*Math.sin(u*14+at));
 for(const [at,amp,sd]of[[1.56,.014,.29],[1.98,.018,.26],[2.46,.014,.30]])relief+=amp*G(angle-at-bend,sd)*foldMask;
 const trunk=Math.max((Math.hypot((y-mid)/ry,z/w)-1)*Math.min(w,ry)-relief,x-1.63,-length*.5-x),melon=ellipsoidDistance(x,y,z,1.98,.110,.345,.265,.265),rostrum=ellipsoidDistance(x,y,z,2.065,-.120,.270,.138,.232),chin=ellipsoidDistance(x,y,z,1.96,-.205,.30,.145,.245),cheek=ellipsoidDistance(x,y,z,1.70,-.015,.47,.345,.300);
 let d=smoothUnion(trunk,smoothUnion(cheek,smoothUnion(melon,smoothUnion(rostrum,chin,.075),.085),.095),.085);
 const lipMask=S(x,1.61,1.77)*(1-S(x,2.275,2.32)),dy=y-mouthY(u,z);
 d+=(.0035*G(dy,.008)-.008*G(dy-.020,.015)-.004*G(dy+.019,.015))*lipMask;
 // A recessed orbital bed and broad brow merge into the actual skin.
 const lateral=S(Math.abs(z),.18,.245),eyeX=1.755,eyeY=cy-.005;
 d+=(.009*G(x-eyeX,.035)*G(y-eyeY,.026)-.006*G(x-eyeX,.046)*G(y-eyeY-.028,.014))*lateral;
 // Loose anterior skin has a few soft, irregular neck creases.
 for(const at of[.177,.202])d+=.0014*G(u-at-.006*Math.sin(angle*2.4),.009)*G(angle-1.9,.65);
 d-=.0035*Math.sin(u*29+Math.sin(angle*3.1))*G(u-.48,.24)*Math.sin(angle)**2;
 return d;
}
let exteriorTemplate=null;
function refineAnterior(positions,indices,uv){
 const point=i=>V(positions[i*3],positions[i*3+1],positions[i*3+2]);
 const project=i=>{const p=point(i);if(p.x<1.48)return;for(let j=0;j<4;j++){const e=.001,d=surfaceDistance(p.x,p.y,p.z),n=V(surfaceDistance(p.x+e,p.y,p.z)-surfaceDistance(p.x-e,p.y,p.z),surfaceDistance(p.x,p.y+e,p.z)-surfaceDistance(p.x,p.y-e,p.z),surfaceDistance(p.x,p.y,p.z+e)-surfaceDistance(p.x,p.y,p.z-e)).multiplyScalar(1/(2*e));p.addScaledVector(n,-C(d/Math.max(.05,n.lengthSq()),-.015,.015));}positions[i*3]=p.x;positions[i*3+1]=p.y;positions[i*3+2]=p.z;};
 for(let i=0;i<positions.length/3;i++)project(i);
 let faces=indices.slice();
 // Conforming edge splits keep the exterior watertight. New anterior
 // vertices are projected onto the continuous field, rather than merely
 // dividing the old faceted lip triangles into smaller flat triangles.
 for(let pass=0;pass<2;pass++){
  const edges=new Map(),key=(a,b)=>a<b?a+':'+b:b+':'+a;
  for(let t=0;t<faces.length;t+=3)for(let j=0;j<3;j++){const a=faces[t+j],b=faces[t+(j+1)%3],p=point(a),q=point(b),mid=p.clone().add(q).multiplyScalar(.5),u=C(.5-mid.x/controlDimensions.length,0,1),lip=mid.x>1.58&&Math.abs(mid.y-mouthY(u,mid.z))<.060,orbit=Math.abs(mid.x-1.755)<.065&&Math.abs(mid.y-controlDimensions.cy+.005)<.055;
   if((lip||orbit)&&p.distanceToSquared(q)>(pass?.0035:.006)**2){const k=key(a,b);if(!edges.has(k)){const id=positions.length/3;positions.push(mid.x,mid.y,mid.z);project(id);edges.set(k,id);}}
  }
  const next=[];
  for(let t=0;t<faces.length;t+=3){let a=faces[t],b=faces[t+1],c=faces[t+2],ab=edges.get(key(a,b)),bc=edges.get(key(b,c)),ca=edges.get(key(c,a));const n=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);if(!n){next.push(a,b,c);continue;}if(n===3){next.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);continue;}
   while(n===1?ab===undefined:ab===undefined||bc===undefined){[a,b,c]=[b,c,a];[ab,bc,ca]=[bc,ca,ab];}
   if(n===1)next.push(a,ab,c,ab,b,c);else next.push(a,ab,c,ab,bc,c,ab,b,bc);
  }faces=next;
 }
 indices.length=0;for(const i of faces)indices.push(i);uv.length=0;for(let i=0;i<positions.length;i+=3)uv.push(C((controlDimensions.length*.5+.110-positions[i])/(controlDimensions.length+.110),0,1),(Math.atan2(positions[i+2],positions[i+1]-controlDimensions.cy)+TAU)%TAU/TAU);
}
function weldMicroscopicEdges(positions,indices){
 const tolerance=.000005,buckets=new Map(),canonical=[];
 for(let i=0;i<positions.length/3;i++){const p=positions.slice(i*3,i*3+3),cell=p.map(v=>Math.floor(v/tolerance));let match=-1;
  for(let dx=-1;dx<=1&&match<0;dx++)for(let dy=-1;dy<=1&&match<0;dy++)for(let dz=-1;dz<=1&&match<0;dz++){const list=buckets.get([cell[0]+dx,cell[1]+dy,cell[2]+dz].join(':'));if(list)for(const j of list)if(Math.hypot(p[0]-positions[j*3],p[1]-positions[j*3+1],p[2]-positions[j*3+2])<tolerance){match=j;break;}}
  if(match<0){match=i;const key=cell.join(':');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(i);}canonical.push(match);
 }
 const clean=[],faces=new Set();for(let i=0;i<indices.length;i+=3){const tri=[canonical[indices[i]],canonical[indices[i+1]],canonical[indices[i+2]]];if(new Set(tri).size<3)continue;const key=[...tri].sort((a,b)=>a-b).join(':');if(!faces.has(key)){faces.add(key);clean.push(...tri);}}indices.length=0;for(const i of clean)indices.push(i);
}
function headTextureUV(p,side=1){const x=p.x-1.85,y=p.y-controlDimensions.cy+.030,z=Math.abs(p.z)*side,r=Math.hypot(x,y,z)||1;return[(Math.atan2(z,x)+Math.PI)/TAU,Math.acos(C(y/r,-1,1))/Math.PI*.5];}
function atlasExterior(positions,indices){
 const source=Array.from({length:positions.length/3},(_,i)=>({id:String(i),p:V(...positions.slice(i*3,i*3+3))})),out=[],uv=[],ix=[],lookup=new Map(),cuts=new Map();
 function clip(poly,axis,level,sign){const result=[];for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length],fa=(a.p[axis]-level)*sign,fb=(b.p[axis]-level)*sign;if(fa>=0)result.push(a);if(fa*fb<0){const key=axis+':'+[a.id,b.id].sort().join(':');if(!cuts.has(key)){const p=a.p.clone().lerp(b.p,fa/(fa-fb));p[axis]=level;cuts.set(key,{id:key,p});}result.push(cuts.get(key));}}return result;}
 for(let t=0;t<indices.length;t+=3){const tri=[source[indices[t]],source[indices[t+1]],source[indices[t+2]]];for(const head of[false,true])for(const side of[-1,1]){const poly=clip(clip(tri,'x',1.50,head?1:-1),'z',0,side);if(poly.length<3)continue;const ids=[];for(const v of poly){const key=Number(head)+':'+side+':'+v.id;if(!lookup.has(key)){const p=v.p;lookup.set(key,out.length/3);out.push(p.x,p.y,p.z);if(head)uv.push(...headTextureUV(p,side));else{let a=Math.atan2(Math.abs(p.z)*side,p.y-controlDimensions.cy);if(a<0||side<0&&a===0)a+=TAU;uv.push(C((1.50-p.x)/3.75,0,1),.5+a/TAU*.5);}}ids.push(lookup.get(key));}for(let j=1;j<ids.length-1;j++){const a=poly[0].p,b=poly[j].p,c=poly[j+1].p;if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-22)ix.push(ids[0],ids[j],ids[j+1]);}}
 }
 return geometry(out,ix,uv);
}
function implicitExterior(){
 if(exteriorTemplate)return exteriorTemplate.clone();
 const n=208,mc=new MarchingCubes(n,new T.MeshBasicMaterial(),false,false,300000),sy=.75,sz=.68;mc.isolation=0;
 // Put over half of the axial samples in the face/neck region. The former
 // uniform grid could not resolve the lip or orbital recess.
 const xAt=q=>q<-.10?-2.55+(q+1)/.90*3.75:1.20+(q+.10)/1.10*1.35;
 const xs=Array.from({length:n},(_,i)=>xAt(i/n*2-1)),sections=xs.map(x=>belugaSection(C(.5-x/controlDimensions.length,0,1)));
 for(let k=0;k<n;k++)for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=xs[i],y=controlDimensions.cy+(j/n*2-1)*sy,z=(k/n*2-1)*sz;mc.field[k*n*n+j*n+i]=-surfaceDistance(x,y,z,sections[i]);}
 mc.update();const source=mc.geometry.attributes.position,positions=[],indices=[],uv=[],keys=new Map();
 for(let i=0;i<mc.count;i++){const x=xAt(source.getX(i)),y=controlDimensions.cy+source.getY(i)*sy,z=source.getZ(i)*sz,key=[x,y,z].map(v=>Math.round(v*1e6)).join(':');if(!keys.has(key)){keys.set(key,positions.length/3);positions.push(x,y,z);uv.push(C((controlDimensions.length*.5+.055-x)/(controlDimensions.length+.055),0,1),(Math.atan2(z,y-controlDimensions.cy)+TAU)%TAU/TAU);}indices.push(keys.get(key));}
 refineAnterior(positions,indices,uv);
 weldMicroscopicEdges(positions,indices);
 exteriorTemplate=atlasExterior(positions,indices);mc.geometry.dispose();mc.material.dispose();return exteriorTemplate.clone();
}
function bodyPoint(u,a){
 const {length,cy}=controlDimensions,r=belugaSection(u),q=Math.cos(a),sn=Math.sin(a),angle=Math.abs(a>Math.PI?a-TAU:a),mid=(r.top+r.bottom)/2,ry=(r.top-r.bottom)/2;
 const ventral=1-S(q,.08,.64),flank=G(angle-1.95,.75);let relief=0;
 // Short neck creases fade into the anterior blubber. The two longer
 // ventrolateral furrows separate rounded volumes, rather than painted lines.
 for(const [at,amp,sd] of [[.156,.005,.004],[.175,.008,.006],[.195,.006,.008]])relief-=amp*G(u-at-.006*Math.sin(a*2.4),sd)*ventral*G(angle-1.95,.85);
 const foldMask=S(u,.23,.34)*(1-S(u,.70,.85)),bend=.082*Math.sin((u-.26)*5.8)+.015*Math.sin(u*17.3);
 for(const [at,amp,sd] of [[1.80,.014,.145],[2.15,.019,.16]])relief-=amp*G(angle-at-bend,sd)*foldMask*(.73+.27*Math.sin(u*14+at));
 for(const [at,amp,sd] of [[1.56,.014,.29],[1.98,.018,.26],[2.46,.014,.30]])relief+=amp*G(angle-at-bend,sd)*foldMask;
 relief+=.0032*Math.sin(u*53+Math.sin(a*3.7))*G(u-.49,.27)*flank;
 relief+=.0021*Math.sin(u*31+a*4.3)*G(u-.46,.30)*Math.sin(a)**2;
 const y0=cy+mid+ry*q,my=(mouthY(u)-cy-mid)/Math.max(ry,.001);
 // Lips are soft volumes in the exterior, with a shallow sulcus above the
 // upper lip. Separate round outline tubes made the former face look drawn.
 const lipMask=S(u,.002,.018)*(1-S(u,.125,.163));
 relief+=(.008*G(q-my-.13,.09)+.003*G(q-my+.10,.09))*lipMask;relief-=.0035*G(q-my,.034)*lipMask;
 relief-=.015*G(q-my-.34,.12)*G(u-.044,.035);
 const eye=G(u-.130,.012)*G(angle-1.66,.105);relief-=.014*eye;
 relief*=S(u,0,.012);
 const radial=1+relief/Math.max(.08,r.w),y=cy+mid+(ry+relief)*q;

 const cheek=.027*G(u-.092,.047)*G(angle-1.80,.50)*S(u,0,.012);
 // The rostral offset is maximal at the pole and decays behind it. Unlike
 // the former zero-at-pole bump it cannot tuck the tip inside a forward ring.
 const muzzle=.055*(1-S(u,0,.075));
 const p=V(length*(.5-u)+muzzle,y,(r.w*radial+cheek)*sn);
 if(u<.20){const center=cy+L(-.115,-.020,S(u,.055,.15));let lo=0,hi=.75,last=0;for(let j=1;j<=48;j++){const r=j/48*.75;if(surfaceDistance(p.x,center+r*q,r*sn)<0)last=r;}lo=last;hi=Math.min(.75,last+.75/48);for(let j=0;j<16;j++){const r=(lo+hi)*.5;if(surfaceDistance(p.x,center+r*q,r*sn)<0)lo=r;else hi=r;}p.set(p.x,center+lo*q,lo*sn);}
 return p;
}
function oralEdge(u,side=1){const x=controlDimensions.length*(.5-u)+.055*(1-S(u,0,.075)),q=C(.5-x/controlDimensions.length,0,1);let lo=0,hi=.55;for(let j=0;j<28;j++){const z=(lo+hi)*.5;if(surfaceDistance(x,mouthY(q,z),z)<0)lo=z;else hi=z;}return V(x,mouthY(q,lo),lo*side);}
function geometry(p,ix,uv){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;}
function grid(nx,nz,fn){const p=[],ix=[],uv=[];for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){p.push(...fn(i/nx,j/nz));uv.push(i/nx,j/nz);}for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j,b=a+nz+1;ix.push(a,b,a+1,b,b+1,a+1);}return geometry(p,ix,uv);}
function seams(g,sides){const p=g.attributes.position,keys=new Map();for(let i=0;i<p.count;i++){const side=sides&&p.getX(i)>1.50?sides[i]:0,key=side+':'+[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e6)).join(':');if(!keys.has(key))keys.set(key,[]);keys.get(key).push(i);}return[...keys.values()].filter(a=>a.length>1);}
function finish(part){const g=part.mesh.geometry,p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),f=bodyFullness(x);const q=v=>Math.round(v*1e5)/1e5;p.setXYZ(i,q(belugaLongitudinalX(x)),q(controlDimensions.cy+(p.getY(i)-controlDimensions.cy)*f),q(p.getZ(i)*f));}(part.normalGeometry||g).computeVertexNormals();const n=g.attributes.normal,rows=part.role==='body'&&!part.poseOpenMouth?part.closedSeams:part.seams;for(const row of rows){const v=V();for(const i of row)v.add(V().fromBufferAttribute(n,i));v.normalize();for(const i of row)n.setXYZ(i,v.x,v.y,v.z);}if(part.role==='purse-pad')for(let i=0;i<n.count;i++){const q=part.params[i],w=S(q.r,.65,1);if(w){const v=V().fromBufferAttribute(n,i).lerp(V(...q.normal),w).normalize();n.setXYZ(i,v.x,v.y,v.z);}}n.needsUpdate=true;g.attributes.position.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();}

// Inspect connectivity using decoded source positions. Never transform a
// normalized Int16 attribute in place: doing so would clamp decoded positions.
function sourceControls(gltf){
 const mesh=gltf.scene.getObjectByName('beluga-whale_0');if(!mesh?.isMesh)throw Error('Unexpected CC0 beluga control surface');gltf.scene.updateMatrixWorld(true);
 const p=mesh.geometry.attributes.position,ix=mesh.geometry.index.array,points=Array.from({length:p.count},(_,i)=>V(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(mesh.matrixWorld)),keys=new Map(),ids=[],parent=[];
 for(const v of points){const key=v.toArray().map(x=>Math.round(x*1e5)).join(':');if(!keys.has(key)){keys.set(key,parent.length);parent.push(parent.length);}ids.push(keys.get(key));}
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};for(let i=0;i<ix.length;i+=3){const a=find(ids[ix[i]]),b=find(ids[ix[i+1]]),c=find(ids[ix[i+2]]);parent[b]=a;parent[c]=a;}
 const groups=new Map();for(let i=0;i<points.length;i++){const key=find(ids[i]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(points[i]);}const core=[...groups.values()].sort((a,b)=>b.length-a.length)[0];if(core.length!==2509)throw Error('CC0 source topology differs from reviewed body');
 const zs=[...new Set(core.map(v=>v.z))].sort((a,b)=>b-a),length=zs[0]-zs.at(-1),u=zs.map(z=>(zs[0]-z)/length),rows=[];
 for(let i=0;i<u.length-1;i++)rows.push(u[i],(u[i]+u[i+1])/2);rows.push(1);return{u:rows,originalRings:zs.length,originalCoreVertices:core.length,decodedLength:length};
}
function splitMouth(src){
 const a=src.attributes,p=a.position,source=Array.from({length:p.count},(_,i)=>({id:String(i),p:V().fromBufferAttribute(p,i),uv:[a.uv.getX(i),a.uv.getY(i)]})),rows=[],ix=[],lookup=new Map(),cuts=new Map();
 const scalar=v=>v.p.y-mouthY(C(.5-v.p.x/controlDimensions.length,0,1),v.p.z);
 function add(poly,side){for(let j=1;j<poly.length-1;j++){const tri=[poly[0],poly[j],poly[j+1]];if(tri[1].p.clone().sub(tri[0].p).cross(tri[2].p.clone().sub(tri[0].p)).lengthSq()<1e-23)continue;for(const v of tri){const key=side+':'+v.id;if(!lookup.has(key)){lookup.set(key,rows.length);rows.push({...v,side});}ix.push(lookup.get(key));}}}
 for(let k=0;k<src.index.count;k+=3){const tri=Array.from(src.index.array.slice(k,k+3),i=>source[i]);for(const side of[-1,1]){const poly=[];for(let i=0;i<3;i++){const x=tri[i],y=tri[(i+1)%3],fx=scalar(x)*side,fy=scalar(y)*side;if(fx>=0)poly.push(x);if(fx*fy<0){const f=fx/(fx-fy),key='cut:'+ [x.id,y.id].sort().join(':');if(!cuts.has(key))cuts.set(key,{id:key,p:x.p.clone().lerp(y.p,f),uv:x.uv.map((v,j)=>L(v,y.uv[j],f))});poly.push(cuts.get(key));}}if(poly.length>2)add(poly,side);}}
 return{g:geometry(rows.flatMap(v=>v.p.toArray()),ix,rows.flatMap(v=>v.uv)),sides:rows.map(v=>v.side)};
}
function foil(kind,side=1){
 const p=[],uv=[],ix=[],ns=48,nc=64,{length,cy}=controlDimensions;
 for(let i=0;i<=ns;i++){const t=i/ns,tip=Math.sqrt(Math.max(0,1-t*t));let z,leading,trailing,y,thick;
  if(kind==='flipper'){
   z=side*(.315+.515*t);leading=length*(.5-.216)-.105*t-.240*t*t;
   trailing=leading-(.305+.126*Math.sin(Math.PI*t))*(1-t*t)**.62;
   y=cy-.185-.255*t+.047*t*t;thick=(.068*(1-t)**1.15+.006*tip)*tip;
  }else{
   z=side*.58*t;leading=-length*.5+.295-.235*t-.060*t*t;
   trailing=-length*.5-.095+.065*t+.065*t*t;
   const center=(leading+trailing)*.5,chord=(leading-trailing)*(1-t*t)**.52;
   leading=center+chord*.5;trailing=center-chord*.5;
   y=cy-.008+.018*Math.sin(Math.PI*t)-.025*t*t;thick=.032*(1-t)**.65*tip;
  }
  const chord=leading-trailing;
  for(let j=0;j<=nc;j++){
   const a=j/nc*TAU,c=(1-Math.cos(a))*.5;
   // Rounded leading edge, full anterior section, thin trailing edge and
   // a cambered tip. This is a solid foil rather than a flat ellipse.
   const x=leading-chord*c,section=(1-.70*c),yy=y+Math.sin(a)*thick*section+.014*Math.sin(Math.PI*t)*Math.sin(Math.PI*c);
   p.push(x,yy,z);uv.push(t,j/nc);
  }
 }
 for(let i=0;i<ns;i++)for(let j=0;j<nc;j++){const a=i*(nc+1)+j,b=a+nc+1;side>0?ix.push(a,a+1,b,b,a+1,b+1):ix.push(a,b,a+1,b,b+1,a+1);}return geometry(p,ix,uv);
}
function tube(points,radius=0.009,segments=120){return new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,radius,10,false);}
const files={exteriorNormal:new URL('./beluga-exterior-normal-v0660.png',import.meta.url).href,exteriorRoughness:new URL('./beluga-exterior-roughness-v0660.png',import.meta.url).href,occlusion:new URL('./beluga-occlusion-v0660.png',import.meta.url).href,exterior:new URL('./beluga-exterior-albedo-v0660.png',import.meta.url).href,skin:new URL('./beluga-skin-v0660.png',import.meta.url).href,normal:new URL('./beluga-normal-v0660.png',import.meta.url).href,roughness:new URL('./beluga-roughness-v0660.png',import.meta.url).href};
function skinMaps(m,mats){const pending=[],maps={};for(const[k,url]of Object.entries(files)){let texture;if(typeof document==='undefined')texture=new T.Texture();else pending.push(new Promise((resolve,reject)=>{texture=new T.TextureLoader().load(url,resolve,undefined,reject);}));texture.flipY=false;texture.wrapT=T.RepeatWrapping;texture.colorSpace=(k==='skin'||k==='exterior')?T.SRGBColorSpace:T.NoColorSpace;texture.userData={compatibilityResolution:2048,file:({exterior:'beluga-exterior-albedo-v0660.png',exteriorNormal:'beluga-exterior-normal-v0660.png',exteriorRoughness:'beluga-exterior-roughness-v0660.png',occlusion:'beluga-occlusion-v0660.png'})[k]||'beluga-'+k+'-v0660.png',author:'PhenoVoxel Archive',license:'MIT',scope:'Original generated ivory epidermis and model-projected original material paintings, with separate numerical normal/roughness; no user-photo pixels or calibrated tissue optics'};maps[k]=texture;}for(const mat of mats){mat.map=mat===mats[0]?maps.exterior:maps.skin;mat.normalMap=mat===mats[0]?maps.exteriorNormal:maps.normal;mat.normalScale.set(mat===mats[0]?.22:.12,mat===mats[0]?.22:.12);mat.roughnessMap=mat===mats[0]?maps.exteriorRoughness:maps.roughness;mat.roughness=mat===mats[0]?.83:.72;if(mat===mats[0]){mat.aoMap=maps.occlusion;mat.aoMapIntensity=.7;}mat.userData={compatibilityWetSkin:true,compatibilityBelugaOptics:true,compatibilitySurfaceDetail:true,compatibilityLinearTexture:true};mat.needsUpdate=true;}m.belugaSurface.textures=maps;m.textureReady=Promise.all(pending);}

export function prepareBeluga(gltf,s,asset){
 const root=new T.Group(),parts=[],controls=sourceControls(gltf),{cy,length}=controlDimensions;
 const skin=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.54,metalness:0,ior:1.38,clearcoat:.28,clearcoatRoughness:.24,specularIntensity:.85}),appendageSkin=skin.clone(),sealSkin=skin.clone(),lipMat=new T.MeshStandardMaterial({color:'#bfc1b6',roughness:.54,metalness:0}),oralMat=new T.MeshStandardMaterial({color:'#73524d',roughness:.59,side:T.DoubleSide,vertexColors:true}),gumMat=new T.MeshStandardMaterial({color:'#916b66',roughness:.58,side:T.DoubleSide,vertexColors:true});sealSkin.side=T.DoubleSide;
 const add=(g,mat,name,role='body',options={})=>{if(role==='body'){const a=g.attributes.position,c=[];for(let i=0;i<a.count;i++){const x=a.getX(i),u=C(.5-x/length,0,1),dye=.14*G(a.getY(i)-mouthY(u,a.getZ(i)),.008)*S(x,1.61,1.77)*(1-S(x,2.275,2.32));c.push(1-dye,1-dye,1-dye);}g.setAttribute('color',new T.Float32BufferAttribute(c,3));mat.vertexColors=true;}if(role==='eye'&&mat!==skin)mat.userData={compatibilityWetSkin:true,compatibilityBelugaOptics:true,compatibilitySurfaceDetail:true};const mesh=new T.Mesh(g,mat);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);const part={mesh,role,...options,controlNeutral:g.attributes.position.array.slice(),neutral:g.attributes.position.array.slice(),normal:g.attributes.normal.array.slice(),seams:seams(g,options.sides),closedSeams:seams(g)};parts.push(part);return part;};
 const exterior=splitMouth(implicitExterior());
 const body=add(exterior.g,skin,'Full-bodied adult beluga exterior','body',{sides:exterior.sides});
 for(const side of[-1,1]){add(foil('flipper',side),appendageSkin,'Broad rounded pectoral flipper '+side,'flipper',{side,pivot:V(length*(.5-.255),cy-.185,side*.315)});add(foil('fluke',side),appendageSkin,'Horizontal low-aspect-ratio fluke '+side,'fluke',{side});}
 const ridge=grid(100,14,(v,w)=>{const u=.46+.34*v,p=bodyPoint(u,0),z=(w*2-1)*(.025+.014*Math.sin(Math.PI*v));p.y+=.023*Math.sin(Math.PI*v)**.7*Math.sin(Math.PI*w)**2;p.z=z;return p;});add(ridge,appendageSkin,'Low tough dorsal ridge without a dorsal fin','ridge');
 for(const side of[-1,1]){
  const e=bodyPoint(.110,1.42*side),eyeGeo=new T.SphereGeometry(1,36,24);
  eyeGeo.scale(.013,.009,.006);eyeGeo.translate(e.x,e.y,e.z+side*.004);
  add(eyeGeo,new T.MeshPhysicalMaterial({color:'#29352f',roughness:.19,ior:1.38,clearcoat:.7}),'Small lateral eye '+side,'eye');
  const iris=new T.SphereGeometry(1,32,20);iris.scale(.008,.0067,.003);iris.translate(e.x+.001,e.y,e.z+side*.008);
  add(iris,new T.MeshPhysicalMaterial({color:'#333c37',roughness:.15,ior:1.38,clearcoat:1}),'Muted olive iris '+side,'eye');
  const pupil=new T.SphereGeometry(1,28,18);pupil.scale(.006,.0062,.0024);pupil.translate(e.x+.001,e.y,e.z+side*.0105);
  add(pupil,new T.MeshPhysicalMaterial({color:'#172125',roughness:.10,ior:1.38,clearcoat:1}),'Glossy pupil '+side,'eye');
  // Skin eyelids taper into the cheek, leaving an almond-shaped aperture.
  for(const half of[-1,1]){
   const lid=grid(56,12,(v,w)=>{const a=v*Math.PI,x=e.x+.024*Math.cos(a),arc=Math.sin(a),y=e.y+half*(.0075+.016*w)*arc;let lo=0,hi=.45;for(let j=0;j<22;j++){const z=(lo+hi)*.5;if(surfaceDistance(x,y,z)<0)lo=z;else hi=z;}return V(x,y,side*(lo+.002*Math.sin(Math.PI*w)*arc));});
   {const p=lid.attributes.position,uv=lid.attributes.uv;for(let i=0;i<p.count;i++){const q=headTextureUV(V().fromBufferAttribute(p,i),side);uv.setXY(i,q[0],q[1]);}}
   add(lid,skin,'Tapered '+(half>0?'upper':'lower')+' eyelid '+side,'eye');
  }
 }
 const blow=bodyPoint(.178,0),slit=[];for(let j=0;j<=40;j++){const a=j/40*Math.PI;slit.push(V(blow.x+.024*Math.cos(a),blow.y+.001, .012*Math.sin(a)));}add(tube(slit,.003,60),new T.MeshStandardMaterial({color:'#575f5c',roughness:.64}),'Single closed blowhole slit','blowhole');
 const crease=null; // The commissure is sculpted into the continuous skin.

 // Cut the feeding orifice along shared triangle-edge intersections. The
 // lip mound and the retained exterior use precisely the same boundary;
 // an overlapping ellipse leaves cracks when viewed obliquely.
 const bp=body.mesh.geometry.attributes.position,bu=body.mesh.geometry.attributes.uv,bn=body.mesh.geometry.attributes.normal,cutRows=Array.from({length:bp.count},(_,i)=>({p:V().fromBufferAttribute(bp,i),uv:[bu.getX(i),bu.getY(i)],normal:V().fromBufferAttribute(bn,i),side:exterior.sides[i]})),cutIndex=[],boundary=new Map(),edgeCache=new Map();
 const cutField=p=>((p.x-(length*.5+.045))/.35)**2+((p.y-(cy-.115))/.14)**2+(p.z/.27)**2-1;
 function intersection(i,j){const key=[i,j].sort((a,b)=>a-b).join(':');if(edgeCache.has(key))return edgeCache.get(key);const a=cutRows[i],b=cutRows[j],f=cutField(a.p)/(cutField(a.p)-cutField(b.p)),row={p:a.p.clone().lerp(b.p,f),uv:a.uv.map((v,k)=>L(v,b.uv[k],f)),normal:a.normal.clone().lerp(b.normal,f).normalize(),side:a.side};const id=cutRows.length;cutRows.push(row);edgeCache.set(key,id);boundary.set(row.p.toArray().map(v=>Math.round(v*1e7)).join(':'),row);return id;}
 for(let k=0;k<body.mesh.geometry.index.count;k+=3){const tri=Array.from(body.mesh.geometry.index.array.slice(k,k+3));if(Math.max(...tri.map(i=>cutRows[i].p.x))<length*.5-.72){cutIndex.push(...tri);continue;}const poly=[];for(let j=0;j<3;j++){const i=tri[j],n=tri[(j+1)%3],fa=cutField(cutRows[i].p),fb=cutField(cutRows[n].p);if(fa>=0)poly.push(i);if(fa*fb<0)poly.push(intersection(i,n));}for(let j=1;j<poly.length-1;j++)cutIndex.push(poly[0],poly[j],poly[j+1]);}
 const shell=add(geometry(cutRows.flatMap(v=>v.p.toArray()),cutIndex,cutRows.flatMap(v=>v.uv)),skin,'Laterally sealed feeding exterior','body',{sides:cutRows.map(v=>v.side),feedingExterior:true});body.feedingCover=true;
 const perimeter=[...boundary.values()].map(v=>({...v,a:(Math.atan2(v.p.z/.27,(v.p.y-(cy-.115))/.14)+TAU)%TAU})).sort((a,b)=>a.a-b.a),padParams=[],count=perimeter.length;
 if(count<40||perimeter.some((v,i)=>v.p.distanceTo(perimeter[(i+1)%count].p)>.05))throw Error('Feeding aperture has no continuous inspected exterior boundary');
 const pad=grid(22,count,(r,v)=>{const edge=perimeter[Math.round(v*count)%count],a=edge.a;padParams.push({r,a,outer:edge.p.toArray(),normal:edge.normal.toArray()});return V(length*.5+.025,cy-.115,0).lerp(edge.p,r);});
 const lipMound=add(pad,sealSkin,'Soft anterior pursed lip mound','purse-pad',{oral:true,params:padParams});lipMound.seams=Array.from({length:23},(_,r)=>[r*(count+1),r*(count+1)+count]);
 const tunnelParams=[],tunnel=grid(12,64,(u,v)=>{const a=v*TAU;tunnelParams.push({u,a});return V(length*.5-.18*u,cy-.145+.038*Math.cos(a),.036*Math.sin(a));});add(tunnel,new T.MeshStandardMaterial({color:'#574848',roughness:.82,side:T.DoubleSide}),'Selected short oral aperture lining','aperture',{oral:true,params:tunnelParams});
 const pharynxParams=[],pharynx=grid(12,64,(r,v)=>{const a=v*TAU;pharynxParams.push({u:1,a,capRadius:r});return V(length*.5-.18-.030*(1-r*r),cy-.145+.052*r*Math.cos(a),.050*r*Math.sin(a));});add(pharynx,new T.MeshStandardMaterial({color:'#34282b',roughness:.90,side:T.DoubleSide}),'Selected opaque posterior oral lining','aperture',{oral:true,params:pharynxParams});
 const at=(u,v)=>oralEdge(.003+.154*u,-1).lerp(oralEdge(.003+.154*u,1),v);
 function oralTone(g,tongue=false){const uv=g.attributes.uv,c=[];for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i),fold=.025*Math.sin(u*73+Math.sin(v*17))+.016*Math.sin(v*91+u*13),depth=tongue?.72+.18*Math.sin(Math.PI*u):.80-.50*S(u,.42,1),margin=1-.16*(Math.abs(v-.5)*2)**3;c.push((depth+fold)*margin,(depth+fold*.65)*margin*.93,(depth+fold*.50)*margin*.90);}g.setAttribute('color',new T.Float32BufferAttribute(c,3));return g;}
 for(const half of[-1,1]){
  const g=grid(80,40,(u,v)=>{const p=at(u,v),bowl=Math.sin(Math.PI*u)**.6*Math.sin(Math.PI*v)**.7;p.y+=half*.055*bowl;return p;});
  add(oralTone(g),oralMat,half>0?'Inner palate':'Lower oral floor',half>0?'upper':'lower',{oral:true});
 }
 const tongue=grid(80,40,(u,v)=>{
  const p=at(.09+.78*u,.19+.62*v),dome=Math.sin(Math.PI*u)**.65*Math.sin(Math.PI*v)**.55;
  p.y-=.046-.031*dome;p.y-=.0025*G(v-.5,.042)*S(u,.12,.33)*(1-S(u,.73,.91));
  p.y+=.00055*Math.sin(u*103+Math.sin(v*35))*dome;return p;
 });add(oralTone(tongue,true),gumMat,'Broad mobile tongue surface','tongue',{oral:true});
 for(const side of[-1,1])for(const half of[-1,1]){
  const gum=[];for(let j=0;j<=50;j++){const p=oralEdge(.025+.12*j/50,side);p.z*=.83;p.y+=half*.009;gum.push(p);}add(tube(gum,.013,100),gumMat,'Gingival margin '+half+' '+side,half>0?'upper':'lower',{oral:true});
  for(let j=0;j<9;j++){const u=.035+.107*j/8,p=oralEdge(u,side);p.z*=.83;p.y+=half*.012;const h=.021*(.76+.24*Math.sin(Math.PI*j/8)),g=new T.SphereGeometry(1,16,12);g.scale(.0075,h*.58,.0075);g.translate(p.x,p.y-half*h*.42,p.z);add(g,new T.MeshStandardMaterial({color:'#c8c6ab',roughness:.65}),'Selected worn peg tooth '+half+' '+side+' '+j,half>0?'upper':'lower',{oral:true,tooth:true});}
 }
 for(const part of parts){finish(part);part.neutral=part.mesh.geometry.attributes.position.array.slice();part.normal=part.mesh.geometry.attributes.normal.array.slice();}
 const m={id:s.id,root,gltf,asset,kind:'cetacean',forward:1,natural:true,textured:true,surfaceDetailed:true,parts:{},features:[],current:'observe',bones:[],limbs:[],clipMap:{}};
 m.belugaSurface={parts,body,crease,controls,length:belugaDimensions.length,controlLength:length,cy,poseKey:null,evidence:belugaEvidence};skinMaps(m,[skin,appendageSkin,sealSkin]);
 const targets=[bodyPoint(.08,1.2),V(-length*.46,cy,.40),bodyPoint(.60,0),bodyPoint(.215,1.9),oralEdge(.055,1),bodyPoint(.110,1.42)];
 for(const target of targets)displayPoint(target);
 m.featureBindings=targets.map((target,j)=>{const candidates=j===1?parts.filter(p=>p.role==='fluke'):j===2?parts.filter(p=>p.role==='ridge'):[body];let best=null,dist=Infinity;for(const p of candidates){const a=p.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const d=V().fromBufferAttribute(a,i).distanceToSquared(target);if(d<dist){dist=d;best={mesh:p.mesh,indices:[i],kind:'Selected exterior region; not a measured anatomical landmark'};}}}return best;});m.features=targets.map(()=>V());
 Object.assign(root.userData,{aquaticStudy:true,compatibilityBelugaShadows:true,focusAnatomy:true,anatomyFocusScale:[.49,.55,.54,.48,.40,.25],anatomyViewDirections:[[.6,.08,1],[0,.85,1],[0,.35,1],[.5,-.08,1],[1,-.10,.4],[.2,.05,1]],belugaSource:'Original 3D Assets CC0 reference, contributor-reported AI origin, retained separately and unchanged. Active implicit exterior, appendages, facial and oral surfaces, skin and finite studies are independently authored approximations. No living scan or fitted individual.'});
 m.motionBounds={swim:new T.Box3(V(belugaLongitudinalX(-length*.5-.35),.40,-1.02),V(belugaLongitudinalX(length*.5+.15),2.60,1.02)),glide:new T.Box3(V(belugaLongitudinalX(-length*.5-.35),.40,-1.02),V(belugaLongitudinalX(length*.5+.15),2.60,1.02))};animateBeluga(m,'observe',0);return m;
}
export function belugaFeedingPhase(t){
 const time=C(t,0,8),q=time/8,open=S(q,.18,.43)*(1-S(q,.50,.70)),purse=S(q,.10,.29)*(1-S(q,.60,.82)),gular=S(q,.31,.56)*(1-S(q,.66,.86));
 return{time,q,gape:time===0||time===8?0:open,purse:time===0||time===8?0:purse,gular:time===0||time===8?0:gular,stage:q<.10?'Closed-mouth approach':q<.29?'Lips purse and lateral gape closes':q<.43?'Anterior aperture opens':q<.56?'Gular depression at the anterior aperture':q<.70?'Jaw closure':q<.86?'Lip and throat recovery':q<1?'Neutral recovery':'Study complete',scope:'Eight illustrative seconds, selected slow playback; not a measured trial clock or simulated suction.'};
}
export function belugaLine(action,t){
 const {length}=controlDimensions,clock=C(t,0,12),env=clock<=0||clock>=12?0:S(clock,0,1)*(1-S(clock,10.5,12)),stroke=action==='glide'?1-S(clock,4.3,5.3):1,phase=TAU*belugaEvidence.frequencyHz*clock,A=belugaEvidence.heaveM/belugaEvidence.referenceLengthM*belugaDimensions.length*env*stroke,n=192,line=[];let x=length*.5;
 const y=u=>['swim','glide'].includes(action)?A*S(u,.40,.96)**2*Math.sin(phase-2.1*(1-u)):0;
 for(let i=0;i<=n;i++){const u=i/n,du=.0001,dy=(y(C(u+du,0,1))-y(C(u-du,0,1)))/(Math.min(1,u+du)-Math.max(0,u-du)),a=-Math.asin(C(dy/length,-.85,.85));if(i)x-=length/n*Math.cos(a);line.push({x,y:y(u),a});}return{line,clock,env,stroke,phase};
}
function oralPoint(p,role,st,wide=false){
 const {length,cy}=controlDimensions,u=C(.5-p.x/length,0,1),out=p.clone(),lower=role==='lower'||role==='tongue',weight=1-S(u,.13,.19),aperture=wide?1:1-S(u,.020,.050),angle=-(wide?.34:.14)*st.gape*weight*aperture,hx=length*(.5-.155),hy=mouthY(.155);
 if(lower){const dx=p.x-hx,dy=p.y-hy;out.x=hx+dx*Math.cos(angle)-dy*Math.sin(angle);out.y=hy+dx*Math.sin(angle)+dy*Math.cos(angle);}
 const throat=lower?S(u,.09,.16)*(1-S(u,.25,.32))*S(cy-p.y,.10,.25)*S(mouthY(u)-p.y,.035,.10):0;out.y-=.030*st.gular*throat;if(role==='tongue'){out.x-=.020*st.gular;out.y-=.018*st.gular;}return out;
}
export function animateBeluga(m,action,t){
 const f=m.belugaSurface;if(!f)return false;const {cy,length}=controlDimensions,feeding=action==='forage'||action==='mouth',limit=feeding?8:12,clock=C(t,0,limit),key=action==='observe'?'observe':action+':'+clock;if(f.poseKey===key)return true;
 const st=belugaFeedingPhase(clock),wide=action==='mouth',lineState=belugaLine(action,clock),{line,env,stroke,phase}=lineState,n=line.length-1,wave=['swim','glide'].includes(action),neutral=action==='observe'||clock===0||clock===limit;
 const mapLine=(p,u)=>{const uu=C(u,0,1),at=uu*n,j=Math.min(n-1,Math.floor(at)),w=at-j,a=L(line[j].a,line[j+1].a,w),dy=p.y-cy,dx=p.x-length*(.5-uu);return{v:V(L(line[j].x,line[j+1].x,w)+dx*Math.cos(a)-dy*Math.sin(a),cy+L(line[j].y,line[j+1].y,w)+dx*Math.sin(a)+dy*Math.cos(a),p.z),a};};
 const flukePivot=mapLine(V(length*(.5-.945),cy,0),.945),alpha=belugaEvidence.pitchDegrees*Math.PI/180*env*stroke*Math.cos(phase),headAngle=action==='head'?.32*Math.sin(TAU*clock/12)*Math.sin(Math.PI*clock/12)**2:0;
 for(const part of f.parts){const g=part.mesh.geometry,p=g.attributes.position,base=part.controlNeutral;part.poseOpenMouth=wide&&st.gape>.005;
  part.mesh.visible=part.feedingCover?!(action==='forage'&&st.purse>.02):part.feedingExterior?action==='forage'&&st.purse>.02:part.role==='purse-pad'?action==='forage'&&st.purse>.02:part.role==='aperture'?action==='forage'&&st.gape>.005:part.oral?wide&&st.gape>.005:part.mesh.name.includes('integrated fleshy lip')?action!=='forage'||st.purse<.02:part.role==='crease'?!feeding||st.gape<.005:true;
  if(neutral||!part.mesh.visible){p.array.set(part.neutral);g.attributes.normal.array.set(part.normal);p.needsUpdate=true;g.attributes.normal.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();continue;}
  for(let i=0;i<p.count;i++){
   let v=V(base[i*3],base[i*3+1],base[i*3+2]),u=C(.5-v.x/length,0,1);
   if(feeding){if(part.role==='aperture'){const {u,a,capRadius}=part.params[i],r=capRadius??1,ry=L(.0375,.052,u)*st.gape*r,rz=L(.0355,.050,u)*st.gape*r;v.set(length*.5+.025*st.purse-.18*u-(capRadius===undefined?0:.030*(1-r*r)),cy-.115-.030*st.gape+ry*Math.cos(a),rz*Math.sin(a));}
    else if(part.role==='purse-pad'){const {r,a,outer}=part.params[i],edge=V(...outer),side=edge.y<mouthY(C(.5-edge.x/length,0,1))?'lower':'upper',attached=oralPoint(edge,side,{...st,gape:0}),inner=V(length*.5+.025*st.purse,cy-.115-.030*st.gape+.038*st.gape*Math.cos(a),.036*st.gape*Math.sin(a));v=inner.lerp(attached,r);v.x+=.045*Math.sin(Math.PI*r)*st.purse;}
    else{const role=part.role==='body'?(part.sides[i]<0?'lower':'upper'):part.role;v=oralPoint(v,role,action==='forage'&&part.role==='body'?{...st,gape:0}:st,wide);}}
   if(action==='melon'){const e=Math.sin(TAU*clock/12)*Math.sin(Math.PI*clock/12)**2,mask=G(u-.066,.062)*S(v.y,cy+.06,cy+.23);v.x+=.075*e*mask;v.y-=.030*e*mask;}
   if(headAngle&&u<.31){const a=headAngle*(1-S(u,.17,.31)),pivot=length*(.5-.245),dx=v.x-pivot;v.set(pivot+dx*Math.cos(a)+v.z*Math.sin(a),v.y,v.z*Math.cos(a)-dx*Math.sin(a));}
   if(wave){if(part.role==='flipper'){const side=part.side,pivot=part.pivot,w=C(Math.abs(v.z-pivot.z)/controlDimensions.flipperSpan,0,1),a=.065*env*stroke*Math.sin(phase+.65)*w,dy=v.y-pivot.y,dz=v.z-pivot.z;v.y=pivot.y+dy*Math.cos(a)-dz*Math.sin(a)*side;v.z=pivot.z+dz*Math.cos(a)+dy*Math.sin(a)*side;}
    const q=mapLine(v,u);v=q.v;if(part.role==='fluke'){const a=alpha-flukePivot.a,dx=v.x-flukePivot.v.x,dy=v.y-flukePivot.v.y;v.x=flukePivot.v.x+dx*Math.cos(a)-dy*Math.sin(a);v.y=flukePivot.v.y+dx*Math.sin(a)+dy*Math.cos(a);}
   }
   p.setXYZ(i,v.x,v.y,v.z);
  }finish(part);
 }
 const turn=action==='turn'?.30*Math.sin(Math.PI*clock/12)**2:0,roll=action==='roll'?Math.PI*.5*Math.sin(Math.PI*clock/12)**2:0;m.root.rotation.set(roll,turn,0,'ZXY');const center=V(0,cy,0);m.root.position.copy(center.clone().sub(center.applyEuler(m.root.rotation)));m.root.scale.setScalar(1);m.root.updateMatrixWorld(true);
 f.current=feeding?{...st,stage:wide?(st.gape>.95?'Open mouth · selected teeth and tongue':st.gape>0?'Jaw opening / closure':clock===8?'Study complete':'Closed mouth'):st.stage}:null;f.poseKey=key;updateSpecimenLandmarks(m);return true;
}
