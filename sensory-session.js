// Portable settings contain no images, audio or permission grants.
export const SESSION_VERSION='0.5.0';
export function validateViewSettings(record,speciesId,modes){
 if(record?.schema!=='phenovoxel-view-settings/1'||record.speciesId!==speciesId)throw Error('Choose settings for this species and schema.');
 const s=record.settings;
 if(!s||!modes.includes(s.mode)||!['overlay','paired'].includes(s.layout)||!Number.isFinite(s.split)||s.split<0||s.split>1||!Number.isInteger(s.detail)||s.detail<1||s.detail>12||!['environment','user'].includes(s.facing)||![6,12].includes(s.rate))throw Error('Settings contain an unsupported mode or value.');
 return Object.fromEntries(['mode','layout','split','detail','facing','rate'].map(k=>[k,s[k]]));
}
export function viewSettings(speciesId,settings){return{schema:'phenovoxel-view-settings/1',software:SESSION_VERSION,speciesId,settings,mediaIncluded:false,permissionIncluded:false};}
export function spectralMetadata({citation,kind,calibration,sample,units}){
 if(!citation?.trim()||!['measured','digitized','synthetic'].includes(kind)||!['photons','energy'].includes(units))throw Error('Provide a citation, data type and spectral units.');
 if(kind!=='synthetic'&&(!calibration?.trim()||!sample?.trim()))throw Error('Measured/digitized data need calibration notes and sample/life-stage context.');
 return{citation:citation.trim(),kind,calibration:calibration?.trim()||'Synthetic; no instrument calibration',sample:sample?.trim()||'Synthetic stimulus',inputUnits:units,independentlyVerified:false};
}
export function entryStudy(id){
 const studies={
 'tursiops-truncatus':['Eyesight + echo timing','RGB is a visual reference. Test travel time and range ambiguity in the separate echo experiment.','Explore echo timing','echo'],
 'rangifer-tarandus':['Visible light + ultraviolet','Compare assumed UV reflectances independently of the visible photograph. The camera cannot measure this band.','Test UV contrast','field'],
 'gloydius-blomhoffii':['Eyesight + facial-pit sensing','Assign temperatures to test radiation contrast. No temperature or infrared image is extracted from RGB.','Test thermal contrast','field'],
 'squilla-empusa':['One spectral class, many questions','Test the nominal 517 nm pigment model with spectra. The grayscale camera illustration is not a measured retinal response.','Test spectral responses','spectral'],
 'danio-rerio':['Adult zebrafish: the missing fourth channel','Compare equal-visible stimuli with different UV reflectance. Adult cone evidence is kept separate from larval vision.','Test the UV hypothesis','spectral'],
 'chelonia-mydas':['Green turtle: pigments and uncertain filters','Compare three reported pigment channels, then test the effect of adding an explicitly unmeasured UV hypothesis.','Test pigment responses','spectral']
 };
 const s=studies[id];return s?{title:s[0],note:s[1],action:s[2],target:s[3]}:null;
}
