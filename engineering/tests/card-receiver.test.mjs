import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareDataset,validatePrepared} from '../experiments/card-receiver-lab/baseline.mjs';
import {verifyPrepared} from '../experiments/card-receiver-lab/verified-receiver.mjs';
import {createHash} from 'node:crypto';
test('isolated receiver reproduces baseline acceptance and rejects complete-data corruption',async()=>{
 const original=await prepareDataset(2,512);
 for(const mutate of [x=>x.records[0].metadata=x.records[0].metadata.slice(0,-1)+'Z',x=>x.dataset.sha256='0'.repeat(64),x=>x.dataset.serialized_bytes++]){
  const damaged=structuredClone(original); mutate(damaged);
  assert.equal(validatePrepared(damaged,2,512),damaged);
  await assert.rejects(verifyPrepared(damaged,2,512));
 }
});
test('receiver detects corrupted content even with a matching recomputed digest',async()=>{
 const result=await prepareDataset(2,512);
 result.records[1].metadata=result.records[1].metadata.slice(0,400)+'Z'+result.records[1].metadata.slice(401);
 result.dataset.sha256=createHash('sha256').update(JSON.stringify(result.records)).digest('hex');
 await assert.rejects(verifyPrepared(result,2,512),/metadata/);
});
test('receiver retains complete valid records and refuses additional generated fields',async()=>{
 for(const [count,bytes] of [[1,64],[17,512],[200,8192],[4,65536]]){
  const result=await prepareDataset(count,bytes),before=structuredClone(result);
  assert.equal(await verifyPrepared(result,count,bytes),result);assert.deepEqual(result,before);
 }
 const result=await prepareDataset(1,64);result.records[0].extra='undisplayed';
 await assert.rejects(verifyPrepared(result,1,64),/fields/);
});
