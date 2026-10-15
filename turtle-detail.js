import * as T from 'three';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),smooth=T.MathUtils.smoothstep;
// Independent pigment illustration, with no copied photographic pixels.
export function greenTurtlePigment(p,n){
 const shell=p.y>.67&&p.x<1.08&&p.x>-1.44&&Math.abs(p.z)<.95,noise=Math.sin(p.x*13+p.z*9)*Math.cos(p.y*11-p.z*7);
 if(shell){const centers=[...[-.93,-.52,-.12,.30,.68].map(x=>[x,0]),...[-1,1].flatMap(side=>[-.9,-.43,.06,.54].map(x=>[x,side*.54]))];let cell=centers[0],distance=Infinity;for(const c of centers){const d=Math.hypot((p.x-c[0])*1.02,p.z-c[1]);if(d<distance){distance=d;cell=c;}}const angle=Math.atan2(p.z-cell[1],p.x-cell[0]),streak=.5+.3*Math.sin(angle*5+distance*8+cell[0]*7)+.2*Math.sin(angle*11-distance*7+cell[0]*11);return new T.Color('#584b35').lerp(new T.Color('#a59166'),.35+.12*streak+.06*noise);}
 if(n.y<-.15||p.y<.37&&Math.abs(p.z)<.70&&p.x<1.1)return new T.Color('#c5b98e').multiplyScalar(.97+noise*.015);
 const size=p.x>1.1?.12:.085,ux=p.x/size,uz=(p.z+p.y*.38)/size,ix=Math.floor(ux),iz=Math.floor(uz),d=[],hash=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const x=ix+a,z=iz+b;d.push(Math.hypot(ux-x-.2-.6*hash(x,z),uz-z-.2-.6*hash(z,x)));}d.sort((a,b)=>a-b);return new T.Color('#c4b58f').lerp(new T.Color('#465348'),smooth(d[1]-d[0],.010,.12)*.95).multiplyScalar(.98+noise*.015);
}
// Five smoothly joined posture stages, not an imported measured trajectory.
const keys=[[0,.34,.10,-.22],[.32,-.38,-.08,-.28],[.46,-.34,-.17,-.10],[.58,-.22,-.13,.18],[.88,.34,.11,.22],[1,.34,.10,-.22]];
export function greenTurtleStroke(u){u=((u%1)+1)%1;let i=0;while(i<keys.length-2&&u>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],v=(u-a[0])/(b[0]-a[0]),s=v*v*(3-2*v);return {flap:T.MathUtils.lerp(a[1],b[1],s),sweep:T.MathUtils.lerp(a[2],b[2],s),twist:T.MathUtils.lerp(a[3],b[3],s)};}
export function addTurtleEyes(m){
 const r=m.turtleRig;r.eyes=[];m.root.updateMatrixWorld(true);r.skeleton.update();
 for(const side of [-1,1]){const ray=new T.Raycaster(V(1.65,.65,side*2.1),V(0,0,-side)),hit=ray.intersectObjects(r.meshes,false).find(h=>Math.abs(h.point.z)<.60);if(!hit)continue;const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);if(normal.z*side<0)normal.negate();const group=new T.Group();group.name='PV authored turtle eye '+side;group.position.copy(r.head.worldToLocal(hit.point.clone().addScaledVector(normal,.002)));group.quaternion.setFromUnitVectors(V(0,0,1),normal);r.head.add(group);const eye=new T.Mesh(new T.SphereGeometry(1,24,12),new T.MeshStandardMaterial({color:'#22251d',roughness:.23,metalness:0}));eye.scale.set(.036,.027,.008);group.add(eye);const rim=new T.Mesh(new T.TorusGeometry(.038,.0035,6,32),new T.MeshStandardMaterial({color:'#56604a',roughness:.7,metalness:0}));rim.scale.set(1,.76,1);group.add(rim);group.userData={author:'PhenoVoxel Archive contributors',license:'MIT original ocular geometry',source:m.asset.source,scope:'Small authored ocular cue seated on the source head surface. Eyeball/eyelid anatomy, measured placement and specimen identity remain unverified.'};r.eyes.push(group);}
}

