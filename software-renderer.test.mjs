import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SoftwareRenderer,rasterTriangle} from './software-renderer.js';
import {createCompatibleRenderer} from './renderer-init.js';

function frame(){return {width:8,height:8,pixels:new Uint8ClampedArray(8*8*4),depth:new Float32Array(64).fill(Infinity)};}
test('compatibility rendering retains distinct per-instance pigments without changing their source arrays',()=>{
 const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}},canvas={width:0,height:0,getContext:()=>context},renderer=new SoftwareRenderer({canvas});renderer.setSize(64,64);
 const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(.8,.8),new THREE.MeshStandardMaterial({color:'white',side:THREE.DoubleSide}),2);mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(-.5,0,0));mesh.setMatrixAt(1,new THREE.Matrix4().makeTranslation(.5,0,0));mesh.setColorAt(0,new THREE.Color('red'));mesh.setColorAt(1,new THREE.Color('green'));const colors=mesh.instanceColor.array.slice(),positions=mesh.geometry.attributes.position.array.slice(),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.z=4;scene.add(mesh);renderer.render(scene,camera);
 let red=0,green=0;const a=renderer.frame.pixels;for(let i=0;i<a.length;i+=4)if(a[i+3]){if(a[i]>a[i+1]*2&&a[i]>a[i+2]*2)red++;if(a[i+1]>a[i]*2&&a[i+1]>a[i+2]*2)green++;}assert.ok(red>20);assert.ok(green>20);assert.deepEqual(mesh.instanceColor.array,colors);assert.deepEqual(mesh.geometry.attributes.position.array,positions);
});
const vertices=[{x:0,y:0,z:0,w:1,u:0,v:0,r:1,g:1,b:1},{x:0,y:8,z:0,w:1,u:0,v:1,r:1,g:1,b:1},{x:8,y:0,z:0,w:1,u:1,v:0,r:1,g:1,b:1}];

test('local beluga occlusion attenuates indirect light while retaining direct illumination and legacy surfaces',()=>{
 const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}},renderer=new SoftwareRenderer({canvas:{getContext:()=>context}});renderer.setSize(24,24);
 const material=new THREE.MeshPhysicalMaterial({color:'white',roughness:.8});material.userData={compatibilitySurfaceDetail:true,compatibilityBelugaOptics:true};material.aoMapIntensity=1;
 const ao=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat);ao.needsUpdate=true;material.aoMap=ao;
 const scene=new THREE.Scene(),mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=3;scene.add(mesh);
 const light=new THREE.DirectionalLight('white',0);light.position.z=3;scene.add(light);
 const sample=()=>{renderer.render(scene,camera);return renderer.frame.pixels[(12*24+12)*4];};const unoccluded=sample();ao.image.data.fill(0);ao.image.data[3]=255;ao.needsUpdate=true;const occluded=sample();assert(occluded<unoccluded-20);
 light.intensity=2.7;assert(sample()>unoccluded+40,'local ambient occlusion incorrectly removed direct light');delete material.userData.compatibilityBelugaOptics;const legacy=sample();ao.image.data.fill(255);ao.needsUpdate=true;assert.equal(sample(),legacy,'legacy surface acquired beluga occlusion');
});

test('beluga shadows follow a posed off-camera occluder and remain opt-in for other specimens',()=>{
 const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}},renderer=new SoftwareRenderer({canvas:{getContext:()=>context}});renderer.setSize(64,64);
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);root.userData.compatibilityBelugaShadows=true;
 const mat=new THREE.MeshStandardMaterial({color:'white',side:THREE.DoubleSide});mat.userData={compatibilitySurfaceDetail:true,compatibilityBelugaOptics:true};
 const receiver=new THREE.Mesh(new THREE.PlaneGeometry(4,4),mat);receiver.castShadow=true;root.add(receiver);
 const occluder=new THREE.Mesh(new THREE.BoxGeometry(.8,.8,.4),mat);occluder.castShadow=true;occluder.position.set(1.5,0,2);root.add(occluder);
 const source=receiver.geometry.attributes.position.array.slice(),light=new THREE.DirectionalLight('white',2.7);light.position.set(3,0,4);scene.add(light);
 const camera=new THREE.OrthographicCamera(-.8,.8,.8,-.8,.1,20);camera.position.z=6;camera.lookAt(0,0,0);
 const center=()=>renderer.frame.pixels[(Math.floor(renderer.frame.height/2)*renderer.frame.width+Math.floor(renderer.frame.width/2))*4];
 renderer.render(scene,camera);const shaded=center();occluder.position.x=4;renderer.render(scene,camera);assert(center()>shaded+15,'receiver failed to lose its cast shadow');assert.deepEqual(receiver.geometry.attributes.position.array,source);
 delete root.userData.compatibilityBelugaShadows;renderer.render(scene,camera);const original=renderer.frame.pixels.slice();assert.equal(renderer.frame.width,64);occluder.position.x=1.5;renderer.render(scene,camera);assert.deepEqual(renderer.frame.pixels,original,'non-opted specimens acquired beluga shadows');
});

test('compatibility triangles retain texture pigment, transparency and depth ordering',()=>{
 const f=frame(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 rasterTriangle(f,vertices,material,{width:1,height:1,data:new Uint8Array([255,0,0,255])});
 assert.ok(f.pixels[0]>150);assert.equal(f.pixels[1],0);assert.equal(f.pixels[3],255);
 rasterTriangle(f,vertices.map(v=>({...v,z:.5})),material,{width:1,height:1,data:new Uint8Array([0,255,0,255])});
 assert.equal(f.pixels[1],0,'farther triangle must not replace the nearest surface');
 const empty=frame();material.alphaTest=.5;
 rasterTriangle(empty,vertices,material,{width:1,height:1,data:new Uint8Array([255,0,0,0])});
 assert.equal(empty.pixels[3],0,'transparent source pixels must remain transparent');
});

test('compatibility rendering interpolates RGBA vertex opacity and preserves RGB-only legacy surfaces',()=>{
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,opacity:.8,transparent:true,depthWrite:false});
 const f=frame();rasterTriangle(f,vertices.map((v,i)=>({...v,a:[.25,.5,.75][i]})),material,null);
 assert.equal(f.pixels[3],61,'perspective-interpolated vertex alpha must multiply material opacity');
 const legacy=frame();rasterTriangle(legacy,vertices,material,null);assert.equal(legacy.pixels[3],204);
 const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}},renderer=new SoftwareRenderer({canvas:{getContext:()=>context}});renderer.setSize(32,32);
 const geometry=new THREE.PlaneGeometry(1,1),rgba=new Float32Array(16);for(let i=0;i<4;i++)rgba.set([1,1,1,.25],i*4);geometry.setAttribute('color',new THREE.BufferAttribute(rgba,4));
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'white',vertexColors:true,side:THREE.DoubleSide,transparent:true,depthWrite:false})),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.z=4;scene.add(mesh);renderer.render(scene,camera);
 assert(renderer.frame.pixels.some((v,i)=>i%4===3&&v===64));assert.deepEqual(geometry.attributes.color.array,rgba);
});

test('initialization retries a lighter GPU profile then selects canvas without browser flag changes',()=>{
 const attempts=[];const replacement={};let replaced;
 const canvas={cloneNode:()=>replacement,replaceWith:n=>replaced=n};
 class FailedGPU{constructor(opts){attempts.push(opts);throw new Error('disabled');}}
 class Canvas{constructor({canvas}){this.domElement=canvas;}}
 const result=createCompatibleRenderer(canvas,{WebGLRenderer:FailedGPU,CanvasRenderer:Canvas});
 assert.equal(attempts.length,2);assert.equal(attempts[1].antialias,false);assert.equal(replaced,replacement);assert.equal(result.backend,'software');
 class GPU{constructor(opts){this.domElement=opts.canvas;}}
 assert.equal(createCompatibleRenderer(canvas,{WebGLRenderer:GPU,CanvasRenderer:Canvas}).backend,'webgl2');
});

test('software scene rendering follows actual skin joints and instances without modifying source vertices',()=>{
 const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}};
 const canvas={width:0,height:0,getContext:()=>context};const renderer=new SoftwareRenderer({canvas});renderer.setSize(64,64);
 const geometry=new THREE.PlaneGeometry(1,1);const original=geometry.attributes.position.array.slice();
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(new Uint16Array(16),4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(Array.from({length:16},(_,i)=>i%4===0?1:0),4));
 const bone=new THREE.Bone(),mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial({color:'red',side:THREE.DoubleSide}));mesh.add(bone);mesh.bind(new THREE.Skeleton([bone]));
 const scene=new THREE.Scene();scene.add(mesh);scene.add(new THREE.DirectionalLight('white',2));
 const camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.z=4;
 renderer.render(scene,camera);const first=renderer.frame.pixels.slice();assert.ok(first.some((v,i)=>i%4===3&&v));
 bone.position.x=.6;renderer.render(scene,camera);assert.notDeepEqual(renderer.frame.pixels,first);assert.deepEqual(geometry.attributes.position.array,original);
 const instance=new THREE.InstancedMesh(new THREE.PlaneGeometry(.3,.3),new THREE.MeshStandardMaterial({side:THREE.DoubleSide}),2);instance.setMatrixAt(0,new THREE.Matrix4().makeTranslation(-.6,0,0));instance.setMatrixAt(1,new THREE.Matrix4().makeTranslation(.6,0,0));
 scene.remove(mesh);scene.add(instance);renderer.render(scene,camera);assert.equal(renderer.info.render.triangles,4);
});
