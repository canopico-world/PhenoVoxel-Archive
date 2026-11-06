import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./risso-revisions-v0680.json',import.meta.url)));
export function rissoAt679(record){if(record.id!=='grampus-griseus'||record.visual.version!=='0.6.80')return record;const s=structuredClone(record);for(const f of ledger.fields){if(f.existedAfter)assert.deepEqual(s[f.path],f.after,'Undocumented Risso face revision '+f.path);else assert.equal(Object.hasOwn(s,f.path),false);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function rissoDatabaseAt679(db){if(db.version!=='0.6.80')return db;return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(rissoAt679)};}
