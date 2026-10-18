import * as T from 'three';import {TAU,V} from './expansion-geometry.js';
// Visible florets, involucres and venation; illustrative aerial shoots, no developmental model.
export function asteraceae(s,k){const p=s.visual.expansionProfile,c=s.visual.color,{root,group,ell,tube,rod,surface,pigment}=k;
const profiles={cosmos:[8,'#c997b2',.20,.02,'fine'],marigold:[36,'#dca44c',.12,.03,'pinnate'],calendula:[28,'#dba15a',.20,.03,'oblong'],zinnia:[15,'#c384a2',.19,.04,'opposite'],rudbeckia:[13,'#d5b460',.19,.15,'rough'],echinacea:[17,'#bc8d9e',.22,.27,'rough'],oxeye:[23,'#ddd9c6',.17,.04,'toothed'],cornflower:[13,'#8496bd',.10,.09,'narrow'],gaillardia:[16,'#c5a75e',.21,.13,'oblong'],coreopsis:[8,'#d7b759',.15,.04,'fine'],'jerusalem-artichoke':[13,'#d5b55e',.19,.07,'broad'],tansy:[0,'#cab45e',.09,.06,'pinnate'],wormwood:[0,'#c3b580',.037,.045,'divided'],chicory:[19,'#8b9bbd',.045,.0,'toothed'],dandelion:[70,'#d0b657',.05,.0,'basal'],lettuce:[0,'#a6b97c',0,0,'rosette']};
if(!profiles[p])return null;root.userData.fixedGeometry=true;const[n,color,disc,cone,leafType]=profiles[p];
function instanced(geo,color,items,parent=root){const im=new T.InstancedMesh(geo,k.mat(color),items.length),o=new T.Object3D();items.forEach((q,i)=>{o.position.set(...q.pos);o.scale.set(...(q.scale||[1,1,1]));o.quaternion.copy(q.dir?new T.Quaternion().setFromUnitVectors(V(0,1,0),V(...q.dir).normalize()):new T.Quaternion());o.updateMatrix();im.setMatrixAt(i,o.matrix);});im.castShadow=true;parent.add(im);return im;}
function leaf(parent,length,width,type,angle=0){const g=group([0,0,0],parent);g.rotation.y=angle;
 const l=surface((u,v)=>{const w=(v-.5)*2,base=Math.pow(Math.sin(Math.PI*u),type==='oblong'?.45:.8),teeth=['toothed','broad','rough'].includes(type)?1+.055*Math.sin(u*TAU*11):1,div=type==='divided'? .48+.52*Math.cos(u*TAU*5)**2:1;return[u*length,.04*Math.sin(u*Math.PI)-.025*u*u+.006*w*w*Math.sin(u*13),w*width*base*teeth*div];},48,12,c,g);pigment(l,.09);
 tube(Array.from({length:25},(_,j)=>{const u=j/24;return[length*u,.04*Math.sin(u*Math.PI)-.025*u*u+.002,0];}),.0035,p==='wormwood'?'#b1b8a5':'#9da77e',g,26);
 for(let j=1;j<8;j++)for(const sign of [-1,1]){const u=j/9,ww=width*Math.pow(Math.sin(Math.PI*u),.8)*.87;const yy=.04*Math.sin(u*Math.PI)-.025*u*u;tube([[length*u,yy+.002,0],[length*(u+.065),yy-.001,ww*sign]],.0015,'#9aa47b',g,7);}
 return g;}
function foliage(parent,a,height){const g=group([0,height,0],parent);g.rotation.y=a;
 if(leafType==='fine'||leafType==='pinnate'||leafType==='divided'){const len=leafType==='fine'?.60:.57;rod([0,0,0],[len,.04,0],.006,c,g);for(let j=1;j<7;j++)for(const sign of [-1,1]){const q=group([len*j/7,.04*j/7,0],g);q.rotation.y=sign*(.75+.15*j/7);if(leafType==='fine'){rod([0,0,0],[.21*(1-j/9),.03,0],.003,c,q);for(let b=1;b<4;b++)for(const side of [-1,1])rod([b*.035,.01,0],[b*.035+.07,.025,side*.055*(1-j/9)],.0017,c,q);}else leaf(q,.22*(1-j/9),leafType==='divided'?.04:.065,leafType==='divided'?'divided':'toothed');}}
 else {const l=leaf(g,leafType==='narrow'?.48:.62,leafType==='narrow'?.045:leafType==='broad'?.21:leafType==='rough'?.16:.12,leafType);l.rotation.z=.24+.10*Math.sin(a*3+height*5);}
}
function head(parent,xyz,scale=1,tilt=0){const g=group(xyz,parent);g.scale.setScalar(scale);g.rotation.z=tilt;
 const ligulate=['chicory','dandelion'].includes(p),rayLen=p==='cornflower'?.24:ligulate?.33:.40;
 const receptacle=ell([0,-.055,0],[Math.max(.09,disc)*1.10,.085,Math.max(.09,disc)*1.10],'#809163',g);pigment(receptacle,.08);
 for(let i=0;i<12;i++){const a=i*TAU/12,b=group([Math.cos(a)*disc*.9,-.065,Math.sin(a)*disc*.9],g);b.rotation.y=-a;surface((u,v)=>{const w=(v-.5)*2;return[-.065*u,.14*u,w*.025*Math.sin(u*Math.PI)];},16,4,'#809163',b);}
 const florets=[];if(!ligulate){for(let i=0;i<(p==='wormwood'?30:p==='tansy'?65:140);i++){const u=Math.sqrt((i+.5)/(p==='wormwood'?30:p==='tansy'?65:140)),a=i*2.39996;florets.push({pos:[Math.cos(a)*disc*u,cone*Math.sqrt(1-u*u)+.007,Math.sin(a)*disc*u],scale:[.011,p==='echinacea'?.055:.025,.011]});}
 instanced(new T.ConeGeometry(1,1,5),['rudbeckia','coreopsis'].includes(p)?'#6a5944':p==='echinacea'?'#a57c4f':p==='gaillardia'?'#9b7252':p==='cornflower'?'#7d7b9f':'#d0b25e',florets,g);}
 for(let i=0;i<n;i++){const a=i*TAU/n+(p==='dandelion'?i*.033:0),row=p==='dandelion'?Math.floor(i/23):p==='marigold'?i%3:0,rr=ligulate?.04+row*.035:disc*.90,rlen=rayLen*(1-row*.18),rg=group([Math.cos(a)*rr,.005+row*.023,Math.sin(a)*rr],g);rg.rotation.y=-a;
 const fl=surface((u,v)=>{const w=(v-.5)*2,notch=(p==='gaillardia'||p==='coreopsis'||ligulate)?.023*Math.pow(u,10)*Math.cos(v*Math.PI*6):p==='cosmos'?.013*Math.pow(u,10)*Math.cos(v*Math.PI*8):0;return[u*rlen+notch,(p==='echinacea'?-.25: p==='rudbeckia'?-.09:.025)*u*u+.045*Math.sin(u*Math.PI)-.014*w*w,w*(p==='cornflower'?.045:ligulate?.027:.067)*Math.pow(Math.sin(u*Math.PI),.42)*(p==='cornflower'?1+u:1)];},32,12,color,rg);pigment(fl,.055);
 if(['gaillardia','coreopsis'].includes(p)){const colors=fl.geometry.attributes.color,pos=fl.geometry.attributes.position;const red=new T.Color(p==='gaillardia'?'#a16e55':'#82614b'),gold=new T.Color(color);for(let j=0;j<pos.count;j++){const t=T.MathUtils.smoothstep(pos.getX(j)/rlen,.30,.65),co=red.clone().lerp(gold,t);colors.setXYZ(j,co.r,co.g,co.b);}colors.needsUpdate=true;}
 // Longitudinal floret veins are geometry, not extracted organism photography.
 for(const sign of [-1,1])tube(Array.from({length:15},(_,j)=>{const u=.10+j/14*.80;return[u*rlen,(p==='echinacea'?-.25:p==='rudbeckia'?-.09:.025)*u*u+.045*Math.sin(u*Math.PI)+.001,sign*.018*Math.sin(u*Math.PI)];}),.0011,color,rg,15);
 if(p==='cornflower'){for(let tooth=0;tooth<5;tooth++){const q=group([rlen*.83,.012,(tooth-2)*.013],rg);q.rotation.y=-(tooth-2)*.18;surface((u,v)=>[u*.085,.028*u,(v-.5)*.013*Math.sin(u*Math.PI)],14,4,color,q);}}
 }
 return g;}
if(p==='lettuce'){
 for(let i=0;i<28;i++){const a=i*2.39996,u=i/28,g=group([0,.08+i*.009,0]);g.rotation.y=a;const length=.94-.45*u,width=.37-.12*u;const l=surface((v,w)=>{const z=(w-.5)*2,r=Math.sin(v*Math.PI)**.55;return[v*length,.12+v*v*(.18+u*.73)+.06*Math.sin(v*22+w*16)*Math.abs(z)**3,z*width*r];},52,24,c,g);pigment(l,.07);for(let j=-3;j<=3;j++)tube(Array.from({length:20},(_,b)=>{const v=.02+b/19*.90;return[v*length,.12+v*v*(.18+u*.73)+.005,j*.09*Math.sin(v*Math.PI)];}),.003,'#bdc997',g,22);}
 root.userData.anatomy={vegetative:true,flowers:0,underground:false};return[[0,.35,0],[.7,.4,0],[0,.12,0]];}
if(p==='dandelion'){
 for(let i=0;i<15;i++){const g=group([0,.05,0]);g.rotation.y=i*2.39996;const l=surface((u,v)=>{const w=(v-.5)*2,r=Math.sin(u*Math.PI)**.65*(.68+.32*Math.cos(u*TAU*5));return[u*.93,.07+u*.08-.05*u*u,w*.15*r];},65,12,c,g);pigment(l,.10);tube([[0,.07,0],[.45,.11,0],[.93,.10,0]],.004,'#99a477',g);}
 tube([[0,.09,0],[.08,.65,.015],[.10,1.25,0]],.018,c);head(root,[.1,1.25,0],1.15,.05);root.userData.anatomy={leaflessScape:true,ligulate:true,basalRosette:true};return[[.1,1.28,0],[.6,.1,0],[0,.7,0]];}
const height=p==='wormwood'?2.0:2.2;const stems=p==='tansy'?5:p==='chicory'?4:3;
rod([0,.05,0],[0,height,0],.018,c);
for(let node=0;node<6;node++){const h=.18+node*.29;foliage(root,node*2.4,h);if(['opposite','fine','broad'].includes(leafType)&&node<4)foliage(root,node*2.4+Math.PI,h);}
for(let branch=0;branch<stems;branch++){const a=branch*TAU/stems+.3,ex=Math.cos(a)*.54,ez=Math.sin(a)*.54,endY=height-.22+branch*.10;const g=group([0,.9+branch*.13,0]);tube([[0,0,0],[ex*.6,.50,ez*.6],[ex,endY-g.position.y,ez]],.010,c,g,26);foliage(g,a+.8,.25);
 if(p==='tansy'){for(let j=0;j<7;j++){const aa=j*2.4,r=.20*Math.sqrt(j/7),xx=ex+Math.cos(aa)*r,zz=ez+Math.sin(aa)*r;rod([ex,endY-.14,ez],[xx,endY,zz],.004,c);head(root,[xx,endY,zz],.68);}}
 else if(p==='wormwood'){for(let j=0;j<10;j++){const aa=j*2.4,u=j/10;const q=group([ex*u,endY-.68+u*.6,ez*u]);rod([0,0,0],[.055,.04,0],.003,c,q);head(q,[.055,.03,0],.75,Math.PI*.78);}}
 else head(root,[ex,endY,ez],p==='jerusalem-artichoke'?.80:1,(branch-1)*.10);
}if(p==='chicory')for(let i=0;i<9;i++){const g=group([0,.07,0]);g.rotation.y=i*2.4;leaf(g,.75,.13,'toothed');}
if(['rough','broad'].includes(leafType)){const hairs=[];for(let i=0;i<200;i++){const y=.10+i/200*2.0,a=i*2.4;hairs.push({pos:[Math.cos(a)*.019,y,Math.sin(a)*.019],scale:[.0009,.017,.0009],dir:[Math.cos(a),.3,Math.sin(a)]});}instanced(new T.CylinderGeometry(1,1,1,4),'#b7b79b',hairs);}
root.userData.anatomy={compositeHeads:true,rayFlorets:n,ligulate:['chicory'].includes(p),leafType,underground:false};return[[.5,2.0,0],[.4,.8,0],[0,.16,0]];
}
