const visionSource='https://pmc.ncbi.nlm.nih.gov/articles/PMC5762155/';
const soundSource='https://doi.org/10.1371/journal.pbio.0030386';
const whiskSource='https://doi.org/10.1523/JNEUROSCI.0712-14.2014';

export const mouseReferences={
 mouseField:{title:'Denman et al. · Mouse contrast sensitivity across visual space',url:visionSource,scope:'Behavioral change detection with calibrated ultraviolet and green stimuli at four elevations.'},
 mouseCalls:{title:'Holy and Guo · Ultrasonic songs of male mice',url:soundSource,scope:'Recordings of male mice vocalizing in response to female scent cues.'},
 mouseTouch:{title:'Sofroniew et al. · Whisker-guided behavior',url:whiskSource,scope:'High-speed whisker tracking during running and steering on a spherical treadmill.'}
};
export const mouseProfile={tag:'Mouse sensory studies',headline:'Explore where a mouse detects colour changes, how it samples touch, and what a recorder can capture.',summary:'Mouse behavior depends on stimulus location, sensory channel and experimental conditions.',studyChannels:['vision','sound','signals'],peaks:[],sources:Object.keys(mouseReferences),scheme:'whisk',question:'Does moving the same colour change above or below the horizon alter detection?',missing:'An RGB camera leaves ultraviolet unmeasured. A phone microphone has a device-specific frequency response.'};

export function mountMouseSense(section){
 const vision=document.createElement('article');vision.className='sense-species-view';
 vision.innerHTML='<h3>Where can a mouse detect a colour change?</h3><p>In a trained detection task, mice licked when a UV–green target changed. Select one of the four tested elevations to explore the result at equal perceived brightness in that experiment.</p><label>Target elevation <select data-mouse-elevation><option value="-10">10° below the horizon</option><option value="10" selected>10° above</option><option value="30">30° above</option><option value="50">50° above</option></select></label><div aria-hidden="true" style="position:relative;height:7rem;margin:.7rem 0;background:linear-gradient(to top,#30423a 25%,#aebcb2 25%,#aebcb2 26%,#22373c 26%);border-radius:.4rem"><span data-target style="position:absolute;left:50%;width:.85rem;height:.85rem;background:#e4e8c1;border-radius:50%;transform:translate(-50%,50%)"></span></div><output aria-live="polite"></output><p>The target marker shows location. The photograph and camera provide visible-light context. UV contrast requires a calibrated stimulus.</p><a href="'+visionSource+'">Read the experiment and Figure 3</a>';
 section.querySelector('#sense-vision').prepend(vision);
 const elevation=vision.querySelector('select');
 elevation.onchange=()=>{const deg=Number(elevation.value);vision.querySelector('[data-target]').style.bottom=(25+deg*1.25)+'%';vision.querySelector('output').textContent=deg<0?'At −10°, performance along the equal-brightness colour axis did not differ significantly from catch trials.':deg===10?'At +10°, the strongest sensitivity occurred for a decrement along the short–middle opponent axis. The fitted half-saturation contrast was 13.4%.':'At +'+deg+'°, mice discriminated colour changes. The fitted decrement thresholds at +30° and +50° were similar.'};elevation.onchange();
 const sound=document.createElement('article');sound.className='sense-species-view';
 sound.innerHTML='<h3>Could this recorder capture a mouse call?</h3><p>Male mice emit ultrasonic syllables during courtship. Compare a hypothetical tone with a digitizer’s sampling limit.</p><label>Tone <input data-mouse-tone type="range" min="30" max="100" value="70"> kHz</label> <label>Sample rate <select><option>48</option><option>96</option><option>250</option></select> kHz</label><p><output aria-live="polite"></output></p><p>The calculation assumes ideal sampling. Microphone response and filtering also limit recordings. The controls produce no ultrasound.</p><a href="'+soundSource+'">Inspect the original mouse recordings</a>';
 section.querySelector('#sense-sound').prepend(sound);
 const tone=sound.querySelector('input'),rate=sound.querySelector('select');
 const update=()=>{const limit=Number(rate.value)/2;sound.querySelector('output').textContent=tone.value+' kHz tone · '+limit+' kHz Nyquist limit · '+(+tone.value<limit?'within the digitizer bandwidth.':'at or above the limit for unambiguous recording.')};tone.oninput=rate.onchange=update;update();
 const touch=document.createElement('article');touch.className='sense-species-view';
 touch.innerHTML='<h3>Follow a whisker sweep</h3><p>During treadmill steering, mice shifted the whiskers on the two sides of the face differently. Contact bends a whisker and changes the load at its follicle. Compare the two movements in the specimen viewer.</p><button data-mouse-sweep>Watch rhythmic whisking</button> <button data-mouse-steer>Watch asymmetric whisking</button> <a href="'+whiskSource+'">See the tracked whiskers</a>';
 section.querySelector('#sense-signals').prepend(touch);
 for(const [selector,motion]of [['[data-mouse-sweep]','whisk'],['[data-mouse-steer]','steer-whisk']])touch.querySelector(selector).onclick=()=>{document.querySelector('#anatomy-lab [data-overview]')?.click();document.querySelector('#viewer-actions [data-motion="'+motion+'"]')?.click();document.querySelector('#viewer')?.scrollIntoView({block:'center'});};
}
