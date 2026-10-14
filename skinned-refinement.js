import * as T from 'three';
// Subdivide without dropping texture coordinates or skin influences. Only the
// supplied anatomical region receives a conservative geometric smoothing pass.
export function refineSkinnedSurface(input,region){
 const p=input.attributes.position,source=input.index.array,lookup=new Map(),weld=[],positions=[],neighbors=[];
 for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(x=>Math.round(x*1e6)).join(',');if(!lookup.has(key)){lookup.set(key,positions.length);positions.push(v);neighbors.push(new Set());}weld.push(lookup.get(key));}
 for(let i=0;i<source.length;i+=3)for(const [a,b]of [[source[i],source[i+1]],[source[i+1],source[i+2]],[source[i+2],source[i]]])if(weld[a]!==weld[b]){neighbors[weld[a]].add(weld[b]);neighbors[weld[b]].add(weld[a]);}
 const smooth=positions.map((v,i)=>{if(!region(v)||neighbors[i].size<3)return v.clone();const mean=new T.Vector3();neighbors[i].forEach(j=>mean.add(positions[j]));mean.divideScalar(neighbors[i].size);return v.clone().lerp(mean,.18);});
 const arrays=Object.fromEntries(Object.entries(input.attributes).map(([name,attr])=>[name,Array.from(attr.array)]));for(let i=0;i<p.count;i++)for(let k=0;k<3;k++)arrays.position[i*3+k]=smooth[weld[i]].getComponent(k);
 const chosen=new Set(),edgeKey=(a,b)=>a<b?`${a},${b}`:`${b},${a}`;for(let i=0;i<source.length;i+=3){const tri=[source[i],source[i+1],source[i+2]];if(tri.some(v=>region(positions[weld[v]])))for(const [a,b]of [[tri[0],tri[1]],[tri[1],tri[2]],[tri[2],tri[0]]])chosen.add(edgeKey(a,b));}
 const edgeMap=new Map(),indices=[],at=(a,b)=>{const key=edgeKey(a,b);if(edgeMap.has(key))return edgeMap.get(key);const i=arrays.position.length/3;edgeMap.set(key,i);
  for(const [name,attr]of Object.entries(input.attributes)){if(['skinIndex','skinWeight'].includes(name))continue;for(let k=0;k<attr.itemSize;k++)arrays[name].push((arrays[name][a*attr.itemSize+k]+arrays[name][b*attr.itemSize+k])*.5);}
  const influence=new Map();for(const vertex of [a,b])for(let k=0;k<4;k++){const bone=arrays.skinIndex[vertex*4+k],weight=arrays.skinWeight[vertex*4+k];influence.set(bone,(influence.get(bone)||0)+weight*.5);}const top=[...influence].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=top.reduce((s,[,w])=>s+w,0);for(let k=0;k<4;k++){arrays.skinIndex.push(top[k]?.[0]||0);arrays.skinWeight.push((top[k]?.[1]||0)/sum);}return i;};
 for(let i=0;i<source.length;i+=3){const [a,b,c]=[source[i],source[i+1],source[i+2]],e=[chosen.has(edgeKey(a,b)),chosen.has(edgeKey(b,c)),chosen.has(edgeKey(c,a))],ab=e[0]?at(a,b):null,bc=e[1]?at(b,c):null,ca=e[2]?at(c,a):null,n=e.filter(Boolean).length;
  if(!n)indices.push(a,b,c);else if(n===3)indices.push(a,ab,ca,b,bc,ab,c,ca,bc,ab,bc,ca);else if(n===1){if(e[0])indices.push(a,ab,c,ab,b,c);else if(e[1])indices.push(a,b,bc,a,bc,c);else indices.push(a,b,ca,ca,b,c);}else if(!e[2])indices.push(b,bc,ab,a,ab,c,ab,bc,c);else if(!e[1])indices.push(a,ab,ca,ab,b,c,ca,ab,c);else indices.push(c,ca,bc,a,b,ca,b,bc,ca);
 }
 const result=new T.BufferGeometry();for(const [name,attr]of Object.entries(input.attributes)){const C=name==='skinIndex'?T.Uint16BufferAttribute:T.Float32BufferAttribute;result.setAttribute(name,new C(arrays[name],attr.itemSize,attr.normalized));}result.setIndex(indices);result.computeVertexNormals();return result;
}
