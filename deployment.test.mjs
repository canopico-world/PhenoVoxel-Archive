import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readDeliveredModel} from './model-delivery.js';
import {archiveUrl,rewriteArchiveLinks,packagePages} from './package-pages.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const payload=Buffer.from('unchanged model bytes');
const expected={bytes:payload.length,sha256:sha(payload)};
const options={fetchImpl:async()=>new Response(payload),subtle:crypto.webcrypto.subtle};
test('remote delivery returns byte-identical verified model bytes',async()=>{
  assert.deepEqual(Buffer.from(await readDeliveredModel('https://example.test/model',expected,options)),payload);
});
test('remote delivery rejects errors, truncation and same-length corruption',async()=>{
  await assert.rejects(readDeliveredModel('',expected,{...options,fetchImpl:async()=>new Response('',{status:503})}),/503/);
  await assert.rejects(readDeliveredModel('',{...expected,bytes:999},options),/incomplete/);
  await assert.rejects(readDeliveredModel('',{...expected,sha256:'0'.repeat(64)},options),/verification failed/);
});
test('archive rewriting changes only explicit local asset links',()=>{
  const files={'past.jpg':{url:'https://example.test/immutable/past.jpg'}};
  assert.equal(archiveUrl('https://other.test/past.jpg',files),'https://other.test/past.jpg');
  assert.equal(archiveUrl('./past.jpg',files),files['past.jpg'].url);
  assert.equal(rewriteArchiveLinks('<img src="past.jpg"><a href="./past.jpg">past.jpg</a><script>const localFile="past.jpg";</script>',files),'<img src="https://example.test/immutable/past.jpg"><a href="https://example.test/immutable/past.jpg">past.jpg</a><script>const localFile="past.jpg";</script>');
});
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'phenovoxel-pages-test-'));
  fs.mkdirSync(path.join(root,'dist'));
  const commit='a'.repeat(40),name='past.jpg',entry={url:`https://raw.githubusercontent.com/canopico-world/PhenoVoxel-Archive/${commit}/${name}`,bytes:payload.length,sha256:sha(payload)};
  fs.writeFileSync(path.join(root,name),payload);fs.writeFileSync(path.join(root,'dist',name),payload);
  fs.writeFileSync(path.join(root,'dist','index.html'),'<img src="past.jpg">');
  fs.writeFileSync(path.join(root,'dist','live.glb'),'preserve current asset');
  fs.writeFileSync(path.join(root,'archive-delivery-v0708.json'),JSON.stringify({sourceCommit:commit,files:{[name]:entry}}));
  fs.writeFileSync(path.join(root,'model-delivery-v0708.json'),JSON.stringify({files:{}}));
  return root;
}
test('packaging preserves originals and current assets, rewrites reports and enforces budget',()=>{
  const root=fixture();try{
    const result=packagePages({root});assert.equal(result.archivedCopies,1);
    assert.deepEqual(fs.readFileSync(path.join(root,'past.jpg')),payload);
    assert.equal(fs.readFileSync(path.join(root,'dist','live.glb'),'utf8'),'preserve current asset');
    assert.equal(fs.existsSync(path.join(root,'dist','past.jpg')),false);
    assert.match(fs.readFileSync(path.join(root,'dist','index.html'),'utf8'),/raw\.githubusercontent/);
    assert.throws(()=>packagePages({root,budget:1}),/exceeds/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('packaging refuses changed archive sources before removing output copies',()=>{
  const root=fixture();try{
    fs.writeFileSync(path.join(root,'past.jpg'),'changed');
    assert.throws(()=>packagePages({root}),/source changed/);
    assert.equal(fs.existsSync(path.join(root,'dist','past.jpg')),true);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
