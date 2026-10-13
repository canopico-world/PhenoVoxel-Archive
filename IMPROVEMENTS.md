# PhenoVoxel Archive improvement log

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
