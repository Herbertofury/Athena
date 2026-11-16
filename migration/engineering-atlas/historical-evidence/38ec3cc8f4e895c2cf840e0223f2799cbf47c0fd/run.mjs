import {prepareDataset,validatePrepared} from './baseline.mjs';
import {verifyPrepared} from './verified-receiver.mjs';
import {writeFile} from 'node:fs/promises';
const started=performance.now(),samples=[],failures=[];
for(const [count,bytes] of [[1,64],[200,8192],[200,65536]]) {
 const result=await prepareDataset(count,bytes);
 for(let round=0;round<4;round++){
  for(const lane of round%2?['verified','baseline']:['baseline','verified']){
   if(performance.now()-started>60000)throw Error('60-second experiment budget exceeded');
   const before=JSON.stringify(result),begin=performance.now();
   const returned=lane==='verified'?await verifyPrepared(result,count,bytes):validatePrepared(result,count,bytes);
   const elapsed=performance.now()-begin;
   if(returned!==result||JSON.stringify(result)!==before)throw Error('Complete input/return parity failed');
   samples.push({count,bytes,round,lane,validation_ms:elapsed,complete_parity:true});
  }
 }
}
const original=await prepareDataset(2,512);
for(const [name,mutate] of [['metadata_tail',x=>x.records[0].metadata=x.records[0].metadata.slice(0,-1)+'Z'],['digest',x=>x.dataset.sha256='0'.repeat(64)],['byte_count',x=>x.dataset.serialized_bytes++]]){
 const result=structuredClone(original);mutate(result);
 const baseline_accepted=validatePrepared(result,2,512)===result;let candidate_error=null;
 try{await verifyPrepared(result,2,512)}catch(error){candidate_error=error.message}
 if(!candidate_error)throw Error('Invalid candidate accepted');
 failures.push({name,baseline_accepted,candidate_error,damaged_fixture:result});
}
const receipt={checked_at:new Date().toISOString(),runtime:process.version,scope:'Node generated-fixture validation only; no browser visibility, input, memory or target-project performance claim',production_harness_changed:false,samples,failures};
await writeFile(new URL('./results.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({samples:samples.length,rejected:failures.length,elapsed_ms:performance.now()-started}));
