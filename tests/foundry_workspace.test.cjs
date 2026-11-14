const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parseHTML}=require('linkedom');
const root=path.join(__dirname,'..');const catalog=JSON.parse(fs.readFileSync(path.join(root,'dist/workspaces/foundry/catalog.json')));
async function setup(state){const {document,window}=parseHTML('<html><body><main></main></body></html>');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||'';},set(value){for(const o of this.options)o.removeAttribute('selected');const selected=[...this.options].find(o=>o.value===value);if(selected)selected.setAttribute('selected','');}});const old=global.fetch;global.fetch=async()=>({ok:true,json:async()=>catalog});let writes=0;const control=new AbortController();const mod=await import('../dist/workspaces/foundry/index.mjs');try{const mounted=await mod.mount({container:document.querySelector('main'),signal:control.signal,state,setState(){writes++;}});return {document,window,mounted,control,writes:()=>writes};}finally{global.fetch=old;}}
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
test('native forms retain labels and reviewed palettes update with theme selection',async()=>{
 const t=await setup(),scene=t.document.querySelector('.foundry-scene');assert.equal(t.document.querySelectorAll('.foundry-object-form[aria-hidden=true]').length,5);
 assert.equal(scene.style.getPropertyValue('--foundry-color-0'),catalog.themes[0].colors[0]);
 for(const b of t.document.querySelectorAll('.foundry-object')){assert.ok(['orb','tower','console','chair','sign'].includes(b.dataset.shape));assert.ok(b.querySelector('.foundry-object-label').textContent);assert.match(b.style.left,/clamp/);}
 const select=t.document.querySelector('[data-theme-select]');select.value=catalog.themes[1].id;select.dispatchEvent(new t.window.Event('change'));
 assert.equal(scene.style.getPropertyValue('--foundry-color-0'),catalog.themes[1].colors[0]);t.mounted.unmount();
});
test('undo and redo restore edits and later edits discard redo',async()=>{
 const t=await setup(),time=t.document.querySelector('[data-time]'),undo=t.document.querySelector('[data-undo]'),redo=t.document.querySelector('[data-redo]');
 assert.equal(undo.disabled,true);time.value='night';time.dispatchEvent(new t.window.Event('change'));undo.click();assert.equal(t.mounted.exportState().active.time,'day');assert.equal(redo.disabled,false);redo.click();assert.equal(t.mounted.exportState().active.time,'night');
 undo.click();time.value='dusk';time.dispatchEvent(new t.window.Event('change'));assert.equal(redo.disabled,true);t.mounted.unmount();
});
test('undo of imported workspace restores all previous room state and rejects stale reads',async()=>{
 const t=await setup(),initial=t.mounted.exportState().active,second={...initial,roomId:catalog.themes[0].rooms[1].id,time:'night'},input=t.document.querySelector('[data-import-workspace]');
 input.files=[{size:100,text:async()=>JSON.stringify({version:1,active:second,layouts:{}})}];input.dispatchEvent(new t.window.Event('change'));await new Promise(r=>setImmediate(r));assert.equal(t.mounted.exportState().active.roomId,second.roomId);
 let resolve;input.files=[{size:100,text:()=>new Promise(r=>resolve=r)}];input.dispatchEvent(new t.window.Event('change'));t.document.querySelector('[data-undo]').click();resolve(JSON.stringify({version:1,active:second,layouts:{}}));await new Promise(r=>setImmediate(r));assert.equal(t.mounted.exportState().active.roomId,initial.roomId);assert.equal(t.mounted.exportState().layouts[second.roomId],undefined);t.mounted.unmount();
});
test('rollback cannot clear corrupt-state recovery hold',async()=>{
 const t=await setup({version:2}),time=t.document.querySelector('[data-time]');time.value='night';time.dispatchEvent(new t.window.Event('change'));t.document.querySelector('[data-undo]').click();assert.equal(t.writes(),0);assert.throws(()=>t.mounted.exportState(),/retained/);t.mounted.unmount();
});

test('room reset is reversible, preserves other rooms/time, and repeated reset is a no-op',async()=>{
 const t=await setup(),room=t.document.querySelector('[data-room-select]'),time=t.document.querySelector('[data-time]');
 const move=()=>{const b=t.document.querySelector('.foundry-object');for(const key of ['ArrowRight','p']){const e=new t.window.Event('keydown',{bubbles:true,cancelable:true});e.key=key;b.dispatchEvent(e);}};
 move();const first=t.mounted.exportState().active;room.value=catalog.themes[0].rooms[1].id;room.dispatchEvent(new t.window.Event('change'));time.value='night';time.dispatchEvent(new t.window.Event('change'));move();const before=t.mounted.exportState();
 t.document.querySelector('[data-reset-room]').click();let state=t.mounted.exportState();assert.equal(Object.keys(state.active.placements).length,0);assert.equal(state.active.time,'night');assert.deepEqual(state.layouts[first.roomId],first);const writes=t.writes();t.document.querySelector('[data-reset-room]').click();assert.equal(t.writes(),writes);
 t.document.querySelector('[data-undo]').click();assert.deepEqual(t.mounted.exportState(),before);t.document.querySelector('[data-redo]').click();assert.equal(Object.keys(t.mounted.exportState().active.placements).length,0);t.mounted.unmount();
});
test('reset invalidates pending imports without releasing corrupt-state protection',async()=>{
 const t=await setup({version:2}),b=t.document.querySelector('.foundry-object');const e=new t.window.Event('keydown',{bubbles:true,cancelable:true});e.key='ArrowRight';b.dispatchEvent(e);
 let resolve;const input=t.document.querySelector('[data-import]');input.files=[{size:100,text:()=>new Promise(r=>resolve=r)}];input.dispatchEvent(new t.window.Event('change'));t.document.querySelector('[data-reset-room]').click();resolve(JSON.stringify({version:1,themeId:catalog.themes[0].id,roomId:catalog.themes[0].rooms[0].id,time:'night',placements:{}}));await new Promise(r=>setImmediate(r));assert.equal(t.document.querySelector('[data-time]').value,'day');assert.equal(t.writes(),0);assert.throws(()=>t.mounted.exportState(),/retained/);t.mounted.unmount();
});

test('default-room reset cancels pending room and workspace imports without writes/history',async()=>{
 for(const selector of ['[data-import]','[data-import-workspace]']){
  const t=await setup(),original=t.mounted.exportState(),active={...original.active,time:'night'},input=t.document.querySelector(selector);let resolve;
  input.files=[{size:100,text:()=>new Promise(r=>resolve=r)}];input.dispatchEvent(new t.window.Event('change'));t.document.querySelector('[data-reset-room]').click();resolve(JSON.stringify(selector==='[data-import]'?active:{version:1,active,layouts:{}}));await new Promise(r=>setImmediate(r));assert.deepEqual(t.mounted.exportState(),original);assert.equal(t.writes(),0);assert.equal(t.document.querySelector('[data-undo]').disabled,true);t.mounted.unmount();
 }
});
test('inspector applies exact placement atomically, supports pin and undo, and rejects invalid values',async()=>{
 const t=await setup(),q=s=>t.document.querySelector(s),choose=q('[data-inspect-object]');choose.value=catalog.themes[0].objects[1].id;choose.dispatchEvent(new t.window.Event('change'));const id=choose.value;
 q('[data-inspect-x]').value='42.75';q('[data-inspect-y]').value='63.25';q('[data-inspect-apply]').click();assert.deepEqual(t.mounted.exportState().active.placements[id],{x:.4275,y:.6325,pinned:false});
 for(const value of ['', '-1','101','Infinity','bad']){const writes=t.writes();q('[data-inspect-x]').value=value;q('[data-inspect-apply]').click();assert.equal(t.writes(),writes);assert.equal(t.mounted.exportState().active.placements[id].x,.4275);}
 q('[data-inspect-pin]').checked=true;q('[data-inspect-pin]').dispatchEvent(new t.window.Event('change'));assert.equal(q('[data-inspect-apply]').disabled,true);assert.equal(t.mounted.exportState().active.placements[id].pinned,true);q('[data-undo]').click();assert.equal(t.mounted.exportState().active.placements[id].pinned,false);q('[data-undo]').click();assert.equal(t.mounted.exportState().active.placements[id],undefined);t.mounted.unmount();
});
test('inspector reflects scene selection and resets selection safely when theme changes',async()=>{
 const t=await setup(),q=s=>t.document.querySelector(s),b=t.document.querySelectorAll('.foundry-object')[2];b.click();assert.equal(q('[data-inspect-object]').value,b.dataset.id);const event=new t.window.Event('keydown',{bubbles:true,cancelable:true});event.key='ArrowRight';b.dispatchEvent(event);assert.equal(Number(q('[data-inspect-x]').value),81);
 const select=q('[data-theme-select]');select.value=catalog.themes[1].id;select.dispatchEvent(new t.window.Event('change'));assert.equal(q('[data-inspect-object]').value,catalog.themes[1].objects[0].id);assert.equal(q('[data-inspect-pin]').checked,false);t.mounted.unmount();
});
