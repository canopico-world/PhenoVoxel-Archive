import revision from './eagle-data-v0724.json' with {type:'json'};

export function revisedEagle(species) {
  if (species.id !== revision.id) return species;
  const behaviors = new Map(revision.behaviors.map(behavior=>[behavior.id,behavior]));
  return {
    ...species,
    modelAsset:revision.modelAsset,
    behaviors:species.behaviors.map(behavior=>behaviors.get(behavior.id) || behavior),
    sources:[...species.sources,...revision.sources],
    anatomy:revision.anatomy,
    visual:{...species.visual,...revision.visual},
    review:{...species.review,...revision.review}
  };
}

