import * as T from 'three';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),TAU=Math.PI*2;
// Original display reconstruction: no measured geometry, fin forces or animal
// trajectories are imported. Pigmentation belongs to the mesh and exports.
export function buildZebrafish(s){
 const root=new T.Group(),bones=[],axial=[],fins=[],parts={legs:[],wings:[],leaves:[],tails:[],tentacles:[],buds:[],growth:[]};
 function bone(name,p,parent){const b=new T.Bone();b.name=name;b.position.copy(p);if(parent){b.position.sub(parent.getWorldPosition(V()));parent.add(b);}else root.add(b);root.updateMatrixWorld(true);bones.push(b);return b;}
 for(const x of [.85,.58,.25,-.10,-.45,-.78,-1.04,-1.24])axial.push(bone('PV_ZebrafishAxial'+axial.length,V(x,1.35,0),axial.at(-1)));
 const paired=[];for(const front of [true,false])for(const side of [-1,1]){const b=bone(`PV_Zebrafish${front?'Pectoral':'Pelvic'}${side}`,V(front?.58:.06,front?1.27:1.145,(front?.13:.075)*side),front?axial[1]:axial[3]);paired.push({bone:b,front,side});}
 root.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones),white=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.38,metalness:.08});
 function axialWeight(p){for(let i=0;i<axial.length-1;i++){const a=axial[i].getWorldPosition(V()).x,b=axial[i+1].getWorldPosition(V()).x;if(p.x>=b){const u=T.MathUtils.clamp((a-p.x)/(a-b),0,1);return[i,1-u,i+1,u];}}return[7,1,7,0];}
 function skin(g,weight,color,material=white){const p=g.attributes.position,ix=[],w=[],c=[];for(let i=0;i<p.count;i++){const v=V(p.getX(i),p.getY(i),p.getZ(i)),a=weight(v),rgb=color(v,i);ix.push(a[0],a[2]??a[0],0,0);w.push(a[1],a[3]??0,0,0);c.push(rgb.r,rgb.g,rgb.b);}g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ix,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(w,4));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();const mesh=new T.SkinnedMesh(g,material);mesh.castShadow=true;root.add(mesh);mesh.bind(skeleton);return mesh;}
 const sections=[[1.24,1.36,.012,.015],[1.12,1.37,.095,.055],[.86,1.35,.177,.117],[.54,1.34,.225,.142],[.12,1.35,.229,.130],[-.38,1.35,.181,.099],[-.82,1.35,.105,.053],[-1.12,1.35,.045,.025],[-1.25,1.35,.04,.015]];
 function section(u){const f=u*(sections.length-1),i=Math.min(sections.length-2,Math.floor(f)),v=f-i,blend=v*v*(3-2*v);return sections[i].map((a,k)=>T.MathUtils.lerp(a,sections[i+1][k],blend));}
 const pos=[],uv=[],indices=[],N=176,R=192;
 for(let i=0;i<=N;i++){const u=i/N,[x,y,ry,rz]=section(u);for(let j=0;j<=R;j++){const a=j/R*TAU;pos.push(x,y+ry*Math.sin(a),rz*Math.cos(a));uv.push(u,j/R);}}
 for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,b=a+R+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);
 const dark=new T.Color('#223746'),silver=new T.Color('#ccd1b9'),gold=new T.Color('#b8b384'),back=new T.Color('#677b66');
 function stripes(v,center=1.35,width=.023){let d=Infinity;for(let j=-2;j<=2;j++)d=Math.min(d,Math.abs(v.y-center-j*.075));return 1-T.MathUtils.smoothstep(d,width-.006,width+.006);}
 const body=skin(geo,axialWeight,(p)=>{const c=silver.clone(),ventral=T.MathUtils.smoothstep(1.35-p.y,.02,.18),dorsal=T.MathUtils.smoothstep(p.y-1.35,.10,.23);c.lerp(gold,.2).lerp(back,dorsal*.85);const headFade=1-T.MathUtils.smoothstep(p.x,.70,1.12),tailFade=T.MathUtils.smoothstep(p.x,-1.25,-.90);c.lerp(dark,stripes(p)*headFade*tailFade*(1-ventral*.2));const scale=.96+.035*Math.sin(p.x*160+Math.sin(p.y*132)*.45)*Math.cos(p.y*132);return c.multiplyScalar(scale);});body.name='Continuous adult-like zebrafish body and five longitudinal pigment bands';parts.body=body;
 // Close the small rostral and peduncle cross-sections using the same skin.
 for(const ring of [0,N]){const p=[],ix=[];const [x,y]=section(ring/N);p.push(x,y,0);for(let j=0;j<=R;j++)p.push(...pos.slice((ring*(R+1)+j)*3,(ring*(R+1)+j)*3+3));for(let j=0;j<R;j++)ix.push(0,ring?j+2:j+1,ring?j+1:j+2);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);skin(g,axialWeight,()=>silver.clone());}
 const membrane=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,transparent:true,opacity:.62,depthWrite:false,side:T.DoubleSide,roughness:.43});
 function fan(name,base,edge,weight,banded=false,rays=12){const P=[],U=[],I=[],A=80,B=12;for(let i=0;i<=A;i++){const u=i/A,a=base(u),b=edge(u);for(let j=0;j<=B;j++){const v=j/B,p=a.clone().lerp(b,v);p.z+=Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.014;P.push(...p.toArray());U.push(u,v);}}for(let i=0;i<A;i++)for(let j=0;j<B;j++){const a=i*(B+1)+j,b=a+B+1;I.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);const mesh=skin(g,weight,p=>{const c=new T.Color('#c3c4a0');if(banded)c.lerp(dark,stripes(p,1.35,.014)*.85);return c;},membrane);mesh.name=name;fins.push(mesh);
  for(let i=0;i<rays;i++){const u=(i+.5)/rays,a=base(u),b=edge(u),curve=new T.CatmullRomCurve3([a,a.clone().lerp(b,.4),b]);const ray=skin(new T.TubeGeometry(curve,10,.0016,4,false),weight,()=>new T.Color('#9faca1'));ray.name=name+' · illustrative fin ray';}
  return mesh;
 }
 fan('Bilobed caudal fin',u=>V(-1.24,1.35+(u-.5)*.065,0),u=>{const h=u*2-1;return V(-1.70-.20*Math.abs(h)**.72,1.35+h*.38,0);},()=>[7,1],true,17);
 fan('Dorsal fin',u=>V(.12-u*.64,1.56-u*.05,0),u=>V(.10-u*.81,1.57+.20*(u<.28?u/.28:(1-u)/.72)-u*.045,0),axialWeight,false,10);
 fan('Anal fin',u=>V(-.08-u*.75,1.14+u*.11,0),u=>V(-.12-u*.83,1.14-.20*Math.sin(Math.PI*u)**.65+u*.105,0),axialWeight,true,13);
 for(const {bone:b,front,side}of paired){const c=b.getWorldPosition(V()),index=bones.indexOf(b);fan(front?'Paired pectoral fin':'Paired pelvic fin',u=>c.clone().add(V(-u*.075,-u*.015,0)),u=>{const edge=u<.65?u/.65:(1-u)/.35;return c.clone().add(V(-(front?.30:.24)*u-.025,-.065*edge,side*(front?.18:.13)*edge));},()=>[index,1],false,front?9:6);parts.wings.push(b);}
 function tube(name,points,r,color){const mesh=skin(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,r,6,false),()=>[0,1],()=>new T.Color(color));mesh.name=name;return mesh;}
 for(const side of [-1,1]){
  const eye=new T.SphereGeometry(1,32,20);eye.scale(.055,.061,.025);eye.translate(1.006,1.421,.086*side);skin(eye,()=>[0,1],()=>new T.Color('#b7b274'));
  const pupil=new T.SphereGeometry(1,28,18);pupil.scale(.030,.037,.012);pupil.translate(1.012,1.424,.108*side);skin(pupil,()=>[0,1],()=>new T.Color('#122025'));
  tube('Opercular margin · gills remain internal',[V(.70,1.46,.111*side),V(.66,1.34,.139*side),V(.75,1.205,.097*side)],.002,'#596e68');
  tube('Small mouth margin',[V(1.212,1.354,.025*side),V(1.24,1.37,.015*side),V(1.238,1.382,0)],.0016,'#45574b');
 }
 root.updateMatrixWorld(true);skeleton.calculateInverses();const bind=bones.map(b=>b.quaternion.clone());
 const features=[V(-1.69,1.55,0),V(.69,1.36,.15),V(.05,1.35,.14)],featureBindings=[{bone:axial[7],offset:axial[7].worldToLocal(features[0].clone())},{bone:axial[0],offset:axial[0].worldToLocal(features[1].clone())},{bone:axial[2],offset:axial[2].worldToLocal(features[2].clone())}];
 const m={root,parts,features,featureBindings,kind:'fish',id:s.id,variant:s.visual.variant,reference:true,surfaceDetailed:true,viewerRig:s.visual.viewerRig,zebrafishRig:{skeleton,bones,axial,paired,bind,body,fins},animationValidated:false};root.userData.reconstruction={version:'0.4.8',reference:s.photograph?.source,geometry:'Original continuous zebrafish surface with longitudinal mesh pigmentation, seven fin membranes and qualitative shared articulation',animationValidated:false};return m;
}
export function animateZebrafish(m,action,t){
 const {bones,axial,paired,skeleton,bind}=m.zebrafishRig;bones.forEach((b,i)=>b.quaternion.copy(bind[i]));m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);
 if(action!=='observe'){
  const fast=action==='escape',search=action==='forage',phase=t*(fast?7.5:search?2.2:4.0),amplitude=fast?.15:search?.038:.075;
  // Delayed lateral bending increases toward the caudal peduncle. These
  // independently authored angles/frequencies do not solve hydrodynamics.
  for(let i=1;i<axial.length;i++)axial[i].rotateY(Math.sin(phase-i*.48)*amplitude*(.18+i*.12));
  paired.forEach(({bone,side,front})=>bone.rotateX(side*Math.sin(phase+(front?0:.7))*(search?.24:.10)));
  if(search)m.root.rotation.y=Math.sin(t*.55)*.18;
 }
 m.root.updateMatrixWorld(true);skeleton.update();
}
