import * as T from 'three';
export const TAU=Math.PI*2,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export const fract=x=>x-Math.floor(x),hash=x=>fract(Math.sin(x*127.1+311.7)*43758.5453);
export function noise(x,y,z=0){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),f=q=>q*q*(3-2*q),u=f(x-a),v=f(y-b),w=f(z-c),h=(i,j,k)=>hash(i*177+j*313+k*571),l=T.MathUtils.lerp;return l(l(l(h(a,b,c),h(a+1,b,c),u),l(h(a,b+1,c),h(a+1,b+1,c),u),v),l(l(h(a,b,c+1),h(a+1,b,c+1),u),l(h(a,b+1,c+1),h(a+1,b+1,c+1),u),v),w);}
export function tint(mesh,fn){const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,c=[];for(let i=0;i<p.count;i++){const a=fn(p.getX(i),p.getY(i),p.getZ(i),uv?.getX(i)||0,uv?.getY(i)||0);c.push(a.r,a.g,a.b);}mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));mesh.material=mesh.material.clone();mesh.material.vertexColors=true;mesh.material.color.set('white');return mesh;}
export const mix=(a,b,t)=>new T.Color(a).lerp(new T.Color(b),T.MathUtils.clamp(t,0,1));
// Original numerical relief: no photographic pixels or generated organism media.
export function microRelief(mesh,seed=0,scale=.007,roughness=.66){const N=128,bytes=new Uint8Array(N*N*4);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const n=.6*hash(x*91+y*131+seed)+.4*(.5+.5*Math.sin(x*.31+Math.sin(y*.21)*2));const a=(y*N+x)*4;bytes[a]=bytes[a+1]=bytes[a+2]=Math.round(255*n);bytes[a+3]=255;}const tex=new T.DataTexture(bytes,N,N,T.RGBAFormat);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.repeat.set(5,2);tex.needsUpdate=true;mesh.material=mesh.material.clone();mesh.material.bumpMap=tex;mesh.material.bumpScale=scale;mesh.material.roughness=roughness;return mesh;}
export function skin(mesh,colors=['#524a37','#b0a182'],seed=0){tint(mesh,(x,y,z)=>{const n=noise(x*17+seed,y*17,z*17),grain=noise(x*93,y*93,z*93);return mix(colors[0],colors[1],.18+.55*n+.20*Math.pow(grain,5));});return microRelief(mesh,seed,.004,.49);}
export function shellPigment(mesh,cfg){const colors=cfg.colors,seed=cfg.seed||1;tint(mesh,(x,y,z,u,v)=>{const growth=.5+.5*Math.sin(u*TAU*(cfg.lines||67)+noise(v*13,u*5)*2),grain=noise(x*39+seed,y*39,z*39),patch=noise(x*6+seed,y*6,z*6);let q=.14+.42*patch+.12*grain+.13*growth;
 if(cfg.pattern==='bands')q+=.50*Math.pow(Math.max(0,Math.cos(v*TAU*(cfg.bands||4)+.2)),1.4)*(.65+.35*noise(u*80,v*8));
 if(cfg.pattern==='rays')q+=.35*Math.pow(Math.max(0,Math.sin(v*TAU*(cfg.rays||11)+noise(u*5,v*8)*.5)),4);
 if(cfg.pattern==='zigzag')q+=.45*Math.pow(Math.max(0,Math.sin(v*TAU*9+Math.sin(u*45)*2)),6)*(.3+.7*noise(u*53,v*31));
 if(cfg.pattern==='mottled')q+=.22*T.MathUtils.smoothstep(noise(x*18,y*18,z*18),.28,.72);
 return mix(colors[0],colors[1],q);});microRelief(mesh,seed,cfg.relief||.004,cfg.roughness||.64);return mesh;}
