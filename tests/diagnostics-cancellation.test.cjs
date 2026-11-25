const assert=require('node:assert/strict'),test=require('node:test');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL,fileURLToPath}=require('node:url');
const {parseHTML}=require('linkedom');
const assets=path.resolve(process.env.ATHENA_DIAGNOSTICS_TEST_PACKAGE||path.join(__dirname,'../dist'));
const diagnostics=path.join(assets,'workspaces/engineering/diagnostics');
let moduleNumber=0;

async function setup(){
 const {window,document}=parseHTML('<!doctype html><html><body><section id="target"></section></body></html>');
 const saved=new Map(),pending=new Map(),cancelled=[],requests=[],downloads=[];
 let next=0;
 const fixture=path.join(diagnostics,'event-log-fixture.json');
 for(const [name,value] of Object.entries({window,document,navigator:{userAgent:'Synthetic diagnostic boundary'},
  innerWidth:1440,innerHeight:1000,devicePixelRatio:1,requestAnimationFrame:callback=>{pending.set(++next,callback);return next;},
  cancelAnimationFrame:id=>{if(pending.has(id))cancelled.push(pending.get(id));pending.delete(id);},
  fetch:async url=>{requests.push(fileURLToPath(url));assert.equal(fileURLToPath(url),fixture);
   return {ok:true,json:async()=>JSON.parse(fs.readFileSync(fixture,'utf8'))};}})){
  saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
  Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
 }
 const create=URL.createObjectURL,revoke=URL.revokeObjectURL;
 URL.createObjectURL=blob=>{downloads.push(blob);return 'blob:diagnostic-fixture';};
 URL.revokeObjectURL=()=>{};
 const proto=window.HTMLElement.prototype;
 proto.getBoundingClientRect=()=>({top:10,bottom:290});
 proto.scrollIntoView=()=>{};
 const {mount}=await import(pathToFileURL(path.join(diagnostics,'index.mjs')).href+'?cancel='+ ++moduleNumber);
 const container=document.getElementById('target');
 let handle;
 async function open(){
  handle=await mount({container});
  assert.equal(handle.ready,true);
  const root=container.shadowRoot;
  Object.defineProperty(root.getElementById('repeat'),'value',{configurable:true,value:'1'});
  return root;
 }
 const first=await open();
 async function step(count=1){
  for(let i=0;i<count;i++){
   const frame=pending.entries().next().value;
   assert.ok(frame,'expected an owned diagnostic frame');
   pending.delete(frame[0]);frame[1](performance.now());
   await Promise.resolve();
  }
 }
 const settle=()=>new Promise(setImmediate);
 const close=()=>handle?.unmount();
 return {first,open,close,pending,cancelled,step,settle,requests,downloads,dispose(){
   close();URL.createObjectURL=create;URL.revokeObjectURL=revoke;
   for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }};
}

function buttons(root){
 const id=s=>root.getElementById(s);
 const cancel=id('cancel-comparison');
 assert.ok(cancel,'Native Diagnostics exposes an explicit Cancel comparison action');
 return {run:id('run'),cancel,exp:id('export'),repeat:id('repeat'),recover:id('recover'),
  preview:id('preview-run'),status:id('status'),workload:id('workload'),results:id('results')};
}
const receipt=b=>JSON.parse(b.results.textContent);

test('cancel stops a pending frame before any measurement, and exposes an explicitly partial export',async()=>{
 const h=await setup();
 try{
  const b=buttons(h.first);
  assert.equal(b.cancel.disabled,true);
  b.run.click();assert.equal(h.pending.size,1);
  assert.equal(b.cancel.disabled,false);assert.equal(b.exp.disabled,true);
  b.cancel.click();await h.settle();
  assert.equal(h.pending.size,0);
  assert.equal(b.cancel.disabled,true);
  assert.equal(b.run.disabled,false);assert.equal(b.recover.disabled,false);
  assert.equal(b.exp.disabled,false);assert.equal(b.repeat.disabled,false);
  const r=receipt(b);
  assert.deepEqual({complete:r.complete,outcome:r.outcome,samples:r.samples},{complete:false,outcome:'cancelled',samples:[]});
  assert.match(r.error,/no winner declared/i);
  assert.equal(typeof r.finished_at,'string');
  assert.equal(b.workload.textContent,'');
  b.exp.click();
  assert.equal(h.downloads.length,1);
  assert.deepEqual(JSON.parse(await h.downloads[0].text()),r);
  assert.equal(h.requests.length,1);
 }finally{h.dispose();}
});

test('a completed sample survives cancellation; a stale old frame cannot finish or mutate a restarted comparison',async()=>{
 const h=await setup();
 try{
  const b=buttons(h.first);
  b.run.click();await h.step(12);
  assert.match(b.status.textContent,/Round 1\/7: append/);
  b.cancel.click();await h.settle();
  const partial=receipt(b);
  assert.equal(partial.outcome,'cancelled');assert.equal(partial.complete,false);
  assert.deepEqual(partial.samples.map(x=>[x.round,x.strategy,x.complete_output_equal]),[[0,'full_history',true]]);
  assert.equal(h.cancelled.length,1);
  const stale=h.cancelled[0];
  b.run.click();assert.equal(h.pending.size,1);
  stale(performance.now());await h.settle();
  assert.equal(h.pending.size,1);
  assert.deepEqual(receipt(b),partial);
  await h.step(21*12);await h.settle();
  const full=receipt(b);
  assert.equal(full.complete,true);
  assert.equal(full.samples.length,21);
  assert.ok(full.samples.every(x=>x.complete_output_equal));
  assert.equal(full.outcome,undefined);assert.equal(full.error,undefined);
  assert.equal(b.cancel.disabled,true);
 }finally{h.dispose();}
});

test('navigation during active and already-requested cancellation preserves distinct receipts without late writes',async()=>{
 const h=await setup();
 try{
  const original=buttons(h.first);original.run.click();
  h.close();await h.settle();
  const next=buttons(await h.open());
  assert.equal(receipt(next).outcome,'interrupted');
  assert.match(receipt(next).error,/Navigation interrupted/);
  next.run.click();await h.step(12);
  next.cancel.click();h.close();
  const remount=buttons(await h.open());
  for(const callback of h.cancelled)callback(performance.now());
  await h.settle();
  assert.equal(receipt(remount).outcome,'cancelled');assert.equal(receipt(remount).complete,false);
  assert.equal(receipt(remount).samples.length,1);
  assert.equal(remount.run.disabled,false);assert.equal(remount.cancel.disabled,true);
  remount.recover.click();
  assert.equal(JSON.parse(h.first.getElementById('recovery-results').textContent).complete,true);
 }finally{h.dispose();}
});
