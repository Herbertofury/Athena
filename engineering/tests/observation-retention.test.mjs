import test from 'node:test';
import assert from 'node:assert/strict';
import {retainWindowObservation,eventsInWindow,refreshInputEvidence} from '../docs/card-lab/lab-core.mjs';
test('idle observations do not grow retained memory while all overlapping records stay intact',()=>{
 const before=[],after=[];
 for(let i=0;i<100000;i++){const e={start_ms:1000+i,duration_ms:20,detail:'retained only if relevant'};before.push(e);retainWindowObservation(after,e,100,200);}
 assert.equal(before.length,100000);assert.equal(after.length,0);
 const relevant=[{start_ms:90,duration_ms:20,unknown:{a:1}},{start_ms:100,duration_ms:30},{start_ms:199,duration_ms:100}];
 for(const e of relevant)assert.equal(retainWindowObservation(after,e,100,200),true);
 assert.deepEqual(after,relevant);assert.equal(after[0],relevant[0]);
});
test('late delivery is retained by observation time rather than callback time',()=>{
 const rows=[],entry={start_ms:150,duration_ms:60,interaction_id:42};
 assert.equal(retainWindowObservation(rows,entry,100,200),true);
 assert.equal(retainWindowObservation(rows,{start_ms:200,duration_ms:10},100,200),false);
 assert.deepEqual(rows,eventsInWindow([entry],100,200));
});
test('invalid or absent run windows cannot retain records',()=>{
 const rows=[];for(const [start,end]of [[undefined,10],[NaN,10],[20,10],[0,Infinity]])assert.equal(retainWindowObservation(rows,{start_ms:1,duration_ms:3},start,end),false);
 assert.equal(rows.length,0);assert.throws(()=>retainWindowObservation(null,{},0,1));
});

test('late input corrects both completed views without mutating the earlier snapshot',()=>{
 const run={complete:true,performance_start_ms:100,performance_end_ms:200,samples:[{round:0,strategy:'full_dom',complete_output_equal:true},{round:0,strategy:'containment',complete_output_equal:true}],observed_input_events:[]};
 const prior=structuredClone(run),entry={start_ms:190,duration_ms:20,interaction_id:7};
 const corrected=refreshInputEvidence(run,[entry],prior);
 assert.deepEqual(corrected,run);assert.deepEqual(corrected.observed_input_events,[entry]);assert.deepEqual(prior.observed_input_events,[]);assert.notEqual(corrected,run);
 const next={complete:false,performance_start_ms:300,performance_end_ms:400,samples:[]};
 assert.equal(refreshInputEvidence(next,[],corrected),corrected);
});
