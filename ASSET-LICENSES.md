# Photographic and map assets

### Clownfish viewer derivative (0.3.1)

Bindestrek's original clownfish GLB remains byte-for-byte unchanged under CC BY 4.0. The viewer adds an independently authored seven-joint skeleton to each of its two meshes, skin weights and qualitative fin strokes, plus corrected opaque-body/translucent-fin depth handling. The original positions, UVs and image textures remain. Posed downloads are credited derivatives of that CC BY asset; their extras retain the artist/source/license and identify the changes and PhenoVoxel Archive contributors as rig authors. The authored rigging code in `fish-rig.js` is MIT. The rig is not an artist-supplied animation or a validated anatomical model.

`photo-*.jpg` and `photo-*.png` are authentic Wikimedia Commons photographs or microscope/source images. **They are not covered by the repository's MIT license or the original-summary CC BY 4.0 license.**

For each file, `media.json` records the local filename, original source/file-description URL, author, license name and URL, caption, retrieval date and credit. These fields are also included in its `species.json` record. Keep the author and license with any redistributed image. Follow CC BY-SA share-alike terms for image adaptations. Images are bundled as received from the Commons thumbnail service; the viewer crops them using CSS and offers an uncropped reference view. Do not imply that the author endorses this project or that a reference individual was scanned.

Wikimedia API documentation: https://commons.wikimedia.org/wiki/Commons:API/MediaWiki

Preserved source captions/credits remain external material; Wikimedia Commons unstructured file-description text is under its applicable CC BY-SA terms, while structured file-namespace metadata is CC0. Follow each source page's terms. The project's original-summary license does not replace those terms.

`world.json` is the 1:110 million land dataset from Natural Earth, obtained from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson. Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/.

GBIF taxonomy, occurrence metadata and live density tiles are attributed to GBIF. The country/count snapshot is in `atlas.json`, with its exact query and retrieval date. Individual occurrence datasets may have different licenses (CC0, CC BY or CC BY-NC); follow the dataset licenses when reusing the underlying records. This project does not claim an original-data license over those underlying records or remote tiles.

Original authored procedural geometry, including `natural-models.js`, is MIT licensed. It is guided by organism morphology and reference photographs, not extracted from or licensed as a scan of those photographs. All motion remains unvalidated.

## Bundled 3D artist assets (version 0.3)

The `model-*.glb` files are independently licensed **CC BY 4.0**, and are excluded from the repository’s MIT geometry license. `model-assets.json` records author, original source, license, public archive path, byte length, SHA-256 checksum, creator clip names and rig availability. Original glTF asset extras retain creator credits. These files are obtained without account sign-in from the public [Objaverse archive](https://huggingface.co/datasets/allenai/objaverse). Attribution: Deitke et al., Objaverse: A Universe of Annotated 3D Objects, CVPR 2023, https://objaverse.allenai.org/. Individual creator licenses govern GLB reuse.

Viewer adaptations include normalized framing, material changes, removal of the giraffe’s separate decorative ground circle, and authored illustrative skeletal motion. The green turtle derivative reduces mesh density and texture resolution using `optimize-model.mjs`; the manifest retains both the source and derivative SHA-256. Preserve creator attribution, license and change notices with derivatives and exports. Artist models are not verified specimen scans or measured behavior. Authentic photographic references remain separately credited.

| Species ID | Model | Creator | License |
| --- | --- | --- | --- |
| panthera-tigris | [Running Tiger](https://sketchfab.com/3d-models/running-tiger-fc2c7fd74dd04e39935803b884c77258) | Amil (francescolima74) (https://sketchfab.com/francescolima74) | CC BY 4.0 |
| giraffa-camelopardalis | [Giraffe](https://sketchfab.com/3d-models/giraffe-522c042aad9f4348a74c2985ec3f99f9) | BlueMesh (https://sketchfab.com/VapTor) | CC BY 4.0 |
| canis-lupus | [wolf animated](https://sketchfab.com/3d-models/wolf-animated-79bd16a8c36a45c78ccd13b84b7ca99c) | victory_mirosya (https://sketchfab.com/victory_mirosya) | CC BY 4.0 |
| loxodonta-africana | [Elephant Animation Idle](https://sketchfab.com/3d-models/elephant-animation-idle-a8e7e10f005f4baab0a2f5079d759fcd) | GremorySaiyan (https://sketchfab.com/GremorySaiyan) | CC BY 4.0 |
| oryctolagus-cuniculus | [Rabbit](https://sketchfab.com/3d-models/rabbit-ce07bc73ca66435680e227767725f3f8) | victory_mirosya (https://sketchfab.com/victory_mirosya) | CC BY 4.0 |
| ursus-arctos | [Bear](https://sketchfab.com/3d-models/bear-da9b588f7a7346519f391c3eb9532226) | SDPM Esare (https://sketchfab.com/sdpm) | CC BY 4.0 |
| pan-troglodytes | [Chimpanzee (male)](https://sketchfab.com/3d-models/chimpanzee-male-62d7f89a88184d7499ec8ee07339d151) | Dr. Keith Chan (https://sketchfab.com/chekeichan) | CC BY 4.0 |
| megaptera-novaeangliae | [Game-ready Humpback Whale](https://sketchfab.com/3d-models/game-ready-humpback-whale-da07e3ff73914ff28d2b8cf9da794036) | Allie2k (https://sketchfab.com/Allie2k) | CC BY 4.0 |
| tursiops-truncatus | [Bottlenose Dolphin](https://sketchfab.com/3d-models/bottlenose-dolphin-4bb04fa58d6846938e07bb38507e3f3a) | popcornbag (https://sketchfab.com/popcornbag) | CC BY 4.0 |
| haliaeetus-leucocephalus | [American Bald Eagle](https://sketchfab.com/3d-models/american-bald-eagle-ae252eac5e2e4299be268aa0b320cd8a) | OscarWW (https://sketchfab.com/OscarWW) | CC BY 4.0 |
| tyto-alba | [Common Barn Owl](https://sketchfab.com/3d-models/common-barn-owl-19c989a6681145bc999c332699eb852e) | Innovation Studio (https://sketchfab.com/cmp_innovation_studio) | CC BY 4.0 |
| aptenodytes-forsteri | [Пингвин императорский / Emperor penguin](https://sketchfab.com/3d-models/emperor-penguin-c698d3e3f4564103a7bbf1ce4b9fdf3e) | darwinmuseum.ru (https://sketchfab.com/darwinmuseum.ru) | CC BY 4.0 |
| chelonia-mydas | [Green Turtle](https://sketchfab.com/3d-models/green-turtle-6ec6be4b91564ffe9005f27ad911bbdf) | Bohdan Lvov (https://sketchfab.com/ostapblendercg) | CC BY 4.0 |
| osphranter-rufus | [Kangaroo (standing artist derivative)](https://sketchfab.com/3d-models/kangaroo-580f30f0910948d8bd757109379f52d6) | Devilmaryart (https://sketchfab.com/Dmary) | CC BY 4.0 |
| danaus-plexippus | [Monarch Butterfly](https://sketchfab.com/3d-models/monarch-butterfly-ed0a10f2aa4b41bb9b7a1bcb82cb369b) | dudecon (https://sketchfab.com/dudecon) | CC BY 4.0 |
| amphiprion-ocellaris | [Clownfish](https://sketchfab.com/3d-models/clownfish-ba24a46bfa464cd2b59f5f6fcb718ad5) | Bindestrek (https://sketchfab.com/KNUT-OLAV_UTISTOG) | CC BY 4.0 |
| arabidopsis-thaliana | [Arabidopsis thaliana model](https://sketchfab.com/3d-models/arabidopsis-thaliana-model-e79922a7f1ea418ab928f2fa8c06cd48) | lamujer (https://sketchfab.com/lamujer) | CC BY 4.0 |
| aurelia-aurita | [Simple Moon Jellyfish (Baked Animation)](https://sketchfab.com/3d-models/simple-moon-jellyfish-baked-animation-3d911c511f2744ec9bfb99d46d2d6e14) | n- (https://sketchfab.com/n-) | CC BY 4.0 |
| amanita-muscaria | [Musmirė  - Amanita muscaria](https://sketchfab.com/3d-models/musmire-amanita-muscaria-8b804eac1165473fbf80a57caf82b8cb) | Mantas Talmantas (https://sketchfab.com/mantasT) | CC BY 4.0 |
| quercus-robur | [3 English Oak Set (Quercus Robur) *Updated](https://sketchfab.com/3d-models/3-english-oak-set-quercus-robur-updated-750fac732a8c453e9dd748f1396275fa) | yag1z (https://sketchfab.com/yag1z) | CC BY 4.0 |

`preview-v0.2.jpg` is an actual browser capture of this release, shared as a composite under CC BY-SA 4.0. It includes the credited igor-lir wolf (CC BY 4.0), the User:Mas3cf wolf photograph (CC BY-SA 4.0), and index thumbnails whose credits are in `media.json`. Preserve those credits when reusing the screenshot. It is not a generated mockup.

`preview-v0.3.jpg` is an actual browser capture of the textured tiger viewer, shared as a composite under CC BY-SA 4.0. It includes Amil’s CC BY 4.0 tiger, Charles J. Sharp’s CC BY-SA 4.0 reference photograph, and index thumbnails credited in `media.json`. Preserve those credits when reusing this screenshot.

## Viewer derivatives in version 0.4

Raw bundled GLB checksums and creator licenses are unchanged. Surface normalization, skin weights and new bones for whale, turtle, monarch, eagle, penguin, owl, bear and chimpanzee are PhenoVoxel Archive viewer derivatives of the credited CC BY 4.0 assets. Preserve the original author, source, license, source checksum and modifications when reusing exported GLBs. Original atlas/UV information remains; solid body cutouts now use alpha test/depth writing. Organic material response, elephant normal contrast, chimp material tint and giraffe limb hierarchy are modified in memory. Joint counts and author/scope are in viewerRig. Original code and original reference geometry remain MIT; external artist geometry retains CC BY 4.0. No model or AI illustration is labeled as an organism photograph.

## Version 0.4.1 source-surface derivatives

The wolf viewer omits overlapping outline/duplicate shells and retains the original complete textured hero and skeleton. Source GLB bytes/checksum remain unchanged. Preserve the original Paleo Modelist/victory_mirosya attribution and CC BY 4.0 when reusing the derivative. The bear viewer rig now has 15 joints per mesh; original SDPM Esare texture/surface, source URL, license and checksum are retained. Independently authored pose controllers, contact regions and rigging code are original PhenoVoxel code. Their presence does not relabel external artist geometry as MIT or validate its anatomy.

## Version 0.4.2 surface and rig derivatives

The active standing kangaroo is a derivative of Devilmaryart’s generic artist Kangaroo, obtained without sign-in through the public Objaverse archive. Simplification ratio 0.08/error 0.0015 and joining source chunks reduce delivery size while retaining vertex-color variation and creator/license extras. The manifest records original and delivered SHA-256 hashes. Viewer color interpretation, 27 joints, skin weights and educational gait/posture controls are additional modifications; species identity and proportions need expert review. Preserve the CC BY 4.0 artist attribution with exports.

The former [Big Red](https://sketchfab.com/3d-models/big-red-red-kangaroo-0feb26693fca45bb8c4684c8b8b1b96b) by tobythy remains as the unused legacy file `model-osphranter-rufus.glb`, CC BY 4.0, SHA-256 `dc288bd05434fb9244cccededb791e87fc6c7f0567fa56f8feb86f09f3cfd26b`. It is not the active hopping model.

Dr. Keith Chan’s original chimpanzee source file/checksum remains unchanged. Viewer subdivision, display colors, short hair geometry and shared 22-joint skinning are credited derivatives. Hair attachments follow artist-derived positions; retain the original CC BY 4.0 credit and the PhenoVoxel modification notice. The implementation code is MIT. These meshes and hair ribbons are not photographs, measured anatomy, or motion capture. The referenced ASM photograph and primary papers remain at their original sources and are not bundled or relicensed.

### v0.4.3 retained surface derivatives

The original wolf and museum owl GLB bytes/checksums remain unchanged. Wolf head-region refinement preserves source UV coordinates and normalized interpolated skin influences; a soft-lip morph changes only the connected body tissue in quiet expressions, with retained dental/eye components and original feeding clip. Owl uses the original complete perched scan and texture with a 16-joint derivative; its mount is nonliving taxidermy support. Partial folded-wing opening and ankle/toe adjustment do not reconstruct full flight or contact forces. These viewer derivatives retain each creator’s CC BY 4.0 attribution; implementation is MIT. Rejected flight geometry and private references are not bundled.

### v0.4.4 tiger attachments

Original Amil tiger GLB bytes, texture, UVs, forty-seven skin joints and run clip are retained. Eyelid covers sample existing periocular atlas coordinates and attach to the source head; the closed margin is authored geometry. A morph folds the sixteen existing main claw components without replacing their source material. The textured derivatives retain Amil’s CC BY 4.0 credits; original implementation and untextured margin geometry are MIT. No new photograph or raster texture is generated. Geometry and anatomical interpretation require expert review.

### Retained textured fox and authored motion (0.4.5)

[Fox](https://sketchfab.com/3d-models/fox-4e37c303f8a241aaa2511bd9f3019273), by **Alexei Ostapenko** (https://sketchfab.com/alexanders823), is **CC BY 4.0**. Current creator metadata and embedded original GLB credits agree. The public Objaverse copy was acquired without sign-in; its 5,286,256 original bytes are unchanged (SHA-256 `30ce08713a81aef6f7974943e93b33fe2150bee4754ee4ece658e263fb9a6833`). Original two surfaces, 40 skin joints, UVs, embedded images and source clip are retained. Viewer normalization, selected artist stand/repose poses, qualitative joint motion and paw support constraints are identified as adaptations; exported poses retain these notices. Original motion code in `fox-motion.js` is MIT; the source asset and posed derivatives retain the artist’s CC BY 4.0 attribution. No artist endorsement, verified specimen or measured gait is implied.

### Original continuous axolotl reconstruction (0.4.6)

`axolotl-model.js` creates original MIT geometry, deterministic original vertex pigmentation, and an independently authored 21-joint display rig. It does not extract pixels, surfaces, angles or measurements from photographs or research papers. The LoKiLeCh organism photograph remains separately credited CC BY-SA 3.0; paper/site figures and image files are not imported. Exports identify original geometry, rig author, reference photograph, version and false validation. The original reconstruction is not a claimed specimen scan or measured anatomical skeleton.

### Posed anatomical-region links (0.4.7)

`surface-landmarks.js` is original MIT code selecting approximate regions of the existing CC BY 4.0 wolf, tiger and fox artist meshes. It changes marker positions, not the source binary assets, images, UVs, rig or behavioral geometry. Static specimen exports retain contributor, source-license and change notices and mark these surface landmarks as approximate and unvalidated.

### Original zebrafish reconstruction (0.4.8)

`zebrafish-model.js` is original MIT code/geometry with deterministic mesh pigmentation and fin rays. No externally created geometry or paper/photo pixels are imported. The separately displayed Ffish.asia organism photograph retains its existing CC BY 4.0 credit and checksum in media.json; it is not generated or replaced. Dataset source summaries are original CC BY 4.0 metadata; cited papers retain their publisher licenses. Static GLB exports identify the contributor, reference source, version, authored shared articulation and false validation flag.
