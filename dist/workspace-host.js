(function(root){'use strict';
// Owns lifecycle only. Workspace modules own their domain behavior and resource cleanup.
function createHost({load,context={},onError=()=>{}}){
 let generation=0,searchVersion=0,active=null,pending=null,query='',theme='dark',route='',cleanup=Promise.resolve(),updates=Promise.resolve();
 const disposals=new WeakMap(),stateSavers=new WeakMap();
 function dispose(value){
  if(!value||!['object','function'].includes(typeof value))return Promise.resolve();
  if(disposals.has(value))return disposals.get(value);
  const result=Promise.resolve().then(async()=>{try{if(value.exportState&&stateSavers.has(value)){const saved=await value.exportState();if(saved!==undefined)await stateSavers.get(value)(saved);}}catch(error){onError(error);}try{await value.unmount?.();}catch(error){onError(error);}});
  disposals.set(value,result);return result;
 }
 function clear(){generation++;pending?.abort();pending=null;const old=active,previousUpdates=updates;active=null;cleanup=cleanup.then(async()=>{await previousUpdates;await dispose(old);});return cleanup;}
 function enqueue(method,value){const instance=active,token=generation;if(!instance)return;const result=updates.then(()=>{if(token!==generation||active!==instance)return;return instance[method]?.(value);});updates=result.catch(()=>{});return result;}
 async function open(id,container,initial={}){
  clear();const token=generation;const controller=new AbortController();pending=controller;
  let instance=null;const initialSearchVersion=++searchVersion;
  query=String(initial.search||'');theme=initial.theme==='light'?'light':'dark';route=String(initial.route||'');
  try{
   await cleanup;
   if(token!==generation||controller.signal.aborted)return false;
   const module=await load(id);
   if(token!==generation||controller.signal.aborted)return false;
   if(typeof module.mount!=='function')throw Error('Workspace does not provide mount().');
   const restored=typeof initial.getState==='function'?await initial.getState():initial.state;
   if(token!==generation||controller.signal.aborted)return false;
   if(initialSearchVersion===searchVersion&&typeof initial.getSearch==='function')query=String(initial.getSearch(restored,route)||'');
   const mountedRoute=route;
   instance=await module.mount({...context,container,search:query,theme,signal:controller.signal,state:restored,route:mountedRoute,setState:initial.setState});
   if(token!==generation||controller.signal.aborted){await dispose(instance);return false;}
   if(!instance||typeof instance.unmount!=='function')throw Error('Workspace must return an unmount() function.');
   if(typeof initial.setState==='function')stateSavers.set(instance,initial.setState);
   active=instance;
   updates=Promise.resolve();
   await enqueue('setSearch',query);
   if(token!==generation)return false;
   await enqueue('setTheme',theme);
   if(token!==generation)return false;
   if(route!==mountedRoute)await enqueue('setRoute',route);
   return token===generation&&instance.ready!==false;
  }catch(error){
   if(token!==generation||controller.signal.aborted)return false;
   controller.abort();if(pending===controller)pending=null;
   if(active===instance)active=null;
   const previousUpdates=updates;
   cleanup=cleanup.then(async()=>{await previousUpdates;await dispose(instance);});
   await cleanup;
   if(token!==generation)return false;
   onError(error);throw error;
  }
 }
 function setSearch(value){searchVersion++;const next=String(value);if(next===query)return;query=next;return enqueue('setSearch',query);}
 function setTheme(value){theme=value==='light'?'light':'dark';return enqueue('setTheme',theme);}
 function setRoute(value){const next=String(value||'');if(next===route)return;route=next;return enqueue('setRoute',route);}
 return {open,clear,setSearch,setTheme,setRoute};
}
function isEditingEvent(event,doc){
 const path=typeof event.composedPath==='function'?event.composedPath():[event.target];
 let active=doc?.activeElement;while(active){path.push(active);active=active.shadowRoot?.activeElement;}
 return path.some(node=>node&&(['INPUT','TEXTAREA','SELECT'].includes(node.tagName)||node.isContentEditable||(node.hasAttribute?.('contenteditable')&&node.getAttribute('contenteditable')!=='false')||['textbox','searchbox','combobox','spinbutton'].includes(node.getAttribute?.('role'))||(node.tagName==='DIALOG'&&node.open)));
}
root.AthenaWorkspaceHost={createHost,isEditingEvent};if(typeof module!=='undefined'&&module.exports)module.exports=root.AthenaWorkspaceHost;
})(typeof globalThis!=='undefined'?globalThis:this);
