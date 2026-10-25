import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {toolkit} from './expansion-geometry.js';
import {TAU,V,noise,mix,tint,microRelief} from './mollusca-surfaces.js';
const rigs=new WeakMap();export const octopusRig=root=>rigs.get(root);
const smooth=(a,b,t)=>T.MathUtils.smoothstep(t,a,b);
function skin(mesh,pale=false){tint(mesh,(x,y,z)=>{const field=.55*noise(x*8,y*8,z*8)+.30*noise(x*33,y*33,z*33)+.15*noise(x*105,y*105,z*105);return mix(pale?'#967e61':'#4b3829',pale?'#e1caa2':'#b79b6d',.10+.82*field);});microRelief(mesh,37,.009,.58);}
function armPoint(i,u,t=0,action='observe'){const a=[.20,.78,1.43,2.27,3.12,3.91,4.75,5.64][i],length=[1.90,2.15,1.92,1.76,1.88,2.12,2.05,1.81][i],curl=[.70,-.56,.62,-.77,.55,-.52,.85,-.63][i],progress=action==='crawl'?.20*smooth(0,5.2,t):0;
 const onset=[.2,1.5,3.1][[0,3,6].indexOf(i)],q=Number.isFinite(onset)?T.MathUtils.clamp((t-onset)/.85,0,1):0,recovery=action==='crawl'&&q>0&&q<1?Math.sin(q*Math.PI)**2:0,explore=action==='forage'&&i===0?Math.sin(Math.PI*T.MathUtils.clamp(t/5.2,0,1)):0;
 const angle=a+curl*u*u*.65+.35*explore*u*u,r=.08+(length+.17)*u,rad=.145*Math.pow(1-u,.82)+.003;
 const x=.42+Math.cos(angle)*r-progress*smooth(.12,.55,u)*(1-recovery),z=Math.sin(angle)*r;
 return V(x,.030+rad+.235*(1-u)**4+.16*recovery*smooth(.15,.65,u)+.20*explore*u*u,z);
}
function armFrame(i,u,t,a){const p=armPoint(i,u,t,a),tangent=armPoint(i,Math.min(1,u+.001),t,a).sub(armPoint(i,Math.max(0,u-.001),t,a)).normalize(),across=V(-tangent.z,0,tangent.x).normalize(),up=new T.Vector3().crossVectors(across,tangent).normalize();if(up.y<0)up.negate();return {p,tangent,across,up};}
function putArm(mesh,i,t,a){const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;for(let j=0;j<p.count;j++){const u=uv.getX(j),theta=uv.getY(j)*TAU,f=armFrame(i,u,t,a),r=.145*Math.pow(1-u,.82)+.003,relief=1+.028*(noise(u*56,i*7,Math.cos(theta)*4)-.5),q=f.p.clone().addScaledVector(f.across,Math.cos(theta)*r*relief).addScaledVector(f.up,Math.sin(theta)*r*.72*relief);p.setXYZ(j,q.x,q.y,q.z);}p.needsUpdate=true;mesh.geometry.computeVertexNormals();}
export function buildOctopus(s){const k=toolkit(),r={arms:[],cups:[],webs:[]},root=k.root;root.userData.preciseGround=true;root.userData.octopusRevision={version:'0.6.32',arms:8,suckerRows:2,kinematics:'Authored finite contact/extension study; no fitted trajectories, suction, forces or fluid solver'};
 // One continuous axial mantle-neck-head surface, rather than stacked upright balls.
 const sections=[[-1.10,.38,.001,.001],[-.94,.48,.24,.32],[-.66,.53,.36,.46],[-.30,.48,.32,.43],[-.01,.38,.19,.27],[.20,.36,.21,.32],[.45,.34,.20,.38],[.68,.29,.12,.29],[.80,.26,.02,.05]];
 const curve=new T.CatmullRomCurve3(sections.map(a=>V(a[0],a[1],0))),body=k.surface((u,v)=>{const n=Math.min(sections.length-2,Math.floor(u*(sections.length-1))),f=u*(sections.length-1)-n,b=f*f*(3-2*f),q=curve.getPoint(u),ry=T.MathUtils.lerp(sections[n][2],sections[n+1][2],b),rz=T.MathUtils.lerp(sections[n][3],sections[n+1][3],b),a=v*TAU,grain=1+.028*(noise(q.x*48,Math.sin(a)*9,Math.cos(a)*9)-.5);return[q.x,q.y+Math.sin(a)*ry*grain,Math.cos(a)*rz*grain];},144,96,'#98764f');body.name='Continuous low mantle neck and head';skin(body);r.body=body;
 for(const side of [-1,1]){const eye=k.ell([.27,.47,side*.32],[.128,.105,.095],'#92764d');skin(eye);const iris=k.ell([.29,.48,side*.392],[.065,.054,.015],'#b7a05c',root,{roughness:.26});const pupil=k.ell([.30,.483,side*.405],[.047,.011,.005],'#151a13',root,{roughness:.18});pupil.name='Horizontal slit pupil';const upper=k.surface((u,v)=>{const a=u*Math.PI,R=.14+.014*v;return[.27+Math.cos(a)*R,.46+Math.sin(a)*(.12+.01*v),side*(.36+.02*Math.sin(a))];},36,5,'#9b825d');skin(upper);}
 const funnel=k.tube([[.12,.25,-.18],[.37,.25,-.34],[.56,.24,-.39]],.065,'#a38b68');funnel.name='Lateral funnel exterior';const funnelLumen=k.ell([.561,.24,-.391],[.022,.042,.041],'#3d3427');funnelLumen.rotation.y=-.55;
 // Eight unequal, low, tapered arms. Cups share each arm's continuous deformation frame.
 const cupGeo=k.surface((u,v)=>{const a=v*TAU,R=u,y=.14*(1-u)+.12*Math.sin(u*Math.PI);return[Math.cos(a)*R,y,Math.sin(a)*R];},7,16,'#c4ad87').geometry;const temporary=root.children.at(-1);root.remove(temporary);temporary.material.dispose();
 for(let i=0;i<8;i++){const arm=k.surface((u,v)=>[u,Math.sin(v*TAU),Math.cos(v*TAU)],104,24,'#96734d');arm.name='Continuous arm '+(i+1);putArm(arm,i,0,'observe');skin(arm);r.arms.push(arm);const material=k.mat('#ceb893',{roughness:.58,side:T.DoubleSide}),cups=new T.InstancedMesh(cupGeo,material,76);cups.name='Two rows of recessed sucker discs '+(i+1);cups.castShadow=true;root.add(cups);r.cups.push(cups);}
 for(let i=0;i<8;i++){const next=(i+1)%8,web=k.surface((u,v)=>{const left=armPoint(i,u*.28),right=armPoint(next,u*.28),p=left.clone().lerp(right,v),notch=Math.sin(v*Math.PI)*u*.12;p.x+=notch*Math.cos(i*TAU/8);p.y+=.045*Math.sin(u*Math.PI);return p.toArray();},28,24,'#96734d');web.name='Basal interbrachial web '+(i+1);skin(web);r.webs.push(web);}
 // Flattened underside oral field. The external beak is not exposed in a dorsal pose.
 const oral=k.ell([.42,.14,0],[.32,.035,.30],'#ae9672');skin(oral,true);
 rigs.set(root,r);const m=k.finish(s,[[.28,.48,.39],[1.25,.11,.62],[-.60,.72,.10]]);m.octopus=true;pose(m,'observe',0);return m;
}
function pose(m,a,t){const r=rigs.get(m.root),duration=Math.min(Math.max(t,0),5.2);m.root.position.copy(m.expansionRig.home);if(a==='crawl')m.root.position.x+=.20*smooth(0,5.2,duration)*m.expansionRig.scale;
 for(let i=0;i<8;i++){putArm(r.arms[i],i,duration,a);const matrix=new T.Matrix4(),q=new T.Quaternion(),scale=new T.Vector3(),basis=new T.Matrix4();for(let j=0;j<38;j++){const u=.055+j*.0244,f=armFrame(i,u,duration,a),rad=.145*Math.pow(1-u,.82)+.003,R=.043*Math.pow(1-u,.83)+.003;for(const side of [-1,1]){const p=f.p.clone().addScaledVector(f.across,side*rad*.44).addScaledVector(f.up,-rad*.68);basis.makeBasis(f.across,f.up.clone().negate(),f.tangent);q.setFromRotationMatrix(basis);scale.set(R,R*.75,R);matrix.compose(p,q,scale);r.cups[i].setMatrixAt(j*2+(side===1?1:0),matrix);}}r.cups[i].instanceMatrix.needsUpdate=true;}
 for(let i=0;i<8;i++){const mesh=r.webs[i],p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;for(let j=0;j<p.count;j++){const u=uv.getX(j),v=uv.getY(j),left=armPoint(i,u*.28,duration,a),right=armPoint((i+1)%8,u*.28,duration,a),q=left.clone().lerp(right,v),notch=Math.sin(v*Math.PI)*u*.12;q.x+=notch*Math.cos(i*TAU/8);q.y+=.045*Math.sin(u*Math.PI);p.setXYZ(j,q.x,q.y,q.z);}p.needsUpdate=true;mesh.geometry.computeVertexNormals();}
 m.root.updateMatrixWorld(true);
}
export function animateOctopus(m,a,t){if(!m.octopus)return false;pose(m,['crawl','forage'].includes(a)?a:'observe',t);return true;}
