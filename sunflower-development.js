import * as T from 'three';
const smooth=(p,a,b)=>T.MathUtils.smoothstep(p,a,b),TAU=Math.PI*2;

// Authored developmental landmarks, not a clock, measured specimen, growth
// equation, cultivar diagnosis, pollination model or seed-production simulation.
export function configureSunflowerDevelopment(studio,head,leaves,rays,florets){
 const {root,group,ell,tube}=studio,early=group();early.name='Early sunflower development · exposed basal tissues';
 const fruit=ell([0,.205,0],[.048,.064,.029],'#77634b',early);fruit.name='Dry one-seeded fruit enclosing the seed';
 const radicle=tube([[.012,.17,0],[.021,.15,.004],[.044,.14,.011]],.007,'#b9b094',early);radicle.name='Emerging radicle · exposed illustration';
 const axis=tube([[0,.18,0],[-.025,.26,0],[0,.34,0]],.009,'#738449',early);axis.name='Seedling hypocotyl';
 const cotyledons=[];
 for(const side of [-1,1]){
  const hinge=group([0,.33,0],early);hinge.rotation.z=-side*.45;
  const blade=ell([side*.105,.035,0],[.115,.014,.047],'#628245',hinge);blade.name='Oblong smooth cotyledon';cotyledons.push({hinge,side});
 }
 // Green bracts cover the immature head. Their opening is authored and is
 // separate from ray-floret expansion; no colored mature flower is in the seed.
 const cover=group([0,0,0],head),bracts=[];cover.name='Closed green head bud and opening involucral bracts';
 const N=22,R=6;
 for(let j=0;j<24;j++){
  const a=j*TAU/24,p=[],ix=[];
  for(let i=0;i<=N;i++)for(let k=0;k<=R;k++){const u=i/N,rr=.26*(1-u)+.19*Math.sin(Math.PI*u),w=(k/R*2-1)*.053*Math.sin(Math.PI*u);p.push(Math.cos(a)*rr-Math.sin(a)*w,Math.sin(a)*rr+Math.cos(a)*w,.55*u+.012*Math.sin(Math.PI*u));}
  for(let i=0;i<N;i++)for(let k=0;k<R;k++){const q=i*(R+1)+k;ix.push(q,q+R+1,q+1,q+1,q+R+1,q+R+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:'#506d35',roughness:.86,side:T.DoubleSide}));mesh.castShadow=mesh.receiveShadow=true;cover.add(mesh);bracts.push({mesh,a});
 }
 const earlyParts={fruit,radicle,axis,cotyledons,radicleBase:radicle.geometry.attributes.position.array.slice(),axisBase:axis.geometry.attributes.position.array.slice()};
 root.userData.development={kind:'authored sunflower stage sequence',validated:false,time:'normalized stage progress; playback seconds are not biological days',stages:['one-seeded fruit','radicle and hypocotyl emergence','cotyledons','true leaves','green head bud','ray-floret opening'],source:'https://doi.org/10.2135/cropsci1981.0011183X002100060024x'};
 const r={early,earlyParts,head,leaves,rays,florets,cover,bracts,N,R};
 // Default inspection is the original mature specimen. All added organs are
 // constructed once and retained through playback and reset.
 early.visible=false;cover.visible=false;
 return r;
}

export function sunflowerStage(t){const p=T.MathUtils.clamp(t/12,0,1);return {progress:p,name:p<.07?'One-seeded fruit':p<.22?'Radicle and hypocotyl emergence':p<.31?'Cotyledons':p<.67?'True-leaf development':p<.83?'Green head bud':'Ray-floret opening'};}

export function animateSunflowerDevelopment(m,action,t){
 const r=m.botanicalRig?.development;if(!r)return false;
 const growth=action==='grow',stage=sunflowerStage(t),p=growth?stage.progress:1;
 m.hideDevelopmentLandmarks=growth&&p<1;
 m.root.userData.development.currentStage=growth?stage.name:'Mature specimen';
 m.root.userData.development.normalizedProgress=p;
 const height=.12+.88*smooth(p,.22,.78),stemY=y=>y<=.35?y:.35+(y-.35)*height;
 // Do not display a shortened flowering stalk above the cotyledons. The
 // hypocotyl supports the seedling first; the epicotyl apex then advances with
 // the emerging true-leaf nodes, retaining the same stem surface throughout.
 const tip=growth?T.MathUtils.lerp(.41,2.8,smooth(p,.30,.67)):2.8;
 const thickness=growth?.28+.72*smooth(p,.30,.78):1;
 for(const stem of m.botanicalRig.stems){const a=stem.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const y=stem.neutral[i*3+1],juvenile=growth&&p<.67,taper=juvenile?1-smooth(y,tip-.085,tip):1;a.setXYZ(i,stem.neutral[i*3]*thickness*taper,stemY(juvenile?Math.min(y,tip):y),stem.neutral[i*3+2]*thickness*taper);}a.needsUpdate=true;stem.mesh.visible=!growth||p>.30;stem.mesh.geometry.computeVertexNormals();stem.mesh.geometry.computeBoundingSphere();}
 for(let i=0;i<r.leaves.length;i++){
  const n=r.leaves[i],start=.30+i*.034,size=smooth(p,start,start+.17);n.group.visible=!growth||p>start;n.group.position.y=stemY(n.base.y);n.group.scale.copy(n.scale).multiplyScalar(Math.max(1e-5,size));
  // Juvenile blades remain above the basal support while the internodes are
  // short. The selected leaf angles are authored, not measured trajectories.
  const tilt=n.group.userData.base.rotation.x;n.group.rotation.x=T.MathUtils.lerp(Math.max(.15,tilt),tilt,smooth(p,.65,.92));
 }
 r.head.group.position.y=stemY(r.head.base.y);r.head.group.scale.copy(r.head.scale).multiplyScalar(.25+.75*smooth(p,.67,.91));r.head.group.visible=!growth||p>=.67;
 const open=smooth(p,.83,1);
 for(const child of r.head.group.children)child.visible=!growth||p>=.83;
 r.cover.visible=growth&&p>=.67&&p<1;
 r.florets.visible=!growth||p>.87;
 for(const ray of r.rays){ray.petal.rotation.x=Math.PI/2+(1-open)*Math.PI/2;ray.group.position.copy(ray.position).multiplyScalar(.28+.72*open);ray.group.scale.setScalar(.25+.75*open);ray.group.visible=!growth||p>=.83;}
 for(const {mesh,a}of r.bracts){const v=mesh.geometry.attributes.position;for(let i=0;i<=r.N;i++){const u=i/r.N,closed=.26*(1-u)+.19*Math.sin(Math.PI*u),rr=T.MathUtils.lerp(closed,.30+.24*u,open),z=T.MathUtils.lerp(.55*u,-.12*u,open);for(let k=0;k<=r.R;k++){const w=(k/r.R*2-1)*.053*Math.sin(Math.PI*u),index=i*(r.R+1)+k;v.setXYZ(index,Math.cos(a)*rr-Math.sin(a)*w,Math.sin(a)*rr+Math.cos(a)*w,z+.012*Math.sin(Math.PI*u));}}v.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();}
 r.early.visible=growth&&p<.60;
 const {fruit,radicle,axis,cotyledons,radicleBase,axisBase}=r.earlyParts;
 fruit.visible=p<.22;fruit.position.y=.205+.10*smooth(p,.14,.22);radicle.visible=p>=.07;axis.visible=p>=.14;
 for(const [mesh,base,anchor,start,end]of [[radicle,radicleBase,[.012,.17,0],.07,.17],[axis,axisBase,[0,.18,0],.14,.23]]){const a=mesh.geometry.attributes.position,q=.05+.95*smooth(p,start,end);for(let i=0;i<a.count;i++)a.setXYZ(i,anchor[0]+(base[i*3]-anchor[0])*q,anchor[1]+(base[i*3+1]-anchor[1])*q,anchor[2]+(base[i*3+2]-anchor[2])*q);a.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();}
 for(const {hinge,side}of cotyledons){hinge.visible=p>=.22;hinge.rotation.z=side*(1-smooth(p,.22,.31))*1.15;hinge.scale.setScalar(.02+.98*smooth(p,.22,.31));}
 m.root.updateMatrixWorld(true);return true;
}
