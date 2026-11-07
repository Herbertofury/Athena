import test from 'node:test';import assert from 'node:assert/strict';
import {phaseBreakdown} from '../experiments/card-receiver-lab/phase-clock.mjs';
const good={request_start:1000,worker_module_ready:1010,worker_received:1012,validation_start:1013,validation_end:1023,send_start:1025,main_received:1030,main_finished:1032};
test('phase timeline accounts for all time without calling delivery pure CPU or network',()=>{
 const result=phaseBreakdown(good);assert.equal(result.valid,true);assert.equal(result.total_ms,32);assert.equal(Object.values(result.phases).reduce((a,b)=>a+b,0),32);assert.equal(result.phases.response_delivery_ms,5);assert.deepEqual(result.raw,good);
});
test('phase timeline preserves nonfinite/missing diagnostics and refuses clock reversal',()=>{
 for(const value of [NaN,Infinity,-Infinity,undefined,'100']){const result=phaseBreakdown({...good,validation_end:value});assert.equal(result.valid,false);assert.equal(result.phases,undefined);assert.doesNotThrow(()=>JSON.stringify(result));}
 const reversed=phaseBreakdown({...good,main_received:1020});assert.equal(reversed.valid,false);assert.equal(reversed.raw.main_received,1020);assert.match(reversed.reason,/no clamping/);
});
test('coarsened equal anchors remain explicit zero durations rather than invented resolution',()=>{
 const result=phaseBreakdown(Object.fromEntries(Object.keys(good).map(k=>[k,1000])));assert.equal(result.valid,true);assert.equal(result.total_ms,0);assert.equal(Object.values(result.phases).every(x=>x===0),true);
});
test('complete-data status separately reports rejected and uncollected phase attribution',async()=>{
 const {completeDataSummary}=await import('../experiments/card-receiver-lab/phase-clock.mjs');
 const result=completeDataSummary([{complete_parity:true,phase_timeline:{valid:true}},{complete_parity:true,phase_timeline:{valid:false,reason:'retained'}},{complete_parity:true,phase_timeline:null}]);
 assert.deepEqual([result.valid,result.rejected,result.unavailable],[1,1,1]);assert.match(result.text,/1 rejected/);assert.match(result.text,/1 not collected/);
 assert.throws(()=>completeDataSummary([]));assert.throws(()=>completeDataSummary([{complete_parity:false}]));
});
test('initial run control stays disabled until the main module attaches its listeners',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../docs/card-receiver-lab/index.template.html',import.meta.url),'utf8'),script=await readFile(new URL('../docs/card-receiver-lab/receiver.js',import.meta.url),'utf8');
 assert.match(html,/<button id="run" disabled>/);assert.ok(script.lastIndexOf("$('run').disabled=false")>script.lastIndexOf("$('last').addEventListener"));
});
