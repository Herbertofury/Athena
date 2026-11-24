import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {retainWindowObservation,eventsInWindow,refreshInputEvidence} from '../../docs/card-lab/lab-core.mjs';
const sources={before:readFileSync(new URL('./v8-before-late-repair.js',import.meta.url),'utf8'),after:readFileSync(new URL('../../docs/card-lab/lab.js',import.meta.url),'utf8')};
const results={scope:'actual input callback, generated delayed-delivery fixture; browser failure retained separately'};
for(const [name,source]of Object.entries(sources)){
 const end=source.indexOf(").observe({type:'event',durationThreshold:16,buffered:false})"),start=source.lastIndexOf('new PerformanceObserver(',end)+'new PerformanceObserver('.length;assert.ok(end>start);
 const run={complete:true,performance_start_ms:100,performance_end_ms:200,observed_input_events:[],samples:[{round:0,strategy:'full_dom',complete_output_equal:true},{round:0,strategy:'containment',complete_output_equal:true}]};
 const invoke=Function('evidence','retainWindowObservation','eventsInWindow','refreshInputEvidence','list',`let inputEvents=[],lastCompletedEvidence=structuredClone(evidence);const performance={now:()=>300};const summarize=()=>{};const fn=(${source.slice(start,end)});fn(list);return {current:evidence,last_completed:lastCompletedEvidence};`);
 const r=invoke(run,retainWindowObservation,eventsInWindow,refreshInputEvidence,{getEntries:()=>[{name:'click',startTime:190,duration:20,interactionId:7}]});
 results[name]={current_input_records:r.current.observed_input_events.length,last_completed_input_records:r.last_completed.observed_input_events.length,views_equal:JSON.stringify(r.current)===JSON.stringify(r.last_completed)};
}
assert.equal(results.before.views_equal,false);assert.equal(results.after.views_equal,true);writeFileSync(new URL('./late-repair-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
