import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {resolve} from 'node:path';
import {createBeyondHost} from './beyond-host.mjs';
import {readHandoff,dragRoute,oppositeEdge} from './beyond-protocol.mjs';
import {createBeyondHold,HOLD_MS} from './beyond-hold.mjs';

test('a stationary two-second hold lifts the surface and an ordinary drag does not',()=>{
  const lifted=[];
  let pending;
  const hold=createBeyondHold(contact=>lifted.push(contact.id),{
    schedule(fn,delay){pending={fn,delay};return 1;},
    clear(){pending=null;}
  });
  hold.start({id:1,x:40,y:30,kind:'mouse'});
  assert.equal(pending.delay,2000);
  assert.equal(pending.delay,HOLD_MS);
  assert.deepEqual(lifted,[]);
  hold.move({id:1,x:55,y:30});
  assert.equal(pending,null);
  hold.start({id:2,x:40,y:30,kind:'touch'});
  hold.move({id:2,x:45,y:32});
  hold.cancel(99);
  pending.fn();
  assert.deepEqual(lifted,[2]);
  assert.equal(hold.pending,null);
  hold.start({id:3,x:40,y:30,kind:'mouse'});
  hold.cancel(3);
  assert.equal(pending,null);
});

test('deliberate movement selects one edge and arrives from its opposite',()=>{
  const start={x:625,y:350}, viewport={width:1280,height:720}, extent={width:196,height:130};
  for(const [edge,entry,x,y] of [['left','right',4,350],['right','left',1275,350],['top','bottom',625,5],['bottom','top',625,717]]){
    const route=dragRoute(start,{x,y},viewport,extent,'right');
    assert.equal(route.accept,true);
    assert.equal(route.edge,edge);
    assert.equal(oppositeEdge(route.edge),entry);
    assert(route.progress>.55);
  }
  assert.equal(dragRoute(start,{x:700,y:350},viewport,extent,'right').accept,false);
  assert.equal(dragRoute({x:610,y:14},{x:612,y:8},viewport,extent,'right').accept,false);
});

test('handoff carries a deposited DNA position and accepts only declared content references',()=>{
  const view={species:'acipenser-oxyrinchus',variant:null,motion:'observe',edge:'top',time:0,direction:[0,1,0],view:'top'};
  const dna={part:'helix',accession:'NC_000000.1',feature:'cds-3',position:640,start:628,reverse:true};
  assert.deepEqual(readHandoff({...view,section:'dna',dna}).dna,dna);
  assert.equal(readHandoff({...view,section:'dna',dna:{...dna,position:-1}}),null);
  assert.equal(readHandoff({...view,section:'dna',dna:{...dna,part:'unknown'}}),null);
  assert.equal(readHandoff({...view,section:'photo',dna}),null);
  assert.equal(readHandoff({...view,section:'photo'}).section,'photo');
  assert.equal(readHandoff({...view,section:'anatomy',anchor:2}).anchor,2);
  assert.equal(readHandoff({...view,section:'anatomy',anchor:'[arbitrary selector]'}),null);
});

test('paired browsers exchange a specimen view and acknowledge rendering', async ()=>{
  const probe=net.createServer();
  await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
  const {port}=probe.address();
  await new Promise(resolve=>probe.close(resolve));
  const host=createBeyondHost({root:resolve('dist'),address:'127.0.0.1',port});
  await new Promise(resolve=>host.listen(port,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+port,stop=new AbortController();
  const post=(route,data,from=origin)=>fetch(origin+'/__beyond/'+route,{
    method:'POST',headers:{origin:from,'content-type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(3000)
  });
  const events=async key=>{
    const response=await fetch(origin+'/__beyond/events?key='+key,{signal:stop.signal});
    assert.equal(response.status,200);
    const reader=response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer='';
    return async ()=>{
      while (!buffer.includes('\n\n')) {
        const {done,value}=await reader.read();
        if(done)throw Error('Event stream ended before message');
        buffer+=value;
      }
      const index=buffer.indexOf('\n\n'), line=buffer.slice(0,index);
      buffer=buffer.slice(index+2);
      return JSON.parse(line.slice(6));
    };
  };
  const watchdog=setTimeout(()=>stop.abort(),5000);
  const view=readHandoff({species:'acipenser-oxyrinchus',variant:null,motion:'reverse',edge:'right',time:.42,direction:[0,1,0],view:'top'});
  try {
    assert.equal((await post('pair',{edge:'right'},'https://elsewhere.example')).status,403);
    const response=await post('pair',{edge:'right'});
    assert.equal(response.status,200);
    const {key,link,qr}=await response.json();
    const target=new URLSearchParams(new URL(link).hash.slice(1)).get('beyond');
    assert.match(qr,/^<svg /);
    assert.notEqual(key,target);
    const sourceNext=await events(key);
    assert.deepEqual(await sourceNext(),{type:'peer',connected:false,edge:'right',calibrated:false});
    assert.equal((await post('send',{key,view})).status,409);
    const targetNext=await events(target);
    assert.deepEqual(await targetNext(),{type:'peer',connected:true,edge:'left',calibrated:false});
    assert.deepEqual(await sourceNext(),{type:'peer',connected:true,edge:'right',calibrated:false});
    assert.equal((await post('send',{key,view:{...view,time:-5}})).status,400);
    const preview={progress:.5,section:'behavior',name:'Atlantic sturgeon',image:null,lane:.6};
    assert.equal((await post('preview',{key:target,edge:'bottom',preview})).status,200);
    assert.deepEqual(await sourceNext(),{type:'preview',edge:'bottom',...preview});
    assert.equal((await post('preview',{key,preview})).status,200);
    assert.deepEqual(await targetNext(),{type:'preview',edge:'right',...preview});
    assert.equal((await post('send',{key,view,preview})).status,400);
    const release={...preview,section:'model',progress:.12};
    const sent=await (await post('send',{key,view,preview:release})).json();
    assert.deepEqual(await targetNext(),{type:'specimen',sequence:sent.sequence,view,preview:release});
    assert.equal((await post('received',{key:target,sequence:sent.sequence,ready:true})).status,200);
    assert.deepEqual(await sourceNext(),{type:'received',sequence:sent.sequence,ready:true});
    const returnView={...view,edge:'top'};
    const returning=await (await post('send',{key:target,view:returnView})).json();
    assert.deepEqual(await sourceNext(),{type:'specimen',sequence:returning.sequence,view:returnView});
    assert.equal((await post('received',{key:target,sequence:returning.sequence,ready:true})).status,403);
    assert.equal((await post('received',{key,sequence:returning.sequence,ready:true})).status,200);
    assert.deepEqual(await targetNext(),{type:'received',sequence:returning.sequence,ready:true});
    assert.equal((await post('end',{key})).status,200);
    assert.equal((await post('send',{key,view})).status,404);
  } finally {
    clearTimeout(watchdog);
    stop.abort();
    host.endBeyondSessions();
    host.closeAllConnections();
    await new Promise(resolve=>host.close(resolve));
  }
});
