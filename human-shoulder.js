import * as T from 'three';
const smooth=(lo,hi,x)=>{const t=Math.max(0,Math.min(1,(x-lo)/(hi-lo)));return t*t*(3-2*t)};
export function attachScapularPivot(mesh){
  const original=mesh.skeleton,girdle=original.bones[10],arm=original.bones[11];
  girdle.updateWorldMatrix(true,true);
  const pivot=new T.Bone();pivot.name='Right acromioclavicular demonstration pivot';
  const world=new T.Vector3(-.013,1.51,.15);
  pivot.position.copy(girdle.worldToLocal(world));
  girdle.add(pivot);pivot.updateWorldMatrix(true,false);pivot.attach(arm);
  const skeleton=new T.Skeleton([...original.bones,pivot],[...original.boneInverses,pivot.matrixWorld.clone().invert()]);
  mesh.bind(skeleton,mesh.bindMatrix.clone());original.dispose();return skeleton;
}
// Use component membership to prevent a resting hand near the hip from pulling
// the flank outward. Interpolate across the shoulder insertion in atlas metres.
export function shoulderBinding(batch,structures){
  if(batch.shoulderBinding)return batch.shoulderBinding;
  const g=batch.mesh.geometry,pos=g.attributes.position,source=batch.id;
  const ids=new Uint16Array(pos.count*4),weights=new Float32Array(ids.length);
  for(let i=0;i<pos.count;i++){
    const r=structures.get(source.getX(i)),y=pos.getY(i),z=pos.getZ(i),at=4*i;
    let joint=2,armWeight=0,scapWeight=0;
    if(r.system==='skeleton'){
      joint=g.attributes.skinIndex.getX(i);
      if(r.side==='right'&&/scapula/i.test(r.name))joint=20;
    }else if(z>0 && (r.region==='right-arm'||(
      r.region==='chest' && ['surface','connective','attachments','muscles','arteries','veins','nerves'].includes(r.system)
      && /pectoral|deltoid|scapul|clavic|humer|axill|brachial|latissimus|teres |serratus anterior|trapezius|thoracodorsal|cephalic vein/i.test(r.name)))){

      const arm=r.region==='right-arm';
      const trunkBlend=smooth(1.22,1.42,y)*(1-smooth(1.52,1.63,y));
      const lateral=smooth(.065,.206,z);
      // The arm below the axilla moves with the humerus. Cross-joint tissues
      // nearer its origin blend with the shoulder girdle and trunk.
      armWeight=arm?1-smooth(1.29,1.46,y)*(1-lateral):lateral*trunkBlend;
      scapWeight=(1-armWeight)*trunkBlend*smooth(.035,.135,z);
      if(!arm&&r.high[2]<.105)scapWeight=0;
    }
    ids[at]=joint;ids[at+1]=11;ids[at+2]=20;
    weights[at]=1-armWeight-scapWeight;weights[at+1]=armWeight;weights[at+2]=scapWeight;
  }
  batch.shoulderBinding={original:[g.attributes.skinIndex,g.attributes.skinWeight],study:[new T.Uint16BufferAttribute(ids,4),new T.Float32BufferAttribute(weights,4)]};
  return batch.shoulderBinding;
}
export function switchShoulderBinding(batch,active,structures){
  if(!batch.mesh.isSkinnedMesh||!!batch.shoulderMode===active)return;
  const b=shoulderBinding(batch,structures),[index,weight]=active?b.study:b.original;
  batch.mesh.geometry.setAttribute('skinIndex',index).setAttribute('skinWeight',weight);
  batch.shoulderMode=active;
}
