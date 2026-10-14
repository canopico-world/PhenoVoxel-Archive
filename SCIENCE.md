# Scientific provenance and validation

### Clownfish motion study (0.3.1)

The original textured artist mesh is retained. The viewer generates an axial and paired pectoral-fin skeleton; its weights, joint positions, stroke amplitudes and timing are authored approximations. [Marcoux & Korsmeyer (2019)](https://doi.org/10.1242/jeb.191791) supports qualitative combined fin use under its experimental conditions. It does not validate the rendered rig or the illustrative search/escape sequences. No hydrodynamics, prey capture, threat response or host-anemone interaction is computed. Observe is a neutral inspection pose, not evidence of biological rest. Source GLB rig metadata remains separate from `viewerRig`; all `animationValidated` flags remain false.

## What the first release contains

The starter archive links original concise descriptions to source accounts or research, rather than copying encyclopedia chapters. It uses three domains and a documented GBIF taxonomy snapshot. Species records remain drafts awaiting specialist review. No claim is made that every encyclopedia, all species, or every scientific fact has been surveyed.

Animal accounts are from the University of Michigan's [Animal Diversity Web](https://animaldiversity.org/). Plant accounts use Royal Botanic Gardens, Kew, the Royal Horticultural Society, the US National Park Service, and an Arabidopsis research report. Fungal and microbial processes link to research articles and model-organism resources; two preprints are explicitly labeled. The full per-species bibliography is in `species.json` and the viewer's Evidence & sources panel.

The [GBIF Species API](https://techdocs.gbif.org/en/openapi/v1/species) was used to match names to species-level backbone records. All 50 preparation-time matches were exact, with accepted usage keys retained. Exact name matching does **not** settle species concepts or establish current consensus about classifications.

`research-audit.json` records URL responses and taxonomic matches. Direct scripted retrieval of seven Kew sources returned HTTP 403; their content was available through web search/open instead. Three PubMed pages returned HTTP 203 and one PMC page served a browser-check page; the corresponding source abstracts were available in indexed web results. These responses are explicitly flagged rather than counted as readable articles. Raw source text is excluded from distribution and from Git. Sources should be reread when records change. Source access dates are not publication dates.

## Evidence and animation are separate

Each biological process has a description, `sourceIds`, an evidence statement, and a time-scale statement. References support the described process or natural history; they do not establish the procedural animation's trajectory, leg phase, force, response latency, or rate. Some sources are institutional summaries, others research on particular strains, life stages, or conditions. Details beyond a process paper's scope require additional sources and expert review.

The viewer's Observe mode is an inspection tool, not a behavioral observation. Rest and sleep posture are illustrative poses; they do not infer sleep physiology. Sleep is only explicitly offered for the two records whose source accounts describe it. Plants, fungi, bacteria, and archaea are not given animal-only actions. Carnivory in a plant supplies nutrients rather than replacing photosynthesis. Cetacean tail motion is vertical, fish tail motion lateral; bacterial flagella and archaeal archaella are conceptually distinguished in the notes.

## Known limitations

Version 0.2 adds authentic photographic/micrographic references, live GBIF density tiles and count/country snapshots. The reference image captions are preserved, including captive settings, subspecies, life stages and false-color microscopy where given. Specimen identifications have not been independently re-examined by specialists. Original files and their licenses are linked per record. Images do not validate the separately authored mesh or constitute a scan of that individual.

Occurrence counts request coordinates with `hasGeospatialIssue=false`. The live map uses hexagonal aggregation rather than exposing individual precise points. Geographic patterns include reporting bias, historical records, cultivation, captivity and introduced populations. Period filters change the density layer; the sidebar count remains the explicitly dated all-years snapshot. Empty or sparse areas are not established absences. The GBIF map API may generalize or cache tiles differently from search counts. Dataset-specific licenses apply to underlying records.

Wolf shoulder-height and sex-specific adult-mass ranges link to the corresponding Animal Diversity Web source. These ranges are population/sex dependent and do not calibrate the normalized 3D geometry. Further measurements require claim-level sources, units, context and uncertainty.

- Version 0.3 bundles 20 CC BY 4.0 artist models and 30 improved original reference reconstructions. Artist titles provide a candidate taxonomic interpretation, not specialist verification. Generic animals, broad species concepts, and generic artist reconstructions need review.
- Wolf and tiger retain their surfaces during all four principal actions. Wolf feeding/idle and tiger running retain creator clips; missing gaits/postures are independently authored approximations using the source skeleton and paw targets. These are not measured trajectories.
- Some other models have no complete behavior rig. They stay in the same viewer and disclose this limitation instead of switching to an unrelated schematic.
- Named features can be internal or conceptual. Numerical marker anchors are approximate regions, not anatomical landmarks.
- Walking, jumping, and swimming lack a calibrated musculoskeletal or fluid model. Gaits are illustrative and often simplified.
- Plants and fungi use compressed, repeating growth loops, not development models with conservation of mass.
- The habitat pedestal is decorative. It is not a georeferenced reconstruction or environmental niche model.
- Behavior depends on sex, stage, strain, population, substrate, light, temperature, and context. Those variables are not parameterized here.
- Giraffe, barn owl, common octopus, moon jelly, and fly agaric may need narrower geographic or taxonomic concepts.
- GBIF can use different family or kingdom classifications than specialist authorities. The provider's classification is preserved explicitly.
- General natural-history statements and process-specific papers have different evidence scope. This release does not provide a complete claim-by-claim systematic review.

## Path to validated simulations

1. Define the taxon concept, population, strain, life stage, and context, with stable identifiers and source dates.
2. Add claim-level references for every measurement and biological statement, including uncertainty and units.
3. Replace the schematic with a licensed, measured model and annotated anatomy.
4. Author a species-specific rig and measured behavior trajectories; document methods and conditions.
5. Define the simulation model, parameters, equations, numerical method, and reproducibility metadata.
6. Compare model predictions with independent observations. Publish errors, limitations, and review records.
7. Mark specific claims or simulations validated only after review; never automatically promote an entire record because a URL or test passes.

Keep the educational viewer and quantitative simulation layer distinguishable. Contributions can add depth one species at a time without presenting illustrative playback as measured behavior.

## Version 0.4 posture and motion interpretation

The 50-species visual review does not validate anatomy or gait. Wolf/tiger sit, sternal rest and sleep postures preserve source limb lengths and use display-floor paw contact; eyelids and physiological sleep are not modeled. New artist-surface rigs use viewer-authored skin weights and qualitative trajectories. Per-action JSON rendering status identifies partial or unavailable behaviors. Ren et al. (2008) elephant kinematics, Gravett et al. (2017) two-matriarch activity/position observations, and wild green turtle kinematics (2022) are condition-specific primary sources linked in species records; their measured trajectories are not imported. Bacterial/archaeal rotary appendages, eukaryotic flexible flagella, ciliary beating and amoeba shape changes remain conceptual. Counts, speed, force and scale are uncalibrated. Photo captions, false-color microscopy distinctions, licensing, and recorded-occurrence-versus-native-range limits remain applicable.

## Version 0.4.1 support and gait context

Ground contact is a normalized display constraint, not a force solution. Sternal repose uses torso/forepaw support; curled or side-resting hind feet need not be planted flat. Source-specific paw regions exclude long metatarsal shafts where possible; wrist frames and digit frames are distinct. These choices are visually guided and not measured joint trajectories. The generic bear artist surface gains an independently authored 15-joint rig. Shine et al. (2015), DOI 10.1242/jeb.121806, provides condition-specific grizzly gait context, including running walk, from four adult females; its recorded forces and trajectories are not imported. Quiet standing Rest is not recumbency or hibernation. The Smithsonian tiger photograph is an individual captive reference with disease-related context, not a normative anatomical dataset.

## Version 0.4.2 kangaroo and chimpanzee context

The standing kangaroo is a generic artist interpretation adapted to the red-kangaroo record, not a measured specimen or verified sex. O’Connor et al. (2014), DOI 10.1098/rsbl.2014.0381, guides qualitative paired-limb and active tail-support context in slow travel. Its five study animals and force-platform conditions do not validate this mesh, rufous color interpretation, hopping dynamics or independently timed paths. Ground contact is geometric; tail propulsion forces are not calculated. The female pouch is described in the record but absent from the mesh. Forage is a posture/search study without chewing or ingestion; upright Rest is not sleep.

Chimpanzee wrist/hand attention is linked to Thompson (2020), DOI 10.1242/jeb.224360, read with its 2021 correction, DOI 10.1242/jeb.242409. A primary 2013 simulation study supplies gait context without importing its dynamics or optimization. The actual ASM side-view photograph and bundled wild-animal photograph were visually inspected. Shared limb/digit skinning, smoothed artist geometry and generated short fur remain qualitative. Collective finger curling does not reproduce measured individual finger contacts, grip forces or a calibrated gait. Seated Rest and supported search are educational poses; physiological sleep, feeding and ingestion are absent. All animationValidated flags remain false.

### v0.4.3 facial and perched posture scope

The quiet wolf lip/jaw pose is an independently authored tissue interpretation, compared with the bundled real wolf photograph. It preserves teeth and eye components and the creator feeding clip; it is not a measured craniofacial model. Eyelids and physiological sleep remain absent. Refinement is restricted to the head to preserve the existing display-ground support study.

The owl scan is a mounted museum specimen, whose block is not anatomy. Its new partial wing opening, head search and small ankle/toe adjustments are qualitative perched studies. A horizontal-flight prototype was visually rejected for body distortion and is not in the viewer. Full flight and separate expanded feather geometry remain pending. Durston et al. (2019), DOI 10.1242/jeb.185488, studied one adult female trained owl; three selected gliding instants are not measured flap timing. Manuscript text was read from NIH NLM PubMed Central Article Datasets, PMC6525094.1 (TDM); full text and images are not redistributed. The Dryad CC0 metadata is available, but original images were not retrieved. A Commons photograph of an actual owl in flight was viewed privately as a visual reference; no new organism photograph is generated.

### v0.4.4 tiger quiet poses and display framing

The tiger’s slight torso lean, closed eyelid covers and main-claw folding are independently authored posture studies. The original forty-seven skin joints, eyeballs, atlas and creator run are retained. [San Diego Zoo’s account](https://animals.sandiegozoo.org/animals/tiger) supports retractable-claw function during walking; it supplies no calibrated angles for this mesh. The source artist modeled sixteen main claws; forelimb dewclaws, sheath/P3 mechanics, muscle/force states and sleep physiology remain absent. The Smithsonian photograph remains an individual captive reference with age-related disease, not normative joint data.

Camera fitting is a display operation on visible posed vertices. It preserves whole-organism framing above controls across aspect ratios and anatomical views; hidden/unreferenced scan vertices do not set the frame. Growth uses the neutral maximum bounds to avoid progressively cropping growing surfaces. It does not change biological scale or validate geometry.

### Red fox retained artist motion (0.4.5)

The generic Alexei Ostapenko Fox is interpreted as Vulpes vulpes from its visible morphology and coloration, without specimen, sex, population or life-stage verification. The creator’s complete original GLB and 40-joint skeleton remain intact. A stable standing frame and its original recumbent bind pose provide qualitative visual poses. The authored four-beat walk and supported head search are educational studies; display contacts are not force measurements or inverse-dynamics validation. The [University of Michigan red-fox account](https://animaldiversity.org/accounts/Vulpes_vulpes/) supports the written natural history, coloration, sensory search and pouncing context; it does not supply gait trajectories or calibrate this artist model. Pouncing remains explicitly unavailable. No living-animal sleep physiology is inferred from the recumbent pose.

Primary context: [Yuk et al. (2024)](https://pubmed.ncbi.nlm.nih.gov/38683988/) studies printed skull impact, rather than living-fox gait. Their [experimental reply](https://pmc.ncbi.nlm.nih.gov/articles/PMC11331077/) uses a pale-fox skull and acknowledges omitted forepaw, soft-tissue and open-jaw effects. These papers support retaining explicit limits around pending pouncing; no study media or numerical data is imported.

### Continuous axolotl morphology and swimming (0.4.6)

The original native reconstruction now has a connected head, trunk and finned tail, tapered articulated limbs and typical four foredigits/five hind digits. The [primary captive-colony limb survey](https://pmc.ncbi.nlm.nih.gov/articles/PMC4346137/) supports typical digit counts while documenting abnormal/injured individuals; the model does not represent all individual variation. [Adult-axolotl swimming research](https://pubmed.ncbi.nlm.nih.gov/9319776/) recorded eight animals in stationary water and supports lateral anguilliform body/tail movement with variable amplitude profiles. Its abstract was reviewed; no measured waveform, angles, speed, efficiency or force data are imported. Display swimming and bottom walking remain independently authored qualitative illustrations. [SDZWA Library morphology](https://ielc.libguides.com/sdzg/factsheets/axolotl/characteristics) and [Sacramento Zoo gills](https://www.saczoo.org/axolotl) support broad external form, dark wild-type pigmentation and six feathery gill stalks. Pigmentation is deterministic original vertex color, not an organism photograph, scan or histological tissue map. Gas exchange, suction feeding, internal anatomy and physiological states remain outside this reconstruction.
