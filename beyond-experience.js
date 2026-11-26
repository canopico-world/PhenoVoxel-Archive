import {describeBeyondContent} from './beyond-content.js';
import {beyondSections, dragRoute, oppositeEdge, readHandoff, verticalEdge} from './beyond-protocol.mjs';
import {sideFromPhoto} from './beyond-calibration.mjs';
import {createBeyondHold} from './beyond-hold.mjs';
import './beyond-experience.css';

const endpoint = action => '/__beyond/' + action;
async function localRequest(action, data) {
  const response = await fetch(endpoint(action), {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || 'The local host did not accept the request.');
  return result;
}

export function mountBeyond({panel, viewer, receiverKey, snapshot, receive, capture, feedback, handleTargets, hitModel, captureModel}) {
  const hosted = ['www.canopico.tech','canopico.tech','canopico-world.github.io'].includes(location.hostname);
  let browserMode=hosted, transport;
  const request=(action,data)=>browserMode
    ? (transport ? transport.request(action,data) : Promise.reject(Error('Open a new pairing code.')))
    : localRequest(action,data);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'beyond-toggle';
  toggle.textContent = 'Beyond QR';
  toggle.setAttribute('aria-expanded','false');
  panel.querySelector('.viewer-top').append(toggle);
  const drawer = document.createElement('section');
  drawer.className = 'beyond-drawer';
  drawer.setAttribute('aria-label','Beyond Experience');
  drawer.hidden = true;
  drawer.innerHTML = `
    <h2>Pair a screen</h2>
    
    <p data-status role="status"></p>
    <div data-pair hidden><fieldset><legend>Where is the receiving screen?</legend>
      <label><input type="radio" name="beyond-edge" value="auto" checked> Detect with camera</label>
      <label><input type="radio" name="beyond-edge" value="left"> Left</label>
      <label><input type="radio" name="beyond-edge" value="right"> Right</label>
    </fieldset><button data-start type="button">Pair a screen</button></div>
    <div data-invite hidden><img alt="Scan to pair this screen" width="204" height="204"><p><a data-link target="_blank" rel="noopener noreferrer">Pairing link</a><button data-copy type="button" hidden>Copy pairing link</button><input data-copy-url aria-label="Pairing link" readonly hidden></p></div>
    <button data-position type="button" hidden>Change screen position</button>
    <div data-camera hidden><p>Stand where the receiving phone will sit. Point its rear camera at the PC and photograph all four markers, without cropping.</p>
      <label class="beyond-camera-label">Take calibration photo <input type="file" accept="image/*" capture="environment"></label>
      <p>The photo stays in this browser. If the view is unclear, try again or choose a side.</p>
      <button data-manual="left" type="button">Use left</button> <button data-manual="right" type="button">Use right</button></div>
    <p data-controls hidden>Drag specimens, photos, DNA views, and content boxes to any edge. Drag empty viewer space to orbit. On touchscreens, hold a text panel to lift it.</p>
    <button data-end type="button" hidden>End pairing</button>
    <div data-help hidden><button data-fallback type="button">Open this specimen on my phone</button>
      <div data-static hidden><p>Scan to open the specimen. Dragging between screens requires pairing.</p><img alt="QR code to open this specimen" width="204" height="204"></div></div>`;
  panel.append(drawer);
  const targetBoard=document.createElement('dialog');
  targetBoard.className='beyond-board';
  targetBoard.innerHTML=`<button type="button">Close calibration board</button>
    <svg viewBox="0 0 1200 680" role="img" aria-label="Four camera calibration markers">
      <rect width="1200" height="680" fill="#080a10"/>
      <circle cx="100" cy="75" r="27" fill="#00ffff"/>
      <circle cx="1100" cy="75" r="27" fill="#19ff00"/>
      <circle cx="1100" cy="605" r="27" fill="#ff04ff"/>
      <circle cx="100" cy="605" r="27" fill="#ff0000"/>
      <text x="600" y="332" fill="white" text-anchor="middle" font-family="system-ui" font-size="38">BEYOND · SCREEN CALIBRATION</text>
      <text x="600" y="389" fill="#cccccc" text-anchor="middle" font-family="system-ui" font-size="22">Photograph all four markers from the phone’s position.</text>
    </svg>`;
  targetBoard.querySelector('button').onclick=()=>targetBoard.close();
  panel.append(targetBoard);
  const incoming=document.createElement('div');
  incoming.className='beyond-incoming';
  incoming.setAttribute('aria-hidden','true');
  incoming.hidden=true;
  const incomingCard=document.createElement('div');
  incomingCard.className='beyond-card';
  incoming.append(incomingCard);
  document.body.append(incoming);

  const el = selector => drawer.querySelector(selector);
  const status = message => { el('[data-status]').textContent = message; };
  const report = message => {
    status(message);
    if (drawer.hidden) feedback(message);
  };
  const dock = document.createElement('div');
  dock.className = 'beyond-dock';
  dock.setAttribute('aria-hidden','true');
  dock.hidden = true;
  const ghost = document.createElement('div');
  ghost.className = 'beyond-ghost';
  ghost.setAttribute('aria-hidden','true');
  ghost.hidden = true;
  // Keep the drag cues inside the viewer's top layer when fullscreen is active.
  panel.append(dock,ghost);

  let key = receiverKey, stream, qrUrl, edge = null, connected = false, drag = null;
  let staged=null, flight=null, lastSend=0, previewIdentity;
  let previewTimer, transferTimer, sending=false, landing=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function drawCard(card, preview){
    const label=document.createElement('strong');
    label.textContent=beyondSections[preview.section];
    const name=document.createElement('span');
    name.textContent=preview.name;
    card.replaceChildren(label,name);
    card.classList.toggle('is-specimen',preview.section==='model'&&!!preview.image);
    if(preview.image){
      const image=document.createElement('img');
      image.alt='';
      image.src=preview.image;
      card.prepend(image);
    }
  }
  function hideIncoming(){
    clearTimeout(previewTimer);
    incomingCard.getAnimations().forEach(animation=>animation.cancel());
    incoming.hidden=true;
    incoming.classList.remove('landing');
    landing=false;
  }
  function showPreview(message){
    if(landing)return;
    if(!message.progress){hideIncoming();return;}
    clearTimeout(previewTimer);
    const identity=message.section+'|'+message.name+'|'+message.image;
    if(identity!==previewIdentity){drawCard(incomingCard,message);previewIdentity=identity;}
    const first=incoming.hidden;
    incoming.hidden=false;
    const from=oppositeEdge(message.edge);
    if(!from)return;
    incoming.dataset.from=from;
    incoming.style.setProperty('--lane',Math.min(.8,Math.max(.2,message.lane??.5))*100+'%');
    if(first){
      incoming.style.setProperty('--across',0);
      incomingCard.getBoundingClientRect();
    }
    incoming.style.setProperty('--across',message.progress);
    previewTimer=setTimeout(hideIncoming,30000);
  }
  function settlePreview(view,preview){
    clearTimeout(previewTimer);
    if(incoming.hidden){
      showPreview({section:view.section,name:'PhenoVoxel',image:null,lane:.5,
        ...preview,edge:view.edge,progress:preview?.progress??.06});
    }
    clearTimeout(previewTimer);
    landing=true;
    const start=incomingCard.getBoundingClientRect();
    const x=Math.round((innerWidth-start.width)/2-start.left);
    const y=Math.round(innerHeight*.43-start.height/2-start.top);
    const transform=getComputedStyle(incomingCard).transform;
    incoming.classList.add('landing');
    if(reduced()){
      incomingCard.style.transform='translate('+x+'px,'+y+'px) '+transform;
      return Promise.resolve();
    }
    const animation=incomingCard.animate([
      {transform},{transform:'translate('+x+'px,'+y+'px) '+transform}
    ],{duration:460,easing:'cubic-bezier(.18,.66,.28,1)',fill:'forwards'});
    return animation.finished.catch(()=>{});
  }
  function flushPreview(){
    if(!staged||flight)return;
    const next=staged;
    staged=null;
    lastSend=performance.now();
    flight=request('preview',{key,edge:next.edge,preview:next.preview}).catch(()=>{}).finally(()=>{
      flight=null;
      if(staged&&drag)queuePreview(staged.edge,staged.preview);
    });
  }
  function queuePreview(edge,preview){
    staged={edge,preview};
    if(flight)return;
    clearTimeout(transferTimer);
    const delay=Math.max(0,32-(performance.now()-lastSend));
    transferTimer=setTimeout(flushPreview,delay);
  }

  let busy = false, hasPeer = false, receiveQueue = Promise.resolve();

  function releaseDrag(){
    if(drag){
      const {target,id,keepCapture,surface}=drag;
      drag=null;
      surface?.classList.remove('beyond-lifted','beyond-model-grabbed');
      // OrbitControls receives the real pointer-up on its canvas and releases its own capture.
      if(!keepCapture&&target.hasPointerCapture(id))target.releasePointerCapture(id);
    }
    dock.hidden=true;
  }
  function cancelDrag(){
    const wasDragging=!!drag;
    hold.cancel();
    pointerCandidate=null;
    releaseDrag();
    clearTimeout(transferTimer);
    staged=null;
    ghost.hidden=true;
    if(wasDragging&&key)void Promise.resolve(flight).then(()=>request('preview',{key,preview:{progress:0}})).catch(()=>{});
  }
  function ensureHandles(){
    for(const {section,host,surface} of handleTargets()){
      if(!host)continue;
      if(surface){
        if(connected)surface.dataset.beyondSurface=section;
        else delete surface.dataset.beyondSurface;
      }
      let grip=host.querySelector(':scope > .beyond-grip');
      if(!grip){
        grip=document.createElement('button');
        grip.type='button';
        grip.className='beyond-grip';
        grip.innerHTML='<span class="beyond-dots" aria-hidden="true"></span>';
        if(host.matches('.viewer-top,.specimen-heading,.index-heading'))host.append(grip);
        else host.prepend(grip);
      }
      grip.dataset.beyondGrip=section;
      grip.hidden=!connected;
      const label='Drag or send '+beyondSections[section];
      grip.setAttribute('aria-label',label);
      grip.title='Drag '+beyondSections[section]+' or press Enter';
      grip.onclick=event=>{if(event.detail===0)void send(snapshot(edge,section));};
    }
  }
  let handleRefresh=0;
  const observer=new MutationObserver(()=>{
    if(!connected||handleRefresh)return;
    handleRefresh=requestAnimationFrame(()=>{handleRefresh=0;ensureHandles();});
  });
  observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
  function minimize(){
    if(drawer.contains(document.activeElement))toggle.focus({preventScroll:true});
    drawer.hidden=true;
    toggle.setAttribute('aria-expanded','false');
  }
  function setConnected(value, newEdge=edge, calibrated=false) {
    const wasConnected=connected;
    edge=newEdge;
    connected = value && !!edge;
    document.body.classList.toggle('beyond-paired',connected);
    const help=panel.querySelector('.viewer-help .pointer-help');
    if(help)help.textContent=connected?'Grab model to transfer · Drag empty space to orbit':'Drag to orbit · Scroll to zoom';
    const touchHelp=panel.querySelector('.viewer-help .touch-help');
    if(touchHelp)touchHelp.textContent=connected?'Grab model · Drag empty space to rotate':'Drag to rotate · Pinch to zoom';
    el('[data-controls]').hidden = !connected;
    el('[data-invite]').hidden = value || !!receiverKey || (!browserMode && hasPeer);
    if(browserMode)el('[data-position]').hidden = !receiverKey || !connected;
    if (value) hasPeer = true;
    else cancelDrag();
    ensureHandles();
    if(receiverKey)el('[data-camera]').hidden=!value||!!edge;
    if(value&&!edge){
      status(receiverKey?'Take a calibration photo of the PC.':'Take the calibration photo on the phone.');
      if(!receiverKey&&!targetBoard.open)targetBoard.showModal();
    }else if(value){
      if(targetBoard.open)targetBoard.close();
      const message=receiverKey?'PC paired. Drag to any edge.':(calibrated?'Camera detected the phone on the ':'Screen paired on the ')+edge+'.';
      if(!wasConnected)minimize();
      if(!wasConnected)report(message);
      else status(message);
    }else status(browserMode?'Scan this code with your phone camera. Keep both screens open.':hasPeer?'Waiting for the paired screen to return.':'Scan the QR code with the second device.');
  }
  function onMessage(message) {
      if (message.type === 'peer') setConnected(message.connected,message.edge,message.calibrated);
      if (message.type === 'received') {
        sending=false;
        clearTimeout(ackTimer);
        report(message.ready ? 'View opened on the paired screen.' : 'The paired screen could not display this view.');
      }
      if (message.type === 'preview') showPreview(message);
      if (message.type === 'specimen') {
        if(drag||hold.pending)cancelDrag();
        const view = readHandoff(message.view);
        if (!view) return;
        receiveQueue = receiveQueue.then(async () => {
          const travel=settlePreview(view,message.preview);
          status('Opening view…');
          if (drawer.contains(document.activeElement)) toggle.focus({preventScroll:true});
          drawer.hidden = true;
          toggle.setAttribute('aria-expanded','false');
          let ready = false;
          try {
            const opening=receive(view);
            if(view.section==='photo'){
              const dialog=panel.ownerDocument.querySelector('#dialog[open]');
              if(dialog)dialog.append(incoming);
            }
            [ready]=await Promise.all([opening,travel]);
          } catch {ready=false;}
          finally {
            if(!reduced()&&!incoming.hidden){
              const fade=incoming.animate([{opacity:1},{opacity:0}],{duration:170,easing:'ease-out'});
              await fade.finished.catch(()=>{});
            }
            hideIncoming();
            incomingCard.style.transform='';
            document.body.append(incoming);
            await request('received',{key,sequence:message.sequence,ready}).catch(()=>{});
            status(ready ? 'View received.' : 'This view could not be displayed. Try sending it again.');
            if (!ready) {drawer.hidden = false;toggle.setAttribute('aria-expanded','true');}
          }
        }).catch(()=>status('Could not open the incoming view.'));
      }
  }
  function listen() {
    stream?.close();
    stream = new EventSource(endpoint('events') + '?key=' + encodeURIComponent(key));
    stream.onmessage = event => onMessage(JSON.parse(event.data));
    stream.onerror = () => {
      setConnected(false);
      hideIncoming();
      if (stream.readyState === EventSource.CLOSED) status('Pairing closed or expired. Start a new pairing.');
      else status('Connection interrupted. Keep both browsers open.');
    };
  }
  function resetPair(reason){
    stream?.close();stream=null;
    transport?.close();transport=null;
    if(qrUrl)URL.revokeObjectURL(qrUrl);
    qrUrl=null;key=null;receiverKey=null;hasPeer=false;
    setConnected(false,null);
    if(targetBoard.open)targetBoard.close();
    hideIncoming();sending=false;clearTimeout(ackTimer);
    for(const name of ['end','invite','position','camera','help','static'])el('[data-'+name+']').hidden=true;
    el('[data-link]').removeAttribute('href');el('[data-invite] img').removeAttribute('src');
    el('[data-pair]').hidden=false;
    el('fieldset').hidden=browserMode;
    el('[data-start]').textContent=browserMode?'Show new QR code':'Pair a screen';
    status(reason);
  }
  async function openPublic(invite){
    const {openBrowserPair}=await import('./beyond-browser.js');
    return openBrowserPair({invite,species:document.body.dataset.species,message:onMessage,ended:resetPair});
  }
  el('[data-fallback]').onclick=async()=>{
    const {makeQR}=await import('./beyond-browser.js');
    const link=new URL(location.pathname,location.origin);link.hash=document.body.dataset.species;
    el('[data-static] img').src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(await makeQR(link.href));
    el('[data-static]').hidden=false;
  };
  el('[data-copy]').onclick=async()=>{
    const url=el('[data-link]').href;
    try{await navigator.clipboard.writeText(url);status('Pairing link copied. Open it on your other screen.');}
    catch{const input=el('[data-copy-url]');input.value=url;input.hidden=false;input.focus();input.select();}
  };
  el('[data-position]').onclick=()=>confirmSide(null,false);
  async function start() {
    if (busy || key) return;
    busy = true;
    el('[data-start]').disabled = true;
    el('[data-help]').hidden=el('[data-static]').hidden=true;
    edge = browserMode?'right':el('input:checked').value;
    if(edge==='auto')edge=null;
    try {
      status('Preparing your QR code…');
      const pair = browserMode ? (transport=await openPublic(null)) : await request('pair',{edge});
      key = browserMode?'browser':pair.key;
      el('[data-link]').href = pair.link;
      el('[data-link]').hidden=browserMode;el('[data-copy]').hidden=!browserMode;el('[data-copy-url]').hidden=true;
      qrUrl = URL.createObjectURL(new Blob([pair.qr],{type:'image/svg+xml'}));
      el('img').src = qrUrl;
      el('[data-pair]').hidden = true;
      el('[data-invite]').hidden = false;
      el('[data-end]').hidden = false;
      if(browserMode)status('Scan this code with your phone camera. Keep both screens open.');
      else listen();
    } catch (error) { resetPair(error.message);el('[data-help]').hidden=false; }
    finally { busy = false; el('[data-start]').disabled = false; }
  }
  let ackTimer;
  async function send(view,preview) {
    const valid = readHandoff(view);
    if (!connected) return report('Pair a screen first.');
    if (!valid) return report('Wait until the view has loaded.');
    if (sending) return report('The previous view is still opening.');
    sending=true;
    report('Sending the view…');
    try {
      await flight;
      await request('send',{key,view:valid,preview});
      if(sending)ackTimer=setTimeout(()=>{sending=false;report('The receiving screen has not confirmed the view yet.');},30000);
    } catch (error) {sending=false;report(error.message);}
  }
  const edgeLabel={left:'←',right:'→',top:'↑',bottom:'↓'};
  function routeAt(event){
    return dragRoute(drag.start,{x:event.clientX,y:event.clientY},{width:innerWidth,height:innerHeight},
      {width:ghost.offsetWidth,height:ghost.offsetHeight},edge);
  }
  function move(event) {
    ghost.style.left = event.clientX + 'px';
    ghost.style.top = event.clientY + 'px';
    const route=routeAt(event);
    dock.dataset.edge=ghost.dataset.edge=route.edge;
    dock.textContent=edgeLabel[route.edge];
    dock.classList.toggle('hot',route.accept);
    if(route.progress || drag.previewing) queuePreview(route.edge,{...drag.preview,progress:route.progress,lane:route.lane});
    drag.previewing=route.progress>0;
  }

  toggle.onclick = async () => {
    drawer.hidden = !drawer.hidden;
    toggle.setAttribute('aria-expanded',String(!drawer.hidden));
    if (drawer.hidden || key) return;
    await chooseTransport();
    if(!browserMode){
      el('[data-pair]').hidden=false;
      status('Pair a second screen on your Wi-Fi.');
    }else await start();
  };
  async function chooseTransport(){
    if(hosted)return;
    try{
      const r=await fetch(endpoint('info'),{cache:'no-store'});
      browserMode=!r.ok||(await r.json()).beyond!==1;
    }catch{browserMode=true;}
    el('fieldset').hidden=browserMode;
  }
  el('[data-start]').onclick = start;
  async function confirmSide(side,calibrated){
    try{
      await request('side',{key,edge:side,calibrated});
      if(side===null)return;
      el('[data-camera]').hidden=true;
      report((calibrated?'Camera detected ':'Paired on ')+side+'. Drag to any edge.');
    }catch(error){status(error.message);}
  }
  el('input[type=file]').onchange=async event=>{
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file)return;
    status('Reading the calibration markers…');
    try{
      const result=await sideFromPhoto(file);
      if(result)await confirmSide(result.edge,true);
      else status('The side was unclear. Retake the photo from farther left or right with all four markers visible.');
    }catch{status('This photo could not be opened. Try taking a new one.');}
  };
  for(const button of drawer.querySelectorAll('[data-manual]'))button.onclick=()=>confirmSide(button.dataset.manual,false);
  el('[data-end]').onclick = async () => {
    if (busy) return;
    busy = true;
    try { await request('end',{key}); }
    catch { /* The host may have already expired this session. */ }
    finally {
      busy=false;resetPair('Pairing ended.');
    }
  };

  let suppressedPointer=null, suppressClick=null, pointerCandidate=null;
  const hold=createBeyondHold(contact=>{
    if(!connected||sending||drag||!contact.surface.isConnected||!contact.target.isConnected)return;
    pointerCandidate=null;
    lift(contact);
  });
  function lift({id,x,y,target,surface,section,fromHold=false,kind, direct=false,content}) {
    const view=snapshot(edge,section,content);
    if(!view)return report('Wait until the view has loaded.');
    const keepCapture=fromHold&&section==='model'&&target.tagName==='CANVAS'&&target.hasPointerCapture(id);
    try{
      if(!keepCapture)target.setPointerCapture(id);
    }catch{return;}
    if(fromHold||content){
      suppressedPointer=id;
      suppressClick=target;
      surface?.classList.add('beyond-lifted');
    }
    const name=(content?.visual?.alt||content?.target?.querySelector?.('h3')?.textContent||
      panel.ownerDocument.querySelector('h1')?.textContent||'PhenoVoxel').slice(0,100);
    const preview={section,name,image:null};
    const layer=target.closest('dialog[open]')||document.body;
    layer.append(dock,ghost);
    if(['model','workspace'].includes(section)){
      try{
        if(section==='model'){
          const cutout=captureModel();
          if(cutout){
            const image=cutout.toDataURL('image/webp',.68);
            if(image.length<=24000)preview.image=image;
            // Keep alpha on browsers that encode PNG instead of WebP.
            if(!preview.image){
              const small=document.createElement('canvas');
              small.width=Math.max(1,Math.round(cutout.width*.64));
              small.height=Math.max(1,Math.round(cutout.height*.64));
              small.getContext('2d')?.drawImage(cutout,0,0,small.width,small.height);
              const compact=small.toDataURL('image/webp',.56);
              if(compact.length<=24000)preview.image=compact;
            }
          }
        }else{
          const source=capture();
          if(source?.width&&source.height){
            const canvas=document.createElement('canvas');
            canvas.width=192;
            canvas.height=Math.min(152,Math.round(192*source.height/source.width));
            canvas.getContext('2d')?.drawImage(source,0,0,canvas.width,canvas.height);
            const image=canvas.toDataURL('image/jpeg',.72);
            if(image.length<=24000)preview.image=image;
          }
        }
      }catch{ /* A model name is still available if the canvas cannot be copied. */ }
    }
    if(content?.visual&&!preview.image&&section!=='model'){
      const visual=content.visual;
      try{
        const width=visual.naturalWidth||visual.width,height=visual.naturalHeight||visual.height;
        if(width>0&&height>0){
          const scale=Math.min(1,176/Math.max(width,height));
          const tile=document.createElement('canvas');
          tile.width=Math.max(1,Math.round(width*scale));
          tile.height=Math.max(1,Math.round(height*scale));
          const ctx=tile.getContext('2d');
          ctx.fillStyle='#102328';ctx.fillRect(0,0,tile.width,tile.height);
          ctx.drawImage(visual,0,0,tile.width,tile.height);
          const image=tile.toDataURL('image/jpeg',.72);
          if(image.length<=24000)preview.image=image;
        }
      }catch{ /* The destination can open a credited external image from the archive record. */ }
    }
    if(direct)surface?.classList.add('beyond-model-grabbed');
    drag={id,start:{x,y},view,preview,target,surface,keepCapture,kind,previewing:false};
    drawCard(ghost,preview);
    ghost.dataset.edge=edge;
    dock.hidden=ghost.hidden=false;
    move({clientX:x,clientY:y});
  }
  document.addEventListener('pointerdown',event=>{
    suppressClick=null;
    if(!event.isPrimary){
      if(drag)event.stopImmediatePropagation();
      else {hold.cancel();pointerCandidate=null;}
      return;
    }
    if(!connected||sending||drag||event.button!==0||!(event.target instanceof Element))return;
    const {pointerId:id,clientX:x,clientY:y,pointerType:kind}=event;
    const grip=event.target.closest('[data-beyond-grip]');
    if(grip){
      event.preventDefault();
      event.stopImmediatePropagation();
      lift({id,x,y,kind,target:grip,section:grip.dataset.beyondGrip});
      return;
    }
    const content=describeBeyondContent(event.target);
    if(!content)return;
    const surface=content.surface||event.target.closest('[data-beyond-surface]')||event.target;
    const control=event.target.closest('button,a,input,select,textarea,[contenteditable],[role="slider"]');
    if(control&&!(content.contentTile||content.visual||content.section==='photo'))return;
    if(surface===viewer&&event.target.tagName==='CANVAS'&&!event.shiftKey&&hitModel(x,y)){
      event.preventDefault();
      event.stopImmediatePropagation();
      lift({id,x,y,kind,target:event.target,surface,section:'model',direct:true});
      return;
    }
    if(surface===viewer||event.altKey||event.shiftKey)return;
    const contact={id,x,y,kind,target:event.target,surface,section:content.section,content,fromHold:true};
    if(kind!=='touch'||content.visual||content.directTouch)pointerCandidate=contact;
    if(!control||content.contentTile||content.visual)hold.start(contact);
  },true);
  document.addEventListener('pointermove',event=>{
    hold.move({id:event.pointerId,x:event.clientX,y:event.clientY});
    const candidate=pointerCandidate;
    if(candidate?.id===event.pointerId&&Math.hypot(event.clientX-candidate.x,event.clientY-candidate.y)>=8){
      pointerCandidate=null;
      hold.cancel(candidate.id);
      if(candidate.target.isConnected){
        const selection=window.getSelection();
        if(selection&&!selection.isCollapsed)selection.removeAllRanges();
        lift(candidate);
      }
    }
    if(drag?.id===event.pointerId)move(event);
    if(suppressedPointer===event.pointerId){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);
  document.addEventListener('pointerup',event=>{
    hold.cancel(event.pointerId);
    if(pointerCandidate?.id===event.pointerId)pointerCandidate=null;
    if(suppressedPointer===event.pointerId){
      event.preventDefault();
      suppressedPointer=null;
    }
    if(drag?.id!==event.pointerId)return;
    const route=routeAt(event);
    if(route.accept){
      const {view,preview}=drag;
      const vertical=verticalEdge(route.edge);
      const extent=vertical?(ghost.offsetHeight||160):(ghost.offsetWidth||220);
      const cross=route.progress,lane=route.lane;
      clearTimeout(transferTimer);
      staged=null;
      releaseDrag();
      const direction=route.edge==='right'||route.edge==='bottom'?1:-1;
      const transform=getComputedStyle(ghost).transform;
      if(reduced())ghost.hidden=true;
      else{
        const coast=ghost.animate([
          {transform},
          {transform:'translate'+(vertical?'Y':'X')+'('+direction*extent+'px) '+transform}
        ],{duration:310,easing:'cubic-bezier(.22,.6,.42,1)'});
        coast.finished.catch(()=>{}).finally(()=>{if(!drag)ghost.hidden=true;});
      }
      void send({...view,edge:route.edge},{...preview,progress:Math.max(.02,cross),lane});
    }else cancelDrag();
  },true);
  document.addEventListener('lostpointercapture',event=>{
    hold.cancel(event.pointerId);
    if(pointerCandidate?.id===event.pointerId)pointerCandidate=null;
    if(drag?.id===event.pointerId)cancelDrag();
  },true);
  document.addEventListener('pointercancel',event=>{
    if(pointerCandidate?.id===event.pointerId)pointerCandidate=null;
    hold.cancel(event.pointerId);
    if(suppressedPointer===event.pointerId)suppressedPointer=null;
    if(drag?.id===event.pointerId)cancelDrag();
  },true);
  document.addEventListener('click',event=>{
    if(!suppressClick||event.detail===0||!(event.target instanceof Element))return;
    if(event.target===suppressClick||event.target.contains(suppressClick)||suppressClick.contains(event.target)){
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick=null;
    }
  },true);
  document.addEventListener('contextmenu',event=>{
    const press=hold.pending;
    if((press?.kind==='touch'&&press.surface.contains(event.target))||(drag?.kind==='touch'&&drag.surface?.contains(event.target)))event.preventDefault();
  },true);
  document.addEventListener('dragstart',event=>{
    if((pointerCandidate||drag)&&event.target instanceof Element&&describeBeyondContent(event.target))event.preventDefault();
  },true);
  document.addEventListener('selectstart',event=>{
    if(hold.pending?.kind==='touch'||drag?.kind==='touch')event.preventDefault();
  },true);
  document.addEventListener('touchmove',event=>{if(drag?.kind==='touch'&&event.cancelable)event.preventDefault();},{capture:true,passive:false});
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&(hold.pending||drag))cancelDrag();});
  window.addEventListener('pagehide',()=>{hold.cancel();observer.disconnect();stream?.close();transport?.close();},{once:true});
  if (receiverKey) {
    drawer.hidden = false;
    toggle.setAttribute('aria-expanded','true');
    status('Connecting to the sending screen…');
    void (async()=>{
      await chooseTransport();
      if(!browserMode){listen();return;}
      try{
        transport=await openPublic(receiverKey);
        el('[data-end]').hidden=false;
      }catch(error){resetPair(error.message);el('[data-help]').hidden=false;}
    })();
  }else if(new URLSearchParams(location.search).get('pair')==='1'){
    toggle.scrollIntoView({block:'center'});toggle.click();
  }
}

