import * as T from 'three';
import {solveTwoLink} from './joint-kinematics.js';
import {skinMicroNormal} from './skin-microtexture.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),TAU=2*Math.PI;
// Original adult-worker illustration. Dimensions, venation, pigmentation and
// trajectories are authored; neither a specimen scan nor a measured gait.
export function buildBee(s){
 const root=new T.Group(),normal=skinMicroNormal(83,128),dark=new T.MeshStandardMaterial({color:'#30271c',roughness:.68,normalMap:normal,normalScale:new T.Vector2(.09,.09)}),gold=new T.MeshStandardMaterial({color:'#9a7341',roughness:.87}),eyeMat=new T.MeshStandardMaterial({color:'#171b18',roughness:.52,normalMap:normal,normalScale:new T.Vector2(.13,.13)}),parts={legs:[],wings:[],leaves:[],tails:[],tentacles:[],buds:[],growth:[]};
 const ell=(parent,p,size,material)=>{const o=new T.Mesh(new T.SphereGeometry(1,48,32),material);o.position.copy(V(...p));o.scale.copy(V(...size));o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const group=(parent,p=[0,0,0])=>{const o=new T.Group();o.position.copy(V(...p));parent.add(o);return o;};
 const rod=(parent,a,b,r,material=dark)=>{a=V(...a);b=V(...b);const d=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r*.76,r,d.length(),10),material);o.position.copy(a.add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());o.castShadow=true;parent.add(o);return o;};
 const thorax=ell(root,[.07,.78,0],[.36,.29,.28],dark);
 ell(root,[-.25,.69,0],[.17,.17,.16],dark);
 const abdomen=ell(root,[-.69,.69,0],[.60,.255,.27],dark.clone());abdomen.geometry.dispose();abdomen.geometry=new T.SphereGeometry(1,64,128).rotateZ(Math.PI/2);const ap=abdomen.geometry.attributes.position,colors=[];
 for(let i=0;i<ap.count;i++){const x=ap.getX(i),d=(x+1)*3,band=d-Math.floor(d),a=T.MathUtils.smoothstep(band,.10,.17)*(1-T.MathUtils.smoothstep(band,.45,.53)),c=new T.Color('#352f21').lerp(new T.Color('#8d805e'),a*.63),radius=(1+.15*x-.25*T.MathUtils.smoothstep(x,.35,.92))*(1-.015*Math.exp(-Math.pow((band-.08)/.055,2)));ap.setY(i,ap.getY(i)*radius+.08*x);ap.setZ(i,ap.getZ(i)*radius);colors.push(c.r,c.g,c.b);}
 abdomen.geometry.computeVertexNormals();
 abdomen.material.color.set('#ffffff');abdomen.material.vertexColors=true;abdomen.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const head=group(root,[.48,.81,0]);ell(head,[.03,0,0],[.22,.24,.21],dark);ell(head,[.19,-.10,0],[.055,.105,.12],gold);
 for(const side of [-1,1])ell(head,[.052,.012,.175*side],[.12,.182,.072],eyeMat);
 for(const p of [[.065,.218,0],[-.025,.20,-.075],[-.025,.20,.075]])ell(head,p,[.022,.020,.018],eyeMat);
 const antennas=[];
 for(const side of [-1,1]){const a=group(head,[.19,.075,.085*side]);rod(a,[0,0,0],[.16,.22,.07*side],.010);const f=group(a,[.16,.22,.07*side]);rod(f,[0,0,0],[.022,0,0],.012);for(let k=0;k<10;k++){rod(f,[.022+.018*k,-.004*k,.011*k*side],[.022+.018*(k+1),-.004*(k+1),.011*(k+1)*side],.0085);ell(f,[.022+.018*k,-.004*k,.011*k*side],[.009,.009,.009],dark);}antennas.push(a);rod(head,[.20,-.12,.08*side],[.23,-.19,.04*side],.012);rod(head,[.23,-.19,.04*side],[.23,-.21,0],.009);}
 const mouth=group(head,[.20,-.19,0]);rod(mouth,[0,0,0],[.025,-.10,0],.012);const tongue=rod(mouth,[.025,-.10,0],[.06,-.32,0],.007,gold);tongue.visible=false;
 const limbs=[];
 for(const side of [-1,1])for(let pair=0;pair<3;pair++){
  const x=[.29,.05,-.19][pair],upper=group(root,[x,.64,.16*side]);ell(upper,[0,0,0],[.045,.06,.045],dark);
  const femur=pair===2?.34:.32,tibia=pair===2?.42:.39;
  rod(upper,[0,0,0],[0,-femur,0],pair===2?.032:.023);
  const lower=group(upper,[0,-femur,0]);ell(lower,[0,0,0],[.028,.030,.027],dark);rod(lower,[0,0,0],[0,-tibia,0],pair===2?.037:.020);
  if(pair===2){ell(lower,[0,-tibia*.58,.009*side],[.048,tibia*.39,.019],dark);for(let k=0;k<17;k++)for(const edge of [-1,1])rod(lower,[edge*.040,-.06-k*.016,.028*side],[edge*.075,-.04-k*.016,.033*side],.0014,gold);}
  const foot=group(lower,[0,-tibia,0]);ell(foot,[.03,-.010,0],[pair===2?.052:.034,.016,.021],dark);
  for(let k=0;k<5;k++){rod(foot,[k*.024,-.008,0],[(k+1)*.024,-.008,0],k===0?.011:.006);if(k)ell(foot,[k*.024,-.008,0],[.007,.008,.008],dark);}
  for(const edge of [-1,1]){rod(foot,[.118,-.008,.004*edge],[.14,-.014,.018*edge],.0045);rod(foot,[.14,-.014,.018*edge],[.144,-.019,.012*edge],.003);}
  ell(foot,[.136,-.014,0],[.008,.007,.007],gold);
  limbs.push({upper,lower,foot,side,pair,home:V(x+[.25,0,-.22][pair],.151,side*[.47,.57,.52][pair]),phase:pair===1?(side===-1?.5:0):(side===-1?0:.5),stance:true});parts.legs.push(upper);
 }
 const wings=[];const membrane=new T.MeshStandardMaterial({color:'#b5bca4',transparent:true,opacity:.38,roughness:.28,side:T.DoubleSide,depthWrite:false});
 for(const side of [-1,1]){const wing=group(root,[.035,.98,.17*side]);
  for(let hind=0;hind<2;hind++){
   const outline=hind?[[0,0],[-.20,.08],[-.55,.24],[-.62,.36],[-.51,.48],[-.22,.43],[.02,.20]]:[[0,0],[-.15,.03],[-.62,.20],[-.93,.40],[-1.04,.60],[-.98,.71],[-.75,.75],[-.28,.56],[.07,.22]],p=[],ix=[];
   const border=new T.CatmullRomCurve3(outline.map(([x,z])=>V(x,hind?-.006:0,z*side)),true,'centripetal').getPoints(64).slice(0,-1),center=border.reduce((v,p)=>v.add(p),V()).divideScalar(border.length);p.push(...center.toArray());for(const point of border)p.push(...point.toArray());for(let i=0;i<border.length;i++)ix.push(0,1+i,1+(i+1)%border.length);
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();const mesh=new T.Mesh(g,membrane);wing.add(mesh);
   const veins=hind?[[[0,0],[-.36,.25],[-.51,.43]],[[0,0],[-.23,.32],[-.51,.43]]]:[[[0,0],[-.28,.14],[-.75,.43],[-1.00,.60]],[[0,0],[-.20,.29],[-.63,.60],[-.92,.69]],[[-.28,.14],[-.20,.29]],[[-.48,.28],[-.42,.45],[-.63,.60]],[[-.63,.38],[-.75,.43],[-.81,.65]]];
   for(const path of veins)for(let k=1;k<path.length;k++)rod(wing,[path[k-1][0],.003,path[k-1][1]*side],[path[k][0],.003,path[k][1]*side],.0018,gold);
  }wings.push({group:wing,side});parts.wings.push(wing);
 }
 // Branched hair cues use stable spatial sampling, not a noisy pixel atlas.
 const hairs=[],hairColors=[];let seed=614;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const hairSegment=(p,end,across)=>{const width=.00055,a=p.clone().addScaledVector(across,width),b=p.clone().addScaledVector(across,-width);hairs.push(...a.toArray(),...b.toArray(),...end.toArray());for(let k=0;k<3;k++)hairColors.push(.22,.15,.07);};
 for(let i=0;i<6200;i++){const theta=rand()*TAU,z=rand()*2-1,r=Math.sqrt(1-z*z),n=V(r*Math.cos(theta),z,r*Math.sin(theta)),p=V(.07+n.x*.36,.78+n.y*.29,n.z*.28),length=.018+rand()*.022,end=p.clone().addScaledVector(n,length),across=V(-n.z,0,n.x).normalize();hairSegment(p,end,across);if(i%3===0)for(const side of [-1,1]){const at=p.clone().lerp(end,.65),tip=at.clone().addScaledVector(across,side*.007).addScaledVector(n,.005);hairSegment(at,tip,across);}}
 const hg=new T.BufferGeometry();hg.setAttribute('position',new T.Float32BufferAttribute(hairs,3));hg.setAttribute('color',new T.Float32BufferAttribute(hairColors,3));hg.computeVertexNormals();root.add(new T.Mesh(hg,new T.MeshStandardMaterial({vertexColors:true,roughness:.92,side:T.DoubleSide})));
 const coat=(parent,count,point)=>{const p=[],c=[];for(let i=0;i<count;i++){const x=2*rand()-1,a=rand()*TAU,q=Math.sqrt(1-x*x),n=V(x,q*Math.sin(a),q*Math.cos(a)),sample=point(n);if(!sample)continue;const at=sample.p,dir=sample.n.normalize(),cross=V().crossVectors(dir,V(0,1,0)).normalize(),tip=at.clone().addScaledVector(dir,.012+rand()*.018).addScaledVector(V(-1,-.5,0),.008),width=.0007;for(const vertex of [at.clone().addScaledVector(cross,width),at.clone().addScaledVector(cross,-width),tip]){p.push(...vertex.toArray());const shade=.23+rand()*.08;c.push(shade,shade*.88,shade*.64);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();parent.add(new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.94,side:T.DoubleSide})));};
 coat(root,9200,n=>{const band=((n.x+1)*3)%1,r=(1+.15*n.x-.25*T.MathUtils.smoothstep(n.x,.35,.92))*(1-.015*Math.exp(-Math.pow((band-.08)/.055,2)));return{p:V(-.69+n.x*.60,.69+(n.y*r+.08*n.x)*.255,n.z*r*.27),n:V(n.x/.60,n.y/.255,n.z/.27)};});
 coat(head,1800,n=>Math.abs(n.z)>.55||n.x>.65?null:{p:V(.03+n.x*.22,n.y*.24,n.z*.21),n:V(n.x/.22,n.y/.24,n.z/.21)});
 const m={root,parts,features:[V(.3,.54,.5),V(-.4,1.0,.52),V(.81,1.04,.17)],kind:'insect',id:s.id,variant:s.visual.variant,reference:true,beeRig:{limbs,wings,head,antennas,tongue,neutral:new Map()}};
 root.traverse(o=>m.beeRig.neutral.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()}));
 root.userData.reconstruction={version:'0.5.2',author:'PhenoVoxel Archive contributors',license:'MIT',reference:s.photograph?.source,geometry:'Original adult-worker external morphology; unmeasured proportions, pigment, venation and hair fields',animationValidated:false};
 animateBee(m,'observe',0);return m;
}
export function animateBee(m,action,t){
 const r=m.beeRig;for(const[o,b]of r.neutral){o.position.copy(b.position);o.quaternion.copy(b.quaternion);o.scale.copy(b.scale);}
 const flying=action==='fly',walking=action==='walk';m.root.position.set(0,flying?.70:0,0);m.root.rotation.set(0,0,0);
 r.tongue.visible=action==='forage';if(action==='forage')r.head.rotation.z=-.18+.02*Math.sin(t*1.7);
 for(const l of r.limbs){const target=l.home.clone();l.stance=true;
  if(walking){const u=(t*.72+l.phase)%1,stance=.62,stride=.21;l.stance=u<stance;target.x+=l.stance?stride*(.5-u/stance):stride*(-.5+(u-stance)/(1-stance));target.y+=l.stance?0:.09*Math.sin(Math.PI*(u-stance)/(1-stance));}
  if(flying){target.y+=.25;target.x-=.13;target.z*=.74;l.stance=false;}
  solveTwoLink(m,l.upper,l.lower,l.foot,target,V(0,.20,l.side));m.root.updateMatrixWorld(true);l.foot.quaternion.copy(l.foot.parent.getWorldQuaternion(new T.Quaternion()).invert());
 }
 for(const w of r.wings){w.group.rotation.x=w.side*(flying?.20+.75*Math.sin(t*TAU*12):-.06);w.group.rotation.y=w.side*(flying?-.12:-.68);}
 for(const[i,a]of r.antennas.entries())a.rotation.y=(i?1:-1)*Math.sin(t*(action==='forage'?2.2:.7))*(action==='observe'?.025:.09);
 m.root.updateMatrixWorld(true);
 m.features[0].copy(m.root.worldToLocal(r.limbs[4].foot.getWorldPosition(V())));m.features[1].copy(m.root.worldToLocal(r.wings[0].group.localToWorld(V(-.55,0,-.42))));m.features[2].copy(m.root.worldToLocal(r.antennas[0].localToWorld(V(.16,.22,-.07))));
}
