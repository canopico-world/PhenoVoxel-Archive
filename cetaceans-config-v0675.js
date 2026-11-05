import {cetaceanProfiles} from './cetacean-profiles.js';
// Authored reference-led landmarks in normalized display units, never a measured
// specimen fit. Every phenotype is a selected example, not a species average.
const blunt=(w,h)=>[[0,.009,-.015,-.045],[.012,w*.26,h*.14,-h*.19],[.04,w*.57,h*.42,-h*.34],[.09,w*.83,h*.64,-h*.48],[.18,w*.98,h*.71,-h*.55],[.32,w,h*.65,-h*.56],[.48,w*.87,h*.49,-h*.47],[.65,w*.59,h*.30,-h*.31],[.82,w*.29,h*.15,-h*.16],[.94,w*.11,h*.06,-h*.07],[1,.009,.018,-.018]];
const delphinid=(w,h,beak,melon)=>[[0,.006,-h*.07,-h*.12],[beak*.40,w*.18,-h*.005,-h*.14],[beak,w*.30,h*.035,-h*.15],[beak+.035,w*.58,h*.42,-h*.24],[melon,w*.85,h*.65,-h*.38],[.31,w,h*.64,-h*.50],[.48,w*.94,h*.51,-h*.46],[.66,w*.65,h*.32,-h*.31],[.83,w*.29,h*.14,-h*.17],[.95,w*.10,h*.06,-h*.07],[1,.009,.018,-.018]];
const adjustments={
 'caperea-marginata':{back:'#252b30',side:'#697379',belly:'#bdc4c3',flipperDrop:.08,dorsalHeight:.19,profile:[[0,.005,-.025,-.06],[.025,.06,.015,-.12],[.09,.145,.12,-.20],[.20,.22,.18,-.245],[.34,.25,.195,-.25],[.49,.24,.18,-.225],[.66,.185,.13,-.16],[.83,.09,.075,-.085],[.95,.03,.035,-.035],[1,.009,.018,-.018]]},
 'balaenoptera-borealis':{back:'#252c35',side:'#515e68',belly:'#b5b9b3',dorsalHeight:.36,pleats:42,pleatEnd:.42},
 'balaenoptera-acutorostrata':{back:'#202b33',side:'#54636b',belly:'#c9ceca',pleats:56,flipperBand:true,flipperSweep:.22},
 'balaenoptera-bonaerensis':{back:'#29333a',side:'#606c70',belly:'#c7cbc7',pleats:30,flipperBand:false,flipperSweep:.23},
 'balaenoptera-ricei':{back:'#2d3439',side:'#576268',belly:'#c6c3bc',asymmetricJaw:false,pleats:50},
 'balaenoptera-edeni':{back:'#2a343d',side:'#5c6972',belly:'#c5c9c6',pleats:48},
 'balaenoptera-brydei':{back:'#29343c',side:'#53616b',belly:'#c4c8c5',pleats:48},
 'balaenoptera-omurai':{back:'#374149',side:'#7d898e',belly:'#c8ccc6',pleats:86,pleatEnd:.60},
 'globicephala-melas':{profile:blunt(.35,.66),back:'#161d23',side:'#29343b',belly:'#333e44',eyeU:.17,mouthQ:-.53,headEnd:.22,flipperLength:.93,flipperSweep:.48,dorsalChord:.65,dorsalHeight:.31,dorsalSweep:.40},
 'grampus-griseus':{profile:blunt(.34,.64),back:'#829094',side:'#afbbbb',belly:'#c3c9c5',eyeU:.155,headEnd:.195,mouthQ:-.54,flipperLength:.58,flipperSweep:.36,flipperChord:.145,scars:160,dorsalHeight:.46},
 'inia-geoffrensis':{profile:cetaceanProfiles['inia-geoffrensis'].profile.map(([u,w,t,b])=>[u,w*(u<.21?1:1.14),t*(u<.21?1:1.23),b*(u<.21?1:1.23)]),back:'#797c7b',side:'#b39996',belly:'#c5aca4',flipperChord:.34,flipperLength:.64,flipperSweep:.19,flipperDrop:.08,neck:true,dorsalHeight:.065,mottle:.18},
 'stenella-longirostris':{profile:delphinid(.25,.56,.105,.195),headEnd:.215,eyeU:.195,flipperU:.27,back:'#263744',side:'#8d9fa8',belly:'#c7cbca',flipperLength:.46,flipperDrop:.10,amplitude:.17},
 'stenella-coeruleoalba':{profile:delphinid(.275,.61,.085,.18),headEnd:.21,eyeU:.18,flipperU:.265,back:'#243b4c',side:'#8ea6b3',belly:'#cbd1cd',flipperDrop:.10,amplitude:.17},
 'orcaella-brevirostris':{profile:blunt(.335,.60),back:'#4c626d',side:'#7f969f',belly:'#b0bdbd',headEnd:.19,eyeU:.15,mouthQ:-.55,flipperChord:.27,flipperSweep:.14,dorsalHeight:.175,dorsalChord:.30,dorsalSweep:.14},
 'hyperoodon-ampullatus':{profile:[[0,.008,-.04,-.085],[.035,.055,-.005,-.12],[.085,.085,.04,-.15],[.10,.16,.29,-.18],[.13,.29,.46,-.23],[.21,.355,.46,-.32],[.34,.37,.405,-.35],[.51,.315,.295,-.285],[.70,.195,.175,-.18],[.87,.075,.08,-.09],[1,.009,.018,-.018]],back:'#535954',side:'#7f8a80',belly:'#a9b3a5',headEnd:.25,eyeU:.235,paleHead:true,flipperLength:.34,flipperDrop:.07},
 'mesoplodon-densirostris':{back:'#3c4c54',side:'#788c94',belly:'#b7c2c0',flipperDrop:.07,dorsalHeight:.20,scars:55,toothForward:true},
 'kogia-sima':{profile:blunt(.35,.61),back:'#34454f',side:'#71858e',belly:'#c0c5bf',headEnd:.22,eyeU:.155,mouthQ:-.70,flipperLength:.35,flipperDrop:.07,dorsalHeight:.33,dorsalU:.52}
};
export const cet16Ids=Object.keys(adjustments).filter(id=>id!=='balaenoptera-brydei');
export const cet16Profiles=Object.fromEntries(Object.entries(adjustments).map(([id,changes])=>[id,{...cetaceanProfiles[id],...changes,dorsalFalcate:id!=='stenella-longirostris',bodySegments:192,bodyRadials:96,grain:.018,mottle:changes.mottle??.045,pectoralExcursion:.045,strictGlide:true,amplitude:changes.amplitude??.13,lag:2.1}]));
export const cet16Limits='Original reference-led exterior; proportions, individual markings and optical values are authored. No measured scan, fitted specimen, solved hydrodynamics, physiological simulation or independent expert validation.';
