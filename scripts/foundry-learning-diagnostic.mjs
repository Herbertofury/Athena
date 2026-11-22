import {decodeJobReceipt,MAX_JOB_RECEIPT_BYTES} from '../engineering/apps/atlas-lab/ui/job-submit.mjs';
const validId=x=>typeof x==='string'&&/^[1-9]\d{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
export function acceptedJobId(text){try{return decodeJobReceipt(text).id;}catch{return null;}}

// Serialized by Playwright; never return page text or any other DOM content.
export function observeLearningUi(){
 const button=document.querySelector('#run-experiment');
 const text=document.querySelector('#run-status')?.textContent?.slice(0,256).trim()??'';
 const state=!button?'unavailable':
  /^Job [1-9]\d{0,18} was accepted, but status is unconfirmed\./.test(text)?'status_unconfirmed':
  /^Job [1-9]\d{0,18}: (?:succeeded|failed)\. Complete experiment history is retained\./.test(text)?'terminal_reported_retained':
  /^Job [1-9]\d{0,18}: (?:succeeded|failed)\. Complete history was not confirmed\./.test(text)?'terminal_history_unconfirmed':
  /^Job [1-9]\d{0,18}(?: queued\.|: (?:queued|running)\.)/.test(text)?'awaiting_terminal':
  /^Job [1-9]\d{0,18} is not confirmed finished\./.test(text)?'observation_limit':
  text.startsWith('Submission outcome is unconfirmed.')?'submission_unconfirmed':'other';
 return {state,submitDisabled:button?button.disabled===true:null};
}

export async function readLearningUiOnce(page){
 const fallback={state:'unavailable',submitDisabled:null};
 let timer;
 try{
  return await Promise.race([page.evaluate(observeLearningUi),new Promise(resolve=>{timer=setTimeout(()=>resolve(fallback),1200);})]);
 }catch{return fallback;}
 finally{clearTimeout(timer);}
}

export function projectLearningOverview(data,id){
 if(!validId(id)||!Array.isArray(data?.jobs)||data.jobs.length>50)return {observation:'unavailable'};
 const matches=data.jobs.filter(row=>row?.id_text===id&&row.job==='DedupExperiment');
 if(matches.length!==1)return {observation:matches.length?'ambiguous':'not_in_snapshot'};
 const {state,result}=matches[0];
 if(!['queued','running','succeeded','failed'].includes(state))return {observation:'unknown_state'};
 return {observation:'observed',state,terminal:state==='succeeded'||state==='failed',hasHistoryReference:validId(result?.experiment_id_text)};
}

// One new read, only after the original acceptance has already failed on a status 5xx.
// It observes the exact accepted ID in the separate queue snapshot; it never re-queries
// the failed endpoint, submits, retries, or emits result bodies/PID/path/details.
export async function readLearningOverviewOnce(origin,id,fetchImpl=fetch){
 if(!validId(id))return {observation:'acceptance_not_observed'};
 try{
  const base=new URL(origin);
  if(base.protocol!=='http:'||base.hostname!=='127.0.0.1'||!base.port||base.origin!==origin)return {observation:'unavailable'};
  const response=await fetchImpl(new URL('/api/overview',base),{redirect:'error',signal:AbortSignal.timeout(1200),cache:'no-store'});
  if(!response.ok)return {observation:'http_error',status:response.status};
  const size=Number(response.headers.get('content-length'));
  if(!Number.isSafeInteger(size)||size<1||size>524288)return {observation:'missing_or_oversized_length'};
  return projectLearningOverview(await response.json(),id);
 }catch{return {observation:'unavailable'};}
}

// Designed for the runner's own small localhost POST receipt; no payload is emitted.
export async function readAcceptedReceipt(response){
 try{
  const size=Number(response.headers()['content-length']);
  if(!Number.isSafeInteger(size)||size<1||size>MAX_JOB_RECEIPT_BYTES)return null;
  return acceptedJobId(await response.text());
 }catch{return null;}
}
