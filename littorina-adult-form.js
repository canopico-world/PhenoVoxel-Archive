import * as T from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {noise,mix,microRelief} from './mollusca-surfaces.js';
const TAU=2*Math.PI,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),tilt=.8;
export const littorinaFormScope=Object.freeze({selectedTurns:5.5,axisTilt:tilt,angularGrowth:.11,verticalPitch:1.25,verticalScale:1.25,construction:'Implicit apposed whorl union with a limited aperture recess; not a complete internal shell',measured:false,independentlyValidated:false,scope:'Selected adult external periwinkle; not a shell scan, specimen fit, complete retraction or locomotor physiology'});
// Parameters are authored morphology choices, not photo measurements.
export function littorinaShellPoint(u,v,inner=false){
 const theta=-Math.PI/2+(u-1)*5.5*TAU,g=Math.exp((theta+Math.PI/2)*.11),a=v*TAU;
 const ridge=.0018*Math.cos(v*TAU*22+noise(u*8,v*9)*.20)*g,rh=(.44+ridge-(inner?.012:0))*g,rv=(.60+ridge-(inner?.012:0))*g;
 return V((.46*g+rh*Math.cos(a))*Math.cos(theta),(.70+1.25*(1-g)+rv*Math.sin(a))*1.25,(.46*g+rh*Math.cos(a))*Math.sin(theta)).applyAxisAngle(V(0,0,1),tilt).add(V(.18,.21,.24));
}
let shellTemplate;
function sweptShell(){
 if(shellTemplate)return shellTemplate.clone();
 const N=116,min=V(-1.02,-.04,-1.02),size=V(2.04,2.25,2.04),mat=new T.MeshStandardMaterial(),mc=new MarchingCubes(N,mat,false,false,220000);mc.isolation=0;
 for(let z=0;z<N;z++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const px=min.x+x/N*size.x,py=min.y+y/N*size.y,pz=min.z+z/N*size.z,angle=Math.atan2(pz,px),rho=Math.hypot(px,pz);let field=10;
  for(let k=-7;k<=1;k++){const theta=angle+k*TAU;if(theta> -Math.PI/2||theta< -Math.PI/2-5.5*TAU)continue;const g=Math.exp((theta+Math.PI/2)*.11),center=.70+1.25*(1-g),rh=.44*g,rv=.60*g,d=(Math.hypot((rho-.46*g)/rh,(py-center)/rv)-1)*rh;field=Math.min(field,d);}
  const cavity=Math.max((Math.hypot((pz+.46)/.40,(py-.70)/.55)-1)*.40,-.20-px);field=Math.max(field,-cavity);mc.field[x+y*N+z*N*N]=-field;
 }
 mc.update();if(mc.count>=220000*3)throw Error('Periwinkle shell buffer');
 const raw=new T.BufferGeometry();raw.setAttribute('position',new T.BufferAttribute(mc.geometry.attributes.position.array.slice(0,mc.count*3),3));const rp=raw.attributes.position;
 for(let i=0;i<rp.count;i++){const p=V(min.x+(rp.getX(i)+1)*.5*size.x,(min.y+(rp.getY(i)+1)*.5*size.y)*1.25,min.z+(rp.getZ(i)+1)*.5*size.z).applyAxisAngle(V(0,0,1),tilt).add(V(.18,.21,.24));rp.setXYZ(i,...p.toArray());}
 const welded=mergeVertices(raw,1e-5),wp=welded.attributes.position,wi=welded.index.array,p=[],ix=[],uv=[],used=new Map();for(let i=0;i<wi.length;i+=3){const a=wi[i],b=wi[i+1],c=wi[i+2];if(a===b||b===c||c===a)continue;for(const old of[a,b,c]){if(!used.has(old)){used.set(old,used.size);p.push(wp.getX(old),wp.getY(old),wp.getZ(old));uv.push(wp.getY(old)*.4,Math.atan2(wp.getZ(old)-.24,wp.getX(old)-.18)/TAU);}ix.push(used.get(old));}}
 shellTemplate=new T.BufferGeometry();shellTemplate.setAttribute('position',new T.Float32BufferAttribute(p,3));shellTemplate.setAttribute('uv',new T.Float32BufferAttribute(uv,2));shellTemplate.setIndex(ix);shellTemplate.computeVertexNormals();raw.dispose();welded.dispose();mc.geometry.dispose();mat.dispose();return shellTemplate.clone();
}
const ell=(x,y,z,c,r)=>(Math.hypot((x-c[0])/r[0],(y-c[1])/r[1],(z-c[2])/r[2])-1)*Math.min(...r);
const union=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};let bodyTemplate;
export function littorinaBodyGeometry(){
 if(bodyTemplate)return bodyTemplate.clone();
 const N=96,min=V(-1.12,-.09,-.79),size=V(2.52,1.84,1.18),mat=new T.MeshStandardMaterial(),mc=new MarchingCubes(N,mat,false,false,180000);mc.isolation=0;
 for(let z=0;z<N;z++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const px=min.x+x/N*size.x,py=min.y+y/N*size.y,pz=min.z+z/N*size.z;
  let f=Math.max(ell(px,py,pz,[.02,.105,-.22],[1.04,.115,.31]),.026-py);
  f=union(f,Math.max(ell(px,py,pz,[.77,.105,-.22],[.48,.115,.29]),.026-py),.025);
  const qx=px+.448,qy=py-.82,up=-Math.sin(tilt)*qx+Math.cos(tilt)*qy,forward=Math.cos(tilt)*qx+Math.sin(tilt)*qy;
  f=union(f,(Math.hypot(up/.69,forward/.19,(pz+.22)/.40)-1)*.19,.10);
  f=union(f,ell(px,py,pz,[.57,.30,-.22],[.55,.23,.285]),.10);
  f=union(f,ell(px,py,pz,[.97,.25,-.22],[.28,.17,.275]),.055);
  mc.field[x+y*N+z*N*N]=-f;
 }
 mc.update();if(mc.count>=180000*3)throw Error('Periwinkle body buffer');
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(mc.geometry.attributes.position.array.slice(0,mc.count*3),3));const p=g.attributes.position;
 for(let i=0;i<p.count;i++)p.setXYZ(i,min.x+(p.getX(i)+1)*.5*size.x,min.y+(p.getY(i)+1)*.5*size.y,min.z+(p.getZ(i)+1)*.5*size.z);
 const welded=mergeVertices(g,1e-5),wp=welded.attributes.position,wi=welded.index.array,positions=[],indices=[],used=new Map();
 for(let i=0;i<wi.length;i+=3){const a=wi[i],b=wi[i+1],c=wi[i+2];if(a===b||b===c||c===a)continue;for(const old of[a,b,c]){if(!used.has(old)){used.set(old,used.size);positions.push(wp.getX(old),wp.getY(old),wp.getZ(old));}indices.push(used.get(old));}}
 bodyTemplate=new T.BufferGeometry();bodyTemplate.setAttribute('position',new T.Float32BufferAttribute(positions,3));bodyTemplate.setIndex(indices);bodyTemplate.computeVertexNormals();g.dispose();welded.dispose();mc.geometry.dispose();mat.dispose();return bodyTemplate.clone();
}
function softSkin(mesh,tentacle=false){
 const g=mesh.geometry,p=g.attributes.position,colors=[],uv=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),phase=tentacle?x*160:x*65+4*Math.sin(z*13+y*8),band=.5+.5*Math.sin(phase),q=noise(x*12+7,y*12,z*12),c=mix('#45463a','#d0c8a8',.35+.28*q-.10*band);colors.push(c.r,c.g,c.b);uv.push(x*.7,z*.8+y*.4);}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('littorinaRest',p.clone());mesh.material=new T.MeshPhysicalMaterial({color:'white',vertexColors:true,roughness:.43,clearcoat:.10,clearcoatRoughness:.35});microRelief(mesh,638,.001,.43);
 mesh.material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec3 littorinaRest;varying vec3 vLittorinaRest;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLittorinaRest=littorinaRest;');
  const region=tentacle?'1.':'smoothstep(.25,.70,q.x)',phase=tentacle?'q.x*190.+1.1*sin(q.z*110.)':'q.x*135.+4.*sin(q.z*16.+q.y*8.)+1.2*sin(q.z*53.+q.x*17.)';
  shader.fragmentShader='varying vec3 vLittorinaRest;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec3 q=vLittorinaRest;float region='+region+';float phase='+phase+';float line=1.-smoothstep(.18,.42,abs(sin(phase)));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.048,.052,.043),line*region*.74);');
 };mesh.material.customProgramCacheKey=()=> 'littorina-original-attached-bands-v0638-'+tentacle;
}
function shellSkin(mesh){
 const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,colors=[];
 for(let i=0;i<p.count;i++){const u=uv.getX(i),v=uv.getY(i),patch=noise(u*37+3,v*9),grain=noise(u*640,v*230),ridge=.5+.5*Math.cos(v*TAU*22+.3*noise(u*7,v*14)),apex=.24*(1-u)**3,c=mix('#292b23','#867b5d',.14+.32*patch+.09*grain+.10*ridge+apex);colors.push(c.r,c.g,c.b);}
 mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));mesh.material=new T.MeshPhysicalMaterial({color:'white',vertexColors:true,side:T.DoubleSide,roughness:.57,clearcoat:.06,clearcoatRoughness:.45});microRelief(mesh,638,.001,.57);
}
function tentacleGeometry(tip){
 const N=64,M=24,p=[],ix=[],fractions=[],lateral=V(-tip.z,0,tip.x).normalize();
 for(let i=0;i<=N;i++)for(let j=0;j<M;j++){const u=i/N,a=j/M*TAU,w=.052*(1-u)**.70+.0015,h=.019*(1-u)**.70+.0015,center=tip.clone().multiplyScalar(u).add(V(0,.02*Math.sin(Math.PI*u),0));p.push(...center.addScaledVector(lateral,Math.cos(a)*w).add(V(0,Math.sin(a)*h,0)).toArray());fractions.push(u);}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M;ix.push(a,a+M,b,b,a+M,b+M);}
 for(const i of[0,N]){const cap=p.length/3;p.push(...tip.clone().multiplyScalar(i/N).toArray());fractions.push(i/N);for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M;ix.push(...(i?[cap,a,b]:[cap,b,a]));}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.map(n=>n===0?0:n),3));g.setIndex(ix);g.computeVertexNormals();return{geometry:g,fractions:new Float32Array(fractions)};
}
export function buildLittorinaForm(k,r){
 r.appendages=[];r.shell=k.group();r.shell.name='Shell';r.shellMesh=k.mesh(sweptShell(),'#484638',r.shell);r.shellMesh.name='Selected solid shallow-sutured dextral periwinkle whorls';shellSkin(r.shellMesh);
 r.lip=k.tube(Array.from({length:161},(_,i)=>littorinaShellPoint(1,i/160)),.012,'#8f8062',r.shell,160);r.lip.name='Continuous selected aperture rim without siphonal canal';
 r.columellarLip=k.tube(Array.from({length:81},(_,i)=>littorinaShellPoint(1,.28+i/80*.44)),.030,'#e0d7be',r.shell,80);r.columellarLip.name='Reflected white columellar lip';
 r.shellMesh.userData.limitedApertureCavity=true;
 r.foot=k.mesh(littorinaBodyGeometry(),'#b2ac91');r.foot.name='Continuous supported periwinkle external head-foot-mantle';softSkin(r.foot);r.footBase=r.foot.geometry.attributes.position.array.slice();r.head=k.group([.89,.34,-.22]);
 for(const side of[-1,1]){const group=k.group([.02,.015,side*.155],r.head),tip=V(.31,.13,side*.17),{geometry,fractions}=tentacleGeometry(tip),mesh=k.mesh(geometry,'#b7ae92',group);mesh.name='Closed flattened transversely banded cephalic tentacle';softSkin(mesh,true);const eye=k.ell([.035,.006,side*.046],[.012,.010,.011],'#151c18',group);r.appendages.push({group,mesh,index:side,tip,fractions,base:mesh.geometry.attributes.position.array.slice(),basalEye:eye});}
 // Selected posterior opercular plate; no sealing/retraction mechanism.
 const operculum=k.ell([-.23,.265,-.50],[.22,.018,.15],'#5f4930');operculum.rotation.z=-.15;operculum.name='Selected posterior corneous operculum exterior';r.operculum=operculum;const op=operculum.geometry.attributes.position,oc=[];for(let i=0;i<op.count;i++){const radius=Math.hypot(op.getX(i),op.getZ(i)),f=.5+.5*Math.sin(radius*120+Math.atan2(op.getZ(i),op.getX(i))*1.2),c=mix('#3c3021','#9b8050',.25+.32*f);oc.push(c.r,c.g,c.b);}operculum.geometry.setAttribute('color',new T.Float32BufferAttribute(oc,3));operculum.material=operculum.material.clone();operculum.material.vertexColors=true;operculum.material.color.set('white');
 r.shellAperture=littorinaShellPoint(1,.25).add(littorinaShellPoint(1,.75)).multiplyScalar(.5);r.shellAxis=littorinaShellPoint(0,.25);r.eyeCount=2;r.littorina=true;k.root.userData.littorinaFormScope=littorinaFormScope;
 r.targets=s=>s.anatomy.map(a=>{const name=a.name.toLowerCase();if(name.includes('tentacle')){const p=r.appendages[0];return{mesh:p.mesh,point:r.head.position.clone().add(p.group.position).addScaledVector(p.tip,.60)};}if(name.includes('foot'))return{mesh:r.foot,point:V(.62,.11,-.48)};if(name.includes('operculum'))return{mesh:r.operculum,point:V(-.23,.285,-.50)};return{mesh:r.shellMesh,point:V(-.20,1.20,.65)};});return r.targets({anatomy:[{name:'Shell'},{name:'Tentacles'},{name:'Foot'}]}).map(t=>t.point.toArray());
}
