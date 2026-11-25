import {parseWindowsDirectoryReport,formatMeasurement,compareWindowsDirectoryReports} from './model.mjs';

export function mountWindowsReport(doc,parent){
 const count=(n,one,many=one+'s')=>n.toLocaleString()+' '+(n===1?one:many);
 const panel=doc.createElement('section');
 panel.className='windows-report';
 panel.setAttribute('aria-labelledby','windows-report-title');
 panel.innerHTML=`<h3 id="windows-report-title">Windows directory summary</h3><p>Choose JSON from <code>atlas-lab.exe windows-directory-observation</code>. Direct children only; no subfolder scan or categories. This page does not scan or save anything.</p><div class="import"><label for="windows-observation-file">Choose a Windows observation JSON</label><input id="windows-observation-file" type="file" accept=".json,application/json"><button type="button" disabled>Clear Windows report</button></div><p role="status">No Windows report loaded.</p><div class="windows-evidence"></div><section class="compare-box" aria-labelledby="windows-compare-title"><h4 id="windows-compare-title">Compare two Windows observations</h4>
 <label for="windows-comparison-file">Choose the second Windows observation</label><input id="windows-comparison-file" type="file" accept=".json,application/json">
 <button id="windows-clear-comparison" type="button" disabled>Clear second Windows report</button>
 <p id="windows-comparison-status" role="status">No second Windows report loaded.</p>
 <label><input id="windows-same-scope" type="checkbox" disabled> Same directory and settings, in the order I intend</label>
 <p id="windows-comparison-guidance" role="status"></p>
 <ul id="windows-differences" aria-label="Windows observed differences"></ul></section>`;
 parent.append(panel);
 const input=panel.querySelector('input'),clear=panel.querySelector('button'),status=panel.querySelector('[role=status]'),result=panel.querySelector('.windows-evidence');
 const query=id=>panel.querySelector('#'+id);
 const secondInput=query('windows-comparison-file'),secondClear=query('windows-clear-comparison');
 const secondStatus=query('windows-comparison-status'),guidance=query('windows-comparison-guidance');
 const scope=query('windows-same-scope'),differences=query('windows-differences');
 let generation=0,secondGeneration=0,closed=false,before=null,after=null,reading=false,secondReading=false,asserted=false;
 function append(parent,tag,text){
  const el=doc.createElement(tag);el.textContent=text;parent.append(el);return el;
 }
 function update(){
  const compared=compareWindowsDirectoryReports(before,after,asserted&&!reading&&!secondReading);
  scope.disabled=reading||secondReading||!compared.eligible;
  scope.checked=asserted&&!scope.disabled;
  clear.disabled=!before&&!reading;
  secondClear.disabled=!after&&!secondReading;
  guidance.textContent=compared.reason;
  differences.replaceChildren();
  if(!compared.changes)return;
  const keys={
   logical_pathname_bytes:'Logical pathname bytes',
   observed_identified_allocation_bytes:'Allocation for identified files',
   observed_file_pathnames:'Observed file pathnames',
   identified_unique_files:'Identified unique files',
  };
  for(const [key,value] of Object.entries(compared.changes))
   append(differences,'li',keys[key]+': '+(value>0?'+':'')+value.toLocaleString());
 }
 function show(report){
  result.replaceChildren();
  const summary=doc.createElement('div');summary.className='summary';result.append(summary);
  for(const [label,value,unit] of [
   ['Logical bytes across observed pathnames',report.logical_pathname_bytes,true],
   ['Allocation for identified files only',report.observed_identified_allocation_bytes,true],
   ['Observed file pathnames',report.observed_file_pathnames,false],
   ['Identified unique files',report.identified_unique_files,false]]){
   const card=doc.createElement('article');summary.append(card);
   append(card,'h4',label);append(card,'p',unit?formatMeasurement(value)+' ('+value.toLocaleString()+' bytes)':value.toLocaleString());
  }
  const flags=[];
  if(report.stopped_entry_limit)flags.push('entry limit reached');
  if(report.stopped_batch_limit)flags.push('batch limit reached');
  if(report.files_without_stable_id)flags.push(report.files_without_stable_id.toLocaleString()+' file pathnames without a stable ID');
  if(report.identity_or_name_conflicts)flags.push(report.identity_or_name_conflicts.toLocaleString()+' identity or name conflicts');
  append(result,'p',report.partial?'Partial observation: '+flags.join('; ')+'.':'No limits or identity conflicts reported.');
  append(result,'p','Excluded direct entries: '+count(report.excluded_directories,'directory','directories')+'; '+count(report.excluded_reparse_entries,'reparse entry','reparse entries')+'.');
  append(result,'p','Imported summary, not verified here. Not a point-in-time snapshot or an estimate of reclaimable space.');
 }
 input.onchange=async()=>{
  const file=input.files?.[0];input.value='';if(!file||closed)return;
  const token=++generation;reading=true;asserted=false;update();status.textContent='Reading Windows report locally…';
  try{
   if(file.size>4096)throw Error();
   const text=await file.text();if(closed||token!==generation)return;
   before=parseWindowsDirectoryReport(text);show(before);status.textContent='Windows report loaded. Nothing saved.';
  }catch{
   if(!closed&&token===generation)status.textContent='Windows report refused. Choose valid Windows directory observation v1 JSON (up to 4 KiB, exact byte counts).'+(before?' Previous report preserved.':'');
  }finally{if(!closed&&token===generation){reading=false;update();}}
 };
 secondInput.onchange=async()=>{
  const file=secondInput.files?.[0];secondInput.value='';if(!file||closed)return;
  const token=++secondGeneration;secondReading=true;asserted=false;update();
  secondStatus.textContent='Reading the second Windows report locally…';
  try{
   if(file.size>4096)throw Error();
   const text=await file.text();if(closed||token!==secondGeneration)return;
   after=parseWindowsDirectoryReport(text);
   secondStatus.textContent='Second Windows report loaded. Nothing saved.';
  }catch{
   if(!closed&&token===secondGeneration)secondStatus.textContent='Second Windows report refused.'+(after?' Previous report preserved.':'');
  }finally{if(!closed&&token===secondGeneration){secondReading=false;update();}}
 };
 scope.onchange=()=>{if(closed)return;asserted=!scope.disabled&&scope.checked;update();};
 clear.onclick=()=>{if(closed)return;generation++;reading=false;asserted=false;before=null;result.replaceChildren();status.textContent='Windows report cleared. Nothing saved.';update();input.focus();};
 secondClear.onclick=()=>{if(closed)return;secondGeneration++;secondReading=false;asserted=false;after=null;secondStatus.textContent='Second Windows report cleared. Nothing saved.';update();secondInput.focus();};
 update();
 return ()=>{closed=true;generation++;secondGeneration++;before=null;after=null;result.replaceChildren();differences.replaceChildren();panel.remove();};
}
