import {digitalLifeDatabaseAt683} from './digitallife-history-v0684.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const ledger=JSON.parse(fs.readFileSync(new URL('./digitallife-revisions-v0682.json',import.meta.url))),sha=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
export function digitalLifeDatabaseAt681(db){db=digitalLifeDatabaseAt683(db);
 if(db.version!=='0.6.82')return db;
 const added=db.species.filter(s=>ledger.addedIds.includes(s.id));assert.deepEqual(added.map(s=>s.id),ledger.addedIds);assert.equal(sha(added),ledger.addedRecordsSha256,'Undocumented DigitalLife record change');
 const prior={...db,...ledger.baseHeader,species:db.species.filter(s=>!ledger.addedIds.includes(s.id))};assert.equal(sha(prior),ledger.parentDatabaseJsonSha256,'A pre-existing record changed');return prior;
}
