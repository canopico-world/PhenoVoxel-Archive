import * as T from 'three';
import {aimJoint,rotateJoint,solveTwoLink} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),TAU=Math.PI*2;
// Original morphological reconstruction. Parameters are display dimensions,
// not measurements or angles extracted from a photograph or animal study.
export function buildAxolotl(s){
 const root=new T.Group(),bones=[],parts={legs:[],wings:[],leaves:[],tails:[],tentacles:[],buds:[],growth:[]};
 function bone(name,point,parent){const b=new T.Bone();b.name=name;b.position.copy(point);if(parent){b.position.sub(parent.getWorldPosition(V()));parent.add(b);}else root.add(b);root.updateMatrixWorld(true);bones.push(b);return b;}
 const axial=[bone('PV_AxolotlShoulder',V(.58,.54,0))];axial.push(bone('PV_AxolotlNeck',V(.82,.54,0),axial[0]));axial.push(bone('PV_AxolotlHead',V(1.03,.54,0),axial[1]));axial.push(bone('PV_AxolotlTrunk1',V(.12,.54,0),axial[0]));axial.push(bone('PV_AxolotlTrunk2',V(-.5,.54,0),axial[3]));for(const[x,y]of [[-.98,.50],[-1.40,.47],[-1.85,.44],[-2.25,.44]])axial.push(bone('PV_AxolotlTail'+axial.length,V(x,y,0),axial.at(-1)));
 const head=axial[2],limbs=[];
 for(const front of [true,false])for(const side of [-1,1]){
  const x=front?.45:-.65,parent=front?axial[0]:axial[4],shoulder=V(x,.50,.19*side),elbow=V(x+(front?-.10:.10),.30,.43*side),wrist=V(x+(front?.16:-.08),.16,.61*side),a=bone(`PV_Axolotl${front?'Fore':'Hind'}${side}Upper`,shoulder,parent),b=bone('PV_AxolotlElbow'+bones.length,elbow,a),c=bone('PV_AxolotlWrist'+bones.length,wrist,b);
  limbs.push({chain:[a,b,c],home:wrist.clone(),front,side,digits:front?4:5});parts.legs.push(a);
 }
 root.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones),skinMaterial=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.64,metalness:0});
 const noise=(x,y,z)=>Math.sin(x*63.13+y*71.71+z*77.19)*Math.sin(x*31.11-y*41.83+z*37.47);
 function pigmentation(p){const n=noise(p.x,p.y,p.z),patch=Math.sin(p.x*15+p.z*9)*Math.cos(p.z*18+p.y*13),ventral=T.MathUtils.smoothstep(.48-p.y,0,.20);const c=new T.Color().lerpColors(new T.Color('#3d4229'),new T.Color('#696744'),.5+.22*patch);c.lerp(new T.Color('#827d54'),ventral*.50);c.lerp(new T.Color('#283120'),T.MathUtils.smoothstep(n,.28,.70)*.48);c.lerp(new T.Color('#979365'),T.MathUtils.smoothstep(-n,.42,.83)*.25);return c;}
 function skin(g,weight,color=skinMaterial){const p=g.attributes.position,indices=[],weights=[],colors=[];for(let i=0;i<p.count;i++){const point=V(p.getX(i),p.getY(i),p.getZ(i)),w=weight(point,i),c=pigmentation(point);indices.push(w[0],w[2]??w[0],0,0);weights.push(w[1],w[3]??0,0,0);colors.push(c.r,c.g,c.b);}g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new T.SkinnedMesh(g,color);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);mesh.bind(skeleton);return mesh;}
 const axialPoints=[...axial].sort((a,b)=>a.getWorldPosition(V()).x-b.getWorldPosition(V()).x);
 function axialWeight(p){for(let i=0;i<axialPoints.length-1;i++){const a=axialPoints[i].getWorldPosition(V()).x,b=axialPoints[i+1].getWorldPosition(V()).x;if(p.x<=b){const u=T.MathUtils.clamp((p.x-a)/(b-a),0,1);return[bones.indexOf(axialPoints[i]),1-u,bones.indexOf(axialPoints[i+1]),u];}}return[bones.indexOf(head),1];}
 // One head/trunk/tail surface; a narrow midline fin rises smoothly from its tail.
 const sections=[[-2.37,.44,0,0],[-2.27,.44,.04,.008],[-1.99,.44,.20,.020],[-1.60,.46,.28,.037],[-1.22,.49,.24,.075],[-.93,.51,.17,.14],[-.68,.53,.18,.22],[-.25,.54,.185,.225],[.25,.54,.175,.22],[.54,.54,.14,.21],[.70,.54,.12,.26],[.86,.54,.135,.34],[1.08,.53,.115,.36],[1.21,.52,.075,.28],[1.29,.52,0,0]],positions=[],uv=[],ix=[],N=140,R=48;
 function section(x){let i=0;while(i<sections.length-2&&x>sections[i+1][0])i++;const a=sections[i],b=sections[i+1],prev=sections[Math.max(0,i-1)],next=sections[Math.min(sections.length-1,i+2)],u=(x-a[0])/(b[0]-a[0]),dx=b[0]-a[0],h00=2*u**3-3*u*u+1,h10=u**3-2*u*u+u,h01=-2*u**3+3*u*u,h11=u**3-u*u;return[x,...a.slice(1).map((v,j)=>{const k=j+1,m0=(b[k]-prev[k])/(b[0]-prev[0]),m1=(next[k]-a[k])/(next[0]-a[0]),value=h00*v+h10*dx*m0+h01*b[k]+h11*dx*m1;return k>1?Math.max(0,value):value;})];}
 for(let i=0;i<=N;i++){const x=-2.37+3.66*i/N,[,cy,ry,rz]=section(x);for(let j=0;j<=R;j++){const theta=j/R*TAU,cs=Math.cos(theta),sn=Math.sin(theta),fin=x<-.96?Math.pow(Math.abs(sn),.52):sn;positions.push(x,cy+Math.sign(sn)*Math.abs(fin)*ry,cs*rz);uv.push(i/N,j/R);}}
 for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,b=a+R+1;ix.push(a,b,a+1,a+1,b,b+1);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);const body=skin(geo,axialWeight);body.name='Continuous axolotl head trunk and finned tail';parts.body=body;
 function taperedTube(points,r0,r1,weight,material=skinMaterial){const curve=new T.CatmullRomCurve3(points),segments=r0<.004?8:32,radial=r0<.004?4:10,g=new T.TubeGeometry(curve,segments,1,radial,false),p=g.attributes.position;for(let i=0;i<=segments;i++){const u=i/segments,c=curve.getPointAt(u),r=T.MathUtils.lerp(r0,r1,u);for(let j=0;j<=radial;j++){const k=i*(radial+1)+j,point=V(p.getX(k),p.getY(k),p.getZ(k)).sub(c).multiplyScalar(r).add(c);p.setXYZ(k,...point.toArray());}}return skin(g,weight,material);}
 for(const l of limbs){const points=l.chain.map(b=>b.getWorldPosition(V())),ids=l.chain.map(b=>bones.indexOf(b));l.mesh=taperedTube(points,.065,.027,(p,i)=>{const u=Math.floor(i/11)/32*2,k=Math.min(1,Math.floor(u)),v=Math.min(1,u-k);return[ids[k],1-v,ids[k+1],v];});
  const wrist=points[2],toes=[];for(let j=0;j<l.digits;j++){const spread=(j-(l.digits-1)/2)*.052,tip=wrist.clone().add(V(.18-.02*Math.abs(j-(l.digits-1)/2),-.004,spread)),mid=wrist.clone().lerp(tip,.55);mid.y+=.003;const toe=taperedTube([wrist.clone(),mid,tip],.014,.005,()=>[ids[2],1]);toe.name=`${l.front?'Fore':'Hind'} digit ${j+1}`;toes.push(toe);}l.toes=toes;l.frame=l.chain[2].getWorldQuaternion(new T.Quaternion());l.samples=[];for(const mesh of [l.mesh,...toes])for(let i=0;i<mesh.geometry.attributes.position.count;i++)if(mesh.geometry.attributes.position.getY(i)<.19)l.samples.push([mesh,i]);
 }
 // Small eyes and a shallow mouth seam, rather than protruding cartoon globes.
 const eyeMaterial=new T.MeshStandardMaterial({color:'#737941',roughness:.23}),pupilMaterial=new T.MeshStandardMaterial({color:'#121b16',roughness:.18}),gillMaterial=new T.MeshStandardMaterial({color:'#70524a',roughness:.59,vertexColors:false});
 for(const side of [-1,1]){
  const eg=new T.SphereGeometry(1,24,16);eg.scale(.023,.025,.016);eg.translate(1.06,.62,.288*side);skin(eg,()=>[bones.indexOf(head),1],eyeMaterial);
  const pupil=new T.SphereGeometry(1,20,14);pupil.scale(.010,.012,.004);pupil.translate(1.061,.621,.302*side);skin(pupil,()=>[bones.indexOf(head),1],pupilMaterial);
  taperedTube([V(1.12,.47,.32*side),V(1.22,.46,.24*side),V(1.275,.47,.06*side)],.0025,.002,()=>[bones.indexOf(head),1],new T.MeshStandardMaterial({color:'#343b24',roughness:.75}));
  for(let j=0;j<3;j++){const start=V(.75-j*.085,.58,(.275-j*.017)*side),end=V(.62-j*.15,.98-j*.04,(.43+j*.025)*side),curve=new T.CatmullRomCurve3([start,start.clone().lerp(end,.5).add(V(-.015,.035,.06*side)),end]);taperedTube([curve.getPoint(0),curve.getPoint(.5),curve.getPoint(1)],.018,.006,()=>[bones.indexOf(head),1],gillMaterial);
   for(let k=2;k<30;k++){const u=k/31,p=curve.getPoint(u),length=.065*Math.sin(Math.PI*u)**.6;for(const branch of [-1,1])taperedTube([p,p.clone().add(V(branch*length*.55,.016,.010*side)),p.clone().add(V(branch*length,.022,.021*side))],.0022,.0009,()=>[bones.indexOf(head),1],gillMaterial);}
  }
 }
 // Shallow lateral costal grooves use the same skin color, not disconnected plates.
 for(const side of [-1,1])for(let j=0;j<10;j++){const x=-.57+j*.09;const g=taperedTube([V(x,.59,.222*side),V(x-.014,.51,.223*side),V(x-.006,.43,.204*side)],.0017,.0012,axialWeight,new T.MeshStandardMaterial({color:'#50563a',roughness:.68}));g.name='Qualitative lateral costal groove';}
 // Shared rigid-to-head gill geometry is batched to keep the specimen economical
 // while retaining the same authored vertices and skin weights in every action.
 const gills=[];root.traverse(o=>{if(o.isSkinnedMesh&&o.material===gillMaterial)gills.push(o);});
 const combined=mergeGeometries(gills.map(o=>o.geometry));if(combined){gills.forEach(o=>{o.removeFromParent();o.geometry.dispose();});const mesh=new T.SkinnedMesh(combined,gillMaterial);mesh.name='Six external gill stalks and feathery filaments';mesh.castShadow=true;root.add(mesh);mesh.bind(skeleton);}
 root.updateMatrixWorld(true);skeleton.calculateInverses();const bind=new Map();root.traverse(o=>bind.set(o,{p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}));
 const m={root,parts,features:[V(.59,.87,.43),V(-1.6,.69,0),V(.61,.15,.66)],featureBindings:[{bone:head,offset:head.worldToLocal(V(.59,.87,.43))},{bone:axial[6],offset:axial[6].worldToLocal(V(-1.6,.69,0))},{bone:limbs[1].chain[2],offset:V()}],kind:'salamander',id:s.id,variant:s.visual.variant,reference:true,surfaceDetailed:true,axolotlRig:{axial,limbs,skeleton,bind,body},viewerRig:s.visual.viewerRig,animationValidated:false};
 root.userData.reconstruction={version:'0.4.6',reference:s.photograph?.source,geometry:'Original continuous wild-type axolotl reconstruction with authored articulation and procedural pigmentation',animationValidated:false};return m;
}
export function animateAxolotl(m,action,t){
 const{axial,limbs,skeleton,bind}=m.axolotlRig;for(const[o,b]of bind){o.position.copy(b.p);o.quaternion.copy(b.q);o.scale.copy(b.s);}m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);
 const swimming=action==='swim',walking=action==='walk';
 if(swimming){m.root.position.y=.30;rotateJoint(m,axial[0],V(0,1,0),Math.sin(t*3.2)*.014);for(let i=3;i<axial.length;i++)rotateJoint(m,axial[i],V(0,1,0),Math.sin(t*3.2-i*.65)*(.03+(i-3)*.025));for(const l of limbs){
  m.root.updateMatrixWorld(true);const[a,b,c]=l.chain,p=m.root.worldToLocal(a.getWorldPosition(V())),span=a.getWorldPosition(V()).distanceTo(b.getWorldPosition(V()))+b.getWorldPosition(V()).distanceTo(c.getWorldPosition(V()))-.025;
  solveTwoLink(m,a,b,c,p.clone().add(V(-span,.02,l.side*.07)),V(0,1,l.side*.12));setWorldFrame(c,new T.Quaternion().setFromAxisAngle(V(0,1,0),Math.PI).multiply(l.frame));
 }}
 if(walking||action==='forage'){
  for(let i=3;i<axial.length;i++)rotateJoint(m,axial[i],V(0,1,0),Math.sin(t*2.1-i*.4)*(walking?.012:.005));
  for(const[i,l]of limbs.entries()){const u=(t*.36+[0,.5,.75,.25][i])%1,swing=walking&&u>.78,target=l.home.clone();if(walking){target.x+=.13*(swing?-.5+(u-.78)/.22:.5-u/.78);target.y+=swing?.07*Math.sin((u-.78)/.22*Math.PI):0;}
   solveTwoLink(m,...l.chain,target,V(l.front?-1:1,0,l.side*.7));setWorldFrame(l.chain[2],l.frame);m.root.updateMatrixWorld(true);skeleton.update();
   if(!swing)for(let pass=0;pass<4;pass++){let min=Infinity;for(const[mesh,index]of l.samples)min=Math.min(min,mesh.getVertexPosition(index,V()).applyMatrix4(mesh.matrixWorld).y);if(Math.abs(min-.136)<.003)break;target.y+=T.MathUtils.clamp(.136-min,-.02,.02);solveTwoLink(m,...l.chain,target,V(l.front?-1:1,0,l.side*.7));setWorldFrame(l.chain[2],l.frame);m.root.updateMatrixWorld(true);skeleton.update();}
  }
 }
 if(action==='forage'){rotateJoint(m,axial[1],V(0,1,0),Math.sin(t*.7)*.08);rotateJoint(m,axial[2],V(0,0,1),-.07);}
 m.root.updateMatrixWorld(true);skeleton.update();
}
