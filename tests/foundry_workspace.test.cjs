const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parseHTML}=require('linkedom');
const root=path.join(__dirname,'..');const catalog=JSON.parse(fs.readFileSync(path.join(root,'dist/workspaces/foundry/catalog.json')));
async function setup(state){const {document,window}=parseHTML('<html><body><main></main></body></html>');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||'';},set(value){for(const o of this.options)o.selected=o.value===value;}});const old=global.fetch;global.fetch=async()=>({ok:true,json:async()=>catalog});let writes=0;const control=new AbortController();const mod=await import('../dist/workspaces/foundry/index.mjs');try{const mounted=await mod.mount({container:document.querySelector('main'),signal:control.signal,state,setState(){writes++;}});return {document,window,mounted,control,writes:()=>writes};}finally{global.fetch=old;}}
test('reviewed neutral catalog preserves all seventeen themes and 85 ecology objects',()=>{assert.equal(catalog.themes.length,17);assert.equal(catalog.themes.reduce((n,t)=>n+t.rooms.length,0),34);assert.equal(catalog.themes.reduce((n,t)=>n+t.objects.length,0),85);assert.doesNotMatch(JSON.stringify(catalog),/https?:|provenance|driveFileId|sourceDriveFileId|local_filename|accessToken|refreshToken/);});
test('native mount, search and abort dispose owned DOM without iframe',async()=>{const t=await setup();assert.equal(t.document.querySelectorAll('.foundry-object').length,5);assert.equal(t.document.querySelectorAll('iframe').length,0);assert.equal(t.document.querySelectorAll('[data-theme-select] option').length,17);t.mounted.setSearch('not-existing');assert.equal(t.document.querySelectorAll('.foundry-object').length,0);t.mounted.setSearch('');assert.equal(t.document.querySelectorAll('.foundry-object').length,5);t.control.abort();assert.equal(t.document.querySelector('main').children.length,0);t.mounted.unmount();});
test('keyboard placement survives export and remount',async()=>{const t=await setup();const b=t.document.querySelector('.foundry-object');const event=new t.window.Event('keydown',{bubbles:true,cancelable:true});event.key='ArrowRight';b.dispatchEvent(event);const state=t.mounted.exportState();assert.ok(Math.abs(state.active.placements[b.dataset.id].x-.17)<1e-10);assert.equal(t.writes(),1);t.mounted.unmount();const restored=await setup(state);assert.ok(Math.abs(restored.mounted.exportState().active.placements[b.dataset.id].x-.17)<1e-10);restored.mounted.unmount();});
test('invalid saved state is not silently replaced on teardown',async()=>{const t=await setup({version:1,active:{bad:true}});assert.throws(()=>t.mounted.exportState(),/retained/);assert.equal(t.writes(),0);t.mounted.unmount();});
test('unsupported envelopes and mismatched layout keys remain recovery-held',async()=>{const first=await setup();const good=first.mounted.exportState();first.mounted.unmount();for(const state of [{version:2},null,{version:1},{...good,layouts:{wrong:good.active}}]){const t=await setup(state);assert.throws(()=>t.mounted.exportState(),/retained/);assert.equal(t.writes(),0);t.mounted.unmount();}});
test('latest import wins and older read cannot clear a newer selection',async()=>{const t=await setup();const input=t.document.querySelector('[data-import]');let a,b;const make=time=>JSON.stringify({...t.mounted.exportState().active,time});input.files=[{size:100,text:()=>new Promise(r=>a=r)}];input.dispatchEvent(new t.window.Event('change'));input.files=[{size:100,text:()=>new Promise(r=>b=r)}];input.dispatchEvent(new t.window.Event('change'));b(make('night'));await new Promise(r=>setImmediate(r));a(make('dawn'));await new Promise(r=>setImmediate(r));assert.equal(t.mounted.exportState().active.time,'night');t.mounted.unmount();});
test('newer room editing invalidates an outstanding import',async()=>{const t=await setup();const input=t.document.querySelector('[data-import]');let resolve;const original=t.mounted.exportState().active;input.files=[{size:100,text:()=>new Promise(r=>resolve=r)}];input.dispatchEvent(new t.window.Event('change'));const time=t.document.querySelector('[data-time]');time.value='night';time.dispatchEvent(new t.window.Event('change'));resolve(JSON.stringify({...original,time:'dawn'}));await new Promise(r=>setImmediate(r));assert.equal(t.mounted.exportState().active.time,'night');t.mounted.unmount();});
test('workspace restore updates included rooms and retains independent room layouts',async()=>{
 const t=await setup();const original=t.mounted.exportState().active;
 const second={...original,roomId:catalog.themes[0].rooms[1].id,time:'night'};
 const input=t.document.querySelector('[data-import-workspace]');
 input.files=[{size:100,text:async()=>JSON.stringify({version:1,active:second,layouts:{[second.roomId]:second}})}];
 input.dispatchEvent(new t.window.Event('change'));await new Promise(r=>setImmediate(r));
 const saved=t.mounted.exportState();assert.equal(saved.active.roomId,second.roomId);assert.equal(saved.layouts[original.roomId].time,'day');assert.equal(saved.layouts[second.roomId].time,'night');
 t.mounted.unmount();const remount=await setup(saved);assert.deepEqual(remount.mounted.exportState(),saved);remount.mounted.unmount();
});
test('malformed workspace restore is atomic and later room edit supersedes pending restore',async()=>{
 const t=await setup();const original=t.mounted.exportState();const input=t.document.querySelector('[data-import-workspace]');
 input.files=[{size:100,text:async()=>JSON.stringify({...original,layouts:{bad:original.active}})}];
 input.dispatchEvent(new t.window.Event('change'));await new Promise(r=>setImmediate(r));
 assert.deepEqual(t.mounted.exportState(),original);assert.equal(t.writes(),0);
 let resolve;input.files=[{size:100,text:()=>new Promise(r=>resolve=r)}];input.dispatchEvent(new t.window.Event('change'));
 const time=t.document.querySelector('[data-time]');time.value='night';time.dispatchEvent(new t.window.Event('change'));
 resolve(JSON.stringify(original));await new Promise(r=>setImmediate(r));assert.equal(t.mounted.exportState().active.time,'night');t.mounted.unmount();
});
test('workspace recovery does not discard an invalid original envelope',async()=>{
 const t=await setup({version:2});const input=t.document.querySelector('[data-import-workspace]');
 input.files=[{size:100,text:async()=>'{bad'}];input.dispatchEvent(new t.window.Event('change'));await new Promise(r=>setImmediate(r));assert.throws(()=>t.mounted.exportState(),/retained/);
 const initial=(await import('../dist/workspaces/foundry/layout-state.mjs')).createLayoutModel(catalog.themes).initial();
 input.files=[{size:100,text:async()=>JSON.stringify({version:1,active:initial,layouts:{}})}];input.dispatchEvent(new t.window.Event('change'));await new Promise(r=>setImmediate(r));assert.throws(()=>t.mounted.exportState(),/retained/);assert.equal(t.writes(),0);t.mounted.unmount();
});
test('unmount prevents pending workspace restore from writing',async()=>{
 const t=await setup();const state=t.mounted.exportState();let resolve;const input=t.document.querySelector('[data-import-workspace]');input.files=[{size:100,text:()=>new Promise(r=>resolve=r)}];input.dispatchEvent(new t.window.Event('change'));t.control.abort();resolve(JSON.stringify(state));await new Promise(r=>setImmediate(r));assert.equal(t.writes(),0);
});

test('mixed corrupt envelope retains the original after workspace or single-room imports',async()=>{
 const m=(await import('../dist/workspaces/foundry/layout-state.mjs')).createLayoutModel(catalog.themes),active=m.initial(),other=m.initial(catalog.themes[1].id);
 for(const selector of ['[data-import-workspace]','[data-import]']){
 const t=await setup({version:1,active,layouts:{broken:{},[other.roomId]:other}});
 const input=t.document.querySelector(selector);input.files=[{size:100,text:async()=>JSON.stringify(selector.includes('workspace')?{version:1,active,layouts:{}}:active)}];input.dispatchEvent(new t.window.Event('change'));await new Promise(r=>setImmediate(r));assert.equal(t.writes(),0);assert.throws(()=>t.mounted.exportState(),/retained/);assert.match(t.document.querySelector('.foundry-status').textContent,/recovery only/);t.mounted.unmount();
 }
});
