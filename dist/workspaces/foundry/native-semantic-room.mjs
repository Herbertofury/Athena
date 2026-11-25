// Local metadata adaptation of Feature Foundry prototype-v24.ts roomStateSnapshot.
// Saved descriptions are claims from the file, not verified meshes, physics or actions.
const MAX_BYTES=1024*1024,MAX_CAPSULE_BYTES=2*MAX_BYTES,MAX_OBJECTS=500;
const capsuleKeys=new Set(['ff-floating-vault','ff-living-ui-prefs','ff-mascot-prefs','ff-room-semantic-state','ff-scrapbook-layout','ff-visual-quality','ff-world-layout','ff-world-mascots','ff.browser-snapshot.v1','ff.premium-theme.v1','ff.music-hub.v2']);
const capsuleFormat='athena-foundry-original-values',roomKey='ff-room-semantic-state';
const rootKeys=['sourceName','imported','importMode','keepUnified','detachInteractables','autoPhysics','mascotAffordances','selectedId','stage','tableAssetId','objects'];
const rowKeys=['id','name','icon','role','physics','interactive','detachable','visible','locked','state','actions','mascot','atlasId'];
function fields(v,keys,label){if(!v||typeof v!=='object'||Array.isArray(v))throw Error(`${label} must be an object.`);for(const k of Object.keys(v))if(!keys.includes(k))throw Error(`${label} contains an unsupported field; original file retained outside this app.`);}
function string(v,label,max=1024){if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))throw Error(`${label} must be bounded text.`);}
// JSON.parse alone silently accepts duplicate keys; scan bounded structure first.
function unambiguous(text){
 const tokens=text.match(/"(?:[^"\\]|\\.)*"|[{}\[\]:,]|[^\s{}\[\]:,]+/g)||[];let i=0;
 function visit(depth=0){if(depth>24)throw Error('Snapshot nesting exceeds 24 levels.');const t=tokens[i++];if(t==='{'){const keys=new Set();if(tokens[i]==='}'){i++;return;}while(i<tokens.length){const key=JSON.parse(tokens[i++]);if(keys.has(key))throw Error('Duplicate JSON keys are ambiguous and unsupported.');keys.add(key);if(tokens[i++]!==':')throw Error('Invalid JSON object.');visit(depth+1);if(tokens[i++]==='}')return;}}else if(t==='['){if(tokens[i]===']'){i++;return;}while(i<tokens.length){visit(depth+1);if(tokens[i++]===']')return;}}}
 visit();
}
function parseJSON(bytes){
 try{const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes),value=JSON.parse(text);unambiguous(text);return value;}
 catch{throw Error('Snapshot must contain valid unambiguous UTF-8 JSON.');}
}
export function parseSemanticRoom(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.byteLength===0||bytes.byteLength>MAX_BYTES)throw Error('Choose a nonempty UTF-8 JSON snapshot up to 1 MiB.');
 return validateRoom(parseJSON(bytes));
}
function validateRoom(value){
 fields(value,rootKeys,'Room');for(const k of rootKeys)if(!Object.hasOwn(value,k))throw Error(`Missing room field: ${k}.`);
 for(const k of ['sourceName','importMode','stage'])string(value[k],k);
 for(const k of ['imported','keepUnified','detachInteractables','autoPhysics','mascotAffordances'])if(typeof value[k]!=='boolean')throw Error(`${k} must be boolean.`);
 for(const k of ['selectedId','tableAssetId'])if(value[k]!==null)string(value[k],k,256);
 if(!Array.isArray(value.objects)||value.objects.length>MAX_OBJECTS)throw Error('Room objects must be an array of at most 500 records.');
 const ids=new Set();for(const row of value.objects){fields(row,rowKeys,'Object');for(const k of rowKeys.filter(k=>k!=='atlasId'))if(!Object.hasOwn(row,k))throw Error(`Missing object field: ${k}.`);for(const k of ['id','name','icon','role','physics','state','mascot'])string(row[k],k,k==='id'?256:1024);if(!row.id||ids.has(row.id))throw Error('Object IDs must be nonempty and unique.');ids.add(row.id);if(Object.hasOwn(row,'atlasId'))string(row.atlasId,'atlasId',256);for(const k of ['interactive','detachable','visible','locked'])if(typeof row[k]!=='boolean')throw Error(`${k} must be boolean.`);if(!Array.isArray(row.actions)||row.actions.length>64)throw Error('Object actions must contain at most 64 text labels.');row.actions.forEach(x=>string(x,'Action',256));}
 if(value.selectedId!==null&&!ids.has(value.selectedId))throw Error('Selected object does not exist in this snapshot.');return value;
}
// Verify Python capsule.py's exact UTF-16-LE hash, including lone code units
// in unrelated entries. They are never surfaced or included in exports.
function units(value){
 const raw=new Uint8Array(value.length*2);
 for(let i=0;i<value.length;i++){const n=value.charCodeAt(i);raw[i*2]=n&255;raw[i*2+1]=n>>>8;}
 return raw;
}
export async function inspectSemanticSelection(bytes,subtle=globalThis.crypto?.subtle){
 if(!(bytes instanceof Uint8Array)||!bytes.byteLength||bytes.byteLength>MAX_CAPSULE_BYTES)
  throw Error('Choose a room snapshot up to 1 MiB or a recovery capsule up to 2 MiB.');
 const value=parseJSON(bytes);
 if(value?.format!==capsuleFormat){
  if(bytes.byteLength>MAX_BYTES)throw Error('Room snapshots are limited to 1 MiB.');
  return {value:validateRoom(value),bytes,fromCapsule:false};
 }
 fields(value,['format','version','native_import','entries'],'Recovery capsule');
 if(value.version!==1||value.native_import!==false||!Array.isArray(value.entries)||value.entries.length>capsuleKeys.size)
  throw Error('Unsupported recovery capsule.');
 if(!subtle)throw Error('Recovery capsule integrity checks need a secure local or HTTPS session.');
 let room=null;const seen=new Set();
 for(const entry of value.entries){
  fields(entry,['key','value','utf16_sha256'],'Recovery entry');
  if(!capsuleKeys.has(entry.key)||seen.has(entry.key)||typeof entry.value!=='string'||
     typeof entry.utf16_sha256!=='string'||!/^[a-f0-9]{64}$/.test(entry.utf16_sha256))
   throw Error('Invalid or duplicated recovery entry.');
  seen.add(entry.key);
  const hash=Array.from(new Uint8Array(await subtle.digest('SHA-256',units(entry.value))),n=>n.toString(16).padStart(2,'0')).join('');
  if(hash!==entry.utf16_sha256)throw Error('Recovery entry checksum mismatch.');
  if(entry.key===roomKey)room=entry.value;
 }
 if(room===null)throw Error('Recovery capsule has no recorded room snapshot.');
 // Encoding lone surrogates would silently substitute U+FFFD. The original
 // capsule remains intact, but an exact UTF-8 room export is not possible.
 if(/(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/.test(room))
  throw Error('The recorded room is not losslessly representable as UTF-8.');
 const selected=new TextEncoder().encode(room);
 return {value:parseSemanticRoom(selected),bytes:selected,fromCapsule:true};
}
const WORKER_THRESHOLD=128*1024;
function newSelectionWorker(){
 return new Worker(new URL(import.meta.url),{type:'module',name:'athena-private-room-check'});
}
// One worker per explicit large selection, never a resident service. Use
// the same parser in both paths and transfer only selected file bytes.
export function inspectSelectedRoom(bytes,{signal,makeWorker,timeoutMs=15000}={}){
 if(signal?.aborted)return Promise.reject(new DOMException('Selection canceled.','AbortError'));
 if(bytes.byteLength<=WORKER_THRESHOLD||!makeWorker)return inspectSemanticSelection(bytes);
 return new Promise((resolve,reject)=>{
  let worker,timer,settled=false;
  const cleanup=()=>{
   clearTimeout(timer);signal?.removeEventListener('abort',cancel);
   if(worker){worker.onmessage=worker.onerror=worker.onmessageerror=null;worker.terminate();}
  };
  const finish=(error,selected)=>{if(settled)return;settled=true;cleanup();if(error)reject(error);else resolve(selected);};
  const cancel=()=>finish(new DOMException('Selection canceled.','AbortError'));
  try{
   worker=makeWorker();
   worker.onmessage=({data})=>data?.selected?finish(null,data.selected):finish(Error(data?.error||'Local verification failed.'));
   worker.onerror=worker.onmessageerror=()=>finish(Error('Local verification could not run. Try a smaller room snapshot or use the recovery tool.'));
   signal?.addEventListener('abort',cancel,{once:true});
   timer=setTimeout(()=>finish(Error('Local verification timed out. No snapshot was replaced.')),timeoutMs);
   const owned=(bytes.byteOffset===0&&bytes.byteLength===bytes.buffer.byteLength)?bytes:bytes.slice();
   worker.postMessage(owned,[owned.buffer]);
  }catch{finish(Error('Local verification could not start. Try a smaller room snapshot or use the recovery tool.'));}
 });
}
if(typeof DedicatedWorkerGlobalScope!=='undefined'&&globalThis instanceof DedicatedWorkerGlobalScope){
 globalThis.addEventListener('message',async ({data})=>{
  try{const selected=await inspectSemanticSelection(data);globalThis.postMessage({selected},[selected.bytes.buffer]);}
  catch(error){globalThis.postMessage({error:error.message});}
 },{once:true});
}
// Source index.html410 and bindRoomIntelligence684–685. These are declarations,
// never an instruction to run physics, reveal a mesh, or execute an action.
export const SEMANTIC_ROLES=Object.freeze(['Couch / Seat','Table / Surface','TV / Screen','Lamp / Light','Window / Portal','Door','Floor / Navmesh','Wall / Collision','Decoration','Ignore']);
export const SEMANTIC_PHYSICS=Object.freeze(['Static collision','Dynamic rigid body','Kinematic articulated','Soft body','No collision']);
export function createSemanticEdits(value){
 return editValidatedRoom(parseSemanticRoom(new TextEncoder().encode(JSON.stringify(value))));
}
function editValidatedRoom(current){
 let past=[],future=[];
 const keys=['role','physics','visible','locked'],MAX_HISTORY=50,MAX_HISTORY_BYTES=256*1024;
 const pick=row=>Object.fromEntries(keys.map(k=>[k,row[k]]));
 const trim=()=>{while(past.length+future.length>MAX_HISTORY||JSON.stringify([...past,...future]).length*2>MAX_HISTORY_BYTES){if(past.length)past.shift();else future.shift();}};
 function plan(id,fields){const row=current.objects.find(x=>x.id===id);if(!row)throw Error('Select an existing record.');if(Object.keys(fields).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(fields,k)))throw Error('Unsupported metadata edit.');for(const [k,choices] of [['role',SEMANTIC_ROLES],['physics',SEMANTIC_PHYSICS]])if(fields[k]!==row[k]&&!choices.includes(fields[k]))throw Error('Choose a supported classification or retain the recorded value.');for(const k of ['visible','locked'])if(typeof fields[k]!=='boolean')throw Error('Recorded flags must be boolean.');const before=pick(row),after={...fields};const candidate={...current,objects:current.objects.map(x=>x===row?{...x,...after}:x)};parseSemanticRoom(new TextEncoder().encode(JSON.stringify(candidate)));return keys.every(k=>before[k]===after[k])?null:{id,before,after};}
 function applyPatch(patch,side){const row=current.objects.find(x=>x.id===patch.id);if(!row)throw Error('Record identity changed.');Object.assign(row,patch[side]);}
 return {get value(){return current;},plan,apply(patch){if(!patch)return false;const checked=plan(patch.id,patch.after);if(!checked||!keys.every(k=>checked.before[k]===patch.before[k]))throw Error('Metadata changed; review again.');applyPatch(checked,'after');past.push(checked);future=[];trim();return true;},undo(){if(!past.length)return false;const p=past.pop();applyPatch(p,'before');future.push(p);trim();return true;},redo(){if(!future.length)return false;const p=future.pop();applyPatch(p,'after');past.push(p);trim();return true;},get canUndo(){return !!past.length;},get canRedo(){return !!future.length;},get retainedEdits(){return past.length+future.length;},get retainedBytes(){return JSON.stringify([...past,...future]).length*2;}};
}
export function attachSemanticRoom({host,signal,createURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),makeWorker=typeof Worker==='function'&&globalThis.location?.protocol!=='file:'?newSelectionWorker:null}){
 const doc=host.ownerDocument;let generation=0,disposed=false,active=null,url=null,editedURL=null,editor=null,pending=null,readController=null;
 host.innerHTML='<h2>Original room metadata explorer</h2><p>Open a local room snapshot or a verified Foundry recovery capsule. Only its room metadata is shown or exported. Session-only metadata authoring: no upload, persistent storage, mesh import, physics generation or action execution. Original bytes remain unchanged; edited exports are separate derivatives. Descriptions below are unverified source metadata, not working capabilities.</p><label>Choose room snapshot (1 MiB) or recovery capsule (2 MiB) <input type="file" accept=".json,application/json" data-semantic-file></label><button data-semantic-close disabled>Close and forget snapshot</button><a data-semantic-export hidden download="original-room-semantic-state.json">Export exact original room bytes</a><p role="status" data-semantic-status>No snapshot selected.</p><div role="group" aria-label="Review discarding room metadata" data-semantic-discard-panel hidden><p data-semantic-discard-message></p><button type="button" data-semantic-keep>Keep current snapshot</button><button type="button" data-semantic-discard>Discard edits</button></div><div data-semantic-summary></div><label>Inspect saved object <select data-semantic-select disabled></select></label><dl data-semantic-details></dl><fieldset data-semantic-editor disabled><legend>Edit recorded metadata only</legend><label>Recorded role <select data-semantic-role></select></label><label>Recorded physics classification <select data-semantic-physics></select></label><label><input type="checkbox" data-semantic-visible> Recorded visible flag</label><label><input type="checkbox" data-semantic-locked> Recorded mapping lock (not an access control)</label><button data-semantic-apply>Apply metadata</button></fieldset><button data-semantic-undo disabled>Undo metadata edit</button><button data-semantic-redo disabled>Redo metadata edit</button><button data-semantic-prepare disabled>Prepare edited JSON export</button><a data-semantic-edited hidden download="edited-room-semantic-state.json">Download edited metadata (not original bytes)</a>';
 const one=q=>host.querySelector(q),input=one('[data-semantic-file]'),close=one('[data-semantic-close]'),link=one('[data-semantic-export]'),status=one('[data-semantic-status]'),summary=one('[data-semantic-summary]'),select=one('[data-semantic-select]'),details=one('[data-semantic-details]');
 const panel=one('[data-semantic-discard-panel]'),message=one('[data-semantic-discard-message]'),keep=one('[data-semantic-keep]'),discard=one('[data-semantic-discard]');
 const controls=one('[data-semantic-editor]'),role=one('[data-semantic-role]'),physics=one('[data-semantic-physics]'),visible=one('[data-semantic-visible]'),locked=one('[data-semantic-locked]'),undo=one('[data-semantic-undo]'),redo=one('[data-semantic-redo]'),prepare=one('[data-semantic-prepare]'),edited=one('[data-semantic-edited]');
 controls.style.display='grid';controls.style.gap='.6rem';for(const label of controls.querySelectorAll('label')){label.style.display='flex';label.style.alignItems='center';label.style.flexWrap='wrap';label.style.gap='.4rem';}for(const control of [role,physics])control.style.maxWidth='100%';
 function retireEdited(){edited.removeAttribute('href');edited.hidden=true;if(editedURL){revokeURL(editedURL);editedURL=null;}}
 function choices(control,values,value){control.replaceChildren();for(const v of values.includes(value)?values:[value,...values]){const option=doc.createElement('option');option.value=v;option.textContent=values.includes(v)?v:`Recorded unsupported classification: ${v}`;control.append(option);}control.value=value;}
 function sync(){undo.disabled=!editor?.canUndo;redo.disabled=!editor?.canRedo;prepare.disabled=!editor;}
 function cancelSelection(){readController?.abort();readController=null;}
 function resetPending(){pending=null;panel.hidden=true;message.textContent='';}
 function formValues(){return {role:role.value,physics:physics.value,visible:visible.checked,locked:locked.checked};}
 function hasSessionWork(){
  if(!editor)return false;
  if(editor.canUndo||editor.canRedo)return true;
  const row=active.value.objects.find(r=>r.id===select.value);
  return !!row&&Object.entries(formValues()).some(([key,value])=>row[key]!==value);
 }
 function review(action){
  pending=action;panel.hidden=false;
  const replacing=action.kind==='replace';
  message.textContent=replacing?'Opening this snapshot will discard the current session edits.':'Closing this snapshot will discard the current session edits.';
  discard.textContent=replacing?'Discard edits and open snapshot':'Discard edits and close snapshot';
  status.textContent=message.textContent;
  keep.focus();
 }
 function keepCurrent(){
  if(!pending)return;
  const target=pending.kind==='replace'?input:close;
  resetPending();status.textContent='Current snapshot kept. Edits and exports were not changed.';target.focus();
 }
 function mutate(kind){if(disposed||signal?.aborted||!editor)return;try{const patch=kind==='apply'?editor.plan(select.value,formValues()):null;if(kind==='apply'&&!patch){status.textContent='No metadata changed. Drafts and Redo retained.';return;}if(kind==='undo'&&!editor.canUndo||kind==='redo'&&!editor.canRedo)return;retireEdited();cancelSelection();generation++;resetPending();if(kind==='apply')editor.apply(patch);else editor[kind]();active.value=editor.value;detail();sync();status.textContent='Recorded metadata changed in this session only. Original bytes unchanged; no physics, mesh or action executed.';}catch{status.textContent='Metadata edit could not complete. Review the current values; export availability may require cleanup.';}}
 function exportEdited(){if(disposed||signal?.aborted||!editor)return;try{const bytes=new TextEncoder().encode(JSON.stringify(editor.value));parseSemanticRoom(bytes);retireEdited();editedURL=createURL(new Blob([bytes],{type:'application/json'}));edited.href=editedURL;edited.hidden=false;status.textContent='Edited JSON prepared locally. This is a derivative, not the original bytes or a verified scene.';}catch{status.textContent='Edited export could not be prepared. Session values and original export remain separate.';}}
 const applyClick=()=>mutate('apply'),undoClick=()=>mutate('undo'),redoClick=()=>mutate('redo');
 one('[data-semantic-apply]').addEventListener('click',applyClick);undo.addEventListener('click',undoClick);redo.addEventListener('click',redoClick);prepare.addEventListener('click',exportEdited);
 function revoke(){if(url){revokeURL(url);url=null;}link.removeAttribute('href');link.hidden=true;}
 function detail(){details.replaceChildren();const row=active?.value.objects.find(r=>r.id===select.value);controls.disabled=!row;if(!row)return;choices(role,SEMANTIC_ROLES,row.role);choices(physics,SEMANTIC_PHYSICS,row.physics);visible.checked=row.visible;locked.checked=row.locked;for(const [key,value] of Object.entries(row)){const dt=doc.createElement('dt'),dd=doc.createElement('dd');dt.textContent=key;dd.textContent=Array.isArray(value)?value.join(', '):String(value);details.append(dt,dd);}}
 function render(){const v=active.value;summary.replaceChildren();const warning=doc.createElement('p');warning.textContent='Recorded root metadata. Saved flags and descriptions are not validation of an actual room.';summary.append(warning);const list=doc.createElement('dl');for(const key of rootKeys.filter(k=>k!=='objects')){const dt=doc.createElement('dt'),dd=doc.createElement('dd');dt.textContent=key;dd.textContent=String(v[key]);list.append(dt,dd);}summary.append(list);select.replaceChildren();for(const row of v.objects){const option=doc.createElement('option');option.value=row.id;option.textContent=`${row.name} [${row.id}]`;select.append(option);}select.value=v.selectedId||v.objects[0]?.id||'';select.disabled=!v.objects.length;close.disabled=false;detail();sync();}
 function replaceSnapshot(bytes,value,fromCapsule=false){
  const nextEditor=editValidatedRoom(value),nextURL=createURL(new Blob([bytes],{type:'application/json'}));
  try{retireEdited();revoke();}catch{try{revokeURL(nextURL);}catch{}throw Error('Export cleanup failed; export availability is unverified.');}
  editor=nextEditor;active={value:editor.value};url=nextURL;link.href=url;link.hidden=false;render();
  status.textContent=fromCapsule?'Recovery capsule verified locally. Only exact original room data are available to export. Other entries were not imported.':'Snapshot inspected locally. Exact original bytes available for export; no migration or scene modification performed.';
 }
 function reject(error){status.textContent=`Rejected: ${error.message} Previous snapshot metadata retained.`;}
 async function choose(){
  if(disposed||signal?.aborted)return;
  const file=input.files?.[0];input.value='';if(!file)return;
  cancelSelection();const token=++generation;resetPending();
  if(!Number.isFinite(file.size)||file.size<=0||file.size>MAX_CAPSULE_BYTES){reject(Error('Choose a nonempty snapshot up to 1 MiB or recovery capsule up to 2 MiB.'));return;}
  const controller=new AbortController();readController=controller;
  close.disabled=false;status.textContent='Reading selected local snapshot…';
  try{
   const bytes=new Uint8Array(await file.arrayBuffer());if(disposed||signal?.aborted||token!==generation)return;
   const selected=await inspectSelectedRoom(bytes,{signal:controller.signal,makeWorker});
   if(disposed||signal?.aborted||token!==generation)return;
   if(hasSessionWork())review({kind:'replace',...selected});else replaceSnapshot(selected.bytes,selected.value,selected.fromCapsule);
  }catch(error){if(!disposed&&token===generation){close.disabled=!active;reject(error);}}
  finally{if(readController===controller)readController=null;}
 }
 function requestClose(){
  cancelSelection();generation++;resetPending();
  if(hasSessionWork())review({kind:'close'});else clear();
 }
 function discardCurrent(){
  if(disposed||signal?.aborted||!pending)return;
  const action=pending;++generation;resetPending();
  if(action.kind==='close')clear();
  else try{replaceSnapshot(action.bytes,action.value,action.fromCapsule);}catch(error){reject(error);}
  input.focus();
 }
 function clear(){cancelSelection();generation++;resetPending();active=null;editor=null;controls.disabled=true;sync();let failed=false;for(const cleanup of [retireEdited,revoke])try{cleanup();}catch{failed=true;}link.removeAttribute('href');link.hidden=true;status.textContent=failed?'Snapshot closed; export cleanup failed.':'Snapshot closed; session exports released.';summary.replaceChildren();details.replaceChildren();select.replaceChildren();select.disabled=true;close.disabled=true;input.value='';}
 function dispose(){if(disposed)return;disposed=true;clear();one('[data-semantic-apply]').removeEventListener('click',applyClick);undo.removeEventListener('click',undoClick);redo.removeEventListener('click',redoClick);prepare.removeEventListener('click',exportEdited);input.removeEventListener('change',choose);select.removeEventListener('change',detail);close.removeEventListener('click',requestClose);keep.removeEventListener('click',keepCurrent);discard.removeEventListener('click',discardCurrent);signal?.removeEventListener('abort',dispose);host.replaceChildren();}
 input.addEventListener('change',choose);select.addEventListener('change',detail);close.addEventListener('click',requestClose);keep.addEventListener('click',keepCurrent);discard.addEventListener('click',discardCurrent);signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();return {dispose};
}
