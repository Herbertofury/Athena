// Local opaque artifact revision journal. No network, previews or execution.
import {LIMITS,idPattern,hashPattern,hashBytes,validMetadata,validateJournal,sameRevision,bytesEqual,encodeBundle,decodeBundle} from './artifact-bundle.mjs';
export {LIMITS,hashBytes,MAX_BUNDLE} from './artifact-bundle.mjs';
const request = value => new Promise((resolve,reject)=>{value.onsuccess=()=>resolve(value.result);value.onerror=()=>reject(Error('Local artifact storage request failed'));});
const done = tx => new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(Error('Local artifact transaction failed; no revision committed'));});
export async function openArtifactStore({indexedDB=globalThis.indexedDB,name='athena-private-artifacts-v1'}={}){
 if(!indexedDB)throw Error('Local artifact storage unavailable');
 const opening=indexedDB.open(name,1);
 opening.onupgradeneeded=()=>{const db=opening.result;db.createObjectStore('artifacts',{keyPath:'id'});db.createObjectStore('revisions',{keyPath:['artifactId','sequence']});db.createObjectStore('blobs',{keyPath:'hash'});};
 const db=await request(opening);let closed=false;db.onversionchange=()=>{closed=true;db.close();};
 function transaction(mode){if(closed)throw Error('Artifact store closed; reopen it');const tx=db.transaction(['artifacts','revisions','blobs'],mode);const completion=done(tx);completion.catch(()=>{});return {tx,completion};}
 async function list(){const {tx,completion}=transaction('readonly');const artifacts=await request(tx.objectStore('artifacts').getAll()),revisions=await request(tx.objectStore('revisions').getAll());await completion;return {artifacts,revisions};}
 async function append({artifactId=null,filename,mime='',bytes,at=Date.now()}){
  if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>LIMITS.fileBytes)throw Error('Choose a nonempty file up to 8 MiB');
  if(!validMetadata(filename,mime,at))throw Error('Invalid artifact metadata');
  if(artifactId!==null&&(typeof artifactId!=='string'||!idPattern.test(artifactId)))throw Error('Invalid artifact identity');
  const copy=bytes.slice(),hash=await hashBytes(copy),id=artifactId||crypto.randomUUID();
  const {tx,completion}=transaction('readwrite');
  try{
   const artifacts=tx.objectStore('artifacts'),revisions=tx.objectStore('revisions'),blobs=tx.objectStore('blobs');
   const previous=await request(artifacts.get(id));
   if(artifactId&&!previous)throw Error('Select an existing artifact; nothing created');
   const history=await request(revisions.getAll());
   const last=previous?await request(revisions.get([id,previous.latest])):null;
   if(previous&&(!last||last.artifactId!==id||last.sequence!==previous.latest||!hashPattern.test(last.hash)))throw Error('Stored artifact history invalid');
   const existing=await request(blobs.get(hash));
   if(existing&&(existing.size!==copy.length||!(existing.bytes instanceof Uint8Array)||existing.bytes.length!==copy.length||!existing.bytes.every((value,index)=>value===copy[index])))throw Error('Stored artifact integrity mismatch; last revision retained');
   if(last&&last.hash===hash&&last.filename===filename&&last.mime===mime){if(!existing)throw Error('Stored artifact missing; no revision changed');await completion;return {status:'unchanged',revision:last};}
   if(history.length>=LIMITS.revisions)throw Error('Local artifact journal reached its 100 revision admission limit');
   let size=0;
   // Cursor reads one bounded blob (including bytes) at a time; do not retain all buffers.
   await new Promise((resolve,reject)=>{const cursor=blobs.openCursor();cursor.onerror=()=>reject(Error('Artifact inventory unavailable'));cursor.onsuccess=()=>{const c=cursor.result;if(!c)return resolve();const value=c.value;if(!Number.isSafeInteger(value.size)||value.size<1||value.size>LIMITS.fileBytes||!(value.bytes instanceof Uint8Array)||value.bytes.length!==value.size){reject(Error('Artifact inventory invalid'));return;}size+=value.size;c.continue();};});
   if(size+(existing?0:copy.length)>LIMITS.totalBytes)throw Error('Local artifact journal reached its 64 MiB admission limit');
   if(existing&&(existing.size!==copy.length||!(existing.bytes instanceof Uint8Array)))throw Error('Stored blob metadata invalid');
   const sequence=previous?previous.latest+1:1;
   if(!Number.isSafeInteger(sequence)||sequence<1)throw Error('Stored artifact sequence invalid');
   const revision={artifactId:id,sequence,filename,mime,size:copy.length,hash,at};
   if(!existing)blobs.add({hash,size:copy.length,bytes:copy});
   revisions.add(revision);artifacts.put({id,latest:sequence});
   await completion;return {status:'committed',revision};
  }catch(error){try{tx.abort();}catch{}await completion.catch(()=>{});throw error;}
 }
 async function read(artifactId,sequence){
  if(!idPattern.test(artifactId)||!Number.isSafeInteger(sequence)||sequence<1)throw Error('Invalid revision identity');
  const {tx,completion}=transaction('readonly');const revision=await request(tx.objectStore('revisions').get([artifactId,sequence]));
  if(!revision||!hashPattern.test(revision.hash))throw Error('Revision unavailable');
  const blob=await request(tx.objectStore('blobs').get(revision.hash));await completion;
  if(!blob||!(blob.bytes instanceof Uint8Array)||blob.bytes.length!==revision.size||await hashBytes(blob.bytes)!==revision.hash)throw Error('Stored artifact failed integrity verification; no download produced');
  return {revision,bytes:blob.bytes};
 }
 async function backup(signal){
  signal?.throwIfAborted();
  const {tx,completion}=transaction('readonly');
  const artifacts=await request(tx.objectStore('artifacts').getAll(null,LIMITS.revisions+1));
  const revisions=await request(tx.objectStore('revisions').getAll(null,LIMITS.revisions+1));
  const {hashSizes}=validateJournal(artifacts,revisions),blobs=new Map(),store=tx.objectStore('blobs');
  if(await request(store.count())!==hashSizes.size)throw Error('Stored journal blob inventory is inconsistent');
  for(const [hash,size] of hashSizes){
   signal?.throwIfAborted();
   const blob=await request(store.get(hash));
   if(!blob||blob.size!==size||!(blob.bytes instanceof Uint8Array)||blob.bytes.length!==size)throw Error('Stored journal blob invalid');
   blobs.set(hash,blob.bytes);
  }
  await completion;return encodeBundle({artifacts,revisions,blobs},signal);
 }
 async function restore(bundle,signal){
  const incoming=await decodeBundle(bundle,signal);
  signal?.throwIfAborted();
  const {tx,completion}=transaction('readwrite');
  const abort=()=>{try{tx.abort();}catch{}};
  signal?.addEventListener('abort',abort,{once:true});
  try{
   const artifacts=tx.objectStore('artifacts'),revisions=tx.objectStore('revisions'),blobs=tx.objectStore('blobs');
   const oldArtifacts=await request(artifacts.getAll(null,LIMITS.revisions+1)),oldRevisions=await request(revisions.getAll(null,LIMITS.revisions+1));
   const old=validateJournal(oldArtifacts,oldRevisions);
   if(await request(blobs.count())!==old.hashSizes.size)throw Error('Stored journal blob inventory is inconsistent');
   const combined=new Map(oldArtifacts.map(row=>[row.id,row])),newRows=[],added=[];
   for(const row of incoming.revisions){
    const existing=old.groups.get(row.artifactId)?.rows.get(row.sequence);
    if(existing){if(!sameRevision(existing,row))throw Error('Backup conflicts with a retained revision');}
    else newRows.push(row);
   }
   for(const row of incoming.artifacts){
    if((combined.get(row.id)?.latest??0)<row.latest){combined.set(row.id,row);added.push(row);}
   }
   const all=validateJournal([...combined.values()],[...oldRevisions,...newRows]);
   const newBlobs=[];
   for(const [hash,size] of all.hashSizes){
    const imported=incoming.blobs.get(hash);
    if(!old.hashSizes.has(hash)){newBlobs.push({hash,size,bytes:imported});continue;}
    const existing=await request(blobs.get(hash));
    if(!existing||existing.size!==size||!(existing.bytes instanceof Uint8Array)||existing.bytes.length!==size
     ||(imported&&!bytesEqual(existing.bytes,imported)))throw Error('Backup conflicts with stored journal bytes');
   }
   signal?.throwIfAborted();
   for(const row of newBlobs)blobs.add(row);
   for(const row of newRows)revisions.add(row);
   for(const row of added)artifacts.put(row);
   await completion;return {added:newRows.length,identical:incoming.revisions.length-newRows.length};
  }catch(error){abort();await completion.catch(()=>{});throw error;}
  finally{signal?.removeEventListener('abort',abort);}
 }
 return {list,append,read,backup,restore,close(){closed=true;db.close();}};
}
