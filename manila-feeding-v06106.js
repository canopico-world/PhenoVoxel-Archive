import * as T from 'three';
const V=(...a)=>new T.Vector3(...a),clamp=T.MathUtils.clamp,sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export const DURATION=14;
function surface(fn,nu,nv,mat){const p=[],ix=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++)p.push(...fn(i/nu,j/nv).toArray());for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const n=i*(nv+1)+j;ix.push(n,n+nv+1,n+1,n+1,n+nv+1,n+nv+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return new T.Mesh(g,mat);}
export function buildManilaFeedingStudy(m,r){
 if(m.id!=='ruditapes-philippinarum')throw Error('Manila clam only');
 const sourceChildren=[...m.root.children],home=r.valves.map(v=>({position:v.parent.position.clone(),quaternion:v.parent.quaternion.clone()})),poseRoot=new T.Group(),soft=new T.Group(),siphon=new T.Group(),axis=V(1,0,0),pivot=V(-.25,0,-.78);poseRoot.name='Vertical valve-plane inspection; sediment omitted';poseRoot.rotation.x=Math.PI/2;m.root.add(poseRoot);poseRoot.add(soft);soft.add(siphon);siphon.name='Common siphonal tissue with two separate distal apertures';siphon.position.set(.88,0,-.02);siphon.rotation.y=Math.PI/2;
 const skin=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.66,side:T.DoubleSide}),inner=new T.MeshStandardMaterial({color:0x6c5540,roughness:.83,side:T.DoubleSide}),rimMat=new T.MeshStandardMaterial({color:0x68543d,roughness:.68,side:T.DoubleSide});
 function pigment(o){const p=o.geometry.attributes.position,c=[],light=new T.Color('#b9a382'),dark=new T.Color('#735c42');for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(y,x-.08),variation=.10*Math.sin(a*9+z*19)+.06*Math.sin(a*31-z*71)+.035*Math.sin(x*761+y*631+z*377),q=light.clone().lerp(dark,clamp(.10+.46*sm((z-.10)/.5)+variation,0,1));c.push(q.r,q.g,q.b);}o.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));return o;}
 const wall=pigment(surface((u,v)=>{const a=v*2*Math.PI,wrinkle=.0015*Math.sin(u*57+a*3)*Math.sin(u*Math.PI);return V(.08*u*u+(.15-.02*u+wrinkle)*Math.cos(a),(.069-.014*u+wrinkle)*Math.sin(a),.42*u);},64,96,skin));wall.name='Joined proximal siphonal wall';siphon.add(wall);
 // A perforated tissue bridge joins the proximal tubes. The two holes remain open.
 const shape=new T.Shape();shape.absellipse(.08,0,.13,.055,0,2*Math.PI,false,0);const tubes=[];
 for(const [kind,cx,rad] of [['exhalant',.145,.033],['inhalant',.015,.043]]){
  const hole=new T.Path();hole.absellipse(cx,0,rad,rad,0,2*Math.PI,true,0);shape.holes.push(hole);
  const group=new T.Group();group.name='Separate distal '+kind+' aperture';siphon.add(group);
  const outer=pigment(surface((u,v)=>{const a=v*2*Math.PI,R=rad+.009-.003*u+.0008*Math.sin(u*27+a*4)*Math.sin(u*Math.PI);return V(cx+R*Math.cos(a),R*Math.sin(a),.42+.14*u);},32,64,skin));outer.name='Distal siphon skin';group.add(outer);
  const lumen=surface((u,v)=>{const a=v*2*Math.PI,z=.12+.44*u,c=z<.42?.08*(z/.42)**2+(cx-.08):cx;return V(c+rad*Math.cos(a),rad*Math.sin(a),z);},32,48,inner);lumen.name='Open water lumen';group.add(lumen);
  const rim=surface((u,v)=>{const a=v*2*Math.PI,R=rad+.006*u;return V(cx+R*Math.cos(a),R*Math.sin(a),.56);},3,48,rimMat);rim.name='Annular living rim';group.add(rim);tubes.push({kind,cx,rad,group,tip:V(cx,0,.56)});
 }
 const bridge=new T.Mesh(new T.ShapeGeometry(shape,80),skin);bridge.geometry.translate(0,0,.42);pigment(bridge);bridge.name='Siphonal tissue bridge with two genuine holes';siphon.add(bridge);
 const markers=[];for(const kind of ['inhalant','exhalant'])for(let i=0;i<5;i++){const dot=new T.Mesh(new T.SphereGeometry(.012,10,8),new T.MeshBasicMaterial({color:kind==='inhalant'?0xa7d99a:0x76c7e1,transparent:true}));dot.name=kind==='inhalant'?'Incoming water direction tracer':'Outgoing water direction tracer; not food';siphon.add(dot);markers.push({dot,kind,i});}
 let enabledLast=false;m.root.userData.hideStudioGround=true;
 function pose(time,enabled=true){const t=clamp(Number.isFinite(time)?time:0,0,DURATION);if(enabled!==enabledLast){for(const c of sourceChildren)(enabled?poseRoot:m.root).add(c);enabledLast=enabled;}poseRoot.visible=enabled;const extension=.16+.84*sm(t/4);siphon.scale.z=extension;for(let i=0;i<r.valves.length;i++){const p=r.valves[i].parent;if(enabled){const q=new T.Quaternion().setFromAxisAngle(axis,-r.valves[i].side*.09*sm(t/4));p.position.copy(home[i].position).sub(pivot).applyQuaternion(q).add(pivot);p.quaternion.copy(q).multiply(home[i].quaternion);}else{p.position.copy(home[i].position);p.quaternion.copy(home[i].quaternion);}}
  for(const p of markers){const tube=tubes.find(x=>x.kind===p.kind),phase=((t-4)/3+p.i/5)%1;p.dot.visible=enabled&&t>=4&&t<13;p.dot.material.opacity=.9*sm(phase/.12)*sm((1-phase)/.12)*sm((13-t)/.4);if(p.kind==='inhalant'){const a=p.i*2*Math.PI/5;p.dot.position.copy(V(tube.cx+.20*Math.cos(a),.18*Math.sin(a),.90).lerp(tube.tip,sm(Math.max(0,phase))));}else p.dot.position.copy(tube.tip).add(V(.04*phase,0,.45*phase));}
  m.root.updateMatrixWorld(true);return{time:t,duration:DURATION,stage:t<4?'Joined siphonal tissue extends — authored timing':t<13?'Two distal water pathways — no internal capture simulated':'Study complete — ingestion and digestion not simulated',measured:false};
 }
 pose(0,false);return{pose,root:poseRoot,soft,siphon,tubes,bridge,wall,markers,sourceChildren,home,pivot,axis};
}


