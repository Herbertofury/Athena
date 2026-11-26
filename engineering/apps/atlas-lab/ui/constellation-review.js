const $ = id => document.getElementById(id);
const node=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
const count=n=>n.toLocaleString();
const limit=16*1024*1024;
let rows=[], active, currentReceipt, receiptEpoch=0;
const refs={
  turns_without_exported_chat:'Turns without their chat in this export',
  revisions_without_exported_turn:'Revisions without their turn in this export',
  revisions_with_conflicting_chat:'Revisions naming a different chat than their turn',
  best_revision_not_exported:'Best-revision links absent from this export',
  best_revision_points_to_other_turn:'Best-revision links pointing to another turn'
};
const artifactStates={
 linked_to_exported_chat:'Linked to an exported chat',
 chat_not_in_export:'Chat not in this export',
 provider_download_bucket:'Provider download bucket (not a chat)',
 no_chat_link:'No chat link',
 unrecognized_row:'Unrecognized row'
};
function artifactSummary(report){
 const result=[];
 for(const [kind,label] of [['files','Files'],['output_snapshots','Output snapshots']]){
  const values=report?.[kind];
  const keys=Object.keys(artifactStates);
  if(!only(values,keys)||keys.some(key=>!unsigned(values[key]))){
   result.push(node('li',label+': link coverage unavailable.'));
   continue;
  }
  const states=keys.filter(key=>values[key]>0).map(key=>artifactStates[key]+': '+count(values[key]));
  result.push(node('li',label+': '+(states.join('; ')||'no records')+'.'));
 }
 return result;
}
const receiptSchema='athena-constellation-redacted-receipt-v1';
const receiptLimit=32*1024;
const collections=Object.freeze('providers projects chats turns turnRevisions outputSnapshots files knowledgeItems knowledgeSources projectContinuity events checkpoints syncReceipts catalogRuns groups smartCollections projectBaselines integrityFindings'.split(' '));
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const unsigned=n=>Number.isSafeInteger(n)&&n>=0;
const quantity=n=>n===null||unsigned(n);
const only=(value,keys)=>value&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
function project(slices,references){
 if(!Array.isArray(slices)||slices.length!==collections.length||!only(references,Object.keys(refs)))throw Error('Unsupported receipt fields.');
 const counts=slices.map((row,i)=>{
  if(!row||row.kind!==collections[i]||![row.retained,row.export_cap,row.source_reported,row.omitted].every(quantity)||typeof row.cap_reached!=='boolean')throw Error('Invalid collection counts.');
  return {kind:collections[i],retained:row.retained,export_cap:row.export_cap,source_reported:row.source_reported,omitted:row.omitted,cap_reached:row.cap_reached};
 });
 const referenceCounts=Object.fromEntries(Object.keys(refs).map(key=>{if(!unsigned(references[key]))throw Error('Invalid reference count.');return [key,references[key]];}));
 return {counts,reference_counts:referenceCounts};
}
const jsonHash=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),b=>b.toString(16).padStart(2,'0')).join('');
function resetReceipt(){
 receiptEpoch++;currentReceipt=undefined;$('include-fingerprint').checked=false;$('save-receipt').disabled=true;
 $('saved-receipt').value='';$('compare-receipt').disabled=true;$('receipt-status').textContent='';$('receipt-differences').replaceChildren();
}
function receiptBody(fingerprint){
 const {projection,digest}=currentReceipt;
 return {schema:receiptSchema,source_schema:7,...projection,input_sha256:fingerprint?digest:null};
}
function reportDiff(before,now){
 const diff=[];
 for(const [i,row] of before.counts.entries()){
  const newRow=now.counts[i];
  for(const [field,label] of [['retained','retained'],['source_reported','source reported'],['omitted','omitted']]){
   if(row[field]!==newRow[field])diff.push(row.kind+' '+label+': '+(row[field]??'unknown')+' → '+(newRow[field]??'unknown'));
  }
  if(row.cap_reached!==newRow.cap_reached||row.export_cap!==newRow.export_cap)
   diff.push(row.kind+' writer limit: '+(row.export_cap??'none')+(row.cap_reached?' (reached)':'')+' → '+(newRow.export_cap??'none')+(newRow.cap_reached?' (reached)':''));
 }
 for(const [key,label] of Object.entries(refs))if(before.reference_counts[key]!==now.reference_counts[key])
  diff.push(label+': '+before.reference_counts[key]+' → '+now.reference_counts[key]);
 return diff;
}
$('save-receipt').addEventListener('click',async()=>{
 if(!currentReceipt)return;
 const rev=receiptEpoch,body=receiptBody($('include-fingerprint').checked);
 try{
  const checksum_sha256=await jsonHash(body);if(rev!==receiptEpoch)return;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({...body,checksum_sha256},null,2)+'\n'],{type:'application/json'}));a.download='Athena-Constellation-Redacted-Receipt.json';
  try{a.click();$('receipt-status').textContent='Redacted receipt generated. Your browser handles the download.';}finally{setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
 }catch{if(rev===receiptEpoch)$('receipt-status').textContent='Receipt could not be generated.';}
});
$('saved-receipt').addEventListener('change',()=>{
 receiptEpoch++;$('receipt-differences').replaceChildren();$('receipt-status').textContent='';
 const file=$('saved-receipt').files[0];$('compare-receipt').disabled=!currentReceipt||!file||file.size>receiptLimit;
 if(file?.size>receiptLimit)$('receipt-status').textContent='Choose a redacted receipt no larger than 32 KiB.';
});
$('compare-receipt').addEventListener('click',async()=>{
 const file=$('saved-receipt').files[0];if(!currentReceipt||!file||file.size>receiptLimit)return;
 const rev=++receiptEpoch,now=receiptBody(false),digest=currentReceipt.digest;
 $('compare-receipt').disabled=true;$('receipt-differences').replaceChildren();
 try{
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()),data=JSON.parse(raw);
  if(!only(data,['schema','source_schema','counts','reference_counts','input_sha256','checksum_sha256'])||
     data.schema!==receiptSchema||data.source_schema!==7||!(data.input_sha256===null||hex(data.input_sha256))||!hex(data.checksum_sha256))throw Error('Receipt could not be verified.');
  const projection=project(data.counts,data.reference_counts);
  for(const row of data.counts)if(!only(row,['kind','retained','export_cap','source_reported','omitted','cap_reached']))throw Error('Unexpected receipt fields.');
  const body={schema:receiptSchema,source_schema:7,...projection,input_sha256:data.input_sha256};
  const calculated=await jsonHash(body);if(rev!==receiptEpoch)return;if(calculated!==data.checksum_sha256)throw Error('Receipt checksum does not match.');
  const diff=reportDiff(body,now);
  $('receipt-differences').replaceChildren(...diff.map(line=>node('li',line)));
  $('receipt-status').textContent=(diff.length?`${diff.length} count or limit changes.`:'No count or limit changes.')+
   (body.input_sha256?(body.input_sha256===digest?' Export fingerprint matches.':' Export fingerprint differs.'):' Saved receipt has no export fingerprint.');
 }catch(error){if(rev===receiptEpoch)$('receipt-status').textContent=/^(Receipt|Unsupported|Invalid|Unexpected)/.test(error.message)?error.message:'Receipt could not be verified.';}
 finally{if(rev===receiptEpoch)$('compare-receipt').disabled=false;}
});
function showRows(){
  const selection=$('filter').value==='needs' ? rows.filter(r=>r.attention) : rows;
  $('collections').replaceChildren(...selection.map(r=>r.card));
  $('coverage').textContent=`${selection.length} of ${rows.length} collections`;
}
function show(report){
  if (report.schema!=='athena-constellation-v7-review'||report.source_schema!==7
      ||!Array.isArray(report.slices)||report.slices.length!==18||!/^[a-f0-9]{64}$/.test(report.exact_input_sha256))
    throw Error('The engine returned an unsupported review.');
  currentReceipt={projection:project(report.slices,report.references),digest:report.exact_input_sha256};
  $('save-receipt').disabled=false;
  $('digest').textContent=`SHA-256: ${report.exact_input_sha256}`;
  $('references').replaceChildren(...Object.entries(refs).map(([key,label])=>node('li',`${label}: ${count(report.references[key])}`)));
  $('artifact-references').replaceChildren(...artifactSummary(report.artifact_references));
  rows=report.slices.map(row=>{
    const card=document.createElement('article');card.className='record-panel';
    card.append(node('h3',row.kind.replace(/([a-z])([A-Z])/g,'$1 $2')),
      node('p',row.retained===null?'Not present in this export.':`${count(row.retained)} retained.`));
    if (row.source_reported!==null)
      card.append(node('p',`Source reported ${count(row.source_reported)} · ${count(row.omitted)} omitted.`));
    else if (row.cap_reached)
      card.append(node('p',`Writer limit reached (${count(row.export_cap)}); omitted count unknown.`));
    return {card,attention:row.retained===null||row.omitted>0||(row.cap_reached&&row.omitted===null)};
  });
  showRows(); $('results').hidden=false;
}
$('filter').addEventListener('change',showRows);
$('source').addEventListener('change',()=>{
  active?.abort(); active=undefined; resetReceipt(); $('results').hidden=true;
  $('collections').replaceChildren(); $('references').replaceChildren(); $('artifact-references').replaceChildren(); $('digest').textContent='';
  const file=$('source').files[0];
  $('review').disabled=!file||file.size>limit;
  $('review-status').textContent=!file?'Choose a file; nothing is sent on selection.'
    :file.size>limit?'This file exceeds the 16 MiB local review limit.':'File selected. Use Run local review when ready.';
});
$('review-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const file=$('source').files[0]; if(!file||file.size>limit||active)return;
  const request=new AbortController(); active=request; resetReceipt();
  $('review').disabled=true;$('results').hidden=true;$('review-status').textContent='Reviewing on this computer…';
  try{
    const r=await fetch('/api/migration/constellation/review',{method:'POST',mode:'same-origin',
      credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.any([request.signal,AbortSignal.timeout(15000)]),
      headers:{'x-atlas-request':'local-ui','content-type':'application/json'},body:file});
    if(active!==request)return;
    if(r.status===422)throw Error((await r.json()).error);
    if(!r.ok)throw Error(`Local review unavailable (${r.status}).`);
    const report=await r.json(); if(active!==request)return;
    show(report); $('review-status').textContent='Review complete. Nothing was imported or changed.';
  }catch(error){
    if(active===request)$('review-status').textContent=error.message;
  }finally{
    if(active===request){active=undefined;$('review').disabled=false;}
  }
});
