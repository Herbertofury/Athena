// One existing HTMLVideoElement; never copy, replace, restart or reparent the source.
function createVideoPopout({ frame, button, returnButton, status, resolveVideo, observeMedia = true, onChange = () => {} }) {
 const doc = frame.ownerDocument;
 let item = null, mode = 'inline', pending = false, disposed = false, priorFocus = null, closing = null;
 const canRun = v => !!v && !v.error && v.readyState >= 1 && v.videoWidth > 0;

 function paint() {
  frame.dataset.videoPopout = mode;
  button.hidden = mode !== 'inline';
  button.disabled = pending || !canRun(item);
  returnButton.hidden = mode === 'inline';
  returnButton.disabled = pending || closing !== null;
  onChange(mode, pending);
 }
 const describe = text => { status.textContent = text; };
 function focusBack() {
  if (priorFocus?.isConnected && !priorFocus.disabled && !priorFocus.hidden) priorFocus.focus();
  else if (!button.hidden && !button.disabled) button.focus();
  priorFocus = null;
 }
 function enter(next) {
  if (disposed || mode === next) return;
  mode = next; paint();
  describe(next === 'native' ? 'Floating video window. Playback continues.' : 'Video docked in this app. Playback continues.');
  if (next === 'dock') returnButton.focus();
 }
 function inline(text, restore = true) {
  closing = null; mode = 'inline'; paint();
  if (text) describe(text);
  if (restore) focusBack(); else priorFocus = null;
 }
 function onEnter(e) { if (!disposed && item === e.currentTarget) enter('native'); }
 function onLeave(e) {
  if (!disposed && item === e.currentTarget && mode === 'native' && doc.pictureInPictureElement !== item) inline('Video returned. Playback unchanged.');
 }
 function disconnect() {
  if (!item) return;
  item.removeEventListener('enterpictureinpicture', onEnter);
  item.removeEventListener('leavepictureinpicture', onLeave);
  if (observeMedia) for (const ev of ['loadedmetadata', 'emptied', 'error']) item.removeEventListener(ev, paint);
  // Do not close another player’s pop-out or change playback.
  if (doc.pictureInPictureElement === item && closing?.video !== item) {
   try { Promise.resolve(doc.exitPictureInPicture?.()).catch(() => {}); } catch {}
  }
 }
 function sync() {
  if (disposed) return;
  const next = resolveVideo();
  if (item === next) { paint(); return; }
  disconnect(); item = next ?? null; pending = false;
  inline('',false);
  if (!item) return;
  item.addEventListener('enterpictureinpicture', onEnter);
  item.addEventListener('leavepictureinpicture', onLeave);
  if (observeMedia) for (const ev of ['loadedmetadata', 'emptied', 'error']) item.addEventListener(ev, paint);
  paint();
 }
 async function open() {
  if (disposed || pending || mode !== 'inline' || !canRun(item)) return;
  const video = item;
  priorFocus = doc.activeElement;
  // Unsupported or denied native PiP falls back without disturbing the element.
  if (doc.pictureInPictureEnabled && typeof video.requestPictureInPicture === 'function'
    && !video.disablePictureInPicture && (!doc.pictureInPictureElement || doc.pictureInPictureElement === video)) {
   pending = true; paint();
   try {
    await video.requestPictureInPicture();
    if (disposed || item !== video) {
     if (doc.pictureInPictureElement === video) await doc.exitPictureInPicture?.();
     return;
    }
    if (doc.pictureInPictureElement === video) { enter('native'); return; }
   } catch {}
   finally { if (!disposed && item === video) { pending = false; paint(); } }
  }
  if (!disposed && item === video) enter('dock');
 }
 async function close() {
  if (disposed || pending || closing || mode === 'inline') return;
  if (mode === 'native' && doc.pictureInPictureElement === item) {
   const attempt = { video: item };
   closing = attempt; paint();
   const stillOwns = () => !disposed && closing === attempt && item === attempt.video && mode === 'native';
   try { await doc.exitPictureInPicture(); }
   catch {
    if (stillOwns()) {
     closing = null; paint();
     describe('Close the floating window using its own controls.');
    }
    return;
   }
   // A native leave event may already have returned this video, or a new video may own the UI.
   if (!stillOwns()) return;
  }
  inline('Video returned. Playback unchanged.');
 }
 function key(e) { if (mode === 'dock' && e.key === 'Escape' && !e.defaultPrevented && !e.repeat) { e.preventDefault(); void close(); } }
 button.addEventListener('click', open);
 returnButton.addEventListener('click', close);
 frame.addEventListener('keydown', key);
 function dispose() {
  if (disposed) return;
  disconnect(); disposed = true; item = null; pending = false;
  button.removeEventListener('click',open); returnButton.removeEventListener('click',close);
  frame.removeEventListener('keydown',key); inline('',false);
 }
 sync();
 return { sync, dispose, canRoute: () => !pending && mode === 'inline' };
}

// Session-only local-file adaptation of MIT Feature Foundry MediaSurfaceController.
// Lifecycle/event patterns reuse Athena media/audio workspaces without depending on them.
export function attachNativeLocalVideo({host,signal,getSelectedTarget=()=>null,resolveTarget=()=>null,createVideo=()=>host.ownerDocument.createElement('video'),createURL=file=>URL.createObjectURL(file),revokeURL=url=>URL.revokeObjectURL(url)}){
 const doc=host.ownerDocument;let disposed=false,generation=0,playAttempt=0,active=null,state='empty',cleanupFailed=false,target=null,layer=null;
 host.innerHTML='<h2>Local video surface</h2><p>Choose a local video explicitly. Session only: no upload, provider request, saved path or automatic playback. Browser codec support is not assumed.</p><label>Choose local video <input type="file" accept="video/*" data-local-video-file></label><button data-local-video-play disabled>Play selected video</button><button data-local-video-pause disabled>Pause</button><button data-local-video-close disabled>Close and release video</button><p data-local-video-name></p><p role="status" data-local-video-status>No video selected.</p><button data-local-video-route disabled>Route to selected visible object</button><button data-local-video-preview disabled>Return to preview</button><p data-local-video-route-status>Preview only; routing is session-only.</p><div data-local-video-frame data-video-popout="inline"><button type="button" data-local-video-pop-open disabled>Pop out video</button><button type="button" data-local-video-pop-return hidden>Return to source</button><div data-local-video-view></div></div><p role="status" data-local-video-pop-status></p>';
 const one=q=>host.querySelector(q),input=one('[data-local-video-file]'),view=one('[data-local-video-view]'),status=one('[data-local-video-status]'),name=one('[data-local-video-name]'),play=one('[data-local-video-play]'),pause=one('[data-local-video-pause]'),close=one('[data-local-video-close]');
 const route=one('[data-local-video-route]'),preview=one('[data-local-video-preview]'),routeStatus=one('[data-local-video-route-status]');
 const popStatus=one('[data-local-video-pop-status]');
 const popout=createVideoPopout({frame:one('[data-local-video-frame]'),button:one('[data-local-video-pop-open]'),returnButton:one('[data-local-video-pop-return]'),status:popStatus,observeMedia:false,resolveVideo:()=>target?null:active?.video,
  onChange:(mode,pending)=>{route.disabled=!active||mode!=='inline'||pending;}});
 
 function detach(){if(active&&layer?.contains(active.video))view.append(active.video);if(layer?.parentElement)delete layer.parentElement.dataset.localVideoActive;layer?.remove();layer=null;if(active){active.video.controls=true;active.video.style.cssText='max-width:100%';}}
 function update(){
  if(disposed)return;route.disabled=!active||!popout.canRoute();preview.disabled=!active||!target;
  if(!active||!target)return;
  const node=resolveTarget(target.key);
  if(!node){detach();requestPause();routeStatus.textContent='Selected surface unavailable. Video returned to preview; pause requested. Original target retained, no retargeting.';return;}
  const surface=node.querySelector('.foundry-object-form')||node;
  if(layer?.parentElement===surface)return;
  detach();layer=doc.createElement('span');layer.dataset.localVideoSurface='true';layer.setAttribute('aria-hidden','true');layer.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:inherit;z-index:2';
  active.video.controls=false;active.video.style.cssText='width:100%;height:100%;object-fit:contain;pointer-events:none';layer.append(active.video);surface.dataset.localVideoActive='true';surface.prepend(layer);
  routeStatus.textContent='Session video routed to '+target.label+'. Playback requires explicit Play; controls remain here.';
 }
 function routeSelected(){if(disposed||!active||route.disabled)return;const selected=getSelectedTarget();if(!selected||typeof selected.key!=='string'||!resolveTarget(selected.key)){routeStatus.textContent='Select a visible object first. Current route retained.';return;}target={key:selected.key,label:String(selected.label)};popStatus.textContent='Return to preview to pop out this video.';popout.sync();update();}
 function returnPreview(){if(disposed)return;detach();target=null;preview.disabled=true;popStatus.textContent='';popout.sync();routeStatus.textContent='Preview only; routing is session-only.';}
 const set=(value,message)=>{state=value;status.dataset.state=value;status.textContent=message};
 function release(){detach();target=null;route.disabled=preview.disabled=true;routeStatus.textContent="Preview only; routing is session-only.";generation++;playAttempt++;const old=active;active=null;popout.sync();popStatus.textContent='';state='empty';if(old){for(const [type,fn] of old.listeners)old.video.removeEventListener(type,fn);try{old.video.pause()}catch{cleanupFailed=true}try{old.video.removeAttribute('src');old.video.load()}catch{cleanupFailed=true}try{revokeURL(old.url)}catch{cleanupFailed=true}old.video.remove()}view.replaceChildren();name.textContent='';play.disabled=pause.disabled=close.disabled=true;input.value='';host.dataset.localVideoCleanup=cleanupFailed?'unverified':'released';}
 function select(){if(disposed)return;const file=input.files?.[0];input.value='';if(!file)return;if(typeof file.type!=='string'||!file.type.startsWith('video/')||!Number.isFinite(file.size)||file.size<=0){status.textContent='Selection rejected: choose a nonempty video file. Previous video retained.';return}
  // Prepare the replacement before releasing the last-good player or its route.
  // This covers synchronous setup only; successful load() is not codec/playback proof.
  let video,url;try{video=createVideo();url=createURL(file);video.controls=true;video.autoplay=false;video.loop=false;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-label','Selected local video; session only');video.style.maxWidth='100%';video.src=url;video.load();}
  catch{if(video){try{video.pause()}catch{cleanupFailed=true}try{video.removeAttribute('src');video.load()}catch{cleanupFailed=true}try{video.remove()}catch{cleanupFailed=true}}if(url){try{revokeURL(url)}catch{cleanupFailed=true}}host.dataset.localVideoCleanup=cleanupFailed?'unverified':active?'in-use':'released';status.textContent='Could not prepare the selected local file. '+(active?'Previous video retained.':'No video selected.')+(cleanupFailed?' Candidate cleanup is unverified.':'');return}
  release();const token=generation,entry={video,url,listeners:[]};active=entry;name.textContent=file.name;set('selected','Local file selected. Metadata and playback not yet verified.');close.disabled=false;pause.disabled=false;route.disabled=false;
  const labels={loadedmetadata:['metadata-ready','Metadata received. Playback not verified.'],canplay:['canplay','Browser reports video can play. Press Play; playback not yet verified.'],playing:['playing','Native playing event observed.'],pause:['paused','Video paused.'],ended:['ended','Video ended.'],waiting:['buffering','Waiting for media data; not currently verified playing.'],stalled:['stalled','Media stalled; not currently verified playing.'],error:['failed','Browser could not play this local file. Codec support is not established.']};
  for(const [type,[value,message]] of Object.entries(labels)){const fn=e=>{if(disposed||active!==entry||token!==generation||e.isTrusted!==true)return;if(['pause','ended','error'].includes(type))playAttempt++;set(value,message);popout.sync();if(type==='canplay'||type==='loadedmetadata')play.disabled=false;if(type==='error')play.disabled=true};entry.listeners.push([type,fn]);video.addEventListener(type,fn)}
  try{view.append(video);popout.sync()}catch{release();set('failed','Could not load this local video. Resources released where supported; cleanup status is separately recorded.');}
 }
 async function requestPlay(){if(disposed||!active||play.disabled)return;const entry=active,token=generation,attempt=++playAttempt;set('play-requested','Playback requested; waiting for a native playing event.');try{await entry.video.play()}catch{if(!disposed&&active===entry&&token===generation&&attempt===playAttempt)set('play-rejected','Browser rejected playback. Use native controls or choose another video; no playback confirmed.')}}
 function requestPause(){if(disposed||!active)return;playAttempt++;set('pause-requested','Pause requested; waiting for a native pause event.');try{active.video.pause()}catch{set('failed','Browser pause request failed. Close the video to release the source.')}}
 function clear(){release();set('empty',cleanupFailed?'Video closed. One or more cleanup operations failed; release is unverified.':'Video closed; session object URL released.');}
 route.addEventListener('click',routeSelected);preview.addEventListener('click',returnPreview);
 input.addEventListener('change',select);play.addEventListener('click',requestPlay);pause.addEventListener('click',requestPause);close.addEventListener('click',clear);
 function dispose(){if(disposed)return;disposed=true;release();popout.dispose();route.removeEventListener('click',routeSelected);preview.removeEventListener('click',returnPreview);input.removeEventListener('change',select);play.removeEventListener('click',requestPlay);pause.removeEventListener('click',requestPause);close.removeEventListener('click',clear);signal?.removeEventListener('abort',dispose);host.replaceChildren()}
 signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();return {dispose,detach,update,getState:()=>({state,cleanup:cleanupFailed?'unverified':active?'in-use':'released'})};
}
