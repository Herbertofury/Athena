import {prepareDataset} from './baseline.mjs';
import {verifyPrepared,verifyPreparedBounded} from './verified-receiver.mjs';
import {writeFile} from 'node:fs/promises';
const name=process.argv[2];if(!/^complete-pass-[12]\.json$/.test(name||''))throw Error('Choose a fixed fresh pass filename');
const started=performance.now(),samples=[];
for(const [count,bytes] of [[1,64],[200,8192],[200,65536]]){
 const result=await prepareDataset(count,bytes),original=JSON.stringify(result);
 for(let round=0;round<6;round++)for(const lane of round%2?['bounded','whole']:['whole','bounded']){
  if(performance.now()-started>60000)throw Error('Cooperative 60-second budget exhausted');
  const begin=performance.now();const returned=await (lane==='whole'?verifyPrepared:verifyPreparedBounded)(result,count,bytes);const elapsed=performance.now()-begin;
  if(returned!==result||JSON.stringify(result)!==original)throw Error('Complete parity failed');
  samples.push({count,bytes,round,lane,complete_validation_ms:elapsed,complete_parity:true,dataset_sha256:result.dataset.sha256});
 }
}
await writeFile(new URL('./'+name,import.meta.url),JSON.stringify({checked_at:new Date().toISOString(),runtime:process.version,scope:'Complete verified receiver versus complete verified receiver; generated Node fixtures only; no target adoption or browser performance claim',samples},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({name,samples:samples.length,elapsed_ms:performance.now()-started}));
