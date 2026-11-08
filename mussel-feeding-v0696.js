import * as T from 'three';
const clamp=T.MathUtils.clamp;
const P=(x,y,z)=>new T.Vector3(x,y,z);
const smooth=t=>t*t*(3-2*t);
// Qualitative Mytilus pallial topology. Coordinates, particle sizes and times
// are authored, not a measured dissection, flow field or clearance-rate model.
export const DURATION=18;
// Local axes: x anterior(-) to posterior(+); y left/right; z dorsal(-) to ventral(+).
// Four reflected sheets taper at their ends; the outer demibranch is shallower.
export function gillPoint(side,branch,u,v){
 const taper=Math.sin(Math.PI*u)**.65, depth=(branch?.22:.29)*(.23+.77*taper);
 return P(-.65+1.54*u,side*(.065+branch*.075)*(.62+.38*taper)+.017*Math.cos(Math.PI*v)*(.4+.6*taper),-.10-.04*Math.sin(Math.PI*u)+depth*Math.sin(Math.PI*v));
}
export function palpPoint(side,branch,u,v,time=0){
 const width=.165*Math.sin(Math.PI*u/2);
 const activity=T.MathUtils.smoothstep(time,10,11)*(1-T.MathUtils.smoothstep(time,15,17));
 const flex=.005*activity*Math.sin(time*4+u*10)*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
 return P(-1.00+.43*u,side*(.064+branch*.06)*u+.007*Math.sin(Math.PI*v)*u+flex,-.035+width*v+.014*Math.sin(Math.PI*u));
}
const mouthPoint=()=>P(-1,0,-.035);
function surface(fn,nu,nv,material){const a=[],ix=[],uv=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){a.push(...fn(i/nu,j/nv).toArray());uv.push(i/nu,j/nv);}for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const n=i*(nv+1)+j;ix.push(n,n+nv+1,n+1,n+1,n+nv+1,n+nv+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return new T.Mesh(g,material);}
function tube(points,r,material){return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),48,r,6,false),material);}
function piecewise(points,t){const q=clamp(t,0,1)*(points.length-1),i=Math.min(points.length-2,Math.floor(q));return points[i].clone().lerp(points[i+1],q-i);}
export function particlePosition(side,branch,reject,time,offset=0){
 const t=clamp((Number.isFinite(time)?time:0)-offset,0,DURATION),u=reject?.66:.80,point=gillPoint(side,branch,u,.18),front=gillPoint(side,branch,0,.5),palp=palpPoint(side,branch,.80,.55,t),mouth=mouthPoint();
 if(t<3)return {position:piecewise([P(1.36,side*.14,.36),P(1.03,side*.12,.25),point],smooth(t/3)),stage:'Incoming particle'};
 if(t<6)return {position:gillPoint(side,branch,u,.18+.32*smooth((t-3)/3)),stage:'Gill surface transport'};
 if(t<10)return {position:gillPoint(side,branch,u*(1-smooth((t-6)/4)),.5),stage:'Ventral groove transport'};
 if(t<12)return {position:front.clone().lerp(palp,smooth((t-10)/2)),stage:'Gill-to-palp transfer'};
 if(reject){
  if(t<13)return {position:palpPoint(side,branch,.80,.55+.45*smooth(t-12),t),stage:'Ventral palp rejection'};
  if(t<14)return {position:palpPoint(side,branch,.8+.2*smooth(t-13),1,t),stage:'Transport to posterior palp tip'};
  return {position:piecewise([palpPoint(side,branch,1,1,t),P(-.42,side*.15,.29),P(.25,side*.15,.37),P(1.02,side*.12,.28),P(1.35,side*.1,.42)],smooth((t-14)/4)),stage:t>=18?'Rejected before ingestion | end':'Mantle rejection route'};
 }
 if(t<15)return {position:palpPoint(side,branch,.8*(1-smooth((t-12)/3)),.55,t),stage:'Accepted along palp towards mouth'};
 return {position:mouth,stage:'Mouth entry | held'};
}
export function buildMusselFeedingStudy(model,rig){
 if(model.id!=='mytilus-edulis')throw Error('This study is Mytilus-specific');
 const root=new T.Group();root.name='Mytilus feeding cutaway — schematic';root.visible=false;model.root.add(root);
 const tissue=new T.MeshStandardMaterial({color:0x92714a,roughness:.57,side:T.DoubleSide});
 const grooveMat=new T.MeshStandardMaterial({color:0xd5b274,roughness:.42});
 const lineMat=new T.LineBasicMaterial({color:0x5e503d,transparent:true,opacity:.6});
 const gills=[],grooves=[],palps=[];
 for(const side of [-1,1])for(const branch of [0,1]){
  const g=surface((u,v)=>gillPoint(side,branch,u,v),70,30,tissue);g.name=`${side<0?'Left':'Right'} ${branch?'outer':'inner'} demibranch`;root.add(g);gills.push(g);
  const vertices=[];for(let i=0;i<75;i++){const u=(i+.5)/75;for(let j=0;j<20;j++)vertices.push(...gillPoint(side,branch,u,j/20).toArray(),...gillPoint(side,branch,u,(j+1)/20).toArray());}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const lines=new T.LineSegments(geo,lineMat);root.add(lines);
  const groove=tube(Array.from({length:25},(_,i)=>gillPoint(side,branch,i/24,.5)),.006,grooveMat);groove.name='Ventral food groove';root.add(groove);grooves.push(groove);
  const palp=surface((u,v)=>palpPoint(side,branch,u,v),32,24,tissue);palp.name='Labial palp';palp.userData={side,branch};root.add(palp);palps.push(palp);
 }
 const mouth=tube([mouthPoint(),P(-.93,0,-.07)],.014,new T.MeshStandardMaterial({color:0x503f36,roughness:.65}));mouth.name='Mouth entry — no digestive simulation';root.add(mouth);
 // Soft-tissue context: retained lower mantle lining, dorsal visceral mass,
 // unequal adductors and anterior muscular foot. These are authored landmarks,
 // not a segmented CT reconstruction or a complete digestive system.
 const context=new T.Group();context.name='Schematic soft-tissue context';root.add(context);
 const mantleMat=new T.MeshStandardMaterial({color:0xb18b55,roughness:.6,side:T.DoubleSide});
 const mantle=surface((u,v)=>{const a=2*Math.PI*u,r=.10+.82*v,x=1.30*Math.cos(a)*r,z=.51*Math.sin(a)*(.65+.35*(Math.cos(a)+1)/2)*r;return P(x,-.245*(1-r*r)**.72+.075,z);},100,28,mantleMat);mantle.name='Retained mantle lobe';context.add(mantle);
 function organ(name,position,scale,color){const mesh=new T.Mesh(new T.SphereGeometry(1,40,24),new T.MeshStandardMaterial({color,roughness:.62}));mesh.position.set(...position);mesh.scale.set(...scale);mesh.name=name;context.add(mesh);return mesh;}
 organ('Dorsal visceral mass',[-.05,0,-.16],[.76,.063,.12],0xa88453);
 organ('Posterior adductor',[.98,0,-.09],[.11,.18,.10],0xc8b995);
 organ('Small anterior adductor',[-1.12,0,-.015],[.027,.055,.035],0xc8b995);
 const foot=tube([P(-.26,0,-.06),P(-.35,0,.045),P(-.49,0,.17),P(-.59,0,.21)],.035,new T.MeshStandardMaterial({color:0x4c3d2c,roughness:.65}));foot.name='Muscular foot';context.add(foot);
 const particles=[];
 for(const side of [-1,1])for(const branch of [0,1])for(const reject of [false,true]){const dot=new T.Mesh(new T.SphereGeometry(.018,12,8),new T.MeshBasicMaterial({color:reject?0xffa64d:0x78f6ac}));dot.name=reject?'Illustrative rejected particle':'Illustrative accepted particle';root.add(dot);particles.push({dot,side,branch,reject});}
 const originalUpperVisible=rig.upper.visible;
 function pose(time,enabled=true){const t=clamp(Number.isFinite(time)?time:0,0,DURATION);root.visible=enabled;rig.upper.visible=enabled?false:originalUpperVisible;
  for(const palp of palps){const pos=palp.geometry.attributes.position,uv=palp.geometry.attributes.uv;for(let i=0;i<pos.count;i++){const p=palpPoint(palp.userData.side,palp.userData.branch,uv.getX(i),uv.getY(i),enabled?t:0);pos.setXYZ(i,p.x,p.y,p.z);}pos.needsUpdate=true;palp.geometry.computeVertexNormals();}
  for(const p of particles){const q=particlePosition(p.side,p.branch,p.reject,t);p.dot.position.copy(q.position);p.dot.visible=enabled&&(!(!p.reject&&t>=15));}
  const stage=t<3?'Inhalant entry':t<6?'Capture and gill-surface transport':t<10?'Anterior transport in ventral food grooves':t<12?'Labial palp processing':t<15?'Acceptance and pre-ingestive rejection':t<18?'Rejected material leaves the mantle margin':'Study complete';
  model.root.updateMatrixWorld(true);return {duration:DURATION,time:t,stage,cutaway:enabled,measured:false};
 }
 pose(0,false);return {root,gills,grooves,palps,particles,mouth,context,pose};
}
