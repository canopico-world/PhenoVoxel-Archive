import * as T from 'three';

export const BALD_EAGLE_WINGBEAT_HZ = 2.53;
export const BALD_EAGLE_STUDY_SECONDS = 8;
const smooth = T.MathUtils.smoothstep;
const waveform = 2 * Math.PI * BALD_EAGLE_WINGBEAT_HZ;
const riseAndFall = (t, start, full, fade, end) => smooth(t,start,full) * (1 - smooth(t,fade,end));

export function baldEagleFlightPose(action, time) {
  const t = T.MathUtils.clamp(Number.isFinite(time)?time:0,0,BALD_EAGLE_STUDY_SECONDS);
  const flap = action === 'fly' ? riseAndFall(t,.3,.58,1.99,2.29) + riseAndFall(t,4.08,4.36,5.58,5.91) : 0;
  const phase = waveform*(t - .30);
  const lift = Math.cos(phase);
  const recovering = smooth(-Math.sin(phase),-.17,.92);
  const bank = action === 'bank' ? .245*Math.sin(t*Math.PI/4) : 0;
  const advancing = action === 'fly' || action === 'glide' || action === 'bank';
  return {
    time:t, flap, bank, lift,
    arm:.012 + flap*(.39*lift + .037*Math.cos(2*phase)),
    hand:flap*(.128*Math.cos(phase+.73) + .046*recovering),
    sweep:flap*(.044 + .183*recovering),
    twist:flap*(.067*Math.sin(phase+.26) - .021*recovering),
    pitch:action==='glide' ? -.029 : flap * .027*Math.sin(phase+.24),
    advance: advancing ? .57*t/8 : 0,
    height:1.04 - (action==='glide' ? .09*t/8 : 0) + flap*.014*Math.cos(phase+.52),
    stage: action==='fly' && flap>.05 ? (Math.sin(phase)>0?'Downstroke · open hand':'Upstroke · wrist folds back')
      : action==='fly' && t>=5.91 ? 'Coast with wings extended'
      : action==='bank' && Math.abs(bank)>.016 ? (bank>0?'Shallow right bank':'Shallow left bank')
      : 'Broad-wing glide'
  };
}

export function configureRevisedEagle(m) {
  const r = m.birdRevision;
  r.revisedEagle = true;
  r.version = '0.7.24';
  r.ground.geometry.dispose();
  r.ground.geometry = new T.CylinderGeometry(.50,.523,.034,64);
  r.ground.name = 'Flat standing support';
  r.ground.rotation.set(0,0,0);
  r.ground.position.set(.151,.0025-.017,0);
  r.ground.material.color.set('#535950');
  r.ground.userData.cameraContext = true;
  r.ground.userData.beyondIgnore = true;
  r.ground.visible = false;
  m.root.add(r.ground);
  r.flightFill = new T.DirectionalLight('#e7e4dc',.78);
  r.flightFill.name = 'Diffuse light from below';
  r.flightFill.position.set(.12,-2.4,1.1);
  r.flightFill.target.position.set(0,.48,0);
  r.flightFill.userData.cameraContext = true;
  r.flightFill.userData.beyondIgnore = true;
  m.root.add(r.flightFill,r.flightFill.target);
  m.root.userData.birdScope = 'Adult exterior studies. The active wingbeat cadence is anchored to a preliminary field sample. Joint angles and travel are authored.';
  for (const mesh of r.parts) {
    if (mesh.material.normalMap) mesh.material.normalScale.setScalar(r.standingParts.includes(mesh)?.23:.31);
    mesh.frustumCulled = false;
  }
}

export function poseRevisedEagle(m, action, time, standing) {
  const r = m.birdRevision;
  r.ground.visible = standing;
  r.flightFill.visible = !standing;
  if (standing) return;

  const pose = baldEagleFlightPose(action,time);
  const bones = r.bones;
  m.root.position.set(pose.advance,pose.height,0);
  m.content.rotation.set(pose.bank,0,pose.pitch);
  for (const [side,arm,hand,leg] of [[-1,1,2,5],[1,3,4,7]]) {
    bones[arm].rotation.set(-side*(pose.arm+side*.09*pose.bank),-side*.44*pose.sweep,0,'YXZ');
    bones[hand].rotation.set(-side*pose.hand,-side*pose.sweep,pose.twist,'YXZ');
    bones[leg].rotation.z = -.98;
    bones[leg+1].position.x += .126;
    bones[leg+1].position.y += .043;
    bones[leg+1].rotation.z = .35;
  }
  bones[10].rotation.set(0,.16*pose.bank,-.022-.025*pose.flap);
  if (!['fly','glide','bank'].includes(action)) return;

  const complete = pose.time >= BALD_EAGLE_STUDY_SECONDS;
  m.movementStudy = {
    duration:BALD_EAGLE_STUDY_SECONDS,time:pose.time,complete,
    stage:pose.stage+(complete?' | end':'')
  };
  r.current = {...m.movementStudy};
  m.root.userData.movementStudy = {...m.movementStudy,finite:true,measured:false};
}

