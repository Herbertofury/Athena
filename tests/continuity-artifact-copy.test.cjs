const assert=require('node:assert/strict'),test=require('node:test'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{webcrypto,createHash}=require('node:crypto');
const {parseHTML}=require('linkedom');
const root=path.resolve(process.env.ATHENA_COPY_TEST_PACKAGE||path.join(__dirname,'../dist'));
const approved=Uint8Array.of(0,255,10,13,0);
const digest=createHash('sha256').update(approved).digest('hex');
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise};};
const change=(node,window,kind)=>node.dispatchEvent(new window.Event(kind));
const copy=(bytes=approved,name='renamed.bin')=>({size:bytes.byteLength,name,type:'text/html',arrayBuffer:async()=>bytes.slice().buffer});
async function setup({state,crypto=webcrypto}={}){
 const {document,window}=parseHTML('<main><div id="native"></div></main>');
 const choice=window.HTMLSelectElement.prototype;
 Object.defineProperty(choice,'value',{configurable:true,get(){return this._value||'';},set(v){this._value=v;}});
 const original=new Map(),fences={network:0,open:0,write:0,storage:0};
 for(const [key,value] of Object.entries({document,crypto,indexedDB:{open(){fences.open++;throw Error('must not access archive');}},
  localStorage:{getItem(){fences.storage++;throw Error('must not access storage');}},fetch(){fences.network++;throw Error('must not fetch');}})){
  original.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 const {mount}=await import(pathToFileURL(path.join(root,'workspaces/continuity/index.mjs')).href);
 const controller=mount({container:document.getElementById('native'),state,setState(){fences.write++;throw Error('must not save');}});
 const q=s=>document.getElementById('native').shadowRoot.querySelector(s);
 return {q,window,fences,dispose(){controller.unmount();for(const [key,desc] of original){if(desc)Object.defineProperty(globalThis,key,desc);else delete globalThis[key];}}};
}
function panel(s){
 const view=s.q('[data-copy-verifier]');
 assert.ok(view,'mounted Continuity has the read-only copied-artifact verifier');
 const q=selector=>view.querySelector(selector);
 const form=q('form'),hash=q('input[type=text]'),file=q('input[type=file]'),submit=q('button[type=submit]'),status=q('[role=status]');
 function text(value){hash.value=value;change(hash,s.window,'input');}
 function select(x){file.files=x?[x]:[];change(file,s.window,'change');}
 return {view,form,hash,file,submit,status,text,select,verify:()=>form.onsubmit({preventDefault(){}})};
}
const untouched={network:0,open:0,write:0,storage:0};
test('mounted native Continuity verifies exact moved bytes without opening an archive or persisting even when note storage is unavailable',async()=>{
 const s=await setup({state:{schema:999,entries:[]}});
 try{
  const a=panel(s);assert.equal(a.submit.disabled,false);assert.equal(a.file.disabled,false);
  a.text('  '+digest.toUpperCase()+'  ');a.select(copy());
  assert.doesNotMatch(a.status.textContent,/Bytes match/);
  await a.verify();
  assert.match(a.status.textContent,/Bytes match the recorded SHA-256/);
  assert.match(a.status.textContent,/not identity or authenticity/);
  assert.doesNotMatch(a.status.textContent,new RegExp(digest,'i'));
  assert.equal(a.view.querySelector('img,iframe,video,object,script'),null);
  assert.deepEqual(s.fences,untouched);
 }finally{s.dispose();}
});
test('mismatched same-size bytes and malformed or out-of-budget files never say match; unavailable copy or crypto can retry',async()=>{
 const s=await setup();
 try{
  const a=panel(s);let reads=0;
  a.text(digest.slice(1));a.select({...copy(),arrayBuffer:async()=>{reads++;return approved.buffer;}});
  await a.verify();assert.match(a.status.textContent,/64 hexadecimal/);assert.equal(reads,0);
  a.text(digest);a.select();await a.verify();assert.match(a.status.textContent,/Choose the local copy/);
  for(const size of [0,8*1024*1024+1]){
   a.select({size,arrayBuffer:async()=>{reads++;return approved.buffer;}});
   await a.verify();assert.match(a.status.textContent,/nonempty.*8 MiB/);assert.equal(reads,0);
  }
  a.select({size:approved.length,arrayBuffer:async()=>new ArrayBuffer(0)});
  await a.verify();assert.match(a.status.textContent,/could not be read/);
  a.select({size:approved.length,arrayBuffer:async()=>{throw Error('protected path with private information');}});
  await a.verify();assert.match(a.status.textContent,/could not be read/);
  assert.doesNotMatch(a.status.textContent,/protected path/);
  a.select(copy(Uint8Array.of(0,255,10,13,1)));await a.verify();
  assert.match(a.status.textContent,/Bytes do not match/);
  assert.doesNotMatch(a.status.textContent,/match the recorded SHA-256\. This checks/);
  assert.equal(a.submit.disabled,false);
  assert.deepEqual(s.fences,untouched);
 }finally{s.dispose();}
 const unsupported=await setup({crypto:{}});
 try{let reads=0;const a=panel(unsupported);a.text(digest);a.select({size:1,arrayBuffer:async()=>{reads++;}});
  await a.verify();assert.match(a.status.textContent,/SHA-256 is unavailable/);assert.equal(reads,0);
 }finally{unsupported.dispose();}
});
test('replacement, explicit Clear and unmount fence held reads or hashes and allow no second in-flight copy',async()=>{
 const first=defer(),firstHash=defer(),digestStarted=defer();let started=0;
 const s=await setup({crypto:{subtle:{digest(...args){started++;if(started===1){digestStarted.resolve();return firstHash.promise;}return webcrypto.subtle.digest(...args);}}}});
 try{
  const a=panel(s);let reads=0;a.text(digest);
  a.select({size:approved.length,arrayBuffer:()=>{reads++;return first.promise;}});
  const reading=a.verify();a.text('a'.repeat(64));await a.verify();
  assert.equal(reads,1);assert.equal(a.submit.disabled,true);first.resolve(approved.buffer);await reading;
  assert.equal(started,0);assert.doesNotMatch(a.status.textContent,/Bytes match/);assert.equal(a.submit.disabled,false);
  a.text(digest);a.select(copy());const hashing=a.verify();await digestStarted.promise;
  const clear=a.view.querySelector('button[type=button]');clear.onclick();
  firstHash.resolve(await webcrypto.subtle.digest('SHA-256',approved));await hashing;
  assert.equal(a.hash.value,'');assert.equal(a.file.value,'');assert.doesNotMatch(a.status.textContent,/Bytes match/);
  a.text(digest);a.select(copy());await a.verify();assert.match(a.status.textContent,/Bytes match/);
  const end=defer();a.select({size:1,arrayBuffer:()=>end.promise});const exiting=a.verify();s.dispose();
  end.resolve(Uint8Array.of(42).buffer);await exiting;assert.deepEqual(s.fences,untouched);
 }finally{s.dispose();}
});
