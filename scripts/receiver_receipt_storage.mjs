// Explicit, bounded local receipt recovery. Integrity is not renewed measurement acceptance.
export const RECEIVER_STORAGE_KEY='athena.receiver.last-good.v1';
const MAX_RECEIPT=262144;
export function validateReceiverReceipt(text){
 if(typeof text!=='string'||text.length>MAX_RECEIPT)throw Error('Receipt exceeds the 256 KiB text limit.');
 const r=JSON.parse(text),pairs={main:['whole','bounded'],worker:['whole','bounded'],transport:['clone','transfer'],receipt:['clone','receipt'],build:['modules','esbuild','rolldown']};
 const lanes=pairs[r?.execution];
 if(!r||r.harness!=='athena-native-complete-receiver-v1'||r.complete!==true||r.count!==200||![8192,65536].includes(r.bytes)||!lanes||!Array.isArray(r.samples)||r.samples.length!==lanes.length*3||!/^[a-f0-9]{64}$/.test(r.dataset?.sha256||'')||!Number.isFinite(Date.parse(r.started_at))||!Number.isFinite(Date.parse(r.finished_at)))throw Error('Not a compatible complete receiver receipt.');
 for(let round=0;round<3;round++)for(const lane of lanes){const s=r.samples.filter(s=>s.round===round&&s.lane===lane);if(s.length!==1||s[0].complete_parity!==true||!Number.isFinite(s[0].request_ms)||s[0].request_ms<0)throw Error('Receipt is missing complete lane/round parity.');}
 return r;
}
async function receiptDigest(text){const hash=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function saveReceiverReceipt(storage,text){
 validateReceiverReceipt(text);
 const envelope=JSON.stringify({schema:1,receipt:text,sha256:await receiptDigest(text)});
 // Storage.setItem is one atomic browser operation; quota/security failures do not clear the previous value.
 storage.setItem(RECEIVER_STORAGE_KEY,envelope);
 if(storage.getItem(RECEIVER_STORAGE_KEY)!==envelope)throw Error('Saved receipt read-back did not match; no durability confirmation.');
 return {bytes:new TextEncoder().encode(envelope).length};
}
export async function loadReceiverReceipt(storage){
 const raw=storage.getItem(RECEIVER_STORAGE_KEY);
 if(raw===null)throw Error('No saved receiver receipt in this browser.');
 if(typeof raw!=='string'||raw.length>MAX_RECEIPT*2)throw Error('Stored receipt exceeds the recovery limit.');
 const e=JSON.parse(raw);
 if(e?.schema!==1||typeof e.receipt!=='string'||e.receipt.length>MAX_RECEIPT||e.sha256!==await receiptDigest(e.receipt))throw Error('Stored receipt integrity check failed.');
 return {text:e.receipt,receipt:validateReceiverReceipt(e.receipt)};
}
