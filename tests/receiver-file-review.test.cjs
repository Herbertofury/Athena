const assert=require('node:assert/strict'),test=require('node:test');
const {createHash,webcrypto}=require('node:crypto'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {parseHTML}=require('linkedom');
const assets=path.resolve(process.env.ATHENA_RECEIVER_FILE_TEST_PACKAGE||path.join(__dirname,'../dist'));
let evaluation=0;
const load=()=>import(pathToFileURL(path.join(assets,'workspaces/engineering/receiver/index.mjs')).href+'?file='+ ++evaluation);
const identity='athena-native-complete-receiver-v1';
const run=(extend={})=>({harness:identity,source_harness:'atlas-complete-receiver-v9-explicit-phase-status',complete:true,count:200,bytes:8192,
 execution:'main',started_at:'2026-11-14T00:00:00.000Z',finished_at:'2026-11-14T00:00:01.000Z',
 dataset:{sha256:'a'.repeat(64)},samples:[0,1,2].flatMap(round=>['whole','bounded'].map(lane=>({round,lane,complete_parity:true,request_ms:round+.5}))),...extend});
const bytes=value=>new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value)).buffer;
const file=(value,props={})=>{const data=bytes(value);return {size:data.byteLength,type:'application/json',name:'receiver-current.json',arrayBuffer:async()=>data,...props};};
const wait=()=>new Promise(setImmediate);
const digest=buffer=>createHash('sha256').update(Buffer.from(buffer)).digest('hex');
function delayed(){let complete;return{promise:new Promise(resolve=>{complete=resolve;}),complete: (...args)=>complete(...args)};}

async function setup(stored=null){
 const {window,document}=parseHTML('<!doctype html><html><body><section id="host"></section></body></html>');
 const descriptors=new Map(),reads=[],hashes=new Set();
 document.hasFocus=()=>true;
 const storage={getItem:key=>{reads.push(key);return key==='athena.receiver.last-good.v1'?stored:null;},setItem(){assert.fail('file review must not save anything');}};
 Object.defineProperty(window,'localStorage',{configurable:true,value:storage});
 const crypto={subtle:{digest(...args){const job=webcrypto.subtle.digest(...args);hashes.add(job);job.then(()=>hashes.delete(job),()=>hashes.delete(job));return job;}}};
 for(const [name,value] of Object.entries({document,window,crypto,fetch:()=>assert.fail('file review must not fetch')})){
  descriptors.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
  Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
 }
 const module=await load(),container=document.getElementById('host');
 let controller;
 const open=async()=>{controller=await module.mount({container});return container.shadowRoot;};
 const root=await open();
 const choose=(root,f)=>{
  const box=root.getElementById('receipt-file');
  assert.ok(box,'native Receiver can review an explicitly chosen receipt');
  Object.defineProperty(box,'files',{value:[f],configurable:true});box.dispatchEvent(new window.Event('change'));
 };
 const drain=async()=>{await wait();await Promise.allSettled([...hashes]);await wait();};
 return {root,open,choose,reads,drain,current:()=>controller,dispose(){
  controller?.unmount();
  for(const [name,descriptor] of descriptors){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}
 }};
}

test('portable review shows exact file fingerprint and actual lane samples without replacing current or last-good',async()=>{
 const h=await setup();
 try{
  const original=JSON.stringify(run({untrusted:'<img src=x onerror=alert(1)>'}),null,2)+'\n';
  h.choose(h.root,file(original,{name:'<img>.json'}));await h.drain();
  const output=h.root.getElementById('receipt-file-output');
  assert.equal(output.hidden,false);
  assert.equal(output.querySelector('[data-receiver-file-digest]').textContent,digest(bytes(original)));
  assert.match(output.textContent,/Unverified file evidence/);
  assert.deepEqual([...output.querySelectorAll('tbody tr')].map(row=>[...row.children].map(cell=>cell.textContent)),
   [['1','whole','0.5'],['1','bounded','0.5'],['2','whole','1.5'],['2','bounded','1.5'],['3','whole','2.5'],['3','bounded','2.5']]);
  assert.equal(output.querySelectorAll('img,iframe,a').length,0);
  assert.doesNotMatch(output.textContent,/onerror/);
  assert.equal(h.root.getElementById('output').textContent,'');
  assert.deepEqual(h.current().exportState(),{receiptAvailable:false,lastGoodAvailable:false});
  assert.equal(h.root.getElementById('last').disabled,true);
  assert.deepEqual(h.reads,[]);
 }finally{h.dispose();}
});

test('admission rejects wrong MIME, overbudget/drifted/undecodable bytes, older shape and duplicate keys',async()=>{
 const module=await load();
 assert.equal(typeof module.reviewReceiverFile,'function');
 let forbiddenReads=0;
 for(const bad of [
  file(run(),{type:'text/plain',arrayBuffer:()=>{forbiddenReads++;}}),
  file(run(),{size:262145,arrayBuffer:()=>{forbiddenReads++;}}),
  file(run(),{type:'',name:'other.csv',arrayBuffer:()=>{forbiddenReads++;}}),
 ])await assert.rejects(module.reviewReceiverFile(bad));
 assert.equal(forbiddenReads,0);
 await assert.rejects(module.reviewReceiverFile(file(run(),{size:10})),/size changed/);
 await assert.rejects(module.reviewReceiverFile({type:'application/json',size:1,arrayBuffer:async()=>new Uint8Array([255]).buffer}),/UTF-8 JSON/);
 await assert.rejects(module.reviewReceiverFile(file(run({harness:'atlas-complete-receiver-v9-explicit-phase-status'}))),/older or different/i);
 await assert.rejects(module.reviewReceiverFile(file(run({source_harness:'prior'}))),/older or different/i);
 await assert.rejects(module.reviewReceiverFile(file(run({dataset:{sha256:['a'.repeat(64)]}}))),/invalid/);
 await assert.rejects(module.reviewReceiverFile(file(run({started_at:{toString:'wrong'}}))),/invalid/);
 const conflicting=JSON.stringify(run()).replace('"count":200','"count":5,"c\\u006funt":200');
 await assert.rejects(module.reviewReceiverFile(file(conflicting)),/Duplicate/);
 await assert.rejects(module.reviewReceiverFile(file(run({samples:run().samples.map(x=>({...x,request_ms:'3'}))}))),/parity/);
 await assert.rejects(module.reviewReceiverFile(file(run({complete:false}))),/complete/);
 await assert.rejects(module.reviewReceiverFile(file(run({untrusted:'x'.repeat(131000)+'é'.repeat(70000)}))),/256 KiB/);
 assert.ok(await module.reviewReceiverFile(file(run(),{type:''})));
});

test('invalid selection leaves prior review and late selection, clear or navigation cannot repopulate stale data',async()=>{
 const h=await setup();
 try{
  const r=h.root,output=r.getElementById('receipt-file-output'),status=r.getElementById('receipt-file-status');
  h.choose(r,file(run()));await h.drain();const prior=output.textContent;
  const b=delayed();h.choose(r,file(run(),{arrayBuffer:()=>b.promise}));
  h.choose(r,file(run(),{type:'text/html'}));await h.drain();
  assert.match(status.textContent,/previous file review retained/i);
  assert.equal(output.textContent,prior);
  b.complete(bytes(run()));await h.drain();assert.equal(output.textContent,prior);
  const c=delayed();h.choose(r,file(run(),{arrayBuffer:()=>c.promise}));
  r.getElementById('receipt-file-clear').click();c.complete(bytes(run()));await h.drain();
  assert.equal(output.hidden,true);assert.equal(output.textContent,'');
  const old=delayed();h.choose(r,file(run(),{arrayBuffer:()=>old.promise}));h.current().unmount();
  const next=await h.open();old.complete(bytes(run()));await h.drain();
  assert.equal(next.getElementById('receipt-file-output').hidden,true);
  assert.equal(next.getElementById('output').textContent,'');
  assert.deepEqual(h.reads,[]);
 }finally{h.dispose();}
});

test('a different compatible file and a rejected replacement leave an existing recovered last-good intact',async()=>{
 const old=JSON.stringify(run()),stored=JSON.stringify({schema:1,receipt:old,sha256:digest(bytes(old))});
 const h=await setup(stored);
 try{
  h.root.getElementById('restore-receipt').click();await h.drain();
  const current=h.root.getElementById('output');
  assert.deepEqual(JSON.parse(current.textContent),JSON.parse(old));
  const original=current.textContent;
  assert.deepEqual(h.current().exportState(),{receiptAvailable:true,lastGoodAvailable:true});
  const alternative=JSON.stringify(run({execution:'worker',dataset:{sha256:'b'.repeat(64)}}));
  h.choose(h.root,file(alternative));await h.drain();
  assert.equal(h.root.querySelector('[data-receiver-file-digest]').textContent,digest(bytes(alternative)));
  assert.equal(current.textContent,original);
  assert.equal(h.root.getElementById('last').disabled,false);
  h.choose(h.root,file(run({complete:false})));await h.drain();
  assert.equal(h.root.querySelector('[data-receiver-file-digest]').textContent,digest(bytes(alternative)));
  assert.equal(current.textContent,original);
  assert.deepEqual(h.reads,['athena.receiver.last-good.v1']);
 }finally{h.dispose();}
});
