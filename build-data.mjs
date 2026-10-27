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
