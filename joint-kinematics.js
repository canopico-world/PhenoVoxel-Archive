import * as T from 'three';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export function aimJoint(m,bone,child,target){
 if(!bone||!child)return;m.root.updateMatrixWorld(true);
 const p=bone.getWorldPosition(V()),from=child.getWorldPosition(V()).sub(p),to=m.root.localToWorld(target.clone()).sub(p);
 if(from.lengthSq()<1e-10||to.lengthSq()<1e-10)return;
 const q=new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize()),parent=bone.parent.getWorldQuaternion(new T.Quaternion());
 bone.quaternion.premultiply(parent.clone().invert().multiply(q).multiply(parent));bone.updateWorldMatrix(false,true);
}
export function rotateJoint(m,bone,axis,angle){if(!bone)return;m.root.updateMatrixWorld(true);const a=axis.clone().applyQuaternion(m.root.getWorldQuaternion(new T.Quaternion())).applyQuaternion(bone.parent.getWorldQuaternion(new T.Quaternion()).invert());bone.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(a,angle));}
export function solveTwoLink(m,upper,lower,end,target,pole=V(-1,0,0)){
 if(!upper||!lower||!end)return;m.root.updateMatrixWorld(true);
 const p=m.root.worldToLocal(upper.getWorldPosition(V())),k=m.root.worldToLocal(lower.getWorldPosition(V())),e=m.root.worldToLocal(end.getWorldPosition(V())),a=p.distanceTo(k),b=k.distanceTo(e),delta=target.clone().sub(p);
 if(a<1e-8||b<1e-8||delta.lengthSq()<1e-8)return;
 const d=T.MathUtils.clamp(delta.length(),Math.abs(a-b)+1e-6,a+b-1e-6),dir=delta.normalize(),bend=pole.clone().addScaledVector(dir,-pole.dot(dir));
 if(bend.lengthSq()<1e-8)bend.copy(V(0,0,1)).addScaledVector(dir,-dir.z);bend.normalize();
 const along=(a*a+d*d-b*b)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
 aimJoint(m,upper,lower,p.clone().addScaledVector(dir,along).addScaledVector(bend,height));aimJoint(m,lower,end,p.clone().addScaledVector(dir,d));
}
