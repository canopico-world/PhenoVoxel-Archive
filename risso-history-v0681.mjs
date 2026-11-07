import {digitalLifeDatabaseAt681} from './digitallife-history-v0682.mjs';
import {movementRecordAt684} from './movement-record-history.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync(new URL('./risso-revisions-v0681.json',import.meta.url)));
export function rissoAt680(record){record=movementRecordAt684(record);if(record.id!=='grampus-griseus'||record.visual.version!=='0.6.81')return record;const s=structuredClone(record);for(const f of ledger.fields){assert.deepEqual(s[f.path],f.after,'Undocumented Risso chin correction '+f.path);if(f.existedBefore)s[f.path]=structuredClone(f.before);else delete s[f.path];}return s;}
export function rissoDatabaseAt680(db){db=digitalLifeDatabaseAt681(db);if(db.version!=='0.6.81')return db;return{...db,version:ledger.baseVersion,updated:ledger.baseUpdated,species:db.species.map(rissoAt680)};}
