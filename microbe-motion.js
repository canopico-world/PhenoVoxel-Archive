import * as T from 'three';
export function animateMicroAppendages(m,action,t){
 if(m.kind!=='cell')return;
 const id=m.id;
 if(id==='amoeba-proteus'&&m.parts.body?.isMarchingCubes){const b=m.parts.body,phase=action==='observe'?0:Math.floor(t*8)/8;b.reset();b.addBall(.48,.5,.5,4,12);for(let i=0;i<7;i++){const a=i*2.4,r=.22+(phase?.035*Math.sin(phase*1.3+i):0);b.addBall(.5+Math.cos(a)*r,.5+Math.sin(i)*.05,.5+Math.sin(a)*r,1,12);}b.update();return;}
 if(['observe','rest'].includes(action)){for(const g of m.parts.tails){const mesh=g.children.find(o=>o.isMesh),base=mesh?.userData.flagNeutral;if(base){mesh.geometry.attributes.position.array.set(base);mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.computeVertexNormals();}}return;}
 if(['escherichia-coli','bacillus-subtilis','halobacterium-salinarum','sulfolobus-acidocaldarius'].includes(id)){
  m.parts.tails.forEach((g,i)=>{g.rotation.y=0;g.rotation.x=t*7*(id==='halobacterium-salinarum'&&g.position.x<0?-1:1);});
 }else if(['euglena-gracilis','chlamydomonas-reinhardtii'].includes(id)){
  m.parts.tails.forEach((g,i)=>{g.rotation.y=0;const mesh=g.children.find(o=>o.isMesh),p=mesh.geometry.attributes.position,base=mesh.userData.flagNeutral||(mesh.userData.flagNeutral=p.array.slice());for(let k=0;k<p.count;k++){const x=base[k*3],u=T.MathUtils.clamp(x/2.25,0,1),wave=Math.sin(t*6-u*6+i*Math.PI)*.13*u;p.setXYZ(k,x,base[k*3+1]+wave,base[k*3+2]+(id==='chlamydomonas-reinhardtii'?(i?1:-1)*wave:Math.cos(t*6-u*6)*.06*u));}p.needsUpdate=true;mesh.geometry.computeVertexNormals();});
 }else if(id==='paramecium-caudatum'){
  m.parts.tentacles.forEach((g,i)=>{const n=new T.Vector3(g.position.x/1.32,(g.position.y-1.3)/.43,g.position.z/.39).normalize(),axis=n.cross(new T.Vector3(1,0,0));if(axis.lengthSq()<1e-8)axis.set(0,0,1);axis.normalize();const sign=action==='reverse'?-1:1;g.quaternion.setFromAxisAngle(axis,sign*(.12+.38*Math.sin(t*10-i*.24)));});
 }
}
