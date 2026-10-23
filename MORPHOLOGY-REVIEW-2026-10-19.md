# PhenoVoxel Archive · morphology and development correction pass

October 19, 2026. Unpublished local candidate v0.6.12-quality.1. The public baseline remains 250 records at v0.6.11 (fa903f6). No new browser screenshot or publication success is claimed.

Plantae here follows the source-backbone kingdom and includes seven green algal records stored in the Microeukaryotes reporting group. The 72 land-plant records are the development-policy subset; algae do not receive seed/flower stages.

The current request covers 232 existing public records, plus 43 relevant records among the 50 saved, unpublished expansion drafts. Those expansion drafts are preserved in the original checkout and are excluded from this release checkout. Full species-by-species visual/scientific review is unfinished. No calibrated percentage, independent specialist validation or research-grade physiological simulation is claimed.

| Requested group | Existing public records | Including saved drafts |
|---|---:|---:|
| Mollusca | 26 | 26 |
| Cnidaria | 30 | 30 |
| Ciliophora | 12 | 12 |
| Myzozoa | 2 | 2 |
| Fungi | 36 | 44 |
| Plantae | 79 | 94 |
| Other Animalia | 47 | 67 |

## Prepared corrections

Two plant developmental sequences and two abalone anatomy corrections are local candidates. Seventy other live land-plant catalogue records now withhold unsupported development rather than execute mature-form resizing. The existing species records, references, same-model touch/trap responses and Dryopteris frond unfolding remain available. This capability withdrawal is not a completed realism correction for those seventy species.

### Helianthus annuus

Method: source-code inspection and adult reference photograph; current rendered model review blocked. Reference: [credited source image](https://commons.wikimedia.org/wiki/File:Sonnenblume_Helianthus_1.JPG).

Before (code/reference findings):

- Development lacked separate seed/cotyledon geometry.
- Only one early opposite true-leaf pair was authored.
- Global XYZ rotations reversed local blade tilt on some azimuths; sampled juvenile blade penetrated the platform.

Prepared change:

- Separate fruit, radicle/hypocotyl, cotyledons, true leaves, green head bud and ray opening.
- Two selected early opposite pairs, then alternate leaves; local YXZ blade orientation.
- Fixed root scale, positive organ transforms, supported juvenile blades and nonlooping normalized timeline.

Remaining:

- No validated seed coat rupture, full root system, measured internode/leaf dimensions or physiological growth.
- Uniform simplified disc-floret mesh does not reproduce spatially progressing anthesis/anther/style development.
- Seed/bud/leaf geometry and surface realism still require actual rendered comparison.

### Arabidopsis thaliana

Method: source-code inspection, adult reference photograph and selected primary stage tables; current rendered model review blocked. Reference: [credited source image](https://commons.wikimedia.org/wiki/File:Arabidopsis_thaliana.jpg).

Before (code/reference findings):

- No separate seed/cotyledon stage.
- The mature flowering shoot and small petal geometry participated in early emergence.

Prepared change:

- Authored seed/cotyledon attachments precede rosette, bolting, green buds and flower opening on retained creator geometry.
- Shoot/petal visibility is gated by developmental phase; source topology and UVs remain intact.

Remaining:

- Siliques visible in the reference photograph are absent.
- Bud/floral organ geometry, root architecture, seed coat mechanics and cotyledon proportions are authored approximations.
- No measured growth rate, photoperiod response or physiological model.

### Haliotis rufescens

Method: source-code inspection, heavily epibiont-covered living reference photograph and indexed institutional morphology description; current rendered model review blocked. Reference: [credited source image](https://commons.wikimedia.org/wiki/File:Haliotis_rufescens.jpeg).

Before (code/reference findings):

- Same five-open-pore shell template as H. tuberculata.
- Pending feeding action labelled particle capture.

Prepared change:

- Selected four open pores within the reported usual 3–4 range, with a more domed authored shell.
- Dark exposed tissue/yellowish ventral color cues; pending feeding label describes algal grazing.

Remaining:

- The photograph has substantial epibionts; authored bare-shell coating does not reproduce these organisms.
- Coiling, closed pore scars, head, epipodial anatomy, shell ornament and radular/pedal biomechanics remain incomplete.
- Pore count varies; four is a selected example, not an invariant diagnostic.

### Haliotis tuberculata

Method: source-code inspection, shell-only photograph and institutional morphology description; current rendered model review blocked. Reference: [credited source image](https://commons.wikimedia.org/wiki/File:Haliotis_tuberculata_tuberculata.jpg).

Before (code/reference findings):

- Shared five-open-pore template and dome height with red abalone.
- Shell-only reference carried a generic REAL ORGANISM badge.
- Pending feeding action labelled particle capture.

Prepared change:

- Selected six open pores and lower ear-shaped dome; usual published range is 5–7.
- Reference badge/caption identifies shell evidence and excludes live soft-body/motion inference.
- Pending feeding label describes algal grazing.

Remaining:

- Reference shell cannot validate living head, foot, tentacles or motion.
- Closed pore scars, coiling, spiral sculpture, mantle anatomy and locomotion remain incomplete.
- Six is a selected example, not a fixed species trait.

## Source scope

- [Schneiter & Miller (1981)](https://doi.org/10.2135/cropsci1981.0011183X002100060024x): publisher abstract read for sunflower vegetative/reproductive sequence; no measured dimensions or timing imported.
- [Cornell CALS sunflower account](https://cals.cornell.edu/weed-science/weed-profiles/common-sunflower): cotyledon shape and early opposite/subsequent alternate leaves; selected description read.
- [Boyes et al. (2001)](https://doi.org/10.1105/tpc.010011): selected primary text/tables read; stage order used, experimental calendar values not transplanted.
- [Marshall et al. (2023)](https://doi.org/10.7554/eLife.80984): selected indexed primary text/figure caption read. Spatially progressing sunflower disc anthesis is a remaining requirement, not an implemented clock model.
- [UC Santa Cruz MARINe red abalone account](https://marine.ucsc.edu/target/haliotis-rufescens/): indexed morphology description read; direct page returned a gateway error. Usual 3–4 open pores, dark mantle/tentacles, yellowish sole; not an invariant pore count.
- [MarLIN green ormer](https://www.marlin.ac.uk/species/detail/1692) and [Naturalis morphology](https://ns-mollusca.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/nsr_taxon.php?id=121566): selected descriptions read; usual 5–7 open pores and low ear-shaped shell.
- [UC Berkeley fern reproduction](https://botanicalgarden.berkeley.edu/learn/garden-stories/fern-reproduction/): germinating spores/gametophytes precede sporophytes; fern life cycles must not be relabelled seed germination.

All four existing credited reference images were viewed. Image/GLB source bytes, licenses and creator attribution are retained. Added geometry/material fields are original numerical artwork, not organism photographs, scans or measured anatomy.

## Review and release gate

Current new rendered captures: **0**. The browser cannot attach newly opened preview pages, and navigation of an existing agent review tab also times out. Local Vite HTTP and the build work, but successful HTTP is not visual review. Source/geometry tests cannot establish photorealism or biological accuracy. Required before publication: nonblank side/front/top images; seed, seedling, leaves, bud and bloom comparisons for both plants; close-up shell pore/soft-tissue comparisons; source/asset export and production checks. Reinspect seedling visibility/camera framing, bud transitions and all same-model resets.

The remaining cnidarians, ciliates, myzozoans, fungi, plants and Animalia locomotion/postures require individual source-and-render comparisons. Existing published initial corrections are not full validation. The machine-readable register has one entry per requested current/local species, with separate checks and explicit pending status; empty screenshots or null scores mean not assessed, not passed.

## Individual register

| Species | Group | Publication | This pass |
|---|---|---|---|
| Panthera tigris | Animalia | existing public | individual visual/source/motion comparison pending |
| Canis lupus | Animalia | existing public | individual visual/source/motion comparison pending |
| Loxodonta africana | Animalia | existing public | individual visual/source/motion comparison pending |
| Giraffa camelopardalis | Animalia | existing public | individual visual/source/motion comparison pending |
| Osphranter rufus | Animalia | existing public | individual visual/source/motion comparison pending |
| Oryctolagus cuniculus | Animalia | existing public | individual visual/source/motion comparison pending |
| Vulpes vulpes | Animalia | existing public | individual visual/source/motion comparison pending |
| Ursus arctos | Animalia | existing public | individual visual/source/motion comparison pending |
| Pan troglodytes | Animalia | existing public | individual visual/source/motion comparison pending |
| Tursiops truncatus | Animalia | existing public | individual visual/source/motion comparison pending |
| Megaptera novaeangliae | Animalia | existing public | individual visual/source/motion comparison pending |
| Haliaeetus leucocephalus | Animalia | existing public | individual visual/source/motion comparison pending |
| Aptenodytes forsteri | Animalia | existing public | individual visual/source/motion comparison pending |
| Tyto alba | Animalia | existing public | individual visual/source/motion comparison pending |
| Chelonia mydas | Animalia | existing public | individual visual/source/motion comparison pending |
| Crocodylus niloticus | Animalia | existing public | individual visual/source/motion comparison pending |
| Ambystoma mexicanum | Animalia | existing public | individual visual/source/motion comparison pending |
| Agalychnis callidryas | Animalia | existing public | individual visual/source/motion comparison pending |
| Amphiprion ocellaris | Animalia | existing public | individual visual/source/motion comparison pending |
| Danio rerio | Animalia | existing public | individual visual/source/motion comparison pending |
| Octopus vulgaris | Mollusca | existing public | individual visual/source/motion comparison pending |
| Apis mellifera | Animalia | existing public | individual visual/source/motion comparison pending |
| Danaus plexippus | Animalia | existing public | individual visual/source/motion comparison pending |
| Lumbricus terrestris | Animalia | existing public | individual visual/source/motion comparison pending |
| Aurelia aurita | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Mimosa pudica | Plantae | existing public | individual visual/source/motion comparison pending |
| Dionaea muscipula | Plantae | existing public | individual visual/source/motion comparison pending |
| Nepenthes rajah | Plantae | existing public | individual visual/source/motion comparison pending |
| Helianthus annuus | Plantae | existing public | local correction candidate; screenshot comparison pending |
| Arabidopsis thaliana | Plantae | existing public | local correction candidate; screenshot comparison pending |
| Ginkgo biloba | Plantae | existing public | individual visual/source/motion comparison pending |
| Sequoia sempervirens | Plantae | existing public | individual visual/source/motion comparison pending |
| Quercus robur | Plantae | existing public | individual visual/source/motion comparison pending |
| Nelumbo nucifera | Plantae | existing public | individual visual/source/motion comparison pending |
| Dryopteris filix-mas | Plantae | existing public | individual visual/source/motion comparison pending |
| Amanita muscaria | Fungi | existing public | individual visual/source/motion comparison pending |
| Pleurotus ostreatus | Fungi | existing public | individual visual/source/motion comparison pending |
| Agaricus bisporus | Fungi | existing public | individual visual/source/motion comparison pending |
| Saccharomyces cerevisiae | Fungi | existing public | individual visual/source/motion comparison pending |
| Neurospora crassa | Fungi | existing public | individual visual/source/motion comparison pending |
| Paramecium caudatum | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Chlamydomonas reinhardtii | Plantae | existing public | individual visual/source/motion comparison pending |
| Asterias rubens | Animalia | existing public | individual visual/source/motion comparison pending |
| Echinus esculentus | Animalia | existing public | individual visual/source/motion comparison pending |
| Dendraster excentricus | Animalia | existing public | individual visual/source/motion comparison pending |
| Holothuria tubulosa | Animalia | existing public | individual visual/source/motion comparison pending |
| Luidia ciliaris | Animalia | existing public | individual visual/source/motion comparison pending |
| Ophiothrix fragilis | Animalia | existing public | individual visual/source/motion comparison pending |
| Acropora cervicornis | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Porites porites | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Gorgonia ventalina | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Metridium senile | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Actinia equina | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Hydra vulgaris | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Caenorhabditis elegans | Animalia | existing public | individual visual/source/motion comparison pending |
| Schmidtea mediterranea | Animalia | existing public | individual visual/source/motion comparison pending |
| Lymnaea stagnalis | Mollusca | existing public | individual visual/source/motion comparison pending |
| Cornu aspersum | Mollusca | existing public | individual visual/source/motion comparison pending |
| Mytilus edulis | Mollusca | existing public | individual visual/source/motion comparison pending |
| Pecten maximus | Mollusca | existing public | individual visual/source/motion comparison pending |
| Ostrea edulis | Mollusca | existing public | individual visual/source/motion comparison pending |
| Daphnia magna | Animalia | existing public | individual visual/source/motion comparison pending |
| Zea mays | Plantae | existing public | individual visual/source/motion comparison pending |
| Triticum aestivum | Plantae | existing public | individual visual/source/motion comparison pending |
| Oryza sativa | Plantae | existing public | individual visual/source/motion comparison pending |
| Hordeum vulgare | Plantae | existing public | individual visual/source/motion comparison pending |
| Lavandula angustifolia | Plantae | existing public | individual visual/source/motion comparison pending |
| Salvia rosmarinus | Plantae | existing public | individual visual/source/motion comparison pending |
| Mentha spicata | Plantae | existing public | individual visual/source/motion comparison pending |
| Ocimum basilicum | Plantae | existing public | individual visual/source/motion comparison pending |
| Trifolium repens | Plantae | existing public | individual visual/source/motion comparison pending |
| Bellis perennis | Plantae | existing public | individual visual/source/motion comparison pending |
| Achillea millefolium | Plantae | existing public | individual visual/source/motion comparison pending |
| Digitalis purpurea | Plantae | existing public | individual visual/source/motion comparison pending |
| Pteridium aquilinum | Plantae | existing public | individual visual/source/motion comparison pending |
| Equisetum arvense | Plantae | existing public | individual visual/source/motion comparison pending |
| Marchantia polymorpha | Plantae | existing public | individual visual/source/motion comparison pending |
| Morchella esculenta | Fungi | existing public | individual visual/source/motion comparison pending |
| Cantharellus cibarius | Fungi | existing public | individual visual/source/motion comparison pending |
| Boletus edulis | Fungi | existing public | individual visual/source/motion comparison pending |
| Trametes versicolor | Fungi | existing public | individual visual/source/motion comparison pending |
| Lentinula edodes | Fungi | existing public | individual visual/source/motion comparison pending |
| Coprinus comatus | Fungi | existing public | individual visual/source/motion comparison pending |
| Rhizopus stolonifer | Fungi | existing public | individual visual/source/motion comparison pending |
| Aspergillus niger | Fungi | existing public | individual visual/source/motion comparison pending |
| Tetrahymena thermophila | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Stentor coeruleus | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Ceratium hirundinella | Myzozoa | existing public | individual visual/source/motion comparison pending |
| Volvox carteri | Plantae | existing public | individual visual/source/motion comparison pending |
| Spirostomum ambiguum | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Pisaster ochraceus | Animalia | existing public | individual visual/source/motion comparison pending |
| Patiria miniata | Animalia | existing public | individual visual/source/motion comparison pending |
| Linckia laevigata | Animalia | existing public | individual visual/source/motion comparison pending |
| Acanthaster planci | Animalia | existing public | individual visual/source/motion comparison pending |
| Astropecten irregularis | Animalia | existing public | individual visual/source/motion comparison pending |
| Strongylocentrotus purpuratus | Animalia | existing public | individual visual/source/motion comparison pending |
| Paracentrotus lividus | Animalia | existing public | individual visual/source/motion comparison pending |
| Diadema setosum | Animalia | existing public | individual visual/source/motion comparison pending |
| Echinometra mathaei | Animalia | existing public | individual visual/source/motion comparison pending |
| Clypeaster rosaceus | Animalia | existing public | individual visual/source/motion comparison pending |
| Cucumaria frondosa | Animalia | existing public | individual visual/source/motion comparison pending |
| Holothuria atra | Animalia | existing public | individual visual/source/motion comparison pending |
| Apostichopus japonicus | Animalia | existing public | individual visual/source/motion comparison pending |
| Ophiocomina nigra | Animalia | existing public | individual visual/source/motion comparison pending |
| Antedon bifida | Animalia | existing public | individual visual/source/motion comparison pending |
| Anemonia viridis | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Actinia fragacea | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Metridium farcimen | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Bunodosoma cavernatum | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Salvia officinalis | Plantae | existing public | individual visual/source/motion comparison pending |
| Thymus vulgaris | Plantae | existing public | individual visual/source/motion comparison pending |
| Origanum vulgare | Plantae | existing public | individual visual/source/motion comparison pending |
| Melissa officinalis | Plantae | existing public | individual visual/source/motion comparison pending |
| Nepeta cataria | Plantae | existing public | individual visual/source/motion comparison pending |
| Salvia splendens | Plantae | existing public | individual visual/source/motion comparison pending |
| Salvia nemorosa | Plantae | existing public | individual visual/source/motion comparison pending |
| Lavandula stoechas | Plantae | existing public | individual visual/source/motion comparison pending |
| Agastache foeniculum | Plantae | existing public | individual visual/source/motion comparison pending |
| Monarda didyma | Plantae | existing public | individual visual/source/motion comparison pending |
| Prunella vulgaris | Plantae | existing public | individual visual/source/motion comparison pending |
| Ajuga reptans | Plantae | existing public | individual visual/source/motion comparison pending |
| Stachys byzantina | Plantae | existing public | individual visual/source/motion comparison pending |
| Leonurus cardiaca | Plantae | existing public | individual visual/source/motion comparison pending |
| Lamium album | Plantae | existing public | individual visual/source/motion comparison pending |
| Coleus scutellarioides | Plantae | existing public | individual visual/source/motion comparison pending |
| Amanita rubescens | Fungi | existing public | individual visual/source/motion comparison pending |
| Amanita pantherina | Fungi | existing public | individual visual/source/motion comparison pending |
| Macrolepiota procera | Fungi | existing public | individual visual/source/motion comparison pending |
| Russula emetica | Fungi | existing public | individual visual/source/motion comparison pending |
| Lactarius deliciosus | Fungi | existing public | individual visual/source/motion comparison pending |
| Craterellus cornucopioides | Fungi | existing public | individual visual/source/motion comparison pending |
| Fomes fomentarius | Fungi | existing public | individual visual/source/motion comparison pending |
| Ganoderma lucidum | Fungi | existing public | individual visual/source/motion comparison pending |
| Paramecium bursaria | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Blepharisma japonicum | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Euplotes eurystomus | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Noctiluca scintillans | Myzozoa | existing public | individual visual/source/motion comparison pending |
| Patella vulgata | Mollusca | existing public | individual visual/source/motion comparison pending |
| Nacella concinna | Mollusca | existing public | individual visual/source/motion comparison pending |
| Fissurella volcano | Mollusca | existing public | individual visual/source/motion comparison pending |
| Haliotis rufescens | Mollusca | existing public | local correction candidate; screenshot comparison pending |
| Haliotis tuberculata | Mollusca | existing public | local correction candidate; screenshot comparison pending |
| Littorina littorea | Mollusca | existing public | individual visual/source/motion comparison pending |
| Littorina obtusata | Mollusca | existing public | individual visual/source/motion comparison pending |
| Nucella lapillus | Mollusca | existing public | individual visual/source/motion comparison pending |
| Buccinum undatum | Mollusca | existing public | individual visual/source/motion comparison pending |
| Crepidula fornicata | Mollusca | existing public | individual visual/source/motion comparison pending |
| Stagnicola palustris | Mollusca | existing public | individual visual/source/motion comparison pending |
| Planorbarius corneus | Mollusca | existing public | individual visual/source/motion comparison pending |
| Cerastoderma edule | Mollusca | existing public | individual visual/source/motion comparison pending |
| Ruditapes philippinarum | Mollusca | existing public | individual visual/source/motion comparison pending |
| Mercenaria mercenaria | Mollusca | existing public | individual visual/source/motion comparison pending |
| Ensis ensis | Mollusca | existing public | individual visual/source/motion comparison pending |
| Mya arenaria | Mollusca | existing public | individual visual/source/motion comparison pending |
| Pinna nobilis | Mollusca | existing public | individual visual/source/motion comparison pending |
| Chlamys islandica | Mollusca | existing public | individual visual/source/motion comparison pending |
| Aequipecten opercularis | Mollusca | existing public | individual visual/source/motion comparison pending |
| Aloe vera | Plantae | existing public | individual visual/source/motion comparison pending |
| Aloe arborescens | Plantae | existing public | individual visual/source/motion comparison pending |
| Agave americana | Plantae | existing public | individual visual/source/motion comparison pending |
| Agave attenuata | Plantae | existing public | individual visual/source/motion comparison pending |
| Haworthiopsis attenuata | Plantae | existing public | individual visual/source/motion comparison pending |
| Haworthia cooperi | Plantae | existing public | individual visual/source/motion comparison pending |
| Gasteria obliqua | Plantae | existing public | individual visual/source/motion comparison pending |
| Echeveria elegans | Plantae | existing public | individual visual/source/motion comparison pending |
| Echeveria agavoides | Plantae | existing public | individual visual/source/motion comparison pending |
| Sempervivum tectorum | Plantae | existing public | individual visual/source/motion comparison pending |
| Crassula ovata | Plantae | existing public | individual visual/source/motion comparison pending |
| Portulacaria afra | Plantae | existing public | individual visual/source/motion comparison pending |
| Sedum album | Plantae | existing public | individual visual/source/motion comparison pending |
| Sedum acre | Plantae | existing public | individual visual/source/motion comparison pending |
| Kalanchoe tomentosa | Plantae | existing public | individual visual/source/motion comparison pending |
| Auricularia auricula-judae | Fungi | existing public | individual visual/source/motion comparison pending |
| Tremella mesenterica | Fungi | existing public | individual visual/source/motion comparison pending |
| Dacrymyces stillatus | Fungi | existing public | individual visual/source/motion comparison pending |
| Calocera viscosa | Fungi | existing public | individual visual/source/motion comparison pending |
| Clavulina coralloides | Fungi | existing public | individual visual/source/motion comparison pending |
| Lycoperdon perlatum | Fungi | existing public | individual visual/source/motion comparison pending |
| Scleroderma citrinum | Fungi | existing public | individual visual/source/motion comparison pending |
| Micrasterias rotata | Plantae | existing public | individual visual/source/motion comparison pending |
| Closterium moniliferum | Plantae | existing public | individual visual/source/motion comparison pending |
| Cosmarium botrytis | Plantae | existing public | individual visual/source/motion comparison pending |
| Pediastrum duplex | Plantae | existing public | individual visual/source/motion comparison pending |
| Hydrodictyon reticulatum | Plantae | existing public | individual visual/source/motion comparison pending |
| Cassiopea xamachana | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Cotylorhiza tuberculata | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Rhizostoma pulmo | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Chrysaora hysoscella | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Cyanea capillata | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Pelagia noctiluca | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Aequorea victoria | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Craspedacusta sowerbii | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Chironex fleckeri | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Physalia physalis | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Velella velella | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Porpita porpita | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Anthopleura elegantissima | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Anthopleura xanthogrammica | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Stichodactyla gigantea | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Radianthus magnifica | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Cerianthus membranaceus | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Cladocora caespitosa | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Tubastraea coccinea | Cnidaria | existing public | individual visual/source/motion comparison pending |
| Cosmos bipinnatus | Plantae | existing public | individual visual/source/motion comparison pending |
| Tagetes erecta | Plantae | existing public | individual visual/source/motion comparison pending |
| Calendula officinalis | Plantae | existing public | individual visual/source/motion comparison pending |
| Zinnia elegans | Plantae | existing public | individual visual/source/motion comparison pending |
| Rudbeckia hirta | Plantae | existing public | individual visual/source/motion comparison pending |
| Echinacea purpurea | Plantae | existing public | individual visual/source/motion comparison pending |
| Leucanthemum vulgare | Plantae | existing public | individual visual/source/motion comparison pending |
| Centaurea cyanus | Plantae | existing public | individual visual/source/motion comparison pending |
| Gaillardia aristata | Plantae | existing public | individual visual/source/motion comparison pending |
| Coreopsis tinctoria | Plantae | existing public | individual visual/source/motion comparison pending |
| Helianthus tuberosus | Plantae | existing public | individual visual/source/motion comparison pending |
| Tanacetum vulgare | Plantae | existing public | individual visual/source/motion comparison pending |
| Artemisia absinthium | Plantae | existing public | individual visual/source/motion comparison pending |
| Cichorium intybus | Plantae | existing public | individual visual/source/motion comparison pending |
| Taraxacum officinale | Plantae | existing public | individual visual/source/motion comparison pending |
| Lactuca sativa | Plantae | existing public | individual visual/source/motion comparison pending |
| Phallus impudicus | Fungi | existing public | individual visual/source/motion comparison pending |
| Clathrus ruber | Fungi | existing public | individual visual/source/motion comparison pending |
| Mutinus caninus | Fungi | existing public | individual visual/source/motion comparison pending |
| Lysurus mokusin | Fungi | existing public | individual visual/source/motion comparison pending |
| Aseroe rubra | Fungi | existing public | individual visual/source/motion comparison pending |
| Geastrum triplex | Fungi | existing public | individual visual/source/motion comparison pending |
| Crucibulum laeve | Fungi | existing public | individual visual/source/motion comparison pending |
| Cyathus striatus | Fungi | existing public | individual visual/source/motion comparison pending |
| Lacrymaria olor | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Pseudomonilicaryon anser | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Vorticella campanula | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Colpoda inflata | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Bursaria truncatella | Ciliophora | existing public | individual visual/source/motion comparison pending |
| Cancer pagurus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Carcinus maenas | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Callinectes sapidus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Portunus trituberculatus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Necora puber | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Eriocheir sinensis | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Hemigrapsus sanguineus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Grapsus grapsus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Ocypode quadrata | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Leptuca pugilator | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Pinnotheres pisum | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Maja brachydactyla | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Homarus gammarus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Homarus americanus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Nephrops norvegicus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Palinurus elephas | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Panulirus versicolor | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Palaemon serratus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Crangon crangon | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Pagurus bernhardus | Animalia | unpublished draft | individual visual/source/motion comparison pending |
| Pinus sylvestris | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Pinus pinea | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Picea abies | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Abies alba | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Larix decidua | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Cedrus libani | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Taxus baccata | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Juniperus communis | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Cupressus sempervirens | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Thuja occidentalis | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Metasequoia glyptostroboides | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Araucaria heterophylla | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Cycas revoluta | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Zamia furfuracea | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Ephedra distachya | Plantae | unpublished draft | individual visual/source/motion comparison pending |
| Fistulina hepatica | Fungi | unpublished draft | individual visual/source/motion comparison pending |
| Laetiporus sulphureus | Fungi | unpublished draft | individual visual/source/motion comparison pending |
| Cerioporus squamosus | Fungi | unpublished draft | individual visual/source/motion comparison pending |
| Schizophyllum commune | Fungi | unpublished draft | individual visual/source/motion comparison pending |
| Sparassis crispa | Fungi | unpublished draft | individual visual/source/motion comparison pending |
| Hericium erinaceus | Fungi | unpublished draft | individual visual/source/motion comparison pending |
| Hydnum repandum | Fungi | unpublished draft | individual visual/source/motion comparison pending |
| Pseudohydnum gelatinosum | Fungi | unpublished draft | individual visual/source/motion comparison pending |

## Software checks at saved handoff

124 tests passed with zero failures. Ten targeted checks passed after the final camera/stage metadata changes. The Vite production build passed, with the existing large-chunk advisory. Git diff whitespace checks passed. These are software/provenance checks, not completed rendered or biological validation. Private logs are retained under research-cache/.

## Resumed preview check

The localhost server is restored and required resources return HTTP 200. Browser attachment still fails and reports the panel hidden. Paused-stage camera framing was corrected; the build passes. Actual screenshots and publication remain pending. Open the current local preview visibly and attach its tab with @Browser to continue.


## October 19 · direct desktop opening attempt

At 2026-10-19T16:06:21.922Z, used the now-available Windows Computer Use skill to select the existing Edge window. Windows activation/capture and a fresh-selection recovery failed with error 0x80070008 (not enough memory resources while excluding the display overlay). The app inventory separately reported a WebView application-error dialog. Creating a visible built-in browser preview also timed out waiting for webview attachment. No desktop app was closed, no credentials/security settings were changed, and unrelated apps were preserved. The local preview still returns HTTP 200; candidate rendering, screenshots and publication remain unverified. No duplicate PhenoVoxel preview process was found to stop. The earlier manual @Browser handoff is not assumed feasible while the owner is away. Resume actual captures only after a usable browser/control connection is available.


## Publication retry · 2026-10-19T17:34:24.333Z

Owner requested publication. GitHub owner-session page remains readable, but Add file click fails with Input.dispatchMouseEvent timeout; new preview attachment and Windows capture also fail. No upload or public commit occurred. Ten focused software checks pass. The ordinary rebuild failed with a native Zone Allocation out-of-memory error; after stopping only the verified project preview process 6736, a bounded 384 MB Node build plus build-data.mjs passed. No system settings or unrelated applications were changed. No new model screenshots or visual validations are claimed. Public dataset check: {"checkedAt":"2026-10-19T17:34:24.333Z","httpStatus":200,"version":"0.6.11","speciesCount":250}. Saved a checksummed source-only handoff bundle, retaining 250 records and leaving fifty unreviewed expansion drafts in the original checkout. The exact source still requires the saved rendered stage/shell comparisons before release.


## October 24 · rendered quality release

Browser interaction recovered in the refreshed owner session. Compared four models in 50 final real WebGL2 views; fixed newly visible sunflower stem/fruit and Arabidopsis cotyledon artifacts, and improved close stage framing. All 125 software checks pass. The report and all 50 final views are available in review-2026-10-24.html and SCIENTIFIC-REVIEW-2026-10-24.md. Collection remains 250; fifty expansion drafts stay unpublished. Biological accuracy, measured growth/biomechanics and independent expert validation remain unestablished. Publication must be separately verified.
