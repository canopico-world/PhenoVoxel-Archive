import fs from'node:fs';import assert from'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./cetaceans-revisions-v0678.json',import.meta.url)));
export function cetaceanAt677(record){const rev=ledger.revisions.find(r=>r.id===record.id);if(!rev||record.visual.version!=='0.6.78')return record;const s=structuredClone(record);for(const f of rev.fields){assert.deepEqual(s[f.path],f.after,'Undocumented v678 change '+s.id+'/'+f.path);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function cetaceanDatabaseAt677(db){if(db.version!=='0.6.78')return db;return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(cetaceanAt677)};}
