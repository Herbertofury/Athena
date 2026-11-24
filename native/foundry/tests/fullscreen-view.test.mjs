import assert from 'node:assert/strict';
import test from 'node:test';
import {parseHTML} from 'linkedom';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const packageRoot=process.env.ATHENA_FOUNDRY_FULLSCREEN_PACKAGE;
const modulePath=packageRoot?pathToFileURL(resolve(packageRoot,'workspaces/foundry/native-canvas-view.mjs')):
 new URL('../../../dist/workspaces/foundry/native-canvas-view.mjs',import.meta.url);
const {attachCanvasView}=await import(modulePath);

const flush=()=>new Promise(setImmediate);
function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 return {promise,resolve,reject};
}
function setup(supported=true){
 const {document,window}=parseHTML('<html><body><nav id="shell"><button>Outside</button></nav><section id="workspace"><section id="host"></section><button id="object">Object</button><input value="draft"><textarea></textarea><select></select><span role="textbox"></span><p contenteditable="true"><span id="editing">Draft</span></p></section></body></html>');
 const workspace=document.getElementById('workspace'),host=document.getElementById('host'),outside=document.getElementById('shell');
 const control=new AbortController(),states=[];
 let active=null;
 const change=next=>{active=next;document.dispatchEvent(new window.Event('fullscreenchange'));};
 Object.defineProperty(document,'fullscreenElement',{get:()=>active});
 const engine={enter:async()=>change(workspace),exit:async()=>change(null)};
 if(supported){
  Object.defineProperty(document,'fullscreenEnabled',{value:true,configurable:true});
  workspace.requestFullscreen=()=>{states.push('enter');return engine.enter();};
  document.exitFullscreen=()=>{states.push('exit');return engine.exit();};
 }
 const ui=attachCanvasView({host,workspace,signal:control.signal});
 const key=(target,fields={})=>{
  const event=new window.Event('keydown',{bubbles:true,cancelable:true});
  Object.assign(event,{key:'f',...fields});target.dispatchEvent(event);return event;
 };
 return {document,workspace,host,outside,control,states,change,engine,key,ui,
  full:host.querySelector('[data-foundry-fullscreen]'),message:()=>host.querySelector('[data-foundry-fullscreen-status]').textContent,
  canvas:host.querySelector('[data-canvas-view-toggle]')};
}

test('explicit fullscreen and the original F shortcut are scoped to Foundry, not Canvas only or the host',async()=>{
 const s=setup(),draft=s.workspace.querySelector('input');draft.value='unsaved edit';
 assert.ok(s.full,'Foundry exposes an explicit full-screen presentation button');
 assert.equal(s.full.getAttribute('aria-keyshortcuts'),'F');
 assert.equal(s.full.getAttribute('aria-pressed'),'false');
 assert.equal(s.key(s.outside.querySelector('button')).defaultPrevented,false);
 for(const target of [draft,s.workspace.querySelector('textarea'),s.workspace.querySelector('select'),s.workspace.querySelector('[role="textbox"]'),s.document.getElementById('editing')])
  assert.equal(s.key(target).defaultPrevented,false);
 for(const fields of [{repeat:true},{altKey:true},{ctrlKey:true},{metaKey:true},{shiftKey:true},{isComposing:true},{key:'g'}])
  assert.equal(s.key(s.workspace.querySelector('#object'),fields).defaultPrevented,false);
 assert.deepEqual(s.states,[]);
 s.full.click();await flush();
 assert.equal(s.document.fullscreenElement,s.workspace);
 assert.equal(s.full.getAttribute('aria-pressed'),'true');
 assert.equal(s.full.textContent,'Fullscreen');
 assert.match(s.message(),/Foundry is fullscreen/);
 assert.equal(s.workspace.hasAttribute('data-foundry-canvas-only'),false);
 assert.equal(s.key(s.workspace.querySelector('#object'),{key:'F'}).defaultPrevented,true);
 await flush();
 assert.equal(s.document.fullscreenElement,null);
 assert.equal(s.full.getAttribute('aria-pressed'),'false');
 assert.equal(s.full.textContent,'Fullscreen');
 assert.match(s.message(),/Foundry left fullscreen/);
 assert.equal(s.workspace.querySelector('input'),draft);
 assert.equal(draft.value,'unsaved edit');
 assert.deepEqual(s.states,['enter','exit']);
 s.ui.dispose();
});

test('browser Escape and Canvas only stay independent; unrelated fullscreen is never exited',async()=>{
 const s=setup();
 s.canvas.click();s.full.click();await flush();
 assert.equal(s.key(s.workspace,{key:'Escape'}).defaultPrevented,false,'leave browser Escape alone');
 assert.equal(s.canvas.getAttribute('aria-pressed'),'true');
 s.change(null); // browser, not app, exits fullscreen
 assert.equal(s.full.getAttribute('aria-pressed'),'false');
 assert.equal(s.canvas.getAttribute('aria-pressed'),'true');
 assert.equal(s.key(s.workspace,{key:'Escape'}).defaultPrevented,true);
 assert.equal(s.canvas.getAttribute('aria-pressed'),'false');
 s.change(s.outside);
 assert.equal(s.full.getAttribute('aria-disabled'),'true');
 assert.equal(s.key(s.workspace).defaultPrevented,false);
 s.full.click();s.control.abort();await flush();
 assert.equal(s.document.fullscreenElement,s.outside);
 assert.deepEqual(s.states,['enter']);
});

test('denied and rejected browser operations explain the boundary without breaking either presentation',async()=>{
 const s=setup(false);
 assert.equal(s.full.disabled,true);
 assert.match(s.message(),/not available/i);
 assert.equal(s.key(s.workspace).defaultPrevented,false);
 s.canvas.click();assert.equal(s.canvas.getAttribute('aria-pressed'),'true');
 s.ui.dispose();
 const browser=setup(true);
 browser.engine.enter=async()=>{throw Error('permission denied');};
 browser.full.click();await flush();
 assert.equal(browser.full.getAttribute('aria-pressed'),'false');
 assert.match(browser.message(),/could not enter/i);
 assert.doesNotMatch(browser.message(),/permission denied/i);
 browser.engine.enter=async()=>browser.change(browser.workspace);
 browser.full.click();await flush();
 browser.engine.exit=async()=>{throw Error('rejected');};
 browser.full.click();await flush();
 assert.equal(browser.full.getAttribute('aria-pressed'),'true');
 assert.match(browser.message(),/could not exit/i);
 browser.change(null);
 assert.equal(browser.full.getAttribute('aria-pressed'),'false');
 browser.ui.dispose();
});

test('discard late fullscreen work on workspace abort and never re-enter or exit a foreign owner',async()=>{
 const s=setup(),admission=deferred();
 s.engine.enter=async()=>{await admission.promise;s.change(s.workspace);};
 s.full.click();s.full.click();assert.deepEqual(s.states,['enter']);
 assert.equal(s.full.getAttribute('aria-disabled'),'true');
 const old=s.full;s.control.abort();assert.equal(s.host.children.length,0);
 admission.resolve();await flush();
 assert.deepEqual(s.states,['enter','exit']);
 assert.equal(s.document.fullscreenElement,null);
 old.click();
 assert.equal(s.key(s.workspace).defaultPrevented,false);
 assert.deepEqual(s.states,['enter','exit']);
 const other=setup(),foreign=deferred();
 other.engine.enter=async()=>{await foreign.promise;other.change(other.outside);};
 other.full.click();other.control.abort();foreign.resolve();await flush();
 assert.deepEqual(other.states,['enter']);
 assert.equal(other.document.fullscreenElement,other.outside);
});

test('aborting an active workspace leaves its own presentation only once and removes controls',async()=>{
 const s=setup();
 s.full.click();await flush();assert.equal(s.document.fullscreenElement,s.workspace);
 s.control.abort();s.ui.dispose();await flush();
 assert.deepEqual(s.states,['enter','exit']);
 assert.equal(s.document.fullscreenElement,null);
 assert.equal(s.host.children.length,0);
});
