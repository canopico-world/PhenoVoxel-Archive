import curves from './human-vision-curves.json' with {type:'json'};
export function spectralEfficiency(wavelength){
  return [curves.photopic,curves.scotopic].map(table=>table[Math.round(wavelength)-table[0][0]]?.[1]??0);
}
export function arrivalDifference(angle){return 1e6*.18*Math.sin(angle*Math.PI/180)/343;}
const pathways=[
 ['Touch and limb position','Stretch or deformation','Skin and muscle sensory endings','Mechanically gated channels including PIEZO2','Human loss-of-function observations link PIEZO2 to vibration, touch discrimination and position sense.','https://pubmed.ncbi.nlm.nih.gov/27653382/'],
 ['Smell','Airborne odorants','Olfactory epithelium','Olfactory sensory neurons project to the olfactory bulb','Different odorants recruit different combinations of sensory neurons.','https://www.nidcd.nih.gov/health/smell-disorders'],
 ['Taste','Dissolved tastants','Taste buds','Taste receptor cells activate sensory nerve fibres','Taste, smell and oral sensation together contribute to flavour.','https://www.nidcd.nih.gov/health/taste-disorders'],
 ['Balance','Head rotation or linear acceleration','Semicircular canals and otolith organs','Hair cells transduce movement','Canals respond to rotation. The otolith organs respond to gravity and linear acceleration.','https://www.nidcd.nih.gov/health/balance-disorders'],
 ['Cooling','Falling skin temperature','Cutaneous sensory endings','Cold-sensitive afferents change their discharge','Researchers recorded responses to cooling in individual human sensory fibres. The atlas shows a regional nerve at larger scale.','https://pmc.ncbi.nlm.nih.gov/articles/PMC2278822/'],
 ['Itch and nociception','Chemical signals in skin','Cutaneous sensory endings','Different C-fibre populations respond to particular compounds','Human recordings and perceptual ratings distinguish responses to itch- and pain-provoking stimuli. An individual nerve response alone cannot specify the experience.','https://pubmed.ncbi.nlm.nih.gov/12611975/'],
 ['Internal body signals','Heartbeat-related signals','Distributed visceral and somatic afferents','Central processing includes insular and opercular cortex','During a human heartbeat-detection task, right anterior insular/opercular activity was associated with accuracy. The displayed insula is the wider anatomical region.','https://doi.org/10.1038/nn1176']
];
const landmarks=['Median nerve','Olfactory nerve (I)','Tongue','Vestibular nerve','Sural nerve','Sural nerve','Insula (Subcentral gyrus and ant. and post. sulci*)'];
export function mountHumanSense(section,focusStructure){
  function locate(host,name){
    const button=document.createElement('button'),message=document.createElement('output');
    button.textContent='Locate in anatomy';message.setAttribute('aria-live','polite');
    button.onclick=async()=>{const label=typeof name==='function'?name():name;
      button.disabled=true;try{await focusStructure(label);message.textContent='Showing '+label;}catch{message.textContent='Anatomy is still loading. Try again when the model is ready.';}finally{button.disabled=false;}
    };host.append(' ',button,' ',message);
  }
  const visual=document.createElement('article');visual.className='sense-species-view';
  visual.innerHTML='<h3>When daylight fades</h3><p>Choose one wavelength. Compare how strongly it contributes to vision in bright and dark-adapted conditions at equal radiant power. Each CIE curve is normalized to its own peak.</p><label>Wavelength <input data-wave type="range" min="380" max="780" value="507" step="1"></label><p><output data-wave-result></output></p><label>Bright light <meter data-day min="0" max="1"></meter></label> <label>Dark adapted <meter data-night min="0" max="1"></meter></label><p>Tabulated human standard-observer data. A phone display combines primaries and cannot emit a chosen monochromatic stimulus.</p><a href="https://doi.org/10.25039/CIE.DS.dktna2s3">CIE photopic data</a> · <a href="https://doi.org/10.25039/CIE.DS.gr6w4b5g">CIE scotopic data</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CIE tables, CC BY-SA 4.0</a>';
  section.querySelector('#sense-vision').prepend(visual);
  locate(visual,'Optic nerve (II)');
  const wave=visual.querySelector('input');wave.oninput=()=>{const [day,night]=spectralEfficiency(+wave.value);visual.querySelector('[data-day]').value=day;visual.querySelector('[data-night]').value=night;visual.querySelector('output').textContent=wave.value+' nm · bright light '+day.toFixed(4)+' · dark adapted '+night.toFixed(4)};wave.oninput();
  const sound=document.createElement('article');sound.className='sense-species-view';sound.innerHTML='<h3>Which ear receives the wave first?</h3><label>Source direction <input type="range" min="-90" max="90" value="0"></label><p><output></output></p><p>A far-field plane wave passes two points 18 cm apart in air at 343 m/s. Head diffraction, pinna filtering and individual thresholds are outside this geometric estimate. Human listening experiments show that timing can guide low-frequency localization.</p><a href="https://pubmed.ncbi.nlm.nih.gov/1564201/">Human localization experiment</a>';
  section.querySelector('#sense-sound').prepend(sound);
  locate(sound,'Cochlea');
  const angle=sound.querySelector('input');angle.oninput=()=>{const t=arrivalDifference(+angle.value);sound.querySelector('output').textContent=angle.value+'° · '+(t===0?'simultaneous arrival':(t>0?'right':'left')+' ear leads by '+Math.round(Math.abs(t))+' µs')};angle.oninput();
  const signals=document.createElement('article');signals.className='sense-species-view';signals.innerHTML='<h3>From stimulus to sensory tissue</h3><label>Choose a sense <select></select></label><p data-path></p><p data-finding></p><a data-source-link>Evidence for this pathway</a>';
  section.querySelector('#sense-signals').prepend(signals);
  locate(signals,()=>landmarks[+signals.querySelector('select').value]);
  const select=signals.querySelector('select');pathways.forEach(([name],i)=>select.add(new Option(name,String(i))));select.onchange=()=>{const [,cue,tissue,response,note,url]=pathways[+select.value];signals.querySelector('[data-path]').textContent=[cue,tissue,response].join(' → ');signals.querySelector('[data-finding]').textContent=note;signals.querySelector('a').href=url};select.onchange();
}
