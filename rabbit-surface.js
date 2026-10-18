import * as T from 'three';
import {applyRabbitAgoutiPixels} from './rabbit-agouti.js';
// A viewer-only derivative of the creator atlas. No photograph pixels are used.
export function correctRabbitPixels(data,width,height){
 const original=data.slice();let irises=0,soles=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,r=original[i],g=original[i+1],b=original[i+2],u=x/width,v=y/height;
  if(g>r*1.10&&g>b*1.05&&g>30){const value=(r+g+b)/3;data[i]=Math.round(value*.28);data[i+1]=Math.round(value*.19);data[i+2]=Math.round(value*.13);irises++;}
  const sole=(u<.125&&v>.81)||(u>.265&&u<.37&&v>.81)||(u>.625&&u<.715&&v>.675&&v<.82)||(u>.91&&v>.27&&v<.365),luma=(r+g+b)/3;
  if(sole&&luma>30){const sx=Math.floor((.08+(x%55)/550)*width),sy=Math.floor((.045+(y%57)/570)*height),j=(sy*width+sx)*4;data[i]=original[j];data[i+1]=original[j+1];data[i+2]=original[j+2];soles++;}
 }
 return {irises,soles};
}
export function correctRabbitSurface(scene){
 if(typeof document==='undefined')return;
 scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 scene.traverse(mesh=>{if(!mesh.isMesh)return;for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){const source=material.map,image=source?.image;if(!image?.width||!image?.height)return;const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),changes=correctRabbitPixels(pixels.data,canvas.width,canvas.height);changes.agouti=applyRabbitAgoutiPixels(pixels.data,canvas.width,canvas.height,mesh);ctx.putImageData(pixels,0,0);const map=source.clone();map.source=new T.Source(canvas);map.needsUpdate=true;material.viewerSourceMap=source;material.map=map;material.userData={...material.userData,rabbitSurface:'Authored dark iris; painted pad motifs replaced by reused creator fur in identified sole atlas islands. Authored gray-brown agouti-like pigment study with paler ventrum; domestic source proportions remain unvalidated.',rabbitPixelChanges:changes};}});
}

