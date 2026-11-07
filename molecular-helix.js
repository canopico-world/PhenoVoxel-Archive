import {complement} from './molecular-core.js';

// Perspective-projected base-pair schematic. Spheres are nucleotide markers, NOT atoms.
// Rotation changes the camera presentation; it does not simulate molecular dynamics.
export function createHelix(canvas, getState, onSelect) {
  const ctx=canvas.getContext('2d'), colors={A:'#85edc0',T:'#f4bc7b',C:'#87c7ff',G:'#db9df4',N:'#aab5bd'};
  let angle=.35,tilt=-.12,zoom=1,alive=true,visible=true,frame,last=0,dirty=true,points=[],drag=null;
  const abort=new AbortController(),opt={signal:abort.signal};
  const resize=new ResizeObserver(()=>dirty=true);resize.observe(canvas);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;dirty=true;});intersection.observe(canvas);
  const project=(x,y,z,w,h)=>{const yy=y*Math.cos(angle)-z*Math.sin(angle),zz=y*Math.sin(angle)+z*Math.cos(angle),xx=x*Math.cos(tilt)-yy*Math.sin(tilt),dy=x*Math.sin(tilt)+yy*Math.cos(tilt),scale=620/(620+zz);return {x:w/2+xx*scale,y:h/2+dy*scale,z:zz,scale};};
  function draw(){
    const bounds=canvas.getBoundingClientRect(),w=bounds.width,h=bounds.height,dpr=Math.min(devicePixelRatio||1,2);
    if(!w||!h)return;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const glow=ctx.createRadialGradient(w*.48,h*.48,10,w*.48,h*.48,w*.6);glow.addColorStop(0,'#123d44');glow.addColorStop(1,'#06171e');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#59949b15';ctx.lineWidth=.6;
    for(let x=16;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=16;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    const {bases,selected,changes,reverse}=getState(),step=Math.min(14,(w-90)/Math.max(1,bases.length-1))*zoom,radius=Math.min(69,h*.22)*zoom,primitives=[],rails=[[],[]];points=[];
    for(let i=0;i<bases.length;i++){
      const {position,base}=bases[i],stored=changes.get(position),b=stored?(reverse?complement(stored):stored):base,theta=i*2*Math.PI/10.5,x=(i-(bases.length-1)/2)*step;
      const pair=[0,1].map(s=>project(x,radius*Math.cos(theta+s*Math.PI),radius*Math.sin(theta+s*Math.PI),w,h));
      pair.forEach((p,s)=>{rails[s].push(p);points.push({...p,position});});
      primitives.push({pair,b,position,z:(pair[0].z+pair[1].z)/2,changed:!!stored});
    }
    rails.forEach(rail=>{ctx.beginPath();rail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineWidth=2.2;ctx.strokeStyle='#c1eee8a0';ctx.shadowColor='#7effe3';ctx.shadowBlur=7;ctx.stroke();ctx.shadowBlur=0;});
    primitives.sort((a,b)=>b.z-a.z);
    for(const item of primitives){
      const [a,b]=item.pair,mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},isSelected=item.position===selected;
      if(isSelected){ctx.strokeStyle='#e0fff7';ctx.lineWidth=11;ctx.globalAlpha=.17;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;}
      for(const [p,base]of [[a,item.b],[b,complement(item.b)]]){
        ctx.strokeStyle=(colors[base]||colors.N);ctx.lineWidth=isSelected?5:3.2;ctx.globalAlpha=.6+p.scale*.25;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(mid.x+(p.x-mid.x)*.10,mid.y+(p.y-mid.y)*.10);ctx.stroke();ctx.globalAlpha=1;
        const r=(isSelected?7:4.8)*p.scale,g=ctx.createRadialGradient(p.x-r*.3,p.y-r*.4,.2,p.x,p.y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.3,(colors[base]||colors.N));g.addColorStop(1,'#163947');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
        if(isSelected||bases.length<=30){ctx.font='600 11px ui-monospace,monospace';ctx.fillStyle=(colors[base]||colors.N);ctx.textAlign='center';ctx.fillText(base,p.x,p.y+(p.y<h/2?-13:19));}
      }
      if(item.changed){ctx.strokeStyle='#ffcb78';ctx.lineWidth=1.5;for(const p of [a,b]){ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.stroke();}}
    }
    const first=rails[0][0],lastPoint=rails[0].at(-1);ctx.font='11px ui-monospace,monospace';ctx.fillStyle='#b8dbd5';ctx.textAlign='left';ctx.fillText('5′',Math.max(8,first.x-24),first.y-13);ctx.fillText('3′',Math.min(w-22,lastPoint.x+8),lastPoint.y-13);
    ctx.fillStyle='#86b7bd';ctx.font='10px ui-monospace,monospace';ctx.fillText('LOCAL HELIX / '+bases[0].position+' … '+bases.at(-1).position,18,68);ctx.fillText('NUCLEOTIDE MARKERS · SCHEMATIC',18,h-20);
    canvas.dataset.selected=String(selected);canvas.dataset.window=bases.map(x=>x.position).join(',');
  }
  function loop(t){if(!alive)return;frame=requestAnimationFrame(loop);if(t-last<33||!visible||document.hidden)return;const {rotating}=getState();if(rotating&&!drag){angle+=Math.min(t-last,80)*.00024;dirty=true;}last=t;if(dirty){draw();dirty=false;}}
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);},opt);
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.px,dy=e.clientY-drag.py;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5;angle+=dx*.013;tilt=Math.max(-.6,Math.min(.6,tilt+dy*.005));drag.px=e.clientX;drag.py=e.clientY;dirty=true;},opt);
  canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,nearest=points.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];if(nearest?.d<25)onSelect(nearest.position);}drag=null;},opt);
  canvas.addEventListener('pointercancel',()=>drag=null,opt);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.65,Math.min(1.65,zoom-e.deltaY*.001));dirty=true;},{...opt,passive:false});
  frame=requestAnimationFrame(loop);
  return {update(){dirty=true;},reset(){angle=.35;tilt=-.12;zoom=1;dirty=true;},dispose(){alive=false;cancelAnimationFrame(frame);abort.abort();resize.disconnect();intersection.disconnect();}};
}
