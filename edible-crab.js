import * as T from 'three';
// Original reference-led surfaces and constrained authored kinematics. No scan,
// measured material field, experimental footfall sequence or force solver.
const rigs=new WeakMap(),cuticles=new WeakMap(),TAU=Math.PI*2,UP=new T.Vector3(0,1,0);
const V=p=>new T.Vector3(...p),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(x,a,b)=>T.MathUtils.smoothstep(x,a,b);
function hash(x,y,z){const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return n-Math.floor(n);}
function noise(x,y,z){const a=[x,y,z].map(Math.floor),f=[x-a[0],y-a[1],z-a[2]].map(t=>t*t*(3-2*t));let q=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)q+=hash(a[0]+i,a[1]+j,a[2]+k)*(i?f[0]:1-f[0])*(j?f[1]:1-f[1])*(k?f[2]:1-f[2]);return q;}
function field(x,y,z){return .58*noise(x*7,y*7,z*7)+.27*noise(x*23,y*23,z*23)+.15*noise(x*89,y*89,z*89);}
function coat(mesh,base,kind='shell'){
 const p=mesh.geometry.attributes.position,colors=[],a=new T.Color(base),ochre=new T.Color('#b9996a'),red=new T.Color('#713321'),cream=new T.Color('#b9ad8b');
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),f=field(x+1.7,y-.4,z+2.3),speck=noise(x*151,y*151,z*151),q=a.clone();
  q.lerp(red,smooth(f,.39,.70)*.24).lerp(ochre,smooth(noise(x*29+13,y*29,z*29),.48,.73)*.15);
  if(kind==='ventral')q.copy(cream).multiplyScalar(.83+.23*f);else q.multiplyScalar(.83+.29*f);
  if(kind==='shell'&&speck>.62)q.lerp(ochre,.15);colors.push(q.r,q.g,q.b);
 }
 mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));mesh.material=mesh.material.clone();mesh.material.color.set('#ffffff');mesh.material.vertexColors=true;mesh.material.roughness=kind==='ventral'?.74:kind==='claw'?.53:.66;return mesh;
}
function grain(){
 // Periodic numerical height field, not photographic pixels. DataTexture keeps
 // the material exportable rather than hiding a WebGL-only shader substitution.
 const n=256,data=new Uint8Array(n*n*4),height=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=x/n*TAU,b=y/n*TAU;height[y*n+x]=noise(Math.cos(a)*45,Math.sin(a)*45,Math.sin(b)*19+Math.cos(b)*19);}for(let y=0;y<n;y++)for(let x=0;x<n;x++){const dx=height[y*n+(x+1)%n]-height[y*n+(x+n-1)%n],dy=height[((y+1)%n)*n+x]-height[((y+n-1)%n)*n+x],v=new T.Vector3(-dx*2,-dy*2,1).normalize(),i=(y*n+x)*4;data[i]=Math.round((v.x*.5+.5)*255);data[i+1]=Math.round((v.y*.5+.5)*255);data[i+2]=Math.round((v.z*.5+.5)*255);data[i+3]=255;}
 const map=new T.DataTexture(data,n,n,T.RGBAFormat);map.wrapS=map.wrapT=T.RepeatWrapping;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;map.userData={author:'PhenoVoxel Archive contributors',license:'MIT',scope:'Original numerical microrelief; not a biological measurement or photograph'};return map;
}
function applyGrain(mesh,map,amount=.008){mesh.material.normalMap=map;mesh.material.normalScale.setScalar(amount*25);return mesh;}
export function edibleCrabRig(root){return rigs.get(root);}
export function edibleCrab(species,k){
 if(species.id!=='cancer-pagurus')return null;
 const {root,group,mesh,ell,surface,tube}=k,map=grain(),body=group(),legs=[],claws=[],mouth=[],eyes=[];
 const red='#8f5137',ventral='#b8a585',black='#24231f';
 root.userData.preciseGround=true;root.userData.anatomy={speciesShape:species.id,walkingPairs:4,chelipedPairs:1,bodyRigid:true,shellRegionCues:true,measured:false};
 root.userData.motionScope='Original supported short lateral walking bout; qualitative stance/swing and local appendage motion, not measured gait or force.';
 function dome(theta,r,lower=false){
  const a=Math.abs(theta>Math.PI?theta-TAU:theta),sector=(a-.18)/1.72,lobe=a>.18&&a<1.90?.065*Math.sin(Math.PI*5*sector)**2:0,edge=Math.pow(r,12),x=.79*Math.cos(theta)*r,z=1.12*Math.sin(theta)*r;
  const rim=1+lobe*edge,regions=.023*Math.exp(-(((x-.12)/.25)**2+(z/.44)**2))-.009*Math.exp(-(((x+.15)/.035)**2+(z/.65)**2));
  const n=(noise(x*90,0,z*90)-.5)*.0032,top=.445+.305*Math.pow(Math.max(0,1-r*r),.72)+regions*(1-edge)+n*r;
  return[x*rim,lower?.445-.255*Math.pow(Math.max(0,1-r*r),.8):top,z*rim];
 }
 const shell=surface((u,v)=>dome(u*TAU,v),256,96,red,body);coat(shell,red);applyGrain(shell,map,.007);
 const underside=surface((u,v)=>dome(u*TAU,v,true),192,36,ventral,body);coat(underside,ventral,'ventral');applyGrain(underside,map,.003);
 // A continuous rolled margin connects upper and lower carapace surfaces.
 const rim=[];for(let j=0;j<=320;j++){const p=dome(j/320*TAU,1);p[1]=.437;rim.push(p);}const edge=tube(rim,.025,'#986642',body,320);coat(edge,'#986642');
 // Shallow regional grooves follow the gastric/branchial layout, rather than
 // imposing a repeated radial flower pattern over the whole carapace.
 for(const sign of [-1,1]){const points=[[.30,sign*.16],[.15,sign*.26],[-.08,sign*.31],[-.24,sign*.43],[-.35,sign*.60]].map(([x,z])=>{const r=Math.hypot(x/.79,z/1.12),a=Math.atan2(z/1.12,x/.79),p=dome(a<0?a+TAU:a,r);p[1]-=.001;return p;});tube(points,.0020,'#805037',body,42);}
 const granules=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#a36d46',roughness:.78}),6800),stamp=new T.Object3D();
 for(let j=0;j<6800;j++){const a=j*2.3999632297,r=Math.sqrt((j+.5)/6800)*.985,p=dome((a%TAU+TAU)%TAU,r),radius=.0018+.0024*hash(j,7,3);stamp.position.set(...p);stamp.scale.set(radius,.0016,radius);stamp.updateMatrix();granules.setMatrixAt(j,stamp.matrix);granules.setColorAt(j,new T.Color('#a27652').multiplyScalar(.70+.46*hash(j,11,5)));}granules.instanceMatrix.needsUpdate=true;granules.castShadow=true;body.add(granules);
 // Inset orbital/antennular regions and small short-stalked compound eyes.
 for(const sign of [-1,1]){
  const socket=ell([.656,.506,sign*.39],[.108,.043,.083],'#4a3524',body);coat(socket,'#66482d');
  const stalk=group([.676,.505,sign*.39],body);tube([[0,0,0],[.040,.003,sign*.012],[.071,.012,sign*.020]],.025,'#a18560',stalk,18);const eye=ell([.083,.014,sign*.021],[.036,.033,.043],black,stalk,{roughness:.32});eyes.push(stalk);
  const antennule=group([.737,.405,sign*.125],body);tube([[0,0,0],[.07,-.014,sign*.015],[.105,.025,sign*.027],[.15,.04,sign*.034]],.009,'#b49b73',antennule,25);tube([[.08,0,sign*.020],[.115,.02,sign*.048],[.14,.032,sign*.060]],.005,'#9b825d',antennule,15);mouth.push({object:antennule,sign,antennule:true});
  for(let j=0;j<2;j++){const plate=ell([.740+j*.012,.292+j*.012,sign*(.046+j*.044)],[.021,.079-j*.014,.048],'#aa906a',body);plate.rotation.x=sign*.14;mouth.push({object:plate,sign,index:j});}
 }
 // Flattened abdominal apron and ventral sternite cues are distinct from legs.
 for(let j=0;j<6;j++){const x=-.32+j*.108,plate=ell([x,.202,0],[.078,.019,.19-j*.012],'#a48d6d',body);coat(plate,ventral,'ventral');}
 function segment(length,r1,r2,color,parent,flatten=.66,tip=false){
  const g=group([0,0,0],parent),o=surface((u,v)=>{const a=u*TAU,y=v*length,bevel=tip?1:Math.min(1,.82+v*6,.82+(1-v)*6),r=mix(r1,r2,v)*bevel*(1+.12*Math.sin(v*Math.PI));return[Math.cos(a)*r,y,Math.sin(a)*r*flatten];},24,15,color,g);coat(o,color, color===ventral?'ventral':'claw');applyGrain(o,map,.003);cuticles.set(g,o);
  // This longitudinal sweep has the opposite parameter winding to the dome.
  // Correct it before deriving dorsal pigment from its outward world normals.
  const ix=o.geometry.index.array;for(let i=0;i<ix.length;i+=3){const a=ix[i];ix[i]=ix[i+1];ix[i+1]=a;}o.geometry.index.needsUpdate=true;o.geometry.computeVertexNormals();
  g.userData.segmentLength=length;g.userData.lengthPreserved=true;
  // Stiff setae form sparse rows along the cuticle. Each remains attached to its
  // segment, so animation moves the same surface and hairs together.
  if(!tip){const geo=new T.ConeGeometry(.0013,.036,4),mat=new T.MeshStandardMaterial({color:'#6c5335',roughness:.9}),hair=new T.InstancedMesh(geo,mat,42),dummy=new T.Object3D();for(let j=0;j<42;j++){const u=(j+.5)/42,a=(j%2?1:-1)*.64,rr=mix(r1,r2,u);dummy.position.set(Math.cos(a)*rr,u*length,Math.sin(a)*rr*flatten);dummy.quaternion.setFromUnitVectors(UP,new T.Vector3(Math.cos(a),.5,Math.sin(a)).normalize());dummy.updateMatrix();hair.setMatrixAt(j,dummy.matrix);}hair.instanceMatrix.needsUpdate=true;hair.castShadow=true;g.add(hair);}
  return g;
 }
 function aim(o,a,b){o.position.copy(a);o.quaternion.setFromUnitVectors(UP,b.clone().sub(a).normalize());}
 function joint(parent,r,color='#73563d'){return ell([0,0,0],[r,r*.70,r*.82],color,parent,{roughness:.77});}
 const fore=[.43,.15,-.15,-.43],footX=[.76,.27,-.42,-.94],footZ=[1.66,1.77,1.77,1.66];
 for(const sign of [-1,1])for(let j=0;j<4;j++){
  const origin=new T.Vector3(fore[j],.365,sign*.66),hip=new T.Vector3(fore[j]+.012,.358,sign*.84),foot=new T.Vector3(footX[j],0,sign*footZ[j]),chain=group();
  const coxa=segment(origin.distanceTo(hip),.070,.065,ventral,chain,.78),merus=segment(.46,.102,.074,red,chain,.52),carpus=segment(.13,.070,.062,'#9f7451',chain,.62),propodus=segment(.32,.061,.038,'#aa8056',chain,.60),dactyl=segment(.24,.039,0,'#664a2d',chain,.57,true),kneeJoint=joint(chain,.062),carpalJoint=joint(chain,.048),distalJoint=joint(chain,.033);
  const r={sign,index:j,origin,hip,baseFoot:foot,foot:foot.clone(),segments:[coxa,merus,carpus,propodus,dactyl],joints:[kneeJoint,carpalJoint,distalJoint],phase:((j*.25)+(sign>0?.5:0))%1,contact:true};legs.push(r);
 }
 function finger(parent,points,r0,color,upper=false){const curve=new T.CatmullRomCurve3(points.map(V)),o=surface((u,v)=>{const p=curve.getPoint(u),t=curve.getTangent(u),bin=new T.Vector3(0,0,1),n=bin.clone().cross(t).normalize(),r=r0*Math.pow(1-u,.68)+.0015,a=v*TAU;return p.addScaledVector(n,r*Math.cos(a)).addScaledVector(bin,r*.70*Math.sin(a)).toArray();},76,20,color,parent);coat(o,color,'claw');const p=o.geometry.attributes.position,c=o.geometry.attributes.color;for(let i=0;i<p.count;i++){const u=Math.floor(i/21)/76,f=smooth(u,.34,.72),q=new T.Color().setRGB(c.getX(i),c.getY(i),c.getZ(i)).lerp(new T.Color('#24251f'),f);c.setXYZ(i,q.r,q.g,q.b);}applyGrain(o,map,.003);for(let j=0;j<7;j++){const u=.24+j*.082,p=curve.getPoint(u),tooth=mesh(new T.ConeGeometry(.013*(1-u*.4),.030*(1-u*.4),7),'#403c2d',parent,{roughness:.58});tooth.position.copy(p);tooth.position.y+=(upper?-1:1)*r0*.72;tooth.rotation.z=upper?Math.PI:0;}return o;}
 for(const sign of [-1,1]){
  const shoulder=new T.Vector3(.43,.45,sign*.62),assembly=group(shoulder.toArray(),body),e=new T.Vector3(.31,-.09,sign*.24),w=new T.Vector3(.50,-.085,sign*.10),prox=segment(e.length(),.103,.095,red,assembly,.82),dist=segment(e.distanceTo(w),.097,.103,red,assembly,.84);aim(prox,new T.Vector3(),e);aim(dist,e,w);
  const hand=group(w.toArray(),assembly);hand.rotation.y=sign*.22;hand.scale.setScalar(sign<0?1.045:1);
  const palm=ell([.15,0,0],[.33,.192,.238],red,hand);coat(palm,red,'claw');applyGrain(palm,map,.005);
  finger(hand,[[.19,-.090,0],[.37,-.164,0],[.60,-.118,0],[.70,-.035,0]],.070,red,false);
  const hinge=group([.23,.115,0],hand);finger(hinge,[[0,0,0],[.24,.045,0],[.43,-.040,0],[.46,-.133,0]],.065,red,true);
  const collar=ell([.20,.100,0],[.090,.055,.065],'#795436',hand);coat(collar,red,'claw');
  claws.push({assembly,hand,hinge,sign,base:assembly.rotation.clone()});
 }
 function poseLeg(r,foot,lower=0){
  lower+=.080;const hip=r.hip.clone().add(new T.Vector3(0,-lower,0)),origin=r.origin.clone().add(new T.Vector3(0,-lower,0)),ankle=foot.clone().add(new T.Vector3(0,.10,-r.sign*Math.sqrt(.24*.24-.10*.10)));
  const d=ankle.clone().sub(hip),dist=d.length(),a=.46,b=.45;if(dist>a+b+.0001||dist<Math.abs(a-b)+.0001)throw Error('Unreachable crab leg target');const axis=d.clone().divideScalar(dist),bend=new T.Vector3((r.index-1.5)*.24,.70,0);bend.addScaledVector(axis,-bend.dot(axis)).normalize();const along=(a*a-b*b+dist*dist)/(2*dist),height=Math.sqrt(Math.max(0,a*a-along*along)),knee=hip.clone().addScaledVector(axis,along).addScaledVector(bend,height),carpal=knee.clone().lerp(ankle,.13/.45);
  aim(r.segments[0],origin,hip);aim(r.segments[1],hip,knee);aim(r.segments[2],knee,carpal);aim(r.segments[3],carpal,ankle);aim(r.segments[4],ankle,foot);r.joints[0].position.copy(knee);r.joints[1].position.copy(carpal);r.joints[2].position.copy(ankle);r.foot.copy(foot);r.contact=foot.y<.0001;
 }
 body.position.y=-.08;const rig={body,legs,claws,mouth,eyes,poseLeg,bodyTravel:0,ended:false,grain:map};rigs.set(root,rig);for(const leg of legs)poseLeg(leg,leg.baseFoot);
 root.updateMatrixWorld(true);for(const leg of legs)for(const seg of leg.segments){const o=cuticles.get(seg),normal=new T.Matrix3().getNormalMatrix(o.matrixWorld),n=o.geometry.attributes.normal,p=o.geometry.attributes.position,col=o.geometry.attributes.color,top=new T.Color('#8d4e32'),under=new T.Color('#a98a60');for(let i=0;i<p.count;i++){const up=new T.Vector3(n.getX(i),n.getY(i),n.getZ(i)).applyNormalMatrix(normal).y,q=under.clone().lerp(top,smooth(up,-.80,.25)).multiplyScalar(.84+.25*field(p.getX(i)*4,p.getY(i)*4,p.getZ(i)*4));col.setXYZ(i,q.r,q.g,q.b);}}
 root.userData.surfaceProvenance={geometry:'Original MIT reference-led mesh',material:'Original numerical pigment and microrelief; no imported photograph pixels',reference:species.photograph?.source,validated:false};
 root.userData.behaviorStatus={walk:'Supported authored seven-second bout, unmeasured',forage:'Local search/handling gesture; prey capture and ingestion unavailable',rest:'Authored supported quiet pose',claw:'Same propodus/dactyl opening'};
 return[[0,.67,0],[1.34,.30,-.72],[-.25,.20,.99]];
}
export function animateEdibleCrab(model,action,time){
 const r=rigs.get(model.root);if(!r)return false;const t=Math.max(0,time),walk=action==='walk',rest=action==='rest',search=action==='forage',lower=rest?.035:0;r.body.position.y=-.08-lower;r.bodyTravel=0;r.ended=false;
 if(walk){const q=T.MathUtils.clamp((t-.5)/1.5,0,4),start=smooth(t,0,.5),settle=smooth(t,6.5,7);r.bodyTravel=.07*q;r.ended=t>=7;model.root.position.z+=r.bodyTravel*model.root.scale.z;
  for(const leg of r.legs){const p=q+leg.phase,n=Math.floor(p),f=p-n,swing=f>.65,phase=smooth(f,.65,1),worldZ=.07*(n+(swing?phase:0)),foot=leg.baseFoot.clone();foot.z+=mix(0,worldZ,start)-r.bodyTravel;foot.y=start*(1-settle)*(swing?.105*Math.sin(Math.PI*phase):0);if(settle)foot.z=mix(foot.z,leg.baseFoot.z,settle);r.poseLeg(leg,foot);}
 }else for(const leg of r.legs)r.poseLeg(leg,leg.baseFoot,lower);
 for(const claw of r.claws){claw.hinge.rotation.z=action==='claw'?.43*(.5-.5*Math.cos(t*1.35)):search?.12+.22*(.5-.5*Math.cos(t*1.2+claw.sign*.8)):rest?.06:.015;if(search){claw.assembly.rotation.y=claw.sign*.14*Math.sin(t*.65);claw.hand.rotation.y=claw.sign*(.22+.08*Math.sin(t*.65));}}
 for(const m of r.mouth){if(m.antennule)m.object.rotation.y=(search?.11:.025)*m.sign*Math.sin(t*1.7);else if(search)m.object.rotation.x=m.sign*.07*Math.sin(t*2.0+(m.index||0));}
 for(const eye of r.eyes)eye.rotation.y=search?.04*Math.sin(t*.7):0;
 model.root.updateMatrixWorld(true);return true;
}
