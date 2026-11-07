import * as T from 'three';

// Qualitative, slowed external kinematics. No speed, thrust or neural pathway
// is inferred from these authored angles or the normalized display trajectory.
// Bounds union of sampled actual poses, padded by 0.07 display units.
const escapeBounds={"palaemon-serratus":{"min":[-1.9999035154336005,0.07,-0.40379618235707376],"max":[1.580922248667703,1.7318611260990864,0.40379618235707376]},"crangon-crangon":{"min":[-1.630987622861329,0.07,-1.2431757028384298],"max":[1.575057797302427,1.9261748883327865,0.7695680495102428]}};
const smooth=(t,a,b)=>T.MathUtils.smoothstep(t,a,b);
const pulse=(t,a,b,c)=>smooth(t,a,b)*(1-smooth(t,b,c));
export function carideanEscape(m,r,time){
 const bounds=escapeBounds[m.id];m.motionBounds??={};m.motionBounds.escape??=new T.Box3(new T.Vector3(...bounds.min),new T.Vector3(...bounds.max));
 const t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,8),prawn=r.p.prawn;
 let flex=0,travel=0;
 const starts=prawn?[.8,2.4,4.0]:[1.0];
 for(const start of starts){flex+=pulse(t,start,start+.38,start+1.15);travel+=smooth(t,start,start+1.15);}
 const lift=smooth(t,.05,.8)*(1-smooth(t,6.3,8));
 // Palaemon: successive abdominal flexions. Crangon: largely opposing
 // cephalothorax/abdomen flexion, concentrated near somites 2–3, plus an
 // expanded antennal-scale head fan. The escape path is lateral, not directly backwards.
 const pitch=-(prawn?.12:.66)*flex,pivot=new T.Vector3(-r.p.L*.43-(prawn?0:r.p.tail[0]+r.p.tail[1]),r.p.Y,0);
 r.body.rotation.z=pitch;
 r.body.position.copy(pivot).sub(pivot.clone().applyAxisAngle(new T.Vector3(0,0,1),pitch));
 for(let j=0;j<6;j++)r.tail[j].o.rotation.z=r.tail[j].base+(prawn?[.22,.36,.43,.40,.30,.18][j]:[.10,.35,.80,.10,.04,.025][j])*flex;
 for(const f of r.fans)f.o.rotation.y=f.base+Math.sign(f.base)*.15*flex;
 for(const scale of r.scales)scale.o.rotation.y=scale.sign*(prawn?.07:.40)*flex;
 for(const a of r.antennae)a.o.rotation.y=a.sign*.17*flex;
 // Existing fixed-length supports are folded toward the ventral body, not
 // stretched or scaled. They remain attached to the pitching cephalothorax.
 for(const leg of r.legs){const foot=leg.baseFoot.clone();foot.x-=.10*lift;foot.y+=.22*lift;foot.z*=1-.26*lift;leg.pose(foot);}
 for(const c of r.claws){c.o.rotation.y=-c.sign*.12*lift;c.o.rotation.z=-.13*lift;}
 const roll=prawn?0:Math.PI*.46*smooth(t,.9,1.38)*(1-smooth(t,5.7,7.8));
 const center=new T.Vector3(-.5,r.p.Y,0).multiplyScalar(m.root.scale.x),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),roll);
 m.root.quaternion.copy(q);m.root.position.add(center.clone().sub(center.clone().applyQuaternion(q)));
 m.root.position.x-=(prawn?.30:.12)*travel*m.root.scale.x;
 if(!prawn)m.root.position.z+=.60*travel*m.root.scale.z;
 m.root.position.y+=2.2*lift*m.root.scale.y;
 const stage=t>=8?'Study complete':t<.8?'Preparation and appendage folding':t>6.3?'Recovery to supported posture':flex>.55?'Abdominal power flexion':flex>.02?'Re-extension':prawn?'Between tail flips':'Side-oriented recovery';
 m.movementStudy={duration:8,time:t,stage};
 m.root.userData.movementStudy={...m.movementStudy,finite:true,measured:false};
 m.root.userData.escapeStudy={version:'0.6.86',flex,roll,tailFlips:starts.length,headFan:!prawn,measured:false};
}
