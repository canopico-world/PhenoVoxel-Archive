import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SoftwareRenderer,rasterTriangle} from './software-renderer.js';
import {createCompatibleRenderer} from './renderer-init.js';

function frame(){return {width:8,height:8,pixels:new Uint8ClampedArray(8*8*4),depth:new Float32Array(64).fill(Infinity)};}
const vertices=[{x:0,y:0,z:0,w:1,u:0,v:0,r:1,g:1,b:1},{x:0,y:8,z:0,w:1,u:0,v:1,r:1,g:1,b:1},{x:8,y:0,z:0,w:1,u:1,v:0,r:1,g:1,b:1}];

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
