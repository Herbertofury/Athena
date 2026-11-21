const {test}=require('node:test'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const fields={name:'Project',ownership:'own',stage:'idea',goal:'A goal',next:'',blockers:'',decisions:'',resources:'',source:'',version:'',release:''};
async function setup(save=()=>true,state){const {document}=parseHTML('<html><body><section></section></body></html>');global.document=document;const container=document.querySelector('section'),controller=new AbortController(),calls=[];const {mount}=await import('../dist/workspaces/projects/index.mjs');const mounted=mount({container,state,setState:(data,options)=>{calls.push([structuredClone(data),options]);return save(data);},signal:controller.signal});const root=container.shadowRoot;return {root,calls,mounted,controller,confirm(){root.querySelector('#backup-confirm').onclick();},cancel(){root.querySelector('#backup-cancel').onclick();},load(file){return root.querySelector('#import').onchange({target:{files:[file],value:''}});}};}
async function backup(id){const {empty,change}=await import('../dist/workspaces/projects/model.mjs');return change(empty(),id,{...fields,name:id},1);}
const file=data=>({size:100,arrayBuffer:async()=>new TextEncoder().encode(JSON.stringify(data)).buffer});
test('preview shows added names but never writes until explicit confirmation; duplicates and conflicts never write',async()=>{const x=await setup(),data=await backup('a');await x.load(file(data));assert.equal(x.calls.length,0);assert.equal(x.root.querySelector('#backup-review').hidden,false);assert.equal(x.root.querySelector('#backup-projects li').textContent,'a');assert.ok(!x.root.querySelector('[data-project="a"]'));x.confirm();assert.equal(x.calls.length,1);assert.equal(x.calls[0][1].reviewedProjectBackup,'{"schema":1,"entries":[]}');assert.ok(x.root.querySelector('[data-project="a"]'));await x.load(file(data));assert.equal(x.calls.length,1);assert.match(x.root.querySelector('#notice').textContent,/adds nothing/);data.entries[0].revisions[0].name='Conflict';await x.load(file(data));assert.equal(x.calls.length,1);assert.match(x.root.querySelector('#notice').textContent,/Import refused/);x.mounted.unmount();});
test('cancel discards pending review; a new file selection supersedes a slow one',async()=>{const x=await setup();await x.load(file(await backup('cancel')));x.cancel();x.confirm();assert.equal(x.calls.length,0);assert.match(x.root.querySelector('#notice').textContent,/canceled/);let resolve;const pending=x.load({size:100,arrayBuffer:()=>new Promise(r=>resolve=r)});await x.load(file(await backup('new')));resolve(await file(await backup('old')).arrayBuffer());await pending;x.confirm();assert.equal(x.calls.length,1);assert.equal(x.calls[0][0].entries[0].id,'new');x.mounted.unmount();});
test('navigation cancels delayed import and invalid stored schema never writes',async()=>{const x=await setup();let resolve;const pending=x.load({size:100,arrayBuffer:()=>new Promise(r=>resolve=r)});x.controller.abort();resolve(await file(await backup('a')).arrayBuffer());await pending;assert.equal(x.calls.length,0);const y=await setup(()=>true,{schema:99});assert.equal(y.mounted.ready,false);assert.equal(y.root.querySelector('#new').disabled,true);assert.equal(y.calls.length,0);y.mounted.unmount();});
test('storage refusal does not promote imported rows or export them as saved',async()=>{const x=await setup(()=>{throw Error('quota');},await backup('kept'));await x.load(file(await backup('a')));x.confirm();assert.match(x.root.querySelector('#notice').textContent,/not confirmed.*quota/);assert.equal(x.root.querySelector('[data-project="a"]'),null);assert.ok(x.root.querySelector('[data-project="kept"]'));let exported;const old=URL.createObjectURL;URL.createObjectURL=b=>{exported=b;return 'blob:test';};try{x.root.querySelector('#export').onclick();assert.deepEqual(JSON.parse(await exported.text()).entries.map(x=>x.id),['kept']);}finally{URL.createObjectURL=old;x.mounted.unmount();}});
test('changing project data in the same tab after review discards stale import',async()=>{const x=await setup(()=>true,await backup('kept'));await x.load(file(await backup('new')));x.root.querySelector('[data-project="kept"] button').onclick();const archive=[...x.root.querySelectorAll('#detail button')].find(b=>b.textContent==='Archive project');archive.onclick();x.confirm();assert.equal(x.calls.length,1);assert.equal(x.calls[0][0].entries[0].archived,true);assert.match(x.root.querySelector('#notice').textContent,/changed after review/);x.mounted.unmount();});

test('selected export includes exactly one durable revision history and refuses a stale selected project',async()=>{
 const one=await backup('selected'), other=await backup('excluded');
 one.entries[0].revisions[0].source='https://example.invalid/history';
 const durable=structuredClone(one.entries[0]);
 const source={schema:1,entries:[...one.entries,...other.entries],workspaceMetadata:'must not leave'};
 const {document}=parseHTML('<html><body><section></section></body></html>');
 global.document=document;
 const {mount}=await import('../dist/workspaces/projects/index.mjs'), container=document.querySelector('section');
 let saved=durable, writes=0, blob;
 const oldCreate=URL.createObjectURL, oldRevoke=URL.revokeObjectURL;
 URL.createObjectURL=b=>{blob=b;return 'blob:fixture';};URL.revokeObjectURL=()=>{};
 const mounted=mount({container,state:source,readSavedProject:id=>id==='selected'?saved:null,setState:()=>{writes++;return true;}});
 try{
  const root=container.shadowRoot, q=s=>root.querySelector(s);
  const review=()=>{q('[data-project="selected"] button').onclick();q('[data-transfer-project="selected"]').onclick();};
  review();assert.equal(q('#transfer-review').hidden,false);
  const expected=q('#transfer-json').textContent;
  assert.deepEqual(JSON.parse(expected),one);assert.equal(blob,undefined);
  q('#transfer-cancel').onclick();assert.equal(q('#transfer-review').hidden,true);
  review();saved={...durable,archived:true};q('#transfer-save').onclick();
  assert.equal(blob,undefined);assert.match(q('#notice').textContent,/Saved project changed/);
  saved=durable;review();q('#transfer-save').onclick();
  assert.equal(await blob.text(),expected);assert.equal(writes,0);
 }finally{mounted.unmount();URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
});

test('24-card pages retain order, current detail and focus; search reaches unrendered matches',async()=>{
 const {browse}=await import('../dist/workspaces/projects/model.mjs');
 const state={schema:1,entries:Array.from({length:100},(_,n)=>({
  id:'p-'+String(n).padStart(3,'0'),archived:n%27===26,
  revisions:Array.from({length:6},(_,r)=>({...fields,name:'Sample project '+n,goal:n===0?'Deep specific match':'Shared project text.',at:Math.floor(n/2)*6+r}))
 }))};
 const expected=browse(state).map(p=>p.id);
 const x=await setup(()=>true,state),q=s=>x.root.querySelector(s);
 const doc=x.root.host.ownerDocument;
 const previousFocus=doc.defaultView.HTMLElement.prototype.focus;
 let focused;
 doc.defaultView.HTMLElement.prototype.focus=function(){focused=this;};
 try {
  const cards=()=>[...x.root.querySelectorAll('[data-project]')].map(n=>n.dataset.project);
  const count=q('#count'), more=q('#more');
  assert.equal(count.getAttribute('role'),'status');
  assert.equal(more.getAttribute('aria-controls'),'cards');
  assert.equal(more.textContent,'Show next 24 projects');
  assert.match(count.textContent,/Showing 24 of 97 matching/);
  assert.deepEqual(cards(),expected.slice(0,24));
  const first=q('[data-project]');first.querySelector('button').onclick();
  const detail=q('#detail h3');assert.equal(focused,detail);
  more.onclick();assert.equal(focused.closest('[data-project]').dataset.project,expected[24]);
  assert.equal(q('#detail h3'),detail);assert.equal(q('[data-project]'),first);
  while(!more.hidden)more.onclick();
  assert.deepEqual(cards(),expected);
  assert.match(count.textContent,/Showing 97 of 97 matching/);
  const target=expected[71];
  q('[data-project="'+target+'"] button').onclick();
  assert.equal(focused,q('#detail h3'));
  assert.equal(x.root.querySelectorAll('#detail pre').length,6);
  x.mounted.setSearch('');
  assert.equal(q('[data-project]'),first);
  x.mounted.setSearch('deep specific match');
  assert.deepEqual(cards(),['p-000']);assert.equal(more.hidden,true);
  x.mounted.setSearch('not found');assert.deepEqual(cards(),[]);assert.equal(more.hidden,true);
  x.mounted.setSearch('');assert.deepEqual(cards(),expected.slice(0,24));
  assert.equal(x.calls.length,0);
 } finally {
  doc.defaultView.HTMLElement.prototype.focus=previousFocus;x.mounted.unmount();
 }
});
