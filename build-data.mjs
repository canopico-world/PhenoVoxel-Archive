import fs from 'node:fs';
// Keep source-linked data/decisions available beside both deployment targets.
for(const name of ['species.json','schema.json','taxonomy-audit.json','species-revisions.json','model-assets.json','LICENSE','LICENSE-DATA.md','ASSET-LICENSES.md','review-2026-10-24.html','review-2026-10-24.json','review-2026-10-24-helianthus-annuus.png','review-2026-10-24-arabidopsis-thaliana.png','review-2026-10-24-haliotis-rufescens.png','review-2026-10-24-haliotis-tuberculata.png'])fs.copyFileSync(name,'dist/'+name);

// Final scheduled review and actual screenshot sheets; rejected drafts are excluded.
for(const name of fs.readdirSync('.').filter(n=>/^final-review-2026-10-24\.(html|json)$/.test(n)||/^final-2026-10-24-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

// Individual corrected draft, with retained historical review beside it.
for(const name of fs.readdirSync('.').filter(n=>/^crab-review-2026-10-24\.(html|json)$/.test(n)||/^crab-2026-10-24-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);

for(const name of fs.readdirSync('.').filter(n=>/^shore-crab-review-2026-10-24\.(html|json)$/.test(n)||/^shore-crab-2026-10-24-.*\.jpg$/.test(n)))fs.copyFileSync(name,'dist/'+name);
