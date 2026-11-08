import * as T from 'three';
const P=(...a)=>new T.Vector3(...a),clamp=T.MathUtils.clamp,sm=t=>t*t*(3-2*t),mix=(a,b,t)=>a.clone().lerp(b,sm(clamp(t,0,1)));
export const DURATION=20;
// Qualitative reconstruction. x anterior -> posterior; z dorsal -> ventral.
// Robbins et al. 2010 supports normal frontal/ventral-groove transport,
// not rhythmic gill contraction: the reported contractions followed toxic algae.
export function gillPoint(side,branch,u,v){
 const z0=-.48+.48*u,depth=(branch?.34:.43)*Math.sin(Math.PI*(.07+.86*u));
 const fold=.012*Math.sin(38*Math.PI*u)*Math.sin(Math.PI*v);
 const spread=.55+.45*Math.sin(Math.PI*u);
 return P(-.47+1.08*u,side*((.14+branch*.065)*spread+.020*Math.cos(Math.PI*v)+fold),z0+depth*Math.sin(Math.PI*v));
}
export function palpPoint(side,leaf,u,v){
 // Narrow paired sorting sheets converge anteriorly at the oral groove.
 const width=.15*Math.sin(Math.PI*(.10+.85*u));
 return P(-.62+.17*u,side*(.045+leaf*.065+.004*Math.sin(22*Math.PI*u)*Math.sin(Math.PI*v)),.12-.54*u+width*(v-.5));
}
const mouth=()=>P(-.62,0,.12);
export function particlePosition(side,branch,t){
 t=clamp(Number.isFinite(t)?t:0,0,DURATION);
 const entry=gillPoint(side,branch,.72,.12);
 if(t<5)return mix(P(1.03,side*.015,.22),entry,(t-3)/2);
 if(t<8)return gillPoint(side,branch,.72,.12+.38*sm((t-5)/3));
 if(t<13)return gillPoint(side,branch,.72*(1-sm((t-8)/5)),.5);
 if(t<15)return mix(gillPoint(side,branch,0,.5),palpPoint(side,branch,.90,.5),(t-13)/2);
 if(t<18)return palpPoint(side,branch,.90*(1-sm((t-15)/3)),.5);
 return mix(palpPoint(side,branch,0,.5),mouth(),(t-18)/2);
}
function surface(fn,nu,nv,mat){const p=[],uv=[],ix=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){p.push(...fn(i/nu,j/nv).toArray());uv.push(i/nu,j/nv);}for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const n=i*(nv+1)+j;ix.push(n,n+nv+1,n+1,n+1,n+nv+1,n+nv+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return new T.Mesh(g,mat);}
function tube(points,r,mat){return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),64,r,8,false),mat);}
export function buildQuahogFeedingStudy(model,rig){
 if(model.id!=='mercenaria-mercenaria')throw Error('Mercenaria only');
 model.root.userData.hideStudioGround=true;
 const root=new T.Group();root.name='Quahog illustrative feeding cutaway';model.root.add(root);
 // The retained shell's dorsal hinge lies on negative model-x and its hinge
 // axis is model-z. Map anatomical posterior +x to model -z, ventral +z to
 // model +x. Fit the new tissues to this shell; never rotate its source UVs.
 root.rotation.y=Math.PI/2;root.scale.set(.82,1,1.15);
 const tissue=new T.MeshStandardMaterial({color:0xc7b89e,roughness:.65,side:T.DoubleSide}),dark=new T.MeshStandardMaterial({color:0x655343,roughness:.7,side:T.DoubleSide}),gills=[],palps=[],particles=[],siphons=[];
 const mantle=surface((u,v)=>{const a=u*2*Math.PI,r=.02+.94*v;return P(.98*r*Math.cos(a),-.26*(1-r*r)**.72+.02,.76*r*Math.sin(a));},96,32,tissue);mantle.name='Far mantle skirt; near skirt omitted for inspection';root.add(mantle);
 function organ(name,p,s,color){const o=new T.Mesh(new T.SphereGeometry(1,40,24),new T.MeshStandardMaterial({color,roughness:.65}));o.name=name;o.position.set(...p);o.scale.set(...s);root.add(o);return o;}
 organ('Visceral mass context',[-.10,-.025,-.02],[.42,.075,.40],0xc0ad8c);
 const foot=organ('Bladelike muscular foot; no burrowing simulated',[-.10,.005,.30],[.39,.065,.33],0xd0bda2);
 const fp=foot.geometry.attributes.position;for(let i=0;i<fp.count;i++){const x=fp.getX(i),y=fp.getY(i),z=fp.getZ(i),taper=1-.55*Math.max(0,z);fp.setXYZ(i,x*taper-.45*z,y*taper,z);}foot.geometry.computeVertexNormals();
 organ('Anterior adductor',[-.73,0,-.02],[.13,.14,.20],0xc9bba5);
 organ('Posterior adductor',[.67,0,-.08],[.14,.14,.18],0xc9bba5);
 // Short paired openings, unlike Mya's long common siphonal sheath.
 const siphonMat=new T.MeshStandardMaterial({color:0x6b5748,roughness:.68,side:T.DoubleSide});
 const siphonalBase=surface((u,v)=>{const a=v*2*Math.PI;return P(.68+.15*u,(.115-.02*u)*Math.cos(a),.145+(.175-.015*u)*Math.sin(a));},20,64,siphonMat);
 siphonalBase.name='Fused posterior mantle around the short siphon bases';root.add(siphonalBase);
 for(const z of [.07,.22]){
  const mesh=surface((u,v)=>{const a=v*2*Math.PI,r=.065+.010*(1-u);return P(.79+.25*u,r*Math.cos(a),z+r*Math.sin(a));},24,48,siphonMat);
  mesh.name=z>.1?'Short inhalant siphon':'Short exhalant siphon';root.add(mesh);siphons.push(mesh);
  const inside=surface((u,v)=>{const a=v*2*Math.PI;return P(.79+.25*u,.055*Math.cos(a),z+.055*Math.sin(a));},24,48,dark);inside.name='Siphon lumen';root.add(inside);siphons.push(inside);
  const rim=tube(Array.from({length:65},(_,i)=>P(1.04,.060*Math.cos(i/64*2*Math.PI),z+.060*Math.sin(i/64*2*Math.PI))),.006,siphonMat);rim.name='Siphonal rim';root.add(rim);siphons.push(rim);
  for(let i=0;i<12;i++){const a=i/12*2*Math.PI,p=P(1.04,.066*Math.cos(a),z+.066*Math.sin(a)),q=p.clone().add(P(.035,.02*Math.cos(a),.02*Math.sin(a)));const tent=tube([p,p.clone().lerp(q,.5),q],.0025,siphonMat);tent.name='Siphonal sensory fringe — schematic';root.add(tent);siphons.push(tent);}
 }
 for(const mesh of siphons)mesh.userData.base=mesh.geometry.attributes.position.array.slice();
 for(const side of[-1,1]){
  const axis=surface((u,v)=>gillPoint(side,0,u,0).lerp(gillPoint(side,1,u,1),v),96,8,tissue);axis.name='Common central axis joining the two demibranchs';root.add(axis);
  const attachment=surface((u,v)=>{const a=gillPoint(side,0,u,0).lerp(gillPoint(side,1,u,1),.5),b=P(a.x,side*.04,a.z+.08);return a.lerp(b,v);},96,8,tissue);attachment.name='Dorsal gill suspension — schematic attachment to body';root.add(attachment);
  if(side<0){const mantleJoin=surface((u,v)=>{const a=gillPoint(side,1,u,0),r2=clamp((a.x/.98)**2+(a.z/.76)**2,0,.99),b=P(a.x,-.26*(1-r2)**.72+.02,a.z);return a.lerp(b,v);},96,8,tissue);mantleJoin.name='Far ascending lamella attachment to mantle';root.add(mantleJoin);}
 }
 for(const side of[-1,1])for(const branch of[0,1]){
  const g=surface((u,v)=>gillPoint(side,branch,u,v),190,36,tissue);g.name=`${side<0?'Far':'Near'} ${branch?'lateral':'medial'} folded demibranch`;root.add(g);gills.push(g);
  const tr=tube(Array.from({length:65},(_,i)=>gillPoint(side,branch,i/64,.5)),.004,dark);tr.name='Ventral food groove';root.add(tr);
  const p=surface((u,v)=>palpPoint(side,branch,u,v),60,18,tissue);p.name='Narrow labial palp; sheets separated for inspection';root.add(p);palps.push(p);
  const junction=surface((u,v)=>mix(gillPoint(side,branch,0,.5),palpPoint(side,branch,.9,.5),u).add(P(0,0,.018*(2*v-1))),12,4,tissue);junction.name='Gill-to-palp junction — schematic connection';root.add(junction);
  const dot=new T.Mesh(new T.SphereGeometry(.020,16,10),new T.MeshBasicMaterial({color:0x29bd68}));dot.name='Enlarged accepted-particle marker';root.add(dot);particles.push({dot,side,branch});
 }
 root.add(tube([P(-.62,-.10,.12),mouth(),P(-.62,.10,.12)],.009,dark));
 const originalVisible=rig.upper.visible;
 function pose(time,enabled=true){const t=clamp(Number.isFinite(time)?time:0,0,DURATION);root.visible=enabled;rig.upper.visible=enabled?false:originalVisible;
  const extension=.35+.65*sm(clamp(t/3,0,1));
  for(const mesh of siphons){const a=mesh.geometry.attributes.position,b=mesh.userData.base;for(let i=0;i<a.count;i++)a.setXYZ(i,.79+(b[3*i]-.79)*extension,b[3*i+1],b[3*i+2]);a.needsUpdate=true;mesh.geometry.computeVertexNormals();}
  for(const p of particles){p.dot.position.copy(particlePosition(p.side,p.branch,t));p.dot.visible=enabled&&t>=3&&t<20;}
  model.root.updateMatrixWorld(true);return{duration:DURATION,time:t,stage:t<3?'Siphon extension — authored timing':t<5?'Inhalant approach':t<8?'Frontal transport toward ventral groove':t<13?'Anterior ventral-groove transport':t<15?'Transfer toward labial palps':t<18?'Accepted route on labial palps':t<20?'Oral-groove approach':'Study complete — digestion not simulated',measured:false};
 }
 pose(0,false);return{root,gills,palps,particles,siphons,pose};
}
