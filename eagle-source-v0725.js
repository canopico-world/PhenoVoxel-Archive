import {revisedEagle} from './eagle-source-v0724.js';
import revision from './eagle-data-v0725.json' with {type:'json'};

export function unifiedEagle(species) {
  if (species.id!==revision.id) return species;
  const previous=revisedEagle(species);
  const changed=new Set(revision.behaviors.map(behavior=>behavior.id));
  return {
    ...previous,
    modelAsset:revision.modelAsset,
    behaviors:[...revision.behaviors,...previous.behaviors.filter(behavior=>!changed.has(behavior.id))],
    sources:[...previous.sources,...revision.sources],
    visual:{...previous.visual,...revision.visual},
    review:{...previous.review,...revision.review}
  };
}
