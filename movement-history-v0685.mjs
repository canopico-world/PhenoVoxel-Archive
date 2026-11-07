import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const ledger=JSON.parse(fs.readFileSync(new URL('./movement-revisions-v0685.json',import.meta.url))),sha=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
export function movementDatabaseAt684(db){
 if(db.version!=='0.6.85')return db;
 const originals=new Map(ledger.changes.map(c=>[c.id,c]));
 const species=db.species.map(s=>{const c=originals.get(s.id);if(!c)return s;assert.equal(sha(s),c.afterSha256,'Undocumented movement record change: '+s.id);return c.before;});
 const prior={...db,...ledger.baseHeader,species};assert.equal(sha(prior),ledger.parentDatabaseJsonSha256,'An unrelated record changed during movement work');return prior;
}
