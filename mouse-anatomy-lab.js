import {cellSource} from './mouse-anatomy.js';
export function mountMouseLab({viewer,host}){
  const panel=document.createElement('section');panel.className='anatomy-lab';panel.id='anatomy-lab';
  panel.innerHTML='<header><div><span class="eyebrow">COMPARATIVE ANATOMY</span><h2>Inside the laboratory mouse</h2><p>Peel back the skin, follow a vessel into the tail, or inspect an individual structure.</p></div><button data-model>View model ↑</button></header><p role="status">Loading atlas…</p><fieldset data-controls disabled><legend>Body atlas</legend><button data-overview>Restore overview</button><div class="anatomy-presets" data-systems></div><label class="anatomy-slider">Skin opacity <input type="range" min="0" max="1" step=".01" value="1" data-opacity></label><div class="anatomy-workspace"><div><label>Find a structure <input type="search" data-find placeholder="Try tendon or lymph node"></label><label> Evidence <select data-grade><option value="">All evidence</option></select></label><div class="anatomy-results" data-list></div></div><aside class="anatomy-selection"><h3 data-title>Select a structure</h3><p data-proof></p><p data-detail></p><p data-basis></p><button data-aim disabled>Focus structure</button><button data-isolate disabled>Isolate structure</button></aside></div><div class="anatomy-motion"><div><h3>Follow the tail in motion</h3><p>Watch the surface, caudal vertebrae and vessels bend together in a six-second authored pose study.</p></div><div class="anatomy-motion-actions"><button data-tail>Study tail</button><button data-pause>Play / pause</button><button data-reset>Reset pose</button></div><label>Study time <input type="range" min="0" max="6" step=".02" value="0" data-time></label></div><div class="anatomy-motion"><div><h3>A single visual-cortex neuron</h3><p>Scala et al., mouse V1, specimen NMO_130632. Inspect its traced branches in an independent coordinate frame. Absolute scale and placement in this body are unresolved.</p></div><button data-cell aria-pressed="false">Inspect neuron</button></div></fieldset><details><summary>Specimen, evidence and reuse</summary><p>Dogdas, Stout, Chatziioannou and Leahy reconstructed a 28 g male nude mouse from registered CT and cryosection images. MouseBio_3D adapted the specimen to a standing posture and added anatomy. The evidence label on each component describes its origin. Coverage of vessels, peripheral nerves, connective tissues and lymphatics is partial. The fuller coat, muzzle, whiskers and ears illustrate a furred house mouse in the overview. <a href="https://collections.museumsvictoria.com.au/species/8431">See the house mouse photographed by David Paul at Museums Victoria.</a> The anatomy controls reveal the registered atlas surfaces. The scan specimen was hairless. Display colors and tail motion are illustrative.</p><p><a href="https://neuroimage.usc.edu/neuro/Digimouse">Digimouse</a> · <a href="https://qasim-hussain-code.github.io/MouseBio_3D/">MouseBio_3D</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">Body adaptation CC BY-SA 4.0</a> · <a data-cell-source>Neuron source</a> · <a href="https://creativecommons.org/licenses/by/4.0/">Cell CC BY 4.0</a></p></details>';
  const walking=document.createElement('details');walking.className='anatomy-motion';
  walking.innerHTML='<summary>Walking study · track four paws</summary><p>Follow one paw as it leaves the ground, swings forward and lands. The upper recording shows the original corridor view. The lower recording overlays the tracked paws, nose and tail.</p><video controls playsinline preload="none" style="width:100%;background:#122125" aria-label="Walking mouse, side and mirror views"></video><p>Front right is red, front left blue, hind right magenta and hind left cyan. The investigators recorded 400 frames per second. Playback at 30 frames per second slows the crossing about thirteenfold.</p><button data-frame="-1" disabled>Previous frame</button> <button data-frame="1" disabled>Next frame</button><p>Machado et al., 2015. <a href="https://doi.org/10.7554/eLife.07892.005">Original walking study, Video 1</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>';
  const video=walking.querySelector('video');
  walking.ontoggle=()=>{if(!walking.open){video.pause();return;}if(!video.src){video.preload='metadata';video.src='https://static-movie-usa.glencoesoftware.com/mp4/10.7554/961/827182d6b67687b3c8ad7cbc3c610d0ccd388c59/elife-07892-media1.mp4';}};
  video.onloadedmetadata=()=>{for(const button of walking.querySelectorAll('[data-frame]'))button.disabled=false;};
  for(const button of walking.querySelectorAll('[data-frame]'))button.onclick=()=>{video.pause();video.currentTime=Math.max(0,Math.min(video.duration,video.currentTime+Number(button.dataset.frame)/30));};
  panel.querySelector('[data-controls]').after(walking);
  host.append(panel);
  const $=s=>panel.querySelector(s),container=document.querySelector('#viewer');
  $('[data-cell-source]').href=cellSource;
  const grades={source:'Source label',labelled:'Source label',labeled:'Source label',traced:'Traced from source',simulated:'Simulated'};
  const grade=g=>grades[g]||g.replaceAll('-',' ');
  for(const g of ['source','traced','simulated'])$('[data-grade]').add(new Option(grade(g),g));
  const groups=['integumentary','skeletal','muscular','connective','digestive','nervous','sensory','cardiovascular','lymphatic','immune','respiratory','urinary','endocrine','reproductive'];
  let selected=null;
  const action=(c)=>viewer.changeMouse(c);
  function list(){
    const a=viewer.mouseState();if(!a)return;
    const query=$('[data-find]').value.trim().toLowerCase(),level=$('[data-grade]').value;
    const rows=viewer.mouseState().structures.filter(r=>(!level||r.evidence===level)&&r.name.toLowerCase().includes(query));
    const frag=document.createDocumentFragment();
    for(const r of rows){
      const row=document.createElement('div');row.className='anatomy-result';
      const input=document.createElement('input');input.type='checkbox';input.checked=a.visible.has(r.id);input.setAttribute('aria-label','Show '+r.name);
      input.onchange=()=>{action({id:r.id,show:input.checked});refresh(false)};
      const b=document.createElement('button');b.textContent=r.name;b.setAttribute('aria-pressed',String(selected===r.id));
      b.onclick=()=>select(r.id);row.append(input,b);frag.append(row);
    }
    $('[data-list]').replaceChildren(frag);
  }
  function select(id){
    const r=viewer.mouseState().structures.find(s=>s.id===id);if(!r)return;selected=id;action({id,show:true,selected:id});
    $('[data-title]').textContent=r.name;$('[data-proof]').textContent=grade(r.evidence)+' · '+r.systems.join(' / ');
    $('[data-detail]').textContent=r.description;$('[data-basis]').textContent=(r.basis||[]).join(' · ');
    $('[data-isolate]').disabled=false;$('[data-aim]').disabled=false;refresh();
  }
  function refresh(relist=true){
    const a=viewer.mouseState();if(!a)return;
    $('[data-controls]').disabled=false;$('[data-opacity]').value=String(a.opacity);
    $('[role=status]').textContent=a.cellMode?'Independent neuron · 11,650 traced nodes':a.visible.size+' of '+a.structures.length+' body components visible';
    for(const b of $('[data-systems]').children){
      const ids=viewer.mouseState().structures.filter(r=>r.systems.includes(b.dataset.group));
      const n=ids.filter(r=>a.visible.has(r.id)).length;
      b.setAttribute('aria-pressed',n===ids.length?'true':n===0?'false':'mixed');
    }
    $('[data-cell]').textContent=a.cellMode?'Return to mouse body':'Inspect neuron';$('[data-cell]').setAttribute('aria-pressed',String(a.cellMode));
    if(relist)list();
  }
  for(const group of groups){
    const b=document.createElement('button');b.dataset.group=group;b.textContent=group[0].toUpperCase()+group.slice(1);
    b.onclick=()=>{const ids=viewer.mouseState().structures.filter(r=>r.systems.includes(group)).map(r=>r.id);action({ids,show:b.getAttribute('aria-pressed')!=='true'});refresh()};$('[data-systems]').append(b);
  }
  $('[data-find]').oninput=list;$('[data-grade]').onchange=list;
  $('[data-overview]').onclick=()=>{selected=null;$('[data-find]').value='';$('[data-grade]').value='';
    $('[data-title]').textContent='Select a structure';
    for(const key of ['proof','detail','basis'])$('[data-'+key+']').textContent='';
    $('[data-isolate]').disabled=$('[data-aim]').disabled=true;
    document.querySelector('#viewer-actions [data-motion="observe"]')?.click();
    action({overview:true});refresh()};
  $('[data-aim]').onclick=()=>{action({id:selected,show:true,focus:selected});container.scrollIntoView({block:'center'});refresh()};
  $('[data-isolate]').onclick=()=>{action({only:[selected]});refresh()};
  $('[data-opacity]').oninput=e=>{action({opacity:Number(e.target.value),id:'living:skin',show:true});refresh()};
  $('[data-model]').onclick=()=>container.scrollIntoView({block:'center'});
  $('[data-tail]').onclick=()=>{action({opacity:.13,only:viewer.mouseState().structures.filter(r=>r.id.includes('tail')||r.id==='living:skin').map(r=>r.id)});document.querySelector('[data-motion="tail-sweep"]')?.click();refresh()};
  $('[data-time]').oninput=e=>{const t=document.querySelector('#study-time');t.value=e.target.value;document.querySelector('#study-apply').click()};
  $('[data-reset]').onclick=()=>{const t=$('[data-time]');t.value='0';t.dispatchEvent(new Event('input'))};
  $('[data-pause]').onclick=()=>document.querySelector('#play-pause').click();
  $('[data-cell]').onclick=async()=>{const b=$('[data-cell]');b.disabled=true;try{await action({cell:!viewer.mouseState().cellMode});refresh()}catch(error){$('[role=status]').textContent=error.message}finally{b.disabled=false}};
  const actions=document.querySelector('#viewer-actions');
  const revealWhiskers=e=>{if(['whisk','steer-whisk'].includes(e.target.closest('[data-motion]')?.dataset.motion)){
    action({overview:true});refresh();
  }};
  actions?.addEventListener('click',revealWhiskers,true);
  const picked=e=>select(e.detail);container.addEventListener('mouse-pick',picked);
  const obs=new MutationObserver(changes=>{if(changes.some(c=>c.attributeName==='data-model'))refresh();if(document.activeElement!==$('[data-time]'))$('[data-time]').value=container.dataset.poseTime||0;});
  obs.observe(container,{attributes:true,attributeFilter:['data-model','data-pose-time']});refresh();
  return ()=>{actions?.removeEventListener('click',revealWhiskers,true);obs.disconnect();container.removeEventListener('mouse-pick',picked);panel.remove()};
}
