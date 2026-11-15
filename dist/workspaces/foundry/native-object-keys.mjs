// Reviewed MIT prototype-v24.ts selected-object shortcuts, scoped to this native workspace.
export function attachObjectKeys({host,workspace,signal}) {
 if(!host?.ownerDocument||!workspace?.contains(host))throw new TypeError('Object keys require an owned workspace host');
 const note=host.ownerDocument.createElement('p');note.textContent='Selected object: Ctrl/⌘+D duplicates; Delete removes. Undo restores edits. Text fields retain their own shortcuts.';host.append(note);
 let disposed=false;
 function keydown(event){
  if(disposed||signal?.aborted||event.defaultPrevented||event.isComposing||event.altKey||event.repeat)return;
  const target=event.target;if(!workspace.contains(target))return;
  // Respect ordinary inputs, editor islands and editable ancestors, including shadow hosts.
  const path=event.composedPath?.()||[target];
  for(const node of path){
   if(node===workspace)break;
   if(node?.matches?.('input,textarea,select,[role="textbox"],[role="combobox"],[role="searchbox"]')||node?.isContentEditable||node?.closest?.('[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="searchbox"]'))return;
  }
  const key=String(event.key).toLowerCase();
  const duplicate=key==='d'&&(event.ctrlKey||event.metaKey)&&!event.shiftKey;
  const remove=key==='delete'&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey;
  if(!duplicate&&!remove)return;
  const control=workspace.querySelector(duplicate?'[data-instance-duplicate]':'[data-instance-delete]');
  if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')return;
  event.preventDefault();event.stopPropagation();control.click();
 }
 function dispose(){if(disposed)return;disposed=true;workspace.removeEventListener('keydown',keydown);signal?.removeEventListener('abort',dispose);note.remove();}
 workspace.addEventListener('keydown',keydown);signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();
 return {dispose};
}
