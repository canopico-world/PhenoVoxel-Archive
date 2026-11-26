import Peer from 'peerjs';
import QRCode from 'qrcode';
import {edges, oppositeEdge, readHandoff, readPreview} from './beyond-protocol.mjs';

const invitationLife = 30 * 60 * 1000;
const sameWifi = 'Keep both screens open on the same Wi-Fi, then try again.';

async function peerAddress(secret) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return 'pv-' + Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2,'0')).join('');
}

export const makeQR = link => QRCode.toString(link, {type:'svg', margin:4, errorCorrectionLevel:'M'});

export async function openBrowserPair({invite, species, message, ended}) {
  const joining = Boolean(invite);
  const secret = invite || Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2,'0')).join('');
  const address = await peerAddress(secret);
  const peer = new Peer(joining ? undefined : address, {secure:true});
  let confirmEnd, channel, ready=false, closed=false, side='right', calibrated=false;
  let sequence=0, awaiting=0, incoming=0, expiry, deadline;
  function close() {
    if (closed) return;
    closed=true;
    clearTimeout(expiry);clearTimeout(deadline);
    peer.destroy();
  }
  function finish(reason) {if (!closed) {close();ended(reason);}}
  function touch() {
    clearTimeout(expiry);
    expiry=setTimeout(()=>finish('Pairing expired. Scan a new QR code.'),invitationLife);
  }
  function transmit(data) {
    if (!channel?.open) throw Error('The other screen has disconnected. '+sameWifi);
    channel.send(JSON.stringify(data));
  }
  function announce() {
    message({type:'peer',connected:true,edge:joining?oppositeEdge(side):side,calibrated});
  }
  function handle(conn) {
    let authenticated=false;
    const timeout=setTimeout(()=>conn.close(),20000);
    conn.on('open',()=>{if(joining)conn.send(JSON.stringify({type:'join',secret}));});
    conn.on('data',raw=>{
      if(closed || typeof raw!=='string' || raw.length>28000)return;
      let data;
      try {data=JSON.parse(raw);} catch {return;}
      if(!data||typeof data!=='object')return;
      if(!authenticated){
        if(joining ? data.type!=='welcome'||![null,'left','right'].includes(data.side)
                   : data.type!=='join'||data.secret!==secret||channel?.open){conn.close();return;}
        authenticated=true;channel=conn;ready=true;
        clearTimeout(timeout);clearTimeout(deadline);
        if(joining){side=data.side;calibrated=data.calibrated===true;}
        else transmit({type:'welcome',side,calibrated});
        touch();announce();return;
      }
      if(channel!==conn)return;
      if(data.type==='ended'){confirmEnd?.();return;}
      if(data.type==='end'){transmit({type:'ended'});finish('Pairing ended on the other screen.');return;}
      if(data.type==='side' && !joining && [null,'left','right'].includes(data.side)){
        side=data.side;calibrated=data.calibrated===true;
        transmit({type:'position',side,calibrated});announce();
      }else if(data.type==='position' && joining && [null,'left','right'].includes(data.side)){
        side=data.side;calibrated=data.calibrated===true;announce();
      }else if(data.type==='preview' && edges.includes(data.edge)){
        const preview=readPreview(data);if(preview)message({type:'preview',edge:data.edge,...preview});
      }else if(data.type==='specimen' && Number.isSafeInteger(data.sequence)&&data.sequence>incoming){
        const view=readHandoff(data.view),preview=data.preview==null?null:readPreview(data.preview);
        if(!view||(data.preview!=null&&(!preview?.progress||preview.section!==view.section)))return;
        incoming=data.sequence;touch();
        message({type:'specimen',sequence:incoming,view,preview});
      }else if(data.type==='received'&&awaiting&&data.sequence===awaiting){
        awaiting=0;message({type:'received',sequence:data.sequence,ready:data.ready===true});
      }
    });
    const gone=()=>{
      clearTimeout(timeout);
      if(closed||conn!==channel)return;
      channel=null;ready=false;incoming=awaiting=0;
      if(joining)finish('Connection lost. Scan the QR code on the first screen again.');
      else message({type:'peer',connected:false,edge:side});
    };
    conn.on('close',gone);conn.on('error',gone);
  }
  try {
    await new Promise((resolve,reject)=>{
      deadline=setTimeout(()=>reject(Error('Pairing service could not be reached. '+sameWifi)),15000);
      peer.once('error',reject);
      peer.on('connection',conn=>{if(joining||closed||ready)conn.close();else handle(conn);});
      peer.once('open',()=>{peer.off('error',reject);clearTimeout(deadline);resolve();});
    });
    peer.on('error',error=>{
      if(!ready)finish(error.type==='peer-unavailable'?'This QR code has expired. Open Beyond on the first screen for a new one.':'Could not connect the screens. '+sameWifi);
    });
    peer.on('disconnected',()=>{if(!closed&&!peer.destroyed)try{peer.reconnect();}catch{if(!ready)finish('Connection lost. Open Beyond again.');}});
    touch();
    if(joining) {
      deadline=setTimeout(()=>finish('The first screen did not answer. '+sameWifi),22000);
      handle(peer.connect(address,{reliable:true,serialization:'raw'}));
    }
    const link=new URL(location.pathname,location.origin);link.hash='beyond='+secret+'&specimen='+encodeURIComponent(species);
    return {link:link.href,qr:joining?null:await makeQR(link.href),close,
      async request(action,data) {
        if(action==='end'){
          if(ready)await new Promise(resolve=>{
            const timer=setTimeout(resolve,450);
            confirmEnd=()=>{clearTimeout(timer);resolve();};
            transmit({type:'end'});
          });
          close();return {};
        }
        if(!ready)throw Error('Scan the QR code to connect both screens.');
        if(action==='side'){transmit({type:'side',side:data.edge,calibrated:data.calibrated});}
        if(action==='preview'&&channel.dataChannel.bufferedAmount<65536){
          transmit({type:'preview',edge:data.edge??(joining?oppositeEdge(side):side),...data.preview});
        }
        if(action==='send'){awaiting=++sequence;transmit({type:'specimen',sequence,view:data.view,preview:data.preview});touch();return {sequence};}
        if(action==='received')transmit({type:'received',sequence:data.sequence,ready:data.ready});
        return {};
      }
    };
  } catch(error) {
    close();throw Error(error.type==='unavailable-id'?'Could not create that invitation. Try again.':'Could not reach the pairing service. '+sameWifi);
  }
}

