# PhenoVoxel Archive improvement log

## 0.3.1 — recurring run, 2026-10-14: articulated clownfish

Base commit: `9e419f1`. The local checkout was clean when this run began; no user edits or synced project sources were changed.

The static Bindestrek clownfish now keeps its original textured surface while an independently authored seven-joint skeleton per mesh drives axial tail bending and both pectoral fins. Swim, Forage and Escape differ in illustrative intensity/timing; Observe resets the neutral pose. The original source GLB and checksum remain unchanged. `viewerRig` metadata distinguishes the viewer-authored skeleton from source-file rigs and creator clips. Posed exports include the two skins, seven joints each, embedded images, canonical species ID, artist CC BY 4.0 credits, modifications and rig authorship.

Marcoux & Korsmeyer (2019), DOI [10.1242/jeb.191791](https://doi.org/10.1242/jeb.191791), specifically include A. ocellaris using pectoral and caudal propulsion together in simulated wave-surge swimming. Its PubMed abstract was read; no measured trajectories were imported. The swimming description and evidence link were updated to include paired fins. Foraging and escape sequences are independently authored interpretations, not footage or results from that experiment. All validation flags remain false.

Pixel review caught a depth/transparency regression. The source body's texture is opaque RGB although the source material declares blending. Opaque rendering with depth writes enabled fixes the visible overlapping-fin artifacts; the separate translucent fin material keeps its transparency without writing depth. Rendering review covered neutral, swimming, foraging and escape poses in the compiled app. The actual GLB download was checked: 5,990,192 bytes, two meshes, two seven-joint skins, embedded images and correct source/rig credits. Eight release tests and the production build pass, including wolf/tiger same-surface motion regressions. Skeleton GPU resources are now released when switching specimens.

Next: curate full rigs for sea turtle and whale surfaces, then birds and kangaroo; calibrate fin/joint trajectories only from appropriate measured data and specialist review. Keep species concepts, artist geometry and recorded-occurrence limits explicit.

## 0.3 — one textured viewer and collection-wide surface upgrades

Wolf and tiger now keep their textured mesh across walk, run, forage and rest. The viewer uses local GLBs and the real source skeletons. The tiger retains Amil’s Running Tiger surface/run clip. The wolf uses the openly downloadable victory_mirosya model (current creator name Paleo Modelist), with feeding/sleeping clips and independently authored gait studies. The earlier igor-lir model required sign-in for reuse and was replaced after the user chose assets available without sign-in. Creator motion and authored approximations are identified during playback. No quantitative biomechanics is validated.

- 20 bundled CC BY 4.0 artist models (17 with image textures, 3 with authored materials), original credits, public source paths, checksums and rig/clip metadata. The green turtle is a credited optimized derivative: 33.6 MB source reduced to 5.6 MB, source and derivative hashes retained. Its procedural natural-color treatment is illustrative. The separate giraffe ground circle is omitted from the viewer.
- 30 original reference reconstructions receive a surface pass. Detailed new geometry covers frog/crocodile/axolotl, striped zebrafish, six-legged/four-winged bee with wing veins and hairs, segmented worm, tapered eight-arm octopus with paired sucker rows, ginkgo fan leaves, redwood foliage, capsules and microscopy cues, connected amoeboid pseudopods, and branched fungal/slime-mold networks. Curved botanical blades, grain and more subdued physical materials replace flat paddles and glossy shapes. These remain educational reconstructions at varying fidelity.
- Unified action buttons inside the viewer, pause/speed controls, camera presets, loading/error states with no automatic schematic substitute, release of stale loads, texture disposal, and canonical species IDs in static GLB exports. Original artist licenses/attribution are included in exports.
- Several artist surfaces have no full behavior rig. They retain their surface and disclose pending articulation; they are not silently replaced with another mesh or mislabeled as recorded motion.
- Performance review found excessive redwood needle geometry. Instanced foliage and smaller vein/hair geometry substantially reduce the rendering work. Use compiled previews for visual checks; the development server can become slow when many module-heavy tabs are left open.
- Review rejected the Bake3D cartoon fox, a low-poly untextured fox, the fantasy turtle UID 17c7e3c27f7c4dc3be26e3e2a7766ef3, decorative/stylized octopus candidates, an opaque sunflower import and fragmented oyster-mushroom geometry. Do not reintroduce them based only on an artist’s model title. Artist meshes still require taxonomic review against the species photograph and anatomy sources.
- The existing four-hour heartbeat now prioritizes the same-viewer workflow, species-specific realism and full rigs; it uses freely available assets without sign-in and reports only meaningful outcomes.

### Next priorities for recurring work

1. Complete rigs and behavior coverage for static artist surfaces, beginning with kangaroo, birds, sea turtle and whale. Curate poses, orientation and anatomy anchors per species; do not claim a generic animation is a measured gait.
2. Improve reference reconstructions toward more natural musculature, skin/fur and leaf surfaces. The remaining quality differences are explicit; a material change alone is not a photorealistic reconstruction.
3. Add measured, source-backed joint trajectories, contact constraints and documented conditions. Keep animationValidated false until specialist evaluation is complete.
4. Verify species concepts, photographer/model identity, domestic/wild phenotype, life stage and provenance. Generic octopus, barn owl and broad giraffe concepts need specialist review.
5. Extend trait measurements, dated conservation evidence, comparison workspaces and accessibility/mobile review; preserve occurrence-versus-native-range distinctions and external asset licenses.

### Release checks

Binary provenance, licensing/embedded resources, canonical record IDs, source/action applicability, unchanged wolf/tiger geometry and materials across all four actions, distinct poses, paw movement, lowered resting bodies, and finite model transforms are covered by the release tests. Pixel appearance and exports are reviewed separately in the compiled browser app; rendering tests do not validate biology.

## 0.2 — photographic reference and anatomical reconstruction

Requested direction: realistic species, an encyclopedia desk with the 3D specimen at its center, original-organism photographs, stronger science and geographic context. Do not describe this release as photorealistic, frontier-quality or scientifically validated.

- 50 individually credited Wikimedia Commons photographs/micrographs, bundled for dependable loading. The original asset licenses (CC BY, CC BY-SA or public domain) remain attached to each file in `media.json` and the species export.
- Wolf, fox and tiger have new authored surface meshes, differentiated heads/ears, colored coat geometry, fine guard hairs, smaller eyes, mouth/whisker detail and jointed leg segments. Tiger has a shorter rostrum and rounded ears. Reference pictures guide visual interpretation; these are not photogrammetry scans. Limb playback is illustrative and does not solve forces or measured gait trajectories.
- Wolf and tiger also offer a separate, higher-detail textured surface viewer: CC BY 4.0 artist models by igor-lir and Amil (francescolima74). These online assets are visibly credited, independently controllable and not included in the MIT exports. Selecting a biological behavior switches to the local illustrative rig. This preserves the distinction between surface realism and calibrated biological motion.
- Real photographs in the index and profile, enlargement with original specimen caption and attribution, neutral lighting, camera presets, clearer model quality status and a larger research desk.
- GBIF live occurrence-density maps with period filters; local Natural Earth land outlines. All 50 records have dated all-years georeferenced counts, country facets, query provenance and links to contributing GBIF datasets. A map is not a native-range or abundance estimate.
- Wolf shoulder-height and sex-specific adult-mass ranges cited to its Animal Diversity Web account. They do not calibrate display geometry.
- A four-hour thread heartbeat is active. It reads this backlog before selecting one useful improvement and should report only substantial completed changes, failures or required user actions.

### Review and checks

Initial visual review caught bare cylindrical legs and overly pale fur. These were revised to fur-covered tapered segments and a darker dorsal coat. Native builds for all 50 species and every supported behavior are checked for finite, nondegenerate transforms. Photograph licenses/files and occurrence provenance must also pass the release tests. Visual review completed for wolf, tiger, Mimosa, Euglena and the full 50-image contact sheet. It caught a botanical illustration for the fern, which was replaced with a photographed specimen, and incomplete photographer credits, which were corrected against the source file pages. Photo enlargement, surface-to-motion switching and map filters were exercised. The wolf GLB export was downloaded and checked: valid glTF 2 binary, 9,456,532 bytes, 101 meshes, correct species ID, no external artist geometry. All six release tests pass and the production build succeeds. The browser viewport override did not take effect, so a dedicated narrow-screen review remains pending.

## Next priorities

1. Commission or acquire commercially reusable, expert-reviewed wolf/tiger meshes and rigs (CC0/CC BY preferred). Current authored reconstructions still need substantial improvements in facial anatomy, shoulder transitions and fur rendering. Avoid assigning one species' mesh or animations to another species.
2. Rebuild remaining 47 schematic species with species-specific anatomy, beginning with elephant, giraffe, cetaceans and birds. Do not upgrade their fidelity labels until work is complete.
3. Add measured gait data, explicit observation conditions and citations; improve foot contact and hock/elbow trajectories. Never mark qualitative movement validated because a rendering test passed.
4. Validate photographic specimen identifications, life stage, captive/wild provenance and species concepts with curators. Preserve false-color microscopy and image captions. Add additional whole-organism and detail views with licenses.
5. Add source-backed conservation assessments with assessment dates, habitat/biome layers, trait units/uncertainty, sex/stage/strain controls and comparison workspaces. Avoid fabricating maps from prose or treating sparse occurrences as absence.
6. Add replaceable GLB asset manifests with author, source, checksum, license, taxonomy concept, measurements and named clips. Keep external assets out of the project's MIT geometry license.
7. Split the map code/data into a deferred module, optimize photographic sizes, extend keyboard access and preserve offline data access. Keep GBIF tile outages visibly distinguishable from no occurrence records.

## Recurring-run rules

Work only in `C:/Users/Fourthyz/PhenoVoxel-Archive`. Project mirror `sources/` remains read-only. Inspect Git status and earlier run notes; preserve user edits. Finish one coherent improvement, test and visually review it, publish through an existing authorized GitHub connection, then log the result here. Do not buy assets, incur paid generation fees, create credentials, access unrelated accounts or overlap another active run. If publishing requires sign-in, retain tested local work and report the specific required action. Do not continually refresh already working files without a meaningful improvement.

### 0.3 verification result

All seven release tests and the production build pass. Browser review covered the 50-species surface collection and the four wolf/tiger actions; it caught floating creator wolf poses and added a ground-contact regression check. The exported tiger GLB was downloaded and inspected: glTF 2, 2,138,072 bytes, one source mesh, canonical panthera-tigris ID, original Amil attribution/source and CC BY 4.0 license. The preview is an actual captured browser frame. Several remaining models still need full rigs and greater anatomical realism; no biomechanics is marked validated.
