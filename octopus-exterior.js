import * as T from 'three';
import {TAU,V,noise,mix,tint} from './mollusca-surfaces.js';

export const octopusExteriorScope=Object.freeze({version:'0.6.35',measured:false,independentlyValidated:false,sucker:'Selected open external infundibulum, folded rim and short throat; internal acetabulum/protuberance and adhesion physics are not reconstructed'});

// Original reproducible artwork. No organism photograph or SEM pixels.
export function octopusSkinDetail(){
 const N=256,data=new Uint8Array(N*N*4);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const theta=x/N*TAU,phi=y/N*TAU,q=noise(Math.cos(theta)*19+43,Math.sin(theta)*19+Math.cos(phi)*11,Math.sin(phi)*11),fine=noise(Math.cos(theta)*67,Math.sin(theta)*67+Math.cos(phi)*47,Math.sin(phi)*47),value=Math.round(255*(.71+.19*q+.10*fine)),i=(y*N+x)*4;
  data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
 }
 const texture=new T.DataTexture(data,N,N,T.RGBAFormat);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(7,3);texture.generateMipmaps=true;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.needsUpdate=true;return texture;
}

export function octopusSkin(mesh,detail,pale=false){
 tint(mesh,(x,y,z)=>{
  const patch=noise(x*13+2,y*13,z*13),mottle=noise(x*41,y*41+11,z*41),fleck=noise(x*137+7,y*137,z*137),n=.18+.38*patch+.20*mottle+.24*Math.pow(fleck,3);
  const color=mix(pale?'#a9a18d':'#594536',pale?'#e1d5bd':'#c7a17d',n);
  return color.lerp(new T.Color('#e4d8be'),(pale?.16:.09)*Math.pow(Math.max(0,(fleck-.58)/.42),2));
 });
 mesh.material.map=detail;mesh.material.bumpMap=detail;mesh.material.bumpScale=.005;mesh.material.roughness=pale?.58:.64;return mesh;
}

// An annular face with a true uncapped central orifice, not a point-filled disc.
// The two open boundaries join unmodelled internal tissues and the arm exterior.
export function octopusSuckerGeometry(){
 const profile=[[.28,-.72],[.50,-.56],[.69,-.29],[.87,.06],[1.00,.29],[1.015,.34],[.97,.35],[.90,.29],[.78,.23],[.63,.18],[.47,.13],[.32,.08],[.23,.01],[.205,-.11],[.205,-.29]],N=64,p=[],c=[],uv=[],ix=[];
 for(let j=0;j<profile.length;j++)for(let k=0;k<=N;k++){
  const [R,H]=profile[j],a=k/N*TAU,face=j>=6&&j<=12,phase=a*21+.14*Math.sin(a*7),groove=face?.010*Math.pow(.5+.5*Math.cos(phase+R*.8),8)*Math.sin((R-.20)/.80*Math.PI):0,fold=(j>=3&&j<=7)?.012*Math.sin(a*37+.6*Math.sin(a*5)):0;
  const r=R+fold;p.push(Math.cos(a)*r,H-groove,Math.sin(a)*r);uv.push(j/(profile.length-1),k/N);
  const color=j>=12?mix('#9d8b73','#493f32',(j-12)/2):j>=6?mix('#c8b695','#e3d5b9',.45+.18*Math.sin(a*5+R*9)):mix('#a28e72','#c7b28e',j/6);c.push(color.r,color.g,color.b);
 }
 for(let j=0;j<profile.length-1;j++)for(let k=0;k<N;k++){const a=j*(N+1)+k,b=a+N+1;ix.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData={scope:octopusExteriorScope.sucker,orificeRadius:.205,profileRings:profile.length,angularSamples:N,dimensions:'Illustrative local units; no specimen fit'};return g;
}

export function octopusFunnelGeometry(){
 const curve=new T.CatmullRomCurve3([V(-.20,.28,-.15),V(.06,.29,-.29),V(.22,.31,-.49)]),N=32,M=48,p=[],uv=[],innerFlags=[],ix=[],frames=curve.computeFrenetFrames(N,false);
 // Forward outer wall, rounded tip, then backward inner wall. Neither lumen end is capped.
 const path=[...Array.from({length:N+1},(_,i)=>({u:i/N,inner:false})),...Array.from({length:N+1},(_,i)=>({u:1-i/N,inner:true}))];
 for(let j=0;j<path.length;j++){const {u,inner}=path[j],center=curve.getPoint(u),f=Math.min(N,Math.round(u*N)),r=.100-.036*u-(inner?.012:0);for(let k=0;k<=M;k++){const a=k/M*TAU,q=center.clone().addScaledVector(frames.normals[f],Math.cos(a)*r).addScaledVector(frames.binormals[f],Math.sin(a)*r);p.push(q.x,q.y,q.z);uv.push(u,k/M);innerFlags.push(inner?1:0);}}
 for(let j=0;j<path.length-1;j++)for(let k=0;k<M;k++){const a=j*(M+1)+k,b=a+M+1;ix.push(a,a+1,b,b,a+1,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('funnelInner',new T.Float32BufferAttribute(innerFlags,1));g.setIndex(ix);g.computeVertexNormals();g.userData={scope:'Open external funnel walls and lip only; no mantle cavity, valve, flow or propulsion solver',lumenTip:curve.getPoint(1).toArray(),tipTangent:curve.getTangent(1).toArray()};return g;
}

// Thin external tissue with two faces and joined margins, rather than a zero-thickness card.
export function octopusWebGeometry(){
 const U=28,W=24,p=[],uv=[],sides=[],ix=[],count=(U+1)*(W+1);
 for(const side of [1,-1])for(let u=0;u<=U;u++)for(let v=0;v<=W;v++){p.push(0,0,0);uv.push(u/U,v/W);sides.push(side);}
 for(let layer=0;layer<2;layer++)for(let u=0;u<U;u++)for(let v=0;v<W;v++){const a=layer*count+u*(W+1)+v,b=a+W+1;if(layer===0)ix.push(a,b,a+1,b,b+1,a+1);else ix.push(a,a+1,b,b,a+1,b+1);}
 const margin=[];for(let v=0;v<=W;v++)margin.push(v);for(let u=1;u<=U;u++)margin.push(u*(W+1)+W);for(let v=W-1;v>=0;v--)margin.push(U*(W+1)+v);for(let u=U-1;u>=1;u--)margin.push(u*(W+1));
 for(let j=0;j<margin.length;j++){const a=margin[j],b=margin[(j+1)%margin.length];ix.push(a,b,a+count,b,b+count,a+count);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('webSide',new T.Float32BufferAttribute(sides,1));g.setIndex(ix);return g;
}
