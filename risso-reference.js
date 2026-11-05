import './risso-reference.css';

export const rissoAppearanceReference={
 id:'f56e629915c24459897ea8f902bcbcbb',
 author:'Major',
 authorUrl:'https://sketchfab.com/majorgalah',
 url:'https://sketchfab.com/3d-models/rissos-dolphin-grampus-griseus-f56e629915c24459897ea8f902bcbcbb',
 embedUrl:'https://sketchfab.com/models/f56e629915c24459897ea8f902bcbcbb/embed?autostart=0',
 purpose:'Appearance reference hosted by its creator; separate from the editable behavior model.',
 editable:false
};

export function mountRissoReference({species,pauseStudy}){
 if(species.id!=='grampus-griseus')return()=>{};
 const layout=document.querySelector('.specimen-layout'),study=document.querySelector('.viewer-panel'),behavior=document.querySelector('.behavior-panel');
 const selector=document.createElement('div');selector.id='risso-source-choice';selector.className='risso-source-choice';selector.setAttribute('role','group');selector.setAttribute('aria-label','Choose Risso 3D view');
 selector.innerHTML='<button type="button" data-source-view="reference" aria-pressed="true">Appearance · Major</button><button type="button" data-source-view="study" aria-pressed="false">Behavior · editable model</button>';
 const reference=document.createElement('section');reference.id='risso-appearance';reference.className='risso-appearance';reference.setAttribute('aria-label','Original Risso appearance model by Major');
 const top=document.createElement('header');top.innerHTML='<div><span class="eyebrow">ORIGINAL ARTIST MODEL</span><h2>Risso’s dolphin <span>by Major</span></h2></div><span class="outline-tag">Appearance reference</span>';
 const frame=document.createElement('iframe');frame.id='risso-sketchfab';frame.title='Risso’s dolphin by Major on Sketchfab — appearance reference';frame.src=rissoAppearanceReference.embedUrl;frame.setAttribute('allow','autoplay; fullscreen');frame.allowFullscreen=true;
 const credit=document.createElement('p');credit.className='risso-reference-credit';
 for(const [label,url] of [['Risso’s dolphin',rissoAppearanceReference.url],['Major',rissoAppearanceReference.authorUrl],['Sketchfab','https://sketchfab.com']]){if(credit.childNodes.length)credit.append(document.createTextNode(label==='Major'?' by ':' on '));const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener';credit.append(a);}
 const note=document.createElement('p');note.className='risso-reference-note';note.textContent='Explore Major’s original appearance here. The behavior view uses a separate editable reconstruction. Its movement does not animate this artist model.';
 const fallback=document.createElement('a');fallback.className='risso-reference-open';fallback.href=rissoAppearanceReference.url;fallback.target='_blank';fallback.rel='noopener';fallback.textContent='Open the original on Sketchfab ↗';
 reference.append(top,frame,credit,note,fallback);layout.before(selector);study.before(reference);
 const studyNote=document.createElement('p');studyNote.id='risso-study-note';studyNote.className='risso-study-note';studyNote.textContent='Editable behavior reconstruction · based on ivan.geraldo’s freely downloadable CC BY 4.0 surface. Separate from Major’s appearance model. Movement is an authored, source-linked illustration.';selector.after(studyNote);
 const setMode=mode=>{const isReference=mode==='reference';pauseStudy();if(isReference&&!frame.getAttribute('src'))frame.src=rissoAppearanceReference.embedUrl;if(!isReference)frame.removeAttribute('src');reference.hidden=!isReference;studyNote.hidden=isReference;study.hidden=isReference;behavior.hidden=isReference;selector.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sourceView===mode)));layout.dataset.rissoView=mode;document.body.dataset.rissoView=mode;if(!isReference){const tag=study.querySelector('.schematic-tag');if(tag)tag.textContent='Editable behavior reconstruction';}window.dispatchEvent(new Event('resize'));};
 selector.querySelectorAll('button').forEach(b=>b.onclick=()=>setMode(b.dataset.sourceView));setMode('reference');
 return()=>{frame.removeAttribute('src');reference.remove();selector.remove();studyNote.remove();study.hidden=false;behavior.hidden=false;delete layout.dataset.rissoView;delete document.body.dataset.rissoView;};
}
