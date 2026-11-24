import {repoRoot,runtimeRoot,binaryPath,testTemp,pythonCommand} from './paths.mjs';
import {mount} from '../../../dist/workspaces/foundry/index.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';import {spawn,execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
import {attachNativeBackup} from '../../../dist/workspaces/foundry/native-backup.mjs';import {createLayoutModel} from '../../../dist/workspaces/foundry/layout-state.mjs';
const require=createRequire(new URL('../../../package.json',import.meta.url)),{parseHTML}=require('linkedom');
const root=path.resolve(import.meta.dirname,'..'),bin=binaryPath;
test('actual DOM adapter to actual HTTP bridge to fixed CLI SQLite and restore',async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'athena-native-ui-test-')),db=path.join(tmp,'fixture.sqlite');execFileSync(bin,['init',db]);execFileSync(bin,['upgrade-history',db]);execFileSync(bin,['upgrade-soundtracks',db]);
 const child=spawn(pythonCommand,[path.join(root,'bridge.py'),'--binary',bin,'--database',db],{stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',b=>stderr+=b);
 const exited=new Promise(resolve=>child.on('exit',resolve));let controller;
 try {
  const origin=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Bridge startup timeout '+stderr)),10000);child.stdout.on('data',b=>{text+=b;if(text.includes('\n')){clearTimeout(timer);resolve(new URL(text.trim()).origin)}});child.on('error',reject);child.on('exit',()=>{clearTimeout(timer);reject(Error('Bridge exited '+stderr))});});
  const sandbox={location:new URL(origin),fetch:(url,options)=>fetch(new URL(url,origin),{...options,headers:{...options.headers,Origin:origin}})};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(runtimeRoot,'native-store-bootstrap.js'),'utf8'),sandbox);
  const themes=JSON.parse(fs.readFileSync(path.join(runtimeRoot,'workspaces/foundry/catalog.json'))).themes,model=createLayoutModel(themes);let current=model.workspace({version:1,active:model.initial(),layouts:{},view:{inspectorDock:'left',inspectorWidth:320}}),revision=0;
  const expected=model.encodeWorkspace(current),{document}=parseHTML('<html><body><section></section></body></html>'),host=document.querySelector('section');controller=attachNativeBackup({host,model,nativeStore:sandbox.AthenaNativeStore,snapshot:()=>current,replace:v=>{current=v;revision++},getRevision:()=>revision});
  async function settled(){for(let i=0;i<200;i++){if(!host.querySelector('[data-native-save]').disabled)return;await new Promise(r=>setTimeout(r,20));}throw Error('Native adapter did not settle');}
  host.querySelector('[data-native-save]').click();await settled();assert.match(host.querySelector('[data-native-status]').textContent,/saved to native SQLite/);
  const native=JSON.parse(execFileSync(bin,['load-backup',db],{encoding:'utf8'}));assert.deepEqual(native,JSON.parse(expected));
  const sandbox2={location:new URL(origin),fetch:sandbox.fetch};vm.createContext(sandbox2);vm.runInContext(fs.readFileSync(path.join(runtimeRoot,'native-store-bootstrap.js'),'utf8'),sandbox2);
  const host2=document.createElement('section');let second={...current,view:{inspectorDock:'right',inspectorWidth:180}},secondRevision=0;
  const adapter2=attachNativeBackup({host:host2,model,nativeStore:sandbox2.AthenaNativeStore,snapshot:()=>second,replace:v=>{second=v;secondRevision++},getRevision:()=>secondRevision});
  async function settle2(){for(let i=0;i<200;i++){if(!host2.querySelector('[data-native-save]').disabled)return;await new Promise(r=>setTimeout(r,20));}throw Error('Second client timed out');}
  try {
   const before=fs.readFileSync(db);host2.querySelector('[data-native-save]').click();await settle2();assert.match(host2.querySelector('[data-native-status]').textContent,/Save conflict/);assert.equal(second.view.inspectorDock,'right');assert.deepEqual(fs.readFileSync(db),before);
   host2.querySelector('[data-native-load]').click();await settle2();assert.equal(model.encodeWorkspace(second),expected);
   second={...second,view:{inspectorDock:'right',inspectorWidth:180}};secondRevision++;
   host2.querySelector('[data-native-save]').click();await settle2();assert.match(host2.querySelector('[data-native-status]').textContent,/saved to native SQLite/);
   host.querySelector('[data-native-save]').click();await settled();assert.match(host.querySelector('[data-native-status]').textContent,/Save conflict/);
   // Explicitly restore latest before any further first-client save; no automatic overwrite.
   host.querySelector('[data-native-load]').click();await settled();assert.equal(current.view.inspectorDock,'right');
   current=model.parseWorkspace(expected);revision++;host.querySelector('[data-native-save]').click();await settled();assert.match(host.querySelector('[data-native-status]').textContent,/saved to native SQLite/);
  } finally {adapter2.dispose();}
  // Real retained history selection through DOM, bridge and verified CLI read.
  host.querySelector('[data-native-history]').click();await settled();assert.match(host.querySelector('[data-native-status]').textContent,/Select a revision/);
  const rows=JSON.parse(execFileSync(bin,['revisions',db],{encoding:'utf8'}));const oldest=rows.at(-1).id;
  const selector=host.querySelector('[data-native-revisions]');for(const o of selector.querySelectorAll('option'))o.selected=Number(o.value)===oldest;
  host.querySelector('[data-native-recover]').click();await settled();assert.match(host.querySelector('[data-native-status]').textContent,/recovered to native storage/);assert.equal(model.encodeWorkspace(current),expected);
  const recoveredRows=JSON.parse(execFileSync(bin,['revisions',db],{encoding:'utf8'}));assert.equal(recoveredRows[0].event,'restore');assert.equal(recoveredRows[0].source_revision,oldest);
  // A second writer changes storage after listing. Recovery must not erase it or browser edits.
  const external=JSON.parse(expected);external.view={inspectorDock:'right',inspectorWidth:180};execFileSync(bin,['save-backup',db],{input:JSON.stringify(external)});
  const bytes=fs.readFileSync(db),browserBefore=model.encodeWorkspace(current);
  host.querySelector('[data-native-recover]').click();await settled();assert.match(host.querySelector('[data-native-status]').textContent,/Save conflict/);assert.equal(model.encodeWorkspace(current),browserBefore);assert.deepEqual(fs.readFileSync(db),bytes);
  host.querySelector('[data-native-load]').click();await settled();current=model.parseWorkspace(expected);revision++;host.querySelector('[data-native-save]').click();await settled();
  current={...current,view:{inspectorDock:'right',inspectorWidth:180}};revision++;
  host.querySelector('[data-native-load]').click();await settled();assert.equal(model.encodeWorkspace(current),expected);assert.match(host.querySelector('[data-native-status]').textContent,/restored/);
  const t=themes[0],assignment={theme_id:t.id,room_id:t.rooms[0].id,provider:'spotify',url:'https://open.spotify.com/track/synthetic',label:'Synthetic public bookmark',status:'USER_ASSIGNED',source_id:null};execFileSync(bin,['assign-native',db],{input:JSON.stringify(assignment)});
  const main=document.createElement('main');document.body.append(main);const previousFetch=globalThis.fetch;let workspace;const abort=new AbortController();
  const {window}=parseHTML('<html></html>');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||'';},set(value){for(const o of this.options)o.removeAttribute('selected');const found=[...this.options].find(o=>o.value===value);if(found)found.setAttribute('selected','');}});
  async function soundtrackSettled(){for(let i=0;i<200;i++){if(!main.querySelector('[data-soundtrack-refresh]').disabled)return;await new Promise(r=>setTimeout(r,20));}throw Error('Soundtrack not settled');}
  try {globalThis.fetch=async(url,opts)=>String(url).endsWith('/catalog.json')?{ok:true,json:async()=>({themes})}:previousFetch(url,opts);workspace=await mount({container:main,signal:abort.signal,nativeStore:sandbox.AthenaNativeStore,setState(){}});await soundtrackSettled();const link=main.querySelector('[data-soundtrack-detail] a');assert.equal(link.getAttribute('href'),assignment.url);assert.equal(link.getAttribute('rel'),'noopener noreferrer');assert.match(main.textContent,/Bookmark only, not playback/);
   const stale=await sandbox2.AthenaNativeStore.soundtrack(t.id,t.rooms[0].id);sandbox2.AthenaNativeStore.acceptSoundtrack(t.id,t.rooms[0].id,stale);
   const editLabel=main.querySelector('[data-soundtrack-label]');editLabel.value='Edited in mounted UI';editLabel.dispatchEvent(new window.Event('input'));main.querySelector('[data-soundtrack-save]').click();await soundtrackSettled();assert.match(main.querySelector('[data-soundtrack-status]').textContent,/saved locally/);
   const written=JSON.parse(execFileSync(bin,['read-native',db,t.id,t.rooms[0].id],{encoding:'utf8'}));assert.equal(written.assignment.label,'Edited in mounted UI');assert.equal(written.assignment.status,'USER_ASSIGNED');assert.equal(written.assignment.source_id,null);
   await assert.rejects(sandbox2.AthenaNativeStore.assignSoundtrack({theme_id:t.id,room_id:t.rooms[0].id,provider:'spotify',url:assignment.url,label:'Stale client'}),e=>e.code==='NATIVE_CONFLICT');
   const room=main.querySelector('[data-room-select]');room.value=t.rooms[1].id;room.dispatchEvent(new window.Event('change'));await soundtrackSettled();assert.equal(main.querySelector('[data-soundtrack-detail] a'),null);assert.match(main.querySelector('[data-soundtrack-status]').textContent,/No native soundtrack/);
   const theme=main.querySelector('[data-theme-select]');theme.value=themes[1].id;theme.dispatchEvent(new window.Event('change'));await soundtrackSettled();assert.equal(workspace.exportState().active.themeId,themes[1].id);assert.match(main.querySelector('[data-soundtrack-status]').textContent,/No native soundtrack/);
  } finally {globalThis.fetch=previousFetch;workspace?.unmount();}

 } finally {controller?.dispose();child.kill('SIGTERM');await exited;fs.rmSync(tmp,{recursive:true,force:true});}
});
