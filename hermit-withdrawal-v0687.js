import * as T from 'three';
const V=a=>new T.Vector3(...a),UP=V([0,1,0]),smooth=T.MathUtils.smoothstep;
const aim=(o,a,b)=>{o.position.copy(a);o.quaternion.setFromUnitVectors(UP,b.clone().sub(a).normalize());};
export function foldedChain(segments,hip,ankle,foot,A,B,pole){
 const delta=ankle.clone().sub(hip),d=delta.length(),axis=delta.divideScalar(d);
 if(d>A+B||d<Math.abs(A-B))throw Error('Unreachable withdrawal joint target '+JSON.stringify({d,A,B,ankle:ankle.toArray()}));
 const bend=pole.clone().addScaledVector(axis,-pole.dot(axis)).normalize(),along=(A*A-B*B+d*d)/(2*d);
 const knee=hip.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,A*A-along*along)));
 aim(segments[0],hip,knee);aim(segments[1],knee,ankle);if(segments[2])aim(segments[2],ankle,foot);
}
// A finite, authored illustration of the documented startle response. The
// hold time is a display choice, not a species-specific response latency.
export function hermitWithdrawal(m,r,time){
 const t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,9);
 const fold=smooth(t,.35,1.45)*(1-smooth(t,5.8,8.5)),retreat=smooth(t,.65,2.1)*(1-smooth(t,5.3,7.6));
 r.body.position.x=-.68*retreat;
 for(const l of r.legs){
  const foot=l.baseFoot.clone().lerp(V([.30-l.index*.10,.54,l.sign*.14]),fold);
  const initial=V([0,l.D*.42,-l.sign*Math.sqrt(l.D*l.D-(l.D*.42)**2)]);
  const final=V([-.82,.45,-l.sign*.25]).normalize().multiplyScalar(l.D);
  const direction=initial.normalize().lerp(final.clone().normalize(),fold).normalize().multiplyScalar(l.D);
  const ankle=foot.clone().add(direction),pole=V([.20*(l.index-1),.70,0]).lerp(V([-1,.08,l.sign*.10]),fold);
  foldedChain(l.segments,l.hip,ankle,foot,l.A,l.B,pole);l.foot.copy(foot);l.contact=fold===0;
 }
 for(const c of r.claws){
  const target=V([c.major?-.17:-.22,c.major?.30:.46,c.major?-.07:.19]).sub(r.body.position).sub(c.o.position);
  const wrist=c.restWrist.clone().lerp(target,fold),pole=c.restElbow.clone().lerp(V([-.8,.1,c.sign*.3]),fold);
  wrist.z+=c.sign*.15*Math.sin(Math.PI*fold);
  foldedChain(c.arm,V([0,0,0]),wrist,null,c.armLengths[0],c.armLengths[1],pole);
  c.hand.position.copy(wrist);c.hand.quaternion.copy(c.restHand).slerp(new T.Quaternion().setFromEuler(new T.Euler(0,c.major?0:.2,Math.PI/2)),fold);
  c.hinge.rotation.y=-c.sign*.008*(1-fold);
 }
 for(const eye of r.eyes){eye.o.rotation.y=-eye.sign*1.45*fold;eye.o.rotation.z=-.65*fold;}
 for(const a of r.antennae){a.o.rotation.y=a.sign*1.7*fold;a.o.rotation.z=-.28*fold;}
 for(const a of r.flagella)a.fold(fold);
 // Transfer support from the walking feet to the shell lip. The shelter must
 // not float after the walking limbs leave the substrate. All geometry moves
 // together; the shell is never scaled or dragged backwards with the body.
 m.root.position.y-=Math.min(r.shellBottom,.54*fold)*m.root.scale.y;
 const stage=t>=9?'Study complete':t<.35?'Supported exterior':t<1.45?'Appendages folding':t<2.1?'Retraction into shell':t<5.3?'Major right chela guards the aperture':t<8.5?'Re-emergence':'Supported recovery';
 m.movementStudy={duration:9,time:t,stage};m.root.userData.movementStudy={...m.movementStudy,finite:true,measured:false};
 m.root.userData.withdrawalStudy={fold,retreat,version:'0.6.87',measured:false};
}

