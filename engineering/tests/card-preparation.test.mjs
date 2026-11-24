import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {makeData} from '../docs/card-lab/lab-core.mjs';
import {prepareDataset,validatePrepared} from '../docs/card-lab/preparation-core.mjs';
test('preparation preserves every generated field and the independent digest',async()=>{
  for(const [count,bytes] of [[1,64],[17,512],[200,8192]]) {
    const result=await prepareDataset(count,bytes),expected=makeData(count,bytes);
    assert.deepEqual(result.records,expected);
    assert.equal(result.dataset.sha256,createHash('sha256').update(JSON.stringify(expected)).digest('hex'));
    assert.equal(result.dataset.serialized_bytes,Buffer.byteLength(JSON.stringify(expected)));
    assert.deepEqual(structuredClone(result),result);
    assert.equal(validatePrepared(result,count,bytes),result);
  }
});
test('preparation rejects invalid budgets before accepting data',async()=>{
  for(const args of [[0,512],[3000,65536],[2,NaN]])await assert.rejects(prepareDataset(...args));
});
test('receiver rejects identity, length, hash-shape and timing contract damage',async()=>{
  const result=await prepareDataset(2,512);
  for(const mutate of [x=>x.records.pop(),x=>x.records[0].id='other',x=>x.records[0].metadata='short',x=>x.dataset.sha256='not a digest',x=>x.dataset.serialized_bytes=1,x=>x.dataset.encoding_ms=NaN]){
    const changed=structuredClone(result);mutate(changed);assert.throws(()=>validatePrepared(changed,2,512));
  }
});
