import data from './penguin-data-v0723.json' with { type: 'json' };

export function revisedPenguin(species) {
  if (species.id !== data.id) return species;
  const replacements = new Map(data.behaviors.map(behavior => [behavior.id, behavior]));
  return {
    ...species,
    modelAsset: data.modelAsset,
    sources: [...species.sources, ...data.sources],
    behaviors: [
      replacements.get('stand'),
      ...species.behaviors.map(behavior => replacements.get(behavior.id) ?? behavior)
    ]
  };
}
