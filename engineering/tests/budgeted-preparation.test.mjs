import test from 'node:test';import assert from 'node:assert/strict';
import {encodeWithinBudget} from '../experiments/budgeted-preparation-lab/encoder.mjs';
import {prepareBudgeted} from '../experiments/budgeted-preparation-lab/preparation.mjs';
import {prepareDataset} from '../docs/card-lab/preparation-core.mjs';
import {verifyPreparedBounded} from '../experiments/card-receiver-lab/verified-receiver.mjs';
test('budgeted writer preserves complete JSON including Unicode and unknown fields',()=>{const rows=[{a:'😀☃',unknown:{x:[1,null,'\n"']}},{empty:[],nullable:null}];const expected=new TextEncoder().encode(JSON.stringify(rows));for(const extra of [0,1,1024]){const got=encodeWithinBudget(rows,expected.length+extra);assert.deepEqual(got.bytes,expected);assert.equal(got.bytes.length,expected.length);assert.equal(got.bytes.buffer.byteLength,expected.length+extra);}});
test('insufficient or invalid budgets cannot return truncated success',()=>{for(const budget of [0,1,-1,NaN,Infinity,101*1024*1024])assert.throws(()=>encodeWithinBudget([],budget));assert.throws(()=>encodeWithinBudget([{x:'😀'.repeat(100)}],40));assert.throws(()=>encodeWithinBudget([undefined],100));assert.throws(()=>encodeWithinBudget([1n],100));});
test('budgeted preparation passes the unchanged complete receiver and exact baseline digest',async()=>{for(const [n,b] of [[1,64],[17,512],[200,8192],[200,65536]]){const old=await prepareDataset(n,b),next=await prepareBudgeted(n,b);assert.deepEqual(next.records,old.records);assert.equal(next.dataset.sha256,old.dataset.sha256);assert.equal(next.dataset.serialized_bytes,old.dataset.serialized_bytes);assert.equal(await verifyPreparedBounded(next,n,b),next);assert.ok(next.dataset.encoding_allocation_bytes>=next.dataset.serialized_bytes);}});
test('deterministic Unicode and boundary differential corpus never truncates',()=>{
 let seed=0x51a71a;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const chars=['a','"','\\','\n','\u0000','雪','😀','\ud800','\udfff'];
 for(let i=0;i<2000;i++){
  let value='';for(let j=0,n=next()%50;j<n;j++)value+=chars[next()%chars.length];
  const records=[{id:i,value,nested:{keep:[null,false,0,-1,value]},empty:[]},[value,i]];
  const expected=new TextEncoder().encode(JSON.stringify(records));
  assert.deepEqual(encodeWithinBudget(records,expected.length).bytes,expected);
  assert.throws(()=>encodeWithinBudget(records,expected.length-1),/budget exceeded/);
 }
});
