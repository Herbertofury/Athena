const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');
const tick=()=>new Promise(setImmediate);
const record={schema:'athena-storage-observation-v1',platform:'linux',observedAt:'2026-11-21T00:00:00Z',partial:false,
 stops:{entryLimit:0,depthLimit:0,deadline:0,unreadable:0,changed:0},skipped:{links:1,mounts:0,special:0},
 totals:{logicalBytes:4194306,allocatedBytes:12288,files:3,physicalFiles:2},categories:[
  {name:'Media',logicalBytes:4194304,allocatedBytes:4096,files:2},
  {name:'Source',logicalBytes:2,allocatedBytes:0,files:1},
  {name:'Shared across categories',logicalBytes:0,allocatedBytes:8192,files:0}]};
const contents=report=>({size:300,text:async()=>JSON.stringify(report)});
async function app(){
 const {window,document}=parseHTML(fs.readFileSync('dist/index.html','utf8')),writes=[];
 const module=await import('../dist/workspaces/storage/index.mjs');
 window.AbortController=AbortController;window.URL=URL;window.URLSearchParams=URLSearchParams;window.Blob=Blob;
 window.location={hash:'#storage'};window.history={replaceState:(_a,_b,value)=>window.location.hash=value};
 window.localStorage={getItem:()=>null,setItem:(...args)=>writes.push(args)};
 window.confirm=()=>true;window.setTimeout=()=>1;window.clearTimeout=()=>{};window.HTMLElement.prototype.focus=function(){};
 window.document.querySelector('#search').value='';
 window.AthenaWorkspaceLoaders={storage:async()=>module};
 const dialog=window.document.querySelector('dialog');dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new window.Event('close'));};
 const ctx=vm.createContext(window);for(const name of ['catalog.js','core.js','workspace-host.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+name,'utf8'),ctx);
 const go=async hash=>{window.location.hash=hash;window.dispatchEvent(new window.Event('hashchange'));await tick();await tick();};
 await tick();await tick();
 return {window,document,writes,go,host:()=>document.querySelector('.workspace-container'),root:()=>document.querySelector('.workspace-container')?.shadowRoot};
}
async function load(root,file){const input=root.querySelector('input');input.files=[file];await input.onchange();}
test('registered Athena navigation owns storage search, theme, and privacy',async()=>{
 const s=await app(),root=s.root();assert.ok(root);assert.equal(s.document.querySelector('#main').dataset.workspace,'storage');
 assert.equal(s.document.querySelector('a[data-nav="storage"]').getAttribute('aria-current'),'page');
 await load(root,contents(record));assert.match(root.querySelector('#evidence').textContent,/12 KiB.*4 MiB.*3 pathnames \/ 2 unique files/);
 assert.match(root.querySelector('#status').textContent,/unverified/);assert.equal(root.querySelectorAll('#rows li').length,3);
 const search=s.document.querySelector('#search');assert.match(search.placeholder,/storage report categories/);
 search.value='shared';search.dispatchEvent(new s.window.Event('input'));await tick();await tick();
 assert.equal(root.querySelectorAll('#rows li').length,1);assert.match(root.querySelector('#evidence').textContent,/12 KiB/);
 root.querySelector('#rows button').onclick();assert.match(root.querySelector('#detail').textContent,/0 pathnames, 0 B logical, 8 KiB allocated/);
 root.querySelector('#logical').onclick();assert.equal(root.querySelector('#logical').getAttribute('aria-pressed'),'true');assert.match(root.querySelector('#rows strong').textContent,/0 B/);
 assert.equal(s.host().dataset.theme,'dark');s.document.querySelector('#theme').click();await tick();assert.equal(s.host().dataset.theme,'light');
 assert.ok(s.writes.every(([,value])=>!String(value).includes('Shared across categories')));
 await s.go('#foundations');assert.equal(root.children.length,0);assert.equal(s.document.querySelector('#main').dataset.workspace,'learning');
 await s.go('#storage');assert.ok(s.root());assert.match(s.root().querySelector('#status').textContent,/No report loaded/);assert.equal(s.root().querySelectorAll('#rows li').length,0);
});
test('invalid reports preserve prior rows; unmount and Clear fence deferred files',async()=>{
 const s=await app(),r=s.root();const special=structuredClone(record);special.categories[0].name='<img src=x>';
 special.partial=true;special.stops.unreadable=2;await load(r,contents(special));
 assert.match(r.querySelector('#evidence').textContent,/Partial observation: unreadable entries \(2\)/);assert.equal(r.querySelectorAll('#rows img').length,0);
 const invalid=structuredClone(special);invalid.totals.allocatedBytes+=1;await load(r,contents(invalid));assert.match(r.querySelector('#error').textContent,/Previous report preserved/);assert.equal(r.querySelectorAll('#rows li').length,3);
 let resolve;const pending=load(r,{size:300,text:()=>new Promise(j=>resolve=j)});r.querySelector('#clear').onclick();resolve(JSON.stringify(record));await pending;assert.equal(r.querySelectorAll('#rows li').length,0);assert.match(r.querySelector('#status').textContent,/Nothing saved/);
 const last=load(r,{size:300,text:()=>new Promise(j=>resolve=j)});await s.go('#foundations');resolve(JSON.stringify(record));await last;assert.equal(r.children.length,0);assert.equal(s.writes.length,0);
});
test('coverage is distinct from intentional exclusions and remains visible during filtering',async()=>{
 const s=await app(),root=s.root();
 const zero={...record,partial:true,stops:{...record.stops,entryLimit:1,unreadable:1},totals:{logicalBytes:0,allocatedBytes:0,files:0,physicalFiles:0},categories:[]};
 await load(root,contents(zero));
 const banner=()=>root.querySelector('.coverage');
 assert.equal(banner().dataset.state,'partial');
 assert.match(banner().textContent,/entry limit.*unreadable entries.*not mean the folder is empty/);
 assert.match(root.querySelector('#row-count').textContent,/observed entries only/);
 root.querySelector('#logical').onclick();
 assert.equal(banner().dataset.state,'partial');
 await load(root,contents(record));
 assert.equal(banner().dataset.state,'no-stops');
 assert.match(banner().textContent,/Intentional exclusions/);
 assert.equal(root.querySelector('#error').textContent,'');
 await s.go('#home');assert.equal(root.children.length,0);assert.equal(s.writes.length,0);
});

test('Storage refuses duplicate escaped keys at any report level and invalid calendar dates',async()=>{
 const {parseStorageReport}=await import('../dist/workspaces/storage/model.mjs');
 const exact=JSON.stringify(record);
 assert.deepEqual(parseStorageReport(exact).totals,record.totals);
 for(const text of [
  exact.replace('"linux"', '"other","plat\\u0066orm":"linux"'),
  exact.replace('"allocatedBytes":12288','"allocatedBytes":99,"allocated\\u0042ytes":12288'),
  exact.replace('"name":"Media"','"name":"wrong","n\\u0061me":"Media"'),
  exact.replace('"linux"','"linux","extra":[{"unknown":0,"unknown":1}]'),
 ])assert.throws(()=>parseStorageReport(text),/Duplicate observation property/);
 const invalid={...record,observedAt:'2026-02-31T00:00:00Z'};
 assert.throws(()=>parseStorageReport(JSON.stringify(invalid)),/Invalid observation scope/);
 const strange=structuredClone(record);
 strange.categories[0].name='Just text: [ { "totals": null } ]';
 assert.equal(parseStorageReport(JSON.stringify(strange)).categories[0].name,strange.categories[0].name);
 assert.deepEqual(parseStorageReport(JSON.stringify({...record,extra:[{unknown:0},{unknown:1}]})).totals,record.totals);
});

test('ambiguous or impossible replacements keep both last good Storage observations',async()=>{
 const s=await app(),root=s.root();await load(root,contents(record));
 const other=root.querySelector('#comparison-file');
 const second={...record,observedAt:'2026-11-22T00:00:00Z'};
 other.files=[contents(second)];await other.onchange();
 const agree=root.querySelector('#compare-same');assert.equal(agree.disabled,false);
 agree.checked=true;agree.onchange();
 assert.equal(root.querySelectorAll('#compare-metrics li').length,4);
 await load(root,{size:300,text:async()=>JSON.stringify(record).replace('"linux"','"unsupported","platform":"linux"')});
 assert.match(root.querySelector('#error').textContent,/Previous report preserved/);
 assert.match(root.querySelector('#evidence').textContent,/2026-11-21T00:00:00Z/);
 assert.equal(root.querySelectorAll('#compare-metrics li').length,0);
 other.files=[contents({...second,observedAt:'2026-02-30T00:00:00Z'})];await other.onchange();
 assert.match(root.querySelector('#compare-status').textContent,/Previous report preserved/);
 assert.match(root.querySelector('#comparison-values').textContent,/2026-11-22T00:00:00Z/);
 assert.equal(agree.checked,false);
 assert.equal(agree.disabled,false);
 agree.checked=true;agree.onchange();
 assert.equal(root.querySelectorAll('#compare-metrics li').length,4);
 assert.equal(s.writes.length,0);
});
