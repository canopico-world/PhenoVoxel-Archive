import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
const V=a=>new T.Vector3(...a),TAU=Math.PI*2;
function studio(s){const root=new T.Group(),parts={legs:[],wings:[],leaves:[],tails:[],tentacles:[],buds:[],growth:[]};const materials=new Map();
 const mat=(c,props={})=>{const key=c+JSON.stringify(props);if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness:.72,...props}));return materials.get(key);};
 const group=(p=[0,0,0],parent=root)=>{const g=new T.Group();g.position.set(...p);parent.add(g);return g;};
 const ell=(p,size,c,parent=root,props={})=>{const o=new T.Mesh(new T.SphereGeometry(1,40,28),mat(c,props));o.position.set(...p);o.scale.set(...size);parent.add(o);return o;};
 const tube=(points,r,c,parent=root)=>{const curve=new T.CatmullRomCurve3(points.map(V)),o=new T.Mesh(new T.TubeGeometry(curve,points.length<=2?6:points.length>20?48:16,r,r<.01?4:8,false),mat(c));parent.add(o);return o;};
 function loft(sections,c,parent=root){const positions=[],uv=[],ix=[],N=70,R=40,curve=new T.CatmullRomCurve3(sections.map(a=>V([a[0],a[1],0])));for(let i=0;i<=N;i++){const u=i/N,f=u*(sections.length-1),a=Math.min(sections.length-2,Math.floor(f)),v=f-a,p=curve.getPoint(u),ry=T.MathUtils.lerp(sections[a][2],sections[a+1][2],v),rz=T.MathUtils.lerp(sections[a][3],sections[a+1][3],v);for(let j=0;j<=R;j++){const theta=j/R*TAU;positions.push(p.x,p.y+Math.sin(theta)*ry,Math.cos(theta)*rz);uv.push(u,j/R);}}for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,b=a+R+1;ix.push(a,b,a+1,a+1,b,b+1);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();const mesh=new T.Mesh(geo,mat(c));parent.add(mesh);return mesh;}
 function finish(features=[V([.8,1.7,.3]),V([0,1.2,.4]),V([-.5,.7,.2])]){const m={root,parts,features,kind:s.visual.kind,id:s.id,variant:s.visual.variant,reference:true};refineSurface(m,s);root.traverse(o=>o.userData.base={position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()});return m;}
 return {root,parts,mat,group,ell,tube,loft,finish};}

export function buildDetailedMicrobe(s){
 const {root,parts,mat,group,ell,tube,finish}=studio(s),id=s.visual.variant;
 const rod=['ecoli','bacillus','myxococcus','halobacterium'].includes(id),network=s.visual.kind==='network';
 const color=id==='halobacterium'?'#b16676':id==='euglena'||id==='chlamydomonas'?'#708d38':id==='physarum'?'#bd9a26':id==='neurospora-crassa'?'#bc7848':'#adbaa6';
 if(network){let seed=1329;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<32;i++){const a=i*2.39996,r=.3+random()*1.55,g=group();const x=Math.cos(a)*r,z=Math.sin(a)*r;tube([[0,.22,0],[x*.35,.23,z*.45],[x,.24,z],[x+Math.cos(a+.7)*.45,.22,z+Math.sin(a+.7)*.45]],id==='physarum'?.029:.013,color,g);for(let j=0;j<4;j++)tube([[x*j/4,.23,z*j/4],[x*j/4+.18,.25,z*j/4+.25],[x*j/4+.35,.23,z*j/4+.3]],.009,color,g);parts.growth.push(g);if(id==='neurospora-crassa'){for(let j=0;j<5;j++)ell([x+.025*j,.25+.065*j,z],[.036,.045,.036],'#cc8d53',g);}}return finish([V([1.2,.25,.5]),V([-.7,.24,.5]),V([0,.24,0])]);}
 let body;
 if(id==='amoeba'){
  const m=new MarchingCubes(42,mat('#a8b4a3',{transparent:true,opacity:.8,roughness:.34}),true,false,30000);m.reset();m.addBall(.48,.5,.5,4,12);for(let i=0;i<7;i++){const a=i*2.4;m.addBall(.5+Math.cos(a)*.22,.5+Math.sin(i)*.05,.5+Math.sin(a)*.23,1,12);}m.update();m.scale.set(2.5,1.25,2.25);m.position.y=1.3;root.add(m);parts.body=m;body=m;
 }else if(rod){body=new T.Mesh(new T.CapsuleGeometry(.3,id==='myxococcus'?2.3:1.6,12,40),mat(color,{roughness:.5}));body.rotation.z=Math.PI/2;body.position.y=1.3;root.add(body);parts.body=body;
 }else{const size=id==='paramecium'?[1.32,.43,.39]:id==='euglena'?[1.3,.4,.4]:id==='chlamydomonas'?[.72,.82,.7]:id==='yeast'?[.72,.8,.65]:[.74,.67,.67];body=ell([0,1.3,0],size,color,root,{transparent:true,opacity:.8,roughness:.35});parts.body=body;
  if(id==='paramecium'){const p=body.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setY(i,p.getY(i)*(1-.17*x));p.setZ(i,p.getZ(i)*(1-.12*x));}body.geometry.computeVertexNormals();}
  if(id==='sulfolobus'){const p=body.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.06*Math.sin(x*7)*Math.cos(y*6)*Math.sin(z*7);p.setXYZ(i,x*r,y*r,z*r);}body.geometry.computeVertexNormals();}
 }
 // Organelles are conceptual volume cues, not observed microscopy or a molecular simulation.
 if(s.domain==='Eukaryota'){const nucleus=ell([-.13,1.28,.12],[.19,.2,.18],'#7c816c',root,{transparent:true,opacity:.6});nucleus.userData.internal=true;for(let i=0;i<25;i++){const a=i*2.4,r=.15+(i%6)*.05;ell([Math.cos(a)*r,1.3+Math.sin(i)*.16,Math.sin(a)*r],[.018,.02,.018],'#d0d3b2');}
  if(id==='euglena'||id==='chlamydomonas'){for(let i=0;i<12;i++){const a=i*TAU/12;ell([Math.cos(a)*.35,1.3+Math.sin(a)*.3,Math.sin(i*2.4)*.22],[.14,.06,.12],'#516e2f');}ell([.48,1.48,.27],[.05,.047,.018],'#b15a35');}
  if(id==='paramecium'){ell([.75,1.3,0],[.11,.12,.12],'#d9dfc6');ell([-.85,1.28,0],[.13,.13,.13],'#d9dfc6');const groove=tube([[.6,1.11,.36],[.15,1.05,.37],[-.12,1.07,.33]],.018,'#7f927a');groove.name='Conceptual oral groove';}
 }
 if(id==='yeast'){const bud=ell([.67,1.78,0],[.32,.37,.3],color);parts.buds.push(bud);ell([.42,1.55,0],[.15,.17,.17],color);}
 if(id==='paramecium'){for(let j=0;j<360;j++){const a=j*2.39996,u=(j+.5)/360,b=Math.acos(1-2*u),x=Math.cos(a)*Math.sin(b)*1.32,y=Math.cos(b)*.43,z=Math.sin(a)*Math.sin(b)*.39;const g=group([x,1.3+y,z]);tube([[0,0,0],[x*.065,y*.14,z*.15],[x*.09,y*.2,z*.2]],.0035,'#aebdaf',g);parts.tentacles.push(g);}}
 else if(['ecoli','bacillus','halobacterium','euglena','chlamydomonas','sulfolobus'].includes(id)){const count=id==='chlamydomonas'?2:id==='bacillus'||id==='ecoli'?8:id==='halobacterium'?6:1;for(let j=0;j<count;j++){const a=j*2.4,polar=id==='halobacterium',side=polar&&j%2?-1:1,g=group([polar?side*1.08:rod?(j%3-1)*.7:id==='euglena'?1.28:id==='sulfolobus'?.74:.70,1.3+Math.cos(a)*(polar?.065:rod?.30:.16),Math.sin(a)*(polar?.065:rod?.30:.17)]),pts=[];for(let k=0;k<65;k++){const r=.09*(1-Math.exp(-k*.25));pts.push([side*k*.035,Math.sin(k*.32+a)*r,Math.cos(k*.32+a)*r]);}tube(pts,.007,'#b6c4a9',g);parts.tails.push(g);}}
 return finish([V([-.7,1.5,.35]),V([1.4,1.4,.1]),V([0,1.35,.2])]);
}

export function buildDetailedSmallAnimal(s){
 const {root,parts,mat,ell,tube,group,loft,finish}=studio(s),id=s.id;
 if(id==='lumbricus-terrestris'){const N=120;for(let i=0;i<N;i++){const u=i/(N-1),x=(u-.5)*3.8,r=.072*Math.sin(Math.PI*(.04+u*.92))+.035,g=group([x,.27,Math.sin(u*6)*.09]);ell([0,0,0],[.019,r,r],i>=31&&i<=37?'#976159':'#6f493f',g,{roughness:.4});parts.tentacles.push(g);for(let j=0;j<4;j++){const a=j*TAU/4;ell([0,Math.cos(a)*r,Math.sin(a)*r],[.006,.009,.006],'#aa9071',g);}}return finish([V([1.7,.27,.05]),V([-.7,.28,.06]),V([-.15,.27,.08])]);}
 if(id==='danio-rerio'){
  const body=loft([[-1.4,1.35,.01,.01],[-1.1,1.35,.13,.055],[-.7,1.35,.26,.12],[0,1.38,.36,.18],[.72,1.42,.32,.15],[1.08,1.4,.15,.1],[1.24,1.42,.04,.03]],'#bbc2a0');parts.body=body;
  const p=body.geometry.attributes.position,colors=[];for(let i=0;i<p.count;i++){const y=p.getY(i),x=p.getX(i),c=new T.Color(y>1.15&&y<1.62&&x<.95&&Math.sin((y-1.1)*67)>.1?'#233d50':'#a9b6a0');colors.push(c.r,c.g,c.b);}body.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));body.material=body.material.clone();body.material.vertexColors=true;body.material.roughness=.45;
  const tail=group([-1.16,1.35,0]);parts.tails.push(tail);for(const side of [-1,1]){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.64,.45*side,0,-.51,.12*side,.01,0,0,0,-.51,.12*side,.01,-.68,0,0],3));geo.computeVertexNormals();tail.add(new T.Mesh(geo,new T.MeshStandardMaterial({color:'#a7b595',transparent:true,opacity:.62,side:T.DoubleSide,roughness:.4})));}
  for(const side of [-1,1]){ell([.96,1.5,.097*side],[.044,.053,.017],'#182a2a');ell([.967,1.51,.11*side],[.018,.023,.008],'#c0b583');const f=group([.65,1.22,.12*side]);tube([[0,0,0],[-.3,-.22,.22*side],[-.55,-.12,.18*side]],.01,'#9eaa8d',f);parts.wings.push(f);}
  const dorsal=new T.BufferGeometry();dorsal.setAttribute('position',new T.Float32BufferAttribute([.15,1.70,0,-.08,1.89,0,-.35,1.84,0,.15,1.70,0,-.35,1.84,0,-.62,1.65,0],3));dorsal.computeVertexNormals();root.add(new T.Mesh(dorsal,mat('#99aba7',{transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide})));for(let i=0;i<5;i++)tube([[.08-i*.13,1.70,0],[.02-i*.12,1.85-i*.012,0]],.0035,'#728c8e');
  return finish([V([-1.7,1.6,0]),V([.6,1.2,.3]),V([.95,1.5,.12])]);
 }
 // Honey bee: three body regions, six segmented legs, four membranous wings.
 const abdomen=loft([[-1.04,1.12,.01,.01],[-.88,1.16,.17,.16],[-.54,1.21,.25,.23],[-.17,1.27,.2,.19]],'#9a7644');parts.body=abdomen;
 const p=abdomen.geometry.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),v=new T.Color(Math.sin((x+.9)*28)>.1?'#352d21':'#a78347');c.push(v.r,v.g,v.b);}abdomen.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));abdomen.material=abdomen.material.clone();abdomen.material.vertexColors=true;
 ell([.13,1.35,0],[.33,.31,.28],'#554632');const head=group([.52,1.43,0]);parts.head=head;ell([0,0,0],[.18,.21,.2],'#292923',head);for(const side of [-1,1]){ell([.07,.035,.145*side],[.08,.13,.05],'#0c171a',head);tube([[.1,.15,.07*side],[.22,.32,.13*side],[.34,.32,.2*side]],.009,'#343425',head);for(let j=0;j<3;j++){const g=group([-.1+j*.2,1.18,.16*side]);tube([[0,0,0],[-.05,-.18,.16*side],[.07,-.35,.25*side],[.22,-.43,.27*side]],.013,'#4e4532',g);parts.legs.push(g);}const wing=group([.02,1.57,.12*side]);for(let j=0;j<2;j++){const w=ell([-.22-j*.28,.015,(.46-j*.04)*side],[.53-j*.14,.012,.22-j*.055],'#b0c1ac',wing,{transparent:true,opacity:.37,side:T.DoubleSide});w.rotation.y=side*.28;for(let k=0;k<5;k++)tube([[0,.019,0],[-.13-j*.15,.02,(.25+k*.05)*side],[-.4-j*.17,.021,(.39+k*.03)*side]],.0022,'#6a7a67',wing);}parts.wings.push(wing);}
 for(let j=0;j<480;j++){const a=j*2.39996,b=Math.acos(1-2*(j+.5)/480),x=Math.cos(a)*Math.sin(b)*.31,y=Math.cos(b)*.3,z=Math.sin(a)*Math.sin(b)*.27;tube([[.13+x,1.35+y,z],[.13+x*1.13,1.35+y*1.13,z*1.13]],.0017,'#b4a079');}
 return finish([V([.72,1.7,.1]),V([-.2,1.57,.6]),V([0,.95,.36])]);
}

export function refineSurface(m,s){
 const hue=new T.Color(s.visual.color),kind=s.visual.kind;let seed=2167;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 // Original, deterministic surface grain; photographs remain separately credited references.
 const n=128,bytes=new Uint8Array(n*n*4);for(let i=0;i<n*n;i++){const val=Math.floor(110+rand()*90);bytes[i*4]=bytes[i*4+1]=bytes[i*4+2]=val;bytes[i*4+3]=255;}
 const bump=new T.DataTexture(bytes,n,n);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.repeat.set(kind==='tree'?2:4,kind==='tree'?12:4);bump.needsUpdate=true;
 let triangles=0;m.root.traverse(o=>{if(!o.isMesh||o.isMarchingCubes)return;o.castShadow=true;o.receiveShadow=true;const mats=(Array.isArray(o.material)?o.material:[o.material]).map(mat=>{const v=mat.clone();v.roughness=kind==='cell'?.4:kind==='fish'||kind==='salamander'||kind==='worm'?.52:.87;v.bumpMap=bump;v.bumpScale=kind==='tree'?.065:kind==='plant'?.01:kind==='cell'?.012:.023;return v;});o.material=Array.isArray(o.material)?mats:mats[0];
  if(o.geometry?.attributes.position){const g=o.geometry.clone(),p=g.attributes.position;if(!g.attributes.color&&kind!=='cell'){const colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),shade=.9+.06*Math.sin(x*19+y*17+z*13)+rand()*.07;colors.push(shade,shade,shade);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));mats.forEach(mat=>mat.vertexColors=true);}o.geometry=g;triangles+=(g.index?.count||p.count)/3;}
 });
 m.root.userData.reconstruction={version:'0.4.0',reference:s.photograph?.source,geometry:'Original reference-guided educational surface',animationValidated:false,triangles};m.surfaceDetailed=true;return m;
}

export function buildDetailedEctotherm(s){
 const {root,parts,mat,group,ell,tube,loft,finish}=studio(s),croc=s.visual.kind==='reptile',frog=s.visual.kind==='frog',ax=s.visual.kind==='salamander',color=croc?'#566149':frog?'#5d8739':'#c6b7a5';
 const body=loft(croc?[[-1.1,.65,.01,.01],[-.9,.66,.27,.29],[-.2,.69,.31,.34],[.6,.71,.28,.31],[.97,.72,.17,.24]]:frog?[[-.7,.73,.01,.01],[-.52,.8,.26,.33],[-.12,.86,.32,.4],[.35,.88,.26,.36],[.6,.87,.15,.25]]:[[-1.18,.65,.01,.01],[-.9,.66,.2,.22],[-.25,.68,.22,.24],[.65,.7,.18,.24],[.9,.72,.12,.24]],color);parts.body=body;
 const head=group([croc?1.06:frog?.52:.85,croc?.74:frog?.93:.75]);parts.head=head;
 loft(croc?[[-.2,0,.02,.02],[0,0,.19,.3],[.38,-.02,.12,.23],[.84,-.04,.08,.17],[1.02,-.04,.02,.13]]:frog?[[-.18,0,.06,.08],[0,0,.18,.37],[.24,-.03,.12,.34],[.4,-.07,.045,.22]]:[[-.25,0,.02,.02],[-.1,0,.2,.3],[.22,-.03,.16,.32],[.43,-.03,.06,.24]],color,head);
 for(const side of [-1,1]){const ex=croc?.12:frog?.08:.13,ey=croc?.13:frog?.13:.065,ez=croc?.24:frog?.31:.265;ell([ex,ey,ez*side],[frog?.064:.033,frog?.073:.034,.025],frog?'#a84625':'#111e1d',head,{roughness:.3});if(frog)ell([ex+.02,ey,ez*side+.018*side],[.009,.052,.011],'#17191b',head);tube(croc?[[.2,-.085,.26*side],[.65,-.09,.195*side],[.96,-.08,.14*side]]:[[.12,-.075,.32*side],[.31,-.09,.27*side],[.39,-.075,.23*side]],.0037,'#454c37',head);if(croc)for(let i=0;i<15;i++){const x=.22+i*.049;ell([x,-.09,(.25-i*.007)*side],[.01,.026,.009],'#bcb792',head);}}
 for(let i=0;i<4;i++){const front=i<2,side=i%2?1:-1,x=front?.45:-.66,g=group([x,.7,.25*side]);parts.legs.push(g);const elbow=front?[-.06,-.17,.25*side]:[.25,.06,.35*side],ankle=front?[.21,-.48,.42*side]:[-.28,-.34,.65*side];tube([[0,0,0],elbow,ankle],croc?.078:ax?.04:front?.045:.085,color,g);ell(elbow,front?[.09,.095,.1]:[.23,.12,.14],color,g);const digits=front?4:5;for(let j=0;j<digits;j++){const toe=[ankle[0]+.13+j*.032,ankle[1]-.015,ankle[2]+(j-(digits-1)/2)*.06];tube([ankle,[(ankle[0]+toe[0])/2,ankle[1]-.02,(ankle[2]+toe[2])/2],toe],frog?.012:ax?.008:.014,frog?'#b57a35':color,g);if(frog)ell(toe,[.034,.016,.024],'#bc873e',g);}}
 if(!frog){const tail=group([-1,.65,0]);parts.tails.push(tail);loft([[0,0,.15,.18],[-.4,-.03,.14,.14],[-1,-.12,.11,.08],[-1.75,-.21,.015,.018]],color,tail);if(ax){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.4,.25,0,-1,.19,0,0,0,0,-1,.19,0,-1.7,-.17,0,0,-.02,0,-1.7,-.17,0,-1,-.32,0],3));geo.computeVertexNormals();tail.add(new T.Mesh(geo,mat('#a89b83',{side:T.DoubleSide,transparent:true,opacity:.76,roughness:.44})));}}
 if(croc){for(let i=0;i<15;i++)for(let j=-2;j<=2;j++){const x=-.9+i*.115,z=j*.106;ell([x,.94-Math.abs(j)*.025,z],[.055,.043,.051],'#49543e');}for(const side of [-1,1])for(let i=0;i<20;i++)ell([-.85+i*.088,.77,side*.29],[.04,.04,.026],'#687356');}
 if(ax)for(const side of [-1,1])for(let j=0;j<3;j++){const pts=[[-.05,.05,.25*side],[-.1-j*.1,.23+j*.03,.47*side],[-.14-j*.12,.37+j*.04,.58*side]],g=group([0,0,0],head);tube(pts,.012,'#9a736b',g);for(let k=0;k<18;k++){const u=k/18,p=[-.06-j*.1*u,.1+u*(.26+j*.04),(.3+u*.28)*side];for(const branch of [-1,1])tube([p,[p[0]+branch*.075,p[1]+.03,p[2]+.025*side],[p[0]+branch*.12,p[1]+.055,p[2]+.04*side]],.0032,'#b1837d',g);}}
 if(frog)for(const side of [-1,1])for(let i=0;i<5;i++){const p=[],ix=[];for(let j=0;j<=10;j++){const y=.70+j*.026,z=side*(.393*Math.sqrt(Math.max(.1,1-((y-.84)/.30)**2))+.002);for(const edge of [-1,1])p.push(-.43+i*.14+edge*.028,y,z);}for(let j=0;j<10;j++){const a=j*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();root.add(new T.Mesh(g,mat(i%2?'#d6c792':'#547b93',{side:T.DoubleSide})));}
 return finish([V([croc?1.3:.8,croc?.8:1.1,.3]),V([-.5,.45,.7]),V([0,.99,.3])]);
}

export function buildDetailedTree(s){
 const {root,parts,mat,group,ell,tube,finish}=studio(s),ginkgo=s.id==='ginkgo-biloba',bark=ginkgo?'#675b47':'#795344';
 function taper(points,r0,r1,parent=root){const curve=new T.CatmullRomCurve3(points.map(V)),g=new T.TubeGeometry(curve,32,1,10,false),p=g.attributes.position;for(let i=0;i<=32;i++){const u=i/32,c=curve.getPointAt(u),r=T.MathUtils.lerp(r0,r1,u);for(let j=0;j<=10;j++){const k=i*11+j,v=V([p.getX(k),p.getY(k),p.getZ(k)]).sub(c).multiplyScalar(r).add(c);p.setXYZ(k,...v.toArray());}}g.computeVertexNormals();const mesh=new T.Mesh(g,mat(bark));parent.add(mesh);return mesh;}
 taper([[0,.16,0],[.04,1.2,0],[-.025,2.5,.01],[.015,3.65,0]],ginkgo?.15:.21,.018);ell([.015,3.65,0],[.018,.035,.018],bark);
 for(let i=0;i<8;i++){const a=i*2.4;tube([[0,.25,0],[Math.cos(a)*.25,.16,Math.sin(a)*.25],[Math.cos(a)*.55,.1,Math.sin(a)*.55]],.025,bark);}
 function fan(p,a,parent){const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(-.055,.09);for(let i=0;i<=20;i++){const theta=(-.98+i/20*1.96),r=.34*(1-.14*Math.exp(-theta*theta*60));shape.lineTo(Math.sin(theta)*r,Math.cos(theta)*r);}shape.lineTo(.055,.09);shape.lineTo(0,0);const g=group(p,parent),geo=new T.ShapeGeometry(shape,12),mesh=new T.Mesh(geo,mat('#759653',{side:T.DoubleSide}));mesh.rotation.x=-Math.PI/2;g.rotation.y=a;g.add(mesh);const veins=[];for(let i=0;i<11;i++){const theta=-.9+i*.18,v=tube([[0,.005,0],[Math.sin(theta)*.13,.006,-Math.cos(theta)*.13],[Math.sin(theta)*.3,.008,-Math.cos(theta)*.3]],.0019,'#9aac6c',g);veins.push(v.geometry);g.remove(v);}const combined=mergeGeometries(veins);veins.forEach(v=>v.dispose());g.add(new T.Mesh(combined,mat('#9aac6c')));return g;}
 const needleGeometry=new T.SphereGeometry(1,6,3),N=ginkgo?11:18;
 for(let i=0;i<N;i++){const a=i*2.39996,y=(ginkgo?1.05:.62)+i*(ginkgo?.215:.17),len=ginkgo?1.16-i*.046:1.17-i*.055,branch=group([.025*Math.sin(y),y,0]);branch.rotation.y=a;taper([[0,0,0],[len*.45,ginkgo?.12:-.035,.015],[len,ginkgo?.38:.12,.035*Math.sin(i)]],ginkgo?.027:.025,.004,branch);
  for(let j=1;j<=7;j++){const u=j/8,x=u*len,h=ginkgo?.38*u*u:.08*u;for(const side of [-1,1]){const tip=[x+.08,h+(ginkgo?.07:.02),side*(ginkgo?.24:.15)],twig=group([x,h,0],branch);taper([[0,0,0],[.05,.04,side*.12],[.08,ginkgo?.07:.02,tip[2]]],.008,.002,twig);
   if(ginkgo){const leaf=fan([.08,.07,tip[2]],a*.15+j*.7+side*.4,twig);leaf.scale.setScalar(.54+(j%3)*.04);leaf.rotation.x=.65+.30*Math.sin(i*2+j);leaf.rotation.z=.15*Math.cos(j+i);parts.growth.push(leaf);}
   else{const needles=new T.InstancedMesh(needleGeometry,mat('#3d6545'),24),helper=new T.Object3D();for(let k=0;k<24;k++){const flank=k%2?1:-1,n=Math.floor(k/2);helper.position.set(.03+n*.008,.035,tip[2]*n/12);helper.scale.set(.009,.004,.043);helper.rotation.y=flank*.8+side*.2;helper.updateMatrix();needles.setMatrixAt(k,helper.matrix);}twig.add(needles);twig.rotation.x=.15*Math.sin(i+j);parts.growth.push(twig);}
  }}
 }
 return finish([V([.7,2.5,.4]),V([0,1.1,.13]),V([0,3.3,0])]);
}

export function buildDetailedOctopus(s){
 const {root,parts,mat,group,ell,tube,finish}=studio(s),skin='#8a694d';
 const mantle=ell([0,1.36,0],[.36,.57,.34],skin);parts.body=mantle;
 const head=group([0,.95,0]);parts.head=head;ell([0,0,0],[.38,.23,.37],skin,head);
 for(const side of [-1,1]){ell([.12,.04,.33*side],[.075,.069,.036],'#ad9670',head,{roughness:.34});ell([.129,.043,.36*side],[.046,.012,.008],'#172b27',head,{roughness:.28});}
 const suckerGeometry=new T.TorusGeometry(1,.2,5,10),suckerMaterial=mat('#baab8c',{roughness:.62});
 for(let i=0;i<8;i++){
  const a=i*TAU/8,g=group([Math.cos(a)*.23,.89,Math.sin(a)*.23]);parts.tentacles.push(g);
  const points=[[0,0,0],[Math.cos(a)*.24,-.25,Math.sin(a)*.24],[Math.cos(a)*.77,-.61,Math.sin(a)*.77],[Math.cos(a+.2)*1.24,-.67,Math.sin(a+.2)*1.24],[Math.cos(a+.52)*1.56,-.57,Math.sin(a+.52)*1.56]],curve=new T.CatmullRomCurve3(points.map(V)),geo=new T.TubeGeometry(curve,58,1,16,false),position=geo.attributes.position;
  for(let ring=0;ring<=58;ring++){const u=ring/58,center=curve.getPointAt(u),r=.125*Math.pow(1-u,.8)+.009;for(let k=0;k<=16;k++){const ix=ring*17+k,p=V([position.getX(ix),position.getY(ix),position.getZ(ix)]).sub(center).multiplyScalar(r).add(center);position.setXYZ(ix,...p.toArray());}}geo.computeVertexNormals();g.add(new T.Mesh(geo,mat(skin,{roughness:.61})));
  for(let j=0;j<28;j++){const u=.06+j*.027,p=curve.getPointAt(u),r=.125*Math.pow(1-u,.8)+.009,tangent=curve.getTangentAt(u),across=new T.Vector3(-tangent.z,0,tangent.x).normalize();for(const side of [-1,1]){const sucker=new T.Mesh(suckerGeometry,suckerMaterial),center=p.clone().addScaledVector(across,side*r*.45);sucker.position.copy(center);sucker.position.y-=r*.86;sucker.rotation.x=Math.PI/2;sucker.scale.setScalar(.044*(1-u)+.006);g.add(sucker);}}
 }
 const m=finish([V([.18,1.08,.36]),V([.9,.32,.7]),V([0,1.75,.18])]);
 m.root.traverse(o=>{if(!o.isMesh||o.material===suckerMaterial)return;const mats=Array.isArray(o.material)?o.material:[o.material];if(!mats.some(a=>a.color?.getHexString()==='8a694d'))return;const p=o.geometry.attributes.position,c=[];for(let i=0;i<p.count;i++){const v=.82+.12*Math.sin(p.getX(i)*61+p.getY(i)*27)*Math.cos(p.getZ(i)*43);c.push(v,v*.99,v*.97);}o.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));mats.forEach(a=>a.vertexColors=true);});
 m.softBody=true;return m;
}

export function buildDetailedFungus(s){
 const {root,parts,mat,group,tube,finish}=studio(s),oyster=s.id==='pleurotus-ostreatus';
 const count=oyster?6:3;
 for(let j=0;j<count;j++){
  const g=group(oyster?[-.32+j*.07,.15+j*.25,Math.sin(j*2.4)*.2]:[Math.cos(j*2.4)*.55,.14,Math.sin(j*2.4)*.5]);g.scale.setScalar(oyster?.84-j*.045:j? .6+j*.07:1);parts.growth.push(g);
  tube([[0,0,0],[oyster?-.1:0,oyster?.20:.40,0],[0,oyster?.40:.85,0]],oyster?.09:.11,'#c8c0a6',g);
  if(oyster)tube([[-.32,.16,0],[g.position.x,.20+g.position.y*.65,g.position.z],[g.position.x,g.position.y,g.position.z]],.055,'#bdb69c');
  if(oyster){
   const N=40,R=22,p=[],uv=[],ix=[];for(let i=0;i<=R;i++){const u=i/R;for(let k=0;k<=N;k++){const a=-1.65+k/N*3.3,r=u*(.73+.035*Math.sin(a*9));p.push(Math.cos(a)*r,.40+.12*(1-u*u)+.018*Math.sin(a*7)*u,Math.sin(a)*r);uv.push(u,k/N);}}for(let i=0;i<R;i++)for(let k=0;k<N;k++){const a=i*(N+1)+k,b=a+N+1;ix.push(a,b,a+1,a+1,b,b+1);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();g.add(new T.Mesh(geo,mat('#a28f75',{side:T.DoubleSide})));for(let k=0;k<40;k++){const a=-1.6+k/39*3.2;tube([[0,.37,0],[Math.cos(a)*.28,.45,Math.sin(a)*.28],[Math.cos(a)*.68,.39,Math.sin(a)*.68]],.004,'#cdc4a8',g);}
  }else{
   const cap=new T.LatheGeometry([[0,1.53],[.14,1.53],[.32,1.48],[.5,1.38],[.6,1.22],[.57,1.15],[.32,1.17],[0,1.24]].map(a=>new T.Vector2(a[0],a[1]-.33)),64);g.add(new T.Mesh(cap,mat('#cfc7ad',{side:T.DoubleSide})));for(let k=0;k<48;k++){const a=k/48*TAU;tube([[Math.cos(a)*.09,.87,Math.sin(a)*.09],[Math.cos(a)*.32,.85,Math.sin(a)*.32],[Math.cos(a)*.54,.84,Math.sin(a)*.54]],.0038,'#8b7267',g);}g.add(new T.Mesh(new T.TorusGeometry(.12,.025,6,32).rotateX(Math.PI/2).translate(0,.70,0),mat('#c8c0a6')));
  }
 }
 return finish([V([.2,oyster?1.6:1.25,.3]),V([0,.55,.1]),V([-.4,.24,.2])]);
}
