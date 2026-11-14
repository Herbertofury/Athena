const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{webcrypto}=require('node:crypto'),{parseHTML}=require('linkedom');
const moduleURL=pathToFileURL(path.resolve(__dirname,'../dist/workspaces/engineering/lab/index.mjs')).href;
function setup(origin='http://127.0.0.1:41379',handler){const {window,document}=parseHTML('<html><body><section id="host"></section></body></html>');const saved=new Map(),requests=[];let overview={jobs:[],counts:{},worker_status:'running'};
 const fetchImpl=async(url,options={})=>{requests.push({url:String(url),options});if(handler){const r=await handler(url,options);if(r)return r;}if(url==='/api/runtime')return Response.json({application:'Athena',api_version:1,same_origin_only:true,loopback_only:true,runtime_manifest_sha256:'a'.repeat(64)});if(url==='/api/overview')return Response.json(overview,{headers:{'x-atlas-engine-instance':'a'.repeat(32)}});if(url==='/api/jobs')return Response.json({id:7});throw Error('Unexpected '+url);};
 for(const[name,value]of Object.entries({window,document,location:new URL(origin+'/#lab'),crypto:webcrypto,fetch:fetchImpl})){saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});}return {window,document,requests,container:document.getElementById('host'),setOverview(value){overview=value;},restore(){for(const[name,d]of saved){if(d)Object.defineProperty(globalThis,name,d);else delete globalThis[name];}}};}
const tick=()=>new Promise(setImmediate);
// WebCrypto completion runs off the event loop. A fixed number of immediate
// turns is not a completion barrier when other test files are running.
async function waitFor(predicate,timeout=2000){const deadline=performance.now()+timeout;while(!predicate()){if(performance.now()>=deadline)throw Error('Timed out waiting for verified archive completion');await new Promise(resolve=>setTimeout(resolve,5));}}
test('Public Lab does not probe localhost or send any API request',async()=>{const e=setup('https://athena.example');let c;try{c=await(await import(moduleURL)).mount({container:e.container});assert.equal(c.ready,false);assert.equal(e.requests.length,0);assert.match(e.container.shadowRoot.querySelector('p').textContent,/will not connect to localhost/);c.setRoute('#lab?panel=collectors');c.setSearch('test');}finally{c?.unmount();e.restore();}});
test('Native Lab uses original job protocol, routes panels locally and cancels polling',async()=>{const e=setup();let c;const routes=[];try{c=await(await import(moduleURL)).mount({container:e.container,route:'#lab?panel=experiments',navigate:(...x)=>routes.push(x)});assert.equal(c.ready,true);const r=e.container.shadowRoot;assert.equal(r.getElementById('experiments').hidden,false);assert.equal(r.querySelector('style'),null);assert.match(r.querySelector('link').href,/style.css/);r.getElementById('run-experiment').click();await tick();await tick();const post=e.requests.find(x=>x.options.method==='POST');assert.equal(post.url,'/api/jobs');assert.equal(post.options.headers['X-Atlas-Request'],'local-ui');assert.equal(post.options.body,'"DedupExperiment"');assert.match(r.getElementById('experiment-status').textContent,/Job 7 queued/);c.setRoute('#lab?panel=collectors');assert.equal(r.getElementById('collectors').hidden,false);c.setTheme('light');assert.equal(e.container.dataset.theme,'light');c.unmount();assert.equal(r.childNodes.length,0);}finally{c?.unmount();e.restore();}});
test('Lab preserves uncertain submission warning and never retries a cancelled receipt',async()=>{let attempts=0;const e=setup(undefined,(url,options)=>{if(url!=='/api/jobs')return;attempts++;return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));});let c;try{c=await(await import(moduleURL)).mount({container:e.container});e.container.shadowRoot.getElementById('run-experiment').click();await tick();assert.match(c.exportState().submissionWarning,/may already exist/);c.unmount();await tick();await tick();assert.equal(attempts,1);assert.match(c.exportState().submissionWarning,/unconfirmed/);}finally{c?.unmount();e.restore();}});
test('Lab retains last-good overview after a malformed later refresh',async()=>{const e=setup();let c;try{e.setOverview({jobs:[{id:1,id_text:'1',state:'succeeded',attempt:1,job:'DedupExperiment',result:{error:'Retained fixture'}}],counts:{succeeded:1},worker_status:'running'});c=await(await import(moduleURL)).mount({container:e.container});const r=e.container.shadowRoot,node=r.querySelector('.job');assert.ok(node);e.setOverview({jobs:[{id:2,id_text:'2',state:'failed',attempt:1,job:'DedupExperiment',result:{project:{}}}],counts:{failed:1},worker_status:'running'});e.document.dispatchEvent(new e.window.Event('visibilitychange'));await tick();await tick();assert.equal(r.querySelector('.job'),node);assert.equal(r.getElementById('completed').textContent,'1');assert.match(r.getElementById('connection').textContent,/Previous results remain visible/);c.setSearch('no-match');assert.equal(node.hidden,true);}finally{c?.unmount();e.restore();}});
test('Lab copies the exact retained validation modules and reproduces output',()=>{for(const file of ['archive-view.mjs','collection-input.mjs','job-submit.mjs'])assert.deepEqual(fs.readFileSync(path.resolve(__dirname,'../dist/workspaces/engineering/lab',file)),fs.readFileSync(path.resolve(__dirname,'../engineering/apps/atlas-lab/ui',file)));const r=require('node:child_process').spawnSync('python3',[path.resolve(__dirname,'../scripts/build_lab_workspace.py'),'--check'],{encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);});

test('Pending initialization disables every write and guards even programmatic submission before abort',async()=>{
 let posts=0,overviewStarted=false;const abort=new AbortController();
 const e=setup(undefined,(url,options)=>{if(url==='/api/jobs'){posts++;return Response.json({id:99});}if(url==='/api/overview'){overviewStarted=true;return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));}});
 let c;
 try{
  const pending=(await import(moduleURL)).mount({container:e.container,signal:abort.signal});while(!overviewStarted)await tick();const root=e.container.shadowRoot;
  const controls=[...root.querySelectorAll('#collect-form button,#project-archive-form button,#version-collect-form button,#upstream-form button,#version-experiment-form button,#run-experiment')];assert.equal(controls.length,6);assert.ok(controls.every(button=>button.disabled));
  for(const id of ['collect-form','project-archive-form','version-collect-form','upstream-form','version-experiment-form'])root.getElementById(id).dispatchEvent(new e.window.Event('submit',{bubbles:true,cancelable:true}));root.getElementById('run-experiment').click();await tick();assert.equal(posts,0);
  // An accidental UI enablement still must not bypass the write function's readiness guard.
  root.getElementById('collect-form').querySelector('button').disabled=false;root.getElementById('collect-form').dispatchEvent(new e.window.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(posts,0);assert.match(root.getElementById('collect-status').textContent,/no job was submitted/);
  abort.abort();c=await pending;assert.equal(c.ready,false);assert.equal(c.exportState().submissionWarning,'');assert.equal(posts,0);assert.equal(root.childNodes.length,0);
 }finally{abort.abort();c?.unmount();e.restore();}
});

test('Lab verifies exact archive bytes with a bounded WebCrypto completion wait',async()=>{
 const bytes=new TextEncoder().encode('{"id":"AANobbMI","unknown":18446744073709551617}'),digest=require('node:crypto').createHash('sha256').update(bytes).digest('hex');
 const e=setup(undefined,(url)=>{if(!String(url).startsWith('/api/project-archive/'))return;
  return new Response(bytes,{headers:{'content-type':'application/json','x-atlas-archive-kind':'project','x-atlas-canonical-id':'AANobbMI','x-atlas-generation':'9007199254740993','x-atlas-payload-sha256':digest}});
 });let c;
 try{c=await(await import(moduleURL)).mount({container:e.container});const root=e.container.shadowRoot,form=root.getElementById('saved-archive-form'),button=form.querySelector('button'),dialog=root.getElementById('saved-archive-dialog');dialog.showModal=function(){this.open=true;};dialog.close=function(){this.open=false;};Object.defineProperty(root.getElementById('saved-archive-kind'),'value',{value:'project',configurable:true});root.getElementById('saved-archive-id').value='AANobbMI';
  form.dispatchEvent(new e.window.Event('submit',{bubbles:true,cancelable:true}));await waitFor(()=>!button.disabled);assert.equal(button.disabled,false);assert.match(root.getElementById('saved-archive-status').textContent,/Exact saved JSON verified/);assert.equal(root.getElementById('saved-archive-text').textContent,new TextDecoder().decode(bytes));
 }finally{c?.unmount();e.restore();}
});

test('Archive completion wait fails rather than silently accepting a stuck state',async()=>{await assert.rejects(waitFor(()=>false,10),/Timed out waiting for verified archive completion/);});

test('Native Lab rejects malformed count maps before replacing last-good cards and recovers',async()=>{
 const e=setup();let c;const job={id:1,id_text:'1',state:'succeeded',attempt:1,job:'DedupExperiment',result:{error:'Synthetic retained'}};
 try{
  e.setOverview({jobs:[job],counts:{succeeded:3},worker_status:'running'});
  c=await(await import(moduleURL)).mount({container:e.container});const r=e.container.shadowRoot,node=r.querySelector('.job');assert.ok(node);
  for(const counts of [null,[],{queued:'2',running:1},{succeeded:-1},{failed:0.5},{queued:Number.MAX_SAFE_INTEGER,running:1},{unknown:'bad'}]){
   e.setOverview({jobs:[],counts,worker_status:'running'});e.document.dispatchEvent(new e.window.Event('visibilitychange'));await tick();await tick();
   assert.equal(r.querySelector('.job')===node,true,JSON.stringify(counts));assert.equal(r.getElementById('completed').textContent,'3');assert.match(r.getElementById('connection').textContent,/Previous results remain visible/);
  }
  e.setOverview({jobs:[job],counts:{queued:2,running:1,succeeded:7},worker_status:'running'});e.document.dispatchEvent(new e.window.Event('visibilitychange'));await tick();await tick();
  assert.equal(r.getElementById('pending').textContent,'3');assert.equal(r.getElementById('completed').textContent,'7');assert.equal(r.querySelector('.job'),node);
 }finally{c?.unmount();e.restore();}
});
