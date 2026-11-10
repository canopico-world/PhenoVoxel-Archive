import {readDeliveredModel} from './model-delivery.js';

// Split transport files keep the original GLB data intact after decompression.
export async function readPackedModel(parts, decodedSha256, options={}) {
 const buffers=await Promise.all(parts.map(p=>readDeliveredModel(p.url,p,options)));
 if(typeof DecompressionStream==='undefined')throw Error('This specimen needs a browser with gzip decompression support. Please update your browser.');
 const bytes=await new Response(new Blob(buffers).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 const subtle=options.subtle||globalThis.crypto?.subtle;
 if(!subtle)throw Error('A secure connection is required to verify this specimen.');
 const digest=await subtle.digest('SHA-256',bytes);
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==decodedSha256)throw Error('The decoded specimen failed its integrity check.');
 return bytes;
}
