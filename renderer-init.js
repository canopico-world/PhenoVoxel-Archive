import * as THREE from 'three';
import {SoftwareRenderer} from './software-renderer.js';

export function createCompatibleRenderer(canvas,{forceSoftware=false,WebGLRenderer=THREE.WebGLRenderer,CanvasRenderer=SoftwareRenderer}={}){
 const failures=[];
 if(!forceSoftware)for(const options of [{antialias:true,alpha:true,preserveDrawingBuffer:true},{antialias:false,alpha:true,preserveDrawingBuffer:false,powerPreference:'low-power'}]){
  try{const renderer=new WebGLRenderer({canvas,...options});renderer.backend='webgl2';return renderer;}catch(error){failures.push(String(error));}
 }
 // A context type cannot be changed after successful partial initialization.
 const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);
 const renderer=new CanvasRenderer({canvas:replacement});renderer.backend='software';renderer.initializationFailures=failures;return renderer;
}
