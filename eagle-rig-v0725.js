export const EAGLE_SIDES = [
  {sign:-1, shoulder:1, elbow:2, wrist:3, hip:7, hock:8, ankle:9, toes:[10,11,12,13]},
  {sign:1, shoulder:4, elbow:5, wrist:6, hip:14, hock:15, ankle:16, toes:[17,18,19,20]}
];
export const HEAD = 21;
export const TAIL = 22;
export const SUPPORT_Y = .0025;
export const FOOT_SCALE = .86;
export const FOOT_REFERENCE_Y = .054;
export const STAND_ANKLE_Y = SUPPORT_Y + (FOOT_REFERENCE_Y - SUPPORT_Y)*FOOT_SCALE;
export const FOOT_ANCHOR_X = -.147;

const digitRoots = [
  [-.011,.046,-.008],[.005,.045,-.021],[.011,.046,.001],[.002,.044,.022]
];

export function eagleSkeleton() {
  const bones = [{name:'Body',parent:-1,point:[0,0,0]}];
  function joint(index,name,parent,point) { bones[index]={name,parent,point}; }
  for (const s of EAGLE_SIDES) {
    const side = s.sign<0 ? 'Left' : 'Right';
    joint(s.shoulder,side+' shoulder',0,[.062,.645,s.sign*.248]);
    joint(s.elbow,side+' elbow',s.shoulder,[-.065,.646,s.sign*.584]);
    joint(s.wrist,side+' wrist',s.elbow,[.029,.663,s.sign*.951]);
    joint(s.hip,side+' feathered leg',0,[-.090,.450,s.sign*.11]);
    joint(s.hock,side+' hock',s.hip,[-.110,.240,s.sign*.11]);
    joint(s.ankle,side+' toe base',s.hock,[-.105,.034,s.sign*.11]);
    const [x,y,z] = bones[s.ankle].point;
    for (const [i,toe] of s.toes.entries()) {
      const [dx,dy,dz] = digitRoots[i];
      joint(toe,side+' digit '+['I','II','III','IV'][i],s.ankle,
        [x+dx*FOOT_SCALE,y+(dy-FOOT_REFERENCE_Y)*FOOT_SCALE,z+s.sign*dz*FOOT_SCALE]);
    }
  }
  joint(HEAD,'Head and upper neck',0,[.36,.62,0]);
  joint(TAIL,'Tail',0,[-.30,.58,0]);
  return bones;
}
