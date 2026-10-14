import * as T from 'three';
import {solveTwoLink,rotateJoint} from './joint-kinematics.js';
import {setWorldFrame} from './paw-frames.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep;
// Original articulation of the credited generic crocodile artist surface.
// Display joints and angles are qualitative, not measured Nile-crocodile data.
export function createCrocodileRig(m){
 const root=m.root,bones=[],limbs=[],sources=[];root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)sources.push(o);});
 function bone(name,p,parent){const b=new T.Bone();b.name='PV_Crocodile_'+name;b.position.copy(p);if(parent){b.position.sub(parent.getWorldPosition(V()));parent.add(b);}else root.add(b);root.updateMatrixWorld(true);bones.push(b);return b;}
 const body=bone('Body',V(0,.40,0)),neck=bone('Neck',V(.98,.43,0),body),head=bone('Head',V(1.38,.45,0),neck),rear=bone('RearTrunk',V(.12,.40,0),body),tails=[];
 for(const x of [-.32,-.77,-1.20,-1.62])tails.push(bone('Tail'+tails.length,V(x,.40,0),tails.at(-1)||rear));
 for(const front of [true,false])for(const side of [-1,1]){const x=front?.90:.25,a=bone(`${front?'Fore':'Hind'}${side}Upper`,V(x,.42,.17*side),front?body:rear),b=bone('ElbowOrKnee'+bones.length,V(front?.84:.04,.28,.255*side),a),c=bone('WristOrAnkle'+bones.length,V(front?1.08:.25,front?.16:.145,.28*side),b);limbs.push({chain:[a,b,c],front,side,home:c.getWorldPosition(V()),samples:[]});}
 const skeleton=new T.Skeleton(bones),inverse=root.matrixWorld.clone().invert(),meshes=[];
 function axial(p){if(p.x>1.15){const u=smooth(p.x,1.15,1.48);return[1,1-u,2,u];}if(p.x<.05){const xs=[.12,-.32,-.77,-1.20,-1.62];for(let i=0;i<4;i++)if(p.x>=xs[i+1]){const u=T.MathUtils.clamp((xs[i]-p.x)/(xs[i]-xs[i+1]),0,1);return[i+3,1-u,i+4,u];}return[7,1,7,0];}return[0,1,0,0];}
 for(const source of sources){const g=source.geometry.clone().applyMatrix4(inverse.clone().multiply(source.matrixWorld)),p=g.attributes.position,ix=[],w=[];
  for(let i=0;i<p.count;i++){const point=V(p.getX(i),p.getY(i),p.getZ(i)),a=axial(point);let influences=[[a[0],a[1]],[a[2],a[3]]];
   if(point.x>-.05&&point.x<1.34){const front=point.x>.63,side=point.z<0?-1:1,l=limbs.find(l=>l.front===front&&l.side===side),base=bones.indexOf(l.chain[0]),leg=smooth(Math.abs(point.z),.135,.235)*(1-smooth(point.y,.29,.46));
    if(leg>0){const distal=1-smooth(point.y,.17,.28),upper=1-smooth(point.y,.29,.37);const li=distal>.01?[[base+1,1-distal],[base+2,distal]]:[[base,1-upper],[base+1,upper]];influences=[[a[0],a[1]*(1-leg)],[a[2],a[3]*(1-leg)],...li.map(([j,v])=>[j,v*leg])];}
   }
   const total=influences.reduce((sum,[,v])=>sum+v,0);for(let k=0;k<4;k++){ix.push(influences[k]?.[0]||0);w.push((influences[k]?.[1]||0)/total);}
  }
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ix,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(w,4));const mesh=new T.SkinnedMesh(g,source.material);mesh.name=source.name;mesh.userData={...source.userData,viewerRigAuthor:'PhenoVoxel Archive contributors',viewerRig:'Generic crocodile surface with independently authored articulation; taxonomy and biomechanics unvalidated'};mesh.castShadow=true;root.add(mesh);mesh.bind(skeleton);meshes.push(mesh);source.removeFromParent();
  for(const l of limbs){const distal=bones.indexOf(l.chain[2]);for(let i=0;i<p.count;i++){let weight=0;for(let k=0;k<4;k++)if(ix[i*4+k]===distal)weight+=w[i*4+k];if(weight>.85&&p.getY(i)<.185)l.samples.push([mesh,i]);}}
 }
 root.updateMatrixWorld(true);skeleton.calculateInverses();const home=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));limbs.forEach(l=>{l.frame=l.chain[2].getWorldQuaternion(new T.Quaternion());});
 m.features=[V(.55,.55,.09),V(-1.0,.45,.04),V(1.75,.36,.04)];m.featureBindings=[{bone:body,offset:body.worldToLocal(m.features[0].clone())},{bone:tails[1],offset:tails[1].worldToLocal(m.features[1].clone())},{bone:head,offset:head.worldToLocal(m.features[2].clone())}];m.crocodileRig={bones,skeleton,limbs,body,head,neck,rear,tails,home,meshes};return{kind:'crocodile',rigs:meshes.map(mesh=>({mesh,bones})),bases:[]};
}
export function animateCrocodile(m,action,t){
 const r=m.crocodileRig;if(!r)return false;const {bones,home,limbs,body,head,neck,tails,skeleton}=r;bones.forEach((b,i)=>{b.position.copy(home[i].p);b.quaternion.copy(home[i].q);});m.root.position.set(0,0,0);m.root.rotation.set(0,0,0);
 const swim=action==='swim',walk=action==='walk';
 if(action==='observe'){m.root.updateMatrixWorld(true);skeleton.update();return true;}
 if(swim){m.root.position.y=.35;tails.forEach((b,i)=>rotateJoint(m,b,V(0,1,0),Math.sin(t*2.8-i*.60)*(.075+i*.04)));for(const l of limbs){rotateJoint(m,l.chain[0],V(0,1,0),-l.side*(l.front?.24:.16));rotateJoint(m,l.chain[1],V(1,0,0),l.side*.12);}}
 else{
  if(action==='rest')body.position.y-=.050;
  if(action==='forage'){rotateJoint(m,neck,V(0,1,0),Math.sin(t*.6)*.08);rotateJoint(m,head,V(0,0,1),-.055);}
  for(const [i,l]of limbs.entries()){const u=(t*.38+[0,.5,.75,.25][i])%1,stance=.76,swing=walk&&u>stance,target=l.home.clone();if(walk){target.x+=u<stance?.105*(.5-u/stance):.105*(-.5+(u-stance)/(1-stance));target.y+=swing?.055*Math.sin((u-stance)/(1-stance)*Math.PI):0;}
   solveTwoLink(m,...l.chain,target,V(-.25,0,l.side));setWorldFrame(l.chain[2],l.frame);m.root.updateMatrixWorld(true);skeleton.update();
   if(!swing&&action!=='observe')for(let pass=0;pass<5;pass++){let min=Infinity;for(const[mesh,j]of l.samples)min=Math.min(min,mesh.getVertexPosition(j,V()).applyMatrix4(mesh.matrixWorld).y);if(!Number.isFinite(min)||Math.abs(min-.136)<.003)break;target.y+=T.MathUtils.clamp(.136-min,-.02,.02);solveTwoLink(m,...l.chain,target,V(-.25,0,l.side));setWorldFrame(l.chain[2],l.frame);m.root.updateMatrixWorld(true);skeleton.update();}
  }
 }
 m.root.updateMatrixWorld(true);skeleton.update();return true;
}
