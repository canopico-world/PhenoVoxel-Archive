import * as T from 'three';import {TAU,V} from './expansion-geometry.js';
export function fungiCiliates(s,k){const p=s.visual.expansionProfile,c=s.visual.color,{root,group,ell,tube,rod,surface,pigment,moving,rememberSoft}=k;
function instances(points,r,color,shape=new T.IcosahedronGeometry(1,0),parent=root){const im=new T.InstancedMesh(shape,k.mat(color),points.length),ob=new T.Object3D();points.forEach((pt,i)=>{ob.position.set(...pt);ob.scale.setScalar(r);ob.quaternion.setFromUnitVectors(V(0,1,0),pt.direction||V(0,1,0));ob.updateMatrix();im.setMatrixAt(i,ob.matrix);});im.castShadow=true;parent.add(im);return im;}
const fungal=['stinkhorn','red-cage','dog-stinkhorn','lantern-stinkhorn','anemone-stinkhorn','earthstar','birds-nest','fluted-nest'];
if(fungal.includes(p)){
 function volva(){const v=surface((u,v)=>{const a=v*TAU,rr=.30*Math.sin(u*Math.PI*.78);return[Math.cos(a)*rr,.03+u*(.42+.035*Math.sin(a*7)),Math.sin(a)*rr];},25,64,'#bfb7a1');pigment(v,.10);}
 if(['birds-nest','fluted-nest'].includes(p)){
 const fluted=p==='fluted-nest';for(let cup=0;cup<3;cup++){const g=group([cup===0?-.48:cup===1?.45:0,.02,cup===2?.50:0]);g.rotation.z=(cup-1)*.06;
 const wall=surface((u,v)=>{const a=v*TAU,outer=u<.5,t=outer?u*2:2-u*2,r=.15+.23*t-(outer?0:.035)+.006*Math.cos(a*(fluted?36:0))*(outer?0:1),y=.11+t*.61;return[Math.cos(a)*r,y,Math.sin(a)*r];},64,128,c,g);pigment(wall,.12);
 // Floor closes the cup under the peridioles; no floating eggs and no simulated splash.
 ell([0,.14,0],[.16,.045,.16],fluted?'#9d8b6f':'#c3b28a',g);
 for(let i=0;i<4;i++){const a=i*TAU/4+.20,r=.078;const q=ell([Math.cos(a)*r,.203,Math.sin(a)*r],[.049,.021,.034],fluted?'#817868':'#d0c7a8',g);q.rotation.y=a+.25;q.rotation.z=.08*Math.sin(i*4);}
 if(fluted){const pts=[];for(let i=0;i<500;i++){const a=i*2.39996,h=.09+.60*(i%51)/51,r=.25+.11*Math.sin((h-.04)/.70*Math.PI*.5);pts.push([Math.cos(a)*r,h,Math.sin(a)*r]);}instances(pts,.012,'#9d8f78',new T.ConeGeometry(.45,2.8,4),g);}
 }root.userData.anatomy={cup:true,innerStriae:fluted,peridioles:4};return[[0,.7,0],[.5,.4,0],[0,.2,0]];
 }
 if(p==='earthstar'){
 const n=8;for(let i=0;i<n;i++){const a=i*TAU/n,g=group();g.rotation.y=-a;const ray=surface((u,v)=>{const w=(v-.5)*2,rr=.20+u*.93;return[rr,.25+.21*Math.sin(u*Math.PI)-.18*u,w*.20*Math.sin(u*Math.PI)**.55];},44,16,'#a58f72',g);pigment(ray,.13);}
 const sac=ell([0,.66,0],[.43,.40,.43],'#ae9c7d');pigment(sac,.14);const collar=surface((u,v)=>{const a=v*TAU,r=.30+u*.30;return[Math.cos(a)*r,.34+.12*u*u,Math.sin(a)*r];},18,80,'#b8a181');pigment(collar,.10);const pore=surface((u,v)=>{const a=v*TAU,r=.045+.04*u;return[Math.cos(a)*r,1.03-.025*u,Math.sin(a)*r];},12,32,'#70614c');root.userData.anatomy={rays:n,collar:true,sporeSac:true};return[[0,.9,0],[.8,.2,0],[.5,.4,0]];
 }
 volva();
 if(p==='red-cage'){
 // Triangulated cage edge network remains hollow; no solid ball hidden beneath it.
 const vertices=[],edges=[];for(let row=0;row<5;row++){const a0=row%2?Math.PI/5:0,yy=.24+row*.32,rr=.66*Math.sin((row+1)/6*Math.PI);for(let j=0;j<10;j++){const a=j*TAU/10+a0+.04*Math.sin(j*8+row),rj=rr*(1+.05*Math.sin(j*4+row*6));vertices.push([Math.cos(a)*rj,yy+.035*Math.sin(j*6+row),Math.sin(a)*rj]);}}
 for(let row=0;row<5;row++)for(let j=0;j<10;j++){const q=row*10+j;edges.push([q,row*10+(j+1)%10]);if(row<4)edges.push([q,(row+1)*10+j]);}
 vertices.push([0,1.72,0]);for(let i=0;i<10;i+=2)edges.push([40+i,50]);for(const[a,b]of edges){const x=vertices[a],y=vertices[b],mid=x.map((v,i)=>(v+y[i])*.5);mid[1]+=.015*Math.sin(a*9);pigment(tube([x,mid,y],.055,'#b66d53',root,12),.14);}
 root.userData.anatomy={hollowLattice:true,volva:true};return[[0,1.5,0],[.6,.8,0],[0,.3,0]];
 }
 if(p==='anemone-stinkhorn'){
 pigment(surface((u,v)=>{const a=v*TAU,r=.14+.03*Math.sin(u*6);return[Math.cos(a)*r,.24+u*.49,Math.sin(a)*r];},30,48,'#bf9d8d'),.12);
 ell([0,.75,0],[.33,.045,.33],'#7d7453');for(let arm=0;arm<7;arm++)for(const sign of [-1,1]){const a=arm*TAU/7+sign*.055;const g=group([Math.cos(a)*.22,.76,Math.sin(a)*.22]);g.rotation.y=-a;const ar=surface((u,v)=>{const w=(v-.5)*2;return[u*.86,.10*Math.sin(u*Math.PI)-.30*u*u,w*.055*(1-u*.82)];},36,12,'#bd6f5c',g);pigment(ar,.12);}
 root.userData.anatomy={pairedArms:7,volva:true};return[[0,.8,0],[.8,.6,0],[0,.26,0]];
 }
 const dog=p==='dog-stinkhorn',lantern=p==='lantern-stinkhorn',h=dog?1.75:lantern?1.25:1.52,r=dog?.105:lantern?.14:.19;
 pigment(surface((u,v)=>{const a=v*TAU,rr=r*(.85+.15*Math.sin(u*Math.PI))*(lantern?1+.12*Math.cos(a*5):1);return[Math.cos(a)*rr,.24+u*h,Math.sin(a)*rr];},70,72,dog?'#c6b69a':c),.13);
 const pores=[];for(let i=0;i<600;i++){const a=i*2.39996,y=.29+(i+.5)/600*(h-.05),rr=r*(.85+.15*Math.sin((y-.24)/h*Math.PI));pores.push([Math.cos(a)*rr,y,Math.sin(a)*rr]);}instances(pores,dog?.004:.007,'#9c947c');
 if(lantern)for(let i=0;i<5;i++){const a=i*TAU/5;tube([[Math.cos(a)*r,.24+h,Math.sin(a)*r],[Math.cos(a)*.24,.24+h+.25,Math.sin(a)*.24],[0,.24+h+.48,0]],.045,'#b77f6c');tube([[Math.cos(a)*.12,.24+h+.07,Math.sin(a)*.12],[Math.cos(a)*.19,.24+h+.24,Math.sin(a)*.19],[0,.24+h+.45,0]],.019,'#6e7053');}
 else{
 const headY=.24+h,headH=dog?.48:.56;
 const head=surface((u,v)=>{const a=v*TAU,rr=(dog?.12:.33)*Math.sin((.20+.78*u)*Math.PI/2)*(1+.05*Math.sin(u*22)*Math.cos(a*17));return[Math.cos(a)*rr,headY+headH*(1-u),Math.sin(a)*rr];},64,112,dog?'#a47d58':'#777756');pigment(head,.14);
 if(!dog){const rim=k.mesh(new T.TorusGeometry(.045,.013,8,32),'#c5baa0');rim.rotation.x=Math.PI/2;rim.position.set(0,headY+headH+.003,0);}
 }root.userData.anatomy={volva:true,gleba:true,joinedArms:lantern};return[[0,1.9,0],[.15,1.0,0],[.2,.22,0]];
}
if(['lacrymaria','dileptus','vorticella','colpoda','bursaria','vibrio','staphylococcus'].includes(p)){
 const optical={transparent:true,opacity:.84,depthWrite:false,roughness:.40};
 function ciliaEllipsoid(parent,rx,ry,rz,cy=0,n=420,cx=0){const pts=[];for(let i=0;i<n;i++){const y=1-2*(i+.5)/n,a=i*2.39996,r=Math.sqrt(1-y*y),pt=[cx+Math.cos(a)*r*rx,cy+y*ry,Math.sin(a)*r*rz];pt.direction=V(Math.cos(a)*r/rx,y/ry,Math.sin(a)*r/rz).normalize();pts.push(pt);}instances(pts,.012,'#b8b7a0',new T.ConeGeometry(.15,4,4),parent);}
 if(p==='staphylococcus'){const positions=[[0,.24,0],[.42,.24,.07],[-.38,.27,.12],[.14,.24,.43],[-.23,.27,-.34],[.24,.56,.14],[-.13,.57,.02],[.0,.56,-.34],[-.36,.57,.31],[.10,.86,.02]];for(const q of positions)pigment(ell(q,[.23,.225,.23],c),.04);root.userData.anatomy={coccoid:true,irregularCluster:true};return[[0,.8,0],[.4,.3,0],[0,.14,0]];}
 if(p==='vibrio'){
 const cell=surface((u,v)=>{const a=v*TAU,theta=(u-.5)*1.30,rr=.115*Math.pow(Math.sin(u*Math.PI),.25);return[Math.sin(theta)*1.1,(1-Math.cos(theta))*.76+.18+rr*Math.cos(a),Math.sin(a)*rr];},70,32,c);pigment(cell,.035);
 const end=[Math.sin(.65)*1.1,(1-Math.cos(.65))*.76+.18,0];tube(Array.from({length:60},(_,j)=>{const u=j/59;return[end[0]+u*1.22,end[1]+.11*Math.sin(u*18)*u,.075*Math.cos(u*18)*u];}),.006,'#a6a38f',root,90);root.userData.anatomy={curvedRod:true,polarFlagellum:true};return[[0,.2,0],[.6,.35,0],[1.4,.35,0]];
 }
 if(p==='vorticella'){
 const stalk=group([0,.1,0]);const st=rememberSoft(tube(Array.from({length:80},(_,j)=>[0,j/79*1.25,0]),.012,'#aaa88f',stalk,90));st.userData.deformation='stalk';
 const cell=group([0,1.25,0],stalk);const bell=surface((u,v)=>{const a=v*TAU,rr=.10+.36*Math.sin(u*Math.PI*.50);return[Math.cos(a)*rr,u*.60,Math.sin(a)*rr];},40,70,c,cell,optical);pigment(bell,.04);
 const lip=k.mesh(new T.TorusGeometry(.46,.018,8,64),'#c5c2a5',cell);lip.rotation.x=Math.PI/2;lip.position.y=.60;ell([0,.53,0],[.37,.018,.37],'#a2a18b',cell,optical);
 for(let i=0;i<96;i++){const a=i*TAU/96;tube([[Math.cos(a)*.44,.59,Math.sin(a)*.44],[Math.cos(a)*.51,.64,Math.sin(a)*.51],[Math.cos(a+.05)*.52,.68,Math.sin(a+.05)*.52]],.0025,'#c1c1a9',cell,9);}
 const granules=[];for(let i=0;i<130;i++){const u=.15+(i%17)/17*.62,a=i*2.39996,r=(.10+.36*Math.sin(u*Math.PI*.5))*.60;granules.push([Math.cos(a)*r,.60*u,Math.sin(a)*r]);}instances(granules,.015,'#85846e',new T.SphereGeometry(1,7,5),cell);moving.push({object:cell,type:'vorticella-cell',index:0});root.userData.anatomy={sessile:true,contractileStalk:true,oralWreath:true};return[[0,1.7,0],[0,.7,0],[.4,1.8,0]];
 }
 if(p==='lacrymaria'){
 pigment(ell([-.70,.35,0],[.48,.28,.24],c,root,optical),.045);const neckG=group([-.27,.39,0]);tube([[0,0,0],[.55,.04,0],[1.3,.13,0]],.045,c,neckG,60);const head=group([1.34,.13,0],neckG);ell([0,0,0],[.11,.09,.09],c,head,optical);ciliaEllipsoid(head,.105,.09,.09,0,85);ciliaEllipsoid(root,.47,.28,.24,.35,250,-.70);moving.push({object:neckG,type:'lacrymaria-neck',index:0},{object:head,type:'lacrymaria-head',index:0});root.userData.anatomy={extensibleNeck:true,head:true};return[[-.7,.35,0],[.5,.45,0],[1.1,.52,0]];
 }
 if(p==='dileptus'){
 const body=surface((u,v)=>{const a=v*TAU,rr=.22*Math.sin(u*Math.PI)**.5;return[(u-.5)*1.40,.35+Math.cos(a)*rr,Math.sin(a)*rr*.65];},65,40,c,root,optical);pigment(body,.05);tube([[.57,.40,0],[.95,.48,.0],[1.45,.71,.0],[1.65,.94,0]],.042,c,root,55);ell([.61,.40,.075],[.07,.04,.01],'#8a8774');ciliaEllipsoid(root,.69,.20,.14,.35,350);root.userData.anatomy={proboscis:true,mouthAtBase:true};return[[1.5,.8,0],[.61,.40,.075],[0,.35,0]];
 }
 if(p==='colpoda'){
 const outline=(u,v)=>{const a=v*TAU,phi=u*Math.PI,rr=Math.sin(phi),x=.64*Math.cos(phi),indent=.15*Math.exp(-(((x-.13)/.20)**2))*Math.pow(Math.max(0,-Math.cos(a)),4);return[x,.48+Math.cos(a)*rr*.34+indent,Math.sin(a)*rr*.29];};const body=surface(outline,72,48,c,root,optical);pigment(body,.05);const pts=[];for(let i=0;i<420;i++){const u=.02+(i%35)/35*.96,a=i*2.39996,pt=outline(u,a/TAU);pt.direction=V(Math.cos(u*Math.PI),Math.cos(a),Math.sin(a)).normalize();pts.push(pt);}instances(pts,.011,'#b8b7a0',new T.ConeGeometry(.15,4,4));root.userData.anatomy={reniform:true,oralIndentation:true};return[[0,.7,0],[.3,.6,0],[-.4,.5,0]];
 }
 if(p==='bursaria'){
 // An actual open oral excavation rather than an opaque painted oval.
 const g=surface((u,v)=>{const theta=u*Math.PI,a=.28+(TAU-.56)*v,rr=Math.sin(theta);return[.56*rr*Math.cos(a),.85+.72*Math.cos(theta),.38*rr*Math.sin(a)];},64,80,c,root,optical);pigment(g,.05);
 const cavity=surface((u,v)=>{const a=(u-.5)*Math.PI,rr=.12+.28*v;return[.38+Math.sin(a)*rr*.34,.85+Math.cos(a)*rr*1.7,(v-.5)*.45];},40,20,'#98957f',root,optical);const pts=[];for(let i=0;i<550;i++){const y=1-2*(i+.5)/550,a=.30+(TAU-.60)*((i*2.39996%TAU)/TAU),r=Math.sqrt(1-y*y),pt=[.56*r*Math.cos(a),.85+.72*y,.38*r*Math.sin(a)];pt.direction=V(Math.cos(a)*r/.56,y/.72,Math.sin(a)*r/.38).normalize();pts.push(pt);}instances(pts,.012,'#b8b7a0',new T.ConeGeometry(.15,4,4));root.userData.anatomy={oralExcavation:true};return[[.45,.9,0],[0,1.4,0],[0,.4,0]];
 }
}return null;}

