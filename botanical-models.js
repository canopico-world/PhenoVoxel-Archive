import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const TAU=Math.PI*2,V=a=>new T.Vector3(...a),clamp=T.MathUtils.clamp;
export const botanicalSpecies=new Set(['mimosa-pudica','dionaea-muscipula','nepenthes-rajah','helianthus-annuus','ginkgo-biloba','sequoia-sempervirens','nelumbo-nucifera','dryopteris-filix-mas']);

// Original numerical surface fields. These are botanical illustrations, not
// photographs, spectroscopic measurements or extracted third-party textures.
export function botanicalMaterial(type='leaf',color='#436d28'){
 const N=192,rgb=new Uint8Array(N*N*4),height=new Uint8Array(N*N*4),base=new T.Color(color);
 const vein=(x,y)=>{const mid=Math.exp(-x*x*2600),secondary=Math.exp(-(Math.sin((y-Math.abs(x)*.52)*Math.PI*11)**2)*125)*Math.exp(-Math.abs(x)*1.1);return Math.max(mid,secondary*.40);};
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){
  const x=i/(N-1)*2-1,y=j/(N-1),noise=Math.sin(i*127.1+j*311.7)*43758.5453%1,
   v=type==='bark'?Math.pow(.5+.5*Math.sin(x*39+Math.sin(y*31)*.20),8):type==='pitcher'?.25+.15*Math.sin(x*35+y*91)*Math.sin(y*33-x*72):type==='lotus'?Math.exp(-(Math.sin((x+1)*Math.PI*12)**2)*100)*y:type==='petal'?.35*Math.cos(x*38):type==='fan'?.12*Math.cos(x*28):vein(x,y),
   grain=type==='bark'?.12:.025,shade=.91+.055*Math.sin(y*9+x*5)+grain*noise+v*.09;
  const c=base.clone().multiplyScalar(shade),k=(j*N+i)*4;
  const hex=c.getHex(T.SRGBColorSpace);rgb[k]=hex>>16&255;rgb[k+1]=hex>>8&255;rgb[k+2]=hex&255;rgb[k+3]=255;
  height[k]=height[k+1]=height[k+2]=Math.round(clamp(110+v*80+noise*12,0,255));height[k+3]=255;
 }
 const map=new T.DataTexture(rgb,N,N);map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;
 const bump=new T.DataTexture(height,N,N);bump.needsUpdate=true;
 return new T.MeshStandardMaterial({color:'#ffffff',map,bumpMap:bump,bumpScale:type==='bark'?.024:.003,roughness:type==='wax'?.57:.82,side:T.DoubleSide});
}
export function botanicalLeaf({length=1,width=.2,arch=.04,droop=0,serration=0,lobes=0,cordate=false,material,segments=30,crossSections=12}){
 const p=[],uv=[],ix=[],N=segments,R=crossSections;
 for(let i=0;i<=N;i++){
  const t=i/N,profile=cordate?Math.sin(Math.PI*Math.pow(t,.57))**.70:Math.sin(Math.PI*t)**.68;
  const w=Math.max(.00015,width*profile*(1+serration*Math.cos(t*Math.PI*32))*(lobes?.73+.27*Math.cos((t-.12)*TAU*lobes):1));
  for(let j=0;j<=R;j++){const x=j/R*2-1;p.push(x*w,arch*Math.sin(t*Math.PI)-droop*t*t+.012*Math.abs(x)**2*Math.sin(Math.PI*t),-length*t);uv.push(j/R,t);}
 }
 for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,b=a+R+1;ix.push(a,a+1,b,a+1,b+1,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
 const mesh=new T.Mesh(g,material);mesh.castShadow=mesh.receiveShadow=true;mesh.name='Curved leaf lamina with original venation';return mesh;
}
export function botanicalStudio(s){
 const root=new T.Group(),parts={legs:[],wings:[],leaves:[],tails:[],tentacles:[],buds:[],growth:[]},nodes=[],stems=[];
 const materials=new Map(),mat=(c,props={})=>{const k=c+JSON.stringify(props);if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial({color:c,roughness:.83,...props}));return materials.get(k);};
 const group=(p=[0,0,0],parent=root)=>{const g=new T.Group();g.position.set(...p);parent.add(g);return g;};
 const ell=(p,size,c,parent=root,props={})=>{const mesh=new T.Mesh(new T.SphereGeometry(1,24,16),mat(c,props));mesh.position.set(...p);mesh.scale.set(...size);parent.add(mesh);mesh.castShadow=mesh.receiveShadow=true;return mesh;};
 function tube(points,r,c,parent=root){const curve=new T.CatmullRomCurve3(points.map(V)),g=new T.TubeGeometry(curve,Math.max(8,points.length*8),r,7,false),mesh=new T.Mesh(g,typeof c==='string'?mat(c):c);parent.add(mesh);mesh.castShadow=mesh.receiveShadow=true;return mesh;}
 const node=(p,start=.0,parent=root)=>{const g=group(p,parent);nodes.push({group:g,start,base:g.position.clone(),scale:g.scale.clone()});parts.growth.push(g);return g;};
 const stem=(points,r,c)=>{const m=tube(points,r,c);stems.push({mesh:m,neutral:m.geometry.attributes.position.array.slice()});return m;};
 function finish(features,bindings=[]){
  nodes.forEach(n=>{n.base.copy(n.group.position);n.scale.copy(n.group.scale);});
  root.traverse(o=>o.userData.base={position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()});
  root.userData.reconstruction={version:'0.5.0',author:'PhenoVoxel Archive contributors',license:'MIT',reference:s.visual.referencePhoto,geometry:'Original species-specific botanical surfaces and numerical venation; qualitative organ emergence',validated:false,sourceIds:s.sources.map(x=>x.id)};
  return {root,parts,features:features.map(V),kind:s.visual.kind,id:s.id,variant:s.visual.variant,reference:true,viewerRig:s.visual.viewerRig,botanicalRig:{nodes,stems},featureBindings:bindings};
 }
 return {root,parts,nodes,stems,mat,group,ell,tube,node,stem,finish};
}
function binding(mesh,index){return {mesh,indices:[index],kind:'Approximate authored botanical tissue'};}
function buildMimosa(s){
 const {root,parts,node,group,ell,tube,stem,finish}=botanicalStudio(s),green=botanicalMaterial('leaf','#497630'),dark='#4c672f';
 stem([[0,.14,0],[.025,.8,0],[-.03,1.55,.02],[.045,2.3,0]],.022,dark);
 const pinnae=[];let leafFeature,pulvinusFeature,flowerFeature;
 for(let i=0;i<7;i++){
  const y=.42+i*.25,a=i*2.39996,branch=node([.015*Math.sin(y),y,0],.08+i*.065);branch.rotation.y=a;branch.rotation.x=.16+.20*Math.sin(i*1.7);
  const pulvinus=ell([0,0,-.025],[.027,.022,.042],'#6c843b',branch);pulvinus.name='Primary pulvinus';
  tube([[0,0,0],[0,.045,-.19],[0,.075,-.43]],.009,dark,branch);
  for(let k=0;k<4;k++){
   const side=k<2?-1:1,distal=k%2,pg=group([0,.065+distal*.008,-.35-distal*.08],branch);pg.rotation.y=side*(.27+distal*.72);
   const length=.59+distal*.05;tube([[0,0,0],[0,.012,-length*.48],[0,.025,-length]],.0045,dark,pg);ell([0,0,-.009],[.011,.012,.021],'#74863a',pg);
   const pf={group:pg,leaflets:[],index:pinnae.length};pinnae.push(pf);
   for(let j=0;j<11;j++)for(const side of [-1,1]){
    const t=(j+.6)/12,hinge=group([0,.025*t,-length*t],pg),orient=group([0,0,0],hinge);hinge.rotation.z=side*(.08+.055*Math.sin(j+i));orient.rotation.y=-side*Math.PI/2-.13;
    const lamina=botanicalLeaf({length:.155*(1-.28*t),width:.023*(1-.12*t),arch:.009,material:green});orient.add(lamina);
    ell([0,0,0],[.004,.004,.006],'#728744',hinge);pf.leaflets.push({group:hinge,side,order:j});parts.leaves.push({group:hinge,side});
    if(i===3&&k===0&&j===5&&side===1){leafFeature=binding(lamina,15*13+6);pulvinusFeature=binding(pulvinus,80);}
   }
  }
 }
 for(let i=0;i<2;i++){
  const a=i*2.4+.7,g=node([0,1.95+i*.17,0],.76+i*.08),tip=[Math.sin(a)*.22,.18,Math.cos(a)*.22];tube([[0,0,0],[tip[0]*.5,.12,tip[2]*.5],tip],.007,dark,g);
  const core=ell(tip,[.052,.052,.052],'#b96ca1',g);core.name='Mimosa flower head';const filamentGeometries=[];
  for(let k=0;k<92;k++){const theta=k*2.39996,phi=Math.acos(1-2*(k+.5)/92),d=[Math.cos(theta)*Math.sin(phi),Math.cos(phi),Math.sin(theta)*Math.sin(phi)];const thread=tube([tip,tip.map((v,j)=>v+d[j]*.095)],.0016,'#c67eab',g);filamentGeometries.push(thread.geometry);g.remove(thread);ell(tip.map((v,j)=>v+d[j]*.095),[.003,.003,.003],'#eed4d8',g);}
  const filamentMesh=new T.Mesh(mergeGeometries(filamentGeometries),new T.MeshStandardMaterial({color:'#dba8c8',roughness:.92}));g.add(filamentMesh);filamentGeometries.forEach(x=>x.dispose());if(i===0)flowerFeature=binding(core,80);
 }
 const m=finish([[.7,1.5,.2],[0,1.5,0],[.2,2.2,.2]],[leafFeature,pulvinusFeature,flowerFeature]);m.botanicalRig.pinnae=pinnae;m.botanicalRig.touchedPinna=12;return m;
}
function buildFlytrap(s){
 const {root,node,group,ell,tube,finish}=botanicalStudio(s),green=botanicalMaterial('leaf','#548536'),traps=[];let lobeFeature,hairFeature,toothFeature;
 for(let k=0;k<6;k++){
  const a=k*TAU/6+.12*Math.sin(k),rosette=node([0,.155,0],.04+k*.1);rosette.rotation.y=a;rosette.rotation.x=.08*Math.sin(k);rosette.scale.setScalar(.90+.13*Math.sin(k*2.3));
  const petiole=botanicalLeaf({length:.69,width:.105,arch:.045,droop:-.035,material:green});petiole.name='Broad basal rosette petiole';rosette.add(petiole);
  tube([[0,.012,0],[0,.04,-.35],[0,.06,-.69]],.006,'#6b883b',rosette);
  const trap=group([0,.067,-.68],rosette),pair=[];trap.rotation.x=.10+.09*Math.sin(k*1.4);
  for(const side of [-1,1]){
   const hinge=group([0,0,0],trap);hinge.rotation.z=side*.60;
   const p=[],uv=[],colors=[],ix=[],N=36,R=18;
   for(let i=0;i<=N;i++){const z=i/N*2-1,w=.31*Math.sqrt(Math.max(.000001,1-z*z));for(let j=0;j<=R;j++){
    const u=j/R;p.push(side*w*u,(.014*u+.073*u*u)*Math.sqrt(Math.max(0,1-z*z)),-z*.36);uv.push(j/R,i/N);
    const tint=new T.Color('#588a36').lerp(new T.Color('#9b484b'),.90*Math.sin(Math.PI*u)**.5*(1-.45*Math.abs(z)));colors.push(tint.r,tint.g,tint.b);
   }}
   for(let i=0;i<N;i++)for(let j=0;j<R;j++){const n=i*(R+1)+j,b=n+R+1;ix.push(n,b,n+1,n+1,b,b+1);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();
   const material=botanicalMaterial('wax','#ffffff');material.vertexColors=true;const lobe=new T.Mesh(g,material);lobe.name='Curved trap lobe';lobe.castShadow=lobe.receiveShadow=true;hinge.add(lobe);pair.push({hinge,side,lobe,neutral:g.attributes.position.array.slice()});
   for(let j=0;j<3;j++){
    const z=(j-1)*.16,x=side*(j===1?.12:.145),hair=tube([[x,.04,z],[x+side*.006,.095,z-.008],[x+side*.012,.122,z-.016]],.0019,'#938b6a',hinge);hair.name='Trigger hair';if(k===0&&side===1&&j===1)hairFeature=binding(hair,30);
   }
   for(let j=0;j<19;j++){
    const theta=-1.40+j/18*2.8+(side<0?.018:-.018),x=side*.31*Math.cos(theta),z=.36*Math.sin(theta),tooth=tube([[x,.087,z],[x+side*.026,.127,z*.99],[x+side*.015,.193,z*.97]],.0041,'#b0b778',hinge);tooth.name='Marginal cilium';if(k===0&&side===1&&j===9)toothFeature=binding(tooth,30);
   }
   if(k===0&&side===1)lobeFeature=binding(lobe,18*19+10);
  }
  tube([[0,.014,-.36],[0,.014,0],[0,.014,.36]],.007,'#70974e',trap);traps.push(pair);
 }
 const m=finish([[.7,.3,0],[.5,.3,0],[.9,.4,0]],[lobeFeature,hairFeature,toothFeature]);m.botanicalRig.traps=traps;return m;
}
function buildPitcher(s){
 const {root,node,group,ell,tube,finish}=botanicalStudio(s),green=botanicalMaterial('wax','#456e2d'),skin=botanicalMaterial('pitcher','#ffffff');skin.vertexColors=true;let pitcherFeature,peristomeFeature,tendrilFeature;
 // A lower-pitcher rosette. A pitcher is the tendril tip of a leaf, not a jar
 // attached directly to an upright stem; the lid stays above the open mouth.
 for(let k=0;k<4;k++){
  const n=node([0,.145,0],.06+k*.13);n.rotation.y=k*TAU/4+.19*Math.sin(k);
  const lamina=botanicalLeaf({length:1.04,width:.24,arch:.16,droop:.09,material:green});lamina.name='Leathery leaf blade';n.add(lamina);
  const tendril=tube([[0,.07,-1.04],[.08,.13,-1.18],[.13,.20,-1.31],[.13,.13,-1.39]],.010,'#61813d',n);tendril.name='Leaf-tip tendril';
  const pitcher=group([.13,-.009,-1.36],n);pitcher.rotation.y=Math.PI;
  const outer=[[.002,0],[.13,.012],[.22,.06],[.28,.20],[.285,.40],[.268,.60],[.265,.76]],inner=[[.244,.76],[.246,.61],[.261,.41],[.255,.21],[.19,.072],[.09,.047],[.002,.045]];
  const points=[...outer,...inner].map(([r,y])=>new T.Vector2(r,y)),g=new T.LatheGeometry(points,72),p=g.attributes.position;
  const colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),rise=clamp((y-.56)/.20,0,1)*z*.23;p.setXYZ(i,x,y+rise,z*.91);const inside=i%points.length>=outer.length,tint=new T.Color(inside?'#919764':'#884e52');tint.multiplyScalar(.94+.05*Math.sin(x*69+y*31+z*41));colors.push(tint.r,tint.g,tint.b);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  const body=new T.Mesh(g,skin);body.name='Continuous open pitcher wall and interior';body.castShadow=body.receiveShadow=true;pitcher.add(body);
  const pp=[],uv=[],ix=[],N=144,R=10;
  for(let i=0;i<=N;i++){const a=i/N*TAU,groove=.0055*Math.cos(a*72);for(let j=0;j<=R;j++){const b=j/R*TAU,r=.265+(.029+groove)*Math.cos(b);pp.push(Math.sin(a)*r,.76+Math.cos(a)*.058+.026*Math.sin(b),Math.cos(a)*r*.91);uv.push(i/N,j/R);}}
  for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,b=a+R+1;ix.push(a,b,a+1,a+1,b,b+1);}
  const rimG=new T.BufferGeometry();rimG.setAttribute('position',new T.Float32BufferAttribute(pp,3));rimG.setAttribute('uv',new T.Float32BufferAttribute(uv,2));rimG.setIndex(ix);rimG.computeVertexNormals();const rim=new T.Mesh(rimG,botanicalMaterial('wax','#a94f51'));rim.name='Ridged peristome';pitcher.add(rim);
  const lid=group([0,.80,-.235],pitcher);lid.rotation.x=1.06;const lidBlade=botanicalLeaf({length:.44,width:.225,arch:.028,cordate:true,material:botanicalMaterial('wax','#86494c')});lidBlade.name='Open pitcher lid';lid.add(lidBlade);tube([[0,.74,-.245],[0,.80,-.235],[0,.03,-.06].map((v,i)=>v+lid.position.toArray()[i])],.012,'#82424b',pitcher);
  // Two reduced wings on the lower pitcher; no invented digestive events.
  for(const side of [-1,1]){const pts=[];for(let j=0;j<=18;j++){const y=.10+j*.033,r=.24+.03*Math.sin(j/18*Math.PI);pts.push([side*.09,y,r*.86]);}tube(pts,.006,'#a06762',pitcher);for(let j=0;j<12;j++)tube([[side*.09,.14+j*.042,.238],[side*.12,.16+j*.042,.273]],.003,'#a7776e',pitcher);}
  if(k===0){pitcherFeature=binding(body,140);peristomeFeature=binding(rim,40*11+2);tendrilFeature=binding(tendril,20);}
 }
 return finish([[.3,.5,1.3],[.3,.9,1.3],[.1,.3,1.2]],[pitcherFeature,peristomeFeature,tendrilFeature]);
}
function buildSunflower(s){
 const {root,node,group,ell,tube,stem,finish}=botanicalStudio(s),green=botanicalMaterial('leaf','#416b2b'),ray=botanicalMaterial('petal','#e8b322'),bractMat=botanicalMaterial('leaf','#435e2c');
 const shoot=stem([[0,.14,0],[.018,1.0,0],[-.025,2.05,.01],[0,2.8,.04]],.034,'#4e692c');shoot.name='Hairy flowering stem';
 const hairGeometries=[];for(let i=0;i<290;i++){const y=.22+i/290*2.5,a=i*2.39996,start=[Math.cos(a)*.036,y,Math.sin(a)*.036],hair=tube([start,[start[0]*1.24,y+.01,start[2]*1.24]],.0008,'#a3ae83');hairGeometries.push(hair.geometry);root.remove(hair);}const hairs=new T.Mesh(mergeGeometries(hairGeometries),new T.MeshStandardMaterial({color:'#a3ae83',roughness:1}));root.add(hairs);hairGeometries.forEach(g=>g.dispose());
 // Stem hairs share stem elongation; they cannot hover beside a shortened shoot.
 const hairStem={mesh:hairs,neutral:hairs.geometry.attributes.position.array.slice()};
 for(let i=0;i<7;i++){
  const g=node([0,.43+i*.28,0],.03+i*.075);g.rotation.y=i<2?i*Math.PI:2.39996*i;g.rotation.x=.08+.2*Math.sin(i*1.4);
  const petioleLength=.18+i*.015;tube([[0,0,0],[0,.05,-petioleLength]],.010,'#526c31',g);const leaf=botanicalLeaf({length:.69-i*.025,width:.24-i*.008,arch:.03,droop:.12,serration:.055,cordate:true,material:green});leaf.position.set(0,.05,-petioleLength);g.add(leaf);
 }
 const head=node([0,2.8,.04],.65);head.rotation.x=.18;
 const receptacle=ell([0,0,-.045],[.40,.40,.072],'#50622e',head);receptacle.name='Involucre behind flower head';
 for(let j=0;j<30;j++){const a=j*TAU/30,g=group([Math.cos(a)*.32,Math.sin(a)*.32,-.05],head);g.rotation.z=a-Math.PI/2;const bract=botanicalLeaf({length:.18,width:.055,arch:.02,material:bractMat});bract.rotation.x=Math.PI/2;g.add(bract);}
 let rayFeature;for(let j=0;j<24;j++){
  const a=j*TAU/24+.019*Math.sin(j*3),g=group([Math.cos(a)*.34,Math.sin(a)*.34,.015],head);g.rotation.z=a-Math.PI/2;
  const petal=botanicalLeaf({length:.45+.045*Math.sin(j*2.4),width:.065,arch:.026,droop:.01,material:ray});petal.rotation.x=Math.PI/2;petal.name='Thin ray-floret ligule';g.add(petal);if(j===3)rayFeature=binding(petal,20*13+6);
 }
 const disc=ell([0,0,.008],[.365,.365,.063],'#655029',head);disc.name='Disc-floret receptacle';const floretGeo=[],floretMaterial=new T.MeshStandardMaterial({color:'#b3973b',roughness:.94});
 for(let j=0;j<480;j++){const a=j*2.399963,r=Math.sqrt((j+.5)/480)*.35,z=.03+.038*(1-(r/.36)**2),floret=new T.Mesh(new T.CylinderGeometry(.008,.010,.020,5),floretMaterial);floret.rotation.x=Math.PI/2;floret.position.set(Math.cos(a)*r,Math.sin(a)*r,z);floret.updateMatrix();floretGeo.push(floret.geometry.clone().applyMatrix4(floret.matrix));floret.geometry.dispose();}
 const florets=new T.Mesh(mergeGeometries(floretGeo),floretMaterial);florets.name='Spiral arrangement of disc florets';head.add(florets);floretGeo.forEach(g=>g.dispose());
 const m=finish([[.6,2.8,.1],[0,2.8,.1],[0,1.2,0]],[rayFeature,binding(disc,80),binding(shoot,100)]);m.botanicalRig.stems.push(hairStem);return m;
}
function buildTree(s){
 const {root,node,group,tube,stem,finish}=botanicalStudio(s),ginkgo=s.id==='ginkgo-biloba',bark=botanicalMaterial('bark',ginkgo?'#645842':'#785044'),leafMat=botanicalMaterial(ginkgo?'fan':'leaf',ginkgo?'#567830':'#315337'),veinMat=new T.MeshStandardMaterial({color:'#859650',roughness:.9});
 function taper(points,r0,r1,parent=root){const curve=new T.CatmullRomCurve3(points.map(V)),geometry=new T.TubeGeometry(curve,24,1,10,false),p=geometry.attributes.position;for(let i=0;i<=24;i++){const c=curve.getPointAt(i/24),r=T.MathUtils.lerp(r0,r1,i/24);for(let j=0;j<=10;j++){const k=i*11+j,v=V([p.getX(k),p.getY(k),p.getZ(k)]).sub(c).multiplyScalar(r).add(c);p.setXYZ(k,...v.toArray());}}geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,bark);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 const trunk=taper([[0,.14,0],[.02,1.1,0],[-.028,2.15,.015],[0,3.65,0]],ginkgo?.15:.21,.012);trunk.name='Tapered trunk with original bark fissures';
 const structural=[];for(let i=0;i<7;i++){const a=i*2.39996,r=.40+.09*Math.sin(i),m=taper([[0,.27,0],[Math.cos(a)*.15,.16,Math.sin(a)*.15],[Math.cos(a)*r,.14,Math.sin(a)*r]],.045,.004);m.name='Basal root flare';}
 const fanGeo=new T.BufferGeometry(),p=[],uv=[],ix=[],N=30,R=16;
 for(let i=0;i<=N;i++){const a=-1.07+i/N*2.14,edge=.26*(1-.16*Math.exp(-a*a*90))*(1+.015*Math.sin(i*3));for(let j=0;j<=R;j++){const r=edge*j/R;p.push(Math.sin(a)*r,.019*Math.sin(j/R*Math.PI)+.017*Math.sin(a*2)*j/R,-Math.cos(a)*r);uv.push(i/N,j/R);}}
 for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,b=a+R+1;ix.push(a,a+1,b,a+1,b+1,b);}fanGeo.setAttribute('position',new T.Float32BufferAttribute(p,3));fanGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));fanGeo.setIndex(ix);fanGeo.computeVertexNormals();
 const veinGeometries=[];function fork(a,r0,r1,depth){const points=[[Math.sin(a)*r0,.004,-Math.cos(a)*r0],[Math.sin(a)*r1,.009,-Math.cos(a)*r1]],m=tube(points,.0008,'#879455');veinGeometries.push(m.geometry);root.remove(m);if(depth>0)for(const d of [-1,1])fork(a+d*.11/2**(3-depth),r1,r1+.062,depth-1);}
 for(const a of [-.65,-.22,.22,.65])fork(a,0,.065,2);const veinGeo=mergeGeometries(veinGeometries);veinGeometries.forEach(g=>g.dispose());
 const needleGeo=botanicalLeaf({length:.088,width:.009,arch:.002,material:leafMat}).geometry;let leafFeature;
 const branches=ginkgo?18:24;
 for(let i=0;i<branches;i++){
  const y=(ginkgo?.75:.50)+i*(ginkgo?.15:.125),len=ginkgo?.92+.2*Math.sin(i*.5)-Math.max(0,i-11)*.07:1.25*(1-i/(branches+2)),branch=node([.018*Math.sin(y),y,0],.05+i*.028);branch.rotation.y=i*2.39996+.14*Math.sin(i);structural.push(branch);
  taper([[0,0,0],[len*.45,.035,0],[len,.23,.03]],ginkgo?.032:.026,.003,branch);const leafMatrices=[],petioleGeometries=[];let featureInstance;
  for(let j=1;j<=8;j++)for(const side of [-1,1]){
   const u=j/9,twig=group([len*u,.23*u*u,0],branch),spread=ginkgo?.24+.06*Math.sin(j):.25,tipHeight=ginkgo?.19+.06*Math.sin(j+i):.085;taper([[0,0,0],[.08,tipHeight*.35,side*spread*.5],[.14,tipHeight,side*spread]],.009,.0017,twig);
   if(ginkgo){for(let k=0;k<3;k++){
    const leaf=group([.14,tipHeight,side*spread],twig);leaf.rotation.y=side*(.35+k*.65)+j*.25;leaf.rotation.x=-.20+.70*Math.sin(i+j+k);leaf.rotation.z=.18*Math.cos(i*2+j);leaf.scale.setScalar(.66+.13*Math.sin(j+k));
    const petiole=tube([[0,0,0],[0,.009,-.07]],.0018,'#77923c',leaf);leaf.updateWorldMatrix(true,true);const inv=branch.matrixWorld.clone().invert(),matrix=inv.clone().multiply(leaf.matrixWorld).multiply(new T.Matrix4().makeTranslation(0,0,-.065));if(i===8&&j===5&&k===0&&side===1)featureInstance=leafMatrices.length;leafMatrices.push(matrix);petioleGeometries.push(petiole.geometry.clone().applyMatrix4(inv.multiply(petiole.matrixWorld)));petiole.removeFromParent();petiole.geometry.dispose();leaf.removeFromParent();
   }}else{
    const needles=new T.InstancedMesh(needleGeo,leafMat,76),helper=new T.Object3D();for(let k=0;k<76;k++){const flank=k%2?1:-1,spr=Math.floor(k/38),n=Math.floor(k%38/2),f=n/19;helper.position.set(.14*f+spr*.05*f,.085*f,side*spread*f+spr*.10*f);helper.rotation.set(.10*Math.sin(k+i),flank*Math.PI/2+side*.48,.08);helper.scale.setScalar(.88+.13*Math.sin(k));helper.updateMatrix();needles.setMatrixAt(k,helper.matrix);}if(side===-1)taper([[0,0,0],[.095,.04,-spread*.5+.05],[.19,.085,-spread+.10]],.004,.001,twig);else taper([[0,0,0],[.095,.04,spread*.5+.05],[.19,.085,spread+.10]],.004,.001,twig);needles.name='Opposed needle rows on flattened leafy sprays';needles.castShadow=true;twig.add(needles);
   }
  }
  if(ginkgo){const leaves=new T.InstancedMesh(fanGeo,leafMat,leafMatrices.length),veins=new T.InstancedMesh(veinGeo,veinMat,leafMatrices.length);leafMatrices.forEach((matrix,i)=>{leaves.setMatrixAt(i,matrix);veins.setMatrixAt(i,matrix);});leaves.name='Clustered fan-shaped leaves';leaves.castShadow=leaves.receiveShadow=true;branch.add(leaves,veins);const petioles=new T.Mesh(mergeGeometries(petioleGeometries),new T.MeshStandardMaterial({color:'#77923c',roughness:.85}));branch.add(petioles);petioleGeometries.forEach(g=>g.dispose());if(featureInstance!==undefined)leafFeature={...binding(leaves,15*17+11),instance:featureInstance};}
 }
 const m=finish([[.6,2.2,.3],[0,1.2,0],[0,.2,0]],[ginkgo?leafFeature:binding(trunk,100),ginkgo?binding(trunk,150):null,null]);m.botanicalRig.stems.push({mesh:trunk,neutral:trunk.geometry.attributes.position.array.slice()});m.botanicalRig.structural=structural;return m;
}
function buildLotus(s){
 const {root,node,group,ell,tube,finish}=botanicalStudio(s),green=botanicalMaterial('lotus','#537647'),petalMat=botanicalMaterial('petal','#ffffff');petalMat.vertexColors=true;
 const rhizome=tube([[-.45,.155,0],[-.20,.165,0],[.20,.16,.03],[.50,.155,.03]],.046,'#b1a080');rhizome.name='Exposed rhizome · normally in sediment';let leafFeature;
 for(let k=0;k<3;k++){
  const a=k*2.39996+.2,x=Math.cos(a)*.75,z=Math.sin(a)*.75,height=.58+k*.23,n=node([-.12+k*.12,.16,0],.03+k*.17),tip=[x,height,z];tube([[0,0,0],[x*.6,height*.45,z*.6],tip],.019,'#687e43',n);const g=group(tip,n);g.rotation.x=.10*Math.sin(k*1.3);g.rotation.z=.10*Math.cos(k);
  const p=[],uv=[],ix=[],N=64,R=18,radius=.57+k*.035;for(let i=0;i<=N;i++){const a=i/N*TAU;for(let j=0;j<=R;j++){const u=j/R,r=radius*u*(1+.015*Math.sin(a*7));p.push(Math.cos(a)*r,.065*u*u+.018*Math.sin(a*6)*u**3,Math.sin(a)*r);uv.push(i/N,u);}}
  for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,b=a+R+1;ix.push(a,b,a+1,a+1,b,b+1);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();const leaf=new T.Mesh(geo,green);leaf.name='Peltate cupped leaf with radial veins';leaf.castShadow=leaf.receiveShadow=true;g.add(leaf);if(k===1)leafFeature=binding(leaf,20*19+10);
 }
 const flowering=node([.18,.16,.06],.64),tip=[-.08,1.95,0];tube([[0,0,0],[.04,.9,.02],tip],.023,'#637b3d',flowering);const head=group(tip,flowering);
 const tepalCounts=[4,10,6];for(let layer=0;layer<3;layer++)for(let j=0;j<tepalCounts[layer];j++){
  const a=j*TAU/tepalCounts[layer]+layer*.23,g=group([0,.04,-.09],head);g.position.set(-Math.sin(a)*.075,.04,-Math.cos(a)*.075);g.rotation.y=a;
  const petal=botanicalLeaf({length:.63-layer*.15,width:.17-layer*.025,arch:.12-layer*.02,droop:-(.24+layer*.13),material:petalMat}),p=petal.geometry.attributes.position,c=[];for(let i=0;i<p.count;i++){const t=petal.geometry.attributes.uv.getY(i),color=new T.Color('#f5ede0').lerp(new T.Color('#cf809f'),.25+.65*t*t);c.push(color.r,color.g,color.b);}petal.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));petal.name='Thin graduated lotus tepal';g.add(petal);
 }
 const receptacle=new T.Mesh(new T.CylinderGeometry(.14,.085,.15,32),new T.MeshStandardMaterial({color:'#cbb46e',roughness:.76}));receptacle.position.y=.19;receptacle.name='Elevated receptacle containing carpels';head.add(receptacle);
 for(let i=0;i<9;i++){const a=i*2.39996,r=i?Math.sqrt(i/9)*.108:0;ell([Math.cos(a)*r,.266,Math.sin(a)*r],[.012,.004,.012],'#797b40',head);}
 for(let j=0;j<82;j++){const a=j*2.39996,r=.16+(j%3)*.018,y=.22+.025*Math.sin(j*1.4);tube([[Math.cos(a)*r,.06,Math.sin(a)*r],[Math.cos(a)*r*1.08,y,Math.sin(a)*r*1.08]],.0027,'#d5b35a',head);ell([Math.cos(a)*r*1.08,y,Math.sin(a)*r*1.08],[.0048,.016,.0048],'#d7b446',head);}
 return finish([[.5,.8,.5],[.1,2.3,.1],[0,.16,0]],[leafFeature,binding(receptacle,40),binding(rhizome,30)]);
}
function fernPoint(u,stage){
 const mature=V([0,2.5*u-.92*u*u,-.25*u-1.3*u*u]);let young;
 if(u<.40)young=V([0,u*1.13,-.03*u]);else{const a=(u-.40)/.60*TAU*1.4;young=V([0,.452+.14*Math.sin(a),-.012+.14*(Math.cos(a)-1)]);}
 return young.lerp(mature,stage);
}
function poseFern(frond,stage){
 const N=48,R=6,p=frond.rachis.geometry.attributes.position;
 for(let i=0;i<=N;i++){const u=i/N,center=fernPoint(u,stage),tangent=fernPoint(Math.min(1,u+.002),stage).sub(fernPoint(Math.max(0,u-.002),stage)).normalize(),binormal=tangent.clone().cross(new T.Vector3(1,0,0)).normalize(),radius=.010*(1-u*.70);for(let j=0;j<=R;j++){const a=j/R*TAU,v=center.clone().add(new T.Vector3(Math.cos(a)*radius,0,0)).addScaledVector(binormal,Math.sin(a)*radius);p.setXYZ(i*(R+1)+j,...v.toArray());}}
 p.needsUpdate=true;frond.rachis.geometry.computeVertexNormals();frond.rachis.geometry.computeBoundingSphere();
 for(const pinna of frond.pinnae){const u=pinna.u,tangent=fernPoint(Math.min(1,u+.002),stage).sub(fernPoint(Math.max(0,u-.002),stage)).normalize();pinna.group.position.copy(fernPoint(u,stage));pinna.group.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),tangent);pinna.group.scale.setScalar(clamp((stage-.20-u*.42)/(.80-u*.42),.012,1));}
}
function buildFern(s){
 const {root,group,ell,tube,finish}=botanicalStudio(s),green=botanicalMaterial('leaf','#436b29'),pinnule=botanicalLeaf({length:.16,width:.027,arch:.006,serration:.045,segments:16,crossSections:6,material:green}).geometry,fronds=[];
 const rhizome=ell([0,.19,0],[.105,.09,.105],'#66553d');rhizome.material=botanicalMaterial('bark','#655640');rhizome.name='Erect basal rhizome crown';let frondFeature,soriFeature;
 for(let k=0;k<8;k++){
  const g=group([Math.cos(k*2.39996)*.055,.23,Math.sin(k*2.39996)*.055]);g.rotation.y=k*2.39996;g.scale.setScalar(.90+.11*Math.sin(k*1.7));
  const curve=new T.CatmullRomCurve3(Array.from({length:25},(_,i)=>fernPoint(i/24,1))),rachis=new T.Mesh(new T.TubeGeometry(curve,48,.010,6,false),new T.MeshStandardMaterial({color:'#536839',roughness:.88}));rachis.name='Arched frond rachis';rachis.castShadow=true;g.add(rachis);const frond={group:g,rachis,pinnae:[]};fronds.push(frond);
  for(let j=0;j<12;j++)for(const side of [-1,1]){
   const u=.22+j*.059,n=group([0,0,0],g),length=.45*Math.sin(Math.PI*u)**.70*(1-.30*u),tip=[side*length,.025,-.055];tube([[0,0,0],[side*length*.5,.019,-.028],tip],.0035,'#587338',n);
   const blades=new T.InstancedMesh(pinnule,green,16),helper=new T.Object3D(),matrices=[];blades.name='Divided pinna with serrate pinnules';blades.castShadow=blades.receiveShadow=true;
   for(let i=0;i<16;i++){const flank=i%2?1:-1,t=(Math.floor(i/2)+.5)/8;helper.position.set(side*length*t,.025*t,-.055*t);helper.rotation.y=flank===1?side*.24:Math.PI-side*.24;helper.rotation.z=side*.04;helper.scale.setScalar(1-.60*t);helper.updateMatrix();blades.setMatrixAt(i,helper.matrix);matrices.push(helper.matrix.clone());}n.add(blades);frond.pinnae.push({group:n,u});
   if(k===2&&j===5&&side===1)frondFeature={...binding(blades,8*7+3),instance:7};
   if(k===1&&j>=5&&j<10){const sori=new T.InstancedMesh(new T.SphereGeometry(1,10,6),new T.MeshStandardMaterial({color:'#8d6e39',roughness:.95}),16*4);sori.name='Distal underside sori on example fertile frond';for(let i=0;i<16;i++)for(let b=0;b<4;b++){const base=matrices[i],p=new T.Vector3((b%2?.011:-.011),-.003,-.055-Math.floor(b/2)*.039).applyMatrix4(base);helper.position.copy(p);helper.quaternion.setFromRotationMatrix(base);helper.scale.set(.006,.002,.005);helper.updateMatrix();sori.setMatrixAt(i*4+b,helper.matrix);}n.add(sori);if(j===7&&side===1)soriFeature={...binding(sori,22),instance:5};}
  }
  const scaleGeometries=[];for(let j=0;j<18;j++){const a=j*2.39996,y=.045+j*.022,leaf=botanicalLeaf({length:.047,width:.009,arch:.003,segments:8,crossSections:4,material:green});leaf.position.set(Math.cos(a)*.012,y,Math.sin(a)*.012);leaf.rotation.set(-.5,a,0);leaf.updateMatrix();scaleGeometries.push(leaf.geometry.clone().applyMatrix4(leaf.matrix));leaf.geometry.dispose();}const scales=new T.Mesh(mergeGeometries(scaleGeometries),new T.MeshStandardMaterial({color:'#9b7853',side:T.DoubleSide,roughness:.95}));scales.name='Pale brown stipe scales';g.add(scales);scaleGeometries.forEach(x=>x.dispose());poseFern(frond,1);
 }
 const m=finish([[.8,1,.5],[.9,1,.2],[0,.2,0]],[frondFeature,soriFeature,binding(rhizome,80)]);m.botanicalRig.fronds=fronds;return m;
}
export function buildBotanicalSpecimen(s){if(s.id==='mimosa-pudica')return buildMimosa(s);if(s.id==='dionaea-muscipula')return buildFlytrap(s);if(s.id==='nepenthes-rajah')return buildPitcher(s);if(s.id==='helianthus-annuus')return buildSunflower(s);if(s.id==='nelumbo-nucifera')return buildLotus(s);if(s.id==='dryopteris-filix-mas')return buildFern(s);if(['ginkgo-biloba','sequoia-sempervirens'].includes(s.id))return buildTree(s);throw Error('Unsupported botanical specimen: '+s.id);}
export function animateBotanical(m,action,t){
 const {root,botanicalRig:r}=m;root.traverse(o=>{const b=o.userData.base;if(b){o.position.copy(b.position);o.rotation.copy(b.rotation);o.scale.copy(b.scale);}});
 for(const stem of r.stems){const p=stem.mesh.geometry.attributes.position;p.array.set(stem.neutral);p.needsUpdate=true;}
 for(const trap of r.traps||[])for(const l of trap){l.lobe.geometry.attributes.position.array.set(l.neutral);l.lobe.geometry.attributes.position.needsUpdate=true;}
 if(r.fronds){r.fronds.forEach((f,i)=>poseFern(f,action==='unfurl'&&i===0?clamp(t/9,0,1):action==='grow'?clamp((t/9-i*.035)/(1-i*.035),0,1):1));root.updateMatrixWorld(true);return;}
 if(action==='grow'){
  const progress=clamp(t/9,0,1),height=.22+.78*progress;
  for(const {mesh,neutral} of r.stems){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,.14+(neutral[i*3+1]-.14)*height);p.needsUpdate=true;mesh.geometry.computeVertexNormals();}
  for(const n of r.nodes){const local=clamp((progress-n.start)/(1-n.start),.012,1);n.group.position.y=.14+(n.base.y-.14)*height;n.group.scale.copy(n.scale).multiplyScalar(local);}
 }else if(action==='trap'&&r.traps){
  const u=clamp(t/1.5,0,1),close=u*u*(3-2*u);
  for(const l of r.traps[0]){l.hinge.rotation.z+=l.side*close*.64;const p=l.lobe.geometry.attributes.position;for(let i=0;i<p.count;i++){const radial=p.getX(i)/.31;p.setY(i,l.neutral[i*3+1]-.035*close*radial*radial);}p.needsUpdate=true;l.lobe.geometry.computeVertexNormals();}
 }else if(action==='fold'&&r.pinnae){
  // A local touch example: only the selected pinna closes. Recovery is a
  // separate slow biological process; this illustrative closure holds shut.
  const target=r.pinnae[r.touchedPinna];for(const l of target.leaflets){const delay=(10-l.order)*.045,u=clamp((t-delay)/1.4,0,1),smooth=u*u*(3-2*u);l.group.rotation.z+=l.side*smooth*1.30;}
 }
 root.updateMatrixWorld(true);
}
