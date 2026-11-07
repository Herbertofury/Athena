import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {retainWindowObservation,eventsInWindow,refreshInputEvidence} from '../../docs/card-lab/lab-core.mjs';
const old=readFileSync(new URL('./baseline-lab.js',import.meta.url),'utf8'),fixed=readFileSync(new URL('../../docs/card-lab/lab.js',import.meta.url),'utf8');
function callback(source,kind){const suffix=kind==='longtask'?').observe({type,buffered:false})':").observe({type:'event',durationThreshold:16,buffered:false})";const end=source.indexOf(suffix);assert.ok(end>=0);const start=source.lastIndexOf('new PerformanceObserver(',end)+'new PerformanceObserver('.length;return source.slice(start,end);}
const relevant=[{startTime:90,duration:20,name:'click',interactionId:1},{startTime:110,duration:10,name:'click',interactionId:2},{startTime:190,duration:40,name:'click',interactionId:3}];
const idle=Array.from({length:100000},(_,i)=>({startTime:1000+i,duration:20,name:'pointerover',interactionId:0}));
const results=[];
for(const kind of ['longtask','event'])for(const window of [null,{performance_start_ms:100,performance_end_ms:200}]){
 const invoke=source=>{const observed={longtask:[]},inputEvents=[],evidence=window?structuredClone(window):null;
  const fn=Function('observed','type','inputEvents','evidence','retainWindowObservation','eventsInWindow','performance','refreshInputEvidence','lastCompletedEvidence','return ('+callback(source,kind)+')')(observed,'longtask',inputEvents,evidence,retainWindowObservation,eventsInWindow,{now:()=>200000},refreshInputEvidence,null);
  fn({getEntries:()=>idle});fn({getEntries:()=>relevant});return kind==='longtask'?observed.longtask:inputEvents;
 };
 const before=invoke(old),after=invoke(fixed),expected=window?eventsInWindow(before,100,200):[];assert.deepEqual(after,expected);
 results.push({kind,window:window?'completed run, delayed delivery':'no run',delivered:100003,baseline_retained:before.length,candidate_retained:after.length,complete_in_scope_output_equal:true,retained_projection_sha256:createHash('sha256').update(JSON.stringify(after)).digest('hex')});
}
const result={scope:'actual baseline/candidate callback execution with generated delivery fixtures; retained record count, not browser heap bytes',baseline_commit:'e1400186505647d8eea4d066982aac76d154d69d',cases:results};
writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
