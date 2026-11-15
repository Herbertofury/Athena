'use strict';
import {submitJob} from './job-submit.mjs';
const records=document.querySelector('#records'), status=document.querySelector('#status'), detail=document.querySelector('#detail'), more=document.querySelector('#more');
let next=null, loading=false, selection=0, listEpoch=0;
function element(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
async function json(url){const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error(`Request failed (${response.status}). Your records were not changed.`);return response.json();}
function display(text){return text===null?'Not retained, unsupported, or over the display budget.':text;}
async function show(id){const token=++selection;detail.replaceChildren(element('h2',`Experiment ${id}`),element('p','Loading recorded evidence…'));try{const data=await json(`/api/learning/history/${id}`);if(token!==selection)return;detail.replaceChildren(element('h2',`Experiment ${data.id}`),element('p',`${data.recorded_at} · ${data.decision}`),element('p',data.scope));for(const [label,value] of [['Evidence',data.evidence],['Complete run',data.run]]){const section=element('details','');section.append(element('summary',label));const pre=element('pre',display(value));pre.tabIndex=0;section.append(pre);detail.append(section);}history.replaceState(null,'',`/learning#${id}`);}catch(error){if(token===selection)detail.replaceChildren(element('h2','Unable to read this record'),element('p',error.message));}}
async function load(){if(loading)return;const epoch=listEpoch;loading=true;more.disabled=true;try{const data=await json(`/api/learning/history${next===null?'':`?before=${next}`}`);if(epoch!==listEpoch)return;for(const row of data.records){const li=element('li',''),button=element('button',`${row.candidate} / ${row.baseline}`);button.addEventListener('click',()=>show(row.id));li.append(button,element('p',`#${row.id} · ${row.recorded_at} · ${row.decision}`));records.append(li);}next=data.next_before;more.hidden=next===null;status.textContent=records.children.length?`${records.children.length} retained experiments loaded. Older records are available only when present.`:'No recorded experiments yet. Run a bounded experiment in Athena or use the offline dedup-lab command.';}catch(error){status.textContent=error.message;}finally{if(epoch===listEpoch){loading=false;more.disabled=false;}}}
more.addEventListener('click',load);load();if(/^#[1-9][0-9]*$/.test(location.hash))show(location.hash.slice(1));

const runButton=document.querySelector('#run-experiment'), runStatus=document.querySelector('#run-status');
runButton.addEventListener('click',async()=>{
 if(runButton.disabled)return;
 runButton.disabled=true;runStatus.textContent='Submitting one bounded experiment…';
 let receipt;
 try{receipt=await submitJob('DedupExperiment');}
 catch(error){runStatus.textContent=error.message+' Reload only after checking Engineering Overview; this button stays disabled to avoid an uncertain repeat.';return;}
 runStatus.textContent=`Job ${receipt.id} queued. Waiting for its retained evidence…`;
 try{
  for(let observation=0;observation<60;observation++){
   const state=await json(`/api/learning/jobs/${receipt.id}`);
   runStatus.textContent=`Job ${receipt.id}: ${state.state}.`;
   if(['succeeded','failed'].includes(state.state)){
    if(state.experiment_id){runStatus.textContent+= ' Complete experiment history is retained. Execution is not promotion.';listEpoch++;loading=false;records.replaceChildren();next=null;await load();await show(state.experiment_id);}
    else runStatus.textContent+=' Complete history was not confirmed; inspect Engineering Overview for retained job evidence.';
    runButton.disabled=false;return;
   }
   await new Promise(resolve=>setTimeout(resolve,1000));
  }
  runStatus.textContent=`Job ${receipt.id} is not confirmed finished. Check Engineering Overview; this page stopped polling, not the job.`;
 }catch(error){runStatus.textContent=`Job ${receipt.id} was accepted, but status is unconfirmed. ${error.message} Check Engineering Overview before another submission.`;}
});
