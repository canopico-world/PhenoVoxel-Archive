import * as T from 'three';

// MIT original exterior. Kerwin et al.2025 Figure1 guides qualitative branching,
// not fitted dimensions, a universal colour morph or a measured motor programme.
const V=(...x)=>new T.Vector3(...x),tau=Math.PI*2,palePigment=new T.Color('#ded7b2'),brownPigment=new T.Color('#624326');
const hash=(x,y=0)=>{const a=Math.sin(x*127.1+y*311.7+4.71)*43758.5453;return a-Math.floor(a);};
const fade=T.MathUtils.smoothstep;
function noise(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),f=q=>q*q*(3-2*q),a=f(x-ix),b=f(y-iy),c=f(z-iz),h=(i,j,k)=>hash(i+j*31,k);return T.MathUtils.lerp(T.MathUtils.lerp(T.MathUtils.lerp(h(ix,iy,iz),h(ix+1,iy,iz),a),T.MathUtils.lerp(h(ix,iy+1,iz),h(ix+1,iy+1,iz),a),b),T.MathUtils.lerp(T.MathUtils.lerp(h(ix,iy,iz+1),h(ix+1,iy,iz+1),a),T.MathUtils.lerp(h(ix,iy+1,iz+1),h(ix+1,iy+1,iz+1),a),b),c);}
export function cassiopeaPigment(c,x,y,z,oral=false){const broad=noise(x*8+3,y*9+5,z*8),fine=noise(x*84,y*92,z*81);c.copy(palePigment).lerp(brownPigment,(oral?.35:.10)+(oral?.62:.50)*fade(broad*.65+fine*.35,.25,.78));c.lerp(palePigment,fade(fine,.69,.85)*.88);c.multiplyScalar(.93+.12*noise(x*31,y*37,z*29));return c;}

export function buildCassiopeaOralField(body,{add,merge,closedSweep,tubeGeometry,colour}){
 const axes=[],branches=[],frills=[],laplets=[],anchors=[],branchCount=12;
 // Four selected pairs. Closed branch surfaces intersect inside parent tissue;
 // these external overlaps are not a histological union or a resolved lumen.
 for(let arm=0;arm<8;arm++){
  const pair=Math.floor(arm/2),side=arm%2?1:-1,angle=pair*tau/4+side*.37+.025*(hash(arm)-.5),length=.64+.10*hash(arm,4),height=.17+.06*hash(arm,5),dir=V(Math.cos(angle),0,Math.sin(angle)),across=V(-dir.z,0,dir.x);
  const axis=u=>dir.clone().multiplyScalar(.025+length*u).addScaledVector(across,.025*Math.sin(u*5+arm)*u).add(V(0,-.025-height*Math.sin(u*Math.PI*.72),0));
  axes.push(closedSweep((u,a,center)=>{const q=axis(u);if(center)return q.toArray();const width=.022+.065*Math.sin(u*Math.PI)**.65;return q.addScaledVector(across,width*Math.cos(a)*(1+.12*Math.sin(u*37+arm))).add(V(0,.014*Math.sin(a),0)).toArray();},36,12));
  for(let j=0;j<branchCount;j++){
   const u=.04+.89*(j+.27*hash(j,arm))/branchCount,s=j%2?1:-1,start=axis(u),reach=(.15+.09*hash(j+2,arm))*(.55+.45*Math.sin(u*Math.PI)),rise=.035+.05*hash(j,arm+7),end=start.clone().addScaledVector(across,reach*s).addScaledVector(dir,.025).add(V(0,-rise,0));
   branches.push(closedSweep((t,a,center)=>{const q=start.clone().lerp(end,t).add(V(0,-.018*Math.sin(t*Math.PI),0));if(center)return q.toArray();const width=.009+.022*Math.sin(t*Math.PI)**.6;return q.addScaledVector(dir,width*Math.cos(a)*(1+.14*Math.sin(t*23+j))).add(V(0,.008*Math.sin(a),0)).toArray();},14,10));
   for(let k=0;k<8;k++){
    const w=.08+k*.12,q=start.clone().lerp(end,w),seed=arm*101+j*7+k,reachDir=across.clone().multiplyScalar(s*.4).addScaledVector(dir,(k%2?1:-1)*.8).normalize(),leafLength=.022+.035*hash(seed,3),leafWidth=.007+.011*hash(seed,8);
    frills.push(closedSweep((t,a,center)=>{const point=q.clone().addScaledVector(reachDir,leafLength*t).add(V(0,-.018*t-.038*Math.sin(t*Math.PI*.7),0));if(center)return point.toArray();const width=(.0025+leafWidth*Math.sin(t*Math.PI)**.65)*(1+.28*Math.sin(t*22+seed));return point.addScaledVector(V(-reachDir.z,0,reachDir.x),width*Math.cos(a)).add(V(0,(.003+.002*Math.sin(t*Math.PI))*Math.sin(a)+.0035*Math.sin(t*31+seed)*Math.cos(a)**2,0)).toArray();},10,8));
   }
  }
  // Sparse larger foliaceous oral appendages (laplets), distinct from marginal
  // lappets. Their pigment does not identify a photosymbiont type or function.
  for(let j=0;j<2;j++){
   const u=.30+.42*j+.08*hash(arm,j),q=axis(u),lean=across.clone().multiplyScalar(side*(.02+.03*hash(arm,j+1))),len=.13+.10*hash(arm,j+4),width=.016+.014*hash(arm,j+8);
   laplets.push(closedSweep((t,a,center)=>{const point=q.clone().addScaledVector(lean,t*t).addScaledVector(dir,.045*Math.sin(t*Math.PI)).add(V(0,-len*t,0));if(center)return point.toArray();return point.addScaledVector(dir,(.002+width*Math.sin(t*Math.PI)**.7)*Math.cos(a)).addScaledVector(across,(.003+.005*Math.sin(t*Math.PI))*Math.sin(a)).toArray();},24,12));anchors.push(q.toArray());
  }
 }
 const arms=add(body,merge([...axes,...branches]),'#b59b73','eight-branched-volumetric-oral-arms',.94);colour(arms,(c,x,y,z)=>cassiopeaPigment(c,x,y,z,false));
 const fringe=add(body,merge(frills),'#916d45','irregular-digitate-oral-fringes',.96);colour(fringe,(c,x,y,z)=>{cassiopeaPigment(c,x,y,z,true);c.lerp(brownPigment,.38);const fleck=noise(x*135,y*141,z*133);c.lerp(palePigment,fade(fleck,.64,.79)*.80);});
 const appendages=add(body,merge(laplets),'#66765c','selected-symbiotic-oral-vesicles',.92);colour(appendages,(c,x,y,z)=>{const n=noise(x*13,y*11,z*13);c.set('#cdc8ae').lerp(new T.Color('#607f77'),fade(n,.48,.85)).multiplyScalar(.86+.18*noise(x*110,y*101,z*103));});
 const disc=add(body,closedSweep((u,a,center)=>{const y=.18-.23*u,r=.10+.10*Math.sin(u*Math.PI*.65);return center?[0,y,0]:[Math.cos(a)*r,y,Math.sin(a)*r];},24,40),'#b6a98a','shared-oral-disc',.22);colour(disc,(c,x,y,z)=>cassiopeaPigment(c,x,y,z,true));
 body.userData.cassiopeaOralField={pairedAxes:4,oralArms:8,selectedBranchesPerArm:branchCount,selectedFrillsPerBranch:8,selectedFoliaceousAppendages:16,branchAnchors:anchors,measured:false,version:'0.6.41'};return arms;
}

// One shared smooth field keeps equal tissue coordinates together. Whole-root
// transforms and basal apex remain fixed; no adhesion or fluid solver is used.
export function cassiopeaDeform(x,y,z,t,working){
 const time=T.MathUtils.clamp(t,0,8);if(!working||time===0||time>=8)return[x,y,z];
 const cycle=time%3.2,contraction=cycle<.8?(1-Math.cos(cycle/.8*Math.PI))*.5:cycle<2.2?(1+Math.cos((cycle-.8)/1.4*Math.PI))*.5:0,envelope=Math.sin(Math.PI*time/8)**2;
 const pulse=contraction*envelope,r=Math.hypot(x,z),rim=fade(r,.16,.94),oral=fade(-y,.035,.30),tip=oral*fade(r,.10,.70),twist=.025*envelope*Math.sin(time*1.3+r*3)*tip,a=Math.atan2(z,x)+twist,scale=1-.085*pulse*rim;
 return[Math.cos(a)*r*scale,y+.045*pulse*rim*(y>=0?1:Math.exp(y*2))+.018*envelope*Math.sin(time*1.7+r*5)*tip,Math.sin(a)*r*scale];
}
