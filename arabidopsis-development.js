import * as T from 'three';
const smooth=(p,a,b)=>T.MathUtils.smoothstep(p,a,b);
const vec=(x,y,z)=>new T.Vector3(x,y,z);
function ell(parent,pos,size,color){const o=new T.Mesh(new T.SphereGeometry(1,24,16),new T.MeshStandardMaterial({color,roughness:.85}));o.position.set(...pos);o.scale.set(...size);parent.add(o);o.castShadow=o.receiveShadow=true;return o;}
export function configureArabidopsisDevelopment(m,meshes){
 const early=new T.Group();early.name='Authored Arabidopsis seedling · retained adult artist surface';m.root.add(early);
 const seed=ell(early,[0,.155,0],[.023,.015,.012],'#937049');seed.name='Selected seed outline · dimensions uncalibrated';
 const stem=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([vec(.008,.145,0),vec(-.014,.21,0),vec(0,.28,0)]),24,.005,8,false),new T.MeshStandardMaterial({color:'#78894b',roughness:.85}));early.add(stem);
 const cotyledons=[];for(const sign of [-1,1]){const g=new T.Group();g.position.set(0,.28,0);early.add(g);const blade=ell(g,[sign*.072,.008,0],[.080,.007,.055],'#688946');blade.name='Rounded cotyledon · distinct from rosette true leaves';cotyledons.push({g,sign});}
 const buds=[],anchors=[];
 for(const r of meshes.filter(r=>r.flower))for(const g of r.groups){if(!anchors.some(v=>v.distanceTo(g.anchor)<.055)){anchors.push(g.anchor.clone());const bud=ell(m.root,g.anchor.toArray(),[.026,.046,.026],'#70864a');bud.name='Authored unopened flower bud';bud.visible=false;buds.push({bud,anchor:g.anchor.clone()});}}
 const ys=anchors.map(v=>v.y),minY=Math.min(...ys),maxY=Math.max(...ys);
 early.visible=false;m.root.userData.development={kind:'authored Arabidopsis stage sequence on retained creator plant',validated:false,time:'normalized developmental progress; no calendar time or physiological prediction',source:'https://doi.org/10.1105/tpc.010011',stages:['seed','hypocotyl and cotyledons','rosette true leaves','bolting and buds','flower opening']};
 return {early,seed,stem,cotyledons,buds,minY,maxY};
}
export function animateArabidopsisDevelopment(m,action,t){
 const r=m.botanicalAssetRig,d=r.development;if(!d)return false;
 const growth=action==='grow',p=growth?T.MathUtils.clamp(t/12,0,1):1;
 m.hideDevelopmentLandmarks=growth&&p<1;
 const yMap=y=>y<.31?y:.31+(y-.31)*(.035+.965*smooth(p,.56,.83));
 m.root.userData.development.currentStage=!growth?'Mature specimen':p<.14?'Seed':p<.30?'Hypocotyl and cotyledons':p<.58?'Rosette true leaves':p<.82?'Bolting and green buds':'Flower opening';
 m.root.userData.development.normalizedProgress=p;
 // The source's mature cotyledon surface is a separate, previously untracked
 // mesh. It cannot remain as a full-size yellow leaf beneath the seedling.
 // Retain it unchanged for adult inspection; early stages use the two authored
 // cotyledons already attached to the hypocotyl.
 for(const mesh of r.sourceCotyledons)mesh.visible=!growth||p>=.58;
 m.root.updateMatrixWorld(true);
 for(const source of r.meshes){const a=source.mesh.geometry.attributes.position;source.mesh.visible=!growth||(source.leaf?p>.30:source.stem?p>.56:p>.82);
  for(const g of source.groups){
   const height=(g.anchor.y-d.minY)/Math.max(.001,d.maxY-d.minY),opening=smooth(p,.81+.10*height,.89+.10*height),start=source.leaf?(g.lowLeaf?.30:.63):source.flower?.81+.10*height:.56,amount=growth?smooth(p,start,source.leaf?(g.lowLeaf?.62:.82):source.flower?.89+.10*height:.83):1;
   const anchor=g.anchor.clone();anchor.y=yMap(anchor.y);
   for(const i of g.indices){const target=source.world[i].clone();if(source.leaf||source.flower){target.sub(g.anchor).multiplyScalar(amount).add(anchor);if(!g.lowLeaf)target.y=anchor.y+(source.world[i].y-g.anchor.y)*amount*(.035+.965*smooth(p,.56,.83));}else target.y=yMap(target.y);a.setXYZ(i,...source.mesh.worldToLocal(m.root.localToWorld(target)).toArray());}
  }
  a.needsUpdate=true;source.mesh.geometry.computeVertexNormals();source.mesh.geometry.computeBoundingBox();source.mesh.geometry.computeBoundingSphere();
 }
 d.early.visible=growth&&p<.58;d.seed.visible=p<.22;d.stem.visible=p>.14;
 for(const {g,sign}of d.cotyledons){g.visible=p>.20;g.scale.setScalar(.02+.98*smooth(p,.20,.30));g.rotation.z=sign*(1-smooth(p,.20,.30))*.9;}
 for(const {bud,anchor}of d.buds){const h=(anchor.y-d.minY)/Math.max(.001,d.maxY-d.minY),open=smooth(p,.81+.10*h,.89+.10*h);bud.visible=growth&&p>.65&&open<1;bud.position.copy(anchor);bud.position.y=yMap(anchor.y);bud.scale.set(.026,.046,.026).multiplyScalar(Math.max(1e-5,smooth(p,.65,.78)*(1-open)));}
 m.root.updateMatrixWorld(true);return true;
}
