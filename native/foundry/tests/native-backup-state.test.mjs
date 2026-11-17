import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {mount} from '../../../dist/workspaces/foundry/index.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../../dist/workspaces/foundry/catalog.json',import.meta.url)));
const tick=()=>new Promise(r=>setImmediate(r));
test('mounted native backup comparison follows edits Undo Redo and explicit restore without background I/O',async()=>{
 const {document,window}=parseHTML('<html><body><main></main></body></html>');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||'';},set(v){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===v)?.setAttribute('selected','');}});
 let stored=null,saves=0,loads=0;const oldFetch=globalThis.fetch,abort=new AbortController();let api;
 globalThis.fetch=async()=>({ok:true,json:async()=>catalog});
 try{api=await mount({container:document.querySelector('main'),signal:abort.signal,setState:()=>true,nativeStore:{save:async text=>{saves++;stored=text;},load:async()=>{loads++;return stored;}},foundryModules:{cinema:false,weather:false,soundtrack:false,ecology:false}});}finally{globalThis.fetch=oldFetch;}
 const q=s=>document.querySelector(s),comparison=()=>q('[data-native-comparison]').textContent;
 try{
  assert.match(comparison(),/unknown/);assert.equal(saves+loads,0);
  q('[data-preset-name]').value='Initial room';q('[data-preset-save]').click();
  q('[data-native-save]').click();await tick();assert.match(comparison(),/matches/);
  q('[data-preset-name]').value='Renamed room';q('[data-preset-rename]').click();assert.match(comparison(),/differs/);
  assert.equal(JSON.parse(stored).savedLayouts[0].name,'Initial room');
  q('[data-undo]').click();assert.match(comparison(),/matches/);
  q('[data-redo]').click();assert.match(comparison(),/differs/);assert.equal(api.exportState().savedLayouts[0].name,'Renamed room');
  q('[data-undo]').click();assert.match(comparison(),/matches/);

  q('[data-time]').value='night';q('[data-time]').dispatchEvent(new window.Event('change'));assert.match(comparison(),/differs/);
  q('[data-undo]').click();assert.match(comparison(),/matches/);
  q('[data-redo]').click();assert.match(comparison(),/differs/);assert.equal(saves,1);assert.equal(loads,0);
  q('[data-native-load]').click();await tick();assert.match(comparison(),/matches/);assert.equal(api.exportState().active.time,'day');assert.equal(loads,1);
  q('[data-undo]').click();assert.match(comparison(),/differs/);assert.equal(api.exportState().active.time,'night');
  assert.equal(saves,1);assert.equal(loads,1);
 }finally{api.unmount();}
});
