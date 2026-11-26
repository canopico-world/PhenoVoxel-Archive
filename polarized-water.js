// Controlled scene stimulus. The RGB background contributes unpolarized light in this model.
const settings = Object.freeze({
  scatteredLightWeight: .35,
  scatteredLinearRGB: Object.freeze([.12, .55, .69]),
  linearPolarizationFraction: .60,
  electricFieldAxisDeg: 0,
  behaviourSource: 'https://doi.org/10.1038/ncomms12140',
  environmentSource: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3049010/figure/RSTB20100201F6/'
});
export const analyzerPositions = ['90','45','0','off'];

export function waterExperiment(position) {
  if (!analyzerPositions.includes(position)) throw new RangeError('Unsupported analyzer position');
  if (position === 'off') return {enabled:false};
  const angle = Number(position);
  const transmission = (1 + settings.linearPolarizationFraction * Math.cos(2 * angle * Math.PI/180)) / 2;
  return {...settings, enabled:true, analyzerDegrees:angle, scatteredLightTransmission:transmission,
    virtualTile:{pattern:'4 by 4',axisDegrees:[0,90],linearPolarizationFraction:.60,incidentLinearRGB:[.45,.45,.45]}, backgroundPolarization:'assumed zero', displayGainAfterAnalyzer:2, measuredInPhotograph:false};
}

function channelTables(waterGain) {
  const {scatteredLightWeight:weight, scatteredLinearRGB} = settings;
  return scatteredLinearRGB.map(water=>Uint8ClampedArray.from({length:256},(_,i)=>{
    const v=i/255, linear=v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4;
    const combined=(1-weight)*linear + weight*water*waterGain;
    return 255*(combined<=.0031308 ? 12.92*combined : 1.055*combined**(1/2.4)-.055);
  }));
}
const referenceTables=channelTables(1);
const analyzerTables=new Map(analyzerPositions.filter(p=>p!=='off').map(p=>
  [p,channelTables(2*waterExperiment(p).scatteredLightTransmission)]));
export function addWaterlight(pixels,position,filtered) {
  if (position==='off') return;
  const [r,g,b]=filtered?analyzerTables.get(position):referenceTables;
  for(let i=0;i<pixels.length;i+=4){
    pixels[i]=r[pixels[i]];pixels[i+1]=g[pixels[i+1]];pixels[i+2]=b[pixels[i+2]];
  }
}
// This virtual target has equal incident intensity in all squares. Only its polarization axis changes.
export function tileLevel(position,filtered,vertical){
  const p=waterExperiment(position);
  return filtered && p.enabled ? .45*(1+(vertical?-1:1)*(2*p.scatteredLightTransmission-1)) : .45;
}
function drawTestTile(ctx,rect,position,filtered){
  const side=4*Math.max(1,Math.floor(Math.min(rect.width,rect.height)*.20/4));
  const x=rect.x+rect.width-side-8,y=rect.y+rect.height-side-23;
  ctx.save();
  for(let j=0;j<4;j++)for(let i=0;i<4;i++){
    const level=tileLevel(position,filtered,(i+j)%2===1);
    const v=Math.round(255*(1.055*level**(1/2.4)-.055));
    ctx.fillStyle='rgb('+v+','+v+','+v+')';
    ctx.fillRect(x+i*side/4,y+j*side/4,side/4,side/4);
  }
  ctx.fillStyle='#102127';ctx.fillRect(x-2,y+side,side+4,15);
  ctx.fillStyle='white';ctx.font='10px system-ui';ctx.textAlign='center';
  ctx.fillText('Virtual tile',x+side/2,y+side+11);ctx.restore();
}
export function renderWaterlight(ctx,rect,position,filtered){
  if(position==='off')return;
  drawTestTile(ctx,rect,position,filtered);
  const {x,y,width,height}=rect,frame=ctx.getImageData(x,y,width,height);
  addWaterlight(frame.data,position,filtered);ctx.putImageData(frame,x,y);
}
