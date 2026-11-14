// Reviewed MIT prototype-v24.ts actor context-menu purpose, native actions only.
export function attachActorMenu({host,workspace,signal}) {
 if(!host?.ownerDocument||!workspace?.contains(host))throw new TypeError('Actor menu requires an owned workspace host');
 const doc=host.ownerDocument,win=doc.defaultView;let opener=null,disposed=false;
 const menu=doc.createElement('div');menu.className='foundry-actor-context';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Selected Foundry object');menu.hidden=true;doc.body.append(menu);
 const actions=[['duplicate','Duplicate','[data-instance-duplicate]'],['pin','Toggle position pin','[data-inspect-pin]'],['delete','Delete (Undo available)','[data-instance-delete]']];
 const buttons=actions.map(([action,label,selector])=>{const b=doc.createElement('button');b.type='button';b.textContent=label;b.setAttribute('role','menuitem');b.dataset.actorAction=action;b.onclick=()=>{
  const actor=opener,selected=workspace.querySelector('[data-inspect-object]');
  if(!actor||!workspace.contains(actor)||selected?.value!==actor.dataset.id){close(false);return;}
  const control=workspace.querySelector(selector);close(false);if(!control||control.disabled)return;
  control.click();if(workspace.contains(actor))actor.focus();else workspace.querySelector('[data-inspect-object]')?.focus();
 };menu.append(b);return b;});
 function close(restore=true){const prior=opener;opener=null;menu.hidden=true;if(restore&&prior&&workspace.contains(prior))prior.focus();}
 function open(event){if(disposed||signal?.aborted||event.defaultPrevented)return;const actor=event.target?.closest?.('.foundry-object[data-id]');if(!actor||!workspace.contains(actor))return;
  const select=workspace.querySelector('[data-inspect-object]');if(!select||![...select.options].some(o=>o.value===actor.dataset.id))return;
  event.preventDefault();event.stopPropagation();select.value=actor.dataset.id;select.dispatchEvent(new win.Event('change',{bubbles:true}));opener=actor;
  buttons.forEach((b,i)=>{const c=workspace.querySelector(actions[i][2]);b.disabled=!c||c.disabled;});
  menu.hidden=false;const r=actor.getBoundingClientRect(),pointer=event.type==='contextmenu'&&(event.clientX||event.clientY),x=pointer?event.clientX:r.left,y=pointer?event.clientY:r.bottom;
  const w=win.innerWidth||1024,h=win.innerHeight||768;menu.style.left=Math.max(8,Math.min(x,w-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(y,h-menu.offsetHeight-8))+'px';buttons.find(b=>!b.disabled)?.focus();
 }
 function workspaceKey(e){if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey&&!e.ctrlKey&&!e.metaKey&&!e.altKey)open(e);}
 function menuKey(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}if(e.key==='Tab'){close(false);return;}const active=buttons.filter(b=>!b.disabled);if(!active.length)return;const index=active.indexOf(doc.activeElement);let next;if(e.key==='Home')next=0;else if(e.key==='End')next=active.length-1;else if(e.key==='ArrowDown')next=(index+1)%active.length;else if(e.key==='ArrowUp')next=(index+active.length-1)%active.length;else return;e.preventDefault();active[next].focus();}
 function outside(e){if(!menu.hidden&&!menu.contains(e.target))close(false);}
 function dispose(){if(disposed)return;disposed=true;close(false);workspace.removeEventListener('contextmenu',open);workspace.removeEventListener('keydown',workspaceKey);doc.removeEventListener('pointerdown',outside);win?.removeEventListener('resize',outsideResize);signal?.removeEventListener('abort',dispose);menu.remove();}
 function outsideResize(){close(false);}
 workspace.addEventListener('contextmenu',open);workspace.addEventListener('keydown',workspaceKey);menu.addEventListener('keydown',menuKey);doc.addEventListener('pointerdown',outside);win?.addEventListener('resize',outsideResize);signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();return {dispose};
}
