# Contributing

The goal is an open archive across the tree of life, growing through verifiable contributions.

## Species records

Edit `species.json` or propose a new record with:

- A stable, lowercase ID, scientific name, taxonomic concept/provider, and species-level identifier.
- Concise original summaries and reputable source links, with publication/access dates and explicit scope.
- Species-appropriate biological processes linked by source IDs. Document strain, life stage and conditions when relevant.
- Three introductory anatomy notes for this viewer version. Additional anatomical structures can be proposed with a schema/UI update.
- A model family and species-specific geometry, or a properly licensed external replacement.
- Explicit fidelity, uncertainty, and review status. Never call procedural playback validated without evidence.

Navigation groups are functional labels. Do not treat Microeukaryotes as a kingdom or force archaea into a bacterial classification.

## Models and motion

`models.js` contains procedural geometry and educational pose functions. Preserve deterministic geometry; avoid introducing unlicensed textures or meshes. For measured assets, include license/attribution, coordinate convention, units, scale, rig semantics, specimen concept, and method. Document reference frames and action timing. Include appropriate sex/stage/strain distinctions.

## Validation

Run `npm test` and `npm run build`. Check the viewer at desktop and phone widths; test species switching, process switching, source links, keyboard navigation, and JSON/GLB export. New behavior modes require actual implementation and evidence. A passing software test is not biological validation.

In a pull request, describe what changed, why it is supported, source/asset licenses, validation results, and unresolved scientific questions. Keep external content as links unless redistribution is explicitly permitted. Expert reviews should identify the reviewer, specialty, reviewed claims, date, and remaining uncertainty.

## Attribution

Contributed original code/geometry uses MIT; original dataset content uses CC BY 4.0. Retain source provenance. Do not copy encyclopedia prose, research figures, or third-party assets without compatible permission.
