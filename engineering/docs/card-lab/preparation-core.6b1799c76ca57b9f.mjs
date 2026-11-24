import {makeData,validateBounds} from './lab-core.b7c188622867f9b8.mjs';
export async function prepareDataset(count,bytes) {
  validateBounds(count,bytes);
  if(!globalThis.crypto?.subtle)throw new Error('Secure digest API unavailable; no unchecked dataset accepted');
  const started=performance.now();
  const records=makeData(count,bytes);
  const generated=performance.now();
  const serialized=JSON.stringify(records);
  const serializedAt=performance.now();
  const encoded=new TextEncoder().encode(serialized);
  const encodedAt=performance.now();
  const digest=await crypto.subtle.digest('SHA-256',encoded);
  const finished=performance.now();
  const sha256=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
  return {records,dataset:{count,metadata_bytes_per_record:bytes,serialized_bytes:encoded.byteLength,sha256,generation_ms:generated-started,serialization_ms:serializedAt-generated,encoding_ms:encodedAt-serializedAt,digest_ms:finished-encodedAt,hash_ms:finished-generated},preparation_ms:finished-started};
}
export function validatePrepared(result,count,bytes) {
  validateBounds(count,bytes);
  if(!result||!Array.isArray(result.records)||result.records.length!==count||!result.dataset||result.dataset.count!==count||result.dataset.metadata_bytes_per_record!==bytes||!Number.isInteger(result.dataset.serialized_bytes)||result.dataset.serialized_bytes<count*bytes||result.dataset.serialized_bytes>count*bytes+count*1024||!/^[a-f0-9]{64}$/.test(result.dataset.sha256))throw new Error('Prepared dataset contract mismatch');
  for(const key of ['generation_ms','serialization_ms','encoding_ms','digest_ms','hash_ms'])if(!Number.isFinite(result.dataset[key])||result.dataset[key]<0)throw new Error('Invalid preparation timing');
  if(!Number.isFinite(result.preparation_ms)||result.preparation_ms<0)throw new Error('Invalid preparation duration');
  for(let i=0;i<count;i++) {
    const r=result.records[i],id='card-'+String(i).padStart(6,'0');
    if(!r||r.id!==id||r.title!=='Discovery '+String(i+1).padStart(4,'0')||r.description!=='A complete generated record. Exact identity and full metadata retained.'||typeof r.metadata!=='string'||r.metadata.length!==bytes||!r.metadata.startsWith(id+'|'))throw new Error('Prepared record identity or field mismatch');
  }
  return result;
}
