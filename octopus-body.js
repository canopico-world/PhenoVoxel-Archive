import * as T from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {V,noise} from './mollusca-surfaces.js';
import {armFrame} from './octopus-arms.js';
const union=(a,b,k=.09)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
const coreScope={scope:'Selected continuous external mantle wall/head/crown field with eye bulges, open illustrative neck cavity and funnel route; no measured specimen, internal organs, muscles or flow solver',measured:false};
let coreTemplate=null,corePending=null;
export function decodeOctopusCore(buffer){
 const header=new DataView(buffer);if(header.byteLength<16||header.getUint32(0,true)!==0x434f5650||header.getUint32(4,true)!==636)throw Error('Unsupported octopus core');
 const vertices=header.getUint32(8,true),indices=header.getUint32(12,true),expected=16+vertices*20+indices*4;if(vertices<100||vertices>500000||indices>3000000||expected!==buffer.byteLength)throw Error('Malformed octopus core');
 const positions=new Float32Array(buffer,16,vertices*3),uv=new Float32Array(buffer,16+vertices*12,vertices*2),faces=new Uint32Array(buffer,16+vertices*20,indices);if(!positions.every(Number.isFinite)||!uv.every(Number.isFinite)||faces.some(i=>i>=vertices))throw Error('Invalid octopus geometry');
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions.slice(),3));g.setAttribute('uv',new T.BufferAttribute(uv.slice(),2));g.setIndex(new T.BufferAttribute(faces.slice(),1));g.computeVertexNormals();g.userData={...coreScope};return g;
}
export async function preloadOctopusBody(){
 if(coreTemplate)return true;if(corePending)return corePending;
 corePending=(async()=>{try{const response=await fetch(new URL('./octopus-core-v0636.bin',import.meta.url),{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Core download failed');coreTemplate=decodeOctopusCore(await response.arrayBuffer());return true;}catch{return false;}finally{corePending=null;}})();return corePending;
}
export function octopusBodyGeometry(curves){if(!coreTemplate)coreTemplate=generateOctopusBodyGeometry(curves);return coreTemplate.clone();}
const ell=(x,y,z,c,r)=>(Math.hypot((x-c[0])/r[0],(y-c[1])/r[1],(z-c[2])/r[2])-1)*Math.min(...r);
const capsule=(x,y,z,a,b,r)=>{const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],q=T.MathUtils.clamp(((x-a[0])*dx+(y-a[1])*dy+(z-a[2])*dz)/(dx*dx+dy*dy+dz*dz),0,1);return Math.hypot(x-a[0]-q*dx,y-a[1]-q*dy,z-a[2]-q*dz)-r;};
export function generateOctopusBodyGeometry(curves){
 const N=96,min=V(-1.30,-.10,-1.12),size=V(3.20,1.30,2.24),mc=new MarchingCubes(N,new T.MeshStandardMaterial(),false,false,260000);mc.isolation=0;
 const stubs=curves.flatMap(c=>[.04,.11,.18].map((u,j)=>{const a=armFrame(c,j?u-.07:0),b=armFrame(c,u);return{a:a.p.toArray(),b:b.p.toArray(),r:(a.radius+b.radius)*.49};}));
 const channelCurve=new T.CatmullRomCurve3([V(-.29,.38,-.16),V(-.15,.37,-.34),V(.08,.40,-.64)]),channel=Array.from({length:24},(_,j)=>{const u=j/23,p=channelCurve.getPoint(u);return{p:p.toArray(),r:.106-.036*u};});
 for(let iz=0;iz<N;iz++)for(let iy=0;iy<N;iy++)for(let ix=0;ix<N;ix++){
  const x=min.x+ix/N*size.x,y=min.y+iy/N*size.y,z=min.z+iz/N*size.z;
  const outer=ell(x,y,z,[-.65,.47,0],[.56,.33,.40]),inner=ell(x,y,z,[-.65,.47,0],[.505,.276,.344]);
  let field=Math.max(outer,-inner,x+.08),head=ell(x,y,z,[.26,.42,0],[.41,.29,.30]);
  // An authored mantle-wall opening and soft dorsal union replace intersecting loft seams.
  field=union(field,capsule(x,y,z,[-.24,.61,0],[.12,.57,0],.16),.08);field=union(field,head,.065);
  field=union(field,ell(x,y,z,[.70,.27,0],[.36,.17,.39]),.10);
  for(const side of [-1,1]){field=union(field,ell(x,y,z,[.15,.55,side*.29],[.125,.09,.10]),.045);field=union(field,capsule(x,y,z,[.08,.615,side*.32],[.23,.60,side*.335],.022),.030);}
  for(const s of stubs)field=union(field,capsule(x,y/.66,z,[s.a[0],s.a[1]/.66,s.a[2]],[s.b[0],s.b[1]/.66,s.b[2]],s.r)*.66,.045);
  // Preserve an open route into the selected mantle cavity instead of a false internal plug.
  let clear=Infinity;for(const c of channel)clear=Math.min(clear,Math.hypot(x-c.p[0],y-c.p[1],z-c.p[2])-c.r);
  field=Math.max(field,-clear);mc.field[ix+iy*N+iz*N*N]=-field;
 }
 mc.update();if(mc.count>=260000*3)throw Error('Octopus body surface buffer exhausted');
 const raw=new T.BufferGeometry(),values=mc.geometry.attributes.position.array.slice(0,mc.count*3);raw.setAttribute('position',new T.BufferAttribute(values,3));const p=raw.attributes.position;
 for(let i=0;i<p.count;i++)p.setXYZ(i,min.x+(p.getX(i)+1)*.5*size.x,min.y+(p.getY(i)+1)*.5*size.y,min.z+(p.getZ(i)+1)*.5*size.z);
 const welded=mergeVertices(raw,1e-6),pos=welded.attributes.position,idx=welded.index.array,positions=[],indices=[],used=new Map();
 for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];if(a===b||b===c||a===c)continue;for(const old of[a,b,c]){if(!used.has(old)){used.set(old,used.size);positions.push(pos.getX(old),pos.getY(old),pos.getZ(old));}indices.push(used.get(old));}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);const q=g.attributes.position,neighbors=Array.from({length:q.count},()=>new Set());for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){const a=indices[i+j],b=indices[i+(j+1)%3];neighbors[a].add(b);neighbors[b].add(a);}for(let pass=0;pass<2;pass++){const old=q.array.slice();for(let i=0;i<q.count;i++){let x=0,y=0,z=0;for(const j of neighbors[i]){x+=old[j*3];y+=old[j*3+1];z+=old[j*3+2];}const n=neighbors[i].size;if(n)q.setXYZ(i,old[i*3]*.75+x/n*.25,old[i*3+1]*.75+y/n*.25,old[i*3+2]*.75+z/n*.25);}}g.computeVertexNormals();const n=g.attributes.normal;
 for(let i=0;i<q.count;i++){
  const x=q.getX(i),y=q.getY(i),z=q.getZ(i),exposed=T.MathUtils.smoothstep(n.getY(i),-.1,.7),large=noise(x*21+13,y*21,z*21),small=noise(x*63,y*63+7,z*63),height=exposed*(.0038*Math.max(0,(large-.42)/.58)**2+.0007*small);
  q.setXYZ(i,x+n.getX(i)*height,y+n.getY(i)*height,z+n.getZ(i)*height);
 }
 g.computeVertexNormals();const uv=[];for(let i=0;i<q.count;i++)uv.push(q.getX(i)*.72,(Math.atan2(q.getZ(i),q.getY(i)-.2)/Math.PI+1)*.5);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.userData={...coreScope};raw.dispose();welded.dispose();mc.geometry.dispose();mc.material.dispose();return g;
}
export function attachOctopusBody(k,r,skin){
 r.body=k.mesh(octopusBodyGeometry(r.curves),'#8b7050');r.body.name='Continuous mantle-wall head and brachial-crown exterior';skin(r.body);r.bodyBase=r.body.geometry.attributes.position.array.slice();r.bodyBindings=[];
 const bases=r.curves.flatMap((curve,i)=>[.08,.12,.16,.20,.24].map(u=>({i,u,p:armFrame(curve,u).p}))),p=r.body.geometry.attributes.position;for(let j=0;j<p.count;j++){
  const point=V(p.getX(j),p.getY(j),p.getZ(j));let best=null,d=Infinity;
  for(const {i,u,p} of bases){const q=point.distanceTo(p);if(q<d){d=q;best={i,u};}}
  r.bodyBindings.push(d<.28&&point.y<.40&&Math.hypot(point.x-.58,point.z)>.34?{...best,weight:T.MathUtils.smoothstep(Math.hypot(point.x-.58,point.z),.34,.82)}:null);
 }
 r.bodyRestCurves=r.curves;
 for(const side of [-1,1]){
  const iris=k.ell([.15,.56,side*.394],[.057,.027,.008],'#9d8d66',k.root,{roughness:.32});iris.name='Small flattened eye aperture';
  const pupil=k.ell([.15,.56,side*.404],[.044,.0055,.0025],'#151811',k.root,{roughness:.20});pupil.name='Horizontal slit pupil';
 }
}
export function putBody(r,curves){
 const deltas=curves.map((c,i)=>Object.fromEntries([.08,.12,.16,.20,.24].map(u=>[u,armFrame(c,u).p.sub(armFrame(r.bodyRestCurves[i],u).p)]))),p=r.body.geometry.attributes.position;for(let j=0;j<p.count;j++){const b=r.bodyBindings[j],x=r.bodyBase[j*3],y=r.bodyBase[j*3+1],z=r.bodyBase[j*3+2];if(!b){p.setXYZ(j,x,y,z);continue;}const d=deltas[b.i][b.u];p.setXYZ(j,x+d.x*b.weight,y+d.y*b.weight,z+d.z*b.weight);}p.needsUpdate=true;r.body.geometry.computeVertexNormals();r.body.geometry.computeBoundingBox();r.body.geometry.computeBoundingSphere();
}
