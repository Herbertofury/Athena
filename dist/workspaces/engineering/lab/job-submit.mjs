// Fixed local enqueue protocol. A lost receipt does not mean the job was rejected.
export const MAX_JOB_RECEIPT_BYTES=4096;
const UNCONFIRMED='Submission outcome is unconfirmed. Check Overview before submitting again; a job may already exist.';
export function decodeJobReceipt(text){
 // The server emits one integer id. Match that fixed shape rather than rounding
 // a SQLite i64 through JSON.parse or accepting duplicate/extra receipt fields.
 const match=typeof text==='string'&&text.length<=MAX_JOB_RECEIPT_BYTES&&/^[ \t\r\n]*\{[ \t\r\n]*"id"[ \t\r\n]*:[ \t\r\n]*([1-9][0-9]{0,18})[ \t\r\n]*\}[ \t\r\n]*$/.exec(text);
 if(!match||BigInt(match[1])>9223372036854775807n)throw new Error(UNCONFIRMED);
 return Object.freeze({id:match[1]});
}
export async function submitJob(job,{fetchImpl=globalThis.fetch,timeoutMs=15000}={}){
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw new Error('Invalid submission deadline; no request made.');
 let body;try{body=JSON.stringify(job);}catch{throw new Error('Invalid job payload; no request made.');}
 if(typeof body!=='string')throw new Error('Invalid job payload; no request made.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(new DOMException('Submission receipt deadline','TimeoutError')),timeoutMs);
 let response,reader;
 try{
  response=await fetchImpl('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json','X-Atlas-Request':'local-ui'},body,signal:controller.signal,cache:'no-store',credentials:'same-origin',redirect:'error'});
  if(!response.ok||!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type')||'')||!response.body)throw new Error(UNCONFIRMED);
  reader=response.body.getReader();const bytes=new Uint8Array(MAX_JOB_RECEIPT_BYTES);let size=0,chunks=0;
  for(;;){const {done,value}=await reader.read();if(done)break;if(++chunks>8192||!(value instanceof Uint8Array)||size+value.byteLength>bytes.length)throw new Error(UNCONFIRMED);bytes.set(value,size);size+=value.byteLength;}
  if(controller.signal.aborted)throw new Error(UNCONFIRMED);
  return decodeJobReceipt(new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes.subarray(0,size)));
 }catch{
  try{if(reader)await reader.cancel();else await response?.body?.cancel();}catch{}
  throw new Error(UNCONFIRMED);
 }finally{try{reader?.releaseLock();}catch{}clearTimeout(timer);}
}
