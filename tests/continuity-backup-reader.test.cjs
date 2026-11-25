const assert=require('node:assert/strict'),test=require('node:test'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{parseHTML}=require('linkedom');
const assets=path.resolve(process.env.ATHENA_BACKUP_READER_PACKAGE||path.join(__dirname,'../dist'));
const source='https://fixture.invalid/exact-reviewed',live='https://fixture.invalid/live-do-not-substitute',latest='https://fixture.invalid/later-not-reviewed';
const makeRevision=(text,source='',at=20)=>({text,source,at});
const makeNote=(id,project,revisions,dependencies=[])=>({id,project,kind:'decision',pinned:false,ignored:false,revisions,history:[],dependencies});
const backup={schema:1,entries:[
 makeNote('shared','Archive-only project',[makeRevision('<img src=x onerror=bad()> exact old detail',source,20),makeRevision('Newer backup detail',latest,10)],[{id:'dep',revision:1},{id:'missing',revision:8},{id:'dep-no-revision',revision:99}]),
 makeNote('dep','Linked archive project',[makeRevision('Exactly reviewed dependency',source,3),makeRevision('Newer dependency must not substitute',latest,4)]),
 makeNote('dep-no-revision','Other archive project',[makeRevision('Wrong dependency generation',latest,4)]),
]};
const current={schema:2,entries:[makeNote('shared','Live project',[makeRevision('Live replacement must not leak',live)])]};
const file=(value=backup,mime='application/json',name='athena-continuity.json')=>{
 const data=new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value));
 return {name,type:mime,size:data.byteLength,arrayBuffer:async()=>data.slice().buffer};
};
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
async function setup(state=current){
 const {document,window}=parseHTML('<main><div id="native"></div></main>');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this._value||'';},set(v){this._value=v;}});
 const counts={writes:0,fetch:0,idb:0},old=new Map();
 for(const [key,value] of Object.entries({document,fetch(){counts.fetch++;throw Error('should not fetch');},indexedDB:{open(){counts.idb++;throw Error('should not access journal');}}})){
  old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 const {mount}=await import(pathToFileURL(path.join(assets,'workspaces/continuity/index.mjs')).href);
 const host=document.getElementById('native'),open=()=>mount({container:host,state,setState(){counts.writes++;throw Error('read-only feature');}});
 let handle=open();
 function reader(){
  const view=host.shadowRoot.querySelector('[data-continuity-backup-reader]');assert.ok(view,'native reviewed backup reader must be mounted');
  const q=s=>view.querySelector(s),input=q('input[type=file]'),form=q('form');
  const select=selected=>{input.files=selected?[selected]:[];input.onchange();};
  return {view,q,select,read:()=>form.onsubmit({preventDefault(){}}),async accept(f){select(f);await this.read();},status:()=>q('[role=status]').textContent};
 }
 return {reader,counts,reopen(){handle.unmount();handle=open();},dispose(){handle.unmount();for(const [k,desc] of old){if(desc)Object.defineProperty(globalThis,k,desc);else delete globalThis[k];}}};
}
const none={writes:0,fetch:0,idb:0};
test('read-only native backup opens exact historical and linked evidence from file, never same-ID live data',async()=>{
 const s=await setup();
 try{
  const v=s.reader();await v.accept(file());assert.match(v.status(),/3 notes.*Read-only/);
  assert.match(v.q('[data-backup-note-view]').textContent,/Newer backup detail/);
  v.q('[data-backup-rev-prev]').onclick();
  const old=v.q('[data-backup-note-view]');assert.match(old.textContent,/Revision 1 of 2.*exact old detail/s);assert.match(old.textContent,new RegExp(source));
  assert.match(old.textContent,/Recorded time: 20/);
  const dep=v.q('[data-backup-dependency-view]');
  assert.match(dep.textContent,/Exactly reviewed dependency/);assert.match(dep.textContent,new RegExp(source));
  assert.doesNotMatch(v.view.textContent,/Live replacement|Newer dependency must not substitute/);
  assert.equal(v.view.querySelector('a,img,script,iframe'),null);
  v.q('[data-backup-dep-next]').onclick();assert.match(dep.textContent,/Missing note in this backup/);
  v.q('[data-backup-dep-next]').onclick();assert.match(dep.textContent,/Recorded revision is missing/);
  assert.doesNotMatch(dep.textContent,/Wrong dependency generation/);
  assert.deepEqual(s.counts,none);
 }finally{s.dispose();}
});
test('invalid, parser-ambiguous, unsupported and oversized files preserve prior selection without exposing raw input',async()=>{
 const s=await setup();
 try{
  const v=s.reader();await v.accept(file());v.q('[data-backup-rev-prev]').onclick();const keep=v.q('[data-backup-note-view]').textContent;
  for(const bad of [file({schema:'project-constellation',version:7,entries:[]}),file('{"schema":1,"schema":2,"entries":[]}'),
   file('{"schema":2,"entries":[],"private":9007199254740993}'),file(JSON.stringify(backup),'text/html','not-json.html'),
   file({...backup,entries:Array.from({length:101},(_,i)=>makeNote('note-'+i,'Too many', [makeRevision('x')]))}),
   {size:16*1024*1024+1,name:'over.json',type:'application/json',arrayBuffer:async()=>assert.fail('oversize cannot be read')},
   {size:1,name:'wrong-length.json',type:'application/json',arrayBuffer:async()=>new ArrayBuffer(0)}
  ]){await v.accept(bad);assert.match(v.status(),/Backup not opened/);assert.equal(v.q('[data-backup-note-view]').textContent,keep);}
  assert.doesNotMatch(v.view.textContent,/9007199254740993|Too many|not-json\.html/);
  assert.deepEqual(s.counts,none);
 }finally{s.dispose();}
});
test('stale held reads, Clear and remount never publish old evidence or block normal future selections',async()=>{
 const s=await setup({schema:999});
 try{
  let v=s.reader();assert.equal(v.q('input[type=file]').disabled,false);await v.accept(file());
  const pending=defer();v.select({...file(current),arrayBuffer:()=>pending.promise});const first=v.read();
  v.select(file(backup));pending.resolve(await file(current).arrayBuffer());await first;
  assert.doesNotMatch(v.view.textContent,/Live replacement/);assert.match(v.q('[data-backup-note-view]').textContent,/Newer backup detail/);
  const late=defer();v.select({...file(current),arrayBuffer:()=>late.promise});const second=v.read();
  s.reopen();const newView=s.reader();assert.match(newView.status(),/No backup selected/);
  late.resolve(await file(current).arrayBuffer());await second;
  assert.doesNotMatch(newView.view.textContent,/Live replacement/);
  v=newView;await v.accept(file(backup,'','renamed.json'));
  assert.match(v.status(),/Read-only/);
  v.q('[data-backup-review-clear]').onclick();assert.equal(v.q('[data-backup-review-content]').hidden,true);
  assert.doesNotMatch(v.view.textContent,/Newer backup detail/);
  assert.deepEqual(s.counts,none);
 }finally{s.dispose();}
});
