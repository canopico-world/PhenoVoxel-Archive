import fs from 'node:fs';import assert from 'node:assert/strict';
const adult=JSON.parse(fs.readFileSync(new URL('./beluga-revisions-v0660.json',import.meta.url)));
export function belugaAt659(record){
 if(record.id!=='delphinapterus-leucas')return record;const s=structuredClone(record),r=adult.revisions.find(r=>r.id===s.id);
 for(const f of r.fields){assert(['visual','review','modelAsset'].includes(f.path));assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;
}
const realism=JSON.parse(fs.readFileSync(new URL('./beluga-revisions-v0659.json',import.meta.url)));
export function belugaAt658(record){
 record=belugaAt659(record);
 if(record.id!=='delphinapterus-leucas')return record;const s=structuredClone(record),r=realism.revisions.find(r=>r.id===s.id);
 for(const f of r.fields){assert(['visual','review','modelAsset'].includes(f.path));assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;
}
const ledger=JSON.parse(fs.readFileSync(new URL('./beluga-revisions-v0658.json',import.meta.url)));
export function belugaAt657(record){
 record=belugaAt658(record);
 if(record.id!=='delphinapterus-leucas')return record;const s=structuredClone(record),r=ledger.revisions.find(r=>r.id===s.id);
 for(const f of r.fields){assert(['visual','review','sources','behaviors','anatomy','modelAsset','measurements'].includes(f.path));assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;
}
