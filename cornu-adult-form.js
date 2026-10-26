import * as T from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {microRelief,noise} from './mollusca-surfaces.js';

const TAU=Math.PI*2,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const axisTurn=Math.PI/4;
export const cornuFormScope=Object.freeze({selectedWhorls:4.75,axisTurn,measured:false,independentlyValidated:false});

// An illustrative dextral sweep and carriage, not a scan or a specimen fit.
export function cornuShellPoint(u,v){
 const theta=-Math.PI/4+(u-1)*4.75*TAU,g=Math.exp((theta+Math.PI/4)*.105),a=v*TAU;
 const growth=.0018*Math.sin(u*1800+noise(v*19,u*47)*7)*g;
 const radius=(.47+growth)*g*(1+.015*noise(u*73,v*17));
 return V((.50*g+radius*Math.cos(a))*Math.cos(theta),.80-.80*g+(.66*g+growth)*Math.sin(a),(.50*g+radius*Math.cos(a))*Math.sin(theta))
  .applyAxisAngle(V(1,0,0),axisTurn).add(V(-.32,.618306,0));
}

function maps(){
 const pending=[];
 const load=(url,srgb=false,repeat=true)=>{
  let tex;
  if(typeof document==='undefined')tex=new T.DataTexture(new Uint8Array([128,112,80,255]),1,1);
  else pending.push(new Promise((resolve,reject)=>{tex=new T.TextureLoader().load(url,resolve,reject);}));
  tex.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;tex.flipY=false;
  tex.wrapS=repeat?T.RepeatWrapping:T.ClampToEdgeWrapping;tex.wrapT=T.RepeatWrapping;tex.needsUpdate=true;
  return tex;
 };
 const shell=load(new URL('./texture-cornu-shell-v0634.png',import.meta.url).href,true,false);
 const color=load(new URL('./texture-cornu-skin-color-v0634.png',import.meta.url).href,true);
 const height=load(new URL('./texture-cornu-skin-height-v0634.png',import.meta.url).href);
 return{shell,color,height,ready:Promise.all(pending)};
}

function skin(mesh,images){
 const p=mesh.geometry.attributes.position,uv=[];
 for(let i=0;i<p.count;i++)uv.push((p.getX(i)+1.4)/2.8,(Math.atan2(p.getZ(i),p.getY(i)-.15)/TAU+1)%1);
 mesh.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 mesh.material=new T.MeshStandardMaterial({color:'white',roughness:.46,metalness:0,map:images.color,bumpMap:images.height,bumpScale:.005,side:T.DoubleSide});
 // Three planar samples avoid stretching the collar. Standard UV maps remain
 // usable by compatibility rendering and export, with reduced surface fidelity.
 mesh.material.onBeforeCompile=shader=>{
  shader.uniforms.cornuColor={value:images.color};shader.uniforms.cornuHeight={value:images.height};
  shader.vertexShader='varying vec3 vCornuPosition; varying vec3 vCornuNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCornuPosition=position;vCornuNormal=normal;');
  shader.fragmentShader=`varying vec3 vCornuPosition;varying vec3 vCornuNormal;
uniform sampler2D cornuColor;uniform sampler2D cornuHeight;
vec4 cornuSample(sampler2D tex,vec3 p,vec3 n){
 vec3 w=pow(abs(normalize(n)),vec3(6.));w/=max(.001,w.x+w.y+w.z);
 return texture2D(tex,p.yz*.72)*w.x+texture2D(tex,p.xz*.72)*w.y+texture2D(tex,p.xy*.72)*w.z;
}\n`+shader.fragmentShader
   .replace('#include <map_fragment>','diffuseColor.rgb *= cornuSample(cornuColor,vCornuPosition,vCornuNormal).rgb;')
   .replace('#include <normal_fragment_maps>','float cornuH=cornuSample(cornuHeight,vCornuPosition,vCornuNormal).r;normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(cornuH),dFdy(cornuH))*.005,faceDirection);');
 };
 mesh.material.customProgramCacheKey=()=> 'cornu-authored-skin-v0634';
}

const profile=[[-1.28,.001,.002,0],[-1.0,.12,.15,0],[-.6,.28,.34,0],[-.15,.32,.80,-.12],[.15,.31,.90,-.18],[.45,.28,.65,-.09],[.8,.25,.36,0],[1.04,.23,.31,0],[1.29,.005,.13,0]];
function section(x){
 let j=1;while(j<profile.length-1&&x>profile[j][0])j++;
 const a=profile[j-1],b=profile[j],t=T.MathUtils.clamp((x-a[0])/(b[0]-a[0]),0,1),f=t*t*(3-2*t);
 return[a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f,a[3]+(b[3]-a[3])*f];
}

// A smoothly joined external skin field removes the previous primitive seams.
// This field is an authored surface, not internal tissues or physiological data.
export function cornuBodyGeometry(){
 const N=96,bmin=V(-1.4,-.10,-.95),bsize=V(2.8,1.7,1.90),material=new T.MeshStandardMaterial(),mc=new MarchingCubes(N,material,false,false,180000);
 mc.isolation=0;
 const forward=V(Math.SQRT1_2,0,Math.SQRT1_2).applyAxisAngle(V(1,0,0),axisTurn),up=V(0,1,0).applyAxisAngle(V(1,0,0),axisTurn),radial=forward.clone().cross(up);
 const center=V(.033553,.868306,-.25).addScaledVector(forward,-.10),q=V(),sections=Array.from({length:N},(_,x)=>section(bmin.x+x/N*bsize.x));
 for(let z=0;z<N;z++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const px=bmin.x+x/N*bsize.x,py=bmin.y+y/N*bsize.y,pz=bmin.z+z/N*bsize.z,[w,h,centerZ]=sections[x],base=.026;
  const body=Math.max((Math.hypot((pz-centerZ)/Math.max(.001,w),(py-base)/Math.max(.001,h))-1)*Math.min(w,h),base-py,-1.28-px,px-1.29);
  q.set(px,py,pz).sub(center);
  const mantle=(Math.hypot(q.dot(forward)/.23,q.dot(up)/.55,q.dot(radial)/.40)-1)*.23,k=.115,blend=Math.max(k-Math.abs(body-mantle),0)/k;
  mc.field[x+y*N+z*N*N]=-(Math.min(body,mantle)-blend*blend*k*.25);
 }
 mc.update();if(mc.count>=180000*3)throw Error('Cornu reconstruction buffer is too small');
 const g=new T.BufferGeometry(),a=mc.geometry.attributes.position;
 g.setAttribute('position',new T.BufferAttribute(a.array.slice(0,mc.count*3),3));
 const p=g.attributes.position;
 for(let i=0;i<p.count;i++)p.setXYZ(i,bmin.x+(p.getX(i)+1)*.5*bsize.x,bmin.y+(p.getY(i)+1)*.5*bsize.y,bmin.z+(p.getZ(i)+1)*.5*bsize.z);
 const welded=mergeVertices(g,1e-5),wp=welded.attributes.position,wi=welded.index.array,positions=[],indices=[],used=new Map();
 // Welding an isosurface may collapse tiny triangles. Remove those faces and
 // compact unused vertices before checking the closed connected skin.
 for(let i=0;i<wi.length;i+=3){const a=wi[i],b=wi[i+1],c=wi[i+2];if(a===b||b===c||c===a)continue;for(const old of [a,b,c]){if(!used.has(old)){used.set(old,used.size);positions.push(wp.getX(old),wp.getY(old),wp.getZ(old));}indices.push(used.get(old));}}
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(positions,3));result.setIndex(indices);result.computeVertexNormals();
 g.dispose();welded.dispose();mc.geometry.dispose();material.dispose();return result;
}

export function buildCornuForm(k,r){
 const images=maps();r.textureReady=images.ready;r.appendages=[];
 r.shell=k.group();r.shell.name='Shell';
 r.shellMesh=k.surface((u,v)=>cornuShellPoint(u,v).toArray(),760,100,'#a18152',r.shell);
 r.shellMesh.name='Selected dextral adult shell sweep';r.shellMesh.material.map=images.shell;r.shellMesh.material.color.set('white');
 microRelief(r.shellMesh,218,.0038,.48);
 const apexCenter=cornuShellPoint(0,0).add(cornuShellPoint(0,.5)).multiplyScalar(.5);
 k.surface((u,v)=>apexCenter.clone().lerp(cornuShellPoint(0,v),u).toArray(),6,64,'#85633f',r.shell).name='Closed selected protoconch exterior';
 const rim=Array.from({length:161},(_,i)=>cornuShellPoint(1,i/160));
 r.lip=k.tube(rim,.016,'#d5c7a4',r.shell,160);r.lip.name='Selected reflected adult aperture lip';
 r.foot=k.mesh(cornuBodyGeometry(),'#8c8870');r.foot.name='Continuous external head-foot-mantle surface';skin(r.foot,images);
 r.footBase=r.foot.geometry.attributes.position.array.slice();r.head=k.group([.95,.24,0]);
 for(const side of [-1,1])for(const upper of [true,false]){
  const anchor=upper?[.08,.08,side*.12]:[.15,-.035,side*.14],tip=upper?V(.20,.37,side*.15):V(.21,.025,side*.13),width=upper?.028:.020;
  const group=k.group(anchor,r.head),lateral=V(-tip.z,0,tip.x).normalize();
  const mesh=k.surface((u,v)=>{const a=v*TAU,R=width*(1-u)+(upper?.012:.006)*u;return tip.clone().multiplyScalar(u).addScaledVector(lateral,Math.cos(a)*R).add(V(0,Math.sin(a)*R,0)).toArray();},48,24,'#9c9a82',group);
  mesh.name=upper?'Upper sensory stalk exterior':'Lower sensory tentacle exterior';skin(mesh,images);
  const part={group,mesh,index:side*(upper?1:2),tip,base:mesh.geometry.attributes.position.array.slice()};
  if(upper)part.eye=k.ell(tip.toArray(),[.011,.011,.011],'#20251e',group);
  r.appendages.push(part);
 }
 r.eyeCount=2;r.shellAperture=V(.033553,.868306,-.25);r.shellAxis=V(-.32,1.183991,.565685);
 r.targets=s=>s.anatomy.map(a=>{const name=a.name.toLowerCase();if(name.includes('tentacle')){const p=r.appendages[0];return{mesh:p.mesh,point:r.head.position.clone().add(p.group.position).add(p.tip)};}if(name.includes('foot'))return{mesh:r.foot,point:V(.35,.08,.32)};return{mesh:r.shellMesh,point:cornuShellPoint(.91,.20)};});
 k.root.userData.cornuFormScope=cornuFormScope;
 return r.targets({anatomy:[{name:'Shell'},{name:'Upper tentacles'},{name:'Foot'}]}).map(t=>t.point.toArray());
}
