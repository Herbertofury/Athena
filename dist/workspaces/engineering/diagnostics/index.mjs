import {runEventLogRecoveryChecks} from './event-log-recovery.mjs';
import {createBlockedEventLogView as createBaselineBlocked} from './event-log-baseline.mjs';
import {createEventLogView,createBlockedEventLogView} from './event-log-view.mjs';
import {createPreviewLoader} from './preview-loader.mjs';
let retained={receipt:null,recovery:null};
export async function mount({container,search='',theme='dark',signal}={}){
 if(!container?.attachShadow)throw TypeError('Workspace container required');
 const root=container.shadowRoot||container.attachShadow({mode:'open'}),cleanups=[],observers=new Set(),timers=new Set(),frames=new Set(),urls=new Set();
 let disposed=false,cancelRun=()=>{};
 function setTheme(value){container.dataset.theme=value==='light'?'light':'dark';}
 function listenWindow(name,callback,options){window.addEventListener(name,callback,options);cleanups.push(()=>window.removeEventListener(name,callback,options));}
 const PerformanceObserver=class {
  static supportedEntryTypes=globalThis.PerformanceObserver?.supportedEntryTypes||[];
  constructor(callback){this.observer=new globalThis.PerformanceObserver((...args)=>{if(!disposed)callback(...args);});observers.add(this.observer);}
  observe(options){this.observer.observe(options);}
 };
 const requestAnimationFrame=callback=>{const id=globalThis.requestAnimationFrame(time=>{frames.delete(id);if(!disposed)callback(time);});frames.add(id);return id;};
 const cancelAnimationFrame=id=>{frames.delete(id);globalThis.cancelAnimationFrame(id);};
 const setTimeout=(callback,delay)=>{const id=globalThis.setTimeout(()=>{timers.delete(id);if(!disposed)callback();},delay);timers.add(id);return id;};
 const clearTimeout=id=>{timers.delete(id);globalThis.clearTimeout(id);};
 const createObjectURL=blob=>{const url=URL.createObjectURL(blob);urls.add(url);return url;};
 const revokeObjectURL=url=>{urls.delete(url);URL.revokeObjectURL(url);};
 function unmount(){if(disposed)return;disposed=true;cancelRun();for(const observer of observers)observer.disconnect();observers.clear();for(const f of cleanups.splice(0))f();for(const id of timers)globalThis.clearTimeout(id);timers.clear();for(const id of frames)globalThis.cancelAnimationFrame(id);frames.clear();for(const url of urls)URL.revokeObjectURL(url);urls.clear();root.querySelector('dialog[open]')?.close();root.replaceChildren();signal?.removeEventListener('abort',unmount);}
 signal?.addEventListener('abort',unmount,{once:true});
 if(signal?.aborted){unmount();return {unmount,setTheme,setSearch(){},ready:false};}
 root.innerHTML="<p id=\"search-status\" role=\"status\"></p><h2>Complete event evidence, less repeated work</h2><p>Isolated candidates: one text node per event and bounded text segments. Real retained media events or explicitly repeated stress replay. No provider requests, account data or autoplay. This measures the event-log component, not full card paint, INP or peak memory.</p><p id=\"identity\">Loading\u2026</p><label>Workload<select id=\"repeat\"><option value=\"1\">Original public event sequence</option><option value=\"8\">8\u00d7 generated replay</option><option value=\"32\">32\u00d7 generated replay</option></select></label><button id=\"run\" disabled>Run 7 comparison rounds</button><button id=\"export\" disabled>Export comparison</button><p id=\"status\" role=\"status\">Loading local fixture\u2026</p><pre id=\"workload\" tabindex=\"0\" aria-label=\"Complete event log\"></pre><pre id=\"results\" aria-label=\"Measurement results\"></pre><h2>Interrupted insertion recovery</h2><p>Generated DOM faults, not a real provider outage. Original and repaired algorithms retain separate results.</p><button id=\"recover\">Run DOM recovery checks</button><button id=\"export-recovery\" disabled>Export recovery evidence</button><pre id=\"recovery-results\" aria-label=\"DOM recovery results\"></pre><h2>Native preview timeout and retry</h2><p>Generated stalled-decode fixture using a local data image. No provider requests. Tests actual DOM source removal and native image decode on explicit test retry, not socket cancellation.</p><button id=\"preview-run\">Run generated timeout check</button><div id=\"image\"></div><pre id=\"preview-output\">Not run.</pre>";
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./style.css',import.meta.url).href;root.prepend(style);setTheme(theme);
const lifetime=new AbortController();let previewBusy=false,activeImage=null;cancelRun=()=>{lifetime.abort();activeImage?.removeAttribute('src');};
const $=id=>root.getElementById(id),frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const harness='atlas-event-log-render-v3-recovery';$('identity').textContent='Loaded harness: '+harness;
let source,busy=false,receipt=retained.receipt,hidden=false;
const visibility=()=>{if(busy&&document.hidden)hidden=true;};document.addEventListener('visibilitychange',visibility);cleanups.push(()=>document.removeEventListener('visibilitychange',visibility));
const heap=()=>Number.isFinite(performance.memory?.usedJSHeapSize)?performance.memory.usedJSHeapSize:null;
$('run').addEventListener('click',async()=>{
 if(disposed||busy||previewBusy)return;busy=true;hidden=false;$('run').disabled=true;$('recover').disabled=true;$('repeat').disabled=true;$('export').disabled=true;
 const repeat=Number($('repeat').value),records=Array.from({length:repeat},()=>source.events).flat(),expected=JSON.stringify(records,null,2);
 receipt={harness,source_module:new URL(import.meta.url).pathname,started_at:new Date().toISOString(),environment:{user_agent:navigator.userAgent,viewport:[innerWidth,innerHeight],device_pixel_ratio:devicePixelRatio,visibility:document.visibilityState},scope:repeat===1?'original retained public event sequence':'generated stress replay of retained public events',repeat,event_count:records.length,complete_json_bytes:new TextEncoder().encode(expected).length,complete:false,samples:[],limitations:['Event-log component only; not full card/media loading or target-project acceptance','Double-rAF is a scheduling proxy, not physical paint','Heap snapshots when exposed are not peak memory and can be coarse or GC-dependent','Same immutable records and full visible JSON; no truncation, sampling or omitted events','One browser/environment; no general best-method ranking']};
 try{
  if(![1,8,32].includes(repeat)||records.length>2048||expected.length>1024*1024)throw Error('Workload exceeds bounded budget');
  const orders=[['full_history','append','blocked'],['blocked','append','full_history'],['append','full_history','blocked'],['blocked','full_history','append'],['full_history','blocked','append'],['append','blocked','full_history']];
  for(let round=0;round<7;round++)for(const strategy of orders[round%orders.length]){
   if(disposed||document.hidden||hidden)throw Error('Visibility changed; incomplete evidence retained');
   $('status').textContent=`Round ${round+1}/7: ${strategy}`;$('workload').textContent='';$('workload').scrollTop=0;$('workload').scrollIntoView({block:'center',behavior:'instant'});await frame();await frame();const bounds=$('workload').getBoundingClientRect();if(bounds.top<0||bounds.bottom>innerHeight)throw Error('Keep the entire workload viewport visible');
   const beforeHeap=heap(),start=performance.now();let logTextCodeUnitsWritten=0;
   if(strategy==='full_history') {const history=[];for(const record of records){history.push(record);const text=JSON.stringify(history,null,2);logTextCodeUnitsWritten+=text.length;$('workload').textContent=text;}}
   else {const view=(strategy==='blocked'?createBlockedEventLogView:createEventLogView)($('workload'));for(const record of records)view.append(record);logTextCodeUnitsWritten=expected.length+1;}
   const synchronousEnd=performance.now();await frame();await frame();const frameEnd=performance.now(),afterHeap=heap();
   const actual=$('workload').textContent;if(actual!==expected)throw Error('Complete event output mismatch');
   const gaps=[];for(let i=1;i<=8;i++){const begin=performance.now();$('workload').scrollTop=($('workload').scrollHeight-$('workload').clientHeight)*i/8;await frame();gaps.push(performance.now()-begin);}
   if(disposed||document.hidden||hidden)throw Error('Visibility changed; incomplete evidence retained');
   receipt.samples.push({round,strategy,synchronous_render_ms:synchronousEnd-start,frame_ready_proxy_ms:frameEnd-start,scroll_frame_wait_ms:gaps,heap_before:beforeHeap,heap_after:afterHeap,log_text_code_units_written:logTextCodeUnitsWritten,dom_text_nodes:$('workload').childNodes.length,complete_output_equal:true});
  }
  receipt.complete=true;receipt.frame_cadence_unreliable=receipt.samples.some(s=>s.scroll_frame_wait_ms.filter(x=>x>=200).length>=4);$('status').textContent='All 21 complete-output comparisons passed.'+(receipt.frame_cadence_unreliable?' Frame cadence was slow; no interaction-latency acceptance.':'')+' Export raw evidence; no automatic promotion.';
 }catch(error){if(disposed)return;receipt.error=String(error.message);$('status').textContent=receipt.error;}
 finally{if(disposed)return;receipt.finished_at=new Date().toISOString();$('results').textContent=JSON.stringify(receipt,null,2);$('export').disabled=false;$('repeat').disabled=false;$('run').disabled=false;$('recover').disabled=false;busy=false;}
});
$('export').addEventListener('click',()=>{if(!receipt)return;const url=createObjectURL(new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='atlas-event-log-render.json';a.click();setTimeout(()=>revokeObjectURL(url),1000);});
try{const response=await fetch(new URL('./event-log-fixture.json',import.meta.url),{signal:lifetime.signal});if(!response.ok)throw Error('Fixture unavailable');source=await response.json();if(disposed)return {unmount,setTheme,setSearch,ready:false};if(!Array.isArray(source.events)||!source.events.length||source.events.length>64)throw Error('Invalid fixture');$('run').disabled=false;$('status').textContent=`Ready: ${source.events.length} original events. Keep the workload visible.`;}catch(error){if(!disposed)$('status').textContent=error.message;}

let recoveryReceipt=retained.recovery;
$('recover').addEventListener('click',()=>{
 if(disposed||busy||previewBusy)return;
 recoveryReceipt={harness:'atlas-event-log-recovery-v1',source_module:new URL(import.meta.url).pathname,checked_at:new Date().toISOString(),scope:'generated structural faults on actual browser DOM; no provider requests',complete:false};
 try{
  const baseline=runEventLogRecoveryChecks(document,createBaselineBlocked),repaired=runEventLogRecoveryChecks(document,createBlockedEventLogView),control=runEventLogRecoveryChecks(document,createEventLogView);
  Object.assign(recoveryReceipt,{baseline,repaired,control,baseline_failure_reproduced:JSON.stringify(baseline.map(x=>x.passed))===JSON.stringify([false,true,false]),repaired_all_passed:repaired.every(x=>x.passed),control_all_passed:control.every(x=>x.passed)});
  recoveryReceipt.complete=recoveryReceipt.baseline_failure_reproduced&&recoveryReceipt.repaired_all_passed&&recoveryReceipt.control_all_passed;
 }catch(error){recoveryReceipt.error=String(error.message||error);}
 $('recovery-results').textContent=JSON.stringify(recoveryReceipt,null,2);$('export-recovery').disabled=false;
});
$('export-recovery').addEventListener('click',()=>{
 if(!recoveryReceipt)return;const url=createObjectURL(new Blob([JSON.stringify(recoveryReceipt,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='atlas-event-log-recovery.json';a.click();setTimeout(()=>revokeObjectURL(url),1000);
});
const output=root.getElementById('preview-output');
root.getElementById('preview-run').addEventListener('click',async event=>{
 if(disposed||busy||previewBusy)return;previewBusy=true;event.target.disabled=true;
 const img=document.createElement('img');activeImage=img;img.alt='Generated one-pixel timeout fixture';
 img.dataset.source='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
 root.getElementById('image').replaceChildren(img);
 const originalDecode=img.decode.bind(img);let late;
 img.decode=()=>new Promise(resolve=>{late=resolve;});
 const events=[],loader=createPreviewLoader([img],{timeoutMs:30,setTimer:setTimeout,clearTimer:clearTimeout,report:(type,details)=>events.push({type,...details})});
 try{
  const first=await loader.run();if(disposed)return;
  await new Promise(requestAnimationFrame);
  const sourceDetached=!img.hasAttribute('src'),identityRetained=img.dataset.source.startsWith('data:image/svg+xml,');
  late();await Promise.resolve();const lateStillFailed=loader.counts().failed===1;
  img.decode=originalDecode;const retry=await loader.run();if(disposed)return;
  const result={harness:'atlas-native-preview-timeout-v1',generated_stalled_decode:true,network_requests:false,first,sourceDetached,identityRetained,lateStillFailed,retry,width:img.naturalWidth,height:img.naturalHeight,events,passed:first.failed===1&&sourceDetached&&identityRetained&&lateStillFailed&&retry.decoded===1&&img.naturalWidth===1&&img.naturalHeight===1,limits:'Actual DOM removal and native data-image retry; no live provider timeout or socket cancellation timing.'};
  output.textContent=JSON.stringify(result,null,2);
 }catch(error){if(disposed)return;output.textContent=JSON.stringify({passed:false,error:String(error.message)},null,2);}
 finally{previewBusy=false;if(!disposed)event.target.disabled=false;}
});
function setSearch(q){if(!disposed)$('search-status').textContent=String(q||'')?'Diagnostics: event-log rendering, DOM recovery and preview timeout. Search does not filter evidence.':'Native media diagnostics. Explicit actions only; generated tests are not live-provider acceptance.';}
setSearch(search);
if(receipt){$('results').textContent=JSON.stringify(receipt,null,2);$('export').disabled=false;$('status').textContent='Previous diagnostic receipt retained; new runs are explicit.';}
if(recoveryReceipt){$('recovery-results').textContent=JSON.stringify(recoveryReceipt,null,2);$('export-recovery').disabled=false;}
cancelRun=()=>{lifetime.abort();activeImage?.removeAttribute('src');if(busy&&receipt){receipt.complete=false;receipt.error='Navigation interrupted comparison; no winner declared.';}retained={receipt,recovery:recoveryReceipt};};
return {unmount,setTheme,setSearch,ready:!!source,exportState(){return {available:true};}};
}
