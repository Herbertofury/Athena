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

test('category deltas pair exact names and do not turn absent buckets into zero',async()=>{
 const {parseStorageReport,compareObservations}=await import('../dist/workspaces/storage/model.mjs');
 const later=structuredClone(record);
 later.observedAt='2026-11-22T00:00:00Z';
 later.categories[0].allocatedBytes+=4096;later.categories[1].logicalBytes+=128;
 later.categories.push({name:'Other entries',allocatedBytes:4096,logicalBytes:100,files:1});
 later.totals.allocatedBytes+=8192;later.totals.logicalBytes+=228;later.totals.files++;later.totals.physicalFiles++;
 const before=parseStorageReport(JSON.stringify(record)),after=parseStorageReport(JSON.stringify(later));
 assert.equal(compareObservations(before,after,false).categoryChanges,undefined);
 const compared=compareObservations(before,after,true);
 assert.deepEqual(compared.categoryChanges.find(r=>r.name==='Media').changes,{allocatedBytes:4096,logicalBytes:0,files:0});
 assert.deepEqual(compared.categoryChanges.find(r=>r.name==='Other entries'),{name:'Other entries',presence:'later-only',changes:null});
 assert.equal(compareObservations(before,{...after,partial:true},true).categoryChanges,undefined);
});
test('workspace filters category comparisons without saving or treating earlier and later as interchangeable',async()=>{
 const s=await app(),root=s.root(),later=structuredClone(record);
 later.observedAt='2026-11-22T00:00:00Z';later.categories[1].allocatedBytes+=8192;later.totals.allocatedBytes+=8192;
 await load(root,contents(record));const second=root.querySelector('#comparison-file');
 second.files=[contents(later)];await second.onchange();
 const panel=root.querySelector('#compare-categories');
 assert.equal(panel.hidden,true);
 const yes=root.querySelector('#compare-same');yes.checked=true;yes.onchange();
 assert.equal(panel.hidden,false);
 assert.match(root.querySelector('#compare-category-rows').textContent,/Source\+8 KiB allocated/);
 const sort=root.querySelector('#compare-sort');
 Object.defineProperty(sort,'value',{configurable:true,value:'allocatedBytes'});
 sort.onchange({target:sort});
 assert.equal(panel.querySelector('li strong').textContent,'Source');
 const search=s.document.querySelector('#search');search.value='shared';
 search.dispatchEvent(new s.window.Event('input'));await tick();await tick();
 assert.equal(panel.querySelectorAll('li').length,1);assert.equal(panel.querySelector('li strong').textContent,'Shared across categories');
 second.files=[contents(record)];await second.onchange();
 assert.equal(panel.hidden,true);assert.equal(yes.checked,false);
 assert.ok(s.writes.every(([,v])=>!String(v).includes('Shared across categories')));
});

const windowsReport={
 schema:'athena-windows-directory-observation-v1',
 scope:'Explicit directory direct children only. No child content, recursion, names, IDs or paths returned.',
 records_examined:4, observed_file_pathnames:3,logical_pathname_bytes:10240,
 identified_unique_files:2,observed_identified_allocation_bytes:8192,excluded_directories:1,
 excluded_reparse_entries:0,files_without_stable_id:0,identity_or_name_conflicts:0,
 stopped_entry_limit:false,stopped_batch_limit:false,partial:false,
 point_in_time_snapshot:false,reclaimable_space_inferred:false
};
test('Windows v1 rejects claims beyond its evidence, unexpected private fields, and inaccurate numbers',async()=>{
 const {parseWindowsDirectoryReport,parseStorageReport}=await import('../dist/workspaces/storage/model.mjs');
 const parse=r=>parseWindowsDirectoryReport(JSON.stringify(r));
 assert.equal(parse(windowsReport).identified_unique_files,2);
 assert.equal(parse({...windowsReport,files_without_stable_id:1,partial:true}).partial,true);
 assert.equal(parse({...windowsReport,records_examined:5,identity_or_name_conflicts:1,partial:true}).partial,true);
 for(const bad of [
  {path:'C:/secret'}, {reclaimable_space_inferred:true}, {point_in_time_snapshot:true},
  {records_examined:3},{records_examined:5},{stopped_entry_limit:true},{partial:true},
  {files_without_stable_id:2,partial:true},{logical_pathname_bytes:2**53},
  {observed_identified_allocation_bytes:-1},{observed_identified_allocation_bytes:1.5},
  {identified_unique_files:0}, {records_examined:100001}
 ])assert.throws(()=>parse({...windowsReport,...bad}));
 assert.throws(()=>parse(record));
 assert.throws(()=>parseStorageReport(JSON.stringify(windowsReport)));
 assert.throws(()=>parseWindowsDirectoryReport(' '.repeat(4097)));
});
test('Windows summary stays separate, shows exact bytes and partial coverage, and clears safely',async()=>{
 const s=await app(),root=s.root(),input=root.querySelector('#windows-observation-file');
 const panel=root.querySelector('.windows-report'),status=panel.querySelector('[role=status]');
 const loadWin=async file=>{input.files=[file];await input.onchange();};
 await load(root,contents(record));await loadWin(contents(windowsReport));
 assert.match(panel.textContent,/8 KiB \(8,192 bytes\)/);assert.match(panel.textContent,/not verified here/i);
 assert.match(panel.textContent,/1 directory/);assert.equal(root.querySelectorAll('#rows li').length,3);
 assert.equal(root.querySelector('#comparison-result').hidden,true);
 await loadWin(contents({...windowsReport,stopped_batch_limit:true,partial:true}));
 assert.match(panel.textContent,/Partial observation: batch limit reached/);
 await loadWin(contents({...windowsReport,name:'PRIVATE'}));assert.match(status.textContent,/Previous report preserved/);
 assert.doesNotMatch(panel.textContent,/PRIVATE/);assert.match(panel.textContent,/Partial observation/);
 let done;const pending=loadWin({size:300,text:()=>new Promise(resolve=>done=resolve)});
 panel.querySelector('button').onclick();done(JSON.stringify(windowsReport));await pending;
 assert.match(status.textContent,/cleared/);assert.equal(panel.querySelector('.windows-evidence').children.length,0);
 const suspended=loadWin({size:300,text:()=>new Promise(resolve=>done=resolve)});
 await s.go('#foundations');done(JSON.stringify(windowsReport));await suspended;
 assert.equal(root.children.length,0);assert.equal(s.writes.length,0);
});
