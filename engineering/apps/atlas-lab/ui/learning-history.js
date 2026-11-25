'use strict';
import {submitJob} from './job-submit.mjs';
import {learningActivity,readLocalArtwork} from './activity.mjs';
const records=document.querySelector('#records'), status=document.querySelector('#status'), detail=document.querySelector('#detail'), more=document.querySelector('#more');
let next=null, loading=false, selection=0, listEpoch=0, current=null, pinned=null, marked=null;
const search=document.querySelector('#history-search'),sort=document.querySelector('#history-sort'),historyResults=document.querySelector('#history-results');
const loaded=new Map(),collator=new Intl.Collator('en',{sensitivity:'base',numeric:true});
const recordId=value=>typeof value==='string'&&value===value.trim()&&/^[1-9][0-9]{0,18}$/.test(value)&&BigInt(value)<=9223372036854775807n;
const pinButton=document.querySelector('#pin-comparison'), clearButton=document.querySelector('#clear-comparison'), comparisonStatus=document.querySelector('#comparison-status');
function element(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
async function json(url,stop){const timeout=AbortSignal.timeout(8000),signal=stop?AbortSignal.any([stop,timeout]):timeout;const response=await fetch(url,{cache:'no-store',credentials:'same-origin',redirect:'error',signal});if(!response.ok)throw new Error(`Request failed (${response.status}). Your records were not changed.`);return response.json();}
function display(text){return text===null?'Not retained, unsupported, or over the display budget.':text;}
function checkedRecord(data,expected){
 if(!recordId(data?.id)||data.id!==expected)throw new Error('Saved record identity does not match the requested experiment.');
 for(const key of ['evidence','run'])if(data[key]!==null&&(typeof data[key]!=='string'||data[key].length>2097152))throw new Error('Record exceeds the comparison display budget.');
 return data;
}
function recordPanel(data,label){
 const panel=element('article','');panel.className='record-panel';panel.dataset.recordId=data.id;
 panel.append(element('h3',`${label} · Experiment ${data.id}`),element('p',`${data.recorded_at} · ${data.decision}`),element('p',data.scope));
 for(const [label,value] of [['Evidence',data.evidence],['Complete run',data.run]]){const section=element('details','');section.append(element('summary',label));const pre=element('pre',display(value));pre.tabIndex=0;section.append(pre);panel.append(section);}return panel;
}
function render(){
 const active=loaded.get(current?.id)?.button??null;
 if(marked!==active){marked?.setAttribute('aria-current','false');active?.setAttribute('aria-current','true');marked=active;}
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
async function show(id){const token=++selection;current=null;render();detail.replaceChildren(element('h2',`Experiment ${id}`),element('p','Loading recorded evidence…'));try{const data=checkedRecord(await json(`/api/learning/history/${id}`),id);if(token!==selection)return;current=data;render();history.replaceState(null,'',`/learning#${id}`);}catch(error){if(token===selection){current=null;render();detail.replaceChildren(element('h2','Unable to read this record'),element('p',error.message));}}}
function updateLoadedHistory(){
 const focused=document.activeElement,terms=search.value.slice(0,256).toLowerCase().trim().split(/\s+/).filter(Boolean);
 const rows=[...loaded.values()],order=sort.value;
 if(order==='older')rows.reverse();
 else if(order==='candidate'||order==='decision')rows.sort((a,b)=>collator.compare(a[order],b[order]));
 let visible=0,cursor=records.firstChild;
 for(const row of rows){
  row.node.hidden=!terms.every(term=>term.startsWith('#')?term.slice(1)===row.id:row.text.includes(term));
  if(!row.node.hidden)visible++;
  if(row.node===cursor)cursor=cursor.nextSibling;
  else records.insertBefore(row.node,cursor);
 }
 if(focused&&document.activeElement!==focused&&records.contains(focused)&&!focused.closest('[hidden]'))focused.focus();
 historyResults.textContent=(visible?visible+' of '+rows.length+' loaded experiments shown.':rows.length?'No loaded experiments match.':'No loaded experiments yet.')+
  (!visible&&next!==null?' Older unloaded records may still match.':'');
}
function checkedSummaries(data,before){
 if(!Array.isArray(data?.records)||data.records.length>20||
   (data.next_before!==null&&(!recordId(data.next_before)||data.records.length!==20||data.next_before!==data.records.at(-1)?.id)))throw Error('Invalid history page. Previously loaded records are unchanged.');
 let previous=before;
 for(const row of data.records){
  if(!recordId(row?.id)||loaded.has(row.id)||(previous!==null&&BigInt(row.id)>=BigInt(previous))||
     ['candidate','baseline','recorded_at','decision'].some(key=>typeof row[key]!=='string'||row[key].length>512))throw Error('Invalid history record. Previously loaded records are unchanged.');
  previous=row.id;
 }
 return data;
}
async function load(){
 if(loading)return;
 const epoch=listEpoch,before=next,moreFocused=document.activeElement===more;
 loading=true;more.disabled=true;
 try{
  const result=await json(`/api/learning/history${before===null?'':`?before=${before}`}`);
  if(epoch!==listEpoch)return;
  const data=checkedSummaries(result,before),added=[];
  for(const row of data.records){
   const node=element('li',''),button=element('button',`${row.candidate} / ${row.baseline}`);
   node.dataset.recordId=row.id;button.type='button';button.setAttribute('aria-current',String(row.id===current?.id));
   button.addEventListener('click',()=>{if(loaded.get(row.id)?.button===button)show(row.id);});node.append(button,element('p',`#${row.id} · ${row.recorded_at} · ${row.decision}`));
   const item={id:row.id,candidate:row.candidate,decision:row.decision,node,button,text:[row.candidate,row.baseline,row.recorded_at,row.decision].join(' ').toLowerCase()};
   loaded.set(row.id,item);added.push(item);
  }
  next=data.next_before;more.hidden=next===null;updateLoadedHistory();
  if(moreFocused&&(document.activeElement===more||document.activeElement===document.body)){
   (added.find(row=>!row.node.hidden)?.button??(more.hidden?search:more)).focus();
  }
  status.textContent=loaded.size?`${loaded.size} retained experiments loaded. Older records are available only when present.`:'No recorded experiments yet. Run a bounded experiment in Athena or use the offline dedup-lab command.';
 }catch(error){status.textContent=error.message;}
 finally{if(epoch===listEpoch){loading=false;more.disabled=false;if(moreFocused&&!more.hidden&&document.activeElement===document.body)more.focus();}}
}
search.addEventListener('input',updateLoadedHistory);sort.addEventListener('change',updateLoadedHistory);
more.addEventListener('click',load);load();if(recordId(location.hash.slice(1)))show(location.hash.slice(1));

const runButton=document.querySelector('#run-experiment'),runStatus=document.querySelector('#run-status');
const stopButton=document.querySelector('#stop-watching');
const indicator=document.querySelector('#learning-activity');
const feeding=learningActivity({indicator,canvas:indicator.querySelector('canvas'),doc:document});
const artInput=document.querySelector('#learning-art'),clearArt=document.querySelector('#clear-learning-art'),artStatus=document.querySelector('#learning-art-status');
let artEpoch=0;
artInput.addEventListener('change',async()=>{
 const file=artInput.files?.[0];
 if(!file)return;
 const epoch=++artEpoch;
 artInput.value='';artStatus.textContent='Checking PNG geometry locally…';
 try{
  const png=await readLocalArtwork(file);
  if(epoch!==artEpoch)return;
  feeding.setArtwork(png);clearArt.disabled=false;
  artStatus.textContent='PNG checked for this tab. It is decoded only during a confirmed running experiment.';
 }catch(error){if(epoch===artEpoch)artStatus.textContent=error.message+' Any previous artwork stays selected.';}
});
clearArt.addEventListener('click',clearArtwork);
function clearArtwork(){
 artEpoch++;feeding.setArtwork(null);
 clearArt.disabled=true;artInput.value='';artStatus.textContent='No custom artwork selected.';
}
let watch=null,scope=0;
function endWatch(item){
 if(watch!==item)return false;
 watch=null;item.motion.stop();item.abort.abort();
 if(document.activeElement===stopButton){runStatus.tabIndex=-1;runStatus.focus();}
 stopButton.hidden=true;
 return true;
}
stopButton.addEventListener('click',()=>{
 const current=watch;
 if(current&&endWatch(current))runStatus.textContent=`Stopped watching job ${current.id}. This does not cancel it. Check Engineering Overview before starting another.`;
});
window.addEventListener('pagehide',()=>{
 scope++;clearArtwork();
 if(watch){
  const {id}=watch;endWatch(watch);
  runStatus.textContent=`Stopped watching job ${id} when this page closed. Check Engineering Overview for its status.`;
 }
});
function waitWhileWatching(signal){
 return new Promise(resolve=>{
  if(signal.aborted){resolve();return;}
  const stop=()=>{clearTimeout(timer);resolve();};
  const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},1000);
  signal.addEventListener('abort',stop,{once:true});
 });
}
runButton.addEventListener('click',async()=>{
 if(runButton.disabled)return;
 const epoch=++scope;
 runButton.disabled=true;runStatus.textContent='Submitting one bounded experiment…';
 let receipt;
 try{receipt=await submitJob('DedupExperiment');}
 catch(error){if(epoch===scope)runStatus.textContent=error.message+' Reload only after checking Engineering Overview; this button stays disabled to avoid an uncertain repeat.';return;}
 if(epoch!==scope)return;
 const current=watch={id:receipt.id,abort:new AbortController(),motion:feeding.begin(receipt.id)};
 stopButton.hidden=false;
 runStatus.textContent=`Job ${receipt.id} queued. Waiting for its retained evidence…`;
 try{
  for(let observation=0;observation<60;observation++){
   if(watch!==current)return;
   const state=await json(`/api/learning/jobs/${receipt.id}`,current.abort.signal);
   if(watch!==current)return;
   const phase=current.motion.observe(state);
   if(phase==='uncertain'||phase==='stale')throw Error('Received a mismatched or invalid job status.');
   const message=`Job ${receipt.id}: ${phase}.`;
   if(['succeeded','failed','cancelled','canceled'].includes(phase)){
    endWatch(current);
    runStatus.textContent=message;
    if(state.history_retained&&recordId(state.experiment_id)){
     runStatus.textContent+=' Complete experiment history is retained. Execution is not promotion.';
     listEpoch++;loading=false;loaded.clear();records.replaceChildren();next=null;await load();if(epoch===scope)await show(state.experiment_id);
    }else runStatus.textContent+=' Complete history was not confirmed; inspect Engineering Overview for retained job evidence.';
    if(epoch===scope)runButton.disabled=false;
    return;
   }
   if(runStatus.textContent!==message)runStatus.textContent=message;
   await waitWhileWatching(current.abort.signal);
  }
  if(endWatch(current))runStatus.textContent=`Job ${receipt.id} is not confirmed finished. Check Engineering Overview; this page stopped polling, not the job.`;
 }catch(error){
  if(endWatch(current))runStatus.textContent=`Job ${receipt.id} was accepted, but status is unconfirmed. ${error.message} Check Engineering Overview before another submission.`;
 }
});
