import * as T from 'three';
import {V,TAU,noise} from './mollusca-surfaces.js';
const smooth=(a,b,t)=>T.MathUtils.smoothstep(t,a,b),N=200;
export const armStudyScope=Object.freeze({version:'0.6.36',duration:5.2,arms:8,suckerPairsPerArm:38,measured:false,validated:false,mechanism:'Finite authored proximal extension, travelling bend and selected support/recovery; no muscle, pressure, traction or contact-force solver'});
// Selected asymmetric paths, not a fitted specimen or a motor-control model.
const angles=[.16,.88,1.60,2.38,3.18,3.96,4.77,5.57],lengths=[3.35,3.05,2.85,3.00,2.90,3.25,2.95,3.10],curls=[1.10,-2.15,.70,-1.60,.90,-1.10,-1.80,-1.00],sweeps=[-.30,.35,-.30,.18,.32,-.25,.18,-.23],lifts=[.04,.02,.07,.03,.09,.05,.04,.08],baseHeights=[.12,.14,.13,.04,.015,.02,.08,.12];
export function armStudyState(i,t=0,action='observe'){
 const time=T.MathUtils.clamp(t,0,armStudyScope.duration),phase=time/armStudyScope.duration,onset=[.25,2.0,3.65][[0,3,6].indexOf(i)],q=Number.isFinite(onset)?T.MathUtils.clamp((time-onset)/1.05,0,1):0,reach=action==='forage'&&i===0?Math.sin(Math.PI*phase):0;
 return{time,reach,bendAt:.18+.69*phase,progress:action==='crawl'?.20*smooth(0,5.2,time):0,recovery:action==='crawl'&&q>0&&q<1?Math.sin(q*Math.PI)**2:0,step:action==='crawl'?.20*smooth(0,1,q):0};
}
export function armRadius(i,u,state){
 const r=.195*(1-u)**.67+.008,stretch=1+.18*state.reach*(1-smooth(state.bendAt-.12,state.bendAt+.12,u));
 // A short rounded terminal cap replaces the previous needle-like open end.
 const cap=u<=.985?1:Math.sqrt(Math.max(0,1-((u-.985)/.015)**2));return r*cap/Math.sqrt(stretch);
}
export function armCurve(i,t=0,action='observe',selectedCurl=null){
 const state=armStudyState(i,t,action),points=[],radius=[],stretch=[],root=V(.71+Math.cos(angles[i])*.16,0,Math.sin(angles[i])*.22);let x=root.x,z=root.z;
 for(let j=0;j<=N;j++){
  const u=j/N,localStretch=1+.18*state.reach*(1-smooth(state.bendAt-.12,state.bendAt+.12,u)),uncurl=1-.80*state.reach*(1-smooth(state.bendAt-.08,state.bendAt+.13,u)),theta=angles[i]+sweeps[i]*u+(selectedCurl??curls[i])*smooth(.43,.98,u)*uncurl;
  if(j){x+=Math.cos(theta)*lengths[i]*localStretch/N;z+=Math.sin(theta)*lengths[i]*localStretch/N;}
  const r=armRadius(i,u,state),anchor=(-state.progress+state.step)*smooth(.12,.55,u),travel=state.reach*.15*Math.exp(-(((u-state.bendAt)/.15)**2)),height=.044+r*.80+baseHeights[i]*(1-u)**4+lifts[i]*smooth(.78,1,u)+state.recovery*.18*smooth(.18,.62,u)+state.reach*.15*smooth(.35,.85,u)+travel;
  points.push(V(x+anchor,height,z));radius.push(r);stretch.push(localStretch);
 }
 return{points,radius,stretch,state,index:i};
}
export function armFrame(curve,u){
 const n=T.MathUtils.clamp(u,0,1)*N,j=Math.min(N-1,Math.floor(n)),f=n-j,p=curve.points[j].clone().lerp(curve.points[j+1],f),tangent=curve.points[Math.min(N,j+2)].clone().sub(curve.points[Math.max(0,j-1)]).normalize(),across=V(-tangent.z,0,tangent.x).normalize(),up=new T.Vector3().crossVectors(across,tangent).normalize();if(up.y<0)up.negate();
 return{p,tangent,across,up,radius:T.MathUtils.lerp(curve.radius[j],curve.radius[j+1],f)};
}
export function armSurfaceGeometry(U=170,W=32){
 const p=[],uv=[],ix=[];for(let i=0;i<U;i++)for(let j=0;j<=W;j++){p.push(0,0,0);uv.push(i/U,j/W);}const tip=p.length/3;p.push(0,0,0);uv.push(1,.5);
 for(let i=0;i<U-1;i++)for(let j=0;j<W;j++){const a=i*(W+1)+j,b=a+W+1;ix.push(a,b,a+1,b,b+1,a+1);}for(let j=0;j<W;j++)ix.push((U-1)*(W+1)+j,tip,(U-1)*(W+1)+j+1);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);return g;
}
export function putArm(mesh,curve){
 const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;for(let j=0;j<p.count;j++){
  const u=uv.getX(j),theta=uv.getY(j)*TAU,f=armFrame(curve,u),relief=1+.028*(noise(u*57,curve.index*7,Math.cos(theta)*4)-.5),q=f.p.clone().addScaledVector(f.across,Math.cos(theta)*f.radius*relief).addScaledVector(f.up,Math.sin(theta)*f.radius*.75*relief);p.setXYZ(j,q.x,q.y,q.z);
 }p.needsUpdate=true;mesh.geometry.computeVertexNormals();const normals=mesh.geometry.attributes.normal;for(let i=0;i<170;i++){const a=i*33,b=a+32,n=V(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);}mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
}
export function putCups(cups,curve){
 const matrix=new T.Matrix4(),q=new T.Quaternion(),scale=V(),basis=new T.Matrix4();for(let j=0;j<38;j++){const u=.055+j*.0244,f=armFrame(curve,u),R=.049*(1-u)**.72+.003;for(const side of [-1,1]){const p=f.p.clone().addScaledVector(f.across,side*f.radius*.44).addScaledVector(f.up,-f.radius*.71);basis.makeBasis(f.across,f.up.clone().negate(),f.tangent);q.setFromRotationMatrix(basis);scale.set(R,R*.75,R);matrix.compose(p,q,scale);cups.setMatrixAt(j*2+(side===1?1:0),matrix);}}
 cups.instanceMatrix.needsUpdate=true;cups.computeBoundingBox();cups.computeBoundingSphere();
}
export function putWeb(mesh,i,curves){
 const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,side=mesh.geometry.attributes.webSide;
 for(let j=0;j<p.count;j++){
  const u=uv.getX(j),v=uv.getY(j),span=.035+u*(.245-.055*Math.sin(v*Math.PI)**2),left=armFrame(curves[i],span),right=armFrame(curves[(i+1)%8],span),toward=right.p.clone().sub(left.p),sign=Math.sign(left.across.dot(toward))||1,other=Math.sign(right.across.dot(toward))||1;
  const a=left.p.clone().addScaledVector(left.across,sign*left.radius*.70).addScaledVector(left.up,left.radius*.75*.50),b=right.p.clone().addScaledVector(right.across,-other*right.radius*.70).addScaledVector(right.up,right.radius*.75*.50),q=a.lerp(b,v);
  q.y-=.035*Math.sin(v*Math.PI)*Math.sin(u*Math.PI*.75);q.y+=side.getX(j)*(.002+.012*Math.sin(u*Math.PI)*Math.sin(v*Math.PI));p.setXYZ(j,q.x,q.y,q.z);
 }p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
}
