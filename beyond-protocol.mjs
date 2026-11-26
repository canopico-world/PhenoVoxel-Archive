export const edges = ['left', 'right', 'top', 'bottom'];
export const oppositeEdge = edge => ({left:'right',right:'left',top:'bottom',bottom:'top'})[edge]??null;
export const verticalEdge = edge => edge==='top'||edge==='bottom';
export const cameraViews = ['oblique', 'side', 'opposite', 'front', 'top', 'underside', 'outward'];
export const beyondSections = {
  model:'3D specimen', workspace:'Whole workspace', behavior:'Behavior study', senses:'Sense lab',
  lineage:'Tree of life', map:'Biogeography', dna:'DNA lab', evidence:'Evidence and sources',
  overview:'Specimen overview', anatomy:'Anatomy', ecology:'Ecology', taxonomy:'Taxonomy', data:'Research data', photo:'Reference photograph',
  index:'Collection index'
};

const isId = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
export const dnaParts = ['lab','helix','sequence','map','base','annotation','provenance','inspector'];
const dnaText = value => typeof value==='string' && /^[\w.:-]{1,96}$/.test(value);
const coordinate = value => Number.isSafeInteger(value)&&value>0&&value<=4294967295;
function readDNA(value){
  if(!value||!dnaParts.includes(value.part))return null;
  if(value.accession==null)return {part:value.part};
  if(!dnaText(value.accession)||!dnaText(value.feature)||!coordinate(value.position)||!coordinate(value.start)||typeof value.reverse!=='boolean')return null;
  return {part:value.part,accession:value.accession,feature:value.feature,position:value.position,start:value.start,reverse:value.reverse};
}

export function readHandoff(value) {
  if (!value || !isId(value.species) || !isId(value.motion)) return null;
  if (value.variant !== null && !isId(value.variant)) return null;
  if (!edges.includes(value.edge) || !cameraViews.includes(value.view)) return null;
  const section=value.section??'model';
  if (!Object.hasOwn(beyondSections,section)) return null;
  if (!Number.isFinite(value.time) || value.time < 0 || value.time > 3600) return null;
  const d = value.direction;
  if (!Array.isArray(d) || d.length !== 3 || !d.every(Number.isFinite)) return null;
  const length = Math.hypot(...d);
  if (length < .9 || length > 1.1) return null;
  const dna=value.dna==null?null:readDNA(value.dna);
  if(value.dna!=null&&(section!=='dna'||!dna))return null;
  const anchor=value.anchor;
  if(anchor!=null&&(!Number.isSafeInteger(anchor)||anchor<0||anchor>199||section==='photo'||section==='dna'))return null;
  return {
    species: value.species, variant: value.variant, motion: value.motion,
    edge: value.edge, view: value.view, time: value.time, direction: d.map(n => n / length), section,
    ...(dna?{dna}:{}),...(anchor!=null?{anchor}:{})
  };
}

export function readPreview(value) {
  if(!value||!Number.isFinite(value.progress)||value.progress<0||value.progress>1)return null;
  if(value.progress===0)return {progress:0};
  if(!Object.hasOwn(beyondSections,value.section)||typeof value.name!=='string'||value.name.length>100)return null;
  if(value.image!=null && (typeof value.image!=='string'||value.image.length>24000||
     !/^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(value.image)))return null;
  const lane=value.lane??.5;
  if(!Number.isFinite(lane)||lane<0||lane>1)return null;
  return {progress:value.progress,section:value.section,name:value.name,image:value.image??null,lane};
}

export function dragRoute(start,point,viewport,extent,preferred) {
  const candidates=edges.map(edge=>{
    const vertical=verticalEdge(edge);
    const size=vertical?viewport.height:viewport.width;
    const axis=vertical?'y':'x';
    const towardStart=edge==='left'||edge==='top';
    const travel=(point[axis]-start[axis])*(towardStart?-1:1);
    const distance=towardStart?point[axis]:size-point[axis];
    const cardSize=vertical?extent.height:extent.width;
    const progress=Math.max(0,Math.min(1,.65-distance/Math.max(cardSize,1)));
    return {edge,travel,progress,distance,size,vertical,score:travel-distance*.5};
  }).filter(c=>c.travel>=Math.min(32,c.size*.07));
  const target=candidates.sort((a,b)=>b.score-a.score||Number(b.edge===preferred)-Number(a.edge===preferred))[0];
  if(!target)return {edge:preferred,progress:0,lane:.5,accept:false};
  const perpendicular=target.vertical?'x':'y';
  const span=target.vertical?viewport.width:viewport.height;
  return {
    edge:target.edge,progress:target.progress,
    lane:Math.max(0,Math.min(1,point[perpendicular]/span)),
    accept:target.distance<=Math.min(100,target.size*.2)&&target.travel>=Math.min(64,target.size*.14)
  };
}

export function reachedDock(edge, startX, endX, viewportWidth) {
  const travel = Math.min(64, viewportWidth * .14);
  const dockWidth = Math.min(100, viewportWidth * .2);
  if (edge === 'right') return endX >= viewportWidth - dockWidth && endX - startX >= travel;
  if (edge === 'left') return endX <= dockWidth && startX - endX >= travel;
  return false;
}

