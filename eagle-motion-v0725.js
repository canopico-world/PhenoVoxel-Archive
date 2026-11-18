import * as T from 'three';
import {prepareBird} from './bird-reconstruction.js';
import {baldEagleFlightPose} from './eagle-motion-v0724.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
import {EAGLE_SIDES,eagleSkeleton,HEAD,TAIL,SUPPORT_Y,STAND_ANKLE_Y,FOOT_ANCHOR_X} from './eagle-rig-v0725.js';

export const TAKEOFF_RELEASE = 1;
export const LANDING_CONTACT = 2.16;
export const TRANSITION_DURATION = 4.4;
export const STANDING_POSE={x:.13,y:.144,pitch:.69};
const {x:STANDING_X,y:STANDING_Y,pitch:STANDING_PITCH}=STANDING_POSE;
const TAIL_CLEARANCE=.255;
const smooth=T.MathUtils.smoothstep, mix=T.MathUtils.lerp, clamp=T.MathUtils.clamp;
const Z_AXIS=new T.Vector3(0,0,1), UP=new T.Vector3(0,1,0);
const v=(...xyz)=>new T.Vector3(...xyz);
const definition=eagleSkeleton();
const extended=['fly','glide','bank'];

const takeoffTrack = [
  [0,STANDING_X,STANDING_Y,STANDING_PITCH,1],
  [.30,.129,.142,.682,.992], [.68,.085,.025,.51,.67],
  [.84,.108,.059,.514,.36], [1,.156,.115,.52,.018],
  [1.23,.330,.292,.31,0], [1.68,.636,.498,.13,0],
  [2.42,.968,.728,.06,0], [3.47,1.290,.864,.025,0], [4.4,1.438,.910,.02,0]
];

const landingTrack = [
  [0,-1.520,.968,-.056,0], [.62,-1.076,.744,-.029,0],
  [1.23,-.574,.465,.150,0], [1.66,-.279,.254,.395,0],
  [1.92,-.092,.178,.55,0], [2.16,.052,.141,.683,0],
  [2.36,.112,.102,.714,.175], [2.72,.13,.132,.695,.665], [3.42,STANDING_X,STANDING_Y,STANDING_PITCH,1],
  [4.4,STANDING_X,STANDING_Y,STANDING_PITCH,1]
];

// Shape-preserving Hermite interpolation avoids overshoot at the ground and
// keeps movement continuous when loading transfers from the wings to the feet.
function trackAt(keys,time) {
  const right=keys.findIndex(([at])=>at>time);
  if (right<1) return keys[right===0?0:keys.length-1].slice(1);
  const a=keys[right-1], b=keys[right], span=b[0]-a[0];
  const u=(time-a[0])/span, u2=u*u, u3=u2*u;
  function slope(i,k) {
    if (i===0||i===keys.length-1) return 0;
    const left=(keys[i][k]-keys[i-1][k])/(keys[i][0]-keys[i-1][0]);
    const next=(keys[i+1][k]-keys[i][k])/(keys[i+1][0]-keys[i][0]);
    return left*next>0 ? 2*left*next/(left+next) : 0;
  }
  return a.slice(1).map((value,i)=>
    (2*u3-3*u2+1)*value+(u3-2*u2+u)*span*slope(right-1,i+1)
    +(-2*u3+3*u2)*b[i+1]+(u3-u2)*span*slope(right,i+1));
}

function transitionState(action,time) {
  const takeoff=action==='takeoff';
  const t=clamp(time,0,TRANSITION_DURATION);
  const [x,y,pitch,fold]=trackAt(takeoff?takeoffTrack:landingTrack,t);
  if (takeoff) {
    const wingPhase=(t-TAKEOFF_RELEASE)*Math.PI*2*2.24;
    const active=1-smooth(t,2.60,3.36);
    const open=smooth(t,.51,.97);
    const arm=t<TAKEOFF_RELEASE? .46*open : active*(.39*Math.cos(wingPhase)+.073*Math.cos(2*wingPhase));
    const reach=1-smooth(t,TAKEOFF_RELEASE,1.58);
    const tailRelax=smooth(t,1.05,1.55);
    return {
      x,y,pitch,fold,arm,hand:.13*active*open*Math.cos(Math.max(0,wingPhase)+.45),
      sweep:.10*active*open*Math.max(0,-Math.sin(wingPhase)),twist:.045*active*open,
      tailFan:mix(-.45,.4,open)*(1-smooth(t,1.3,3.15)),tailPitch:mix(-pitch-TAIL_CLEARANCE,-.032,tailRelax),
      support:true,grounded:t<=TAKEOFF_RELEASE,footMix:reach,footX:FOOT_ANCHOR_X,
      footY:STAND_ANKLE_Y+.071*smooth(t,TAKEOFF_RELEASE,1.30),toeCurl:.97*(1-reach),
      stage:t<.39?'Two feet planted':t<.79?'Crouch and spread the wings':t<=TAKEOFF_RELEASE?'Leg extension and push-off':t<1.48?'First downstroke and foot clearance':t<3.24?'Climb and tuck the feet':'Extended glide'
    };
  }

  const flare=smooth(t,1.02,1.94)*(1-smooth(t,2.25,2.87));
  const hold=.24*smooth(t,2.19,2.45)*(1-smooth(t,2.52,2.94));
  const reach=smooth(t,1.12,1.76);
  return {
    x,y,pitch,fold,arm:.015+.43*flare+hold,hand:.19*flare,sweep:-.20*flare,twist:.13*flare,
    tailFan:.88*flare-.45*fold,tailPitch:-(pitch+TAIL_CLEARANCE)*smooth(t,1.35,2.09)-.06*flare,
    support:true,grounded:t>=LANDING_CONTACT,footMix:reach,
    footX:FOOT_ANCHOR_X-.425*(1-smooth(t,1.18,LANDING_CONTACT)),
    footY:STAND_ANKLE_Y+.29*(1-smooth(t,1.38,LANDING_CONTACT)),toeCurl:.97*(1-reach),
    stage:t<1.02?'Wings extended on approach':t<1.84?'Flare and feet reach forward':t<LANDING_CONTACT?'Both feet aligned for contact':t<2.5?'Touchdown and leg flexion':t<3.41?'Wings fold after contact':'Two feet planted'
  };
}

export function unifiedEaglePose(action,time=0) {
  const t=Number.isFinite(time)?Math.max(0,time):0;
  if (action==='takeoff'||action==='landing') return {...transitionState(action,t),duration:TRANSITION_DURATION};
  if (extended.includes(action)) {
    const flight=baldEagleFlightPose(action,t);
    return {
      ...flight,x:flight.advance,y:flight.height-.22,fold:0,tailFan:0,tailPitch:-.02,
      footMix:0,footX:FOOT_ANCHOR_X,footY:STAND_ANKLE_Y,toeCurl:.97,duration:8
    };
  }
  return {
    x:STANDING_X,y:STANDING_Y,pitch:STANDING_PITCH,fold:1,arm:0,hand:0,sweep:0,twist:0,
    tailFan:-.45,tailPitch:-STANDING_PITCH-TAIL_CLEARANCE,grounded:true,support:true,footMix:1,
    footX:FOOT_ANCHOR_X,footY:STAND_ANKLE_Y,toeCurl:0,duration:action==='look'?8:0,
    headTurn:action==='look'?.22*Math.sin(Math.PI*t/4)*smooth(t,0,.5)*(1-smooth(t,7.35,8)):0,
    stage:action==='look'?'Two-foot stance and head turn':'Folded wings and two-foot support'
  };
}

function wingFrame(direction,normal,side) {
  const z=direction.clone().normalize().multiplyScalar(side);
  const y=normal.clone().addScaledVector(z,-normal.dot(z)).normalize();
  const x=y.clone().cross(z).normalize();
  return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));
}
function restWingAxes(s) {
  const shoulder=v(...definition[s.shoulder].point);
  const elbow=v(...definition[s.elbow].point);
  const wrist=v(...definition[s.wrist].point);
  return [elbow.clone().sub(shoulder),wrist.sub(elbow),v(0,0,s.sign)];
}
export function eagleWingFold(s) {
  const closed=[
    [v(-.94,-.315,s.sign*.095),v(0,.18,s.sign*.98)],
    [v(.965,.261,s.sign*.035),v(0,.22,s.sign*.975)],
    [v(-.965,.248,-s.sign*.055),v(0,.09,s.sign*.994)]
  ];
  const rest=restWingAxes(s);
  return closed.map(([axis,normal],i)=>wingFrame(axis,normal,s.sign).multiply(wingFrame(rest[i],UP,s.sign).invert()));
}

const rotation=new T.Euler(0,0,0,'YXZ');
const orientation=(x,y,z)=>new T.Quaternion().setFromEuler(rotation.set(x,y,z,'YXZ'));
function wingArticulation(open,closed,rest,side,amount,roll) {
  const aim=rest.clone().applyQuaternion(open).lerp(rest.clone().applyQuaternion(closed),amount);
  const normal=UP.clone().applyQuaternion(open).lerp(UP.clone().applyQuaternion(closed),roll);
  return wingFrame(aim,normal,side).multiply(wingFrame(rest,UP,side).invert());
}

function poseWings(r,pose) {
  for (const [i,s] of EAGLE_SIDES.entries()) {
    const side=s.sign, bank=pose.bank||0;
    const openShoulder=orientation(-side*(pose.arm+side*.09*bank),-side*.44*pose.sweep,0);
    const openElbow=openShoulder.clone().multiply(orientation(side*.026*pose.arm,-side*.23*pose.sweep,0));
    const openWrist=openElbow.clone().multiply(orientation(-side*pose.hand,-side*.77*pose.sweep,pose.twist));
    const {folded:close,axes}=r.wings[i];
    const roll=smooth(pose.fold,.43,1);
    const upper=wingArticulation(openShoulder,close[0],axes[0],side,smooth(pose.fold,.15,1),roll);
    const fore=wingArticulation(openElbow,close[1],axes[1],side,smooth(pose.fold,.18,1),roll);
    const hand=wingArticulation(openWrist,close[2],axes[2],side,smooth(pose.fold,.24,1),roll);
    r.bones[s.shoulder].quaternion.copy(upper);
    r.bones[s.elbow].quaternion.copy(upper.clone().invert().multiply(fore));
    r.bones[s.wrist].quaternion.copy(fore.clone().invert().multiply(hand));
  }
}

function legDefinition(s) {
  const hipPoint=v(...definition[s.hip].point);
  const upper=v(...definition[s.hock].point).sub(hipPoint);
  const lower=v(...definition[s.ankle].point).sub(v(...definition[s.hock].point));
  return {...s,hipPoint,upper,lower,a:upper.length(),b:lower.length()};
}

const digitCurl=[.86,-.72,-.87,-.61];
function poseLegs(r,pose) {
  const pitch=pose.pitch||0;
  const tuck=v(-.195,.288,0);
  for (const {hip,hipPoint,upper,lower,a,b,sign,hock,ankle,toes} of r.legs) {
    const target=v(pose.footX-pose.x,pose.footY-pose.y,sign*.11).applyAxisAngle(Z_AXIS,-pitch);
    target.lerp(tuck.clone().setZ(sign*.11),1-pose.footMix);
    const delta=target.sub(hipPoint);
    const distance=clamp(delta.length(),Math.abs(a-b)+.0005,a+b-.0005);
    const along=(a*a-b*b+distance*distance)/(2*distance);
    const bend=Math.sqrt(Math.max(0,a*a-along*along));
    const axis=delta.normalize();
    const knee=axis.clone().multiplyScalar(along).addScaledVector(v(axis.y,-axis.x,0),bend);
    const shin=axis.multiplyScalar(distance).sub(knee);
    const upperTurn=Math.atan2(knee.y,knee.x)-Math.atan2(upper.y,upper.x);
    const lowerTurn=Math.atan2(shin.y,shin.x)-Math.atan2(lower.y,lower.x);
    r.bones[hip].rotation.z=upperTurn;
    r.bones[hock].rotation.z=lowerTurn-upperTurn;
    r.bones[ankle].rotation.z=mix(-2.06,-pitch,pose.footMix)-lowerTurn;
    for (const [i,digit] of toes.entries())
      r.bones[digit].rotation.z=pose.toeCurl*digitCurl[i];
  }
}

export function prepareUnifiedEagle(gltf,s,asset) {
  const m=prepareBird(gltf,s,asset), r=m.birdRevision;
  r.rebuilt=true;
  r.unifiedEagle=true;
  r.version=asset.eagleVersion||'0.7.25';
  r.standingScan=asset.eagleVersion==='0.7.26';
  if (r.standingScan) {
    r.rectrices=r.parts.find(mesh=>mesh.name==='Adult_tail_rectrices');
    if (r.body.morphTargetDictionary?.['Standing scan contour']!==2||!r.rectrices) {
      throw Error('Standing scan contour or shared tail feathers are missing');
    }
  }
  r.wings=EAGLE_SIDES.map(side=>({folded:eagleWingFold(side),axes:restWingAxes(side)}));
  r.legs=EAGLE_SIDES.map(legDefinition);
  r.feet=r.parts.find(mesh=>mesh.name.includes('scuted_feet'));
  r.talons=r.parts.find(mesh=>mesh.name.includes('curved_talons'));
  if (!r.feet||!r.talons||r.bones.length!==definition.length) throw Error('Unified eagle rig is incomplete');
  r.ground.geometry.dispose();
  r.ground.geometry=new T.CylinderGeometry(.61,.633,.033,64);
  r.ground.position.set(-.027,SUPPORT_Y-.0165,0);
  r.ground.rotation.set(0,0,0);
  r.ground.name='Flat contact reference';
  r.ground.material.color.set('#535950');
  r.ground.userData.cameraContext=true;
  r.ground.userData.beyondIgnore=true;
  r.fill=new T.DirectionalLight('#e7e4dc',.68);
  r.fill.name='Diffuse light from below';
  r.fill.position.set(.15,-2.4,1.1);
  r.fill.target.position.set(0,.48,0);
  r.fill.userData.cameraContext=true;
  r.fill.userData.beyondIgnore=true;
  m.root.add(r.fill,r.fill.target);
  for (const mesh of r.parts) {
    mesh.frustumCulled=false;
    if (mesh.material.normalMap) {
      const strength=r.standingScan?.24:.31;
      mesh.material.normalScale.setScalar(strength);
    }
  }
  m.featureBindings=[
    {bone:r.bones[HEAD],offset:v(.175,.06,.045),kind:'Modeled head and beak'},
    {bone:r.bones[16],offset:v(.054,-.024,.023),kind:'Modeled toe and talon region'},
    {bone:r.bones[6],offset:v(.022,.005,.23),kind:'Modeled wrist and primary region'}
  ];
  m.root.userData.birdScope='One continuous adult exterior. Takeoff and landing phase order is evidence-informed. Joint angles, speeds and forces remain illustrative.';
  animateUnifiedEagle(m,'observe',0);
  return m;
}

export function animateUnifiedEagle(m,action,time) {
  const r=m.birdRevision;
  const pose=unifiedEaglePose(action,time);
  const t=clamp(Number.isFinite(time)?time:0,0,pose.duration);
  m.root.position.set(0,0,0);
  m.content.position.set(pose.x,pose.y,0);
  m.content.rotation.set(pose.bank||0,0,pose.pitch||0,'XYZ');
  r.ground.visible=!!pose.support;
  r.fill.intensity=mix(.69,.22,pose.fold);
  r.bones[HEAD].rotation.set(0,pose.headTurn||0,-.85*(pose.pitch||0),'YXZ');
  r.bones[TAIL].rotation.set(0,.17*(pose.bank||0),pose.tailPitch);
  r.body.morphTargetInfluences[0]=pose.tailFan;
  r.body.morphTargetInfluences[1]=smooth(pose.fold,.49,1);
  if (r.standingScan) {
    const folded=smooth(pose.fold,.74,1);
    r.body.morphTargetInfluences[2]=folded;
    r.rectrices.morphTargetInfluences[0]=pose.tailFan;
    r.rectrices.morphTargetInfluences[2]=folded;
  }
  poseWings(r,pose);
  poseLegs(r,pose);
  m.root.updateMatrixWorld(true);
  for (const mesh of r.parts) mesh.skeleton.update();
  updateSpecimenLandmarks(m);
  const stage={stage:pose.stage,time:t,duration:pose.duration,complete:t>=pose.duration,finite:true,measured:false};
  r.current=stage;
  m.movementStudy=action==='observe'?undefined:stage;
  if (m.movementStudy) m.root.userData.movementStudy=stage;
  else delete m.root.userData.movementStudy;
  return true;
}
