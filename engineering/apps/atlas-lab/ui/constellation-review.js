const $ = id => document.getElementById(id);
const node=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
const count=n=>n.toLocaleString();
const limit=16*1024*1024;
let rows=[], active;
const refs={
  turns_without_exported_chat:'Turns without their chat in this export',
  revisions_without_exported_turn:'Revisions without their turn in this export',
  revisions_with_conflicting_chat:'Revisions naming a different chat than their turn',
  best_revision_not_exported:'Best-revision links absent from this export',
  best_revision_points_to_other_turn:'Best-revision links pointing to another turn'
};
function showRows(){
  const selection=$('filter').value==='needs' ? rows.filter(r=>r.attention) : rows;
  $('collections').replaceChildren(...selection.map(r=>r.card));
  $('coverage').textContent=`${selection.length} of ${rows.length} collections`;
}
function show(report){
  if (report.schema!=='athena-constellation-v7-review'||report.source_schema!==7
      ||!Array.isArray(report.slices)||report.slices.length!==18||!/^[a-f0-9]{64}$/.test(report.exact_input_sha256))
    throw Error('The engine returned an unsupported review.');
  $('digest').textContent=`SHA-256: ${report.exact_input_sha256}`;
  $('references').replaceChildren(...Object.entries(refs).map(([key,label])=>node('li',`${label}: ${count(report.references[key])}`)));
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
  active?.abort(); active=undefined; $('results').hidden=true;
  $('collections').replaceChildren(); $('references').replaceChildren(); $('digest').textContent='';
  const file=$('source').files[0];
  $('review').disabled=!file||file.size>limit;
  $('review-status').textContent=!file?'Choose a file; nothing is sent on selection.'
    :file.size>limit?'This file exceeds the 16 MiB local review limit.':'File selected. Use Run local review when ready.';
});
$('review-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const file=$('source').files[0]; if(!file||file.size>limit||active)return;
  const request=new AbortController(); active=request;
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
