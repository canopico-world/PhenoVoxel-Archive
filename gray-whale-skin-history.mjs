import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./gray-whale-revisions-v0657.json',import.meta.url)));
export function grayAt656(record){
 if(record.id!=='eschrichtius-robustus')return record;const s=structuredClone(record),r=ledger.revisions.find(r=>r.id===s.id);
 for(const f of r.fields){assert(['visual','review','sources','behaviors','anatomy','modelAsset'].includes(f.path));assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;
}
