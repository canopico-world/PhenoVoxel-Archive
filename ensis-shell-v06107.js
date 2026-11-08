import * as T from 'three';
import {noise,microRelief} from './mollusca-surfaces.js';
const V=(...a)=>new T.Vector3(...a),sm=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
export function buildEnsisShell(){
 const root=new T.Group(),valves=[];root.name='Ensis ensis curved open-ended shell reconstruction';
 // Longitudinal loft: x AP, z DV, y paired valve separation. Neither end is capped.
 // Primary Holme1951 supports equivalve, curved margins and open pedal/siphonal ends.
 // Rounded anterior and oblique posterior outlines follow museum photographs qualitatively.
 function point(u,v,side,inner=false){const x0=-1.6+3.2*u,a=v*Math.PI,center=.17*(1-(x0/1.6)**2),edgeRound=.075*(1-Math.sin(a)),x=x0+(1-u)**15*edgeRound-u**15*(.035+.055*Math.cos(a)),z=center-.205*Math.cos(a),y=side*((inner?.007:.015)+(inner?.069:.078)*Math.sin(a));return V(x,y,z);}
 for(const side of [-1,1]){const parent=new T.Group();root.add(parent);const meshes=[];
  for(const inner of [false,true]){const p=[],uv=[],ix=[],colors=[];for(let i=0;i<=192;i++)for(let j=0;j<=48;j++){const u=i/192,v=j/48,q=point(u,v,side,inner);p.push(...q.toArray());uv.push(u,v);const growth=Math.hypot(u*1.05,v*.23),layer=.5+.5*Math.sin(growth*490+noise(u*28,v*5)*2),stain=noise(u*90,v*13),olive=sm((v-.42)/.45);let c=new T.Color(inner?'#d5d4d9':'#d9c39b');if(!inner){c.lerp(new T.Color('#6d572c'),.08+.72*olive+.12*layer);c.lerp(new T.Color('#9c6962'),.45*Math.pow(stain,3)*(1-olive));const growthTrace=Math.pow(Math.max(0,Math.sin(u*181+v*.9+noise(u*17,v*2)*1.1)),28)*(1-sm((v-.45)/.25));c.lerp(new T.Color('#79634c'),.38*growthTrace);}else c.lerp(new T.Color('#aab8bd'),.1+.1*Math.sin(v*Math.PI));colors.push(c.r,c.g,c.b);}
   for(let i=0;i<192;i++)for(let j=0;j<48;j++){const n=i*49+j;ix.push(n,n+49,n+1,n+1,n+49,n+50);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();const o=new T.Mesh(g,new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:inner?.39:.43,side:T.DoubleSide}));o.name=inner?'Open inner shell loft':'Curved exterior with authored periostracum';if(!inner)microRelief(o,27,.0008,.43);parent.add(o);meshes.push(o);
  }
  // Narrow shell-thickness strips surround each valve; they do not bridge paired valves.
  for(const end of [0,1]){const p=[],ix=[];for(let j=0;j<=48;j++)for(const inner of [false,true])p.push(...point(end,j/48,side,inner).toArray());for(let j=0;j<48;j++){const n=j*2;ix.push(n,n+2,n+1,n+1,n+2,n+3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();const o=new T.Mesh(g,new T.MeshStandardMaterial({color:0xc7b89c,roughness:.54,side:T.DoubleSide}));o.name='Shell thickness at open '+(end?'posterior':'anterior')+' end';parent.add(o);}
  valves.push({parent,side,meshes});
 }
 // Axis is a schematic straight chord of the curved dorsal border, not a fitted ligament.
 const ligamentCurve=new T.CatmullRomCurve3(Array.from({length:25},(_,i)=>{const x=-1.50+.72*i/24;return V(x,0,.17*(1-(x/1.6)**2)-.205);}));
 const ligament=new T.Mesh(new T.TubeGeometry(ligamentCurve,48,.012,10,false),new T.MeshStandardMaterial({color:0x514434,roughness:.57}));ligament.name='External anterior dorsal ligament; qualitative extent';root.add(ligament);
 const pivot=V(-1.20,0,-.130625),axis=V(1,0,.15).normalize();function pose(t){t=T.MathUtils.clamp(Number.isFinite(t)?t:0,0,8);for(const v of valves){const q=new T.Quaternion().setFromAxisAngle(axis,-v.side*.025*sm(t/4));v.parent.position.copy(pivot).sub(pivot.clone().applyQuaternion(q));v.parent.quaternion.copy(q);}root.updateMatrixWorld(true);return{time:t,duration:8,stage:t<4?'Small illustrative gape':'Inspection complete — filtration not simulated',measured:false};}
 pose(0);return{root,valves,pose,point,ligament,pivot,axis};
}
