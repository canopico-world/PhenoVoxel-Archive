import {animateCheetahGallop} from './cheetah-gallop-v0691.js';
import * as T from 'three';
import {aimJoint,solveTwoLink} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),clamp=T.MathUtils.clamp,smooth=T.MathUtils.smoothstep;
// Desk-space joints fitted to this artist's asymmetric pose, not measured animal landmarks.
const core=[[-1.00,1.64,0],[-.50,1.69,0],[.22,1.75,0],[.79,1.83,0],[1.30,1.94,0],[-1.24,1.59,0],[-1.53,1.29,-.02],[-1.68,1.03,-.06],[-1.86,.90,-.12]];
const legs=[
 {name:'left hind',front:false,points:[[-1.03,1.64,.12],[-1.15,1.11,.12],[-1.51,.58,.10],[-1.40,.23,.10]],start:.30},
 {name:'left fore',front:true,points:[[.73,1.65,.19],[.64,1.05,.19],[.93,.53,.18],[1.13,.23,.18]],start:1.10},
 {name:'right hind',front:false,points:[[-1.01,1.64,-.16],[-.47,1.12,-.16],[-.53,.64,-.16],[-.15,.23,-.16]],start:1.90},
 {name:'right fore',front:true,points:[[.70,1.65,-.25],[.04,1.02,-.25],[.00,.48,-.25],[.04,.23,-.25]],start:2.70}
];
const stepLength=.30,swingDuration=1.15,duration=4.20;
// The source's far-side fore/hind toes intersect. Separate their stance targets
// along the travel axis on this same surface, then solve the complete chains.
// Desk-space offsets are authored clearance choices, not animal measurements.
const stanceOffset=[0,0,-.30,.30];
export function cheetahStep(index,time){const u=clamp((time-legs[index].start)/swingDuration,0,1);return{progress:smooth(u,0,1),lift:.105*Math.sin(Math.PI*u)**2,support:u===0||u===1};}
export const cheetahSequenceDuration=duration;
function segment(p,a,b){const d=b.clone().sub(a),u=clamp(p.clone().sub(a).dot(d)/d.lengthSq(),0,1);return{distance:p.distanceTo(a.clone().addScaledVector(d,u)),u};}
// Weld UV seams, then identify the four connected distal limbs. Spatial nearest-foot
// assignment alone incorrectly mixes the almost-touching right fore/hind paws.
function distalMembership(geometry){
 const p=geometry.attributes.position,n=p.count,parent=Array.from({length:n},(_,i)=>i),keys=new Map(),find=i=>parent[i]===i?i:parent[i]=find(parent[i]),join=(a,b)=>{parent[find(a)]=find(b);};
 for(let i=0;i<n;i++)if(p.getY(i)<1.1){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*10000)).join(',');if(keys.has(key))join(i,keys.get(key));else keys.set(key,i);}
 const ix=geometry.index?.array||Array.from({length:n},(_,i)=>i);for(let j=0;j<ix.length;j+=3)for(const[a,b]of[[ix[j],ix[j+1]],[ix[j+1],ix[j+2]],[ix[j],ix[j+2]]])if(p.getY(a)<1.1&&p.getY(b)<1.1)join(a,b);
 const groups=new Map();for(let i=0;i<n;i++)if(p.getY(i)<1.1){const k=find(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);}
 const membership=new Int8Array(n).fill(-1),claws=[];for(const ids of groups.values()){
  if(ids.length===37&&ids.every(i=>p.getY(i)<.38))claws.push(ids);
  const low=ids.filter(i=>p.getY(i)<.35);if(!low.length)continue;const center=low.reduce((s,i)=>s.add(V(p.getX(i),p.getY(i),p.getZ(i))),V()).divideScalar(low.length);
  let nearest=0,distance=Infinity;legs.forEach((l,i)=>{const d=center.distanceTo(V(...l.points[3]));if(d<distance){distance=d;nearest=i;}});if(distance<.42)ids.forEach(i=>membership[i]=nearest);
 }
 return{membership,claws};
}
// Topological tail membership excludes the nearby hind-leg skin.
function tailMembership(geometry){
 const p=geometry.attributes.position,ix=geometry.index.array,n=p.count,parent=Array.from({length:n},(_,i)=>i),find=i=>parent[i]===i?i:parent[i]=find(parent[i]),join=(a,b)=>parent[find(a)]=find(b),keys=new Map();
 for(let i=0;i<n;i++)if(p.getY(i)<1.45){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*10000)).join(',');if(keys.has(key))join(i,keys.get(key));else keys.set(key,i);}
 for(let j=0;j<ix.length;j+=3)for(const[a,b]of[[ix[j],ix[j+1]],[ix[j+1],ix[j+2]],[ix[j],ix[j+2]]])if(p.getY(a)<1.45&&p.getY(b)<1.45)join(a,b);
 const seeds=new Set();for(let i=0;i<n;i++)if(p.getX(i)<-1.7&&p.getY(i)>.7&&p.getY(i)<1.45)seeds.add(find(i));
 return new Set(Array.from({length:n},(_,i)=>i).filter(i=>p.getY(i)<1.45&&seeds.has(find(i))));
}
function smoothUpperWeights(g,tail){
 const p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,nodes=[],keys=new Map(),nodeOf=[];
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');let n=keys.get(key);if(n===undefined){n=nodes.length;keys.set(key,n);nodes.push({ids:[],neighbors:new Set(),p:V().fromBufferAttribute(p,i),weights:new Map(),fixed:p.getY(i)<.95||p.getY(i)>1.70||tail.has(i)||p.getX(i)>1.05&&p.getY(i)>1.48});}nodes[n].ids.push(i);nodeOf[i]=n;}
 for(const n of nodes){for(const i of n.ids)for(let k=0;k<4;k++){const b=si.array[i*4+k],w=sw.array[i*4+k]/n.ids.length;if(w)n.weights.set(b,(n.weights.get(b)||0)+w);}}
 const ix=g.index.array;for(let i=0;i<ix.length;i+=3)for(const[a,b]of [[ix[i],ix[i+1]],[ix[i+1],ix[i+2]],[ix[i+2],ix[i]]])if(nodeOf[a]!==nodeOf[b]){nodes[nodeOf[a]].neighbors.add(nodeOf[b]);nodes[nodeOf[b]].neighbors.add(nodeOf[a]);}
 for(let pass=0;pass<8;pass++){const next=nodes.map(n=>{if(n.fixed||!n.neighbors.size)return n.weights;const map=new Map([...n.weights].map(([b,w])=>[b,w*.4]));let total=0;for(const j of n.neighbors)total+=1/Math.max(.015,n.p.distanceTo(nodes[j].p));for(const j of n.neighbors){const factor=.6/Math.max(.015,n.p.distanceTo(nodes[j].p))/total;for(const[b,w]of nodes[j].weights)map.set(b,(map.get(b)||0)+w*factor);}return map;});nodes.forEach((n,i)=>n.weights=next[i]);}
 for(const n of nodes){const weights=[...n.weights].sort((a,b)=>b[1]-a[1]).slice(0,4),total=weights.reduce((a,b)=>a+b[1],0);for(const i of n.ids)for(let k=0;k<4;k++){si.array[i*4+k]=weights[k]?.[0]||0;sw.array[i*4+k]=(weights[k]?.[1]||0)/total;}}
}
function trunkWeights(v){if(v.x>.50){const u=smooth(v.x,.50,.96);return [[2,1-u],[3,u]];}const u=clamp((v.x+.88)/1.1,0,1)*2,a=Math.min(1,Math.floor(u));return [[a,1-(u-a)],[a+1,u-a]];}
export function createCheetahRig(m){
 m.root.updateMatrixWorld(true);const inverse=m.root.matrixWorld.clone().invert(),sources=[],rigs=[];m.root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)sources.push(o);});
 for(const source of sources){
  const geometry=source.geometry.clone().applyMatrix4(inverse.clone().multiply(source.matrixWorld)),p=geometry.attributes.position,bones=[],points=[],parents=[];
  core.forEach((point,i)=>{points.push(V(...point));parents.push([null,0,1,2,3,0,5,6,7][i]);});
  legs.forEach(l=>l.points.forEach((point,i)=>{points.push(V(...point));parents.push(i?points.length-2:l.front?2:0);}));
  points.forEach((point,i)=>{const b=new T.Bone();b.name=`PV_cheetah_${i<9?['pelvis','lumbar','thorax','neck','head','tail0','tail1','tail2','tail3'][i]:legs[Math.floor((i-9)/4)].name.replace(' ','_')+'_'+(i-9)%4}`;b.position.copy(point.clone().sub(parents[i]===null?V():points[parents[i]]));if(parents[i]!==null)bones[parents[i]].add(b);bones.push(b);});
  const tail=tailMembership(geometry),distal=distalMembership(geometry),member=distal.membership,si=[],sw=[],chains=legs.map(l=>l.points.map(q=>V(...q)));
  // Retain the artist topology/atlas, but shorten its conspicuous hooked claws.
  // The selected photographs and Smithsonian account support blunt visible tips;
  // the scale factors are qualitative author choices, not measured claw lengths.
  const colors=new Float32Array(p.count*3).fill(1);for(const ids of distal.claws){const high=Math.max(...ids.map(i=>p.getY(i))),anchor=ids.filter(i=>p.getY(i)>high-.012).reduce((sum,i)=>sum.add(V().fromBufferAttribute(p,i)),V());anchor.divideScalar(ids.filter(i=>p.getY(i)>high-.012).length);for(const i of ids){p.setXYZ(i,anchor.x+(p.getX(i)-anchor.x)*.55,anchor.y+(p.getY(i)-anchor.y)*.38,anchor.z+(p.getZ(i)-anchor.z)*.90);colors.set([.55,.53,.46],i*3);}}
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  for(let i=0;i<p.count;i++){
   const v=V().fromBufferAttribute(p,i);let weights=[];
   if(tail.has(i)||v.x<-1.22&&v.y>=1.45&&member[i]<0&&Math.min(...core.slice(5,8).map((q,j)=>segment(v,V(...q),V(...core[j+6])).distance))<.11){const u=clamp((-v.x-1.24)/.21,0,2.999),a=5+Math.floor(u);weights=[[a,1-u%1],[Math.min(a+1,8),u%1]];}
   else if(v.x>1.00&&v.y>1.48){const u=smooth(v.x,.99,1.35);weights=[[3,1-u],[4,u]];}
   else{
    let leg=member[i],nearest=Infinity;if(leg<0&&v.y<1.73)chains.forEach((chain,k)=>{const d=Math.min(...chain.slice(0,3).map((q,j)=>segment(v,q,chain[j+1]).distance));if(d<nearest){nearest=d;leg=k;}});
    if(leg>=0){const c=chains[leg],base=9+leg*4;let q=0,d=Infinity;for(let j=0;j<3;j++){const result=segment(v,c[j],c[j+1]);if(result.distance<d){d=result.distance;q=j+result.u;}}const joint=Math.round(q),nearJoint=joint>0&&joint<3&&Math.abs(q-joint)<.22,j=nearJoint?joint-1:Math.min(2,Math.floor(q)),blend=nearJoint?smooth(q,joint-.22,joint+.22):0,amount=(1-smooth(v.y,1.05,1.72))*(member[i]>=0?1:(1-smooth(nearest,.20,.40)))*(1-smooth(v.y,1.02,1.3)*(1-smooth(Math.abs(v.z),0,.18))),foot=1-smooth(v.y,.27,.46);const map=new Map([[base+j,amount*(1-blend)*(1-foot)],[base+j+1,amount*blend*(1-foot)]]);map.set(base+3,(map.get(base+3)||0)+amount*foot);for(const[b,w]of trunkWeights(v))map.set(b,(map.get(b)||0)+(1-amount)*w);weights=[...map].filter(w=>w[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,4);}

    else if(v.x>.50){const u=smooth(v.x,.50,.96);weights=[[2,1-u],[3,u]];}
    else{const u=clamp((v.x+.88)/1.1,0,1)*2,a=Math.min(1,Math.floor(u));weights=[[a,1-(u-a)],[a+1,u-a]];}
   }
   const total=weights.reduce((sum,w)=>sum+w[1],0);for(let k=0;k<4;k++){si.push(weights[k]?.[0]||0);sw.push((weights[k]?.[1]||0)/total);}
  }
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));smoothUpperWeights(geometry,tail);
  const material=source.material.clone();material.vertexColors=true;const mesh=new T.SkinnedMesh(geometry,material);mesh.name=source.name;mesh.userData={...source.userData,viewerRigAuthor:'PhenoVoxel Archive contributors',viewerRig:'Cheetah connected-limb skinning with bounded lateral stepping study; unmeasured'};source.removeFromParent();m.root.add(mesh);mesh.add(bones[0]);m.root.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));mesh.normalizeSkinWeights();mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius*=1.4;
  const used=[...new Set(geometry.index?.array||Array.from({length:p.count},(_,i)=>i))],feet=legs.map((l,i)=>({index:i,upper:9+i*4,front:l.front,paw:points[12+i*4].clone(),ankleOffset:points[12+i*4].clone().sub(points[11+i*4]),frame:bones[12+i*4].getWorldQuaternion(new T.Quaternion()),samples:used.filter(j=>member[j]===i&&p.getY(j)<.30)}));
  for(const f of feet){f.soleOffset=Math.min(...f.samples.map(i=>p.getY(i)))-f.paw.y;f.solePoints=f.samples.map(i=>V().fromBufferAttribute(p,i).sub(f.paw));}
  rigs.push({mesh,bones,feet,clawComponents:distal.claws.length,home:bones.map(b=>b.position.clone())});
 }
 const r=rigs[0];m.featureBindings=[{bone:r.bones[4],offset:V(.17,-.08,.10)},{bone:r.bones[2],offset:V(-.12,-.10,.26)},{bone:r.bones[16],offset:V(.02,-.03,0)}];Object.assign(m.root.userData,{focusAnatomy:true,anatomyFocusScale:[.42,.48,.36],foliageViewDirection:[0,.18,1],reproductiveViewDirection:[0,.18,1]});
 const bounds=new T.Box3().setFromObject(m.root,true);bounds.max.x+=stepLength+.08;m.motionBounds={walk:bounds,run:new T.Box3(V(-2.2,.04,-.95),V(5.3,2.7,.95))};
 return{kind:'cheetah',rigs,bases:[]};
}
export function animateCheetah(m,action,time){
 if(action==='run'){animateCheetahGallop(m,time);return true;}
 delete m.movementStudy;delete m.root.userData.movementStudy;delete m.root.userData.cheetahGallopStudy;
 const t=clamp(time,0,duration),body=stepLength*smooth(t,0,duration);if(action==='walk')m.root.position.x=body;
 for(const r of m.surfaceRig.rigs){const{bones,home,feet,mesh}=r;bones.forEach((b,i)=>{b.quaternion.identity();b.position.copy(home[i]);});
  if(action==='look'){const u=smooth(clamp(time/2,0,1),0,1);bones[3].rotation.y=.10*Math.sin(u*Math.PI);bones[4].rotation.y=.10*Math.sin(u*Math.PI);bones[6].rotation.y=.035*Math.sin(u*Math.PI);}
  if(action==='walk'){
   // A fixed authored trunk-lowering envelope creates recovery clearance. It is
   // not an automatic whole-animal floor lift or a measured vertical trajectory.
   bones[0].position.y-=.085*Math.sin(t/duration*Math.PI)**2;
   bones[1].rotation.y=.010*Math.sin(t/duration*2*Math.PI);bones[2].rotation.y=-.010*Math.sin(t/duration*2*Math.PI);for(let k=5;k<=8;k++)bones[k].rotation.y=.018*Math.sin(t/duration*2*Math.PI-(k-5)*.20)*Math.sin(t/duration*Math.PI);
  }
   for(const f of feet){const walking=action==='walk',step=walking?cheetahStep(f.index,t):{progress:0,lift:0},paw=f.paw.clone(),u=walking?clamp((t-legs[f.index].start)/swingDuration,0,1):0,pitch=new T.Quaternion().setFromAxisAngle(V(0,0,1),-(f.front?.42:.24)*Math.sin(u*Math.PI));paw.x+=stanceOffset[f.index]+(walking?stepLength*step.progress-body:0);
    const sole=Math.min(...f.solePoints.map(p=>p.clone().applyQuaternion(pitch).y));paw.y=.13+step.lift-sole;
    const ankle=paw.clone().sub(f.ankleOffset);solveTwoLink(m,bones[f.upper],bones[f.upper+1],bones[f.upper+2],ankle,V(f.front?-1:1,0,0));aimJoint(m,bones[f.upper+2],bones[f.upper+3],paw);setWorldFrame(bones[f.upper+3],m.root.getWorldQuaternion(new T.Quaternion()).multiply(pitch).multiply(f.frame));
   }
 }
 m.root.updateMatrixWorld(true);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});return true;
}


