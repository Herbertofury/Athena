import {parseWindowsDirectoryReport,formatMeasurement,compareWindowsDirectoryReports,buildWindowsComparisonReceipt,verifyWindowsComparisonReceipt} from './model.mjs';

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
 <ul id="windows-differences" aria-label="Windows observed differences"></ul>
 <button id="windows-export-comparison" type="button" disabled>Download Windows comparison receipt</button>
 <p id="windows-export-status" role="status"></p>
 <details><summary>Check a saved comparison receipt</summary>
 <label for="windows-verify-receipt">Choose a Windows comparison receipt JSON</label>
 <input id="windows-verify-receipt" type="file" accept=".json,application/json">
 <button id="windows-clear-receipt" type="button" disabled>Clear receipt review</button><p id="windows-receipt-status" role="status"></p>
 <ul id="windows-receipt-differences" aria-label="Recomputed saved differences"></ul></details></section>`;
 parent.append(panel);
 const input=panel.querySelector('input'),clear=panel.querySelector('button'),status=panel.querySelector('[role=status]'),result=panel.querySelector('.windows-evidence');
 const query=id=>panel.querySelector('#'+id);
 const secondInput=query('windows-comparison-file'),secondClear=query('windows-clear-comparison');
 const secondStatus=query('windows-comparison-status'),guidance=query('windows-comparison-guidance');
 const scope=query('windows-same-scope'),differences=query('windows-differences');
 const exportButton=query('windows-export-comparison'), exportStatus=query('windows-export-status');
 const receiptFile=query('windows-verify-receipt'), receiptClear=query('windows-clear-receipt'), receiptStatus=query('windows-receipt-status'), receiptRows=query('windows-receipt-differences');
 let receiptGeneration=0;
 const label={
  logical_pathname_bytes:'Logical pathname bytes',
  observed_identified_allocation_bytes:'Allocation for identified files',
  observed_file_pathnames:'Observed file pathnames',
  identified_unique_files:'Identified unique files',
 };
 function appendDifferences(parent,values){
  for(const [key,value] of Object.entries(values))
   append(parent,'li',label[key]+': '+(value>0?'+':'')+value.toLocaleString());
 }
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
  exportButton.disabled=!compared.changes;
  exportStatus.textContent='';
  if(compared.changes)appendDifferences(differences,compared.changes);
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
 exportButton.onclick=()=>{
  if(closed||exportButton.disabled||reading||secondReading)return;
  let url=null,anchor=null;
  try{
   const receipt=buildWindowsComparisonReceipt(before,after,asserted);
   url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json'}));
   anchor=doc.createElement('a');anchor.href=url;anchor.download='Athena-Windows-Directory-Comparison.json';panel.append(anchor);anchor.click();
   exportStatus.textContent='Comparison receipt offered for download. No file paths or names included.';
  }catch{exportStatus.textContent='Could not offer the receipt. Both reports are unchanged.';}
  finally{anchor?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
 };
 receiptFile.onchange=async()=>{
  const file=receiptFile.files?.[0];receiptFile.value='';if(!file||closed)return;
  const current=++receiptGeneration;receiptRows.replaceChildren();receiptClear.disabled=false;receiptStatus.textContent='Checking saved values…';
  try{
   if(file.size>4096)throw Error();
   const text=await file.text();if(closed||current!==receiptGeneration)return;
   const checked=verifyWindowsComparisonReceipt(text);
   receiptStatus.textContent='Saved values recompute exactly. Directory, ordering and author were not verified.';
   appendDifferences(receiptRows,checked.difference);
  }catch{if(!closed&&current===receiptGeneration)receiptStatus.textContent='Receipt refused: invalid fields or inconsistent differences.';}
 };
 receiptClear.onclick=()=>{if(closed)return;receiptGeneration++;receiptRows.replaceChildren();receiptStatus.textContent='Receipt review cleared.';receiptClear.disabled=true;receiptFile.focus();};
 scope.onchange=()=>{if(closed)return;asserted=!scope.disabled&&scope.checked;update();};
 clear.onclick=()=>{if(closed)return;generation++;reading=false;asserted=false;before=null;result.replaceChildren();status.textContent='Windows report cleared. Nothing saved.';update();input.focus();};
 secondClear.onclick=()=>{if(closed)return;secondGeneration++;secondReading=false;asserted=false;after=null;secondStatus.textContent='Second Windows report cleared. Nothing saved.';update();secondInput.focus();};
 update();
 return ()=>{closed=true;generation++;secondGeneration++;receiptGeneration++;before=null;after=null;result.replaceChildren();differences.replaceChildren();receiptRows.replaceChildren();panel.remove();};
}
