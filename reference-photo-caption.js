// Keep archival source metadata intact while avoiding an inherited miscaption in
// accessible descriptions and the photograph dialog.
export function referencePhotoCaption(species,photo){
 if(species.id==='haliotis-tuberculata'&&/shell/i.test(photo?.identityScope||''))return 'European abalone shell photographed from Crete; a shell surface reference. Soft tissues, living posture and motion are not visible in this image. '+(photo?.description||'');
 if(species.id==='clypeaster-rosaceus')return 'Source-labelled Clypeaster rosaceus: a decayed test washed ashore on San Salvador Island, Bahamas; its living spines are detached. The original file has mixed historical Meoma and heart-urchin captions, which are not adopted as this species’ anatomy or feeding biology.';
 return photo?.description||species.scientificName;
}
export function referenceImageLabel(species,photo){
 if(photo?.displayLabel)return photo.displayLabel;
 if(species.id==='clypeaster-rosaceus')return 'TEST / SOURCE IMAGE';
 if(species.id==='haliotis-tuberculata'&&/shell/i.test(photo?.identityScope||''))return 'SHELL REFERENCE';
 return ['Bacteria','Archaea','Microeukaryotes'].includes(species.group)||['saccharomyces-cerevisiae','neurospora-crassa','amoeba-proteus','paramecium-caudatum','euglena-gracilis','chlamydomonas-reinhardtii'].includes(species.id)?'MICROGRAPH / SOURCE IMAGE':'REAL ORGANISM';
}
