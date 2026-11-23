import rig from './anatomy-rig-v0728.json' with {type:'json'};

export const anatomyBones=rig.bones;
export const ANATOMY_DURATION=8;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(x,a,b)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const segments=anatomyBones.map(b=>{
  const d=b.end.map((v,i)=>v-b.point[i]);
  return {a:b.point,d,denominator:Math.max(1e-8,d.reduce((n,v)=>n+v*v,0))};
});

export function anatomyPose(action,time=0){
  const t=clamp(Number.isFinite(time)?time:0,0,ANATOMY_DURATION);
  const active=['elbow','shoulder','knee'].includes(action);
  const envelope=smooth(t,.4,2.7)*(1-smooth(t,4.6,7.6));
  const radians=Math.PI/180;
  const turns=[];
  if(action==='elbow')turns.push([12,0,0,110*radians*envelope]);
  if(action==='shoulder')turns.push([10,-2*radians*envelope,0,0],[20,-4*radians*envelope,0,0],[11,-18*radians*envelope,0,0]);
  if(action==='knee')turns.push([18,0,0,-60*radians*envelope]);
  return {time:t,duration:active?ANATOMY_DURATION:0,turns,
    stage:!active?'Adult anatomical reference':t<.4?'Anatomical starting position':t<2.7?'Joint movement':t<4.6?'Hold the demonstration pose':t<7.6?'Return to anatomical position':'Anatomical starting position',
    complete:active&&t>=ANATOMY_DURATION};
}

export function rigidAnatomyBone(record){
  if(record.system!=='skeleton')return null;
  const name=record.name.toLowerCase();
  const side=record.side||(record.region.startsWith('left')?'left':record.region.startsWith('right')?'right':null);
  if(/mandib/.test(name))return 5;
  if(/clavicle|scapula/.test(name)&&side)return side==='left'?6:10;
  if(/humerus/.test(name)&&side)return side==='left'?7:11;
  if(/radius|ulna/.test(name)&&side)return side==='left'?8:12;
  if(/femur|patella/.test(name)&&side)return side==='left'?14:17;
  if(/tibia|fibula/.test(name)&&side)return side==='left'?15:18;
  if(record.region==='left-arm')return 9;
  if(record.region==='right-arm')return 13;
  if(record.region==='left-leg')return 16;
  if(record.region==='right-leg')return 19;
  const height=(record.low[1]+record.high[1])/2;
  return height>1.63?4:height>1.52?3:height>1.18?2:height>1.03?1:0;
}

export function anatomyWeights(x,y,z,rigid=null){
  if(rigid!==null)return [[rigid,1]];
  const nearest=[];
  for(let i=0;i<segments.length;i++){
    const {a,d,denominator}=segments[i];
    const dx=x-a[0],dy=y-a[1],dz=z-a[2];
    const along=clamp((dx*d[0]+dy*d[1]+dz*d[2])/denominator,0,1);
    const ex=dx-along*d[0],ey=dy-along*d[1],ez=dz-along*d[2];
    const distance=ex*ex+ey*ey+ez*ez;
    let at=0;
    while(at<nearest.length&&nearest[at][1]<distance)at++;
    if(at<4){nearest.splice(at,0,[i,distance]);if(nearest.length>4)nearest.pop();}
  }
  const contributions=nearest.map(([bone,distance])=>[bone,1/(distance+.0004)**3]);
  const total=contributions.reduce((sum,[,weight])=>sum+weight,0);
  return contributions.map(([bone,weight])=>[bone,weight/total]);
}
