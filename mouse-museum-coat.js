import * as T from 'three';
import {MeshSurfaceSampler} from 'three/addons/math/MeshSurfaceSampler.js';
import {coatSurface} from './specimen-exteriors.js';

const smooth=T.MathUtils.smoothstep;
const mm=(x,y,z)=>new T.Vector3(x*.001,y*.001,z*.001);
const midline=y=>19.25-.013*Math.max(0,y-6);
function randomStream(){
  let state=7321;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}

// Work on a duplicate of the nude source. Keep the face landmarks, feet and tail root registered.
function coatEnvelope(skin,map){
  const g=skin.geometry.clone(),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i)*1000,y=p.getY(i)*1000,z=p.getZ(i)*1000;
    const trunk=smooth(y,18,50)*(1-smooth(y,65,89))*smooth(z,-5,3);
    const cheek=Math.exp(-((y-9)**2/17+(z-10)**2/7));
    const dx=(x-midline(y))*(.31*trunk+.27*cheek);
    const padLift=.72*cheek*smooth(Math.abs(x-midline(y)),.9,3.5);
    const dz=padLift+trunk*((5.4+1.9*Math.exp(-((y-69)**2)/88))*smooth(z,7,18)-2.8*(1-smooth(z,3,10)));
    p.setXYZ(i,(x+dx)*.001,y*.001,(z+dz)*.001);
  }
  g.deleteAttribute('normal');g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial());
  coatSurface(mesh,false,map);
  // Light cheek and throat fur grade into the darker crown and shoulders.
  const base=mesh.geometry.attributes.color,point=mesh.geometry.attributes.position;
  const c=new T.Color(),throat=new T.Color('#fff0d6');
  for(let i=0;i<point.count;i++){
    const y=point.getY(i)*1000,z=point.getZ(i)*1000;
    const pale=(1-smooth(y,13,35))*(1-smooth(z,8,12));
    c.fromBufferAttribute(base,i).lerp(throat,pale*.86);
    c.multiplyScalar(1+pale*.72);base.setXYZ(i,c.r,c.g,c.b);
  }
  return mesh;
}

function guardHairs(coat){
  const rand=randomStream(),sample=new MeshSurfaceSampler(coat).setRandomGenerator(rand).build();
  const pos=[],norm=[],colors=[],indices=[];
  const root=new T.Vector3(),n=new T.Vector3(),lay=new T.Vector3(),across=new T.Vector3(),v=new T.Vector3();
  const dark=new T.Color('#55483e'),gold=new T.Color('#95816b'),cream=new T.Color('#a99a83'),shade=new T.Color();
  const add=(along,lift,width,tint)=>{
    v.copy(root).addScaledVector(lay,along).addScaledVector(n,lift).addScaledVector(across,width);
    pos.push(v.x,v.y,v.z);norm.push(n.x,n.y,n.z);
    colors.push(shade.r*tint,shade.g*tint,shade.b*tint);
  };
  for(let i=0;i<29000;i++){
    sample.sample(root,n);const y=root.y*1000,z=root.z*1000,x=root.x*1000;
    if(y<4.6||z<-.5||y>85)continue;
    const eyeY=x>19?15.91:15.60,eyeZ=x>19?14.87:15.54;
    if(((y-eyeY)/2.0)**2+((z-eyeZ)/1.40)**2<1)continue;
    const face=smooth(y,8,23),ventral=1-smooth(z,5,15);
    const length=(.00050+.0019*face)*(.55+.95*rand());
    const flank=Math.min(1,Math.abs(x-midline(y))/11);
    const wave=Math.sin(y*.32+z*.41)*.12;
    lay.set(.52*(rand()-.5)+wave,1,-.18-.8*flank+.48*(rand()-.5)).addScaledVector(n,-lay.dot(n));
    if(lay.lengthSq()<.001)lay.set(0,0,-1).addScaledVector(n,n.z);
    lay.normalize();across.crossVectors(lay,n).normalize();
    const width=(.000025+.000038*rand())*(.66+.34*face),lift=length*(.13+.24*rand());
    shade.copy(dark).lerp(gold,Math.pow(rand(),1.55)).lerp(cream,ventral*(.32+.4*rand()));
    const at=pos.length/3;
    add(0,-.00006,-width,.65);add(0,-.00006,width,.65);
    add(length*.60,lift*.82,-width*.58,1.01);add(length*.60,lift*.82,width*.58,1.01);
    add(length,lift,0,.77);
    indices.push(at,at+1,at+2,at+1,at+3,at+2,at+2,at+3,at+4);
  }
  const g=new T.BufferGeometry();g.setIndex(indices);
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  return new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.98,side:T.DoubleSide}));
}

// Trace the coat itself so both halves of the closed lip and the whisker roots meet the muzzle.
function facePoint(coat,y,z,side){
  const ray=new T.Raycaster(mm(midline(y)+side*25,y,z),new T.Vector3(-side,0,0));
  return ray.intersectObject(coat,false)[0]?.point;
}
function tube(points,radius,material,taper=false){
  const path=new T.CatmullRomCurve3(points),steps=Math.max(points.length*2,12);
  const g=new T.TubeGeometry(path,steps,radius,5,false);
  if(taper){
    const p=g.attributes.position,v=new T.Vector3();
    for(let i=0;i<=steps;i++){
      const u=i/steps,c=path.getPointAt(u);
      for(let k=0;k<=5;k++){const j=i*6+k;v.fromBufferAttribute(p,j).sub(c).multiplyScalar(1-.96*u).add(c);p.setXYZ(j,v.x,v.y,v.z);}
    }
  }
  return new T.Mesh(g,material);
}
function face(coat){
  const nose=new T.Group(),mouth=new T.Group(),whiskers=new T.Group(),rand=randomStream();
  const tissue=new T.MeshStandardMaterial({vertexColors:true,roughness:.7});
  const seam=new T.MeshStandardMaterial({color:'#514039',roughness:.93});
  const pearl=new T.MeshStandardMaterial({color:'#beae99',roughness:.77});
  const umber=new T.MeshStandardMaterial({color:'#726358',roughness:.78});
  const tip=new T.Mesh(new T.SphereGeometry(1,64,42),tissue);
  tip.scale.copy(mm(1.58,1.53,.86));tip.position.copy(mm(19.27,3.89,10.14));
  const g=tip.geometry,p=g.attributes.position,colors=[];
  const pink=new T.Color('#987364'),boundary=new T.Color('#78614c'),shadow=new T.Color('#433a37'),c=new T.Color();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),u=Math.abs(x);
    const front=smooth(-y,.22,.85);
    const slit=front*Math.exp(-(((u-.51)/.22)**2+((z-.17-.28*(u-.51))/.13)**2));
    const groove=front*Math.exp(-(x*x/.018+(z+.42)**2/.36));
    const grain=Math.sin(58*x+13*z)*Math.sin(46*z-24*y);
    p.setXYZ(i,x*(.87+.22*z),y+.42*slit+.13*groove+.012*grain,z*(.87+.13*u));
    c.copy(pink).lerp(boundary,.82*(1-front)).lerp(shadow,Math.min(1,.91*slit+.23*groove+.035*(1+grain)));
    colors.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();nose.add(tip);
  // The sagittal groove descends between the paired upper lips.
  mouth.add(tube([mm(19.27,2.78,9.8),mm(19.27,3.03,9.44),mm(19.27,3.46,9.06)],.000065,seam));
  for(const side of [-1,1]){
    const lip=[mm(19.27,3.46,9.06)];
    for(const [y,z] of [[4.3,9.03],[5.5,8.74],[7.1,8.4],[9.0,8.15],[11.2,8.35]]){
      const q=facePoint(coat,y,z,side);if(q){q.x+=side*.000023;lip.push(q);}
    }
    if(lip.length>2)mouth.add(tube(lip,.000083,seam,true));
    for(let row=0;row<3;row++)for(let col=0;col<7;col++){
      const y=5.6+col*.86+row*.22,z=9.1+row*.71+.22*rand();
      const q=facePoint(coat,y,z,side);if(!q)continue;
      const span=6+col*1.8+rand()*2,back=(col-2)*2.5+row,up=(row-1)*2.6+rand()*1.7;
      const shaft=tube([q,q.clone().add(mm(side*span*.28,back*.05,up*.22+.75)),q.clone().add(mm(side*span*.69,back*.40,up*.72+1.1)),q.clone().add(mm(side*span,back,up))],.000048,col%3===0?umber:pearl,true);
      shaft.geometry.translate(-q.x,-q.y,-q.z);shaft.position.copy(q);shaft.userData.whiskSide=side;whiskers.add(shaft);
    }
  }
  return {nose,mouth,whiskers};
}

// Build the visible corneal dome inside a lid aperture on the coat. The
// independent atlas eyeballs remain available when examining the sensory system.
function eyeAperture(coat,side){
  const cy=side>0?15.91:15.60,cz=side>0?14.87:15.54;
  const rim=[],pos=[],index=[],segments=40,rings=7;
  const center=facePoint(coat,cy,cz,side);
  if(!center)throw Error('Missing eye landmark on mouse exterior');
  for(let k=0;k<=segments;k++){
    const t=2*Math.PI*k/segments,c=Math.cos(t),s=Math.sin(t);
    const y=cy+1.62*c,z=cz+1.12*s*(.72+.28*Math.abs(s))+.16*c;
    const q=facePoint(coat,y,z,side)||mm(center.x*1000,y,z);
    q.x+=side*.00005;rim.push(q);
  }
  for(let j=0;j<=rings;j++)for(let k=0;k<=segments;k++){
    const r=j/rings,q=center.clone().lerp(rim[k],r);
    q.x+=side*.00076*(1-r*r);pos.push(q.x,q.y,q.z);
    if(k&&j){const b=j*(segments+1)+k,a=b-segments-1;index.push(a-1,b,b-1,a-1,a,b);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(side>0?index.reverse():index);g.computeVertexNormals();
  const lens=new T.Mesh(g,new T.MeshStandardMaterial({color:'#211b18',roughness:.22,side:T.DoubleSide}));
  const lid=tube(rim,.00013,new T.MeshStandardMaterial({color:'#604d41',roughness:.83}));
  return {lens,lid};
}

// A shallow cupped pinna with a rolled helix; its opening faces out and slightly forward.
function pinna(side){
  const pos=[],color=[],idx=[],dark=new T.Color('#80584d'),pink=new T.Color('#b79181'),edge=new T.Color('#765d51'),c=new T.Color();
  const rings=12,segments=36;
  for(let j=0;j<=rings;j++)for(let k=0;k<=segments;k++){
    const r=j/rings,t=2*Math.PI*k/segments,up=Math.sin(t),across=Math.cos(t);
    const z=18.65+5.35*r*up,y=25.75+3.55*r*across+.85*r*up;
    const bowl=Math.exp(-((across*r+.18)**2/.18+(up*r+.29)**2/.09));
    const fold=Math.exp(-((across*r+.01+.45*up*r)**2/.045+(up*r+.54)**2/.10));
    const depth=1.35*r*r+.50*Math.exp(-((r-.87)**2)/.006)-.85*bowl+.92*fold;
    const x=19.15+side*(8.38+.32*(z-18.65)+.47*(y-25.75)+depth);
    pos.push(x*.001,y*.001,z*.001);
    c.copy(dark).lerp(pink,.28+.64*r).lerp(edge,smooth(r,.86,1)).multiplyScalar(1-.40*bowl+.12*fold);color.push(c.r,c.g,c.b);
    if(j&&k){const b=j*(segments+1)+k,a=b-segments-1;idx.push(a-1,a,b,a-1,b,b-1);}
  }
  const g=new T.BufferGeometry();g.setIndex(side===1?idx:idx.reverse());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.computeVertexNormals();
  return new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide}));
}

export function mouseMuseumExterior(parts,map){
  const coat=coatEnvelope(parts.get('living:skin'),map),fur=guardHairs(coat);
  const {nose,mouth,whiskers}=face(coat);
  const ears=new T.Group();ears.add(pinna(-1),pinna(1));
  const eyes=[],lids=[];
  for(const side of [-1,1]){const {lens,lid}=eyeAperture(coat,side);eyes.push(lens);lids.push(lid);}
  const groups=new Map();
  for(const [id,objects] of [['skin',[coat,fur]],['nose',[nose]],['lips',[mouth]],['vibrissae',[whiskers]],['pinnae',[ears]],['eyes',eyes],['eyelids',lids]]){
    const group=new T.Group();group.name='Museum exterior / '+id;group.add(...objects);
    group.traverse(o=>{if(o.isMesh)o.userData.structureId='living:'+id;});
    groups.set('living:'+id,group);
  }
  return groups;
}
