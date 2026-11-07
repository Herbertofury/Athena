import test from 'node:test';
import assert from 'node:assert/strict';
import {submitJob,decodeJobReceipt,MAX_JOB_RECEIPT_BYTES} from '../apps/atlas-lab/ui/job-submit.mjs';
const reply=body=>new Response(body,{headers:{'content-type':'application/json'}});
test('fixed receipt decoder retains complete SQLite integer identity',()=>{
 for(const id of ['1','9007199254740993','9223372036854775807'])assert.equal(decodeJobReceipt(' \n{"id": '+id+'}\r\n').id,id);
 assert.notEqual(String(JSON.parse('{"id":9007199254740993}').id),decodeJobReceipt('{"id":9007199254740993}').id);
});
test('ambiguous, noncanonical, malformed and oversized receipts stay unconfirmed',()=>{
 for(const text of ['{"id":1,"id":2}','{"id":1,"extra":true}','{"id":0}','{"id":-1}','{"id":1.0}','{"id":1e3}','{"id":"1"}','{"id":9223372036854775808}','{"\\u0069d":1}','{"id":01}','{}','null','{"id":1}\u00a0',' '.repeat(MAX_JOB_RECEIPT_BYTES)+'{"id":1}'])assert.throws(()=>decodeJobReceipt(text),/unconfirmed/);
});
test('one fixed POST with exact payload returns a string id without automatic retries',async()=>{
 let requests=0;const job={CollectModrinth:{project:'sodium'}};
 const result=await submitJob(job,{fetchImpl:async(url,options)=>{requests++;assert.equal(url,'/api/jobs');assert.equal(options.method,'POST');assert.equal(options.body,JSON.stringify(job));assert.equal(options.headers['X-Atlas-Request'],'local-ui');assert.equal(options.redirect,'error');assert.equal(options.credentials,'same-origin');return reply('{"id":9007199254740993}');}});
 assert.equal(result.id,'9007199254740993');assert.equal(requests,1);
});
test('invalid deadline makes no request',async()=>{
 let count=0;for(const timeoutMs of [0,-1,30001,NaN,1.5])await assert.rejects(submitJob('DedupExperiment',{timeoutMs,fetchImpl:async()=>{count++;return reply('{"id":1}');}}));assert.equal(count,0);
});
test('failed status, wrong MIME, invalid UTF-8 and excess bytes never become accepted jobs',async()=>{
 const responses=[new Response('private provider details',{status:500}),new Response('{"id":1}',{headers:{'content-type':'text/html'}}),reply(Uint8Array.of(0xc3,0x28)),reply('x'.repeat(MAX_JOB_RECEIPT_BYTES+1))];
 for(const response of responses){let requests=0;await assert.rejects(submitJob('DedupExperiment',{fetchImpl:async()=>{requests++;return response;}}),error=>error.message.includes('unconfirmed')&&!error.message.includes('private provider'));assert.equal(requests,1);}
});
test('fragmented receipt bytes and bounded empty chunks are handled without chunk retention',async()=>{
 const bytes=new TextEncoder().encode('{"id":9223372036854775807}');let n=0;const stream=new ReadableStream({pull(c){if(n===bytes.length){c.close();return;}c.enqueue(bytes.slice(n,n+1));n++;}},{highWaterMark:0});assert.equal((await submitJob('DedupExperiment',{fetchImpl:async()=>reply(stream)})).id,'9223372036854775807');
 let cancelled=false;const empty=new ReadableStream({pull(c){c.enqueue(new Uint8Array(0));},cancel(){cancelled=true;}},{highWaterMark:0});await assert.rejects(submitJob('DedupExperiment',{fetchImpl:async()=>reply(empty)}),/unconfirmed/);assert.equal(cancelled,true);
});
test('transport failure is unconfirmed and does not expose its private diagnostic',async()=>{
 let calls=0;await assert.rejects(submitJob('DedupExperiment',{fetchImpl:async()=>{calls++;throw Error('https://private.invalid/?token=fixture-secret');}}),error=>error.message.includes('unconfirmed')&&!error.message.includes('fixture-secret'));assert.equal(calls,1);
});
