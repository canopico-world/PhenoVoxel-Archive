import {fishDatabaseAt670} from './fish-history.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
import {whaleSharkAt665} from './whale-shark-history.mjs';
const ledger=JSON.parse(fs.readFileSync(new URL('./bowhead-revisions-v0665.json',import.meta.url)));
export function bowheadAt664(record){record=whaleSharkAt665(record);const r=ledger.revisions.find(r=>r.id===record.id);if(!r)return record;const s=structuredClone(record);for(const f of r.fields){assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function bowheadDatabaseAt664(db){db=fishDatabaseAt670(db);return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(bowheadAt664)};}
