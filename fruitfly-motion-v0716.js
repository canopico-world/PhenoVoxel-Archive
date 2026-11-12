import * as T from 'three';
export function animateFruitFly(m,motion,t){
 const active=motion==='walk'||motion==='fly',flying=motion==='fly';
 const name=flying?'Flight_wingbeat_study':'Walk_source_092';
 const clip=m.gltf.animations.find(c=>c.name.includes(name));
 if(!clip)throw Error('Missing fruit fly source study: '+name);
 const duration=active?(flying?4:6.1):0,seconds=active?T.MathUtils.clamp(Number.isFinite(t)?t:0,0,duration):0;
 m.mixer.stopAllAction();
 for(const[o,p,q,s]of m.sourceStudy707.bind){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}
 const action=m.mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();m.mixer.setTime(seconds);
 if(m.sourceStudy707.home)m.content.position.copy(m.sourceStudy707.home);
 m.root.updateMatrixWorld(true);for(const mesh of m.sourceStudy707.meshes)mesh.skeleton?.update();
 const sourceSeconds=flying?seconds/436:seconds/10,cycle=flying?seconds/2:null;
 const stage=!active?'Textured exterior · first recorded walking pose':flying?`Wingbeat ${Math.min(2,Math.floor(cycle)+1)} · phase ${Math.round((cycle%1)*100)}% · source ${(sourceSeconds*1000).toFixed(2)} ms · 436× slow`:`Walking frame ${Math.min(305,Math.round(seconds*50))}/305 · source ${sourceSeconds.toFixed(3)} s · 10× slow`;
 m.current=motion;m.sourceClip=clip;m.movementStudy={duration,time:seconds,stage};
 m.root.userData.movementStudy={...m.movementStudy,complete:active&&seconds>=duration,finite:true,sourceSeconds,sourceFrequencyHz:flying?218:500,measured:false,sourceDerived:true};
 m.root.userData.sourcePlayback={clip:clip.name,displaySeconds:seconds,sourceSeconds,held:!active,measured:false,presentation:'Body-fixed retargeted kinematics; no dynamics, neural activity, or flight trajectory simulation'};
}
