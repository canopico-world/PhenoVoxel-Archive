import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import crypto from 'node:crypto';
import * as T from 'three';
import {Document,NodeIO} from '@gltf-transform/core';
import sharp from 'sharp';
// Extract the unchanged licensed source ZIP, then supply source and output folders.
if(!process.argv[2]||!process.argv[3])throw Error('Usage: node fin-whale-convert-v0655.mjs <extracted-source-folder> <output-folder>');
const p=pathToFileURL(path.resolve(process.argv[2])+path.sep),r=pathToFileURL(path.resolve(process.argv[3])+path.sep);await fs.mkdir(r,{recursive:true});
const obj=await fs.readFile(new URL('source/whale.obj',p),'utf8');
let positions=[],uvs=[],faces=[];
for(const line of obj.split(/\r?\n/)){const a=line.trim().split(/\s+/);if(a[0]==='v')positions.push(a.slice(1).map(Number));if(a[0]==='vt')uvs.push(a.slice(1).map(Number));if(a[0]==='f')faces.push(a.slice(1).map(s=>{const [v,t]=s.split('/').map(Number);return{v:v-1,uv:uvs[t-1]};}));}
const original={vertices:positions.length,polygons:faces.length};
function subdivide(){
 const fp=faces.map(face=>face.reduce((v,c)=>v.map((x,j)=>x+positions[c.v][j]/face.length),[0,0,0])),edges=new Map(),incident=positions.map(()=>[]),adj=positions.map(()=>new Set());
 for(let f=0;f<faces.length;f++){const face=faces[f];for(let j=0;j<face.length;j++){const a=face[j].v,b=face[(j+1)%face.length].v,key=[a,b].sort((x,y)=>x-y).join(':');if(!edges.has(key))edges.set(key,{a,b,faces:[]});edges.get(key).faces.push(f);incident[a].push(f);adj[a].add(b);adj[b].add(a);}}
 const np=positions.map((v,i)=>{const boundary=[...adj[i]].filter(j=>edges.get([i,j].sort((a,b)=>a-b).join(':')).faces.length===1);if(boundary.length===2)return v.map((x,k)=>.75*x+.125*(positions[boundary[0]][k]+positions[boundary[1]][k]));const fs=[...new Set(incident[i])],n=adj[i].size;if(!n)return v;return v.map((x,k)=>((fs.reduce((s,f)=>s+fp[f][k],0)/fs.length)+2*[...adj[i]].reduce((s,j)=>s+(x+positions[j][k])*.5,0)/n+(n-3)*x)/n);});
 for(const e of edges.values()){e.index=np.length;np.push([0,1,2].map(k=>e.faces.length===2?(positions[e.a][k]+positions[e.b][k]+fp[e.faces[0]][k]+fp[e.faces[1]][k])*.25:(positions[e.a][k]+positions[e.b][k])*.5));}
 const faceStart=np.length;np.push(...fp);const nf=[];
 for(let f=0;f<faces.length;f++){const face=faces[f],fu=[0,1].map(k=>face.reduce((s,c)=>s+c.uv[k]/face.length,0));for(let j=0;j<face.length;j++){const a=face[j],b=face[(j+1)%face.length],c=face[(j+face.length-1)%face.length],edge=(a,b)=>edges.get([a.v,b.v].sort((a,b)=>a-b).join(':')).index;nf.push([{v:a.v,uv:a.uv},{v:edge(a,b),uv:a.uv.map((x,k)=>(x+b.uv[k])*.5)},{v:faceStart+f,uv:fu},{v:edge(c,a),uv:a.uv.map((x,k)=>(x+c.uv[k])*.5)}]);}}
 positions=np;faces=nf;
}
subdivide();subdivide();
const min=positions.reduce((a,v)=>a.map((x,k)=>Math.min(x,v[k])),[Infinity,Infinity,Infinity]),max=positions.reduce((a,v)=>a.map((x,k)=>Math.max(x,v[k])),[-Infinity,-Infinity,-Infinity]);
const scale=3.85/(max[2]-min[2]),center=min.map((x,k)=>(x+max[k])*.5),axisX=-.186;
// A single disclosed rigid orientation/scale; artist proportions are retained.
positions=positions.map(v=>[(v[2]-center[2])*scale,(v[1]-center[1])*scale+1.45,-(v[0]-axisX)*scale]);
const normal=positions.map(()=>new T.Vector3());
for(const f of faces)for(let j=1;j<f.length-1;j++){const a=f[0].v,b=f[j].v,c=f[j+1].v,n=new T.Vector3().fromArray(positions[b]).sub(new T.Vector3().fromArray(positions[a])).cross(new T.Vector3().fromArray(positions[c]).sub(new T.Vector3().fromArray(positions[a])));normal[a].add(n);normal[b].add(n);normal[c].add(n);}
normal.forEach(n=>n.normalize());const pp=[],nn=[],tt=[],ii=[],lookup=new Map();
for(const face of faces){const ids=face.map(c=>{const key=c.v+':'+c.uv.map(x=>x.toFixed(9)).join(',');if(!lookup.has(key)){lookup.set(key,pp.length/3);pp.push(...positions[c.v]);nn.push(...normal[c.v]);tt.push(c.uv[0],1-c.uv[1]);}return lookup.get(key);});for(let j=1;j<ids.length-1;j++)ii.push(ids[0],ids[j],ids[j+1]);}
const d=new Document(),buf=d.createBuffer(),acc=(name,type,a)=>d.createAccessor(name).setType(type).setArray(a).setBuffer(buf),mat=d.createMaterial('Disclosed albedo derivative; Johann Woelper original normal and roughness').setBaseColorFactor([1,1,1,1]).setRoughnessFactor(.75).setMetallicFactor(0).setDoubleSided(false);
const originalColour=await fs.readFile(new URL('textures/pbr_whale_color.tga.png',p)),{data:rgba,info}=await sharp(originalColour).ensureAlpha().raw().toBuffer({resolveWithObject:true}),mask=new Float32Array(info.width*info.height),smooth=(x,a,b)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
for(let j=0;j<ii.length;j+=3){const ids=ii.slice(j,j+3),a=ids.map(i=>[tt[i*2]*(info.width-1),tt[i*2+1]*(info.height-1)]),area=(a[1][0]-a[0][0])*(a[2][1]-a[0][1])-(a[1][1]-a[0][1])*(a[2][0]-a[0][0]);if(Math.abs(area)<1e-8)continue;const left=Math.max(0,Math.floor(Math.min(...a.map(v=>v[0])))),right=Math.min(info.width-1,Math.ceil(Math.max(...a.map(v=>v[0])))),top=Math.max(0,Math.floor(Math.min(...a.map(v=>v[1])))),bottom=Math.min(info.height-1,Math.ceil(Math.max(...a.map(v=>v[1]))));for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const u=((a[1][0]-x)*(a[2][1]-y)-(a[1][1]-y)*(a[2][0]-x))/area,v=((a[2][0]-x)*(a[0][1]-y)-(a[2][1]-y)*(a[0][0]-x))/area,w=1-u-v;if(Math.min(u,v,w)<-.001)continue;const X=ids.reduce((s,i,k)=>s+pp[i*3]*[u,v,w][k],0),Y=ids.reduce((s,i,k)=>s+pp[i*3+1]*[u,v,w][k],0),Z=ids.reduce((s,i,k)=>s+pp[i*3+2]*[u,v,w][k],0),along=.5-X/3.85,m=(1-smooth(along,.20,.27))*smooth(-Z,.02,.12)*(1-smooth(Y,1.62-.25*along-.012,1.62-.25*along+.012));mask[y*info.width+x]=Math.max(mask[y*info.width+x],m);}}
const linear=Uint8Array.from({length:256},(_,i)=>i),toLinear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4,toSRGB=v=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
let corrected=0;for(let i=0;i<mask.length;i++){const j=i*4,r0=toLinear(rgba[j]/255),g0=toLinear(rgba[j+1]/255),b0=toLinear(rgba[j+2]/255),l=.2126*r0+.7152*g0+.0722*b0,target=(.045+.435*l**.72)*(1-.78*mask[i]),factor=target/Math.max(.0001,l);for(const[k,v]of[r0,g0,b0].entries())rgba[j+k]=Math.max(0,Math.min(255,Math.round(toSRGB(Math.max(0,target+(v-l)*.3*factor))*255)));if(mask[i]>.05)corrected++;}
const derivedColour=await sharp(rgba,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();await fs.writeFile(new URL('fin-whale-albedo-v0655.png',r),derivedColour);
for(const [source,setter]of [['color','setBaseColorTexture'],['nmap','setNormalTexture'],['rough','setMetallicRoughnessTexture'],['ao','setOcclusionTexture']]){const bytes=source==='color'?derivedColour:await fs.readFile(new URL('textures/pbr_whale_'+source+'.tga.png',p));const t=d.createTexture(source==='color'?'Disclosed gray-brown tone and dark anatomical-left mandibular derivative':'Original '+source).setImage(bytes).setMimeType('image/png');mat[setter](t);}
const prim=d.createPrimitive().setAttribute('POSITION',acc('Position','VEC3',new Float32Array(pp))).setAttribute('NORMAL',acc('Normal','VEC3',new Float32Array(nn))).setAttribute('TEXCOORD_0',acc('Original face-varying UV, image-origin conversion','VEC2',new Float32Array(tt))).setIndices(acc('Triangles','SCALAR',new Uint32Array(ii))).setMaterial(mat);
d.createScene().addChild(d.createNode('Johann Woelper supplied fin whale').setMesh(d.createMesh('Two Catmull-Clark refinement levels of supplied OBJ').addPrimitive(prim)));
d.getRoot().setExtras({author:'Johann Woelper',license:'CC BY-NC 4.0',source:'https://sketchfab.com/3d-models/fin-whale-fb69578cfaaf45969f3118de4103d03b',modifications:'Supplied control-cage derivative; two Catmull-Clark levels, selected uniform scale/orientation and image-origin UV conversion. Active albedo has a disclosed tone and dark-left-jaw derivative. Original active normal, roughness and AO PNG payloads unchanged. No scan or fitted specimen.'});
const bytes=await new NodeIO().writeBinary(d);await fs.writeFile(new URL('model-fin-whale-woelper.glb',r),bytes);
const proof={original,derived:{vertices:pp.length/3,triangles:ii.length/3,subdivisionLevels:2},normalLength:[Math.min(...normal.map(n=>n.length())),Math.max(...normal.map(n=>n.length()))],scale,sourceBounds:{min,max},albedo:{sourceSha256:crypto.createHash('sha256').update(originalColour).digest('hex'),derivedSha256:crypto.createHash('sha256').update(derivedColour).digest('hex'),correctedLeftJawTexels:corrected,scope:'Original licensed artist atlas with disclosed luminance/saturation remap and a selected dark anatomical-left mandibular field, compared with NOAA anatomy; not measured reflectance or a fitted individual'},sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};await fs.writeFile(new URL('conversion-proof.json',r),JSON.stringify(proof,null,2)+'\n');console.log(proof);
