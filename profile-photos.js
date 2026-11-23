import portraits from './supplemental-profile-photos.json' with {type:'json'};

export function withProfilePhoto(species) {
  const photograph = portraits[species.id];
  if (!photograph) return species;
  return {
    ...species,
    photograph,
    review: {...species.review, photographicReferenceStatus: 'Species photograph available with source and license.'}
  };
}

// Index icons are square. Keep elongated bodies whole and off-centre heads in frame.
const thumbnailStyles = {
  'homo-sapiens': 'object-position:50% 19%',
  'mus-musculus': 'object-position:85% 50%',
  'vulpes-vulpes': 'object-position:right center',
  'mugil-cephalus': 'object-position:left center',
  'sphyrna-mokarran': 'object-position:right center',
  'squilla-empusa': 'object-fit:contain',
  'schmidtea-mediterranea': 'object-fit:contain',
  'lepisosteus-osseus': 'object-fit:contain'
};

export function thumbnailStyle(id) {
  return thumbnailStyles[id] || '';
}
