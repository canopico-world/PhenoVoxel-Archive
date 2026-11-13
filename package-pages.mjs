import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const PAGE_BUDGET=950_000_000;
export function archiveUrl(value, files) {
  const bare=value.split(/[?#]/)[0];
  const name=bare.replace(/^https:\/\/(?:www\.)?canopico\.tech\/phenovoxel\//,'').replace(/^\.\//,'');
  return files[name]?.url||value;
}
export function rewriteArchiveLinks(html, files) {
  return html.replace(/\b(href|src|poster)\s*=\s*(["'])([^"']*)\2/gi,
    (all,attr,quote,value)=>`${attr}=${quote}${archiveUrl(value,files)}${quote}`);
}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}

export function packagePages({root=process.cwd(),budget=PAGE_BUDGET}={}) {
  const dist=path.resolve(root,'dist');
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'archive-delivery-v0708.json'),'utf8'));
  const modelFiles=JSON.parse(fs.readFileSync(path.join(root,'model-delivery-v0708.json'),'utf8')).files;
  if(!/^[a-f0-9]{40}$/.test(manifest.sourceCommit))throw Error('Archive requires an immutable commit');
  const targets=[];
  // Validate every source and output before removing any generated copy.
  for(const [name,entry] of Object.entries(manifest.files)){
    const commit=entry.sourceCommit||manifest.sourceCommit;
    if(!/^[a-f0-9]{40}$/.test(commit))throw Error("Archive requires an immutable entry commit");
    const base=`https://raw.githubusercontent.com/canopico-world/PhenoVoxel-Archive/${commit}/`;
    if(!/^[A-Za-z0-9_.-]+\.(?:glb|zip|blend|jpg|png)$/.test(name)||entry.url!==base+name)throw Error('Unsafe archive entry: '+name);
    const target=path.resolve(dist,name);
    if(path.dirname(target)!==dist)throw Error('Archive target outside dist');
    const source=fs.readFileSync(path.join(root,name));
    if(source.length!==entry.bytes||hash(source)!==entry.sha256)throw Error('Archived source changed; update pinned provenance: '+name);
    if(fs.existsSync(target)){
      const output=fs.readFileSync(target);
      if(hash(output)!==entry.sha256)throw Error('Generated archive copy differs: '+name);
      targets.push(target);
    }
  }
  for(const [name,entry] of Object.entries(modelFiles)){
    if(JSON.stringify(entry)!==JSON.stringify(manifest.files[name]))throw Error('Runtime archive mismatch: '+name);
    const bytes=fs.readFileSync(path.join(root,name));
    const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
    if([...(gltf.buffers||[]),...(gltf.images||[])].some(x=>x.uri&&!x.uri.startsWith('data:')))throw Error('External GLB dependencies need an explicit delivery plan: '+name);
  }
  for(const file of walk(dist).filter(f=>f.endsWith('.html'))){
    const original=fs.readFileSync(file,'utf8');
    const updated=rewriteArchiveLinks(original,manifest.files);
    if(updated!==original)fs.writeFileSync(file,updated);
  }
  for(const target of targets)fs.unlinkSync(target); // Only verified, regenerable dist copies.
  fs.copyFileSync(path.join(root,'archive-delivery-v0708.json'),path.join(dist,'archive-delivery-v0708.json'));
  const links=Object.entries(manifest.files).map(([name,e])=>`<li><a href="${escape(e.url)}">${escape(name)}</a> <small>${(e.bytes/1048576).toFixed(2)} MiB</small></li>`).join('\n');
  fs.writeFileSync(path.join(dist,'asset-archive.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PhenoVoxel source asset library</title><style>body{max-width:60rem;margin:2rem auto;padding:0 1rem;background:#102126;color:#e9efe5;font:16px system-ui}a{color:#c5dcb1;overflow-wrap:anywhere}li{margin:.8rem 0}input{font:inherit;padding:.7rem;width:90%}small{color:#adbbb8}</style><h1>Source asset library</h1><p>Unmodified, versioned files from the public PhenoVoxel repository. Source credits and individual licences remain applicable. Large files download on demand.</p><p><a href="./">Return to the collection</a> · <a href="archive-delivery-v0708.json">File hashes and provenance</a></p><label>Find a file <input type="search" id="find"></label><ul>${links}</ul><script>document.querySelector('#find').addEventListener('input',e=>{for(const row of document.querySelectorAll('li'))row.hidden=!row.textContent.toLowerCase().includes(e.target.value.toLowerCase());});</script></html>`);
  // Preserve browser navigation to old binary download URLs. No arbitrary redirect destinations.
  const destinations=JSON.stringify(Object.fromEntries(Object.entries(manifest.files).map(([n,e])=>[n,e.url])));
  fs.writeFileSync(path.join(dist,'404.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PhenoVoxel file lookup</title><h1>PhenoVoxel file lookup</h1><p id="status">This page is unavailable. <a href="asset-archive.html">Browse the source asset library.</a></p><script>const files=${destinations};const name=decodeURIComponent(location.pathname.split('/').pop());if(Object.hasOwn(files,name)){document.querySelector('#status').textContent='Opening the preserved source file…';location.replace(files[name]);}</script></html>`);
  const bytes=walk(dist).reduce((sum,f)=>sum+fs.statSync(f).size,0);
  const report={version:'0.7.19',bytes,budget,archivedCopies:targets.length,sourceCommit:manifest.sourceCommit,sourceFilesPreserved:true,externalModelCount:Object.keys(modelFiles).length};
  fs.writeFileSync(path.join(dist,'deployment-size.json'),JSON.stringify(report,null,2));
  if(bytes+10000>budget)throw Error(`Pages output ${bytes} bytes exceeds ${budget} byte budget. Do not deploy.`);
  console.log(JSON.stringify(report));
  return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))packagePages();
