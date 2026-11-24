// Source basis: reviewed MIT prototype-v24.ts toggleCleanView.
// Native adaptation: Foundry-only, explicit, session-only; never changes authoring state.
export function attachCanvasView({host,workspace,signal}){
 if(!host?.ownerDocument||!workspace?.contains(host))throw new TypeError('Canvas view requires its own workspace host');
 const doc=host.ownerDocument,previous=workspace.getAttribute('data-foundry-canvas-only');let active=false,disposed=false;
 host.classList.add('foundry-canvas-controls');
 const button=doc.createElement('button');button.type='button';button.dataset.canvasViewToggle='';
 const note=doc.createElement('span');note.textContent='Foundry canvas only. Athena navigation stays available. Escape restores controls; Tab keeps normal keyboard navigation.';
 host.replaceChildren(button,note);workspace.insertBefore(host,workspace.firstChild);
 function paint(){button.textContent=active?'Restore Foundry controls':'Canvas only';button.setAttribute('aria-pressed',String(active));if(active)workspace.setAttribute('data-foundry-canvas-only','true');else if(previous===null)workspace.removeAttribute('data-foundry-canvas-only');else workspace.setAttribute('data-foundry-canvas-only',previous);}
 function setActive(value){if(disposed||signal?.aborted)return;active=Boolean(value);paint();button.focus();}
 function toggle(){setActive(!active);}
 function keydown(event){if(!active||event.key!=='Escape'||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;event.preventDefault();event.stopPropagation();setActive(false);}
 function dispose(){if(disposed)return;disposed=true;active=false;if(previous===null)workspace.removeAttribute('data-foundry-canvas-only');else workspace.setAttribute('data-foundry-canvas-only',previous);button.removeEventListener('click',toggle);workspace.removeEventListener('keydown',keydown);signal?.removeEventListener('abort',dispose);host.replaceChildren();host.classList.remove('foundry-canvas-controls');}
 button.addEventListener('click',toggle);workspace.addEventListener('keydown',keydown);signal?.addEventListener('abort',dispose,{once:true});paint();if(signal?.aborted)dispose();
 return {dispose};
}
