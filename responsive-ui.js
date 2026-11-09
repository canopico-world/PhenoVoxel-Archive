import './responsive-ui.css';

// Layout and navigation only. Specimen geometry, evidence and sensor permissions
// remain owned by their existing modules.
export function mountResponsiveUI({selectSection}) {
 const $=s=>document.querySelector(s), compact=matchMedia('(max-width:1100px)');
 let pendingReferenceJump=false;
 const index=$('.archive-index'), indexAnchor=document.createComment('collection home');
 index.before(indexAnchor);
 const skip=document.createElement('a');skip.className='skip-study';skip.href='#main-content';skip.textContent='Skip to specimen';document.body.prepend(skip);
 $('#main-content').tabIndex=-1;
 const browse=document.createElement('button');browse.id='browse-collection';browse.textContent='Browse species';browse.setAttribute('aria-haspopup','dialog');browse.setAttribute('aria-controls','collection-dialog');browse.setAttribute('aria-expanded','false');$('.site-header').append(browse);
 const drawer=document.createElement('dialog');drawer.id='collection-dialog';drawer.setAttribute('aria-labelledby','collection-title');drawer.innerHTML='<header class="collection-dialog-heading"><div><span class="eyebrow">PHENOVOXEL ARCHIVE</span><h2 id="collection-title">Find a species</h2></div><button aria-label="Close species collection" class="collection-close">Close ×</button></header><nav class="collection-utilities" aria-label="Archive information"><button data-utility="methods">Our approach</button><button data-utility="open-data">Open data</button></nav>';document.body.append(drawer);
 const intro=$('.index-intro'), updates=document.createElement('details');updates.className='collection-updates';updates.innerHTML='<summary>Archive updates & reports</summary>';intro.before(updates);updates.append(intro);
 $('#result-count').setAttribute('role','status');$('#result-count').setAttribute('aria-live','polite');
 const viewerPanel=$('.viewer-panel'), viewerAnchor=document.createComment('viewer home');viewerPanel.before(viewerAnchor);
 const viewerDialog=document.createElement('dialog');viewerDialog.className='viewer-dialog';viewerDialog.setAttribute('aria-label','Expanded specimen viewer');viewerDialog.innerHTML='<header class="viewer-dialog-heading"><span>Specimen view</span><button type="button">Close view ×</button></header>';viewerDialog.querySelector('button').onclick=()=>viewerDialog.close();document.body.append(viewerDialog);
 const lock=()=>document.body.classList.toggle('ux-modal-open',drawer.open||viewerDialog.open);
 const restoreIndex=()=>{indexAnchor.after(index);browse.setAttribute('aria-expanded','false');lock();};
 drawer.addEventListener('close',restoreIndex);
 drawer.querySelector('button').onclick=()=>drawer.close();
 drawer.querySelectorAll('[data-utility]').forEach(button=>button.onclick=()=>{drawer.close();$('#'+button.dataset.utility).click();});
 drawer.addEventListener('click',e=>{if(e.target===drawer)drawer.close();});
 function openCollection(focusSearch=false){
  if(compact.matches){if(!drawer.open){drawer.querySelector('.collection-utilities').before(index);drawer.showModal();browse.setAttribute('aria-expanded','true');lock();}}
  else index.scrollIntoView({block:'nearest'});
  if(focusSearch)$('#search').focus();
 }
 browse.onclick=()=>openCollection(false);
 $('#field-guide').onclick=()=>openCollection(true);
 compact.addEventListener('change',()=>{if(!compact.matches&&drawer.open)drawer.close();});
 function closeViewer(){viewerAnchor.after(viewerPanel);viewerPanel.classList.remove('expanded');$('#fullscreen').setAttribute('aria-label','Expand specimen viewer');$('#fullscreen').setAttribute('aria-expanded','false');lock();}
 viewerDialog.addEventListener('close',closeViewer);
 $('#fullscreen').setAttribute('aria-haspopup','dialog');$('#fullscreen').setAttribute('aria-expanded','false');
 $('#fullscreen').onclick=()=>{
  if(viewerDialog.open){viewerDialog.close();return;}
  viewerDialog.append(viewerPanel);viewerPanel.classList.add('expanded');viewerDialog.showModal();
  $('#fullscreen').setAttribute('aria-label','Collapse specimen viewer');$('#fullscreen').setAttribute('aria-expanded','true');lock();viewerDialog.querySelector('button').focus();
 };
 const nav=document.createElement('nav');nav.className='study-jumps';nav.setAttribute('aria-label','Jump to study');
 nav.innerHTML='<button data-jump="model">Model</button><button data-jump="senses">Senses</button><button data-jump="behavior">Behavior</button><button data-jump="dna">DNA</button><button data-jump="evidence">Evidence</button>';
 $('.specimen-heading').after(nav);
 function jump(target){if(!target)return;target.tabIndex=-1;requestAnimationFrame(()=>{target.focus({preventScroll:true});target.scrollIntoView({behavior:'instant',block:'start'});});}
 nav.onclick=e=>{
  const key=e.target.closest('[data-jump]')?.dataset.jump;
  pendingReferenceJump=false;
  if(key==='model')jump(viewerPanel);
  if(key==='behavior')jump($('.behavior-panel'));
  if(key==='senses'){const open=$('#sense-lab [data-open]');if(open?.getAttribute('aria-expanded')==='false')open.click();jump($('#sense-lab'));}
  if(key==='dna'||key==='evidence'){pendingReferenceJump=key==='dna';selectSection(key==='dna'?'molecular':'sources');syncTabs();jump($('.reference-panel'));}
 };
 const tabs=$('.reference-tabs');
 function syncTabs(){
  for(const tab of tabs.querySelectorAll('[data-section]')){tab.id='reference-tab-'+tab.dataset.section;tab.setAttribute('aria-controls','reference-content');}
  const active=tabs.querySelector('[aria-selected="true"]');
  if(active)$('#reference-content').setAttribute('aria-labelledby',active.id);
  $('#reference-content').tabIndex=0;
 }
 tabs.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  const all=[...tabs.querySelectorAll('[data-section]')].filter(t=>!t.hidden);
  const i=all.indexOf(e.target);if(i<0)return;e.preventDefault();
  const j=e.key==='Home'?0:e.key==='End'?all.length-1:(i+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;
  selectSection(all[j].dataset.section);syncTabs();all[j].focus();all[j].scrollIntoView({block:'nearest',inline:'nearest'});
 });
 const tabObserver=new MutationObserver(()=>{syncTabs();if(pendingReferenceJump&&!$('#reference-content').textContent.includes('Loading the verified DNA record')){pendingReferenceJump=false;jump($('.reference-panel'));}});tabObserver.observe($('#reference-content'),{childList:true});
 for(const type of ['wheel','touchstart','pointerdown','keydown'])document.addEventListener(type,()=>{pendingReferenceJump=false;},{passive:true});
 document.addEventListener('keydown',e=>{
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!document.activeElement?.isContentEditable&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();openCollection(true);}
 });
 const help=$('.viewer-help');help.innerHTML='<span class="pointer-help">Drag to orbit · Scroll to zoom</span><span class="touch-help">Drag to rotate · Pinch to zoom</span><span> · Select a label</span>';
 function speciesChanged(){pendingReferenceJump=false;syncTabs();nav.querySelector('[data-jump="dna"]').hidden=!!tabs.querySelector('[data-section="molecular"]')?.hidden;}
 function revealSpecimen(){if(drawer.open)drawer.close();jump($('.specimen-heading'));}
 speciesChanged();return {speciesChanged,revealSpecimen};
}
