import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareDataset} from '../experiments/card-receiver-lab/baseline.mjs';
import {acceptVerifiedInput} from '../experiments/card-receiver-lab/receipt-protocol.mjs';
test('complete-input receipt binds exact dimensions, length, digest and boolean acceptance',async()=>{
 const prepared=await prepareDataset(2,512),before=JSON.stringify(prepared);
 const good={complete:true,algorithm:'bounded-complete-v1',count:2,metadata_bytes_per_record:512,serialized_bytes:prepared.dataset.serialized_bytes,sha256:prepared.dataset.sha256};
 assert.equal(acceptVerifiedInput(good,prepared,2,512),prepared);assert.equal(JSON.stringify(prepared),before);
 for(const [key,value] of [['complete',1],['algorithm','unchecked'],['count',1],['count','2'],['metadata_bytes_per_record',64],['serialized_bytes',prepared.dataset.serialized_bytes+1],['sha256','0'.repeat(64)]])assert.throws(()=>acceptVerifiedInput({...good,[key]:value},prepared,2,512));
});
