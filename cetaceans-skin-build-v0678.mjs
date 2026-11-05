// Species-specific skin projections on the licensed v677 source surfaces.
// Generated albedo is an authored reconstruction; no photo was copied as skin.
import fs from 'node:fs';import crypto from'node:crypto';import sharp from'sharp';
import * as T from'three';import{Document,NodeIO}from'@gltf-transform/core';
import{ALL_EXTENSIONS,KHRMaterialsClearcoat}from'@gltf-transform/extensions';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),C=T.MathUtils.clamp,S=T.MathUtils.smoothstep,lerp=T.MathUtils.lerp;
const previous=JSON.parse(fs.readFileSync('cetaceans-assets-v0677.json'));
const out={version:'0.6.78',models:{},profiles:{}},proof={version:'0.6.78',photographicScan:false,models:{}};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pleats={'balaenoptera-borealis':42,'balaenoptera-acutorostrata':60,'balaenoptera-bonaerensis':30,'balaenoptera-ricei':48,'balaenoptera-edeni':48,'balaenoptera-brydei':48,'balaenoptera-omurai':85};
function surface(p,indices){const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(p,3)).setIndex(indices);g.computeVertexNormals();const n=g.attributes.normal,groups=new Map();for(let i=0;i<p.length/3;i++){const key=p.slice(i*3,i*3+3).map(v=>v.toFixed(6)).join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}for(const ids of groups.values()){const sum=new T.Vector3();for(const i of ids)sum.add(new T.Vector3().fromBufferAttribute(n,i));sum.normalize();for(const i of ids)n.setXYZ(i,sum.x,sum.y,sum.z);}return g;}
function centres(p,id){
 const table=[];const dolphin=['grampus-griseus','globicephala-melas'].includes(id),width=dolphin?.36:id.includes('minke')?.29:.30;
 for(let j=0;j<=80;j++){const u=j/80,rz=width*Math.sin(Math.PI*C(u+.015,0,1))**.65,ys=[];
  for(let i=0;i<p.length;i+=3){const uu=.5-p[i]/3.85,z=Math.abs(p[i+2]);if(Math.abs(uu-u)<.026&&z>Math.max(.012,rz*.48)&&z<Math.max(.035,rz*1.18))ys.push(p[i+1]);}
  ys.sort((a,b)=>a-b);table.push(ys.length?ys[Math.floor(ys.length*.50)]:NaN);
 }
 for(let j=0;j<table.length;j++)if(!Number.isFinite(table[j])){let k=1;while(k<81&&!Number.isFinite(table[j-k])&&!Number.isFinite(table[j+k]))k++;table[j]=table[j-k]||table[j+k]||1.45;}
 const smoothed=table.map((v,j)=>{let sum=0,w=0;for(let k=-3;k<=3;k++){const a=table[C(j+k,0,80)],weight=4-Math.abs(k);sum+=a*weight;w+=weight;}return sum/w;});
 return u=>{const f=C(u,0,1)*80,j=Math.min(79,Math.floor(f));return lerp(smoothed[j],smoothed[j+1],f-j);};
}
function sculpt(p,id){
 const pilot=id==='globicephala-melas',risso=id==='grampus-griseus';
 for(let i=0;i<p.length;i+=3){let[x,y,z]=p.slice(i,i+3);const az=Math.abs(z),u=.5-x/3.85;
  if(risso){
   // Round the source's planar terminal muzzle; keep the beakless profile.
   const head=S(x,1.34,1.88),rad=C(((y-1.33)/.23)**2+(z/.25)**2,0,2);
   x-=.095*head*rad;y+=.032*S(x,1.35,1.75)*S(y,1.38,1.56);
   y-=.009*Math.exp(-((z/.018)**2))*S(x,1.53,1.79)*S(y,1.42,1.55);
  }
  if(pilot){
   // Extend the source pectoral about its actual shoulder attachment. A
   // smooth proximal blend leaves body vertices unchanged. Target ~23% L.
   const w=S(az,.27,.39)*(1-S(y,1.16,1.28))*S(u,.13,.18)*(1-S(u,.45,.54));
   x=lerp(x,1.23+(x-1.23)*1.65,w);y=lerp(y,1.16+(y-1.16)*1.65,w);z=lerp(z,Math.sign(z)*.25+(z-Math.sign(z)*.25)*1.65,w);
  }
  p[i]=x;p[i+1]=y;p[i+2]=z;
 }
}
function splitSides(p,n,uv,indices){
 // Source charts are retained within each side. A separate half-atlas for
 // each anatomical side prevents mirrored source UVs sharing pigmentation.
 const o={p:[],n:[],uv:[],indices:[],oldUV:[]},lookup=new Map();
 for(let f=0;f<indices.length;f+=3){const ids=indices.slice(f,f+3),right=ids.reduce((s,i)=>s+p[i*3+2],0)>=0?1:0;
  for(const i of ids){const key=i+':'+right;if(!lookup.has(key)){lookup.set(key,o.p.length/3);o.p.push(...p.slice(i*3,i*3+3));o.n.push(...n.slice(i*3,i*3+3));o.oldUV.push(...uv.slice(i*2,i*2+2));o.uv.push(.004+C(uv[i*2],0,1)*.992,.004+right*.5+C(uv[i*2+1],0,1)*.492);}o.indices.push(lookup.get(key));}
 }return o;
}
function repackProjection(p,n,indices,centre,id){
 // Explicit anatomical charts remove source UV overlaps, including the
 // southern-minke atlas where pectorals previously overwrote flank texels.
 const rects=[[.005,.005,.990,.320],[.005,.335,.990,.320],[.005,.665,.490,.150],[.505,.665,.490,.150],[.005,.825,.150,.170],[.170,.825,.150,.170],[.335,.825,.210,.170],[.550,.825,.210,.170],[.765,.825,.110,.170],[.880,.825,.115,.080],[.880,.915,.115,.080]];
 const out={p:[],n:[],uv:[],indices:[]},seen=new Map(),dolphin=['grampus-griseus','globicephala-melas'].includes(id),width=dolphin?.355:.30;
 for(let f=0;f<indices.length;f+=3){const ids=indices.slice(f,f+3),q=[0,0,0],no=[0,0,0];for(const i of ids)for(let k=0;k<3;k++){q[k]+=p[i*3+k]/3;no[k]+=n[i*3+k]/3;}const u=.5-q[0]/3.85,cy=centre(u),az=Math.abs(q[2]),rz=width*Math.sin(Math.PI*C(u+.015,0,1))**.65;
  let chart=q[2]>=0?0:1;
  if(u>.84&&az>.045)chart=no[1]>=0?9:10;
  else if(u>.14&&u<.62&&((az>Math.max(.23,rz*1.16)&&q[1]<cy-.13)||(az>.19&&q[1]<(id==='grampus-griseus'?1.07:id==='globicephala-melas'?1.04:1.13))))chart=q[2]>=0?6:7;
  else if(u>.30&&u<.82&&az<.105&&q[1]>cy+(dolphin?.34:.25))chart=8;
  else if(Math.abs(no[1])>.72&&Math.abs(no[1])>Math.abs(no[2]))chart=no[1]>0?2:3;
  for(const i of ids){const key=i+':'+chart;if(!seen.has(key)){seen.set(key,out.p.length/3);const[x,y,z]=p.slice(i*3,i*3+3);let U=.5-x/3.85,V=(y-.55)/1.85;
    if(chart===2||chart===3){V=(z+.65)/1.30;}
    if(chart===4||chart===5){U=(z+.42)/.84;}
    if(chart===6||chart===7){U=(x+.05)/1.50;V=(Math.abs(z)-.18)/.65;}
    if(chart===8){U=(x+1.15)/2.20;V=(y-1.55)/.80;}
    if(chart===9||chart===10){U=(x+1.95)/.70;V=(z+.75)/1.50;}
    const r=rects[chart];out.p.push(x,y,z);out.n.push(...n.slice(i*3,i*3+3));out.uv.push(r[0]+C(U,0,1)*r[2],r[1]+C(V,0,1)*r[3]);
   }out.indices.push(seen.get(key));}
 }return out;
}
async function makeMaps(mesh,id,centre){
 const size=4096,N=size*size,color=Buffer.alloc(N*3,Buffer.from([45,49,52])),height=new Float32Array(N),rough=Buffer.alloc(N*3,Buffer.from([0,125,0])),valid=new Uint8Array(N);
 const sourceFile='skin-cetacean-'+id+'-v0678.png',src=await sharp(sourceFile).removeAlpha().raw().toBuffer({resolveWithObject:true}),{data,info}=src;
 const sample=(u,v)=>{const X=C(Math.round(u*(info.width-1)),0,info.width-1),Y=C(Math.round(v*(info.height-1)),0,info.height-1),i=(Y*info.width+X)*info.channels;return[data[i],data[i+1],data[i+2]];};
 const dolphin=['grampus-griseus','globicephala-melas'].includes(id),minke=id==='balaenoptera-acutorostrata'||id==='balaenoptera-bonaerensis';
 const finFront=Array(140).fill(-Infinity);for(let i=0;i<mesh.p.length;i+=3){const[x,y,z]=mesh.p.slice(i,i+3),u=.5-x/3.85,az=Math.abs(z);if(u>.14&&u<.62&&az>.19&&y<1.13){const j=C(Math.round(az*139),0,139);finFront[j]=Math.max(finFront[j],x);}}
 const frontAt=z=>{const j=C(Math.round(Math.abs(z)*139),0,139);return Math.max(...finFront.slice(Math.max(0,j-2),Math.min(140,j+3)));};
 const get=(x,y,z,nx,ny,nz)=>{
  const u=C(.5-x/3.85,0,1),cy=centre(u),dy=y-cy,az=Math.abs(z),angle=Math.atan2(az,dy),side=z>=0?1:-1;
  // Side 2 uses its own portion of the authored skin; do not mirror each
  // animal's exact scratch pattern across its midline.
  const U=side>0?u:C(.025+u*.95+.014*Math.sin(u*17),0,1),v=Math.acos(C(ny,-1,1))/Math.PI;
  let rgb=sample(U,v),h=0,rf=.45;
  const lum=(rgb[0]+rgb[1]+rgb[2])/3,detail=lum-(sample(C(U+.003,0,1),v).reduce((a,b)=>a+b,0)/3);
  h+=detail*.000003;
  const rz=(dolphin?.355:.30)*Math.sin(Math.PI*C(u+.015,0,1))**.65;
  const fluke=u>.85&&az>.05,dorsal=u>.30&&u<.82&&az<.105&&dy>(dolphin?.35:.25),pec=u>.14&&u<.62&&((az>Math.max(.23,rz*1.16)&&y<cy-.13)||(az>.19&&y<(id==='grampus-griseus'?1.07:id==='globicephala-melas'?1.04:1.13)));
  if(dorsal||fluke||pec){
   const dark=sample(U,.10),micro=(sample(C(az*1.3,0,1),.22)[0]-42)*.15;
   rgb=dark.map(a=>C(a+micro,14,112));
   if(id==='grampus-griseus')rgb=rgb.map(a=>a*.66);
   if(fluke&&ny<-.18&&!dolphin){const pale=sample(U,.95);rgb=rgb.map((a,k)=>lerp(a,pale[k],S(-ny,.2,.7)*.75));}
   if(pec&&minke){
    // The band crosses the middle of the pectoral, measured along the
    // attachment-to-tip vector, rather than a world-z slab.
    const root=new T.Vector3(1.06,1.25,side*.21),tip=new T.Vector3(.775,.945,side*.478),q=new T.Vector3(x,y,z).sub(root),axis=tip.clone().sub(root),t=q.dot(axis)/axis.lengthSq();
    const band=id==='balaenoptera-acutorostrata'?S(t,.28,.36)*(1-S(t,.68,.76)):0;
    const skin=sample(C(.22+t*.5,0,1),.95);rgb=rgb.map((a,k)=>lerp(a,skin[k],band));
    if(id==='balaenoptera-bonaerensis'){const front=frontAt(z),edge=Number.isFinite(front)?1-S(front-x,.002,.009):0;rgb=rgb.map((a,k)=>lerp(a,skin[k],edge*.45));}
   }
   if(pec&&id==='balaenoptera-omurai'){const leading=1-S(Math.abs(x-(.91-.62*az)),.009,.035),pale=sample(U,.95);rgb=rgb.map((a,k)=>lerp(a,pale[k],leading));}
  }
  if(id==='balaenoptera-omurai'&&side<0){
   // Primary photo guide: dark left lower jaw, pale RIGHT jaw. A small
   // contralateral gape stripe is added on the separate lip surface.
   const jaw=(1-S(u,.20,.27))*S(v,.40,.53)*(1-S(v,.87,1));const dark=sample(U,.12);rgb=rgb.map((a,k)=>lerp(a,dark[k],jaw));
   const wash=(1-S(u,.28,.37))*(1-S(v,.47,.62));rgb=rgb.map((a,k)=>lerp(a,sample(U,.23)[k],wash*.48));
  }
  if(id==='globicephala-melas'){
   const anchor=(1-S(Math.abs(u-.245),.045,.105))*S(v,.79,.91),belly=S(u,.32,.38)*(1-S(u,.69,.75))*S(v,.94,.99);
   const pale=sample(U,.94).map(a=>a+55);rgb=rgb.map((a,k)=>lerp(a,pale[k],Math.max(anchor,belly)*.72));
  }
  if(id==='grampus-griseus'&&(dorsal||pec||fluke))rf=.46;
  if(!dorsal&&!fluke&&!pec&&pleats[id]){
   const a=Math.atan2(z,-dy),end=id==='balaenoptera-omurai'?.66:id==='balaenoptera-borealis'?.38:.49,field=(1-S(Math.abs(a),1.04,1.30))*S(u,.035,.085)*(1-S(u,end-.05,end));
   const rib=Math.cos((a+1.23)/2.46*pleats[id]*Math.PI*2);h+=rib*.00042*field;
   rgb=rgb.map(a=>a*(1-.055*field*(1-rib)*.5));rf+=.035*field;
  }
  return{rgb:rgb.map(a=>C(a,8,235)),h,rf:C(rf+detail*.0015,.36,.58)};
 };
 const{p,n,uv,indices}=mesh;
 for(let f=0;f<indices.length;f+=3){const ids=indices.slice(f,f+3),a=ids.map(i=>[uv[2*i]*(size-1),uv[2*i+1]*(size-1)]),area=(a[1][0]-a[0][0])*(a[2][1]-a[0][1])-(a[1][1]-a[0][1])*(a[2][0]-a[0][0]);if(Math.abs(area)<1e-8)continue;
  const left=C(Math.floor(Math.min(...a.map(v=>v[0]))),0,size-1),right=C(Math.ceil(Math.max(...a.map(v=>v[0]))),0,size-1),top=C(Math.floor(Math.min(...a.map(v=>v[1]))),0,size-1),bottom=C(Math.ceil(Math.max(...a.map(v=>v[1]))),0,size-1);
  for(let Y=top;Y<=bottom;Y++)for(let X=left;X<=right;X++){const b=((a[1][0]-X)*(a[2][1]-Y)-(a[1][1]-Y)*(a[2][0]-X))/area,c=((a[2][0]-X)*(a[0][1]-Y)-(a[2][1]-Y)*(a[0][0]-X))/area,d=1-b-c;if(Math.min(b,c,d)<-.001)continue;
   const w=[b,c,d],point=[0,0,0],no=[0,0,0];for(let j=0;j<3;j++)for(let k=0;k<3;k++){point[k]+=p[ids[j]*3+k]*w[j];no[k]+=n[ids[j]*3+k]*w[j];}const r=get(...point,...no),i=Y*size+X;color.set(r.rgb,i*3);height[i]=r.h;rough.set([0,r.rf*255,0],i*3);valid[i]=1;
  }
 }
 const normal=Buffer.alloc(N*3,Buffer.from([128,128,255]));
 for(let Y=1;Y<size-1;Y++)for(let X=1;X<size-1;X++){const i=Y*size+X;if(!valid[i]||![i-1,i+1,i-size,i+size].every(k=>valid[k]))continue;const v=new T.Vector3((height[i-1]-height[i+1])*size*.18,(height[i-size]-height[i+size])*size*.18,1).normalize();normal.set(v.toArray().map(v=>(v*.5+.5)*255),i*3);}
 for(let pass=0;pass<8;pass++){const add=[];for(let Y=1;Y<size-1;Y++)for(let X=1;X<size-1;X++){const i=Y*size+X;if(valid[i])continue;const j=[i-1,i+1,i-size,i+size].find(j=>valid[j]);if(j!==undefined)add.push([i,j]);}for(const[i,j]of add){for(const a of[color,normal,rough])a.copy(a,i*3,j*3,j*3+3);valid[i]=1;}}
 return{color:await sharp(color,{raw:{width:size,height:size,channels:3}}).jpeg({quality:96,chromaSubsampling:'4:4:4'}).toBuffer(),normal:await sharp(normal,{raw:{width:size,height:size,channels:3}}).resize(2048,2048).png().toBuffer(),rough:await sharp(rough,{raw:{width:size,height:size,channels:3}}).resize(2048,2048).png().toBuffer(),sourceFile,sourceWidth:info.width,sourceHeight:info.height,get};
}
function project(g,x,y,side){
 const mesh=new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide}));mesh.updateMatrixWorld();
 const ray=new T.Raycaster(new T.Vector3(x,y,side*4),new T.Vector3(0,0,-side));return ray.intersectObject(mesh,false)[0];
}
function projectTop(g,x,z){const mesh=new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide}));mesh.updateMatrixWorld();return new T.Raycaster(new T.Vector3(x,4,z),new T.Vector3(0,-1,0)).intersectObject(mesh,false)[0];}
function faceParts(g,id,maps){
 const dolphin=['grampus-griseus','globicephala-melas'].includes(id),risso=id==='grampus-griseus',minke=id==='balaenoptera-acutorostrata'||id==='balaenoptera-bonaerensis',parts=[],evidence={eyes:[],mouth:[],closedBlowholes:dolphin?1:2};
 for(const side of[-1,1]){
  const target=risso?[1.33,1.425]:dolphin?[1.43,1.43]:minke?[1.22,1.51]:id==='caperea-marginata'?[1.00,1.47]:[1.15,1.49],hit=project(g,...target,side);if(!hit)throw Error('Missing eye surface '+id);
  const r=risso?.019:dolphin?.016:.012,normal=hit.face.normal.clone().transformDirection(new T.Matrix4()),eye=new T.SphereGeometry(1,24,16),up=new T.Vector3(0,1,0),right=new T.Vector3().crossVectors(up,normal).normalize(),origin=hit.point.clone().addScaledVector(normal,-r*.20);
  const a=eye.attributes.position;for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i),q=origin.clone().addScaledVector(right,v.x*r*1.22).addScaledVector(up,v.y*r*.62).addScaledVector(normal,v.z*r*.54);a.setXYZ(i,q.x,q.y,q.z);}eye.computeVertexNormals();parts.push({name:'Recessed '+(side>0?'right':'left')+' eye',g:eye,kind:'eye'});
  // Upper and lower skin lids follow the ellipse and meet at both canthi.
  for(const upper of[1,-1]){const points=[];for(let k=0;k<=28;k++){const t=k/28*Math.PI,q=hit.point.clone().addScaledVector(right,Math.cos(t)*r*1.30).addScaledVector(up,Math.sin(t)*r*.72*upper).addScaledVector(normal,r*.19);points.push(q);}const lid=new T.TubeGeometry(new T.CatmullRomCurve3(points),36,r*.13,6,false);parts.push({name:(upper>0?'Upper':'Lower')+' eyelid',g:lid,kind:'skin'});}
  evidence.eyes.push({side:side>0?'right':'left',centre:origin.toArray(),radius:r,eyeToBodyDiameterRatio:r*2/3.85});
  // The existing source jaw surface remains closed. A thin surface-hugging
  // lip crease and adjacent skin rims replace a broad painted smile.
  const points=[],end=risso?1.32:dolphin?1.38:minke?1.18:1.06,start=risso?1.875:1.905;
  for(let k=0;k<=56;k++){const t=k/56,x=lerp(start,end,t);let y;
   if(risso)y=1.245+.11*S(t,.44,1);else if(dolphin)y=1.33+.005*t+.052*S(t,.72,1);else if(minke)y=1.514-.078*t+.012*Math.sin(t*Math.PI);else if(id==='caperea-marginata')y=1.47+.073*Math.sin(Math.PI*t)-.015*t;else y=1.455-.038*t+.04*Math.sin(t*Math.PI);
   const hit=project(g,x,y,side);if(hit)points.push(hit.point.clone().add(new T.Vector3(0,0,side*.008)));
  }
  if(points.length>10&&risso){const curve=new T.CatmullRomCurve3(points),crease=new T.TubeGeometry(curve,128,.0020,8,false);parts.push({name:'Closed oral commissure '+side,g:crease,kind:'crease'});for(const offset of[-.006,.006]){const rim=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>p.clone().add(new T.Vector3(0,offset,-side*.003)))),128,.0014,6,false);parts.push({name:'Skin lip margin '+side,g:rim,kind:'skin'});}evidence.mouth.push({side:side>0?'right':'left',points:points.map(p=>p.toArray())});}
  else evidence.mouth.push({side:side>0?'right':'left',sourceJawSurfaceRetained:true,reason:'Retained native connected jaw geometry and skin; no generic mouth overlay.'});
 }
 for(const side of(dolphin?[0]:[-1,1])){const points=[];for(let k=0;k<=36;k++){const t=k/36*Math.PI,x=dolphin?1.08+.023*Math.sin(t):1.17+.045*Math.cos(t),z=dolphin?.05*Math.cos(t):side*(.023+.008*Math.sin(t)),hit=projectTop(g,x,z);if(hit)points.push(hit.point.clone().addScaledVector(hit.face.normal,.0007));}if(points.length>20){const curve=new T.CatmullRomCurve3(points);parts.push({name:'Closed blowhole slit '+side,g:new T.TubeGeometry(curve,48,.0021,6,false),kind:'crease'});parts.push({name:'Blowhole skin rim '+side,g:new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>p.clone().add(new T.Vector3(-.0035,0,0)))),48,.0015,6,false),kind:'skin'});}}
 return{parts,evidence};
}
for(const[id,old]of Object.entries(previous.profiles)){
 if(process.env.CETACEAN_ONLY&&!process.env.CETACEAN_ONLY.split(',').includes(id))continue;
 const original=await io.read(old.localFile),pr=original.getRoot().listMeshes()[0].listPrimitives()[0],p=Array.from(pr.getAttribute('POSITION').getArray()),uv=Array.from(pr.getAttribute('TEXCOORD_0').getArray()),indices=Array.from(pr.getIndices().getArray());sculpt(p,id);
 const baseGeo=surface(p,indices),n=Array.from(baseGeo.attributes.normal.array),centre=centres(p,id),mesh=repackProjection(p,n,indices,centre,id),geo=surface(mesh.p,mesh.indices).setAttribute('uv',new T.Float32BufferAttribute(mesh.uv,2));let maps;
 if(process.env.FEATURE_ONLY){const d=await io.read('model-cetacean-'+id+'-v0678.glb'),m=d.getRoot().listMaterials()[0],sourceFile='skin-cetacean-'+id+'-v0678.png',meta=await sharp(sourceFile).metadata();maps={color:m.getBaseColorTexture().getImage(),normal:m.getNormalTexture().getImage(),rough:m.getMetallicRoughnessTexture().getImage(),sourceFile,sourceWidth:meta.width,sourceHeight:meta.height};}else maps=await makeMaps(mesh,id,centre);
 const features=faceParts(geo,id,maps);baseGeo.dispose();
 const doc=new Document(),buffer=doc.createBuffer(),acc=(name,type,a)=>doc.createAccessor(name).setType(type).setArray(a).setBuffer(buffer),body=doc.createMaterial('Species-specific reconstructed skin').setMetallicFactor(0).setRoughnessFactor(1).setNormalScale(.28);
 const coat=doc.createExtension(KHRMaterialsClearcoat);body.setExtension('KHR_materials_clearcoat',coat.createClearcoat().setClearcoatFactor(.38).setClearcoatRoughnessFactor(.26));
 for(const[k,setter,mime]of[['color','setBaseColorTexture','image/jpeg'],['normal','setNormalTexture','image/png'],['rough','setMetallicRoughnessTexture','image/png']])body[setter](doc.createTexture(id+' '+k).setImage(maps[k]).setMimeType(mime));
 const scene=doc.createScene(),add=(name,p,n,uv,indices,mat)=>{const pr=doc.createPrimitive().setAttribute('POSITION',acc(name,'VEC3',new Float32Array(p))).setAttribute('NORMAL',acc(name+' normals','VEC3',new Float32Array(n))).setAttribute('TEXCOORD_0',acc(name+' UV','VEC2',new Float32Array(uv))).setIndices(acc(name+' triangles','SCALAR',new Uint32Array(indices))).setMaterial(mat);scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(pr)));};
 add(id+' licensed source body',mesh.p,mesh.n,mesh.uv,mesh.indices,body);
 const eyeMat=doc.createMaterial('Dark exposed corneal aperture').setBaseColorFactor([.004,.006,.007,1]).setMetallicFactor(0).setRoughnessFactor(.18),creaseMat=doc.createMaterial('Narrow closed mouth crease').setBaseColorFactor([.016,.018,.019,1]).setMetallicFactor(0).setRoughnessFactor(.48),leftGape=id==='balaenoptera-omurai'?doc.createMaterial('Pale left gape; opposite lower-jaw asymmetry').setBaseColorFactor([.48,.48,.42,1]).setNormalTexture(body.getNormalTexture()).setNormalScale(.18).setMetallicFactor(0).setRoughnessFactor(.48):null;
 for(const part of features.parts){let positions=Array.from(part.g.attributes.position.array),normals=Array.from(part.g.attributes.normal.array),ix=Array.from(part.g.index.array),textureUV=[],mat=part.kind==='eye'?eyeMat:part.kind==='crease'?creaseMat:body;
  if(leftGape&&part.name==='Closed oral commissure -1')mat=leftGape;
  for(let i=0;i<positions.length;i+=3){const x=positions[i],y=positions[i+1],z=positions[i+2],hit=/[Bb]lowhole/.test(part.name)?projectTop(geo,x,z):project(geo,x,y,z>=0?1:-1);const u=hit?.uv||new T.Vector2(.5,.5);textureUV.push(u.x,u.y);}
  add(part.name,positions,normals,textureUV,ix,mat);part.g.dispose();
 }
 const attrs={...old,localFile:'model-cetacean-'+id+'-v0678.glb',cetaceanSourceVersion:'0.6.78',title:id+' · individual skin and head correction',modifications:'Licensed v677 source surface; independently authored generated skin, side-separated UV charts, skin relief/roughness, recessed eyes and skin lip margins. Local Risso muzzle rounding; longer pilot pectorals. No photographic scan or measured physiology.',changes:'New species-specific skin, eyes and lips; fine skin extends across lower jaw and belly.'};delete attrs.sha256;delete attrs.bytes;
 doc.getRoot().setExtras({...attrs,skinGenerator:'Built-in image_gen; species guide checked; generated albedo is not biological evidence',photographicScan:false});const bytes=await io.writeBinary(doc);fs.writeFileSync(attrs.localFile,bytes);const a={...attrs,sha256:sha(bytes),bytes:bytes.length};out.profiles[id]=a;if(id!=='balaenoptera-brydei')out.models[id]=a;
 proof.models[id]={...a,photographicScan:false,sourceModelFile:old.localFile,sourceGeometrySha256:sha(Buffer.from(new Float32Array(p).buffer)),skinSource:maps.sourceFile,skinSourceSha256:sha(fs.readFileSync(maps.sourceFile)),skinSourceDimensions:[maps.sourceWidth,maps.sourceHeight],colorSha256:sha(maps.color),normalSha256:sha(maps.normal),roughnessSha256:sha(maps.rough),maps:{color:[4096,4096],normal:[2048,2048],roughness:[2048,2048]},separateAnatomicalSides:true,facialAnatomy:features.evidence,bodyVertices:mesh.p.length/3,bodyTriangles:indices.length/3,featureMeshes:features.parts.length,pilotPectoralTargetFraction:id==='globicephala-melas'?.23:null};
 geo.dispose();console.log(id,bytes.length,'bytes',features.parts.length,'face meshes');
}
if(process.env.CETACEAN_ONLY){for(const[f,o]of[['cetaceans-assets-v0678.json',out],['cetaceans-skin-v0678.json',proof]])if(fs.existsSync(f)){const old=JSON.parse(fs.readFileSync(f));for(const k of['models','profiles'])o[k]={...(old[k]||{}),...(o[k]||{})};}}
fs.writeFileSync('cetaceans-assets-v0678.json',JSON.stringify(out,null,2)+'\n');fs.writeFileSync('cetaceans-skin-v0678.json',JSON.stringify(proof,null,2)+'\n');
