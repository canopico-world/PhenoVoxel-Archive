import fs from 'node:fs';
// Keep source-linked data/decisions available beside both deployment targets.
for(const name of ['species.json','schema.json','taxonomy-audit.json','species-revisions.json','model-assets.json','LICENSE','LICENSE-DATA.md','ASSET-LICENSES.md','review-2026-10-24.html','review-2026-10-24.json','review-2026-10-24-helianthus-annuus.png','review-2026-10-24-arabidopsis-thaliana.png','review-2026-10-24-haliotis-rufescens.png','review-2026-10-24-haliotis-tuberculata.png'])fs.copyFileSync(name,'dist/'+name);

// Final scheduled review and actual screenshot sheets; rejected drafts are excluded.
for(const name of fs.readdirSync('.').filter(n=>/^final-review-2026-10-24\.(html|json)$/.test(n)||/^final-2026-10-24-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Individual corrected draft, with retained historical review beside it.
for(const name of fs.readdirSync('.').filter(n=>/^crab-review-2026-10-24\.(html|json)$/.test(n)||/^crab-2026-10-24-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^shore-crab-review-2026-10-24\.(html|json)$/.test(n)||/^shore-crab-2026-10-24-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^blue-crab-review-2026-10-24\.(html|json)$/.test(n)||/^blue-crab-2026-10-24-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^gazami-review-2026-10-24\.(html|json)$/.test(n)||/^gazami-crab-2026-10-24-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^(?:velvet|mitten|asian-shore)-crab-review-2026-10-24\.(html|json)$/.test(n)||/^(?:velvet|mitten|asian-shore)-crab-2026-10-24-.*\.jpg$/.test(n)||/^corrections-v0618\.(html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^coastal-.*-(?:review-2026-10-24\.(?:html|json)|2026-10-24-.*\.jpg)$/.test(n)||/^corrections-v0619\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^lobster-.*-(?:review-2026-10-24\.(?:html|json)|2026-10-24-.*\.jpg)$/.test(n)||/^corrections-v0620\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^spiny-.*-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^corrections-v0621\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^prawn-hermit-.*-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^corrections-v0622\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^conifer-.*-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^corrections-v0623\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^gymnosperm-.*-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^corrections-v0624\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^fungal-.*-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^corrections-v0625\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^microscopic-.*-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^corrections-v0626\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^ascomycete-.*-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^corrections-v0627\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Initial large-animal comparisons and complete behavior capability inventory.
for(const name of fs.readdirSync('.').filter(n=>/^large-marine-.*-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0628\.(?:html|json)$/.test(n)||/^large-animal-expansion-v0628\.json$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Jaguar body/behavior comparison and updated mechanism inventory.
for(const name of fs.readdirSync('.').filter(n=>/^jaguar-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0629\.(?:html|json)$/.test(n)||/^large-animal-expansion-v0629\.json$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Cheetah support, surface and source-linked individual comparisons.
for(const name of fs.readdirSync('.').filter(n=>/^cheetah-(?:review-2026-10-25\.(?:html|json)|2026-10-25-.*\.jpg)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0630\.(?:html|json)$/.test(n)||/^large-animal-expansion-v0630\.json$/.test(n)||/^photo-cheetah-reference-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Cheetah follow-up stance/clearance evidence, retaining previous reports.
for(const name of fs.readdirSync('.').filter(n=>/^cheetah-clearance-.*\.(?:html|json|jpg)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0631\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Individually reviewed Mollusca and credited before/after sheets.
for(const name of fs.readdirSync('.').filter(n=>/^mollusca-(?:review-2026-10-26\.(?:html|json)|2026-10-26-.*\.jpg)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0632\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Anatomical link integration follow-up and actual focused-region screenshots.
for(const name of fs.readdirSync('.').filter(n=>/^mollusca-anatomy-(?:review-2026-10-26\.(?:html|json)|2026-10-26-.*\.jpg)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0633\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Cornu adult reconstruction and exact numerical-map provenance.
for(const name of fs.readdirSync('.').filter(n=>/^mollusca-review-2026-10-26-cornu\.(?:html|json)$/.test(n)||/^cornu-v0634-.*\.(?:jpg|png)$/.test(n)||/^texture-cornu-.*\.(?:png|json|mjs)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0634\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Octopus external anatomy and actual reviewed main-viewer evidence.
for(const name of fs.readdirSync('.').filter(n=>/^mollusca-review-2026-10-26-octopus\.(?:html|json)$/.test(n)||/^octopus-v0635-.*\.(?:jpg|png)$/.test(n)||/^octopus-exterior-v0635\.json$/.test(n)||/^(?:corrections|behavior-capabilities)-v0635\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Individually reviewed octopus arm/body study.
for(const name of fs.readdirSync('.').filter(n=>/^mollusca-review-2026-10-26-octopus-arms\.(?:html|json)$/.test(n)||/^octopus-v0636-.*\.(?:jpg|png)$/.test(n)||/^octopus-arm-body-v0636\.json$/.test(n)||/^(?:corrections|behavior-capabilities)-v0636\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);
fs.copyFileSync('octopus-core-v0636.json','dist/octopus-core-v0636.json');

for(const name of fs.readdirSync('.').filter(n=>/^mollusca-review-2026-10-26-lymnaea\.(?:html|json)$/.test(n)||/^lymnaea-v0637-.*\.(?:jpg|png)$/.test(n)||/^lymnaea-form-v0637\.json$/.test(n)||/^(?:corrections|behavior-capabilities)-v0637\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^mollusca-review-2026-10-26-littorina\.(?:html|json)$/.test(n)||/^littorina-v0638-.*\.(?:jpg|png)$/.test(n)||/^littorina-form-v0638\.json$/.test(n)||/^(?:corrections|behavior-capabilities)-v0638\.(?:html|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);
fs.copyFileSync('photo-littorina-littorea.jpg','dist/photo-littorina-littorea.jpg');

for(const name of fs.readdirSync('.').filter(n=>/^(?:group-realism-review|fungal-exteriors|corrections|behavior-capabilities)-v0639\.(?:html|json)$/.test(n)||/^group-v0639-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);
for(const id of ['pleurotus-ostreatus','agaricus-bisporus','trametes-versicolor'])fs.copyFileSync('photo-'+id+'.jpg','dist/photo-'+id+'.jpg');

for(const name of fs.readdirSync('.').filter(n=>/^(?:jellyfish-review|corrections|behavior-capabilities)-v0640\.(?:html|json)$/.test(n)||/^jelly-v0640-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);
for(const id of ['aurelia-aurita','cassiopea-xamachana','cotylorhiza-tuberculata','rhizostoma-pulmo','chrysaora-hysoscella','cyanea-capillata','pelagia-noctiluca','aequorea-victoria','craspedacusta-sowerbii','chironex-fleckeri','physalia-physalis','velella-velella','porpita-porpita'])fs.copyFileSync('photo-'+id+'.jpg','dist/photo-'+id+'.jpg');
fs.copyFileSync('jelly-v0640-raw-captures.zip','dist/jelly-v0640-raw-captures.zip');

for(const name of fs.readdirSync('.').filter(n=>/^(?:cassiopea-review|corrections|behavior-capabilities)-v0641\.(?:html|json)$/.test(n)||/^cassiopea-v0641-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^(?:cotylorhiza-review|corrections|behavior-capabilities)-v0642\.(?:html|json)$/.test(n)||/^cotylorhiza-v0642-.*\.jpg$/.test(n)||n==='reference-cotylorhiza-morettin-2025.jpg'))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^(?:rhizostoma-review|corrections|behavior-capabilities)-v0643\.(?:html|json)$/.test(n)||/^rhizostoma-v0643-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^(?:anthozoa-review|corrections|behavior-capabilities)-v0644\.(?:html|json)$/.test(n)||/^anthozoa-v0644-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);
// Standalone reports use the retained whole reference filenames, whereas the app bundles hashed photo URLs.
for(const species of JSON.parse(fs.readFileSync('anthozoa-review-v0644.json','utf8')).species)fs.copyFileSync(species.photograph.localFile,'dist/'+species.photograph.localFile);

for(const name of fs.readdirSync('.').filter(n=>/^(?:chrysaora-review|corrections|behavior-capabilities)-v0645\.(?:html|json)$/.test(n)||/^chrysaora-v0645-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^(?:cyanea-review|corrections|behavior-capabilities)-v0646\.(?:html|json)$/.test(n)||/^cyanea-v0646-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Individually reviewed blue whale and the human's complete iconic-specimen plan.
for(const name of fs.readdirSync('.').filter(n=>/^(?:blue-whale-review|iconic-specimens|corrections|behavior-capabilities)-v0647\.(?:html|json)$/.test(n)||/^blue-whale-v0647-.*\.jpg$/.test(n)||n==='reference-blue-whale-blowholes.jpg'||n==='photo-balaenoptera-musculus.jpg'))fs.copyFileSync(name,'dist/'+name);
fs.copyFileSync('large-animal-expansion-v0647.json','dist/large-animal-expansion-v0647.json');
for(const name of ['blue-whale-v0647-captures.zip','blue-whale-atlas.mjs','model-balaenoptera-musculus.glb'])fs.copyFileSync(name,'dist/'+name);

// Human-requested blue-whale body/fin/colour follow-up and actual comparisons.
for(const name of fs.readdirSync('.').filter(n=>/^(?:blue-whale-proportions|corrections|behavior-capabilities)-v0648\.(?:html|json)$/.test(n)||/^blue-whale-v0648-.*\.(?:jpg|zip)$/.test(n)||n==='reference-blue-whale-aerial-v0648.jpg'))fs.copyFileSync(name,'dist/'+name);

// Directly requested same-surface blue/humpback feeding studies and evidence.
for(const name of fs.readdirSync('.').filter(n=>/^(?:rorqual-feeding|corrections|behavior-capabilities)-v0649\.(?:html|json)$/.test(n)||/^rorqual-v0649-.*\.(?:jpg|zip)$/.test(n)||/^reference-rorqual-v0649-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);
fs.copyFileSync('model-megaptera-novaeangliae.glb','dist/model-megaptera-novaeangliae.glb');
fs.copyFileSync('RORQUAL-LICENSES-v0649.md','dist/RORQUAL-LICENSES-v0649.md');

// Manually requested anterior pouch, oral-edge and pleat correction evidence.
for(const name of fs.readdirSync('.').filter(n=>/^(?:rorqual-anterior|corrections|behavior-capabilities)-v0650\.(?:html|json)$/.test(n)||/^rorqual-v0650-.*\.(?:jpg|zip)$/.test(n)||/^reference-rorqual-v0650-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);
fs.copyFileSync('RORQUAL-LICENSES-v0650.md','dist/RORQUAL-LICENSES-v0650.md');

// Manually requested cetacean reconstructions; historical releases stay available.
for(const name of fs.readdirSync('.').filter(n=>/^(?:cetaceans-review|corrections|behavior-capabilities)-v0651\.(?:html|json)$/.test(n)||/^cetaceans-v0651-.*\.(?:jpg|zip|json)$/.test(n)))fs.copyFileSync(name,'dist/'+name);
fs.copyFileSync('CETACEAN-LICENSES-v0651.md','dist/CETACEAN-LICENSES-v0651.md');
for(const s of JSON.parse(fs.readFileSync('species.json','utf8')).species.filter(s=>s.review?.releasePassId==='cetacean-expansion-2026-10-28'))for(const p of[s.photograph,...(s.specimens||[]).map(v=>v.photograph)])fs.copyFileSync(p.localFile,'dist/'+p.localFile);

// Manually requested sculpted cetacean replacements and exact artist grants.
for(const name of fs.readdirSync('.').filter(n=>/^cetacean-realism-v0652.*\.(?:html|json|jpg|zip)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0652\.(?:html|json)$/.test(n)||n==='CETACEAN-SURFACE-LICENSES-v0652.md'))fs.copyFileSync(name,'dist/'+name);
for(const id of ['physeter-macrocephalus','eubalaena-australis','globicephala-macrorhynchus','kogia-breviceps','ziphius-cavirostris'])fs.copyFileSync('model-'+id+'.glb','dist/model-'+id+'.glb');
fs.copyFileSync('cetacean-realism-revisions-v0652.json','dist/cetacean-realism-revisions-v0652.json');

// v653: five existing cetacean deeper exterior and local-behavior studies.
for(const name of fs.readdirSync('.').filter(n=>/^cetacean-next-five.*v0653.*\.(?:html|json|jpg|zip)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0653\.(?:html|json)$/.test(n)||/^reference-cetacean-v0653-.*\.jpg$/.test(n)||n==='CETACEAN-NEXT-FIVE-LICENSES-v0653.md'))fs.copyFileSync(name,'dist/'+name);
fs.copyFileSync('model-monodon-monoceros.glb','dist/model-monodon-monoceros.glb');

// v654: scoped five-species anatomy, skin and exterior feeding studies.
for(const name of fs.readdirSync('.').filter(n=>/^cetacean-fine.*v0654.*\.(?:html|json|jpg|zip)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0654\.(?:html|json)$/.test(n)||/^skin-cetacean-v0654-.*\.png$/.test(n)||n==='CETACEAN-FINE-LICENSES-v0654.md'))fs.copyFileSync(name,'dist/'+name);

// User-supplied, individually reviewed fin-whale source and reconstruction.
for(const name of fs.readdirSync('.').filter(n=>/^fin-whale-.*v0655.*\.(?:html|json|jpg|png|zip|mjs)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0655\.(?:html|json)$/.test(n)||n==='FIN-WHALE-LICENSES-v0655.md'||n==='model-fin-whale-woelper.glb'))fs.copyFileSync(name,'dist/'+name);

// Original supplied Digital Life gray whale and individually reviewed studies.
for(const name of fs.readdirSync('.').filter(n=>/^gray-whale-.*v0656.*\.(?:html|json|jpg|png|zip|mjs)$/.test(n)||/^(?:corrections|behavior-capabilities)-v0656\.(?:html|json)$/.test(n)||n==='GRAY-WHALE-LICENSES-v0656.md'||n==='model-gray-whale-digitallife.glb'))fs.copyFileSync(name,'dist/'+name);
