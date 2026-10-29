import * as T from 'three';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),C=T.MathUtils.clamp,S=T.MathUtils.smoothstep,L=T.MathUtils.lerp,TAU=Math.PI*2,G=(x,s)=>Math.exp(-((x/s)**2));
export const belugaDimensions={length:3.85,cy:1.45,flukeSpan:.90,flukeChord:.34,flipperSpan:.49,flipperChord:.32,
 scope:'Selected normalized adult exterior; source control surface resculpted against uncalibrated photographs and published cohort context. Not photogrammetry or a measured individual.'};
export const belugaEvidence={sourceUid:'3dassets-39327',sourceLicense:'CC0 1.0',sourceAI:true,referenceLengthM:3.64,referenceAnimals:3,referenceBouts:19,selectedRelativeSpeed:.5,
 frequencyHz:.143+1.454*.5,heaveM:.448-.134*.5,pitchDegrees:42.113-16.459*.5,
 feedingContext:'Kane and Marshall2009 abstract: preparatory, jaw opening, gular depression, closure; lateral gape occlusion. SICB preliminary means guide scale/order only, not a fitted individual.',
 fittedIndividual:false,fluidSolver:false,sourceAnimation:false};
// [u, half width, dorsal height, ventral height], in normalized display units.
// Selected adult surface controls, not dimensions recovered from the images.
const profile=[[0,0,-.115,-.115],[.005,.080,-.055,-.16],[.015,.18,.045,-.20],[.032,.255,.245,-.235],[.065,.29,.395,-.26],[.11,.31,.385,-.28],[.16,.305,.32,-.29],[.205,.31,.30,-.315],[.28,.355,.355,-.365],[.37,.365,.365,-.375],[.47,.34,.34,-.34],[.58,.285,.28,-.28],[.70,.205,.205,-.215],[.81,.119,.137,-.145],[.9,.061,.088,-.09],[.97,.033,.052,-.052],[1,0,0,0]];
function interp(rows,u,k){let i=0;while(i<rows.length-2&&u>rows[i+1][0])i++;const a=rows[i],b=rows[i+1],h=b[0]-a[0],q=C((u-a[0])/h,0,1),slope=n=>{if(n===0)return(rows[1][k]-rows[0][k])/(rows[1][0]-rows[0][0]);if(n===rows.length-1)return(rows[n][k]-rows[n-1][k])/(rows[n][0]-rows[n-1][0]);const p=rows[n-1],r=rows[n],s=rows[n+1],h0=r[0]-p[0],h1=s[0]-r[0],d0=(r[k]-p[k])/h0,d1=(s[k]-r[k])/h1;return d0*d1<=0?0:3*(h0+h1)/((2*h1+h0)/d0+(h1+2*h0)/d1);};return(2*q**3-3*q*q+1)*a[k]+(q**3-2*q*q+q)*h*slope(i)+(-2*q**3+3*q*q)*b[k]+(q**3-q*q)*h*slope(i+1);}
export function belugaSection(u){u=C(u,0,1);return {w:Math.max(0,interp(profile,u,1)),top:interp(profile,u,2),bottom:interp(profile,u,3)};}
const mouthY=u=>belugaDimensions.cy-.115-.050*Math.sin(C(u/.165,0,1)*Math.PI)+.015*S(u,.08,.16);
function bodyPoint(u,a){
 const {length,cy}=belugaDimensions,r=belugaSection(u),q=Math.cos(a),sn=Math.sin(a),mid=(r.top+r.bottom)/2,ry=(r.top-r.bottom)/2;
 let relief=0;
 const side=1-G(Math.sin(a),.30),ventral=1-S(q,.05,.65);
 // Sparse cervical and flank folds; no concentric full-body corrugation.
 for(const [at,amp,sd]of[[.183,.004,.005],[.214,.006,.007],[.246,.003,.009]])relief-=amp*G(u-at-.003*Math.sin(a*3),sd)*ventral;
 for(const angle of[1.85,2.22])relief-=.0055*G(Math.abs(a>Math.PI?a-TAU:a)-angle,.11)*S(u,.22,.34)*(1-S(u,.66,.79));
 relief+=.003*Math.sin(u*78+Math.sin(a*4))*G(u-.52,.27)*side*ventral;
 const my=(mouthY(u)-cy-mid)/Math.max(ry,.001);
 relief+=.015*G(q-my,.19)*S(u,.002,.018)*(1-S(u,.12,.17));
 relief-=.010*G(q-my-.28,.17)*G(u-.046,.035);
 const eye=G(u-.137,.010)*G(Math.abs(a>Math.PI?a-TAU:a)-1.79,.14);relief-=.006*eye;
 const radial=1+relief/Math.max(.08,r.w);
 const y=cy+mid+(ry+relief)*q,rostrum=.080*G(u-.027,.025)*G(y-(cy-.075),.12)*S(u,0,.005);
 const melonAdvance=.085*G(u-.032,.045)*G(y-(cy+.19),.24)*S(y,cy-.05,cy+.06);
 return V(length*(.5-u)+rostrum+melonAdvance,y,r.w*sn*radial);
}
function oralEdge(u,side=1){let lo=0,hi=Math.PI;for(let i=0;i<30;i++){const a=(lo+hi)/2,p=bodyPoint(u,a),my=mouthY(C(.5-p.x/belugaDimensions.length,0,1));if(p.y>my)lo=a;else hi=a;}return bodyPoint(u,(lo+hi)/2*(side<0?-1:1));}
function geometry(p,ix,uv){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;}
function grid(nx,nz,fn){const p=[],ix=[],uv=[];for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){p.push(...fn(i/nx,j/nz));uv.push(i/nx,j/nz);}for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j,b=a+nz+1;ix.push(a,b,a+1,b,b+1,a+1);}return geometry(p,ix,uv);}
function seams(g,sides){const p=g.attributes.position,keys=new Map();for(let i=0;i<p.count;i++){const key=(sides?.[i]||0)+':'+[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e6)).join(':');if(!keys.has(key))keys.set(key,[]);keys.get(key).push(i);}return[...keys.values()].filter(a=>a.length>1);}
function finish(part){const g=part.mesh.geometry;(part.normalGeometry||g).computeVertexNormals();const n=g.attributes.normal;for(const row of part.seams){const v=V();for(const i of row)v.add(V().fromBufferAttribute(n,i));v.normalize();for(const i of row)n.setXYZ(i,v.x,v.y,v.z);}if(part.role==='purse-pad')for(let i=0;i<n.count;i++){const q=part.params[i],w=S(q.r,.65,1);if(w){const v=V().fromBufferAttribute(n,i).lerp(V(...q.normal),w).normalize();n.setXYZ(i,v.x,v.y,v.z);}}n.needsUpdate=true;g.attributes.position.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();}

// Inspect connectivity using decoded source positions. Never transform a
// normalized Int16 attribute in place: doing so would clamp decoded positions.
function sourceControls(gltf){
 const mesh=gltf.scene.getObjectByName('beluga-whale_0');if(!mesh?.isMesh)throw Error('Unexpected CC0 beluga control surface');gltf.scene.updateMatrixWorld(true);
 const p=mesh.geometry.attributes.position,ix=mesh.geometry.index.array,points=Array.from({length:p.count},(_,i)=>V(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(mesh.matrixWorld)),keys=new Map(),ids=[],parent=[];
 for(const v of points){const key=v.toArray().map(x=>Math.round(x*1e5)).join(':');if(!keys.has(key)){keys.set(key,parent.length);parent.push(parent.length);}ids.push(keys.get(key));}
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};for(let i=0;i<ix.length;i+=3){const a=find(ids[ix[i]]),b=find(ids[ix[i+1]]),c=find(ids[ix[i+2]]);parent[b]=a;parent[c]=a;}
 const groups=new Map();for(let i=0;i<points.length;i++){const key=find(ids[i]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(points[i]);}const core=[...groups.values()].sort((a,b)=>b.length-a.length)[0];if(core.length!==2509)throw Error('CC0 source topology differs from reviewed body');
 const zs=[...new Set(core.map(v=>v.z))].sort((a,b)=>b-a),length=zs[0]-zs.at(-1),u=zs.map(z=>(zs[0]-z)/length),rows=[];
 for(let i=0;i<u.length-1;i++)rows.push(u[i],(u[i]+u[i+1])/2);rows.push(1);return{u:rows,originalRings:zs.length,originalCoreVertices:core.length,decodedLength:length};
}
function splitMouth(src){
 const a=src.attributes,p=a.position,source=Array.from({length:p.count},(_,i)=>({id:String(i),p:V().fromBufferAttribute(p,i),uv:[a.uv.getX(i),a.uv.getY(i)]})),rows=[],ix=[],lookup=new Map(),cuts=new Map();
 const scalar=v=>v.p.y-mouthY(C(.5-v.p.x/belugaDimensions.length,0,1));
 function add(poly,side){for(let j=1;j<poly.length-1;j++){const tri=[poly[0],poly[j],poly[j+1]];if(tri[1].p.clone().sub(tri[0].p).cross(tri[2].p.clone().sub(tri[0].p)).lengthSq()<1e-23)continue;for(const v of tri){const key=side+':'+v.id;if(!lookup.has(key)){lookup.set(key,rows.length);rows.push({...v,side});}ix.push(lookup.get(key));}}}
 for(let k=0;k<src.index.count;k+=3){const tri=Array.from(src.index.array.slice(k,k+3),i=>source[i]);for(const side of[-1,1]){const poly=[];for(let i=0;i<3;i++){const x=tri[i],y=tri[(i+1)%3],fx=scalar(x)*side,fy=scalar(y)*side;if(fx>=0)poly.push(x);if(fx*fy<0){const f=fx/(fx-fy),key='cut:'+ [x.id,y.id].sort().join(':');if(!cuts.has(key))cuts.set(key,{id:key,p:x.p.clone().lerp(y.p,f),uv:x.uv.map((v,j)=>L(v,y.uv[j],f))});poly.push(cuts.get(key));}}if(poly.length>2)add(poly,side);}}
 return{g:geometry(rows.flatMap(v=>v.p.toArray()),ix,rows.flatMap(v=>v.uv)),sides:rows.map(v=>v.side)};
}
function foil(kind,side=1){
 const p=[],uv=[],ix=[],ns=40,nc=64,{length,cy}=belugaDimensions;
 for(let i=0;i<=ns;i++){const t=i/ns,tip=Math.sqrt(Math.max(0,1-t*t));let z,x0,chord,y,thick;
  if(kind==='flipper'){z=side*(.255+.49*t);x0=length*(.5-.255)-.20*t;chord=.32*(.73+.40*Math.sin(Math.PI*t))*tip;y=cy-.22-.28*t+.035*t*t;thick=.049*tip;}
  else{z=side*.45*t;x0=-length*.5+.17-.15*t;chord=(.34+.08*Math.sin(Math.PI*t))*(1-t*t)**.62;y=cy-.008+.028*t*t;thick=.036*tip;}
  for(let j=0;j<=nc;j++){const a=j/nc*TAU,x=x0+Math.cos(a)*chord*.5,yy=y+Math.sin(a)*thick*(.82+.18*Math.cos(a));p.push(x,yy,z);uv.push(t,j/nc);}
 }
 for(let i=0;i<ns;i++)for(let j=0;j<nc;j++){const a=i*(nc+1)+j,b=a+nc+1;side>0?ix.push(a,a+1,b,b,a+1,b+1):ix.push(a,b,a+1,b,b+1,a+1);}return geometry(p,ix,uv);
}
function tube(points,radius=0.009,segments=120){return new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,radius,10,false);}
const files={skin:new URL('./beluga-skin-v0658.png',import.meta.url).href,normal:new URL('./beluga-normal-v0658.png',import.meta.url).href,roughness:new URL('./beluga-roughness-v0658.png',import.meta.url).href};
function skinMaps(m,mats){const pending=[],maps={};for(const[k,url]of Object.entries(files)){let texture;if(typeof document==='undefined')texture=new T.Texture();else pending.push(new Promise((resolve,reject)=>{texture=new T.TextureLoader().load(url,resolve,undefined,reject);}));texture.flipY=false;texture.colorSpace=k==='skin'?T.SRGBColorSpace:T.NoColorSpace;texture.userData={compatibilityResolution:2048,file:url.split('/').pop(),author:'PhenoVoxel Archive',license:'MIT',scope:'Original numerical ivory skin field; no projected user pixels or calibrated tissue optics'};maps[k]=texture;}for(const mat of mats){mat.map=maps.skin;mat.normalMap=maps.normal;mat.normalScale.set(.18,.18);mat.roughnessMap=maps.roughness;mat.roughness=.70;mat.userData={compatibilityWetSkin:true,compatibilitySurfaceDetail:true,compatibilityLinearTexture:true};mat.needsUpdate=true;}m.belugaSurface.textures=maps;m.textureReady=Promise.all(pending);}

export function prepareBeluga(gltf,s,asset){
 const root=new T.Group(),parts=[],controls=sourceControls(gltf),{cy,length}=belugaDimensions;
 const skin=new T.MeshStandardMaterial({color:'#ffffff',roughness:.54,metalness:0}),appendageSkin=skin.clone(),sealSkin=skin.clone(),lipMat=new T.MeshStandardMaterial({color:'#d7d9d0',roughness:.56,metalness:0}),oralMat=new T.MeshStandardMaterial({color:'#716261',roughness:.68,side:T.DoubleSide}),gumMat=new T.MeshStandardMaterial({color:'#9a8380',roughness:.67,side:T.DoubleSide});sealSkin.side=T.DoubleSide;
 const add=(g,mat,name,role='body',options={})=>{const mesh=new T.Mesh(g,mat);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);const part={mesh,role,...options,neutral:g.attributes.position.array.slice(),normal:g.attributes.normal.array.slice(),seams:seams(g,options.sides)};parts.push(part);return part;};
 const pos=[],uv=[],ix=[],nr=96;for(const u of controls.u)for(let j=0;j<=nr;j++){pos.push(...bodyPoint(u,j/nr*TAU));uv.push(u,j/nr);}for(let i=0;i<controls.u.length-1;i++)for(let j=0;j<nr;j++){const a=i*(nr+1)+j,b=a+nr+1;ix.push(a,b,a+1,b,b+1,a+1);}const exterior=splitMouth(geometry(pos,ix,uv));
 const body=add(exterior.g,skin,'Resculpted CC0 beluga adult exterior','body',{sides:exterior.sides});
 for(const side of[-1,1]){add(foil('flipper',side),appendageSkin,'Broad rounded pectoral flipper '+side,'flipper',{side,pivot:V(length*(.5-.255),cy-.22,side*.255)});add(foil('fluke',side),appendageSkin,'Horizontal low-aspect-ratio fluke '+side,'fluke',{side});}
 const ridge=grid(100,14,(v,w)=>{const u=.46+.34*v,p=bodyPoint(u,0),z=(w*2-1)*(.025+.014*Math.sin(Math.PI*v));p.y+=.023*Math.sin(Math.PI*v)**.7*Math.sin(Math.PI*w)**2;p.z=z;return p;});add(ridge,appendageSkin,'Low tough dorsal ridge without a dorsal fin','ridge');
 for(const side of[-1,1]){
  const e=bodyPoint(.137,1.79*side),eyeGeo=new T.SphereGeometry(1,28,16);eyeGeo.scale(.014,.012,.008);eyeGeo.translate(e.x,e.y,e.z+side*.002);add(eyeGeo,new T.MeshStandardMaterial({color:'#151c1c',roughness:.18}),'Small lateral eye '+side,'eye');
  const pts=[];for(let j=0;j<=48;j++){const a=j/48*TAU;pts.push(V(e.x+.020*Math.cos(a),e.y+.017*Math.sin(a),e.z+side*(.003-.004*Math.sin(a))));}add(tube(pts,.0038,80),lipMat,'Soft eyelid margin '+side,'eye');
 }
 const blow=bodyPoint(.178,0),slit=[];for(let j=0;j<=40;j++){const a=j/40*Math.PI;slit.push(V(blow.x+.024*Math.cos(a),blow.y+.001, .012*Math.sin(a)));}add(tube(slit,.003,60),new T.MeshStandardMaterial({color:'#575f5c',roughness:.64}),'Single closed blowhole slit','blowhole');
 const outer=[];for(let j=70;j>=0;j--)outer.push(oralEdge(.157*j/70,-1));for(let j=1;j<=70;j++)outer.push(oralEdge(.157*j/70,1));
 const crease=add(tube(outer,.0021,260),new T.MeshStandardMaterial({color:'#66716c',roughness:.64}),'Closed mouth commissure crease','crease');
 for(const half of[-1,1]){const pts=outer.map(v=>v.clone().add(V(0,half*.003,0)));add(tube(pts,.0032,260),lipMat,(half>0?'Upper':'Lower')+' integrated fleshy lip',half>0?'upper':'lower');}
 // Cut the feeding orifice along shared triangle-edge intersections. The
 // lip mound and the retained exterior use precisely the same boundary;
 // an overlapping ellipse leaves cracks when viewed obliquely.
 const bp=body.mesh.geometry.attributes.position,bu=body.mesh.geometry.attributes.uv,bn=body.mesh.geometry.attributes.normal,cutRows=Array.from({length:bp.count},(_,i)=>({p:V().fromBufferAttribute(bp,i),uv:[bu.getX(i),bu.getY(i)],normal:V().fromBufferAttribute(bn,i),side:exterior.sides[i]})),cutIndex=[],boundary=new Map(),edgeCache=new Map();
 const cutField=p=>((p.x-1.97)/.35)**2+((p.y-(cy-.115))/.14)**2+(p.z/.27)**2-1;
 function intersection(i,j){const key=[i,j].sort((a,b)=>a-b).join(':');if(edgeCache.has(key))return edgeCache.get(key);const a=cutRows[i],b=cutRows[j],f=cutField(a.p)/(cutField(a.p)-cutField(b.p)),row={p:a.p.clone().lerp(b.p,f),uv:a.uv.map((v,k)=>L(v,b.uv[k],f)),normal:a.normal.clone().lerp(b.normal,f).normalize(),side:a.side};const id=cutRows.length;cutRows.push(row);edgeCache.set(key,id);boundary.set(row.p.toArray().map(v=>Math.round(v*1e7)).join(':'),row);return id;}
 for(let k=0;k<body.mesh.geometry.index.count;k+=3){const tri=Array.from(body.mesh.geometry.index.array.slice(k,k+3));if(Math.max(...tri.map(i=>cutRows[i].p.x))<1.25){cutIndex.push(...tri);continue;}const poly=[];for(let j=0;j<3;j++){const i=tri[j],n=tri[(j+1)%3],fa=cutField(cutRows[i].p),fb=cutField(cutRows[n].p);if(fa>=0)poly.push(i);if(fa*fb<0)poly.push(intersection(i,n));}for(let j=1;j<poly.length-1;j++)cutIndex.push(poly[0],poly[j],poly[j+1]);}
 const shell=add(geometry(cutRows.flatMap(v=>v.p.toArray()),cutIndex,cutRows.flatMap(v=>v.uv)),skin,'Laterally sealed feeding exterior','body',{sides:cutRows.map(v=>v.side),feedingExterior:true});body.feedingCover=true;
 const perimeter=[...boundary.values()].map(v=>({...v,a:(Math.atan2(v.p.z/.27,(v.p.y-(cy-.115))/.14)+TAU)%TAU})).sort((a,b)=>a.a-b.a),padParams=[],count=perimeter.length;
 if(count<40||perimeter.some((v,i)=>v.p.distanceTo(perimeter[(i+1)%count].p)>.05))throw Error('Feeding aperture has no continuous inspected exterior boundary');
 const pad=grid(22,count,(r,v)=>{const edge=perimeter[Math.round(v*count)%count],a=edge.a;padParams.push({r,a,outer:edge.p.toArray(),normal:edge.normal.toArray()});return V(length*.5+.025,cy-.115,0).lerp(edge.p,r);});
 const lipMound=add(pad,sealSkin,'Soft anterior pursed lip mound','purse-pad',{oral:true,params:padParams});lipMound.seams=Array.from({length:23},(_,r)=>[r*(count+1),r*(count+1)+count]);
 const tunnelParams=[],tunnel=grid(12,64,(u,v)=>{const a=v*TAU;tunnelParams.push({u,a});return V(length*.5-.18*u,cy-.145+.038*Math.cos(a),.036*Math.sin(a));});add(tunnel,new T.MeshStandardMaterial({color:'#574848',roughness:.82,side:T.DoubleSide}),'Selected short oral aperture lining','aperture',{oral:true,params:tunnelParams});
 const at=(u,v)=>oralEdge(.003+.154*u,-1).lerp(oralEdge(.003+.154*u,1),v);
 for(const half of[-1,1]){const g=grid(80,32,(u,v)=>{const p=at(u,v);p.y+=half*.035*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);return p;});add(g,oralMat,half>0?'Inner palate':'Lower oral floor',half>0?'upper':'lower',{oral:true});}
 const tongue=grid(60,28,(u,v)=>{const p=at(.12+.73*u,.21+.58*v);p.y-=.025-.014*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);return p;});add(tongue,gumMat,'Broad mobile tongue surface','tongue',{oral:true});
 for(const side of[-1,1])for(const half of[-1,1]){
  const gum=[];for(let j=0;j<=50;j++){const p=oralEdge(.025+.12*j/50,side);p.z*=.83;p.y+=half*.009;gum.push(p);}add(tube(gum,.013,100),gumMat,'Gingival margin '+half+' '+side,half>0?'upper':'lower',{oral:true});
  for(let j=0;j<9;j++){const u=.035+.107*j/8,p=oralEdge(u,side);p.z*=.83;p.y+=half*.012;const h=.021*(.76+.24*Math.sin(Math.PI*j/8)),g=new T.SphereGeometry(1,16,12);g.scale(.0075,h*.58,.0075);g.translate(p.x,p.y-half*h*.42,p.z);add(g,new T.MeshStandardMaterial({color:'#c8c6ab',roughness:.65}),'Selected worn peg tooth '+half+' '+side+' '+j,half>0?'upper':'lower',{oral:true,tooth:true});}
 }
 const m={id:s.id,root,gltf,asset,kind:'cetacean',forward:1,natural:true,textured:true,surfaceDetailed:true,parts:{},features:[],current:'observe',bones:[],limbs:[],clipMap:{}};
 m.belugaSurface={parts,body,crease,controls,length,cy,poseKey:null,evidence:belugaEvidence};skinMaps(m,[skin,appendageSkin,sealSkin]);
 const targets=[bodyPoint(.08,1.2),V(-1.80,cy,.34),bodyPoint(.60,0),bodyPoint(.215,1.9),oralEdge(.055,1),bodyPoint(.137,1.79)];
 m.featureBindings=targets.map((target,j)=>{const candidates=j===1?parts.filter(p=>p.role==='fluke'):j===2?parts.filter(p=>p.role==='ridge'):[body];let best=null,dist=Infinity;for(const p of candidates){const a=p.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const d=V().fromBufferAttribute(a,i).distanceToSquared(target);if(d<dist){dist=d;best={mesh:p.mesh,indices:[i],kind:'Selected exterior region; not a measured anatomical landmark'};}}}return best;});m.features=targets.map(()=>V());
 Object.assign(root.userData,{aquaticStudy:true,focusAnatomy:true,anatomyFocusScale:[.49,.55,.54,.48,.40,.25],anatomyViewDirections:[[.6,.08,1],[0,.85,1],[0,.35,1],[.5,-.08,1],[1,-.10,.4],[.2,.05,1]],belugaSource:'3D Assets CC0 control surface, contributor-reported AI origin; extensively resampled/resculpted, with new appendages, face, oral surfaces, skin and finite studies. No living scan or fitted individual.'});
 m.motionBounds={swim:new T.Box3(V(-2.25,.65,-.83),V(2.05,2.30,.83)),glide:new T.Box3(V(-2.25,.65,-.83),V(2.05,2.30,.83))};animateBeluga(m,'observe',0);return m;
}
export function belugaFeedingPhase(t){
 const time=C(t,0,8),q=time/8,open=S(q,.18,.43)*(1-S(q,.50,.70)),purse=S(q,.10,.29)*(1-S(q,.60,.82)),gular=S(q,.31,.56)*(1-S(q,.66,.86));
 return{time,q,gape:time===0||time===8?0:open,purse:time===0||time===8?0:purse,gular:time===0||time===8?0:gular,stage:q<.10?'Closed-mouth approach':q<.29?'Lips purse and lateral gape closes':q<.43?'Anterior aperture opens':q<.56?'Gular depression at the anterior aperture':q<.70?'Jaw closure':q<.86?'Lip and throat recovery':q<1?'Neutral recovery':'Study complete',scope:'Eight illustrative seconds, selected slow playback; not a measured trial clock or simulated suction.'};
}
export function belugaLine(action,t){
 const {length}=belugaDimensions,clock=C(t,0,12),env=clock<=0||clock>=12?0:S(clock,0,1)*(1-S(clock,10.5,12)),stroke=action==='glide'?1-S(clock,4.3,5.3):1,phase=TAU*belugaEvidence.frequencyHz*clock,A=belugaEvidence.heaveM/belugaEvidence.referenceLengthM*length*env*stroke,n=192,line=[];let x=length*.5;
 const y=u=>['swim','glide'].includes(action)?A*S(u,.40,.96)**2*Math.sin(phase-2.1*(1-u)):0;
 for(let i=0;i<=n;i++){const u=i/n,du=.0001,dy=(y(C(u+du,0,1))-y(C(u-du,0,1)))/(Math.min(1,u+du)-Math.max(0,u-du)),a=-Math.asin(C(dy/length,-.85,.85));if(i)x-=length/n*Math.cos(a);line.push({x,y:y(u),a});}return{line,clock,env,stroke,phase};
}
function oralPoint(p,role,st,wide=false){
 const {length,cy}=belugaDimensions,u=C(.5-p.x/length,0,1),out=p.clone(),lower=role==='lower'||role==='tongue',weight=1-S(u,.13,.19),aperture=wide?1:1-S(u,.020,.050),angle=-(wide?.34:.14)*st.gape*weight*aperture,hx=length*(.5-.155),hy=mouthY(.155);
 if(lower){const dx=p.x-hx,dy=p.y-hy;out.x=hx+dx*Math.cos(angle)-dy*Math.sin(angle);out.y=hy+dx*Math.sin(angle)+dy*Math.cos(angle);}
 const throat=lower?S(u,.09,.16)*(1-S(u,.25,.32))*S(cy-p.y,.10,.25)*S(mouthY(u)-p.y,.035,.10):0;out.y-=.030*st.gular*throat;if(role==='tongue'){out.x-=.020*st.gular;out.y-=.018*st.gular;}return out;
}
export function animateBeluga(m,action,t){
 const f=m.belugaSurface;if(!f)return false;const {cy,length}=belugaDimensions,feeding=action==='forage'||action==='mouth',limit=feeding?8:12,clock=C(t,0,limit),key=action==='observe'?'observe':action+':'+clock;if(f.poseKey===key)return true;
 const st=belugaFeedingPhase(clock),wide=action==='mouth',lineState=belugaLine(action,clock),{line,env,stroke,phase}=lineState,n=line.length-1,wave=['swim','glide'].includes(action),neutral=action==='observe'||clock===0||clock===limit;
 const mapLine=(p,u)=>{const uu=C(u,0,1),at=uu*n,j=Math.min(n-1,Math.floor(at)),w=at-j,a=L(line[j].a,line[j+1].a,w),dy=p.y-cy,dx=p.x-length*(.5-uu);return{v:V(L(line[j].x,line[j+1].x,w)+dx*Math.cos(a)-dy*Math.sin(a),cy+L(line[j].y,line[j+1].y,w)+dx*Math.sin(a)+dy*Math.cos(a),p.z),a};};
 const flukePivot=mapLine(V(length*(.5-.945),cy,0),.945),alpha=belugaEvidence.pitchDegrees*Math.PI/180*env*stroke*Math.cos(phase),headAngle=action==='head'?.32*Math.sin(TAU*clock/12)*Math.sin(Math.PI*clock/12)**2:0;
 for(const part of f.parts){const g=part.mesh.geometry,p=g.attributes.position,base=part.neutral;
  part.mesh.visible=part.feedingCover?!(action==='forage'&&st.purse>.02):part.feedingExterior?action==='forage'&&st.purse>.02:part.role==='purse-pad'?action==='forage'&&st.purse>.02:part.role==='aperture'?action==='forage'&&st.gape>.005:part.oral?wide&&st.gape>.005:part.mesh.name.includes('integrated fleshy lip')?action!=='forage'||st.purse<.02:part.role==='crease'?!feeding||st.gape<.005:true;
  if(neutral||!part.mesh.visible){p.array.set(base);g.attributes.normal.array.set(part.normal);p.needsUpdate=true;g.attributes.normal.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();continue;}
  for(let i=0;i<p.count;i++){
   let v=V(base[i*3],base[i*3+1],base[i*3+2]),u=C(.5-v.x/length,0,1);
   if(feeding){if(part.role==='aperture'){const {u,a}=part.params[i],ry=L(.0375,.052,u)*st.gape,rz=L(.0355,.050,u)*st.gape;v.set(length*.5+.025*st.purse-.18*u,cy-.115-.030*st.gape+ry*Math.cos(a),rz*Math.sin(a));}
    else if(part.role==='purse-pad'){const {r,a,outer}=part.params[i],edge=V(...outer),side=edge.y<mouthY(C(.5-edge.x/length,0,1))?'lower':'upper',attached=oralPoint(edge,side,{...st,gape:0}),inner=V(length*.5+.025*st.purse,cy-.115-.030*st.gape+.038*st.gape*Math.cos(a),.036*st.gape*Math.sin(a));v=inner.lerp(attached,r);v.x+=.045*Math.sin(Math.PI*r)*st.purse;}
    else{const role=part.role==='body'?(part.sides[i]<0?'lower':'upper'):part.role;v=oralPoint(v,role,action==='forage'&&part.role==='body'?{...st,gape:0}:st,wide);}}
   if(action==='melon'){const e=Math.sin(TAU*clock/12)*Math.sin(Math.PI*clock/12)**2,mask=G(u-.066,.062)*S(v.y,cy+.06,cy+.23);v.x+=.075*e*mask;v.y-=.030*e*mask;}
   if(headAngle&&u<.31){const a=headAngle*(1-S(u,.17,.31)),pivot=length*(.5-.245),dx=v.x-pivot;v.set(pivot+dx*Math.cos(a)+v.z*Math.sin(a),v.y,v.z*Math.cos(a)-dx*Math.sin(a));}
   if(wave){if(part.role==='flipper'){const side=part.side,pivot=part.pivot,w=C(Math.abs(v.z-pivot.z)/.49,0,1),a=.065*env*stroke*Math.sin(phase+.65)*w,dy=v.y-pivot.y,dz=v.z-pivot.z;v.y=pivot.y+dy*Math.cos(a)-dz*Math.sin(a)*side;v.z=pivot.z+dz*Math.cos(a)+dy*Math.sin(a)*side;}
    const q=mapLine(v,u);v=q.v;if(part.role==='fluke'){const a=alpha-flukePivot.a,dx=v.x-flukePivot.v.x,dy=v.y-flukePivot.v.y;v.x=flukePivot.v.x+dx*Math.cos(a)-dy*Math.sin(a);v.y=flukePivot.v.y+dx*Math.sin(a)+dy*Math.cos(a);}
   }
   p.setXYZ(i,v.x,v.y,v.z);
  }finish(part);
 }
 const turn=action==='turn'?.30*Math.sin(Math.PI*clock/12)**2:0,roll=action==='roll'?Math.PI*.5*Math.sin(Math.PI*clock/12)**2:0;m.root.rotation.set(roll,turn,0,'ZXY');const center=V(0,cy,0);m.root.position.copy(center.clone().sub(center.applyEuler(m.root.rotation)));m.root.scale.setScalar(1);m.root.updateMatrixWorld(true);
 f.current=feeding?{...st,stage:wide?(st.gape>.95?'Open mouth · selected teeth and tongue':st.gape>0?'Jaw opening / closure':clock===8?'Study complete':'Closed mouth'):st.stage}:null;f.poseKey=key;updateSpecimenLandmarks(m);return true;
}
