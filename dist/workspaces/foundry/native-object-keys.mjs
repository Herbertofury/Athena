// Reviewed MIT prototype-v24.ts selected-object shortcuts, scoped to this native workspace.
export function attachObjectKeys({host,workspace,signal}) {
 if(!host?.ownerDocument||!workspace?.contains(host))throw new TypeError('Object keys require an owned workspace host');
 const doc=host.ownerDocument,note=doc.createElement('p');note.textContent='Right-click a room object or press Shift+F10 or the context menu key for navigation. Selected object: Ctrl/⌘+D duplicates; Delete removes. Undo restores edits. Text fields retain their own shortcuts.';host.append(note);
 let disposed=false,opener=null,menu=null,roomObserver=null;
 const ownedActor=node=>{const actor=node?.closest?.('button.foundry-object[data-id]');return actor&&workspace.contains(actor)&&!actor.closest('[hidden]')&&!actor.disabled?actor:null;};
 const shown=control=>control&&!control.disabled&&!control.closest('[hidden]')&&control.getAttribute('aria-disabled')!=='true';
 function closeActorContext(restore=false){
  if(!menu)return;
  // Removing a focused descendant synchronously dispatches focusout in Blink.
  // Release ownership first so that handler cannot remove the same DOM twice.
  const previous=opener,closing=menu;opener=null;menu=null;
  roomObserver?.disconnect();roomObserver=null;
  doc.removeEventListener('pointerdown',outside,true);
  closing.remove();
  if(restore&&ownedActor(previous)===previous)previous.focus({preventScroll:true});
 }
 const outside=e=>{if(!menu?.contains(e.target))closeActorContext();};
 const stop=e=>{e.preventDefault();e.stopPropagation();};
 function layerControl(actor){
  const layers=workspace.querySelector('[data-foundry-module="layers"]');
  for(const row of layers?.querySelectorAll('[data-layer-id]')||[]){
   const button=row.querySelector('button[data-layer-action="select"]');
   if(row.dataset.layerId===actor.dataset.id&&shown(button))return button;
  }
  return null;
 }
 function transformControl(){
  if(workspace.dataset.inspectorPlacement==='hidden')return null;
  const rotation=workspace.querySelector('[data-inspect-rotation]'),selection=workspace.querySelector('[data-inspect-object]');
  return shown(rotation)?rotation:shown(selection)?selection:null;
 }
 function openActorContext(actor,event,keyboard){
  // Preserve the browser menu where native destination controls are unavailable.
  if(!transformControl()&&!layerControl(actor))return false;
  closeActorContext();opener=actor;
  const surface=doc.createElement('div'),label=actor.querySelector('.foundry-object-label')?.textContent||actor.dataset.id;
  surface.dataset.foundryActorContext='';surface.setAttribute('role','menu');
  surface.setAttribute('aria-label',`Room object actions: ${label}`);
  for(const [label,available,inspect] of [['Inspect transform',transformControl(),true],['Reveal in Room layers',layerControl(actor),false]]){
   if(!available)continue;
   const button=doc.createElement('button');button.type='button';button.tabIndex=-1;button.setAttribute('role','menuitem');button.textContent=label;
   button.addEventListener('click',()=>{
    if(menu!==surface||opener!==actor||ownedActor(actor)!==actor){if(menu===surface)closeActorContext();return;}
    const select=workspace.querySelector('[data-inspect-object]');
    closeActorContext();
    // Existing actor selection is read-only; skip same-target repaints so drafts survive.
    if(inspect&&select?.value!==actor.dataset.id)actor.click();
    const destination=inspect?transformControl():layerControl(actor);
    if(destination)destination.focus();
    else if(ownedActor(actor)===actor)actor.focus({preventScroll:true});
   });
   surface.append(button);
  }
  menu=surface;host.append(surface);
  // A redraw replaces actor DOM nodes even if another room reuses the same ID.
  // Observe only while this ephemeral menu is open; the action also checks identity.
  if(doc.defaultView?.MutationObserver){
   roomObserver=new doc.defaultView.MutationObserver(()=>{if(!ownedActor(opener))closeActorContext();});
   roomObserver.observe(workspace,{childList:true,subtree:true});
  }
  surface.addEventListener('focusout',e=>{if(menu===surface&&!surface.contains(e.relatedTarget))closeActorContext();});
  surface.addEventListener('keydown',e=>{
   if(menu!==surface||e.defaultPrevented||e.isComposing)return;
   if(e.key==='Escape'){stop(e);closeActorContext(true);return;}
   if(e.ctrlKey||e.metaKey||e.altKey)return;
   const items=[...surface.querySelectorAll('[role="menuitem"]')],i=items.indexOf(e.target);
   const next=e.key==='Home'?0:e.key==='End'?items.length-1:e.key==='ArrowDown'?(i+1)%items.length:e.key==='ArrowUp'?(i+items.length-1)%items.length:null;
   if(next!==null){stop(e);items[next]?.focus();}
  });
  const viewport=doc.defaultView,rect=actor.getBoundingClientRect?.()||{};
  const xy=keyboard?[rect.left,rect.bottom]:[event.clientX,event.clientY];
  const pin=(position,extent,size)=>Math.max(8,Math.min(Number(position)||8,(extent||0)-(size||0)-8));
  surface.style.left=pin(xy[0],viewport?.innerWidth,surface.offsetWidth)+'px';
  surface.style.top=pin(xy[1],viewport?.innerHeight,surface.offsetHeight)+'px';
  doc.addEventListener('pointerdown',outside,true);
  surface.querySelector('[role="menuitem"]')?.focus({preventScroll:true});
  return true;
 }
 function contextmenu(event){
  if(disposed||signal?.aborted||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;
  const actor=ownedActor(event.target);
  if(actor&&openActorContext(actor,event,false))stop(event);
 }

 function keydown(event){
  if(disposed||signal?.aborted||event.defaultPrevented||event.isComposing||event.altKey||event.repeat)return;
  const target=event.target;if(!workspace.contains(target)||menu?.contains(target))return;
  const menuKey=!event.ctrlKey&&!event.metaKey&&((event.key==='F10'&&event.shiftKey)||(event.key==='ContextMenu'&&!event.shiftKey));
  if(menuKey){
   const actor=ownedActor(target);
   if(actor&&openActorContext(actor,event,true))stop(event);
   return;
  }
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
 function dispose(){if(disposed)return;disposed=true;closeActorContext();workspace.removeEventListener('keydown',keydown);workspace.removeEventListener('contextmenu',contextmenu);signal?.removeEventListener('abort',dispose);note.remove();}
 workspace.addEventListener('keydown',keydown);workspace.addEventListener('contextmenu',contextmenu);signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();
 return {dispose};
}
