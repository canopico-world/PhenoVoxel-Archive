import {organismAt671,organismDatabaseAt671} from './organism-history.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./fish-revisions-v0671.json',import.meta.url)));
export function fishAt670(record){record=organismAt671(record);const r=ledger.revisions.find(r=>r.id===record.id);if(!r||record.visual.version!=='0.6.71')return record;const s=structuredClone(record);for(const f of r.fields){assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function fishDatabaseAt670(db){db=organismDatabaseAt671(db);if(db.version!=='0.6.71')return db;for(const id of ledger.addedIds)assert.equal(db.species.filter(s=>s.id===id).length,1);return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.filter(s=>!ledger.addedIds.includes(s.id)).map(fishAt670)};}
