import provenance from './sensory-habitat-sources-v0711.json' with {type:'json'};
const urls={
 grass:new URL('./sensory-habitat-grass-v0711.jpg',import.meta.url).href,
 forest:new URL('./sensory-habitat-forest-v0711.jpg',import.meta.url).href,
 canopy:new URL('./sensory-habitat-canopy-v0711.jpg',import.meta.url).href,
 freshwater:new URL('./sensory-habitat-freshwater-v0711.jpg',import.meta.url).href,
 seafloor:new URL('./sensory-habitat-seafloor-v0711.jpg',import.meta.url).href,
 rocky:new URL('./sensory-habitat-rocky-v0711.jpg',import.meta.url).href,
 mangrove:new URL('./sensory-habitat-mangrove-v0711.jpg',import.meta.url).href,
 pond:new URL('./sensory-habitat-pond-v0711.jpg',import.meta.url).href,
 seagrass:new URL('./sensory-habitat-seagrass-v0711.jpg',import.meta.url).href,
 snow:new URL('./sensory-habitat-snow-v0711.jpg',import.meta.url).href,
 openwater:new URL('./sensory-habitat-openwater-v0711.jpg',import.meta.url).href
};
const names={grass:'Grass and woodland edge',forest:'Leaf litter and shaded ground',canopy:'Tropical forest',freshwater:'Freshwater submerged vegetation',seafloor:'Sandy seabed',rocky:'Rocky kelp habitat',mangrove:'Mangrove roots at the waterline',pond:'Submerged pond plants',seagrass:'Seagrass meadow',snow:'Snow and vegetation',openwater:'Jellyfish in the water column'};
export const HABITAT_SCENES=Object.fromEntries(Object.entries(urls).map(([k,url])=>{const p=provenance.images[k];return[k,{url,name:names[k],credit:p.credit,source:p.source,license:p.license,licenseUrl:p.licenseUrl,scope:provenance.scope+' '+p.description}];}));
export const HABITAT_BY_SPECIES={
 'apis-mellifera':'meadow','danaus-plexippus':'meadow','tursiops-truncatus':'reef',
 'rangifer-tarandus':'snow','gloydius-blomhoffii':'forest','squilla-empusa':'seafloor',
 'pan-troglodytes':'canopy','danio-rerio':'freshwater','chelonia-mydas':'seagrass',
 'oratosquilla-oratoria':'seafloor','octopus-vulgaris':'rocky','tyto-alba':'grass',
 'vulpes-vulpes':'grass','gekko-gecko':'canopy','amphiprion-ocellaris':'reef',
 'chrysemys-picta':'pond','carcinus-maenas':'rocky','daphnia-magna':'pond',
 'pecten-maximus':'seafloor','chironex-fleckeri':'mangrove','acanthaster-planci':'reef',
 'strongylocentrotus-purpuratus':'rocky','schmidtea-mediterranea':'pond',
 'oryctolagus-cuniculus':'grass','lepomis-macrochirus':'freshwater','oryzias-latipes':'pond',
 'homarus-americanus':'seafloor','dermochelys-coriacea':'openwater'
};
export const habitatFor=id=>HABITAT_BY_SPECIES[id]||null;
