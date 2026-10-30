import * as T from 'three';

// Broad studio reflections for the compatibility renderer. This is a bounded
// approximation of the same radiance field, with roughness broadening.
export function belugaStudioReflection(x,y,z,roughness){
 const panels=[[.252,.756,.605,3.4,.30,1,.96,.88],[-.701,.409,-.584,1.5,.39,.70,.84,1],[-.321,.267,.908,.55,.60,.80,.96,1]],rgb=[0,0,0];
 for(const [nx,ny,nz,power,width,r,g,b]of panels){const spread=width*width+.48*roughness*roughness,d=Math.max(0,1-x*nx-y*ny-z*nz),v=power*Math.exp(-4*d*d/(spread*spread));rgb[0]+=v*r;rgb[1]+=v*g;rgb[2]+=v*b;}return rgb;
}

// Original studio radiance field. Broad sources reflect in the wet dielectric
// skin without baking illumination into its pigment or supplying fake caustics.
export function createBelugaEnvironment(){
 const width=256,height=128,data=new Float32Array(width*height*4),directions=[
  {n:new T.Vector3(.25,.75,.60).normalize(),power:3.4,width:.30,color:[1,.96,.88]},
  {n:new T.Vector3(-.6,.35,-.5).normalize(),power:1.5,width:.39,color:[.70,.84,1]},
  {n:new T.Vector3(-.3,.25,.85).normalize(),power:.55,width:.60,color:[.80,.96,1]}
 ];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const phi=(x+.5)/width*Math.PI*2,theta=(y+.5)/height*Math.PI,n=new T.Vector3(-Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)),i=(y*width+x)*4,sky=.035+.09*Math.max(0,n.y);
  data[i]=sky*.80;data[i+1]=sky*.94;data[i+2]=sky;
  for(const panel of directions){const angle=Math.acos(T.MathUtils.clamp(n.dot(panel.n),-1,1)),radiance=panel.power*Math.exp(-Math.pow(angle/panel.width,4));for(let k=0;k<3;k++)data[i+k]+=radiance*panel.color[k];}data[i+3]=1;
 }
 const texture=new T.DataTexture(data,width,height,T.RGBAFormat,T.FloatType);texture.mapping=T.EquirectangularReflectionMapping;texture.colorSpace=T.LinearSRGBColorSpace;texture.needsUpdate=true;return texture;
}
