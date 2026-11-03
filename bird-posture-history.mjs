import fs from 'node:fs';import assert from 'node:assert/strict';
import {birdAt668,birdRebuildDatabaseAt668} from './bird-rebuild-history.mjs';
const ledger=JSON.parse(fs.readFileSync(new URL('./bird-revisions-v0668.json',import.meta.url)));
export function birdAt667(record){record=birdAt668(record);const r=ledger.revisions.find(r=>r.id===record.id);if(!r||record.visual.version!=='0.6.68')return record;const s=structuredClone(record);for(const f of r.fields){assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function birdPostureDatabaseAt667(db){db=birdRebuildDatabaseAt668(db);if(db.version!=='0.6.68')return db;return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(birdAt667)};}
