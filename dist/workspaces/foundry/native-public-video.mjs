// Bounded direct-media adaptation of Feature Foundry MediaSurfaceController.
// Public URL validation is not DNS attestation. Browser CORS/network protections still apply.
export const MAX_VIDEO_BYTES=32*1024*1024;
export function publicVideoURL(raw,origin=''){
 if(typeof raw!=='string'||raw.length>2048||/[\u0000-\u0020\\]/.test(raw))throw Error('Use a plain public HTTPS direct-video URL.');
 const u=new URL(raw),h=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||u.username||u.password||u.port||/^https:\/\/[^/]*:/i.test(raw)||u.hash||u.search||raw.includes('?')||raw.includes('#'))throw Error('HTTPS only; credentials, ports, queries and fragments are not supported.');
 if(u.origin===origin||!h.includes('.')||/^[\d.]+$/.test(h)||h.includes(':')||h.endsWith('.')||!h.split('.').every(p=>/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(p))||/(^|\.)(localhost|local|localdomain|internal|lan|home|arpa|test|invalid|example|onion)$/.test(h))throw Error('Use a public cross-origin DNS hostname, not an IP, local or reserved host.');
 if(!/\.(mp4|webm|ogv)$/i.test(u.pathname)||/(token|signature|credential|authorization|password|secret)/i.test(decodeURIComponent(u.pathname)))throw Error('Use an unsigned direct .mp4, .webm or .ogv path, not a provider page or signed URL.');
 return u.href;
}
export async function fetchPublicVideo(url,{signal,fetcher=fetch,maxBytes=MAX_VIDEO_BYTES}={}){
 const response=await fetcher(url,{signal,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',mode:'cors',cache:'no-store'});
 async function refuse(message){try{await response.body?.cancel()}catch{}throw Error(message)}
 if(!response.ok||response.redirected)return refuse('Public media request failed or redirected.');
 const mime=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
 const length=response.headers.get('content-length');
 if(!['video/mp4','video/webm','video/ogg'].includes(mime))return refuse('Server must supply a supported video Content-Type.');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>maxBytes))return refuse('Video exceeds the 32 MiB download limit.');
 if(!response.body)throw Error('No readable video body.');
 const reader=response.body.getReader(),chunks=[];let total=0,done=false;
 try{while(true){if(signal?.aborted)throw Error('Load cancelled.');const part=await reader.read();if(part.done){done=true;break;}total+=part.value.byteLength;if(total>maxBytes)throw Error('Video exceeds the 32 MiB download limit.');chunks.push(part.value);}if(signal?.aborted)throw Error('Load cancelled.');if(!total)throw Error('Empty video body.');return new Blob(chunks,{type:mime});}
 finally{if(!done)try{await reader.cancel()}catch{}reader.releaseLock();}
}
export function attachNativePublicVideo({host,signal,fetcher=fetch,createVideo=()=>host.ownerDocument.createElement('video'),createURL=b=>URL.createObjectURL(b),revokeURL=u=>URL.revokeObjectURL(u)}){
 let disposed=false,generation=0,attempt=0,pending=null,active=null,cleanupFailed=false,state='empty';
 host.innerHTML='<h2>Public direct video</h2><p>Explicit Load downloads a public HTTPS video (maximum 32 MiB, 30-second timeout) with credentials omitted, no referrer, no redirects and CORS required. Unsigned .mp4/.webm/.ogv only; no queries, provider pages or account access. Session only, not saved. Loading never starts playback.</p><label>Public HTTPS video URL <input data-public-video-url type="url" maxlength="2048" autocomplete="off"></label><button data-public-video-load>Load public video</button><button data-public-video-play disabled>Play</button><button data-public-video-pause disabled>Pause</button><button data-public-video-close disabled>Close / cancel</button><p role="status" data-public-video-status>No video loaded.</p><div data-public-video-view></div>';
 const one=q=>host.querySelector(q),input=one('[data-public-video-url]'),load=one('[data-public-video-load]'),play=one('[data-public-video-play]'),pause=one('[data-public-video-pause]'),close=one('[data-public-video-close]'),status=one('[data-public-video-status]'),view=one('[data-public-video-view]');
 function set(s,text){state=s;status.dataset.state=s;status.textContent=text;}
 function release(){attempt++;const old=active;active=null;if(old){for(const [t,f]of old.listeners)old.video.removeEventListener(t,f);try{old.video.pause()}catch{cleanupFailed=true}try{old.video.removeAttribute('src');old.video.load()}catch{cleanupFailed=true}try{revokeURL(old.url)}catch{cleanupFailed=true}try{old.video.remove()}catch{cleanupFailed=true}}play.disabled=pause.disabled=true;}
 function cancel(){generation++;pending?.abort();pending=null;}
 async function select(){if(disposed)return;let url;try{url=publicVideoURL(input.value,host.ownerDocument.defaultView?.location?.origin||'')}catch(e){status.textContent=e.message+' Previous video retained.';return;}
  cancel();const token=generation,controller=new AbortController();pending=controller;const timer=setTimeout(()=>controller.abort(),30000);close.disabled=false;set('loading','Downloading bounded public video. Previous video retained until successful load.');
  let prepared=null;try{const blob=await fetchPublicVideo(url,{signal:controller.signal,fetcher});if(disposed||generation!==token)return;const video=createVideo(),objectURL=createURL(blob);const entry={video,url:objectURL,listeners:[]};prepared=entry;release();active=entry;video.crossOrigin='anonymous';video.referrerPolicy='no-referrer';video.controls=true;video.autoplay=false;video.loop=false;video.playsInline=true;video.preload='metadata';video.style.maxWidth='100%';
   const labels={loadedmetadata:['metadata-ready','Metadata received; playback not verified.'],canplay:['canplay','Ready to request Play; playback not verified.'],playing:['playing','Native playing event observed.'],pause:['paused','Native pause event observed.'],ended:['ended','Video ended.'],waiting:['buffering','Waiting for video data.'],error:['failed','Video decoding failed; codec support is not established.']};
   for(const [type,[s,text]]of Object.entries(labels)){const fn=e=>{if(disposed||active!==entry||e.isTrusted!==true)return;if(['pause','ended','error'].includes(type))attempt++;set(s,pending?text+' Previous video remains active while replacement downloads.':text);if(type==='canplay'||type==='loadedmetadata')play.disabled=false;if(type==='error')play.disabled=true;};entry.listeners.push([type,fn]);video.addEventListener(type,fn);}
   view.replaceChildren(video);pause.disabled=false;set('selected','Downloaded into session memory. No playback requested.');video.src=objectURL;video.load();
  }catch{if(prepared){if(active===prepared)release();else try{revokeURL(prepared.url)}catch{cleanupFailed=true}}if(!disposed&&generation===token)set('load-failed',prepared?'Player setup failed after replacement. Owned source release attempted; cleanup '+(cleanupFailed?'unverified.':'completed.'):'Load failed: HTTPS/CORS, redirect, size, MIME or network restriction. Previous video retained.');}
  finally{clearTimeout(timer);if(generation===token){pending=null;close.disabled=!active;}}
 }
 async function requestPlay(){if(disposed||!active||play.disabled)return;const entry=active,id=++attempt;set('play-requested','Play requested; waiting for native playing event.');try{await entry.video.play()}catch{if(!disposed&&active===entry&&attempt===id)set('play-rejected','Playback rejected; no playback confirmed.');}}
 function requestPause(){if(disposed||!active)return;attempt++;set('pause-requested','Pause requested; waiting for native pause event.');try{active.video.pause()}catch{set('failed','Pause failed; close to release the source.');}}
 function clear(){cancel();release();view.replaceChildren();close.disabled=true;set('empty',cleanupFailed?'Closed; some cleanup operations failed, release unverified.':'Closed; owned session URL released and pending request cancelled.');}
 function dispose(){if(disposed)return;disposed=true;clear();load.removeEventListener('click',select);play.removeEventListener('click',requestPlay);pause.removeEventListener('click',requestPause);close.removeEventListener('click',clear);signal?.removeEventListener('abort',dispose);host.replaceChildren();}
 load.addEventListener('click',select);play.addEventListener('click',requestPlay);pause.addEventListener('click',requestPause);close.addEventListener('click',clear);signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();return{dispose,getState:()=>({state,cleanup:cleanupFailed?'unverified':active?'in-use':'released'})};
}
