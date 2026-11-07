'use strict';
import {collectionJob,versionExperimentJob,versionCollectionJob,upstreamReviewJob,projectArchiveJob,jobLabel,jobIdentity} from './collection-input.mjs';
import {createArchiveSelection,loadSavedArchive} from './archive-view.mjs';
import {submitJob} from './job-submit.mjs';
const $ = id => document.getElementById(id);
const renderedJobs = new Map();
let emptyNode = null;
let renderedInstance = null;
const panels = new Set(['overview','collectors','experiments']);
function showPanel(name) {
  if (!panels.has(name)) name='overview';
  document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==name);
  document.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-current',b.dataset.panel===name?'page':'false'));
}
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{location.hash=b.dataset.panel;}));
window.addEventListener('hashchange',()=>showPanel(location.hash.slice(1)));showPanel(location.hash.slice(1));
function text(tag,value,className) {const e=document.createElement(tag);e.textContent=value;if(className)e.className=className;return e;}
function render(data,instance=null) {
  if(instance!==null&&!/^[a-f0-9]{32}$/.test(instance))throw new Error('Invalid engine identity; previous results are retained.');
  const reuse=instance!==null&&instance===renderedInstance;
  const identities=data.jobs.map(jobIdentity);
  if(new Set(identities).size!==identities.length)throw new Error('Repeated job identities; previous results are retained.');
  const metrics={pending:(data.counts.queued||0)+(data.counts.running||0),completed:data.counts.succeeded||0,failed:data.counts.failed||0};
  const nodes=[],nextRenderedJobs=new Map();
  if(!data.jobs.length){if(!emptyNode){emptyNode=text('div','','empty');emptyNode.append(text('strong','Your first experiment starts with a question.'),text('span','Open Collection to retrieve public project metadata.'));}nodes.push(emptyNode);}
  for(const [index,job] of data.jobs.entries()){const identity=identities[index];const signature=job.state+':'+job.attempt;const prior=reuse?renderedJobs.get(identity):null;if(prior&&prior.signature===signature){nextRenderedJobs.set(identity,prior);nodes.push(prior.node);continue;}const e=text('article','','job');const top=text('div','','job-top');
    const name=jobLabel(job.job);
    top.append(text('h3',name),text('span',job.state.toUpperCase(),'badge '+job.state));e.append(top,text('p','Job '+identity+' · attempt '+job.attempt));
    if(job.result?.project){const p=job.result.project;e.append(text('p',p.title+' · '+p.id+' · '+p.versions.length+' version IDs'));}
    if(job.result?.batch){const b=job.result.batch;e.append(text('p',b.projects.length+' retrieved · '+b.missing_ids.length+' missing from response'));if(b.missing_ids.length)e.append(text('p','Partial result. Missing IDs: '+b.missing_ids.join(', '),'error'));}
    if(job.result?.project_archive){const a=job.result.project_archive;e.append(text('p','Complete project archive · '+a.canonical_id+' · generation '+a.generation+' · '+a.payload_bytes+' bytes retained locally'));}
    if(job.result?.version_collection){const v=job.result.version_collection;e.append(text('p',v.records.length+' versions saved · '+v.missing_ids.length+' missing · complete JSON retained locally'));if(v.missing_ids.length)e.append(text('p','Partial result. Missing version IDs: '+v.missing_ids.join(', '),'error'));}
    if(job.result?.upstream_review){const u=job.result.upstream_review;e.append(text('p',u.repository+' · '+(u.revision||u.state||'No new observation')),text('p',u.comparison?'Comparison: '+u.comparison+' · observed '+u.observed_at_utc+' UTC':(u.error||'No new observation')),text('p','Observation only, not an upgrade or security clearance.'));}
    if(job.result?.experiment){const run=job.result.experiment;const decision=typeof run.decision==='string'?run.decision:Object.keys(run.decision)[0];e.append(text('p',run.evidence.trials.length+' timed pairs · '+run.evidence.stress_cases+' stress cases · '+run.reason),text('p','Gate: '+decision+' · execution is not promotion.'));}
    if(job.result?.error)e.append(text('p',job.result.error,'error'));
    if(job.result){const d=document.createElement('details');d.append(text('summary','Inspect recorded result'),text('pre',JSON.stringify(job.result,null,2)));e.append(d);}
    nextRenderedJobs.set(identity,{signature,node:e});nodes.push(e);
  }
  // Prepare every card before committing metrics or keyed reuse state.
  // A later malformed record must not poison the next successful refresh.
  const container=$('jobs');let cursor=container.firstChild;
  for(const node of nodes){if(node===cursor){cursor=cursor.nextSibling;}else{container.insertBefore(node,cursor);}}
  while(cursor){const next=cursor.nextSibling;cursor.remove();cursor=next;}
  renderedJobs.clear();for(const [identity,record] of nextRenderedJobs)renderedJobs.set(identity,record);
  renderedInstance=instance;
  $('pending').textContent=metrics.pending;$('completed').textContent=metrics.completed;$('failed').textContent=metrics.failed;
}
let fetching=false;
async function refresh(){if(fetching||document.hidden)return;fetching=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(new DOMException('Local overview request timed out','TimeoutError')),15000);try{const r=await fetch('/api/overview',{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('Local engine unavailable ('+r.status+').');const data=await r.json();render(data,r.headers?.get('x-atlas-engine-instance')??null);$('connection').textContent='Connected · worker '+data.worker_status+' · refreshed '+new Date().toLocaleTimeString();$('connection').classList.remove('error');}catch(e){$('connection').textContent=e.message+' Previous results remain visible.';$('connection').classList.add('error');}finally{clearTimeout(timer);fetching=false;}}
$('collect-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');if(button.disabled)return;button.disabled=true;$('collect-status').textContent='Queuing request…';$('collect-status').classList.remove('error');try{const j=await submitJob(collectionJob($('project').value));$('collect-status').textContent='Job '+j.id+' queued. Follow its result in Overview.';await refresh();}catch(error){$('collect-status').textContent=error.message;$('collect-status').classList.add('error');}finally{button.disabled=false;}});
refresh();setInterval(refresh,2500);document.addEventListener('visibilitychange',refresh);

$('run-experiment').addEventListener('click',async()=>{const button=$('run-experiment');if(button.disabled)return;button.disabled=true;const status=$('experiment-status');status.textContent='Queuing the fixed bounded experiment…';try{const job=await submitJob('DedupExperiment');status.textContent='Job '+job.id+' queued. Review raw evidence and its gate in Overview; no deployment occurs.';await refresh();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}});

$('version-experiment-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');if(button.disabled)return;button.disabled=true;const status=$('version-experiment-status');status.classList.remove('error');status.textContent='Queuing a fixed comparison of the saved record…';try{const job=await submitJob(versionExperimentJob($('version-experiment-id').value));status.textContent='Job '+job.id+' queued. This does not fetch data or change the default parser.';await refresh();}catch(error){status.textContent=error.message;status.classList.add('error');}finally{button.disabled=false;}});

$('version-collect-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');if(button.disabled)return;button.disabled=true;const status=$('version-collect-status');status.classList.remove('error');status.textContent='Queuing public version metadata…';try{const job=await submitJob(versionCollectionJob($('version-collect-ids').value));status.textContent='Job '+job.id+' queued. Wait for saved records in Overview before comparing a version in Experiments.';await refresh();}catch(error){status.textContent=error.message;status.classList.add('error');}finally{button.disabled=false;}});

$('upstream-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');if(button.disabled)return;button.disabled=true;const status=$('upstream-status');status.classList.remove('error');status.textContent='Queuing the fixed public checkpoint…';try{const job=await submitJob(upstreamReviewJob($('upstream-source').value));status.textContent='Job '+job.id+' queued. Results require review; no download or upgrade will run.';await refresh();}catch(error){status.textContent=error.message;status.classList.add('error');}finally{button.disabled=false;}});

$('project-archive-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');if(button.disabled)return;button.disabled=true;const status=$('project-archive-status');status.classList.remove('error');status.textContent='Queuing complete received project JSON for local storage…';try{const job=await submitJob(projectArchiveJob($('project-archive-id').value));status.textContent='Job '+job.id+' queued. Overview will show a hash/generation receipt; original JSON stays in local snapshots.';await refresh();}catch(error){status.textContent=error.message;status.classList.add('error');}finally{button.disabled=false;}});

const archiveSelection=createArchiveSelection(({kind,id},options)=>loadSavedArchive(kind,id,options));
function showSavedArchive(){const record=archiveSelection.last;if(!record)return;$('saved-archive-title').textContent=record.kind+' '+record.id+' · generation '+record.generation;$('saved-archive-meta').textContent=record.bytes.byteLength+' bytes · SHA-256 '+record.hash;$('saved-archive-text').textContent=record.text;if(!$('saved-archive-dialog').open)$('saved-archive-dialog').showModal();}
$('saved-archive-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button'),status=$('saved-archive-status');button.disabled=true;$('cancel-archive-load').disabled=false;status.classList.remove('error');status.textContent='Reading and verifying local bytes; previous verified response is retained…';try{const result=await archiveSelection.load({kind:$('saved-archive-kind').value,id:$('saved-archive-id').value.trim()});if(result.status!=='ready')return;$('show-last-archive').disabled=false;status.textContent='Exact saved JSON verified. Provider markup is displayed only as text.';showSavedArchive();}catch(error){status.textContent=error.message;status.classList.add('error');}finally{button.disabled=archiveSelection.pending;$('cancel-archive-load').disabled=!archiveSelection.pending;}});
$('cancel-archive-load').addEventListener('click',()=>{archiveSelection.cancel();$('saved-archive-form').querySelector('button').disabled=false;$('cancel-archive-load').disabled=true;$('saved-archive-status').textContent='Load cancelled. The previous verified response remains available.';});
$('show-last-archive').addEventListener('click',showSavedArchive);
function cancelPendingArchiveViewer(){if(!archiveSelection.pending)return;archiveSelection.cancel();$('saved-archive-form').querySelector('button').disabled=false;$('cancel-archive-load').disabled=true;$('saved-archive-status').textContent='Viewer closed; pending load cancelled. The previous verified response remains available.';}
$('close-saved-archive').addEventListener('click',()=>{cancelPendingArchiveViewer();$('saved-archive-dialog').close();});
$('saved-archive-dialog').addEventListener('cancel',cancelPendingArchiveViewer);
$('saved-archive-dialog').addEventListener('close',cancelPendingArchiveViewer);
$('download-saved-archive').addEventListener('click',()=>{const record=archiveSelection.last;if(!record)return;const url=URL.createObjectURL(new Blob([record.bytes],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=(record.kind==='upstream'?'github-upstream':'modrinth-'+record.kind)+'-'+record.id+'-generation-'+record.generation+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});

$('saved-archive-kind').addEventListener('change',()=>{archiveSelection.cancel();$('saved-archive-form').querySelector('button').disabled=false;$('cancel-archive-load').disabled=true;$('saved-archive-status').textContent='Archive type changed. The previous verified response remains available with its original type.';});
