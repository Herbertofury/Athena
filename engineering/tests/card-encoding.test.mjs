import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeRecordArray} from '../experiments/card-receiver-lab/bounded-encoding.mjs';
import {prepareDataset} from '../experiments/card-receiver-lab/baseline.mjs';
import {verifyPreparedBounded} from '../experiments/card-receiver-lab/verified-receiver.mjs';
test('bounded encoding preserves full JSON bytes, order, escapes and Unicode',()=>{
 const cases=[[],[{}],[{z:'tail',a:'first'}],[{text:'你好 💜 \u0000 \n " \\ \ud800',values:[null,true,false,0,-1.25]}]];
 for(let n=0;n<1024;n++)cases.push([{value:String.fromCharCode(n)+String.fromCodePoint(0x10000+n)}]);
 for(const records of cases){const expected=new TextEncoder().encode(JSON.stringify(records));assert.deepEqual(encodeRecordArray(records,expected.length),expected);}
});
test('bounded encoder rejects wrong byte lengths and invalid budgets',()=>{
 const records=[{text:'💜'}],length=new TextEncoder().encode(JSON.stringify(records)).length;
 for(const bytes of [length-1,length+1,NaN,-1,Infinity,101*1024*1024])assert.throws(()=>encodeRecordArray(records,bytes));
});
test('bounded receiver preserves full data and rejects all retained corruption classes',async()=>{
 const original=await prepareDataset(200,65536),before=JSON.stringify(original);
 assert.equal(await verifyPreparedBounded(original,200,65536),original);assert.equal(JSON.stringify(original),before);
 for(const mutate of [x=>x.records[0].metadata=x.records[0].metadata.slice(0,-1)+'Z',x=>x.dataset.sha256='0'.repeat(64),x=>x.dataset.serialized_bytes++,x=>x.dataset.serialized_bytes--]){
  const damaged=structuredClone(original);mutate(damaged);await assert.rejects(verifyPreparedBounded(damaged,200,65536));
 }
});
test('transfer envelope reuses complete verified bytes without mutating input',async()=>{
 const {verifyPreparedForTransfer}=await import('../experiments/card-receiver-lab/verified-receiver.mjs');
 const original=await prepareDataset(17,8192),before=JSON.stringify(original);
 const verified=await verifyPreparedForTransfer(original,17,8192);
 assert.equal(verified.result,original);
 assert.deepEqual(verified.encoded,new TextEncoder().encode(JSON.stringify(original.records)));
 assert.equal(JSON.stringify(original),before);
 const damaged=structuredClone(original);damaged.dataset.sha256='0'.repeat(64);
 await assert.rejects(verifyPreparedForTransfer(damaged,17,8192));
});
