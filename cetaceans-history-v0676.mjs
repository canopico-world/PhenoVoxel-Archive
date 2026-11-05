import {cetaceanAt676,cetaceanDatabaseAt676} from './cetaceans-history-v0677.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./cetaceans-revisions-v0676.json',import.meta.url)));
export function cetaceanAt675(record){record=cetaceanAt676(record);const revision=ledger.revisions.find(r=>r.id===record.id);if(!revision||record.visual.version!=='0.6.76')return record;const s=structuredClone(record);for(const f of revision.fields){assert.deepEqual(s[f.path],f.after,'Undocumented v676 cetacean change: '+s.id+'/'+f.path);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function cetaceanDatabaseAt675(db){db=cetaceanDatabaseAt676(db);if(db.version!=='0.6.76')return db;return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(cetaceanAt675)};}
