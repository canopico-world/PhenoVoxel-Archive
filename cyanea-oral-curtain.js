import * as T from 'three';
import {noise,fade,hash} from './cnidarian-surface-tools.js';
const tau=2*Math.PI,V=(...p)=>new T.Vector3(...p),radius=1.02,height=.39;

// Selected Atlantic adult exterior. Counts, proportions and spatial pigment
// are authored, not a fitted specimen. Inward tentacle rows, the connecting
// oral curtain and separate gonadal folds must not become a marginal ring or
// a single solid ribbed sack. Closed overlapping pieces do not resolve histology.
export function cyaneaBellPoint(u,a,inner=false){
 const sector=a/(tau/8),deep=Math.exp(-((Math.sin(sector*Math.PI)/.22)**2)),shallow=Math.exp(-((Math.cos(sector*Math.PI)/.30)**2)),edge=fade(u,.64,1),cleft=.145*deep+.068*shallow,r=radius*Math.sin(u*Math.PI/2)*(1-cleft*edge),lappet=.020*Math.sin(a*16+.35)*edge,y=height*Math.cos(u*Math.PI/2)-.085*edge+.10*deep*edge+.032*shallow*edge+lappet,thickness=.018+.145*(1-fade(u,.65,.99));
 return[r*Math.cos(a),y-(inner?thickness:0),r*Math.sin(a)];
}

export function buildCyaneaExterior(body,{add,merge,closedSweep,shell,colour}){
 const cream=new T.Color('#e7dcc5'),gold=new T.Color('#cb934c'),copper=new T.Color('#aa603a');
 const bell=add(body,shell(cyaneaBellPoint,64,320),'#e7dcc5','closed-exumbrella-subumbrella-and-margin',.51,true);
 colour(bell,(c,x,y,z)=>{const r=Math.hypot(x,z)/radius,a=Math.atan2(z,x),irregular=noise(x*11+8,y*13,z*11),central=(1-fade(r,.38,.83))*.38,radial=.5+.5*Math.cos(a*16+.14*Math.sin(r*21+a*3));c.copy(cream).lerp(gold,central+.13*irregular+.07*radial*fade(r,.32,.78)).multiplyScalar(.97+.04*noise(x*37,y*29,z*37));},(x,y,z)=>.48+.42*fade(Math.hypot(x,z)/radius,.73,.99));bell.material.roughness=.20;
 const ring=closedSweep((u,a,cap)=>{const y=.23-.27*u,r=.14+.035*Math.sin(u*Math.PI);return cap?[0,y,0]:[r*Math.cos(a),y,r*Math.sin(a)];},32,48);
 const rm=add(body,ring,'#c48a50','thickened-manubrial-ring-exterior',.58);colour(rm,(c,x,y,z)=>c.copy(gold).lerp(copper,.12+.18*noise(x*27,y*21,z*27)));
 const arms=[];
 for(let arm=0;arm<4;arm++){
  const a=arm*tau/4+.16,radial=V(Math.cos(a),0,Math.sin(a)),side=V(-Math.sin(a),0,Math.cos(a)),length=1.19+.19*hash(arm,7),N=260;
  arms.push(closedSweep((u,v,cap)=>{const lateral=.055*Math.sin(u*6+arm)*u,rr=.10+.30*u+.065*Math.sin(u*6+arm)*u*u,q=radial.clone().multiplyScalar(rr).addScaledVector(side,lateral).add(V(0,.03-length*u,0));if(cap)return q.toArray();const twist=.60*Math.sin(u*6.3+arm)*u,across=side.clone().multiplyScalar(Math.cos(twist)).addScaledVector(radial,Math.sin(twist)),normal=radial.clone().multiplyScalar(Math.cos(twist)).addScaledVector(side,-Math.sin(twist)),edge=Math.cos(v),end=1-.66*fade(u,.78,1),width=(.18+.12*Math.sin(u*Math.PI*.88)**.7)*end*(1+.12*Math.sin(u*19+arm)+.07*Math.sin(u*47+arm*3)),ruffle=(.036*Math.sin(u*51+edge*7+arm+6*noise(u*13,edge*3,arm))+.017*Math.sin(u*113+edge*13+arm*2+4*noise(u*19,edge*4,arm+3)))*Math.abs(edge)**1.45,furrow=.065*(1-edge*edge)*end,thick=.007+.003*noise(u*31,edge*7,arm);return q.addScaledVector(across,width*edge).addScaledVector(normal,furrow+ruffle+thick*Math.sin(v)).toArray();},N,40));
 }
 const am=add(body,merge(arms),'#d7a265','four-closed-membranous-furrowed-oral-arms',.67),auv=am.geometry.attributes.uv;
 colour(am,(c,x,y,z,i)=>{const edge=fade(Math.abs(Math.cos(auv.getY(i)*tau)),.45,.99);c.copy(cream).lerp(gold,.32+.25*noise(x*19,y*23,z*17)).lerp(copper,.24*(1-edge)).multiplyScalar(.95+.08*noise(x*47,y*51,z*43));},(x,y,z,i)=>.58+.32*fade(Math.abs(Math.cos(auv.getY(i)*tau)),.55,.99));am.material.roughness=.24;
 // Four continuous folded sectors connect adjacent arm lips in the proximal
 // region; the open exterior grooves do not imply resolved food-canal lumens.
 const curtains=[];
 for(let sector=0;sector<4;sector++)curtains.push(closedSweep((u,v,cap)=>{const a=.16+sector*tau/4+u*tau/4,r=.25+.045*Math.sin(u*13+sector),depth=.58+.13*Math.sin(u*7+sector)+.045*Math.sin(u*29),q=V(r*Math.cos(a),.015-depth*.52,r*Math.sin(a));if(cap)return q.toArray();const vertical=depth*.52*Math.cos(v),ruffle=(.040*Math.sin(u*53+Math.cos(v)*3+sector+5*noise(u*13,Math.cos(v)*3,sector))+.018*Math.sin(u*131+sector*3+4*noise(u*27,Math.cos(v)*4,sector)))*(.35+.65*fade(-vertical,-.1,.2)),radial=r+ruffle+.008*Math.sin(v);return[radial*Math.cos(a),q.y+vertical,radial*Math.sin(a)];},180,30));
 const cm=add(body,merge(curtains),'#c9955e','connecting-folded-oral-curtain',.56);colour(cm,(c,x,y,z)=>c.copy(cream).lerp(gold,.35+.21*noise(x*37,y*23,z*29)).lerp(copper,.09+.10*noise(x*17,y*19,z*21)));
 const gonads=[];
 for(let i=0;i<4;i++){
  const a=.16+tau/8+i*tau/4,radial=V(Math.cos(a),0,Math.sin(a)),side=V(-Math.sin(a),0,Math.cos(a)),top=cyaneaBellPoint(.34,a,true)[1];
  gonads.push(closedSweep((u,v,cap)=>{const q=radial.clone().multiplyScalar(.36+.13*Math.sin(u*3.4+i*.3)).addScaledVector(side,.12*Math.sin(u*6.2+i)*u).add(V(0,top-(.65+.06*hash(i,6))*u,0));if(cap)return q.toArray();const w=(.055+.20*Math.sin((.07+.91*u)*Math.PI)**.75)*(1-.57*fade(u,.66,1))*(1+.17*Math.sin(u*17+i)+.07*Math.sin(u*39+i*2)),edge=Math.cos(v),fold=(.043*Math.sin(u*31+edge*5+i+7*noise(u*11,edge*3,i))+.017*Math.sin(u*83+edge*9+i*2+5*noise(u*17,edge*5,i+4)))*Math.abs(edge)**1.6;return q.addScaledVector(side,w*edge).addScaledVector(radial,.012*Math.sin(v)+fold).toArray();},170,32));
 }
 const gm=add(body,merge(gonads),'#b97d48','four-separate-selected-gonadal-folds',.57);colour(gm,(c,x,y,z)=>c.copy(gold).lerp(copper,.28+.25*noise(x*31,y*27,z*29)).lerp(cream,.15*noise(x*53,y*43,z*47)));
 const tentacles=[],attachments=[];
 for(let group=0;group<8;group++)for(let j=0;j<70;j++){
  const row=j%4,column=Math.floor(j/4),slots=row<2?18:17,a=group*tau/8+(column/(slots-1)-.5)*.27+.004*(hash(j,group)-.5),u0=.61+row*.052,q=V(...cyaneaBellPoint(u0,a,true)),length=2.12+1.43*hash(j+5,group+2),phase=hash(j+19,group)*tau,drift=.20+.20*hash(j,group+9),pts=Array.from({length:28},(_,k)=>{const u=k/27,side=.23*(Math.sin(u*8.1+phase)-Math.sin(phase))*u**.60+.065*Math.sin(u*19.7+phase*2)*u,r=drift*u*u+.08*(Math.sin(u*5+phase)-Math.sin(phase))*u;return q.clone().add(V(Math.cos(a)*r-Math.sin(a)*side,-length*u+.075*Math.sin(u*9+phase)*u*u,Math.sin(a)*r+Math.cos(a)*side));}),curve=new T.CatmullRomCurve3(pts),N=80,frames=curve.computeFrenetFrames(N,false);
  tentacles.push(closedSweep((u,v,cap)=>{const p=curve.getPointAt(u);if(cap)return p.toArray();const n=Math.round(u*N),r=.00070+.0020*(1-u)**.7;return p.addScaledVector(frames.normals[n],r*Math.cos(v)).addScaledVector(frames.binormals[n],r*.87*Math.sin(v)).toArray();},N,6));attachments.push({group,row,position:q.toArray(),u:u0,angle:a,longitudinalExtent:length});
 }
 const tm=add(body,merge(tentacles),'#e7ddc8','inward-layered-tentacle-groups',.77);colour(tm,(c,x,y,z)=>c.copy(cream).lerp(gold,.09+.10*noise(x*23,y*37,z*19)));tm.material.roughness=.19;
 body.userData.cyaneaOralCurtain={version:'0.6.46',oralArms:4,connectingCurtainSectors:4,separateGonadalFolds:4,tentacleGroups:8,tentaclesPerGroup:70,inwardRows:4,tentacleCount:560,attachments,measured:false,internalCanalsResolved:false,pigment:'original attached spatial vertex fields; no photograph projection'};
 return 560;
}

// One bounded authored contraction/recovery plus delayed appendage response.
// It is not the Norway animal's reconstructed trajectory or an imposed pulse
// rate. Shared coordinates retain coincident exterior attachments, not forces.
export function cyaneaDeform(x,y,z,t,working){
 const time=T.MathUtils.clamp(t,0,8);if(!working||time===0||time>=8)return[x,y,z];
 const e=Math.sin(Math.PI*time/8)**2,phase=time%3.6,c=phase<.85?(1-Math.cos(phase/.85*Math.PI))*.5:phase<3.05?(1+Math.cos((phase-.85)/2.20*Math.PI))*.5:0,p=e*c,r=Math.hypot(x,z),rim=fade(r,.22,1.02),near=Math.exp(-Math.max(0,-y-.10)*2.6),scale=1-.18*p*rim*near,below=fade(-y,.12,2.6),lag=.065*e*Math.sin(time*1.65+y*2.3)*below;
 return[x*scale+lag,y+.15*p*rim*near+.035*e*Math.sin(time*1.65+y*3.2)*below,z*scale+.61*lag];
}
