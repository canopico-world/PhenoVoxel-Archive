import * as T from 'three';

export const emperorSwim = Object.freeze({ cadence: 1.35, duration: 8, glideDuration: 3 });

const smooth = T.MathUtils.smoothstep;
const lerp = T.MathUtils.lerp;
const axis = new T.Vector3(0, 1, 0);
const point = (x, y, z) => new T.Vector3(x, y, z).normalize();

export function poseEmperorPenguin(m, action, time) {
  const { bones, parts } = m.birdRevision;
  const swimming = action === 'swim';
  const diving = swimming || action === 'glide';
  const phase = (time - .35) * 2 * Math.PI * emperorSwim.cadence;
  const stroke = swimming ? smooth(time, 0, .43) * (1 - smooth(time, 5.25, 6.65)) : 0;
  const drawIn = swimming ? smooth(time, 5.15, 6.75) : 1;

  for (const mesh of parts) {
    if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[0] = diving ? 1 : 0;
  }

  for (const [side, index] of [[-1, 3], [1, 4]]) {
    const bone = bones[index];
    const original = point(.99, -1.10, side * .77);
    const target = diving
      ? point(lerp(-.025, .13, drawIn), lerp(-.18, -.50, drawIn), side * lerp(1, .86, drawIn))
      : point(.23, -1, side * .15);
    bone.quaternion.setFromUnitVectors(original, target);
    if (diving) {
      const lift = new T.Quaternion().setFromAxisAngle(axis, side * (.76 * Math.sin(phase) - .055) * stroke);
      const twist = new T.Quaternion().setFromAxisAngle(target, side * .13 * Math.cos(phase - .25) * stroke);
      bone.quaternion.premultiply(twist).premultiply(lift);
      bone.position.x += .10;
    }
  }

  if (!diving) return false;
  m.content.rotation.z = Math.PI / 2;
  m.content.position.set(1.75, 1.55, 0);

  const timeGliding = swimming ? Math.max(0, time - 6.65) : time;
  // Display displacement only. A decelerating authored path helps distinguish
  // a moving glide from a stationary inspection pose.
  const swimmingDistance = swimming ? .13 * Math.min(time, 6.65) : 0;
  m.root.position.x = -swimmingDistance - .36 * (1 - Math.exp(-.36 * timeGliding));
  const stage = !swimming ? 'Passive underwater glide'
    : time < .3 ? 'Flippers extend'
    : time >= 6.65 ? 'Passive underwater glide'
    : time >= 5.35 ? 'Stroke tapers; flippers sweep back'
    : Math.cos(phase) >= 0 ? 'Paired dorsal upstroke' : 'Paired ventral downstroke';
  const duration = swimming ? emperorSwim.duration : emperorSwim.glideDuration;
  const complete = time >= duration;
  m.movementStudy = { duration, time, complete, stage: complete ? stage + ' | end' : stage };
  m.birdRevision.current = m.movementStudy;
  m.root.userData.movementStudy = { ...m.movementStudy, finite: true, measured: false };
  return true;
}
