import {phaseBreakdown,completeDataSummary} from './phase-clock.517bbc23572a2147.mjs';
import {acceptVerifiedInput} from './receipt-protocol.b4d10c91dd34ebaa.mjs';
import {prepareDataset} from './baseline.293713d95cef8511.mjs';
import {verifyPrepared,verifyPreparedBounded} from './verified-receiver.0b0bb67b4513ac91.mjs';
import {createFocusGuard,calibrateFrameCadence} from './lab-core.07b69b8b7583dd03.mjs';
// Explicit, bounded local receipt recovery. Integrity is not renewed measurement acceptance.
export const RECEIVER_STORAGE_KEY='athena.receiver.last-good.v1';
const MAX_RECEIPT=262144;
export function validateReceiverReceipt(text){
 if(typeof text!=='string'||text.length>MAX_RECEIPT)throw Error('Receipt exceeds the 256 KiB text limit.');
 const r=JSON.parse(text),pairs={main:['whole','bounded'],worker:['whole','bounded'],transport:['clone','transfer'],receipt:['clone','receipt'],build:['modules','esbuild','rolldown']};
 const lanes=pairs[r?.execution];
 if(!r||r.harness!=='athena-native-complete-receiver-v1'||r.complete!==true||r.count!==200||![8192,65536].includes(r.bytes)||!lanes||!Array.isArray(r.samples)||r.samples.length!==lanes.length*3||!/^[a-f0-9]{64}$/.test(r.dataset?.sha256||'')||!Number.isFinite(Date.parse(r.started_at))||!Number.isFinite(Date.parse(r.finished_at)))throw Error('Not a compatible complete receiver receipt.');
 for(let round=0;round<3;round++)for(const lane of lanes){const s=r.samples.filter(s=>s.round===round&&s.lane===lane);if(s.length!==1||s[0].complete_parity!==true||!Number.isFinite(s[0].request_ms)||s[0].request_ms<0)throw Error('Receipt is missing complete lane/round parity.');}
 return r;
}
async function receiptDigest(text){const hash=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function saveReceiverReceipt(storage,text){
 validateReceiverReceipt(text);
 const envelope=JSON.stringify({schema:1,receipt:text,sha256:await receiptDigest(text)});
 // Storage.setItem is one atomic browser operation; quota/security failures do not clear the previous value.
 storage.setItem(RECEIVER_STORAGE_KEY,envelope);
 if(storage.getItem(RECEIVER_STORAGE_KEY)!==envelope)throw Error('Saved receipt read-back did not match; no durability confirmation.');
 return {bytes:new TextEncoder().encode(envelope).length};
}
export async function loadReceiverReceipt(storage){
 const raw=storage.getItem(RECEIVER_STORAGE_KEY);
 if(raw===null)throw Error('No saved receiver receipt in this browser.');
 if(typeof raw!=='string'||raw.length>MAX_RECEIPT*2)throw Error('Stored receipt exceeds the recovery limit.');
 const e=JSON.parse(raw);
 if(e?.schema!==1||typeof e.receipt!=='string'||e.receipt.length>MAX_RECEIPT||e.sha256!==await receiptDigest(e.receipt))throw Error('Stored receipt integrity check failed.');
 return {text:e.receipt,receipt:validateReceiverReceipt(e.receipt)};
}

let retained={current:null,lastGood:null};
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
 root.innerHTML="<p class=\"notice\">Native Athena receiver lab. Complete generated workload only; no target-project winner. Receipts survive navigation in this tab. Explicitly save last-good to this browser or download before reloading. Browser storage can be cleared or evicted; keep a downloaded backup.</p><p id=\"search-status\" role=\"status\"></p><h2>Complete receiver laboratory</h2><p id=\"build\">Loading verified module\u2026</p><p>Isolated generated-data comparison. Both lanes validate every field, exact bytes and SHA-256. No provider data, autoplay, production promotion or physical-paint claim.</p><label>Metadata per card <select id=\"bytes\"><option value=\"8192\">8 KiB</option><option value=\"65536\">64 KiB</option></select></label><label>Execution <select id=\"execution\"><option value=\"main\">Main thread</option><option value=\"worker\">Dedicated worker, full roundtrip</option><option value=\"transport\">Worker clone versus buffer transfer</option><option value=\"receipt\">Worker clone versus verified-input receipt</option><option value=\"build\">Native modules / esbuild / Rolldown</option></select></label><button id=\"run\" disabled>Run comparison</button><button id=\"cancel\" disabled>Cancel</button><button id=\"download\" disabled>Download current receipt</button><button id=\"last\" disabled>Download last good receipt</button><p id=\"status\">Loading the verification module. Run stays disabled until it is ready.</p><p><label>Input responsiveness probe <input id=\"probe\" placeholder=\"Type during a run\"></label></p><p id=\"summary\">No completed comparison.</p><details><summary>Complete raw receipt</summary><pre id=\"output\"></pre></details><section aria-label=\"Saved receiver receipt\"><h3>Receipt recovery</h3><button id=\"save-receipt\" disabled>Save last-good in this browser</button><button id=\"restore-receipt\">Restore saved receipt</button><p id=\"storage-status\" role=\"status\">No automatic save or restore. Saved data stays on this origin; it is not uploaded.</p></section>";
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./style.css',import.meta.url).href;root.prepend(style);setTheme(theme);
const $=id=>root.getElementById(id),guard=createFocusGuard(document,{addEventListener:listenWindow});
const identity='athena-native-complete-receiver-v1';$('build').textContent='Loaded harness: '+identity;
let busy=false,stopped=false,hidden=false,sequence=0,cancelWorker=null,current=retained.current,lastGood=retained.lastGood;
const visibility=()=>{if(busy&&document.hidden)hidden=true;};document.addEventListener('visibilitychange',visibility);cleanups.push(()=>document.removeEventListener('visibilitychange',visibility));
const check=()=>{guard.check();if(stopped)throw Error('Cancelled; partial evidence retained');if(hidden||document.hidden)throw Error('Visibility lost; partial evidence retained');};
const calibrate=()=>calibrateFrameCadence({requestFrame:requestAnimationFrame,cancelFrame:cancelAnimationFrame,setTimer:setTimeout,clearTimer:clearTimeout,now:()=>performance.now(),check});
const publish=()=>{if(disposed)return;syncStorageButtons();$('output').textContent=JSON.stringify(current,null,2);$('download').disabled=!current;};
function workerRun(lane,prepared,count,bytes){
 return new Promise((resolve,reject)=>{
  const requestStart=performance.timeOrigin+performance.now();
  const workerPath=lane==='esbuild'?'./worker-esbuild.b1772614243c7c75.mjs':lane==='rolldown'?'./worker-rolldown.0e9c42dd5c7472df.mjs':'./receiver-worker.2ddd526f33d730b2.mjs';
  const id=++sequence,w=new Worker(new URL(workerPath,import.meta.url),{type:'module'});let settled=false;
  const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);w.terminate();cancelWorker=null;error?reject(error):resolve(result);};
  const timer=setTimeout(()=>finish(Error('Worker exceeded 30 seconds')),30000);
  cancelWorker=()=>finish(Error('Worker cancelled; partial evidence retained'));
  w.onerror=()=>finish(Error('Worker error; no silent fallback'));
  w.onmessage=e=>{if(settled||e.data?.id!==id)return;const mainReceived=performance.timeOrigin+performance.now();if(e.data.ok!==true){finish(Error(e.data.error||'Worker validation failed'));return;}try{
      const response=e.data;if(response.format==='verified-input'){response.result=acceptVerifiedInput(response.receipt,prepared,count,bytes);}
      else if(response.format==='utf8-records'){
        if(!(response.buffer instanceof ArrayBuffer)||response.buffer.byteLength!==response.dataset?.serialized_bytes)throw Error('Transferred payload size mismatch');
        response.result={records:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(response.buffer)),dataset:response.dataset,preparation_ms:response.preparation_ms};
      }response.phase_timeline=phaseBreakdown({...response.phase,request_start:requestStart,main_received:mainReceived,main_finished:performance.timeOrigin+performance.now()});finish(null,response);
    }catch(error){finish(error);}};
  try{w.postMessage({id,lane:['clone','transfer','receipt','modules','esbuild','rolldown'].includes(lane)?'bounded':lane,transport:lane==='transfer'?'transfer':['receipt','modules','esbuild','rolldown'].includes(lane)?'receipt':'clone',prepared,count,bytes});}catch(error){finish(error);}
 });
}
$('run').addEventListener('click',async()=>{
 if(disposed||busy)return;storageOperation++;busy=true;stopped=false;hidden=false;guard.begin();$('status').textContent='Calibrating current run…';$('summary').textContent='Run in progress; previous completion is not this run.';$('run').disabled=true;$('cancel').disabled=false;$('bytes').disabled=true;$('execution').disabled=true;
 const count=200,bytes=Number($('bytes').value),execution=$('execution').value;
 current={harness:identity,source_harness:"atlas-complete-receiver-v9-explicit-phase-status",started_at:new Date().toISOString(),scope:'Generated browser receiver validation; no target acceptance',count,bytes,execution,complete:false,samples:[],limitations:['Frame gaps are scheduling observations, not INP or physical paint','No heap/RSS or provider-media measurement','Worker request duration includes startup and full input clone; clone mode also clones the full result, transfer mode includes complete output encoding, transfer and decoding','Receipt mode is validation-only: original complete input stays owned by the main thread; no transformed/new records are produced',
  'Build comparison uses identical complete validation-only receipts in all three lanes, with a new worker per sample',
  'Preparation and post-validation parity check are outside sample timers','Main-thread synchronous serialization cannot be interrupted mid-call; cancellation is checked at the next boundary']};publish();
 try{
  check();current.calibration=await calibrate();if(!current.calibration.reliable)throw Error(current.calibration.reason);
  $('status').textContent='Generating complete input…';const prepared=await prepareDataset(count,bytes),canonical=JSON.stringify(prepared.records);check();current.dataset=prepared.dataset;
  const began=performance.now();
  const pair=execution==='build'?['modules','esbuild','rolldown']:execution==='receipt'?['clone','receipt']:execution==='transport'?['clone','transfer']:['whole','bounded'];
  for(let round=0;round<3;round++)for(const lane of execution==='build'?[...pair.slice(round%pair.length),...pair.slice(0,round%pair.length)]:round%2?[...pair].reverse():pair){
   check();if(performance.now()-began>90000)throw Error('90-second cooperative run budget exceeded');
   $('status').textContent=`Round ${round+1}/3: ${lane}, ${execution}`;
   const waits=[];let active=true,frameId,last=performance.now();
   const tick=()=>{const now=performance.now();waits.push(now-last);last=now;if(active)frameId=requestAnimationFrame(tick);};frameId=requestAnimationFrame(tick);
   const start=performance.now();let response;
   try{
    if(execution==='worker'||execution==='transport'||execution==='receipt'||execution==='build')response=await workerRun(lane,prepared,count,bytes);
    else{const a=performance.now();const result=await(lane==='whole'?verifyPrepared:verifyPreparedBounded)(prepared,count,bytes);response={result,validation_ms:performance.now()-a};}
    const request_ms=performance.now()-start;
    await new Promise(resolve=>requestAnimationFrame(resolve));
    check();
    if(JSON.stringify(response.result.records)!==canonical||response.result.dataset.sha256!==prepared.dataset.sha256)throw Error('Full returned-record parity mismatch');
    current.samples.push({round,lane,request_ms,validation_ms:response.validation_ms,transport_encoding_ms:response.transport_encoding_ms??null,reused_verified_encoding:response.reused_verified_encoding===true,phase_timeline:response.phase_timeline??null,frame_waits_ms:waits.slice(),complete_parity:true});publish();
   }finally{active=false;cancelAnimationFrame(frameId);}
   const calibration=await calibrate();current.samples.at(-1).post_sample_calibration=calibration;if(!calibration.reliable)throw Error(calibration.reason);
  }
  check();const completedSummary=completeDataSummary(current.samples);current.complete=true;current.focus_state=guard.snapshot();current.finished_at=new Date().toISOString();lastGood=JSON.stringify(current,null,2);$('last').disabled=false;$('summary').textContent=completedSummary.text;$('status').textContent=completedSummary.rejected?'Complete data comparison; rejected phase timelines are retained, not accepted.':'Complete data comparison. Inspect the scope and retained measurements.';
 }catch(error){if(disposed)return;current.error=error.message;current.complete=false;$('status').textContent=error.message;}
 finally{if(disposed)return;current.focus_state=guard.snapshot();guard.finish();publish();busy=false;$('run').disabled=false;$('cancel').disabled=true;$('bytes').disabled=false;$('execution').disabled=false;syncStorageButtons();}
});
$('cancel').addEventListener('click',()=>{stopped=true;if(cancelWorker)cancelWorker();$('cancel').disabled=true;});
function download(text,name){const url=createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>revokeObjectURL(url),1000);}
$('download').addEventListener('click',()=>download(JSON.stringify(current,null,2),'receiver-current.json'));
$('last').addEventListener('click',()=>{if(lastGood)download(lastGood,'receiver-last-good.json');});

$('run').disabled=false;$('status').textContent='Ready. Keep this window in the foreground.';
let storageOperation=0;
function syncStorageButtons(){if(disposed)return;$('save-receipt').disabled=busy||!lastGood;$('restore-receipt').disabled=busy;}
async function recover(action){if(disposed||busy)return;const operation=++storageOperation;try{if(action==='save'){if(!lastGood)throw Error('No complete receipt to save.');await saveReceiverReceipt(window.localStorage,lastGood);if(disposed||operation!==storageOperation)return;$('storage-status').textContent='Saved last-good receipt and verified exact read-back. Browser storage may still be cleared or evicted; keep a downloaded backup.';}else{const saved=await loadReceiverReceipt(window.localStorage);if(disposed||busy||operation!==storageOperation)return;current=saved.receipt;lastGood=saved.text;retained={current,lastGood};publish();$('last').disabled=false;$('status').textContent='Restored historical receipt, not a new run.';$('summary').textContent='Recovered '+current.execution+' receipt from '+current.finished_at+'. These are historical generated-workload results, not fresh acceptance.';$('storage-status').textContent='Stored receipt checksum and structure verified. No workload was executed.';}}catch(error){if(!disposed&&operation===storageOperation)$('storage-status').textContent='Receipt recovery: '+error.message;}finally{syncStorageButtons();}}
$('save-receipt').addEventListener('click',()=>recover('save'));$('restore-receipt').addEventListener('click',()=>recover('restore'));
syncStorageButtons();
cancelRun=()=>{stopped=true;cancelWorker?.();guard.finish();if(busy&&current){current.complete=false;current.error='Workspace navigation interrupted this run; no winner declared.';}retained={current,lastGood};};
if(current){publish();$('status').textContent='Previous receipt retained. A new run is explicit.';}
$('last').disabled=!lastGood;
function setSearch(value){if(disposed)return;const q=String(value??'').trim().toLowerCase();$('search-status').textContent=!q?'Search matches experiment descriptions, not measured output.':('whole bounded validation worker clone transfer receipt modules esbuild rolldown complete receiver').includes(q)?'This receiver experiment matches your search.':'No match in this receiver experiment. Run controls and output are unchanged.';}
setSearch(search);
return {unmount,setTheme,setSearch,ready:true,exportState(){return {receiptAvailable:!!current,lastGoodAvailable:!!lastGood};}};
}
