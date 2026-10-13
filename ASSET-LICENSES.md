# Photographic and map assets

`photo-*.jpg` and `photo-*.png` are authentic Wikimedia Commons photographs or microscope/source images. **They are not covered by the repository's MIT license or the original-summary CC BY 4.0 license.**

For each file, `media.json` records the local filename, original source/file-description URL, author, license name and URL, caption, retrieval date and credit. These fields are also included in its `species.json` record. Keep the author and license with any redistributed image. Follow CC BY-SA share-alike terms for image adaptations. Images are bundled as received from the Commons thumbnail service; the viewer crops them using CSS and offers an uncropped reference view. Do not imply that the author endorses this project or that a reference individual was scanned.

Wikimedia API documentation: https://commons.wikimedia.org/wiki/Commons:API/MediaWiki

Preserved source captions/credits remain external material; Wikimedia Commons unstructured file-description text is under its applicable CC BY-SA terms, while structured file-namespace metadata is CC0. Follow each source page's terms. The project's original-summary license does not replace those terms.

`world.json` is the 1:110 million land dataset from Natural Earth, obtained from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson. Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/.

GBIF taxonomy, occurrence metadata and live density tiles are attributed to GBIF. The country/count snapshot is in `atlas.json`, with its exact query and retrieval date. Individual occurrence datasets may have different licenses (CC0, CC BY or CC BY-NC); follow the dataset licenses when reusing the underlying records. This project does not claim an original-data license over those underlying records or remote tiles.

Original authored procedural geometry, including `natural-models.js`, is MIT licensed. It is guided by organism morphology and reference photographs, not extracted from or licensed as a scan of those photographs. All motion remains unvalidated.

The online **Animated Wolf** by **igor-lir** and **Running Tiger** by **Amil (francescolima74)** are served through their creators' Sketchfab viewers under **CC BY 4.0**. `model-assets.json` records source links, attribution, license and scope. Their geometry is not bundled in this repository or included in MIT exports. They are artist reconstructions, not independently verified specimen scans or biomechanics. Embedded clips and local illustrative behavior playback are separate. Follow the original source's download and attribution requirements to obtain/reuse those files.

`preview-v0.2.jpg` is an actual browser capture of this release, shared as a composite under CC BY-SA 4.0. It includes the credited igor-lir wolf (CC BY 4.0), the User:Mas3cf wolf photograph (CC BY-SA 4.0), and index thumbnails whose credits are in `media.json`. Preserve those credits when reusing the screenshot. It is not a generated mockup.
