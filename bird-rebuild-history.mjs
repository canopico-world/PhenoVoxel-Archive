import fs from'node:fs';import assert from'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./bird-revisions-v0669.json',import.meta.url)));
export function birdAt668(record){const r=ledger.revisions.find(r=>r.id===record.id);if(!r||record.visual.version!=='0.6.69')return record;const s=structuredClone(record);for(const f of r.fields){assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function birdRebuildDatabaseAt668(db){if(db.version!=='0.6.69')return db;return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(birdAt668)};}
