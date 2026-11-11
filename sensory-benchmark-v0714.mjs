// Portable research source bundle for the owner-browser publication workflow.
// The plain-text JSON preserves code, data, exact paths and per-file checksums.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
export function readBenchmarkBundle(){
 const bundle=JSON.parse(fs.readFileSync(path.join(root,'sensory-benchmark-v0714.json'),'utf8'));
 if(bundle.id!=='PV-SENSE-001'||bundle.version!=='1.0'||!Array.isArray(bundle.files))throw Error('Invalid benchmark bundle');
 const seen=new Set();
 return bundle.files.map(f=>{
  if(!/^[a-zA-Z0-9_./-]+$/.test(f.path)||f.path.startsWith('/')||f.path.split('/').some(p=>p==='..'||p===''||p==='.')||seen.has(f.path))throw Error('Unsafe or duplicate benchmark path');
  seen.add(f.path);if(!['utf8','base64'].includes(f.encoding))throw Error('Unknown encoding');
  const bytes=Buffer.from(f.content,f.encoding);
  if(bytes.length!==f.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==f.sha256)throw Error('Research checksum mismatch: '+f.path);
  return {path:f.path,bytes};
 });
}
export function writeBenchmark(destination){
 const dest=path.resolve(destination),files=readBenchmarkBundle();
 for(const file of files){const target=path.resolve(dest,file.path);if(!target.startsWith(dest+path.sep))throw Error('Outside benchmark destination');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file.bytes);}
 console.log(`PV-SENSE-001: ${files.length} verified research files published`);
 return files.length;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))writeBenchmark(process.argv[2]||path.join(root,'public/research/sensory-benchmark-v1'));
