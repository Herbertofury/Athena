import {phaseBreakdown} from '../experiments/card-receiver-lab/phase-clock.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {acceptVerifiedInput} from '../experiments/card-receiver-lab/receipt-protocol.mjs';
const source=await readFile(new URL('../docs/card-receiver-lab/receiver.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function workerRun('),source.indexOf("$('run').addEventListener"));
function setup(throws=false){
 const workers=[];
 class Worker {constructor(url){this.url=String(url);this.terminated=0;workers.push(this)}terminate(){this.terminated++}postMessage(value){this.sent=value;if(throws)throw Error('post failure')}}
 const context={Worker,URL,Error,ArrayBuffer,TextDecoder,JSON,acceptVerifiedInput,phaseBreakdown,performance,setTimeout,clearTimeout,sequence:0,cancelWorker:null};
 vm.runInNewContext(body.replace('import.meta.url',"'https://example.invalid/receiver.js'"),context);
 const prepared={records:[{all:'retained'}],dataset:{serialized_bytes:512,sha256:'a'.repeat(64)}};
 const receipt={complete:true,algorithm:'bounded-complete-v1',count:2,metadata_bytes_per_record:512,serialized_bytes:512,sha256:'a'.repeat(64)};
 return {context,workers,prepared,receipt};
}
test('actual client ignores stale request identity and accepts bound receipt without dropping caller records',async()=>{
 const {context,workers,prepared,receipt}=setup();const pending=context.workerRun('receipt',prepared,2,512),w=workers[0];
 w.onmessage({data:{id:w.sent.id-1,ok:true,format:'verified-input',receipt}});assert.equal(w.terminated,0);
 w.onmessage({data:{id:w.sent.id,ok:true,format:'verified-input',receipt}});const result=await pending;
 assert.equal(result.result,prepared);assert.equal(w.terminated,1);assert.equal(context.cancelWorker,null);assert.equal(w.sent.transport,'receipt');
});
test('actual client rejects receipt mismatch and terminates rather than falling back',async()=>{
 const {context,workers,prepared,receipt}=setup();const pending=context.workerRun('receipt',prepared,2,512),w=workers[0];
 w.onmessage({data:{id:w.sent.id,ok:true,format:'verified-input',receipt:{...receipt,sha256:'b'.repeat(64)}}});
 await assert.rejects(pending,/bind/);assert.equal(w.terminated,1);assert.equal(context.cancelWorker,null);
});
test('actual client cancellation clears lifecycle and ignores late success',async()=>{
 const {context,workers,prepared,receipt}=setup();const pending=context.workerRun('receipt',prepared,2,512),w=workers[0];
 context.cancelWorker();await assert.rejects(pending,/cancelled/);
 let lateReads=0;w.onmessage({data:{id:w.sent.id,ok:true,format:'verified-input',get receipt(){lateReads++;return receipt;}}});assert.equal(lateReads,0);assert.equal(w.terminated,1);assert.equal(context.cancelWorker,null);
});
test('actual client handles synchronous post failure without leaking worker or timer',async()=>{
 const {context,workers,prepared}=setup(true);await assert.rejects(context.workerRun('receipt',prepared,2,512),/post failure/);assert.equal(workers[0].terminated,1);assert.equal(context.cancelWorker,null);
});
test('build comparisons change only worker artifact, retaining full bounded receipt contract',async()=>{
 for(const lane of ['modules','esbuild','rolldown']){
  const {context,workers,prepared,receipt}=setup();const pending=context.workerRun(lane,prepared,2,512),w=workers[0];
  assert.equal(w.sent.lane,'bounded');assert.equal(w.sent.transport,'receipt');assert.equal(w.sent.prepared,prepared);
  assert.ok(w.url.includes(lane==='modules'?'receiver-worker':'worker-'+lane));
  w.onmessage({data:{id:w.sent.id,ok:true,format:'verified-input',receipt}});assert.equal((await pending).result,prepared);assert.equal(w.terminated,1);
 }
});
