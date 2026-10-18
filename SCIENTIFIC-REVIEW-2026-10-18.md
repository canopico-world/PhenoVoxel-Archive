# PhenoVoxel Archive: taxonomy and model-quality checkpoint

Release 0.6.4 · 18 October 2026 · **In progress**

This is an automated editorial comparison, not an independent professional-scientist determination. The requested 90% accuracy has **not** been established. The archive contains authored illustrations rather than measured physiological or biomechanical simulations. No specialist credentials, independent certification or six completed active review hours are claimed.

## Coverage and evidence

| Check | Recorded coverage | Limit |
| --- | ---: | --- |
| Binomial/name-rank checks | 250 of 250 | Nominal species concepts; not diagnostic specimen identification |
| Exact ITIS name strings | 190 | 188 valid/accepted; two non-accepted entries conflict with the botanical authority retained here |
| ITIS entries with English names | 113 | 67 current labels match after punctuation/case normalization; variants are not automatically errors |
| Direct Smithsonian institutional accounts | 3 | Gray wolf, tiger and green turtle; not museum specimen determinations |
| Fresh individual model comparisons | 25 of 250 | First 25 animals only; 225 current-pass comparisons remain pending |
| Baseline rendered samples | 406 | Actual WebGL2 side/front/top and sampled enabled actions |
| Initial model corrections | 2 | Tiger walking targets and rabbit pigment; residual anatomy problems remain |
| After-correction rendered samples | 14 | Same credited tiger/rabbit meshes; photographs untouched |
| Independently biologically validated models | 0 | No calibrated percentage can be assigned |

The [public individual register](https://www.canopico.tech/phenovoxel/reviews/2026-10-18-quality/index.html) contains all 250 names, 25 individual morphology/surface/posture/motion assessments, real-image credits, 27 screenshot sheets, source links and remaining issues. Its [JSON](public/reviews/2026-10-18-quality/review.json) records action, authored time, view, model identity and capture date. Pending entries have no model score. Earlier dated reviews remain linked but are not counted as fresh review in this checkpoint.

The ordinal rubric is dimension-specific: 0 = absent mechanism/no credible representation in scope; 1 = major visible omissions or mismatch; 2 = partial visible agreement with significant unmeasured limitations; 3 = measured multiview/trajectory comparison with stated errors and independent validation. Level 3 is not awarded. **Do not sum these scores or convert them to percentages.** Physiology is not calculated and receives no inferred credit from pose or closed eyes.

## Names, ranks and navigation

The full species binomial is the primary list label. Domain, kingdom, phylum/class and selected animal clades provide context; order/family and alphabetical names organize siblings. This is a selected taxonomic hierarchy, not a complete phylogeny, age ladder or assertion that the alphabetical order is an evolutionary branching sequence. Bird/crocodilian archosaur context and the separate mammalian synapsid branch are explicit. ITIS hierarchy supplies four disclosed navigation corrections: turtle/crocodile Reptilia and both fish Teleostei. Original GBIF concepts remain available for comparison.

Every existing accession/URL is retained. No genus, subspecies or alias is added as a new species. Existing binomials passing a string/rank check still require scrutiny of species complexes, changing circumscriptions, hybrids, cryptic taxa, source identification, sex, stage and population. In particular, giraffe taxonomic concepts, nominal *Octopus vulgaris* and *Aurelia aurita*, and broad microbial image identifications are not resolved by this audit.

`taxonomy-audit.json` records individual ITIS TSNs, usage status, English vernaculars, GBIF keys/canonical strings, name decisions and authority links. ITIS is a Smithsonian-partnered resource; it is **not** a direct Smithsonian collection determination. The Smithsonian Entomology collection search itself warns that common-name associations are a work in progress. Therefore the requested Smithsonian-wide common-name verification remains incomplete. Labels without an exact ITIS English equivalent are retained rather than replaced by a guessed vernacular.

Specific disclosed conflicts:

- *Osphranter rufus*: valid ITIS combination versus GBIF's *Macropus rufus* concept. One species record is retained.
- *Vorticella campanula*: NIES spelling retained; GBIF's `campanulla` spelling linkage stays explicit.
- *Salvia nemorosa* and *Zinnia elegans*: Kew acceptance retained despite non-accepted ITIS entries. The complete accepted Zinnia page was retrieved; Salvia acceptance was visible in the primary search result, while direct full-page retrieval was rate-limited.
- *Escherichia coli*, *Myxococcus xanthus* and *Lactiplantibacillus plantarum*: LPSN species identities retained, but stored GBIF usages resolve to informal `_E`/`_A` genome clusters with genus-level `spec.` canonical strings. Those original associations, query/count snapshots and confidence values remain provenance, **not whole-species identity evidence**. Core records and atlas snapshots now carry explicit unresolved/ineligible flags; live species-wide maps/counts are withheld. No random checklist key was substituted.

Modern Bacteria and Archaea remain separate domains. Legacy Monera and Protista are reporting conveniences, not modern monophyletic kingdoms. The 250-record reporting mix is unchanged: 103 Animalia / 72 Plantae / 36 Fungi / 25 legacy Protista / 14 legacy Monera.

## Initial model corrections

**Tiger.** The credited source geometry, material atlas, 47-joint skeleton and creator Run remain unchanged. Walking now uses an authored lateral sequence with distinct fore/hind stance and recovery targets, fixed segment lengths, an analytic two-link forelimb solver, hind hock offsets and sampled paw-sole constraints. The 0.62 Hz cycle, 70% duty factor and target dimensions are **authored software parameters**, not measured tiger data. Twenty-four sampled phases check software support/clearance/reset and source preservation. Quiet-state limb folding, trunk compression, wrist/claw anatomy, skin deformation and real trajectory agreement remain unresolved.

**European rabbit.** The original pied artist model is retained on disk. A viewer-only numerical gray-brown/agouti-like pigment field and paler underside replace large domestic colour blocks on the existing UV atlas. This follows the broad wild-coat description in the linked species account, not a measured individual's coat. Eye, nose and inner-pinna tissue regions and fine source detail are retained; source geometry, UVs and skeleton are unchanged. Actual review caught bright patch-outline halos in the first candidate; high-contrast boundary detail was suppressed and UV islands padded before the final capture. Head/eye/ear proportions still reflect the domestic source and need correction. Pigment is not an organism photograph, photogrammetry or a verified wild phenotype.

Wolf and tiger still use their same credited textured models for behavior playback. No schematic behavior substitute is introduced. Other reviewed animals are **not** claimed fixed: the register records coarse wolf facial/ruff anatomy, chimpanzee hand support, turtle shell/scute geometry, axolotl gills, eagle folded-wing coverage, penguin scan artifacts, octopus radial repetition, frog cranial/surface simplification and other specific residuals.

Final compiled inspection also found two rabbit action captions and its fidelity summary still describing the historical pied presentation. Those current descriptions were corrected to identify the gray-brown viewer derivative. The revision ledger preserves the prior text; the original research source scopes and historical artist-change notices are retained.

## Source provenance and limits

Primary/authoritative sources consulted in this pass include [ITIS service documentation](https://www.itis.gov/web_service.html) and individual returned records; Smithsonian [gray wolf](https://www.nationalzoo.si.edu/animals/gray-wolf), [tiger](https://nationalzoo.si.edu/animals/tiger), [green turtle](https://ocean.si.edu/ocean-life/reptiles/green-turtle) and [Entomology collection search](https://collections.nmnh.si.edu/search/ento/); LPSN species accounts for [E. coli](https://lpsn.dsmz.de/species/escherichia-coli), [M. xanthus](https://lpsn.dsmz.de/species/myxococcus-xanthus) and [L. plantarum](https://lpsn.dsmz.de/species/lactiplantibacillus-plantarum); Kew [Z. elegans](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:261331-1) and [S. nemorosa](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:456774-1); and [NIES Vorticella](https://www.nies.go.jp/chiiki1/protoz/morpho/ciliopho/vorticel.htm). The broad eukaryote context follows [Adl et al. 2019](https://doi.org/10.1111/jeu.12691), with indexed/abstract access rather than a claimed full reread. [Crawford et al. 2012](https://pubmed.ncbi.nlm.nih.gov/22593086/) supplies primary phylogenomic context for birds, crocodilians and turtles.

The [Animal Diversity Web rabbit account](https://animaldiversity.org/accounts/Oryctolagus_cuniculus/) provides species-level descriptive context for wild versus domestic coats. This is an authoritative secondary account, not a measured motion dataset. Real licensed photographic references are separately credited with source URLs and SHA-256 in each record. An individual photograph cannot validate all anatomy, seasonal variation or motion. The report's other archive links preserve traceability; their presence does not mean every paper was reread in full during this pass. Captcha/rate-limited pages were not bypassed or represented as successfully read.

No generated media are called real organism photographs. No assets were purchased, no paid generation was used and no credentials/security settings or synced project sources were modified. Artist/media licenses and source checksums remain in `model-assets.json`, `media.json`, record data and `ASSET-LICENSES.md`.

## Software review, publication and continuation

All **78 software tests pass**: database/photo/asset provenance, historical snapshot reproduction, hierarchy/search coverage, explicit map quarantines, finite geometry, retained source surfaces, pose reset, tiger support/recovery and rabbit atlas preservation. These tests establish software properties only. `npm run build` succeeds; the existing large-bundle warning remains. A diagnostic capture-timing bug was corrected privately: the canvas is read synchronously after painting, before the WebGL buffer can be discarded. All 420 included samples passed a non-uniform-pixel check and their 27 sheets were visually inspected; pixel variance alone is not a model-quality check.

`species-revisions.json` describes five narrow metadata/association corrections. `revision-baseline.mjs` reverses only those recorded fields after verifying their current values; previous 150- and 200-record snapshot hashes still pass. The ledger cannot conceal unrelated edits or alter original source binaries.

Publication is complete only when the local dated publication proof confirms the GitHub commit, successful Pages build, matching public data/script bytes and actual custom-domain UI/model/report inspection. The first checkpoint must not be described as the complete collection-wide quality pass.

Work began at 2026-10-18 15:26:55 UTC (22:26:55 Asia/Bangkok). A temporary hourly continuation is bounded through October 19, 05:30 Asia/Bangkok. The local run ledger records actual active segments separately from idle scheduling; that window is not six active review hours. Local follow-ups require the computer and desktop app to remain running. Next priorities are the 225 unreviewed current-pass models, especially repetitive plant/fungal/cellular forms, followed by the per-species correction queue. A full accuracy claim requires defined anatomical/kinematic benchmarks, error tolerances, suitable reference datasets and independent taxon specialists.
