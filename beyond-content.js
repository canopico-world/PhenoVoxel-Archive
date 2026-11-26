const dnaTargets = [
  ['base','[data-base]'],
  ['map','.mol-map'],
  ['annotation','.mol-gene-detail,[data-overlap]'],
  ['provenance','.mol-provenance'],
  ['sequence','#mol-sequence,.mol-sequence-toolbar'],
  ['helix','#mol-canvas,.mol-scene'],
  ['inspector','.mol-inspector'],
  ['lab','.molecular-lab,#molecular-entry,[data-jump="dna"],[data-section="molecular"]']
];

const addressableItems = {
  anatomy:'#reference-content .anatomy-card',
  overview:'#reference-content .overview-grid > div,#reference-content .physiology-section article,#reference-content .measurement-grid > div',
  ecology:'#reference-content .ecology-grid > div',
  taxonomy:'#reference-content .taxonomy-grid > div,#reference-content .name-audit',
  evidence:'#reference-content .citation-card,#reference-content .behavior-evidence > div',
  senses:'#sense-lab img,#sense-lab canvas,#sense-lab article',
  behavior:'#behavior-options [data-motion]',
  data:'#reference-content .data-grid > div,#reference-content pre'
};

export function describeBeyondContent(target) {
  const row=target.closest('.species-row[data-species]');
  const image=target.closest('img');
  if(row)return {section:image?'photo':'workspace',species:row.dataset.species,visual:image,contentTile:true};
  const nav=target.closest('.study-jumps [data-jump],.reference-tabs [data-section]');
  if(nav){
    const id=nav.dataset.jump||nav.dataset.section;
    const section={molecular:'dna',sources:'evidence'}[id]||id;
    if(Object.hasOwn(beyondSections,section))return {section,part:'lab',contentTile:true,target};
  }
  const action=target.closest('#behavior-options [data-motion],#viewer-actions [data-motion]');
  if(action&&!action.disabled)return {section:'behavior',motion:action.dataset.motion,contentTile:true,target};
  const variant=target.closest('#specimen-choices [data-specimen]');
  if(variant)return {section:'model',variant:variant.dataset.specimen,contentTile:true,target};
  const photo=target.closest('#reference-photo,#inspect-photo,.photo-large');
  if(photo)return {section:'photo',visual:image||photo.querySelector('img'),target:photo};
  for(const [part,selector] of dnaTargets){
    const element=target.closest(selector);
    if(element)return {
      section:'dna',part,target,visual:element.matches('#mol-canvas')?element:null,
      directTouch:!!target.closest('#molecular-entry'),
      // Buttons inside the lab retain their normal behavior unless they represent a base or annotation.
      contentTile:!!target.closest('#molecular-entry,[data-base],[data-region],[data-overlap]')
    };
  }
  const area=target.closest('[data-beyond-surface]');
  if(!area)return null;
  const section=area.dataset.beyondSurface;
  const selector=addressableItems[section];
  const items=selector?[...document.querySelectorAll(selector)]:[];
  const index=items.findIndex(item=>item.contains(target));
  return {
    section,surface:area,target,visual:image||target.closest('canvas'),
    contentTile:index>=0,anchor:index>=0&&index<200?index:undefined
  };
}

export function revealBeyondAnchor(section,anchor) {
  const selector=addressableItems[section];
  const element=selector&&document.querySelectorAll(selector)[anchor];
  if(element)requestAnimationFrame(()=>element.scrollIntoView({block:'center',behavior:'instant'}));
}

export const dnaDestination = {
  lab:'.molecular-lab',helix:'.mol-scene',sequence:'#mol-sequence',map:'.mol-map',
  base:'#mol-sequence',annotation:'.mol-gene-detail',provenance:'.mol-provenance',inspector:'.mol-inspector'
};
import {beyondSections} from './beyond-protocol.mjs';

