import * as T from 'three';
const V=()=>new T.Vector3();
export function penguinPhase(i,t){return ((t*.65-i*.5)%1+1)%1;}
export function preparePenguinSupport(mesh,bones){
 mesh.updateMatrixWorld(true);mesh.skeleton.update();const p=mesh.geometry.attributes.position,used=new Set(mesh.geometry.index?.array||Array.from({length:p.count},(_,i)=>i));return [3,4].map(bone=>{const samples=[];for(const i of used){let w=0;for(let k=0;k<4;k++)if(mesh.geometry.attributes.skinIndex.getComponent(i,k)===bone)w+=mesh.geometry.attributes.skinWeight.getComponent(i,k);if(w>.45&&p.getY(i)<.6)samples.push(i);}const min=()=>Math.min(...samples.map(i=>mesh.getVertexPosition(i,V()).y));return {bone,samples,sole:min(),frame:bones[bone].quaternion.clone()};});
}
export function animatePenguinFeet(m,r,t){
 for(let i=0;i<2;i++){const foot=r.penguinFeet[i],bone=r.bones[foot.bone],u=penguinPhase(i,t),stance=.66,swing=Math.max(0,(u-stance)/(1-stance)),lift=u<stance?0:.07*Math.sin(Math.PI*swing);bone.position.x+=u<stance?.09*(u/stance-.5):.09*(.5-swing);bone.quaternion.copy(foot.frame);for(let pass=0;pass<5;pass++){m.root.updateMatrixWorld(true);r.mesh.skeleton.update();const low=Math.min(...foot.samples.map(j=>r.mesh.getVertexPosition(j,V()).y));const d=foot.sole+lift-low;if(!Number.isFinite(d)||Math.abs(d)<.001)break;bone.position.y+=d;}}
 // A small lateral sway is an authored posture cue; no mass/force inference.
 r.bones[0].position.z-=.035*Math.sin(t*.65*Math.PI*2);
}
export function eagleWingPose(action,t){
 const flap=action==='fly',phase=t*3.8;return {arm:flap?Math.sin(phase)*.40:.06,hand:flap?Math.sin(phase-.35)*.12:0,twist:flap?Math.cos(phase)*.055:0,leg:flap||action==='glide'?-.65:0};
}
