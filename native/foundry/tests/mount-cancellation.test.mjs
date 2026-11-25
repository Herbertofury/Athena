import {repoRoot,runtimeRoot,binaryPath,testTemp} from './paths.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';import {mount} from '../../../dist/workspaces/foundry/index.mjs';
const require=createRequire(new URL('../../../package.json',import.meta.url)),{parseHTML}=require('linkedom');const base=new URL('../../../dist/workspaces/foundry/',import.meta.url),catalog=JSON.parse(await fs.readFile(new URL('catalog.json',base)));const tick=()=>new Promise(r=>setImmediate(r));
async function setup(run=mount,options={}){const {document,window}=parseHTML('<html><body><main></main></body></html>');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||''},set(v){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===v)?.setAttribute('selected','')}});const controller=new AbortController(),notices=[],writes=[];const old=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>catalog});let mounted;try{mounted=await run({container:document.querySelector('main'),signal:controller.signal,notify:v=>notices.push(v),setState:v=>writes.push(v),...options});}finally{globalThis.fetch=old;}return {document,window,mounted,notices,writes,controller,time(v){const e=document.querySelector('[data-time]');e.value=v;e.dispatchEvent(new window.Event('change'))}};}
const allOff={cinema:false,weather:false,backup:false,soundtrack:false,legacyImport:false,ecology:false,localVideo:false,environment:false};
async function fixture(){const dir=await fs.mkdtemp(testTemp('foundry-module-fixture-'));for(const name of ['index.mjs','layout-state.mjs'])await fs.copyFile(new URL(name,base),path.join(dir,name));return {dir,run:(await import(pathToFileURL(path.join(dir,'index.mjs')))).mount};}

test('abort during attachment disposes returned component and cannot resurrect module',async()=>{const primed=await setup(mount,{foundryModules:allOff});primed.mounted.unmount();const f=await fixture();try{await fs.writeFile(path.join(f.dir,'cinematic.mjs'),`export function attachCinematic({host}){host.ownerDocument.defaultView.abortDuringAttach();host.ownerDocument.body.dataset.fixtureListener='registered';return {dispose(){host.ownerDocument.body.dataset.fixtureListener='removed'}}}`);const controller=new AbortController();const {document,window}=parseHTML('<html><body><main></main></body></html>');window.abortDuringAttach=()=>controller.abort();const old=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>catalog});let mounted;try{mounted=await f.run({container:document.querySelector('main'),signal:controller.signal,foundryModules:{...allOff,cinema:true}})}finally{globalThis.fetch=old}assert.equal(document.body.dataset.fixtureListener,'removed');assert.equal(document.querySelector('main').children.length,0);assert.equal(mounted.getModuleStates().cinema,'disposed');}finally{await fs.rm(f.dir,{recursive:true})}});
test('abort while optional import is pending fences late rejection and later components',async()=>{const f=await fixture();let release,started;const begin=new Promise(r=>started=r);globalThis.__foundryImportGate=()=>{started();return new Promise(r=>release=r)};try{await fs.writeFile(path.join(f.dir,'cinematic.mjs'),`await globalThis.__foundryImportGate();throw Error('late fixture import failure');`);const controller=new AbortController();const pending=setup(f.run,{signal:controller.signal,foundryModules:{environment:false}});await begin;controller.abort();release();const s=await pending;assert.equal(s.document.querySelector('main').children.length,0);assert.deepEqual(s.notices,[]);assert.equal(s.mounted.getModuleStates().cinema,'disposed');assert.equal(s.mounted.getModuleStates().weather,undefined);s.mounted.setSearch('late');s.mounted.setTheme('light');assert.equal(s.writes.length,0);assert.equal(s.document.querySelector('main').children.length,0);}finally{delete globalThis.__foundryImportGate;await fs.rm(f.dir,{recursive:true})}});
test('repeated real mount/unmount cancels pending native restore and preserves state',async()=>{for(let i=0;i<5;i++){let release,request;const s=await setup(mount,{nativeStore:{save:async()=>{},load:({signal})=>{request=signal;return new Promise(r=>release=r)}}});const before=s.mounted.exportState();s.document.querySelector('[data-native-load]').click();s.controller.abort();assert.equal(request.aborted,true);release(JSON.stringify({...before,active:{...before.active,time:'night'}}));await tick();assert.equal(s.writes.length,0);assert.equal(s.document.querySelector('main').children.length,0);s.mounted.unmount();s.mounted.setSearch('test');assert.deepEqual(s.mounted.exportState(),before)}});
test('late successful import cannot attach after navigation cancellation',async()=>{const f=await fixture();let release,started;const begin=new Promise(r=>started=r);globalThis.__foundrySuccessGate=()=>{started();return new Promise(r=>release=r)};globalThis.__foundryLateAttached=0;try{await fs.writeFile(path.join(f.dir,'cinematic.mjs'),`await globalThis.__foundrySuccessGate();export function attachCinematic(){globalThis.__foundryLateAttached++;return {dispose(){}}}`);const controller=new AbortController(),pending=setup(f.run,{signal:controller.signal,foundryModules:{environment:false}});await begin;controller.abort();release();const s=await pending;assert.equal(globalThis.__foundryLateAttached,0);assert.equal(s.document.querySelector('main').children.length,0);assert.equal(s.writes.length,0)}finally{delete globalThis.__foundrySuccessGate;delete globalThis.__foundryLateAttached;await fs.rm(f.dir,{recursive:true})}});

test('startup limits concurrent imports, then mounts in stable order and cancels queued work', {timeout:5000},async()=>{
 const modules=[
  ['environment','native-environment.mjs','attachEnvironment'],
  ['cinema','cinematic.mjs','attachCinematic'],
  ['canvasView','native-canvas-view.mjs','attachCanvasView'],
  ['objectKeys','native-object-keys.mjs','attachObjectKeys'],
  ['sessionHistory','native-session-history.mjs','attachSessionHistory'],
  ['historyKeys','native-history-keys.mjs','attachHistoryKeys']
 ];
 const enabled=Object.fromEntries(modules.map(([name])=>[name,true]));
 const off=['backup','soundtrack','legacyImport','localImage','localVideo','assetLibrary','gizmo','layers','tones','semanticRoom','weather','ecology'];
 for(const name of off)enabled[name]=false;
 for(const cancel of [false,true]){
  const f=await fixture(),controller=new AbortController(),attached=[],started=[];
  let pending;
  const signals=new Map(modules.map(([name])=>{
   let seen,release;const visible=new Promise(r=>seen=r),unblock=new Promise(r=>release=r);
   return [name,{seen,release,visible,unblock}];
  }));
  try{
   globalThis.__foundryFixtureImport=name=>{started.push(name);const s=signals.get(name);s.seen();return s.unblock};
   globalThis.__foundryFixtureAttach=name=>attached.push(name);
   for(const [name,file,fn] of modules)await fs.writeFile(path.join(f.dir,file),
    `await globalThis.__foundryFixtureImport('${name}');export function ${fn}(){globalThis.__foundryFixtureAttach('${name}');return {dispose(){}}}`);
   pending=setup(f.run,{signal:controller.signal,foundryModules:enabled});
   await Promise.all(modules.slice(0,4).map(([n])=>signals.get(n).visible));
   assert.deepEqual([...started].sort(),modules.slice(0,4).map(x=>x[0]).sort());
   assert.deepEqual(attached,[]);
   if(cancel){
    controller.abort();
    const result=await pending;
    assert.deepEqual(attached,[]);assert.deepEqual(result.writes,[]);
    assert.equal(result.document.querySelector('main').childElementCount,0);
    for(const [name] of modules.slice(0,4))signals.get(name).release();
    await tick();assert.equal(started.length,4);
   }else{
    signals.get('objectKeys').release();await signals.get('sessionHistory').visible;
    assert.deepEqual(attached,[]);
    for(const signal of signals.values())signal.release();
    const result=await pending;
    assert.deepEqual(attached,modules.map(x=>x[0]));
    assert.deepEqual(result.writes,[]);result.mounted.unmount();
   }
  }finally{controller.abort();for(const signal of signals.values())signal.release();await pending?.catch(()=>{});delete globalThis.__foundryFixtureImport;delete globalThis.__foundryFixtureAttach;await fs.rm(f.dir,{recursive:true,force:true});}
 }
});
