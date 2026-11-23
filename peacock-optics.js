// Species-specific optics. Image coordinates for the two scales refer only to Péneau's Réunion photograph.
export const PEACOCK_MODES = {
  'peacock-colour': {label:'Colour choice · observed results',method:'In feeding-cube trials, trained peacock mantis shrimp distinguished the tested red, green and yellow plastics from greys. They performed at chance with the particular pale blue. Compare the illustrated human-visible samples with the reported outcomes. Screen colours approximate the stimuli.'},
  'peacock-scale': {label:'Antennal scales · illustrated signal',method:'The paddle beside each eye can reflect linearly polarized light. Gold hatching locates both scales in the reference photograph. Hatching marks the anatomical region. Its brightness and angle have no measured optical value.'},
  'peacock-field': {label:'Seafloor · measured linear polarization',method:'The two panels come from the same instant in a monochrome underwater polarization recording. The human reference shows brightness in grayscale because the instrument recorded intensity. The shrimp-cue view maps the measured degree of linear polarization to display colours. Dark blue marks low polarization and warmer colours mark higher values. This temperate field recording illustrates available light cues.'},
  'peacock-uv': {label:'UV · assigned target reflectance',method:'Two virtual targets have equal visible brightness. Under equal ultraviolet illumination their assigned UV reflectances are 15% and 85%. Violet encodes reflected UV for a human display. The camera supplies only the visible background.'},
  'peacock-circular': {label:'Circular polarization · opposite handedness',method:'The two virtual targets have equal visible brightness and opposite circular handedness. At 80% circular polarization an ideal left analyzer transmits 90% from A and 10% from B. These numbers describe optics. They do not predict the animal’s colour experience or its probability of choosing a target.'}
};
export const PEACOCK_SCENES = {
  peacockEncounter:{url:new URL('./photo-odontodactylus-scyllarus.webp',import.meta.url).href,name:'Peacock mantis shrimp at Réunion',source:'https://commons.wikimedia.org/wiki/File:Odontodactylus_scyllarus_R%C3%A9union.jpg',credit:'Cédric Péneau',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',scope:'Visible-light photograph. The scale locations were traced by hand for this image.'},
  peacockField:{url:new URL('./peacock-seabed-pair.png',import.meta.url).href,name:'Underwater light on the seafloor · Movie S1, frame 1',source:'https://doi.org/10.1126/sciadv.abq2770',credit:'S. Vincent Venables et al. (2022)',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',scope:'Paired crops from the published intensity and degree-of-linear-polarization panels at Mount Batten, UK. The recording measures the environment. The behavioural animals in that paper were crabs and cuttlefish.'}
};
export function drawFieldPanel(ctx,img,signal){
  const w=img.naturalWidth/2,h=img.naturalHeight,scale=Math.min(ctx.canvas.width/w,ctx.canvas.height/h);
  ctx.fillStyle='#101e25';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.drawImage(img,signal?w:0,0,w,h,(ctx.canvas.width-w*scale)/2,(ctx.canvas.height-h*scale)/2,w*scale,h*scale);
}
// Paths in pixels inside the 700 × 467 reference. Curves follow exposed scale blades.
function scales(ctx){
  ctx.save();
  const factor=Math.min(ctx.canvas.width/700,ctx.canvas.height/467);
  ctx.translate((ctx.canvas.width-700*factor)/2,(ctx.canvas.height-467*factor)/2);ctx.scale(factor,factor);
  const mask=new Path2D();
  mask.moveTo(378,153);mask.bezierCurveTo(351,153,310,173,302,209);mask.bezierCurveTo(293,234,308,253,325,250);mask.bezierCurveTo(349,246,372,191,378,153);mask.closePath();
  mask.moveTo(501,126);mask.bezierCurveTo(521,131,537,149,531,183);mask.lineTo(519,210);mask.bezierCurveTo(506,198,494,162,501,126);mask.closePath();
  ctx.fillStyle='rgba(243,183,78,.42)';ctx.fill(mask);ctx.strokeStyle='#fff1bd';ctx.lineWidth=2;ctx.stroke(mask);
  ctx.clip(mask);ctx.lineWidth=3;for(let x=160;x<700;x+=9){ctx.beginPath();ctx.moveTo(x,115);ctx.lineTo(x-100,265);ctx.stroke();}
  ctx.restore();
}
function target(ctx,x,level,caption,ultraviolet){
  const y=ctx.canvas.height*.65,r=ctx.canvas.height*.115;
  ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);
  const v=Math.round(255*(level<=.0031308?12.92*level:1.055*level**(1/2.4)-.055));
  ctx.fillStyle=ultraviolet?`rgb(${Math.round(.69*v)},${Math.round(.49*v)},${v})`:`rgb(${v},${v},${v})`;ctx.fill();
  ctx.strokeStyle='#d5dedb';ctx.lineWidth=1.5;ctx.stroke();
  ctx.font='bold 12px system-ui';ctx.textAlign='center';
  const width=ctx.measureText(caption).width+14;
  ctx.fillStyle='#102025';ctx.fillRect(x-width/2,y+r+4,width,20);
  ctx.fillStyle='#fff';ctx.fillText(caption,x,y+r+18);ctx.restore();
}
function colourChoices(ctx,results){
  const stimuli=[['Red','#bd403c'],['Green','#429a51'],['Yellow','#e7b94e'],['Pale blue','#9db5c1']];
  const w=ctx.canvas.width,h=ctx.canvas.height;
  ctx.save();ctx.font='bold 12px system-ui';ctx.textAlign='center';
  stimuli.forEach(([name,colour],i)=>{
    const x=(i+.5)*w/4,y=h*.68,side=w*.083,matched=i<3;
    ctx.fillStyle='rgba(10,24,29,.91)';ctx.fillRect(x-w*.121,y-10,w*.242,side+36);
    ctx.fillStyle=results?(matched?'#bed6ad':'#aab5bf'):colour;ctx.fillRect(x-side/2,y,side,side);
    if(results){ctx.fillStyle='#162b30';ctx.fillText(matched?'✓':'≈',x,y+side*.64);}
    ctx.fillStyle='#fff';ctx.fillText(results?(matched?'Distinguished':'At chance'):name,x,y+side+17);
  });ctx.restore();
}
export function paintPeacock(ctx,mode,signal){
  if(mode==='peacock-colour'){colourChoices(ctx,signal);return;}
  if(mode==='peacock-scale'){if(signal)scales(ctx);return;}
  if(mode!=='peacock-uv'&&mode!=='peacock-circular')return;
  const uv=mode==='peacock-uv',levels=uv?[.15,.85]:[.90,.10];
  for(const [i,level] of levels.entries()){
    target(ctx,ctx.canvas.width*(i?.72:.28),signal?level:.50,
      (i?'B':'A')+(signal?'  '+Math.round(level*100)+'%':''),signal&&uv);
  }
}
export function peacockParameters(mode){
  if(mode==='peacock-colour')return {observation:'Species-specific feeding-cube choice outcomes',source:'https://doi.org/10.1007/BF00192314',illustration:'Display approximations of tested plastics',measuredByPhone:false};
  if(mode==='peacock-field')return {measurement:'Published environmental linear polarimetry',source:PEACOCK_SCENES.peacockField.source,frame:1,measuredByPhone:false};
  if(mode==='peacock-scale')return {illustration:'Hand-traced anatomical regions',source:'https://pubmed.ncbi.nlm.nih.gov/22279065/',measuredByPhone:false};
  if(mode==='peacock-uv')return {illustration:'Assigned UV reflectances',reflectance:[.15,.85],measuredByPhone:false};
  if(mode==='peacock-circular')return {illustration:'Virtual targets through an ideal left-circular analyzer',polarizedFraction:.8,transmission:[.90,.10],measuredByPhone:false};
  return null;
}
