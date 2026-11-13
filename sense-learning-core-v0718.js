// MIT. Educational interpolation of frozen evidence, not a neural or behavioral model.
export const SPECIES_IDS = ['drosophila-melanogaster','apis-mellifera','amphiprion-ocellaris'];
export const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
export const formatValue = v=>v===0?'0':Math.abs(v)<.001?v.toExponential(1):v.toFixed(3);
export function sampleCurve(wavelengths, values, nm, domain){
 if(!Number.isFinite(nm)||nm<domain[0]||nm>domain[1])return null;
 const i=Math.floor(nm-wavelengths[0]), t=nm-wavelengths[0]-i;
 if(i<0||i>=values.length)return null;
 return values[i]+(t?(values[i+1]-values[i])*t:0);
}
export function responses(data,id,nm){
 const s=data.species.find(s=>s.id===id);if(!s)throw Error('Unsupported species');
 return data.curves[s.curveKey].map(c=>sampleCurve(data.curves.wavelengths,c,nm,s.domain));
}
export function phaseAt(fraction){return Math.min(3,Math.floor(clamp(fraction,0,1)*4));}
export function observation(data,fish,color){return data.observations.find(r=>r.fish===fish&&r.color===color)||null;}
export function runRecord(data,state){
 return {exhibitVersion:data.version,species:state.id,wavelengthNm:state.nm,
  values:responses(data,state.id,state.nm),meaning:data.species.find(s=>s.id===state.id).measure,
  mode:'Educational single-wavelength curve lookup; source normalization retained',
  sourceHashes:data.sourceHashes,references:data.references,dataTerms:data.terms,subjectivePerception:false,neuralPrediction:false,
  behaviorPrediction:false,confidenceInterval:null};
}
