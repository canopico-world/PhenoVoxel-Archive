# PhenoVoxel Archive

**An open, evidence-linked 3D encyclopedia of life.** Explore a specimen in the center of a research desk, inspect its anatomical features, read its scientific context, and play appropriate biological processes.

Version **0.5.9** includes **50 species-level records and licensed organism photographs/micrographs**, live GBIF occurrence maps, country/count snapshots, 22 active CC BY 4.0 artist models (plus a retained legacy kangaroo asset), and upgraded reference reconstructions for the other 28 species. Its long-term aim is coverage across the tree of life.

Version 0.5 begins the requested full-collection correction pass with an individual [50-specimen screenshot and issue review](https://canopico-world.github.io/PhenoVoxel-Archive/reviews/2026-10-14/index.html), 520 baseline samples and 108 corrected plant samples. All ten plants receive initial organ/surface refinements: curved leaf laminae and original numeric venation, local Mimosa closure, a rosette flytrap, open lower pitchers, radial sunflower florets, one retained Arabidopsis source plant, clustered ginkgo fans, opposed redwood foliage, restored original oak laminae on retained artist wood, cupped lotus leaves and a basal fern crown with continuous unfurling. Growth stays anchored and holds at maturity. These are reviewed software/visual corrections; all geometry, materials, developmental timing and biomechanics remain unvalidated. Tiger/wolf receive the next initial correction pass: supported quiet paws, nearer folded wolf hind limbs, near-level sitting muzzles, curved closed wolf lids using its source atlas, and a tiger jump whose lift survives floor correction. Honey bee now has supported six-leg walking, finer worker surface cues and folded/unfolded same-model wing pairs. Myxococcus gliding stays on the substrate; Sulfolobus twitching uses separate retracting adhesion pili, while swimming rotates its distinct archaellum. Chimpanzee receives denser surface-area-sampled coat hair and a supported relaxed seated-hand study. Elephant/giraffe Walk uses corrected lateral footfall order and supporting sole/hoof regions; elephant source relief is reduced. Kangaroo, bear and rabbit receive source-derived fine coat attachments and corrected support/recovery phases. Rabbit retains its pied artist phenotype, receives fur-covered sole atlas corrections and now has a correctly directed Front camera. Fox receives conservative source-derived trunk/tail smoothing, fine coat cues and separate Walk/Trot support phases. Owl receives original contour-feather cues and held visual-search poses on its retained perch. Full owl flight and fox pouncing remain pending. Dolphin receives mild countershading and retains its creator whole-body swim cycle across Swim, slower Forage approach and Quiet swim. Humpback keeps individual source markings while body pitch joins the tail wave and flippers hold trim during Swim. Feeding, water dynamics and physiological sleep remain absent. Eagle receives source-colored contour cues, flight-leg proxies and a held glide posture; the distorted perched Rest fold is withdrawn and marked pending. Penguin receives corrected source/camera axes, separate foot support/recovery and belly-down, forward-aligned swimming. Source scan color and individual tissue details remain unverified. Green turtle receives quieter pigment, surface-seated ocular cues, an authored five-stage stroke and held rear-flipper trim/Glide on its retained sculpt; feeding, scute identity and fluid mechanics remain unverified. The other 22 records have documented individual issues awaiting correction. The review includes 616 after-correction samples. Camera buttons now support closer inspection.

Version 0.5.4 adds automatic compatibility 3D when WebGL is unavailable. It rasterizes the same source meshes, textures, skin joints, morph targets, instances and authored motions using canvas; camera, anatomy links and model exports remain available. Compatibility mode has reduced frame rate/resolution and approximate lighting, without GPU normal maps, shadows or refraction. Browsers with functioning WebGL keep the existing full renderer. Resource disposal, explicit pose-frame painting, camera recovery and native anatomy links are also improved. Source image bitmaps are released after a specimen is discarded; an export pins its source resources until serialization finishes. These changes do not validate organism geometry or biomechanics.

![PhenoVoxel Archive v0.3: textured specimen and reference photograph](preview-v0.3.jpg)

Clownfish now retains its original textured surface while an independently authored body, tail and paired pectoral-fin rig plays Swim, Forage and Escape. The rig is generated in the viewer; the source GLB remains unchanged. Qualitative fin use is linked to Marcoux & Korsmeyer (2019), while trajectories and timing remain unvalidated.

Version 0.4 adds wolf/tiger Sit and Sleep postures with folded limbs and paw contact; corrected solid elephant skin rendering; species-specific whale, turtle, monarch, eagle and penguin articulation; improved giraffe/elephant/rabbit motion; and revised botanical, fungal and microbial anatomy. All 50 rendered forms were reviewed. Partial actions explain their coverage and unsupported behaviors are marked pending. Movements remain source-guided qualitative studies, not validated biomechanics. See [IMPROVEMENTS.md](IMPROVEMENTS.md) for provenance, checks and remaining priorities.

Version 0.4.1 corrects overlapping wolf facial shells and replaces the earlier flat-toe repose rule with separate wrist/digit orientation and torso/limb support constraints. Bear now retains one textured surface across articulated Walk, Running walk, Forage search and quiet standing Rest. A 15-joint viewer rig preserves source files and credits; all motion is unvalidated. The next release extends kangaroo and chimpanzee articulation.

Version 0.4.2 adds a standing kangaroo artist derivative with paired hindlimb Hop, tail-assisted Slow walk, a lowered Forage posture and upright Rest. The former resting scan remains a credited legacy file. Chimpanzee has a shared 22-joint limb/digit rig, a smoother surface and authored short fur across Knuckle walk, supported search and seated Rest. Anatomy markers follow their posed limbs/head/tail. All timing, morphology and biomechanics remain unvalidated; ingestion, grip forces and physiological sleep are not simulated. Owl wing/foot movement remains the next priority.

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

22 active licensed artist models and one legacy kangaroo GLB are bundled, with source links, authors, licenses and SHA-256 hashes in `model-assets.json`. 4 active models use authored materials instead of image textures. The other 28 have upgraded original reference-guided surfaces. Static models retain their surface when a behavior is selected; several still need a complete species-specific motion rig. Do not interpret a tilted static surface or an illustrative rig motion as a recorded behavior.

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

Version 0.4.3 adds quiet wolf lip/jaw closure and head-region refinement while retaining teeth, source UVs, source feeding and all body/limb geometry. The museum owl has a 16-joint perched rig with connected partial wing opening, head search and gentle foot adjustment on one retained textured scan. Full flight remains pending because an experimental horizontal-flight reconstruction distorted the body and was rejected. The mounting block is labeled as part of the taxidermy scan. All movements remain unvalidated.

Version 0.4.7 improves tiger quiet paw/claw postures and adds a slight supported torso lean and source-atlas eyelid covers in Sleep posture. It preserves the original eye/texture/skin and creator run. The sixteen artist claws fold dorsally in quiet states; dewclaws and physiological mechanisms remain unmodeled. Automatic camera fitting now keeps the visible posed organism inside narrow or wide viewers, above the action controls, including anatomical views and growth bounds. Hidden or unreferenced scan geometry does not affect framing.

Version 0.4.8 replaces the zebrafish’s coarse stripe edges and incomplete rigid fins with an original continuous surface, five longitudinal mesh-color bands, seven fin membranes and a shared twelve-joint rig. Swim, Forage search and Escape illustrations preserve the same surfaces; static GLB exports retain skinning, vertex pigmentation, sources and unvalidated-status metadata. Individual identity, calibrated motion, forces, feeding and physiological escape remain unmodeled.

Version 0.4.9 upgrades turtle, crocodile, axolotl and red-eyed tree frog surfaces and same-model articulation. Turtle retains the artist sculpture with original scute/skin pigments and additional foreflipper sweep/twist controls. Crocodile now uses a credited CC BY 4.0 textured generic artist surface with grounded limb motion and a lateral tail rig; Nile identity is unverified. Axolotl has smoother irregular wild-type mottling, integrated grooves, fuller head and finer gills. Tree frog has continuous smooth skin, folded limbs, terminal pads, staged jumping and tucked translucent-eye rest. All geometry, timing, taxonomic interpretation and biomechanics remain unvalidated.

### Continuous earthworm surface (0.4.10)

The original earthworm reconstruction now has a closed continuous pigmented skin instead of separate rings, shallow segment furrows, a dorsal saddle clitellum and small paired setal tips. Crawl and slower Forage keep the same geometry while a posterior-traveling strain wave couples elongation/narrowing with shortening/thickening. The cycle remains in place; it is a qualitative hydrostatic illustration, not a friction/contact solver or measured displacement. The authored 120 segments, color, maturity, specimen identity and physiology remain unvalidated.

Primary references linked in the record are Quillin (1999), Kurth and Kier (2014), and James et al. (2010); the old ADW account returned 404 and was removed as evidence. The existing Michael Linnenbach photograph remains separately credited CC BY-SA 3.0. Original geometry, mesh colors and numeric microrelief are MIT and use no source photographic pixels. Downloads preserve the current static pose and provenance, not a recorded animation.
