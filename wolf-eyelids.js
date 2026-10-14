import * as T from 'three';
const V=()=>new T.Vector3();
export function prepareWolfEyelids(m){
 if(m.id!=='canis-lupus'||!m.wolfFace)return;const source=m.wolfFace.mesh,g=source.geometry,{position:p,uv}=g.attributes,ix=g.index.array,parents=Array.from({length:p.count},(_,i)=>i),find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;},join=(a,b)=>parents[find(b)]=find(a),weld=new Map();
 for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e5)).join(',');if(weld.has(k))join(i,weld.get(k));else weld.set(k,i);}for(let i=0;i<ix.length;i+=3){join(ix[i],ix[i+1]);join(ix[i],ix[i+2]);}
 const groups=new Map();for(let i=0;i<p.count;i++){const k=find(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);}const body=[...groups.entries()].sort((a,b)=>b[1].length-a[1].length)[0][0];
 m.root.updateMatrixWorld(true);source.skeleton.update();const at=i=>source.getVertexPosition(i,V()).applyMatrix4(source.matrixWorld),eyes=[...groups.values()].filter(ids=>{if(ids.length<900||ids.length>1100)return false;const box=new T.Box3().setFromPoints(ids.map(at)),c=box.getCenter(V()),s=box.getSize(V());return c.x>1.4&&c.x<1.6&&c.y>2.15&&s.x<.15&&s.y<.15;});
 if(eyes.length!==2)throw Error('Wolf eye source components no longer match the retained asset.');
 const triangles=[];for(let i=0;i<ix.length;i+=3){const ids=[ix[i],ix[i+1],ix[i+2]];if(find(ids[0])!==body)continue;const points=ids.map(at);if(points.every(p=>p.x<1.25||p.y<2.10))continue;triangles.push({tri:new T.Triangle(...points),uv:ids.map(i=>new T.Vector2(uv.getX(i),uv.getY(i)))});}
 const inverse=m.head.matrixWorld.clone().invert(),attachments=[],centroids=[];
 for(const[side,ids]of eyes.entries()){
  const box=new T.Box3().setFromPoints(ids.map(at)),center=box.getCenter(V()),radius=box.getSize(V()).multiplyScalar(.5*1.035);centroids.push(center.clone().applyMatrix4(inverse));center.x=box.min.x;radius.x=(box.max.x-box.min.x)*1.035;
  const cap=new T.SphereGeometry(1,28,18,0,Math.PI*2,0,Math.PI/2);cap.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(1,0,0)));const pos=cap.attributes.position,tex=[];
  for(let i=0;i<pos.count;i++){
   const point=V().fromBufferAttribute(pos,i).multiply(radius).add(center);pos.setXYZ(i,...point.toArray());const skinQuery=point.clone().add(new T.Vector3(-.012,.055,0));let best=null,distance=Infinity,closest=V();for(const sample of triangles){const mid=sample.tri.getMidpoint(V());if(Math.sign(mid.z)!==Math.sign(center.z)||mid.y<center.y+radius.y*.50)continue;sample.tri.closestPointToPoint(skinQuery,closest);const d=closest.distanceToSquared(skinQuery);if(d<distance){distance=d;best={sample,point:closest.clone()};}}
   if(!best)throw Error('Wolf periocular source surface is unavailable');const bary=best.sample.tri.getBarycoord(best.point,V()),mapped=new T.Vector2();best.sample.uv.forEach((u,k)=>mapped.addScaledVector(u,bary.getComponent(k)));tex.push(mapped.x,mapped.y);
  }
  cap.setAttribute('uv',new T.Float32BufferAttribute(tex,2));cap.computeVertexNormals();cap.applyMatrix4(inverse);const mat=source.material.clone();mat.roughness=.91;const lid=new T.Mesh(cap,mat);lid.name='PV_WolfClosedLid_'+side;lid.visible=false;lid.castShadow=true;lid.userData={author:'PhenoVoxel Archive contributors',license:m.asset.license,source:m.asset.source,changes:'Original curved eyelid tissue attachment using barycentrically mapped retained periocular atlas; no raster generated or measured lid biomechanics.'};m.head.add(lid);attachments.push(lid);
  const curve=[];for(let i=0;i<=24;i++){const z=radius.z*.96*(i/12-1),x=radius.x*Math.sqrt(Math.max(0,1-z*z/(radius.z*radius.z)))*1.014;curve.push(center.clone().add(new T.Vector3(x,-.0015,z)).applyMatrix4(inverse));}const width=new T.Vector3(0,.0012,0).applyMatrix3(new T.Matrix3().setFromMatrix4(inverse)).length(),margin=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(curve),32,width,4,false),new T.MeshStandardMaterial({color:'#252a29',roughness:.93}));margin.name='PV_WolfClosedLidMargin_'+side;margin.visible=false;margin.userData={author:'PhenoVoxel Archive contributors',license:'MIT',changes:'Original closed-lid margin, qualitative tissue illustration'};m.head.add(margin);attachments.push(margin);
 }
 m.wolfEyelids={attachments,centroids,source,eyes};
}
export function setWolfEyelids(m,action){m.wolfEyelids?.attachments.forEach(o=>o.visible=action==='sleep');}
