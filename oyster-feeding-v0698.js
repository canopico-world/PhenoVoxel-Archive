import * as T from 'three';
const P=(...a)=>new T.Vector3(...a),clamp=T.MathUtils.clamp,sm=t=>t*t*(3-2*t);
export const DURATION=18;
// Ostrea-specific qualitative topology after Yonge 1926 figs 1, 2, 22–24.
// This authored cutaway is not segmented anatomy or a physiological flow model.
export function gillPoint(side,branch,u,v){
 const angle=Math.PI*(1-1.25*u),depth=branch?.14:(side<0?.27:.23),r=.68+depth*Math.sin(Math.PI*v),plica=.010*Math.sin(2*Math.PI*28*u)*Math.sin(Math.PI*v);
 return P(-.03+.88*r*Math.cos(angle),side*(.045+branch*.052)+.019*Math.cos(Math.PI*v)+plica,-.10+.68*r*Math.sin(angle));
}
export function palpPoint(side,branch,u,v,time=0){
 const activity=T.MathUtils.smoothstep(time,10,12)*(1-T.MathUtils.smoothstep(time,15,17)),curl=.025*activity*u*u;
 const base=side<0?.025:.04,fold=.0035*Math.sin(u*28*Math.PI)*Math.sin(Math.PI*v)*(1-u);
 return P(-.82+.32*u,side*(base+branch*.025+.10*u)+curl+fold,-.10+.28*u+.14*(1-u)*v);
}
const mouth=()=>P(-.82,0,-.10);
const line=(a,b,t)=>a.clone().lerp(b,sm(clamp(t,0,1)));
export function particlePosition(side,branch,route,reject,time){
 const t=clamp(Number.isFinite(time)?time:0,0,DURATION),u=reject?.48:.64,edge=route==='axis'?0:.5,start=.23,entry=gillPoint(side,branch,u,start),palp=palpPoint(side,branch,.70,.45,t);
 if(t<3)return line(P(.55,side*.15,.85),entry,t/3);
 if(t<6)return gillPoint(side,branch,u,start+(edge-start)*sm((t-3)/3));
 if(t<10)return gillPoint(side,branch,u*(1-sm((t-6)/4)),edge);
 if(t<12)return line(gillPoint(side,branch,0,edge),palp,(t-10)/2);
 if(!reject){if(t<14)return palpPoint(side,branch,.70*(1-sm((t-12)/2)),.45,t);if(t<15)return line(palpPoint(side,branch,0,.45,t),mouth(),t-14);return mouth();}
 // Rejection along the upper palp margin, converging just short of the tip.
 // Unlike the mussel study, this is not a ventral-margin-to-tip route.
 if(t<13)return palpPoint(side,branch,.70,.45+.55*sm(t-12),t);
 if(t<14)return palpPoint(side,branch,.70+.18*sm(t-13),1,t);
 const released=palpPoint(side,branch,.88,1,t),onMantle=P(-.45,-.055,.45),margin=P(.05,-.005,.67);
 if(t<15)return line(released,onMantle,t-14);
 return line(onMantle,margin,(t-15)/3);
}
function surface(fn,nu,nv,mat){const pos=[],uv=[],ix=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){pos.push(...fn(i/nu,j/nv).toArray());uv.push(i/nu,j/nv);}for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const n=i*(nv+1)+j;ix.push(n,n+nv+1,n+1,n+1,n+nv+1,n+nv+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return new T.Mesh(g,mat);}
function tube(points,r,mat){return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),70,r,6,false),mat);}
export function buildOysterFeedingStudy(model,rig){
 if(model.id!=='ostrea-edulis')throw Error('Ostrea edulis only');const root=new T.Group();root.name='Ostrea feeding cutaway — schematic';model.root.add(root);
 const tissue=new T.MeshStandardMaterial({color:0xc1b393,roughness:.58,side:T.DoubleSide}),tractMat=new T.MeshStandardMaterial({color:0xd7c5a1,roughness:.5}),gills=[],palps=[],tracts=[],particles=[];
 const mantle=surface((u,v)=>{const a=u*2*Math.PI,r=.03+.91*v;return P(1.04*r*Math.cos(a),-.22*(1-r*r)**.72+.06,.76*r*Math.sin(a)*(1+.13*Math.cos(a)));},96,32,tissue);mantle.name='Left mantle fold';root.add(mantle);
 function organ(name,p,s,color){const o=new T.Mesh(new T.SphereGeometry(1,40,24),new T.MeshStandardMaterial({color,roughness:.63}));o.name=name;o.position.set(...p);o.scale.set(...s);root.add(o);return o;}
 organ('Visceral and digestive-gland context',[-.20,0,-.22],[.43,.105,.24],0x9c8e67);
 organ('Single adductor — striated region',[.29,.035,-.20],[.20,.13,.18],0xd7cfb3);
 organ('Single adductor — smooth region',[.34,.04,-.34],[.13,.12,.07],0xbdb79f);
 for(const side of[-1,1])for(const branch of[0,1]){
  const g=surface((u,v)=>gillPoint(side,branch,u,v),168,28,tissue);g.name=`${side<0?'Left':'Right'} ${branch?'outer':'inner'} plicate demibranch`;root.add(g);gills.push(g);
  for(const edge of[0,.5]){const q=tube(Array.from({length:70},(_,i)=>gillPoint(side,branch,i/69,edge)),.004,tractMat);q.name=edge===0?'Axial food tract':'Marginal food groove';tracts.push(q);root.add(q);}
  const p=surface((u,v)=>palpPoint(side,branch,u,v),40,20,tissue);p.userData={side,branch};p.name='Labial palp — upper-margin rejection';palps.push(p);root.add(p);
  for(const route of['axis','margin'])for(const reject of[false,true]){const dot=new T.Mesh(new T.SphereGeometry(.016,12,8),new T.MeshBasicMaterial({color:reject?0xffb36a:0x90efb2}));root.add(dot);particles.push({dot,side,branch,route,reject});}
 }
 const aperture=tube([mouth(),P(-.76,0,-.13)],.013,new T.MeshStandardMaterial({color:0x554c3f,roughness:.7}));aperture.name='Mouth entrance';root.add(aperture);
 const originalVisible=rig.upper.visible;
 function pose(time,enabled=true){const t=clamp(Number.isFinite(time)?time:0,0,DURATION);root.visible=enabled;rig.upper.visible=enabled?false:originalVisible;for(const p of palps){const a=p.geometry.attributes.position,uv=p.geometry.attributes.uv;for(let i=0;i<a.count;i++){const q=palpPoint(p.userData.side,p.userData.branch,uv.getX(i),uv.getY(i),enabled?t:0);a.setXYZ(i,q.x,q.y,q.z);}a.needsUpdate=true;p.geometry.computeVertexNormals();}for(const p of particles){p.dot.position.copy(particlePosition(p.side,p.branch,p.route,p.reject,t));p.dot.visible=enabled&&(p.reject||t<15);}model.root.updateMatrixWorld(true);return{duration:DURATION,time:t,stage:t<3?'Inhalant entry':t<6?'Opposed transport on gill filaments':t<10?'Axial and marginal routes towards palps':t<12?'Gill-to-palp transfer':t<15?'Palp acceptance / upper-margin rejection':t<18?'Rejected material accumulates on mantle margin':'Study complete — ejection not simulated',measured:false};}
 pose(0,false);return{root,gills,palps,tracts,particles,pose};
}
