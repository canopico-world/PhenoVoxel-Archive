// Explicitly selected material derivatives. Original source images are retained.
// These unmeasured display choices do not calibrate tissue reflectance.
export function selectedPigmentToneRGB(r,g,b,tone){
 const l=.2126*r+.7152*g+.0722*b,target=tone.low+(tone.high-tone.low)*Math.max(0,Math.min(1,l))**tone.exponent,factor=target/Math.max(.0001,l);
 return [r,g,b].map(v=>Math.max(0,target+(v-l)*tone.saturation*factor));
}
export function applySelectedPigmentTone(material,tone){
 material.userData.selectedPigmentTone={...tone};
 material.onBeforeCompile=shader=>{
  const code=`\n#ifdef USE_MAP\nfloat archiveL=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));\nfloat archiveTarget=${tone.low.toFixed(6)}+${(tone.high-tone.low).toFixed(6)}*pow(clamp(archiveL,0.0,1.0),${tone.exponent.toFixed(6)});\ndiffuseColor.rgb=max(vec3(0.0),vec3(archiveTarget)+(diffuseColor.rgb-vec3(archiveL))*${tone.saturation.toFixed(6)}*archiveTarget/max(0.0001,archiveL));\n#endif\n`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>'+code);
 };
 material.customProgramCacheKey=()=> 'archive-selected-map-tone-v0653:'+JSON.stringify(tone);material.needsUpdate=true;
}
