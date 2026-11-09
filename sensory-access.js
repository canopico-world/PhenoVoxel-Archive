// An evidence profile unlocks only its reviewed study channels, never every sense.
const CHANNELS=['vision','sound','signals'];
export function sensoryAccess(profile){
 const channels=profile.curated?CHANNELS.filter(c=>profile.studyChannels?.includes(c)):[];
 return {maintenance:channels.length===0,channels,initialChannel:channels[0]||null};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function maintenanceMarkup(profile){
 return `<header class="sense-heading"><div><span class="sense-eyebrow">EVIDENCE REVIEW PENDING</span><h2>Sense &amp; Sensibility</h2><p>${esc(profile.scientificName)}</p></div><span class="sense-badge">Under maintenance</span></header><div class="sense-maintenance"><h3>This species’ sensory study is not ready.</h3><p>Species-specific evidence and a suitable implementation have not yet been reviewed for this lab. This does not mean scientific research is absent.</p><p>Camera filters, hearing simulations and signalling studies are unavailable here until their sources, assumptions and device limits are documented. No camera or microphone will start from this section.</p><p>The organism’s model, behavior studies and DNA section remain available.</p></div>`;
}
