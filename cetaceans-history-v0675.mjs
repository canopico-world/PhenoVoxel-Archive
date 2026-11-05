import {cetaceanAt675,cetaceanDatabaseAt675} from './cetaceans-history-v0676.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./cetaceans-revisions-v0675.json',import.meta.url)));
export function cet16At674(record){record=cetaceanAt675(record);const revision=ledger.revisions.find(r=>r.id===record.id);if(!revision||record.visual.version!=='0.6.75')return record;const s=structuredClone(record);for(const f of revision.fields){assert.deepEqual(s[f.path],f.after,'Undocumented cetacean change: '+s.id+'/'+f.path);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function cet16DatabaseAt674(db){db=cetaceanDatabaseAt675(db);if(db.version!=='0.6.75')return db;return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(cet16At674)};}
