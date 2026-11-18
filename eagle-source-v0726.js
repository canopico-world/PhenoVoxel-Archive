import {unifiedEagle} from './eagle-source-v0725.js';
import revision from './eagle-data-v0726.json' with {type:'json'};

export function featheredEagle(species) {
  if (species.id!==revision.id) return species;
  const prior=unifiedEagle(species);
  return {
    ...prior,
    modelAsset:revision.modelAsset,
    sources:[...prior.sources,...revision.sources],
    visual:{...prior.visual,...revision.visual},
    review:{...prior.review,...revision.review}
  };
}
