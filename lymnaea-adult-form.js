import * as T from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {noise, mix, microRelief} from './mollusca-surfaces.js';

const TAU=Math.PI*2,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),tilt=1.08;
export const lymnaeaFormScope=Object.freeze({selectedTurns:6,axisTilt:tilt,measured:false,independentlyValidated:false,scope:'Selected adult external form, not a specimen fit, development or physiological locomotion'});

// Distinct rounded whorls and an inflated final whorl replace the old envelope.
// Parameters are authored choices, not morphometric estimates or a shell scan.
export function lymnaeaShellPoint(u,v,inner=false){
 const theta=-Math.PI/2+(u-1)*6*TAU,g=Math.exp((theta+Math.PI/2)*.085),a=v*TAU;
 const wrinkle=.0008*Math.sin(u*2200+noise(v*13,u*71)*3)*g;
 const rh=(.38+wrinkle-(inner?.008:0))*g,rv=(.80+wrinkle-(inner?.008:0))*g;
 return V((.36*g+rh*Math.cos(a))*Math.cos(theta),.82+2.02*(1-g)+rv*Math.sin(a),(.36*g+rh*Math.cos(a))*Math.sin(theta))
  .applyAxisAngle(V(0,0,1),tilt).add(V(.30,.265,.36));
}

function shellGeometry(){
 const N=780,M=80,positions=[],uv=[],indices=[];
 for(let i=0;i<=N;i++)for(let j=0;j<M;j++){positions.push(...lymnaeaShellPoint(i/N,j/M).toArray());uv.push(i/N,j/M);}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M;indices.push(a,a+M,b,b,a+M,b+M);}
 const apex=V();for(let j=0;j<M;j++)apex.add(lymnaeaShellPoint(0,j/M));apex.multiplyScalar(1/M);const cap=positions.length/3;positions.push(...apex.toArray());uv.push(0,.5);for(let j=0;j<M;j++)indices.push(cap,(j+1)%M,j);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

const ell=(x,y,z,c,r)=>(Math.hypot((x-c[0])/r[0],(y-c[1])/r[1],(z-c[2])/r[2])-1)*Math.min(...r);
const union=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
let bodyTemplate;
export function lymnaeaBodyGeometry(){
 if(bodyTemplate)return bodyTemplate.clone();
 const N=76,min=V(-1.42,-.09,-.58),size=V(2.94,1.43,1.16),material=new T.MeshStandardMaterial(),mc=new MarchingCubes(N,material,false,false,140000);mc.isolation=0;
 for(let z=0;z<N;z++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const px=min.x+x/N*size.x,py=min.y+y/N*size.y,pz=min.z+z/N*size.z;
  let f=Math.max(ell(px,py,pz,[-.02,.10,0],[1.32,.115,.36]),.026-py);
  f=union(f,ell(px,py,pz,[-.25,.34,0],[.46,.32,.35]),.11);
  const qx=px+.42,qy=py-.56,up=-Math.sin(tilt)*qx+Math.cos(tilt)*qy,forward=Math.cos(tilt)*qx+Math.sin(tilt)*qy;
  f=union(f,(Math.hypot(up/.60,forward/.19,pz/.34)-1)*.19,.075);
  f=union(f,ell(px,py,pz,[.60,.285,0],[.61,.225,.27]),.12);
  f=union(f,ell(px,py,pz,[1.02,.22,0],[.27,.16,.275]),.07);
  for(const side of[-1,1])f=union(f,ell(px,py,pz,[1.20,.16,side*.12],[.15,.09,.12]),.04);
  mc.field[x+y*N+z*N*N]=-f;
 }
 mc.update();if(mc.count>=140000*3)throw Error('Lymnaea body buffer too small');
 const geometry=new T.BufferGeometry(),src=mc.geometry.attributes.position;geometry.setAttribute('position',new T.BufferAttribute(src.array.slice(0,mc.count*3),3));const p=geometry.attributes.position;
 for(let i=0;i<p.count;i++)p.setXYZ(i,min.x+(p.getX(i)+1)*.5*size.x,min.y+(p.getY(i)+1)*.5*size.y,min.z+(p.getZ(i)+1)*.5*size.z);
 const welded=mergeVertices(geometry,1e-5),wp=welded.attributes.position,wi=welded.index.array,positions=[],indices=[],used=new Map();
 for(let i=0;i<wi.length;i+=3){const a=wi[i],b=wi[i+1],c=wi[i+2];if(a===b||b===c||c===a)continue;for(const old of[a,b,c]){if(!used.has(old)){used.set(old,used.size);positions.push(wp.getX(old),wp.getY(old),wp.getZ(old));}indices.push(used.get(old));}}
 bodyTemplate=new T.BufferGeometry();bodyTemplate.setAttribute('position',new T.Float32BufferAttribute(positions,3));bodyTemplate.setIndex(indices);bodyTemplate.computeVertexNormals();geometry.dispose();welded.dispose();mc.geometry.dispose();material.dispose();return bodyTemplate.clone();
}

function skin(mesh){
 const p=mesh.geometry.attributes.position,colors=[],uv=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=noise(x*6+11,y*6,z*6),fleck=noise(x*35,y*35,z*35),c=mix('#554e3d','#aca58c',.24+.32*n+.08*fleck);colors.push(c.r,c.g,c.b);uv.push(x*.7,z*.7+y*.2);}
 mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));mesh.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));mesh.material=mesh.material.clone();mesh.material.vertexColors=true;mesh.material.color.set('white');microRelief(mesh,637,.002,.55);
 mesh.geometry.setAttribute('lymnaeaRest',p.clone());
 mesh.material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec3 lymnaeaRest;varying vec3 vLymnaeaRest;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLymnaeaRest=lymnaeaRest;');
  shader.fragmentShader=`varying vec3 vLymnaeaRest;
float lymnaeaHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float lymnaeaFreckle(vec3 p){vec3 cell=floor(p),f=fract(p),center=.18+.64*vec3(lymnaeaHash(cell),lymnaeaHash(cell+19.),lymnaeaHash(cell+37.));return(1.-smoothstep(.09,.18,length(f-center)))*step(.72,lymnaeaHash(cell+51.));}
`+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat freckles=lymnaeaFreckle(vLymnaeaRest*38.);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.45,.43,.35),freckles*.42);');
 };
 mesh.material.customProgramCacheKey=()=> 'lymnaea-original-bind-space-speckle-v0637';
}

function shellColour(mesh){
 const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,colors=[];
 for(let i=0;i<p.count;i++){const u=uv.getX(i),v=uv.getY(i),patch=noise(u*11+9,v*9),line=.5+.5*Math.sin(u*2200+noise(v*14,u*17)*3),grain=noise(u*301,v*117),c=mix('#423d2e','#a29366',.22+.40*patch+.04*line+.11*grain);colors.push(c.r,c.g,c.b);}
 mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));mesh.material=new T.MeshPhysicalMaterial({color:'white',vertexColors:true,roughness:.52,clearcoat:.07,clearcoatRoughness:.46,side:T.DoubleSide});microRelief(mesh,637,.0006,.52);
}

function tentacleGeometry(tip,lateral){
 const N=64,M=28,positions=[],fractions=[],indices=[];
 for(let i=0;i<=N;i++)for(let j=0;j<M;j++){const u=i/N,a=j/M*TAU,w=.115*Math.pow(1-u,.82)+.001,h=.024*Math.pow(1-u,.75)+.001,camber=.025*Math.sin(Math.PI*u)*Math.cos(a)**2;positions.push(...tip.clone().multiplyScalar(u).addScaledVector(lateral,Math.cos(a)*w).add(V(0,Math.sin(a)*h+camber,0)).toArray());fractions.push(u);}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M;indices.push(a,a+M,b,b,a+M,b+M);}
 for(const i of[0,N]){const cap=positions.length/3;positions.push(...tip.clone().multiplyScalar(i/N).toArray());fractions.push(i/N);for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M;indices.push(...(i?[cap,a,b]:[cap,b,a]));}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions.map(n=>n===0?0:n),3));geometry.setIndex(indices);geometry.computeVertexNormals();return{geometry,fractions:new Float32Array(fractions)};
}

export function buildLymnaeaForm(k,r){
 r.appendages=[];r.shell=k.group();r.shell.name='Shell';r.shellMesh=k.mesh(shellGeometry(),'#8a7046',r.shell);r.shellMesh.name='Selected rounded dextral whorls and inflated body whorl';shellColour(r.shellMesh);
 const rim=Array.from({length:161},(_,i)=>lymnaeaShellPoint(1,i/160));r.lip=k.tube(rim,.007,'#a58e61',r.shell,160);r.lip.name='Thin selected adult aperture edge';
 k.surface((u,v)=>lymnaeaShellPoint(.80+.20*u,v,true).toArray(),160,80,'#94774c',r.shell,{roughness:.47}).name='Selected inner aperture wall; complete internal shell absent';
 r.foot=k.mesh(lymnaeaBodyGeometry(),'#8b846d');r.foot.name='Continuous supported external head-foot-mantle surface';skin(r.foot);r.footBase=r.foot.geometry.attributes.position.array.slice();r.head=k.group([.88,.34,0]);
 for(const side of[-1,1]){
  const group=k.group([.025,.025,side*.16],r.head),tip=V(.20,.18,side*.27),lateral=V(-tip.z,0,tip.x).normalize();
  const {geometry,fractions}=tentacleGeometry(tip,lateral),mesh=k.mesh(geometry,'#928c72',group);mesh.name='Broad flattened triangular sensory tentacle';skin(mesh);mesh.material.side=T.DoubleSide;mesh.receiveShadow=false;mesh.material.emissive.set('#7b7158');mesh.material.emissiveIntensity=.25;
  // Eyes stay near the tentacle bases, not at the distal tips.
  const eye=k.ell([.055,.018,side*.028],[.009,.008,.009],'#22271e',group);r.appendages.push({group,mesh,index:side,tip,fractions,base:mesh.geometry.attributes.position.array.slice(),basalEye:eye});
 }
 r.eyeCount=2;r.shellAperture=lymnaeaShellPoint(1,.25).add(lymnaeaShellPoint(1,.75)).multiplyScalar(.5);r.shellAxis=lymnaeaShellPoint(0,.25);
 r.targets=s=>s.anatomy.map(a=>{const name=a.name.toLowerCase();if(name.includes('tentacle')){const p=r.appendages[0];return{mesh:p.mesh,point:r.head.position.clone().add(p.group.position).addScaledVector(p.tip,.65)};}if(name.includes('foot'))return{mesh:r.foot,point:V(.40,.14,.30)};return{mesh:r.shellMesh,point:lymnaeaShellPoint(.94,.12)};});
 r.lymnaea=true;k.root.userData.lymnaeaFormScope=lymnaeaFormScope;return r.targets({anatomy:[{name:'Shell'},{name:'Tentacles'},{name:'Foot'}]}).map(t=>t.point.toArray());
}
