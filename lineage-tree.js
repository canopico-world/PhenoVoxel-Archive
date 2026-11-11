import {resolvedTaxonomy,taxonomyDecision} from './taxonomy-resolved.js';
const node=(name,rank='clade')=>({name,rank});
// Selected well-supported nested groups, not a gene tree or a dated supertree.
export function lineagePath(s,audit={}){
 const t=resolvedTaxonomy(s,audit),p=[node('Life','root'),node(s.domain||'Unresolved domain','domain')];
 if(s.domain==='Eukaryota'){
  if(['Animalia','Fungi'].includes(s.group))p.push(node('Amorphea'),node('Opisthokonta'));
  else if(s.group==='Plantae'||['Chlorophyta','Charophyta'].includes(t.phylum))p.push(node('Archaeplastida'),node('Viridiplantae'));
  else if(['Amoebozoa','Mycetozoa'].includes(t.phylum))p.push(node('Amorphea'),node('Amoebozoa'));
  else if(t.phylum==='Euglenozoa')p.push(node('Discoba'));
  else if(['Ciliophora','Myzozoa'].includes(t.phylum))p.push(node('SAR'),node('Alveolata'));
 }
 if(['Animalia','Fungi'].includes(s.group))p.push(node(s.group,'kingdom'));
 if(s.group==='Animalia'&&!['Cnidaria','Porifera'].includes(t.phylum)){
  p.push(node('Bilateria'));
  if(['Arthropoda','Nematoda'].includes(t.phylum))p.push(node('Protostomia'),node('Ecdysozoa'));
  else if(['Mollusca','Annelida','Platyhelminthes'].includes(t.phylum))p.push(node('Protostomia'),node('Spiralia'));
  else if(['Chordata','Echinodermata'].includes(t.phylum))p.push(node('Deuterostomia'));
 }
 if(t.phylum&&!p.some(x=>x.name===t.phylum))p.push(node(t.phylum,'phylum'));
 if(t.phylum==='Chordata'){
  p.push(node('Vertebrata'));
  if(['Chondrichthyes','Elasmobranchii','Holocephali'].includes(t.class)){p.push(node('Chondrichthyes'));if(t.class!=='Chondrichthyes')p.push(node(t.class,'class'));}
  else if(t.class==='Actinopterygii'){p.push(node('Osteichthyes'),node('Actinopterygii','class'));if(!['Acipenseriformes','Lepisosteiformes'].includes(t.order))p.push(node('Teleostei'));}
  else if(['Mammalia','Aves','Reptilia','Amphibia'].includes(t.class)){
   p.push(node('Osteichthyes'),node('Sarcopterygii'),node('Tetrapoda'));
   if(t.class==='Amphibia')p.push(node('Amphibia','class'));
   else {p.push(node('Amniota'));if(t.class==='Mammalia')p.push(node('Synapsida'),node('Mammalia','class'));
    else{p.push(node('Sauropsida'));if(t.order==='Squamata')p.push(node('Lepidosauria'));else {p.push(node('Archelosauria'));if(t.order!=='Testudines')p.push(node('Archosauria'));}if(t.class==='Aves')p.push(node('Aves','class'));}
   }
  }else if(t.class)p.push(node(t.class,'class'));
 }else{
  const extra=taxonomyDecision(s.id)?.additionalRanks||[];
  for(const x of extra.filter(x=>x.rank==='subphylum'))p.push(node(x.name,x.rank));
  if(t.class)p.push(node(t.class,'class'));
  if(!t.order)for(const x of extra.filter(x=>x.rank==='superorder'))p.push(node(x.name,x.rank));
 }
 if(t.order)p.push(node(t.order,'order'));
 if(t.suborder)p.push(node(t.suborder,'suborder'));
 if(t.infraorder)p.push(node(t.infraorder,'infraorder'));
 if(t.family||s.family)p.push(node(t.family||s.family,'family'));
 p.push(node(t.genus||s.scientificName.split(' ')[0],'genus'),{...node(s.scientificName,'species'),speciesId:s.id});
 return p.filter((x,i)=>i===0||x.name!==p[i-1].name);
}
export function buildLineageTree(species,audit={}){
 const root={key:'Life',name:'Life',rank:'root',children:[],members:[]},byKey=new Map([[root.key,root]]),paths=new Map();
 for(const s of species){let n=root;const path=[root];n.members.push(s.id);for(const entry of lineagePath(s,audit).slice(1)){const key=n.key+'/'+entry.name;let child=byKey.get(key);if(!child){child={...entry,key,parent:n.key,children:[],members:[]};n.children.push(child);byKey.set(key,child);}child.members.push(s.id);path.push(child);n=child;}paths.set(s.id,path);}
 for(const n of byKey.values())n.children.sort((a,b)=>a.name.localeCompare(b.name));
 return{root,byKey,paths};
}
export function closestArchiveRelatives(tree,id){const p=tree.paths.get(id);if(!p)return{ancestor:null,species:[]};for(let i=p.length-2;i>=0;i--){const species=p[i].members.filter(x=>x!==id);if(species.length)return{ancestor:p[i],species};}return{ancestor:null,species:[]};}
