import * as T from 'three';

// Original MIT qualitative exterior, guided by Avian2022 S1 and the retained
// Kladnik photograph. No internal endocast is used as living exterior tissue.
const V=(...v)=>new T.Vector3(...v),tau=Math.PI*2,fade=T.MathUtils.smoothstep;
const cream=new T.Color('#e8dfc2'),gold=new T.Color('#b69a65'),violet=new T.Color('#625489');
const hash=(x,y=0)=>{const n=Math.sin(x*127.1+y*311.7+4.6)*43758.5453;return n-Math.floor(n);};
function noise(x,y,z){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),s=q=>q*q*(3-2*q),u=s(x-a),v=s(y-b),w=s(z-c),h=(i,j,k)=>hash(i+31*j,k),mix=T.MathUtils.lerp;return mix(mix(mix(h(a,b,c),h(a+1,b,c),u),mix(h(a,b+1,c),h(a+1,b+1,c),u),v),mix(mix(h(a,b,c+1),h(a+1,b,c+1),u),mix(h(a,b+1,c+1),h(a+1,b+1,c+1),u),v),w);}
export function rhizostomaPigment(c,x,y,z,oral=false){const broad=noise(x*9+2,y*11,z*9),fine=noise(x*119,y*131,z*113);c.copy(cream);if(oral)c.lerp(gold,.40+.48*broad).multiplyScalar(.92+.12*fine);else c.lerp(new T.Color('#b6c9c2'),.15+.14*broad).multiplyScalar(.95+.07*fine);return c;}

export function buildRhizostomaExterior(body,{add,merge,closedSweep,shell,colour}){
 const bell=shell((u,a,inner)=>{const q=Math.sin(u*Math.PI/2),edge=fade(q,.83,1),lobe=.5+.5*Math.cos(a*80+.22*Math.sin(a*7)),r=.90*q*(1-.012*lobe*edge**3),y=.045+.68*Math.sqrt(Math.max(0,1-q*q)),thick=.082+.075*(1-q)**.65;return[r*Math.cos(a),y-.018*lobe*edge**3-(inner?thick:0),r*Math.sin(a)];},64,256);
 const bm=add(body,bell,'#d8e0d1','closed-exumbrella-subumbrella-and-margin',1);bm.material.depthWrite=true;bm.material.roughness=.22;
 const buv=bm.geometry.attributes.uv;colour(bm,(c,x,y,z,i)=>{rhizostomaPigment(c,x,y,z);const r=Math.hypot(x,z),a=Math.atan2(z,x),border=fade(buv.getX(i),.973,.997),breaks=.65+.35*fade(Math.cos(a*80+.22*Math.sin(a*7)),-.8,.4);c.lerp(violet,border*breaks*.91);});
 const stalks=[],wings=[],scapulets=[],clubs=[];
 function sweep(points,radius,N=38,flat=1){const curve=new T.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(N,false);return closedSweep((u,a,center)=>{const q=curve.getPointAt(u);if(center)return q.toArray();const i=Math.round(u*N),r=radius(u);return q.addScaledVector(frames.normals[i],r*Math.cos(a)).addScaledVector(frames.binormals[i],r*flat*Math.sin(a)).toArray();},N,20);}
 // A closed, ruffled wing exterior. It is not a resolved mouthlet lumen,
 // histological union, canal network or measured sheet-thickness reconstruction.
 function wing(points,across,width,seed,scapula=false){const curve=new T.CatmullRomCurve3(points),N=136;return closedSweep((u,a,center)=>{const q=curve.getPointAt(u),edge=Math.cos(a);if(center)return q.toArray();const envelope=.08+.92*Math.sin(Math.PI*(.015+.97*u))**.65,ruffle=1+.11*Math.sin(u*39+seed+2*noise(u*13,seed,0))+.065*Math.sin(u*97+seed*2),w=width*envelope*ruffle,axis=curve.getTangentAt(u),normal=axis.clone().cross(across).normalize(),fold=(.019*Math.sin(u*69+edge*7+seed+2*noise(u*11,edge*3,seed))+.009*Math.sin(u*151+edge*19+seed*2)+.005*Math.sin(u*271+edge*37+seed))*Math.abs(edge)**.6;return q.addScaledVector(across,w*edge).addScaledVector(normal,(.005+.002*Math.sin(u*37+seed))*Math.sin(a)+fold*(scapula?1:1.3)).toArray();},N,40);}
 for(let arm=0;arm<8;arm++){
  const a=tau*arm/8+.018*(hash(arm)-.5),radial=V(Math.cos(a),0,Math.sin(a)),side=V(-radial.z,0,radial.x),at=(r,y,sideways=0)=>radial.clone().multiplyScalar(r).addScaledVector(side,sideways).add(V(0,y,0));
  const stem=[at(.12,.30),at(.22,-.10),at(.32,-.38)];stalks.push(sweep(stem,u=>.041+.019*Math.sin(Math.PI*u),38,.78));
  // Two outer frilled wings face away from the centre, the third faces inward.
  for(let j=0;j<3;j++){
   const angle=j===2?Math.PI:(j===0?-.72:.72),across=radial.clone().multiplyScalar(Math.cos(angle)).addScaledVector(side,Math.sin(angle)),off=j===2?-.02:.025,points=[at(.30,-.32,off),at(.43,-.55,off),at(.43,-.83,off),at(.41,-1.02-.065*hash(arm,2),off)];
   wings.push(wing(points,across,j===2?.17:.235,arm*13+j));
  }
  // Sixteen selected upper scapulets are distinct from the lower oral wings.
  for(let j=0;j<2;j++){const sign=j?1:-1,across=radial.clone().multiplyScalar(.60).addScaledVector(side,sign*.8).normalize();scapulets.push(wing([at(.20,-.16,sign*.035),at(.34,-.28,sign*.10),at(.47,-.38,sign*.17),at(.43,-.50,sign*.20)],across,.125,arm*7+j,true));}
  const len=.64+.10*hash(arm,6),points=[at(.41,-.93),at(.43,-1.15),at(.46,-1.42),at(.47+.025*hash(arm,8),-1.02-len)];
  clubs.push(sweep(points,u=>.003+.065*Math.sin(Math.PI*(.07+.92*u))**.8,64,.60));
 }
 const stem=add(body,merge(stalks),'#d7e4dc','eight-transparent-proximal-supports',.59);colour(stem,(c,x,y,z)=>c.set('#d5e1da').multiplyScalar(.93+.06*noise(x*40,y*41,z*37)));stem.material.roughness=.19;
 for(const [geos,name]of[[wings,'eight-branched-three-winged-oral-arms'],[scapulets,'sixteen-frilled-upper-scapulets']]){const mesh=add(body,merge(geos),'#d9c69b',name,1),uv=mesh.geometry.attributes.uv;colour(mesh,(c,x,y,z,i)=>{rhizostomaPigment(c,x,y,z,true);const edge=fade(Math.abs(Math.cos(uv.getY(i)*tau)),.78,.98),patch=fade(noise(x*17+7,y*19,z*17),.29,.70);c.lerp(violet,edge*(.55+.45*patch)*.88);});mesh.material.roughness=.38;}
 const cm=add(body,merge(clubs),'#c4d0d4','eight-translucent-terminal-club-exteriors',.63);colour(cm,(c,x,y,z)=>c.set('#c2cfd1').lerp(new T.Color('#a798b8'),fade(-y,1.35,1.75)*.4).multiplyScalar(.95+.07*noise(x*31,y*37,z*29)));cm.material.roughness=.18;
 body.userData.rhizostomaOralField={version:'0.6.43',oralArms:8,wingsPerArm:3,selectedScapulets:16,terminalClubs:8,selectedLappets:80,measured:false,canalsResolved:false,source:'Avian2022 S1 exterior and retained Kladnik photo; not Figure2 internal endocast'};
}

// Continuous coordinate field keeps coincident attachment coordinates together.
// A finite regional flexion study, with no root travel, forces or fitted rhythm.
export function rhizostomaDeform(x,y,z,t,working){const time=T.MathUtils.clamp(t,0,8);if(!working||time===0||time>=8)return[x,y,z];const e=Math.sin(Math.PI*time/8)**2,phase=time%3.6,contraction=phase<.85?(1-Math.cos(phase/.85*Math.PI))*.5:phase<2.6?(1+Math.cos((phase-.85)/1.75*Math.PI))*.5:0,pulse=e*contraction,r=Math.hypot(x,z),margin=fade(r,.34,.88),oral=fade(-y,.14,1.6),scale=1-.072*pulse*(y>=0?margin:.32*(1-oral)),lag=.025*e*Math.sin(time*1.55+y*2.4)*oral;return[x*scale+lag,y+.065*pulse*margin*Math.exp(-Math.abs(y)*3)+.018*e*Math.sin(time*1.4+y*3)*oral,z*scale+lag*.36];}
