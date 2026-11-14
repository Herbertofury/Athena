// Reviewed MIT prototype-v24.ts history shortcuts, scoped to this native workspace.
export function attachHistoryKeys({host,workspace,signal}) {
 if(!host?.ownerDocument||!workspace?.contains(host))throw new TypeError('History keys require an owned workspace host');
 const note=host.ownerDocument.createElement('p');note.textContent='Layout Undo: Ctrl/⌘+Z. Redo: Ctrl/⌘+Shift+Z or Ctrl/⌘+Y. Text fields keep their own editing shortcuts.';host.append(note);
 let disposed=false;
 function keydown(event){
  if(disposed||signal?.aborted||event.defaultPrevented||event.isComposing||event.altKey||!(event.ctrlKey||event.metaKey))return;
  const target=event.target;if(!workspace.contains(target))return;
  // Respect ordinary inputs, editor islands and editable ancestors, including shadow hosts.
  const path=event.composedPath?.()||[target];
  for(const node of path){
   if(node===workspace)break;
   if(node?.matches?.('input,textarea,select,[role="textbox"],[role="combobox"],[role="searchbox"]')||node?.isContentEditable||node?.closest?.('[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="searchbox"]'))return;
  }
  const key=String(event.key).toLowerCase(),redo=key==='y'||key==='z'&&event.shiftKey;
  if(key!=='z'&&key!=='y')return;
  const control=workspace.querySelector(redo?'[data-redo]':'[data-undo]');
  if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')return;
  event.preventDefault();event.stopPropagation();control.click();
 }
 function dispose(){if(disposed)return;disposed=true;workspace.removeEventListener('keydown',keydown);signal?.removeEventListener('abort',dispose);note.remove();}
 workspace.addEventListener('keydown',keydown);signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();
 return {dispose};
}
