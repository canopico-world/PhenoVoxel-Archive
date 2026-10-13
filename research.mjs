import { readFile, writeFile, mkdir } from 'node:fs/promises';
const archive=JSON.parse(await readFile('species.json','utf8'));
await mkdir('research-cache',{recursive:true});
let next=0; const audit=[];
async function worker(){
 while(next<archive.species.length){
  const s=archive.species[next++]; const entry={id:s.id};
  try{
   const r=await fetch(s.sources[0].url,{signal:AbortSignal.timeout(25000)});
   entry.httpStatus=r.status;
   const html=await r.text();
   const text=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
   await writeFile(`research-cache/${s.id}.txt`,text);
   entry.title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||'PDF or untitled document';
   entry.readable=r.status===200&&text.length>400&&!/captcha|checking your browser|just a moment/i.test(entry.title);
   s.sources[0].retrieval={httpStatus:r.status,checked:'2026-10-13'};
  }catch(e){entry.sourceError=e.message;}
  try{
   const r=await fetch(`https://api.gbif.org/v1/species/match?strict=true&name=${encodeURIComponent(s.scientificName)}`,{signal:AbortSignal.timeout(25000)});
   const tax=await r.json();
   entry.match={matchType:tax.matchType,rank:tax.rank,name:tax.canonicalName,confidence:tax.confidence};
   if(tax.matchType!=='NONE'&&tax.rank==='SPECIES'&&tax.confidence>=95){
    s.taxonomy={provider:'GBIF backbone',checked:'2026-10-13',usageKey:tax.usageKey,acceptedUsageKey:tax.acceptedUsageKey||tax.usageKey,canonicalName:tax.canonicalName,status:tax.status,kingdom:tax.kingdom,phylum:tax.phylum,class:tax.class,order:tax.order,family:tax.family,genus:tax.genus,matchType:tax.matchType,confidence:tax.confidence};
    s.sources.push({id:`${s.id}-taxonomy`,title:'GBIF · Taxonomic backbone',url:`https://www.gbif.org/species/${tax.acceptedUsageKey||tax.usageKey}`,scope:'Taxonomy only; not behavior evidence',accessed:'2026-10-13'});
   }else s.taxonomy={provider:'unresolved',checked:'2026-10-13',note:'Manual taxonomy review required'};
  }catch(e){entry.taxonomyError=e.message;s.taxonomy={provider:'unresolved',note:'Taxonomy lookup unavailable'};}
  audit.push(entry); console.log(s.id,entry.httpStatus,entry.match?.matchType,entry.match?.name);
 }
}
await Promise.all(Array.from({length:5},worker));
await writeFile('species.json',JSON.stringify(archive,null,2)+'\n');
await writeFile('research-audit.json',JSON.stringify({checked:'2026-10-13',method:'Source URL retrieval and GBIF species-name matching. HTTP success is not expert validation. Source text is cached locally and excluded from Git.',entries:audit},null,2)+'\n');
