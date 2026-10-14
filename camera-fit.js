import * as T from 'three';
export function renderedBounds(root){
 const box=new T.Box3(),point=new T.Vector3();root.updateMatrixWorld(true);root.traverseVisible(mesh=>{if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;if(mesh.isSkinnedMesh)mesh.skeleton.update();const p=mesh.geometry.attributes.position,indices=mesh.geometry.index?new Set(mesh.geometry.index.array):null;if(indices){for(const i of indices)box.expandByPoint(mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld));}else for(let i=0;i<p.count;i++)box.expandByPoint(mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld));});return box;
}
// Fit the actual posed organism in the asymmetric space above the controls.
export function fitSpecimenCamera(camera,controls,bounds,{bottomLimit=-.33}={}){
 if(bounds.isEmpty())return;const center=bounds.getCenter(new T.Vector3()),direction=camera.position.clone().sub(controls.target).normalize();if(direction.lengthSq()<.5)direction.set(0,.2,1).normalize();const right=new T.Vector3().crossVectors(camera.up,direction);if(right.lengthSq()<1e-8)right.set(1,0,0);right.normalize();const up=new T.Vector3().crossVectors(direction,right).normalize(),corners=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new T.Vector3(x,y,z));
 const halfHeight=Math.max(...corners.map(p=>Math.abs(p.clone().sub(center).dot(up))));controls.target.copy(center).addScaledVector(up,-halfHeight*.4);
 const vertical=Math.tan(T.MathUtils.degToRad(camera.fov/2)),horizontal=vertical*camera.aspect;let distance=1;
 for(const corner of corners){const delta=corner.sub(controls.target),depth=delta.dot(direction),x=delta.dot(right),y=delta.dot(up);distance=Math.max(distance,depth+Math.abs(x)/(horizontal*.86),depth+Math.abs(y)/(vertical*(y>=0?.86:Math.abs(bottomLimit))),depth+camera.near*2);}
 camera.position.copy(controls.target).addScaledVector(direction,distance);camera.lookAt(controls.target);controls.maxDistance=Math.max(18,distance*1.6);controls.update();return distance;
}
