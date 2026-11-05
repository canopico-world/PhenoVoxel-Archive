// Pigment only: lighting is supplied by the renderer, never painted here.
// Cyclic coordinates avoid a seam at the dorsal UV meridian. Fine relief is
// deliberately small: cetacean epidermis is not fish scales or reptile hide.
import * as T from 'three';
import {cetaceanSection} from './cetacean-models.js';
const clamp=T.MathUtils.clamp,lerp=T.MathUtils.lerp,sm=T.MathUtils.smoothstep,TAU=Math.PI*2;
const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
export function noise(x,y){const i=Math.floor(x),j=Math.floor(y),a=sm(x-i,0,1),b=sm(y-j,0,1);return lerp(lerp(hash(i,j),hash(i+1,j),a),lerp(hash(i,j+1),hash(i+1,j+1),a),b);}
const colorCache=new Map();const col=h=>{if(!colorCache.has(h))colorCache.set(h,new T.Color(h));return colorCache.get(h);};
const scarCache=new Map();
function marks(c){if(scarCache.has(c.id))return scarCache.get(c.id);const risso=c.id==='grampus-griseus',beaked=c.id==='mesoplodon-densirostris',sei=c.id==='balaenoptera-borealis',n=risso?100:beaked?30:sei?24:8,rows=[];
 for(let i=0;i<n;i++){const u=.035+.87*hash(i,14),a=TAU*hash(i,26),length=(risso?.009:.003)+(risso?.040:.009)*hash(i,31),slope=(hash(i,19)-.5)*17,count=risso?2+Math.floor(hash(i,6)*4):1;
  for(let j=0;j<count;j++)rows.push({u,a:a+j*.015,length,width:risso?.0028:.004,slope,bend:(hash(i,81)-.5)*90,oval:sei||(!risso&&hash(i,13)>.4),fade:.3+.6*hash(i,10)});
 }
 const buckets=Array.from({length:2048},(_,j)=>rows.filter(r=>Math.abs(j/2047-r.u)<r.length*1.5));scarCache.set(c.id,buckets);return buckets;
}
export function mouthQ(c,u){
 const f=clamp(u/c.headEnd,0,1),r=cetaceanSection(c,u),mid=(r.top+r.bottom)*.5,ry=(r.top-r.bottom)*.5;
 let y=c.id==='caperea-marginata'?-.06+.17*Math.sin(f*Math.PI)-.10*f:c.id==='grampus-griseus'?-.11-.08*f:c.id==='globicephala-melas'?-.13-.12*f:c.id==='orcaella-brevirostris'?-.12-.08*f:c.id==='kogia-sima'?-.24-.065*f:c.id==='inia-geoffrensis'?-.16-.08*f:c.id.startsWith('stenella-')?-.15-.035*f:c.id==='hyperoodon-ampullatus'?-.15-.075*f:c.id==='mesoplodon-densirostris'?-.11-.085*f+.25*Math.exp(-1*((u-.13)/.045)**2):-.06-.075*f+.045*Math.sin(f*Math.PI);
 return clamp((y-mid)/Math.max(.005,ry),-.96,.96);
}
export function skinSample(c,u,a,kind='body',out=new T.Color()){
 const q=Math.cos(a),z=Math.sin(a),circ=Math.sin(a)*2.7+Math.cos(a)*2.1;
 const n=noise(u*45+noise(u*12,circ)*2,circ*7),fine=noise(u*760,circ*165),cell=noise(u*180+2*noise(u*28,circ*9),circ*38);
 let relief=(fine-.5)*.00015+(cell-.5)*.00030,roughness=.48+.10*n+.03*(fine-.5);
 out.copy(col(c.back));
 if(kind==='body'){
  const side=sm(-q,-.65,.25),belly=sm(-q,.24,.80);out.lerp(col(c.side),side).lerp(col(c.belly),belly);
  const id=c.id;
  if(c.pilotPatch){const anchor=Math.exp(-1*((u-.265)/.105)**2)*sm(-q,.64,.92),stem=Math.exp(-1*((u-.46)/.20)**2)*Math.exp(-1*(z/.16)**2)*sm(-q,.7,.95),saddle=Math.exp(-1*((u-.43)/.075)**2)*sm(q,.2,.9);out.lerp(col('#9a9f97'),Math.min(.8,.8*anchor+.6*stem+.22*saddle));}
  if(id==='grampus-griseus'){const head=1-sm(u,.14,.32);out.lerp(col('#c8ccc3'),head*.84);out.lerp(col('#adb5ad'),n*.025);}
  if(id==='inia-geoffrensis'){const mottling=sm(cell*.55+n*.45,.40,.63);out.lerp(col('#c6a6a0'),mottling*.28*sm(-q,-.4,.6));roughness+=.05;}
  if(id==='stenella-longirostris'){
   const boundary=.25-.09*Math.sin(u*6.8),dark=1-sm(q,boundary-.025,boundary+.025);out.copy(col(c.back)).lerp(col(c.side),dark).lerp(col(c.belly),sm(-q,.42,.49));
   const eyePath=-.25-1.9*Math.max(0,u-c.eyeU);if(u>.12&&u<.30)out.lerp(col('#344149'),Math.exp(-1*((q-eyePath)/.028)**2)*.9);
  }
  if(id==='stenella-coeruleoalba'){
   const cape=.37+.18*Math.exp(-1*((u-.40)/.16)**2);out.copy(col(c.back)).lerp(col(c.side),1-sm(q,cape-.06,cape+.04)).lerp(col(c.belly),sm(-q,.35,.60));
   const blaze=Math.exp(-1*((q-(.03+.82*clamp((u-.21)/.34,0,1)))/.13)**2)*sm(u,.18,.24)*(1-sm(u,.47,.56));out.lerp(col('#aebec2'),blaze*.76);
   const anal=-.26-.44*clamp((u-c.eyeU)/.60,0,1),branch=-.26-3.7*(u-c.eyeU),mask=sm(u,c.eyeU-.015,c.eyeU+.007)*(1-sm(u,.79,.84));out.lerp(col('#263942'),Math.min(.97,Math.exp(-1*((q-anal)/.023)**2)*mask+Math.exp(-1*((q-branch)/.032)**2)*mask*(1-sm(u,.31,.35))));
  }
  if(id==='balaenoptera-acutorostrata'||id==='balaenoptera-bonaerensis'){
   const shoulder=(.29+.08*q),flank=Math.exp(-1*((u-shoulder)/.055)**2)*sm(-q,-.34,.52);out.lerp(col('#a7b0af'),flank*.48);out.lerp(col('#b7bdb6'),sm(-q,.36+.1*Math.sin(u*9),.58+.1*Math.sin(u*9))*.50);
  }
  if(c.omuraMarkings){
   if(u<c.headEnd&&q<.15)out.lerp(col(z>0?'#cfcec1':c.back),(1-sm(u,c.headEnd-.025,c.headEnd))*sm(-q,-.1,.25));
   const blaze=Math.exp(-1*((u-(.20+.15*q))/.055)**2)*sm(z,.15,.8)*sm(q,-.5,.12),center=.42+.09*Math.abs(z),chevrons=Math.exp(-1*((u-center)/.030)**2)+(z>0?Math.exp(-1*((u-center-.055)/.024)**2):0);out.lerp(col('#c1c6bf'),Math.min(.70,.46*blaze+chevrons*(z>0?.28:.15)));
  }
  if(c.paleHead)out.lerp(col('#b5b09c'),(1-sm(u,.13,.30))*.63);
  if(c.falseGill){const curve=.17+.045*(q+.3)**2,mask=sm(q,-.82,-.48)*(1-sm(q,.17,.48));out.lerp(col('#49565a'),Math.exp(-1*((u-curve+.008)/.012)**2)*mask*.65);out.lerp(col('#c6c5b6'),Math.exp(-1*((u-curve)/.0048)**2)*mask*.80);}
  if(c.pleats&&u>.025&&u<c.pleatEnd&&q<-.12){const env=Math.sin((u-.025)/(c.pleatEnd-.025)*Math.PI)**.6*sm(-q,.12,.6),fold=(.5+.5*Math.cos((a-Math.acos(-.12))*TAU*(c.pleats-1)/(TAU-2*Math.acos(-.12))))**12;out.multiplyScalar(1-.09*env*fold);relief-=.0045*env*fold;roughness+=.025*fold;}
  const scars=marks(c)[Math.min(2047,Math.round(u*2047))];let mark=0;for(const s of scars){const du=u-s.u,da=Math.atan2(Math.sin(a-s.a),Math.cos(a-s.a));let v;if(s.oval){const r=Math.sqrt((du/s.length)**2+(da/.045)**2);v=Math.exp(-1*((r-.7)/.20)**2)*.65+Math.exp(-1*(r/.65)**4)*.3;}else v=Math.exp(-1*((da-du*s.slope-du*du*s.bend)/s.width)**2)*Math.exp(-1*(du/s.length)**6);mark=Math.max(mark,v*s.fade);}
  out.lerp(col(c.id==='grampus-griseus'?'#e1e1d4':'#b7b5a3'),mark*(c.id==='grampus-griseus'?.86:.45));relief-=mark*.00010;roughness+=mark*.09;
  if(u<c.headEnd&&u>(c.id==='kogia-sima'?.045:.002)){const seam=Math.exp(-1*((q-(c.skinMouthQ?.[Math.round(u*(c.skinMouthQ.length-1))]??mouthQ(c,u)))/.012)**2)*Math.sin(Math.PI*u/c.headEnd)**.3;out.lerp(col('#293238'),seam*.85);relief-=.002*seam;}
 }else{
  out.copy(col(c.back)).lerp(col(c.side),sm(-q,.2,.9)*.13);
  if(kind==='flipper'&&c.flipperBand)out.lerp(col('#c7cbc4'),sm(u,.32,.37)*(1-sm(u,.64,.69))*.98);
  if(kind==='flipper'&&c.omuraMarkings)out.lerp(col('#c7ccc1'),sm(q,.72,.91)*.93);
  if(c.id==='grampus-griseus')out.copy(col('#535f63')).lerp(col('#88938e'),n*.15);
 }
 out.multiplyScalar(1+(n-.5)*.025+(cell-.5)*.020+(fine-.5)*.014);
 return{color:out,relief,roughness:clamp(roughness,.28,.64)};
}
