import * as T from 'three';
const hash=(x,y=0)=>{const n=Math.sin(x*127.1+y*311.7+8.13)*43758.5453;return n-Math.floor(n);};
const V=(...a)=>new T.Vector3(...a),TAU=2*Math.PI,sm=(t,a,b)=>T.MathUtils.smoothstep(t,a,b);
export const DURATION=20;
// Qualitative external feeding sequence. No venom, enzymes or digestion.
export function buildPhysaliaStudy(model){
 model.root.userData.hideStudioGround=true;
 const source=model.root.getObjectByName('unequal-coiled-capture-tentacles');if(!source)throw Error('Physalia source tentacles missing');
 const parent=source.parent,root=new T.Group();root.name='External prey handling; no physiological solver';parent.add(root);
 const clone=new T.Mesh(source.geometry.clone(),source.material);clone.name='Retained tentacles with one articulated capture strand';root.add(clone);const base=source.geometry.attributes.position.array.slice();
 // Selected fourth sweep: two caps plus 49 eight-vertex rings. Other strands stay exact.
 const firstCount=394,startIndex=3*394,centers=Array.from({length:49},(_,i)=>{const q=V();for(let j=0;j<8;j++)q.add(V(...base.slice((startIndex+1+i*8+j)*3,(startIndex+2+i*8+j)*3)));return q.multiplyScalar(1/8);});
 const contactIndex=37,contactBase=centers[contactIndex].clone(),anchor=centers[0].clone();
 const fish=new T.Group();fish.name='Illustrative small fish prey; no species identification';root.add(fish);const radii=V(.16,.045,.038);
 const skin=new T.MeshStandardMaterial({color:0x9caaa7,roughness:.43,metalness:0});const body=new T.Mesh(new T.SphereGeometry(1,40,24),skin);body.scale.copy(radii);fish.add(body);
 const eyeMat=new T.MeshStandardMaterial({color:0x151e20,roughness:.27});for(const side of [-1,1]){const eye=new T.Mesh(new T.SphereGeometry(.008,12,8),eyeMat);eye.position.set(.115,.012,side*.027);fish.add(eye);}
 const finMat=new T.MeshStandardMaterial({color:0x647f80,roughness:.7,side:T.DoubleSide});const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute([-.14,0,0,-.23,.055,0,-.21,0,.008,-.14,0,0,-.21,0,.008,-.23,-.055,0],3));fg.computeVertexNormals();const fin=new T.Mesh(fg,finMat);fish.add(fin);
 const tissue=new T.MeshStandardMaterial({color:0x71829c,roughness:.51,side:T.DoubleSide}),lipMat=new T.MeshStandardMaterial({color:0xd5d1c3,roughness:.57,side:T.DoubleSide});
 const oral=[];for(let k=0;k<5;k++){
  const theta=.70+k*.42,phi=.8;const local=V(radii.x*Math.cos(theta),radii.y*Math.sin(theta)*Math.cos(phi),radii.z*Math.sin(theta)*Math.sin(phi));
  const normal=V(local.x/radii.x**2,local.y/radii.y**2,local.z/radii.z**2).normalize(),e1=V(1,0,0).cross(normal).normalize(),e2=normal.clone().cross(e1).normalize();
  const zi=Math.max(0,Math.min(25,Math.round((anchor.x+local.x+.46)/.032))),origin=V(-.46+.032*zi,-.20-.07*hash(zi,3),-.10+.20*hash(zi,2)),neutral=origin.clone().add(V(.012,-.11,.018));
  const N=32,A=40,p=new Float32Array((N+1)*(A+1)*3),ix=[];for(let i=0;i<N;i++)for(let j=0;j<A;j++){const a=i*(A+1)+j;ix.push(a,a+A+1,a+1,a+1,a+A+1,a+A+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setIndex(ix);const mesh=new T.Mesh(g,tissue);mesh.name='Selected feeding gastrozooid '+(k+1)+'; open oral rim';root.add(mesh);
  const rg=new T.BufferGeometry();rg.setAttribute('position',new T.BufferAttribute(new Float32Array(2*(A+1)*3),3));const ri=[];for(let j=0;j<A;j++){const a=j*2;ri.push(a,a+2,a+1,a+1,a+2,a+3);}rg.setIndex(ri);const rim=new T.Mesh(rg,lipMat);rim.name='Spreading mouth margin '+(k+1);root.add(rim);
  oral.push({local,normal,e1,e2,origin,neutral,N,A,mesh,rim});
 }
 let enabled=false;
 function projectFish(v){const q=V(v.x/radii.x,v.y/radii.y,v.z/radii.z).normalize();return q.multiply(radii);}
 function pose(input,active=true){const t=T.MathUtils.clamp(Number.isFinite(input)?input:0,0,DURATION);enabled=active;source.visible=!active;root.visible=active;if(!active)return{time:0,duration:DURATION,measured:false};
  const retrieval=sm(t,4,10),length=1-.78*retrieval,attached=t>=3,spread=sm(t,13,19),reach=sm(t,9,13);
  const cp=contactBase.clone();cp.y=anchor.y+(contactBase.y-anchor.y)*length;
  fish.position.copy(cp).add(V(attached?0:-.55*(1-sm(t,0,3)),0,-radii.z));
  // Hold prey at the strand contact point after contact; no teleport or disappearance.
  const pos=clone.geometry.attributes.position;for(let i=0;i<firstCount;i++){const idx=startIndex+i,q=V(...base.slice(idx*3,idx*3+3)),ring=i===0?0:i===firstCount-1?48:Math.floor((i-1)/8),c=centers[ring],offset=q.clone().sub(c).multiplyScalar(1+.35*retrieval);q.copy(c);q.y=anchor.y+(q.y-anchor.y)*length;q.add(offset);pos.setXYZ(idx,q.x,q.y,q.z);}pos.needsUpdate=true;clone.geometry.computeVertexNormals();clone.geometry.computeBoundingBox();clone.geometry.computeBoundingSphere();
  for(const o of oral){const center=fish.position.clone().add(o.local),mouth=o.neutral.clone().lerp(center,reach),radius=.012+.025*spread;
   const ring=a=>{const tangent=o.e1.clone().multiplyScalar(Math.cos(a)*radius).addScaledVector(o.e2,Math.sin(a)*radius);const free=mouth.clone().add(tangent);const onFish=projectFish(o.local.clone().add(tangent)).add(fish.position);return free.lerp(onFish,reach);};
   const p=o.mesh.geometry.attributes.position;for(let i=0;i<=o.N;i++){const u=i/o.N,c=o.origin.clone().lerp(mouth,u),neck=.013+.011*Math.sin(u*Math.PI),flare=sm(u,.65,1);for(let j=0;j<=o.A;j++){const a=j/o.A*TAU,q=c.clone().addScaledVector(o.e1,neck*Math.cos(a)).addScaledVector(o.e2,neck*Math.sin(a));q.lerp(ring(a),flare);p.setXYZ(i*(o.A+1)+j,q.x,q.y,q.z);}}
   p.needsUpdate=true;o.mesh.geometry.computeVertexNormals();o.mesh.geometry.computeBoundingSphere();
   const rp=o.rim.geometry.attributes.position;for(let j=0;j<=o.A;j++){const a=j/o.A*TAU,q=ring(a),n=o.normal.clone().multiplyScalar(.0015);for(let side=0;side<2;side++){const qq=q.clone().addScaledVector(n,side?1:-1);rp.setXYZ(j*2+side,qq.x,qq.y,qq.z);}}rp.needsUpdate=true;o.rim.geometry.computeVertexNormals();o.rim.geometry.computeBoundingSphere();
  }
  root.updateMatrixWorld(true);return{time:t,duration:DURATION,measured:false,stage:t<3?'Approach — illustrative prey':t<4?'Tentacle contact — discharge not simulated':t<10?'Tentacle shortens and retrieves attached prey':t<13?'Separate feeding zooids approach prey':t<19?'Mouth margins spread over prey surface':'Study complete — digestion not simulated',attached,retrieval,spread};
 }
 pose(0,false);return{root,source,clone,fish,body,oral,base,centers,firstCount,startIndex,contactIndex,contactBase,anchor,pose,get active(){return enabled;}};
}

