import * as T from 'three';
// Authored pigment modulation on the retained source, not photographic pixels.
export function refineMarineSurface(m){
 if(!['tursiops-truncatus','megaptera-novaeangliae'].includes(m.id))return;
 m.root.updateMatrixWorld(true);m.root.traverse(mesh=>{if(!mesh.isMesh||mesh.material?.name==='DolphinEyes')return;if(mesh.isSkinnedMesh)mesh.skeleton.update();const geometry=mesh.geometry.clone(),p=geometry.attributes.position,old=geometry.attributes.color,color=[],point=new T.Vector3();
 for(let i=0;i<p.count;i++){mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);m.root.worldToLocal(point);const dorsal=T.MathUtils.smoothstep(point.y,m.id==='tursiops-truncatus'?.34:.31,m.id==='tursiops-truncatus'?.95:.63),scale=m.id==='tursiops-truncatus'?T.MathUtils.lerp(1.14,.70,dorsal):T.MathUtils.lerp(1.025,.92,dorsal),channels=m.id==='tursiops-truncatus'?[.90,.98,1.06]:[1,1.005,1.01];for(let k=0;k<3;k++)color.push((old?old.getComponent(i,k):1)*scale*channels[k]);}
 geometry.setAttribute('color',new T.Float32BufferAttribute(color,3));mesh.geometry=geometry;mesh.material=mesh.material.clone();mesh.material.vertexColors=true;mesh.material.metalness=0;mesh.material.roughness=m.id==='tursiops-truncatus'?.48:.66;mesh.material.needsUpdate=true;mesh.userData={...mesh.userData,viewerPigment:{author:'PhenoVoxel Archive contributors',license:'CC BY 4.0 source derivative; implementation MIT',scope:'Original positions, UV atlas, source markings and skin weights retained; authored mild dorsal/ventral pigment modulation, not measured individual phenotype'}};
 });
}
export function configureDolphinMotion(m){if(m.id!=='tursiops-truncatus'||!m.clipMap.swim)return;m.dolphinSwim=m.clipMap.swim;m.clipMap.forage=m.dolphinSwim;m.clipMap.rest=m.dolphinSwim;}
export function dolphinPlaybackTime(action,t){return t*(action==='forage'?.48:action==='rest'?.20:1);}
