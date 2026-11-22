const {test}=require('node:test'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const fields={name:'Project',ownership:'own',stage:'idea',goal:'A goal',next:'',blockers:'',decisions:'',resources:'',source:'',version:'',release:''};
async function setup(save=()=>true,state){const {document}=parseHTML('<html><body><section></section></body></html>');global.document=document;const container=document.querySelector('section'),controller=new AbortController(),calls=[];const {mount}=await import('../dist/workspaces/projects/index.mjs');const mounted=mount({container,state,setState:(data,options)=>{calls.push([structuredClone(data),options]);return save(data,options);},signal:controller.signal});const root=container.shadowRoot;return {root,calls,mounted,controller,confirm(){root.querySelector('#backup-confirm').onclick();},cancel(){root.querySelector('#backup-cancel').onclick();},load(file){return root.querySelector('#import').onchange({target:{files:[file],value:''}});}};}
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
  revisions:Array.from({length:6},(_,r)=>({...fields,name:'Sample project '+n,goal:n===0?'Deep specific match':n===3&&r===0?'Deep historical match':'Shared project text.',at:Math.floor(n/2)*6+r}))
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
  const raw=q('#saved-history');assert.equal(raw.querySelectorAll('pre').length,0);
  raw.open=true;raw.ontoggle();assert.equal(raw.querySelectorAll('pre').length,6);
  x.mounted.setSearch('');
  assert.equal(q('[data-project]'),first);
  x.mounted.setSearch('deep specific match');
  assert.deepEqual(cards(),['p-000']);assert.equal(more.hidden,true);
  x.mounted.setSearch('not found');assert.deepEqual(cards(),[]);assert.equal(more.hidden,true);
  x.mounted.setSearch('deep historical match');assert.deepEqual(cards(),[]);
  q('#history-search').onchange({target:{value:'history'}});assert.deepEqual(cards(),['p-003']);
  q('#history-search').onchange({target:{value:'current'}});assert.deepEqual(cards(),[]);
  x.mounted.setSearch('');assert.deepEqual(cards(),expected.slice(0,24));
  assert.equal(x.calls.length,0);
 } finally {
  doc.defaultView.HTMLElement.prototype.focus=previousFocus;x.mounted.unmount();
 }
});

test('workspace focus rings keep the dark color and clear 3:1 on known light surfaces',()=>{
 const {readFileSync}=require('node:fs'),{join}=require('node:path');
 const css=readFileSync(join(__dirname,'../dist/workspaces/projects/style.css'),'utf8');
 const shell=readFileSync(join(__dirname,'../dist/styles.css'),'utf8');
 const dark=css.match(/^:host\{([^}]+)\}/)[1];
 const light=css.match(/:host\(\[data-theme=light\]\)\{color:([^}]+)\}/)[1];
 const color=(block,name)=>block.match(new RegExp('--'+name+':(#[a-f0-9]{6})','i'))[1];
 const luma=hex=>hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255)
  .map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4)
  .reduce((total,c,i)=>total+c*[0.2126,0.7152,0.0722][i],0);
 const contrast=(a,b)=>{const nums=[luma(a)+0.05,luma(b)+0.05];return Math.max(...nums)/Math.min(...nums);};
 const darkRing=color(dark,'focus-outline'),lightRing=color(light,'accent');
 assert.equal(darkRing,'#bdb0ff');
 assert.match(light,/--focus-outline:var\(--accent\)/);
 assert.match(css,/h3\[tabindex="-1"\]:focus-visible\{outline:3px solid var\(--focus-outline\);outline-offset:3px\}/);
 assert.match(css,/@media\(forced-colors:active\)\{:host,:host\(\[data-theme=light\]\)\{--focus-outline:CanvasText\}\}/);
 assert.doesNotMatch(css,/forced-color-adjust\s*:\s*none/);
 const darkPanel=color(dark,'panel'),lightPanel=color(light,'panel');
 const lightHero=css.match(/:host\(\[data-theme=light\]\) header\{background:(#[a-f0-9]{6})\}/i)[1];
 const lightBackdrop=color(shell.match(/body\.light\{([^}]+)\}/)[1],'bg');
 assert.ok(contrast(darkRing,darkPanel)>=3);
 for(const surface of [lightPanel,lightHero,lightBackdrop]){
  assert.ok(contrast(darkRing,surface)<3);
  assert.ok(contrast(lightRing,surface)>=3);
 }
});

test('failed Projects edit keeps the last confirmed comparison base for retry and exports the draft',async()=>{
 const before=await backup('kept'), expected=JSON.stringify(before);
 let allow=false;
 const x=await setup((data,opts)=>{
  assert.equal(opts?.reviewedProjectMutation,expected);
  if(allow)return true;
  throw Object.assign(Error('test conflict'),{code:'PROJECT_WRITE_CONFLICT'});
 },before),q=s=>x.root.querySelector(s);
 let exported;
 const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 URL.createObjectURL=b=>{exported=b;return 'blob:test';};URL.revokeObjectURL=()=>{};
 try {
  const clickDetail=name=>[...x.root.querySelectorAll('#detail button')].find(button=>button.textContent===name).onclick();
  q('[data-project="kept"] button').onclick();
  clickDetail('Archive project');
  assert.equal(x.calls[0][1]?.reviewedProjectMutation,expected);
  assert.match(q('#notice').textContent,/Saved Projects changed.*Export/);
  q('#export').onclick();
  assert.equal(JSON.parse(await exported.text()).entries[0].archived,true);
  q('#archived').onclick();
  q('[data-project="kept"] button').onclick();
  allow=true;
  clickDetail('Restore project');
  assert.equal(x.calls[1][1].reviewedProjectMutation,expected);
  assert.match(q('#notice').textContent,/Saved in this browser/);
 } finally {
  URL.createObjectURL=oldCreate; URL.revokeObjectURL=oldRevoke;x.mounted.unmount();
 }
});

test('host storage guard preserves stale newer Projects and unrelated saved workspace bytes',()=>{
 const {readFileSync}=require('node:fs'),vm=require('node:vm');
 const app=readFileSync(require('node:path').join(__dirname,'../dist/app.js'),'utf8');
 const start=app.indexOf('function saveReviewedProjectBackup('),end=app.indexOf('function routeParts(',start);
 assert.ok(start>=0&&end>start);
 const old={schema:1,entries:[]};
 const changed={schema:1,entries:[],backupMetadata:'newer Projects'};
 const draft={schema:1,entries:[],backupMetadata:'this draft'};
 const host={workspaceStore:{schema:1,workspaces:{projects:old}}};
 let durable=JSON.stringify({schema:1,workspaces:{projects:changed,continuity:{notes:'other workspace'}}}),writes=0;
 host.localStorage={getItem:()=>durable,setItem(_key,value){writes++;durable=value;}};
 vm.runInNewContext(app.slice(start,end),host);
 const persistentBefore=durable;
 assert.throws(()=>host.saveReviewedProjectBackup(draft,JSON.stringify(old),true),{code:'PROJECT_WRITE_CONFLICT'});
 assert.equal(writes,0);
 assert.equal(durable,persistentBefore);
 durable=JSON.stringify({schema:1,workspaces:{projects:old,continuity:{notes:'other workspace'}}});
 assert.equal(host.saveReviewedProjectBackup(draft,JSON.stringify(old),true),true);
 assert.deepEqual(JSON.parse(durable).workspaces,{projects:draft,continuity:{notes:'other workspace'}});
 assert.equal(writes,1);
});

test('a confirmed backup import becomes the base of the next guarded edit',async()=>{
 const original=await backup('kept'),added=await backup('added'),x=await setup(()=>true,original);
 try{
  await x.load(file(added));x.confirm();
  const expected=JSON.stringify(x.calls[0][0]);
  x.root.querySelector('[data-project="added"] button').onclick();
  [...x.root.querySelectorAll('#detail button')].find(button=>button.textContent==='Archive project').onclick();
  assert.equal(x.calls[1][1].reviewedProjectMutation,expected);
 }finally{x.mounted.unmount();}
});

test('searches only confirmed snapshots, lazily discloses raw saved rows, and preserves rejected drafts',async()=>{
 const entries=Array.from({length:27},(_,i)=>({...fields,name:i===1?'Long-lost Needle':'Current catalog',goal:i===1?'needle <img src=x>':'Exact literal data',at:i,extensionSecret:'Unindexed private metadata'}));
 const before={schema:1,entries:[{id:'sample',archived:false,revisions:entries}]};
 const x=await setup(()=>false,before),q=s=>x.root.querySelector(s);
 const search=x.mounted.setSearch,scope=value=>q('#history-search').onchange({target:{value}});
 const card=()=>q('[data-project="sample"]');
 const clickDetail=label=>[...x.root.querySelectorAll('#detail button')].find(button=>button.textContent===label).onclick();
 try{
  search('needle');assert.equal(card(),null);
  scope('history');assert.equal(card().querySelector('h3').textContent,'Current catalog');
  card().querySelector('button').onclick();
  assert.equal(q('[aria-label="Matching saved revisions"] li').textContent,'Revision 2 (historical): Project name, Goal');
  assert.equal(q('#detail img'),null);assert.doesNotMatch(q('#detail').textContent,/needle <img src=x>|Unindexed private metadata/);
  const raw=q('#saved-history');assert.equal(raw.querySelectorAll('pre').length,0);
  raw.open=true;raw.ontoggle();
  assert.equal(raw.querySelectorAll('pre').length,24);assert.equal(JSON.parse(raw.querySelector('pre').textContent).at,26);
  raw.querySelector('button').onclick();assert.equal(raw.querySelectorAll('pre').length,27);
  assert.equal(JSON.parse(raw.querySelectorAll('pre')[25].textContent).extensionSecret,'Unindexed private metadata');
  assert.equal(x.calls.length,0);
  clickDetail('Archive project');assert.equal(x.calls.length,1);assert.equal(x.calls[0][0].entries[0].archived,true);
  assert.match(q('#notice').textContent,/Not saved/);assert.ok(card());
  q('#archived').onclick();assert.equal(card(),null);
  scope('current');search('');assert.ok(card(),'draft browsing remains available without a query');
  q('#archived').onclick();search('Unindexed private metadata');assert.equal(card(),null);
  scope('history');assert.equal(card(),null);assert.equal(x.calls.length,1);
 }finally{x.mounted.unmount();}
});

test('retrying a rejected Archive or Restore from saved search keeps the labeled intent',async()=>{
 for(const archived of [false,true]){
  const before=await backup('Kept project');before.entries[0].archived=archived;
  const x=await setup(()=>false,before),q=s=>x.root.querySelector(s);
  const expectedBase=JSON.stringify(before),label=archived?'Restore project':'Archive project';
  try{
   if(archived)q('#archived').onclick();
   x.mounted.setSearch('kept project');
   q('[data-project="Kept project"] button').onclick();
   const action=()=>[...x.root.querySelectorAll('#detail button')].find(button=>button.textContent===label);
   action().onclick();
   assert.match(q('#notice').textContent,/Not saved/);
   assert.equal(x.calls[0][0].entries[0].archived,!archived);
   action().onclick();
   assert.equal(x.calls[1][0].entries[0].archived,!archived,'retry must keep the labeled '+label+' intent');
   assert.deepEqual(x.calls.map(([,opts])=>opts.reviewedProjectMutation),[expectedBase,expectedBase]);
  }finally{x.mounted.unmount();}
 }
});

test('Projects search scope keeps an exact accessible label independent of its options',async()=>{
 const x=await setup(),select=x.root.querySelector('#history-search');
 try{
  assert.equal(select.getAttribute('aria-label'),'Project search scope');
  assert.deepEqual([...select.querySelectorAll('option')].map(option=>[option.value,option.textContent]),
   [['current','Current revision'],['history','All saved revisions']]);
 }finally{x.mounted.unmount();}
});
