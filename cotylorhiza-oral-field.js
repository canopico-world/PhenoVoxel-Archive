import * as T from 'three';

// Original MIT external study. Motta2025 live Figure1 and S5 guide qualitative
// branching and regional flexibility. No specimen fit or flow solver is used.
const V=(...a)=>new T.Vector3(...a),tau=2*Math.PI,fade=T.MathUtils.smoothstep;
const hash=(x,y=0)=>{const v=Math.sin(x*127.1+y*311.7+6.31)*43758.5453;return v-Math.floor(v);};
const cream=new T.Color('#e5dec4'),brown=new T.Color('#846641'),violet=new T.Color('#71639d');
function noise(x,y,z){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),f=q=>q*q*(3-2*q),u=f(x-a),v=f(y-b),w=f(z-c),h=(i,j,k)=>hash(i+j*31,k),mix=T.MathUtils.lerp;return mix(mix(mix(h(a,b,c),h(a+1,b,c),u),mix(h(a,b+1,c),h(a+1,b+1,c),u),v),mix(mix(h(a,b,c+1),h(a+1,b,c+1),u),mix(h(a,b+1,c+1),h(a+1,b+1,c+1),u),v),w);}
export function cotylorhizaPigment(c,x,y,z,oral=false){const broad=noise(x*11+2,y*13+5,z*11),fine=noise(x*109,y*127,z*103),r=Math.hypot(x,z)/.94;c.copy(cream);if(oral)c.lerp(brown,.30+.60*fade(broad*.7+fine*.3,.23,.78));else{c.lerp(new T.Color('#bf8138'),Math.exp(-((r/.40)**4))*.86);const radial=Math.sin(Math.atan2(z,x)*91+noise(x*9,0,z*9)*3+r*5);c.lerp(brown,(.025+.045*fade(radial,.55,.95))*fade(r,.46,.86));}return c.multiplyScalar(.93+.10*fine);}

export function buildCotylorhizaExterior(body,{add,merge,closedSweep,shell,colour}){
 const bell=shell((u,a,inner)=>{const q=Math.sin(u*Math.PI/2),edge=fade(q,.78,1),lobe=.0055*(1-Math.cos(a*80+.08*Math.sin(a*7)))*edge**3,r=.94*q*(1-lobe),h=.035+.19*Math.sqrt(Math.max(0,1-q*q))+.22*Math.exp(-((q/.40)**2.6)),thickness=.045+.045*(1-q)**.7,relief=.0022*Math.sin(a*91+q*7)*edge;return[r*Math.cos(a),h-(inner?thickness:0)+relief,r*Math.sin(a)];},56,224);
 const bm=add(body,bell,'#e5d5aa','closed-exumbrella-subumbrella-and-margin',.84);colour(bm,(c,x,y,z)=>cotylorhizaPigment(c,x,y,z),(x,y,z)=>.63+.34*Math.exp(-((Math.hypot(x,z)/.46)**4)));bm.material.roughness=.22;bm.material.depthWrite=true;
 const trunks=[],forks=[],folds=[],clubs=[],longClubs=[],branchOrigins=[];
 function strand(points,width,thickness,N=20){const curve=new T.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(N,false);return closedSweep((u,a,center)=>{const q=curve.getPointAt(u);if(center)return q.toArray();const i=Math.round(u*N),shape=.26+.74*Math.sin((.06+.88*u)*Math.PI)**.65;return q.addScaledVector(frames.normals[i],width*shape*Math.cos(a)).addScaledVector(frames.binormals[i],thickness*shape*Math.sin(a)).toArray();},N,12);}
 function club(origin,dir,length,radius,seed){const axis=dir.clone().normalize(),across=V(-axis.z,0,axis.x);if(across.length()<.01)across.set(1,0,0);across.normalize();const other=axis.clone().cross(across).normalize();return closedSweep((u,a,center)=>{const q=origin.clone().addScaledVector(axis,length*u).addScaledVector(across,.012*Math.sin(u*Math.PI)*Math.sin(seed));if(center)return q.toArray();const cap=u<.65?0:Math.sin((u-.65)/.35*Math.PI/2),r=.003+radius*cap;return q.addScaledVector(across,r*Math.cos(a)).addScaledVector(other,r*Math.sin(a)*(1+.08*Math.sin(a*5+seed)));},24,16);}
 for(let arm=0;arm<8;arm++){
  const a=arm*tau/8+.025*(hash(arm)-.5),dir=V(Math.cos(a),0,Math.sin(a)),across=V(-dir.z,0,dir.x),base=V(dir.x*.08,.01,dir.z*.08),split=dir.clone().multiplyScalar(.28).add(V(0,-.17-.035*hash(arm,1),0));
  trunks.push(strand([base,dir.clone().multiplyScalar(.17).add(V(0,-.08,0)),split],.043,.025,28));
  for(let j=0;j<12;j++){
   const u=.20+.77*j/12,q=base.clone().lerp(split,u),side=j%2?1:-1,d=across.clone().multiplyScalar(side*.8).addScaledVector(dir,.25).add(V(0,-.6,0)).normalize(),to=q.clone().addScaledVector(d,.095+.055*hash(j,arm));
   forks.push(strand([q,q.clone().lerp(to,.5),to],.035,.019,16));
   for(let k=0;k<3;k++){const at=q.clone().lerp(to,.35+k*.2),fdir=dir.clone().multiplyScalar(k%2?-.5:.65).add(V(0,-.7,0)).normalize(),end=at.clone().addScaledVector(fdir,.055).addScaledVector(dir,.065);folds.push(strand([at,end],.022,.008,12));if(k===1)clubs.push({geo:club(end,end.clone().sub(at).normalize(),.035,.012,arm*57+j),seed:arm*57+j});}
  }

  for(let fork=0;fork<2;fork++){
   const sign=fork?1:-1,length=.31+.08*hash(arm,fork+5),end=dir.clone().multiplyScalar(.49+.045*hash(arm,fork+2)).addScaledVector(across,sign*.18).add(V(0,-.24-length,0)),curve=new T.CatmullRomCurve3([split,split.clone().lerp(end,.46).addScaledVector(dir,.08),end]);
   forks.push(strand(curve.getPoints(10),.033,.022,30));
   for(let j=0;j<12;j++){
    const u=.04+.91*(j+.35*hash(j,arm*2+fork))/12,q=curve.getPointAt(u),side=j%2?1:-1,reach=.15+.085*hash(j+2,arm+fork),branchDir=across.clone().multiplyScalar(side*.72).addScaledVector(dir,.45).add(V(0,-.7,0)).normalize(),tip=q.clone().addScaledVector(branchDir,reach);
    forks.push(strand([q,q.clone().lerp(tip,.5).addScaledVector(dir,.016),tip],.022,.013,14));branchOrigins.push(q.toArray());
    for(let k=0;k<6;k++){
     const seed=arm*1000+fork*100+j*7+k,w=.10+k*.15,at=q.clone().lerp(tip,w),d=dir.clone().multiplyScalar(k%2?.65:-.50).addScaledVector(across,side*.27).add(V(0,-.8,0)).normalize(),len=.026+.034*hash(seed,8),to=at.clone().addScaledVector(d,len).addScaledVector(dir,.065);
     folds.push(closedSweep((t,v,center)=>{const point=at.clone().lerp(to,t).addScaledVector(across,.009*Math.sin(t*5+seed)*t);if(center)return point.toArray();const wid=.003+(.010+.007*hash(seed,3))*Math.sin(t*Math.PI)**.65;return point.addScaledVector(dir,wid*Math.cos(v)*(1+.28*Math.sin(t*23+seed))).addScaledVector(across,.004*Math.sin(v)+.004*Math.sin(t*31+seed)*Math.cos(v)**2).toArray();},12,10));
     if(k%2===0){const direction=to.clone().sub(at).normalize().addScaledVector(across,.15*(hash(seed,4)-.5));clubs.push({geo:club(to,direction,.025+.025*hash(seed,6),.010+.009*hash(seed,2),seed),seed});}
    }
   }
   for(let j=0;j<2;j++){const q=curve.getPointAt(.28+j*.43),d=dir.clone().multiplyScalar(.35).addScaledVector(across,sign*.4).add(V(0,-1,0));longClubs.push({geo:club(q,d,.13+.07*hash(arm,j+9),.022+.008*hash(arm,j+7),arm*7+fork*2+j),seed:arm*7+fork*2+j});}
  }
 }
 const trunk=add(body,merge([...trunks,...forks]),'#d2c4a1','eight-branched-volumetric-oral-arms',1);colour(trunk,(c,x,y,z)=>cotylorhizaPigment(c,x,y,z,true));
 const fringe=add(body,merge(folds),'#8a714e','dense-folded-oral-branchlets',1);colour(fringe,(c,x,y,z)=>cotylorhizaPigment(c,x,y,z,true));
 // Clubs have a slender pedicle and a flared closed terminal exterior. No claim
 // that every endpoint is an open mouthlet; blind-ended clubs occur in source.
 const white=[],purple=[];for(const item of[...clubs,...longClubs]){(hash(item.seed,17)<.27?purple:white).push(item.geo);}
 for(const [list,colourBase,name]of[[white,'#e6e2cf','selected-white-terminal-clubs'],[purple,'#74629e','selected-violet-terminal-clubs']]){const mesh=add(body,merge(list),colourBase,name,1),uv=mesh.geometry.attributes.uv;colour(mesh,(c,x,y,z,i)=>{const n=noise(x*27,y*29,z*25),terminal=fade(uv.getX(i),.58,.84);c.copy(cream).lerp(name.includes('violet')?violet:new T.Color('#f0eee0'),terminal*(.78+.20*n)).multiplyScalar(.93+.08*noise(x*117,y*131,z*113));});}
 const disc=closedSweep((u,a,center)=>{const y=.30-.40*u,r=.14+.065*Math.sin(u*Math.PI*.75);return center?[0,y,0]:[r*Math.cos(a),y,r*Math.sin(a)];},32,48),dm=add(body,disc,'#e5dfc9','shared-oral-disc',.39);colour(dm,(c,x,y,z)=>c.set('#e4ddc4').multiplyScalar(.94+.06*noise(x*30,y*31,z*29)));
 body.userData.cotylorhizaOralField={version:'0.6.42',oralArms:8,selectedDistalForks:16,selectedBranchesPerFork:12,selectedSmallClubs:clubs.length,selectedLongClubs:longClubs.length,branchOrigins,measured:false,canalsResolved:false};
}

// Continuous coordinate deformation retains equal attachment coordinates. The
// central dome stays fixed; only the distal crown/rim flexes appreciably. No
// translation, propulsion, fluid force, actual pulse rate or feeding is solved.
export function cotylorhizaDeform(x,y,z,t,working){const time=T.MathUtils.clamp(t,0,8);if(!working||time===0||time>=8)return[x,y,z];const cycle=time%3.1,contraction=cycle<.75?(1-Math.cos(cycle/.75*Math.PI))*.5:cycle<2.1?(1+Math.cos((cycle-.75)/1.35*Math.PI))*.5:0,envelope=Math.sin(Math.PI*time/8)**2,pulse=contraction*envelope,r=Math.hypot(x,z),crown=fade(r,.34,.88),oral=fade(-y,.04,.58),weight=y>0?crown:oral*.45,scale=1-.075*pulse*weight,lag=.014*envelope*Math.sin(time*1.7+y*4)*oral;return[x*scale+lag,y-.09*pulse*crown*(y>=0?1:Math.exp(y*4))+.012*envelope*Math.sin(time*1.5+y*5)*oral,z*scale+lag*.4];}
