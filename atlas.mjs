import fs from 'node:fs/promises';
const archive=JSON.parse(await fs.readFile('species.json','utf8'));
const previous=JSON.parse(await fs.readFile('atlas.json','utf8').catch(()=>'{"species":{}}'));
const result={provider:'GBIF',retrieved:new Date().toISOString().slice(0,10),method:'Georeferenced occurrences without flagged geospatial issues. Country facets are occurrence counts, not abundance or native range.',species:previous.species};
let next=0;
await Promise.all(Array.from({length:3},async()=>{while(next<archive.species.length){const s=archive.species[next++],key=s.taxonomy.acceptedUsageKey||s.taxonomy.usageKey;try{const url='https://api.gbif.org/v1/occurrence/search?'+new URLSearchParams({taxonKey:String(key),hasCoordinate:'true',hasGeospatialIssue:'false',limit:'0',facet:'country',facetLimit:'12'});const r=await fetch(url);if(!r.ok)throw new Error(r.status);const data=await r.json();result.species[s.id]={taxonKey:key,count:data.count,countries:data.facets?.find(f=>f.field==='COUNTRY')?.counts||[],query:url,source:`https://www.gbif.org/occurrence/search?taxon_key=${key}&has_coordinate=true&has_geospatial_issue=false`,retrieved:result.retrieved};console.log(s.id,data.count);}catch(e){console.log(s.id,e.message);}}}));
await fs.writeFile('atlas.json',JSON.stringify(result,null,2)+'\n');
for(const s of archive.species)if(result.species[s.id])s.occurrences=result.species[s.id];
archive.updated=result.retrieved;await fs.writeFile('species.json',JSON.stringify(archive,null,2)+'\n');
