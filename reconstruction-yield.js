// Let the loading message paint, but do not depend indefinitely on a frame
// callback: hidden/background documents may stop receiving animation frames.
export function yieldForReconstruction({requestFrame=globalThis.requestAnimationFrame,cancelFrame=globalThis.cancelAnimationFrame,schedule=globalThis.setTimeout,cancelTimer=globalThis.clearTimeout}={}){
 return new Promise(resolve=>{let settled=false,frameId,paintTimer,deadline;const finish=()=>{if(settled)return;settled=true;if(frameId!==undefined)cancelFrame(frameId);if(paintTimer!==undefined)cancelTimer(paintTimer);cancelTimer(deadline);resolve();};deadline=schedule(finish,120);frameId=requestFrame(()=>{paintTimer=schedule(finish,0);});});
}
