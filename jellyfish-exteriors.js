import {buildChironexExterior,chironexDeform} from './chironex-exterior.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {toolkit} from './expansion-geometry.js';
import {buildCassiopeaOralField,cassiopeaPigment,cassiopeaDeform} from './cassiopea-oral-field.js';
import {buildRhizostomaExterior,rhizostomaDeform} from './rhizostoma-oral-field.js';
import {buildCotylorhizaExterior,cotylorhizaDeform} from './cotylorhiza-oral-field.js';

// Selected, unfitted adult exteriors. Numerical pigment is original; no organism
// photograph is projected onto these surfaces. No hydrodynamic solver is used.
export const jellyfishExteriorSpecies=new Set(['cassiopea-xamachana','cotylorhiza-tuberculata','rhizostoma-pulmo','chrysaora-hysoscella','cyanea-capillata','pelagia-noctiluca','aequorea-victoria','craspedacusta-sowerbii','chironex-fleckeri','physalia-physalis','velella-velella','porpita-porpita']);
const rigs=new WeakMap(),TAU=2*Math.PI,V=(...a)=>new T.Vector3(...a),clamp=T.MathUtils.clamp;
export const jellyfishExteriorRig=root=>rigs.get(root);
const hash=(x,y=0)=>{const n=Math.sin(x*127.1+y*311.7+8.13)*43758.5453;return n-Math.floor(n);};
const palettes={
 'cassiopea-xamachana':['#b5a482','#82744d','#9c9272'],
 'cotylorhiza-tuberculata':['#e6dab3','#d3a04b','#7771a4'],
 'rhizostoma-pulmo':['#d4d9c8','#c7c3aa','#655d95'],
 'chrysaora-hysoscella':['#d6c9ab','#e0d5b9','#905d3e'],
 'cyanea-capillata':['#c4a57b','#c09a65','#ac744d'],
 'pelagia-noctiluca':['#c4a6ba','#be93ad','#9a608c'],
 'aequorea-victoria':['#b8d1d2','#becbc6','#d7d5be'],
 'craspedacusta-sowerbii':['#c3d1c9','#d9dccb','#c4c9b3'],
 'chironex-fleckeri':['#c7d4cf','#d5d4c7','#8d8d9c']
};
function material(color,opacity=.55){return new T.MeshStandardMaterial({color,roughness:.30,metalness:0,transparent:opacity<1,opacity,depthWrite:opacity>=1,side:T.FrontSide});}
export function rimOptics(mat){
 // View-dependent visibility only. This is not measured refractive index,
 // scattering, fluorescence or subsurface transport. Export uses base opacity.
 mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','float silhouette = pow(1.0-abs(dot(normalize(normal),normalize(vViewPosition))),1.65);\ndiffuseColor.a *= 0.33+0.67*silhouette;\n#include <opaque_fragment>');};
 mat.customProgramCacheKey=()=> 'jelly-rim-visibility-640';mat.userData.opticalScope='Illustrative edge visibility; standard export/fallback has constant opacity.';
}
function geometry(p,ix,uv){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
function orient(g){const p=g.attributes.position,ix=g.index.array;let volume=0;const a=V(),b=V(),c=V();for(let i=0;i<ix.length;i+=3)volume+=a.fromBufferAttribute(p,ix[i]).dot(b.fromBufferAttribute(p,ix[i+1]).cross(c.fromBufferAttribute(p,ix[i+2])));if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.computeVertexNormals();return g;}
function shell(fn,nr=40,na=160){const p=[],uv=[],ix=[],add=(q,u,v)=>{p.push(...q);uv.push(u,v);return p.length/3-1;};for(const inner of[false,true]){const center=add(fn(0,0,inner),0,0),rings=[];for(let i=1;i<=nr;i++){const ring=[];for(let j=0;j<na;j++)ring.push(add(fn(i/nr,j/na*TAU,inner),i/nr,j/na));rings.push(ring);}const tri=(a,b,c)=>ix.push(...(inner?[a,c,b]:[a,b,c]));for(let j=0;j<na;j++)tri(center,rings[0][j],rings[0][(j+1)%na]);for(let i=1;i<nr;i++)for(let j=0;j<na;j++){const n=(j+1)%na;tri(rings[i-1][j],rings[i][j],rings[i-1][n]);tri(rings[i][j],rings[i][n],rings[i-1][n]);}}const per=1+nr*na,edge=1+(nr-1)*na;for(let j=0;j<na;j++){const n=(j+1)%na;ix.push(edge+j,per+edge+j,edge+n,edge+n,per+edge+j,per+edge+n);}const g=orient(geometry(p,ix,uv));g.userData={closedBell:true,upperVertices:per};return g;}
function annulus(fn,N=144){const p=[],ix=[],uv=[];for(let layer=0;layer<2;layer++)for(let ring=0;ring<2;ring++)for(let j=0;j<N;j++){p.push(...fn(ring,j/N*TAU,!!layer));uv.push(ring,j/N);}for(let j=0;j<N;j++){const n=(j+1)%N;for(const [a,b,c,d]of[[j,n,N+j,N+n],[2*N+j,3*N+j,2*N+n,3*N+n],[j,2*N+j,n,2*N+n],[N+j,N+n,3*N+j,3*N+n]])ix.push(a,b,c,b,d,c);}const g=orient(geometry(p,ix,uv));g.userData.openCentralAperture=true;return g;}
function closedSweep(fn,N=48,A=10){const p=[],uv=[],ix=[],first=fn(0,0,true),last=fn(1,0,true);p.push(...first);uv.push(0,0);for(let i=0;i<=N;i++)for(let j=0;j<A;j++){p.push(...fn(i/N,j/A*TAU,false));uv.push(i/N,j/A);}const end=p.length/3;p.push(...last);uv.push(1,0);for(let j=0;j<A;j++){const n=(j+1)%A;ix.push(0,1+j,1+n);for(let i=0;i<N;i++){const a=1+i*A+j,b=1+i*A+n;ix.push(a,a+A,b,b,a+A,b+A);}ix.push(end,1+N*A+n,1+N*A+j);}const g=orient(geometry(p,ix,uv));g.userData.closedAppendage=true;return g;}
function tubeGeometry(points,radius,N=36,A=8){const curve=new T.CatmullRomCurve3(points.map(p=>V(...p)));const frames=curve.computeFrenetFrames(N,false);return closedSweep((u,a,center)=>{const q=curve.getPointAt(u);if(center)return q.toArray();const i=Math.round(u*N),r=radius*(.26+.74*(1-u)**.65);return q.addScaledVector(frames.normals[i],r*Math.cos(a)).addScaledVector(frames.binormals[i],r*Math.sin(a)).toArray();},N,A);}
function merge(geos){const g=mergeGeometries(geos);geos.forEach(g=>g.dispose());return g;}
function colour(mesh,fn,alpha){const p=mesh.geometry.attributes.position,a=[],c=new T.Color();for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);fn(c,x,y,z,i);a.push(c.r,c.g,c.b);if(alpha)a.push(alpha(x,y,z,i));}mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(a,alpha?4:3));mesh.material.vertexColors=true;mesh.material.color.set('#ffffff');}
function add(body,geo,color,name,opacity=.70,edge=false){const mat=material(color,opacity);if(edge)rimOptics(mat);const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=false;m.receiveShadow=false;body.add(m);return m;}
function bellSpec(id){return{
 'cassiopea-xamachana':{r:.94,h:.25,thick:.085,lobes:16,inverted:true},
 'cotylorhiza-tuberculata':{r:.94,h:.18,thick:.075,lobes:40,egg:true},
 'rhizostoma-pulmo':{r:.88,h:.73,thick:.12,lobes:88},
 'chrysaora-hysoscella':{r:.83,h:.40,thick:.055,lobes:32},
 'cyanea-capillata':{r:.86,h:.40,thick:.075,lobes:8},
 'pelagia-noctiluca':{r:.69,h:.57,thick:.075,lobes:16},
 'aequorea-victoria':{r:.96,h:.23,thick:.062,lobes:0,hydro:true},
 'craspedacusta-sowerbii':{r:.76,h:.28,thick:.045,lobes:0,hydro:true},
 'chironex-fleckeri':{r:.53,h:.90,thick:.048,lobes:0,box:true}
}[id];}
function bellPoint(o,u,a,inner=false){const angle=u*Math.PI/2,round=Math.sin(angle),sq=o.box?1/Math.pow(Math.abs(Math.cos(a))**8+Math.abs(Math.sin(a))**8,1/8):1,lobes=o.lobes?(o.lobes===8?.057:.008)*(1-Math.cos(a*o.lobes))*u**8:0,r=o.r*round*sq*(1-lobes)-(inner?.009*u:0),dome=o.box?o.h*(1-u**6)**.30:o.h*Math.cos(angle),egg=o.egg?.24*Math.exp(-((round/.42)**2.4)):0,y=dome+egg-(inner?o.thick*(.15+.85*Math.cos(angle)**.7):0)+.005*Math.sin(a*3+.4)*u**2;return[Math.cos(a)*r,y,Math.sin(a)*r];}
function ornamentBell(body,o,id,palette){
 const geo=shell((u,a,inner)=>bellPoint(o,u,a,inner)),opaque=o.egg||id==='rhizostoma-pulmo',m=add(body,geo,palette[0],'closed-exumbrella-subumbrella-and-margin',id==='chironex-fleckeri'?.40:id==='cassiopea-xamachana'?.48:opaque?.90:.65,!opaque),base=new T.Color(palette[0]),dark=new T.Color(palette[2]),warm=new T.Color(palette[1]),uv=geo.attributes.uv;
 colour(m,(c,x,y,z,i)=>{const r=Math.hypot(x,z)/o.r,a=Math.atan2(z,x),mottle=.025*Math.sin(x*27+z*17)*Math.sin(z*31-y*9);c.copy(base).multiplyScalar(1+mottle);
 if(o.egg)c.lerp(warm,Math.exp(-((r/.43)**2.4))*.88);
 if(id==='chrysaora-hysoscella'){c.lerp(dark,(1-T.MathUtils.smoothstep(r,.055,.13))*.80);const f=((a/TAU*16)%1+1)%1,dist=Math.min(Math.abs(f-(.5-.30*r)),Math.abs(f-(.5+.30*r))),v=(1-T.MathUtils.smoothstep(dist,.055,.115))*T.MathUtils.smoothstep(r,.17,.30)*(1-T.MathUtils.smoothstep(r,.94,1));c.lerp(dark,v*.86);}
 if(id==='rhizostoma-pulmo')c.lerp(dark,T.MathUtils.smoothstep(r,.972,.998)*.87);
 if(id==='cyanea-capillata')c.lerp(warm,.45+.24*Math.sin(a*3+r*8));
 if(id==='pelagia-noctiluca'){const q=Math.sin(x*82+z*61)*Math.sin(z*77-y*43)+.45*Math.sin(x*133-z*71);c.lerp(dark,T.MathUtils.smoothstep(q,.78,1.15)*.62);}
 if(id==='cassiopea-xamachana')cassiopeaPigment(c,x,y,z,false);
 },opaque?(x,y,z)=>o.egg?.64+.36*Math.exp(-((Math.hypot(x,z)/o.r/.43)**6)):.73+.20*(1-Math.hypot(x,z)/o.r):null);
 if(id==='rhizostoma-pulmo')add(body,tubeGeometry(Array.from({length:353},(_,j)=>bellPoint(o,1,j/352*TAU)),.0048,352,6),palette[2],'continuous-selected-violet-lappet-edge',.90);
 if(id==='pelagia-noctiluca'){const warts=[];for(let i=0;i<440;i++){const a=i*2.399963,u=Math.sqrt((i+.5)/440)*.97,p=bellPoint(o,u,a),r=.004+.006*hash(i,6);warts.push(new T.SphereGeometry(1,8,6).scale(r,.004,r).translate(p[0],p[1]+.002,p[2]));}add(body,merge(warts),palette[2],'attached-selected-nematocyst-wart-relief',.67);}
 return m;
}
function oralRibbon(a,length,width,spread,seed,startY=-.03){return closedSweep((u,v,center)=>{const radial=.08+spread*u+.10*Math.sin(u*5+seed*1.7)*u*u,angle=a+.34*Math.sin(u*4+seed)*u,q=V(Math.cos(angle)*radial,startY-length*u,Math.sin(angle)*radial);if(center)return q.toArray();const w=width*Math.sin((.06+.94*u)*Math.PI)**.45*(1-.25*u),fold=(.01+.026*u)*Math.sin(u*(43+seed*3)+Math.cos(v)*3.2+seed)*Math.abs(Math.cos(v))**2;return q.add(V(-Math.sin(angle),0,Math.cos(angle)).multiplyScalar(w*Math.cos(v))).add(V(Math.cos(angle),0,Math.sin(angle)).multiplyScalar((.012+.006*Math.sin(u*11))*Math.sin(v)+fold)).toArray();},80,20);}
function oralBlade(a,length,width,spread,seed,shape){return closedSweep((u,v,center)=>{const angle=a+.12*Math.sin(u*6+seed)*u,radial=shape==='rounded'?.10+spread*Math.sin(u*Math.PI*.90):shape==='barrel'?.16+spread*.60*Math.sin(u*Math.PI/2):.07+spread*u,q=V(Math.cos(angle)*radial,-.025-length*u,Math.sin(angle)*radial);if(center)return q.toArray();const w=width*(.25+.75*Math.sin(u*Math.PI*.77)**.7),fold=(.007+.027*u)*(Math.sin(u*(19+seed)+seed)+.5*Math.sin(u*(43+seed*2)+Math.cos(v)*4)+.3*Math.sin(u*71+seed*5)),r=(.021+.065*u)*Math.sin(v)*(1+.25*Math.cos(v*3+u*11));return q.addScaledVector(V(-Math.sin(angle),0,Math.cos(angle)),w*Math.cos(v)*(1+.11*Math.sin(u*(31+seed*3)+Math.cos(v)*3+seed))).addScaledVector(V(Math.cos(angle),0,Math.sin(angle)),r+fold*Math.abs(Math.cos(v))**2).toArray();},88,24);}
function branchedArms(body,o,id,palette){if(id==='cassiopea-xamachana')return buildCassiopeaOralField(body,{add,merge,closedSweep,tubeGeometry,colour});const geos=[],tips=[],n=8,up=o.inverted,fried=o.egg,barrel=id==='rhizostoma-pulmo',len=up?.34:fried?.70:1.12,spread=up?.38:fried?.43:.52;
 for(let arm=0;arm<n;arm++){const a=arm*TAU/n+.06*Math.sin(arm*3),width=barrel?.25:fried?.24:.18;geos.push(oralBlade(a,len,width,spread,arm,fried?'rounded':barrel?'barrel':'branch'));
  // Irregular folded laminae attach to the lateral tissue, rather than a
  // repeated ladder of exposed tubular branches. These are unfitted surfaces.
  const count=barrel?25:fried?28:36;for(let j=0;j<count;j++){const u=.12+.80*(j+hash(j,arm)*.65)/count,side=j%2?1:-1,r=fried?.10+spread*Math.sin(u*Math.PI*.90):barrel?.16+spread*.60*Math.sin(u*Math.PI/2):.08+spread*u,ang=a+.12*Math.sin(u*6+arm)*u,reach=width*(.25+.75*Math.sin(u*Math.PI*.77)**.7)*side,q=V(Math.cos(ang)*r-Math.sin(ang)*reach,-.025-len*u,Math.sin(ang)*r+Math.cos(ang)*reach),length=.06+.09*hash(j+3,arm),curl=side*(.04+.04*hash(j,arm+1));
   const g=closedSweep((t,v,center)=>{const p=q.clone().add(V(-Math.sin(ang)*curl*t,-length*t,Math.cos(ang)*curl*t));if(center)return p.toArray();const w=(.009+.055*Math.sin(t*Math.PI)**.6)*(1+.22*Math.sin(t*17+j));return p.addScaledVector(V(Math.cos(ang),0,Math.sin(ang)),w*Math.cos(v)).addScaledVector(V(-Math.sin(ang),0,Math.cos(ang)),.009*Math.sin(v)+.012*Math.sin(t*(20+j%5)+Math.cos(v)*3+arm)*Math.abs(Math.cos(v))**2).toArray();},22,12);geos.push(g);
   if(fried&&j%2===0||up&&j%5===0){const endpoint=q.clone().add(V(-Math.sin(ang)*curl,-length,Math.cos(ang)*curl));tips.push(new T.SphereGeometry(1,12,9).scale(fried?.029+.010*hash(j,arm):.022,fried?.022+.014*hash(j,arm+3):.046,fried?.026:.021).translate(...endpoint));}
  }
  if(barrel)geos.push(new T.SphereGeometry(1,28,18).scale(.058,.18,.058).translate(Math.cos(a)*.47,-1.13,Math.sin(a)*.47));
 }
 const arms=add(body,merge(geos),fried?'#d8d8a7':palette[1],'eight-branched-volumetric-oral-arms',.90),uv=arms.geometry.attributes.uv,dark=new T.Color(barrel?palette[2]:fried?'#b6b797':palette[1]);colour(arms,(c,x,y,z,i)=>{c.set(fried?'#e0dfb2':barrel?'#d0c4a6':palette[1]);const edge=Math.abs(Math.cos(uv.getY(i)*TAU));c.lerp(dark,barrel?T.MathUtils.smoothstep(edge,.82,.99)*(.55+.20*Math.sin(y*21+x*9)): .08+.07*Math.sin(x*43+y*29)*Math.sin(z*31-y*17));});
 if(tips.length)add(body,merge(tips),fried?'#6762a4':palette[2],fried?'selected-violet-terminal-clubs':'selected-symbiotic-oral-vesicles',.95);
 if(barrel){const scapulets=[];for(let i=0;i<16;i++)scapulets.push(oralRibbon(i*TAU/16,.24,.075,.29,i,-.01));add(body,merge(scapulets),palette[1],'sixteen-selected-upper-scapulet-surfaces',.72);}
 add(body,new T.SphereGeometry(.28,40,24).scale(1,.13,1).translate(0,-.028,0),fried?'#d8d8b7':palette[1],'shared-oral-disc',.48);
}
function simpleArms(body,id,palette){const lion=id==='cyanea-capillata',mauve=id==='pelagia-noctiluca',geos=[];for(let i=0;i<4;i++)geos.push(oralRibbon(i*TAU/4+.13,(lion?1.55:mauve?1.12:1.90)*(.88+.12*Math.sin(i*3+1)),lion?.36:mauve?.22:.18,lion?.30:mauve?.36:.42,i));const mesh=add(body,merge(geos),palette[1],'four-closed-frilled-oral-arms',lion?.60:mauve?.46:.38);colour(mesh,(c,x,y,z)=>{c.set(palette[1]).lerp(new T.Color(palette[2]),mauve?.18+.17*Math.sin(x*130+y*71)*Math.sin(z*83-y*54):.035+.04*Math.sin(y*31+x*7));});}
function tentacles(body,o,id,palette){const geos=[],box=o.box,lion=id==='cyanea-capillata',fresh=id==='craspedacusta-sowerbii',crystal=id==='aequorea-victoria',mauve=id==='pelagia-noctiluca';
 const count=box?48:lion?560:fresh?100:crystal?96:mauve?8:24;
 for(let i=0;i<count;i++){let a=box?Math.PI/4+Math.floor(i/12)*TAU/4:lion?Math.floor(i/70)*TAU/8+(i%70-34.5)*.0052:id==='chrysaora-hysoscella'?Math.floor(i/3)*TAU/8+(i%3-1)*.20:i*TAU/count;const q=bellPoint(o,1,a);let x=q[0],z=q[2],y=q[1],length;
  if(box){const spread=(i%12-5.5)*.015;x+=Math.cos(a)*.12-Math.sin(a)*spread;z+=Math.sin(a)*.12+Math.cos(a)*spread;y=-.18;length=1.72+.21*hash(i,4);}
  else length=lion?1.55+.95*hash(i,3):fresh?(i%25===0?1.02:.18+.35*hash(i,4)):crystal?.16+.71*hash(i,6):mauve?1.75+.30*hash(i,7):1.60+.20*hash(i,8);
  const phase=i*2.39996,pts=Array.from({length:22},(_,j)=>{const u=j/21,bend=(lion?.16:crystal||fresh?.10:.12)*u*u,drift=.15*u*u;return[x+Math.cos(a)*drift+Math.sin(u*5+phase)*bend,y-length*u,z+Math.sin(a)*drift+Math.cos(u*4+phase)*bend];});geos.push(tubeGeometry(pts,box?.0055:mauve?.005:lion?.0019:crystal||fresh?.0024:.0035,28,6));
 }
 const m=add(body,merge(geos),palette[1],'anchored-tapered-marginal-tentacles',.72);if(box||mauve)colour(m,(c,x,y,z)=>{const band=box?.5+.5*Math.cos(y*120):.5+.5*Math.sin(y*81+x*33);c.set(palette[1]).lerp(new T.Color(palette[2]),box?band*.58:band*.30);});
 if(box){const ped=[];for(let i=0;i<4;i++){const a=Math.PI/4+i*TAU/4,q=bellPoint(o,1,a);ped.push(new T.SphereGeometry(1,24,16).scale(.095,.15,.048).rotateY(-a).translate(q[0]+Math.cos(a)*.06,-.075,q[2]+Math.sin(a)*.06));}add(body,merge(ped),palette[0],'four-palmate-pedalia',.68);}
 return count;
}
function hydrozoanOrgans(body,o,id,palette){const fresh=id==='craspedacusta-sowerbii',geos=[],count=fresh?4:80;for(let i=0;i<count;i++){const a=i*TAU/count,pts=Array.from({length:22},(_,j)=>bellPoint(o,.12+.86*j/21,a,true).map((v,k)=>v+(k===1?-.005:0)));geos.push(tubeGeometry(pts,fresh?.007:.0028,24,6));}add(body,merge(geos),palette[1],'radial-canals-and-selected-gonadal-tracks',.65);
 const ring=new T.TorusGeometry(o.r*.97,.006,8,180);ring.rotateX(Math.PI/2);add(body,ring,palette[1],'ring-canal',.64);
 const velum=annulus((u,a,inner)=>{const r=o.r*(.81+.18*u);return[Math.cos(a)*r,-.018-(inner?.008:0),Math.sin(a)*r];});add(body,velum,palette[0],'annular-hydrozoan-velum',.35,true);
 const mouth=closedSweep((u,a,center)=>{const y=-.045-u*(fresh?.38:.16),r=(fresh?.055:.22)*(1-.35*Math.sin(u*Math.PI))+(fresh?.018:.045)*u**4*Math.cos(a*(fresh?4:16));return center?[0,y,0]:[r*Math.cos(a),y+.012*u**4*Math.sin(a*(fresh?4:16)),r*Math.sin(a)];},32,64);add(body,mouth,palette[1],fresh?'quadrangular-manubrium-four-selected-lips':'broad-frilled-manubrium',.72);
 if(fresh){const gs=[];for(let i=0;i<4;i++){const a=i*TAU/4;const top=bellPoint(o,Math.asin(.34/o.r)/(Math.PI/2),a,true)[1]-.01;gs.push(closedSweep((u,v,center)=>{const q=V(Math.cos(a)*.34,top-.33*u,Math.sin(a)*.34);if(center)return q.toArray();const radius=.008+.11*Math.sin(u*Math.PI)**.65;return q.addScaledVector(V(-Math.sin(a),0,Math.cos(a)),radius*Math.cos(v)).addScaledVector(V(Math.cos(a),0,Math.sin(a)),(.009+.04*Math.sin(u*Math.PI))*Math.sin(v)+.005*Math.sin(u*27)*Math.abs(Math.cos(v))).toArray();},40,20));}add(body,merge(gs),palette[1],'four-pendant-gonadal-sacs',.72);}
}
function boxOrgans(body,o,palette){const velarium=annulus((u,a,inner)=>{const r=.43+.10*u,sq=1/Math.pow(Math.abs(Math.cos(a))**8+Math.abs(Math.sin(a))**8,1/8);return[Math.cos(a)*r*sq,-.025-(inner?.012:0),Math.sin(a)*r*sq];});add(body,velarium,palette[0],'cubozoan-velarium',.48,true);const stomach=new T.SphereGeometry(1,28,20).scale(.14,.19,.14).translate(0,-.07,0);add(body,stomach,palette[1],'central-manubrium',.55);for(let i=0;i<4;i++){const a=i*TAU/4;add(body,new T.SphereGeometry(.021,16,12).translate(Math.cos(a)*o.r,.13,Math.sin(a)*o.r),'#6d756d','selected-rhopalial-location-'+i,.8);} }
function colony(body,id){const parts=[],blue='#426a8b',pale='#c0cdd2';
 if(id==='physalia-physalis'){
  const float=shell((u,a,inner)=>{const x=Math.cos(a)*u*.90*(1+.12*u*Math.cos(a)),r=Math.sin(a)*u;return[x,(inner?-.025:.025)+.23*Math.sqrt(Math.max(0,1-u*u))*(inner?-1:1),r*.31*(1+.14*x)];},32,144);add(body,float,pale,'asymmetric-pneumatophore-envelope',.42,true);
  const crest=closedSweep((u,a,center)=>{const x=(u-.5)*1.65,height=.58*Math.sin(u*Math.PI)**.75*(1-.35*u)*(1+.065*Math.sin(u*53)),q=[x,.12+height*.55,0];if(center)return q;return[x,.12+height*(.5+.5*Math.cos(a)),(.012+.035*Math.sin(u*Math.PI))*.65*Math.sin(a)+.018*Math.sin(u*45)*Math.sin(a)];},72,18);add(body,crest,'#bd9fc0','inflatable-creased-crest',.37,true);
  const zooids=[],tent=[];for(let i=0;i<26;i++){const x=-.46+.032*i,z=-.10+.20*hash(i,2);zooids.push(new T.SphereGeometry(1,14,10).scale(.025,.055+.035*hash(i,8),.028).translate(x,-.18-.07*hash(i,3),z));if(i%3===0){const len=1.15+.85*hash(i,4),pts=Array.from({length:32},(_,j)=>{const u=j/31;return[x+.07*Math.sin(u*16+i)*u,-.20-len*u,z+.09*Math.cos(u*9+i)*u];});tent.push(tubeGeometry(pts,.012,48,8));}}
  add(body,merge(zooids),'#4d6981','ventral-feeding-and-tentacular-zooid-region',.84);const tm=add(body,merge(tent),blue,'unequal-coiled-capture-tentacles',.77);colour(tm,(c,x,y,z)=>c.set(blue).lerp(new T.Color('#73718c'),.35+.22*Math.sin(y*87)));
 }else if(id==='velella-velella'){
  const fn=(u,a,inner)=>[Math.cos(a)*u*.91,(inner?-.09:.09)*Math.sqrt(Math.max(0,1-u*u)),Math.sin(a)*u*.49];const disc=add(body,shell(fn,24,144),blue,'elliptical-chambered-float',.87,false);colour(disc,(c,x,y,z)=>{const r=Math.sqrt((x/.91)**2+(z/.49)**2);c.set('#9bb6c5').lerp(new T.Color('#3d6ba4'),T.MathUtils.smoothstep(r,.72,.99));});
  const chambers=[];for(let i=1;i<12;i++){const r=i/12;chambers.push(tubeGeometry(Array.from({length:100},(_,j)=>{const a=j/99*TAU;return[Math.cos(a)*r*.91,.093*Math.sqrt(1-r*r),Math.sin(a)*r*.49];}),.0025,100,5));}add(body,merge(chambers),pale,'concentric-gas-chamber-surface-cues',.48);
  const sail=closedSweep((u,a,center)=>{const x=(u-.5)*1.50,h=.52*(1-Math.abs(2*u-1))**.72,z=x*.37;return center?[x,h*.5+.035,z]:[x,.035+h*(.5+.5*Math.cos(a)),z+.006*Math.sin(a)];},64,18);add(body,sail,pale,'thin-oblique-sail-with-volume',.20,true);
  for(let i=0;i<64;i++){const a=i*TAU/64,x=Math.cos(a)*.78,z=Math.sin(a)*.42;parts.push(tubeGeometry([[x,-.025,z],[x+.025*Math.sin(i),-.10,z],[x+.04*Math.sin(i*3),-.15-.08*hash(i,2),z+.025*Math.cos(i)]],.004,16,6));}add(body,merge(parts),blue,'peripheral-zooid-fringe',.78);add(body,new T.SphereGeometry(1,24,16).scale(.11,.08,.11).translate(0,-.08,0),'#b3b5b7','central-feeding-zooid-region',.72);
 }else{
  const disc=add(body,shell((u,a,inner)=>[Math.cos(a)*u*.52,(inner?-.045:.045)*Math.sqrt(Math.max(0,1-u*u)),Math.sin(a)*u*.52],24,144),'#8d9c91','chambered-circular-float',1);colour(disc,(c,x,y,z)=>{const r=Math.hypot(x,z)/.52,a=Math.atan2(z,x);c.set('#726653').lerp(new T.Color('#397f91'),T.MathUtils.smoothstep(r,.79,.99)).multiplyScalar(1-.17*(Math.sin(r*160)**6+Math.sin(a*160)**16));});
  for(let i=0;i<58;i++){const a=i*TAU/58,len=.24+.47*hash(i,8),r=.50;const pts=Array.from({length:20},(_,j)=>{const u=j/19,ang=a+.17*Math.sin(u*5+i)*u;return[Math.cos(ang)*(r+len*u),-.02-.035*u,Math.sin(ang)*(r+len*u)];});parts.push(tubeGeometry(pts,.006,28,7));for(let j=1;j<9;j++){const u=j/9,p=pts[Math.round(u*19)];parts.push(new T.SphereGeometry(1,8,6).scale(.012,.008,.012).translate(...p));}}add(body,merge(parts),'#589eac','unequal-capitate-defensive-zooids',.80);
  const under=[];for(let i=0;i<72;i++){const a=i*2.39996,r=.37*Math.sqrt((i+.5)/72);under.push(new T.SphereGeometry(1,10,8).scale(.017,.027,.017).translate(Math.cos(a)*r,-.055,Math.sin(a)*r));}add(body,merge(under),'#d0d1b9','underside-reproductive-zooid-region',.85);add(body,new T.SphereGeometry(1,20,14).scale(.075,.06,.075).translate(0,-.07,0),'#a4b7ae','central-feeding-zooid-region',.8);
 }
}
export function buildJellyfishExterior(s){if(!jellyfishExteriorSpecies.has(s.id))return null;const k=toolkit(),body=k.group(),o=bellSpec(s.id),palette=palettes[s.id];let count=0;
 if(s.id==='chironex-fleckeri')count=buildChironexExterior(body,{add,merge,closedSweep,shell,annulus,colour});
 else if(s.id==='cotylorhiza-tuberculata')buildCotylorhizaExterior(body,{add,merge,closedSweep,shell,colour});
 else if(s.id==='rhizostoma-pulmo')buildRhizostomaExterior(body,{add,merge,closedSweep,shell,colour});
 else if(o){ornamentBell(body,o,s.id,palette);const top=o.h+(o.egg?.24:0)-o.thick,base=o.hydro?-.055:-.025;const connector=closedSweep((u,a,center)=>{const y=T.MathUtils.lerp(top,base,u),radius=(o.hydro?.055:o.box?.065:.10)+(!o.hydro&&!o.box?.10*Math.sin(u*Math.PI/2):0);return center?[0,y,0]:[Math.cos(a)*radius,y,Math.sin(a)*radius];},24,36);add(body,connector,palette[0],'connected-central-peduncle-region',.18);if(['cassiopea-xamachana','cotylorhiza-tuberculata','rhizostoma-pulmo'].includes(s.id))branchedArms(body,o,s.id,palette);else if(o.hydro)hydrozoanOrgans(body,o,s.id,palette);else if(o.box)boxOrgans(body,o,palette);else simpleArms(body,s.id,palette);if(!o.inverted&&!o.egg&&s.id!=='rhizostoma-pulmo')count=tentacles(body,o,s.id,palette);if(o.inverted)body.rotation.z=Math.PI;}
 else colony(body,s.id);
 const surfaces=[];body.traverse(m=>{if(m.isMesh)surfaces.push({mesh:m,base:m.geometry.attributes.position.array.slice()});});
 k.root.userData.preciseGround=true;k.root.userData.focusAnatomy=true;k.root.userData.anatomyFocusScale=[1.65,1.20,1.20];
 const features=o?(o.inverted?[[.35,-.16,0],[.48,.30,0],[.25,.12,0]]:[[.35,o.h*.5,0],[.35,-.43,0],[o.r*.9,-.05,0]]):s.id==='physalia-physalis'?[[.15,.20,0],[.15,-.18,0],[-.25,-.60,0]]:s.id==='velella-velella'?[[.2,.22,.08],[.30,.02,.1],[.25,-.1,.1]]:[[.15,.04,0],[.7,-.04,0],[.15,-.06,0]];
 k.root.userData.anatomy=o?{medusa:true,inverted:!!o.inverted,marginalTentacles:count>0,bellType:o.box?'rounded box':'radial bell'}:{colonial:true,sail:s.id!=='porpita-porpita'};
 k.root.userData.jellyfishExterior={version:'0.6.40',species:s.id,medusa:!!o,colonial:!o,inverted:!!o?.inverted,marginalTentacleCount:count,selectedCountsUnmeasured:true,closedBell:!!o,fluidDynamics:false,feeding:false,duration:['cassiopea-xamachana','cotylorhiza-tuberculata','rhizostoma-pulmo','chironex-fleckeri'].includes(s.id)?8:6};
 const m=k.finish(s,features),partNames=o?.hydro?['radial-canals','manubrium','marginal-tentacles']:o?.box?['closed-exumbrella','central-manubrium','four-palmate']:o?['closed-exumbrella',s.id==='rhizostoma-pulmo'||o.inverted||o.egg?'eight-branched':'four-closed',o.inverted?'selected-symbiotic':o.egg?'selected-violet':s.id==='rhizostoma-pulmo'?'eight-translucent':'marginal-tentacles']:s.id==='physalia-physalis'?['asymmetric-pneumatophore','ventral-feeding','unequal-coiled']:s.id==='velella-velella'?['thin-oblique','elliptical-chambered','peripheral-zooid']:['chambered-circular','unequal-capitate','underside-reproductive'];
 if(o?.hydro)m.features[1].set(0,-.14,0);if(s.id==='rhizostoma-pulmo')m.features[2].set(.30,-1.13,0);if(o?.box){m.features[1].set(0,-.07,0);m.features[2].set(.43,-.15,.43);}
 body.updateMatrix();const inverse=body.matrix.clone().invert(),anchors=partNames.map((prefix,i)=>{const mesh=surfaces.map(s=>s.mesh).find(m=>m.name.includes(prefix));if(!mesh)throw Error('Missing jellyfish anatomy surface '+s.id+' '+prefix);const target=m.features[i].clone().applyMatrix4(inverse),p=mesh.geometry.attributes.position,v=V();let index=0,min=Infinity;for(let j=0;j<p.count;j++){const distance=v.fromBufferAttribute(p,j).distanceToSquared(target);if(distance<min){min=distance;index=j;}}m.features[i].fromBufferAttribute(p,index).applyMatrix4(body.matrix);return{mesh,index};});
 k.root.userData.anatomyViewDirections=[[0,.55,1],[0,.1,1],[0,.15,1]];if(!o&&s.id!=='physalia-physalis'){k.root.userData.anatomyUnderside=[2];k.root.userData.anatomyViewDirections[2]=[0,-.65,1];}
 if(s.id==='cassiopea-xamachana'){k.root.userData.anatomyFocusScale=[1.8,1.8,1.6];k.root.userData.anatomyViewDirections=[[0,.8,1],[0,.9,1],[0,.65,1]];}
 if(s.id==='cotylorhiza-tuberculata'){k.root.userData.anatomyFocusScale=[1.6,1.6,1.5];k.root.userData.anatomyViewDirections=[[0,.5,1],[0,-.30,1],[0,-.35,1]];k.root.userData.anatomyUnderside=[1,2];}
 if(s.id==='rhizostoma-pulmo'){k.root.userData.anatomyFocusScale=[1.65,1.55,1.5];k.root.userData.anatomyViewDirections=[[0,.40,1],[0,-.3,1],[0,-.2,1]];k.root.userData.anatomyUnderside=[1];}
 rigs.set(m.root,{body,surfaces,spec:o,anchors,lastKey:null});return m;
}
export function animateJellyfishExterior(m,action,t){const r=rigs.get(m.root);if(!r)return false;const cassiopea=!!r.body.userData.cassiopeaOralField,cotylorhiza=!!r.body.userData.cotylorhizaOralField,rhizostoma=!!r.body.userData.rhizostomaOralField,chironex=!!r.body.userData.chironexExterior,time=clamp(t,0,cassiopea||cotylorhiza||rhizostoma||chironex?8:6),working=r.spec?action==='pulse':action==='appendage',key=working?time:0;if(r.lastKey===key)return true;r.lastKey=key;
 const envelope=working&&time<6?Math.sin(Math.PI*time/6)**2:0,pulse=envelope*(.5-.5*Math.cos(time*TAU/3)),o=r.spec;
 for(const {mesh,base} of r.surfaces){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=base[i*3],y=base[i*3+1],z=base[i*3+2];let xx=x,yy=y,zz=z;
  if(chironex){[xx,yy,zz]=chironexDeform(x,y,z,time,working);}
  else if(cassiopea){[xx,yy,zz]=cassiopeaDeform(x,y,z,time,working);}
  else if(cotylorhiza){[xx,yy,zz]=cotylorhizaDeform(x,y,z,time,working);}
  else if(rhizostoma){[xx,yy,zz]=rhizostomaDeform(x,y,z,time,working);}
  else if(o){const below=Math.max(0,-y),attachment=Math.exp(-below*1.6),rim=clamp(Math.hypot(x,z)/o.r,0,1),contraction=1-(o.box?.065:.13)*pulse*(y>=0?rim**1.4:attachment);xx*=contraction;zz*=contraction;yy+=.045*pulse*(y>=0?clamp(1-y/(o.h+(o.egg?.24:0)),0,1):attachment);const wave=envelope*Math.sin(time*2.8-below*3)*.035*(1-attachment);xx+=wave;zz+=wave*.55;}
  else if(y<-.05){const weight=1-Math.exp((y+.05)*3),wave=.035*envelope*Math.sin(time*2.2-y*4);xx+=wave*weight;zz+=wave*.5*weight;}
  p.setXYZ(i,xx,yy,zz);
 }p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
 for(const[a,i]of r.anchors.map((a,i)=>[a,i]))m.features[i].fromBufferAttribute(a.mesh.geometry.attributes.position,a.index).applyMatrix4(r.body.matrix);
 m.root.updateMatrixWorld(true);return true;
}
