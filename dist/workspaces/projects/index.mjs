import {empty,validate,change,archive,createBrowseIndex,stages} from './model.mjs';
import {parseBackup,mergeBackup,MAX_IMPORT_BYTES} from './import.mjs';
const PAGE=24;
export function mount({container,state,setState,search='',signal,theme='dark',readSavedProject}){
 const root=container.shadowRoot||container.attachShadow({mode:'open'});let data,disposed=false,selected=null,editing=null,generation=0,review=null,portable=null,ownership='',stage='',archived=false;const urls=new Set();
 let browseIndex,rows=[],shown=0,limit=PAGE;
 let failure='',committed;try{prepareData(state===undefined?empty():validate(state));committed=JSON.stringify(data);}catch(e){failure='Stored projects could not be opened and have not been overwritten. '+e.message;}
 root.innerHTML=`<div class="project-shell"><header><p class="eyebrow">YOUR NEXT WORLD STARTS HERE</p><h2>Project browser</h2><p>Ideas you own. Work you follow. One place to see what comes next.</p><div class="toolbar"><button id="new">New project</button><button id="export">Export projects</button><label class="import">Import backup<input id="import" type="file" accept="application/json,.json"></label></div></header><p id="notice" role="status"></p><section id="transfer-review" hidden aria-labelledby="transfer-heading"><h3 id="transfer-heading" tabindex="-1">Review one portable project</h3><p id="transfer-summary"></p><p>Only this saved project and its full history. Includes every saved revision, source link, and project-specific metadata. No other project records, workspace settings, learning or Continuity notes. The download is plain text; inspect it before sharing.</p><details id="transfer-packet"><summary>Inspect exact JSON contents</summary><pre id="transfer-json"></pre></details><div class="toolbar"><button id="transfer-save" type="button">Download reviewed project</button><button id="transfer-cancel" type="button">Cancel portable copy</button></div><p>To reopen elsewhere, choose Import backup there. Athena will review before adding this ID and never overwrite a conflicting project.</p></section><section id="backup-review" hidden aria-labelledby="backup-heading"><h3 id="backup-heading">Review project backup</h3><p id="backup-summary"></p><ul id="backup-projects"></ul><div class="toolbar"><button id="backup-confirm" type="button">Import reviewed projects</button><button id="backup-cancel" type="button">Cancel backup import</button></div></section><div class="filters"><label>Project ownership<select id="ownership" aria-label="Project ownership"><option value="">All projects</option><option value="own">My projects</option><option value="followed">Following</option></select></label><label>Project stage<select id="stage" aria-label="Project stage"><option value="">Every stage</option>${stages.map(s=>`<option>${s}</option>`).join('')}</select></label><button id="archived">Show archived</button></div><p id="count" role="status"></p><div class="layout"><div class="collection"><section id="cards" aria-label="Project collection"></section><button id="more" type="button" aria-controls="cards" hidden>Show next projects</button></div><section id="detail" aria-label="Project details"></section></div><form id="editor" hidden><h3 id="editor-title">New project</h3><label>Project name<input name="name" required maxlength="200"></label><label>Ownership<select name="ownership" aria-label="Ownership"><option value="own">My project</option><option value="followed">Followed external project</option></select></label><label>Stage<select name="stage" aria-label="Stage">${stages.map(s=>`<option>${s}</option>`).join('')}</select></label><label>Goal<textarea name="goal" maxlength="10000"></textarea></label><label>Next actions<textarea name="next" maxlength="10000"></textarea></label><label>Blockers<textarea name="blockers" maxlength="10000"></textarea></label><label>Decisions<textarea name="decisions" maxlength="10000"></textarea></label><label>Resources and inspiration<textarea name="resources" maxlength="10000"></textarea></label><label>Official source URL<input name="source" type="url" maxlength="2000"></label><label>Observed version<input name="version" maxlength="200"></label><label>Release source URL<input name="release" type="url" maxlength="2000"></label><button type="submit">Save project</button><button type="button" id="cancel">Cancel</button></form><footer>Private in this browser. Export separately for backup. Followed projects are manually recorded references, not automatic polling or external social follows. Versions are your observations, not a claim of latest release. Detected competing Projects edits are refused; export your draft before reloading. Use one editing tab. Import requires review, adds missing IDs and refuses conflicts. The input limit is 100 projects / 16 MiB; the browser save limit is lower; nothing is silently replaced. Project continuity notes remain separate and untouched.</footer></div>`;
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./style.css',import.meta.url);root.prepend(css);
 const $=s=>root.querySelector(s),form=$('#editor'),notice=$('#notice');const fields=['name','ownership','stage','goal','next','blockers','decisions','resources','source','version','release'];
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
 function prepareData(next){browseIndex=createBrowseIndex(next);data=next;}
 function save(next){
  prepareData(next);let saved=false,conflict=false;
  try{saved=setState?.(data,{reviewedProjectMutation:committed})===true;}catch(error){conflict=error?.code==='PROJECT_WRITE_CONFLICT';}
  if(saved)committed=JSON.stringify(data);
  notice.textContent=saved?'Saved in this browser. Export a backup.':conflict?'Not saved. Saved Projects changed. Export your draft before reloading Athena.':'Not saved. Keep this page open and export your draft before leaving.';
  render();
 }
 function edit(id){if(disposed||!data)return;editing=id;form.reset();const r=data.entries.find(p=>p.id===id)?.revisions.at(-1);for(const k of fields)form.elements[k].value=r?.[k]??(k==='ownership'?'own':k==='stage'?'idea':'');$('#editor-title').textContent=id?'Edit project':'New project';form.hidden=false;form.elements.name.focus();}
 function cancel(){editing=null;form.reset();form.hidden=true;$('#new').focus();}
 function projectCard(p){
  const r=p.revisions.at(-1),card=el('article');card.className='project-card';card.dataset.project=p.id;
  card.append(el('span',`${r.ownership==='own'?'OWN PROJECT':'FOLLOWING'} · ${r.stage.toUpperCase()}`),el('h3',r.name),el('p',r.goal||'A new idea waiting to take shape.'));
  const open=button('Open project',()=>{if(disposed)return;selected=p.id;renderDetail();$('#detail h3')?.focus();});
  open.setAttribute('aria-label','Open '+r.name);card.append(open);return card;
 }
 function appendPage(){
  const cards=$('#cards'),more=$('#more'),page=cards.ownerDocument.createDocumentFragment();
  let first=null;
  for(const row of rows.slice(shown,limit)){const card=projectCard(row);first??=card;page.append(card);shown++;}
  cards.append(page);
  const remaining=rows.length-shown;
  more.hidden=!remaining;
  if(remaining)more.textContent=`Show next ${Math.min(PAGE,remaining)} projects`;
  $('#count').textContent=`Showing ${shown} of ${rows.length} matching · ${browseIndex.active} active projects`;
  return first;
 }
 function render(){
  if(disposed||!data)return;
  const cards=$('#cards');cards.replaceChildren();shown=0;
  rows=browseIndex.find({query:search,ownership,stage,archived});appendPage();
  if(!rows.length)cards.append(el('p','No projects match. Capture an idea or adjust your filters.'));
  renderDetail();
 }
 function renderDetail(){
  const detail=$('#detail');detail.replaceChildren();const p=rows.find(p=>p.id===selected);if(!p){detail.append(el('h3','Make room for the ambitious.'),el('p','Choose a project to explore its goals, decisions, next actions and source history.'));return;}
  const r=p.revisions.at(-1),title=el('h3',r.name);title.tabIndex=-1;detail.append(title,el('p',`${r.ownership==='own'?'Your project':'Followed project'} · ${r.stage}`));
  for(const [k,label] of [['goal','Goal'],['next','Next actions'],['blockers','Blockers'],['decisions','Decisions'],['resources','Resources and inspiration'],['version','Observed version']]){detail.append(el('h4',label),el('p',r[k]||'Not recorded'));}
  for(const [k,label] of [['source','Official source'],['release','Release reference']])if(r[k]){const a=el('a',label+' ↗');a.href=r[k];a.target='_blank';a.rel='noopener noreferrer';detail.append(a);}
  detail.append(button('Edit project',()=>edit(p.id)),button(p.archived?'Restore project':'Archive project',()=>{save(archive(data,p.id));$('#archived').focus();}));
  if(typeof readSavedProject==='function'){const action=button('Review portable copy',()=>reviewTransfer(p.id));action.dataset.transferProject=p.id;detail.append(action);}
  const history=el('details');history.append(el('summary',`${p.revisions.length} saved revision(s)`));for(const rev of [...p.revisions].reverse())history.append(el('pre',JSON.stringify(rev,null,2)));detail.append(history);
  const compareHost=el('div');detail.append(compareHost);
  import('./compare.mjs').then(({mountComparison})=>{
   if(disposed||!compareHost.isConnected)return;
   mountComparison(compareHost,()=>{
    const saved=typeof readSavedProject==='function'?readSavedProject(p.id):JSON.parse(committed).entries.find(entry=>entry.id===p.id);
    if(!saved||saved.id!==p.id)return null;
    return validate({schema:1,entries:[saved]}).entries[0];
   });
  }).catch(()=>{if(!disposed&&compareHost.isConnected)compareHost.textContent='Optional revision comparison unavailable; project history remains usable.';});
 }
 $('#new').onclick=()=>edit(null);$('#cancel').onclick=cancel;
 form.onsubmit=e=>{e.preventDefault();if(!data||disposed)return;try{const input=Object.fromEntries(fields.map(k=>[k,form.elements[k].value]));const id=editing||crypto.randomUUID();const next=change(data,id,input);selected=id;save(next);cancel();}catch(e){notice.textContent=e.message;}};
 function savedDate(at){const date=new Date(at);return Number.isFinite(date.getTime())?date.toISOString():'unavailable';}
 function composeSelectedTransfer(id){
  const selectedProject=data.entries.find(entry=>entry.id===id);
  if(!selectedProject||typeof readSavedProject!=='function')throw Error('This host cannot verify the saved project.');
  const durable=readSavedProject(id);
  if(!durable||JSON.stringify(selectedProject)!==JSON.stringify(durable))throw Error('Saved project changed or has unsaved edits. Reopen Projects and review the exact saved record.');
  const pack={schema:1,entries:[durable]};
  if(JSON.stringify(pack).length>250000)throw Error('This project cannot fit in the portable browser save limit. The original is unchanged.');
  const text=JSON.stringify(pack,null,2)+'\n';
  const bytes=new TextEncoder().encode(text);
  // Reuse the exact destination admission rules: duplicate keys, lossy numbers,
  // and unreadable project fields fail here, before the user can download.
  parseBackup(bytes);
  return {text,bytes:bytes.length,durable};
 }
 function closeTransfer(){
  portable=null;$('#transfer-review').hidden=true;$('#transfer-json').textContent='';
  $('#transfer-packet').open=false;
 }
 function reviewTransfer(id){
  if(disposed||!data)return;
  try{
   const {text,bytes,durable}=composeSelectedTransfer(id), latest=durable.revisions.at(-1);
   portable={id,text};
   $('#transfer-summary').textContent=`${latest.name} · project ${id} · ${durable.revisions.length} saved revision(s) · latest ${savedDate(latest.at)} · ${bytes.toLocaleString()} bytes${durable.archived?' · archived':''}`;
   $('#transfer-json').textContent=text;$('#transfer-packet').open=false;
   $('#transfer-review').hidden=false;$('#transfer-heading').focus();
   notice.textContent='Review the exact contents before saving a local copy.';
  }catch(e){closeTransfer();notice.textContent=e.message;}
 }
 $('#transfer-cancel').onclick=()=>{
  const id=portable?.id;closeTransfer();notice.textContent='Portable copy canceled. Nothing downloaded.';
  ([...root.querySelectorAll('button[data-transfer-project]')].find(b=>b.dataset.transferProject===id)||$('#export')).focus();
 };
 $('#transfer-save').onclick=()=>{
  if(disposed||!portable)return;
  const review=portable;
  try{
   if(composeSelectedTransfer(review.id).text!==review.text)throw Error('The project changed after review. Open a fresh portable-copy review.');
   const link=el('a'),url=URL.createObjectURL(new Blob([review.text],{type:'application/json'}));
   urls.add(url);link.href=url;link.download='athena-one-project.json';link.click();
   closeTransfer();notice.textContent='Download requested for the reviewed project only. Nothing was saved to Athena or sent online.';
   ([...root.querySelectorAll('button[data-transfer-project]')].find(b=>b.dataset.transferProject===review.id)||$('#export')).focus();
  }catch(e){closeTransfer();notice.textContent=e.message;}
 };
 $('#more').onclick=()=>{if(disposed||shown>=rows.length)return;limit=shown+PAGE;appendPage()?.querySelector('button').focus();};
 function resetList(){limit=PAGE;render();}
 $('#ownership').onchange=e=>{ownership=e.target.value;resetList();};$('#stage').onchange=e=>{stage=e.target.value;resetList();};$('#archived').onclick=()=>{archived=!archived;$('#archived').textContent=archived?'Show active':'Show archived';resetList();};
 $('#export').onclick=()=>{if(!data||disposed)return;const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));urls.add(url);const a=el('a');a.href=url;a.download='athena-projects.json';a.click();};
 function clearReview(){review=null;$('#backup-review').hidden=true;$('#backup-projects').replaceChildren();}
 $('#backup-cancel').onclick=()=>{generation++;clearReview();notice.textContent='Backup import canceled. Nothing was saved.';$('#import').focus();};
 $('#backup-confirm').onclick=()=>{
  if(disposed||!review)return;
  const {before,merged}=review;
  clearReview();
  try{
   if(data!==before)throw Error('Projects changed after review. Choose the backup again.');
   if(setState?.(merged.data,{reviewedProjectBackup:JSON.stringify(before)})!==true)throw Error('The browser could not confirm the save. Reopen Projects to check saved data.');
   prepareData(merged.data);committed=JSON.stringify(data);
   notice.textContent=`Imported ${merged.added} new project${merged.added===1?'':'s'}; retained ${merged.unchanged} identical projects. Saved in this browser.`;
   render();
  }catch(e){notice.textContent='Backup not confirmed. '+e.message;}
  $('#import').focus();
 };
 $('#import').onchange=async e=>{
  if(disposed||!data)return;
  const file=e.target.files?.[0],token=++generation;e.target.value='';clearReview();
  if(!file)return;
  const before=data;
  try{
   if(file.size>MAX_IMPORT_BYTES)throw Error('Backup exceeds 16 MiB');
   const incoming=parseBackup(new Uint8Array(await file.arrayBuffer()));
   if(disposed||token!==generation)return;
   if(data!==before)throw Error('Projects changed while reading the backup. Choose it again.');
   const merged=mergeBackup(before,incoming);
   if(JSON.stringify(merged.data)===JSON.stringify(before)){notice.textContent='This backup adds nothing. Nothing was saved.';return;}
   const ids=new Set(before.entries.map(project=>project.id));
   const metadata=Object.keys(merged.data).filter(key=>!Object.hasOwn(before,key));
   $('#backup-summary').textContent=`${merged.added} new projects · ${merged.unchanged} identical · ${metadata.length} new backup metadata fields. Existing projects will not be replaced.`;
   for(const project of merged.data.entries)if(!ids.has(project.id)){
    const title=project.revisions.at(-1).name;
    $('#backup-projects').append(el('li',project.archived?title+' (archived)':title));
   }
   review={before,merged};$('#backup-review').hidden=false;notice.textContent='Backup ready for review. Nothing has been saved.';
   $('#backup-confirm').focus();
  }catch(e){if(!disposed&&token===generation)notice.textContent='Import refused; existing projects unchanged. '+e.message;}
 };
 if(!data){notice.textContent=failure;for(const n of root.querySelectorAll('input,select,button,textarea'))n.disabled=true;}else{notice.textContent='Ready. Nothing is sent to a provider.';render();}
 function unmount(){if(disposed)return;disposed=true;generation++;review=null;for(const url of urls)URL.revokeObjectURL(url);root.replaceChildren();signal?.removeEventListener('abort',unmount);}
 function setTheme(t){container.dataset.theme=t==='light'?'light':'dark';}setTheme(theme);signal?.addEventListener('abort',unmount,{once:true});if(signal?.aborted)unmount();return {ready:!!data,unmount,setTheme,setSearch(q){const next=String(q);if(next!==search){search=next;resetList();}}};
}
