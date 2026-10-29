import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./beluga-revisions-v0658.json',import.meta.url)));
export function belugaAt657(record){
 if(record.id!=='delphinapterus-leucas')return record;const s=structuredClone(record),r=ledger.revisions.find(r=>r.id===s.id);
 for(const f of r.fields){assert(['visual','review','sources','behaviors','anatomy','modelAsset','measurements'].includes(f.path));assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;
}
