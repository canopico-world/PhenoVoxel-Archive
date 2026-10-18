import * as T from 'three';

// Six species-specific qualitative studies, not measured scans or biomechanics.
// Evidence and limits are recorded per species in species.json and the review.
const rigs = new WeakMap(), UP = new T.Vector3(0, 1, 0), TAU = Math.PI * 2;
export const revisedEchinoderms = Object.freeze(['asterias-rubens', 'echinus-esculentus', 'dendraster-excentricus', 'holothuria-tubulosa', 'luidia-ciliaris', 'ophiothrix-fragilis']);
export const echinodermRig = root => rigs.get(root);
const v = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
const random = i => {const x=Math.sin(i*127.1+31.7)*43758.5453;return x-Math.floor(x);};
function field(x,y,z) {
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),smooth=t=>t*t*(3-2*t),a=smooth(x-ix),b=smooth(y-iy),c=smooth(z-iz),lerp=T.MathUtils.lerp;
  const h=(i,j,k)=>random(i*157+j*313+k*571+641);
  return lerp(lerp(lerp(h(ix,iy,iz),h(ix+1,iy,iz),a),lerp(h(ix,iy+1,iz),h(ix+1,iy+1,iz),a),b),lerp(lerp(h(ix,iy,iz+1),h(ix+1,iy,iz+1),a),lerp(h(ix,iy+1,iz+1),h(ix+1,iy+1,iz+1),a),b),c)*2-1;
}
const noise=(x,y,z)=>.56*field(x*8,y*8,z*8)+.28*field(x*23,y*23,z*23)+.16*field(x*67,y*67,z*67);

function mottled(mesh, dark, light, strength=1) {
  const p=mesh.geometry.attributes.position, a=new T.Color(dark), b=new T.Color(light), colors=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i), f=T.MathUtils.clamp(.5+noise(x,y,z)*strength,0,1), c=a.clone().lerp(b,f);
    colors.push(c.r,c.g,c.b);
  }
  mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  mesh.material=mesh.material.clone();mesh.material.color.set('#ffffff');mesh.material.vertexColors=true;
}
function grains(k, count, geometry, color, placements, roughness=.84) {
  const m=new T.InstancedMesh(geometry,k.mat(color,{roughness}),count), o=new T.Object3D();
  for(let i=0;i<count;i++){
    const {p,n,s,c}=placements(i);o.position.copy(p);o.quaternion.setFromUnitVectors(UP,n.normalize());o.scale.copy(s);o.updateMatrix();m.setMatrixAt(i,o.matrix);
    if(c)m.setColorAt(i,new T.Color(c));
  }
  m.castShadow=true;m.receiveShadow=true;k.root.add(m);return m;
}
function foot(k, rig, anchor, end, radius, disc=true, phase=0) {
  const stem=k.mesh(new T.CylinderGeometry(radius*.72,radius,1,6,6),'#a99780');
  const tip=k.ell(end.toArray(),disc?[radius*1.8,.004,radius*1.8]:[radius,.011,radius],'#c6b397');
  rig.feet.push({anchor,end,stem,tip,phase,radius,disc,base:stem.geometry.attributes.position.array.slice()});setFoot(rig.feet.at(-1),end);
}
function setFoot(f,end) {
  const d=end.clone().sub(f.anchor);f.stem.position.copy(f.anchor).add(end).multiplyScalar(.5);
  f.stem.scale.set(1,d.length(),1);f.stem.quaternion.setFromUnitVectors(UP,d.normalize());f.tip.position.copy(end);
  const p=f.stem.geometry.attributes.position;for(let i=0;i<p.count;i++){const u=f.base[i*3+1]+.5,bend=Math.sin(u*Math.PI);p.setX(i,f.base[i*3]+.009*bend*Math.sin(f.phase+u*1.7));p.setZ(i,f.base[i*3+2]+.004*bend*Math.cos(f.phase));}p.needsUpdate=true;
}
function star(k, rig, seven) {
  const count=seven?7:5, length=seven?1.58:1.43, radius=seven?.27:.37;
  const arms=Array.from({length:count},(_,i)=>({angle:i*TAU/count+.16,len:length*(.94+.08*random(i+3)),bend:(random(i+12)-.5)*.25}));
  const width=(x,L)=>seven?.108*(x/L<.82?1:Math.sqrt(Math.max(0,(1-x/L)/.18))):.21*Math.pow(Math.max(0,1-x/L),.72)+.012;
  const inside=(x,z)=>x*x+z*z<radius*radius||arms.some(a=>{
    const q=x*Math.cos(a.angle)+z*Math.sin(a.angle),h=-x*Math.sin(a.angle)+z*Math.cos(a.angle);
    return q>=0&&q<=a.len&&Math.abs(h-a.bend*Math.sin(q/a.len*Math.PI))<=width(q,a.len);
  });
  const boundary=a=>{let lo=0,hi=length*1.08;for(let i=0;i<19;i++){const r=(lo+hi)/2;if(inside(r*Math.cos(a),r*Math.sin(a)))lo=r;else hi=r;}return lo;};
  const body=k.surface((u,w)=>{
    const a=u*TAU,r=Math.sin(w*Math.PI),R=boundary(a),x=R*r*Math.cos(a),z=R*r*Math.sin(a),h=seven?.080:.140;
    return [x,.115+(w<.5?h:.050)*Math.cos(w*Math.PI),z];
  },420,48,seven?'#ad6039':'#b87843',k.root,{roughness:.87});
  body.name=seven?'Luidia seven narrow arms, continuous body':'Asterias five tapering arms, continuous body';
  mottled(body,seven?'#653d2b':'#795037',seven?'#ce8151':'#c79464',.7);
  const point=(arm,x,z,y=.20)=>v(x*Math.cos(arm.angle)-z*Math.sin(arm.angle),y,x*Math.sin(arm.angle)+z*Math.cos(arm.angle));
  grains(k,seven?2400:1900,new T.SphereGeometry(1,5,4),'#b98c61',i=>{
    const a=arms[i%count],q=.1+random(i+18)*(a.len-.13),z=(random(i+301)-.5)*width(q,a.len)*1.75+a.bend*Math.sin(q/a.len*Math.PI),r=Math.hypot(q,z)/boundary(Math.atan2(point(a,q,z).z,point(a,q,z).x)),h=.115+(seven?.080:.140)*Math.sqrt(Math.max(0,1-r*r));
    const size=.006+random(i+90)*.008;return {p:point(a,q,z,h),n:UP.clone(),s:v(size,.004+size*.3,size)};
  });
  for(const [i,a]of arms.entries()){
    if(seven){
      for(let j=0;j<45;j++)for(const sign of [-1,1]){
        const q=.30+j/45*(a.len-.34),w=width(q,a.len),z=sign*w+a.bend*Math.sin(q/a.len*Math.PI);
        const p=point(a,q,z,.125),end=point(a,q+.014,z+sign*(.035+random(j+i*53)*.018),.135);
        k.rod(p.toArray(),end.toArray(),.0055,'#d9c9a9');
      }
    }else{
      // Abaxial longitudinal spine cues; not a counted ossicle reconstruction.
      for(let row=-1;row<=1;row++)for(let j=0;j<23;j++){
        const q=.25+j/23*(a.len-.30),z=row*width(q,a.len)*.6+a.bend*Math.sin(q/a.len*Math.PI),h=.115+.14*Math.sqrt(Math.max(0,1-(q/a.len)**2));
        k.rod(point(a,q,z,h).toArray(),point(a,q,z,h+.015+random(j+row*30+i*80)*.017).toArray(),.007,'#d4bc93');
      }
    }
    for(let row=0;row<(seven?2:4);row++)for(let j=0;j<20;j++){
      const q=.30+j/20*(a.len-.40),z=(row-((seven?2:4)-1)/2)*.021+a.bend*Math.sin(q/a.len*Math.PI);
      const xy=point(a,q,z),r=Math.hypot(q,z)/boundary(Math.atan2(xy.z,xy.x)),lower=.115-.050*Math.sqrt(Math.max(0,1-r*r));
      foot(k,rig,point(a,q,z,lower),point(a,q+.012,z,.005),seven?.005:.006,!seven,i*.91+j*.43+row*.31);
    }
  }
  rig.armCount=count;rig.body=body;
  return [[.8,.23,0],[0,.25,0],seven?[.6,.15,.12]:[.6,.06,.03]];
}
function urchin(k,rig) {
  const cy=.73,rx=.77,ry=.69,rz=.77;
  const body=k.ell([0,cy,0],[rx,ry,rz],'#bb6570',k.root,{roughness:.86});body.name='Echinus globular test';mottled(body,'#914b59','#ce8588',.50);
  grains(k,2600,new T.ConeGeometry(1,1,6),'#cb8e8a',i=>{
    const y=1-2*(i+random(i+201))/2600,a=i*2.39996323+(random(i+84)-.5)*.18,h=Math.sqrt(1-y*y),d=v(h*Math.cos(a),y,h*Math.sin(a)),p=v(d.x*rx,cy+d.y*ry,d.z*rz),n=v(d.x/rx,d.y/ry,d.z/rz).normalize(),len=.075+random(i+81)*.095,r=.005+random(i+51)*.004;
    const safe=n.y<0?Math.min(len,Math.max(.012,(p.y-.018)/-n.y)):len;p.addScaledVector(n,safe*.5);
    return {p,n,s:v(r,safe,r),c:i%3===0?'#95729b':'#d7a0a0'};
  });
  // Lower ambulacral extensions: illustrative disc-foot placement, no hydraulic model.
  for(let a=0;a<5;a++)for(let row=0;row<2;row++)for(let j=0;j<6;j++){
    const angle=a*TAU/5+(row?1:-1)*.045,theta=2.35+j*.11,d=v(Math.sin(theta)*Math.cos(angle),Math.cos(theta),Math.sin(theta)*Math.sin(angle));
    const anchor=v(d.x*rx,cy+d.y*ry,d.z*rz),end=v(anchor.x*1.17,.005,anchor.z*1.17);
    foot(k,rig,anchor,end,.007,true,a*.67+j*.52+row*.3);
  }
  rig.body=body;return [[.4,1.40,0],[.4,.9,.5],[.6,.08,0]];
}
function dollar(k,rig) {
  const upper=(x,z)=>{const rr=Math.min(1,Math.sqrt(x*x/1.21+z*z));return .050+.13*Math.sqrt(Math.max(0,1-rr*rr))*(1-.18*x);};
  const body=k.surface((u,w)=>{const a=u*TAU,r=Math.sin(w*Math.PI),x=1.1*r*Math.cos(a),z=r*Math.sin(a);return [x,w<.5?upper(x,z):.05-.026*Math.cos((1-w)*Math.PI),z];},200,44,'#655a60',k.root,{roughness:.96});
  body.name='Dendraster flattened test with eccentric petaloids';mottled(body,'#423e44','#827374',.42);
  grains(k,10000,new T.ConeGeometry(1,1,4),'#6d6166',i=>{
    const a=random(i+489)*TAU,r=Math.sqrt(random(i+261)),x=1.1*r*Math.cos(a),z=r*Math.sin(a),len=.012+random(i+30)*.016;
    return {p:v(x,upper(x,z)+len*.42,z),n:v(x*.12,1,z*.12),s:v(.0018,len,.0018),c:i%4===0?'#8b787c':'#62545e'};
  },.98);
  // Paired, understated petaloid pore tracts; the living coat hides much of the test.
  for(let a=0;a<5;a++)for(let sign of [-1,1])for(let j=0;j<32;j++){
    const t=(j+.8)/33,q=.08+.70*t,side=sign*.060*Math.sin(t*Math.PI),angle=a*TAU/5,x=-.15+q*Math.cos(angle)-side*Math.sin(angle),z=q*Math.sin(angle)+side*Math.cos(angle);
    k.ell([x,upper(x,z)+.004,z],[.004,.0025,.004],'#a08e8e');
  }
  // Ventral spine sweep is represented separately from unavailable particle capture.
  const entries=Array.from({length:1200},(_,i)=>{const a=i*2.39996323,r=Math.sqrt((i+.5)/1200)*.97;return {p:v(1.1*r*Math.cos(a),.018,r*Math.sin(a)),phase:a+r*5};});
  rig.spineMesh=grains(k,entries.length,new T.ConeGeometry(1,1,4),'#6b5f64',i=>({p:entries[i].p,n:v(.3,-1,0),s:v(.002,.021,.002)}));rig.spines=entries;
  rig.body=body;return [[.55,.15,0],[-.15,.18,0],[0,.025,.2]];
}
function cucumber(k,rig) {
  const section=(u,a)=>{const x=-1.42+2.84*u, taper=.33+.67*Math.pow(Math.sin(Math.PI*u),.38),r=.34*taper*(1+.035*Math.sin(23*u)+.02*Math.cos(7*a+u*19));return v(x,.035+r*.83+r*Math.cos(a)*.83,r*Math.sin(a));};
  const body=k.surface((u,w)=>section(u,w*TAU).toArray(),150,72,'#655045',k.root,{roughness:.86});body.name='Holothuria continuous leathery trunk';mottled(body,'#463b32','#89785e',1.3);
  k.ell([-1.42,.13,0],[.025,.093,.112],'#665744');
  grains(k,640,new T.ConeGeometry(.7,1,7),'#71634e',i=>{
    const u=.035+.93*random(i+5),a=(random(i+44)-.5)*Math.PI*1.35,p=section(u,a),n=v(.08*Math.cos(u*19),Math.cos(a),Math.sin(a)),len=.025+random(i+22)*.065;
    p.addScaledVector(n,len*.30);return {p,n,s:v(.025+random(i+2)*.018,len,.025+random(i+2)*.018),c:i%3===0?'#9b8868':'#635440'};
  });
  for(let row=-1;row<=1;row++)for(let j=0;j<35;j++){
    const u=.11+j/35*.78,anchor=section(u,Math.PI+row*.27),end=v(anchor.x,.005,anchor.z);
    // Static ventral support cues; not mislabeled as a calibrated crawl.
    foot(k,rig,anchor,end,.006,true,j*.3+row);
  }
  const mouth=k.group([1.43,.13,0]);mouth.rotation.z=-.45;
  k.ell([0,0,0],[.022,.08,.08],'#302a23',mouth);
  for(let j=0;j<20;j++){
    const a=j*TAU/20,g=k.group([0,Math.cos(a)*.07,Math.sin(a)*.07],mouth);g.rotation.x=a;
    const length=.065+.04*random(j+111);k.tube([[0,0,0],[length*.6,.025,0],[length,.02,0]],.009,'#9e8f72',g,10);
    for(let q=0;q<5;q++){const b=q*TAU/5;k.ell([length,.02+Math.cos(b)*.015,Math.sin(b)*.015],[.014,.009,.009],'#9e8f72',g);}
    rig.tentacles.push({object:g,phase:j*.7});
  }
  rig.body=body;return [[0,.65,0],[.3,.64,.08],[1.43,.13,0]];
}
function brittle(k,rig) {
  const disc=k.surface((u,w)=>{const a=u*TAU,r=Math.sin(w*Math.PI),R=.21*(1+.09*Math.cos(a*5));return [R*r*Math.cos(a),.15+.072*Math.cos(w*Math.PI),R*r*Math.sin(a)];},100,28,'#82756b',k.root,{roughness:.86});
  disc.name='Ophiothrix small five-sided disc';mottled(disc,'#4b4646','#af9b86',.65);
  for(let a=0;a<5;a++)for(const sign of [-1,1]){const angle=a*TAU/5+sign*.11,p=k.ell([Math.cos(angle)*.12,.213,Math.sin(angle)*.12],[.045,.008,.013],'#a3907a');p.rotation.y=-angle;}
  for(let arm=0;arm<5;arm++){
    const angle=arm*TAU/5,base=k.group([Math.cos(angle)*.18,.14,Math.sin(angle)*.18]);base.rotation.y=-angle;let parent=base;
    for(let j=0;j<22;j++){
      const length=.077*(1-.32*j/22),radius=.041*(1-.78*j/22),joint=k.group(j?[length,0,0]:[0,0,0],parent),neutral=.16*Math.sin(j*.42+arm*1.8);
      joint.rotation.y=neutral;
      const plate=k.ell([length*.45,0,0],[length*.65,radius*.62,radius],j%4<2?'#ac9581':'#756a69',joint,{roughness:.87});plate.name='Articulated arm plate';
      const spineMesh=new T.InstancedMesh(new T.ConeGeometry(1,1,5),k.mat('#c2b199',{roughness:.87}),14),o=new T.Object3D();
      for(let sign of [-1,1])for(let q=0;q<7;q++){
        const spread=(q-3)*.16,n=v(.12,.23+q*.04,sign*(.95-Math.abs(spread)*.15)).normalize(),len=(.12-.065*j/22)*(1-Math.abs(q-3)*.08);
        o.position.set(length*.46+spread*.03,0,sign*radius*.75);o.position.addScaledVector(n,len*.5);o.quaternion.setFromUnitVectors(UP,n);o.scale.set(.003,len,.003);o.updateMatrix();spineMesh.setMatrixAt((sign<0?0:7)+q,o.matrix);
      }
      joint.add(spineMesh);rig.joints.push({object:joint,neutral,arm,index:j});parent=joint;
    }
  }
  grains(k,330,new T.ConeGeometry(1,1,5),'#b7a38a',i=>{const a=i*2.39996323,r=Math.sqrt((i+.5)/330)*.19;return {p:v(r*Math.cos(a),.15+.072*Math.sqrt(1-r*r/.044)+.008,r*Math.sin(a)),n:UP.clone(),s:v(.0035,.018,.0035)};});
  rig.body=disc;return [[0,.21,0],[.85,.17,0],[.8,.15,.12]];
}
export function echinodermRevision(s,k) {
  if(!revisedEchinoderms.includes(s.id))return null;
  const rig={id:s.id,feet:[],joints:[],tentacles:[]};rigs.set(k.root,rig);k.root.userData.preciseGround=true;
  k.root.userData.anatomyRevision={version:'0.6.5',scope:'Species-specific qualitative body, surface and connected appendage study; no measured dimensions, physiology or validated kinematics.'};
  if(s.id==='asterias-rubens'||s.id==='luidia-ciliaris')return star(k,rig,s.id==='luidia-ciliaris');
  if(s.id==='echinus-esculentus')return urchin(k,rig);
  if(s.id==='dendraster-excentricus')return dollar(k,rig);
  if(s.id==='holothuria-tubulosa')return cucumber(k,rig);
  return brittle(k,rig);
}
export function animateEchinodermRevision(model,action,t) {
  const rig=rigs.get(model.root);if(!rig)return false;
  const active=action!=='observe'&&action!=='rest';
  for(const f of rig.feet){
    const end=f.end.clone();
    if(active&&action==='crawl'&&rig.id!=='holothuria-tubulosa'){
      const p=((t*.28+f.phase/TAU)%1+1)%1,duty=.68;
      end.x+=(p<duty?.035*(1-2*p/duty):-.035*Math.cos((p-duty)/(1-duty)*Math.PI));
      if(p>=duty)end.y+=.045*Math.sin((p-duty)/(1-duty)*Math.PI);
    }
    setFoot(f,end);
  }
  for(const j of rig.joints)j.object.rotation.y=j.neutral+(active&&action==='arms'?.045*Math.sin(t*1.15+j.index*.45+j.arm*1.2)*Math.sin((j.index+1)/23*Math.PI):0);
  for(const q of rig.tentacles){q.object.rotation.z=active&&action==='crawl'?.42*(.5-.5*Math.cos(t*1.1+q.phase)):0;}
  if(rig.spines){const o=new T.Object3D();for(let i=0;i<rig.spines.length;i++){const s=rig.spines[i];o.position.copy(s.p);const bend=active&&action==='spines'?.4*Math.sin(t*2+s.phase):0;o.quaternion.setFromUnitVectors(UP,v(.3+bend,-1,0).normalize());o.scale.set(.002,.021,.002);o.updateMatrix();rig.spineMesh.setMatrixAt(i,o.matrix);}rig.spineMesh.instanceMatrix.needsUpdate=true;}
  model.root.updateMatrixWorld(true);return true;
}
