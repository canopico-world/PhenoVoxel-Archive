import {herpAt673,herpDatabaseAt673} from './herp-history.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./mammals-revisions-v0673.json',import.meta.url)));
export function mammalAt672(record){record=herpAt673(record);const revision=ledger.revisions.find(r=>r.id===record.id);if(!revision||record.visual.version!=='0.6.73')return record;const s=structuredClone(record);for(const f of revision.fields){assert.deepEqual(s[f.path],f.after,'Undocumented mammal change: '+s.id+'/'+f.path);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function mammalDatabaseAt672(db){db=herpDatabaseAt673(db);if(db.version!=='0.6.73')return db;return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(mammalAt672)};}
