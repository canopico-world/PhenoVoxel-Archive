# Scientific provenance and validation

## What the first release contains

The starter archive links original concise descriptions to source accounts or research, rather than copying encyclopedia chapters. It uses three domains and a documented GBIF taxonomy snapshot. Species records remain drafts awaiting specialist review. No claim is made that every encyclopedia, all species, or every scientific fact has been surveyed.

Animal accounts are from the University of Michigan's [Animal Diversity Web](https://animaldiversity.org/). Plant accounts use Royal Botanic Gardens, Kew, the Royal Horticultural Society, the US National Park Service, and an Arabidopsis research report. Fungal and microbial processes link to research articles and model-organism resources; two preprints are explicitly labeled. The full per-species bibliography is in `species.json` and the viewer's Evidence & sources panel.

The [GBIF Species API](https://techdocs.gbif.org/en/openapi/v1/species) was used to match names to species-level backbone records. All 50 preparation-time matches were exact, with accepted usage keys retained. Exact name matching does **not** settle species concepts or establish current consensus about classifications.

`research-audit.json` records URL responses and taxonomic matches. Direct scripted retrieval of seven Kew sources returned HTTP 403; their content was available through web search/open instead. Three PubMed pages returned HTTP 203 and one PMC page served a browser-check page; the corresponding source abstracts were available in indexed web results. These responses are explicitly flagged rather than counted as readable articles. Raw source text is excluded from distribution and from Git. Sources should be reread when records change. Source access dates are not publication dates.

## Evidence and animation are separate

Each biological process has a description, `sourceIds`, an evidence statement, and a time-scale statement. References support the described process or natural history; they do not establish the procedural animation's trajectory, leg phase, force, response latency, or rate. Some sources are institutional summaries, others research on particular strains, life stages, or conditions. Details beyond a process paper's scope require additional sources and expert review.

The viewer's Observe mode is an inspection tool, not a behavioral observation. Rest and sleep posture are illustrative poses; they do not infer sleep physiology. Sleep is only explicitly offered for the two records whose source accounts describe it. Plants, fungi, bacteria, and archaea are not given animal-only actions. Carnivory in a plant supplies nutrients rather than replacing photosynthesis. Cetacean tail motion is vertical, fish tail motion lateral; bacterial flagella and archaeal archaella are conceptually distinguished in the notes.

## Known limitations

- Models share procedural families and species-specific traits; they are not scans or anatomically verified meshes.
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
