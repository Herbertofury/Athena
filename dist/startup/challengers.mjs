import {indexCatalog,queryCatalog,terms,safeLink} from '../workspaces/software/model.mjs';
import {validate} from '../workspaces/projects/model.mjs';

// Local discovery clues, not quality rankings or fresh upstream verification.
export function reviewQueue(catalog,projects,now=Date.now(),preparedIndex=null) {
 if(!catalog||catalog.schema_version!==1||!Array.isArray(catalog.applications)||catalog.applications.length>5000||!Array.isArray(catalog.recipes))throw Error('Unsupported catalog');
 const entries=projects===undefined?[]:validate(projects).entries.filter(p=>!p.archived&&p.revisions.at(-1).ownership==='own');
 const index=entries.length?(preparedIndex||indexCatalog(catalog)):null,items=[];
 for(const p of entries.slice(0,20)){
  const r=p.revisions.at(-1),queries=[...new Set(terms(`${r.name} ${r.goal}`).map(group=>group[0]).filter(t=>t.length>=4))].slice(0,8),matches=new Map();
  for(const query of queries)for(const app of queryCatalog(index,{q:query,sort:'relevance'},catalog).slice(0,3)){
   if(app.id===p.id)continue;const match=matches.get(app.id)||{app,clues:[]};match.clues.push(query);matches.set(app.id,match);
  }
  const candidates=[...matches.values()].sort((a,b)=>b.clues.length-a.clues.length||a.app.id.localeCompare(b.app.id)).slice(0,3).map(({app,clues})=>({id:app.id,name:app.name,clues,source:safeLink(app.official_url),license:app.license||'Unknown; review required',evidence:app.evidence_status||'Unverified',sources:(app.sources||[]).slice(0,4).map(source=>({url:safeLink(source.url),checkedAt:source.checked_at||null})),decision:'unreviewed'}));
  items.push({projectId:p.id,name:r.name,revision:p.revisions.length,candidates,status:candidates.length?'candidate-review-needed':'no-local-match; broader research still needed'});
 }
 return {schema:1,checkedAt:new Date(now).toISOString(),catalogReviewedAt:catalog.reviewed_at||null,projectsConsidered:items.length,projectsDeferred:Math.max(0,entries.length-20),items,limitations:['Bundled catalog only; no fresh Internet/source/license verification.','Lexical matches are discovery clues, not comparable-feature proof or superiority rankings.','At most 20 projects, 8 terms per project, 3 candidates per term and 3 shown per project; omitted candidates are not rejected.','Private project text stays local. No code reuse, installs, project edits or automatic adoption.']};
}

export async function reviewQueueInSlices(catalog,projects,signal) {
 const now=Date.now(),initial=reviewQueue(catalog,undefined,now),index=indexCatalog(catalog);
 const entries=projects===undefined?[]:validate(projects).entries.filter(p=>!p.archived&&p.revisions.at(-1).ownership==='own');
 for(const entry of entries.slice(0,20)){await new Promise(resolve=>setTimeout(resolve,0));if(signal?.aborted)throw Error('Review cancelled');initial.items.push(...reviewQueue(catalog,{schema:1,entries:[entry]},now,index).items);}
 initial.projectsConsidered=initial.items.length;initial.projectsDeferred=Math.max(0,entries.length-20);return initial;
}

export async function mountNativeReview(host,reader,{signal,pollMs=1500,maxPolls=26,requestMs=3000}={}) {
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const section=el('details'),summary=el('summary','Fresh public-source review: checking native settings…'),body=el('div');section.append(summary,body);host.append(section);
 for(let i=0;i<maxPolls;i++){
  if(signal?.aborted)return;
  const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});let timer;
  try{
   const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'));},requestMs);});
   const value=await Promise.race([reader({signal:controller.signal}),timeout]);if(signal?.aborted)return;
   if(!value||!['disabled','pending','completed','unavailable','stopped'].includes(value.status)||!Array.isArray(value.public_repositories)||value.public_repositories.length>3)throw Error('Invalid native status');
   body.replaceChildren();body.append(el('p','Only explicitly configured public repository IDs are sent to GitHub. Project goals stay local. Launch settings apply to this native session only.'));
   if(value.status==='disabled'){summary.textContent='Fresh public-source review: disabled';body.append(el('p','To opt in, launch the Python native bridge with --challenger-public-repo owner/repository (up to three). Offline/local discovery still works. Unified Rust profile is not connected.'));return;}
   body.append(el('p','Configured public sources: '+value.public_repositories.join(', ')));
   if(value.status==='completed'){
    const report=value.report;if(report?.kind!=='athena-public-challenger-source-review'||!Array.isArray(report.repositories)||report.repositories.length>3)throw Error('Invalid source receipt');
    summary.textContent='Fresh public-source review: receipt ready';
    for(const record of report.repositories){const row=el('section');row.append(el('h3',record.repository),el('p',`Status: ${record.status}. Commit: ${record.commit?.sha||'unknown'}. License: ${record.license?.spdx_id||'unknown; no permission inferred'}. Release: ${record.release?.tag||'unknown'}.`));body.append(row);}
    const evidence=el('pre',JSON.stringify(report,null,2));body.append(el('p','Metadata observations are not source-code inspection, reuse approval or proof of a better implementation.'),evidence);return;
   }
   if(value.status!=='pending'){summary.textContent='Fresh public-source review unavailable';body.append(el('p','Continue with local references. No retry or project change was performed.'));return;}
   summary.textContent='Fresh public-source review: background request running';
  }catch{if(!signal?.aborted){summary.textContent='Fresh public-source review unavailable';body.append(el('p','Native bridge could not provide a result. Local discovery and other workspaces remain available.'));}return;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  await new Promise(resolve=>setTimeout(resolve,pollMs));
 }
 if(signal?.aborted)return;
 summary.textContent='Fresh public-source review: status polling paused';body.append(el('p','Polling budget reached; no automatic retry. Reopen the app to inspect the native session result.'));
}

export async function mountStartupReview({host,projects,fetcher=fetch,signal,timeoutMs=8000,nativeReader=globalThis.AthenaNativeStore?.reviewChallengers}) {
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const details=el('details'),summary=el('summary','Startup comparison review: checking local references…'),body=el('div');details.append(summary,body);host.append(details);
 if(typeof nativeReader==='function')void mountNativeReview(host,nativeReader,{signal}).catch(()=>{});
 const controller=new AbortController();let disposed=false;
 const close=()=>{disposed=true;controller.abort();};signal?.addEventListener('abort',close,{once:true});if(signal?.aborted)close();
 let timer;const timed=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeoutMs);});
 try{
  if(disposed)return;
  const loaded=(async()=>{const response=await fetcher(new URL('../workspaces/software/catalog.json',import.meta.url),{signal:controller.signal});if(!response.ok)throw Error('catalog unavailable');const text=await response.text();if(text.length>8*1024*1024||new TextEncoder().encode(text).byteLength>8*1024*1024)throw Error('catalog exceeds review budget');return JSON.parse(text);})();
  const catalog=await Promise.race([loaded,timed]);if(disposed)return;const report=await reviewQueueInSlices(catalog,projects,controller.signal);if(disposed)return;
  summary.textContent=`Startup comparison review: ${report.projectsConsidered} projects checked against local references`;
  body.append(el('p',report.limitations.join(' ')),el('p',`Catalog review date: ${report.catalogReviewedAt||'unknown'}. Deferred projects: ${report.projectsDeferred}.`));
  if(!report.items.length)body.append(el('p','No active owned project records are available. Add goals in Project browser; this does not mean there are no useful alternatives.'));
  for(const item of report.items){const section=el('section');section.append(el('h3',item.name),el('p',`Project revision ${item.revision}. ${item.status}`));for(const candidate of item.candidates){const row=el('p');const link=el('a',candidate.name);link.href='#software?q='+encodeURIComponent(candidate.name);row.append(link,el('span',` · matched terms: ${candidate.clues.join(', ')} · ${candidate.license} · ${candidate.evidence}`));if(candidate.source){const source=el('a',' Official source');source.href=candidate.source;source.target='_blank';source.rel='noopener noreferrer';row.append(source);}row.append(el('span', ' · source check dates: '+candidate.sources.map(s=>s.checkedAt||'unknown').join(', ')));section.append(row);}body.append(section);}
  body.append(el('p','Before continuing: inspect actual sources/code where available, verify license/version/compatibility, record adopt/adapt/compose/reject/unresolved, and benchmark the same target workload. Existing designs remain the baseline; research is not permission to replace them.'));
  return report;
 }catch{if(!disposed){summary.textContent='Startup comparison review unavailable';body.append(el('p','Other Athena tools remain usable. Open Software discovery and the Challenger & Integration Standard to continue the bounded review manually. No project data changed.'));}}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',close);}
}
