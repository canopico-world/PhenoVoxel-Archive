import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./right-whale-revisions-v0664.json',import.meta.url)));
export function rightWhalesAt663(record){
 const r=ledger.revisions.find(r=>r.id===record.id);if(!r)return record;
 const s=structuredClone(record);
 for(const f of r.fields){assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}
 return s;
}
export function rightWhalesDatabaseAt663(db){return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(rightWhalesAt663)};}
