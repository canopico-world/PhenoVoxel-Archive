import * as T from 'three';
import anchors from './gray-whale-barnacle-anchors.json' with {type:'json'};
const V=(...a)=>new T.Vector3(...a);
const files={skin:new URL('./gray-whale-skin-v0657.png',import.meta.url).href,normal:new URL('./gray-whale-normal-v0657.png',import.meta.url).href,roughness:new URL('./gray-whale-roughness-v0657.png',import.meta.url).href,baleen:new URL('./gray-whale-baleen-v0657.png',import.meta.url).href};

export function configureGraySkin(m){
 const pending=[],textures={};
 for(const[k,url]of Object.entries(files)){
  let texture;if(typeof document==='undefined')texture=new T.Texture();else pending.push(new Promise((resolve,reject)=>{texture=new T.TextureLoader().load(url,resolve,undefined,reject);}));
  texture.flipY=false;texture.colorSpace=['skin','baleen'].includes(k)?T.SRGBColorSpace:T.NoColorSpace;texture.userData={compatibilityResolution:2048,file:url.split('/').pop(),author:'Digital Life / Johnson Martin; PhenoVoxel Archive derivative',license:'CC BY-NC4.0',scope:k==='normal'?'New numerical grain field; source had no normal map':'Disclosed selected display derivative, not measured tissue optics'};textures[k]=texture;
 }
 for(const p of m.suppliedGray.parts){const mat=p.mesh.material;if(p.mesh.name.includes('_body_')){mat.map=textures.skin;mat.normalMap=textures.normal;mat.normalScale.set(.55,.55);mat.roughnessMap=textures.roughness;mat.roughness=.82;mat.userData.compatibilityLinearTexture=true;}else if(p.mesh.name.includes('_baleen_')){mat.map=textures.baleen;mat.roughness=.9;mat.userData.compatibilityLinearTexture=true;}mat.needsUpdate=true;}
 m.suppliedGray.textures=textures;m.textureReady=Promise.all(pending);
}

// A low, embedded ring with radial ridges and a recessed opercular centre.
// The underlying deeply folded shell is not reconstructed as a tall cone.
function shellGeometry(){
 const pos=[],col=[],ix=[],n=48,rings=[[.0,.12],[.24,.16],[.38,.23],[.65,.11],[1,-.10]];
 for(let j=0;j<rings.length;j++)for(let i=0;i<=n;i++){
  const a=i/n*Math.PI*2,[r,h]=rings[j],ridge=(Math.cos(a*24)+1)*.5,seam=Math.abs(Math.sin(a*3)),rr=r*(1+.12*Math.sin(a*5+.3)+.055*Math.sin(a*11));
  pos.push(Math.cos(a)*rr,Math.sin(a)*rr,h+(j>1?.025*ridge:0));
  const tone=j<2?.21+.09*ridge:.33+.16*ridge-.12*(1-seam)**10;col.push(tone,tone*.97,tone*.82);
 }
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;ix.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function configureGrayBarnacles(m){
 const mesh=new T.InstancedMesh(shellGeometry(),new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.86,metalness:0,side:T.DoubleSide}),anchors.anchors.length);mesh.name='Authored low-profile gray-whale barnacle colonies';mesh.userData={source:'PhenoVoxel Archive original surface-bound shell approximation; comparison with Cryptolepas literature',license:'MIT',scope:'Not an identified individual, census or complete shell microanatomy'};mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;
 anchors.anchors.forEach((a,i)=>mesh.setColorAt(i,new T.Color(a.tone,a.tone,a.tone)));m.root.add(mesh);m.suppliedGray.barnacles={mesh,anchors:anchors.anchors};updateGrayBarnacles(m);
}
export function updateGrayBarnacles(m){
 const f=m.suppliedGray,b=f.barnacles;if(!b)return;const o=new T.Object3D(),up=V(0,0,1),n=V(),p=V(),q=V(),normal=V(),spin=new T.Quaternion();
 for(let i=0;i<b.anchors.length;i++){const a=b.anchors[i],g=f.parts[a.part].mesh.geometry,pp=g.attributes.position,nn=g.attributes.normal;p.set(0,0,0);n.set(0,0,0);for(let k=0;k<3;k++){q.fromBufferAttribute(pp,a.indices[k]);p.addScaledVector(q,a.bary[k]);normal.fromBufferAttribute(nn,a.indices[k]);n.addScaledVector(normal,a.bary[k]);}n.normalize();o.position.copy(p);o.quaternion.setFromUnitVectors(up,n);spin.setFromAxisAngle(up,a.rotation);o.quaternion.multiply(spin);o.scale.set(a.radius,a.radius*(.83+.25*Math.sin(a.rotation)**2),a.radius);o.updateMatrix();b.mesh.setMatrixAt(i,o.matrix);}
 b.mesh.instanceMatrix.needsUpdate=true;
}
