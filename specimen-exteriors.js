import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const humanURL=new URL('./human-exterior-v0730.glb',import.meta.url).href;
export async function loadHumanExterior(skeleton){
  const gltf=await new GLTFLoader().loadAsync(humanURL);
  const cover=new T.Group();cover.name='Clothed human exterior · Microsoft Rocketbox';
  cover.userData={source:'Microsoft Rocketbox Male Adult 06',license:'MIT, Copyright (c) 2020 Microsoft',appearance:'Illustrative exterior fitted to the atlas rig'};
  const meshes=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o)});
  for(const mesh of meshes){
    cover.add(mesh);mesh.bind(skeleton,new T.Matrix4());mesh.frustumCulled=false;
  }
  if(!meshes.length)throw Error('Human exterior geometry unavailable');
  return cover;
}

export const mouseExteriorIds=['living:skin','living:eyes','living:eyelids','living:pinnae','living:nose','living:lips','living:vibrissae','living:forepaws','living:hindpaws','living:claws','living:tail','living:openings'];
export async function mouseCoatTextures(){
  const loader=new T.TextureLoader();
  const maps=await Promise.all([new URL('./mouse-coat-v0730.jpg',import.meta.url).href,new URL('./mouse-tail-v0730.jpg',import.meta.url).href].map(url=>loader.loadAsync(url)));
  for(const map of maps){map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;}
  return maps;
}
// Cylindrical coat coordinates follow the local centre of each cross section.
// Unwrap each triangle at the underside seam so directional hairs stay aligned.
export function coatSurface(mesh,tail,map){
  const old=mesh.geometry,g=old.index?old.toNonIndexed():old;
  if(old!==g){mesh.geometry=g;old.dispose();}
  const p=g.attributes.position,n=g.attributes.normal;
  const bins=new Map(),key=i=>Math.round(p.getY(i)/.002);
  for(let i=0;i<p.count;i++){
    const b=key(i),x=p.getX(i),z=p.getZ(i);
    const range=bins.get(b)||[x,x,z,z];
    range[0]=Math.min(range[0],x);range[1]=Math.max(range[1],x);
    range[2]=Math.min(range[2],z);range[3]=Math.max(range[3],z);bins.set(b,range);
  }
  const uv=new Float32Array(p.count*2),color=new Float32Array(p.count*3);
  const upper=new T.Color(tail?'#f2ddd1':'#b7afa3'),lower=new T.Color(tail?'#fff6f0':'#fff5de'),c=new T.Color();
  for(let i=0;i<p.count;i+=3){
    const angles=[];
    for(let j=i;j<i+3;j++){
      const b=bins.get(key(j)),x=p.getX(j)-(b[0]+b[1])*.5,z=p.getZ(j)-(b[2]+b[3])*.5;
      angles.push(.5+Math.atan2(x,z)/(2*Math.PI));
      const ventral=T.MathUtils.smoothstep(-n.getZ(j),-.16,.92);
      c.copy(upper).lerp(lower,ventral).toArray(color,j*3);
    }
    const seam=Math.max(...angles)-Math.min(...angles)>.5;
    for(let k=0;k<3;k++){
      const j=i+k;uv[j*2]=p.getY(j)/(tail?.017:.014);
      uv[j*2+1]=(angles[k]+(seam&&angles[k]<.5?1:0))*(tail?1:5);
    }
  }
  g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('color',new T.BufferAttribute(color,3));
  mesh.material.color.set(0xffffff);mesh.material.vertexColors=true;mesh.material.map=map;mesh.material.bumpMap=map;
  mesh.material.bumpScale=tail?.000045:.00009;mesh.material.roughness=tail?.8:.94;
}

