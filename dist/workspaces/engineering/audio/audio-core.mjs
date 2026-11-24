export function validateAudioFixture(value){
 if(value?.schema_version!==1||value.access!=='public'||value.browser_playback_preverified!==false||value.provider!=='Wikimedia Commons'||typeof value.id!=='string'||!/^[1-9][0-9]{0,18}$/.test(value.id)||BigInt(value.id)>9223372036854775807n||typeof value.title!=='string'||!value.title.startsWith('File:')||!Number.isInteger(value.bytes)||value.bytes<1||value.bytes>1048576||!Number.isFinite(value.duration_seconds)||value.duration_seconds<=0||value.duration_seconds>300||!/^[a-f0-9]{64}$/.test(value.sha256||'')||!['application/ogg','audio/ogg'].includes(value.mime))throw Error('Unsupported public audio fixture');
 const source=new URL(value.source),file=new URL(value.original);
 for(const url of [source,file])if(url.protocol!=='https:'||url.port||url.username||url.password||url.search||url.hash)throw Error('Unreviewed source URL');
 if(source.hostname!=='commons.wikimedia.org'||decodeURIComponent(source.pathname).replaceAll('_',' ')!=='/wiki/'+value.title||file.hostname!=='upload.wikimedia.org'||!/^\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+$/.test(file.pathname)||decodeURIComponent(file.pathname.split('/').at(-1)).replaceAll('_',' ')!==value.title.slice(5))throw Error('Audio source identity mismatch');
 return value;
}
export async function fetchVerifiedAudio(fixture,{fetchImpl=globalThis.fetch,signal,timeoutMs=15000}={}){
 validateAudioFixture(fixture);
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('Invalid audio deadline');
 if(signal?.aborted)throw signal.reason||new DOMException('Cancelled','AbortError');
 if(!globalThis.crypto?.subtle)throw Error('Integrity checking unavailable');
 const controller=new AbortController(),relay=()=>controller.abort(signal.reason);
 signal?.addEventListener('abort',relay,{once:true});const timer=setTimeout(()=>controller.abort(new DOMException('Audio download timed out','TimeoutError')),timeoutMs);
 try{
  const response=await fetchImpl(fixture.original,{signal:controller.signal,credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer'});
  const reject=async message=>{try{await response.body?.cancel();}catch{}throw Error(message);};
  if(!response.ok)return await reject('Source audio request failed ('+response.status+').');
  if(!['application/ogg','audio/ogg'].includes((response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()))return await reject('Unexpected audio content type');
  if(!response.body)return await reject('Missing audio body');
  const reader=response.body.getReader(),bytes=new Uint8Array(fixture.bytes);let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;if(!(value instanceof Uint8Array)||size+value.byteLength>bytes.length)throw Error('Audio byte budget exceeded');bytes.set(value,size);size+=value.byteLength;}}
  catch(error){try{await reader.cancel();}catch{}throw error;}finally{reader.releaseLock();}
  if(size!==bytes.length)throw Error('Incomplete audio response');
  const digest=await crypto.subtle.digest('SHA-256',bytes),hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==fixture.sha256)throw Error('Audio hash mismatch; retained source may have changed');
  if(controller.signal.aborted)throw controller.signal.reason;
  return {bytes,sha256:hash,mime:fixture.mime};
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',relay);}
}
export function audioState(type){const labels={loadedmetadata:'metadata-loaded',canplay:'player-ready',playing:'playing',pause:'paused',ended:'ended',error:'failed',waiting:'buffering',stalled:'stalled'};return Object.hasOwn(labels,type)?labels[type]:null;}
