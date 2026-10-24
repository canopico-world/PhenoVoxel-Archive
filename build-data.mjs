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
