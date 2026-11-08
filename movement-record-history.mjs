import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const ledgers=['06104','06102','06101','06100','0699','0698','0696','0695','0694','0693','0692','0691','0690','0689','0688','0687','0686','0685'].map(v=>JSON.parse(fs.readFileSync(new URL('./movement-revisions-v'+v+'.json',import.meta.url))));
const sha=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
// Older preservation checks accept individual records rather than a database.
// Unwind only an explicitly versioned, byte-verified movement revision; never
// ignore a changed field or replace an unrecognized record with its baseline.
export function movementRecordAt684(record){
 for(const ledger of ledgers){if(record.review?.movementStudyVersion!==ledger.version)continue;const revision=ledger.changes.find(c=>c.id===record.id);assert(revision,'Missing documented movement revision: '+record.id);assert.equal(sha(record),revision.afterSha256,'Undocumented movement record change: '+record.id);record=structuredClone(revision.before);}
 return record;
}
