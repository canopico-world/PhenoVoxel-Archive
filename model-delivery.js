// Read immutable model bytes without changing the source mesh, maps or rig.
export async function readDeliveredModel(url, expected, {fetchImpl=fetch, subtle=globalThis.crypto?.subtle}={}) {
  const response=await fetchImpl(url);
  if(!response.ok)throw new Error(`Model download failed (${response.status}). Please try again.`);
  const bytes=await response.arrayBuffer();
  if(expected){
    if(bytes.byteLength!==expected.bytes)throw new Error('Model download was incomplete. Please try again.');
    if(!subtle)throw new Error('A secure browser connection is required to verify this model.');
    const digest=await subtle.digest('SHA-256',bytes);
    const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    if(actual!==expected.sha256)throw new Error('Model verification failed. The downloaded file was not displayed.');
  }
  return bytes;
}
