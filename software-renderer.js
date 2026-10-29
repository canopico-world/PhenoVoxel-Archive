import * as THREE from 'three';
import {selectedPigmentToneRGB} from './material-response.js';

// MIT. A canvas rasterizer for the same Three.js scene when WebGL is unavailable.
// It retains source triangles, UVs, skin/morph deformation and instance transforms.
// Lighting is approximate; GPU shadows and refraction are not reproduced.
// Explicitly opted-in surfaces also sample tangent normal and roughness maps.
const srgb = Float32Array.from({length:256},(_,i)=>{
 const x=i/255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);
});
const display = Uint8Array.from({length:4096},(_,i)=>{
 const x=i/1024,v=Math.max(0,Math.min(1,(x*(2.51*x+.03))/(x*(2.43*x+.59)+.14)));
 return Math.round(255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055));
});
const channel=x=>display[Math.max(0,Math.min(4095,Math.round(x*1024)))];

export function filteredTextureRGB(texture,u,v){
 const x=Math.max(0,Math.min(texture.width-1,u*texture.width-.5)),y=Math.max(0,Math.min(texture.height-1,v*texture.height-.5)),x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,result=[0,0,0];
 for(let j=0;j<2;j++)for(let i=0;i<2;i++){const index=(Math.min(texture.height-1,y0+j)*texture.width+Math.min(texture.width-1,x0+i))*4,w=(i?fx:1-fx)*(j?fy:1-fy);for(let k=0;k<3;k++)result[k]+=w*(texture.linear?texture.data[index+k]/255:srgb[texture.data[index+k]]);}
 return result;
}

export function rasterTriangle(frame, vertices, material, texture, reverse=false, detail=null) {
 const {width,height,pixels,depth}=frame,[a,b,c]=vertices;
 if(a.w<=0||b.w<=0||c.w<=0)return;
 const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 if(!Number.isFinite(area)||Math.abs(area)<.00001)return;
 const front=(area<0)!==reverse;
 if(material.side===THREE.FrontSide&&!front||material.side===THREE.BackSide&&front)return;
 const left=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),right=Math.min(width-1,Math.ceil(Math.max(a.x,b.x,c.x)));
 const top=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),bottom=Math.min(height-1,Math.ceil(Math.max(a.y,b.y,c.y)));
 const color=material.color||{r:1,g:1,b:1},opacity=material.opacity??1,emissive=material.emissive||{r:0,g:0,b:0},ei=material.emissiveIntensity??1;
 let tangent=null,bitangent=null;
 if(detail&&material.userData?.compatibilitySurfaceDetail){
  const e1=new THREE.Vector3(b.wx-a.wx,b.wy-a.wy,b.wz-a.wz),e2=new THREE.Vector3(c.wx-a.wx,c.wy-a.wy,c.wz-a.wz),du1=b.u-a.u,dv1=b.v-a.v,du2=c.u-a.u,dv2=c.v-a.v,det=du1*dv2-du2*dv1;
  if(Math.abs(det)>1e-12){tangent=e1.clone().multiplyScalar(dv2).addScaledVector(e2,-dv1).multiplyScalar(1/det);bitangent=e2.clone().multiplyScalar(du1).addScaledVector(e1,-du2).multiplyScalar(1/det);}
 }
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
  const px=x+.5,py=y+.5;
  const ba=((b.x-px)*(c.y-py)-(b.y-py)*(c.x-px))/area;
  const bb=((c.x-px)*(a.y-py)-(c.y-py)*(a.x-px))/area,bc=1-ba-bb;
  if(ba<-.00001||bb<-.00001||bc<-.00001)continue;
  if(material.wireframe){
   const edgeA=Math.hypot(b.x-c.x,b.y-c.y),edgeB=Math.hypot(c.x-a.x,c.y-a.y),edgeC=Math.hypot(a.x-b.x,a.y-b.y);
   if(Math.min(ba*Math.abs(area)/edgeA,bb*Math.abs(area)/edgeB,bc*Math.abs(area)/edgeC)>.65)continue;
  }
  const z=ba*a.z+bb*b.z+bc*c.z,index=y*width+x;
  if(z < -1||z>1||z>=depth[index])continue;
  const reciprocal=ba*a.w+bb*b.w+bc*c.w;
  const wa=ba*a.w/reciprocal,wb=bb*b.w/reciprocal,wc=bc*c.w/reciprocal;
  let tr=1,tg=1,tb=1,alpha=opacity;
  if(texture){
   const u=wa*a.u+wb*b.u+wc*c.u,v=wa*a.v+wb*b.v+wc*c.v;
   const tx=Math.max(0,Math.min(texture.width-1,Math.floor(u*texture.width))),ty=Math.max(0,Math.min(texture.height-1,Math.floor(v*texture.height)));
   const ti=(ty*texture.width+tx)*4,d=texture.data;
   tr=texture.linear?d[ti]/255:srgb[d[ti]];tg=texture.linear?d[ti+1]/255:srgb[d[ti+1]];tb=texture.linear?d[ti+2]/255:srgb[d[ti+2]];alpha*=d[ti+3]/255;
   if(material.userData?.compatibilityLinearTexture)[tr,tg,tb]=filteredTextureRGB(texture,u,v);
   if(material.userData?.selectedPigmentTone)[tr,tg,tb]=selectedPigmentToneRGB(tr,tg,tb,material.userData.selectedPigmentTone);
  }
  // Four-component vertex colours carry tissue opacity in the same geometry
  // used by WebGL. RGB-only colours and legacy test vertices remain opaque.
  alpha*=wa*(a.a??1)+wb*(b.a??1)+wc*(c.a??1);
  if(alpha<Math.max(.005,material.alphaTest||0))continue;
  const back=front?1:.8;
  // An explicitly opted-in material can show a bounded dielectric highlight.
  // This is a compatibility approximation, not measured wet-tissue optics.
  let sheen=material.userData?.compatibilityWetSkin?wa*(a.s??0)+wb*(b.s??0)+wc*(c.s??0):0,lr=wa*a.r+wb*b.r+wc*c.r,lg=wa*a.g+wb*b.g+wc*c.g,lb=wa*a.b+wb*b.b+wc*c.b;
  if(detail&&material.userData?.compatibilitySurfaceDetail){
   let nx=wa*a.nx+wb*b.nx+wc*c.nx,ny=wa*a.ny+wb*b.ny+wc*c.ny,nz=wa*a.nz+wb*b.nz+wc*c.nz,nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
   const u=wa*a.u+wb*b.u+wc*c.u,v=wa*a.v+wb*b.v+wc*c.v,sample=t=>{const i=(Math.max(0,Math.min(t.height-1,Math.floor(v*t.height)))*t.width+Math.max(0,Math.min(t.width-1,Math.floor(u*t.width))))*4;return[t.data[i]/255,t.data[i+1]/255,t.data[i+2]/255];};
   if(detail.normal&&tangent){
    const n=sample(detail.normal),sx=(n[0]*2-1)*(material.normalScale?.x??1),sy=(n[1]*2-1)*(material.normalScale?.y??1),sz=n[2]*2-1,td=nx*tangent.x+ny*tangent.y+nz*tangent.z,bd=nx*bitangent.x+ny*bitangent.y+nz*bitangent.z;
    let tx=tangent.x-nx*td,ty=tangent.y-ny*td,tz=tangent.z-nz*td,bx=bitangent.x-nx*bd,by=bitangent.y-ny*bd,bz=bitangent.z-nz*bd;const tl=Math.hypot(tx,ty,tz)||1,bl=Math.hypot(bx,by,bz)||1;
    tx/=tl;ty/=tl;tz/=tl;bx/=bl;by/=bl;bz/=bl;nx=tx*sx+bx*sy+nx*sz;ny=ty*sx+by*sy+ny*sz;nz=tz*sx+bz*sy+nz*sz;nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
   }
   lr=lg=lb=.25+.22*(ny*.5+.5);sheen=0;
   const wx=wa*a.wx+wb*b.wx+wc*c.wx,wy=wa*a.wy+wb*b.wy+wc*c.wy,wz=wa*a.wz+wb*b.wz+wc*c.wz;
   let vx=detail.camera.x-wx,vy=detail.camera.y-wy,vz=detail.camera.z-wz;const vl=Math.hypot(vx,vy,vz)||1;vx/=vl;vy/=vl;vz/=vl;
   const facing=Math.max(0,nx*vx+ny*vy+nz*vz),fresnel=.035+.965*(1-facing)**5,roughness=(material.roughness??.4)*(detail.roughness?sample(detail.roughness)[1]:1),exponent=Math.min(512,Math.max(4,2/Math.max(.05,roughness)**4-2));
   for(const light of detail.lights){const d=light.dir,diffuse=Math.max(0,nx*d.x+ny*d.y+nz*d.z)*light.intensity;lr+=light.color.r*diffuse;lg+=light.color.g*diffuse;lb+=light.color.b*diffuse;const hx=vx+d.x,hy=vy+d.y,hz=vz+d.z,hl=Math.hypot(hx,hy,hz)||1;sheen+=Math.pow(Math.max(0,(nx*hx+ny*hy+nz*hz)/hl),exponent)*fresnel*light.intensity*2.2;}
   sheen=Math.min(.25,sheen);lr*=wa*(a.cr??1)+wb*(b.cr??1)+wc*(c.cr??1);lg*=wa*(a.cg??1)+wb*(b.cg??1)+wc*(c.cg??1);lb*=wa*(a.cb??1)+wb*(b.cb??1)+wc*(c.cb??1);
  }
  const r=channel(tr*color.r*lr*back+emissive.r*ei+sheen);
  const g=channel(tg*color.g*lg*back+emissive.g*ei+sheen);
  const bcolor=channel(tb*color.b*lb*back+emissive.b*ei+sheen);
  const p=index*4,oldAlpha=pixels[p+3]/255,newAlpha=alpha+oldAlpha*(1-alpha);
  pixels[p]=(r*alpha+pixels[p]*oldAlpha*(1-alpha))/newAlpha;
  pixels[p+1]=(g*alpha+pixels[p+1]*oldAlpha*(1-alpha))/newAlpha;
  pixels[p+2]=(bcolor*alpha+pixels[p+2]*oldAlpha*(1-alpha))/newAlpha;pixels[p+3]=255*newAlpha;
  if(material.depthWrite!==false||alpha>.995)depth[index]=z;
 }
}

export class SoftwareRenderer {
 constructor({canvas}){
  this.domElement=canvas;this.context=canvas.getContext('2d',{alpha:true});
  if(!this.context)throw new Error('Canvas graphics unavailable');
  this.isSoftwareRenderer=true;this.shadowMap={enabled:false};this.toneMappingExposure=1;this.lastRenderDuration=0;
  this.textures=new WeakMap();this.buffers=new WeakMap();this.info={render:{triangles:0,frame:0}};
 }
 setPixelRatio(){} // Bounded resolution is deliberate for compatibility performance.
 setSize(width,height){
  const scale=Math.min(1,640/Math.max(width,height));width=Math.max(1,Math.round(width*scale));height=Math.max(1,Math.round(height*scale));
  if(this.domElement.width===width&&this.domElement.height===height)return;
  this.domElement.width=width;this.domElement.height=height;
  this.frame={width,height,pixels:new Uint8ClampedArray(width*height*4),depth:new Float32Array(width*height)};
  this.image=this.context.createImageData(width,height);
 }
 getContext(){return {isContextLost:()=>false};}
 dispose(){this.textures=new WeakMap();this.buffers=new WeakMap();this.frame=null;this.image=null;}
 forceContextLoss(){}
 texture(map){
  if(!map)return null;if(this.textures.has(map)&&this.textures.get(map).version===map.version)return this.textures.get(map);
  const source=map.source?.data||map.image;if(!source?.width||!source?.height)return null;
  let data,width=source.width,height=source.height;
  if(source.data){
   const raw=source.data;data=new Uint8ClampedArray(width*height*4);
   const stride=raw.length/(width*height),float=raw instanceof Float32Array||raw instanceof Float64Array;
   for(let i=0;i<width*height;i++)for(let k=0;k<4;k++)data[i*4+k]=k<stride?raw[i*stride+k]*(float?255:1):255;
  }else{
   const image=document.createElement('canvas');const scale=Math.min(1,(map.userData?.compatibilityResolution||1024)/Math.max(width,height));width=Math.round(width*scale);height=Math.round(height*scale);image.width=width;image.height=height;
   const context=image.getContext('2d',{willReadFrequently:true});context.drawImage(source,0,0,width,height);data=context.getImageData(0,0,width,height).data;
  }
  const result={data,width,height,linear:map.colorSpace!==THREE.SRGBColorSpace,version:map.version};this.textures.set(map,result);return result;
 }
 render(scene,camera){
  const started=performance.now();if(!this.frame)this.setSize(this.domElement.clientWidth||640,this.domElement.clientHeight||640);
  const frame=this.frame;frame.pixels.fill(0);frame.depth.fill(Infinity);this.info.render.triangles=0;
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const projection=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),lights=[],objects=[];
  scene.traverseVisible(o=>{if(o.isDirectionalLight){const dir=o.getWorldPosition(new THREE.Vector3()).sub(o.target.getWorldPosition(new THREE.Vector3())).normalize();lights.push({dir,color:o.color,intensity:o.intensity*.28});}if(o.isMesh||o.isLine)objects.push(o);});
  objects.sort((a,b)=>Number(!!a.material?.transparent)-Number(!!b.material?.transparent)||b.getWorldPosition(new THREE.Vector3()).distanceToSquared(camera.position)-a.getWorldPosition(new THREE.Vector3()).distanceToSquared(camera.position));
  const point=new THREE.Vector3(),normal=new THREE.Vector3(),uv=new THREE.Vector2(),instance=new THREE.Matrix4(),instanceColor=new THREE.Color(),world=new THREE.Matrix4(),normalMatrix=new THREE.Matrix3(),clip=new THREE.Vector4();
 const bind=new THREE.Matrix3(),unbind=new THREE.Matrix3(),boneNormal=new THREE.Vector3(),sum=new THREE.Vector3(),bone=new THREE.Matrix4(),viewDirection=new THREE.Vector3(),halfway=new THREE.Vector3();
  for(const mesh of objects){
   const geometry=mesh.geometry,pos=geometry?.attributes.position;if(!pos)continue;
   const count=pos.count;let vertices=this.buffers.get(mesh);if(!vertices||vertices.length!==count){vertices=Array.from({length:count},()=>({}));this.buffers.set(mesh,vertices);}
   const indices=geometry.index,normalAttribute=geometry.attributes.normal,colorAttribute=geometry.attributes.color;
   if(mesh.isSkinnedMesh){mesh.skeleton.update();bind.setFromMatrix4(mesh.bindMatrix);unbind.setFromMatrix4(mesh.bindMatrixInverse);}
   const groups=geometry.groups.length?geometry.groups:[{start:0,count:indices?.count||count,materialIndex:0}];
   for(let inst=0;inst<(mesh.isInstancedMesh?mesh.count:1);inst++){
    instanceColor.setRGB(1,1,1);
    if(mesh.isInstancedMesh){mesh.getMatrixAt(inst,instance);world.multiplyMatrices(mesh.matrixWorld,instance);if(mesh.instanceColor)mesh.getColorAt(inst,instanceColor);}else world.copy(mesh.matrixWorld);
    normalMatrix.getNormalMatrix(world);const reverse=world.determinant()<0;
    for(let i=0;i<count;i++){
     if(mesh.isMesh)mesh.getVertexPosition(i,point);else point.fromBufferAttribute(pos,i);
     point.applyMatrix4(world);clip.set(point.x,point.y,point.z,1).applyMatrix4(projection);const v=vertices[i];v.wx=point.x;v.wy=point.y;v.wz=point.z;
     v.w=clip.w>0?1/clip.w:-1;v.x=(clip.x/clip.w*.5+.5)*frame.width;v.y=(-clip.y/clip.w*.5+.5)*frame.height;v.z=clip.z/clip.w;
     if(normalAttribute)normal.fromBufferAttribute(normalAttribute,i);else normal.set(0,1,0);
     if(mesh.isSkinnedMesh&&normalAttribute){
      normal.applyMatrix3(bind);sum.set(0,0,0);const weights=geometry.attributes.skinWeight,bones=geometry.attributes.skinIndex;
      for(let k=0;k<4;k++){const weight=weights.getComponent(i,k);if(!weight)continue;bone.fromArray(mesh.skeleton.boneMatrices,bones.getComponent(i,k)*16);boneNormal.copy(normal).transformDirection(bone);sum.addScaledVector(boneNormal,weight);}
      normal.copy(sum).applyMatrix3(unbind);
     }
     normal.applyMatrix3(normalMatrix).normalize();v.nx=normal.x;v.ny=normal.y;v.nz=normal.z;const ambient=.25+.22*(normal.y*.5+.5);v.r=v.g=v.b=ambient;
     for(const light of lights){const illumination=Math.max(0,normal.dot(light.dir))*light.intensity;v.r+=light.color.r*illumination;v.g+=light.color.g*illumination;v.b+=light.color.b*illumination;}
     v.a=1;v.cr=v.cg=v.cb=1;if(colorAttribute&&mesh.material?.vertexColors){v.cr=colorAttribute.getX(i);v.cg=colorAttribute.getY(i);v.cb=colorAttribute.getZ(i);v.r*=v.cr;v.g*=v.cg;v.b*=v.cb;if(colorAttribute.itemSize>3)v.a=colorAttribute.getW(i);}
     v.r*=instanceColor.r;v.g*=instanceColor.g;v.b*=instanceColor.b;
    }
    if(mesh.isLine){
     const step=mesh.isLineSegments?2:1,total=indices?.count||count;
     for(let j=0;j<total-1;j+=step){const a=vertices[indices?indices.getX(j):j],b=vertices[indices?indices.getX(j+1):j+1];if(a.w<=0||b.w<=0)continue;
      const distance=Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));if(distance>frame.width*4)continue;const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;if(!material?.visible)continue;
      for(let k=0;k<=distance;k++){const t=distance?k/distance:0,x=Math.round(a.x+(b.x-a.x)*t),y=Math.round(a.y+(b.y-a.y)*t),z=a.z+(b.z-a.z)*t;if(x<0||y<0||x>=frame.width||y>=frame.height||z>=frame.depth[y*frame.width+x])continue;const p=(y*frame.width+x)*4,alpha=material.opacity??1;
       frame.pixels[p]=frame.pixels[p]*(1-alpha)+channel(material.color.r)*alpha;frame.pixels[p+1]=frame.pixels[p+1]*(1-alpha)+channel(material.color.g)*alpha;frame.pixels[p+2]=frame.pixels[p+2]*(1-alpha)+channel(material.color.b)*alpha;frame.pixels[p+3]=255;
      }
     }continue;
    }
    for(const group of groups){
     const material=Array.isArray(mesh.material)?mesh.material[group.materialIndex]:mesh.material;if(!material?.visible||material.opacity===0)continue;
     if(material.userData?.compatibilityWetSkin){
      const exponent=Math.min(512,Math.max(4,2/Math.max(.03,material.roughness??.4)**4-2));
      for(const v of vertices){normal.set(v.nx,v.ny,v.nz);viewDirection.copy(camera.position).sub(point.set(v.wx,v.wy,v.wz)).normalize();const facing=Math.max(0,normal.dot(viewDirection)),fresnel=.04+.96*(1-facing)**5;v.s=0;for(const light of lights){halfway.copy(viewDirection).add(light.dir).normalize();v.s+=Math.pow(Math.max(0,normal.dot(halfway)),exponent)*fresnel*light.intensity*3;}v.s=Math.min(.28,v.s);}
     }
     const texture=this.texture(material.map),detail=material.userData?.compatibilitySurfaceDetail?{normal:this.texture(material.normalMap),roughness:this.texture(material.roughnessMap),lights,camera:camera.position}:null;const uvAttribute=geometry.attributes[material.map?.channel?`uv${material.map.channel}`:'uv'];
     const uvMap=material.map||material.normalMap;uvMap?.updateMatrix();for(let i=0;i<count;i++){const v=vertices[i];if(uvAttribute&&uvMap){uv.fromBufferAttribute(uvAttribute,i);uvMap.transformUv(uv);v.u=uv.x;v.v=uv.y;}else v.u=v.v=0;}
     const start=Math.max(group.start,geometry.drawRange.start),end=Math.min(group.start+group.count,geometry.drawRange.start+geometry.drawRange.count,indices?.count||count);
     for(let j=start;j<end-2;j+=3){const a=vertices[indices?indices.getX(j):j],b=vertices[indices?indices.getX(j+1):j+1],c=vertices[indices?indices.getX(j+2):j+2];
      rasterTriangle(frame,[a,b,c],material,texture,reverse,detail);this.info.render.triangles++;
     }
    }
   }
  }
  this.image.data.set(frame.pixels);this.context.putImageData(this.image,0,0);this.info.render.frame++;this.lastRenderDuration=performance.now()-started;
 }
}
