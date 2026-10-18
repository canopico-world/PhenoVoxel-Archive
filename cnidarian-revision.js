import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Qualitative, species-specific surfaces. Dimensions, tissue optics and playback
// are authored choices; these are not physiological or hydrodynamic solvers.
export const revisedCnidarians=Object.freeze(['acropora-cervicornis','porites-porites','gorgonia-ventalina','metridium-senile','actinia-equina','hydra-vulgaris']);
const rigs=new WeakMap(),TAU=Math.PI*2,UP=new T.Vector3(0,1,0),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export const cnidarianRig=root=>rigs.get(root);
const rnd=i=>{const n=Math.sin(i*127.1+91.3)*43758.5453;return n-Math.floor(n);};
function noise(x,y,z){
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),f=t=>t*t*(3-2*t),u=f(x-ix),v=f(y-iy),w=f(z-iz),h=(a,b,c)=>rnd(a*157+b*313+c*571+641),l=T.MathUtils.lerp;
 return l(l(l(h(ix,iy,iz),h(ix+1,iy,iz),u),l(h(ix,iy+1,iz),h(ix+1,iy+1,iz),u),v),l(l(h(ix,iy,iz+1),h(ix+1,iy,iz+1),u),l(h(ix,iy+1,iz+1),h(ix+1,iy+1,iz+1),u),v),w)*2-1;
}
function pigment(mesh,dark,light,amount=.8){const p=mesh.geometry.attributes.position,a=new T.Color(dark),b=new T.Color(light),c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=.65*noise(x*9,y*9,z*9)+.35*noise(x*41,y*41,z*41),q=a.clone().lerp(b,T.MathUtils.clamp(.5+amount*n,0,1));c.push(q.r,q.g,q.b);}mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));mesh.material=mesh.material.clone();mesh.material.color.set('white');mesh.material.vertexColors=true;}
function taperedCurve(points,radius,segments=18,sides=6){
 const path=new T.CatmullRomCurve3(points.map(p=>Array.isArray(p)?V(...p):p)),frames=path.computeFrenetFrames(segments,false),positions=[],uv=[],ix=[];
 for(let i=0;i<=segments;i++){const u=i/segments,p=path.getPointAt(u),r=radius*Math.pow(Math.max(.001,1-u),.65);for(let j=0;j<=sides;j++){const a=j/sides*TAU,q=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);positions.push(...q);uv.push(u,j/sides);}}
 for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;ix.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
function rodGeometry(a,b,r,sides=6){const d=b.clone().sub(a),g=new T.CylinderGeometry(r*.85,r,d.length(),sides);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(UP,d.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5));return g;}
function polypGeometry(octo=false){
 const geos=[];for(let i=0;i<(octo?8:12);i++){const a=i*TAU/(octo?8:12),dir=V(Math.cos(a),0,Math.sin(a)),points=[dir.clone().multiplyScalar(.15),dir.clone().multiplyScalar(.45).add(V(0,.42,0)),dir.clone().multiplyScalar(.75).add(V(0,.65,0)),dir.clone().multiplyScalar(.95).add(V(0,.70,0))];geos.push(taperedCurve(points,.033,10,5));
  if(octo)for(let j=1;j<=4;j++)for(const sign of [-1,1]){const u=j/5,p=dir.clone().multiplyScalar(.15+.75*u).add(V(0,.72*u,0)),side=V(-Math.sin(a),0,Math.cos(a)).multiplyScalar(sign*.14*(1-.35*u)),end=p.clone().add(side).add(V(0,.08,0));geos.push(rodGeometry(p,end,.018,4));}
 }
 const g=mergeGeometries(geos);geos.forEach(g=>g.dispose());return g;
}
function cupsGeometry(){
 const geos=[new T.CylinderGeometry(1,.78,.8,10,1,true),new T.CylinderGeometry(.62,.48,.72,10,1,true)];const ring=new T.RingGeometry(.62,1,10);ring.rotateX(-Math.PI/2);ring.translate(0,.4,0);geos.push(ring);
 const g=mergeGeometries(geos);geos.forEach(g=>g.dispose());return g;
}
function instances(k,geometry,count,color,extra={}){const m=new T.InstancedMesh(geometry,k.mat(color,extra),count);m.castShadow=true;m.receiveShadow=true;k.root.add(m);return m;}
function writeInstances(mesh,entries,extension=1){const o=new T.Object3D();for(let i=0;i<entries.length;i++){const e=entries[i];o.position.copy(e.p);o.quaternion.setFromUnitVectors(UP,e.n);o.scale.set(e.r,e.r*extension,e.r);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);if(e.color)mesh.setColorAt(i,new T.Color(e.color));}mesh.instanceMatrix.needsUpdate=true;}

// Smooth union of tapered capsules, meshed as one closed surface. This avoids
// disconnected, uncapped branch pipes. It is an original numeric illustration.
function coralSurface(k,segments,step,smoothing){
 const data=segments.map(s=>{const a=V(...s.a),b=V(...s.b),d=b.clone().sub(a);return {...s,a,b,d,dd:d.lengthSq()};});
 function field(x,y,z){let f=1e4;for(const s of data){const px=x-s.a.x,py=y-s.a.y,pz=z-s.a.z,t=T.MathUtils.clamp((px*s.d.x+py*s.d.y+pz*s.d.z)/s.dd,0,1),r=T.MathUtils.lerp(s.r,s.tip??s.r,t),d=Math.hypot(px-s.d.x*t,py-s.d.y*t,pz-s.d.z*t)-r;if(f===1e4){f=d;continue;}const h=Math.max(smoothing-Math.abs(f-d),0)/smoothing;f=Math.min(f,d)-h*h*smoothing*.25;}return Math.max(f,-.01-y);}
 const bounds=new T.Box3();for(const s of data){bounds.expandByPoint(s.a.clone().addScalar(-s.r-.06));bounds.expandByPoint(s.a.clone().addScalar(s.r+.06));bounds.expandByPoint(s.b.clone().addScalar(-s.r-.06));bounds.expandByPoint(s.b.clone().addScalar(s.r+.06));}
 const size=bounds.getSize(V()),nx=Math.ceil(size.x/step),ny=Math.ceil(size.y/step),nz=Math.ceil(size.z/step),index=(i,j,l)=>(j*(nx+1)+i)*(nz+1)+l,values=new Float32Array((nx+1)*(ny+1)*(nz+1));
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)for(let l=0;l<=nz;l++)values[index(i,j,l)]=field(bounds.min.x+i*step,bounds.min.y+j*step,bounds.min.z+l*step);
 const positions=[],corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 const triangle=(a,b,c)=>{const mid=a.clone().add(b).add(c).multiplyScalar(1/3),e=.001,n=V(field(mid.x+e,mid.y,mid.z)-field(mid.x-e,mid.y,mid.z),field(mid.x,mid.y+e,mid.z)-field(mid.x,mid.y-e,mid.z),field(mid.x,mid.y,mid.z+e)-field(mid.x,mid.y,mid.z-e));if(b.clone().sub(a).cross(c.clone().sub(a)).dot(n)<0)[b,c]=[c,b];positions.push(...a,...b,...c);};
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)for(let l=0;l<nz;l++){
  const ds=corners.map(([a,b,c])=>values[index(i+a,j+b,l+c)]);if(ds.every(d=>d>=0)||ds.every(d=>d<0))continue;
  const ps=corners.map(([a,b,c])=>V(bounds.min.x+(i+a)*step,bounds.min.y+(j+b)*step,bounds.min.z+(l+c)*step)),cross=(a,b)=>ps[a].clone().lerp(ps[b],ds[a]/(ds[a]-ds[b]));
  for(const tet of tets){const inside=tet.filter(i=>ds[i]<0),outside=tet.filter(i=>ds[i]>=0);if(!inside.length||!outside.length)continue;if(inside.length===1||outside.length===1){const a=(inside.length===1?inside:outside)[0],other=inside.length===1?outside:inside;triangle(...other.map(b=>cross(a,b)));}else{const [a,b]=inside,[c,d]=outside,p=cross(a,c),q=cross(a,d),r=cross(b,c),s=cross(b,d);triangle(p,r,q);triangle(q,r,s);}}
 }
 const raw=new T.BufferGeometry();raw.setAttribute('position',new T.Float32BufferAttribute(positions,3));const g=mergeVertices(raw,1e-5);raw.dispose();const original=g.index.array,clean=[];for(let i=0;i<original.length;i+=3){const a=original[i],b=original[i+1],c=original[i+2];if(a!==b&&a!==c&&b!==c)clean.push(a,b,c);}g.setIndex(clean);g.computeVertexNormals();const mesh=k.mesh(g,'#b19c7b',k.root,{roughness:.88});
 return {mesh,field,data};
}
function branchingCoral(k,rig,staghorn){
 const segments=[],add=(a,b,r,tip=r,terminal=false)=>segments.push({a,b,r,tip,terminal});
 if(staghorn){
  add([0,.07,0],[.02,.62,.01],.13,.095);
  for(let i=0;i<7;i++){const a=i*2.39996,r=.30+.18*rnd(i+51),start=[.01,.30+(i%3)*.10,0],mid=[Math.cos(a)*r,1.05+.3*rnd(i+5),Math.sin(a)*r],end=[mid[0]*1.55,1.70+.38*rnd(i+19),mid[2]*1.50];add(start,mid,.080,.063);add(mid,end,.063,.038,true);
   if(i%2===0){const b=a+.66,q=[mid[0]+Math.cos(b)*.43,mid[1]+.57,mid[2]+Math.sin(b)*.43];add(mid,q,.049,.030,true);}
  }
 }else{
  add([-.15,.08,0],[.18,.17,.03],.29,.27);
  for(let i=0;i<7;i++){const a=i*2.39996,r=.27+.14*rnd(i+72),start=[Math.cos(a)*r*.5,.18,Math.sin(a)*r*.5],mid=[Math.cos(a)*r,.48+(.14*rnd(i+66)),Math.sin(a)*r],end=[mid[0]*(1+.25*rnd(i)),.88+.40*rnd(i+18),mid[2]*1.12];add(start,mid,.19,.17);add(mid,end,.17,.18+.025*rnd(i+8),true);}
 }
 const skin=coralSurface(k,segments,staghorn?.032:.027,staghorn?.045:.07);rig.body=skin.mesh;rig.body.name=staghorn?'Continuous Acropora arborescent surface':'Continuous Porites fused blunt lobes';pigment(rig.body,staghorn?'#8d7655':'#827b65',staghorn?'#c9b894':'#b9b3a0',.65);
 const entries=[],tips=[];
 for(const [i,s]of skin.data.entries()){
  const tangent=s.d.clone().normalize(),side=V(0,1,0).cross(tangent).normalize();if(side.lengthSq()<.1)side.set(1,0,0);const other=tangent.clone().cross(side);
  const count=Math.ceil(Math.sqrt(s.dd)*(staghorn?58:92));
  for(let j=0;j<count;j++){const t=(j+.3)/count,a=j*2.39996+i*1.7,n=side.clone().multiplyScalar(Math.cos(a)).addScaledVector(other,Math.sin(a)),r=T.MathUtils.lerp(s.r,s.tip,t),p=s.a.clone().lerp(s.b,t).addScaledVector(n,r);
   for(let q=0;q<5;q++)p.addScaledVector(n,-skin.field(p.x,p.y,p.z));
   if(p.distanceTo(s.a.clone().lerp(s.b,t))>r*1.65)continue;
   if(p.y<.15)continue; // Keep the authored basal attachment region free of protruding polyps.
   entries.push({p,n:staghorn?n.clone().addScaledVector(tangent,.48).normalize():n,r:staghorn?.012:.014,color:staghorn?'#c0ac89':'#a8a08a'});
  }
  if(s.terminal){const n=tangent,p=s.b.clone().addScaledVector(n,s.tip*.88);tips.push({p,n,r:staghorn?.025:.013,color:staghorn?'#e0d5bd':'#aaa28d'});}
 }
 const cups=instances(k,cupsGeometry(),entries.length+(staghorn?tips.length:0),staghorn?'#c0ac89':'#a8a08a',{side:T.DoubleSide,roughness:.90});writeInstances(cups,staghorn?[...entries,...tips]:entries);rig.cups=cups;
 const polypEntries=entries.filter((e,i)=>i%2===0).map((e,i)=>({...e,p:e.p.clone().addScaledVector(e.n,e.r*.4),r:staghorn?.025:.034,phase:rnd(i+18)*TAU}));
 const polyps=instances(k,polypGeometry(),polypEntries.length,staghorn?'#d1c4a6':'#c1b99e',{roughness:.70});writeInstances(polyps,polypEntries,.65);rig.polypMeshes.push({mesh:polyps,entries:polypEntries});rig.rigid=rig.body.geometry.attributes.position.array.slice();rig.tips=tips;
 return [segments[1].b,tips[0].p.toArray(),entries[Math.floor(entries.length*.4)].p.toArray()];
}
function seaFan(k,rig){
 const geos=[],nodes=[],byRow=[],levels=42,spacing=.060;
 for(let row=0;row<levels;row++){const u=(row+1)/(levels+1),y=.30+u*2.10,width=1.08*Math.pow(Math.sin(u*Math.PI),.62)*(.92+.08*Math.sin(u*11)),line=[];
  for(let col=-Math.floor(width/spacing);col<=Math.floor(width/spacing);col++){const x=col*spacing+(row%2)*spacing*.5+(rnd(row*199+col+92)-.5)*.025;if(Math.abs(x)>width)continue;const p=V(x,y+(rnd(row*173+col+440)-.5)*.032,.025*Math.sin(x*4+y*3));line.push(p);nodes.push(p);}
  byRow.push(line);
 }
 for(let row=0;row<byRow.length;row++)for(const [i,p]of byRow[row].entries()){
  const above=byRow[row+1]||[];const near=[...above].sort((a,b)=>a.distanceToSquared(p)-b.distanceToSquared(p)).slice(0,row%3===0?1:2);
  for(const q of near)if(q.distanceTo(p)<.14)geos.push(rodGeometry(p,q,.0045+(.001*rnd(i+row*23)),5));
  if(i&&rnd(i+row*41)>.40&&p.distanceTo(byRow[row][i-1])<.10)geos.push(rodGeometry(byRow[row][i-1],p,.0045,5));
 }
 for(let i=-3;i<=3;i++){const x=i*.23,curve=new T.CatmullRomCurve3([V(0,.07,0),V(x*.12,.46,0),V(x*.65,1.12,0),V(x,1.90-Math.abs(x)*.35,.02)]);geos.push(new T.TubeGeometry(curve,32,.010+(.012*(1-Math.abs(i)/4)),7));}
 for(const p of byRow[0])geos.push(rodGeometry(V(0,.07,0),p,.012,7));
 const merged=mergeGeometries(geos);geos.forEach(g=>g.dispose());rig.body=k.mesh(merged,'#80677c',k.root,{roughness:.84});rig.body.name='Gorgonia irregular connected reticulate fan';pigment(rig.body,'#584553','#a68c91',.65);k.ell([0,.06,0],[.13,.055,.10],'#786271');
 const entries=nodes.filter((p,i)=>i%3===0).map((p,i)=>({p:p.clone(),n:V(0,0,i%2?1:-1),r:.024,phase:rnd(i+19)*TAU})),polyps=instances(k,polypGeometry(true),entries.length,'#c8baad',{roughness:.72});writeInstances(polyps,entries,.65);rig.polypMeshes.push({mesh:polyps,entries});rig.rigid=rig.body.geometry.attributes.position.array.slice();
 return [[.45,1.4,0],[-.4,1.1,0],[.45,1.7,.02]];
}
function appendage(k,rig,parent,anchor,length,radius,angle,index,color,kind){
 const reach=kind==='hydra'?.88:kind==='plumose'?.52:1.08,bead=kind==='beadlet',curve=[[0,0,0],[Math.cos(angle)*length*reach*.30,length*(bead?.30:.45),Math.sin(angle)*length*reach*.30],[Math.cos(angle+.09)*length*reach*.74,length*(bead?.55:.76),Math.sin(angle+.09)*length*reach*.74],[Math.cos(angle+.15)*length*reach,length*(bead?.30+.28*rnd(index+41):.67+.16*rnd(index+41)),Math.sin(angle+.15)*length*reach]],g=k.group(anchor,parent),mesh=k.mesh(taperedCurve(curve,radius,kind==='hydra'?34:20,6),color,g,{roughness:kind==='beadlet'?.47:.65,transparent:kind==='hydra',opacity:kind==='hydra'?.80:1});
 rig.tentacles.push({mesh,base:mesh.geometry.attributes.position.array.slice(),phase:index*.71,angle,length,kind,group:g});return g;
}
function mergeTentacles(k,rig,color){
 const geos=[],sections=[];let start=0;
 for(const r of rig.tentacles){const g=r.mesh.geometry.clone();g.translate(...r.group.position);geos.push(g);sections.push({start,count:g.attributes.position.count,anchor:r.group.position.clone(),phase:r.phase,angle:r.angle,length:r.length});start+=g.attributes.position.count;r.group.removeFromParent();r.mesh.geometry.dispose();}
 const geometry=mergeGeometries(geos);geos.forEach(g=>g.dispose());rig.tentacleMesh=k.mesh(geometry,color,k.root,{roughness:rig.id==='actinia-equina'?.47:.65});rig.tentacleBase=geometry.attributes.position.array.slice();rig.tentacleSections=sections;rig.tentacleCount=rig.tentacles.length;rig.tentacles=[];
}
function anemone(k,rig,plumose){
 const h=plumose?1.45:.43,r=plumose?.23:.43,color=plumose?'#d4cfc0':'#a73535';
 const base=k.surface((u,w)=>{const a=w*TAU,R=(plumose?.34:.53)*(1+.045*Math.sin(a*5));return [Math.cos(a)*R*u,.035+.065*Math.sqrt(Math.max(0,1-u*u)),Math.sin(a)*R*u];},18,96,color,k.root,{roughness:plumose?.67:.47});rig.base=base;
 const column=k.surface((u,w)=>{const a=w*TAU,width=r*(plumose?1+.36*Math.exp(-u*9)+.18*Math.exp(-(1-u)*16):1+.13*Math.exp(-u*6)-.10*Math.sin(u*Math.PI)),fold=.002*Math.sin(a*43+u*7);return [Math.cos(a)*(width+fold),.05+u*h,Math.sin(a)*(width+fold)];},60,96,color,k.root,{roughness:plumose?.67:.47});pigment(column,plumose?'#b8b5a5':'#942d30',plumose?'#e4decb':'#b73d3a',.20);
 const discR=plumose?.54:.46,disc=k.surface((u,w)=>{const a=w*TAU,R=discR*(plumose?1+.14*Math.sin(7*a)+.055*Math.sin(11*a):1),rr=u*R,y=.05+h+(plumose?.065*Math.sin(7*a)*u*u:.016*Math.sin(u*Math.PI));return [Math.cos(a)*rr,y,Math.sin(a)*rr];},28,144,color,k.root,{roughness:plumose?.66:.45});pigment(disc,plumose?'#bfbcae':'#9f3131',plumose?'#ded8c7':'#b33b38',.13);rig.body=column;
 k.ell([0,h+.066,0],[discR*.13,.018,discR*.033],plumose?'#8d887d':'#692d2c');
 if(plumose){
  k.tube(Array.from({length:121},(_,i)=>{const a=i/120*TAU;return[Math.cos(a)*r*1.17,h-.015,Math.sin(a)*r*1.17];}),.012,'#c6c2b3',k.root,120);
  for(let i=0;i<780;i++){const a=i*2.39996,rr=discR*Math.sqrt(.12+.83*rnd(i+115))*(1+.14*Math.sin(7*a)+.055*Math.sin(11*a)),height=.05+h+.065*Math.sin(7*a)*(rr/discR)**2;appendage(k,rig,k.root,[Math.cos(a)*rr,height,Math.sin(a)*rr],.29+.22*rnd(i+67),.0055+.0022*rnd(i),a,i,'#d7d3c5','plumose');}
 }else{
  const counts=[6,6,12,24,48,96];let index=0;
  for(let row=0;row<6;row++)for(let j=0;j<counts[row];j++){const a=j/counts[row]*TAU+row*.16+(rnd(index+80)-.5)*.045,rr=.11+row*.067;appendage(k,rig,k.root,[Math.cos(a)*rr,h+.05,Math.sin(a)*rr],(.58-row*.035)*(.88+.20*rnd(index+1)),.028+.007*rnd(index+17),a,index++, '#b94444','beadlet');}
  for(let i=0;i<24;i++){const a=i*TAU/24;k.ell([Math.cos(a)*r*1.015,h+.025,Math.sin(a)*r*1.015],[.018,.014,.018],'#507a94');}
 }
 mergeTentacles(k,rig,plumose?'#d7d3c5':'#b94444');
 return plumose?[[.17,.08,0],[.22,.7,0],[.3,1.7,0]]:[[.38,.25,0],[.35,.8,0],[.42,.455,0]];
}
function hydra(k,rig){
 const h=1.35;rig.height=h;rig.base=k.ell([0,.025,0],[.12,.025,.105],'#a9ac8f');rig.base.name='Retained basal attachment disc';
 const body=k.surface((u,w)=>{const a=w*TAU,r=.10*(.64+.36*Math.sin(Math.PI*u))*(1+.035*Math.sin(a*8+u*7));return [Math.cos(a)*r+.025*Math.sin(u*Math.PI),.045+u*h,Math.sin(a)*r];},70,44,'#b9bda0',k.root,{transparent:true,opacity:.79,roughness:.52});pigment(body,'#919c7b','#d1d4b5',.28);rig.body=body;rig.bodyBase=body.geometry.attributes.position.array.slice();
 const head=k.group([0,.045+h,0]);rig.head=head;
 const hyp=k.surface((u,w)=>{const a=w*TAU,r=.072*Math.pow(1-u,.75)+.009;return[Math.cos(a)*r,.13*u,Math.sin(a)*r];},22,40,'#b5b99c',head,{transparent:true,opacity:.85,roughness:.55});rig.hypostome=hyp;k.ell([0,.132,0],[.017,.004,.009],'#6b7660',head);
 for(let i=0;i<7;i++){const a=i*TAU/7+.12;appendage(k,rig,head,[Math.cos(a)*.080,.018,Math.sin(a)*.080],.90+.35*rnd(i+22),.013,a,i,'#c0c5a7','hydra');}
 return [[.07,.04,0],[.1,.7,0],[.15,1.42,0]];
}
export function cnidarianRevision(s,k){
 if(!revisedCnidarians.includes(s.id))return null;const rig={id:s.id,polypMeshes:[],tentacles:[]};rigs.set(k.root,rig);k.root.userData.preciseGround=true;k.root.userData.anatomyRevision={version:'0.6.6',scope:'Species-specific original reference surfaces and attached partial appendage studies; no measured anatomy, diagnostic identification, physiology or validated kinematics.'};
 if(s.id==='acropora-cervicornis'||s.id==='porites-porites')return branchingCoral(k,rig,s.id==='acropora-cervicornis');
 if(s.id==='gorgonia-ventalina')return seaFan(k,rig);
 if(s.id==='metridium-senile'||s.id==='actinia-equina')return anemone(k,rig,s.id==='metridium-senile');
 return hydra(k,rig);
}
export function animateCnidarianRevision(model,action,t){
 const rig=rigs.get(model.root);if(!rig)return false;const active=action!=='observe'&&action!=='rest';
 for(const p of rig.polypMeshes){const o=new T.Object3D();for(let i=0;i<p.entries.length;i++){const e=p.entries[i],extend=active&&action==='polyps'?.45+.55*(.5-.5*Math.cos(t*1.1+e.phase)):.65;o.position.copy(e.p);o.quaternion.setFromUnitVectors(UP,e.n);o.scale.set(e.r,e.r*extend,e.r);o.updateMatrix();p.mesh.setMatrixAt(i,o.matrix);}p.mesh.instanceMatrix.needsUpdate=true;}
 const hydra=rig.id==='hydra-vulgaris',q=hydra&&active&&action==='contract'?.5-.5*Math.cos(Math.min(t,3)/3*Math.PI):0,ratio=1-.48*q;
 if(hydra){const a=rig.body.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=rig.bodyBase[i*3],y=rig.bodyBase[i*3+1],z=rig.bodyBase[i*3+2],u=(y-.045)/rig.height,wide=1+(1/Math.sqrt(ratio)-1)*Math.sin(u*Math.PI);a.setXYZ(i,x*wide,.045+(y-.045)*ratio,z*wide);}a.needsUpdate=true;rig.body.geometry.computeVertexNormals();rig.head.position.y=.045+rig.height*ratio;}
 for(const r of rig.tentacles){const p=r.mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=r.base[i*3],y=r.base[i*3+1],z=r.base[i*3+2],u=Math.max(0,Math.min(1,y/r.length)),bend=active?(hydra?q*.17*Math.sin(u*Math.PI):.018*Math.sin(t*.9+r.phase+u*1.7)*u*u):0;if(hydra)p.setXYZ(i,x*(1-q*.32)+Math.cos(r.angle)*bend,y*(1-q*.27),z*(1-q*.32)+Math.sin(r.angle)*bend);else p.setXYZ(i,x+Math.cos(r.angle+1.2)*bend,y,z+Math.sin(r.angle+1.2)*bend);}p.needsUpdate=true;}
 if(rig.tentacleMesh){const p=rig.tentacleMesh.geometry.attributes.position,b=rig.tentacleBase;for(const r of rig.tentacleSections)for(let i=r.start;i<r.start+r.count;i++){const x=b[i*3],y=b[i*3+1],z=b[i*3+2],u=Math.floor((i-r.start)/7)/20,bend=active&&action==='tentacles'?.018*Math.sin(t*.9+r.phase+u*1.7)*u*u:0;p.setXYZ(i,x+Math.cos(r.angle+1.2)*bend,y,z+Math.sin(r.angle+1.2)*bend);}p.needsUpdate=true;}
 model.root.updateMatrixWorld(true);return true;
}
