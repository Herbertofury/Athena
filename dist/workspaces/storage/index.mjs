import {parseStorageReport, compareObservations, formatMeasurement as bytes} from './model.mjs';

const item=(doc,tag,text)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
const count=(value,noun)=>`${value.toLocaleString()} ${noun}${value===1?'':'s'}`;
const labels={entryLimit:'entry limit',depthLimit:'depth limit',deadline:'time limit',unreadable:'unreadable entries',changed:'changed entries'};

export function mount({container,search='',theme='dark',signal}){
 const doc=container.ownerDocument,root=container.shadowRoot||container.attachShadow({mode:'open'});
 let comparison=null,comparisonGeneration=0,comparisonReading=false,sameScope=false;
 let sortChanges='name';
 let report=null,generation=0,disposed=false,selected=null,reading=false,metric='allocatedBytes';
 root.innerHTML=`<section class="deck" aria-label="Storage observation report"><header><p class="eyebrow">LOCAL REPORTS ONLY</p><h2>See what a project actually uses.</h2><p>Compare every observed pathname with storage blocks counted once per file. This page never scans a directory, contacts a provider, or calculates reclaimable space.</p></header><div class="import"><label for="observation-file">Choose Athena observation JSON</label><input id="observation-file" type="file" accept=".json,application/json"><button id="clear" type="button" disabled>Clear report</button></div><p id="status" role="status" aria-live="polite">No report loaded. Pick a local file to begin. Reports are not saved.</p><p id="error" role="alert"></p><div id="evidence"></div><div id="category-controls" hidden><fieldset><legend>Compare category space by</legend><button type="button" id="allocated" aria-pressed="true">Allocated bytes</button><button type="button" id="logical" aria-pressed="false">Logical bytes</button></fieldset><p id="row-count"></p></div><ul id="rows" aria-label="Report categories"></ul><p id="detail" aria-live="polite"></p><section class="compare-box" aria-labelledby="comparison-title"><h3 id="comparison-title">Compare two local observations</h3><p>Use two already measured reports for a before/after review. This view cannot verify the folder or scan settings and does not show file or folder names from the reports.</p><label for="comparison-file">Choose a second Athena observation JSON</label><input id="comparison-file" type="file" accept=".json,application/json"><button id="clear-comparison" type="button" disabled>Clear second report</button><p id="compare-status" role="status" aria-live="polite">No second report loaded.</p><div id="comparison-result" hidden><div id="comparison-values"></div><label><input id="compare-same" type="checkbox" disabled> I measured the same folder with the same scan, category and filesystem settings</label><p id="comparison-guidance" role="status" aria-live="polite"></p><ul id="compare-metrics" aria-label="Observed change, second minus reference"></ul><section id="compare-categories" hidden aria-labelledby="compare-categories-title"><h4 id="compare-categories-title">Observed category changes</h4><p>Only categories present in both reports have numeric changes. Shared hardlink blocks can move between categories.</p><label for="compare-sort">Sort changes by</label> <select id="compare-sort"><option value="name">Category name</option><option value="allocatedBytes">Size of allocated change</option><option value="logicalBytes">Size of logical change</option><option value="files">Size of pathname count change</option></select><p id="compare-count" role="status"></p><ul id="compare-category-rows" aria-label="Observed category changes"></ul></section></div></section></section>`;
 const css=doc.createElement('link');css.rel='stylesheet';css.href=new URL('./style.css',import.meta.url);root.prepend(css);
 const $=q=>root.querySelector(q),input=$('#observation-file'),clear=$('#clear'),status=$('#status'),error=$('#error');
 const comparisonInput=$('#comparison-file'),compareStatus=$('#compare-status');
 const rows=$('#rows'),evidence=$('#evidence'),controls=$('#category-controls'),detail=$('#detail');
 function redrawRows(){
  rows.replaceChildren();detail.textContent='';if(!report)return;
  const q=search.trim().toLowerCase(),matching=report.categories.filter(row=>row.name.toLowerCase().includes(q));
  $('#row-count').textContent=`${matching.length.toLocaleString()} visible ${matching.length===1?'category':'categories'} · ${report.partial?'totals reflect observed entries only':'totals cover this report, not the full disk'}`;
  for(const row of matching){
   const li=item(doc,'li'),button=item(doc,'button'),name=item(doc,'span',row.name);
   button.type='button';button.className='category';button.setAttribute('aria-pressed',String(row.name===selected));
   const amount=item(doc,'strong',bytes(row[metric]));button.append(name,amount);li.append(button);
   const bar=item(doc,'meter');bar.min=0;bar.max=report.totals[metric]||1;bar.value=row[metric];bar.setAttribute('aria-hidden','true');li.append(bar);
   const description=`${row.name}: ${count(row.files,'pathname')}, ${bytes(row.logicalBytes)} logical, ${bytes(row.allocatedBytes)} allocated.`;
   button.onclick=()=>{if(disposed)return;selected=row.name;for(const node of rows.querySelectorAll('button'))node.setAttribute('aria-pressed',String(node===button));detail.textContent=description;};
   if(row.name===selected)detail.textContent=description;
   rows.append(li);
  }
 }
 function update(){
  evidence.replaceChildren();clear.disabled=!report&&!reading;controls.hidden=!report;
  if(report){
   const {totals,skipped,stops}=report;
   const summary=item(doc,'div');summary.className='summary';
   for(const [label,value] of [['Observed allocated',bytes(totals.allocatedBytes)],['Logical pathname size',bytes(totals.logicalBytes)],['Inventory',`${count(totals.files,'pathname')} / ${count(totals.physicalFiles,'unique file')}`]]){
    const card=item(doc,'article');card.append(item(doc,'h3',label),item(doc,'p',value));summary.append(card);
   }
   const coverage=item(doc,'section');coverage.className='coverage';coverage.dataset.state=report.partial?'partial':'no-stops';
   coverage.setAttribute('aria-labelledby','coverage-title');
   const heading=item(doc,'h3',report.partial?'Partial coverage · observed entries only':'No traversal stops reported');heading.id='coverage-title';
   const stopped=Object.entries(stops).filter(([,value])=>value).map(([reason,value])=>`${labels[reason]} (${value})`).join('; ');
   coverage.append(heading,item(doc,'p',report.partial?`Partial observation: ${stopped}. Totals do not cover the whole selected folder.`:'The report says it finished within its scan limits. Intentional exclusions below were not measured.'));
   if(report.partial&&totals.files===0)coverage.append(item(doc,'p','No files were counted. This does not mean the folder is empty.'));
   evidence.append(coverage,summary,item(doc,'p',`Observation: ${report.observedAt} · Linux report, not verified by this page.`),item(doc,'p',`Excluded: ${count(skipped.links,'link')}, ${count(skipped.mounts,'mount')}, ${skipped.special} special ${skipped.special===1?'entry':'entries'}. No free-space estimate.`));
  }
  redrawRows();updateComparison();
 }
 const signed=(value,format)=>value<0?'−'+format(-value):value>0?'+'+format(value):format(0);
 function updateCategoryChanges(changes){
  const panel=$('#compare-categories'),list=$('#compare-category-rows');
  panel.hidden=!Array.isArray(changes);list.replaceChildren();
  if(!changes)return;
  const term=search.trim().toLowerCase();
  const visible=changes.filter(r=>r.name.toLowerCase().includes(term));
  if(sortChanges!=='name')visible.sort((a,b)=>{
   const amount=r=>r.changes===null?-1:Math.abs(r.changes[sortChanges]);
   return amount(b)-amount(a)||a.name.localeCompare(b.name);
  });
  $('#compare-count').textContent=`${visible.length} of ${changes.length} categories shown.`;
  for(const row of visible){
   const li=item(doc,'li');li.append(item(doc,'strong',row.name));
   const display=row.changes===null
    ?(row.presence==='earlier-only'?'Reference report only; no numeric change.':'Second report only; no numeric change.')
    :`${signed(row.changes.allocatedBytes,bytes)} allocated · ${signed(row.changes.logicalBytes,bytes)} logical · ${signed(row.changes.files,n=>n.toLocaleString())} pathnames`;
   li.append(item(doc,'span',display));list.append(li);
  }
 }
 $('#compare-sort').onchange=event=>{
  if(disposed)return;
  const value=event.target.value;
  if(['name','allocatedBytes','logicalBytes','files'].includes(value))sortChanges=value;
  updateCategoryChanges(compareObservations(report,comparison,sameScope&&!reading&&!comparisonReading).categoryChanges);
 };
 function updateComparison(){
  const panel=$('#comparison-result'), rows=$('#comparison-values'), checked=$('#compare-same');
  panel.hidden=!comparison;$('#clear-comparison').disabled=!comparison&&!comparisonReading;
  rows.replaceChildren();$('#compare-metrics').replaceChildren();
  const result=compareObservations(report,comparison,sameScope&&!reading&&!comparisonReading);
  checked.disabled=reading||comparisonReading||!result.eligible;checked.checked=sameScope&&!checked.disabled;
  $('#comparison-guidance').textContent=result.reason;updateCategoryChanges(result.categoryChanges);
  if(!comparison)return;
  for(const [label,observation] of [['Reference',report],['Second observation',comparison]]){
   if(!observation)continue;
   const block=item(doc,'article');block.className='comparison-result-card';
   block.append(item(doc,'h4',label),item(doc,'time',observation.observedAt));
   const stops=Object.entries(observation.stops).filter(([,n])=>n).map(([k,n])=>`${labels[k]} (${n})`).join('; ');
   block.append(item(doc,'p',observation.partial?'Observed only: '+stops:'No traversal stops reported.'));
   const skips=observation.skipped;
   block.append(item(doc,'p',`Excluded: ${count(skips.links,'link')}, ${count(skips.mounts,'mount')}, ${skips.special.toLocaleString()} special ${skips.special===1?'entry':'entries'}.`),
    item(doc,'p',`${bytes(observation.totals.logicalBytes)} logical · ${bytes(observation.totals.allocatedBytes)} allocated`),
    item(doc,'p',`${count(observation.totals.files,'pathname')} · ${count(observation.totals.physicalFiles,'unique file')}`));
   rows.append(block);
  }
  if(result.changes){
   const names={logicalBytes:'Logical pathname bytes',allocatedBytes:'Unique allocated bytes',files:'Pathnames',physicalFiles:'Unique files'};
   for(const [key,value] of Object.entries(result.changes))$('#compare-metrics').append(item(doc,'li',`${names[key]}: ${value>0?'+':''}${value.toLocaleString()}`));
  }
 }
 comparisonInput.onchange=async()=>{
  const file=comparisonInput.files?.[0];comparisonInput.value='';
  if(!file||disposed)return;
  const current=++comparisonGeneration;comparisonReading=true;sameScope=false;updateComparison();
  compareStatus.textContent='Reading the second report locally…';
  try{
   if(file.size>65536)throw Error('Oversized report.');
   const text=await file.text();if(disposed||current!==comparisonGeneration)return;
   comparison=parseStorageReport(text);compareStatus.textContent='Second report loaded. Reports stay in this view only.';
  }catch{if(!disposed&&current===comparisonGeneration)compareStatus.textContent='Second report refused. Choose valid Athena JSON up to 64 KiB. Previous report preserved.';}
  finally{if(!disposed&&current===comparisonGeneration){comparisonReading=false;updateComparison();}}
 };
 $('#clear-comparison').onclick=()=>{
  if(disposed)return;
  comparisonGeneration++;comparisonReading=false;comparison=null;sameScope=false;compareStatus.textContent='Second report cleared. Nothing saved.';
  updateComparison();comparisonInput.focus();
 };
 $('#compare-same').onchange=()=>{
  if(disposed)return;
  const control=$('#compare-same');sameScope=!control.disabled&&control.checked;updateComparison();
 };
 input.onchange=async()=>{
  const file=input.files?.[0];input.value='';
  if(!file||disposed)return;
  const request=++generation;reading=true;sameScope=false;clear.disabled=false;updateComparison();
  try{
   if(file.size>65536)throw Error('Report must be 64 KiB or smaller.');
   const text=await file.text();if(disposed||request!==generation)return;
   const next=parseStorageReport(text);
   report=next;selected=null;error.textContent='';status.textContent=next.partial?'Partial report imported. Categories below may be incomplete.':'Report imported. It remains unverified and in this view only.';update();
  }catch{if(!disposed&&request===generation){error.textContent='Report refused. Choose a valid Athena observation JSON of at most 64 KiB. Previous report preserved.';}}
  finally{if(!disposed&&request===generation){reading=false;clear.disabled=!report;updateComparison();}}
 };
 clear.onclick=()=>{if(disposed)return;generation++;reading=false;report=null;selected=null;sameScope=false;error.textContent='';status.textContent='Report cleared. Nothing saved.';update();input.focus();};
 function choose(next){if(disposed)return;metric=next;$('#allocated').setAttribute('aria-pressed',String(metric==='allocatedBytes'));$('#logical').setAttribute('aria-pressed',String(metric==='logicalBytes'));redrawRows();}
 $('#allocated').onclick=()=>choose('allocatedBytes');$('#logical').onclick=()=>choose('logicalBytes');
 function setTheme(value){if(disposed)return;container.dataset.theme=value==='light'?'light':'dark';}setTheme(theme);
 function unmount(){if(disposed)return;disposed=true;generation++;comparisonGeneration++;report=null;comparison=null;sameScope=false;selected=null;signal?.removeEventListener('abort',unmount);root.replaceChildren();}
 signal?.addEventListener('abort',unmount,{once:true});if(signal?.aborted)unmount();
 return {unmount,setTheme,setSearch(value){if(disposed)return;search=String(value??'');redrawRows();updateCategoryChanges(compareObservations(report,comparison,sameScope&&!reading&&!comparisonReading).categoryChanges);}};
}
