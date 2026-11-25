const assert=require('node:assert/strict'),test=require('node:test'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{webcrypto}=require('node:crypto'),{parseHTML}=require('linkedom');
const assets=path.resolve(process.env.ATHENA_PROJECT_LINK_TEST_PACKAGE||path.join(__dirname,'../dist'));
const from=name=>import(pathToFileURL(path.join(assets,'workspaces/projects',name+'.mjs')).href);
const subject='private-id with spaces & glyph ☃',other='other-project';
const oldSource='https://fixture.invalid/exact-old',newSource='https://fixture.invalid/do-not-substitute';
const row={name:'Private same-name project',ownership:'own',stage:'research',goal:'Exact old private goal',
 next:'',blockers:'',decisions:'',resources:'',source:oldSource,version:'',release:'',at:20};
const entry={id:subject,archived:false,revisions:[{...row,unknown:{z:'opaque',a:1}},{...row,goal:'Newest private text',source:newSource,at:10}]};
const fixture={schema:1,entries:[entry,{id:other,archived:true,revisions:[{...row,goal:'Wrong-neighbor private goal'}]}]};
const wait=()=>new Promise(setImmediate);
async function setup(initialRoute=''){
 const {document,window}=parseHTML('<html><body><section id="host"></section></body></html>');
 const original=new Map(),pending=new Set(),reads=[];
 const crypto={subtle:{digest(...args){const job=webcrypto.subtle.digest(...args);pending.add(job);job.then(()=>pending.delete(job),()=>pending.delete(job));return job;}}};
 for(const [key,value] of Object.entries({document,crypto,fetch:()=>assert.fail('No preview provider reads')})){
  original.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 let durable=structuredClone(fixture),controller;
 const {mount}=await from('index');const container=document.getElementById('host');
 const open=(route=initialRoute)=>{controller=mount({container,route,state:fixture,
  readSavedProject:id=>{reads.push(id);return durable.entries.find(p=>p.id===id);},
  setState:()=>assert.fail('A local revision link must not write')});return container.shadowRoot;};
 const root=open();
 const drain=async()=>{for(let i=0;i<8;i++){await wait();await Promise.allSettled([...pending]);}};
 return {root,open,reads,drain,get controller(){return controller;},get durable(){return durable;},set durable(value){durable=value;},dispose(){
  controller.unmount();for(const [key,desc] of original){if(desc)Object.defineProperty(globalThis,key,desc);else delete globalThis[key];}
 }};
}
async function prepared(s){
 s.root.querySelector('[data-project] button').click();
 const history=s.root.getElementById('saved-history');history.open=true;history.ontoggle();
 const row=history.querySelector('[data-saved-revision="1"]');
 const button=row.querySelector('[data-prepare-saved-revision-link]');
 assert.ok(button,'saved history has an explicit prepared local link');
 button.click();await s.drain();
 const link=row.querySelector('[data-saved-revision-link]');
 assert.ok(link);
 return link.getAttribute('href');
}

test('prepared locator has no raw project identity or text; exact historical review survives append and ignores same-name neighbors',async()=>{
 const s=await setup();
 try{
  const href=await prepared(s);
  for(const token of [subject,encodeURIComponent(subject),row.name,encodeURIComponent(row.name),row.goal,oldSource,newSource])
   assert.equal(href.includes(token),false);
  assert.match(href,/^#projects\?saved-revision=1&project-key=[a-f0-9]{64}&revision-key=[a-f0-9]{64}$/);
  s.durable.entries[0].revisions.push({...row,at:40,goal:'Later still'});
  s.controller.setRoute(href);await s.drain();
  const view=s.root.getElementById('saved-revision-route');
  assert.match(view.textContent,/Exact old private goal/);
  assert.doesNotMatch(view.textContent,/Newest private text|Wrong-neighbor|Later still/);
  assert.ok([...view.querySelectorAll('a')].some(link=>link.getAttribute('href')===oldSource));
  assert.equal(view.hidden,false);
  s.controller.setRoute('#projects');await s.drain();
  assert.equal(view.hidden,true);assert.doesNotMatch(view.textContent,/Exact old private goal/);
  s.controller.unmount();const reopened=s.open(href);await s.drain();
  assert.match(reopened.getElementById('saved-revision-route').textContent,/Exact old private goal/);
 }finally{s.dispose();}
});

test('cross-store identity collisions, unknown ordinals and ambiguous or malformed links do not expose other data',async()=>{
 const s=await setup();
 try{
  const href=await prepared(s),view=s.root.getElementById('saved-revision-route');
  s.durable.entries[0].revisions[0].goal='Other saved store with same identifier';
  s.controller.setRoute(href);await s.drain();
  assert.match(view.textContent,/exact saved revision is unavailable/i);
  assert.doesNotMatch(view.textContent,/Other saved store|Exact old private goal|Newest private text/);
  s.durable=structuredClone(fixture);
  for(const invalid of [href.replace('saved-revision=1','saved-revision=999999'),
   href.replace('saved-revision=1','saved-revision=01'),href+'&project-key='+'a'.repeat(64),href.replace('revision-key=','wrong=')]){
   s.controller.setRoute(invalid);await s.drain();
   assert.match(view.textContent,/unavailable|invalid/i);
   assert.doesNotMatch(view.textContent,/Exact old private goal|Newest private text|Wrong-neighbor/);
  }
 }finally{s.dispose();}
});

test('rapid route changes never leave stale review; saved locator is unavailable once saved source and display disagree',async()=>{
 const s=await setup();
 try{
  const href=await prepared(s),view=s.root.getElementById('saved-revision-route');
  s.controller.setRoute(href);s.controller.setRoute('#projects');await s.drain();
  assert.equal(view.hidden,true);
  s.durable.entries[0].revisions[0].unknown.a=25;
  s.controller.setRoute(href);await s.drain();
  assert.match(view.textContent,/exact saved revision is unavailable/i);
  assert.doesNotMatch(view.textContent,/private goal/i);
  s.controller.unmount();
  assert.equal(s.root.children.length,0);
 }finally{s.dispose();}
});
