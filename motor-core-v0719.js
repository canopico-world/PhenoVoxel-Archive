export const CONDITIONS=['FrontToBack','BackToFront','FullRotation'];
export const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
export function conditionIndex(value){const i=CONDITIONS.indexOf(value);if(i<0)throw Error('Unsupported stimulus condition');return i;}
export function curve(data,condition,fly='mean'){
 const ci=conditionIndex(condition);if(fly==='mean')return data.mean[ci];
 const fi=data.flies.indexOf(Number(fly));if(fi<0)throw Error('Unknown recorded fly');return data.traces[fi][ci];
}
export function modelCurve(data,condition,fly='mean',model='condition'){
 if(!['condition','additive'].includes(model))throw Error('Unsupported prediction model');
 const ci=conditionIndex(condition),excluded=fly==='mean'?-1:data.flies.indexOf(Number(fly));
 if(fly!=='mean'&&excluded<0)throw Error('Unknown held-out fly');
 const train=data.traces.filter((_,i)=>i!==excluded);
 if(model==='additive'&&ci!==2)return null;
 return Array.from({length:data.sampleCount},(_,t)=>mean(train.map(f=>model==='additive'?f[0][t]+f[1][t]:f[ci][t])));
}
export function sampleAt(data,values,time){
 if(!Number.isFinite(time)||time<data.timeStart||time>=data.timeStart+data.sampleCount/data.sampleHz)return null;
 return values[Math.min(values.length-1,Math.max(0,Math.floor((time-data.timeStart)*data.sampleHz)))];
}
export function validateSkeleton(n){
 const ids=new Set(n.nodes.map(x=>x[0]));
 if(ids.size!==n.nodes.length||n.nodes.some(x=>x.length!==5||x.some(v=>!Number.isFinite(v))||(x[1]!==-1&&!ids.has(x[1]))))throw Error('Invalid source skeleton');
 return n;
}
export function sourceEdges(data,path){
 return path.ids.slice(0,-1).map((id,i)=>({pre:String(id),post:String(path.ids[i+1]),synapses:path.weights[i],kind:'reconstructed chemical connection',functionalSign:null}));
}
export function percentile(a,q){if(!a.length)return null;const s=[...a].sort((a,b)=>a-b),p=(s.length-1)*q,i=Math.floor(p);return s[i]+(s[Math.min(i+1,s.length-1)]-s[i])*(p-i);}
export function timingSummary(samples){
 const valid=samples.filter(x=>Number.isFinite(x)&&x>0);
 return {frames:valid.length,medianMs:percentile(valid,.5),p95Ms:percentile(valid,.95),intervalsOver50ms:valid.filter(x=>x>50).length,measuredTemperature:null,thermalThrottlingEstablished:false};
}
export function exportStudy(data,state){
 const ci=conditionIndex(state.condition),fi=data.flies.indexOf(Number(state.fly));
 return {version:'0.7.19',type:'secondary behavioral analysis',paper:data.paper,sourceSha256:data.source.sha256,condition:state.condition,fly:state.fly,model:state.model,units:'degrees/s',timeStart:data.timeStart,sampleHz:data.sampleHz,observed:curve(data,state.condition,state.fly),prediction:modelCurve(data,state.condition,state.fly,state.model),scalarObserved:fi<0?mean(data.scalarResponses.map(x=>x[ci])):data.scalarResponses[fi][ci],confidenceInterval95ForMean:fi<0?data.meanCI95[ci]:null,trainingFlyIds:data.flies.filter(x=>fi<0||x!==Number(state.fly)),hypothesis:state.model==='additive'?'Sum of unilateral responses predicts full-field response':'Across-training-fly condition mean',neuralSimulation:false,subjectiveVision:false,method:data.method,bootstrap:data.bootstrap};
}
