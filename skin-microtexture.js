import * as T from 'three';
// Original microscopic surface cue, generated deterministically from numbers.
// It is neither an organism photograph nor measured histology. A normal map,
// rather than a custom shader, keeps this surface detail portable in GLB.
export function skinMicroNormal(seed=31,size=256){
 const height=new Float32Array(size*size),pixels=new Uint8Array(size*size*4);let state=seed;
 for(let i=0;i<height.length;i++){state=(state*1664525+1013904223)>>>0;height[i]=state/4294967296;}
 const at=(x,y)=>height[((y+size)%size)*size+(x+size)%size];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const dx=(at(x+1,y-1)+at(x+1,y)+at(x+1,y+1)-at(x-1,y-1)-at(x-1,y)-at(x-1,y+1))*.11,dy=(at(x-1,y+1)+at(x,y+1)+at(x+1,y+1)-at(x-1,y-1)-at(x,y-1)-at(x+1,y-1))*.11,n=new T.Vector3(-dx,-dy,1).normalize(),i=(y*size+x)*4;pixels[i]=Math.round((n.x*.5+.5)*255);pixels[i+1]=Math.round((n.y*.5+.5)*255);pixels[i+2]=Math.round((n.z*.5+.5)*255);pixels[i+3]=255;}
 const texture=new T.DataTexture(pixels,size,size,T.RGBAFormat);texture.name='Original qualitative skin microrelief; not measured microscopy';texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(3,3);texture.needsUpdate=true;return texture;
}
