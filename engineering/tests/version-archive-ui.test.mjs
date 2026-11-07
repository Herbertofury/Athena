import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createArchiveSelection} from '../apps/atlas-lab/ui/archive-view.mjs';
const source=readFileSync(new URL('../apps/atlas-lab/ui/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function mount(loader){
 const elements=new Map(),downloads=[],blobs=new Map(),timers=new Map();let timerId=0;
 const get=id=>{if(!elements.has(id)){const handlers=new Map(),button={disabled:false};elements.set(id,{value:id==='saved-archive-kind'?'version':id==='saved-archive-id'?'abcdefgh':'',textContent:'',disabled:false,open:false,handlers,classList:{add(){},remove(){}},addEventListener(type,fn){handlers.set(type,fn);},querySelector(){return button;},showModal(){this.open=true;},close(){this.open=false;this.handlers.get('close')?.();},set innerHTML(_){throw Error('Archive markup must remain inert');}});}return elements.get(id);};
 const context={document:{hidden:false,getElementById:get,querySelectorAll:()=>[],addEventListener(){},createElement(tag){assert.equal(tag,'a');return {click(){downloads.push({href:this.href,name:this.download});}};}},window:{addEventListener(){}},location:{hash:'#collectors'},createArchiveSelection,loadSavedArchive:loader,fetch:async()=>({ok:false,status:503}),AbortController,DOMException,Date,Blob,URL:{createObjectURL(blob){const key='blob:fixture-'+blobs.size;blobs.set(key,blob);return key;},revokeObjectURL(key){blobs.delete(key);}},setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},setInterval(){}};
 vm.runInNewContext(source,context);
 return {get,downloads,blobs,timers,submit:()=>get('saved-archive-form').handlers.get('submit')({preventDefault(){},currentTarget:get('saved-archive-form')})};
}
const raw='{"future":18446744073709551617,"markup":"<script>inert</script>","text":"雪"}',bytes=new TextEncoder().encode(raw);
const record={kind:'version',id:'abcdefgh',generation:'9007199254740993',hash:'a'.repeat(64),bytes,text:raw};
test('actual UI displays and downloads the verified version with its own namespace',async()=>{
 let request;const app=mount(async(kind,id,options)=>{request={kind,id,options};return record;});await settle();await app.submit();
 assert.equal(request.kind,'version');assert.equal(request.id,'abcdefgh');assert.equal(app.get('saved-archive-title').textContent,'version abcdefgh · generation 9007199254740993');assert.equal(app.get('saved-archive-text').textContent,raw);assert.equal(app.get('saved-archive-dialog').open,true);
 app.get('saved-archive-kind').value='project';app.get('download-saved-archive').handlers.get('click')();
 assert.equal(app.downloads[0].name,'modrinth-version-abcdefgh-generation-9007199254740993.json');assert.deepEqual(new Uint8Array(await app.blobs.get(app.downloads[0].href).arrayBuffer()),bytes);
 const revoke=[...app.timers.values()].find(t=>t.ms===1000);assert.ok(revoke);revoke.fn();assert.equal(app.blobs.size,0);
});
test('type change cancels a pending selection and retains the correctly labeled last good version',async()=>{
 let next=false,resolve,signal;const app=mount((_kind,_id,options)=>{if(!next)return Promise.resolve(record);signal=options.signal;return new Promise(r=>resolve=r);});await settle();await app.submit();next=true;app.get('saved-archive-kind').value='project';const pending=app.submit();
 app.get('saved-archive-kind').value='version';app.get('saved-archive-kind').handlers.get('change')();assert.equal(signal.aborted,true);assert.equal(app.get('saved-archive-form').querySelector().disabled,false);
 resolve({...record,kind:'project',text:'stale'});await pending;app.get('show-last-archive').handlers.get('click')();assert.equal(app.get('saved-archive-text').textContent,raw);assert.match(app.get('saved-archive-title').textContent,/^version /);assert.match(app.get('saved-archive-status').textContent,/type changed/);
});

test('closing the last-good viewer cancels pending work instead of reopening it later',async()=>{
 let next=false,resolve,signal;const app=mount((_kind,_id,options)=>{if(!next)return Promise.resolve(record);signal=options.signal;return new Promise(r=>resolve=r);});await settle();await app.submit();next=true;const pending=app.submit();app.get('show-last-archive').handlers.get('click')();app.get('close-saved-archive').handlers.get('click')();
 assert.equal(signal.aborted,true);resolve({...record,text:'late'});await pending;assert.equal(app.get('saved-archive-dialog').open,false);app.get('show-last-archive').handlers.get('click')();assert.equal(app.get('saved-archive-text').textContent,raw);
});

test('dialog cancel event also aborts a pending request',async()=>{
 let next=false,resolve,signal;const app=mount((_kind,_id,options)=>{if(!next)return Promise.resolve(record);signal=options.signal;return new Promise(r=>resolve=r);});await settle();await app.submit();next=true;const pending=app.submit();app.get('saved-archive-dialog').handlers.get('cancel')();assert.equal(signal.aborted,true);resolve({...record,text:'late'});await pending;assert.equal(app.get('saved-archive-text').textContent,raw);
});
test('upstream downloads keep their verified source label after the selector changes',async()=>{
 const upstream={...record,kind:'upstream',id:'serde-json'};const app=mount(async()=>upstream);await settle();app.get('saved-archive-kind').value='upstream';app.get('saved-archive-id').value='serde-json';await app.submit();app.get('saved-archive-kind').value='project';app.get('download-saved-archive').handlers.get('click')();assert.equal(app.downloads[0].name,'github-upstream-serde-json-generation-9007199254740993.json');assert.match(app.get('saved-archive-title').textContent,/^upstream serde-json /);assert.deepEqual(new Uint8Array(await app.blobs.get(app.downloads[0].href).arrayBuffer()),bytes);
});
