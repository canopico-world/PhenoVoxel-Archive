import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./dolphin-revisions-v0663.json',import.meta.url)));
export function dolphinAt662(record){
 if(record.id!=='delphinus-delphis'||record.visual?.version!=='0.6.63')return record;
 const s=structuredClone(record);
 for(const f of ledger.revisions[0].fields){assert(['visual','review','modelAsset'].includes(f.path));assert.deepEqual(s[f.path],f.after);s[f.path]=structuredClone(f.before);}return s;
}
