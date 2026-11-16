import {makeData,validateBounds} from '../../docs/card-lab/lab-core.mjs';
import {encodeWithinBudget} from './encoder.mjs';
export async function prepareBudgeted(count,bytes){
 validateBounds(count,bytes);if(!globalThis.crypto?.subtle)throw Error('Secure digest API unavailable');
 const started=performance.now(),records=makeData(count,bytes),generated=performance.now();
 const encoded=encodeWithinBudget(records,count*bytes+count*1024+2),encodedAt=performance.now();
 const digest=await crypto.subtle.digest('SHA-256',encoded.bytes),finished=performance.now();
 return {records,dataset:{count,metadata_bytes_per_record:bytes,serialized_bytes:encoded.bytes.byteLength,sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),generation_ms:generated-started,serialization_ms:encoded.serialization_ms,encoding_ms:encoded.encoding_ms,digest_ms:finished-encodedAt,hash_ms:finished-generated,encoding_allocation_bytes:encoded.allocated_bytes,phase_scope:'Record-wise serialization/encoding sums; complete preparation includes loop and digest overhead'},preparation_ms:finished-started};
}
