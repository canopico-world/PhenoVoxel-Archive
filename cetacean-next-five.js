import * as T from 'three';
import {buildCetacean,animateCetacean,cetaceanRig,cetaceanBodyPoint} from './cetacean-models.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
import {configureFineAnatomy,animateFineFeeding,applyFineMaterial,refineFlukePitch} from './cetacean-fine-anatomy.js';
import {fineTexture} from './cetacean-fine-textures.js';

// Selected exterior reconstructions. These are independently authored control
// surfaces and pigment fields, not scans, photographic skins or fitted animals.
export const nextFiveOriginalIds=new Set(['balaenoptera-physalus','eschrichtius-robustus','delphinapterus-leucas','delphinus-delphis']);
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),S=T.MathUtils.smoothstep,C=T.MathUtils.clamp,L=T.MathUtils.lerp,TAU=Math.PI*2;
const rigs=new WeakMap(),maps=new Map(),colours=new Map();
const col=s=>{if(!colours.has(s))colours.set(s,new T.Color(s));return colours.get(s);};
const hash=(x,y,z=0)=>{const a=Math.sin(x*127.1+y*311.7+z*74.7+53.9)*43758.5453;return a-Math.floor(a);};
function noise(x,y,z){const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),u=S(x-i,0,1),v=S(y-j,0,1),w=S(z-k,0,1);return L(L(L(hash(i,j,k),hash(i+1,j,k),u),L(hash(i,j+1,k),hash(i+1,j+1,k),u),v),L(L(hash(i,j,k+1),hash(i+1,j,k+1),u),L(hash(i,j+1,k+1),hash(i+1,j+1,k+1),u),v),w);}
const gaussian=(v,s=1)=>Math.exp(-((v/s)**2));
const configs={
 'balaenoptera-physalus':{
  profile:[[0,.002,-.075,-.093],[.025,.035,-.065,-.103],[.06,.073,-.045,-.125],[.105,.117,-.008,-.157],[.16,.158,.055,-.197],[.215,.194,.122,-.227],[.27,.225,.179,-.246],[.34,.246,.222,-.257],[.43,.238,.224,-.239],[.52,.215,.195,-.201],[.63,.173,.147,-.150],[.75,.115,.094,-.102],[.86,.059,.055,-.062],[.94,.027,.031,-.034],[1,.009,.014,-.017]],
  eyeU:.232,eyeQ:-.02,headEnd:.255,mouthQ:-.40,flipperU:.278,flipperLength:.35,flipperChord:.105,flipperSweep:.23,flipperDrop:.085,dorsalU:.703,dorsalHeight:.217,dorsalChord:.35,dorsalSweep:.38,flukeSpan:.89,flukeChord:.285,pleats:56,pleatEnd:.515,rate:.29,amplitude:.13,
  back:'#3e4445',side:'#747d7b',belly:'#b5bdb6',grain:.015,mottle:.04,
  shapeScope:'Selected long shallow fin-whale exterior, flatter V-shaped rostrum, posterior falcate fin and compact swept flippers. No blue-whale body or atlas reused.'
 },
 'eschrichtius-robustus':{
  profile:[[0,.018,.028,-.069],[.025,.088,.090,-.104],[.065,.145,.176,-.153],[.12,.218,.245,-.206],[.19,.264,.269,-.258],[.26,.286,.277,-.280],[.34,.302,.295,-.280],[.44,.287,.270,-.255],[.55,.243,.215,-.212],[.66,.187,.156,-.154],[.78,.114,.092,-.098],[.89,.054,.051,-.059],[.96,.025,.029,-.033],[1,.01,.018,-.02]],
  eyeU:.217,eyeQ:-.16,headEnd:.265,mouthQ:-.24,mouthArch:.20,flipperU:.278,flipperLength:.43,flipperChord:.235,flipperSweep:.105,flipperDrop:.10,dorsalHeight:.075,dorsalU:.655,dorsalChord:.28,knuckles:8,flukeSpan:1.03,flukeChord:.33,barnacles:false,shallowGrooves:3,rate:.225,amplitude:.155,
  back:'#414d50',side:'#6a7779',belly:'#949f99',grain:.018,mottle:.15,
  shapeScope:'Selected robust gray whale with arched rostrum, broad flippers, low dorsal hump/knuckles, short throat creases and irregular low epibiont clusters. No long rorqual pleats.'
 },
 'delphinapterus-leucas':{
  profile:[[0,.012,-.018,-.078],[.004,.052,-.005,-.095],[.010,.081,.009,-.113],[.022,.105,.035,-.138],[.040,.146,.229,-.174],[.067,.221,.355,-.219],[.10,.265,.389,-.272],[.145,.286,.342,-.304],[.205,.299,.288,-.326],[.275,.358,.332,-.365],[.35,.369,.341,-.367],[.44,.344,.310,-.335],[.55,.279,.244,-.265],[.67,.176,.151,-.183],[.79,.082,.074,-.107],[.90,.037,.046,-.069],[.96,.021,.033,-.045],[1,.012,.024,-.024]],
  blowholeU:.183,eyeU:.107,eyeQ:-.29,headEnd:.13,mouthQ:-.54,flipperU:.282,flipperLength:.40,flipperChord:.285,flipperSweep:.085,flipperDrop:.16,flukeSpan:1.15,flukeChord:.35,dorsalHeight:0,dorsalRidge:true,neck:true,rate:.26,amplitude:.16,
  back:'#c5cec9',side:'#d6dbd2',belly:'#e0e0d4',grain:.007,mottle:0,
  shapeScope:'Selected white adult, round melon distinct from short rostrum, fuller shoulder/ventral body, low dorsal ridge and curved broad flippers. No dorsal fin or acoustic melon-function simulation.'
 },
 'delphinus-delphis':{
  profile:[[0,.004,-.064,-.084],[.025,.025,-.056,-.093],[.055,.041,-.046,-.103],[.079,.055,-.026,-.117],[.098,.074,.025,-.140],[.123,.119,.149,-.168],[.16,.177,.228,-.210],[.205,.212,.244,-.237],[.27,.235,.244,-.242],[.35,.227,.219,-.225],[.45,.205,.180,-.198],[.56,.170,.135,-.165],[.69,.121,.092,-.123],[.81,.071,.054,-.080],[.91,.036,.028,-.044],[.97,.018,.018,-.026],[1,.008,.013,-.017]],
  blowholeU:.216,eyeU:.164,eyeQ:-.06,headEnd:.196,mouthQ:-.37,flipperU:.245,flipperLength:.44,flipperChord:.12,flipperSweep:.25,flipperDrop:.11,dorsalU:.485,dorsalHeight:.34,dorsalChord:.36,dorsalSweep:.40,flukeSpan:.89,flukeChord:.25,hourglass:false,rate:.36,amplitude:.19,
  back:'#414747',side:'#8d9491',belly:'#c1c2b8',grain:.012,mottle:.025,
  shapeScope:'Selected common-dolphin exterior under the disclosed broad species concept: fine beak, rounded melon, falcate central dorsal fin and an original asymmetric cream/gray hourglass field. Not a redetermined subspecies.'
 }
};
export const nextFiveConfig=id=>configs[id];

function mouthQ(c,u){return c.mouthQ+(c.mouthArch??.055)*Math.sin(C(u/c.headEnd,0,1)*Math.PI);}
function sculpt(c,p,u,a){
 const q=Math.cos(a),z=Math.sin(a),g=(v,s)=>gaussian(v,s);
 // A shallow commissure and adjacent lip roll are built into the skin.
 const head=(1-S(u,c.headEnd-.025,c.headEnd+.006))*S(u,.002,.012),d=q-mouthQ(c,u);
 const lip=(-.0035*g(d,.030)+.0017*g(d+.047,.035))*head;
 p.y+=lip*q;p.z+=lip*z;
 // Selected eye sockets in the continuous exterior; eyes themselves stay small.
 const eye=gaussian(u-c.eyeU,.014)*gaussian(q-c.eyeQ,.12);
 p.y-=.0018*eye*q;p.z-=Math.sign(z)*.0035*eye;
 if(c.id==='balaenoptera-physalus'){
  const front=1-S(u,.13,.26);p.y-=.005*front*S(q,.15,.9);p.z*=1-.10*front*S(q,.1,.9);
  // A single exterior carries the longitudinal folds. The earlier separately
  // tessellated overlay produced broad interference bands against the body.
  const angle=Math.atan2(Math.sin(a-Math.PI),Math.cos(a-Math.PI));
  const margin=S(u,.028,.047)*(1-S(u,c.pleatEnd-.025,c.pleatEnd))*(1-S(Math.abs(angle),1.22,1.30));
  // Shallow neutral relief avoids high-frequency highlights aliasing into
  // broad zebra bands at the full-body display distance.
  const fold=.00016*margin*Math.cos(angle*c.pleats*Math.PI/1.30);
  p.y+=fold*q;p.z+=fold*z;
 }else if(c.id==='eschrichtius-robustus'){
  p.y+=.008*gaussian(u-.15,.10)*S(q,.15,.9);
  const rim=.010*gaussian(q-mouthQ(c,u)+.05,.09)*S(u,.003,.035)*(1-S(u,.22,.27));p.y+=rim*q;p.z+=rim*z;
  const n=noise(u*80,Math.sin(a)*17,Math.cos(a)*17)-.5;
  p.y+=.0014*n*q;p.z+=.0014*n*z;
 }else if(c.id==='delphinapterus-leucas'){
  // Irregular soft cervical folds, not concentric rings around the whole body.
  const neck=gaussian(u-.203,.035)*(1-S(q,.35,.9));
  const folds=Math.sin(u*180+3*Math.sin(a)+2*noise(u*20,z*4,q*4));
  const disp=.006*neck*folds;p.y+=disp*q;p.z+=disp*z;
  // Round the adult melon without extending its forehead into a long cone.
  p.z*=1+.035*gaussian(u-.107,.052)*S(q,-.25,.6);
  p.y-=.012*gaussian(u-.038,.012)*S(q,.35,.9);
  p.y-=.025*gaussian(u-.04,.024)*S(-q,.15,.95);
  p.z*=1+.15*gaussian(u-.02,.016)*S(-q,.2,.9);
  const cheek=gaussian(u-.106,.041)*gaussian(q+.42,.33);
  p.z+=.012*cheek*z;p.y-=.009*cheek;
  // Selected soft folds descend behind the cheek and above the flipper root;
  // their asymmetry is authored, rather than a repeated ring around the animal.
  const sideFold=gaussian(u-(.172+.014*z+.020*q),.008)*S(Math.abs(z),.35,.85)*(1-S(q,.35,.8));
  p.z-=.004*sideFold*z;p.y-=.002*sideFold*q;
 }else if(c.id==='delphinus-delphis'){
  const gape=gaussian(u-.095,.027)*S(-q,.05,.9);p.z*=1-.08*gape;
 }
}

function pigment(c,u,a,kind,out){
 const q=kind==='body'?Math.cos(a):Math.sin(a),z=Math.sin(a),v=noise(u*5,Math.sin(a)*2.7,Math.cos(a)*2.7),warp=noise(u*21+v*3,Math.sin(a)*9,Math.cos(a)*9);
 out.copy(col(c.back)).lerp(col(c.side),S(-q,-.7,.35)).lerp(col(c.belly),S(-q,.12,.91));
 if(kind==='body'){
  if(c.id==='balaenoptera-physalus'){
   const jaw=(1-S(u,.20,.258))*S(-q,-.03,.55)*S(z,.03,.52);out.lerp(col('#cbd0c7'),jaw*.88);
   const chevron=.285+.047*Math.abs(z)+.007*(warp-.5),field=gaussian(u-chevron,.024)*S(q,-.20,.68);out.lerp(col('#a2aca8'),field*.17);
   const blaze=gaussian(u-(.175+.04*q),.038)*S(z,.15,.9)*S(q,-.25,.6);out.lerp(col('#a5afa9'),blaze*.22);
  }else if(c.id==='eschrichtius-robustus'){
   // Sparse broad scar fields with softer intervening gray skin. The rejected
   // draft used dense high-contrast flecks that resembled repeated camouflage.
   const n=.65*noise(u*27+warp*.8,z*3.7,q*3.7)+.25*noise(u*81+v,z*11,q*11)+.10*noise(u*230,z*32,q*32);
   out.lerp(col('#aeb9b1'),S(n,.58,.77)*.48);
   out.lerp(col('#354649'),gaussian(n-.36,.10)*.12);
  }else if(c.id==='delphinapterus-leucas'){
   const folds=gaussian(u-.20,.045)*(.5+.5*Math.sin(u*180+3*z+2*warp))**5*(1-S(q,.35,.90));out.multiplyScalar(1-.035*folds);
   out.lerp(col('#b7c4be'),gaussian(u-.17,.07)*S(q,-.3,.5)*.06);
  }else if(c.id==='delphinus-delphis'){
   const sideMask=S(Math.abs(z),.32,.82),waist=.34-.90*gaussian(u-.43,.13)+.027*(warp-.5);
   const lower=S(q,-.85,-.64),upper=1-S(q,waist-.055,waist+.055),cream=1-S(u,.395,.445),panel=lower*upper*sideMask;
   out.lerp(col('#b9ac8e'),panel*cream*.90);out.lerp(col('#8d9c9f'),panel*(1-cream)*.84);
   out.lerp(col('#323a3a'),S(q,waist-.055,waist+.055)*.88);
   const eyeToFlipper=-.035-2.0*(u-c.eyeU),stripe=gaussian(q-eyeToFlipper,.027)*S(u,c.eyeU-.013,c.eyeU+.01)*(1-S(u,.25,.27))*sideMask;
   out.lerp(col('#344950'),stripe*.80);
  }
  if(u<c.headEnd){const mark=gaussian(q-mouthQ(c,u),.022)*S(u,.002,.01)*(1-S(u,c.headEnd-.02,c.headEnd));out.lerp(col(c.id==='delphinapterus-leucas'?'#73817e':'#303f44'),mark*.58);}
  // Longitudinal ventral groove relief is confined to the fin-whale pouch.
  // The actual conformal geometry carries the fin-whale folds. Repeating an
  // unrelated band field in the albedo created visible interference patterns.
 }
 const fine=noise(u*790,Math.sin(a)*200,Math.cos(a)*200)-.5;
 out.multiplyScalar(1+c.grain*fine+.025*(v-.5));
 return out;
}
function skin(c,kind){const preloaded=fineTexture(c.id,'base-'+kind);if(preloaded)return preloaded;const key=c.id+':'+kind;if(maps.has(key))return maps.get(key).clone();const w=kind==='body'?1536:384,h=kind==='body'?768:128,data=new Uint8Array(w*h*4),o=new T.Color();for(let j=0;j<h;j++)for(let i=0;i<w;i++){pigment(c,i/(w-1),j===h-1?0:j/(h-1)*TAU,kind,o).convertLinearToSRGB();const k=(j*w+i)*4;data[k]=C(Math.round(o.r*255),0,255);data[k+1]=C(Math.round(o.g*255),0,255);data[k+2]=C(Math.round(o.b*255),0,255);data[k+3]=255;}const t=new T.DataTexture(data,w,h);t.colorSpace=T.SRGBColorSpace;t.flipY=false;t.wrapT=T.RepeatWrapping;t.needsUpdate=true;t.userData={author:'PhenoVoxel Archive',license:'MIT',source:'Original reproducible regional pigment; no photographic pixels, reflectance calibration or specimen fit.'};maps.set(key,t);return t;}

function addGrayEpibionts(m,r){
 const c=r.c,mat=new T.MeshStandardMaterial({color:'#b7c2b2',roughness:.86});
 for(let i=0;i<42;i++){
  const u=i<32?.035+.19*hash(i,37):.89+.07*hash(i,61),a=(hash(i,19)*2-1)*2.7,p=cetaceanBodyPoint(c,u,a),scale=.0035+.005*hash(i,7),g=new T.SphereGeometry(1,12,8);
  g.scale(scale,.0025+scale*.18,scale*(.7+.5*hash(i,11)));const normal=V(0,Math.cos(a),Math.sin(a));g.applyQuaternion(new T.Quaternion().setFromUnitVectors(V(0,1,0),normal));g.translate(...p);const o=new T.Mesh(g,mat);o.name='selected-low-epibiont-shell-'+i;m.root.add(o);r.parts.push({mesh:o,neutral:g.attributes.position.array.slice()});
 }
}
export function buildNextFiveOriginal(s){
 const conf=configs[s.id];if(!conf)throw Error('Outside the selected four original reconstructions');
 const c={...conf,strictGlide:true,pectoralExcursion:.025,pleatGeometry:false,profile:conf.profile.map(row=>row.map((v,j)=>j>0?v*(s.id==='delphinus-delphis'?1.22:s.id==='eschrichtius-robustus'?1.10:s.id==='delphinapterus-leucas'&&row[0]>.18&&j===3?1.12:1):v)),id:s.id,bodySegments:224,bodyRadials:s.id==='balaenoptera-physalus'?512:96,textureFactory:skin};c.surfaceSculpt=(p,u,a)=>sculpt(c,p,u,a);
 const m=buildCetacean(s,c),r=cetaceanRig(m);if(s.id==='eschrichtius-robustus')addGrayEpibionts(m,r);
 m.root.traverse(o=>{if(!o.isMesh)return;for(const mat of Array.isArray(o.material)?o.material:[o.material]){mat.roughness=s.id==='delphinapterus-leucas'?.37:.40;mat.metalness=0;mat.envMapIntensity=.65;if(!o.name.startsWith('selected-low-epibiont'))mat.userData.compatibilityWetSkin=true;}});
 if(r.dorsal){const g=r.dorsal.geometry,p=g.attributes.position,{n, r:radials}=g.userData.loft,c=r.c,baseY=Math.min(...Array.from({length:p.count},(_,i)=>p.getY(i))),x=c.length*(.5-c.dorsalU);for(let i=0;i<=n;i++)for(let j=0;j<=radials;j++){const v=i/n,a=j===radials?0:j/radials*TAU,lead=c.dorsalChord*.55*(1-v**2.1)-c.dorsalSweep*.45*v**3,trail=-c.dorsalChord*.55*(1-v)**2-c.dorsalSweep*.45*v**.45,chord=Math.max(.0006,lead-trail);p.setXYZ(i*(radials+1)+j,x+(lead+trail)*.5+Math.cos(a)*chord*.5,baseY+c.dorsalHeight*v,Math.sin(a)*(.025*(1-v)**.8+.0004));}for(const end of[0,n]){const centre=V();for(let j=0;j<radials;j++)centre.add(V().fromBufferAttribute(p,end*(radials+1)+j));centre.divideScalar(radials);p.setXYZ((n+1)*(radials+1)+(end===0?0:1),...centre);}p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();r.parts.find(part=>part.mesh===r.dorsal).neutral=p.array.slice();}
 for(const fluke of r.flukes){fluke.material.map=skin(c,'fluke');fluke.material.color.set('#ffffff');fluke.material.needsUpdate=true;}
 if(s.id==='delphinapterus-leucas')for(const f of r.flippers){
  const g=f.mesh.geometry,p=g.attributes.position,{n,r:nr}=g.userData.loft;
  for(let i=0;i<=n;i++)for(let j=0;j<=nr;j++){
   const v=i/n,a=j===nr?0:j/nr*TAU,chord=c.flipperChord*(.73+.42*Math.sin(Math.PI*v))*(1-v**4)+.0008;
   const thickness=.025*(1-v)**.65+.0006,round=.018*Math.sin(Math.PI*v)**2;
   p.setXYZ(i*(nr+1)+j,f.pivot.x-c.flipperSweep*v+Math.cos(a)*chord*.5,f.pivot.y-c.flipperDrop*v+Math.sin(a)*thickness+round,f.pivot.z+f.side*c.flipperLength*v);
  }
  for(const end of[0,n]){const center=V();for(let j=0;j<nr;j++)center.add(V().fromBufferAttribute(p,end*(nr+1)+j));center.divideScalar(nr);p.setXYZ((n+1)*(nr+1)+(end===0?0:1),...center);}
  p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();r.parts.find(part=>part.mesh===f.mesh).neutral=p.array.slice();
 }
 // The old elliptical leaves read as paddles. Broader leading shoulders,
 // thinner foil tips and swept concave trailing edges form distinct flukes.
 for(const [side,fluke]of r.flukes.map((o,i)=>[i===0?-1:1,o])){
  const g=fluke.geometry,p=g.attributes.position,{n,r:nr}=g.userData.loft;
  for(let i=0;i<=n;i++)for(let j=0;j<=nr;j++){
   const v=i/n,a=j===nr?0:j/nr*TAU,span=c.flukeSpan*.5*v,scale=c.flukeChord/.30;
   const leading=-r.c.length*.5+scale*(.105-.29*v**1.35),trailing=-r.c.length*.5+scale*(-.09-.30*v**.45+.20*v**4.5),chord=Math.max(.0008,leading-trailing),thickness=.026*(1-v)**.8+.0004;
   p.setXYZ(i*(nr+1)+j,(leading+trailing)*.5+Math.cos(a)*chord*.5,r.c.y+Math.sin(a)*thickness,-side*span);
  }
  for(const end of[0,n]){const center=V();for(let j=0;j<nr;j++)center.add(V().fromBufferAttribute(p,end*(nr+1)+j));center.divideScalar(nr);p.setXYZ((n+1)*(nr+1)+(end===0?0:1),...center);}
  p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();r.parts.find(part=>part.mesh===fluke).neutral=p.array.slice();
 }
 for(const part of r.parts)if(!part.mesh.name.startsWith('selected-low-epibiont'))applyFineMaterial(part.mesh.material,c,part.mesh===r.body?'body':'appendage');
 configureFineAnatomy(m,r);
 const record={r,config:conf,body:m.root.getObjectByName('closed-species-specific-body')};rigs.set(m,record);m.nextFiveStudy={version:'0.6.53',sourceScope:conf.shapeScope,authored:true,animationValidated:false};m.root.userData.nextFiveStudy=m.nextFiveStudy;
 m.root.userData.anatomyViewDirections=[[.55,.20,1],[0,1,.001],[0,.35,1]];m.root.userData.anatomyFocusScale=[.57,.60,.62];
 animateNextFiveOriginal(m,'observe',0);return m;
}
export function animateNextFiveOriginal(m,action,t){
 const record=rigs.get(m);if(!record)return false;const {r,body}=record,c=r.c,q=C(t/12,0,1),envelope=t<=0||t>=12?0:Math.sin(Math.PI*q)**2;
 const poseKey=action==='observe'?'observe':action+':'+C(t,0,action==='forage'?m.fineAnatomy.k.seconds:12);if(m.nextFiveStudy.poseKey===poseKey)return true;
 if(animateFineFeeding(m,action,t)){m.nextFiveStudy.poseKey=poseKey;return true;}
 const base=['roll','bank'].includes(action)?'swim':action==='melon'?'observe':action;animateCetacean(m,base,t);
 refineFlukePitch(r,base,t);
 if(action==='melon'&&c.id==='delphinapterus-leucas'){
  // Selected rostral extension followed by posterior retraction, compared with
  // Richard et al.2024 Fig.1. No measured tissue strain or acoustic simulation.
  const shape=q<.5?Math.sin(Math.PI*q/.5)**2:-(Math.sin(Math.PI*(q-.5)/.5)**2);
  const a=body.geometry.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i),u=.5-x/c.length,y=a.getY(i)-c.y,z=a.getZ(i),mask=gaussian(u-.101,.043)*S(y,.13,.25)*gaussian(z,.19)*(1-S(u,.16,.18));a.setXYZ(i,x+.066*mask*shape,a.getY(i)+.012*mask*shape,z);}
  a.needsUpdate=true;body.geometry.computeVertexNormals();const d=body.geometry.userData.loft,n=body.geometry.attributes.normal;for(let i=0;d&&i<=d.n;i++){const j=i*(d.r+1),k=j+d.r,v=V().fromBufferAttribute(n,j).add(V().fromBufferAttribute(n,k)).normalize();n.setXYZ(j,...v);n.setXYZ(k,...v);}n.needsUpdate=true;body.geometry.computeBoundingBox();body.geometry.computeBoundingSphere();
 }
 const hold=S(q,0,.25)*(1-S(q,.75,1));let roll=0,yaw=0;
 if(action==='roll'&&c.id==='eschrichtius-robustus')roll=Math.PI/2*hold;
 if(action==='bank'&&c.id==='delphinus-delphis'){roll=.34*envelope;yaw=.27*envelope;}
 if(roll||yaw){m.root.rotation.set(roll,yaw,0);const centre=V(0,c.y,0),rotated=centre.clone().applyEuler(m.root.rotation);m.root.position.copy(centre.sub(rotated));}
 m.root.updateMatrixWorld(true);updateSpecimenLandmarks(m);m.nextFiveStudy.poseKey=poseKey;m.nextFiveStudy.current={action,clock:C(t,0,12),finished:t>=12,scope:'Selected finite exterior/posture study; no fitted trajectory, full feeding, flow/forces, acoustics or physiology'};return true;
}
