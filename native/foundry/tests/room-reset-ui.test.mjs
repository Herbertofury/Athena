import {repoRoot,runtimeRoot,binaryPath,testTemp} from './paths.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';import {mount} from '../../../dist/workspaces/foundry/index.mjs';
const require=createRequire(new URL('../../../package.json',import.meta.url)),{parseHTML}=require('linkedom');const base=new URL('../../../dist/workspaces/foundry/',import.meta.url),catalog=JSON.parse(await fs.readFile(new URL('catalog.json',base)));const tick=()=>new Promise(r=>setImmediate(r));
async function setup(run=mount,options={}){const {document,window}=parseHTML('<html><body><main></main></body></html>');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||''},set(v){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===v)?.setAttribute('selected','')}});const controller=new AbortController(),notices=[],writes=[];const old=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>catalog});let mounted;try{mounted=await run({container:document.querySelector('main'),signal:controller.signal,notify:v=>notices.push(v),setState:v=>writes.push(v),...options});}finally{globalThis.fetch=old;}return {document,window,mounted,notices,writes,controller,time(v){const e=document.querySelector('[data-time]');e.value=v;e.dispatchEvent(new window.Event('change'))}};}
const allOff={cinema:false,weather:false,backup:false,soundtrack:false,legacyImport:false,ecology:false,localVideo:false,environment:false,semanticRoom:false,tones:false};
const select=(s,id)=>{const e=s.document.querySelector('[data-inspect-object]');e.value=id;e.dispatchEvent(new s.window.Event('change'));};
const one=(s,q)=>s.document.querySelector(q);
const state=s=>JSON.stringify(s.mounted.exportState());

test('room reset preserves scrapbook UI, schema envelope, Undo/Redo and reload',async()=>{
 const s=await setup(mount,{foundryModules:allOff});let persisted;
 try{
  one(s,'[data-inspect-scope]').value='sticker';one(s,'[data-inspect-anchor]').value='inspector';one(s,'[data-inspect-scope-apply]').click();
  one(s,'[data-instance-duplicate]').click();
  const before=JSON.parse(state(s));const sticker=Object.entries(before.active.placements).find(([,p])=>p.scope==='sticker');
  one(s,'[data-reset-room]').click();const after=JSON.parse(state(s));
  assert.deepEqual(after.active.placements[sticker[0]],sticker[1]);assert.equal(Object.values(after.active.placements).filter(p=>p.scope==='world').length,catalog.themes[0].objects.length);
  assert.equal(after.version,before.version);assert.equal(after.active.version,before.active.version);
  one(s,'[data-undo]').click();assert.deepEqual(JSON.parse(state(s)).active,before.active);
  one(s,'[data-redo]').click();assert.deepEqual(JSON.parse(state(s)).active,after.active);persisted=after;
 }finally{s.mounted.unmount();}
 const restored=await setup(mount,{foundryModules:allOff,state:persisted});try{assert.deepEqual(JSON.parse(state(restored)).active,persisted.active);}finally{restored.mounted.unmount();}
});
