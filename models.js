import * as THREE from 'three';
import {plantAction} from './plant-development-policy.js';
import {buildExpansionSpecimen,animateExpansion} from './expansion-models.js';
import { naturalSpecies, buildNaturalSpecimen, animateNatural } from './natural-models.js';
import {refineSurface,buildDetailedMicrobe,buildDetailedSmallAnimal,buildDetailedEctotherm,buildDetailedTree,buildDetailedOctopus,buildDetailedFungus} from './reference-surfaces.js';
import {animateMicroAppendages} from './microbe-motion.js';
import {buildAxolotl,animateAxolotl} from './axolotl-model.js';
import {buildZebrafish,animateZebrafish} from './zebrafish-model.js';
import {buildTreeFrog,animateTreeFrog} from './tree-frog-model.js';
import {buildEarthworm,animateEarthworm} from './earthworm-model.js';
import {botanicalSpecies,buildBotanicalSpecimen,animateBotanical} from './botanical-models.js';
import {buildBee,animateBee} from './bee-model.js';
import {contactMicrobes,buildContactMicrobe,animateContactMicrobe} from './contact-microbes.js';
const TAU=Math.PI*2;
export const modelKinds=['quadruped','kangaroo','ape','cetacean','bird','penguin','turtle','reptile','salamander','frog','fish','octopus','insect','butterfly','worm','jelly','plant','tree','mushroom','cell','network'];
export function buildSpecimen(species){
 if(species.visual.expansionProfile)return buildExpansionSpecimen(species);
 if(contactMicrobes.has(species.id))return buildContactMicrobe(species);
 if(botanicalSpecies.has(species.id))return buildBotanicalSpecimen(species);
 if(species.id==='lumbricus-terrestris')return buildEarthworm(species);
 if(species.id==='agalychnis-callidryas')return buildTreeFrog(species);
 if(species.id==='danio-rerio')return buildZebrafish(species);
 if(species.id==='ambystoma-mexicanum')return buildAxolotl(species);
 if(['pleurotus-ostreatus','agaricus-bisporus'].includes(species.id))return buildDetailedFungus(species);
 if(species.id==='octopus-vulgaris')return buildDetailedOctopus(species);
 if(['cell','network'].includes(species.visual.kind))return buildDetailedMicrobe(species);
 if(species.id==='apis-mellifera')return buildBee(species);
 if(['crocodylus-niloticus','ambystoma-mexicanum','agalychnis-callidryas'].includes(species.id))return buildDetailedEctotherm(species);
 if(['ginkgo-biloba','sequoia-sempervirens'].includes(species.id))return buildDetailedTree(species);
 if(naturalSpecies.has(species.id))return refineSurface(buildNaturalSpecimen(species),species);
 const root=new THREE.Group(),parts={legs:[],wings:[],leaves:[],tails:[],tentacles:[],buds:[],growth:[]};
 const color=species.visual.color,id=species.visual.variant,kind=species.visual.kind;
 const mats=new Map();
 const mat=(c,extra={})=>{const key=c+JSON.stringify(extra);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.68,...extra}));return mats.get(key);};
 function ell(parent,p,size,c,extra={}){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),mat(c,extra));mesh.position.set(...p);mesh.scale.set(...size);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function tube(parent,points,r,c){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,32,r,8,false),mat(c));mesh.castShadow=true;parent.add(mesh);return mesh;}
 function rod(parent,a,b,r,c){const delta=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.8,r,delta.length(),10),mat(c));mesh.position.copy(new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;}
 function pivot(parent,p){const g=new THREE.Group();g.position.set(...p);parent.add(g);return g;}
 function eyes(parent,x,y,z,size=.065){for(const side of [-1,1]){ell(parent,[x,y,z*side],[size,size,size],'#172421');ell(parent,[x+.015,y+.015,(z+.012)*side],[size*.28,size*.28,size*.28],'#eef4df');}}
 function leaf(parent,p,length,width,rotation,c='#789d73'){const g=pivot(parent,p);const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(width,.18*length,width*.85,.7*length,0,length);shape.bezierCurveTo(-width*.85,.7*length,-width,.18*length,0,0);const geo=new THREE.ShapeGeometry(shape,18);const verts=geo.attributes.position;for(let i=0;i<verts.count;i++){const x=verts.getX(i),y=verts.getY(i);verts.setZ(i,.04*Math.sin(y/length*Math.PI)*(1-Math.min(1,Math.abs(x)/width))+.018*Math.sin(y/length*9));}geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mat(c,{side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;g.rotation.y=rotation;g.add(mesh);tube(g,[[0,.009,0],[0,.015,-length*.5],[0,.006,-length]],.006,'#c0d6a0');return g;}
 let features=[new THREE.Vector3(0,2,0),new THREE.Vector3(.7,1.5,.3),new THREE.Vector3(-.5,.7,0)];
 if(['quadruped','ape','kangaroo'].includes(kind)){
  const elephant=id==='loxodonta-africana',giraffe=id==='giraffa-camelopardalis',rabbit=id==='oryctolagus-cuniculus',bear=id==='ursus-arctos',ape=kind==='ape',kang=kind==='kangaroo';
  const torso=pivot(root,[0,0,0]);parts.torso=torso;
  ell(torso,[0,1.45,0],[elephant?1.35:1.08,elephant?.78:bear?.72:.57,elephant?.63:.43],color);
  ell(torso,[-.72,1.38,0],[.5,.52,.43],color);
  let hx=1.14,hy=1.85;
  if(giraffe){rod(torso,[.65,1.7,0],[1.15,3.5,0],.2,color);hx=1.25;hy=3.6;}
  if(kang){ell(torso,[.2,1.85,0],[.48,.8,.36],color);hx=.62;hy=2.75;}
  if(ape){hx=.85;hy=2.1;ell(torso,[.75,1.7,0],[.58,.7,.45],color);}
  const head=pivot(torso,[hx,hy,0]);parts.head=head;
  ell(head,[0,0,0],[elephant?.58:.36,elephant?.6:.36,elephant?.45:.31],color);
  if(ape){ell(head,[.2,-.08,0],[.24,.24,.25],'#b59d83');}else if(!elephant)ell(head,[.28,-.1,0],[rabbit?.22:.33,.2,.23],giraffe?'#bfa477':color);
  ell(head,[.53,-.07,0],[.055,.055,.12],'#354339');eyes(head,.24,.1,elephant?.42:.28);
  for(const side of [-1,1]){
   if(elephant)ell(head,[-.15,.12,.59*side],[.34,.63,.1],color);
   else {const e=ell(head,[-.1,.35,.22*side],[rabbit?.1:.12,rabbit?.52:.2,.085],color);e.rotation.x=side*.18;ell(head,[-.065,rabbit?.58:.39,.24*side],[rabbit?.055:.07,rabbit?.3:.1,.03],'#c29c90');}
  }
  if(elephant){const trunk=pivot(head,[.45,-.14,0]);tube(trunk,[[0,0,0],[.2,-.5,0],[.23,-1.1,.03],[.52,-1.35,.08]],.16,color);parts.trunk=trunk;for(const side of [-1,1])tube(head,[[.35,-.32,.3*side],[.8,-.28,.32*side],[.92,-.05,.3*side]],.065,'#e4d7b2');}
  if(giraffe){for(const side of [-1,1]){rod(head,[-.1,.3,.14*side],[-.13,.63,.14*side],.045,color);ell(head,[-.13,.65,.14*side],[.065,.065,.065],'#655742');}for(let j=0;j<19;j++){const x=-.9+(j%6)*.33,y=1.15+Math.floor(j/6)*.18;for(const side of [-1,1])ell(torso,[x,y,side*.415],[.13,.12,.025],'#8b684a');}}
  if(id==='panthera-tigris'){for(let j=0;j<10;j++)for(const side of [-1,1]){const stripe=ell(torso,[-.9+j*.2,1.53,side*.426],[.042,.4,.025],'#3d4335');stripe.rotation.z=.16*Math.sin(j);}}
  for(let i=0;i<4;i++){
   const front=i<2,x=front?.67:-.7,z=i%2===0?.32:-.32;
   const leg=pivot(torso,[x,1.34,z]);parts.legs.push(leg);
   const len=elephant?1.3:giraffe?1.35:ape?(front?1.3:.9):.98;
   rod(leg,[0,0,0],[front&&ape?.2:0,-len*.57,0],elephant?.22:bear?.17:.12,color);
   rod(leg,[front&&ape?.2:0,-len*.57,0],[.1,-len,0],elephant?.2:.09,color);
   ell(leg,[.17,-len,.02],[elephant?.25:rabbit&&!front?.32:.19,.11,.15],color);
   if(kang&&!front)ell(leg,[-.08,-.15,0],[.35,.5,.24],color);
  }
  const tail=pivot(torso,[-1,1.5,0]);tube(tail,[[0,0,0],[-.5,-.1,0],[-1,-.4,.12],[-1.25,-.2,.2]],kang?.15:elephant?.025:.055,color);parts.tails.push(tail);
  if(id==='vulpes-vulpes')ell(tail,[-.9,-.32,.12],[.45,.15,.15],'#d5c7a8');
  if(rabbit){tail.clear();ell(tail,[-.08,-.1,0],[.18,.18,.18],'#e6dbc4');}
  if(elephant||giraffe)ell(tail,[-1.2,-.25,.2],[.1,.15,.1],'#4f5747');
  features=[new THREE.Vector3(hx,hy+.3,.3),new THREE.Vector3(.7,.5,.35),new THREE.Vector3(-.7,1.65,.45)];
 }else if(['fish','cetacean'].includes(kind)){
  const whale=id==='megaptera-novaeangliae',dolphin=kind==='cetacean';
  ell(root,[0,1.6,0],[1.65,whale?.65:.46,whale?.58:.38],color);
  ell(root,[.75,1.4,0],[.82,.22,.3],'#d7ded1');
  if(dolphin&&!whale)ell(root,[1.55,1.65,0],[.45,.14,.18],color);
  eyes(root,1.12,1.75,.32,.06);
  const fin=new THREE.Mesh(new THREE.ConeGeometry(.28,.7,3),mat(color));fin.position.set(-.05,2.13,0);root.add(fin);
  for(const side of [-1,1]){const flipper=pivot(root,[.6,1.45,.25*side]);ell(flipper,[-.35,-.12,.45*side],[whale?.62:.4,.06,whale?.55:.3],color);flipper.rotation.x=side*.25;parts.wings.push(flipper);}
  const tail=pivot(root,[-1.4,1.6,0]);ell(tail,[-.45,0,0],[.65,.19,.16],color);
  if(dolphin){for(const side of [-1,1])ell(tail,[-.95,0,.3*side],[.35,.07,.42],color);}else for(const side of [-1,1])ell(tail,[-.95,.25*side,0],[.25,.35,.06],color);parts.tails.push(tail);
  if(id==='amphiprion-ocellaris'){for(const x of [-.8,0,.85]){const band=ell(root,[x,1.6,0],[.08,.48,.4],'#e4e6d6');band.rotation.z=-.15;}}
  if(id==='danio-rerio'){for(const side of [-1,1])for(let j=0;j<4;j++)ell(root,[0,1.37+j*.14,.37*side],[1.3,.028,.028],'#426477');}
  features=[new THREE.Vector3(-2.2,1.7,.1),new THREE.Vector3(.6,1.45,.6),new THREE.Vector3(1.4,1.7,.3)];
 }else if(['bird','penguin'].includes(kind)){
  const penguin=kind==='penguin',owl=id==='tyto-alba';
  ell(root,[0,1.45,0],[.5,.8,.42],color);ell(root,[.28,1.45,0],[.3,.64,.33],'#e1dfc9');
  const head=pivot(root,[.25,2.22,0]);parts.head=head;ell(head,[0,0,0],[.34,.35,.3],penguin?color:owl?'#dcd0ae':'#e4e2d6');
  eyes(head,.22,.03,.24,.055);const beak=new THREE.Mesh(new THREE.ConeGeometry(.09,.4,4),mat('#c9ab61'));beak.rotation.z=-Math.PI/2;beak.position.set(.43,-.06,0);head.add(beak);
  for(const side of [-1,1]){const wing=pivot(root,[0,1.88,.3*side]);for(let j=0;j<6;j++){ell(wing,[-j*.1,-j*.07,(.25+j*.15)*side],[.25,penguin?.07:.1,.42],color);}parts.wings.push(wing);const foot=pivot(root,[.05,.72,.2*side]);rod(foot,[0,0,0],[0,-.35,0],.04,'#bba26b');ell(foot,[.17,-.37,0],[.25,.065,.12],'#c2ac73');parts.legs.push(foot);}
  ell(root,[-.55,1.15,0],[.5,.1,.2],color);
  features=[new THREE.Vector3(.7,2.3,.1),new THREE.Vector3(0,1.5,1),new THREE.Vector3(.3,.4,.25)];
 }else if(['reptile','salamander','frog','turtle'].includes(kind)){
  const frog=kind==='frog',turtle=kind==='turtle',salamander=kind==='salamander';
  const long=kind==='reptile'?1.5:frog?.65:1;
  ell(root,[0,.85,0],[long,.34,turtle?.8:.4],color);
  if(turtle){ell(root,[0,1.08,0],[1.08,.5,.83],color);for(let i=0;i<7;i++)ell(root,[(i%3-1)*.42,1.48-Math.abs(i%3-1)*.13,(Math.floor(i/3)-1)*.33],[.23,.03,.24],'#667d61');}
  const head=pivot(root,[long,.95,0]);parts.head=head;ell(head,[0,0,0],[kind==='reptile'?.65:.4,.23,.33],color);eyes(head,.23,.16,.27,.08);
  if(frog)for(const side of [-1,1])ell(head,[.08,.25,.26*side],[.13,.14,.13],'#c35844');
  for(let i=0;i<4;i++){const x=i<2?long*.65:-long*.65,side=i%2===0?1:-1;const leg=pivot(root,[x,.8,.3*side]);if(turtle){ell(leg,[.04,-.1,.52*side],[.35,.065,.65],color);}else{rod(leg,[0,0,0],[-.2,-.25,.35*side],frog?.1:.075,color);rod(leg,[-.2,-.25,.35*side],[.16,-.5,.55*side],.065,color);ell(leg,[.24,-.5,.55*side],[.22,.05,.15],color);}parts.legs.push(leg);}
  if(!frog&&!turtle){const tail=pivot(root,[-long,.83,0]);tube(tail,[[0,0,0],[-.7,-.05,0],[-1.4,-.2,.08]],salamander?.12:.2,color);if(salamander)ell(tail,[-.6,.04,0],[.8,.22,.035],color);parts.tails.push(tail);}
  if(salamander)for(const side of [-1,1])for(let j=0;j<3;j++){tube(head,[[-.17,.1,.3*side],[-.3+j*.15,.45,.55*side],[-.5+j*.23,.6,.7*side]],.033,'#c18085');for(let n=0;n<4;n++)rod(head,[-.3+j*.15,.4+n*.035,(.5+n*.03)*side],[-.5+j*.15,.47+n*.035,(.58+n*.03)*side],.012,'#d9a2a4');}
  features=[new THREE.Vector3(long,.95,.4),new THREE.Vector3(-.5,.65,.8),new THREE.Vector3(0,1.22,0)];
 }else if(kind==='octopus'||kind==='jelly'){
  const jelly=kind==='jelly';ell(root,[0,1.9,0],[jelly?1:.58,jelly?.42:.7,jelly?1:.58],color,jelly?{transparent:true,opacity:.7}:{});
  if(!jelly)eyes(root,.38,1.7,.42,.09);
  for(let i=0;i<(jelly?12:8);i++){const a=i*TAU/(jelly?12:8),g=pivot(root,[Math.cos(a)*.32,jelly?1.6:1.5,Math.sin(a)*.32]);const len=jelly?1:1.5;tube(g,[[0,0,0],[Math.cos(a)*.3,-.4,Math.sin(a)*.3],[Math.cos(a)*len,-1.1,Math.sin(a)*len],[Math.cos(a)*(len+.2),-1.15,Math.sin(a)*(len+.2)]],jelly?.018:.075,color);parts.tentacles.push(g);if(!jelly)for(let j=1;j<5;j++)ell(g,[Math.cos(a)*j*.26,-.4-j*.17,Math.sin(a)*j*.26],[.045,.024,.045],'#d6c7b4');}
  features=[new THREE.Vector3(0,2.3,.2),new THREE.Vector3(.8,.55,.8),new THREE.Vector3(-.4,1.3,.3)];
 }else if(kind==='worm'){
  for(let i=0;i<34;i++){const x=(i-17)*.1;const seg=ell(root,[x,.5,Math.sin(i*.22)*.12],[.075,.11,.12],i>9&&i<14?'#aa777d':color);parts.tentacles.push(seg);}features=[new THREE.Vector3(.7,.5,.1),new THREE.Vector3(-.2,.5,.1),new THREE.Vector3(-.55,.5,.1)];
 }else if(kind==='butterfly'||kind==='insect'){
  const butterfly=kind==='butterfly';ell(root,[0,1.4,0],[.57,.19,.19],color);ell(root,[.5,1.48,0],[.22,.2,.2],'#34443a');eyes(root,.63,1.51,.12,.04);
  for(const side of [-1,1]){tube(root,[[.58,1.6,.08*side],[.9,1.85,.18*side],[1.05,1.93,.25*side]],.013,'#34443a');const wing=pivot(root,[.03,1.52,0]);for(let j=0;j<2;j++){const w=ell(wing,[j===0?.1:-.4,0,(butterfly?.78:.5)*side],[butterfly?.7:.45,.035,butterfly?.76:.42],butterfly?'#d89749':'#ccdcca',butterfly?{}:{transparent:true,opacity:.65});w.rotation.y=side*(j===0?.35:-.4);if(butterfly){for(let n=0;n<7;n++){const a=n*Math.PI/7;ell(wing,[(j===0?.1:-.4)+Math.cos(a)*.47,.04,(.65+Math.sin(a)*.6)*side],[.065,.01,.065],'#ece2ba');}for(let n=0;n<4;n++)rod(wing,[0,.045,0],[j===0?.5:-.6,.045,(.5+n*.25)*side],.012,'#393f34');}}parts.wings.push(wing);for(let j=0;j<3;j++){const leg=pivot(root,[-.3+j*.28,1.32,.1*side]);tube(leg,[[0,0,0],[-.15,-.25,.25*side],[.05,-.42,.45*side]],.015,'#34443a');parts.legs.push(leg);}}
  if(!butterfly)for(let i=0;i<4;i++)ell(root,[-.4+i*.18,1.4,0],[.042,.2,.2],'#3f483b');
  features=[new THREE.Vector3(.8,1.8,.1),new THREE.Vector3(-.1,1.55,1.2),new THREE.Vector3(.1,1,.4)];
 }else if(kind==='tree'){
  rod(root,[0,.2,0],[0,2.85,0],id==='redwood'?.21:.16,'#8c7760');
  if(id==='redwood'){for(let j=0;j<7;j++){const cone=new THREE.Mesh(new THREE.ConeGeometry(1.1-j*.12,.95,12),mat(color));cone.position.y=1.35+j*.32;cone.castShadow=true;root.add(cone);}}
  else {for(let j=0;j<9;j++){const a=j*2.4,y=1.25+j*.18,x=Math.cos(a)*.95,z=Math.sin(a)*.95;rod(root,[0,y,0],[x,y+.6,z],.055,'#8c7760');for(let n=0;n<9;n++){const ang=n*2.4;leaf(root,[x+Math.cos(ang)*.3,y+.55+Math.sin(n)*.15,z+Math.sin(ang)*.3],id==='ginkgo'?.35:.38,id==='ginkgo'?.22:.14,ang,color);}}}
  for(let j=0;j<5;j++){const a=j*TAU/5;tube(root,[[0,.2,0],[Math.cos(a)*.5,.1,Math.sin(a)*.5],[Math.cos(a)*.9,.06,Math.sin(a)*.9]],.05,'#8c7760');}
  features=[new THREE.Vector3(.85,2.6,.6),new THREE.Vector3(0,1,.2),new THREE.Vector3(0,2.9,0)];
 }else if(kind==='plant'){
  const green='#7fac7d',dark='#567b57';
  if(['mimosa','fern'].includes(id)){
   rod(root,[0,.2,0],[0,2.7,0],.034,dark);
   for(let j=0;j<8;j++){
    const a=j*2.4,y=.6+j*.24,len=1.25-j*.055;
    const branch=pivot(root,[0,y,0]);branch.rotation.y=a;
    if(id==='mimosa'){
     tube(branch,[[0,0,0],[0,.15,-.28],[0,.22,-.46]],.015,dark);
     for(let p=0;p<4;p++){
      const pinna=pivot(branch,[0,.22,-.46]);pinna.rotation.y=(p<2?-1:1)*(.2+(p%2)*.6);
      const plen=.65+(p%2)*.1;tube(pinna,[[0,0,0],[0,.1,-plen*.5],[0,.18,-plen]],.009,dark);
      for(let n=0;n<12;n++)for(const side of [-1,1]){const z=-.045-n*plen/13,h=.18*(-z/plen);const l=leaf(pinna,[0,h,z],.15*(1-n*.025),.03,side*Math.PI/2,green);parts.leaves.push({group:l,side});}
     }
    }else{
     tube(branch,[[0,0,0],[0,.24,-len*.5],[0,.46,-len]],.015,dark);
     for(let n=0;n<11;n++)for(const side of [-1,1]){const z=-.08-n*len/12,h=.46*(-z/len),lng=.48*(1-n*.055);const l=leaf(branch,[0,h,z],lng,.065,side*Math.PI/2,green);parts.leaves.push({group:l,side});}
    }
   }
   if(id==='mimosa')for(let j=0;j<3;j++){
    const x=Math.cos(j*2.4)*.62,z=Math.sin(j*2.4)*.62,y=2.45+j*.15;rod(root,[0,2.25,0],[x,y,z],.013,dark);ell(root,[x,y,z],[.16,.16,.16],'#c783ae');
    for(let n=0;n<60;n++){const a=n*2.4,b=Math.acos(1-2*(n+.5)/60),dx=Math.cos(a)*Math.sin(b),dy=Math.cos(b),dz=Math.sin(a)*Math.sin(b);rod(root,[x+dx*.1,y+dy*.1,z+dz*.1],[x+dx*.26,y+dy*.26,z+dz*.26],.005,'#dfafd0');ell(root,[x+dx*.26,y+dy*.26,z+dz*.26],[.018,.018,.018],'#ecd0df');}
   }
   features=[new THREE.Vector3(.8,1.5,.2),new THREE.Vector3(0,1.6,.03),new THREE.Vector3(.6,2.55,.1)];
  }else if(id==='flytrap'){
   for(let j=0;j<7;j++){const a=j*TAU/7;const x=Math.cos(a)*.65,z=Math.sin(a)*.65,y=.6+(j%3)*.28;rod(root,[0,.25,0],[x,y,z],.035,green);leaf(root,[0,.25,0],.7,.12,a,green);const trap=pivot(root,[x,y,z]);trap.rotation.y=a;
    for(const side of [-1,1]){const l=pivot(trap,[0,0,0]);ell(l,[.15*side,.06,0],[.3,.075,.4],green);ell(l,[.15*side,.12,0],[.24,.015,.34],'#b18180');for(let n=0;n<7;n++)rod(l,[.38*side,.1,(n-3)*.095],[.46*side,.28,(n-3)*.1],.009,'#b6c88b');parts.leaves.push({group:l,side});}
   }features=[new THREE.Vector3(.5,.95,.2),new THREE.Vector3(-.3,.65,.5),new THREE.Vector3(.8,.8,0)];
  }else if(id==='pitcher'){
   rod(root,[0,.3,0],[0,2.1,0],.05,dark);
   for(let j=0;j<5;j++){const a=j*2.4,y=.6+j*.3;const l=leaf(root,[0,y,0],.9,.2,a,green);const x=-Math.sin(a)*1.15,z=-Math.cos(a)*1.15;tube(root,[[-Math.sin(a)*.9,y,-Math.cos(a)*.9],[x,y+.08,z],[x,y-.2,z]],.012,dark);ell(root,[x,y-.47,z],[.26,.45,.26],color);const rim=new THREE.Mesh(new THREE.TorusGeometry(.24,.035,8,24),mat('#a55e66'));rim.rotation.x=Math.PI/2;rim.position.set(x,y-.1,z);root.add(rim);ell(root,[x,y-.14,z],[.2,.008,.2],'#3c5144');leaf(root,[x,y-.09,z-.2],.36,.16,a,color);parts.growth.push(l);}
   features=[new THREE.Vector3(.6,1,.6),new THREE.Vector3(-.65,.65,.2),new THREE.Vector3(0,1.7,0)];
  }else if(id==='lotus'){
   for(let j=0;j<4;j++){const a=j*2.4,x=Math.cos(a)*.9,z=Math.sin(a)*.9,y=.5+j*.15;rod(root,[0,.2,0],[x,y,z],.025,dark);ell(root,[x,y,z],[.6,.035,.6],green);}
   rod(root,[0,.2,0],[.1,1.88,0],.035,dark);for(let layer=0;layer<3;layer++)for(let j=0;j<10;j++){const a=j*TAU/10+layer*.25,R=.72-layer*.13,lift=.23+layer*.17,p=[],uv=[],ix=[];for(let k=0;k<=18;k++){const u=k/18,r=R*u,y=1.88+lift*u+.05*Math.sin(Math.PI*u),w=.16*Math.sin(Math.PI*u)**.8;for(let edge=0;edge<=6;edge++){const v=edge/3-1;p.push(.1+Math.cos(a)*r-Math.sin(a)*w*v,y+.028*v*v,Math.sin(a)*r+Math.cos(a)*w*v);uv.push(u,edge/6);}}for(let k=0;k<18;k++)for(let e=0;e<6;e++){const n=k*7+e;ix.push(n,n+7,n+1,n+1,n+7,n+8);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();root.add(new THREE.Mesh(g,mat(color,{side:THREE.DoubleSide})));}ell(root,[.1,1.97,0],[.17,.07,.17],'#d6b666');for(let j=0;j<40;j++){const a=j*2.4,r=.18+(j%3)*.025;rod(root,[.1+Math.cos(a)*r,1.92,Math.sin(a)*r],[.1+Math.cos(a)*r,2.02,Math.sin(a)*r],.005,'#d8b867');}features=[new THREE.Vector3(-.5,.6,.5),new THREE.Vector3(.1,2.1,.1),new THREE.Vector3(0,.2,0)];
  }else{
   rod(root,[0,.2,0],[0,2.35,0],.045,dark);
   for(let j=0;j<6;j++){const a=j*2.4;leaf(root,[0,.4+j*.25,0],id==='cress'?.5:.8,id==='cress'?.12:.24,a,green);}
   if(id==='sunflower'){
    const flower=pivot(root,[0,2.4,0]);flower.rotation.x=.4;ell(flower,[0,0,0],[.41,.41,.12],'#6d6245');for(let j=0;j<20;j++){const a=j*TAU/20;const p=ell(flower,[Math.cos(a)*.52,Math.sin(a)*.52,0],[.13,.36,.055],'#e4c364');p.rotation.z=a-Math.PI/2;}for(let j=0;j<120;j++){const a=j*2.4,r=Math.sqrt(j/120)*.36;ell(flower,[Math.cos(a)*r,Math.sin(a)*r,.105],[.026,.026,.014],'#ae9861');}
   }else for(let j=0;j<6;j++){const x=Math.sin(j*2.4)*.24,y=2+j*.12,z=Math.cos(j*2.4)*.24;rod(root,[0,y-.2,0],[x,y,z],.012,green);for(let n=0;n<4;n++)ell(root,[x+Math.cos(n*Math.PI/2)*.07,y, z+Math.sin(n*Math.PI/2)*.07],[.06,.025,.06],'#e3e7d1');}
   features=[new THREE.Vector3(.3,2.5,.15),new THREE.Vector3(-.4,1.2,.2),new THREE.Vector3(0,.8,0)];
  }
  for(let j=0;j<7;j++){const a=j*2.4;tube(root,[[0,.2,0],[Math.cos(a)*.27,.05,Math.sin(a)*.27],[Math.cos(a)*.5,.04,Math.sin(a)*.5]],.012,'#a69a77');}
 }else if(kind==='mushroom'){
  for(let j=0;j<3;j++){
   const a=j*2.4,x=Math.cos(a)*.45,z=Math.sin(a)*.45,scale=j===0?1:.55+j*.08;
   const g=pivot(root,[x,.2,z]);g.scale.setScalar(scale);parts.growth.push(g);
   rod(g,[0,0,0],[.1,1.4,0],.13,'#d2c7ad');
   const cap=ell(g,[.1,1.42,0],[.8,.3,.8],color);cap.scale.y=id==='pleurotus-ostreatus'?.18:.3;
   ell(g,[.1,1.37,0],[.73,.055,.73],'#dcd1b5');
   for(let n=0;n<26;n++){const a=n*TAU/26;rod(g,[.1,1.31,0],[.1+Math.cos(a)*.65,1.33,Math.sin(a)*.65],.009,'#b5a98f');}
   if(id==='amanita-muscaria')for(let n=0;n<25;n++){const a=n*2.4,r=Math.sqrt(n/25)*.66;ell(g,[.1+Math.cos(a)*r,1.42+.3*Math.sqrt(1-r*r/.64),Math.sin(a)*r],[.055,.016,.045],'#e8dfc9');}
  }features=[new THREE.Vector3(.4,1.85,.5),new THREE.Vector3(.2,.8,.2),new THREE.Vector3(-.4,.2,.2)];
 }else if(kind==='cell'){
  const rodShape=['ecoli','bacillus','myxococcus','halobacterium'].includes(id),elongated=['euglena','paramecium'].includes(id);
  const body=ell(root,[0,1.3,0],[rodShape?1.35:elongated?1.1:.85,rodShape?.35:.6,.55],color,{transparent:true,opacity:.7});parts.body=body;
  if(species.domain==='Eukaryota'){ell(root,[.05,1.35,0],[.24,.25,.25],'#a392bd');for(let j=0;j<9;j++){const a=j*2.4;ell(root,[Math.cos(a)*.6,1.3+Math.sin(a)*.25,Math.sin(j)*.26],[.14,.11,.1],id==='euglena'||id==='chlamydomonas'?'#669275':'#c1bca1');}}
  else tube(root,[[-.55,1.3,0],[-.3,1.45,.1],[0,1.2,0],[.3,1.42,-.1],[.6,1.25,0]],.024,'#e2dac5');
  if(id==='paramecium')for(let j=0;j<60;j++){const a=j*2.4,x=Math.cos(a)*1.08,y=1.3+Math.sin(a)*.6,z=Math.sin(j)*.4;const hair=pivot(root,[x,y,z]);rod(hair,[0,0,0],[x*.13,(y-1.3)*.2,z*.2],.01,'#c6dfd8');parts.tentacles.push(hair);}
  else if(id==='amoeba'){for(let j=0;j<7;j++){const a=j*2.4;const l=ell(root,[Math.cos(a)*.8,1.1,Math.sin(a)*.65],[.52,.32,.32],color,{transparent:true,opacity:.7});l.rotation.y=-a;parts.tentacles.push(l);}}
  else if(id==='yeast'){const bud=ell(root,[.8,1.7,0],[.45,.43,.4],color,{transparent:true,opacity:.7});parts.buds.push(bud);}
  else if(id!=='myxococcus'){
   const count=id==='chlamydomonas'?2:rodShape?4:1;
   for(let j=0;j<count;j++){const filament=pivot(root,[.8,1.3,j*.15-.2]);const pts=[];for(let n=0;n<40;n++){pts.push([n*.065,Math.sin(n*.5+j)*.13,Math.cos(n*.5+j)*.13]);}tube(filament,pts,.015,'#d3d7bd');parts.tails.push(filament);}
  }
  features=[new THREE.Vector3(-.65,1.6,.4),new THREE.Vector3(1.6,1.4,.1),new THREE.Vector3(.1,1.35,.3)];
 }else if(kind==='network'){
  for(let i=0;i<23;i++){const a=i*2.4,r=.3+(i%7)*.2,x=Math.cos(a)*r,z=Math.sin(a)*r;const branch=pivot(root,[0,.3,0]);tube(branch,[[0,0,0],[x*.45,.03,z*.45],[x,0,z],[x+Math.cos(a+.8)*.5,.02,z+Math.sin(a+.8)*.5]],.027,color);for(let n=0;n<3;n++)tube(branch,[[x*n/3,0,z*n/3],[x*n/3+.25,.02,z*n/3+.24]],.012,color);parts.growth.push(branch);}features=[new THREE.Vector3(.8,.32,.5),new THREE.Vector3(-.65,.3,.5),new THREE.Vector3(0,.3,0)];
 }
 // Capture authored poses once; each animation frame starts from these transforms.
 root.traverse(o=>{o.userData.base={position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()};});
 return refineSurface({root,parts,features,kind,id:species.id,variant:id},species);
}

export function animateSpecimen(model,motion,t){
 motion=plantAction(model.id,motion);
 if(model.expansionRig)return animateExpansion(model,motion,t);
 if(model.contactRig)return animateContactMicrobe(model,motion,t);
 if(model.beeRig)return animateBee(model,motion,t);
 if(model.botanicalRig)return animateBotanical(model,motion,t);
 if(model.earthwormRig)return animateEarthworm(model,motion,t);
 if(model.treeFrogRig)return animateTreeFrog(model,motion,t);
 if(model.zebrafishRig)return animateZebrafish(model,motion,t);
 if(model.axolotlRig)return animateAxolotl(model,motion,t);
 if(model.natural)return animateNatural(model,motion,t);
 const {root,parts,kind,id}=model;
 root.traverse(o=>{const b=o.userData.base;if(b){o.position.copy(b.position);o.rotation.copy(b.rotation);o.scale.copy(b.scale);}});
 if(model.softBody){if(motion==='observe'||motion==='rest')return;parts.tentacles.forEach((arm,i)=>{arm.rotation.y+=Math.sin(t*1.6+i*.8)*(motion==='forage'?.18:.09);arm.rotation.z+=Math.sin(t*1.3+i*.8)*.055;});if(motion==='swim'){root.position.y=.12+Math.sin(t*1.3)*.06;root.position.x=Math.sin(t*.7)*.28;}else if(motion==='crawl')root.position.x=Math.sin(t*.35)*.15;return;}
 const phase=t*3,active=!['observe','rest','sleep'].includes(motion);
 if(motion==='observe'){animateMicroAppendages(model,motion,0);return;}
 if(['grow','unfurl','spread'].includes(motion)){
  const progress=.35+.65*((t%9)/9);
  if(motion==='spread'){parts.growth.forEach((g,i)=>g.scale.setScalar(Math.max(.03,Math.min(1,progress*1.5-i*.018))));}
  else {root.scale.setScalar(progress);if(motion==='unfurl')parts.leaves.forEach(({group},i)=>{group.rotation.z=(1-progress)*.8*Math.sin(i);});}
  return;
 }
 if(motion==='fold'||motion==='trap'){
  const closure=(1-Math.cos(t*1.1))*.5;
  parts.leaves.forEach(({group,side})=>{if(motion==='fold')group.rotation.z=side*closure*1.3;else group.rotation.z=side*closure*1.15;});return;
 }
 if(motion==='bud'){parts.buds.forEach(b=>b.scale.multiplyScalar(.1+.9*((t%7)/7)));return;}
 if(motion==='sleep'){root.position.y=-.05;if(parts.head)parts.head.rotation.z=-.22;return;}
 if(motion==='rest'){if(parts.head)parts.head.rotation.z=-.1;return;}
 const moving=['walk','run','escape','jump','crawl','glide','swim','fly','tumble','reverse','phototaxis'].includes(motion);
 if(moving){const f=motion==='run'||motion==='escape'?2.1:1;root.position.x=Math.sin(t*.55*f)*.32;root.rotation.y=Math.sin(t*.3)*.1;}
 if(['swim','reverse','phototaxis','tumble'].includes(motion)){
  root.position.y=Math.sin(t*1.4)*.075;
  parts.tails.forEach((tail,i)=>{if(kind==='cetacean')tail.rotation.z=Math.sin(phase)*.24;else tail.rotation.y=Math.sin(phase+i)*.3;});
  parts.wings.forEach((w,i)=>w.rotation.x+=Math.sin(phase+i*Math.PI)*.22);
  if(motion==='reverse'||motion==='phototaxis')root.position.x=Math.sin(t)*.6;
  if(motion==='tumble'){root.rotation.y=Math.floor(t/3)%2===0?Math.sin(t)*.05:Math.sin(t*6)*.8;}
 }
 if(motion==='fly'){root.position.y=.55+Math.sin(t*1.3)*.13;parts.wings.forEach((w,i)=>w.rotation.x+=(i%2===0?1:-1)*Math.sin(t*(kind==='insect'?22:kind==='butterfly'?7:4))*.65);}
 if(motion==='pulse'){root.scale.y=1+Math.sin(phase)*.12;root.scale.x=root.scale.z=1-Math.sin(phase)*.08;root.position.y=Math.sin(t)*.15;}
 if(motion==='jump'){const u=(t*1.2)%1;root.position.y=Math.sin(u*Math.PI)*.65;parts.legs.forEach((l,i)=>l.rotation.z=Math.sin(u*TAU)*.4*(i<2?1:-1));}
 if(['walk','run','escape','crawl','forage'].includes(motion)){
  parts.legs.forEach((l,i)=>l.rotation.z+=Math.sin(phase*(motion==='run'||motion==='escape'?2:1)+(i===0||i===3?0:Math.PI))*(motion==='forage'?.1:.34));
  if(kind==='worm')parts.tentacles.forEach((s,i)=>{s.position.x+=Math.sin(phase-i*.35)*.045;s.scale.x*=1+Math.sin(phase-i*.35)*.25;});
  parts.tentacles.forEach((s,i)=>{if(kind!=='worm')s.rotation.y+=Math.sin(phase+i)*.09;});
 }
 if(motion==='forage'){if(parts.head)parts.head.rotation.z=-.3+Math.sin(t*1.6)*.08;if(parts.trunk)parts.trunk.rotation.z=Math.sin(t)*.25;root.position.x=Math.sin(t*.3)*.13;}
 if(active)parts.tails.forEach((tail,i)=>{if(!['swim','tumble','reverse','phototaxis'].includes(motion))tail.rotation.y+=Math.sin(t*1.5+i)*.13;});
 animateMicroAppendages(model,motion,t);
}
