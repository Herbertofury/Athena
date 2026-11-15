'use strict';
import {submitJob} from './job-submit.mjs';
const records=document.querySelector('#records'), status=document.querySelector('#status'), detail=document.querySelector('#detail'), more=document.querySelector('#more');
let next=null, loading=false, selection=0, listEpoch=0, current=null, pinned=null;
const pinButton=document.querySelector('#pin-comparison'), clearButton=document.querySelector('#clear-comparison'), comparisonStatus=document.querySelector('#comparison-status');
function element(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
async function json(url){const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error(`Request failed (${response.status}). Your records were not changed.`);return response.json();}
function display(text){return text===null?'Not retained, unsupported, or over the display budget.':text;}
function checkedRecord(data){
 if(!data||typeof data.id!=='string'||! /^[1-9][0-9]{0,18}$/.test(data.id))throw new Error('Unsupported record identity.');
 for(const key of ['evidence','run'])if(data[key]!==null&&(typeof data[key]!=='string'||data[key].length>2097152))throw new Error('Record exceeds the comparison display budget.');
 return data;
}
function recordPanel(data,label){
 const panel=element('article','');panel.className='record-panel';panel.dataset.recordId=data.id;
 panel.append(element('h3',`${label} · Experiment ${data.id}`),element('p',`${data.recorded_at} · ${data.decision}`),element('p',data.scope));
 for(const [label,value] of [['Evidence',data.evidence],['Complete run',data.run]]){const section=element('details','');section.append(element('summary',label));const pre=element('pre',display(value));pre.tabIndex=0;section.append(pre);panel.append(section);}return panel;
}
function render(){
 pinButton.disabled=current===null;clearButton.disabled=pinned===null;
 comparisonStatus.textContent=pinned?`Pinned experiment ${pinned.id} for this page only. Select another record to compare; reload clears the pin.`:'No comparison pinned. Select a record, then pin it. No experiment runs from these controls.';
 if(!current)return;
 detail.replaceChildren(element('h2',pinned?'Compare retained evidence':`Experiment ${current.id}`));
 if(pinned){
  detail.append(element('p','Side-by-side records, not a controlled benchmark or a recommendation. Check workload, environment, correctness and failures before interpreting differences.'));
  const state=pinned.id===current.id?'Same record selected. Choose a different experiment.': ['evidence','run'].map(key=>`${key}: ${pinned[key]===null||current[key]===null?'comparison unavailable (missing or over budget)':pinned[key]===current[key]?'retained text identical':'retained text differs'}`).join(' · ');
  const status=element('p',state);status.id='comparison-result';detail.append(status);
  const grid=element('div','');grid.className='comparison-grid';grid.append(recordPanel(pinned,'Pinned'),recordPanel(current,'Selected'));detail.append(grid);
 }else detail.append(recordPanel(current,'Selected'));
}
pinButton.addEventListener('click',()=>{if(!current)return;pinned=current;render();});
clearButton.addEventListener('click',()=>{pinned=null;render();});
async function show(id){const token=++selection;current=null;render();detail.replaceChildren(element('h2',`Experiment ${id}`),element('p','Loading recorded evidence…'));try{const data=checkedRecord(await json(`/api/learning/history/${id}`));if(token!==selection)return;current=data;render();history.replaceState(null,'',`/learning#${id}`);}catch(error){if(token===selection){current=null;render();detail.replaceChildren(element('h2','Unable to read this record'),element('p',error.message));}}}
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
