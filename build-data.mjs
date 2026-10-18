import fs from 'node:fs';
// Keep source-linked data/decisions available beside both deployment targets.
for(const name of ['species.json','schema.json','taxonomy-audit.json','species-revisions.json','model-assets.json','LICENSE','LICENSE-DATA.md','ASSET-LICENSES.md'])fs.copyFileSync(name,'dist/'+name);
