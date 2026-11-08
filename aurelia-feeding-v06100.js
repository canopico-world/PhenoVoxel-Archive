import * as T from 'three';
import {animateAsset,selectAssetMotion} from './asset-motion.js';
export const DURATION=20;
const V=(...a)=>new T.Vector3(...a),clamp=T.MathUtils.clamp,smooth=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x);};
// Finite illustrative study. Source GLB/atlas/bones/clip are not rewritten.
// Groove sheets are original, opened explanatory geometry, NOT a measured dissection.
export function buildAureliaFeedingStudy(m){
 selectAssetMotion(m,'observe');animateAsset(m,'observe',0);m.mixer.stopAllAction();m.root.updateMatrixWorld(true);
 const rest=m.bones.map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
 const oral=m.aureliaSurface.meshes.filter(o=>/OralArm/.test(o.material.name)),visibility=oral.map(o=>o.visible),root=new T.Group();root.name='Oral-arm feeding geometry';m.root.add(root);
 const chains=Array.from({length:4},(_,i)=>m.bones.filter(b=>new RegExp('^A'+i+'_').test(b.name)).sort((a,b)=>Number(a.name.split('_')[1])-Number(b.name.split('_')[1])));
 if(chains.some(c=>c.length!==14))throw Error('Unexpected oral-arm joint mapping');
 const origin=m.root.worldToLocal(m.bones.find(b=>/^O_/.test(b.name)).getWorldPosition(V())),home=chains.map(c=>m.root.worldToLocal(c.at(-1).getWorldPosition(V())));
 const target=chains.map(c=>{const p=m.root.worldToLocal(c[0].getWorldPosition(V())),a=Math.round(Math.atan2(p.z,p.x)/(Math.PI/4))*(Math.PI/4)-Math.PI/8;return V(1.93*Math.cos(a),.50,1.93*Math.sin(a));});
 const sheets=[],curves=[],dots=[],N=84,W=12;
 // One enlarged marginal-fold detail makes the selected collection site visible.
 // Placement/dimensions are authored; the other seven food pouches are not reconstructed.
 const pp=[],pi=[],a0=Math.atan2(target[0].z,target[0].x);for(let i=0;i<=12;i++)for(let j=0;j<=20;j++){const u=i/12,a=a0+(j/20-.5)*.15,r=1.84+.11*u;pp.push(Math.cos(a)*r,.50-.035*Math.sin(Math.PI*u),Math.sin(a)*r);}for(let i=0;i<12;i++)for(let j=0;j<20;j++){const k=i*21+j;pi.push(k,k+21,k+1,k+1,k+21,k+22);}const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(pp,3));pg.setIndex(pi);pg.computeVertexNormals();const pouch=new T.Mesh(pg,new T.MeshStandardMaterial({color:'#d8d5cb',transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false}));pouch.name='Selected marginal collection fold — schematic';root.add(pouch);
 for(let a=0;a<4;a++){
  const p=[],uv=[],ix=[];for(let layer=0;layer<2;layer++)for(let i=0;i<=N;i++)for(let j=0;j<=W;j++){p.push(0,0,0);uv.push(i/N,j/W);}
  const count=(N+1)*(W+1);for(let layer=0;layer<2;layer++)for(let i=0;i<N;i++)for(let j=0;j<W;j++){const k=layer*count+i*(W+1)+j,l=k+W+1;if(!layer)ix.push(k,l,k+1,k+1,l,l+1);else ix.push(k,k+1,l,k+1,l+1,l);}
  for(let i=0;i<N;i++)for(const j of[0,W]){const k=i*(W+1)+j,l=k+W+1;if(j===0)ix.push(k,k+count,l,l,k+count,l+count);else ix.push(k,l,k+count,l,l+count,k+count);}for(const i of[0,N])for(let j=0;j<W;j++){const k=i*(W+1)+j;if(i===0)ix.push(k,k+1,k+count,k+1,k+count+1,k+count);else ix.push(k,k+count,k+1,k+1,k+count,k+count+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);
  const material=new T.MeshStandardMaterial({color:'#d8d5cb',roughness:.38,transparent:true,opacity:.68,side:T.DoubleSide,depthWrite:false});const mesh=new T.Mesh(g,material);mesh.name='Opened V-groove oral arm '+a;root.add(mesh);sheets.push(mesh);
  const dot=new T.Mesh(new T.SphereGeometry(.027,14,10),new T.MeshStandardMaterial({color:'#dbe790',emissive:'#65732e',emissiveIntensity:.2,roughness:.7}));dot.name='Enlarged food marker '+a;root.add(dot);dots.push(dot);
 }
 function restore(){for(const x of rest){x.b.position.copy(x.p);x.b.quaternion.copy(x.q);x.b.scale.copy(x.s);}m.root.updateMatrixWorld(true);}
 function solve(chain,goal){const world=m.root.localToWorld(goal.clone());for(let pass=0;pass<64;pass++)for(let i=chain.length-2;i>=5;i--){const b=chain[i],p=b.getWorldPosition(V()),from=chain.at(-1).getWorldPosition(V()).sub(p),to=world.clone().sub(p);if(from.lengthSq()<1e-12||to.lengthSq()<1e-12)continue;const q=new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize()),angle=2*Math.acos(clamp(q.w,-1,1));if(angle>.085)q.slerp(new T.Quaternion(),1-.085/angle);const parent=b.parent.getWorldQuaternion(new T.Quaternion());b.quaternion.premultiply(parent.clone().invert().multiply(q).multiply(parent));b.updateWorldMatrix(false,true);}}
 function frame(curve,u){const p=curve.getPoint(u),tangent=curve.getTangent(u).normalize(),side=V().crossVectors(tangent,V(0,1,0));if(side.lengthSq()<1e-6)side.set(1,0,0);side.normalize();const down=V().crossVectors(tangent,side).normalize();if(down.y>0)down.negate();return{p,side,down};}
 function surface(curve,u,v,layer=0){const {p,side,down}=frame(curve,u),width=.035+.09*Math.sin(Math.PI*(.12+.88*u))**.6,depth=.075*(1-.45*u),frill=.014*Math.sin(u*65)*Math.abs(v)**3;return p.addScaledVector(side,v*width).addScaledVector(down,depth*Math.abs(v)+frill+layer*.006);}
 function rebuild(a){const c=chains[a],pts=[origin.clone(),...c.map(b=>m.root.worldToLocal(b.getWorldPosition(V())))];const curve=new T.CatmullRomCurve3(pts,false,'centripetal');curves[a]=curve;const p=sheets[a].geometry.attributes.position;let n=0;for(let layer=0;layer<2;layer++)for(let i=0;i<=N;i++)for(let j=0;j<=W;j++){const q=surface(curve,i/N,j/W*2-1,layer);p.setXYZ(n++,...q);}p.needsUpdate=true;sheets[a].geometry.computeVertexNormals();sheets[a].geometry.computeBoundingBox();sheets[a].geometry.computeBoundingSphere();}
 function pose(raw,enabled=true){const t=clamp(Number.isFinite(raw)?raw:0,0,DURATION);restore();root.visible=enabled;oral.forEach((o,i)=>o.visible=enabled?false:visibility[i]);if(!enabled)return{time:0,stage:'Retained creator exterior'};
  const reach=t<6?smooth(t/6):t<8?1:1-smooth((t-8)/4);
  // A single selected arm collects; other arms retain their neutral articulation.
  if(reach>0)solve(chains[0],home[0].clone().lerp(target[0],reach));m.root.updateMatrixWorld(true);for(const o of m.aureliaSurface.meshes)o.skeleton?.update();
  for(let a=0;a<4;a++){rebuild(a);dots[a].visible=a===0&&t<19;if(a!==0)continue;if(t<6)dots[a].position.copy(target[a]);else{const u=1-smooth((t-8)/10),q=surface(curves[a],u,.60).addScaledVector(frame(curves[a],u).down,.014);dots[a].position.copy(t<8?target[a].clone().lerp(q,smooth((t-6)/2)):q);}}
  return{time:t,stage:t<6?'Arm approaches marginal food pouch':t<8?'Selected arm collects material':t<18?'Proximal transport along lateral tract':t<20?'Arrival near mouth; internal routing omitted':'Study complete — digestion not simulated',contactError:chains[0].at(-1).getWorldPosition(V()).distanceTo(m.root.localToWorld(target[0].clone()))};
 }
 pose(0,false);const hide=()=>{root.visible=false;oral.forEach((o,i)=>o.visible=visibility[i]);};return{root,chains,oral,sheets,dots,curves,home,target,pose,surface,hide};
}




export function animateAureliaFeeding(m,motion,t){
 const st=m.aureliaFeeding;if(!st)return false;
 if(motion!=='forage'){if(st.active)st.hide();st.active=false;delete m.movementStudy;delete m.root.userData.movementStudy;m.hideDevelopmentLandmarks=false;return false;}
 m.mixer.stopAllAction();st.active=true;const state=st.pose(t);m.movementStudy={...state,duration:DURATION,finite:true,loop:false};m.root.userData.movementStudy=m.movementStudy;m.hideDevelopmentLandmarks=true;return true;
}
