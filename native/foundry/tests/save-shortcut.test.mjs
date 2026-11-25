import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseHTML} from 'linkedom';
import {runtimeRoot} from './paths.mjs';
const runtime=path.join(process.env.ATHENA_FOUNDRY_KEYS_PACKAGE||runtimeRoot,'workspaces/foundry');
const asset=name=>import(pathToFileURL(path.resolve(runtime,name+'.mjs')).href);
const settle=()=>new Promise(setImmediate);
async function setup({connected=true,saveHook}={}){
 const [{attachNativeBackup},{attachHistoryKeys},{createLayoutModel}]=await Promise.all(['native-backup','native-history-keys','layout-state'].map(asset));
 const {document,window}=parseHTML('<html><body><button id="outside">Outside</button><section id="foundry"><button id="actor">Actor</button><button data-undo>Undo</button><input id="draft"><div contenteditable="true"><span id="editor">Editor</span></div><div role="textbox"><span id="role-editor">Role editor</span></div><section id="keys"></section><section id="backup"></section></section></body></html>');
 const workspace=document.getElementById('foundry'),abort=new AbortController(),writes=[],changes=[];
 const model=createLayoutModel(JSON.parse(fs.readFileSync(path.join(runtime,'catalog.json'),'utf8')).themes);
 const snapshot=model.workspace({version:1,active:model.initial(),layouts:{}}),q=s=>document.querySelector(s);
 q('[data-undo]').onclick=()=>changes.push('undo');
 attachNativeBackup({host:q('#backup'),nativeStore:connected?{save:async v=>{writes.push(v);await saveHook?.();},load:async()=>assert.fail('must not load')}:null,
  model,snapshot:()=>snapshot,replace:()=>assert.fail('must not restore'),getRevision:()=>0,signal:abort.signal});
 attachHistoryKeys({host:q('#keys'),workspace,signal:abort.signal});
 function key(k='s',selector='#actor',mods={}){const e=new window.Event('keydown',{bubbles:true,cancelable:true});Object.assign(e,{key:k,ctrlKey:true,metaKey:false,isTrusted:true,...mods});q(selector).dispatchEvent(e);return e;}
 return {key,q,writes,changes,snapshot,abort,workspace};
}
test('source-compatible Ctrl and Meta + S delegate the same typed native backup action exactly once',async()=>{
 const view=await setup();try{
  assert.match(view.q('#keys').textContent,/Ctrl\/⌘\+S/);
  assert.equal(view.writes.length,0);
  assert.equal(view.key().defaultPrevented,true);await settle();assert.equal(view.writes.length,1);
  assert.deepEqual(JSON.parse(view.writes[0]),JSON.parse(JSON.stringify(view.snapshot)));
  assert.match(view.q('[data-native-status]').textContent,/Captured workspace saved to native SQLite/);
  assert.equal(view.key('S','#actor',{ctrlKey:false,metaKey:true}).defaultPrevented,true);await settle();assert.equal(view.writes.length,2);
  assert.equal(view.key('z').defaultPrevented,true);assert.deepEqual(view.changes,['undo']);
 }finally{view.abort.abort();}
});
test('pending or held key cannot reenter native backup or fall through to browser page save',async()=>{
 let finish;
 const view=await setup({saveHook:()=>new Promise(r=>finish=r)});try{
  assert.equal(view.key('s','[data-native-save]').defaultPrevented,true);assert.equal(view.writes.length,1);
  assert.equal(view.q('[data-native-save]').disabled,true);
  assert.equal(view.key('s','#actor',{repeat:true}).defaultPrevented,true);
  assert.equal(view.key('s','#actor').defaultPrevented,true);assert.equal(view.writes.length,1);
  finish();await settle();
  assert.equal(view.key('s','#actor',{repeat:true}).defaultPrevented,true);assert.equal(view.writes.length,1);
 }finally{view.abort.abort();}
});
test('untrusted, edit, modifier, disconnected, hidden, canvas-only and unrelated shortcuts stay untouched',async()=>{
 const view=await setup(),unconnected=await setup({connected:false});try{
  for(const key of ['#outside','#draft','#editor','#role-editor'])assert.equal(view.key('s',key).defaultPrevented,false);
  for(const mods of [{isTrusted:false},{altKey:true},{shiftKey:true},{isComposing:true},{metaKey:true},{ctrlKey:false},{repeat:true}])
   assert.equal(view.key('s','#actor',mods).defaultPrevented,false);
  view.q('#backup').hidden=true;assert.equal(view.key().defaultPrevented,false);view.q('#backup').hidden=false;
  view.workspace.dataset.foundryCanvasOnly='true';assert.equal(view.key().defaultPrevented,false);
  assert.equal(unconnected.key().defaultPrevented,false);
  assert.deepEqual([...view.writes,...unconnected.writes],[]);
 }finally{view.abort.abort();unconnected.abort.abort();}
});
test('disposed shortcut performs no actions even on retained workspace elements',async()=>{
 const view=await setup();view.abort.abort();
 assert.equal(view.key().defaultPrevented,false);assert.deepEqual(view.writes,[]);assert.equal(view.q('#keys').children.length,0);
});
