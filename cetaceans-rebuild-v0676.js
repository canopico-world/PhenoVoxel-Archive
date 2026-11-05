import * as T from 'three';
import {buildCetacean,cetaceanRig,cetaceanBodyPoint,cetaceanSection} from './cetacean-models.js';
import {cetacean676Profiles,cetacean676Limits} from './cetaceans-config-v0676.js';
import {skinSample,mouthQ} from './cetaceans-skin-v0676.js';
import manifest from './cetaceans-textures-v0676.json' with {type:'json'};
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),sm=T.MathUtils.smoothstep,clamp=T.MathUtils.clamp,TAU=Math.PI*2;
const cache=new Map(),pending=new Map();
let requestedProfile=null;
export async function preloadCetacean676(s){
 if(s.visual?.cetaceanVersion!=='0.6.76'||typeof document==='undefined')return;
 const id=s.visual.cetaceanProfile||s.id;requestedProfile=id;if(cache.has(id))return;if(pending.has(id))return pending.get(id);
 const task=(async()=>{const maps={};await Promise.all(['body','flipper','fluke','dorsal'].flatMap(kind=>['color','normal','roughness'].map(async channel=>{const a=manifest.assets[`${id}:${kind}:${channel}`];if(!a)throw Error('Missing cetacean skin asset '+id+':'+kind+':'+channel);const tx=await new T.TextureLoader().loadAsync('./'+a.file);tx.flipY=false;tx.wrapT=T.RepeatWrapping;tx.colorSpace=channel==='color'?T.SRGBColorSpace:T.NoColorSpace;tx.anisotropy=8;tx.userData={author:manifest.author,license:manifest.license,source:manifest.scope};maps[kind+':'+channel]=tx;})));
  if(manifest.detailLayer){const tx=await new T.TextureLoader().loadAsync('./'+manifest.detailLayer.file);tx.flipY=false;tx.colorSpace=T.NoColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(1,1);tx.anisotropy=8;tx.userData={source:'AI-authored microdetail artwork, not a biological measurement',license:'MIT'};maps.microdetail=tx;}
  if(requestedProfile!==id){for(const tx of Object.values(maps))tx.dispose();return;}
  for(const previous of cache.values())for(const tx of Object.values(previous))tx.dispose();cache.clear();cache.set(id,maps);
 })();pending.set(id,task);try{await task;}finally{pending.delete(id);}
}
function loft(fn,n=56,r=32){
 const pos=[],uv=[],ix=[];for(let i=0;i<=n;i++)for(let j=0;j<=r;j++){pos.push(...fn(i/n,j===r?0:j/r*TAU));uv.push(i/n,j/r);}for(let i=0;i<n;i++)for(let j=0;j<r;j++){const a=i*(r+1)+j,b=a+r+1;ix.push(a,b,a+1,a+1,b,b+1);}
 for(const end of [0,n]){const start=end*(r+1),center=V();for(let j=0;j<r;j++)center.add(V(...pos.slice((start+j)*3,(start+j)*3+3)));center.divideScalar(r);const k=pos.length/3;pos.push(...center);uv.push(end/n,.5);for(let j=0;j<r;j++)ix.push(...(end===n?[k,start+j+1,start+j]:[k,start+j,start+j+1]));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);const p=g.attributes.position;let volume=0;for(let i=0;i<ix.length;i+=3)volume+=V().fromBufferAttribute(p,ix[i]).dot(V().fromBufferAttribute(p,ix[i+1]).cross(V().fromBufferAttribute(p,ix[i+2])));if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.setIndex(ix);g.computeVertexNormals();g.userData.closedExterior=true;g.userData.loft={n,r};smoothSeam(g);return g;
}
function smoothSeam(g){const row=g.userData.loft;if(!row)return;const a=g.attributes.normal;for(let i=0;i<=row.n;i++){const j=i*(row.r+1),k=j+row.r,n=V().fromBufferAttribute(a,j).add(V().fromBufferAttribute(a,k)).normalize();a.setXYZ(j,...n);a.setXYZ(k,...n);}a.needsUpdate=true;}
function fallback(c,kind){const w=256,h=128,data=new Uint8Array(w*h*4),out=new T.Color();for(let j=0;j<h;j++)for(let i=0;i<w;i++){skinSample(c,i/(w-1),j/(h-1)*TAU,kind,out);out.convertLinearToSRGB();const k=(j*w+i)*4;data[k]=out.r*255;data[k+1]=out.g*255;data[k+2]=out.b*255;data[k+3]=255;}const t=new T.DataTexture(data,w,h);t.flipY=false;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;}
function sculpt(c,p,u,a){const q=Math.cos(a),side=Math.sin(a),r=cetaceanSection(c,u);
 // Flatten the rostral dorsum of rorquals while retaining a rounded thorax.
 if(c.id.startsWith('balaenoptera-')&&u<c.headEnd){const w=1-sm(u,c.headEnd-.05,c.headEnd);p.y-=.018*w*sm(q,.4,.95);p.z*=1+.13*w*sm(-q,.1,.85);}
 // Local pectoral girdle volume and lower jaw, not an external ball or cylinder.
 p.z+=Math.sign(side)*.020*Math.exp(-1*((u-c.flipperU)/.060)**2)*Math.exp(-1*((q+.30)/.45)**2);
 if(u<c.headEnd&&u>(c.id==='kogia-sima'?.045:.002)){const d=Math.exp(-1*((q-mouthQ(c,u))/.025)**2)*Math.sin(Math.PI*u/c.headEnd);p.z-=Math.sign(side)*.004*d;}
 const socket=Math.exp(-1*((u-c.eyeU)/.014)**2)*Math.exp(-1*((q-c.eyeQ)/.08)**2);p.z-=Math.sign(side)*.006*socket;
 if(c.melonCrease&&u<.13&&q>.6)p.y-=.005*Math.exp(-1*(side/.05)**2)*Math.sin(Math.PI*clamp(u/.13,0,1));
 if(u>.76){const keel=sm(u,.76,.95);p.z*=1-.12*keel;p.y+=.016*keel*q;}
 // Fine low-amplitude contour irregularity; no repeated transverse ribs.
 p.z+=.0006*Math.sin(79*u+13*side)*Math.sin(43*u+11*q)*side;
}
export function buildCetacean676(s){
 const id=s.visual.cetaceanProfile||s.id,base=cetacean676Profiles[id];if(!base)throw Error('Missing cetacean profile '+id);const maps=cache.get(id);if(typeof document!=='undefined'&&!maps)throw Error('Detailed cetacean skin is not ready: '+id);const c={...base,surfaceSculpt:(p,u,a)=>sculpt(base,p,u,a),textureFactory:(_,kind)=>(maps?.[kind+':color']?.clone()||fallback(base,kind))};
 const m=buildCetacean(s,c),r=cetaceanRig(m);
 const material=kind=>{const mat=new T.MeshPhysicalMaterial({color:id==='grampus-griseus'&&kind!=='body'?'#a0aaaa':'#ffffff',map:maps?.[kind+':color']?.clone()||fallback(c,kind),normalMap:maps?.[kind+':normal']?.clone()||null,roughnessMap:maps?.[kind+':roughness']?.clone()||null,roughness:1,metalness:0,ior:1.4,clearcoat:.16,clearcoatRoughness:.9,clearcoatRoughnessMap:maps?.microdetail?.clone()||null,envMapIntensity:.42});mat.normalScale.set(kind==='body'?.055:.08,kind==='body'?.055:.08);mat.userData={compatibilityMarineOptics:true,compatibilityWetSkin:true,compatibilitySurfaceDetail:true,compatibilityLinearTexture:true,cetaceanSurface676:true};return mat;};
 const replace=(mesh,g,kind)=>{mesh.geometry.dispose();mesh.geometry=g;mesh.material.dispose();mesh.material=material(kind);};
 r.body.material.dispose();r.body.material=material('body');
 for(const f of r.flippers){const side=f.side,p=cetaceanBodyPoint(c,c.flipperU,Math.acos(-.37)*side);p.z*=.84;p.y+=.012;f.pivot.copy(p);const g=loft((v,a)=>{const rounded=['inia-geoffrensis','orcaella-brevirostris','caperea-marginata','kogia-sima'].includes(id),tip=rounded?Math.sqrt(1-v*v):1-v**2.9,chord=c.flipperChord*(.98+.16*Math.sin(Math.PI*v))*tip+.001,thick=.042*(1-v)**1.4+.001,center=p.x-c.flipperSweep*(.46*v+.54*v*v);return V(center+Math.cos(a)*chord*.5,p.y-c.flipperDrop*v+.018*Math.sin(Math.PI*v)+Math.sin(a)*thick,p.z+side*c.flipperLength*v);},56,32);replace(f.mesh,g,'flipper');}
 for(let k=0;k<r.flukes.length;k++){const side=k===0?-1:1;const g=loft((v,a)=>{const sweep=.23*(c.flukeChord/.35),lead=-c.length*.5+.12-sweep*v**1.5,notch=(c.beaked||id==='hyperoodon-ampullatus')?0:.085*Math.exp(-v*12),trail=-c.length*.5-.17+notch-(c.beaked||id==='hyperoodon-ampullatus'?.035:.14)*Math.sin(Math.PI*v)+.05*v,tip=sm(v,.86,1),l=T.MathUtils.lerp(lead,(-c.length*.5-.22),tip),b=T.MathUtils.lerp(trail,(-c.length*.5-.221),tip);return V((l+b)*.5+Math.cos(a)*(l-b)*.5,c.y+.012*v*v+Math.sin(a)*(.033*(1-v)**.7+.0005),side*c.flukeSpan*.5*v);},64,32);replace(r.flukes[k],g,'fluke');}
 if(r.dorsal){const x=c.length*(.5-c.dorsalU),y=c.y+cetaceanSection(c,c.dorsalU).top-.023,g=loft((v,a)=>{const spinner=id==='stenella-longirostris',rounded=id==='orcaella-brevirostris',lead=c.dorsalChord*.5*(1-v)**(rounded?.5:spinner?1:.80)-c.dorsalSweep*.68*v**1.6,trail=-c.dorsalChord*.5*(1-v)**(rounded?.5:spinner?1:2.65)-c.dorsalSweep*.68*v**(rounded?1.6:3.2),chord=Math.max(.0006,lead-trail);return V(x+(lead+trail)*.5+Math.cos(a)*chord*.5,y+c.dorsalHeight*v,Math.sin(a)*(.044*(1-v)**2+.0005));},64,32);replace(r.dorsal,g,'dorsal');}
 // The closed-mouth northern bottlenose has hidden apical teeth. Only the
 // erupted mandibular teeth of the selected adult male Blainville are exposed.
 for(const part of [...r.parts])if(/^(eyelid-exterior|blowhole-exterior)/.test(part.mesh.name)){m.root.remove(part.mesh);r.parts.splice(r.parts.indexOf(part),1);part.mesh.geometry.dispose();part.mesh.material.dispose();}
 const mysticete=id.startsWith('balaenoptera-')||id==='caperea-marginata',blowU=c.blowholeU??c.headEnd*.73;
 for(const side of mysticete?[-1,1]:[0]){const pts=[];for(let j=0;j<=28;j++){const f=j/28,a=f*Math.PI,offset=mysticete?side*(.105+.035*f):.09*Math.cos(a)+(c.falseGill?-.025:0),u=mysticete?blowU+(f-.5)*.014:blowU+(id==='orcaella-brevirostris'?1:-1)*.008*Math.sin(a);pts.push(cetaceanBodyPoint(c,u,offset).add(V(0,.001,0)));}const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts),56,.0028,8,false),o=new T.Mesh(g,new T.MeshStandardMaterial({color:'#20272a',roughness:.48}));o.name='closed-respiratory-slit-'+side;m.root.add(o);r.parts.push({mesh:o});}
 if(['kogia-sima','hyperoodon-ampullatus','mesoplodon-densirostris'].includes(id)){
  for(const part of [...r.parts])if(part.mesh.name==='short-shallow-throat-crease'){m.root.remove(part.mesh);r.parts.splice(r.parts.indexOf(part),1);part.mesh.geometry.dispose();part.mesh.material.dispose();}
  for(const side of [-1,1]){const pts=[];for(let j=0;j<=32;j++){const f=j/32;pts.push(cetaceanBodyPoint(c,.13+.16*f,Math.PI+side*(.045+.19*f)));}const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts),64,.0011,6,false),o=new T.Mesh(g,new T.MeshStandardMaterial({color:'#707c7c',roughness:.6}));o.name='short-paired-V-throat-crease-'+side;m.root.add(o);r.parts.push({mesh:o});}
 }
 for(const part of r.parts)if(part.mesh.name.startsWith('small-lateral-eye')){const eye=part.mesh,side=eye.name.endsWith('--1')?-1:1,p=cetaceanBodyPoint(c,c.eyeU,Math.acos(c.eyeQ)*side),g=new T.SphereGeometry(1,32,20);g.scale(c.eyeScale,c.eyeScale*.70,c.eyeScale*.42);g.translate(...p);eye.geometry.dispose();eye.geometry=g;eye.material=new T.MeshPhysicalMaterial({color:'#171b1b',roughness:.16,clearcoat:.5,ior:1.4});}
 for(const part of r.parts)part.neutral=part.mesh.geometry.attributes.position.array.slice();
 m.cet16={version:'0.6.76',profile:id,limits:cetacean676Limits};m.cetaceanRebuild676=true;m.cetaceanStudy={version:'0.6.76',phenotype:c.phenotype,sourceScope:cetacean676Limits};Object.assign(m.root.userData,{cet16:m.cet16,cetaceanStudy:m.cetaceanStudy,aquaticStudy:true,hideStudioGround:true,compatibilityMarineShadows:true});
 m.motionBounds={swim:new T.Box3(V(-2.2,.65,-1.5),V(2.1,2.6,1.5)),glide:new T.Box3(V(-2.2,.65,-1.5),V(2.1,2.6,1.5)),turn:new T.Box3(V(-2.3,.55,-1.65),V(2.25,2.7,1.65))};
 m.motionBounds.dive=m.motionBounds.spindive=new T.Box3(V(-2.3,-.7,-2.2),V(2.3,3.7,2.2));
 // Rebind the three external landmarks after replacing appendage topology.
 m.featureBindings=[{mesh:r.body,indices:[Math.round(c.headEnd*.7*224)*97+24]},{mesh:r.flukes[1],indices:[32*33+8]},{mesh:r.dorsal||r.body,indices:[r.dorsal?45*33:Math.round(.6*224)*97]}];m.features=m.featureBindings.map(b=>V().fromBufferAttribute(b.mesh.geometry.attributes.position,b.indices[0]));r.c=c;animateCetacean676(m,'observe',0);return m;
}
export function cetacean676Kinematics(c,action,t){const active=action!=='observe',clock=Math.max(0,t),ramp=sm(clock,0,.65),bout=action==='glide'?1-sm(clock,3.5,5.5):['dive','spindive'].includes(action)?1-sm(clock,6,8):1,stroke=active&&['swim','glide','turn','head','dive','spindive'].includes(action)?ramp*bout:0,phase=TAU*c.strokeRate*clock;return{clock,phase,stroke,bank:action==='turn'?.18*ramp*Math.sin(clock*.45):action==='spindive'?2.09*sm(clock,2,3):0,yaw:action==='turn'?.38*ramp*Math.sin(clock*.45):0,pitch:action==='spindive'?-.95*sm(clock,2,5):action==='dive'?-.72*sm(clock,1,4):0};}
export function animateCetacean676(m,action,t){
 if(!m.cetaceanRebuild676)return false;const r=cetaceanRig(m),c=r.c,k=cetacean676Kinematics(c,action,t),amp=c.strokeAmplitude*k.stroke,turn=action==='turn',head=action==='head'&&c.neck;
 for(const part of r.parts){const mesh=part.mesh,p=mesh.geometry.attributes.position,neutral=part.neutral,fluke=r.flukes.includes(mesh);for(let i=0;i<p.count;i++){
  let x=neutral[i*3],y=neutral[i*3+1],z=neutral[i*3+2];const u=clamp(.5-x/c.length,0,1),f=sm(u,.36,1),phi=k.phase-2.5*u,dy=amp*f*f*Math.sin(phi),slope=amp*(3.0*f*Math.sin(phi)-2.5*f*f*Math.cos(phi))/c.length;
  // Posterior bending is dorsoventral. A separate pitching hydrofoil is not a
  // side-to-side fish tail, and the pectorals do not flap for propulsion.
  if(fluke){const px=-c.length*.5,angle=-.25*k.stroke*Math.sin(k.phase-2.5+Math.PI*.35),dx=x-px,yy=y-c.y;x=px+dx*Math.cos(angle)-yy*Math.sin(angle);y=c.y+dx*Math.sin(angle)+yy*Math.cos(angle);}
  const center=c.y+(cetaceanSection(c,u).top+cetaceanSection(c,u).bottom)*.5,offset=y-center;x+=offset*slope;y+=dy;
  if(turn){const flex=sm(u,.26,1);z+=.11*k.yaw*flex*flex;}
  if(head){const w=1-sm(u,.21,.38),angle=.13*k.stroke*Math.sin(k.phase*.35)*w,pivot=c.length*(.5-.34),dx=x-pivot;x=pivot+dx*Math.cos(angle)+z*Math.sin(angle);z=z*Math.cos(angle)-dx*Math.sin(angle);}
  p.setXYZ(i,x,y,z);
 }p.needsUpdate=true;mesh.geometry.computeVertexNormals();smoothSeam(mesh.geometry);mesh.geometry.computeBoundingSphere();}
 m.root.rotation.set(k.bank,k.yaw,k.pitch,'ZYX');const pivot=V(0,c.y,0);m.root.position.copy(pivot).sub(pivot.clone().applyQuaternion(m.root.quaternion));if(action==='log')m.root.position.y+=.005*Math.sin(k.clock*.5);m.root.updateMatrixWorld(true);r.current={...k,action,uncalibrated:true};for(let i=0;i<m.features.length;i++){const b=m.featureBindings[i];m.features[i].fromBufferAttribute(b.mesh.geometry.attributes.position,b.indices[0]);}return true;
}
