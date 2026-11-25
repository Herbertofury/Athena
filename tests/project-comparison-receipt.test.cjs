const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {parseHTML}=require('linkedom');
const assetRoot=process.env.ATHENA_PROJECT_TEST_PACKAGE||path.resolve(__dirname,'../dist');
const asset=name=>import(pathToFileURL(path.join(assetRoot,'workspaces/projects',name+'.mjs')));
const old='https://example.invalid/exact-first';
const next='https://example.invalid/exact-second';
const rootRow={name:'Two projects share this name',ownership:'own',stage:'research',
 goal:'Original review text',next:'',blockers:'',decisions:'',resources:'',
 source:old,version:'',release:''};

async function withProjects(fn){
 const {empty,change,archive}=await asset('model');
 let state=change(empty(),'project-A',{...rootRow,extension:{concealed:'raw-extension-sentinel'}},20);
 state=change(state,'project-A',{...rootRow,goal:'<img src=x onerror=alert(1)>',source:next},10);
 state=change(state,'project-B',{...rootRow,goal:'unrelated-project-sentinel'},20);
 state=change(state,'project-B',{...rootRow,goal:'other-project-update'},10);
 state=archive(state,'project-B',true);
 const draft=change(state,'project-A',{...rootRow,goal:'unsaved-draft-sentinel'},30);
 const original=JSON.stringify(state);
 const {document,Event}=parseHTML('<html><body><section></section></body></html>');
 const oldDoc=globalThis.document, oldFetch=globalThis.fetch;
 globalThis.document=document;
 globalThis.fetch=()=>assert.fail('Read-only Projects comparison must never fetch');
 let current=structuredClone(state), reads=0;
 const {mount}=await asset('index');
 const container=document.querySelector('section');
 const m=mount({container,state:draft,readSavedProject:id=>{reads++;return current.entries.find(x=>x.id===id);},
  setState:()=>assert.fail('Comparing history must not write workspace state')});
 async function open(id,archived=false){
  const root=container.shadowRoot;
  if(archived)root.querySelector('#archived').click();
  root.querySelector('[data-project="'+id+'"] button').click();
  let panel;
  for(let i=0;i<100&&!panel;i++){
   panel=[...root.querySelectorAll('#detail details')].find(x=>x.querySelector('summary')?.textContent==='Compare saved revisions');
   if(!panel)await new Promise(setImmediate);
  }
  assert.ok(panel,'optional comparator loads in actual Projects workspace');
  panel.open=true;panel.dispatchEvent(new Event('toggle'));
  return {
   panel,read:()=>panel.querySelector('textarea[data-comparison-receipt]'),
   prepare(){const b=panel.querySelector('button[data-prepare-comparison]');assert.ok(b,'scoped copyable receipt action');b.click();},
   pick(side,index){
    const select=panel.querySelector('[aria-label="'+side+' revision"]');
    for(const o of select.options)if(o.value===String(index))o.setAttribute('selected','');else o.removeAttribute('selected');
    select.dispatchEvent(new Event('change'));
   },
   close(){panel.open=false;panel.dispatchEvent(new Event('toggle'));},
  };
 }
 try{
  await fn({open,state,current:()=>current,set:next=>{current=next;},reads:()=>reads,change});
  assert.equal(JSON.stringify(state),original);
 }finally{m.unmount();globalThis.document=oldDoc;globalThis.fetch=oldFetch;}
}

test('same-name projects prepare distinct, exact read-only receipts with known revisions only',async()=>{
 await withProjects(async s=>{
  const a=await s.open('project-A');
  assert.ok(a.read().hidden);
  a.prepare();
  const ra=JSON.parse(a.read().value);
  assert.equal(a.read().hidden,false);
  assert.ok(a.read().hasAttribute('readonly'));
  assert.equal(ra.project_id,'project-A');
  assert.deepEqual([ra.before.revision,ra.before.at,ra.after.revision,ra.after.at],[1,20,2,10]);
  assert.equal(ra.before.fields.source,old);
  assert.equal(ra.after.fields.source,next);
  assert.equal(ra.after.fields.goal,'<img src=x onerror=alert(1)>');
  assert.deepEqual(ra.changed_fields,['goal','source']);
  assert.equal(a.panel.querySelector('img'),null);
  assert.doesNotMatch(a.read().value,/unsaved-draft|raw-extension|unrelated-project/);
  assert.equal(s.reads(),2);
  const b=await s.open('project-B',true);
  const beforeDetached=s.reads();a.prepare();assert.equal(s.reads(),beforeDetached);
  b.prepare();
  assert.equal(JSON.parse(b.read().value).project_id,'project-B');
  assert.equal(JSON.parse(b.read().value).before.fields.goal,'unrelated-project-sentinel');
 });
});

test('appended newer revisions cannot substitute for the expressly selected older pair',async()=>{
 await withProjects(async s=>{
  const a=await s.open('project-A');
  s.set(s.change(s.current(),'project-A',{...rootRow,goal:'newer-saved-revision-sentinel'},99));
  a.prepare();
  assert.doesNotMatch(a.read().value,/newer-saved-revision-sentinel/);
  a.pick('Before',1);
  assert.equal(a.read().value,'');
  assert.ok(a.read().hidden);
  a.prepare();
  const receipt=JSON.parse(a.read().value);
  assert.deepEqual([receipt.before.revision,receipt.after.revision],[2,2]);
  assert.deepEqual(receipt.changed_fields,[]);
  a.close();
  assert.ok(a.read().hidden);
  assert.equal(a.read().value,'');
 });
});

test('removed, different or changed retained rows refuse export and clear last prepared text',async()=>{
 await withProjects(async s=>{
  const a=await s.open('project-A');
  a.prepare();
  assert.ok(a.read().value);
  s.current().entries[0].revisions[0].goal='changed durable bytes';
  a.prepare();
  assert.ok(a.read().hidden);
  assert.equal(a.read().value,'');
  assert.match(a.panel.textContent,/saved comparison changed/i);
  s.current().entries[0].id='project-replaced';
  a.prepare();
  assert.equal(a.read().value,'');
  assert.match(a.panel.textContent,/saved comparison changed/i);
 });
});
