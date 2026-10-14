import * as THREE from 'three';
import {fitSpecimenCamera,renderedBounds} from './camera-fit.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildSpecimen, animateSpecimen } from './models.js';
import {hasTexturedAsset,loadTexturedSpecimen} from './asset-loader.js';
import {updateSpecimenLandmarks} from './surface-landmarks.js';
import {animateAsset,selectAssetMotion} from './asset-motion.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import archive from './species.json';

export function createViewer(container,{onFeature,onReady,onError}){
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Interactive 3D specimen. Drag to orbit, scroll to zoom. Anatomical features are also available as buttons.');canvas.setAttribute('role','img');container.prepend(canvas);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});}catch(e){onError('Your browser could not initialize 3D graphics. The scientific records and downloads are still available.');return {setSpecies(){},setMotion(){},setPaused(){},setSpeed(){},setWireframe(){},setLabels(){},setHabitat(){},setRotate(){},selectFeature(){},reset(){},dispose(){},exportGLB:async()=>{throw new Error('3D graphics unavailable');}};}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100);
 camera.position.set(5,3.8,6.5);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.055;controls.target.set(0,1.4,0);controls.minDistance=3;controls.maxDistance=16;controls.maxPolarAngle=Math.PI*.49;controls.autoRotateSpeed=.45;
 scene.add(new THREE.HemisphereLight('#e4ecf0','#273038',1.5));
 const key=new THREE.DirectionalLight('#fff6e9',2.7);key.position.set(3,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.bias=-.0004;scene.add(key);
 const rim=new THREE.DirectionalLight('#c1d6e7',1.7);rim.position.set(-4,4,-4);scene.add(rim);const fill=new THREE.DirectionalLight('#dce8e8',1.1);fill.position.set(-3,3,6);scene.add(fill);
 const pedestal=new THREE.Group();scene.add(pedestal);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.32,.18,80),new THREE.MeshStandardMaterial({color:'#293e32',roughness:.9}));base.position.y=.04;base.receiveShadow=true;pedestal.add(base);
 const border=new THREE.Mesh(new THREE.TorusGeometry(2.36,.017,8,100),new THREE.MeshStandardMaterial({color:'#697d7c',emissive:'#283c40',emissiveIntensity:.2}));border.rotation.x=Math.PI/2;border.position.y=.135;pedestal.add(border);
 const terrain=new THREE.Group();pedestal.add(terrain);
 // Deterministic decorative ground cover is contextual artwork, not an occurrence record.
 for(let j=0;j<0;j++){
  const a=j*2.399963,r=1.55+(j%5)*.13;
  const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.07+(j%4)*.035,0),new THREE.MeshStandardMaterial({color:j%2?'#53684c':'#78806b',roughness:1}));rock.position.set(Math.cos(a)*r,.15,Math.sin(a)*r);rock.scale.set(1.7,.7,1);rock.receiveShadow=true;rock.castShadow=true;terrain.add(rock);
  for(let n=0;n<4;n++){const blade=new THREE.Mesh(new THREE.ConeGeometry(.016,.17+n*.025,3),new THREE.MeshStandardMaterial({color:n%2?'#809c63':'#5c804f'}));blade.position.copy(rock.position).add(new THREE.Vector3(.09+n*.025,.08,-.04));blade.rotation.z=(n-1)*.2;terrain.add(blade);}
 }
 const grid=new THREE.GridHelper(8,24,'#33564c','#23413b');grid.position.y=-.13;grid.material.transparent=true;grid.material.opacity=.2;scene.add(grid);
 const markers=document.createElement('div');markers.className='model-markers';container.append(markers);
 let model=null,motion='observe',paused=false,speed=1,time=0,wire=false,labels=false,habitat=true,frame=0,last=performance.now(),highlight=-1,needsRender=true,poseDirty=true,generation=0;
 controls.addEventListener('change',()=>needsRender=true);
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function disposeObject(g){const geometries=new Set(),materials=new Set(),skeletons=new Set();g.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.skeleton)skeletons.add(o.skeleton);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(x=>x.dispose());skeletons.forEach(x=>x.dispose());const textures=new Set();materials.forEach(m=>{for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();});textures.forEach(t=>t.dispose());}
 function fitCamera(){if(!model)return;const bounds=renderedBounds(model.root);if(model.motionBounds?.[motion])bounds.union(model.motionBounds[motion]);if(['grow','unfurl','spread','bud','fold','trap'].includes(motion)&&model.displayBounds)bounds.union(model.displayBounds);const reserved=(document.querySelector('#viewer-actions')?.offsetHeight||50)+116,bottomLimit=Math.min(-.08,Math.max(-.33,-1+2*reserved/container.clientHeight));fitSpecimenCamera(camera,controls,bounds,{bottomLimit});needsRender=true;}
 function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fitCamera();needsRender=true;}
 const observer=new ResizeObserver(resize);observer.observe(container);
 let down=null;
 canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 canvas.addEventListener('pointerup',e=>{if(!model||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObject(model.root,true);if(hits.length){const p=model.root.worldToLocal(hits[0].point.clone());let ix=0,d=Infinity;model.features.forEach((f,i)=>{if(markers.children[i]?.dataset.modelVisibility==='not-modeled')return;const dist=f.distanceTo(p);if(dist<d){d=dist;ix=i;}});onFeature(ix);}});
 function render(now){
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(!document.hidden){
   const animated=!paused&&!!model&&motion!=='observe'&&(model.textured?!!model.action||!['sit','rest','sleep'].includes(motion):!['sit','rest','sleep'].includes(motion));
   if(animated){time+=dt*speed;needsRender=true;}
   if(model&&(animated||poseDirty)){if(model.textured)animateAsset(model,motion,time);else animateSpecimen(model,motion,time);poseDirty=false;needsRender=true;}
   controls.update();
   if(needsRender){
    if(model){updateSpecimenLandmarks(model);model.root.updateMatrixWorld(true);for(let i=0;i<model.features.length;i++){const p=model.features[i].clone().applyMatrix4(model.root.matrixWorld).project(camera);const el=markers.children[i];el.style.left=`${(p.x*.5+.5)*100}%`;el.style.top=`${(-p.y*.5+.5)*100}%`;el.hidden=!labels||el.dataset.modelVisibility==='not-modeled'||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1;el.classList.toggle('selected',highlight===i);}}
    renderer.render(scene,camera);needsRender=false;
   }
  }
  frame=requestAnimationFrame(render);
 }
 resize();frame=requestAnimationFrame(render);onReady();
 return {
  async setSpecies(s){
   const token=++generation;if(model){scene.remove(model.root);disposeObject(model.root);model=null;}
   time=0;highlight=-1;markers.replaceChildren();needsRender=true;
   container.dataset.species=s.id;container.dataset.model='loading';container.dataset.motion='observe';container.dataset.ready='false';
   const status=document.querySelector('#viewer-error');status.hidden=false;status.textContent=hasTexturedAsset(s)?'Loading textured specimen…':'Building reference reconstruction…';
   try{
    const next=hasTexturedAsset(s)?await loadTexturedSpecimen(s):buildSpecimen(s);
    if(token!==generation){disposeObject(next.root);return;}
    model=next;scene.add(model.root);model.displayBounds=renderedBounds(model.root);container.dataset.ready='true';container.dataset.model=model.textured?model.asset.uid||model.asset.localFile:'reference-'+s.id;
    s.anatomy.forEach((f,i)=>{const b=document.createElement('button');b.className='anatomy-marker';b.textContent=String(i+1).padStart(2,'0');b.title=f.name;b.dataset.modelVisibility=f.modelVisibility||'';b.setAttribute('aria-label',`Inspect ${f.name}`);b.addEventListener('click',()=>onFeature(i));markers.append(b);});
    const aquatic=['fish','cetacean','jelly','octopus','turtle'].includes(model.kind);base.material.color.set(aquatic?'#29444a':'#25343b');terrain.visible=habitat&&!aquatic&&!['cell','network'].includes(model.kind);this.setWireframe(wire);this.reset();this.setMotion(motion);status.hidden=true;poseDirty=true;
   }catch(error){if(token!==generation)return;container.dataset.model='unavailable';container.dataset.ready='false';status.textContent='This 3D file could not load. Retry this species; its photograph and scientific record remain available.';status.hidden=false;onError(status.textContent);}
  },
  setMotion(v){motion=v;time=0;poseDirty=true;container.dataset.motion=v;if(model?.textured){const scope=selectAssetMotion(model,v);container.dataset.animation=scope;document.querySelector('.timing-note').textContent=scope;
   animateAsset(model,v,0);fitCamera();
  }else{document.querySelector('.timing-note').textContent='Authored reconstruction · illustrative timing';if(model){animateSpecimen(model,v,0);fitCamera();}}},setPaused(v){paused=v;},setSpeed(v){speed=v;},
  setWireframe(v){wire=v;if(model)model.root.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.wireframe=v);});needsRender=true;},
  setLabels(v){labels=v;needsRender=true;},setHabitat(v){habitat=v;terrain.visible=v&&model&&!['cell','network','fish','cetacean','jelly','octopus','turtle'].includes(model.kind);needsRender=true;},setRotate(v){controls.autoRotate=v;},
  selectFeature(i){highlight=i;needsRender=true;},
  setView(view){const y=controls.target.y;controls.target.set(0,y,0);if(view==='side')camera.position.set(0,y+.6,7.4);if(view==='front')camera.position.set(7.4,y+.6,.01);if(view==='top')camera.position.set(0,8,.01);controls.maxPolarAngle=view==='top'?Math.PI*.5:Math.PI*.49;controls.update();fitCamera();needsRender=true;},
  reset(){const high=model?.id==='giraffa-camelopardalis'||model?.kind==='tree',owl=model?.id==='tyto-alba';controls.target.set(0,high?1.75:1.35,0);camera.position.set(owl?6:high?5.8:model?.natural?3.5:4.8,high?3.9:3.3,owl?2:high?7.5:model?.natural?6:6.2);controls.update();fitCamera();needsRender=true;},
  async exportGLB(){if(!model)throw new Error('Select a species first.');const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');const clone=cloneSkeleton(model.root);clone.userData={species:model.id,pose:motion,sourceSha256:model.asset?.sourceSha256||model.asset?.sha256,deliveredSha256:model.asset?.sha256,viewerVersion:archive.version,fidelity:model.textured?(model.asset?.surfaceType==='authored materials'?'artist reconstruction with authored materials':'textured artist reconstruction'):'reference-guided educational reconstruction',license:model.textured?model.asset.license:'MIT',author:model.asset?.author||'PhenoVoxel Archive contributors',source:model.asset?.source,changes:model.asset?.changes,viewerRig:model.asset?.viewerRig||model.viewerRig,surfaceLandmarks:model.surfaceLandmarks,referencePhotograph:model.root.userData.reconstruction?.reference,geometry:model.root.userData.reconstruction?.geometry,animationValidated:false};return new GLTFExporter().parseAsync(clone,{binary:true});},
  dispose(){generation++;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();if(model)disposeObject(model.root);disposeObject(pedestal);grid.geometry.dispose();grid.material.dispose();renderer.dispose();}
 };
}
