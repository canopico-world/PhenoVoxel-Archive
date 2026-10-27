import {coralCalyxExterior,animateCoralCalyxExterior} from './coral-calyx-exteriors.js';
import {jellyfishExteriorSpecies,buildJellyfishExterior,animateJellyfishExterior} from './jellyfish-exteriors.js';
import {animateFungalExterior} from './fungal-exteriors.js';
import{ascomyceteStromata,animateStromata}from'./ascomycete-stromata.js';
import{microscopicBody,animateMicroscopicBody}from'./microscopic-bodies.js';
import{fungalBody,animateFungalBody}from'./fungal-bodies.js';
import{gymnospermOrgans,animateGymnospermOrgans}from'./gymnosperm-organs.js';
import{coniferCrown,animateConifer}from'./conifer-crowns.js';
import{caridean,animateCaridean}from'./caridean-prawns.js';
import{hermitCrab,animateHermitCrab}from'./hermit-crab.js';
import{spinyLobster,animateSpinyLobster}from'./spiny-lobsters.js';
import{clawedLobster,animateClawedLobster}from'./clawed-lobsters.js';
import {coastalCrab,animateCoastalCrab} from './coastal-crabs.js';
import {mittenCrab,animateMitten} from './mitten-crab.js';
import {asianShoreCrab,animateAsianShore} from './asian-shore-crab.js';
import {velvetCrab,animateVelvet} from './velvet-crab.js';
import {gazamiCrab,animateGazami} from './gazami-crab.js';
import {blueCrab,animateBlueCrab} from './blue-crab.js';
import {shoreCrab,animateShoreCrab} from './shore-crab.js';
import {edibleCrab,animateEdibleCrab} from './edible-crab.js';
import {plantAction} from './plant-development-policy.js';import * as T from 'three';import {toolkit} from './expansion-geometry.js';import {invertebrate} from './expansion-invertebrates.js';import {botany} from './expansion-botany.js';import {microfungi} from './expansion-microfungi.js';
import {marineExpansion} from './expansion-marine.js';import {lamiaceae} from './expansion-lamiaceae.js';import {fruitingCells} from './expansion-fruiting-cells.js';
import {succulents} from './expansion-succulents.js';import {molluscs} from './expansion-molluscs.js';import {jelliesAlgae} from './expansion-jellies-algae.js';
import {cnidarians} from './expansion-cnidarians.js';import {asteraceae} from './expansion-asteraceae.js';import {fungiCiliates} from './expansion-fungi-ciliates.js';
import {echinodermRevision,animateEchinodermRevision} from './echinoderm-revision.js';
import {cnidarianRevision,animateCnidarianRevision} from './cnidarian-revision.js';
import {anemoneExterior,animateAnemoneExterior} from './anemone-exteriors.js';
import {softInvertebrateRevision,animateSoftInvertebrateRevision} from './soft-invertebrate-revision.js';
import {planktonStarRevision,animatePlanktonStarRevision} from './plankton-seastar-revision.js';
import {urchinSurfaceRevision,animateUrchinSurfaceRevision} from './urchin-surface-revision.js';
import {seaCucumberRevision,animateSeaCucumberRevision} from './sea-cucumber-revision.js';
import {armedEchinodermRevision,animateArmedEchinodermRevision} from './armed-echinoderm-revision.js';
export function buildExpansionSpecimen(s){if(jellyfishExteriorSpecies.has(s.id))return buildJellyfishExterior(s);const k=toolkit(),newFeatures=ascomyceteStromata(s,k)||microscopicBody(s,k)||fungalBody(s,k)||gymnospermOrgans(s,k)||coniferCrown(s,k)||caridean(s,k)||hermitCrab(s,k)||spinyLobster(s,k)||clawedLobster(s,k)||coastalCrab(s,k)||mittenCrab(s,k)||asianShoreCrab(s,k)||velvetCrab(s,k)||gazamiCrab(s,k)||blueCrab(s,k)||shoreCrab(s,k)||edibleCrab(s,k)||armedEchinodermRevision(s,k)||seaCucumberRevision(s,k)||urchinSurfaceRevision(s,k)||planktonStarRevision(s,k)||softInvertebrateRevision(s,k)||cnidarianRevision(s,k)||anemoneExterior(s,k)||coralCalyxExterior(s,k)||echinodermRevision(s,k)||cnidarians(s,k)||asteraceae(s,k)||fungiCiliates(s,k)||succulents(s,k)||molluscs(s,k)||jelliesAlgae(s,k);if(newFeatures)k.root.userData.preciseGround=true;const f=newFeatures||marineExpansion(s,k)||lamiaceae(s,k)||fruitingCells(s,k)||invertebrate(s,k)||botany(s,k)||microfungi(s,k);if(!f)throw Error('Unsupported expansion anatomy '+s.visual.expansionProfile);return k.finish(s,f);}
export function animateExpansion(m,action,t){action=plantAction(m.id,action);const r=m.expansionRig,p=r.profile;m.root.traverse(o=>{const b=o.userData.base;if(b){o.position.copy(b.position);o.rotation.copy(b.rotation);o.scale.copy(b.scale);}});for(const x of r.soft){x.mesh.geometry.attributes.position.array.set(x.base);x.mesh.geometry.attributes.position.needsUpdate=true;}if(animateJellyfishExterior(m,action,t)||animateFungalExterior(m,action,t)||animateStromata(m,action,t)||animateMicroscopicBody(m,action,t)||animateFungalBody(m,action,t)||animateGymnospermOrgans(m,action,t)||animateConifer(m,action,t)||animateCaridean(m,action,t)||animateHermitCrab(m,action,t)||animateSpinyLobster(m,action,t)||animateClawedLobster(m,action,t)||animateCoastalCrab(m,action,t)||animateMitten(m,action,t)||animateAsianShore(m,action,t)||animateVelvet(m,action,t)||animateGazami(m,action,t)||animateBlueCrab(m,action,t)||animateShoreCrab(m,action,t)||animateEdibleCrab(m,action,t)||animateArmedEchinodermRevision(m,action,t)||animateSeaCucumberRevision(m,action,t)||animateUrchinSurfaceRevision(m,action,t)||animatePlanktonStarRevision(m,action,t)||animateSoftInvertebrateRevision(m,action,t)||animateCnidarianRevision(m,action,t)||animateAnemoneExterior(m,action,t)||animateCoralCalyxExterior(m,action,t)||animateEchinodermRevision(m,action,t))return;if(action==='observe'||action==='rest')return;
 if(['grow','unfurl'].includes(action)){const progress=.22+.78*T.MathUtils.smoothstep(t,0,7);m.root.scale.multiplyScalar(progress);m.root.position.set(r.home.x*progress,.14+(r.home.y-.14)*progress,r.home.z*progress);return;}
 for(const{object:o,type,index:i,axis,sign}of r.moving){if(type==='tube-foot')o.rotation.z=.13*Math.sin(t*1.2+i*.45);else if(type==='arm-joint')o.rotation.z+=.035*Math.sin(t*.8+i*.5);else if(type==='tentacle'||type==='polyp')o.rotation.z=.07*Math.sin(t*.9+i*.6);else if(type==='valve'&&action==='clap')o.rotation[axis||'z']=(sign||1)*.13*(1-Math.cos(t*3));else if(type==='antenna')o.rotation.x=i*.34*Math.sin(t*2.7);else if(type==='colony')o.rotation.y=t*.18;else if(type==='cilia')o.rotation.x=.18*Math.sin(t*5+i*.3);else if(type==='bell-pulse'&&action==='pulse'){const q=1-.09*(.5-.5*Math.cos(t*2.0));o.scale.x*=q;o.scale.z*=q;}else if(type==='lacrymaria-neck'&&action==='neck')o.scale.x*=.70+.30*Math.cos(t*1.5);else if(type==='lacrymaria-head'&&action==='neck')o.scale.x/=.70+.30*Math.cos(t*1.5);else if(type==='vorticella-cell'&&action==='stalk'){const q=.5-.5*Math.cos(t*1.5);o.position.y=1.25-.80*q;}}
 if(p==='vorticella'&&action==='stalk'){const q=.5-.5*Math.cos(t*1.5);for(const x of r.soft){const a=x.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const u=T.MathUtils.clamp(x.base[i*3+1]/1.25,0,1),rad=.075*q*Math.sin(u*Math.PI);a.setXYZ(i,x.base[i*3]+rad*Math.sin(u*(Math.PI*2)*5),x.base[i*3+1]*(1-.64*q),x.base[i*3+2]+rad*Math.cos(u*(Math.PI*2)*5));}a.needsUpdate=true;x.mesh.geometry.computeVertexNormals();}}
 if(p==='brittle')for(const x of r.soft){const a=x.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const u=Math.max(0,(x.base[i*3]-.18)/1.4);a.setZ(i,x.base[i*3+2]+.11*u*u*Math.sin(t*1.2+u*2));}a.needsUpdate=true;x.mesh.geometry.computeVertexNormals();}
 if(p==='nematode')for(const x of r.soft){const a=x.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,x.base[i*3+2]+.12*Math.sin(x.base[i*3]*3.4-t*2)*Math.sin((x.base[i*3]+1.5)/3*Math.PI));a.needsUpdate=true;x.mesh.geometry.computeVertexNormals();}
 if(p==='planarian'||['pond-snail','garden-snail'].includes(p))m.root.position.x+=Math.sin(t*.35)*.12;
 if(['stentor','spirostomum','hydra'].includes(p)&&action==='contract'){const v=.5-.5*Math.cos(Math.min(t,3)/3*Math.PI),ratio=1-.48*v;if(p==='spirostomum'){m.root.scale.x*=ratio;m.root.scale.y*=1/Math.sqrt(ratio);m.root.scale.z*=1/Math.sqrt(ratio);}else{m.root.scale.y*=ratio;m.root.position.y=.14+(r.home.y-.14)*ratio;} }
 m.root.updateMatrixWorld(true);
}


