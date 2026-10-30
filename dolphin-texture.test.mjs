import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';import sharp from 'sharp';import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import{dolphinAt662}from'./dolphin-texture-history.mjs';
const json=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url),'utf8'));
async function geometry(name){const b=fs.readFileSync(new URL(name,import.meta.url)),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');const meshes=[];g.scene.traverse(o=>{if(o.isMesh)meshes.push(o.geometry);});return meshes;}
test('texture remapping preserves every ordered source-derived face position and normal',async()=>{
 const a=await geometry('./model-dolphin-supplied-v0662.glb'),b=await geometry('./model-dolphin-supplied-v0663.glb');assert.equal(a.length,b.length);for(let k=0;k<a.length;k++){assert.equal(a[k].index.count,b[k].index.count);for(const name of['position','normal']){const p=a[k].attributes[name],q=b[k].attributes[name];for(let i=0;i<a[k].index.count;i++){const ai=a[k].index.getX(i),bi=b[k].index.getX(i);for(let j=0;j<3;j++)assert.equal(p.array[ai*3+j],q.array[bi*3+j]);}}}a.concat(b).forEach(g=>g.dispose());
});
test('texture record reversal is strict and restores the exact audited 662 asset',()=>{
 const s=json('./species.json').species.find(s=>s.id==='delphinus-delphis'),old=dolphinAt662(s);assert.equal(old.visual.version,'0.6.62');assert.deepEqual(old.modelAsset,json('./dolphin-asset-v0662.json'));const changed=structuredClone(s);changed.modelAsset.bytes++;assert.throws(()=>dolphinAt662(changed));
});
test('texture maps provide lossless full-resolution pigment and bounded smooth wet-skin parameters',async()=>{
 const m=json('./dolphin-material-v0663.json');assert.equal(m.generatedImageModelUsed,false);assert.equal(m.paidCreditsSpent,0);assert.match(m.method,/non-periodic/);assert(m.clearcoat<=.25&&m.clearcoatRoughness>=.25&&m.normalScale<=.1);assert.deepEqual(m.maps[0].dimensions,[4096,4096]);assert(m.charts.length>10);const albedo=await sharp(new URL('./dolphin-albedo-v0663.png',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')).metadata();assert.equal(albedo.format,'png');
});
test('coincident skin-chart edges retain continuous pigment under bilinear close-up sampling',async()=>{
 const [g]=await geometry('./model-dolphin-supplied-v0663.glb'),p=g.attributes.position,uv=g.attributes.uv,{data,info}=await sharp(fs.readFileSync(new URL('./dolphin-albedo-v0663.png',import.meta.url))).removeAlpha().raw().toBuffer({resolveWithObject:true}),groups=new Map();
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
 const sample=i=>{const x=Math.max(0,Math.min(info.width-1,uv.getX(i)*info.width-.5)),y=Math.max(0,Math.min(info.height-1,uv.getY(i)*info.height-.5)),xx=Math.floor(x),yy=Math.floor(y),fx=x-xx,fy=y-yy,out=[0,0,0];for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const at=(Math.min(info.height-1,yy+dy)*info.width+Math.min(info.width-1,xx+dx))*3,w=(dx?fx:1-fx)*(dy?fy:1-fy);for(let k=0;k<3;k++)out[k]+=data[at+k]*w/255;}return out;},deltas=[];
 for(const ids of groups.values()){if(ids.length<2)continue;const colors=ids.map(sample);for(let j=1;j<ids.length;j++)deltas.push(Math.max(...colors[j].map((v,k)=>Math.abs(v-colors[0][k]))));}deltas.sort((a,b)=>a-b);assert(deltas.length>1000);assert(deltas[Math.floor(deltas.length*.95)]<.012);assert(deltas.at(-1)<.12);g.dispose();
});
