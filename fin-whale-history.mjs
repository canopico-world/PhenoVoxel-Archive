import fs from 'node:fs';
import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./fin-whale-revisions-v0655.json',import.meta.url),'utf8'));
// Audited reversal for historical exact-object/hash contracts. Original
// fixtures/hashes are retained, rather than regenerated from current records.
export function finAt654(s){const old=structuredClone(s),r=ledger.revisions.find(r=>r.id===s.id);if(r)for(const f of r.fields){assert.deepEqual(s[f.path],f.after);if(f.existedBefore)old[f.path]=f.before;else delete old[f.path];}return old;}
