import metadata from './jaguar-rest-cache-v06102.json';
import cacheUrl from './jaguar-rest-cache-v06102.bin?url';
import {prepareJaguarRest} from './jaguar-rest-v06102.js';
let cached;
export async function loadJaguarRest(model){
 if(!cached)cached=fetch(cacheUrl).then(async response=>{if(!response.ok)throw Error('Rest correction could not be loaded');const buffer=await response.arrayBuffer();if(buffer.byteLength!==metadata.bytes)throw Error('Rest correction size mismatch');const digest=await crypto.subtle.digest('SHA-256',buffer),sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');if(sha!==metadata.cacheSha256)throw Error('Rest correction fingerprint mismatch');return buffer;}).catch(error=>{cached=null;throw error;});
 model.jaguarRest=prepareJaguarRest(model,metadata,await cached);
}
