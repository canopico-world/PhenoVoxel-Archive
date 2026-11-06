import fs from 'node:fs';import assert from 'node:assert/strict';
import {rissoAt679,rissoDatabaseAt679} from './risso-history-v0680.mjs';
const ledger=JSON.parse(fs.readFileSync(new URL('./risso-revisions-v0679.json',import.meta.url)));
export function rissoAt678(record){record=rissoAt679(record);if(record.id!=='grampus-griseus'||record.visual.version!=='0.6.79')return record;const s=structuredClone(record);for(const f of ledger.fields){assert.deepEqual(s[f.path],f.after,'Undocumented Risso revision '+f.path);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function rissoDatabaseAt678(db){db=rissoDatabaseAt679(db);if(db.version!=='0.6.79')return db;return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(rissoAt678)};}
