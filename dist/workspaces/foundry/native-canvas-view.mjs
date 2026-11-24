// Source basis: reviewed MIT prototype-v24.ts toggleCleanView and premium.ts F fullscreen.
// Native adaptation: Foundry-only, explicit, session-only; never changes authoring state.
export function attachCanvasView({host,workspace,signal}){
 if(!host?.ownerDocument||!workspace?.contains(host))throw new TypeError('Canvas view requires its own workspace host');
 const doc=host.ownerDocument,previous=workspace.getAttribute('data-foundry-canvas-only');let active=false,disposed=false;
 host.classList.add('foundry-canvas-controls');
 const button=doc.createElement('button');button.type='button';button.dataset.canvasViewToggle='';
 const note=doc.createElement('span');note.textContent='Foundry canvas only. Athena navigation stays available. Escape restores controls; Tab keeps normal keyboard navigation.';
 const fullscreen=doc.createElement('button');fullscreen.type='button';fullscreen.dataset.foundryFullscreen='';fullscreen.textContent='Fullscreen';
 const fullscreenStatus=doc.createElement('span');fullscreenStatus.dataset.foundryFullscreenStatus='';fullscreenStatus.setAttribute('role','status');
 host.replaceChildren(button,fullscreen,note,fullscreenStatus);workspace.insertBefore(host,workspace.firstChild);
 function paint(){button.textContent=active?'Restore Foundry controls':'Canvas only';button.setAttribute('aria-pressed',String(active));if(active)workspace.setAttribute('data-foundry-canvas-only','true');else if(previous===null)workspace.removeAttribute('data-foundry-canvas-only');else workspace.setAttribute('data-foundry-canvas-only',previous);}
 function setActive(value){if(disposed||signal?.aborted)return;active=Boolean(value);paint();button.focus();}
 function toggle(){setActive(!active);}
 let fullscreenOperation=null,exitAfterDisposal=false,wasFullscreen=false;
 const supported=()=>doc.fullscreenEnabled===true&&typeof workspace.requestFullscreen==='function'&&typeof doc.exitFullscreen==='function';
 const ownsFullscreen=()=>doc.fullscreenElement===workspace;
 function canToggleFullscreen(){
  return !disposed&&!signal?.aborted&&workspace.isConnected&&supported()&&!fullscreenOperation&&(!doc.fullscreenElement||ownsFullscreen());
 }
 function paintFullscreen(){
  const available=supported(),own=ownsFullscreen();
  fullscreen.disabled=!available;
  fullscreen.setAttribute('aria-pressed',String(own));
  fullscreen.setAttribute('aria-disabled',String(!canToggleFullscreen()));
  if(available)fullscreen.setAttribute('aria-keyshortcuts','F');
  else{
   fullscreen.removeAttribute('aria-keyshortcuts');
   fullscreenStatus.textContent='Browser fullscreen is not available here. Canvas only is still available.';
  }
 }
 function fullscreenChanged(){
  if(disposed)return;
  const own=ownsFullscreen();
  if(own!==wasFullscreen){
   wasFullscreen=own;
   fullscreenStatus.textContent=own?'Foundry is fullscreen. Use Escape or the Fullscreen button to return.':'Foundry left fullscreen.';
  }
  paintFullscreen();
 }
 async function exitDisposedFullscreen(){
  if(!disposed||!ownsFullscreen()||exitAfterDisposal||fullscreenOperation==='exit')return;
  exitAfterDisposal=true;
  try{await doc.exitFullscreen();}catch{/* The browser remains in control of its presentation. */}
 }
 async function toggleFullscreen(){
  if(!canToggleFullscreen())return;
  const own=ownsFullscreen();
  fullscreenOperation=own?'exit':'enter';
  fullscreenStatus.textContent='';
  paintFullscreen();
  try{
   if(own)await doc.exitFullscreen();
   else await workspace.requestFullscreen();
  }catch{
   if(!disposed)fullscreenStatus.textContent=own?'Could not exit fullscreen. Use your browser’s fullscreen exit control.':'Could not enter fullscreen. Canvas only is still available.';
  }finally{
   fullscreenOperation=null;
   if(disposed)void exitDisposedFullscreen();
   else paintFullscreen();
  }
 }
 function isEditing(event){
  const target=event.composedPath?.()[0]??event.target;
  const editable=target?.closest?.('[contenteditable]')?.getAttribute('contenteditable');
  return target?.isContentEditable||target?.closest?.('input,textarea,select,[role="textbox"],[role="searchbox"],[role="combobox"],[role="spinbutton"]')||
   (editable!==undefined&&editable.toLowerCase()!=='false');
 }
 function keydown(event){
  if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;
  if(active&&event.key==='Escape'&&!doc.fullscreenElement){
   event.preventDefault();event.stopPropagation();setActive(false);return;
  }
  if(event.key?.toLowerCase()!=='f'||event.shiftKey||event.repeat||event.isComposing||isEditing(event)||!canToggleFullscreen())return;
  event.preventDefault();void toggleFullscreen();
 }
 function dispose(){
  if(disposed)return;
  disposed=true;active=false;
  if(previous===null)workspace.removeAttribute('data-foundry-canvas-only');
  else workspace.setAttribute('data-foundry-canvas-only',previous);
  button.removeEventListener('click',toggle);
  fullscreen.removeEventListener('click',toggleFullscreen);
  workspace.removeEventListener('keydown',keydown);
  doc.removeEventListener('fullscreenchange',fullscreenChanged);
  signal?.removeEventListener('abort',dispose);
  host.replaceChildren();host.classList.remove('foundry-canvas-controls');
  void exitDisposedFullscreen();
 }
 button.addEventListener('click',toggle);
 fullscreen.addEventListener('click',toggleFullscreen);
 workspace.addEventListener('keydown',keydown);
 if(supported())doc.addEventListener('fullscreenchange',fullscreenChanged);
 signal?.addEventListener('abort',dispose,{once:true});
 paint();paintFullscreen();if(signal?.aborted)dispose();
 return {dispose};
}
