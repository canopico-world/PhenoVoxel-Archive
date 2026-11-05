# Cetacean source surfaces — v0.6.77

These are edited artist reconstructions, not photographic scans. Software remains MIT; that does not replace the model and material grants below. Exact delivered-file hashes, original source hashes, geometry counts and map dimensions are in `cetaceans-source-v0677.json`.

| Imported source | Creator | Grant | Edited archive surfaces |
| --- | --- | --- | --- |
| [Sei Whale](https://sketchfab.com/3d-models/sei-whale-7678f86f91284b5587f7fbde3389b209) | Bohdan Lvov / ostapblendercg | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Sei; Rice; coastal Eden and offshore Bryde display profiles |
| [Whale Southern Minke Pose](https://sketchfab.com/3d-models/whale-southern-minke-pose-c905f4b686524efbba73b2b73dfee306) | Bill Nguyen / bill_nguyen | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Separate common and Antarctic minke sculpts and skins |
| [Long Finned Pilot Whale](https://sketchfab.com/3d-models/long-finned-pilot-whale-55ce704ea0164178ad3acaa67c04d2bd) | allthingsaurus | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Long-finned pilot; neutral source exterior and replacement movement |
| [Delfin Risso](https://sketchfab.com/3d-models/delfin-risso-e9d97f00de3948218f0388e8a2a117df) | ivan.geraldo | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Risso-specific body, edited adult skin and replacement movement |
| [Fin Whale](https://sketchfab.com/3d-models/fin-whale-fb69578cfaaf45969f3118de4103d03b) | Johann Woelper | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) | Caperea and Omura derivatives of the existing user-supplied source. Noncommercial restriction retained. |

The three requested downloadable sources were obtained through Sketchfab's normal logged-in download controls. A separately licensed Risso-specific donor was obtained the same way. The supplied fin-whale source and its original archive remain unchanged; see `FIN-WHALE-LICENSES-v0655.md` for that earlier conversion.

Changes: neutral source surfaces are baked into normalized coordinates. Sei and minke topology receives two Loop refinement levels. Local sculpt differentiates the requested taxa; the two minkes have distinct vertex positions. Minke body/appendage UV charts are replaced to separate overlapping areas, and source detail is transferred into edited pigment, normal and roughness maps. Other surfaces retain their source UV layout. All optical maps are edited derivatives; no unchanged-image-payload claim is made. The enlarged output maps do not recover detail absent from the native source images. Original imported animation clips are replaced by authored local exterior motion. Risso inset eye geometry is an archive addition.

The following linked models had downloads disabled on 5 November 2026 and are visual references only, with the user's agreement. Their meshes, textures and thumbnails are not extracted or redistributed:

- [Pygmy right whale — Paddlefish_MSM](https://sketchfab.com/3d-models/pygmy-right-whale-dff63643dcd1453b9c7b3c9115de2252)
- [Vågehval — roste](https://sketchfab.com/3d-models/vagehval-balaenoptera-acutorostrata-50d84a4d3a5c42b88800a03049ff561e)
- [Bryde's Whale — catfishyay](https://sketchfab.com/3d-models/brydes-whale-balaenoptera-edeni-74b3d06cc4a74b90903f0b4210a61117)
- [Grindhval — roste](https://sketchfab.com/3d-models/grindhval-globicephala-melas-3c9d1f69a4c74a6aa0cb7a31a8885d30)
- [Risso's dolphin — Major](https://sketchfab.com/3d-models/rissos-dolphin-grampus-griseus-f56e629915c24459897ea8f902bcbcbb)

Rendered review sheets containing Caperea or Omura include CC BY-NC 4.0 elements. Their grants must be respected alongside the CC BY elements and creator credits. No external organism photograph is projected onto or newly redistributed with these derivatives.

Rebuild: place the licensed originals at the input paths listed in `cetaceans-source-bake-v0677.mjs`, run that geometry bake, then run `node cetaceans-source-build-v0677.mjs`. Source files remain the creators' works; the scripts do not provide an alternative download route or a new license.
