import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../docs/card-receiver-lab/receiver-worker.mjs',import.meta.url),'utf8');
test('actual worker handler returns complete result and retains request identity',async()=>{
 const messages=[],payload={records:[{all:'retained'}],dataset:{sha256:'fixture'}};
 const context={self:{postMessage:x=>messages.push(x)},performance:{timeOrigin:0,now:()=>1},verifyPrepared:async x=>x,verifyPreparedBounded:async x=>x,Number,Error};
 vm.runInNewContext(source.replace(/^import .*;\n/gm,''),context);
 for(const lane of ['whole','bounded'])await context.self.onmessage({data:{id:3,lane,prepared:payload,count:1,bytes:64}});
 assert.equal(messages.length,2);for(const m of messages){assert.equal(m.id,3);assert.equal(m.ok,true);assert.equal(m.result,payload);}
});
test('actual worker handler refuses unknown lanes and reports validator failure without fallback',async()=>{
 const messages=[];let calls=0;const context={self:{postMessage:x=>messages.push(x)},performance:{timeOrigin:0,now:()=>1},verifyPrepared:async()=>{calls++;throw Error('retained failure');},verifyPreparedBounded:async()=>{calls++;throw Error('retained failure');},Number,Error};
 vm.runInNewContext(source.replace(/^import .*;\n/gm,''),context);
 await context.self.onmessage({data:{id:1,lane:'unchecked'}});assert.equal(calls,0);assert.equal(messages[0].ok,false);
 await context.self.onmessage({data:{id:2,lane:'bounded'}});assert.equal(calls,1);assert.equal(messages[1].ok,false);assert.equal(messages[1].error,'retained failure');assert.equal(messages[1].id,2);
});
test('actual transfer handler preserves JSON bytes and transfers buffer ownership',async()=>{
 const {encodeRecordArray}=await import('../experiments/card-receiver-lab/bounded-encoding.mjs');
 const records=[{id:'fixture',metadata:'Unicode 💜 and all fields',extra:{keep:true}}];
 const expected=JSON.stringify(records),payload={records,dataset:{serialized_bytes:new TextEncoder().encode(expected).length},preparation_ms:1};
 let delivered,sourceBuffer;
 const context={self:{postMessage:(message,transfer)=>{sourceBuffer=message.buffer;delivered=structuredClone(message,{transfer});}},performance:{timeOrigin:0,now:()=>1},verifyPrepared:async x=>x,verifyPreparedBounded:async x=>x,verifyPreparedForTransfer:async x=>({result:x,encoded:encodeRecordArray(x.records,x.dataset.serialized_bytes)}),Number,Error};
 vm.runInNewContext(source.replace(/^import .*;\n/gm,''),context);
 await context.self.onmessage({data:{id:7,lane:'bounded',transport:'transfer',prepared:payload,count:1,bytes:64}});
 assert.equal(delivered.ok,true);assert.equal(delivered.id,7);assert.equal(sourceBuffer.byteLength,0);assert.equal(new TextDecoder().decode(delivered.buffer),expected);assert.deepEqual(JSON.parse(new TextDecoder().decode(delivered.buffer)),records);
});
test('actual receipt handler validates full input before returning only its binding',async()=>{
 const {prepareDataset}=await import('../experiments/card-receiver-lab/baseline.mjs');
 const validators=await import('../experiments/card-receiver-lab/verified-receiver.mjs');
 const prepared=await prepareDataset(2,512),messages=[];
 const context={self:{postMessage:x=>messages.push(x)},performance,Number,Error,...validators};
 vm.runInNewContext(source.replace(/^import .*;\n/gm,''),context);
 await context.self.onmessage({data:{id:1,lane:'bounded',transport:'receipt',prepared,count:2,bytes:512}});
 assert.equal(messages[0].ok,true);assert.equal(messages[0].receipt.sha256,prepared.dataset.sha256);assert.equal(messages[0].receipt.count,2);assert.equal(messages[0].result,undefined);
 const damaged=structuredClone(prepared);damaged.records[0].metadata=damaged.records[0].metadata.slice(0,-1)+'Z';
 await context.self.onmessage({data:{id:2,lane:'bounded',transport:'receipt',prepared:damaged,count:2,bytes:512}});
 assert.equal(messages[1].ok,false);assert.match(messages[1].error,/metadata/);assert.equal(messages[1].receipt,undefined);
});
