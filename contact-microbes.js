import * as T from 'three';
import {skinMicroNormal} from './skin-microtexture.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),TAU=2*Math.PI;
export const contactMicrobes=new Set(['myxococcus-xanthus','sulfolobus-acidocaldarius']);
// Numerical external-surface studies. Display colors and relief are not
// natural pigments, electron micrographs or molecular-resolution structures.
export function buildContactMicrobe(s){
 const root=new T.Group(),sulfo=s.id==='sulfolobus-acidocaldarius',material=new T.MeshStandardMaterial({color:sulfo?'#a7aea4':'#b0ab8f',roughness:.65,normalMap:skinMicroNormal(sulfo?203:117),normalScale:new T.Vector2(.10,.10)}),filamentMat=new T.MeshStandardMaterial({color:'#afb5a0',roughness:.74}),geometry=sulfo?new T.SphereGeometry(1,80,56):new T.CapsuleGeometry(.16,2.55,20,64).rotateZ(Math.PI/2);
 if(sulfo){const p=geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.085*Math.sin(x*5.0+z*2.0)*Math.sin(y*4.5)+.035*Math.cos(z*5.5);p.setXYZ(i,x*r*.71,y*r*.62,z*r*.66);}geometry.computeVertexNormals();}
 geometry.computeBoundingBox();const body=new T.Mesh(geometry,material),cy=.13-geometry.boundingBox.min.y;body.position.y=cy;body.castShadow=body.receiveShadow=true;root.add(body);
 const parts={body,legs:[],wings:[],leaves:[],tails:[],tentacles:[],buds:[],growth:[]},pili=[];
 for(let i=0;i<(sulfo?6:5);i++){const angle=sulfo?i*TAU/6:(i-2)*.20,attach=sulfo?V(.59*Math.cos(angle),cy-.30,.55*Math.sin(angle)):V(1.36,cy-.055,(i-2)*.018),tip=sulfo?V(1.12*Math.cos(angle),.136,1.06*Math.sin(angle)):V(1.73+.05*Math.cos(i),.14,(i-2)*.15);
  const path=new T.LineCurve3(attach,tip),g=new T.TubeGeometry(path,12,.0045,6,false),o=new T.Mesh(g,filamentMat);o.castShadow=true;root.add(o);pili.push({mesh:o,attach,tip,angle,neutral:g.attributes.position.array.slice()});
 }
 if(sulfo){const g=new T.Group();g.position.set(.69,cy+.08,0);root.add(g);const points=[];for(let i=0;i<90;i++){const u=i/89;points.push(V(u*1.78,Math.sin(u*TAU*4)*.07*(1-Math.exp(-u*12)),Math.cos(u*TAU*4)*.07*(1-Math.exp(-u*12))));}g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),100,.0065,7,false),filamentMat));parts.tails.push(g);}
 const m={root,parts,id:s.id,kind:'cell',variant:s.visual.variant,reference:true,features:[V(),V(),V()],contactRig:{body,pili,sulfo,cy,neutral:new Map(),anchor:null}};
 root.traverse(o=>m.contactRig.neutral.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()}));root.userData.reconstruction={version:'0.5.2',author:'PhenoVoxel Archive contributors',license:'MIT',reference:s.photograph?.source,geometry:sulfo?'Authored lobed coccus, distinct adhesion pili and archaellum':'Authored slender vegetative rod with illustrative polar pili; colony photograph is a different biological scale',animationValidated:false};animateContactMicrobe(m,'observe',0);return m;
}
function posePilus(p,tip){
 p.currentTip=tip.clone();
 const a=p.attach,d=tip.clone().sub(a),length=d.length(),dir=d.normalize(),up=Math.abs(dir.y)>.95?V(1,0,0):V(0,1,0),n=V().crossVectors(dir,up).normalize(),b=V().crossVectors(dir,n).normalize(),position=p.mesh.geometry.attributes.position;
 for(let ring=0;ring<=12;ring++)for(let j=0;j<=6;j++){const theta=j/6*TAU,at=a.clone().addScaledVector(dir,length*ring/12).addScaledVector(n,.0045*Math.cos(theta)).addScaledVector(b,.0045*Math.sin(theta));position.setXYZ(ring*7+j,...at.toArray());}
 position.needsUpdate=true;p.mesh.geometry.computeVertexNormals();p.mesh.geometry.computeBoundingSphere();
}
export function animateContactMicrobe(m,action,t){
 const r=m.contactRig;for(const[o,b]of r.neutral){o.position.copy(b.position);o.quaternion.copy(b.quaternion);o.scale.copy(b.scale);}r.anchor=null;
 if(r.sulfo&&action==='swim'){m.root.position.y=.45;partsRotate();}
 else if(action==='glide'){
  if(r.sulfo){const u=(t%8)/4,east=u<1,phase=u%1,step=T.MathUtils.smoothstep(phase,.24,.65);m.root.position.x=east?-.15+.30*step:.15-.30*step;const active=r.pili[east?0:3],anchor=active.tip.clone();r.anchor=anchor;for(const p of r.pili)posePilus(p,p===active?anchor.clone().sub(m.root.position):p.tip.clone());}
  else m.root.position.x=.43*Math.sin(t*.30);
 }
 for(const p of r.pili){if(!(r.sulfo&&action==='glide')){p.currentTip=p.tip.clone();p.mesh.geometry.attributes.position.array.set(p.neutral);p.mesh.geometry.attributes.position.needsUpdate=true;p.mesh.geometry.computeVertexNormals();p.mesh.geometry.computeBoundingSphere();}}
 m.root.updateMatrixWorld(true);m.features[0].copy(m.root.localToWorld(r.sulfo?V(.72,r.cy+.08,0):V(-.9,r.cy,.16)));m.features[1].copy(m.root.localToWorld(r.pili[0].attach.clone().lerp(r.pili[0].currentTip,.65)));m.features[2].copy(m.root.localToWorld(V(.05,r.cy+(r.sulfo?.61:.16),0)));
 function partsRotate(){m.parts.tails[0].rotation.x=t*7;}
}
