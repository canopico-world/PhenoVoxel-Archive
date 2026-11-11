export const BENCHMARK_SPECIES=Object.freeze(['apis-mellifera','drosophila-melanogaster','amphiprion-ocellaris']);
export function benchmarkLink(id){
 if(!BENCHMARK_SPECIES.includes(id))return '';
 return `<article class="sense-entry"><span class="sense-badge">PV-SENSE-001 · Research pilot</span><h3>From molecule to response</h3><p>Trace gene, protein, tissue, stimulus and response evidence. Inspect held-out phone-model results, observed fish choices and the remaining validation gaps.</p><a class="sense-primary" href="./research/sensory-benchmark-v1/index.html#${id}">Explore the molecular evidence atlas ↗</a><p class="sense-method">Computational benchmark · live-phone validation pending · no claim of reconstructed perception.</p></article>`;
}
