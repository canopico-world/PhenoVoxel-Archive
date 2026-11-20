import './anatomy-lab-v0728.css';
import organGroups from './anatomy-search-v0728.json' with {type:'json'};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const systems={surface:'Body surface',skeleton:'Bones and teeth',muscles:'Muscles',connective:'Ligaments and fascia',attachments:'Muscle attachments',organs:'Internal organs',arteries:'Arteries',veins:'Veins',lymphatic:'Lymphatics',cns:'Brain and spinal cord',nerves:'Peripheral nerves',senses:'Sense organs',neuron:'Single cortical neuron'};
const colors={surface:'#ad826a',skeleton:'#e4d9bc',muscles:'#bd5c50',connective:'#b8c2ac',attachments:'#ad9a60',organs:'#d3919f',arteries:'#dc6e65',veins:'#7d9ddd',lymphatic:'#85c994',cns:'#c7a4db',nerves:'#debf72',senses:'#8bc6d3',neuron:'#8fdacc'};

export function mountAnatomyLab({viewer,host,container=document.querySelector('#viewer')}){
  const section=document.createElement('section');section.id='anatomy-lab';section.className='anatomy-lab';
  section.setAttribute('aria-labelledby','anatomy-lab-title');
  section.innerHTML=`<header><div><span class="eyebrow">INSIDE LIFE / HUMAN PILOT</span><h2 id="anatomy-lab-title">Anatomy, layer by layer.</h2><p>Explore a registered adult atlas, from the skeleton to one traced cortical neuron.</p></div><button data-return>View model &#8593;</button></header>
    <p class="anatomy-status" role="status" aria-live="polite">Loading the anatomy atlas...</p>
    <div class="anatomy-presets" role="group" aria-label="Anatomy views">${Object.entries({overview:'X-ray overview',bones:'Skeleton',muscles:'Muscles',organs:'Organs',neural:'Nerves and senses',circulation:'Vessels and lymph',connective:'Connective tissue',neuron:'One neuron'}).map(([id,label])=>`<button data-anatomy-preset="${id}" aria-pressed="false">${label}</button>`).join('')}</div>
    <div class="anatomy-workspace"><div><h3>Visible systems</h3><p class="anatomy-help">Layers download when opened. Counts refer to atlas components.</p><div class="anatomy-layers"></div>
    <label class="anatomy-slider">Exterior opacity <output data-opacity-output>8%</output><input data-exterior type="range" min="0" max="1" step=".01" value=".08" aria-label="Exterior opacity"></label>
    <details class="anatomy-section"><summary>Cutaway plane</summary><label><input data-section-enable type="checkbox"> Reveal from the front</label><input data-section type="range" min="-.36" max=".36" step=".005" value="0" aria-label="Cutaway depth"><p>Uncapped inspection cut. It does not represent a tissue slice.</p></details></div>
    <div class="anatomy-search-panel"><h3>Find a structure</h3><label for="anatomy-search">Name or Latin term</label><input id="anatomy-search" type="search" placeholder="Try heart, femur, sciatic..." autocomplete="off"><label class="anatomy-region-label">Region <select data-region><option value="">Whole body</option><option value="head-neck">Head and neck</option><option value="chest">Chest</option><option value="abdomen-pelvis">Abdomen and pelvis</option><option value="left-arm">Left arm</option><option value="right-arm">Right arm</option><option value="left-leg">Left leg</option><option value="right-leg">Right leg</option></select></label><div class="anatomy-results" role="list" aria-label="Anatomical search results"></div><button data-restore>Restore hidden structures</button></div>
    <aside class="anatomy-selection" aria-label="Selected anatomy"><span class="eyebrow">SELECTED STRUCTURE</span><div data-selection><h3>Touch a structure</h3><p>Tap the model or search the atlas. Reveal a system to reach the anatomy inside.</p></div><div class="anatomy-selection-actions"><button data-focus disabled>Focus</button><button data-isolate disabled>Isolate</button><button data-hide disabled>Hide</button></div><p class="anatomy-scale" data-scale>Body coordinates in metres.</p></aside></div>
    <div class="anatomy-motion"><div><span class="eyebrow">SHARED ANATOMY / JOINT DEMONSTRATION</span><h3>Move the layers together</h3><p>Bones retain their shape. Soft tissues follow authored skin weights; muscle force, contact and tissue mechanics are uncalibrated.</p></div><div class="anatomy-motion-actions" role="group" aria-label="Anatomy movements">${Object.entries({stand:'Anatomical position',elbow:'Elbow flexion',shoulder:'Shoulder abduction',knee:'Knee flexion'}).map(([id,label])=>`<button data-anatomy-motion="${id}">${label}</button>`).join('')}</div><div class="anatomy-playback"><button data-play>Play / pause</button><label>Study time <input data-time type="range" min="0" max="8" step=".02" value="0" aria-label="Anatomy study time"></label><output data-time-output>0.00 s</output><button data-reset>Reset pose</button></div><p data-phase class="anatomy-phase">Anatomical starting position</p><div class="anatomy-phases">${[['Start',0],['Flex',1.6],['Hold',3.2],['Return',6.1],['End',8]].map(([name,time])=>`<button data-phase-time="${time}">${name}</button>`).join('')}</div></div>
    <details class="anatomy-evidence"><summary>Data, fidelity and reuse</summary><p>The body is a registered adult male reference atlas from Z-Anatomy and BodyParts3D. It is a composite educational reconstruction with surface simplification for display. It does not capture every vessel, cell, individual variation or physiological process.</p><p>Layer colors distinguish systems. Blue veins, red arteries and green lymphatics are teaching conventions. Lymphatic vessels, nodes and lymphoid organs are separate selectable source components where available.</p><p>The neuron is an independent Allen Institute specimen: 571430815, middle temporal gyrus, cortical layer 3. Its 7,641 traced SWC nodes retain micrometre dimensions; deposited radii are retained in the tube surface, with a one-pixel branch guide for low magnification. Its placement in the whole-body head is an illustrative anchor. Neural connectivity, firing and conscious experience are not simulated.</p><p>Joint movements are finite authored demonstrations using source joint pivots, with a shared skeleton for every body layer. No muscle contraction model, haemodynamics, organ motion or validation against live movement is claimed.</p><p><a href="https://github.com/Z-Anatomy/Models-of-human-anatomy" target="_blank" rel="noopener">Z-Anatomy atlas</a> / <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html" target="_blank" rel="noopener">BodyParts3D</a> / <a href="https://celltypes.brain-map.org/experiment/electrophysiology/571430815" target="_blank" rel="noopener">Allen cell record</a> / <a href="./anatomy-review-v0728.html">Methods, checks and limitations</a></p><p>Atlas derivative: CC BY-SA 4.0, with BodyParts3D CC BY-SA 2.1 Japan and component notices preserved. Kidney and inner-ear source components have noncommercial conditions. Allen neuron data uses the Allen Institute research/noncommercial terms. <a href="./anatomy-notices-v0728.txt">Read the complete notices</a>.</p></details>`;
  host.append(section);if(container.dataset.renderer==='software')section.querySelector('.anatomy-section').hidden=true;
  const shoulder=section.querySelector('[data-anatomy-motion="shoulder"]');shoulder.disabled=true;shoulder.textContent='Shoulder study - pending';shoulder.title='Visual review found excessive fascial stretching. Tissue sliding and scapular motion need correction.';
  const gated=[...section.querySelectorAll('button:not([data-return]), input, select')];gated.forEach(control=>control.disabled=true);
  let closed=false,state=null,busy=0,resultOffset=0;
  const $=selector=>section.querySelector(selector),status=$('.anatomy-status');
  const say=message=>status.textContent=message;
  async function apply(change){
    busy++;try{await viewer.setAnatomyState(change);}catch(error){if(!closed)say('Layer unavailable: '+error.message+'. Choose its checkbox to retry.');}finally{busy--;if(!closed)refresh();}
  }
  function results(){
    if(!state)return;
    const q=$('#anatomy-search').value.toLowerCase().trim(),region=$('[data-region]').value;
    const preferred=/heart|liver|femur|brain|lung|sciatic nerve|kidney|neuron/i;
    const matches=state.catalog.structures.filter(s=>(!region||s.region===region)&&(!q||[s.name,s.latin,s.side,systems[s.system],...(organGroups[s.index]||[])].join(' ').toLowerCase().includes(q)));
    const eligible=q||region?matches:matches.filter(s=>preferred.test(s.name));
    resultOffset=Math.min(resultOffset,Math.max(0,Math.floor((eligible.length-1)/14)*14));
    const rows=eligible.slice(resultOffset,resultOffset+14);
    $('.anatomy-results').innerHTML=`<p>${q||region?matches.length+' matches':'Suggested structures'} / ${eligible.length?resultOffset+1:0}-${Math.min(resultOffset+14,eligible.length)}</p>`+rows.map(s=>`<div role="listitem" class="anatomy-result"><input type="checkbox" data-structure-visible="${s.index}" ${state.hidden.includes(s.index)?'':'checked'} aria-label="Show ${escape(s.name+' '+(s.side||''))}"><button data-select="${s.index}" aria-pressed="${s.index===state.selected}"><strong>${escape(s.name)}</strong><small>${escape([s.side,systems[s.system]].filter(Boolean).join(' / '))}</small></button></div>`).join('')+(eligible.length>14?`<div class="anatomy-result-pages"><button data-result-prev ${resultOffset===0?'disabled':''}>Previous</button><button data-result-next ${resultOffset+14>=eligible.length?'disabled':''}>Next structures</button></div>`:'');
    const previous=$('[data-result-prev]'),next=$('[data-result-next]');
    if(previous)previous.onclick=()=>{resultOffset-=14;results();$('.anatomy-results').scrollTop=0;};
    if(next)next.onclick=()=>{resultOffset+=14;results();$('.anatomy-results').scrollTop=0;};
    for(const b of section.querySelectorAll('[data-select]'))b.onclick=()=>select(Number(b.dataset.select));
    for(const b of section.querySelectorAll('[data-structure-visible]'))b.onchange=()=>apply({structure:Number(b.dataset.structureVisible),visible:b.checked});
  }
  async function select(index){
    const s=state.catalog.structures.find(s=>s.index===index);
    if(!s)return;
    await apply({select:index,layer:s.system,opacity:1});
  }
  function selection(){
    const r=state.catalog.structures.find(s=>s.index===state.selected);
    for(const b of section.querySelectorAll('.anatomy-selection-actions button'))b.disabled=!r;
    if(!r){$('[data-selection]').innerHTML='<h3>Touch a structure</h3><p>Tap the model or search the atlas. Reveal a system to reach the anatomy inside.</p>';$('[data-scale]').textContent='Body coordinates in metres.';return;}
    $('[data-selection]').innerHTML=`<h3>${escape(r.name)}</h3>${r.latin?`<p><i>${escape(r.latin)}</i></p>`:''}<p>${escape([r.side,r.region?.replaceAll('-',' '),systems[r.system]].filter(Boolean).join(' / '))}</p><p>${r.system==='neuron'?escape(r.evidence):'Registered atlas surface. Source component: '+escape(r.sourceName)+'.'}</p>${r.ta2?`<small>Terminologia Anatomica 2: ${escape(r.ta2)}</small>`:''}${r.componentNotice?`<p>${escape(r.componentNotice)}</p>`:''}<p><a href="${r.sourceUrl||'https://github.com/Z-Anatomy/Models-of-human-anatomy'}" target="_blank" rel="noopener">Source record &#8599;</a></p>`;
    $('[data-scale]').textContent=r.system==='neuron'?'Microscopy: measured micrometre coordinates. One-pixel branch guides aid visibility; tube radii retain source dimensions. Separate specimen; illustrative body anchor.':'Body coordinates in metres. Display geometry is simplified from the atlas.';
  }
  function refresh(){
    if(closed)return;state=viewer.getAnatomyState?.();if(!state){if(container.dataset.model==='unavailable')say('Anatomy rendering is unavailable. Evidence and source files remain accessible.');return;}
    gated.forEach(control=>control.disabled=false);shoulder.disabled=true;
    section.dataset.ready='true';
    if(!Object.keys(state.errors).length)say(state.loading.length?'Loading '+state.loading.map(id=>systems[id]).join(', ')+'...':`${state.catalog.structures.length.toLocaleString()} components / ${state.loaded.length} of 13 layers loaded`);
    else say(Object.values(state.errors).join(' ')+' Select a layer to retry.');
    for(const b of section.querySelectorAll('[data-anatomy-preset]'))b.setAttribute('aria-pressed',String(b.dataset.anatomyPreset===state.preset));
    $('.anatomy-layers').innerHTML=state.catalog.layers.map(layer=>`<label style="--layer-color:${colors[layer.id]}"><input type="checkbox" data-layer="${layer.id}" ${state.opacities[layer.id]>0?'checked':''}><span class="anatomy-swatch"></span><span>${escape(systems[layer.id])}<small>${layer.structures} components ${state.loading.includes(layer.id)?'/ loading':state.loaded.includes(layer.id)?'/ ready':'/ '+(layer.bytes/1e6).toFixed(1)+' MB'}</small></span></label>`).join('');
    for(const b of section.querySelectorAll('[data-layer]'))b.onchange=()=>apply({layer:b.dataset.layer,opacity:b.checked?b.dataset.layer==='surface'?.08:1:0});
    $('[data-exterior]').value=String(state.opacities.surface||0);$('[data-opacity-output]').textContent=Math.round((state.opacities.surface||0)*100)+'%';
    $('[data-section-enable]').checked=state.section!==null;
    selection();results();
  }
  $('[data-return]').onclick=()=>container.scrollIntoView({block:'center',behavior:'smooth'});
  for(const b of section.querySelectorAll('[data-anatomy-preset]'))b.onclick=async()=>{await apply({preset:b.dataset.anatomyPreset});if(b.dataset.anatomyPreset==='neuron'){await viewer.focusAnatomy(viewer.getAnatomyState().selected);container.scrollIntoView({block:'center',behavior:'smooth'});}else viewer.reset();};
  $('[data-exterior]').oninput=e=>apply({exterior:Number(e.target.value)});
  $('[data-section-enable]').onchange=e=>apply({section:e.target.checked?Number($('[data-section]').value):null});
  $('[data-section]').oninput=e=>{if($('[data-section-enable]').checked)apply({section:Number(e.target.value)});};
  $('#anatomy-search').oninput=()=>{resultOffset=0;results();};$('[data-region]').onchange=()=>{resultOffset=0;results();};
  $('[data-restore]').onclick=()=>apply({restore:true});
  $('[data-focus]').onclick=()=>viewer.focusAnatomy(state.selected);
  $('[data-isolate]').onclick=()=>apply({isolate:state.selected});
  $('[data-hide]').onclick=()=>apply({structure:state.selected,visible:false});
  for(const b of section.querySelectorAll('[data-anatomy-motion]'))b.onclick=()=>document.querySelector('#viewer-actions [data-motion="'+b.dataset.anatomyMotion+'"]').click();
  $('[data-play]').onclick=()=>document.querySelector('#play-pause').click();
  const pauseAt=time=>{document.querySelector('#study-time').value=String(time);document.querySelector('#study-apply').click();};
  $('[data-time]').oninput=e=>pauseAt(Number(e.target.value));
  $('[data-reset]').onclick=()=>pauseAt(0);
  for(const b of section.querySelectorAll('[data-phase-time]'))b.onclick=()=>pauseAt(Number(b.dataset.phaseTime));
  const observer=new MutationObserver(()=>{
    const time=Number(container.dataset.poseTime)||0;
    if(document.activeElement!==$('[data-time]'))$('[data-time]').value=String(Math.min(8,time));
    $('[data-time-output]').textContent=time.toFixed(2)+' s';$('[data-phase]').textContent=container.dataset.studyStage||'Adult anatomical reference';
    for(const b of section.querySelectorAll('[data-anatomy-motion]'))b.setAttribute('aria-pressed',String(b.dataset.anatomyMotion===container.dataset.motion));
  });
  observer.observe(container,{attributes:true,attributeFilter:['data-pose-time','data-study-stage','data-motion','data-model']});
  const availability=new MutationObserver(refresh);availability.observe(container,{attributes:true,attributeFilter:['data-model']});
  container.addEventListener('anatomy-change',refresh);refresh();
  return ()=>{closed=true;observer.disconnect();availability.disconnect();container.removeEventListener('anatomy-change',refresh);section.remove();};
}
