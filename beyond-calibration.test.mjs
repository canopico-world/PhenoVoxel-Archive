import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boardPoints,estimateSide,findMarkers} from './beyond-calibration.mjs';

export function projectBoard(position,width,height,focal=width*.8) {
  const [x,y,z]=position;
  const normal=[-x,-y,-z];
  const size=Math.hypot(...normal);
  const forward=normal.map(v=>v/size);
  const norm=Math.hypot(forward[0],forward[2]);
  const right=[-forward[2]/norm,0,forward[0]/norm];
  const down=[-right[2]*forward[1],right[2]*forward[0]-right[0]*forward[2],right[0]*forward[1]];
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  return boardPoints.map(([u,v])=>{
    const delta=[u-x,v-y,-z];
    return [width/2+focal*dot(right,delta)/dot(forward,delta),height/2+focal*dot(down,delta)/dot(forward,delta)];
  });
}

test('perspective estimates left and right positions even when the board is centered in the photo',()=>{
  for(const [w,h,f] of [[900,680,760],[680,900,590],[800,640,515]]){
    for(const x of [-1.9,-.65,.65,1.9]){
      const points=projectBoard([x,-.37,3],w,h,f);
      assert.equal(estimateSide(points,w,h)?.edge,x<0?'left':'right');
    }
    assert.equal(estimateSide(projectBoard([.08,-.37,3],w,h,f),w,h),null);
  }
});

test('isolated image noise is ignored and incomplete marker frames are rejected',()=>{
  const width=640,height=480;
  const data=new Uint8ClampedArray(width*height*4);
  const points=projectBoard([1.3,-.2,3],width,height);
  const rgb=[[0,255,255],[25,255,0],[255,4,255],[255,0,0]];
  points.forEach(([x,y],i)=>{
    for(let j=-8;j<=8;j++)for(let k=-8;k<=8;k++)if(j*j+k*k<=64){
      const p=(Math.round(y+j)*width+Math.round(x+k))*4;
      data.set([...rgb[i],255],p);
    }
    data.set([...rgb[i],255],(16+i*11)*4);
  });
  assert.equal(estimateSide(findMarkers({data,width,height}),width,height)?.edge,'right');
  for(let i=0;i<data.length;i+=4)if(data[i]===255&&data[i+1]===0&&data[i+2]===0)data[i]=0;
  assert.equal(findMarkers({data,width,height}),null);
});
