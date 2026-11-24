import {prepareDataset} from './baseline.293713d95cef8511.mjs';
import {verifyPrepared,verifyPreparedBounded} from './verified-receiver.b14bb9fdc0aaa39e.mjs';
import {createFocusGuard,calibrateFrameCadence} from './lab-core.07b69b8b7583dd03.mjs';
const $=id=>document.getElementById(id),guard=createFocusGuard(document,window);
const identity='atlas-complete-receiver-v2-callback-clock';$('build').textContent='Loaded harness: '+identity;
let busy=false,stopped=false,hidden=false,sequence=0,cancelWorker=null,current=null,lastGood=null;
document.addEventListener('visibilitychange',()=>{if(busy&&document.hidden)hidden=true;});
const check=()=>{guard.check();if(stopped)throw Error('Cancelled; partial evidence retained');if(hidden||document.hidden)throw Error('Visibility lost; partial evidence retained');};
const calibrate=()=>calibrateFrameCadence({requestFrame:requestAnimationFrame,cancelFrame:cancelAnimationFrame,setTimer:setTimeout,clearTimer:clearTimeout,now:()=>performance.now(),check});
const publish=()=>{$('output').textContent=JSON.stringify(current,null,2);$('download').disabled=!current;};
function workerRun(lane,prepared,count,bytes){
 return new Promise((resolve,reject)=>{
  const id=++sequence,w=new Worker(new URL('./receiver-worker.573d137f22a4e267.mjs',import.meta.url),{type:'module'});let settled=false;
  const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);w.terminate();cancelWorker=null;error?reject(error):resolve(result);};
  const timer=setTimeout(()=>finish(Error('Worker exceeded 30 seconds')),30000);
  cancelWorker=()=>finish(Error('Worker cancelled; partial evidence retained'));
  w.onerror=()=>finish(Error('Worker error; no silent fallback'));
  w.onmessage=e=>{if(e.data?.id!==id)return;if(e.data.ok!==true){finish(Error(e.data.error||'Worker validation failed'));return;}finish(null,e.data);};
  w.postMessage({id,lane,prepared,count,bytes});
 });
}
$('run').addEventListener('click',async()=>{
 if(busy)return;busy=true;stopped=false;hidden=false;guard.begin();$('run').disabled=true;$('cancel').disabled=false;$('bytes').disabled=true;$('execution').disabled=true;
 const count=200,bytes=Number($('bytes').value),execution=$('execution').value;
 current={harness:identity,started_at:new Date().toISOString(),scope:'Generated browser receiver validation; no target acceptance',count,bytes,execution,complete:false,samples:[],limitations:['Frame gaps are scheduling observations, not INP or physical paint','No heap/RSS or provider-media measurement','Worker request duration includes startup, full input clone and full returned-record clone','Preparation and post-validation parity check are outside sample timers','Main-thread synchronous serialization cannot be interrupted mid-call; cancellation is checked at the next boundary']};publish();
 try{
  check();current.calibration=await calibrate();if(!current.calibration.reliable)throw Error(current.calibration.reason);
  $('status').textContent='Generating complete input…';const prepared=await prepareDataset(count,bytes),canonical=JSON.stringify(prepared.records);check();current.dataset=prepared.dataset;
  const began=performance.now();
  for(let round=0;round<3;round++)for(const lane of round%2?['bounded','whole']:['whole','bounded']){
   check();if(performance.now()-began>90000)throw Error('90-second cooperative run budget exceeded');
   $('status').textContent=`Round ${round+1}/3: ${lane}, ${execution}`;
   const waits=[];let active=true,frameId,last=performance.now();
   const tick=()=>{const now=performance.now();waits.push(now-last);last=now;if(active)frameId=requestAnimationFrame(tick);};frameId=requestAnimationFrame(tick);
   const start=performance.now();let response;
   try{
    if(execution==='worker')response=await workerRun(lane,prepared,count,bytes);
    else{const a=performance.now();const result=await(lane==='whole'?verifyPrepared:verifyPreparedBounded)(prepared,count,bytes);response={result,validation_ms:performance.now()-a};}
    const request_ms=performance.now()-start;
    await new Promise(resolve=>requestAnimationFrame(resolve));
    check();
    if(JSON.stringify(response.result.records)!==canonical||response.result.dataset.sha256!==prepared.dataset.sha256)throw Error('Full returned-record parity mismatch');
    current.samples.push({round,lane,request_ms,validation_ms:response.validation_ms,frame_waits_ms:waits.slice(),complete_parity:true});publish();
   }finally{active=false;cancelAnimationFrame(frameId);}
   const calibration=await calibrate();current.samples.at(-1).post_sample_calibration=calibration;if(!calibration.reliable)throw Error(calibration.reason);
  }
  check();current.complete=true;current.focus_state=guard.snapshot();current.finished_at=new Date().toISOString();lastGood=JSON.stringify(current,null,2);$('last').disabled=false;$('summary').textContent='Six complete samples retained. No production or target-project promotion.';$('status').textContent='Complete. Full data and scheduling observations retained.';
 }catch(error){current.error=error.message;current.complete=false;$('status').textContent=error.message;}
 finally{current.focus_state=guard.snapshot();guard.finish();publish();busy=false;$('run').disabled=false;$('cancel').disabled=true;$('bytes').disabled=false;$('execution').disabled=false;}
});
$('cancel').addEventListener('click',()=>{stopped=true;if(cancelWorker)cancelWorker();$('cancel').disabled=true;});
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download').addEventListener('click',()=>download(JSON.stringify(current,null,2),'receiver-current.json'));
$('last').addEventListener('click',()=>{if(lastGood)download(lastGood,'receiver-last-good.json');});
