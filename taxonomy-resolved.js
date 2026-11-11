import reconciliation from './taxonomy-reconciliation-v0712.json' with {type:'json'};
export const taxonomyDecision=id=>reconciliation.records[id]||null;
export function resolvedTaxonomy(s,audit={}){return {...s.taxonomy,...audit[s.id]?.navigationTaxonomy,...taxonomyDecision(s.id)?.taxonomy};}
export function rankLabel(s,rank,audit={}){const t=resolvedTaxonomy(s,audit);if(t[rank])return t[rank];const extras=taxonomyDecision(s.id)?.additionalRanks||[],near=extras.find(r=>rank==='order'?r.rank==='superorder':r.rank==='subphylum');return near?`Unassigned ${rank} · ${near.name} (${near.rank})`:`Unresolved ${rank}`;}
