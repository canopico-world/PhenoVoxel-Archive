import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import media from './media.json';
import atlas from './atlas.json';
import world from './world.json';
import assets from './model-assets.json';
import { naturalSpecies } from './natural-models.js';
const photos=import.meta.glob('./photo-*.*',{eager:true,query:'?url',import:'default'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const photoFor=s=>media.photos[s.id];
export function photoUrl(s){const p=photoFor(s);return p&&(photos['./'+p.localFile]||p.url);}
export function createResearchUI(viewer){
 const science=document.querySelector('.science-panel');
 science.insertAdjacentHTML('afterbegin','<figure id="reference-photo" class="reference-photo"></figure>');
 document.querySelector('.viewer-panel').insertAdjacentHTML('beforeend',`<div class="view-presets" aria-label="Camera views"><button data-view="side">Lateral</button><button data-view="front">Anterior</button><button data-view="top">Dorsal</button></div>`);
 const laboratory=document.querySelector('.viewer-panel');laboratory.insertAdjacentHTML('beforeend','<div id="model-mode" class="model-mode"><button id="surface-mode">Textured surface</button><button id="motion-mode">Motion study</button></div><div id="external-model" class="external-model" hidden></div><div id="asset-credit" class="asset-credit" hidden></div>');
 document.querySelector('.behavior-panel').insertAdjacentHTML('beforebegin',`<div class="study-strip"><div><span class="eyebrow">RECONSTRUCTION STATUS</span><p id="model-quality"></p></div><button id="compare-photo">Compare with photograph ↗</button></div>`);
 document.querySelector('.reference-panel').insertAdjacentHTML('beforebegin',`<section class="atlas-panel" aria-label="Geographic observations"><div class="atlas-heading"><div><span class="eyebrow">BIOGEOGRAPHY / GBIF</span><h2>Where life is recorded.</h2></div><a id="gbif-records" target="_blank" rel="noopener">Explore occurrence records ↗</a></div><div class="atlas-layout"><div id="occurrence-map" aria-label="Interactive world map of recorded occurrences"></div><div class="atlas-details"><span class="eyebrow">GEOREFERENCED RECORDS</span><strong id="occurrence-count">—</strong><p id="occurrence-date"></p><label for="map-years">Observation period</label><select id="map-years"><option value="">All years</option><option value="2020,2026">2020–2026</option><option value="2000,2019">2000–2019</option><option value="1900,1999">1900–1999</option></select><div class="map-legend"><span></span>Recorded density</div><p id="map-status" role="status">Loading geographic layer…</p></div></div><p class="atlas-caution">Occurrences show reporting effort, including historical, introduced, cultivated or captive records. They are not native-range boundaries, absence, population size, or abundance. Only coordinates without GBIF geospatial flags are requested.</p><details class="country-details"><summary>Country counts & data provenance</summary><div id="country-counts"></div><p>Counts are a dated all-years snapshot. The map updates live and may differ. Each source dataset retains its own license. Land outlines: Natural Earth, public domain. Density tiles: GBIF.</p></details></section>`);
 const map=L.map('occurrence-map',{minZoom:0,maxZoom:7,scrollWheelZoom:false,worldCopyJump:true}).fitBounds([[-65,-180],[83,180]],{padding:[5,5]});
 L.geoJSON(world,{style:{fillColor:'#354e55',fillOpacity:.78,color:'#64797b',weight:.6}}).addTo(map);
 map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a> · <a href="https://www.gbif.org/terms">GBIF</a>');
 let density=null,selected=null,request=0,surfaceAPI=null;
 function mode(surface){
  const asset=assets.models[selected?.id],external=document.querySelector('#external-model');surface=surface&&!!asset;laboratory.dataset.mode=surface?'surface':'motion';external.hidden=!surface;document.querySelector('#asset-credit').hidden=!surface;document.querySelector('#surface-mode').setAttribute('aria-pressed',String(surface));document.querySelector('#motion-mode').setAttribute('aria-pressed',String(!surface));
  document.querySelector('#play-pause').disabled=surface;document.querySelector('#speed').disabled=surface;
  if(surface&&!external.querySelector('iframe')){
   external.innerHTML=`<iframe title="${esc(asset.title)} by ${esc(asset.author)} — licensed 3D surface study" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe>`;
   const iframe=external.querySelector('iframe'),uid=new URL(asset.embed).pathname.split('/')[2];
   import('@sketchfab/viewer-api').then(({default:Sketchfab})=>{if(!iframe.isConnected)return;new Sketchfab(iframe).init(uid,{autostart:1,ui_theme:'dark',dnt:1,success(api){if(!iframe.isConnected)return;surfaceAPI=api;api.start();api.addEventListener('viewerready',()=>{if(!iframe.isConnected)return;api.setBackground({color:[.055,.09,.105]});if(uid==='fc2c7fd74dd04e39935803b884c77258')api.getCameraLookAt((error,c)=>{if(!error&&c?.position&&c?.target&&iframe.isConnected)api.setCameraLookAt(c.position.map((n,i)=>c.target[i]+(n-c.target[i])*1.55),c.target,0);});});},error(){if(!iframe.isConnected)return;mode(false);document.querySelector('#model-quality').textContent='Online surface unavailable. The bundled motion study remains available.';}});}).catch(()=>{if(iframe.isConnected)iframe.src=asset.embed;});
  }
  if(surfaceAPI){if(surface)surfaceAPI.start();else surfaceAPI.stop();}
  document.querySelector('.schematic-tag').textContent=surface?'Textured artist model · CC BY 4.0':naturalSpecies.has(selected.id)?'Reference-guided anatomy':'Schematic · awaiting reconstruction';
  document.querySelector('#model-quality').textContent=surface?'Textured visual reference by '+asset.author+'. Use the embedded playback controls; choose a behavior below to open the independent local motion study. Internet required.':naturalSpecies.has(selected.id)?'Detailed surface and articulated limbs. Independently authored from references; geometry and motion remain unvalidated.':'Educational schematic. This specimen is queued for a species-specific anatomical reconstruction.';
 }
 document.querySelector('#surface-mode').onclick=()=>mode(true);document.querySelector('#motion-mode').onclick=()=>mode(false);
 const years=document.querySelector('#map-years');
 function updateLayer(){
  if(density)map.removeLayer(density);const key=selected.taxonomy.acceptedUsageKey||selected.taxonomy.usageKey;
  const generation=++request;document.querySelector('#map-status').textContent='Loading recorded occurrences…';
  const params=new URLSearchParams({taxonKey:String(key),style:'purpleYellow-noborder.poly',bin:'hex',hexPerTile:'64',hasGeospatialIssue:'false'});if(years.value)params.set('year',years.value);
  density=L.tileLayer('https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?'+params,{opacity:.86,maxZoom:7,attribution:'<a href="https://techdocs.gbif.org/en/openapi/v2/maps">GBIF occurrence tiles</a>'});
  let errors=0;density.on('tileerror',()=>{if(generation===request){errors++;document.querySelector('#map-status').textContent='Some tiles unavailable. Open the GBIF records for details.';}});density.on('load',()=>{if(generation===request&&!errors)document.querySelector('#map-status').textContent=years.value?'Filtered density · count above remains all years':'Live density · all years';});density.addTo(map);
 }
 years.onchange=updateLayer;
 const resize=new ResizeObserver(()=>map.invalidateSize());resize.observe(document.querySelector('#occurrence-map'));
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>viewer.setView?.(b.dataset.view));
 function openPhoto(){const p=photoFor(selected);if(!p)return;const dialog=document.querySelector('#dialog');document.querySelector('#dialog-content').innerHTML=`<button class="dialog-close" id="photo-close" aria-label="Close photograph">×</button><span class="eyebrow">PHOTOGRAPHIC REFERENCE</span><h2>${esc(selected.commonName)}</h2><img class="photo-large" src="${esc(photoUrl(selected))}" alt="${esc(p.description||selected.scientificName)}"><p>${esc(p.description||'Source specimen identified as '+selected.scientificName)}</p><p>${esc(p.author)} · <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a> · <a href="${esc(p.source)}" target="_blank" rel="noopener">Original file & attribution ↗</a></p><p class="panel-footnote">Reference photograph. The 3D reconstruction is separately authored; it is not a scan of this individual. Source captions may identify subspecies, cultivated specimens or captive settings.</p>`;document.querySelector('#photo-close').onclick=()=>dialog.close();dialog.showModal();}
 document.querySelector('#compare-photo').onclick=openPhoto;
 return {studyMotion(){mode(false);},select(s){
  selected=s;years.value='';map.fitBounds([[-65,-180],[83,180]],{padding:[5,5],animate:false});const p=photoFor(s),figure=document.querySelector('#reference-photo');
  figure.innerHTML=p?`<button id="inspect-photo" aria-label="Enlarge reference photograph"><img src="${esc(photoUrl(s))}" alt="${esc(p.description||s.scientificName)}"><span>${s.group==='Bacteria'||s.group==='Archaea'||['saccharomyces-cerevisiae','neurospora-crassa','amoeba-proteus','paramecium-caudatum','euglena-gracilis','chlamydomonas-reinhardtii'].includes(s.id)?'MICROGRAPH / SOURCE IMAGE':'REAL ORGANISM'} ↗</span></button><figcaption><a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.author)} ↗</a><a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a></figcaption>`:'<p class="photo-pending">A verified photographic reference is being curated.</p>';
  document.querySelector('#inspect-photo')?.addEventListener('click',openPhoto);figure.querySelector('img')?.addEventListener('error',()=>{figure.querySelector('img').hidden=true;figure.insertAdjacentHTML('beforeend','<p>Image unavailable. Follow the credited source file.</p>');},{once:true});
  document.querySelector('#compare-photo').disabled=!p;
  document.querySelector('.schematic-tag').textContent=naturalSpecies.has(s.id)?'Reference-guided anatomy':'Schematic · awaiting reconstruction';
  document.querySelector('#model-quality').textContent=naturalSpecies.has(s.id)?'Detailed surface and articulated limbs. Independently authored from references; geometry and motion remain unvalidated.':'Educational schematic. This specimen is queued for a species-specific anatomical reconstruction.';
  surfaceAPI=null;const asset=assets.models[s.id];document.querySelector('#model-mode').hidden=!asset;document.querySelector('#external-model').replaceChildren();document.querySelector('#asset-credit').innerHTML=asset?`<a href="${esc(asset.source)}" target="_blank" rel="noopener">${esc(asset.title)} · ${esc(asset.author)} ↗</a><a href="${esc(asset.licenseUrl)}" target="_blank" rel="noopener">${esc(asset.license)}</a><span>Artist reconstruction · unvalidated. If unavailable, choose Motion study.</span>`:'';mode(!!asset);
  const a=atlas.species[s.id];document.querySelector('#occurrence-count').textContent=a?a.count.toLocaleString():'Unavailable';document.querySelector('#occurrence-date').textContent=a?`All-years snapshot · ${a.retrieved}`:'No verified snapshot';document.querySelector('#gbif-records').href=a?.source||`https://www.gbif.org/species/${s.taxonomy.usageKey}`;
  const display=new Intl.DisplayNames(['en'],{type:'region'});document.querySelector('#country-counts').innerHTML=a?.countries.map(c=>`<a href="${esc(a.source)}&country=${esc(c.name)}" target="_blank" rel="noopener"><span>${esc(display.of(c.name)||c.name)}</span><strong>${c.count.toLocaleString()}</strong></a>`).join('')||'<p>No country-level occurrence records.</p>';updateLayer();
 }};
}
