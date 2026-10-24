// Explicit capability guard; protects direct viewer/API calls as well as disabled buttons.
const blocked={
  "larix-decidua": ["grow"],
  "cedrus-libani": ["grow"],
  "taxus-baccata": ["grow"],
  "juniperus-communis": ["grow"],
  "cupressus-sempervirens": ["grow"],
  "thuja-occidentalis": ["grow"],
  "metasequoia-glyptostroboides": ["grow"],
  "araucaria-heterophylla": ["grow"],
  "cycas-revoluta": ["grow"],
  "zamia-furfuracea": ["grow"],
  "ephedra-distachya": ["grow"],
  "pinus-sylvestris": ["grow"],
  "pinus-pinea": ["grow"],
  "picea-abies": ["grow", "release"],
  "abies-alba": ["grow", "release"],
  "mimosa-pudica": [
    "grow"
  ],
  "dionaea-muscipula": [
    "grow"
  ],
  "nepenthes-rajah": [
    "grow"
  ],
  "ginkgo-biloba": [
    "grow"
  ],
  "sequoia-sempervirens": [
    "grow"
  ],
  "quercus-robur": [
    "grow"
  ],
  "nelumbo-nucifera": [
    "grow"
  ],
  "dryopteris-filix-mas": [
    "grow"
  ],
  "zea-mays": [
    "grow"
  ],
  "triticum-aestivum": [
    "grow"
  ],
  "oryza-sativa": [
    "grow"
  ],
  "hordeum-vulgare": [
    "grow"
  ],
  "lavandula-angustifolia": [
    "grow"
  ],
  "salvia-rosmarinus": [
    "grow"
  ],
  "mentha-spicata": [
    "grow"
  ],
  "ocimum-basilicum": [
    "grow"
  ],
  "trifolium-repens": [
    "grow"
  ],
  "bellis-perennis": [
    "grow"
  ],
  "achillea-millefolium": [
    "grow"
  ],
  "digitalis-purpurea": [
    "grow"
  ],
  "pteridium-aquilinum": [
    "unfurl"
  ],
  "equisetum-arvense": [
    "grow"
  ],
  "marchantia-polymorpha": [
    "grow"
  ],
  "salvia-officinalis": [
    "grow"
  ],
  "thymus-vulgaris": [
    "grow"
  ],
  "origanum-vulgare": [
    "grow"
  ],
  "melissa-officinalis": [
    "grow"
  ],
  "nepeta-cataria": [
    "grow"
  ],
  "salvia-splendens": [
    "grow"
  ],
  "salvia-nemorosa": [
    "grow"
  ],
  "lavandula-stoechas": [
    "grow"
  ],
  "agastache-foeniculum": [
    "grow"
  ],
  "monarda-didyma": [
    "grow"
  ],
  "prunella-vulgaris": [
    "grow"
  ],
  "ajuga-reptans": [
    "grow"
  ],
  "stachys-byzantina": [
    "grow"
  ],
  "leonurus-cardiaca": [
    "grow"
  ],
  "lamium-album": [
    "grow"
  ],
  "coleus-scutellarioides": [
    "grow"
  ],
  "aloe-vera": [
    "grow"
  ],
  "aloe-arborescens": [
    "grow"
  ],
  "agave-americana": [
    "grow"
  ],
  "agave-attenuata": [
    "grow"
  ],
  "haworthiopsis-attenuata": [
    "grow"
  ],
  "haworthia-cooperi": [
    "grow"
  ],
  "gasteria-obliqua": [
    "grow"
  ],
  "echeveria-elegans": [
    "grow"
  ],
  "echeveria-agavoides": [
    "grow"
  ],
  "sempervivum-tectorum": [
    "grow"
  ],
  "crassula-ovata": [
    "grow"
  ],
  "portulacaria-afra": [
    "grow"
  ],
  "sedum-album": [
    "grow"
  ],
  "sedum-acre": [
    "grow"
  ],
  "kalanchoe-tomentosa": [
    "grow"
  ],
  "cosmos-bipinnatus": [
    "grow"
  ],
  "tagetes-erecta": [
    "grow"
  ],
  "calendula-officinalis": [
    "grow"
  ],
  "zinnia-elegans": [
    "grow"
  ],
  "rudbeckia-hirta": [
    "grow"
  ],
  "echinacea-purpurea": [
    "grow"
  ],
  "leucanthemum-vulgare": [
    "grow"
  ],
  "centaurea-cyanus": [
    "grow"
  ],
  "gaillardia-aristata": [
    "grow"
  ],
  "coreopsis-tinctoria": [
    "grow"
  ],
  "helianthus-tuberosus": [
    "grow"
  ],
  "tanacetum-vulgare": [
    "grow"
  ],
  "artemisia-absinthium": [
    "grow"
  ],
  "cichorium-intybus": [
    "grow"
  ],
  "taraxacum-officinale": [
    "grow"
  ],
  "lactuca-sativa": [
    "grow"
  ]
};
export function plantAction(id,action){return blocked[id]?.includes(action)?'observe':action;}
export const blockedPlantDevelopment=blocked;
