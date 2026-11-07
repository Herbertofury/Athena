import {runEventLogRecoveryChecks} from './event-log-recovery.b9f6a770f0d29c39.mjs';
import {createBlockedEventLogView as createBaselineBlocked} from './event-log-baseline.da5c8854c2b145b8.mjs';
import {createEventLogView,createBlockedEventLogView} from './event-log-view.8da785a48d10552f.mjs';
const $=id=>document.getElementById(id),frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const harness='atlas-event-log-render-v3-recovery';$('identity').textContent='Loaded harness: '+harness;
let source,busy=false,receipt=null,hidden=false;
document.addEventListener('visibilitychange',()=>{if(busy&&document.hidden)hidden=true;});
const heap=()=>Number.isFinite(performance.memory?.usedJSHeapSize)?performance.memory.usedJSHeapSize:null;
$('run').addEventListener('click',async()=>{
 if(busy)return;busy=true;hidden=false;$('run').disabled=true;$('recover').disabled=true;$('repeat').disabled=true;$('export').disabled=true;
 const repeat=Number($('repeat').value),records=Array.from({length:repeat},()=>source.events).flat(),expected=JSON.stringify(records,null,2);
 receipt={harness,source_module:new URL(import.meta.url).pathname,started_at:new Date().toISOString(),environment:{user_agent:navigator.userAgent,viewport:[innerWidth,innerHeight],device_pixel_ratio:devicePixelRatio,visibility:document.visibilityState},scope:repeat===1?'original retained public event sequence':'generated stress replay of retained public events',repeat,event_count:records.length,complete_json_bytes:new TextEncoder().encode(expected).length,complete:false,samples:[],limitations:['Event-log component only; not full card/media loading or target-project acceptance','Double-rAF is a scheduling proxy, not physical paint','Heap snapshots when exposed are not peak memory and can be coarse or GC-dependent','Same immutable records and full visible JSON; no truncation, sampling or omitted events','One browser/environment; no general best-method ranking']};
 try{
  if(![1,8,32].includes(repeat)||records.length>2048||expected.length>1024*1024)throw Error('Workload exceeds bounded budget');
  const orders=[['full_history','append','blocked'],['blocked','append','full_history'],['append','full_history','blocked'],['blocked','full_history','append'],['full_history','blocked','append'],['append','blocked','full_history']];
  for(let round=0;round<7;round++)for(const strategy of orders[round%orders.length]){
   if(document.hidden||hidden)throw Error('Visibility changed; incomplete evidence retained');
   $('status').textContent=`Round ${round+1}/7: ${strategy}`;$('workload').textContent='';$('workload').scrollTop=0;$('workload').scrollIntoView({block:'center',behavior:'instant'});await frame();await frame();const bounds=$('workload').getBoundingClientRect();if(bounds.top<0||bounds.bottom>innerHeight)throw Error('Keep the entire workload viewport visible');
   const beforeHeap=heap(),start=performance.now();let logTextCodeUnitsWritten=0;
   if(strategy==='full_history') {const history=[];for(const record of records){history.push(record);const text=JSON.stringify(history,null,2);logTextCodeUnitsWritten+=text.length;$('workload').textContent=text;}}
   else {const view=(strategy==='blocked'?createBlockedEventLogView:createEventLogView)($('workload'));for(const record of records)view.append(record);logTextCodeUnitsWritten=expected.length+1;}
   const synchronousEnd=performance.now();await frame();await frame();const frameEnd=performance.now(),afterHeap=heap();
   const actual=$('workload').textContent;if(actual!==expected)throw Error('Complete event output mismatch');
   const gaps=[];for(let i=1;i<=8;i++){const begin=performance.now();$('workload').scrollTop=($('workload').scrollHeight-$('workload').clientHeight)*i/8;await frame();gaps.push(performance.now()-begin);}
   if(document.hidden||hidden)throw Error('Visibility changed; incomplete evidence retained');
   receipt.samples.push({round,strategy,synchronous_render_ms:synchronousEnd-start,frame_ready_proxy_ms:frameEnd-start,scroll_frame_wait_ms:gaps,heap_before:beforeHeap,heap_after:afterHeap,log_text_code_units_written:logTextCodeUnitsWritten,dom_text_nodes:$('workload').childNodes.length,complete_output_equal:true});
  }
  receipt.complete=true;receipt.frame_cadence_unreliable=receipt.samples.some(s=>s.scroll_frame_wait_ms.filter(x=>x>=200).length>=4);$('status').textContent='All 21 complete-output comparisons passed.'+(receipt.frame_cadence_unreliable?' Frame cadence was slow; no interaction-latency acceptance.':'')+' Export raw evidence; no automatic promotion.';
 }catch(error){receipt.error=String(error.message);$('status').textContent=receipt.error;}
 finally{receipt.finished_at=new Date().toISOString();$('results').textContent=JSON.stringify(receipt,null,2);$('export').disabled=false;$('repeat').disabled=false;$('run').disabled=false;$('recover').disabled=false;busy=false;}
});
$('export').addEventListener('click',()=>{if(!receipt)return;const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='atlas-event-log-render.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
try{const response=await fetch('./event-log-fixture.a52b151a701afbc7.json');if(!response.ok)throw Error('Fixture unavailable');source=await response.json();if(!Array.isArray(source.events)||!source.events.length||source.events.length>64)throw Error('Invalid fixture');$('run').disabled=false;$('status').textContent=`Ready: ${source.events.length} original events. Keep the workload visible.`;}catch(error){$('status').textContent=error.message;}

let recoveryReceipt=null;
$('recover').addEventListener('click',()=>{
 if(busy)return;
 recoveryReceipt={harness:'atlas-event-log-recovery-v1',source_module:new URL(import.meta.url).pathname,checked_at:new Date().toISOString(),scope:'generated structural faults on actual browser DOM; no provider requests',complete:false};
 try{
  const baseline=runEventLogRecoveryChecks(document,createBaselineBlocked),repaired=runEventLogRecoveryChecks(document,createBlockedEventLogView),control=runEventLogRecoveryChecks(document,createEventLogView);
  Object.assign(recoveryReceipt,{baseline,repaired,control,baseline_failure_reproduced:JSON.stringify(baseline.map(x=>x.passed))===JSON.stringify([false,true,false]),repaired_all_passed:repaired.every(x=>x.passed),control_all_passed:control.every(x=>x.passed)});
  recoveryReceipt.complete=recoveryReceipt.baseline_failure_reproduced&&recoveryReceipt.repaired_all_passed&&recoveryReceipt.control_all_passed;
 }catch(error){recoveryReceipt.error=String(error.message||error);}
 $('recovery-results').textContent=JSON.stringify(recoveryReceipt,null,2);$('export-recovery').disabled=false;
});
$('export-recovery').addEventListener('click',()=>{
 if(!recoveryReceipt)return;const url=URL.createObjectURL(new Blob([JSON.stringify(recoveryReceipt,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='atlas-event-log-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
