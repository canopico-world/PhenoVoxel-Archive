import * as T from 'three';
import {mergeVertices,mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const V=(...a)=>new T.Vector3(...a),TAU=Math.PI*2;
function surf(fn,nu,nv,mat){const p=[],ix=[],uv=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){p.push(...fn(i/nu,j/nv).toArray());uv.push(i/nu,j/nv);}for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const n=i*(nv+1)+j;ix.push(n,n+nv+1,n+1,n+1,n+nv+1,n+nv+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return new T.Mesh(g,mat);}
export function buildEnsisSiphons(){
 const root=new T.Group();root.position.x=1.42;root.name='Short posterior siphons; illustrative proportions and cirrus count';
 const tissue=new T.MeshStandardMaterial({color:0xd1bda2,roughness:.65,side:T.DoubleSide}),rimMat=new T.MeshStandardMaterial({color:0xc9b99f,roughness:.7,side:T.DoubleSide}),inner=new T.MeshStandardMaterial({color:0x715c4a,roughness:.82,side:T.DoubleSide});
 function freckles(o){const p=o.geometry.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),spot=Math.max(0,Math.sin(x*249+Math.sin(z*83)*2)*Math.sin(y*193+z*97));const q=new T.Color('#d1bda2').lerp(new T.Color('#765146'),Math.pow(spot,6)*.75);c.push(q.r,q.g,q.b);}o.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));o.material=o.material.clone();o.material.vertexColors=true;o.material.color.set('white');return o;}
 const wall=freckles(surf((u,v)=>V(u*.14,(.067-.006*u)*Math.sin(v*TAU),(.17-.025*u)*Math.cos(v*TAU)),24,64,tissue));wall.name='Shared proximal mantle collar';root.add(wall);
 const tubes=[];
 for(const [kind,cz,rad] of [['exhalant',-.08,.043],['inhalant',.075,.052]]){
  const outer=freckles(surf((u,v)=>{const a=v*TAU,R=rad+.006+.007*(1-u)**2+.0015*u*Math.sin(a*5+.7);return V(.14+.10*u,R*Math.sin(a),cz+R*Math.cos(a));},32,64,tissue));outer.name=kind+' distal outer wall';root.add(outer);
  const lumen=surf((u,v)=>V(.04+.20*u,rad*Math.sin(v*TAU),cz+rad*Math.cos(v*TAU)),24,48,inner);lumen.name=kind+' open lumen';root.add(lumen);
  const rim=surf((u,v)=>{const a=v*TAU,R=rad+(.006+.0015*Math.sin(a*5+.7))*u;return V(.24+.002*Math.sin(u*Math.PI),R*Math.sin(a),cz+R*Math.cos(a));},8,64,rimMat);rim.name=kind+' annular aperture';root.add(rim);tubes.push({kind,cz,rad,outer,lumen,rim});
 }
 // Structured annular patches join each lumen to a shared half-ellipse collar.
 // The median is recessed rather than made from a flat plate or a closed cap.
 const patches=tubes.map(t=>surf((u,v)=>{const a=v*TAU,dy=Math.sin(a),dz=Math.cos(a),ry=.061,rz=.145,A=(dy/ry)**2+(dz/rz)**2,B=2*t.cz*dz/rz**2,C=(t.cz/rz)**2-1,ellipse=(-B+Math.sqrt(B*B-4*A*C))/(2*A),plane=-t.cz/dz,median=plane>0&&plane<ellipse,outer=median?plane:ellipse,R=t.rad+(outer-t.rad)*u,x=.14-(median?.025:0)*u-.009*Math.sin(u*Math.PI);return V(x,R*dy,t.cz+R*dz);},32,128,tissue).geometry);
 for(const g of patches)g.deleteAttribute('uv');const combined=mergeGeometries(patches),bg=mergeVertices(combined,1e-5);combined.dispose();for(const g of patches)g.dispose();bg.computeVertexNormals();
 const bridge=freckles(new T.Mesh(bg,tissue));bridge.name='Continuous recessed tissue junction with two open passages';root.add(bridge);
 // A qualitative mantle enclosure prevents the live exterior appearing as an empty
 // shell. This is not a reconstruction of gills, muscles or digestive organs.
 const mantle=freckles(surf((u,v)=>{const x=-2.87+2.87*u,worldX=1.42+x,center=.17*(1-(worldX/1.6)**2)*T.MathUtils.smoothstep(1.42-worldX,0,.35),a=v*TAU;return V(x,.058*Math.sin(a),center+.168*Math.cos(a));},144,80,tissue));mantle.name='Undifferentiated mantle enclosure; internal organs omitted';root.add(mantle);
 const body=new T.Mesh(new T.SphereGeometry(1,48,32),tissue.clone());body.name='Unmeasured soft-body envelope; organs not reconstructed';body.position.set(-1.72,0,.12);body.scale.set(1.13,.050,.145);root.add(body);
 const cirri=[];
 // A selected illustrative arrangement from the historical live-animal drawing,
 // not a measured species-wide count. Fine outer cirri surround both passages.
 for(let n=0;n<22;n++){const a=n*TAU/22,len=.065+.045*(.5+.5*Math.sin(n*9)),y=.066*Math.sin(a),z=.151*Math.cos(a),o=surf((u,v)=>{const r=.0045*(1-u)+.0003,ang=v*TAU;return V(.12+u*len, y*(1+.18*u)+r*Math.sin(ang),z*(1+.14*u)+r*Math.cos(ang));},16,8,rimMat);o.name='Fine marginal cirrus, illustrative arrangement';root.add(o);cirri.push(o);}
 const spatulas=[];for(let n=0;n<5;n++){const a=n*TAU/5,cy=.052*Math.sin(a),cz=.075+.052*Math.cos(a),o=surf((u,v)=>{const ang=v*TAU,w=.003+.008*Math.sin(u*Math.PI),inward=.024*u*u;return V(.22+.073*u-.025*u*u+.002*Math.cos(ang),cy-inward*Math.sin(a)+w*Math.sin(ang)*Math.cos(a),cz-inward*Math.cos(a)-w*Math.sin(ang)*Math.sin(a));},24,12,rimMat);o.name='Broad bent inhalant marginal projection; illustrative';root.add(o);spatulas.push(o);}
 function pose(time){const t=T.MathUtils.clamp(Number.isFinite(time)?time:0,0,8),u=T.MathUtils.smoothstep(t,0,4);// Extend only the posterior collar/lumen assembly; keep the mantle enclosure
 // attached and prevent whole-body scaling from masquerading as siphon action.
 for(const o of root.children){if(o!==mantle&&o!==body)o.scale.x=.62+.38*u;}
 root.updateMatrixWorld(true);return{time:t,duration:8,measured:false};}pose(0);return{root,tubes,bridge,wall,mantle,body,cirri,spatulas,pose};
}

