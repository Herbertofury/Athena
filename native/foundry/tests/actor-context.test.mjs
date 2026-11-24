import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {parseHTML} from 'linkedom';
import {runtimeRoot} from './paths.mjs';

const asset=path.resolve(process.env.ATHENA_ACTOR_CONTEXT_PACKAGE||runtimeRoot,'workspaces/foundry');
async function setup(foundryModules,adjustCatalog){
 const {mount}=await import(pathToFileURL(path.join(asset,'index.mjs')).href);
 const catalog=JSON.parse(await fs.readFile(path.join(asset,'catalog.json'),'utf8'));
 adjustCatalog?.(catalog);
 const {document,window}=parseHTML('<html><body><button id="outside">Outside</button><main></main></body></html>');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||''},set(v){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===v)?.setAttribute('selected','')}});
 const writes=[],reads=[],oldFetch=globalThis.fetch,owned=new AbortController();
 let focus;
 const priorFocus=Object.getOwnPropertyDescriptor(window.HTMLElement.prototype,'focus');
 Object.defineProperty(window.HTMLElement.prototype,'focus',{configurable:true,value(){
  if(this===focus)return;
  const previous=focus;focus=this;
  if(previous){const event=new window.Event('focusout',{bubbles:true});event.relatedTarget=this;previous.dispatchEvent(event);}
  this.dispatchEvent(new window.Event('focusin',{bubbles:true}));
 }});
 globalThis.fetch=async u=>{const name=fileURLToPath(u);assert.equal(name,path.join(asset,'catalog.json'));reads.push(name);return {ok:true,json:async()=>catalog};};
 const dispose=()=>{owned.abort();globalThis.fetch=oldFetch;if(priorFocus)Object.defineProperty(window.HTMLElement.prototype,'focus',priorFocus);else delete window.HTMLElement.prototype.focus;};
 let mounted;
 try{mounted=await mount({container:document.querySelector('main'),signal:owned.signal,setState:value=>{writes.push(value);return true;},foundryModules});}
 catch(e){dispose();throw e;}
 const query=s=>document.querySelector(s),event=(el,type,props={})=>{const e=new window.Event(type,{cancelable:true,bubbles:true});Object.assign(e,props);el.dispatchEvent(e);return e;};
 return {query,event,mounted,dispose,writes,reads,get focus(){return focus;},actor:(i=1)=>document.querySelectorAll('button.foundry-object')[i],menu:()=>query('[data-foundry-actor-context]')};
}

test('actual packaged exact-actor right click and keyboard navigate without profile edits or save',async()=>{
 const s=await setup();
 try{
  const opening=s.actor(),selection=s.query('[data-inspect-object]'),rotation=s.query('[data-inspect-rotation]');
  const before=JSON.stringify(s.mounted.exportState());
  let event=s.event(opening,'contextmenu',{clientX:40,clientY:60});
  assert.equal(event.defaultPrevented,true,'right click must open native commands');
  let menu=s.menu();assert.ok(menu);
  assert.match(menu.getAttribute('aria-label'),new RegExp(opening.querySelector('.foundry-object-label').textContent));
  assert.equal(s.focus.textContent,'Inspect transform');
  assert.notEqual(selection.value,opening.dataset.id,'right click itself need not select actor');
  s.event(s.focus,'keydown',{key:'End'});
  assert.equal(s.focus.textContent,'Reveal in Room layers');
  s.focus.click();
  assert.equal(s.focus.closest('[data-layer-id]').dataset.layerId,opening.dataset.id);
  assert.notEqual(selection.value,opening.dataset.id,'revealing a row does not select or write it');
  event=s.event(opening,'keydown',{key:'F10',shiftKey:true});
  assert.equal(event.defaultPrevented,true,'Shift+F10 must open native commands');
  s.focus.click();
  assert.equal(selection.value,opening.dataset.id);assert.equal(s.focus,rotation);
  rotation.value='27';opening.focus();
  event=s.event(opening,'keydown',{key:'ContextMenu'});assert.equal(event.defaultPrevented,true);
  s.event(s.focus,'keydown',{key:'Escape'});
  assert.equal(s.menu(),null);assert.equal(s.focus,opening);assert.equal(rotation.value,'27');
  assert.equal(JSON.stringify(s.mounted.exportState()),before);
  assert.equal(s.writes.length,0);assert.equal(s.reads.length,1);
 }finally{s.dispose();}
});

test('stale menu cannot act on the same catalog ID after a user room change',async()=>{
 const s=await setup();
 try{
  const opening=s.actor();s.event(opening,'contextmenu');assert.ok(s.menu());
  const oldCommand=s.menu().querySelector('[role="menuitem"]');
  const room=s.query('[data-room-select]');room.value=room.options[1].value;s.event(room,'change');
  const replacement=s.actor();
  assert.equal(replacement.dataset.id,opening.dataset.id);assert.notEqual(replacement,opening);
  const before=JSON.stringify(s.mounted.exportState()),writes=s.writes.length;
  oldCommand.click();
  assert.equal(s.menu(),null);assert.equal(JSON.stringify(s.mounted.exportState()),before);assert.equal(s.writes.length,writes);
  assert.equal(s.event(replacement,'keydown',{key:'F10',shiftKey:true}).defaultPrevented,true);
  assert.ok(s.menu());
  s.mounted.unmount();assert.equal(s.menu(),null);
 }finally{s.dispose();}
});

test('profile and focus boundaries keep unavailable commands, shortcuts and native outside menus intact',async()=>{
 const allOff=Object.fromEntries('localImage sessionHistory objectKeys historyKeys canvasView cinema weather backup soundtrack legacyImport ecology assetLibrary localVideo gizmo environment semanticRoom tones layers themeAtlas'.split(' ').map(key=>[key,false]));
 const disabled=await setup(allOff);
 try{
  assert.equal(disabled.query('[data-foundry-module]'),null);
  assert.equal(disabled.event(disabled.actor(),'contextmenu').defaultPrevented,false);
  assert.equal(disabled.event(disabled.actor(),'keydown',{key:'F10',shiftKey:true}).defaultPrevented,false);
  assert.equal(disabled.menu(),null);assert.equal(disabled.writes.length,0);
 }finally{disabled.dispose();}
 const s=await setup({layers:false});
 try{
  const outside=s.query('#outside'),actor=s.actor();
  assert.equal(s.event(outside,'contextmenu').defaultPrevented,false);
  assert.equal(s.event(s.query('[data-inspect-rotation]'),'keydown',{key:'F10',shiftKey:true}).defaultPrevented,false);
  assert.equal(s.event(actor,'keydown',{key:'F10',shiftKey:true,altKey:true}).defaultPrevented,false);
  assert.equal(s.event(actor,'keydown',{key:'F10',shiftKey:true,repeat:true}).defaultPrevented,false);
  assert.equal(s.event(actor,'keydown',{key:'F10',shiftKey:true}).defaultPrevented,true);
  assert.equal(s.menu().querySelectorAll('[role="menuitem"]').length,1);
  s.event(s.focus,'keydown',{key:'Delete'});
  assert.equal(s.writes.length,0,'existing object edit shortcut not available inside read-only menu');
  const dock=s.query('[data-inspector-dock]');dock.value='hidden';s.event(dock,'change');await Promise.resolve();
  assert.equal(s.menu(),null);
  assert.equal(s.event(s.actor(),'contextmenu').defaultPrevented,false,'leave native browser menu if no destination can be reached');
 }finally{s.dispose();}
});

test('catalog actor text stays inert, and moving focus outside dismisses without a trapped key',async()=>{
 const literal='<img src="a" onerror="bad()"> & quoted';
 const s=await setup(undefined,catalog=>{catalog.themes[0].objects[1].name=literal;});
 try{
  const actor=s.actor();
  assert.equal(actor.querySelector('.foundry-object-label').textContent,literal);
  s.event(actor,'contextmenu');const menu=s.menu();assert.ok(menu);
  assert.equal(menu.getAttribute('aria-label'),'Room object actions: '+literal);
  assert.equal(menu.querySelector('img,script,iframe'),null);
  const tab=s.event(s.focus,'keydown',{key:'Tab'});assert.equal(tab.defaultPrevented,false);
  const outside=s.query('#outside');outside.focus();
  assert.equal(s.menu(),null);assert.equal(s.focus,outside);assert.equal(s.writes.length,0);
 }finally{s.dispose();}
});
