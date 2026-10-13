import * as THREE from 'three';

// Authored surface reconstruction guided by reference photographs. No scan or measured rig.
export const naturalSpecies=new Set(['canis-lupus','vulpes-vulpes','panthera-tigris']);
export function buildNaturalSpecimen(s){
 const root=new THREE.Group(),torso=new THREE.Group();root.add(torso);
 const fox=s.id==='vulpes-vulpes',tiger=s.id==='panthera-tigris';
 const parts={torso,legs:[],limbs:[],wings:[],leaves:[],tails:[],tentacles:[],buds:[],growth:[]};
 let seed=9467;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const cream=new THREE.Color(tiger?'#d4c5ac':fox?'#d3c4b9':'#b6aa8e'),dark=new THREE.Color(tiger?'#171512':fox?'#6b3019':'#252922'),base=new THREE.Color(tiger?'#b96722':fox?'#9e4b22':'#6c6454');
 const coat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98});
 const skin=new THREE.MeshStandardMaterial({color:'#141713',roughness:.62});
 const v=(a)=>new THREE.Vector3(...a);
 function group(parent,p){const g=new THREE.Group();g.position.set(...p);parent.add(g);return g;}
 function ell(parent,p,size,color,roughness=.9){const m=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),new THREE.MeshStandardMaterial({color,roughness}));m.position.set(...p);m.scale.set(...size);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function coatColor(x,theta,zone){
  const upper=Math.sin(theta);let c=base.clone();
  if(zone==='body'||zone==='tail')c.lerp(upper<-.2?cream:dark,upper<-.2?.65:Math.max(0,upper)*.8);
  else if(zone==='leg')c.lerp(cream,.65);
  else c.lerp(cream,upper<0?.45:.07);
  if(tiger&&zone==='body'&&Math.sin(x*23+Math.cos(theta*3)*1.8)>.66)c.copy(dark);
  if(tiger&&zone==='head'&&Math.sin(x*32+Math.cos(theta*2)*1.3)>.7)c.copy(dark);
  if(fox&&zone==='leg')c.lerp(skin.color,.75);
  return c.multiplyScalar(.82+random()*.32);
 }
 // Smooth elliptical cross sections, with a separate fine geometry layer for guard hairs.
 function loft(parent,sections,zone='body',density=5000,hairLength=.05){
  const curve=new THREE.CatmullRomCurve3(sections.map(r=>v([r[0],r[1],0])));
  function section(u){const f=u*(sections.length-1),a=Math.min(sections.length-2,Math.floor(f)),t=f-a;const p=curve.getPoint(u);const ry=THREE.MathUtils.lerp(sections[a][2],sections[a+1][2],t),rz=THREE.MathUtils.lerp(sections[a][3],sections[a+1][3],t);return {p,ry,rz};}
  const pos=[],colors=[],indices=[],N=76,R=40;
  for(let i=0;i<=N;i++){const {p,ry,rz}=section(i/N);for(let j=0;j<=R;j++){const a=j/R*Math.PI*2;pos.push(p.x,p.y+Math.sin(a)*ry,Math.cos(a)*rz);const c=coatColor(p.x,a,zone);colors.push(c.r,c.g,c.b);}}
  for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,b=a+R+1;indices.push(a,b,a+1,a+1,b,b+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,coat);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  const hairs=[],hc=[];
  for(let i=0;i<density;i++){
   const u=.01+random()*.98,a=random()*Math.PI*2,{p,ry,rz}=section(u);if(ry<.03||rz<.03)continue;
   const origin=v([p.x,p.y+Math.sin(a)*ry,Math.cos(a)*rz]);const normal=v([0,Math.sin(a),Math.cos(a)]);
   const direction=normal.clone().multiplyScalar(.65).add(v([-(zone==='head'?.08:.5),-.13,0])).normalize();
   const len=hairLength*(.55+random()*.9),width=.0007+random()*.0013;
   const across=new THREE.Vector3().crossVectors(direction,v([0,1,.2])).normalize().multiplyScalar(width);
   const tip=origin.clone().addScaledVector(direction,len),c=coatColor(p.x,a,zone);
   for(const pt of [origin.clone().sub(across),origin.clone().add(across),tip]){hairs.push(...pt.toArray());hc.push(c.r,c.g,c.b);}
  }
  const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(hairs,3));hg.setAttribute('color',new THREE.Float32BufferAttribute(hc,3));hg.computeVertexNormals();
  const hm=new THREE.Mesh(hg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));hm.castShadow=true;parent.add(hm);
  return mesh;
 }
 loft(torso,[[-1.18,1.57,.02,.02],[-.97,1.58,.3,.25],[-.64,1.65,.42,.32],[-.12,1.7,.34,.32],[.4,1.65,.49,.36],[.73,1.71,.49,.36],[.96,1.86,.32,.29],[1.08,1.99,.17,.19]],'body',15000,tiger?.027:.064);
 const neck=group(torso,[.76,1.73,0]);neck.rotation.z=.78;
 loft(neck,[[-.2,0,.27,.26],[0,0,.35,.31],[.35,0,.32,.27],[.62,0,.22,.21]],'neck',5500,tiger?.035:.085);
 const head=group(torso,[1.1,2.12,0]);parts.head=head;
 loft(head,tiger?[[-.34,.01,.025,.025],[-.2,.02,.3,.28],[.04,.015,.3,.3],[.22,-.08,.2,.22],[.4,-.13,.1,.13]]:[[-.3,.01,.035,.04],[-.2,.02,.26,.22],[.04,.015,.265,.225],[.25,-.08,.18,.16],[.52,-.13,.1,.115],[.67,-.13,.065,.095]],'head',4200,.025);
 loft(head,tiger?[[.05,-.16,.09,.2],[.23,-.22,.08,.17],[.37,-.215,.04,.11]]:[[.05,-.16,.08,.13],[.32,-.22,.075,.12],[.59,-.215,.033,.08]],'head',1200,.018);
 ell(head,[tiger?.39:.65,-.118,0],[.085,.062,tiger?.09:.105],tiger?'#744039':'#191b18',.38);
 // Narrow mouth seam and inset amber irises replace oversized button eyes.
 for(const side of [-1,1]){
  const eye=group(head,[.12,.09,(tiger?.27:.199)*side]);ell(eye,[0,0,0],[.055,.033,.016],'#292923',.8);ell(eye,[.016,.002,.012*side],[.032,.024,.013],tiger?'#b29154':'#ac8740',.4);ell(eye,[.025,.001,.022*side],[.013,.021,.007],'#0c100f',.2);
  ell(eye,[.028,.012,.027*side],[.006,.006,.003],'#e8dfcb',.15);
  const line=new THREE.CatmullRomCurve3([[.13,-.18,(tiger?.21:.156)*side],[tiger?.23:.33,-.21,(tiger?.17:.12)*side],[tiger?.36:.56,-.18,(tiger?.11:.083)*side]].map(v));head.add(new THREE.Mesh(new THREE.TubeGeometry(line,18,.004,5,false),skin));
  const ear=group(head,[-.14,.21,.155*side]);ear.rotation.x=side*.18;ear.rotation.z=.12;
  if(tiger){ell(ear,[0,.09,.035],[.13,.155,.053],'#382b24');ell(ear,[.012,.07,.084],[.085,.1,.019],'#b89572');}
  else {
  const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute([-.13,0,-.035,.12,0,-.035,-.022,fox?.4:.32,0,-.13,0,.035,-.022,fox?.4:.32,0,.12,0,.035,-.13,0,-.035,-.13,0,.035,-.022,fox?.4:.32,0,.12,0,.035,.12,0,-.035,-.022,fox?.4:.32,0],3));eg.computeVertexNormals();const em=new THREE.Mesh(eg,new THREE.MeshStandardMaterial({color:tiger?'#b16b37':'#81765f',roughness:1,side:THREE.DoubleSide}));ear.add(em);
  const inner=new THREE.BufferGeometry();inner.setAttribute('position',new THREE.Float32BufferAttribute([-.08,.035,.039,.08,.035,.039,-.02,fox?.31:.25,.013],3));inner.computeVertexNormals();ear.add(new THREE.Mesh(inner,new THREE.MeshStandardMaterial({color:'#4b433b',roughness:1,side:THREE.DoubleSide})));
  }
  if(tiger)ell(head,[.27,-.12,.13*side],[.13,.085,.1],'#ccbfa8');
  for(let j=0;j<6;j++){const p=[.32,-.12-j*.015,.14*side];const curve=new THREE.CatmullRomCurve3([p,[.35,-.09+j*.015,.28*side],[.3,-.1+j*.034,.45*side]].map(v));head.add(new THREE.Mesh(new THREE.TubeGeometry(curve,8,.0012,3,false),new THREE.MeshStandardMaterial({color:'#b9b5a7',roughness:1})));}
 }
 function segment(parent,a,b,r1,r2,color){const mesh=new THREE.Group();parent.add(mesh);loft(mesh,[[0,0,r1*.85,r1*.85],[.1,0,r1,r1],[.42,0,r1*.92,r1*.92],[.85,0,r2,r2],[1,0,r2*.83,r2*.83]],'leg',1600,.027);return {mesh,a:v(a),b:v(b)};}
 function place(seg,a,b){const d=b.clone().sub(a);seg.mesh.position.copy(a);seg.mesh.scale.x=d.length();seg.mesh.quaternion.setFromUnitVectors(v([1,0,0]),d.normalize());}
 for(let i=0;i<4;i++){
  const front=i<2,x=front?.61:-.83,z=(i%2?-.25:.25),g=group(torso,[x,1.53,z]);parts.legs.push(g);
  const elbow=front?[-.12,-.55,0]:[.24,-.48,0],ankle=front?[-.12,-1.12,0]:[-.12,-.99,0],toe=[front?-.02:.09,-1.34,0];
  const segments=[segment(g,[0,0,0],elbow,front?.17:.23,.11,base),segment(g,elbow,ankle,.1,.063,base),segment(g,ankle,toe,.058,.053,fox?'#36302a':cream)];
  const paw=ell(g,[toe[0]+.07,-1.36,0],[tiger?.17:.125,.068,.09],fox?'#292823':cream);
  for(let j=0;j<4;j++){ell(paw,[.25,.01,(j-1.5)*.34],[.5,.7,.19],fox?'#34302a':cream);ell(paw,[.67,-.04,(j-1.5)*.34],[.17,.14,.075],'#36362c');}
  const joint=ell(g,elbow,[.108,.13,.106],base);
  const limb={g,front,i,segments,paw,joint,elbow:v(elbow),ankle:v(ankle),toe:v(toe)};parts.limbs.push(limb);segments.forEach(seg=>place(seg,seg.a,seg.b));
 }
 const tail=group(torso,[-1.01,1.65,0]);parts.tails.push(tail);tail.rotation.z=.5;
 loft(tail,[[0,0,.09,.1],[-.25,0,tiger?.1:.17,tiger?.09:.17],[-.65,-.02,tiger?.08:.18,tiger?.07:.17],[-1.02,-.04,.08,.09],[-1.15,-.05,.01,.01]],'tail',6000,tiger?.02:.075);
 if(fox)ell(tail,[-1.03,-.04,0],[.16,.08,.085],'#d2c7b4');
 if(tiger){head.scale.set(1.05,1.12,1.2);neck.scale.set(1,1.03,1.1);}
 root.traverse(o=>o.userData.base={position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()});
 const features=[v([1.52,2.16,.17]),v([.62,.7,.3]),v([-.3,1.96,.36])];
 return {root,parts,features,kind:'quadruped',id:s.id,natural:true,place};
}
export function animateNatural(m,motion,t){
 const {root,parts,place}=m;root.traverse(o=>{const b=o.userData.base;if(b){o.position.copy(b.position);o.rotation.copy(b.rotation);o.scale.copy(b.scale);}});
 if(motion==='observe')return;
 const running=['run','escape'].includes(motion),walking=['walk','run','escape','forage','swim'].includes(motion),frequency=running?6.6:3.1;
 if(walking){
  parts.limbs.forEach(l=>{
   const phase=t*frequency+(running?(l.front?0:1.8)+(l.i%2)*.4:([0,Math.PI,Math.PI,0][l.i]));
   const swing=Math.sin(phase),lift=Math.max(0,Math.cos(phase))*(running?.22:.12),stride=motion==='forage'?.04:running?.37:.2;
   const toe=l.toe.clone();toe.x+=swing*stride;toe.y+=lift;
   const elbow=l.elbow.clone();elbow.x+=swing*stride*.45;elbow.y+=lift*.4;
   const ankle=l.ankle.clone();ankle.x+=swing*stride*.85;ankle.y+=lift*.7;
   place(l.segments[0],new THREE.Vector3(),elbow);place(l.segments[1],elbow,ankle);place(l.segments[2],ankle,toe);
   l.paw.position.set(toe.x+.07,toe.y-.02,0);l.joint.position.copy(elbow);
  });
  parts.torso.position.y=Math.sin(t*frequency*2)*(running?.025:.008);
  parts.head.rotation.z=Math.sin(t*frequency)*.012;parts.tails[0].rotation.y=Math.sin(t*1.1)*.07;
 }
 if(motion==='forage')parts.head.rotation.z=-.38+Math.sin(t*1.5)*.06;
 if(motion==='swim'){root.position.y=.25+Math.sin(t*1.5)*.03;parts.head.rotation.z=.06;}
 if(motion==='rest'||motion==='sleep'){parts.head.rotation.z=-.18;}
 if(motion==='jump')root.position.y=Math.max(0,Math.sin(t*2.6))*.5;
}
