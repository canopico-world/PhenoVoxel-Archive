// Keep archival source metadata intact while avoiding an inherited miscaption in
// accessible descriptions and the photograph dialog.
export function referencePhotoCaption(species,photo){
 if(species.id==='clypeaster-rosaceus')return 'Source-labelled Clypeaster rosaceus: a decayed test washed ashore on San Salvador Island, Bahamas; its living spines are detached. The original file has mixed historical Meoma and heart-urchin captions, which are not adopted as this species’ anatomy or feeding biology.';
 return photo?.description||species.scientificName;
}
