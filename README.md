# PhenoVoxel Archive

**An open, evidence-linked 3D encyclopedia of life.** Explore a specimen in the center of a research desk, inspect its anatomical features, read its scientific context, and play appropriate biological processes.

Version **0.4.0** includes **50 species-level records and licensed organism photographs/micrographs**, live GBIF occurrence maps, country/count snapshots, 20 bundled CC BY 4.0 artist models, and upgraded reference reconstructions for the other 30 species. Its long-term aim is coverage across the tree of life.

![PhenoVoxel Archive v0.3: textured specimen and reference photograph](preview-v0.3.jpg)

Clownfish now retains its original textured surface while an independently authored body, tail and paired pectoral-fin rig plays Swim, Forage and Escape. The rig is generated in the viewer; the source GLB remains unchanged. Qualitative fin use is linked to Marcoux & Korsmeyer (2019), while trajectories and timing remain unvalidated.

Version 0.4 adds wolf/tiger Sit and Sleep postures with folded limbs and paw contact; corrected solid elephant skin rendering; species-specific whale, turtle, monarch, eagle and penguin articulation; improved giraffe/elephant/rabbit motion; and revised botanical, fungal and microbial anatomy. All 50 rendered forms were reviewed. Partial actions explain their coverage and unsupported behaviors are marked pending. Movements remain source-guided qualitative studies, not validated biomechanics. See [IMPROVEMENTS.md](IMPROVEMENTS.md) for provenance, checks and remaining priorities.

## Run locally

Install [Node.js](https://nodejs.org/) 22.12+ or 24 LTS, then:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. For a production build:

```sh
npm run build
npm run preview
```

No API keys, account, backend, or external model downloads are required. Photographs, geometry, land outlines and occurrence-count snapshots are bundled. Live GBIF density tiles, scientific links and optional Google Fonts require internet. A tile outage is shown explicitly; it does not indicate absence of a species.

Wolf and tiger now play **walk, run, forage and rest on the same textured mesh in one local viewer**. No Sketchfab account or embedded viewer is needed. The tiger retains Amil’s original surface and run cycle. The wolf uses the openly reusable textured model credited to victory_mirosya (currently Paleo Modelist), with creator feeding clips and authored gait/posture studies. Source clips and authored motion are labeled separately. The earlier igor-lir wolf was replaced because its reusable download required sign-in.

20 licensed artist GLBs are bundled, with source links, authors, licenses and SHA-256 hashes in `model-assets.json`. 3 use authored materials instead of image textures. The other 30 have upgraded original reference-guided surfaces. Static models retain their surface when a behavior is selected; several still need a complete species-specific motion rig. Do not interpret a tilted static surface or an illustrative rig motion as a recorded behavior.

## Explore

- Search common/scientific names, families, and habitats; filter by life group.
- Drag to orbit and scroll to zoom the central 3D specimen.
- Inspect authentic reference photos and original specimen captions, with visible author/license credits.
- Switch lateral, anterior and dorsal camera views; compare the model with its reference.
- Explore recorded geographic density by period and follow country counts to GBIF source records. These maps are not native-range or abundance estimates.
- Select numbered anatomical labels and read their explanations.
- Play species-appropriate actions: walking, jumping, swimming, foraging, escape, sleep posture, leaf folding, trap closure, budding, growth, and microbial movement.
- Pause, change playback speed, inspect wireframes, hide labels, reset the camera, or expand the viewer.
- Read overview, anatomy, ecology, taxonomy, evidence, and reusable data on one page.
- Export a species JSON record, the full archive JSON, a species-index CSV, BibTeX citations, or static current-pose GLB geometry with model attribution.
- Link directly to a species, for example `/#mimosa-pudica` or `/#panthera-tigris`.

## The first 50

| Navigation group | Records | Examples |
| --- | ---: | --- |
| Animals | 25 | Tiger, elephant, axolotl, honey bee, moon jelly |
| Plants | 10 | Sensitive plant, flytrap, sunflower, ginkgo, male fern |
| Fungi | 5 | Fly agaric, oyster mushroom, budding yeast |
| Microeukaryotes | 5 | Amoeba, Paramecium, Euglena, Chlamydomonas, Physarum |
| Bacteria | 3 | E. coli, Bacillus subtilis, Myxococcus xanthus |
| Archaea | 2 | Halobacterium salinarum, Sulfolobus acidocaldarius |

**Groups are navigation labels, not a universal kingdom system.** In particular, Microeukaryotes is not a kingdom. The taxonomic panel records the GBIF backbone's classification; green algae can appear in Plantae despite their navigation grouping.

## Scientific scope

The written records are concise, original summaries linked to institutional species accounts and research papers. All 50 names matched species-level GBIF backbone entries during preparation on 2026-10-13. Behavioral references are attached to each process. Primary research, institutional natural-history accounts, and explicitly marked preprints are distinguished in the data.

**The models and animations are educational reconstructions, not validated scientific simulations.** Wolf and tiger have the same textured mesh across their four principal behavior modes. The remaining species have received a surface upgrade, with varying detail and animation coverage. Several static artist models still need full rigs; microscopic internal structures and developmental loops are conceptual. Proportions, surfaces, label locations, postures, gaits, trajectories, and timing remain approximate. Playback speeds are interface settings, not organism speeds. Growth loops compress time. Static GLB exports do not contain motion recordings. No force, metabolism, ecological interaction, or population prediction is computed.

All records have `review.status = "draft — expert review needed"` and `animationValidated = false`. They can seed an educational application or research-data infrastructure; use source literature and measured, expert-reviewed replacements for quantitative research.

Species concepts need care: the starter accounts for giraffe, barn owl, common octopus, moon jelly, and fly agaric may use broad or historically applied concepts. Microbial behavior can depend on strain and conditions. The archive makes these limits visible and does not supply current conservation categories or medical/foraging advice.

See [SCIENCE.md](SCIENCE.md) for provenance and a path to validation, and [CONTRIBUTING.md](CONTRIBUTING.md) to add reviewed records, measurements, or species-specific models.

## Reuse the database

[`species.json`](species.json) is the canonical, versioned dataset. [`schema.json`](schema.json) defines its structure. Records contain stable IDs, scientific and common names, taxonomy identifiers, habitat/range/nutrition summaries, anatomical notes, supported process IDs, source links, model/review metadata, photographic provenance, and occurrence snapshots. [`media.json`](media.json) is the photographic attribution manifest; [`atlas.json`](atlas.json) contains exact GBIF queries and dated count/country facets. See [`ASSET-LICENSES.md`](ASSET-LICENSES.md) before reusing images or external data, and [`IMPROVEMENTS.md`](IMPROVEMENTS.md) for ongoing work.

```js
// Node.js: read the archive without launching the viewer.
import { readFile } from 'node:fs/promises';
const archive = JSON.parse(await readFile('species.json', 'utf8'));
const tiger = archive.species.find(s => s.id === 'panthera-tigris');
console.log(tiger.behaviors, tiger.sources);
```

Direct GitHub data access:

```text
https://raw.githubusercontent.com/canopico-world/PhenoVoxel-Archive/main/species.json
```

Use a commit hash in place of `main` to pin a reproducible version. There is no hosted query API in this release; the JSON is the open database snapshot. Process IDs are stable within this schema version. When a species concept changes, retain the old identifier with migration notes rather than silently redefining it.

## Source maintenance and checks

```sh
npm test
node research.mjs
```

Tests check all 50 records, source-ID integrity, biological action applicability, taxonomy/family consistency, and finite model transforms for every supported animation. `research.mjs` refreshes taxonomic matches and checks source URLs; it updates data/audit files, so review its diff before committing. HTTP success is not scientific validation. Source text is cached under ignored `research-cache/` and is not redistributed. Kew blocked direct automated retrieval; those pages were read through web tools and that distinction is recorded.

## Architecture

Vanilla JavaScript, Vite, Three.js, Leaflet and Lucide. Original geometry and externally licensed assets have separate manifests. The app is static and can be served by any static host. `models.js` authors geometry and educational poses; `viewer.js` manages 3D interaction; `app.js` renders navigation, science panels, and exports. `species.json` remains independent of the UI.

## Licenses

- Code and original procedural geometry: [MIT](LICENSE).
- Original dataset summaries and metadata: [CC BY 4.0](LICENSE-DATA.md). Attribute **PhenoVoxel Archive contributors**, the repository, and the version; retain citation provenance and indicate changes.
- Referenced papers, accounts, photographs, and databases retain their own licenses. Full scientific articles are not bundled. Photographs/micrographs are included under their recorded asset licenses; bundled artist models retain their creator licenses. See ASSET-LICENSES.md.

This project is not affiliated with the source institutions or with any film franchise.
