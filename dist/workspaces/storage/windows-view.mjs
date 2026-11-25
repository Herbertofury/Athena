import {parseWindowsDirectoryReport,formatMeasurement} from './model.mjs';

export function mountWindowsReport(doc,parent){
 const count=(n,one,many=one+'s')=>n.toLocaleString()+' '+(n===1?one:many);
 const panel=doc.createElement('section');
 panel.className='windows-report';
 panel.setAttribute('aria-labelledby','windows-report-title');
 panel.innerHTML='<h3 id="windows-report-title">Windows directory summary</h3><p>Choose JSON from <code>atlas-lab.exe windows-directory-observation</code>. Direct children only; no subfolders, categories or before/after comparison. This page does not scan or save anything.</p><div class="import"><label for="windows-observation-file">Choose a Windows observation JSON</label><input id="windows-observation-file" type="file" accept=".json,application/json"><button type="button" disabled>Clear Windows report</button></div><p role="status">No Windows report loaded.</p><div class="windows-evidence"></div>';
 parent.append(panel);
 const input=panel.querySelector('input'),clear=panel.querySelector('button'),status=panel.querySelector('[role=status]'),result=panel.querySelector('.windows-evidence');
 let generation=0,closed=false,loaded=false;
 function append(parent,tag,text){
  const el=doc.createElement(tag);el.textContent=text;parent.append(el);return el;
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
  const token=++generation;clear.disabled=false;status.textContent='Reading Windows report locally…';
  try{
   if(file.size>4096)throw Error();
   const text=await file.text();if(closed||token!==generation)return;
   show(parseWindowsDirectoryReport(text));loaded=true;status.textContent='Windows report loaded. Nothing saved.';
  }catch{
   if(!closed&&token===generation)status.textContent='Windows report refused. Choose valid Windows directory observation v1 JSON (up to 4 KiB, exact byte counts).'+(loaded?' Previous report preserved.':'');
  }finally{if(!closed&&token===generation)clear.disabled=!loaded;}
 };
 clear.onclick=()=>{if(closed)return;generation++;loaded=false;result.replaceChildren();status.textContent='Windows report cleared. Nothing saved.';clear.disabled=true;input.focus();};
 return ()=>{closed=true;generation++;result.replaceChildren();panel.remove();};
}
