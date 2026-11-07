import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const ledger=JSON.parse(fs.readFileSync(new URL('./digitallife-revisions-v0684.json',import.meta.url))),sha=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
export function digitalLifeDatabaseAt683(db){
 if(db.version!=='0.6.84')return db;
 const added=db.species.filter(s=>ledger.addedIds.includes(s.id));assert.deepEqual(added.map(s=>s.id),ledger.addedIds);assert.equal(sha(added),ledger.addedRecordsSha256,'Undocumented second DigitalLife batch change');
 const prior={...db,...ledger.baseHeader,species:db.species.filter(s=>!ledger.addedIds.includes(s.id))};assert.equal(sha(prior),ledger.parentDatabaseJsonSha256,'A pre-existing species changed');return prior;
}
