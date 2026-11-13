import {SPECIES_IDS,clamp,formatValue,responses,phaseAt,runRecord,observation} from './sense-learning-core-v0718.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#c6a8f5','#85c8ff','#8de6b4','#efce82'];
const state={id:'drosophila-melanogaster',nm:350,step:0,progress:0,playing:false,choice:null,revealed:false,mode:'explore',record:0,sequenceType:'protein'};
let data, raf=0, last=0;
const species=()=>data.species.find(s=>s.id===state.id);
const sourceLink=key=>data.references[key];
function svgStage(){
 const fish=state.id==='amphiprion-ocellaris';
 const facets=Array.from({length:7},(_,i)=>{const y=66+i*24,x=225+Math.abs(i-3)*8;return `<path d="M${x} ${y} q-25 11 0 22 l100 ${-9-i*2} v-6 Z" fill="url(#tissue)" stroke="#638781" stroke-width="1"/><path d="M${x+24} ${y+10} L338 ${132+(i-3)*8}" stroke="#a9c8ab" opacity=".4"/>`;}).join('');
 $('#optical-stage').innerHTML=`<svg viewBox="0 0 600 290" role="img" aria-label="${fish?'Schematic fish eye: one lens directs light toward the retina':'Schematic compound eye: multiple optical units contain photoreceptors'}. Dashed downstream connection is not modeled."><defs><radialGradient id="tissue"><stop stop-color="#8bada0" stop-opacity=".6"/><stop offset="1" stop-color="#163d43"/></radialGradient><radialGradient id="lens"><stop stop-color="#a4e9dd" stop-opacity=".65"/><stop offset="1" stop-color="#548b9d" stop-opacity=".1"/></radialGradient><linearGradient id="beam"><stop stop-color="#c6a8f5" stop-opacity=".1"/><stop offset="1" stop-color="#c6a8f5" stop-opacity=".75"/></linearGradient></defs>
 <circle cx="291" cy="145" r="122" fill="none" stroke="#345159" stroke-dasharray="2 7"/><circle cx="291" cy="145" r="105" fill="none" stroke="#29434c"/>
 <path d="M60 145 L240 106 L240 185 Z" fill="url(#beam)" opacity=".25"/><path id="beam-line" d="M55 145 H341" stroke="#c6a8f5" stroke-width="2" stroke-dasharray="5 7"/><circle cx="55" cy="145" r="15" fill="#263c50" stroke="#c6a8f5"/><circle cx="55" cy="145" r="5" fill="#d2b9ef"/>
 ${fish?'<path d="M225 75 C335 12 405 70 405 145 C405 225 323 263 225 210 Q185 145 225 75Z" fill="url(#tissue)" stroke="#719b97" stroke-width="2"/><path d="M338 62 Q440 145 338 230" fill="none" stroke="#dbaeb8" stroke-width="12" opacity=".55"/><ellipse cx="240" cy="145" rx="25" ry="52" fill="url(#lens)" stroke="#94d4d4"/><path d="M245 105 L365 145 L245 185" fill="none" stroke="#bba7f1" opacity=".65"/>':facets}
 <g id="receptor-glow">${[0,1,2].map((_,i)=>`<rect x="${fish?363:336}" y="${115+i*22}" width="15" height="18" rx="7" fill="${colors[i]}" opacity=".7"/>`).join('')}</g>
 <path d="M${fish?389:359} 145 H535" fill="none" stroke="#637d86" stroke-width="2" stroke-dasharray="4 7"/>
 <circle cx="535" cy="145" r="26" fill="#112b36" stroke="#718a95" stroke-dasharray="3 5"/><text x="535" y="153" text-anchor="middle" class="big-label">?</text>
 <circle id="light-packet" cx="55" cy="145" r="6" fill="#eee1ff" stroke="#c6a8f5" stroke-width="5"/>
 <text x="55" y="195" text-anchor="middle">Light</text><text x="282" y="274" text-anchor="middle">${fish?'Lens + retina':'Compound-eye units'}</text><text x="500" y="200" text-anchor="middle">Downstream gap</text><text x="500" y="219" text-anchor="middle">No neural prediction</text></svg>`;
}
function curveChart(){
 const s=species(),[lo,hi]=s.domain, cs=data.curves[s.curveKey], max=Math.max(...cs.flat());
 const paths=cs.map((c,j)=>`<path d="${data.curves.wavelengths.flatMap((nm,i)=>nm<lo||nm>hi?[]:[`${nm===lo?'M':'L'}${50+600*(nm-lo)/(hi-lo)} ${220-180*c[i]/max}`]).join(' ')}" stroke="${colors[j]}" stroke-width="2" fill="none"/><text x="${60+j*145}" y="24" fill="${colors[j]}" style="fill:${colors[j]}">${esc(s.channels[j])}</text>`).join('');
 $('#curve-chart').innerHTML=`<svg viewBox="0 0 700 270" role="img" aria-label="${esc(s.measure)} across ${lo} to ${hi} nanometers. Use the wavelength slider to inspect numerical values."><path d="M50 45 V220 H650" fill="none" stroke="#526c76"/><path d="M50 130 H650 M50 40 H650" stroke="#28434c"/>${paths}<path id="cursor-line" stroke="#edf5ef" stroke-dasharray="3 4"/><text x="15" y="223">0</text><text x="8" y="45">${max.toPrecision(2)}</text><text x="50" y="250">${lo} nm</text><text x="604" y="250">${hi} nm</text></svg>`;
}
function setLight(nm){
 const s=species();state.nm=clamp(Math.round(nm),...s.domain);$('#wavelength').value=state.nm;
 $('#wavelength-value').textContent=state.nm;$('#light-label').textContent=state.nm<400?'UV · color key':state.nm<495?'short wavelength':state.nm<580?'middle wavelength':'long wavelength';
 const vs=responses(data,state.id,state.nm),max=Math.max(...data.curves[s.curveKey].flat());
 $('#meters').innerHTML=vs.map((v,i)=>`<div class="meter"><span>${esc(s.channels[i])}</span><div class="meter-track"><div class="meter-fill" style="--channel:${colors[i]};width:${100*clamp(v/max,0,1)}%"></div></div><output>${formatValue(v)}</output></div>`).join('');
 const x=50+600*(state.nm-s.domain[0])/(s.domain[1]-s.domain[0]);$('#cursor-line')?.setAttribute('d',`M${x} 40 V220`);
 $$('.presets button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.nm===state.nm)));
 $('#wavelength').setAttribute('aria-valuetext',`${state.nm} nanometers; ${s.channels.map((n,i)=>n+' '+formatValue(vs[i])).join(', ')}`);
 const col=state.nm<400?colors[0]:state.nm<495?colors[1]:state.nm<580?colors[2]:colors[3];
 $('#light-packet').setAttribute('stroke',col);$('#beam-line').setAttribute('stroke',col);
}
function stop(){state.playing=false;cancelAnimationFrame(raf);$('#play').textContent=state.progress>=1?'↻ Replay signal':'▶ Follow the signal';}
function setProgress(value){
 state.progress=clamp(value,0,1);$('#timeline').value=Math.round(state.progress*100);$('#time-label').textContent=Math.round(state.progress*100)+'%';
 // Photons stop at the receptor. No light particle is drawn travelling along a nerve.
 const end=state.id==='amphiprion-ocellaris'?368:341;
 $('#light-packet').setAttribute('cx',55+(end-55)*Math.min(state.progress/.5,1));
 $('#light-packet').setAttribute('opacity',state.progress>.5?Math.max(.15,1-(state.progress-.5)*3):1);
 $('#receptor-glow').setAttribute('opacity',state.progress>=.4?1:.35);
}
function tick(time){
 if(!state.playing)return;const dt=last?Math.min(time-last,100):0;last=time;setProgress(state.progress+dt/6000);
 const p=phaseAt(state.progress);if(p!==state.step)setStep(p,false);
 if(state.progress>=1){stop();return;}raf=requestAnimationFrame(tick);
}
function setStep(n,pause=true){
 if(pause)stop();state.step=n;
 $$('.pathway button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.step===n)));
 const s=species(),fly=state.id==='drosophila-melanogaster',fish=state.id==='amphiprion-ocellaris';
 const copy=[
  ['01 · THE STIMULUS','Light carries information.','Move the slider to choose one wavelength—a small part of a spectrum. The bars show values looked up from published curves. A real object sends many wavelengths at once.','ILLUSTRATED','illustrated','A screen color is only a label. No UV light is measured or reproduced by this exhibit.',s.curveRef],
  ['02 · THE SENSORY ORGAN',fish?'The lens changes what reaches the retina.':'An eye is more than a light sensor.',fish?'The published fish model combines cone pigment templates with measured average lens transmission. Some light is filtered before reaching the receptors.':fly?'Screening and filtering pigments change the light reaching receptors. The curves here come from experiments isolating Rh3, Rh4 and Rh5 contributions.':'Different photoreceptors respond differently across the spectrum. Here we inspect UV, blue and green reference curves, not a complete model of every eye unit.','SOURCE-LINKED','measured',fish?'Lens samples and behavioral fish are not matched individuals.':fly?'Engineered rescue assays are not the full normal fly eye.':'Eye geometry, adaptation and neural processing are not modeled.',s.curveRef],
  ['03 · THE SIGNAL','A response is not yet a perception.',fly?'An electroretinogram (ERG) records an electrical response from the eye. This display uses normalized published mean curves, not a recording from a living fly on your screen.':'Light-sensitive cells can generate signals. The bars here are sensitivity values, not neural firing rates or messages decoded from a brain.','UNRESOLVED','unknown','The dashed pathway marks a missing model. No circuit is calculating a decision from these bars.',s.curveRef],
  ['04 · THE OBSERVABLE RESPONSE',fish?'Ask the fish through an experiment.':'What would the animal do?',fish?'Scientists trained fish to distinguish a colored target from grey distractors. Explore recorded choices below, or inspect the original methods at the research desk.':'Detecting light does not tell us whether the animal will approach, turn or ignore it. This exhibit has no matched behavioral trials for these wavelength settings.',fish?'MEASURED IN SOURCE':'UNRESOLVED',fish?'measured':'unknown',fish?'The recorded choice trials are separate from this slider. Pooling trials does not establish a causal UV effect.':'We keep the missing link visible instead of animating an invented decision.',fish?'fishBehavior':s.curveRef],
  ['05 · THE MOLECULAR EVIDENCE','Where do the sensors come from?','Genes contain instructions for proteins. Opsin proteins work with a light-absorbing molecule in sensory cells. Inspect a deposited sequence below, then follow its evidence to the tissue.','REFERENCE RECORD','measured','A sequence is not a measurement of protein amount, eye function or behavior. Changing a record does not change the response curves.',fish?'fishExpression':fly?'flyERG':'beeProtein']
 ][n];
 $('#step-label').textContent=copy[0];$('#step-title').textContent=copy[1];$('#step-text').textContent=copy[2];$('#step-badge').textContent=copy[3];$('#step-badge').className='badge '+copy[4];$('#step-limit').textContent=copy[5];$('#step-source').href=sourceLink(copy[6]).url;$('#molecule-panel').hidden=n!==4;
}
function molecule(){
 const r=species().molecules[state.record],protein=r.protein||'';$('#molecule-description').textContent=`${r.gene} · ${r.sourceMolecule} reference · ${r.accession}. ${r.translationCheck}`;
 $('#sequence-position').max=Math.max(0,protein.length-60);$('#sequence-position').value=0;
 $('#molecule-source').href=r.url;state.sequenceType='protein';$('#coding-view').disabled=!r.codingSequence;sequence();
}
function sequence(){
 const r=species().molecules[state.record],protein=r.protein||'',i=+$('#sequence-position').value;
 const coding=state.sequenceType==='coding'&&r.codingSequence;
 $('#protein-view').setAttribute('aria-pressed',String(!coding));$('#coding-view').setAttribute('aria-pressed',String(!!coding));
 $('#sequence').textContent=coding?r.codingSequence.slice(i*3,(i+60)*3).match(/.{1,3}/g)?.join(' '):protein.slice(i,i+60).match(/.{1,10}/g)?.join(' ')||'Protein sequence unavailable';
 $('#sequence-note').textContent=coding?`Coding bases ${i*3+1}–${Math.min((i+60)*3,r.codingSequence.length)}, grouped in triplets corresponding to amino acids ${i+1}–${Math.min(i+60,protein.length)}. Spliced reference CDS in the deposited ATCG alphabet; not a newly sequenced animal. No mutation effects are predicted.`:`Amino acids ${i+1}–${Math.min(i+60,protein.length)} of ${protein.length}. Letters represent amino acids, not ATCG. ${r.codingSequence?'The deposited coding sequence is available in the full atlas.':'No nucleotide sequence is imported for this fly record.'} No 3D protein structure or functional mutation prediction is implied.`;
}
function predictionReset(){state.choice=null;state.revealed=false;$('#challenge-result').hidden=true;$('#reveal').disabled=true;$$('[data-choice]').forEach(b=>b.setAttribute('aria-pressed','false'));}
function reveal(){
 const s=species(),a=responses(data,state.id,350)[0],b=responses(data,state.id,500)[0],winner=a>b?'350':'500';
 state.revealed=true;$('#challenge-result').hidden=false;
 $('#challenge-result').innerHTML=`<span class="badge predicted">CALCULATED FROM SOURCE CURVES</span><h3>${state.choice==='unsure'?'Now compare the evidence.':state.choice===winner?'Your prediction agrees with this curve.':'This curve points the other way.'}</h3><div class="comparison"><div><b>${formatValue(a)}</b><span>${esc(s.channels[0])} at 350 nm</span></div><div><b>${formatValue(b)}</b><span>${esc(s.channels[0])} at 500 nm</span></div></div><p><strong>${winner} nm gives the larger value</strong> in this source curve. We hold the curve’s normalization fixed. This is not a comparison of how bright two lights feel or proof that the animal prefers one.</p><a href="${esc(sourceLink(s.curveRef).url)}" target="_blank" rel="noopener">Inspect the supporting study ↗</a>`;
}
function fishOptions(){
 const fish=$('#fish').value;const rows=data.observations.filter(r=>r.fish===fish);
 $('#target-color').innerHTML=rows.map(r=>`<option value="${esc(r.color)}">${esc(r.color)}</option>`).join('');$('#observation-result').hidden=true;
}
function showObservation(){
 const r=observation(data,$('#fish').value,$('#target-color').value);if(!r)return;
 $('#observation-result').hidden=false;$('#observation-result').innerHTML=`<span class="badge measured">RECORDED CHOICES · SECONDARY SUMMARY</span><h3>Fish ${esc(r.fish)} · ${esc(r.color)}</h3><p><strong>${r.successes} successful trials out of ${r.n}</strong> (${(100*r.successes/r.n).toFixed(1)}%). Other outcomes: ${r.n-r.successes}.</p><div class="trial-bar" aria-hidden="true"><span style="width:${100*r.successes/r.n}%"></span></div><p class="micro">Published condition: ${esc(r.condition)}. Biological contrast range: ${r.minJnd.toFixed(2)}–${r.maxJnd.toFixed(2)} JND. Different difficulty levels are combined; this is not a threshold estimate or a success rate for all clownfish.</p>`;
}
function research(){
 const s=species();$('#research-method').textContent=`At ${s.domain[0]}–${s.domain[1]} nm, the exhibit linearly interpolates the existing 1 nm ${s.measure.toLowerCase()} curves at your selected wavelength. It retains source scaling and does not fit parameters, integrate a scene spectrum, apply adaptation or predict neuronal firing. Bar widths use a shared maximum within this species’ curve set. No absolute photon flux or response amplitude is calibrated.`;
 $('#evidence-cards').innerHTML=s.chain.map(e=>`<article class="research-card"><span class="eyebrow">${esc(e.label)}</span><h3>${esc(e.title)}</h3><p><strong>${esc(e.evidence)}</strong></p><p>${esc(e.text)}</p><p class="gap">Unresolved: ${esc(e.gap)}</p>${e.refs.map(k=>`<a href="${esc(sourceLink(k).url)}" target="_blank" rel="noopener">${esc(sourceLink(k).title)} ↗</a>`).join('<br>')}</article>`).join('');
 $('#atlas-link').href=`./research/sensory-benchmark-v1/index.html#${state.id}`;curveChart();
}
function selectSpecies(id,updateHash=true){
 if(!SPECIES_IDS.includes(id))id='drosophila-melanogaster';stop();state.id=id;state.record=0;
 if(updateHash)history.replaceState(null,'','#'+id);
 const s=species();$$('[data-species]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.species===id)));
 $('#species-name').textContent=s.name+' / '+s.scientific;$('#question').textContent=id==='amphiprion-ocellaris'?'From light to a fish’s choice.':id==='apis-mellifera'?'A spectrum beyond our own.':'What changes inside a fly’s eye?';
 $('#wavelength').min=s.domain[0];$('#wavelength').max=s.domain[1];$('#range-min').textContent=s.domain[0]+' nm';$('#range-max').textContent=s.domain[1]+' nm';
 $('#meter-title').textContent=state.mode==='research'?s.measure:'Eye response profile';$('#curve-note').textContent=id==='drosophila-melanogaster'?'Longer bars mean larger curve values. Rh3/Rh4/Rh5 only: normalized mean electrical-response proxies from rescue flies; not full fly vision.':id==='apis-mellifera'?'Longer bars mean higher reference sensitivity. Bars are not firing rates, probabilities or perceived colors.':'Longer bars mean larger model values. Pigment templates × mean transmission of three lenses; not measured neural responses.';
 $('#back').href='./#'+id;$('#sensory-link').href='./#'+id;
 $('#challenge-question').textContent=`Which light gives a larger ${s.channels[0]} value?`;
 $('#challenge-description').textContent=`Compare 350 nm and 500 nm in the ${s.name.toLowerCase()} curve. Predict first, then reveal the numerical evidence. “Larger” means a curve value—not a preference or perceived brightness.`;
 predictionReset();$('#behavior').hidden=id!=='amphiprion-ocellaris';$('#observation-result').hidden=true;
 $('#molecule').innerHTML=s.molecules.map((r,i)=>`<option value="${i}">${esc(r.accession)} · ${esc(r.gene.length>60?r.gene.slice(0,60)+'…':r.gene)}</option>`).join('');
 svgStage();research();setLight(350);setProgress(0);setStep(0);molecule();
}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function mode(value){state.mode=value;$('#meter-title').textContent=value==='research'?species().measure:'Eye response profile';$('#explore-content').hidden=value!=='explore';$('#research-content').hidden=value!=='research';$('#explore-mode').setAttribute('aria-pressed',String(value==='explore'));$('#research-mode').setAttribute('aria-pressed',String(value==='research'));$(value==='research'?'#research-content':'#experiment').scrollIntoView({block:'start',behavior:'instant'});}
async function init(){
 const response=await fetch('./sense-learning-data-v0718.json');if(!response.ok)throw Error('Evidence data could not be loaded');data=await response.json();
 if(data.version!=='0.7.18'||data.species.length!==3)throw Error('Evidence version mismatch');
 $('#fish').innerHTML=[...new Set(data.observations.map(r=>r.fish))].map(id=>`<option>${esc(id)}</option>`).join('');fishOptions();
 $('#credits').innerHTML=Object.values(data.references).map(r=>`<p><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a></p>`).join('')+Object.values(data.terms).map(t=>`<p>${esc(t)}</p>`).join('');
 $$('[data-species]').forEach(b=>b.onclick=()=>selectSpecies(b.dataset.species));
 $('#wavelength').oninput=e=>setLight(+e.target.value);$$('[data-nm]').forEach(b=>b.onclick=()=>setLight(+b.dataset.nm));
 $$('.pathway button').forEach(b=>b.onclick=()=>{setProgress(Math.min(+b.dataset.step/3,1));setStep(+b.dataset.step);});
 $('#play').onclick=()=>{if(state.playing){stop();return;}if(state.progress>=1)setProgress(0);state.playing=true;last=0;$('#play').textContent='Ⅱ Pause';raf=requestAnimationFrame(tick);};
 $('#reset').onclick=()=>{stop();setProgress(0);setStep(0);setLight(350);predictionReset();$('#observation-result').hidden=true;};
 $('#timeline').oninput=e=>{stop();setProgress(+e.target.value/100);setStep(phaseAt(state.progress));};
 $('#molecule').onchange=e=>{state.record=+e.target.value;molecule();};$('#sequence-position').oninput=sequence;
 $('#protein-view').onclick=()=>{state.sequenceType='protein';sequence();};$('#coding-view').onclick=()=>{state.sequenceType='coding';sequence();};
 $$('[data-choice]').forEach(b=>b.onclick=()=>{state.choice=b.dataset.choice;state.revealed=false;$('#challenge-result').hidden=true;$('#reveal').disabled=false;$$('[data-choice]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});$('#reveal').onclick=reveal;
 $('#fish').onchange=fishOptions;$('#target-color').onchange=()=>$('#observation-result').hidden=true;$('#show-observation').onclick=showObservation;
 $('#explore-mode').onclick=()=>mode('explore');$('#research-mode').onclick=()=>mode('research');
 $('#download-run').onclick=()=>download('phenovoxel-light-setting.json',JSON.stringify(runRecord(data,state),null,2),'application/json');
 $('#download-curves').onclick=()=>{const s=species();const csv=['wavelength_nm,'+s.channels.join(','),...data.curves.wavelengths.filter(n=>n>=s.domain[0]&&n<=s.domain[1]).map(n=>[n,...responses(data,state.id,n)].join(','))].join('\n');download(state.id+'-source-curves.csv',csv,'text/csv');};
 window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(SPECIES_IDS.includes(id)&&id!==state.id)selectSpecies(id,false);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 selectSpecies(location.hash.slice(1),false);$('#loading').hidden=true;$('#lab').hidden=false;
}
init().catch(error=>{$('#loading').textContent=error.message+'. Reload to try again, or open the original evidence atlas below.';const a=document.createElement('a');a.href='./research/sensory-benchmark-v1/index.html';a.textContent='Open evidence atlas';$('#loading').append(document.createElement('br'),a);});
