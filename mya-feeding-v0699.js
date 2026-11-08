import * as T from 'three';
const P=(...a)=>new T.Vector3(...a),clamp=T.MathUtils.clamp,sm=t=>t*t*(3-2*t),line=(a,b,t)=>a.clone().lerp(b,sm(clamp(t,0,1)));
export const DURATION=20;
// Qualitative reconstruction after Beninger et al. 1997, figures 4–7.
// x: anterior to posterior; z: dorsal to ventral. Dimensions/timing are authored.
export function gillPoint(side,branch,u,v){
 const depth=(branch?.512:.64)*(.80+.20*Math.sin(Math.PI*u));
 return P(-.47+1.30*u+.045*Math.sin(Math.PI*v)*(1-u),side*(.055+branch*.055)+.023*Math.cos(Math.PI*v)+.0015*Math.sin(120*Math.PI*u),-.24+.06*u+depth*Math.sin(Math.PI*v));
}
export function palpPoint(side,leaf,u,v,time=0){
 const activity=T.MathUtils.smoothstep(time,10,12)*(1-T.MathUtils.smoothstep(time,15,17));
 const apposition=(leaf?1:-1)*.004*activity*Math.sin(time*3)*Math.sin(Math.PI*u);
 const travel=.65*(1-sm(clamp((time-12)/3,0,1))),depression=activity*Math.exp(-(((u-travel)/.085)**2+((v-.5)/.19)**2));
 // A moving depression across ridge crests illustrates a transient acceptance
 // route. Paired sheets are separated for inspection; no grinding force solver.
 const fold=.008*Math.sin(24*Math.PI*u)*Math.sin(Math.PI*v)*(1-.65*u)*(1-.85*depression);
 return P(-.95+.62*u-.025*Math.sin(Math.PI*v)*(1-u),side*(.052+leaf*.115+.015*u)+apposition+fold,-.02+.45*u+.52*v*(1-.94*u));
}
const mouth=()=>P(-.95,0,.10),inhalant=()=>P(2.04,0,.11);
export function mantlePoint(side,u){return P(-.31+1.30*u,side*(.10-.04*u),.59-.47*u*u);}
export function particlePosition(side,branch,reject,time){
 const t=clamp(Number.isFinite(time)?time:0,0,DURATION),u=reject?.47:.72,entry=gillPoint(side,branch,u,.18);
 if(t<1.5)return line(inhalant(),P(.95,side*.12,.12),t/1.5);
 if(t<3)return line(P(.95,side*.12,.12),entry,(t-1.5)/1.5);
 if(t<6)return gillPoint(side,branch,u,.18+.32*sm((t-3)/3));
 if(t<10)return gillPoint(side,branch,u*(1-sm((t-6)/4)),.5);
 if(t<12)return line(gillPoint(side,branch,0,.5),palpPoint(side,branch,.65,.50,t),(t-10)/2);
 if(!reject){if(t<15)return palpPoint(side,branch,.65*(1-sm((t-12)/3)),.5,t);if(t<16)return line(palpPoint(side,branch,0,.5,t),mouth(),t-15);return mouth();}
 if(t<13)return palpPoint(side,branch,.65,.5+.5*sm(t-12),t);
 if(t<15)return palpPoint(side,branch,.65+.35*sm((t-13)/2),1,t);
 if(t<16)return line(palpPoint(side,branch,1,1,t),mantlePoint(side,0),t-15);
 if(t<19)return mantlePoint(side,sm((t-16)/3));
 return line(mantlePoint(side,1),P(1.08,side*.04,.11),t-19);
}
function surface(fn,nu,nv,mat){const p=[],uv=[],ix=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){p.push(...fn(i/nu,j/nv).toArray());uv.push(i/nu,j/nv);}for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const n=i*(nv+1)+j;ix.push(n,n+nv+1,n+1,n+1,n+nv+1,n+nv+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return new T.Mesh(g,mat);}
function tube(points,r,mat){return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),70,r,8,false),mat);}
export function buildMyaFeedingStudy(model,rig){
 if(model.id!=='mya-arenaria')throw Error('Mya arenaria only');
 const root=new T.Group();root.name='Mya feeding cutaway — illustrative';model.root.add(root);model.root.userData.hideStudioGround=true;
 const tissue=new T.MeshStandardMaterial({color:0xd0bda0,roughness:.62,side:T.DoubleSide}),tractMat=new T.MeshStandardMaterial({color:0xcab08c,roughness:.65}),gills=[],palps=[],tracts=[],particles=[];
 const mantle=surface((u,v)=>{const a=u*2*Math.PI,r=.02+.95*v;return P(1.24*r*Math.cos(a),-.23*(1-r*r)**.72+.025,.76*r*Math.sin(a));},96,32,tissue);mantle.name='Far mantle lobe; near lobe removed for cutaway';root.add(mantle);
 function organ(name,p,s,color){const o=new T.Mesh(new T.SphereGeometry(1,40,24),new T.MeshStandardMaterial({color,roughness:.68}));o.name=name;o.position.set(...p);o.scale.set(...s);root.add(o);return o;}
 organ('Visceral mass context',[-.12,-.025,-.24],[.55,.12,.27],0xa99d7a);
 organ('Anterior adductor',[-.97,0,-.19],[.14,.16,.21],0xd8c9ab);
 organ('Posterior adductor',[.85,0,-.23],[.18,.16,.16],0xd8c9ab);
 organ('Small muscular foot — no burrowing simulated',[-.43,.005,.38],[.20,.075,.18],0xc4ad8d);
 const sheathMat=new T.MeshStandardMaterial({color:0x9b8469,roughness:.73,side:T.DoubleSide}),lumenMat=new T.MeshStandardMaterial({color:0x594c3c,roughness:.7,side:T.DoubleSide});
 const sheath=surface((u,v)=>{const a=v*2*Math.PI,r=1+.018*Math.sin(u*80);return P(.95+1.10*u,.14*r*Math.cos(a),.245*r*Math.sin(a));},80,64,sheathMat);sheath.name='Common siphonal sheath — partially extended';root.add(sheath);
 for(const z of[-.11,.11]){const lumen=surface((u,v)=>{const a=v*2*Math.PI;return P(.95+1.10*u,.078*Math.cos(a),z+.078*Math.sin(a));},16,40,lumenMat);lumen.name=z>0?'Ventral inhalant lumen':'Dorsal exhalant lumen';root.add(lumen);}
 const shape=new T.Shape();shape.absellipse(0,0,.14,.245,0,2*Math.PI,false);for(const z of[-.11,.11]){const h=new T.Path();h.absarc(0,z,.078,0,2*Math.PI,true);shape.holes.push(h);}const end=new T.Mesh(new T.ShapeGeometry(shape,48),sheathMat);const a=end.geometry.attributes.position;for(let i=0;i<a.count;i++){const y=a.getX(i),z=a.getY(i);a.setXYZ(i,2.05,y,z);}end.geometry.computeVertexNormals();end.name='Two separate siphonal openings in fused sheath';root.add(end);
 for(const side of[-1,1]){
  const tract=tube(Array.from({length:60},(_,i)=>mantlePoint(side,i/59)),.006,tractMat);tract.name='Ventral mantle rejection tract to inhalant base';root.add(tract);
  for(const branch of[0,1]){
   const g=surface((u,v)=>gillPoint(side,branch,u,v),160,30,tissue);g.name=`${side<0?'Far':'Near'} ${branch?'outer — shorter':'inner'} demibranch`;root.add(g);gills.push(g);
   const tr=tube(Array.from({length:70},(_,i)=>gillPoint(side,branch,i/69,.5)),.004,tractMat);tr.name='Ventral gill particle groove';root.add(tr);tracts.push(tr);
   const p=surface((u,v)=>palpPoint(side,branch,u,v),72,28,tissue);p.userData={side,branch};p.name='Broad labial palp — ventral rejection margin';root.add(p);palps.push(p);
   for(const reject of[false,true]){const dot=new T.Mesh(new T.SphereGeometry(.014,12,8),new T.MeshBasicMaterial({color:reject?0xffb36a:0x90efb2}));root.add(dot);particles.push({dot,side,branch,reject});}
  }
 }
 const aperture=tube([mouth(),P(-.90,0,.10)],.015,lumenMat);aperture.name='Mouth entrance';root.add(aperture);
 const originalVisible=rig.upper.visible;
 function pose(time,enabled=true){const t=clamp(Number.isFinite(time)?time:0,0,DURATION);root.visible=enabled;rig.upper.visible=enabled?false:originalVisible;for(const p of palps){const a=p.geometry.attributes.position,uv=p.geometry.attributes.uv;for(let i=0;i<a.count;i++){const q=palpPoint(p.userData.side,p.userData.branch,uv.getX(i),uv.getY(i),enabled?t:0);a.setXYZ(i,q.x,q.y,q.z);}a.needsUpdate=true;p.geometry.computeVertexNormals();}for(const p of particles){p.dot.position.copy(particlePosition(p.side,p.branch,p.reject,t));p.dot.visible=enabled&&(p.reject||t<16);}model.root.updateMatrixWorld(true);return{duration:DURATION,time:t,stage:t<3?'Inhalant approach':t<6?'Ventral transport on gill filaments':t<10?'Anterior transport in ventral grooves':t<12?'Gill-to-palp transfer':t<16?'Palp acceptance / ventral-margin rejection':t<20?'Mantle rejection tract towards inhalant siphon':'Study complete — voidance not simulated',measured:false};}
 pose(0,false);return{root,gills,palps,tracts,particles,pose};
}
