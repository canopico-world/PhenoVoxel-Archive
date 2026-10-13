import fs from 'node:fs/promises';
const archive=JSON.parse(await fs.readFile('species.json','utf8'));
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&#(?:x([\da-f]+)|(\d+));/gi,(_,a,b)=>String.fromCodePoint(parseInt(a||b,a?16:10))).replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
async function json(url){const r=await fetch(url,{headers:{'User-Agent':'PhenoVoxelArchive/0.2 (open-source education; canopico-world/PhenoVoxel-Archive)'}});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json();}
const result=JSON.parse(await fs.readFile('media.json','utf8').catch(()=>'{"photos":{}}'));
Object.assign(result,{version:'0.2',retrieved:new Date().toISOString().slice(0,10),provider:'Wikimedia Commons'});
await fs.mkdir('research-cache',{recursive:true});
const wp=await json('https://en.wikipedia.org/w/api.php?'+new URLSearchParams({action:'query',titles:archive.species.map(s=>s.scientificName).join('|'),prop:'pageimages',piprop:'original',format:'json',redirects:'1'}));
await fs.writeFile('research-cache/wiki-batch.json',JSON.stringify(wp,null,2));
const pages=Object.values(wp.query.pages),redirects=new Map((wp.query.redirects||[]).map(r=>[r.from,r.to]));
const files=new Map();
for(const s of archive.species){const p=pages.find(p=>p.title===(redirects.get(s.scientificName)||s.scientificName));if(p?.original)files.set(s.id,decodeURIComponent(new URL(p.original.source).pathname.split('/').at(-1)));}
const cmBatch=await json('https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',titles:[...files.values()].map(f=>'File:'+f).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'960',format:'json'}));
await fs.writeFile('research-cache/commons-batch.json',JSON.stringify(cmBatch,null,2));
for(const s of archive.species){
 try{
  if(result.photos[s.id]?.review?.includes('visually reviewed')){console.log(s.id,'CURATOR SELECTION PRESERVED');continue;}
  const filename=files.get(s.id);
  if(!filename){console.log(s.id,'NO IMAGE');continue;}
  if(!/\.(jpe?g|png|webp)$/i.test(filename)){console.log(s.id,'NOT RASTER',filename);continue;}
  const info=Object.values(cmBatch.query?.pages||{}).find(p=>p.title==='File:'+filename.replaceAll('_',' '))?.imageinfo?.[0];
  if(!info){console.log(s.id,'NO COMMONS');continue;}
  const m=info.extmetadata,license=clean(m.LicenseShortName?.value);
  if(!/CC BY|CC0|Public domain/i.test(license)){console.log(s.id,'LICENSE',license);continue;}
  const description=clean(m.ImageDescription?.value);
  const previous=result.photos[s.id];
  if(previous&&previous.file.replaceAll('_',' ')!==filename.replaceAll('_',' ')){console.log(s.id,'CURATED FILE PRESERVED');continue;}
  result.photos[s.id]={file:filename,url:info.thumburl||info.url,original:info.url,source:info.descriptionurl,author:clean(m.Artist?.value)||'See source file',license,licenseUrl:m.LicenseUrl?.value||'https://commons.wikimedia.org/wiki/Commons:Licensing',description:description.slice(0,1200),credit:clean(m.Credit?.value).slice(0,400),mediaType:'photograph or micrograph; source description retained',review:'Source identity and photograph suitability require curator review',retrieved:result.retrieved,...(previous?.localFile?{localFile:previous.localFile}:{})};
  console.log(s.id,filename,license,description.slice(0,150));
 }catch(e){console.log(s.id,e.message);}
}
await fs.writeFile('media.json',JSON.stringify(result,null,2)+'\n');
