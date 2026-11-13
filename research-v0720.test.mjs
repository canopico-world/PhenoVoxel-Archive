import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseResults,selectRows,range} from './research-study-v0720.js';
const text=fs.readFileSync('research-connectome-v0720.csv','utf8'),rows=parseResults(text),result=JSON.parse(fs.readFileSync('research-connectome-v0720.json','utf8'));
test('public result grid is complete and selectable without silently dropping a cell',()=>{
 assert.equal(rows.length,144);
 for(const e of ['fl','T1'])for(const route of ['direct','allIN','T1IN']){const r=selectRows(rows,e,route);assert.equal(r.length,24);for(const n of ['DNa02_R','DNa02_L','DNg13_R','DNg13_L'])assert.deepEqual(r.filter(x=>x.source===n).map(x=>x.threshold),[1,5,10,15,20,50]);}
});
test('downloaded numerical summaries match browser data and preserve fixed-denominator retention',()=>{
 const names={10360:'DNa02_R',523769:'DNa02_L',11074:'DNg13_L',512006:'DNg13_R'};
 for(const p of result.primary){const r=rows.find(r=>r.source===names[p.source]&&r.endpoint==='fl'&&r.route==='allIN'&&r.threshold===10);for(const k of ['mass','li','retention','top_share','deleted_li'])assert.ok(Math.abs(p[k]-r[k])<1e-8,k);}
 for(const e of ['fl','T1'])for(const route of ['direct','allIN','T1IN'])for(const n of Object.values(names)){const r=selectRows(rows,e,route).filter(x=>x.source===n);r.forEach((x,i)=>{assert.ok(Math.abs(x.retention-x.mass/r[0].mass)<1e-7);if(i){assert.ok(x.mass<=r[i-1].mass);assert.ok(x.ipsi_reached+x.contra_reached<=r[i-1].ipsi_reached+r[i-1].contra_reached);}});}
});
test('missing routes remain unavailable and malformed or duplicate numerical rows fail',()=>{
 const header=text.split(/\r?\n/)[0];const empty='10360,fl,direct,1,0,,,,0,0,0,0,0,,,,,';
 const r=parseResults(header+'\n'+empty);assert.equal(r[0].li,null);assert.equal(range(r),null);
 assert.throws(()=>parseResults(text.trim()+'\n'+text.trim().split(/\r?\n/)[1]),/Duplicate/);
 assert.throws(()=>parseResults(header+'\n'+empty.replace(',0,,,,',',0,0,,,')),/unavailable/);
 assert.throws(()=>parseResults(header+'\n'+empty.replace(',0,,,,',',NaN,,,,')),/numeric/);
});
test('research files have matching code and plan hashes; credit and review scope are explicit',()=>{
 const hash=n=>crypto.createHash('sha256').update(fs.readFileSync(n)).digest('hex');
 assert.equal(hash('research-connectome-v0720.py'),result.code_sha256);assert.equal(hash('research-plan-v0720.json'),result.plan_sha256);assert.equal(result.animals,1);
 const article=fs.readFileSync('research-study-v0720.html','utf8');assert.match(article,/PhenoVoxel project supervisor/);assert.match(article,/EXTERNAL REVIEW PENDING/);assert.match(article,/not preregistration/);assert.match(article,/No population 95%/);
});
test('journal and article local assets exist and research result links are published-ready',()=>{
 const data=JSON.parse(fs.readFileSync('research-news-data.json','utf8'));assert.ok(data.entries.some(e=>e.category==='research'&&e.url==='./research-study-v0720.html'));
 for(const n of ['research-news.html','research-study-v0720.html']){const html=fs.readFileSync(n,'utf8');for(const m of html.matchAll(/(?:src|href)="\.\/([^"#]+)(?:#[^"]*)?"/g)){const file=m[1];if(file&&!file.endsWith('/'))assert.ok(fs.existsSync(file),`${n}: ${file}`);}}
});

