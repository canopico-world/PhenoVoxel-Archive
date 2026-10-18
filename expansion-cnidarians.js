import * as T from 'three';import {TAU,V} from './expansion-geometry.js';
// Qualitative anatomical surfaces. These controls do not solve fluid/elastic dynamics.
export function cnidarians(s,k){const p=s.visual.expansionProfile,c=s.visual.color,{root,group,ell,tube,surface,pigment,moving}=k;
const medusae=['upside-jelly','fried-egg','barrel-jelly','compass-jelly','lion-mane','mauve-jelly','crystal-jelly','freshwater-jelly','box-jelly'];
const gelatin={transparent:true,opacity:.72,depthWrite:false,roughness:.30};
function strand(parent,a,r,y,length,color,index,thick=.007){const g=group([Math.cos(a)*r,y,Math.sin(a)*r],parent);tube(Array.from({length:19},(_,j)=>{const u=j/18;return[Math.sin(u*6+index)*.06*u,-length*u,Math.cos(u*5+index)*.045*u];}),thick,color,g,25);moving.push({object:g,type:'tentacle',index});return g;}
if(medusae.includes(p)){
 const upside=p==='upside-jelly',box=p==='box-jelly',flat=['crystal-jelly','freshwater-jelly','upside-jelly','fried-egg'].includes(p),barrel=p==='barrel-jelly',lion=p==='lion-mane',mauve=p==='mauve-jelly',fried=p==='fried-egg',crystal=p==='crystal-jelly',fresh=p==='freshwater-jelly';
 const g=group([0,upside?.40:1.8,0]),r=box?.54:.88,h=box?.83:flat?.24:barrel?.70:.47;
 const radius=(u,a)=>{const rr=Math.sin(u*Math.PI/2)*r;if(box){const v=Math.pow(Math.abs(Math.cos(a)),6)+Math.pow(Math.abs(Math.sin(a)),6);return rr/Math.pow(v,1/6);}return rr*(1+(lion?.045:barrel?.016:.014)*Math.pow(u,7)*Math.cos(a*(barrel?96:lion?8:16)));};
 const bell=surface((u,v)=>{const a=v*TAU,rr=radius(u,a);return[Math.cos(a)*rr,h*Math.cos(u*Math.PI/2),Math.sin(a)*rr];},38,barrel?192:112,c,g,{...gelatin,opacity:crystal||fresh?.30:.68});pigment(bell,.045);
 surface((u,v)=>{const a=v*TAU,rr=radius(u,a)*.985;return[Math.cos(a)*rr,h*Math.cos(u*Math.PI/2)-.035,Math.sin(a)*rr];},32,112,c,g,{...gelatin,opacity:.32});
 const rim=Array.from({length:193},(_,j)=>{const a=j/192*TAU,rr=radius(1,a);return[Math.cos(a)*rr,0,Math.sin(a)*rr];});tube(rim,barrel?.017:.008,barrel?'#8c81a7':c,g,192);
 if(fried)ell([0,h-.05,0],[.35,.18,.35],'#c5a15d',g,{roughness:.35});
 const canalCount=fresh?4:crystal?56:upside?16:8;for(let i=0;i<canalCount;i++){const a=i*TAU/canalCount;tube(Array.from({length:22},(_,j)=>{const u=.08+.90*j/21,rr=radius(u,a);return[Math.cos(a)*rr,h*Math.cos(u*Math.PI/2)+.003,Math.sin(a)*rr];}),crystal?.003:.005,fresh?'#a2aa9b':c,g,22);}
 if(p==='compass-jelly')for(let i=0;i<16;i++){const a=i*TAU/16;for(const side of [-1,1])tube(Array.from({length:25},(_,j)=>{const u=.14+j/24*.82,aa=a+side*.07*u,rr=radius(u,aa);return[Math.cos(aa)*rr,h*Math.cos(u*Math.PI/2)+.006,Math.sin(aa)*rr];}),.006,'#97765d',g,25);}if(mauve)for(let i=0;i<88;i++){const a=i*2.39996,u=Math.sqrt((i+.5)/88)*.94,rr=radius(u,a);ell([Math.cos(a)*rr,h*Math.cos(u*Math.PI/2)+.006,Math.sin(a)*rr],[.015,.009,.015],'#a580a1',g);}
 const bellParts=[...g.children],bellRig=group([0,0,0],g);for(const piece of bellParts)bellRig.add(piece);moving.push({object:bellRig,type:'bell-pulse',index:0});
 if(box){for(let corner=0;corner<4;corner++){const a=Math.PI/4+corner*TAU/4,ped=group([Math.cos(a)*r*1.1,-.02,Math.sin(a)*r*1.1],g);tube([[0,0,0],[Math.cos(a)*.13,-.16,Math.sin(a)*.13]],.034,c,ped);for(let i=0;i<9;i++)strand(ped,a+(i-4)*.025,.14,-.16,1.40+.10*Math.sin(i),c,i+corner*9,.005);}ell([0,-.13,0],[.13,.16,.13],c,g,gelatin);}
 else if(crystal||fresh){ell([0,-.07,0],[.12,.06,.12],c,g,gelatin);for(let i=0;i<(fresh?64:84);i++)strand(g,i*TAU/(fresh?64:84),r*.99,0,.30+.23*(.5+.5*Math.sin(i*7)),c,i,.0035);}
 else{
 const n=upside||fried||barrel?8:4,len=upside?.48:fried?.66:barrel?1.22:lion?1.08:1.45;
 for(let arm=0;arm<n;arm++){const a=arm*TAU/n,rg=group([Math.cos(a)*(fried?.27:.19),-.03,Math.sin(a)*(fried?.27:.19)],g);rg.rotation.y=-a;const ribbon=surface((u,v)=>{const w=(v-.5)*2,rr=(upside?.20:fried?.19:barrel?.17:.105)*(1-.5*u);return[u*.13+Math.sin(u*7)*.04,-len*u+Math.sin(v*9+u*25)*.035*Math.abs(w),w*rr*(1+.35*Math.sin(u*37))];},64,16,upside?'#a49d7b':c,rg,{...gelatin,opacity:.94});pigment(ribbon,.07);if(upside||fried||barrel)for(let j=0;j<(fried?28:14);j++){const u=(j+.5)/(fried?28:14),side=j%2?1:-1;const q=[u*.13+Math.sin(u*7)*.04,-len*u,side*(fried?.17:.12)*(1-.5*u)];tube([q,[q[0]+.06,q[1]-.07,q[2]+side*.09]],.012,c,rg);if(fried||upside)ell([q[0]+.06,q[1]-.07,q[2]+side*.09],[fried?.032:.023,.038,fried?.032:.023],fried?'#9985a4':'#b3a58e',rg);}moving.push({object:rg,type:'tentacle',index:arm});}
 if(!upside&&!fried&&!barrel){const n=mauve?8:lion?160:24;for(let i=0;i<n;i++){const a=lion?Math.floor(i/20)*TAU/8+(i%20-9.5)*.016:i*TAU/n;strand(g,a,r*.98,0,lion?1.60+.16*Math.sin(i*8):1.48+.13*Math.sin(i*7),c,i,mauve?.007:lion?.0028:.004);}}
 }
 if(upside)g.rotation.z=Math.PI;root.userData.anatomy={medusa:true,inverted:upside,marginalTentacles:!upside&&!fried&&!barrel,bellType:box?'rounded box':'radial bell'};return[[0,1.9,0],[.7,1.8,0],[.15,1,0]];
}
if(['physalia','velella','porpita'].includes(p)){
 const g=group([0,p==='physalia'?1.6:.65,0]);if(p==='physalia'){pigment(ell([0,0,0],[.94,.24,.32],c,g,{...gelatin,opacity:.82}),.09);surface((u,v)=>{const x=(u-.5)*1.60,h=.64*Math.pow(Math.sin(u*Math.PI),.65);return[x,v*h,.015*Math.sin(u*10)*v];},48,12,'#b0acd0',g,gelatin);for(let i=0;i<22;i++){const x=-.65+i*.058;ell([x,-.18,.03],[.04,.08,.045],'#a398b6',g);const st=group([x,-.21,.03],g);tube(Array.from({length:38},(_,j)=>{const u=j/37;return[.09*Math.sin(u*12+i)*u,-(1.05+.25*Math.sin(i*5))*u,.06*Math.cos(u*9+i)*u];}),i%5?.004:.009,'#829db7',st,40);}}
 else if(p==='velella'){ell([0,0,0],[.95,.075,.53],'#688f9c',g,{...gelatin,opacity:.90});const sail=surface((u,v)=>{const x=(u-.5)*1.55;return[x,v*.65*Math.pow(Math.sin(u*Math.PI),.7),x*.34];},56,14,'#bdcac2',g,gelatin);for(let i=0;i<20;i++){const a=i*TAU/20;strand(g,a,.55,-.04,.24,c,i,.007);}root.userData.anatomy={colonial:true,sail:true};}
 else{ell([0,0,0],[.62,.055,.62],'#b3a47c',g);for(let i=0;i<74;i++){const a=i*TAU/74,g2=group([Math.cos(a)*.58,-.02,Math.sin(a)*.58],g),end=[Math.cos(a)*.62,-.04,Math.sin(a)*.62];tube([[0,0,0],[end[0]*.6,.04,end[2]*.6],end],.009,c,g2,18);for(let j=1;j<5;j++)for(const sign of [-1,1]){const u=j/5;ell([end[0]*u+Math.sin(a)*sign*.035,-.015,end[2]*u-Math.cos(a)*sign*.035],[.018,.014,.018],'#91b1b5',g2);}}root.userData.anatomy={colonial:true,sail:false};}return[[0,1,0],[.7,.6,0],[0,.35,0]];
}
if(['aggregate-anemone','green-anemone','carpet-anemone','magnificent-anemone','tube-anemone','cushion-coral','cup-coral'].includes(p)){
 const coral=p.endsWith('coral'),cup=p==='cup-coral',carpet=p==='carpet-anemone',tubeAn=p==='tube-anemone',green=p==='green-anemone',mag=p==='magnificent-anemone';
 function polyp(x,z,height,r,index){const g=group([x,.07,z]),column=surface((u,v)=>{const a=v*TAU,rr=r*(coral?.86:1-.13*Math.sin(u*Math.PI))*(1+(coral?.012:.018)*Math.cos(a*(coral?32:40)+u*2));return[Math.cos(a)*rr,u*height,Math.sin(a)*rr];},36,96,c,g);pigment(column,.10);ell([0,.0,0],[r*1.03,.05,r*1.03],c,g);
 const discR=coral?r:carpet?1.03:tubeAn?.25:mag?.66:green?.68:.48;
 const oral=surface((u,v)=>{const a=v*TAU,rr=u*discR;return[Math.cos(a)*rr,height+(carpet?.12*Math.sin(a*5)*u*u:.025*Math.sin(u*Math.PI)),Math.sin(a)*rr];},22,112,coral?cup?'#cc9b50':'#a99f77':c,g);pigment(oral,.06);
 // An open slit distinguishes the oral region; no internal feeding mechanism is claimed.
 ell([0,height+.006,0],[discR*.12,.012,discR*.035],'#756b59',g);
 const count=coral?24:carpet?330:mag?180:tubeAn?90:green?95:100;
 for(let i=0;i<count;i++){const a=i*2.39996,rr=discR*(coral?.82:carpet?Math.sqrt(.09+.90*(i+.5)/count):.48+.48*Math.sqrt((i+.5)/count)),hh=height+(carpet?.12*Math.sin(a*5)*(rr/discR)**2:0),tg=group([Math.cos(a)*rr,hh,Math.sin(a)*rr],g),len=coral?.15:carpet?.10:mag?.43:tubeAn?.86:green?.33:.28,reach=tubeAn?.70:.45;
 const rad=coral?.006:carpet?.013:green?.023:mag?.020:.016,tc=coral?cup?'#d9b269':'#b8aa7c':mag?'#9fa98b':c;surface((u,v)=>{const aa=v*TAU,rr=rad*Math.pow(Math.sin((.08+.92*u)*Math.PI),.55),rrOut=len*reach*u;return[Math.cos(a+.12*u)*rrOut+Math.cos(aa)*rr,len*(.85+.12*Math.sin(i*4))*u,Math.sin(a+.12*u)*rrOut+Math.sin(aa)*rr];},18,7,tc,tg);moving.push({object:tg,type:'tentacle',index:i+index});}
 if(tubeAn){for(let i=0;i<44;i++){const a=i*TAU/44;const tg=group([Math.cos(a)*.10,height,Math.sin(a)*.10],g);tube([[0,0,0],[Math.cos(a)*.045,.11,Math.sin(a)*.045],[Math.cos(a)*.09,.16,Math.sin(a)*.09]],.005,'#bcb092',tg,12);moving.push({object:tg,type:'tentacle',index:i});}}
 if(coral)for(let i=0;i<24;i++){const a=i*TAU/24;tube([[Math.cos(a)*r*.12,height+.005,Math.sin(a)*r*.12],[Math.cos(a)*r*.80,height+.015,Math.sin(a)*r*.80]],.003,c,g,8);}
 }
 if(coral){ell([0,.08,0],[.77,.10,.66],c);for(let i=0;i<(cup?13:25);i++){const a=i*2.39996,rr=.60*Math.sqrt(i/(cup?13:25));polyp(Math.cos(a)*rr,Math.sin(a)*rr,.40+.22*(1-rr)+.04*Math.sin(i*7),cup?.15:.125,i);}}
 else polyp(0,0,carpet?.23:tubeAn?.52:mag?.90:green?.45:.46,carpet?.42:tubeAn?.14:mag?.40:green?.47:.34,0);
 root.userData.anatomy={coral,innerAndOuterRings:tubeAn,shortTentacles:carpet};return[[0,.7,0],[.7,.9,0],[0,.12,0]];
}return null;}

