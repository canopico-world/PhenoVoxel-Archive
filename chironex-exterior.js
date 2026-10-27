import * as T from 'three';
import {V,TAU,fade,hash,noise,curvedTube} from './cnidarian-surface-tools.js';
// Qualitative Chironex fleckeri exterior. Selected counts and timing are unfitted.
export function buildChironexExterior(body,api){const{add,merge,closedSweep,shell,annulus,colour}=api,r=.53,h=.80,box=a=>1/(Math.abs(Math.cos(a))**6+Math.abs(Math.sin(a))**6)**(1/6),point=(u,a,inner=false)=>{const rr=r*Math.sin(u*Math.PI/2)*box(a)-(inner?.009*u:0),y=h*Math.cos(u*Math.PI/2)**.76-(inner?.029*(.25+.75*Math.cos(u*Math.PI/2)):0);return[rr*Math.cos(a),y,rr*Math.sin(a)];};
 const bell=add(body,shell(point,60,192),'#c9d7d4','closed-exumbrella-rounded-four-sided-wall',.31,true);colour(bell,(c,x,y,z)=>c.set('#c4d5d3').multiplyScalar(.98+.03*noise(x*17,y*21,z*17)));
 add(body,annulus((u,a,inner)=>{const rr=r*(.69+.31*u)*box(a);return[rr*Math.cos(a),-.018+.035*(1-u)**1.5-(inner?.009:0),rr*Math.sin(a)];},192),'#c7d7d3','cubozoan-velarium-open-annular-fold',.36,true);
 const pedalia=[],tentacles=[];for(let p=0;p<4;p++){const a=Math.PI/4+p*TAU/4,d=V(Math.cos(a),0,Math.sin(a)),side=V(-d.z,0,d.x),q=V(...point(1,a)),palmEnd=q.clone().addScaledVector(d,.22).add(V(0,-.21,0));
  pedalia.push(closedSweep((u,v,cap)=>{const c=q.clone().lerp(palmEnd,u);if(cap)return c.toArray();const width=.025+.075*Math.sin(u*Math.PI*.88)**.8;return c.addScaledVector(side,width*Math.cos(v)).addScaledVector(d,.016*Math.sin(v)).toArray();},36,24));
  for(let j=0;j<12;j++){const row=j%6,sg=j<6?-1:1,u=.32+.105*row,start=q.clone().lerp(palmEnd,u),end=start.clone().addScaledVector(side,sg*(.057+.018*row)).addScaledVector(d,.02+.015*row).add(V(0,-.055-.012*row,0));pedalia.push(curvedTube([start,start.clone().lerp(end,.40).add(V(0,.008,0)),end],v=>.009*(1-.38*v),18,10));
   const length=1.65+.95*hash(p*12+j,12),pts=Array.from({length:22},(_,i)=>{const v=i/21,wave=v*v*.15,ang=a+.20*sg;return end.clone().addScaledVector(d,.09*v*v).addScaledVector(side,sg*.12*v*v+wave*Math.sin(v*6+j)).add(V(.06*v*v*Math.sin(v*4+p),-length*v,.05*v*v*Math.cos(v*5+j))).toArray();}),curve=new T.CatmullRomCurve3(pts.map(p=>V(...p))),frames=curve.computeFrenetFrames(72,false);
   tentacles.push(closedSweep((v,b,cap)=>{const c=curve.getPointAt(v);if(cap)return c.toArray();const i=Math.round(v*72),width=(.0065+.005*hash(j,p))*(.25+.75*(1-v)**.35),thick=width*.33;return c.addScaledVector(frames.normals[i],width*Math.cos(b)).addScaledVector(frames.binormals[i],thick*Math.sin(b)).toArray();},72,12));
  }
 }
 const pm=add(body,merge(pedalia),'#c2ced3','four-palmate-pedalia-with-twelve-selected-finger-attachments',.52);colour(pm,(c,x,y,z)=>c.set('#bccbd0').lerp(new T.Color('#a5a9c1'),.06+.10*noise(x*23,y*31,z*21)));
 const tm=add(body,merge(tentacles),'#bbc0d5','anchored-tapered-marginal-tentacles',.65);colour(tm,(c,x,y,z)=>{const bands=(.5+.5*Math.cos(y*97+noise(x*21,0,z*21)*2))**8;c.set('#c4cad5').lerp(new T.Color('#9488b2'),bands*.24);});
 const manubrium=closedSweep((u,a,cap)=>{const y=.50-.67*u,rr=.047+.012*Math.sin(u*Math.PI)+.033*u**4*(.5+.5*Math.cos(a*4));return cap?[0,y,0]:[rr*Math.cos(a),y+.010*u**4*Math.cos(a*4),rr*Math.sin(a)];},48,64);add(body,manubrium,'#c6cdcb','central-manubrium-with-four-selected-lip-exteriors',.32);
 for(let i=0;i<4;i++){const a=i*TAU/4,q=point(.88,a),g=new T.SphereGeometry(.013,16,12).scale(1,1.25,.7).translate(q[0],q[1],q[2]);add(body,g,'#8b9294','selected-rhopalial-niche-location-'+i,.72);}
 body.userData.chironexExterior={version:'0.6.44',tentacles:48,pedalia:4,duration:8,photographicTexture:false,physiology:false,diagnosticCanalLumens:false};return 48;
}
export function chironexDeform(x,y,z,time,working){const t=T.MathUtils.clamp(time,0,8),e=working&&t>0&&t<8?Math.sin(Math.PI*t/8)**2:0,q=e*(.5-.5*Math.cos(t*TAU/4)),lower=fade(.80-y,.08,.80),attachment=y>=-.24?1:Math.exp((y+.24)*1.4),scale=1-.13*q*lower*attachment,bend=.042*e*(1-attachment)*Math.sin(t*1.2+y*2.3);return[x*scale+bend,y+.032*q*lower*attachment,z*scale+.65*bend];}
