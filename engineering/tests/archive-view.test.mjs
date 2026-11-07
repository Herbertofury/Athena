import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadSavedProject,createArchiveSelection,MAX_ARCHIVE_BYTES} from '../apps/atlas-lab/ui/archive-view.mjs';
const id='AANobbMI',text=' {"id":"AANobbMI","future":18446744073709551617,"text":"☃ <script>not executed</script>"} ',bytes=new TextEncoder().encode(text);
function response(body=bytes,extra={}){return new Response(body,{headers:{'content-type':'application/json','x-atlas-archive-kind':'project','x-atlas-canonical-id':id,'x-atlas-generation':'9007199254740993','x-atlas-payload-sha256':createHash('sha256').update(body).digest('hex'),...extra}});}
test('exact text, UTF-8 bytes and large generation survive without JSON-number conversion',async()=>{
 let request;const result=await loadSavedProject(id,{fetchImpl:async(url,options)=>{request={url,options};return response();}});
 assert.equal(result.text,text);assert.deepEqual(result.bytes,bytes);assert.equal(result.generation,'9007199254740993');assert.equal(request.url,'/api/project-archive/'+id);assert.equal(request.options.redirect,'error');assert.equal(request.options.cache,'no-store');
});
test('invalid identity or deadlines cannot initiate a request',async()=>{
 let called=false;const fetchImpl=async()=>{called=true;return response();};
 for(const value of ['',null,'sodium','../path','https://example.invalid','AANobbMI,abcdefgh'])await assert.rejects(loadSavedProject(value,{fetchImpl}));
 for(const timeoutMs of [0,30001,NaN,1.5])await assert.rejects(loadSavedProject(id,{fetchImpl,timeoutMs}));assert.equal(called,false);
});
test('header, hash and length mismatches reject rather than become partial success',async()=>{
 for(const headers of [{'x-atlas-canonical-id':'ZZZZZZZZ'},{'x-atlas-generation':'0'},{'x-atlas-generation':'9223372036854775808'},{'x-atlas-payload-sha256':'0'.repeat(64)},{'content-length':'1'},{'content-length':String(MAX_ARCHIVE_BYTES+1)},{'content-type':'text/html'}])await assert.rejects(loadSavedProject(id,{fetchImpl:async()=>response(bytes,headers)}));
 await assert.rejects(loadSavedProject(id,{fetchImpl:async()=>new Response('not found',{status:404})}),/No archived/);
 await assert.rejects(loadSavedProject(id,{fetchImpl:async()=>response(new Uint8Array())}),/empty/);
});
test('stream budget and invalid UTF-8 reject complete-response acceptance',async()=>{
 await assert.rejects(loadSavedProject(id,{fetchImpl:async()=>response(new Uint8Array(MAX_ARCHIVE_BYTES+1))}),/size budget/);
 await assert.rejects(loadSavedProject(id,{fetchImpl:async()=>response(new Uint8Array([0xc3,0x28]))}));
});
test('pre-abort and bounded timeout stop the request path',async()=>{
 const controller=new AbortController();controller.abort();let called=false;
 await assert.rejects(loadSavedProject(id,{signal:controller.signal,fetchImpl:async()=>{called=true;return response();}}));assert.equal(called,false);
 await assert.rejects(loadSavedProject(id,{timeoutMs:5,fetchImpl:(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))}),/timed out/);
});
test('late responses cannot overwrite the newer selection even if a loader ignores abort',async()=>{
 const waiting=new Map(),selection=createArchiveSelection((key,{signal})=>new Promise(resolve=>waiting.set(key,{resolve,signal})));
 const old=selection.load('old'),fresh=selection.load('fresh');assert.equal(waiting.get('old').signal.aborted,true);
 waiting.get('fresh').resolve({id:'fresh'});assert.equal((await fresh).status,'ready');waiting.get('old').resolve({id:'old'});assert.equal((await old).status,'superseded');assert.equal(selection.last.id,'fresh');assert.equal(selection.pending,false);
});
test('failure and cancellation retain the previous verified result',async()=>{
 let mode='good',resolve;const selection=createArchiveSelection(()=>mode==='good'?Promise.resolve({id:'good'}):mode==='fail'?Promise.reject(Error('generated failure')):new Promise(r=>resolve=r));
 await selection.load('good');mode='fail';await assert.rejects(selection.load('bad'));assert.equal(selection.last.id,'good');mode='pending';const pending=selection.load('pending');selection.cancel();resolve({id:'late'});assert.equal((await pending).status,'superseded');assert.equal(selection.last.id,'good');assert.equal(selection.pending,false);
});
test('tiny and empty transport chunks preserve exact bytes without chunk aliases',async()=>{
 const payload=Uint8Array.from({length:32769},(_,i)=>65+i%26);
 let position=0,empty=true;const shared=new Uint8Array(1);
 const stream=new ReadableStream({pull(controller){
  if(position===payload.length){controller.close();return;}
  if(empty){empty=false;controller.enqueue(new Uint8Array(0));return;}
  empty=true;shared[0]=payload[position++];controller.enqueue(shared);
 }},{highWaterMark:0});
 const headers={'content-type':'application/json','x-atlas-archive-kind':'project','x-atlas-canonical-id':id,'x-atlas-generation':'1','x-atlas-payload-sha256':createHash('sha256').update(payload).digest('hex')};
 const result=await loadSavedProject(id,{fetchImpl:async()=>new Response(stream,{headers})});
 assert.deepEqual(result.bytes,payload);assert.equal(result.bytes.buffer.byteLength,payload.length);
});
test('fragmented stream accepts exact byte limit and cancels overflow',async()=>{
 for(const extra of [0,1]){
  const payload=new Uint8Array(MAX_ARCHIVE_BYTES+extra).fill(32);let position=0,cancelled=false;
  const stream=new ReadableStream({pull(controller){if(position===payload.length){controller.close();return;}const end=Math.min(position+8191,payload.length);controller.enqueue(payload.slice(position,end));position=end;},cancel(){cancelled=true;}},{highWaterMark:0});
  const headers={'content-type':'application/json','x-atlas-archive-kind':'project','x-atlas-canonical-id':id,'x-atlas-generation':'1','x-atlas-payload-sha256':createHash('sha256').update(payload).digest('hex')};
  const pending=loadSavedProject(id,{fetchImpl:async()=>new Response(stream,{headers})});
  if(extra){await assert.rejects(pending,/size budget/);assert.equal(cancelled,true);}else{const result=await pending;assert.deepEqual(result.bytes,payload);assert.equal(result.bytes.buffer.byteLength,MAX_ARCHIVE_BYTES);}
 }
});
