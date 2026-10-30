import * as T from 'three';
export function renderedBounds(root){
 // Fixed-topology aerial studies only scale the root; their exact local bounds remain valid.
 // Deforming, skinned and articulated specimens retain the full posed-vertex path below.
 if(root.userData.staticLocalBounds){root.updateMatrixWorld(true);const b=root.userData.staticLocalBounds;return new T.Box3(new T.Vector3(...b.min),new T.Vector3(...b.max)).applyMatrix4(root.matrixWorld);}
 // Conservative transformed part boxes for declared rigid botanical assemblies.
 // Deforming cone parts refresh their own local boxes; this is camera framing, not measured anatomy.
 if(root.userData.rigidPartBounds){const box=new T.Box3(),point=new T.Vector3();root.updateMatrixWorld(true);root.traverseVisible(o=>{if(!o.isMesh||!o.geometry?.attributes.position)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z])box.expandByPoint(point.set(x,y,z).applyMatrix4(o.matrixWorld));});return box;}
 const box=new T.Box3(),point=new T.Vector3(),matrix=new T.Matrix4();root.updateMatrixWorld(true);root.traverseVisible(mesh=>{if(!mesh.isMesh||!mesh.geometry?.attributes.position||mesh.userData.cameraContext)return;if(mesh.isInstancedMesh){if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])box.expandByPoint(point.set(x,y,z).applyMatrix4(matrix));}return;}if(mesh.isSkinnedMesh)mesh.skeleton.update();const p=mesh.geometry.attributes.position,indices=mesh.geometry.index?new Set(mesh.geometry.index.array):null;if(indices){for(const i of indices)box.expandByPoint(mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld));}else for(let i=0;i<p.count;i++)box.expandByPoint(mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld));});return box;
}
// Fit the actual posed organism in the asymmetric space above the controls.
export function fitSpecimenCamera(camera,controls,bounds,{bottomLimit=-.33,minDistance=1}={}){
 if(bounds.isEmpty())return;if(!Number.isFinite(camera.aspect)||camera.aspect<=0){camera.aspect=1;camera.updateProjectionMatrix();}const center=bounds.getCenter(new T.Vector3()),direction=camera.position.clone().sub(controls.target).normalize();if(!direction.toArray().every(Number.isFinite)||direction.lengthSq()<.5)direction.set(0,.2,1).normalize();const right=new T.Vector3().crossVectors(camera.up,direction);if(right.lengthSq()<1e-8)right.set(1,0,0);right.normalize();const up=new T.Vector3().crossVectors(direction,right).normalize(),corners=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new T.Vector3(x,y,z));
 const halfHeight=Math.max(...corners.map(p=>Math.abs(p.clone().sub(center).dot(up))));controls.target.copy(center).addScaledVector(up,-halfHeight*.4);
 const vertical=Math.tan(T.MathUtils.degToRad(camera.fov/2)),horizontal=vertical*camera.aspect;let distance=minDistance;
 for(const corner of corners){const delta=corner.sub(controls.target),depth=delta.dot(direction),x=delta.dot(right),y=delta.dot(up);distance=Math.max(distance,depth+Math.abs(x)/(horizontal*.86),depth+Math.abs(y)/(vertical*(y>=0?.86:Math.abs(bottomLimit))),depth+camera.near*2);}
 camera.position.copy(controls.target).addScaledVector(direction,distance);camera.lookAt(controls.target);controls.maxDistance=Math.max(18,distance*1.6);controls.update();return distance;
}
