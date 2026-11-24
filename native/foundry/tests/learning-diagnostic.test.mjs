import assert from 'node:assert/strict';
import test from 'node:test';
import {acceptedJobId,observeLearningUi,projectLearningOverview,readAcceptedReceipt,readLearningUiOnce,readLearningOverviewOnce} from '../../../scripts/foundry-learning-diagnostic.mjs';
const id='9223372036854775807', secret='SYNTHETIC detail that must not appear';
test('diagnostic matches exact integer receipt without serializing other content',async()=>{
 const body='{"id":'+id+'}',make=(length,value)=>({headers:()=>({'content-length':length}),text:async()=>value});
 assert.equal(await readAcceptedReceipt(make(String(body.length),body)),id);
 assert.equal(await readAcceptedReceipt(make('999999',secret)),null);
 assert.equal(acceptedJobId('{"id":'+id+',"detail":"'+secret+'"}'),null);
 assert.equal(acceptedJobId('{"id":9223372036854775808}'),null);
 assert.equal(acceptedJobId('{"id":1,"id":2}'),null);
});
test('visible error goes through fixed categories, never exposing status text or paths',()=>{
 const original=globalThis.document;
 try{
  globalThis.document={querySelector:selector=>selector==='#run-experiment'?{disabled:true}:{textContent:'Job 2 was accepted, but status is unconfirmed. '+secret}};
  assert.deepEqual(observeLearningUi(),{state:'status_unconfirmed',submitDisabled:true});
  globalThis.document={querySelector:selector=>selector==='#run-experiment'?{disabled:false}:{textContent:'Job 2: succeeded. Complete experiment history is retained. '+secret}};
  assert.deepEqual(observeLearningUi(),{state:'terminal_reported_retained',submitDisabled:false});
  globalThis.document={querySelector:()=>null};assert.deepEqual(observeLearningUi(),{state:'unavailable',submitDisabled:null});
 }finally{globalThis.document=original;}
});
test('the snapshot projects only exact matching job enum, terminal flag and reference presence',()=>{
 const row={id_text:id,job:'DedupExperiment',state:'succeeded',result:{experiment_id_text:'16',payload:secret},path:secret};
 assert.deepEqual(projectLearningOverview({jobs:[{...row,id_text:'7'},row]},id),{observation:'observed',state:'succeeded',terminal:true,hasHistoryReference:true});
 assert.deepEqual(projectLearningOverview({jobs:[{...row,state:'running',result:null}]},id),{observation:'observed',state:'running',terminal:false,hasHistoryReference:false});
 assert.deepEqual(projectLearningOverview({jobs:[row,row]},id),{observation:'ambiguous'});
 assert.deepEqual(projectLearningOverview({jobs:[{...row,state:secret}]},id),{observation:'unknown_state'});
 assert.deepEqual(projectLearningOverview({jobs:[{...row,id_text:'7'}]},id),{observation:'not_in_snapshot'});
});
test('queue diagnosis is one independent loopback GET; unknown acceptance never makes a request',async()=>{
 const origin='http://127.0.0.1:41379',calls=[];
 const payload=JSON.stringify({jobs:[{id_text:id,job:'DedupExperiment',state:'failed',result:{error:secret}}]});
 const fake=async(u,opts)=>{calls.push([u.href,opts]);return new Response(payload,{headers:{'content-length':String(payload.length)}});};
 assert.deepEqual(await readLearningOverviewOnce(origin,null,fake),{observation:'acceptance_not_observed'});
 assert.deepEqual(await readLearningOverviewOnce('https://example.invalid',id,fake),{observation:'unavailable'});
 assert.equal(calls.length,0);
 assert.deepEqual(await readLearningOverviewOnce(origin,id,fake),{observation:'observed',state:'failed',terminal:true,hasHistoryReference:false});
 assert.deepEqual(calls.map(c=>c[0]),[origin+'/api/overview']);
 assert.equal(calls[0][1].method,undefined);assert.equal(calls[0][1].redirect,'error');
 assert.deepEqual(await readLearningOverviewOnce(origin,id,async()=>new Response(secret,{status:500})),{observation:'http_error',status:500});
 assert.deepEqual(await readLearningOverviewOnce(origin,id,async()=>new Response(secret)),{observation:'missing_or_oversized_length'});
});
test('a closed or stalled page cannot hold the failure report',async()=>{
 const unavailable={state:'unavailable',submitDisabled:null};
 assert.deepEqual(await readLearningUiOnce({evaluate:()=>Promise.reject(Error(secret))}),unavailable);
 assert.deepEqual(await readLearningUiOnce({evaluate:()=>new Promise(()=>{})}),unavailable);
});
