// Reproducible derivatives of the licensed source surfaces. Inputs are the
// downloaded originals, not the former procedural whale bodies.
import fs from 'node:fs';import crypto from 'node:crypto';import sharp from 'sharp';
import * as T from 'three';import {Document,NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
const dir='research-cache/cetaceans-sources-v0677/',io=new NodeIO().registerExtensions(ALL_EXTENSIONS),S=T.MathUtils.smoothstep,C=T.MathUtils.clamp;
const sources={risso:{file:dir+'risso-original/source/DelfinRisso.glb',author:'ivan.geraldo',uid:'e9d97f00de3948218f0388e8a2a117df',license:'CC BY 4.0'},sei:{file:dir+'sei-source.glb',author:'Bohdan Lvov (ostapblendercg)',uid:'7678f86f91284b5587f7fbde3389b209',license:'CC BY 4.0'},minke:{file:dir+'minke-source.glb',author:'Bill Nguyen (bill_nguyen)',uid:'c905f4b686524efbba73b2b73dfee306',license:'CC BY 4.0'},pilot:{file:dir+'pilot-original/source/long finned pilot whale.glb',author:'allthingsaurus',uid:'55ce704ea0164178ad3acaa67c04d2bd',license:'CC BY 4.0'},fin:{file:'model-fin-whale-woelper.glb',author:'Johann Woelper',uid:'fb69578cfaaf45969f3118de4103d03b',license:'CC BY-NC 4.0'}};
export const designs={
 'caperea-marginata':{source:'fin',reference:'dff63643dcd1453b9c7b3c9115de2252',pleats:0,freq:.34},
 'balaenoptera-borealis':{source:'sei',reference:sources.sei.uid,pleats:42,freq:.25},
 'balaenoptera-acutorostrata':{source:'minke',reference:'50d84a4d3a5c42b88800a03049ff561e',pleats:60,freq:.38},
 'balaenoptera-bonaerensis':{source:'minke',reference:sources.minke.uid,pleats:30,freq:.34},
 'balaenoptera-ricei':{source:'sei',reference:'https://www.fisheries.noaa.gov/species/rices-whale',pleats:48,freq:.27},
 'balaenoptera-edeni':{source:'sei',reference:'74b3d06cc4a74b90903f0b4210a61117',pleats:48,freq:.30},
 'balaenoptera-brydei':{source:'sei',reference:'74b3d06cc4a74b90903f0b4210a61117',pleats:48,freq:.27},
 'balaenoptera-omurai':{source:'fin',reference:'https://www.omuraswhale.org/physical-description',pleats:85,freq:.32},
 'globicephala-melas':{source:'pilot',reference:'3c9d1f69a4c74a6aa0cb7a31a8885d30',pleats:0,freq:.43},
 'grampus-griseus':{source:'risso',reference:'f56e629915c24459897ea8f902bcbcbb',pleats:0,freq:.49}
};
function refine(mesh,levels){
 // Loop subdivision operates on geometric neighbours across UV seams. Face
 // varying UVs interpolate only inside their source charts; no atlas repack.
 let pos=[],faces=[],weld=new Map();
 for(let j=0;j<mesh.indices.length;j+=3){const face=[];for(const k of mesh.indices.slice(j,j+3)){const v=mesh.p.slice(k*3,k*3+3),key=v.map(x=>x.toFixed(6)).join(':');if(!weld.has(key)){weld.set(key,pos.length);pos.push(v);}face.push({v:weld.get(key),uv:mesh.uv.slice(k*2,k*2+2)});}if(new Set(face.map(c=>c.v)).size===3)faces.push(face);}
 for(let l=0;l<levels;l++){
  const edges=new Map(),adj=pos.map(()=>new Set());
  for(const f of faces)for(let j=0;j<3;j++){const a=f[j].v,b=f[(j+1)%3].v,k=[a,b].sort((x,y)=>x-y).join(':');if(!edges.has(k))edges.set(k,{a,b,opp:[]});edges.get(k).opp.push(f[(j+2)%3].v);adj[a].add(b);adj[b].add(a);}
  const np=pos.map((v,i)=>{const neighbors=[...adj[i]],boundary=neighbors.filter(j=>edges.get([i,j].sort((a,b)=>a-b).join(':')).opp.length!==2);if(boundary.length===2)return v.map((x,k)=>.75*x+.125*(pos[boundary[0]][k]+pos[boundary[1]][k]));if(boundary.length)return v;const n=neighbors.length,beta=n===3?3/16:3/(8*n);return v.map((x,k)=>(1-n*beta)*x+beta*neighbors.reduce((s,j)=>s+pos[j][k],0));});
  for(const e of edges.values()){e.i=np.length;np.push([0,1,2].map(k=>e.opp.length===2?.375*(pos[e.a][k]+pos[e.b][k])+.125*(pos[e.opp[0]][k]+pos[e.opp[1]][k]):.5*(pos[e.a][k]+pos[e.b][k])));}
  const nf=[];for(const f of faces){const e=f.map((a,j)=>{const b=f[(j+1)%3];return{v:edges.get([a.v,b.v].sort((a,b)=>a-b).join(':')).i,uv:a.uv.map((x,k)=>(x+b.uv[k])*.5)};});nf.push([f[0],e[0],e[2]],[e[0],f[1],e[1]],[e[2],e[1],f[2]],[e[0],e[1],e[2]]);}pos=np;faces=nf;
 }
 const pp=[],uv=[],ii=[],lookup=new Map(),norm=pos.map(()=>new T.Vector3());
 for(const f of faces){const [a,b,c]=f.map(c=>new T.Vector3(...pos[c.v])),n=b.sub(a).cross(c.sub(a));f.forEach(c=>norm[c.v].add(n));}norm.forEach(n=>n.normalize());const nn=[];
 for(const f of faces)for(const c of f){const key=c.v+':'+c.uv.map(x=>x.toFixed(7)).join(':');if(!lookup.has(key)){lookup.set(key,pp.length/3);pp.push(...pos[c.v]);uv.push(...c.uv);nn.push(...norm[c.v]);}ii.push(lookup.get(key));}
 return{p:pp,uv,indices:ii,n:nn};
}
function normalize(mesh,key){
 let pp=key==='minke'?mesh.p:mesh.raw;const points=[];for(let i=0;i<pp.length;i+=3)points.push(pp.slice(i,i+3));const ax=key==='fin'?0:2,lo=Math.min(...points.map(p=>p[ax])),hi=Math.max(...points.map(p=>p[ax])),scale=3.85/(hi-lo),mid=(hi+lo)*.5;
 const centreY=key==='fin'?1.45:key==='sei'?-.12:key==='pilot'?.04:key==='risso'?.80:-.18;
 return{...mesh,p:points.flatMap(p=>key==='fin'?[p[0],p[1],p[2]]:[(p[2]-mid)*scale,1.45+(p[1]-centreY)*scale,-p[0]*scale])};
}
function sculpt(m,id){
 // Local changes retain the supplied connected head/mouth/fin topology.
 for(let i=0;i<m.p.length;i+=3){let[x,y,z]=m.p.slice(i,i+3);const u=.5-x/3.85,dy=y-1.45,az=Math.abs(z),head=1-S(u,.22,.34);
  if(id==='balaenoptera-ricei'||id==='balaenoptera-edeni'||id==='balaenoptera-brydei'){
   const width=id==='balaenoptera-ricei'?1.12:id==='balaenoptera-edeni'?1.08:1.03;z*=1+(width-1)*Math.sin(Math.PI*C(u,0,1));y=1.45+dy*(id==='balaenoptera-edeni'?1.08:1.04);
   if(u>.025&&u<.25&&dy>-.005)y+=.012*Math.sin(Math.PI*(u-.025)/.225)*(Math.exp(-1*((az-.07)/.013)**2)+Math.exp(-1*(az/.014)**2));
  }
  if(id==='balaenoptera-acutorostrata'){z*=.95;y=1.45+dy*.92-.14*S(u,.4,1)**2;const back=S(u,.37,.53)*(1-S(u,.73,.85));x-=.035*back;y+=.012*back;}
  if(id==='balaenoptera-bonaerensis'){z*=1.05;y=1.45+dy*1.08;}
  if(id==='caperea-marginata'){
   z*=1.16;y=1.45+dy*1.10+head*.045*Math.sin(Math.PI*C(u/.3,0,1));
   // Source pectorals are long: shorten about their attachments; posterior
   // dorsal fin is smaller and moved caudally with a smooth root transition.
   const pec=S(az,.19,.30)*(1-S(u,.46,.56))*S(u,.19,.25);z=.14*Math.sign(z)+(z-.14*Math.sign(z))*(1-.40*pec);const finAxis=.95-.45*Math.abs(z);x=finAxis+(x-finAxis)*(1+.45*pec);y=1.34+(y-1.34)*(1-.40*pec);
   const dorsal=S(dy,.19,.26)*(1-S(az,.06,.12))*S(u,.49,.57)*(1-S(u,.78,.85));y-=Math.max(0,dy-.18)*.35*dorsal;x-=.20*dorsal;
  }
  if(id==='balaenoptera-omurai'){const pec=S(az,.20,.31)*S(u,.18,.25)*(1-S(u,.52,.60));z=.15*Math.sign(z)+(z-.15*Math.sign(z))*(1-.32*pec);x=.88+(x-.88)*(1-.20*pec);y=1.34+(y-1.34)*(1-.32*pec);z*=.96;y=1.45+(y-1.45)*.94;}
  if(id==='grampus-griseus'&&designs[id].source==='pilot'){
   // A distinct beakless Risso head, taller narrower fin and more tapered
   // pectorals, guided by the requested (non-downloadable) Major model.
   x-=.085*head*C((dy*dy+z*z)/.06,0,1);z*=1-.08*head;y=1.45+dy*(1-.08*head);y-=.045*head*S(dy,.02,.22);
   const dorsal=S(dy,.23,.32)*(1-S(az,.09,.15));x-=.27*dorsal;y+=Math.max(0,dy-.23)*.45*dorsal;
   const pec=S(az,.25,.40)*S(u,.18,.28)*(1-S(u,.58,.65));z*=1-.12*pec;
   if(u<.14&&dy>.01)y-=.012*Math.exp(-1*(z/.012)**2)*(1-S(u,.09,.14));
  }
  m.p[i]=x;m.p[i+1]=y;m.p[i+2]=z;
 }
 const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(m.p,3)).setIndex(m.indices);g.computeVertexNormals();m.n=[...g.attributes.normal.array];const seams=new Map();for(let j=0;j<m.p.length;j+=3){const key=m.p.slice(j,j+3).map(v=>v.toFixed(6)).join(':');if(!seams.has(key))seams.set(key,[]);seams.get(key).push(j);}for(const group of seams.values()){const normal=new T.Vector3();for(const j of group)normal.add(new T.Vector3(...m.n.slice(j,j+3)));normal.normalize();for(const j of group)m.n.splice(j,3,...normal);}g.dispose();return m;
}
function splitMinkeCharts(m){
 const out={p:[],n:[],uv:[],indices:[],sampleUV:[]},lookup=new Map(),centres=[];
 for(let j=0;j<=100;j++){const u=j/100,ys=[];for(let i=0;i<m.p.length;i+=3){const U=.5-m.p[i]/3.85,y=m.p[i+1]-1.45,z=Math.abs(m.p[i+2]);if(Math.abs(U-u)>.015)continue;if(z>.23&&y<-.23&&U>.18&&U<.65)continue;if(z<.1&&y>.35&&U>.45&&U<.83)continue;ys.push(m.p[i+1]);}ys.sort((a,b)=>a-b);centres.push(ys.length?(ys[Math.floor((ys.length-1)*.10)]+ys[Math.floor((ys.length-1)*.90)])*.5:NaN);}
 for(let j=0;j<centres.length;j++)if(!Number.isFinite(centres[j])){let k=0;while(k<101&&!Number.isFinite(centres[j-k])&&!Number.isFinite(centres[j+k]))k++;centres[j]=centres[j-k]||centres[j+k]||1.45;}
 const centre=u=>{const f=C(u,0,1)*100,j=Math.min(99,Math.floor(f));return T.MathUtils.lerp(centres[j],centres[j+1],f-j);};
 for(let f=0;f<m.indices.length;f+=3){const ids=m.indices.slice(f,f+3),q=[0,0,0];for(const i of ids)for(let k=0;k<3;k++)q[k]+=m.p[3*i+k]/3;const u=.5-q[0]/3.85,az=Math.abs(q[2]),dy=q[1]-1.45;
  const nz=Math.abs(ids.reduce((sum,i)=>sum+m.n[3*i+2]/3,0));const chart=u>.83&&az>.06?2:u>.45&&u<.83&&dy>.24&&az<.12&&nz>.70?3:u>.18&&u<.65&&az>.28&&dy<-.30?1:0;
  const vv=ids.map(i=>(Math.atan2(m.p[3*i+2],m.p[3*i+1]-centre(.5-m.p[3*i]/3.85))+Math.PI)/(2*Math.PI)),cross=Math.max(...vv)-Math.min(...vv)>.5;
  for(const [k,i]of ids.entries()){const key=i+':'+chart+':'+(cross&&vv[k]<.5?'wrap':'');if(!lookup.has(key)){lookup.set(key,out.p.length/3);out.p.push(...m.p.slice(3*i,3*i+3));out.n.push(...m.n.slice(3*i,3*i+3));out.sampleUV.push(...m.uv.slice(2*i,2*i+2));const x=m.p[3*i],y=m.p[3*i+1]-1.45,z=m.p[3*i+2];let U,V;if(chart===0){U=.5-x/3.85;V=cross&&vv[k]<.5?1:vv[k];}else if(chart===1){U=(x-.35)/.95;V=(-y-.15)/.52;}else if(chart===2){U=(x+1.925)/.65;V=(z+.56)/1.12;}else{U=(x+1.25)/1.1;V=(y-.1)/.6;}out.uv.push((chart%2)*.5+.002+C(U,0,1)*.496,Math.floor(chart/2)*.5+.002+C(V,0,1)*.496);}out.indices.push(lookup.get(key));}
 }return out;
}
function noise(x,y,z){return(Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453123)%1;}
async function atlas(mesh,id,srcMat){
 const size=['pilot','minke','risso'].includes(designs[id].source)?4096:2048,N=size*size,color=Buffer.alloc(N*3,Buffer.from(designs[id].source==='minke'?[43,51,58]:[55,61,66])),height=new Float32Array(N),valid=new Uint8Array(N),rough=Buffer.alloc(N*3,Buffer.from([0,148,0])),sTex=srcMat.getBaseColorTexture(),orig=sTex?await sharp(sTex.getImage()).resize(size,size).removeAlpha().raw().toBuffer():null;
 const srcN=srcMat.getNormalTexture(),originalNormal=srcN?await sharp(srcN.getImage()).resize(size,size).removeAlpha().raw().toBuffer():null;
 const targetEye=['pilot','risso'].includes(designs[id].source)?[1.46,1.48,.25]:[1.12,1.48,.12],eye=[];for(const side of[-1,1]){let best=null,dist=Infinity;for(let i=0;i<mesh.p.length;i+=3){if(mesh.p[i+2]*side<0)continue;const d=(mesh.p[i]-targetEye[0])**2+(mesh.p[i+1]-targetEye[1])**2+(mesh.p[i+2]-side*targetEye[2])**2;if(d<dist){dist=d;best=mesh.p.slice(i,i+3);}}eye.push(best);}
 const finFront=Array(80).fill(-Infinity);for(let i=0;i<mesh.p.length;i+=3){const[x,y,z]=mesh.p.slice(i,i+3),u=.5-x/3.85;if(Math.abs(z)>.25&&u>.18&&u<.58){const j=C(Math.round(Math.abs(z)/1.1*79),0,79);finFront[j]=Math.max(finFront[j],x);}}
 const get=(x,y,z,nx,ny,nz,old)=>{
  const u=.5-x/3.85,dy=y-1.45,az=Math.abs(z),belly=1-S(ny,-.6,.1),head=1-S(u,.13,.28),source=designs[id].source,grain=(noise(x*190,y*190,z*190)+noise(x*51,y*51,z*51)*.5)*2;
  let rgb=old.slice(),h=grain*.00004,rf=.58;
  // No painted light is interpreted as metal or glossy water droplets.
  if(source==='sei')rgb=rgb.map(v=>C((v-20)*.92+24+grain*1.6,12,224));
  if(source==='minke'){
   const lower=1-S(ny,-.80,-.12),flank=(1-S(dy,-.02,.15))*(1-S(ny,.35,.8)),shoulder=Math.exp(-1*((u-(.27+.15*dy))/.09)**2)*flank*.55;
   const oldLum=(old[0]+old[1]+old[2])/3,detail=C((oldLum-90)*.028,-2.5,2.5);
   rgb=[43,51,58].map((v,k)=>T.MathUtils.lerp(v,[112,123,127][k],flank*.40+shoulder*.25));rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,[197,199,193][k],lower)+detail);
  }
  if(id==='balaenoptera-ricei'){const vent=belly*(1-S(u,.65,.76));rgb=rgb.map((v,k)=>T.MathUtils.lerp(v*.82,[196,188,180][k],vent*.72));}
  if(id==='balaenoptera-edeni'||id==='balaenoptera-brydei')rgb=rgb.map((v,k)=>T.MathUtils.lerp(v*.87,[186,185,181][k],belly*.6));
  const pec=(source==='minke'?S(az,.28,.33)*(1-S(dy,-.30,-.22)):0)*S(u,.19,.27)*(1-S(u,.45,.54));
  if(source==='minke'&&(u>.84||(dy>.16&&u>.46&&u<.8&&az<.10)))rgb=[35,42,48];
  if(pec>.05){let band=id==='balaenoptera-acutorostrata'?(S(az,.24,.29)*(1-S(az,.37,.43))):0;rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,T.MathUtils.lerp([31,37,41][k],[215,215,205][k],band),pec));}
  if(id==='caperea-marginata'){
   const detail=(old[0]+old[1]+old[2])/3/255,vent=(1-S(dy,-.10,.07))*(1-S(u,.65,.85));rgb=[58,65,70].map((v,k)=>T.MathUtils.lerp(v,[172,175,171][k],vent)+detail*6+grain*2);
   h=grain*.00004;const fin=S(az,.18,.28)*S(u,.18,.26)*(1-S(u,.5,.6));rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,[61,67,71][k],fin));
  }
  if(id==='balaenoptera-omurai'){
   const right=S(z,-.015,.015),jaw=head*(1-S(dy,.055,.10)),vent=belly*.82;rgb=rgb.map((v,k)=>T.MathUtils.lerp(v*.85,[201,202,191][k],vent));rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,[212,211,197][k],jaw*right));rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,[43,48,53][k],jaw*(1-right)));
   const fin=S(az,.2,.3)*S(u,.18,.25)*(1-S(u,.51,.6)),front=finFront[C(Math.round(az/1.1*79),0,79)],lead=Number.isFinite(front)?1-S(front-x,.01,.04):0;rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,T.MathUtils.lerp([49,56,61][k],[204,205,195][k],lead),fin));
   const ch=Math.exp(-1*((u-(.36+.65*dy))/.042)**2)*right*.16*(1-S(dy,.14,.23))+Math.exp(-1*((u-(.43+.32*dy))/.025)**2)*right*.09*(1-S(dy,.14,.23));rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,[158,165,163][k],ch));
  }
  if(id==='grampus-griseus'){
   const oldLum=(old[0]+old[1]+old[2])/3,age=(1-S(u,.06,.16))*.70+belly*.15,variation=grain*2+Math.min(20,oldLum*.055);rgb=[79,87,92].map((v,k)=>T.MathUtils.lerp(v,[200,202,196][k],age)+variation);
   let scars=0;for(let j=0;j<14;j++){const cu=.19+((j*19)%71)/100,side=j%2?1:-1,cd=-.10+((j*13)%29)/100,span=.025+(j%4)*.009,along=(u-cu)/span;if(Math.abs(along)>1||z*side<.03)continue;for(let k=0;k<3+(j%3);k++){const line=cd+(u-cu)*(.3+(j%4)*.24)+.003*along*along+k*.006;scars=Math.max(scars,Math.exp(-1*((dy-line)/.0018)**2)*(1-along*along));}}rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,[210,212,205][k],scars*.50));h-=scars*.0005;const mouthY=-.095+.055*S(u,.05,.20),lip=S(u,.008,.03)*(1-S(u,.14,.18))*Math.exp(-1*((dy-mouthY)/.0035)**2);rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,[48,53,56][k],lip*.68));h-=lip*.001;
  }
  if(designs[id].pleats){const a=Math.atan2(z,-dy),field=(1-S(Math.abs(a),1.05,1.30))*S(u,.035,.08)*(1-S(u,id==='balaenoptera-omurai'?.64:.45,id==='balaenoptera-omurai'?.69:.51));h+=Math.cos((a+1.24)/2.48*designs[id].pleats*Math.PI*2)*.002*field;}
  if(source==='minke'){const radius=['pilot','risso'].includes(source)?.014:.009,ed=Math.min(...eye.map(e=>Math.hypot(x-e[0],y-e[1],z-e[2]))),dot=1-S(ed,radius*.6,radius);rgb=rgb.map((v,k)=>T.MathUtils.lerp(v,[8,10,11][k],dot));}
  return{rgb:rgb.map(v=>C(v+grain*1.4,9,235)),h,rf};
 };
 // Bake the spatial corrections into each original face-varying UV chart.
 const {p,n,uv,indices}=mesh;
 for(let f=0;f<indices.length;f+=3){const ids=indices.slice(f,f+3),a=ids.map(i=>[uv[2*i]*(size-1),uv[2*i+1]*(size-1)]),area=(a[1][0]-a[0][0])*(a[2][1]-a[0][1])-(a[1][1]-a[0][1])*(a[2][0]-a[0][0]);if(Math.abs(area)<1e-9)continue;const minX=C(Math.floor(Math.min(...a.map(v=>v[0]))),0,size-1),maxX=C(Math.ceil(Math.max(...a.map(v=>v[0]))),0,size-1),minY=C(Math.floor(Math.min(...a.map(v=>v[1]))),0,size-1),maxY=C(Math.ceil(Math.max(...a.map(v=>v[1]))),0,size-1);
  for(let Y=minY;Y<=maxY;Y++)for(let X=minX;X<=maxX;X++){const b=((a[1][0]-X)*(a[2][1]-Y)-(a[1][1]-Y)*(a[2][0]-X))/area,c=((a[2][0]-X)*(a[0][1]-Y)-(a[2][1]-Y)*(a[0][0]-X))/area,d=1-b-c;if(Math.min(b,c,d)<-.001)continue;const k=Y*size+X,w=[b,c,d],v=[0,0,0],no=[0,0,0];for(let q=0;q<3;q++)for(let j=0;j<3;j++){v[j]+=p[ids[q]*3+j]*w[q];no[j]+=n[ids[q]*3+j]*w[q];}let sourceIndex=k;if(mesh.sampleUV){let su=0,sv=0;for(let q=0;q<3;q++){su+=mesh.sampleUV[ids[q]*2]*w[q];sv+=mesh.sampleUV[ids[q]*2+1]*w[q];}sourceIndex=(C(Math.round(sv*(size-1)),0,size-1)*size+C(Math.round(su*(size-1)),0,size-1));}if(designs[id].source==='minke'&&X<size/2&&Y<size/2){const angle=(Y/(size-1)-.002)/.496*Math.PI*2-Math.PI;no[0]=0;no[1]=Math.cos(angle);no[2]=Math.sin(angle);}const result=get(...v,...no,orig?Array.from(orig.subarray(sourceIndex*3,sourceIndex*3+3)):[80,86,91]);color.set(result.rgb,k*3);height[k]=result.h;rough.set([0,result.rf*255,0],k*3);valid[k]=1;}
 }
 const normal=Buffer.alloc(N*3,Buffer.from([128,128,255]));for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){const i=y*size+x;if(!valid[i])continue;const dx=(height[i-1]-height[i+1])*size*.14,dy=(height[i-size]-height[i+size])*size*.14,base=originalNormal&&!['caperea-marginata','grampus-griseus'].includes(id)?Array.from(originalNormal.subarray(i*3,i*3+3)).map((v,k)=>(v/255*2-1)*(k===2?1:.45)):[0,0,1],v=new T.Vector3(base[0]+dx,base[1]+dy,Math.max(.35,base[2])).normalize();normal.set(v.toArray().map(v=>(v*.5+.5)*255),i*3);}
 // Pad charts with nearest edge texels to avoid dark seams under filtering.
 for(let pass=0;pass<8;pass++){const add=[];for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){const i=y*size+x;if(valid[i])continue;const j=[i-1,i+1,i-size,i+size].find(j=>valid[j]);if(j!==undefined)add.push([i,j]);}for(const[i,j]of add){for(const a of[color,normal,rough])a.copy(a,i*3,j*3,j*3+3);valid[i]=1;}}
 return{color:await sharp(color,{raw:{width:size,height:size,channels:3}}).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toBuffer(),normal:await sharp(normal,{raw:{width:size,height:size,channels:3}}).resize(2048,2048).png().toBuffer(),rough:await sharp(rough,{raw:{width:size,height:size,channels:3}}).resize(1024,1024).png().toBuffer(),size};
}
const registry={version:'0.6.77',models:{},profiles:{}},proof={version:'0.6.77',models:{}},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const[id,design]of Object.entries(designs)){
 if(process.env.CETACEAN_ONLY&&!process.env.CETACEAN_ONLY.split(',').includes(id)){const old=JSON.parse(fs.readFileSync('cetaceans-assets-v0677.json')),previous=JSON.parse(fs.readFileSync('cetaceans-source-v0677.json'));registry.profiles[id]=old.profiles[id];if(id!=='balaenoptera-brydei')registry.models[id]=old.models[id];proof.models[id]=previous.models[id];continue;}
 const source=sources[design.source],raw=JSON.parse(fs.readFileSync(dir+design.source+'-bake.json'))[0],normalized=normalize(raw,design.source),sculpted=sculpt(refine(normalized,['pilot','fin','risso'].includes(design.source)?0:2),id),mesh=design.source==='minke'?splitMinkeCharts(sculpted):sculpted,src=await io.read(source.file),maps=await atlas(mesh,id,src.getRoot().listMaterials()[0]);
 const doc=new Document(),buffer=doc.createBuffer(),acc=(name,type,a)=>doc.createAccessor(name).setType(type).setArray(a).setBuffer(buffer),mat=doc.createMaterial('Licensed source UV; disclosed species correction').setMetallicFactor(0).setRoughnessFactor(1).setDoubleSided(false);
 for(const[k,setter,mime]of[['color','setBaseColorTexture','image/jpeg'],['normal','setNormalTexture','image/png'],['rough','setMetallicRoughnessTexture','image/png']])mat[setter](doc.createTexture(id+' '+k).setImage(maps[k]).setMimeType(mime));mat.setNormalScale(.33);
 const prim=doc.createPrimitive().setAttribute('POSITION',acc('Source-derived surface','VEC3',new Float32Array(mesh.p))).setAttribute('NORMAL',acc('Smooth normals','VEC3',new Float32Array(mesh.n))).setAttribute('TEXCOORD_0',acc(design.source==='minke'?'Replacement nonoverlapping body and appendage charts':'Retained source UV charts','VEC2',new Float32Array(mesh.uv))).setIndices(acc('Source-derived triangles','SCALAR',new Uint32Array(mesh.indices))).setMaterial(mat);
 doc.createScene().addChild(doc.createNode(id+' source-derived exterior').setMesh(doc.createMesh(id+' artist topology').addPrimitive(prim)));
 const attribution={source:'https://sketchfab.com/3d-models/'+source.uid,licenseUrl:'https://creativecommons.org/licenses/'+(source.license.includes('NC')?'by-nc':'by')+'/4.0/',changes:design.source==='minke'?'Source surface refined and sculpted; replacement nonoverlapping body and appendage UV charts, edited skin and authored motion':'Source-derived artist surface, edited skin and authored motion',author:source.author,license:source.license,url:'https://sketchfab.com/3d-models/'+source.uid,reference:design.reference,modifications:'Baked neutral source surface, normalized orientation; Loop refinement where stated, local species sculpt and UV-bound pigment/normal/roughness corrections. Authored external movement; no measured specimen or physiological simulation.'};doc.getRoot().setExtras(attribution);
 const bytes=await io.writeBinary(doc),file='model-cetacean-'+id+'-v0677.glb';fs.writeFileSync(file,bytes);const asset={...attribution,uid:source.uid,title:id+' · source-derived adult exterior',localFile:file,cetaceanSourceVersion:'0.6.77',sha256:sha(bytes),bytes:bytes.length,frequencyHz:design.freq,sourceFileSha256:sha(fs.readFileSync(source.file)),referenceOnly:design.reference!==source.uid};registry.profiles[id]=asset;if(id!=='balaenoptera-brydei')registry.models[id]=asset;
 proof.models[id]={...asset,sourceVertices:raw.p.length/3,sourceTriangles:raw.indices.length/3,vertices:mesh.p.length/3,triangles:mesh.indices.length/3,subdivisionLevels:['pilot','fin','risso'].includes(design.source)?0:2,maps:{color:[maps.size,maps.size],normal:[2048,2048],roughness:[1024,1024]},originalRigReplaced:['pilot','sei','risso'].includes(design.source),originalImagesRetainedUnchanged:false,minkeChartsSeparated:design.source==='minke',photographicScan:false};console.log(id,bytes.length,mesh.indices.length/3);
}
fs.writeFileSync('cetaceans-assets-v0677.json',JSON.stringify(registry,null,2)+'\n');fs.writeFileSync('cetaceans-source-v0677.json',JSON.stringify(proof,null,2)+'\n');
