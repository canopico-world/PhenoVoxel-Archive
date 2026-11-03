import fs from 'node:fs';import assert from 'node:assert/strict';
import {fishAt670,fishDatabaseAt670} from './fish-history.mjs';
const ledger=JSON.parse(fs.readFileSync(new URL('./penguin-revisions-v0670.json',import.meta.url)));
export function penguinAt669(record){record=fishAt670(record);const r=ledger.revisions.find(r=>r.id===record.id);if(!r||record.visual.version!=='0.6.70')return record;const s=structuredClone(record);for(const f of r.fields){assert.deepEqual(s[f.path],f.after);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function penguinDatabaseAt669(db){db=fishDatabaseAt670(db);if(db.version!=='0.6.70')return db;return {...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(penguinAt669)};}
