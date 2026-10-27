import * as T from 'three';
import {noise,fade,hash} from './cnidarian-surface-tools.js';
const tau=2*Math.PI,V=(...p)=>new T.Vector3(...p);

// Original selected adult exterior, not a photograph-derived texture or a
// specimen fit. Naturalis and DORIS inform the four V-section frilled arms,
// selected 32 lappets and 24 adult tentacles in eight groups of three.
export function buildChrysaoraExterior(body,{add,merge,closedSweep,shell,colour}){
 const radius=.90,height=.30,cream=new T.Color('#e6ddc5'),brown=new T.Color('#80502e'),gold=new T.Color('#bf9761');
 const bell=shell((u,a,inner)=>{const lobe=(1-Math.cos(a*32))*.5,radial=radius*Math.sin(u*Math.PI/2)*(1-.030*lobe*u**14)-(inner?.006*u:0),y=height*Math.cos(u*Math.PI/2)-.030*lobe*u**12-(inner?.017+.038*(1-u*u):0);return[Math.cos(a)*radial,y,Math.sin(a)*radial];},56,256);
 const bm=add(body,bell,'#e6ddc5','closed-exumbrella-subumbrella-and-margin',.80,true);
 colour(bm,(c,x,y,z)=>{const r=Math.hypot(x,z)/radius,a=Math.atan2(z,x),sector=((a/tau*16)%1+1)%1,branch=.10+.26*fade(r,.24,.88),dist=Math.min(Math.abs(sector-(.5-branch)),Math.abs(sector-(.5+branch))),jitter=.012*(noise(x*23+4,z*23,y*17)-.5),line=(1-fade(dist+jitter,.044,.105))*fade(r,.09,.22)*(1-fade(r,.985,1)),mottle=noise(x*29+6,y*19,z*29);c.copy(cream).lerp(gold,.07+.12*mottle).lerp(brown,line*(.83+.16*noise(x*11,z*11,2)));c.lerp(brown,fade(r,.965,.998)*(.32+.12*noise(x*13,z*17,7)));c.multiplyScalar(.96+.055*mottle);},(x,y,z)=>.62+.30*fade(Math.hypot(x,z)/radius,.72,1));bm.material.roughness=.22;
 const supports=closedSweep((u,a,center)=>{const y=.255-.31*u,r=(.085+.030*Math.sin(u*Math.PI))*(1+.20*Math.cos(a*4));return center?[0,y,0]:[r*Math.cos(a),y,r*Math.sin(a)];},40,40);
 const sm=add(body,supports,'#ddd0ab','connected-central-manubrial-exterior',.61);colour(sm,(c,x,y,z)=>c.copy(cream).lerp(gold,.16+.12*noise(x*29,y*37,z*29)));
 const arms=[];
 for(let arm=0;arm<4;arm++){
  const a=arm*tau/4+.10,radial=V(Math.cos(a),0,Math.sin(a)),side=V(-Math.sin(a),0,Math.cos(a)),at=(r,y,s=0)=>radial.clone().multiplyScalar(r).addScaledVector(side,s).add(V(0,y,0)),length=1.90+.13*hash(arm,2),points=[at(.07,.05),at(.10,-.20),at(.16,-.52,.025),at(.23,-.86,.05),at(.33,-1.20,.04),at(.44,-1.53,-.04),at(.53,-length+.07,-.10),at(.42,-length-.10,-.08),at(.30,-length+.02,0)];
  const curve=new T.CatmullRomCurve3(points),N=440;
  arms.push(closedSweep((u,v,center)=>{const q=curve.getPointAt(u);if(center)return q.toArray();const tangent=curve.getTangentAt(u),twist=.44*Math.sin(u*7+arm)*u,across=side.clone().multiplyScalar(Math.cos(twist)).addScaledVector(radial,Math.sin(twist)),normal=tangent.clone().cross(across).normalize(),edge=Math.cos(v),envelope=(.48+.52*Math.sin(Math.PI*(.035+.93*u))**.70)*(1-.60*fade(u,.80,1)),width=(.165+.025*hash(arm,5))*envelope*(1+.055*Math.sin(u*43+arm)+.03*Math.sin(u*89+arm*2)),ruffle=(.024*Math.sin(u*169+edge*8+arm+8*noise(u*18,edge*4,arm))+.015*Math.sin(u*327+edge*17+arm*2+5*noise(u*27,edge*6,arm+2)))*(.65+.55*noise(u*23,edge*5,arm))*Math.abs(edge)**2,crease=.050*envelope*(Math.sqrt(edge*edge+.025)-.42),thickness=.006+.002*Math.sin(u*27+arm);return q.addScaledVector(across,width*edge).addScaledVector(normal,crease+thickness*Math.sin(v)+ruffle).toArray();},N,40));
 }
 const am=add(body,merge(arms),'#e3d6b9','four-closed-v-section-frilled-oral-arms',.87),uv=am.geometry.attributes.uv;
 colour(am,(c,x,y,z,i)=>{const edge=fade(Math.abs(Math.cos(uv.getY(i)*tau)),.50,.98),patch=noise(x*27+8,y*29,z*23);c.set('#e6ddc8').lerp(gold,.045+.16*patch+.10*edge).multiplyScalar(.95+.07*noise(x*61,y*59,z*67));},(x,y,z,i)=>.73+.24*fade(Math.abs(Math.cos(uv.getY(i)*tau)),.7,1));am.material.roughness=.28;
 const tentacles=[],attachments=[];
 for(let i=0;i<24;i++){
  const octant=Math.floor(i/3),a=octant*tau/8+(i%3-1)*.185+tau/32,lobe=(1-Math.cos(a*32))*.5,r=radius*(1-.030*lobe),y0=-.030*lobe,x=Math.cos(a)*r,z=Math.sin(a)*r,length=1.94,phase=i*2.39996,pts=Array.from({length:31},(_,j)=>{const u=j/30,drift=.17*u*u,turn=.15*Math.sin(u*5+phase)*u*u,sideways=.26*Math.sin(u*7+phase*.7)*u**1.4+.045*Math.sin(u*17+phase)*u*u;return V(x+Math.cos(a)*drift-Math.sin(a)*sideways,y0-length*u+turn,z+Math.sin(a)*drift+Math.cos(a)*sideways);}),curve=new T.CatmullRomCurve3(pts),N=76,frames=curve.computeFrenetFrames(N,false);
  tentacles.push(closedSweep((u,v,center)=>{const q=curve.getPointAt(u);if(center)return q.toArray();const n=Math.round(u*N),rr=.0010+.0041*(1-u)**.68;return q.addScaledVector(frames.normals[n],rr*Math.cos(v)).addScaledVector(frames.binormals[n],rr*.83*Math.sin(v)).toArray();},N,8));attachments.push({octant,angle:a,length,position:[x,y0,z]});
 }
 const tm=add(body,merge(tentacles),'#ded3b8','anchored-tapered-marginal-tentacles',.84);colour(tm,(c,x,y,z)=>c.set('#ded5bd').lerp(gold,.09+.14*noise(x*19,y*41,z*17)).multiplyScalar(.95+.06*noise(x*41,y*47,z*37)));tm.material.roughness=.20;
 body.userData.chrysaoraOralField={version:'0.6.45',oralArms:4,section:'selected closed V-section exterior',selectedLappets:32,marginalTentacles:24,groups:8,tentaclesPerGroup:3,attachments,measured:false,canalsResolved:false,pigment:'original spatial vertex fields; no photographic projection'};
 return 24;
}

// One finite regional contraction/recovery and delayed appendage flexion study.
// A shared coordinate field preserves coincident attachments; no root swimming,
// fitted pulse rate, force, prey transfer or muscle/fluid simulation is claimed.
export function chrysaoraDeform(x,y,z,t,working){const time=T.MathUtils.clamp(t,0,8);if(!working||time===0||time>=8)return[x,y,z];const e=Math.sin(Math.PI*time/8)**2,phase=time%3.8,contraction=phase<.78?(1-Math.cos(phase/.78*Math.PI))*.5:phase<2.9?(1+Math.cos((phase-.78)/2.12*Math.PI))*.5:0,pulse=e*contraction,r=Math.hypot(x,z),margin=fade(r,.25,.90),below=fade(-y,.05,1.95),nearBell=Math.exp(-Math.abs(y)*4),scale=1-.10*pulse*margin*nearBell,lag=.055*e*Math.sin(time*1.45+y*2.5)*below;return[x*scale+lag,y+.080*pulse*margin*nearBell+.025*e*Math.sin(time*1.45+y*3.1)*below,z*scale+.63*lag];}
