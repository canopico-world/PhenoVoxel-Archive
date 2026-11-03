import fs from'node:fs';import assert from'node:assert/strict';
import {birdAt666} from './bird-history.mjs';
const ledger=JSON.parse(fs.readFileSync(new URL('./whale-shark-revisions-v0666.json',import.meta.url)));
export function whaleSharkAt665(record){record=birdAt666(record);const r=ledger.revisions.find(r=>r.id===record.id);if(!r)return record;const s=structuredClone(record);for(const f of r.fields){assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function whaleSharkDatabaseAt665(db){return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(whaleSharkAt665)};}
