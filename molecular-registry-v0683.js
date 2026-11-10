import originalData from './molecular-data-v0673.json';
import nextData from './molecular-data-v0674.json';
import cetData from './molecular-data-v0675.json';
import baseline from './molecular-index-v0683.json';
import supplement from './molecular-index-v0706.json';
const index={...baseline,version:supplement.version,records:{...baseline.records,...supplement.records}};
index.speciesCount=Object.keys(index.records).length;index.counts=Object.values(index.records).reduce((a,e)=>(a[e.status]=(a[e.status]||0)+1,a),{});
const legacy={...originalData.records,...nextData.records,...cetData.records};
const cache=new Map();
export const molecularIndex=index;
export const molecularStatus=id=>index.records[id];
export const hasMolecularStudy=id=>!!index.records[id];
export const hasMolecularRecord=id=>index.records[id]?.status==='verified';
export const hasLegacyMolecularRecord=id=>!!legacy[id];
export async function loadMolecularRecord(id){
  if(legacy[id])return legacy[id];
  const entry=index.records[id];if(entry?.status!=='verified')return null;
  if(!cache.has(entry.dataFile))cache.set(entry.dataFile,fetch(new URL('./'+entry.dataFile+'?release='+encodeURIComponent(index.version),document.baseURI)).then(async r=>{if(!r.ok)throw Error('Sequence download failed ('+r.status+').');return r.json();}).catch(e=>{cache.delete(entry.dataFile);throw e;}));
  const record=(await cache.get(entry.dataFile)).records[id];
  if(!record||record.accession!==entry.accession||record.sequence.length!==entry.length)throw Error('Sequence record does not match the coverage index.');
  if(globalThis.crypto?.subtle){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(record.sequence));const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==entry.sequenceSha256)throw Error('Sequence integrity check failed.');}
  return record;
}
