import fs from 'node:fs';import assert from 'node:assert/strict';import{dolphinAt662}from'./dolphin-texture-history.mjs';
import {rightWhalesAt663} from './right-whale-history.mjs';
const ledger=JSON.parse(fs.readFileSync(new URL('./dolphin-revisions-v0662.json',import.meta.url)));
export function dolphinAt661(record){
 record=rightWhalesAt663(record);
 if(record.id!=='delphinus-delphis')return record;const s=structuredClone(dolphinAt662(record)),r=ledger.revisions[0];
 for(const f of r.fields){assert(['summary','visual','review','behaviors','sources','anatomy','modelAsset'].includes(f.path));assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;
}
