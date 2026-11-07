// Playback metadata only. Existing skeleton, morphs and trajectories are retained.
export function updateBirdTimeline(m,action,time){
 const r=m.birdRevision,finite=r.eagle?['fly','bank'].includes(action):r.sourcePenguin&&['walk','swim'].includes(action);
 if(!finite){if(action!=='look'){m.movementStudy=undefined;delete m.root.userData.movementStudy;}return;}
 const t=Math.max(0,Math.min(8,Number.isFinite(time)?time:0));let stage=r.current.stage;
 if(r.eagle&&action==='bank')stage=t===0?'Level glide':t<4?'First shallow bank':t<8?'Opposite shallow bank and return':'Level glide | end';
 if(r.sourcePenguin&&action==='walk'){
  const steps=[[.6,1.3],[1.6,2.3],[2.6,3.3],[3.6,4.3]],active=steps.findIndex(([start,end])=>t>=start&&t<end);
  stage=active>=0?'Step '+(active+1)+' | recovery foot lifted':t<.6?'Initial double support':t<4.3?'Between steps | double support':'Final double support';
 }
 if(t>=8&&!stage.endsWith('| end'))stage+=' | end';
 m.movementStudy={duration:8,time:t,complete:t>=8,stage};
 r.current={...r.current,...m.movementStudy};
 m.root.userData.movementStudy={...m.movementStudy,finite:true,measured:false};
}
