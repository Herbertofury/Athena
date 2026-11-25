import {openArtifactStore,LIMITS,MAX_BUNDLE} from '../../shared/artifact-store.mjs';
export function attachArtifacts({host,signal,openStore=openArtifactStore}){
 const doc=host.ownerDocument;let disposed=false,store=null,pending=false,generation=0,reservedDownloads=0,downloadGeneration=0;const urls=new Set(),lifetime=new AbortController();
 host.innerHTML='<h3>Private local artifact revisions</h3><p>Explicitly selected files remain in this browser\'s separate local artifact journal, not the note JSON backup or a remote backup. Origin-scoped browser storage, not an encrypted vault or protection from same-origin scripts/profile access. Hashes check byte consistency, not ownership or authenticity. No preview, execution, upload or autoplay. Export an artifact journal backup before clearing browser storage. Keep a separate note JSON export if you need notes too. Up to 8 MiB per file, 64 MiB total, 100 revisions; browser quota may be smaller.</p><button data-artifacts-open>Open local artifact journal</button><div data-artifacts-controls hidden><label>Artifact target<select data-artifact-target><option value="">New artifact</option></select></label><label>Choose artifact file<input data-artifact-file type="file"></label><button data-artifact-save disabled>Retain selected file as a revision</button><button type="button" data-artifact-refresh>Refresh revision list</button><fieldset><legend>Portable artifact journal backup</legend><button type="button" data-artifact-backup>Export complete artifact journal</button><label>Choose artifact journal backup<input data-artifact-restore-file type="file" accept=".athart,application/octet-stream"></label><button type="button" data-artifact-restore disabled>Restore missing revisions</button><p>Backups contain private file bytes and names, without encryption. Restore is additive: conflicts refuse the entire restore; existing revisions are not overwritten.</p></fieldset></div><button data-artifact-release>Release finished download links</button><p>Finish downloads before releasing their links. At most four prepared download links are retained per open journal.</p><p role="status" data-artifact-status>Journal not opened.</p><div data-artifact-history></div>';
 const q=s=>host.querySelector(s),open=q('[data-artifacts-open]'),controls=q('[data-artifacts-controls]'),target=q('[data-artifact-target]'),input=q('[data-artifact-file]'),save=q('[data-artifact-save]'),refresh=q('[data-artifact-refresh]'),status=q('[data-artifact-status]'),history=q('[data-artifact-history]'),backup=q('[data-artifact-backup]'),restoreFile=q('[data-artifact-restore-file]'),restore=q('[data-artifact-restore]');
 function busy(active){pending=active;save.disabled=active||!input.files?.[0];refresh.disabled=active;target.disabled=active;input.disabled=active;backup.disabled=active;restoreFile.disabled=active;restore.disabled=active||!restoreFile.files?.[0];}
 function offerDownload(blob,name){
  const url=URL.createObjectURL(blob);urls.add(url);
  const a=element('a');a.href=url;a.download=name;a.click();
 }
 function element(tag,text){const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
 async function render(){const snapshot=await store.list();if(disposed)return;const selected=target.value,choices=doc.createDocumentFragment(),sections=doc.createDocumentFragment();const option=element('option','New artifact');option.value='';choices.append(option);for(const artifact of snapshot.artifacts){const rows=snapshot.revisions.filter(r=>r.artifactId===artifact.id).sort((a,b)=>a.sequence-b.sequence);const choice=element('option',rows.at(-1)?.filename||artifact.id);choice.value=artifact.id;choices.append(choice);const section=element('section');section.append(element('h4',rows.at(-1)?.filename||artifact.id));for(const revision of rows){const row=element('p',`Revision ${revision.sequence}: ${revision.filename} · ${revision.size} bytes · SHA-256 ${revision.hash} `),download=element('button','Download exact revision');download.type='button';download.onclick=async()=>{if(disposed||pending)return;download.disabled=true;const downloadToken=downloadGeneration;let reserved=false;try{if(urls.size+reservedDownloads>=4)throw Error('Release finished download links first');reservedDownloads++;reserved=true;const result=await store.read(artifact.id,revision.sequence);if(disposed||downloadToken!==downloadGeneration)return;offerDownload(new Blob([result.bytes],{type:'application/octet-stream'}),result.revision.filename.split(/[\\/]/).at(-1)||'artifact.bin');status.textContent='Download prepared after exact-byte integrity verification. No file was opened or executed.';}catch{if(!disposed&&downloadToken===downloadGeneration)status.textContent=urls.size+reservedDownloads>=4?'Finish existing downloads, then release their links before preparing more.':'Revision unavailable or integrity verification failed. No download produced.';}finally{if(reserved)reservedDownloads--;if(!disposed)download.disabled=false;}};row.append(download);section.append(row);}sections.append(section);}target.replaceChildren(choices);target.value=selected;history.replaceChildren(sections);}
 q('[data-artifact-release]').onclick=()=>{downloadGeneration++;for(const url of urls)URL.revokeObjectURL(url);urls.clear();status.textContent='Prepared download links released. Stored revisions are unchanged.';};
 open.onclick=async()=>{if(disposed||pending)return;pending=true;open.disabled=true;try{const opened=await openStore();if(disposed){opened.close();return;}store=opened;await render();if(disposed)return;controls.hidden=false;open.hidden=true;status.textContent='Local journal opened. Select a file and explicitly retain it.';}catch{if(!disposed){store?.close();store=null;status.textContent='Local journal unavailable; no file retained.';open.disabled=false;}}finally{pending=false;}};
 refresh.onclick=async()=>{
  if(disposed||pending||!store)return;
  busy(true);
  try{await render();if(!disposed)status.textContent='Revision list refreshed. No file or revision was changed.';}
  catch{if(!disposed)status.textContent='Could not refresh. Previous revision list kept; try again.';}
  finally{if(!disposed)busy(false);}
 };
 input.onchange=()=>{generation++;save.disabled=!input.files?.[0]||pending;};target.onchange=()=>{generation++;};
 save.onclick=async()=>{const file=input.files?.[0];if(!store||disposed||pending||!file)return;const token=++generation,artifactId=target.value||null;busy(true);
  try{if(!Number.isSafeInteger(file.size)||file.size<1||file.size>LIMITS.fileBytes)throw Error('Invalid file size');const bytes=new Uint8Array(await file.arrayBuffer());if(disposed||token!==generation)return;if(bytes.length!==file.size)throw Error('File byte length changed');const result=await store.append({artifactId,filename:file.name,mime:file.type,bytes});if(disposed)return;input.value='';try{await render();if(disposed)return;status.textContent=result.status==='unchanged'?'Identical latest revision already retained; no duplicate created.':'Revision committed locally. Earlier revisions retained. Download a separate backup.';}catch{if(!disposed)status.textContent='Revision committed locally, but display failed. Refresh the revision list before trying to retain it again.';}}
  catch{if(!disposed)status.textContent='File was not retained: storage, integrity, identity or admission check failed. Existing committed revisions remain unchanged.';}
  finally{if(!disposed)busy(false);}
 };
 backup.onclick=async()=>{
  if(!store||disposed||pending)return;
  if(urls.size+reservedDownloads>=4){status.textContent='Finish existing downloads, then release their links before preparing more.';return;}
  const token=downloadGeneration;
  reservedDownloads++;
  busy(true);status.textContent='Checking all revisions and preparing the private backup…';
  try{
   const blob=await store.backup(lifetime.signal);
   if(disposed||token!==downloadGeneration)return;
   offerDownload(blob,'athena-artifact-journal.athart');
   status.textContent='Complete journal backup prepared. It includes all file revisions, not notes.';
  }catch{if(!disposed&&token===downloadGeneration)status.textContent='Backup unavailable: storage read or integrity check failed. Journal unchanged.';}
  finally{reservedDownloads--;if(!disposed)busy(false);}
 };
 restoreFile.onchange=()=>{restore.disabled=pending||!restoreFile.files?.[0];};
 restore.onclick=async()=>{
  const file=restoreFile.files?.[0];
  if(!store||disposed||pending||!file)return;
  if(!Number.isSafeInteger(file.size)||file.size>MAX_BUNDLE){status.textContent='Backup exceeds the artifact journal admission limit. Journal unchanged.';return;}
  busy(true);status.textContent='Checking the backup before adding missing revisions…';
  try{
   const result=await store.restore(file,lifetime.signal);
   if(disposed)return;
   restoreFile.value='';
   try{await render();if(!disposed)status.textContent=`Restored ${result.added} missing revisions; ${result.identical} identical revisions already present.`;}
   catch{if(!disposed)status.textContent='Restore committed locally, but display failed. Refresh the revision list before trying again.';}
  }catch(error){if(!disposed)status.textContent=error?.message?.startsWith('Backup conflicts')?'Backup conflicts with retained history. No revision changed.':'Restore refused: backup integrity, storage or admission check failed. No revision changed.';}
  finally{if(!disposed)busy(false);}
 };
 function dispose(){if(disposed)return;disposed=true;generation++;lifetime.abort();store?.close();for(const url of urls)URL.revokeObjectURL(url);urls.clear();signal?.removeEventListener('abort',dispose);host.replaceChildren();}
 signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();return{dispose};
}
