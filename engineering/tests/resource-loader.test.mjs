import test from 'node:test';
import assert from 'node:assert/strict';
import {createRetryableLoader} from '../docs/media-lab/resource-loader.mjs';

test('failed load is retried only when requested and does not poison future attempts',async()=>{
  let ready=false,starts=0;
  const load=createRetryableLoader(()=>ready,()=>{if(++starts===1)throw Error('fixture network failure');ready=true;});
  await assert.rejects(load(),/fixture network/);
  assert.equal(starts,1);
  await load();assert.equal(starts,2);
  await load();assert.equal(starts,2);
});
test('simultaneous consumers share one pending load and the same failure',async()=>{
  let reject,starts=0;
  const load=createRetryableLoader(()=>false,()=>{starts++;return new Promise((_,r)=>{reject=r;});});
  const a=load(),b=load();assert.equal(a,b);await Promise.resolve();
  reject(Error('fixture timeout'));await assert.rejects(a,/timeout/);await assert.rejects(b,/timeout/);assert.equal(starts,1);
});
test('successful script event without capability is not readiness',async()=>{
  let starts=0,ready=false;
  const load=createRetryableLoader(()=>ready,()=>{starts++;});
  await assert.rejects(load(),/required capability/);assert.equal(starts,1);
  ready=true;await load();assert.equal(starts,1);
});
test('repeated failures retain retryability without automatic request loops',async()=>{
  let starts=0;const load=createRetryableLoader(()=>false,()=>{starts++;return Promise.reject(Error('unavailable'));});
  for(let i=0;i<5;i++)await assert.rejects(load(),/unavailable/);
  assert.equal(starts,5);
});
