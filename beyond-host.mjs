import {createServer} from 'node:http';
import {createReadStream, existsSync, statSync} from 'node:fs';
import {networkInterfaces} from 'node:os';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import QRCode from 'qrcode';
import {edges, oppositeEdge, readHandoff, readPreview} from './beyond-protocol.mjs';

const prefix = '/__beyond/';
const token = () => randomBytes(24).toString('base64url');
const validToken = s => typeof s === 'string' && /^[A-Za-z0-9_-]{32}$/.test(s);
const ttl = 30 * 60 * 1000;
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.glb':'model/gltf-binary',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.svg':'image/svg+xml', '.csv':'text/csv', '.woff2':'font/woff2', '.txt':'text/plain'
};

async function readJson(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 28000) throw Error('Request too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createBeyondHost({root, address, port}) {
  const sessions = new Set();
  const roles = new Map();
  const allowedHosts = new Set([address, 'localhost', '127.0.0.1'].map(x => x + ':' + port));
  const send = (res, code, data) => res.writeHead(code, {'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(data));
  const emit = (peer, message) => {
    if (!peer || peer.destroyed) return false;
    if (peer.writableLength > 65536) { peer.destroy(); return false; }
    peer.write('data: ' + JSON.stringify(message) + '\n\n');
    return true;
  };
  function closeSession(session) {
    roles.delete(session.sender);
    roles.delete(session.receiver);
    sessions.delete(session);
    session.source?.end();
    session.target?.end();
  }
  function updatePeers(session){
    emit(session.source,{type:'peer',connected:!!session.target,edge:session.edge,calibrated:session.calibrated});
    emit(session.target,{type:'peer',connected:!!session.source,edge:oppositeEdge(session.edge),calibrated:session.calibrated});
  }
  const cleanup = setInterval(() => {
    for (const session of sessions) {
      if (Date.now() > session.expires) closeSession(session);
      else {
        emit(session.source,{type:'heartbeat'});
        emit(session.target,{type:'heartbeat'});
      }
    }
  }, 15000).unref();

  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    if (!allowedHosts.has(req.headers.host)) return send(res,403,{error:'Open the address shown by Beyond.'});
    const origin = 'http://' + req.headers.host;
    try {
      const url = new URL(req.url, origin);
      if (url.origin !== origin) return send(res,400,{error:'Invalid request'});
      if (!url.pathname.startsWith(prefix)) {
        if (!['GET','HEAD'].includes(req.method)) return send(res,405,{error:'Method unavailable'});
        const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
        if (!path.startsWith(root + sep) || !existsSync(path) || !statSync(path).isFile()) return send(res,404,{error:'File not found'});
        res.writeHead(200,{'Content-Type':mime[extname(path)] || 'application/octet-stream','Content-Length':statSync(path).size,'Cache-Control':'no-cache'});
        if (req.method === 'HEAD') return res.end();
        const stream = createReadStream(path);
        stream.on('error', () => res.destroy());
        res.on('close',()=>stream.destroy());
        stream.pipe(res);
        return;
      }

      const action = url.pathname.slice(prefix.length);
      if (action === 'info' && req.method === 'GET') return send(res,200,{beyond:1});
      if (action === 'events' && req.method === 'GET') {
        const key = url.searchParams.get('key');
        const session = validToken(key) && roles.get(key);
        if (!session || Date.now() > session.expires) return send(res,404,{error:'Pairing expired'});
        const field = key === session.sender ? 'source' : 'target';
        session[field]?.end();
        session[field] = res;
        res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Accel-Buffering':'no'});
        res.flushHeaders();
        updatePeers(session);
        res.on('close', () => {
          if (session[field] !== res) return;
          session[field] = null;
          const other=field==='target'?session.source:session.target;
          emit(other,{type:'preview',progress:0});
          updatePeers(session);
        });
        return;
      }
      if (req.method !== 'POST' || req.headers.origin !== origin || req.headers['content-type'] !== 'application/json') {
        return send(res,403,{error:'Use the Beyond controls in this archive.'});
      }
      const body = await readJson(req);
      if (action === 'pair') {
        if (![null,'left','right'].includes(body.edge)) return send(res,400,{error:'Choose the receiving side'});
        if (sessions.size >= 16) return send(res,429,{error:'Pairing limit reached. End a pairing and retry.'});
        const session = {sender:token(),receiver:token(),edge:body.edge,expires:Date.now()+ttl,sequence:0,pending:{},calibrated:false};
        const link = 'http://' + address + ':' + port + '/#beyond=' + session.receiver;
        const qr = await QRCode.toString(link,{type:'svg',margin:2,errorCorrectionLevel:'M'});
        if (sessions.size >= 16) return send(res,429,{error:'Pairing limit reached'});
        sessions.add(session);
        roles.set(session.sender,session);
        roles.set(session.receiver,session);
        return send(res,200,{key:session.sender, link, qr});
      }

      const session = validToken(body.key) && roles.get(body.key);
      if (!session || Date.now() > session.expires) return send(res,404,{error:'Pairing expired. Start a new pairing.'});
      const isSource=body.key===session.sender;
      const peer=isSource?session.target:session.source;
      const role=isSource?'source':'target';
      const peerRole=isSource?'target':'source';
      if (action === 'end' && body.key === session.sender) {
        closeSession(session);
        return send(res,200,{ok:true});
      }
      if (action === 'side' && !isSource && ['left','right'].includes(body.edge)) {
        session.edge=body.edge;
        session.calibrated=body.calibrated===true;
        updatePeers(session);
        return send(res,200,{ok:true});
      }
      if (action === 'preview' && session.edge) {
        const preview=readPreview(body.preview);
        const exit=body.edge??(isSource?session.edge:oppositeEdge(session.edge));
        if(!preview||!edges.includes(exit))return send(res,400,{error:'Invalid drag preview'});
        if(!emit(peer,{type:'preview',edge:exit,...preview}))return send(res,409,{error:'Receiving screen is away'});
        return send(res,200,{ok:true});
      }
      if (action === 'send' && session.edge) {
        const view = readHandoff(body.view);
        if (!view) return send(res,400,{error:'Invalid specimen view'});
        const preview = body.preview==null?null:readPreview(body.preview);
        if(body.preview!=null&&(!preview?.progress||preview.section!==view.section))return send(res,400,{error:'Invalid release preview'});
        const sequence = ++session.sequence;
        if (!emit(peer,{type:'specimen',sequence,view,...(preview?{preview}:{})})) return send(res,409,{error:'Open Beyond on the paired screen first.'});
        session.pending[role]=sequence;
        session.expires = Date.now() + ttl;
        return send(res,200,{sequence});
      }
      if (action === 'received' && Number.isSafeInteger(body.sequence) && body.sequence===session.pending[peerRole]) {
        delete session.pending[peerRole];
        emit(peer,{type:'received',sequence:body.sequence,ready:body.ready === true});
        return send(res,200,{ok:true});
      }
      return send(res,403,{error:'Action unavailable for this pairing'});
    } catch {
      if (!res.headersSent) send(res,400,{error:'Could not read this request'});
      else res.destroy();
    }
  });
  server.on('close',()=>clearInterval(cleanup));
  server.endBeyondSessions = () => { for (const session of sessions) closeSession(session); };
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = fileURLToPath(new URL('./dist',import.meta.url));
  const privateIP = ip => /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(ip);
  const local = Object.values(networkInterfaces()).flat().filter(x=>x?.family === 'IPv4' && !x.internal).map(x=>x.address);
  const address = process.argv[2] || local.find(privateIP) || '127.0.0.1';
  const port = Number(process.env.PHENOVOXEL_BEYOND_PORT ?? 4260);
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || ![...local,'127.0.0.1'].includes(address)) {
    throw Error('Choose an IPv4 address assigned to this computer and a port from 1024 to 65535.');
  }
  if (!existsSync(resolve(root,'index.html'))) throw Error('Run npm run build first.');
  const server = createBeyondHost({root,address,port});
  server.listen(port,address === '127.0.0.1' ? '127.0.0.1' : '0.0.0.0',()=>{
    console.log('Beyond Experience — open http://' + address + ':' + port + ' then scan the pairing QR on the other screen.');
  });
}

