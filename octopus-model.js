import {attachMolluscLandmarks,updateMolluscLandmarks} from './mollusca-landmarks.js';
import * as T from 'three';
import {octopusExteriorScope,octopusSkinDetail,octopusSkin,octopusPapillaDetail,octopusSuckerGeometry,octopusFunnelGeometry,octopusWebGeometry} from './octopus-exterior.js';
import {armStudyScope,armCurve,armFrame,armSurfaceGeometry,putArm,putCups,putWeb} from './octopus-arms.js';
import {attachOctopusBody,putBody} from './octopus-body.js';
import {toolkit} from './expansion-geometry.js';
import {V} from './mollusca-surfaces.js';
const rigs=new WeakMap();export const octopusRig=root=>rigs.get(root);
export function buildOctopus(s){
 const k=toolkit(),r={arms:[],cups:[],webs:[],skinDetail:octopusSkinDetail(),papillaDetail:octopusPapillaDetail(),curves:Array.from({length:8},(_,i)=>armCurve(i))},root=k.root;
 root.userData.preciseGround=true;root.userData.anatomyUnderside=[1,2];root.userData.octopusRevision={...armStudyScope,suckerRows:2,kinematics:armStudyScope.mechanism};root.userData.octopusExteriorScope=octopusExteriorScope;
 const skin=(mesh,pale=false)=>octopusSkin(mesh,r.skinDetail,pale,r.papillaDetail);attachOctopusBody(k,r,skin);
 const funnel=k.mesh(octopusFunnelGeometry(),'#b69c77',root,{side:T.DoubleSide});funnel.name='Open lateral funnel exterior and lumen';skin(funnel);const fc=funnel.geometry.attributes.color,fi=funnel.geometry.attributes.funnelInner;for(let j=0;j<fc.count;j++)if(fi.getX(j))fc.setXYZ(j,fc.getX(j)*.6,fc.getY(j)*.6,fc.getZ(j)*.6);r.funnel=funnel;
 const cupGeo=octopusSuckerGeometry();
 for(let i=0;i<8;i++){
  const arm=k.mesh(armSurfaceGeometry(),'#96734d',root,{side:T.DoubleSide});arm.name='Continuous arm '+(i+1);putArm(arm,r.curves[i]);skin(arm);r.arms.push(arm);
  const material=k.mat('#ffffff',{roughness:.43,side:T.DoubleSide,vertexColors:true}),cups=new T.InstancedMesh(cupGeo,material,76);cups.name='Two rows of open grooved sucker exteriors '+(i+1);cups.castShadow=true;root.add(cups);r.cups.push(cups);putCups(cups,r.curves[i]);
 }
 for(let i=0;i<8;i++){const web=k.mesh(octopusWebGeometry(),'#96734d',root,{side:T.DoubleSide});web.name='Thickened basal interbrachial web '+(i+1);putWeb(web,i,r.curves);skin(web);r.webs.push(web);}
 rigs.set(root,r);const m=k.finish(s,[[.28,.48,.39],[1.25,.11,.62],[-.60,.72,.10]]);m.octopus=true;pose(m,'observe',0);
 return attachMolluscLandmarks(m,s,[{mesh:r.arms[0],point:armFrame(r.curves[0],.35).p},{mesh:r.cups[1],instance:16,point:armFrame(r.curves[1],.25).p.add(V(0,-.12,0))},{mesh:r.funnel,point:V(.08,.40,-.64)}]);
}
function pose(m,a,t){
 const r=rigs.get(m.root),duration=T.MathUtils.clamp(t,0,armStudyScope.duration),key=a+':'+(a==='observe'?0:duration);if(r.poseKey===key)return;r.poseKey=key;
 r.curves=Array.from({length:8},(_,i)=>armCurve(i,duration,a));m.root.position.copy(m.expansionRig.home);m.root.position.x+=r.curves[0].state.progress*m.expansionRig.scale;
 for(let i=0;i<8;i++){putArm(r.arms[i],r.curves[i]);putCups(r.cups[i],r.curves[i]);putWeb(r.webs[i],i,r.curves);}putBody(r,r.curves);
 m.root.updateMatrixWorld(true);updateMolluscLandmarks(m);
}
export function animateOctopus(m,a,t){if(!m.octopus)return false;pose(m,['crawl','forage'].includes(a)?a:'observe',t);return true;}
