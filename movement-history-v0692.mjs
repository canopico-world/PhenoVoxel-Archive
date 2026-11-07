import {movementDatabaseAt692} from './movement-history-v0693.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const ledger=JSON.parse(fs.readFileSync(new URL('./movement-revisions-v0692.json',import.meta.url))),sha=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
export function movementDatabaseAt691(db){
 db=movementDatabaseAt692(db);
 if(db.version!=='0.6.92')return db;
 const changes=new Map(ledger.changes.map(c=>[c.id,c]));
 const species=db.species.map(s=>{const c=changes.get(s.id);if(!c)return s;assert.equal(sha(s),c.afterSha256,'Undocumented eagle head-turn change: '+s.id);return c.before;});
 const prior={...db,...ledger.baseHeader,species};assert.equal(sha(prior),ledger.parentDatabaseJsonSha256,'An unrelated record changed during standing eagle work');return prior;
}
