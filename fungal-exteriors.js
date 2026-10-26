import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {toolkit} from './expansion-geometry.js';

// Original selected fruit-body exteriors. These are unfitted educational
// reconstructions, not scans, diagnostic specimens or developmental models.
export const fungalExteriorSpecies=new Set(['pleurotus-ostreatus','agaricus-bisporus','trametes-versicolor']);
const rigs=new WeakMap(),TAU=Math.PI*2,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export const fungalExteriorRig=root=>rigs.get(root);
const hash=(x,y=0)=>{const n=Math.sin(x*127.1+y*311.7+19.4)*43758.5453;return n-Math.floor(n);};
function noise(x,y){const i=Math.floor(x),j=Math.floor(y),s=t=>t*t*(3-2*t),u=s(x-i),v=s(y-j),l=T.MathUtils.lerp;return l(l(hash(i,j),hash(i+1,j),u),l(hash(i,j+1),hash(i+1,j+1),u),v);}
function grainTexture(){const N=256,data=new Uint8Array(N*N*4);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const q=128+22*(noise(x*.38,y*.38)-.5)+10*(hash(x,y)-.5),i=(y*N+x)*4;data[i]=data[i+1]=data[i+2]=q;data[i+3]=255;}const t=new T.DataTexture(data,N,N);t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;}
function closedCap(fn,nr=44,na=144){
 const p=[],uv=[],index=[];const add=(q,u,v)=>{p.push(...q);uv.push(u,v);return p.length/3-1;};
 for(const lower of[false,true]){
  const center=add(fn(0,0,lower),0,0),rings=[];
  for(let r=1;r<=nr;r++){const ring=[];for(let j=0;j<na;j++)ring.push(add(fn(r/nr,j/na*TAU,lower),r/nr,j/na));rings.push(ring);}
  const tri=(a,b,c)=>index.push(...(lower?[a,b,c]:[a,c,b]));
  for(let j=0;j<na;j++)tri(center,rings[0][j],rings[0][(j+1)%na]);
  for(let r=1;r<nr;r++)for(let j=0;j<na;j++){const k=(j+1)%na;tri(rings[r-1][j],rings[r][j],rings[r-1][k]);tri(rings[r][j],rings[r][k],rings[r-1][k]);}
 }
 const per=1+nr*na,upper=1+(nr-1)*na,lower=per+upper;
 for(let j=0;j<na;j++){const k=(j+1)%na;index.push(upper+j,upper+k,lower+j,upper+k,lower+k,lower+j);}
 // The oyster/fan coordinate convention has opposite handedness to the
 // circular button. Orient the closed exterior by signed enclosed volume.
 let volume=0;for(let i=0;i<index.length;i+=3){const a=V(...p.slice(index[i]*3,index[i]*3+3)),b=V(...p.slice(index[i+1]*3,index[i+1]*3+3)),c=V(...p.slice(index[i+2]*3,index[i+2]*3+3));volume+=a.dot(b.cross(c));}
 if(volume<0)for(let i=0;i<index.length;i+=3)[index[i+1],index[i+2]]=[index[i+2],index[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();g.userData={closedExterior:true,upperVertices:per};return g;
}
function colourSurface(mesh,fn){const p=mesh.geometry.attributes.position,col=[],color=new T.Color();for(let i=0;i<p.count;i++){fn(color,p.getX(i),p.getY(i),p.getZ(i),i);col.push(color.r,color.g,color.b);}mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(col,3));mesh.material.color.set('#ffffff');mesh.material.vertexColors=true;}
function capSkin(k,body,fn,palette,seed,grain,{zones=false,roughness=.73}={}){
 const g=closedCap(fn),m=k.mesh(g,'#ffffff',body,{vertexColors:true,roughness,bumpScale:.0022});m.material.bumpMap=grain;m.name='closed-asymmetric-pileus';
 const dark=new T.Color(palette[0]),pale=new T.Color(palette[1]),edge=new T.Color(palette[2]),under=new T.Color(palette[3]);
 const uv=g.attributes.uv,per=g.userData.upperVertices;
 const stops=[0,.12,.19,.25,.31,.39,.44,.53,.63,.69,.76,.81,.88,.93,1],bandColors=['#736455','#443b34','#77604c','#b6a182','#7f7568','#343637','#a2957c','#685144','#a08365','#d2c4ac','#5d554f','#958a79','#b6a78d','#e4dcc8'];
 colourSurface(m,(out,x,y,z,i)=>{const u=uv.getX(i),a=uv.getY(i)*TAU,n=noise(x*19+seed,z*19),fine=noise(x*135,z*135+seed);
  if(i>=per){out.copy(under).multiplyScalar(.96+.06*n+.035*(fine-.5));return;}
  if(zones){const q=T.MathUtils.clamp(u+.014*Math.sin(a*5+seed)+.012*Math.sin(a*13+u*5)+.013*(n-.5),0,.9999);let b=0;while(q>stops[b+1])b++;out.set(bandColors[b%bandColors.length]);const mix=T.MathUtils.smoothstep((q-stops[b])/(stops[b+1]-stops[b]),.82,1);out.lerp(new T.Color(bandColors[(b+1)%bandColors.length]),mix);out.lerp(edge,T.MathUtils.smoothstep(u,.965,1));}
  else{out.copy(dark).lerp(pale,.25+.42*n+.12*Math.sin(a*2+seed));out.lerp(edge,T.MathUtils.smoothstep(u,.78,1)*.65);}
  out.multiplyScalar(.96+.06*n+.055*(fine-.5));
 });return m;
}
function mergeParts(k,geos,color,parent,name,extra={}){const geo=mergeGeometries(geos);geos.forEach(g=>g.dispose());const m=k.mesh(geo,color,parent,extra);m.name=name;return m;}
function gillGeometry(fn,angle,start,end,depth,seed){const p=[],ix=[],N=40;for(let i=0;i<=N;i++){const u=T.MathUtils.lerp(start,end,i/N),q=fn(u,angle,true),bend=.003*Math.sin(u*11+seed);for(let j=0;j<4;j++){const a=angle+((j===0||j===3)?-.0013:.0013),r=Math.hypot(q[0],q[2]);p.push(q[0]+Math.cos(a)*bend+(j===0||j===3?-.001:.001)*Math.cos(angle),q[1]-(j>=2?depth*Math.sin(i/N*Math.PI)**.4:0),q[2]+Math.sin(a)*bend-(j===0||j===3?-.001:.001)*Math.sin(angle));}}
 for(let i=0;i<N;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=a+4,d=b+4;ix.push(a,b,c,b,d,c);}ix.push(0,2,1,0,3,2);const b=N*4;ix.push(b,b+1,b+2,b,b+2,b+3);let volume=0;for(let i=0;i<ix.length;i+=3)volume+=V(...p.slice(ix[i]*3,ix[i]*3+3)).dot(V(...p.slice(ix[i+1]*3,ix[i+1]*3+3)).cross(V(...p.slice(ix[i+2]*3,ix[i+2]*3+3))));if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}
function stem(k,parent,points,radius,color,grain,name){const path=new T.CatmullRomCurve3(points.map(q=>V(...q))),g=new T.TubeGeometry(path,40,radius,32,false),p=g.attributes.position;for(let r=0;r<=40;r++){const u=r/40,c=path.getPointAt(u),factor=1+.14*Math.sin(u*Math.PI)+.05*Math.sin(u*9);for(let j=0;j<=32;j++){const i=r*33+j,q=V(p.getX(i),p.getY(i),p.getZ(i)).sub(c).multiplyScalar(factor);q.multiplyScalar(1+.014*Math.sin(j*TAU/32*13+u*3));p.setXYZ(i,...q.add(c));}}g.computeVertexNormals();const m=k.mesh(g,color,parent,{roughness:.87,bumpScale:.003});m.material.bumpMap=grain;m.name=name;return m;}
function wood(k,parent,grain){const m=k.surface((u,v)=>{const a=v*TAU,r=.33+.013*Math.sin(a*19+u*3)+.007*Math.sin(a*37-u*8);return[r*Math.cos(a),u*1.65,r*Math.sin(a)-.65];},60,160,'#4a3d30',parent,{roughness:.98,bumpScale:.016});m.material.bumpMap=grain;m.name='contextual-deadwood-not-another-species';colourSurface(m,(c,x,y,z)=>{c.set('#635342').lerp(new T.Color('#2b2923'),noise(x*24+2,y*5+z*5)*.75);});k.ell([0,.015,-.65],[.33,.015,.33],'#514535',parent);k.ell([0,1.65,-.65],[.33,.015,.33],'#6c5a42',parent);return m;}
export function buildFungalExterior(s){
 const k=toolkit(),{root,group,mesh}=k,body=group(),grain=grainTexture(),caps=[],gills=[],emitters=[];let features;
 root.userData.preciseGround=true;root.userData.fixedGeometry=true;
 if(s.id==='pleurotus-ostreatus'){
  wood(k,body,grain);
  const specimens=[[-.23,.50,-.36,.80,.66,-.22],[.30,.86,-.40,.75,.64,.21],[-.13,1.17,-.43,.62,.53,-.13],[.42,.40,-.34,.47,.43,.48],[-.40,.91,-.45,.43,.39,-.55]];
  for(let n=0;n<specimens.length;n++){const[x,y,z,rx,rz,rotation]=specimens[n],b=group([x,y,z],body);b.rotation.y=rotation;const fn=(u,a,lower=false)=>{const shape=.69+.31*Math.cos(a),w=1+.045*Math.sin(a*5+n)+.021*Math.sin(a*11-n),r=u*shape*w,yy=.15*(1-u*u)+.03*Math.sin(a*3+n)*u*u+.015*Math.sin(a*9)*u**3;return[Math.sin(a)*rx*r,y*0+yy+(lower?-.065*(.35+.65*(1-u)):0),Math.cos(a)*rz*r];};
   const cap=capSkin(k,b,fn,['#695f54','#aaa08d','#c4baa6','#d9d2bd'],n+8,grain,{roughness:.68});caps.push(cap);
   stem(k,b,[[0,-.08,-.27],[0,-.06,-.14],[0,.10,0]],.09,'#c7bfaa',grain,'short-eccentric-oyster-stipe');
   const gs=[];for(let j=0;j<112;j++){const a=j/112*TAU+.001*Math.sin(j*4+n),start=j%3===0?.13:j%3===1?.30:.57;gs.push(gillGeometry(fn,a,start,.985,.065,n));const p=fn(.55,a,true);if(j%8===0)emitters.push({group:b,point:p});}gills.push(mergeParts(k,gs,'#d9d0b8',b,'attached-decurrent-lamellae-with-short-gills',{roughness:.84}));
  }features=[[.42,.49,-.08],[.42,.40,-.08],[0,.32,-.60]];
 }else if(s.id==='agaricus-bisporus'){
  const specimens=[[-.43,.65,.1,.70,.67,.33],[.43,.36,-.12,.45,.43,.42],[.34,.23,.58,.31,.30,.35]];
  for(let n=0;n<specimens.length;n++){const[x,y,z,rx,rz,height]=specimens[n],b=group([x,y,z],body);b.rotation.z=.045*Math.sin(n*3);const mature=n===0;
   const fn=(u,a,lower=false)=>{const w=1+.025*Math.sin(a*3+n)+.013*Math.sin(a*7+.4),yy=height*Math.pow(Math.max(0,1-u*u),.56)+.008*Math.sin(a*6+n)*u**3;return[Math.cos(a)*rx*u*w,lower?-.035+.035*(1-u*u):yy,Math.sin(a)*rz*u*w];};
   caps.push(capSkin(k,b,fn,['#c3baa6','#e5dfce','#d1c7b3',mature?'#77635d':'#cdbdae'],n+14,grain,{roughness:.79}));
   stem(k,b,[[0,-y,0],[.015,-y*.50,.01],[0,.015,0]],mature?.16:.125,'#d4cbb8',grain,'short-fibrillose-button-stipe');
   if(mature){const gs=[];for(let j=0;j<168;j++){const a=j/168*TAU,start=j%3===0?.27:j%3===1?.47:.70;gs.push(gillGeometry(fn,a,start,.98,.075,n));if(j%12===0)emitters.push({group:b,point:fn(.70,a,true)});}gills.push(mergeParts(k,gs,'#6a5049',b,'free-dark-mature-lamellae-and-lamellulae',{roughness:.90}));
    const ring=k.surface((u,v)=>{const a=v*TAU,r=.16+u*(.09+.008*Math.sin(a*5));return[Math.cos(a)*r,-.16-.022*u+.012*Math.sin(a*8)*u,Math.sin(a)*r];},14,128,'#c9c1ae',b,{roughness:.88});ring.name='thin-membranous-annulus';
   }else{const veil=k.surface((u,v)=>{const a=v*TAU,edge=fn(1,a,true);return[T.MathUtils.lerp(Math.cos(a)*.12,edge[0],u),T.MathUtils.lerp(-.12,edge[1],u**.75),T.MathUtils.lerp(Math.sin(a)*.12,edge[2],u)];},28,128,'#cfc4b0',b,{roughness:.89});veil.name='selected-unbroken-partial-veil';}
  }features=[[-.43,.95,.10],[-.43,.58,.32],[.34,.18,.57]];
 }else{
  wood(k,body,grain);const specimens=[[-.35,.38,-.32,.68,.63,-.40],[.32,.61,-.30,.75,.64,.45],[-.27,.85,-.36,.80,.67,-.22],[.31,1.08,-.37,.61,.57,.51],[-.12,1.29,-.40,.55,.51,-.18],[.44,.29,-.33,.42,.40,.74]];
  for(let n=0;n<specimens.length;n++){const[x,y,z,rx,rz,rotation]=specimens[n],b=group([x,y,z],body);b.rotation.y=rotation;b.rotation.x=-.10+.09*hash(n,4);const fn=(u,a,lower=false)=>{const shape=.67+.33*Math.cos(a),w=1+.045*Math.sin(a*7+n)+.021*Math.sin(a*17+n*2),r=u*shape*w,yy=.045*Math.sin(u*Math.PI)+.027*Math.sin(a*5+n)*u*u+.009*Math.sin(a*19-n)*u**4;return[Math.sin(a)*rx*r,yy+(lower?-.020:0),Math.cos(a)*rz*r];};
   const cap=capSkin(k,b,fn,['#6f6255','#a9997c','#e1d6bc','#cfccb8'],n+23,grain,{zones:true,roughness:.94});caps.push(cap);
   const pores=[],torus=new T.TorusGeometry(1,.24,3,6);torus.rotateX(Math.PI/2);for(let j=0;j<1600;j++){const u=Math.sqrt((j+.5)/1600)*.96,a=j*2.399963,p=fn(u,a,true),r=.0032+.0007*hash(j,n);const g=torus.clone().scale(r,r,r).translate(p[0],p[1]-.0008,p[2]);pores.push(g);if(j%73===0)emitters.push({group:b,point:p});}torus.dispose();mergeParts(k,pores,'#a49f8b',b,'fine-underside-pore-mouths',{roughness:.96});
   const hairs=[],geo=new T.ConeGeometry(.0008,.012,3);for(let j=0;j<2600;j++){const u=.04+.95*Math.sqrt((j+.5)/2600),a=j*2.399963,p=fn(u,a);if(noise(u*38,a*2+n)>.64)continue;const h=geo.clone().rotateZ((hash(j,7)-.5)*.5).translate(p[0],p[1]+.004,p[2]);hairs.push(h);}geo.dispose();mergeParts(k,hairs,'#a89c88',b,'short-attached-velvety-pileus-relief',{roughness:1});
  }features=[[.31,1.11,-.05],[.31,1.11,-.05],[.31,1.06,-.05]];
 }
 const points=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(72*3),3)),new T.PointsMaterial({color:'#d8d0bb',size:.009,transparent:true,opacity:.50,depthWrite:false}));points.name='enlarged-spore-location-overlay-not-natural-scale';points.visible=false;root.add(points);
 root.userData.focusAnatomy=true;root.userData.anatomyUnderside=s.id==='trametes-versicolor'?[2]:[1];root.userData.anatomyFocusScale=[.95,.95,.85];root.userData.anatomyViewDirections=s.id==='trametes-versicolor'?[[0,.6,1],[0,.9,1],[0,-.75,1]]:[[0,.5,1],[0,-.75,1],[0,.2,1]];
 root.userData.fungalExterior={version:'0.6.39',species:s.id,capCount:caps.length,stationaryFruitBodies:true,developmentImplemented:false,material:'Original numeric colour, grain and relief; no source photograph pixels, fitted optical constants or universal phenotype.'};
 const model=k.finish(s,features);rigs.set(root,{body,caps,gills,emitters,points});return model;
}
export function animateFungalExterior(m,action,t){const r=rigs.get(m.root);if(!r)return false;const p=r.points.geometry.attributes.position;r.points.visible=action==='spores';m.root.updateMatrixWorld(true);if(r.points.visible){const time=Math.min(4,Math.max(0,t));for(let i=0;i<p.count;i++){const e=r.emitters[i%r.emitters.length],origin=m.root.worldToLocal(e.group.localToWorld(V(...e.point))),q=time/4; p.setXYZ(i,origin.x+(hash(i,2)-.5)*.16*q,origin.y-.14*q,origin.z+.05*q*hash(i,3));}p.needsUpdate=true;}return true;}
