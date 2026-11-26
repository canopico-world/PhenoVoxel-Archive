import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {Matrix4,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {prepareAsset,animateAsset} from './asset-motion.js';
import {renderedBounds} from './camera-fit.js';
import {SUPPORT_Y,EAGLE_SIDES} from './eagle-rig-v0725.js';
import {continuousEagle} from './eagle-source-v0727.js';
import release from './eagle-data-v0727.json' with {type:'json'};

globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:128,height:128,close(){}});
const species=continuousEagle(JSON.parse(readFileSync('species.json')).species.find(s=>s.id===release.id));
const asset=release.modelAsset,bytes=readFileSync(asset.localFile);
const hash=b=>createHash('sha256').update(b).digest('hex');
const point=()=>new Vector3();
async function read(raw){return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');}
async function model(){return prepareAsset(await read(bytes),species,asset);}

test('the corrected head and torso use the credited standing material in one persistent skeleton',async()=>{
  assert.equal(hash(bytes),asset.sha256);
  assert.equal(bytes.length,asset.bytes);
  assert.equal(hash(readFileSync(asset.sourceFile)),asset.derivedFromSha256);
  assert.equal(hash(readFileSync(asset.standingReference.archive)),asset.standingReference.sha256);
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
  assert.equal(json.skins.length,1);
  assert.equal(json.skins[0].joints.length,23);
  assert.equal(json.meshes.length,5);
  assert.equal(json.images.length,5);
  assert.equal(json.meshes.find(m=>m.name==='Adult tail rectrices').extras.feathers,12);
  const binaryOffset=28+bytes.readUInt32LE(12);
  const mapHashes=json.images.map(image=>{
    const view=json.bufferViews[image.bufferView],offset=binaryOffset+(view.byteOffset||0);
    return hash(bytes.subarray(offset,offset+view.byteLength));
  });
  assert.deepEqual(mapHashes.sort(),asset.maps.map(map=>map.sha256).sort());
  const m=await model(),r=m.birdRevision;
  assert(r.continuousBody&&r.unifiedEagle&&r.flightFeathers);
  assert.equal(r.body.material.name,'Continuous head neck and body plumage');
  assert(!r.parts.some(p=>/eye_(rim|iris|pupil)/.test(p.name)));
  assert.equal(r.parts.length,5);
  const bodyImage=asset.maps.find(t=>t.name==='Standing reference body and head pigment');
  assert.equal(bodyImage.sha256,'582871f3561c35a05852b43b99715bf5ec05217e908970251658c5dee64b2517');
  assert.equal(asset.viewerRig.animationValidated,false);
});

test('the head and torso preserve reference UVs and geometry while each feathered cuff follows its own leg',async()=>{
  const donor=await read(readFileSync(asset.standingReference.archive));
  let reference;
  donor.scene.traverse(n=>{if(n.name.startsWith('Rebuilt_standing_credited'))reference=n;});
  const positions=reference.geometry.attributes.position,uv=reference.geometry.attributes.uv;
  const table=new Map(),registration=new Matrix4().makeScale(.88,.80,.86).setPosition(-.322,.002,0);
  const key=(uv,i)=>uv.getX(i).toFixed(5)+','+uv.getY(i).toFixed(5);
  for(let i=0;i<positions.count;i++){
    const at=key(uv,i),p=point().fromBufferAttribute(positions,i).applyMatrix4(registration);
    if(!table.has(at))table.set(at,[]);
    table.get(at).push(p);
  }
  const m=await model();
  animateAsset(m,'stand',0);
  const core=m.birdRevision.body,p=point(),targetUV=core.geometry.attributes.uv;
  let maximum=0,head=0;
  const legs=[0,0],cuffs=[0,0];
  const {skinIndex,skinWeight}=core.geometry.attributes;
  for(let i=0;i<targetUV.count;i++){
    const candidates=table.get(key(targetUV,i));
    assert(candidates,'Body UV differs from the reference');
    core.getVertexPosition(i,p).applyMatrix4(core.matrixWorld);
    const error=Math.min(...candidates.map(q=>q.distanceTo(p)));
    const side=p.z<0?0:1,leg=EAGLE_SIDES[side];
    const weighted=[0,1,2,3].filter(j=>skinWeight.getComponent(i,j)>.00001).map(j=>skinIndex.getComponent(i,j));
    if(weighted.some(b=>b===leg.hock||b===leg.hip)){
      legs[side]++;
      assert(weighted.every(b=>b===0||b===leg.hock||b===leg.hip));
      assert(!candidates.every(q=>q.y<.1869&&Math.hypot(q.x+.168,Math.abs(q.z)-.116)<.095),'Bare scan ankle retained');
      if(p.y<.194&&weighted.includes(leg.hock)){
        cuffs[side]++;
        const shankX=-.252+(.224-p.y)*.59;
        assert(Math.hypot(p.x-shankX,p.z-EAGLE_SIDES[side].sign*.11)<.026,'Feather cuff misses the scuted leg');
      }
    }else maximum=Math.max(maximum,error);
    if(p.y>.84)head++;
  }
  assert(legs.every(count=>count>300)&&cuffs.every(count=>count>10),'Both feather cuffs must follow the paired hindlimbs');
  assert(head>300,'Adult head geometry is missing');
  assert(maximum<.00025,'Registered body vertex error '+maximum);
});

// For each sampled wing-root vertex, intersect a transverse line with the
// deformed torso and require body surface on both sides of the attachment.
function insideTorso(root,positions,indices) {
  let left=Infinity,right=-Infinity;
  for(let i=0;i<indices.length;i+=3){
    const a=positions[indices[i]],b=positions[indices[i+1]],c=positions[indices[i+2]];
    const bx=b.x-a.x,by=b.y-a.y,cx=c.x-a.x,cy=c.y-a.y,den=bx*cy-cx*by;
    if(Math.abs(den)<1e-10)continue;
    const dx=root.x-a.x,dy=root.y-a.y,u=(dx*cy-cx*dy)/den,v=(bx*dy-dx*by)/den;
    if(u<0||v<0||u+v>1)continue;
    const z=a.z+u*(b.z-a.z)+v*(c.z-a.z);
    left=Math.min(left,z);right=Math.max(right,z);
  }
  return left<root.z-.002&&right>root.z+.002;
}

test('both wing roots penetrate the feathered mantle throughout the eight display modes',async()=>{
  const m=await model(),r=m.birdRevision,wing=r.flightFeathers,body=r.body;
  const {position,skinIndex,skinWeight}=wing.geometry.attributes;
  const anchors=[];
  for(const {sign} of EAGLE_SIDES){
    const medial=[];
    for(let i=0;i<position.count;i++){
      const z=position.getZ(i)*sign;
      if(z>0&&z<.05&&skinIndex.getX(i)===0&&skinWeight.getX(i)>.999)medial.push(i);
    }
    assert(medial.length>50,'Missing proximal feather surface');
    for(const sorted of [medial.toSorted((a,b)=>position.getX(a)-position.getX(b)),medial.toSorted((a,b)=>position.getY(a)-position.getY(b))]){
      for(const fraction of [0,.25,.5,.75,1])anchors.push(sorted[Math.floor(fraction*(sorted.length-1))]);
    }
  }
  for(const [action,time] of [['observe',0],['stand',0],['look',2],['takeoff',.66],['takeoff',1],['takeoff',1.35],
    ['fly',.87],['fly',1.09],['glide',4],['bank',4],['landing',1.7],['landing',2.16],['landing',2.75],['landing',4.4]]){
    animateAsset(m,action,time);
    const neutral=m.content.matrixWorld.clone().invert();
    const local=(mesh,i)=>mesh.getVertexPosition(i,point()).applyMatrix4(mesh.matrixWorld).applyMatrix4(neutral);
    const surface=Array.from({length:body.geometry.attributes.position.count},(_,i)=>local(body,i));
    for(const i of anchors)assert(insideTorso(local(wing,i),surface,body.geometry.index.array),action+' wing gap at '+time);
  }
});

test('all studies retain the same skinned body feather and foot surfaces without asset swaps',async()=>{
  const m=await model(),r=m.birdRevision,geometry=r.parts.map(p=>p.geometry),material=r.parts.map(p=>p.material);
  const studies=[['stand',0],['look',2],['takeoff',.5],['takeoff',.68],['takeoff',1.2],['fly',1.09],['glide',4],['landing',2.16],['landing',3.12],['landing',4.4]];
  for(const [action,time]of studies){
    animateAsset(m,action,time);
    assert(r.parts.every((p,i)=>p.visible&&p.geometry===geometry[i]&&p.material===material[i]&&p.skeleton.bones.every((b,j)=>b===r.bones[j])),action);
    assert(r.body.morphTargetInfluences.every(Number.isFinite),action);
    assert(r.flightFeathers.morphTargetInfluences.every(Number.isFinite),action);
  }
  const end=renderedBounds(m.root);
  animateAsset(m,'stand',0);
  const rest=renderedBounds(m.root);
  assert(end.min.distanceTo(rest.min)<1e-8&&end.max.distanceTo(rest.max)<1e-8);
  animateAsset(m,'takeoff',.84);
  animateAsset(m,'stand',0);
  assert.equal(r.body.morphTargetInfluences[2],1);
  assert.equal(r.flightFeathers.morphTargetInfluences[2],1);
});

test('ground contact and camera bounds remain stable through both finite transitions',async()=>{
  const m=await model(),r=m.birdRevision;
  animateAsset(m,'stand',0);
  const a=r.feet.geometry.attributes.position,anchors=[];
  for(const {sign}of EAGLE_SIDES){
    let index=-1,low=Infinity;
    for(let i=0;i<a.count;i++){
      if(Math.sign(a.getZ(i))!==sign)continue;
      const p=r.feet.getVertexPosition(i,point()).applyMatrix4(r.feet.matrixWorld);
      if(p.y<low){low=p.y;index=i;}
    }
    anchors.push([index,r.feet.getVertexPosition(index,point()).applyMatrix4(r.feet.matrixWorld)]);
  }
  for(const action of ['takeoff','landing'])for(let i=0;i<=110;i++){
    const time=i*.04;
    animateAsset(m,action,time);
    const bounds=renderedBounds(m.root);
    assert(bounds.min.y>=SUPPORT_Y-.0005,action+' floor '+time+' '+bounds.min.y);
    assert(m.motionBounds[action].containsBox(bounds),action+' camera '+time);
    if((action==='takeoff'&&time<=1)||(action==='landing'&&time>=2.16))for(const[index,anchor]of anchors){
      const p=r.feet.getVertexPosition(index,point()).applyMatrix4(r.feet.matrixWorld);
      assert(p.distanceTo(anchor)<.0005,action+' foot drift '+time);
    }
  }
  for(const action of ['fly','glide','bank','look'])for(const time of[0,1.09,2,4,6,8]){
    animateAsset(m,action,time);
    assert(m.motionBounds[action].containsBox(renderedBounds(m.root)),action+' camera '+time);
  }
});

test('the normal entry point offers pause reset and phases on the new asset and retains scientific limits',()=>{
  const code=readFileSync('app.js','utf8');
  assert(code.includes("import {continuousEagle} from './eagle-source-v0727.js'"));
  assert(code.includes("const eagleTransition=state.selected.modelAsset?.eagleVersion==='0.7.27'"));
  assert(code.includes('study-time')&&code.includes('study-apply'));
  assert.equal(species.review.independentlyValidated,false);
  assert.equal(species.modelAsset.metricCalibration,false);
  const sourceIds=new Set(species.sources.map(s=>s.id));
  assert(species.behaviors.every(b=>b.sourceIds.every(id=>sourceIds.has(id))));
});
