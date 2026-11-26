// Marker centers in desktop-board units. Keep these aligned with the printed SVG.
export const boardPoints = [[-1,-.53],[1,-.53],[1,.53],[-1,.53]];
const dot = (a,b) => a.reduce((sum,x,i)=>sum+x*b[i],0);
const unit = a => a.map(x=>x/Math.hypot(...a));

function solve(rows) {
  for (let col=0;col<8;col++) {
    let best=col;
    for(let i=col+1;i<8;i++) if(Math.abs(rows[i][col])>Math.abs(rows[best][col])) best=i;
    [rows[col],rows[best]]=[rows[best],rows[col]];
    const pivot=rows[col][col];
    if(Math.abs(pivot)<1e-8)return null;
    rows[col]=rows[col].map(x=>x/pivot);
    for(let i=0;i<8;i++)if(i!==col){
      const factor=rows[i][col];
      rows[i]=rows[i].map((x,j)=>x-factor*rows[col][j]);
    }
  }
  return rows.map(row=>row[8]);
}

export function estimateSide(points,width,height) {
  if(!Array.isArray(points)||points.length!==4||points.some(p=>!p||p.length!==2||!p.every(Number.isFinite)))return null;
  const turn=(a,b,c)=>(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
  if(points.some((a,i)=>turn(a,points[(i+1)%4],points[(i+2)%4])<width*height*.009))return null;
  const rows=boardPoints.flatMap(([x,y],i)=>{
    const u=(points[i][0]-width/2)/width, v=(points[i][1]-height/2)/width;
    return [[x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]];
  });
  const h=solve(rows);
  if(!h)return null;
  // Infer the focal length from the two perpendicular, equally scaled axes.
  // Include nearby iPhone wide-camera focal lengths for weak-perspective cases.
  const candidates=[.57,.68,.8,.94,1.1];
  const xyDot=h[0]*h[1]+h[3]*h[4], zDot=h[6]*h[7];
  const xyDiff=h[0]**2+h[3]**2-h[1]**2-h[4]**2, zDiff=h[6]**2-h[7]**2;
  for(const squared of [-xyDot/zDot,-xyDiff/zDiff])if(squared>.27&&squared<1.5)candidates.push(Math.sqrt(squared));
  const fits=candidates.map(f=>{
    const x=[h[0]/f,h[3]/f,h[6]], y=[h[1]/f,h[4]/f,h[7]], t=[h[2]/f,h[5]/f,1];
    const a=Math.hypot(...x), b=Math.hypot(...y);
    return {err:Math.abs(dot(unit(x),unit(y)))+Math.abs(Math.log(a/b)), position:-dot(unit(x),t)/((a+b)/2)};
  }).filter(v=>Number.isFinite(v.err)&&Number.isFinite(v.position)).sort((a,b)=>a.err-b.err);
  if(!fits.length||fits[0].err>.16||Math.abs(fits[0].position)<.24)return null;
  const candidatesNear=fits.filter(v=>v.err<=fits[0].err+.035);
  if(candidatesNear.some(v=>Math.sign(v.position)!==Math.sign(fits[0].position)||Math.abs(v.position)<.18))return null;
  return {edge:fits[0].position<0?'left':'right',offset:fits[0].position};
}

// Find the four bright corner markers against the dark calibration screen.
// Largest connected components make the detector insensitive to scattered colour noise.
export function findMarkers({data,width,height}) {
  const colors=new Uint8Array(width*height);
  for(let i=0;i<colors.length;i++){
    const r=data[4*i],g=data[4*i+1],b=data[4*i+2];
    if(b>145&&g>125&&g-r>50&&b-r>50)colors[i]=1;
    else if(g>140&&g-r>60&&g-b>54)colors[i]=2;
    else if(r>145&&b>130&&r-g>60&&b-g>55)colors[i]=3;
    else if(r>150&&r-g>76&&r-b>76)colors[i]=4;
  }
  const best=[null,null,null,null],queue=new Uint32Array(colors.length);
  for(let i=0;i<colors.length;i++){
    const color=colors[i];if(!color)continue;
    let head=0,tail=1,sx=0,sy=0;
    queue[0]=i;colors[i]=0;
    while(head<tail){
      const p=queue[head++],x=p%width,y=(p-x)/width;
      sx+=x;sy+=y;
      if(x>0&&colors[p-1]===color){colors[p-1]=0;queue[tail++]=p-1;}
      if(x<width-1&&colors[p+1]===color){colors[p+1]=0;queue[tail++]=p+1;}
      if(y>0&&colors[p-width]===color){colors[p-width]=0;queue[tail++]=p-width;}
      if(y<height-1&&colors[p+width]===color){colors[p+width]=0;queue[tail++]=p+width;}
    }
    if(tail>=24&&(!best[color-1]||tail>best[color-1].area))best[color-1]={area:tail,point:[sx/tail,sy/tail]};
  }
  if(best.some(v=>!v))return null;
  const areas=best.map(v=>v.area);
  if(Math.max(...areas)/Math.min(...areas)>9)return null;
  return best.map(v=>v.point);
}

export async function sideFromPhoto(file) {
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();
    image.src=url;
    await image.decode();
    const scale=Math.min(1,900/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.round(image.naturalWidth*scale);
    canvas.height=Math.round(image.naturalHeight*scale);
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
    return estimateSide(findMarkers(frame),frame.width,frame.height);
  } finally {URL.revokeObjectURL(url);}
}

