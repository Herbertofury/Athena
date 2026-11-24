import {phaseBreakdown,completeDataSummary} from './phase-clock.517bbc23572a2147.mjs';
import {acceptVerifiedInput} from './receipt-protocol.b4d10c91dd34ebaa.mjs';
import {prepareDataset} from './baseline.293713d95cef8511.mjs';
import {verifyPrepared,verifyPreparedBounded} from './verified-receiver.0b0bb67b4513ac91.mjs';
import {createFocusGuard,calibrateFrameCadence} from './lab-core.07b69b8b7583dd03.mjs';
const $=id=>document.getElementById(id),guard=createFocusGuard(document,window);
const identity='atlas-complete-receiver-v9-explicit-phase-status';$('build').textContent='Loaded harness: '+identity;
let busy=false,stopped=false,hidden=false,sequence=0,cancelWorker=null,current=null,lastGood=null;
document.addEventListener('visibilitychange',()=>{if(busy&&document.hidden)hidden=true;});
const check=()=>{guard.check();if(stopped)throw Error('Cancelled; partial evidence retained');if(hidden||document.hidden)throw Error('Visibility lost; partial evidence retained');};
const calibrate=()=>calibrateFrameCadence({requestFrame:requestAnimationFrame,cancelFrame:cancelAnimationFrame,setTimer:setTimeout,clearTimer:clearTimeout,now:()=>performance.now(),check});
const publish=()=>{$('output').textContent=JSON.stringify(current,null,2);$('download').disabled=!current;};
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
 if(busy)return;busy=true;stopped=false;hidden=false;guard.begin();$('run').disabled=true;$('cancel').disabled=false;$('bytes').disabled=true;$('execution').disabled=true;
 const count=200,bytes=Number($('bytes').value),execution=$('execution').value;
 current={harness:identity,started_at:new Date().toISOString(),scope:'Generated browser receiver validation; no target acceptance',count,bytes,execution,complete:false,samples:[],limitations:['Frame gaps are scheduling observations, not INP or physical paint','No heap/RSS or provider-media measurement','Worker request duration includes startup and full input clone; clone mode also clones the full result, transfer mode includes complete output encoding, transfer and decoding','Receipt mode is validation-only: original complete input stays owned by the main thread; no transformed/new records are produced',
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
 }catch(error){current.error=error.message;current.complete=false;$('status').textContent=error.message;}
 finally{current.focus_state=guard.snapshot();guard.finish();publish();busy=false;$('run').disabled=false;$('cancel').disabled=true;$('bytes').disabled=false;$('execution').disabled=false;}
});
$('cancel').addEventListener('click',()=>{stopped=true;if(cancelWorker)cancelWorker();$('cancel').disabled=true;});
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download').addEventListener('click',()=>download(JSON.stringify(current,null,2),'receiver-current.json'));
$('last').addEventListener('click',()=>{if(lastGood)download(lastGood,'receiver-last-good.json');});

$('run').disabled=false;$('status').textContent='Ready. Keep this window in the foreground.';
