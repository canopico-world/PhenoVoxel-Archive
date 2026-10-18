import * as T from 'three';
const clamp=T.MathUtils.clamp,smooth=T.MathUtils.smoothstep;
// Original qualitative pigment study. Spatial fields meet across UV islands;
// source fine fur detail is retained, but the pied domestic patches are removed.
// This is not a measured animal colour, a photograph, or a genotype simulation.
export function rabbitAgoutiColor(x,y,z,normalY,detail=0){
 const coarse=.5+.5*Math.sin(x*21.1+y*17.4+Math.sin(z*12.8))*Math.sin(z*18.3-y*9.7),fine=Math.sin(x*193+y*277+z*181)*Math.sin(x*313-z*229),pale=smooth(-normalY,.12,.82)*(1-smooth(y,.40,.64)),shade=coarse*17+fine*10-smooth(fine,.10,.84)*30+clamp(detail,-24,24)*1.1;
 return[111,101,84].map((v,i)=>Math.round(clamp(v+shade+([198,191,178][i]-v)*pale,0,255)));
}
const eyeIsland=(u,v)=>[[.187,.666],[.400,.637],[.505,.687],[.737,.442]].some(([x,y])=>((u-x)/.022)**2+((v-y)/.029)**2<1);
export function applyRabbitAgoutiPixels(data,width,height,mesh){
 const original=data.slice(),g=mesh.geometry,a=g.attributes,ix=g.index?.array;if(!a.uv||!ix)return{changed:0};
 mesh.updateWorldMatrix(true,false);mesh.skeleton?.update();const box=new T.Box3().setFromObject(mesh,true),size=box.getSize(new T.Vector3()).max(new T.Vector3(1e-8,1e-8,1e-8)),points=[],normals=[],normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld);
 for(let i=0;i<a.position.count;i++){const p=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld).sub(box.min);p.divide(size);points.push(p);normals.push(new T.Vector3().fromBufferAttribute(a.normal,i).applyMatrix3(normalMatrix).normalize());}
 let changed=0;const painted=new Uint8Array(width*height),luma=(x,y)=>{const i=(clamp(y,0,height-1)*width+clamp(x,0,width-1))*4;return(original[i]+original[i+1]+original[i+2])/3;};
 for(let t=0;t<ix.length;t+=3){const ids=[ix[t],ix[t+1],ix[t+2]],uv=ids.map(i=>[a.uv.getX(i)*(width-1),a.uv.getY(i)*(height-1)]),[[ax,ay],[bx,by],[cx,cy]]=uv,den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-8)continue;
  for(let py=Math.max(0,Math.floor(Math.min(ay,by,cy)));py<=Math.min(height-1,Math.ceil(Math.max(ay,by,cy)));py++)for(let px=Math.max(0,Math.floor(Math.min(ax,bx,cx)));px<=Math.min(width-1,Math.ceil(Math.max(ax,bx,cx)));px++){
   const u=((by-cy)*(px-cx)+(cx-bx)*(py-cy))/den,v=((cy-ay)*(px-cx)+(ax-cx)*(py-cy))/den,w=1-u-v;if(Math.min(u,v,w)<-.0001)continue;const at=py*width+px,i=at*4;if(painted[at])continue;painted[at]=1;
   const r=original[i],green=original[i+1],blue=original[i+2];
   // Keep the source eye/nose/lip and inner-pinna tissue islands. Iris colour
   // and inappropriate painted sole pads are corrected by rabbit-surface.js.
   if(eyeIsland(px/width,py/height)||r>green*1.22&&r>blue*1.14&&r-green>13)continue;
   const p=points[ids[0]].clone().multiplyScalar(u).addScaledVector(points[ids[1]],v).addScaledVector(points[ids[2]],w),ny=normals[ids[0]].y*u+normals[ids[1]].y*v+normals[ids[2]].y*w,detail=luma(px,py)-(luma(px-3,py)+luma(px+3,py)+luma(px,py-3)+luma(px,py+3))/4,color=rabbitAgoutiColor(p.x,p.y,p.z,ny,Math.abs(detail)>18?0:detail);data.set([...color,original[i+3]],i);painted[at]=2;changed++;
  }
 }
 // Pad islands before mipmapping so old white/black border texels cannot form
 // bright stitched seams. Never overwrite eye/pinna tissue or alpha.
 let padded=0;for(let pass=0;pass<8;pass++){const prior=painted.slice(),colors=data.slice();for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const at=y*width+x;if(prior[at]||eyeIsland(x/width,y/height))continue;const i=at*4,r=original[i],green=original[i+1],blue=original[i+2];if(r>green*1.22&&r>blue*1.14&&r-green>13)continue;const neighbors=[at-1,at+1,at-width,at+width].filter(p=>prior[p]===2);if(!neighbors.length)continue;for(let c=0;c<3;c++)data[i+c]=Math.round(neighbors.reduce((n,p)=>n+colors[p*4+c],0)/neighbors.length);painted[at]=2;padded++;}}
 return{changed,padded,scope:'Authored gray-brown agouti-like coat and paler ventrum; not a measured phenotype. Source tissue/eye islands retained; original creator mesh/UV/skeleton untouched.'};
}

