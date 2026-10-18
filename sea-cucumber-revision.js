import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Original numerical surface and appendage illustrations, not measured specimens.
const rigs=new WeakMap(),TAU=Math.PI*2,UP=new T.Vector3(0,1,0),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const random=i=>{const a=Math.sin(i*127.1+83.9)*43758.5453;return a-Math.floor(a);};
const smooth=t=>t*t*(3-2*t),mix=T.MathUtils.lerp;
function noise(x,y,z){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),u=smooth(x-a),v=smooth(y-b),w=smooth(z-c),h=(i,j,k)=>random(i*157+j*313+k*571);return mix(mix(mix(h(a,b,c),h(a+1,b,c),u),mix(h(a,b+1,c),h(a+1,b+1,c),u),v),mix(mix(h(a,b,c+1),h(a+1,b,c+1),u),mix(h(a,b+1,c+1),h(a+1,b+1,c+1),u),v),w);}
export const revisedCucumbers=Object.freeze(['cucumaria-frondosa','holothuria-atra','apostichopus-japonicus']);
export const cucumberRig=root=>rigs.get(root);
function makeBody(k,r){
 const rows=200,around=128,p=[],colors=[],ix=[];
 const color=(q,u,a)=>{const n=.65*noise(q.x*6,q.y*6,q.z*6)+.35*noise(q.x*75,q.y*75,q.z*75),c=new T.Color(r.dark).lerp(new T.Color(r.light),n);if(r.sandMask)c.lerp(new T.Color('#727c70'),r.sandMask(u,a)*(.48+.27*n));if(r.frond&&u>.93)c.lerp(new T.Color('#c8ba9f'),(u-.93)/.07*.65);if(r.japan){const pap=r.papillaHeight(u,a),fine=noise(q.x*35,q.y*35,q.z*35);c.lerp(new T.Color('#c1a26d'),Math.min(.75,pap*3));c.lerp(new T.Color('#6e654f'),T.MathUtils.smoothstep(fine,.60,.82)*.20);}return c;};
 for(let i=0;i<=rows;i++)for(let j=0;j<around;j++){const u=i/rows,a=j/around*TAU,q=r.point(u,a);p.push(...q);colors.push(...color(q,u,a).toArray());}
 for(let i=0;i<rows;i++)for(let j=0;j<around;j++){const a=i*around+j,b=i*around+(j+1)%around,c=a+around,d=b+around;ix.push(a,c,b,b,c,d);}
 // Share each circular seam and close both ends without degenerate polar rings.
 const tail=p.length/3;p.push(...r.center(0));colors.push(...new T.Color(r.dark).toArray());const oral=p.length/3;p.push(...r.center(1));colors.push(...new T.Color(r.dark).toArray());
 for(let j=0;j<around;j++){ix.push(tail,(j+1)%around,j);ix.push(oral,rows*around+j,rows*around+(j+1)%around);}
 // Parametric orientation is fixed for the entire wall/cap, independent of
 // local pigment grain or papilla slopes. Per-face radial guesses can reverse
 // neighbouring triangles on a finely corrugated surface.
 const wallIndices=rows*around*6;
 for(let i=0;i<ix.length;i+=3)if((i<wallIndices&&!r.vertical)||(i>=wallIndices&&r.vertical))[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();r.body=k.mesh(g,'#ffffff',k.root,{vertexColors:true,roughness:r.frond?.84:.67});r.body.name=r.id+' continuous body wall';
}
function instanceField(k,entries,geometry,extra={}){const mesh=new T.InstancedMesh(geometry,k.mat('#ffffff',extra),entries.length),o=new T.Object3D();mesh.castShadow=true;mesh.receiveShadow=true;k.root.add(mesh);for(let i=0;i<entries.length;i++){const e=entries[i];o.position.copy(e.position);o.quaternion.setFromUnitVectors(UP,e.direction||UP);o.scale.copy(e.scale);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,new T.Color(e.color));}mesh.instanceMatrix.needsUpdate=true;return mesh;}
function curveGeometry(points,radius){return new T.TubeGeometry(new T.CatmullRomCurve3(points),20,radius,7,false);}
function setTube(mesh,points,radius){const g=curveGeometry(points,radius),a=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;a.array.set(g.attributes.position.array);n.array.set(g.attributes.normal.array);a.needsUpdate=true;n.needsUpdate=true;g.dispose();}
function crown(k,r){
 const count=r.frond?10:20,axis=r.frond?UP:V(.75,-.66,0).normalize(),base=(r.frond?r.center(1).addScaledVector(axis,.015):r.point(.97,Math.PI));r.oralBase=base;r.oralAxis=axis;r.tentacles=[];
 const mouth=k.ell(base.toArray(),r.frond?[.065,.015,.065]:[.025,.055,.055],r.frond?'#352728':'#151713');if(!r.frond)mouth.quaternion.setFromUnitVectors(V(1,0,0),axis);r.mouth=mouth;
 const basis1=r.frond?V(1,0,0):V(0,0,1),basis2=new T.Vector3().crossVectors(axis,basis1).normalize();
 for(let i=0;i<count;i++){
  const a=i/count*TAU,radial=basis1.clone().multiplyScalar(Math.cos(a)).addScaledVector(basis2,Math.sin(a)),anchor=base.clone().addScaledVector(radial,r.frond?.12:.043),tip=anchor.clone().addScaledVector(axis,r.frond?.48:.085).addScaledVector(radial,r.frond?.43:.065),mid=anchor.clone().lerp(tip,.55).addScaledVector(axis,.025),radius=r.frond?.014:.007;
  const stem=k.mesh(curveGeometry([anchor,mid,tip],radius),r.frond?'#b5a08a':r.japan?'#807153':'#473a2c',k.root,{roughness:.65});const head=k.group(tip.toArray());head.quaternion.setFromUnitVectors(UP,r.frond?tip.clone().sub(mid).normalize():axis);const branches=[];
  if(r.frond){
   // Repeated branching, with all branches attached to a single moving tentacle.
   for(let j=1;j<=7;j++)for(let side=0;side<3;side++){const u=j/8,azimuth=a+j*.73+side*TAU/3,fan=V(Math.cos(azimuth),0,Math.sin(azimuth)),start=V(0,-.32+u*.35,0),len=.07+.11*Math.sin(u*Math.PI),end=start.clone().addScaledVector(fan,len).add(V(0,.055,0));k.tube([start,start.clone().lerp(end,.55).add(V(0,.02,0)),end],.0048,'#967b66',head,8);for(let n=1;n<=4;n++){const f=n/5,b=start.clone().lerp(end,f),az=azimuth+(n%2?-.65:.65),d=b.clone().add(V(Math.cos(az)*.032,.035+.025*random(i*90+j*7+n),Math.sin(az)*.032));k.tube([b,d],.0022,'#b29173',head,4);branches.push(d);for(let twig=0;twig<2;twig++){const q=b.clone().lerp(d,.55+twig*.25),aa=az+(twig?-.8:.8),tip=q.clone().add(V(Math.cos(aa)*.013,.014,Math.sin(aa)*.013));k.tube([q,tip],.0012,'#bca080',head,3);}}}
   for(let j=0;j<7;j++){const a2=j*TAU/7,end=V(Math.cos(a2)*.055,.045,Math.sin(a2)*.055);k.tube([V(),end],.0028,'#a88a70',head,5);}
  }else{
   // Adult peltate/digitate distal fan, not an upright dendritic crown.
   for(let l=0;l<6;l++){const a2=l*TAU/6,stemEnd=V(Math.cos(a2)*.022,.006,Math.sin(a2)*.022);k.tube([V(),stemEnd],.0038,r.japan?'#a58b66':'#514334',head,4);for(const side of [-1,1]){const end=stemEnd.clone().add(V(Math.cos(a2+side*.5)*.014,.003,Math.sin(a2+side*.5)*.014));k.tube([stemEnd,end],.0024,r.japan?'#c0a77d':'#5d4e3d',head,3);}}
  }
  // One draw surface per branching head instead of thousands of twig objects.
  const geometries=head.children.map(child=>{const g=child.geometry,c=child.material.color,values=new Float32Array(g.attributes.position.count*3);for(let v=0;v<g.attributes.position.count;v++){values[v*3]=c.r;values[v*3+1]=c.g;values[v*3+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(values,3));return g;});
  if(geometries.length){const merged=mergeGeometries(geometries);head.clear();for(const g of geometries)g.dispose();k.mesh(merged,'#ffffff',head,{vertexColors:true,roughness:.73});}
  r.tentacles.push({index:i,anchor,tip,mid,stem,head,radius,neutralQuaternion:head.quaternion.clone(),branches});
 }
}
export function seaCucumberRevision(s,k){
 if(!revisedCucumbers.includes(s.id))return null;
 const r={id:s.id,frond:s.id==='cucumaria-frondosa',japan:s.id==='apostichopus-japonicus',feet:[],papillae:[]};r.vertical=r.frond;r.dark=r.frond?'#4d4542':r.japan?'#241e1c':'#141916';r.light=r.frond?'#968775':r.japan?'#6e4b34':'#343b33';rigs.set(k.root,r);
 r.center=u=>r.frond?V(.15*Math.sin(u*Math.PI)+.12*u,.08+u*1.9,.09*Math.sin(u*Math.PI*1.3)):V(-1.5+3*u,.285+.015*Math.sin(u*Math.PI),(r.japan?.10:.24)*Math.sin(u*Math.PI*(r.japan?1.4:1.6)));
 if(r.japan)for(const angle of [-.62,.62,-1.90,1.90])for(let i=0;i<10;i++)r.papillae.push({u:.10+i*.087+(angle<0?.013:0)+(i?(random(i+angle*29)-.5)*.018:0),a:angle+(i?(random(i+angle*37)-.5)*.15:0),height:.15+.08*random(i+angle*7)});
 r.papillaHeight=(u,a)=>{let h=0;for(const p of r.papillae){const da=Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a));h+=p.height*Math.exp(-(((u-p.u)/.018)**2+(da/.15)**2));}return h;};
 r.point=(u,a)=>{const c=r.center(u),taper=.16+.84*Math.pow(Math.max(0,Math.sin(u*Math.PI)),.30),wrinkle=1+.002*Math.cos(u*TAU*16+a*.5)+.0015*Math.sin(u*TAU*32),micro=(noise(c.x*58+Math.cos(a)*10,c.y*58,c.z*58+Math.sin(a)*10)-.5)*(r.japan?.008:.003);
  if(r.frond){const radius=(.40-.13*u)*taper*wrinkle+micro;return c.add(V(Math.cos(a)*radius,0,Math.sin(a)*radius));}
  const sy=Math.cos(a),sz=Math.sin(a),power=r.japan?.68:1,width=(r.japan?.40:.32)*taper,height=(r.japan?.29:.29)*taper,pap=r.papillaHeight(u,a);let dy=Math.sign(sy)*Math.pow(Math.abs(sy),power)*height,dz=Math.sign(sz)*Math.pow(Math.abs(sz),power)*width;if(sy<0)dy*=.87;dy+=(sy*pap+micro);dz+=sz*pap;return c.add(V(0,dy*wrinkle,dz*wrinkle));};
 r.normal=(u,a)=>{const e=.0001,du=r.point(Math.min(1,u+e),a).sub(r.point(Math.max(0,u-e),a)),da=r.point(u,a+e).sub(r.point(u,a-e)),n=du.cross(da).normalize(),out=r.point(u,a).sub(r.center(u));return n.dot(out)<0?n.negate():n;};
 if(!r.frond&&!r.japan){r.sandPatches=Array.from({length:13},(_,i)=>({u:.13+i*.058+(random(i+88)-.5)*.020,a:(i%2?-.65:.65)+(random(i+55)-.5)*.16,w:.026+.025*random(i)}));r.sandMask=(u,a)=>{let d=10;for(const p of r.sandPatches)d=Math.min(d,((u-p.u)/p.w)**2+(Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a))/.26)**2);d+=(noise(u*80,Math.cos(a)*20,Math.sin(a)*20)-.5)*.90;return T.MathUtils.smoothstep(d,.60,1.35)*T.MathUtils.smoothstep(Math.cos(a),-.30,.25);};}makeBody(k,r);
 const entries=[];
 if(!r.frond&&!r.japan){
  // One selected sand-covered morph. Bare patches are body pigmentation, not eyes.
  const patches=r.sandPatches;
  for(let i=0;i<12500;i++){const u=.025+.95*random(i*3+1),a=(random(i*3+2)-.5)*TAU*.78;if(Math.cos(a)<-.1||patches.some(p=>((u-p.u)/p.w)**2+(Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a))/.26)**2<1))continue;const n=r.normal(u,a),size=.0019+.0024*random(i*3+3);entries.push({position:r.point(u,a).addScaledVector(n,size*.5),direction:n,scale:V(size,.0009+size*.18,size*.8),color:['#ada890','#8f917c','#c0b59b','#777e70'][i%4]});}
  r.sand=instanceField(k,entries,new T.IcosahedronGeometry(1,0),{roughness:.98});
 }
 const feet=[];
 for(let row=0;row<(r.frond?5:3);row++)for(let j=0;j<(r.frond?24:34);j++)for(let side of [-1,1]){const u=.09+j*(r.frond?.035:.025)+(random(row*170+j*3+side)-.5)*.009,a=r.frond?row*TAU/5+side*.055:Math.PI+(row-1)*.46+side*.035,anchor=r.point(u,a),normal=r.normal(u,a),end=anchor.clone().addScaledVector(normal,r.frond?.035:.048);if(!r.frond)end.y=.018;const direction=end.clone().sub(anchor),length=direction.length(),q={position:anchor.clone().lerp(end,.5),direction:direction.normalize(),scale:V(r.frond?.009:.007,length,r.frond?.009:.007),color:r.frond?'#aa7c51':r.japan?'#927c54':'#4b4f3d'};feet.push(q);r.feet.push({anchor,end,row});}
 r.footMesh=instanceField(k,feet,new T.CylinderGeometry(.84,1,1,7),{roughness:.74});
 const discs=r.feet.map(f=>({position:f.end,direction:r.frond?f.end.clone().sub(f.anchor).normalize():UP,scale:V(r.frond?.015:.010,.003,r.frond?.015:.010),color:r.frond?'#bf8e5b':r.japan?'#b29a6b':'#72715a'}));r.discs=instanceField(k,discs,new T.SphereGeometry(1,8,5),{roughness:.77});
 crown(k,r);k.root.userData.preciseGround=true;k.root.userData.fixedGeometry=true;
 return r.frond?[r.oralBase.toArray(),r.center(.55).toArray(),r.point(.3,0).toArray()]:[r.point(.5,0).toArray(),r.oralBase.toArray(),r.point(.5,Math.PI).toArray()];
}
export function animateSeaCucumberRevision(m,action,t){
 const r=rigs.get(m.root);if(!r)return false;
 // A selected tentacle visits the oral centre; the body and supporting feet stay fixed.
 const sequence=r.frond?[0,5,2,7,4,9,1,6,3,8]:Array.from({length:20},(_,i)=>(i*9)%20),cycle=r.frond?2.5:1.8,total=sequence.length*cycle,local=((t%total)+total)%total,which=sequence[Math.floor(local/cycle)],phase=(local%cycle)/cycle;
 for(const q of r.tentacles){let f=0;if(action==='tentacles'&&q.index===which)f=Math.pow(Math.sin(phase*Math.PI),2);const target=r.oralBase.clone().addScaledVector(r.oralAxis,r.frond?.045:.025),tip=q.tip.clone().lerp(target,f),mid=q.mid.clone().lerp(q.anchor.clone().lerp(target,.55).addScaledVector(r.oralAxis,r.frond?.16:.025),f);setTube(q.stem,[q.anchor,mid,tip],q.radius);q.head.position.copy(tip);q.head.quaternion.copy(q.neutralQuaternion);if(f>0){const bend=new T.Quaternion().setFromAxisAngle(V(0,0,1),-f*(r.frond?1.25:.7));q.head.quaternion.multiply(bend);q.head.scale.setScalar(1-f*(r.frond?.43:.23));}else q.head.scale.setScalar(1);}
 m.root.updateMatrixWorld(true);return true;
}
