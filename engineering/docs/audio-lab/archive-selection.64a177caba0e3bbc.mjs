export const MAX_ARCHIVE_BYTES=2*1024*1024;
async function readSavedProject(id,{signal,fetchImpl}) {
 if(typeof id!=='string'||!/^[A-Za-z0-9]{8}$/.test(id))throw new Error('Enter one saved canonical eight-character project ID.');
 if(!globalThis.crypto?.subtle)throw new Error('Integrity verification is unavailable; no unchecked archive accepted.');
 const response=await fetchImpl('/api/project-archive/'+id,{signal,cache:'no-store',redirect:'error',credentials:'same-origin'});
 const reject=async message=>{try{await response.body?.cancel();}catch{}throw new Error(message);};
 if(!response.ok)return reject(response.status===404?'No archived response exists for that canonical ID.':'Saved response could not be verified ('+response.status+').');
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type')||''))return reject('Unexpected saved-response content type.');
 if(response.headers.get('x-atlas-canonical-id')!==id)return reject('Saved-response identity mismatch.');
 const generation=response.headers.get('x-atlas-generation'),expected=response.headers.get('x-atlas-payload-sha256');
 if(!/^[1-9][0-9]{0,18}$/.test(generation||'')||BigInt(generation)>9223372036854775807n)return reject('Invalid saved-response generation.');
 if(!/^[a-f0-9]{64}$/.test(expected||''))return reject('Missing saved-response hash.');
 const length=response.headers.get('content-length');
 if(length!==null&&(!/^[0-9]+$/.test(length)||BigInt(length)>BigInt(MAX_ARCHIVE_BYTES)))return reject('Saved response exceeds the size budget.');
 if(!response.body)return reject('Saved response has no readable body.');
 // Retain bytes, not one object per transport chunk. Empty/tiny chunks must
 // not turn the two-MiB byte budget into unbounded retained chunk metadata.
 const reader=response.body.getReader();let buffer=new Uint8Array(0),size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;if(!(value instanceof Uint8Array))throw new Error('Unexpected response byte stream.');const next=size+value.byteLength;if(next>MAX_ARCHIVE_BYTES)throw new Error('Saved response exceeds the size budget.');if(next>buffer.length){const grown=new Uint8Array(Math.min(MAX_ARCHIVE_BYTES,Math.max(next,16384,buffer.length*2)));grown.set(buffer.subarray(0,size));buffer=grown;}buffer.set(value,size);size=next;}}
 catch(error){try{await reader.cancel();}catch{}throw error;}
 finally{reader.releaseLock();}
 if(size===0)throw new Error('An empty saved response is not accepted.');
 if(length!==null&&BigInt(size)!==BigInt(length))throw new Error('Saved-response length mismatch.');
 const bytes=buffer.length===size?buffer:buffer.slice(0,size);
 const digest=await crypto.subtle.digest('SHA-256',bytes),hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==expected)throw new Error('Saved-response hash mismatch.');
 const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
 if(signal?.aborted)throw signal.reason||new DOMException('Archive request cancelled','AbortError');
 // No JSON.parse: unknown integer spellings and original text stay untouched.
 return Object.freeze({id,generation,hash,bytes,text});
}
export async function loadSavedProject(id,{signal,fetchImpl=globalThis.fetch,timeoutMs=15000}={}) {
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw new Error('Invalid archive request deadline.');
 if(signal?.aborted)throw signal.reason||new DOMException('Archive request cancelled','AbortError');
 const controller=new AbortController(),relay=()=>controller.abort(signal.reason);
 signal?.addEventListener('abort',relay,{once:true});
 const timer=setTimeout(()=>controller.abort(new DOMException('Saved-response request timed out','TimeoutError')),timeoutMs);
 try{return await readSavedProject(id,{signal:controller.signal,fetchImpl});}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',relay);}
}
export function createArchiveSelection(loader=loadSavedProject){
 let sequence=0,controller=null,last=null;
 return {
  async load(id){const current=++sequence;controller?.abort();const own=new AbortController();controller=own;try{const record=await loader(id,{signal:own.signal});if(current!==sequence)return {status:'superseded'};last=record;return {status:'ready',record};}catch(error){if(current!==sequence)return {status:'superseded'};throw error;}finally{if(current===sequence)controller=null;}},
  cancel(){sequence++;controller?.abort();controller=null;},
  get pending(){return controller!==null;},
  get last(){return last;},
 };
}
