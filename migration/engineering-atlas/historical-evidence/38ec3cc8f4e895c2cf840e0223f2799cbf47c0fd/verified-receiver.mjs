// Isolated candidate. The production browser harness is deliberately unchanged.
import {validatePrepared} from './baseline.mjs';
export async function verifyPrepared(result,count,bytes) {
  validatePrepared(result,count,bytes);
  if(!globalThis.crypto?.subtle)throw new Error('Secure digest API unavailable');
  const suffix='abcdefgh01234567'.repeat(Math.ceil((bytes-12)/16)).slice(0,bytes-12);
  for(const record of result.records) {
    // Generated schema is closed; do not silently hash undisplayed extra data.
    const keys=Object.keys(record);
    if(keys.length!==4||!['id','title','description','metadata'].every(key=>Object.hasOwn(record,key)))throw new Error('Unexpected generated record fields');
    if(record.metadata.slice(12)!==suffix)throw new Error('Complete metadata mismatch');
  }
  const encoded=new TextEncoder().encode(JSON.stringify(result.records));
  if(encoded.byteLength!==result.dataset.serialized_bytes)throw new Error('Serialized byte count mismatch');
  const digest=await crypto.subtle.digest('SHA-256',encoded);
  const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  if(actual!==result.dataset.sha256)throw new Error('Complete dataset digest mismatch');
  return result;
}
