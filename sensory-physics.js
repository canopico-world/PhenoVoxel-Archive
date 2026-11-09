// Forward models, not inverse reconstructions from RGB or microphone recordings.
export function echoGeometry({rangeM=15,separationM=.2,soundSpeed=1500,frequencyKHz=100,bandwidthKHz=40}={}){
 const finite=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
 if(!finite(rangeM,1,100)||!finite(separationM,0,5)||!finite(soundSpeed,1400,1600)||!finite(frequencyKHz,40,150)||!finite(bandwidthKHz,10,100))throw Error('Echo inputs outside the study range');
 return{rangeM,separationM,soundSpeed,frequencyKHz,bandwidthKHz,delayMs:2000*rangeM/soundSpeed,secondDelayMs:2000*(rangeM+separationM)/soundSpeed,wavelengthMm:soundSpeed/frequencyKHz,idealRangeCellM:soundSpeed/(2*bandwidthKHz*1000),measured:false};
}
export function equalRangeTargets(rangeM,angleDegrees=30){
 if(!Number.isFinite(rangeM)||rangeM<=0||!Number.isFinite(angleDegrees)||Math.abs(angleDegrees)>90)throw Error('Invalid target geometry');
 const a=angleDegrees*Math.PI/180;return[{x:rangeM,y:0},{x:rangeM*Math.cos(a),y:rangeM*Math.sin(a)}];
}
export function thermalContrast(targetC,backgroundC,emissivity=.95){
 if(![targetC,backgroundC,emissivity].every(Number.isFinite)||targetC<0||targetC>60||backgroundC<0||backgroundC>60||emissivity<0||emissivity>1)throw Error('Thermal inputs outside the study range');
 const sigma=5.670374419e-8,t=targetC+273.15,b=backgroundC+273.15;
 return{targetC,backgroundC,emissivity,netExitanceWm2:emissivity*sigma*(t**4-b**4),peakWavelengthMicrometres:2897.771955/t,scope:'Ideal grey surface, integrated over all wavelengths. Not irradiance at a pit membrane, a detection threshold or a camera measurement.'};
}
export function bandContrast(target,background){
 if(![target,background].every(Number.isFinite)||target<0||target>1||background<=0||background>1)throw Error('Reflectance must be 0–1 and background positive');
 return{target,background,weber:(target-background)/background,scope:'Assumed band reflectances under shared illumination; not a fitted retinal response.'};
}
