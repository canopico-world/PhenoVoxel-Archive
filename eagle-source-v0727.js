import {featheredEagle} from './eagle-source-v0726.js';
import revision from './eagle-data-v0727.json' with {type:'json'};

export function continuousEagle(species) {
  if(species.id!==revision.id)return species;
  const previous=featheredEagle(species);
  return {
    ...previous,
    modelAsset:revision.modelAsset,
    sources:[...previous.sources,...revision.sources],
    visual:{...previous.visual,...revision.visual},
    review:{...previous.review,...revision.review}
  };
}
