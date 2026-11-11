import {resolvedTaxonomy,rankLabel} from './taxonomy-resolved.js';
// This is a taxonomic index, not a reconstruction of branching dates or ancestors.
// Alphabetical siblings deliberately avoid an evolutionary ladder.
const compare=(a,b)=>a.localeCompare(b,'en',{numeric:true,sensitivity:'base'});
export function taxonomicPath(s,audit={}){const t=resolvedTaxonomy(s,audit);return[s.domain||'Unresolved domain',t.kingdom||s.group,t.phylum||'Unresolved phylum',rankLabel(s,'class',audit),rankLabel(s,'order',audit),t.family||s.family||'Unresolved family'];}
export function animalLineage(s,audit={}){
 if(s.group!=='Animalia')return[];const t=resolvedTaxonomy(s,audit);
 if(t.phylum==='Cnidaria')return['Cnidaria'];
 if(['Arthropoda','Nematoda'].includes(t.phylum))return['Bilateria','Protostomia','Ecdysozoa'];
 if(['Annelida','Mollusca','Platyhelminthes'].includes(t.phylum))return['Bilateria','Protostomia','Spiralia'];
 if(t.phylum==='Echinodermata')return['Bilateria','Deuterostomia'];
 if(t.phylum!=='Chordata')return[];
 const chordate=['Bilateria','Deuterostomia','Chordata'];
 const vertebrateClasses=['Actinopterygii','Actinopteri','Teleostei','Chondrichthyes','Elasmobranchii','Holocephali','Sarcopterygii','Myxini','Petromyzonti','Amphibia','Reptilia','Crocodylia','Testudines','Aves','Mammalia'];
 if(!vertebrateClasses.includes(t.class))return chordate;
 const path=[...chordate,'Vertebrata'];
 if(['Chondrichthyes','Elasmobranchii','Holocephali'].includes(t.class))return[...path,'Chondrichthyes',...(t.class==='Chondrichthyes'?[]:[t.class])];
 if(t.class==='Teleostei'||['amphiprion-ocellaris','danio-rerio'].includes(s.id))return[...path,'Actinopterygii','Teleostei'];
 if(['Actinopterygii','Actinopteri'].includes(t.class))return[...path,'Actinopterygii'];
 if(['Sarcopterygii','Myxini','Petromyzonti'].includes(t.class))return[...path,t.class];
 path.push('Tetrapoda');if(t.class==='Amphibia')return[...path,'Amphibia'];path.push('Amniota');
 if(t.class==='Mammalia')return[...path,'Synapsida','Mammalia'];
 if(t.class==='Aves'||s.id==='crocodylus-niloticus')return[...path,'Sauropsida','Archosauria'];
 if(t.order==='Testudines')return[...path,'Sauropsida','Testudines'];if(t.order==='Squamata')return[...path,'Sauropsida','Lepidosauria','Squamata'];return[...path,'Sauropsida'];
}
const sortPath=(s,audit)=>{const ranks=taxonomicPath(s,audit);return[...ranks,s.scientificName];};
export function compareTaxa(a,b,audit={}){const aa=sortPath(a,audit),bb=sortPath(b,audit);for(let i=0;i<Math.max(aa.length,bb.length);i++){const c=compare(aa[i]||'',bb[i]||'');if(c)return c;}return compare(a.id,b.id);}
export function taxonomySections(species,audit={}){const sections=[];for(const s of [...species].sort((a,b)=>compareTaxa(a,b,audit))){const path=taxonomicPath(s,audit),lineage=animalLineage(s,audit),key=path.slice(0,4).join(' / ');let section=sections.at(-1);if(section?.key!==key){section={key,path:path.slice(0,4),lineage,species:[]};sections.push(section);}section.species.push(s);}return sections;}
export function searchTaxon(s,query,aliases=[]){const text=[s.commonName,s.scientificName,s.taxonomy?.backboneCanonicalName,s.family,s.habitat,s.group,...taxonomicPath(s),...aliases].join(' ').toLowerCase();return text.includes(query.trim().toLowerCase());}
export function eukaryoticBranch(s){
 if(s.domain!=='Eukaryota')return null;
 if(s.group==='Animalia'||s.group==='Fungi')return'Amorphea · Opisthokonta';
 if(s.group==='Plantae'||['Chlorophyta','Charophyta'].includes(s.taxonomy?.phylum))return'Archaeplastida · green lineage';
 if(['Amoebozoa','Mycetozoa'].includes(s.taxonomy?.phylum))return'Amorphea · Amoebozoa';
 if(s.taxonomy?.phylum==='Euglenozoa')return'Discoba · Euglenozoa';
 if(['Ciliophora','Myzozoa'].includes(s.taxonomy?.phylum))return'SAR · Alveolata';
 return'Placement requires review';
}
