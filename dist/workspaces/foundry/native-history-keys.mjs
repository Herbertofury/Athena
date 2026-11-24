// Reviewed MIT prototype-v24.ts history and premium.ts save shortcuts, scoped to this native workspace.
export function attachHistoryKeys({host,workspace,signal}) {
 if(!host?.ownerDocument||!workspace?.contains(host))throw new TypeError('History keys require an owned workspace host');
 const note=host.ownerDocument.createElement('p');note.textContent='Layout Undo: Ctrl/⌘+Z. Redo: Ctrl/⌘+Shift+Z or Ctrl/⌘+Y. Native save: Ctrl/⌘+S when connected and backup controls are visible. Text fields keep their own editing shortcuts.';host.append(note);
 let disposed=false,claimedSave=null;
 function keydown(event){
  if(disposed||signal?.aborted||event.defaultPrevented||event.isComposing||event.altKey||!(event.ctrlKey||event.metaKey))return;
  const target=event.target;if(!workspace.contains(target))return;
  // Respect ordinary inputs, editor islands and editable ancestors, including shadow hosts.
  const path=event.composedPath?.()||[target];
  for(const node of path){
   if(node===workspace)break;
   if(node?.matches?.('input,textarea,select,[role="textbox"],[role="combobox"],[role="searchbox"]')||node?.isContentEditable||node?.closest?.('[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="searchbox"]'))return;
  }
  const key=String(event.key).toLowerCase();
  if(key==='s'){
   if(!event.isTrusted||!event.cancelable||event.shiftKey||event.ctrlKey===event.metaKey||
      workspace.dataset.foundryCanvasOnly==='true')return;
   const save=workspace.querySelector('button[data-native-save]');
   if(!save||save.closest('[hidden],[inert],[aria-hidden="true"]'))return;
   const disabled=save.disabled||save.getAttribute('aria-disabled')==='true';
   if(event.repeat||disabled){
    // A hold or retry of our own still-busy action should neither write
    // twice nor fall through to the browser's unrelated Save Page action.
    if(save===claimedSave){event.preventDefault();event.stopPropagation();}
    return;
   }
   claimedSave=save;event.preventDefault();event.stopPropagation();save.click();return;
  }
  const redo=key==='y'||key==='z'&&event.shiftKey;
  if(key!=='z'&&key!=='y')return;
  const control=workspace.querySelector(redo?'[data-redo]':'[data-undo]');
  if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')return;
  event.preventDefault();event.stopPropagation();control.click();
 }
 function dispose(){if(disposed)return;disposed=true;claimedSave=null;workspace.removeEventListener('keydown',keydown);signal?.removeEventListener('abort',dispose);note.remove();}
 workspace.addEventListener('keydown',keydown);signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();
 return {dispose};
}
