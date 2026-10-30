import {dolphinAt661} from './dolphin-history.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./narwhal-revisions-v0661.json',import.meta.url)));
export function narwhalAt660(record){
 record=dolphinAt661(record);
 if(record.id!=='monodon-monoceros')return record;const s=structuredClone(record),r=ledger.revisions[0];
 for(const f of r.fields){assert(['visual','review','behaviors','sources','anatomy','modelAsset','measurements','specimens','specimenConceptNote','summary'].includes(f.path));assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;
}
