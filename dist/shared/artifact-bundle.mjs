// Portable Continuity journal framing. No execution, network or compression.
export const LIMITS = Object.freeze({fileBytes:8*1024*1024,totalBytes:64*1024*1024,revisions:100});
const magic = new TextEncoder().encode('ATHART01');
const headerLimit = 256*1024,prefixBytes=44;
export const MAX_BUNDLE = prefixBytes+headerLimit+LIMITS.totalBytes;
export const idPattern = /^[a-f0-9-]{36}$/;
export const hashPattern = /^[a-f0-9]{64}$/;
const controls = /[\x00-\x1f\x7f]/;
const fail = () => { throw Error('Invalid artifact journal bundle or stored metadata'); };
const int = (value,min,max=Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value)&&value>=min&&value<=max;
export function validMetadata(filename,mime,at){
 return typeof filename==='string'&&!!filename.trim()&&filename.length<=255&&!controls.test(filename)
  &&typeof mime==='string'&&mime.length<=100&&!controls.test(mime)&&int(at,0);
}
export const bytesEqual = (a,b) => a.length===b.length&&a.every((byte,i)=>byte===b[i]);
export const sameRevision = (a,b) => a.artifactId===b.artifactId&&a.sequence===b.sequence
 &&a.filename===b.filename&&a.mime===b.mime&&a.at===b.at&&a.size===b.size&&a.hash===b.hash;
export async function hashBytes(bytes){
 if(!(bytes instanceof Uint8Array))throw Error('Artifact bytes required');
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
}
const exactKeys = (row,keys) => row&&typeof row==='object'&&!Array.isArray(row)
 &&Object.keys(row).length===keys.length&&keys.every(key=>Object.hasOwn(row,key));
export function validateJournal(artifacts,revisions){
 if(!Array.isArray(artifacts)||!Array.isArray(revisions)||artifacts.length>revisions.length||revisions.length>LIMITS.revisions)fail();
 const groups=new Map(),hashSizes=new Map();
 let size=0;
 for(const rec of artifacts){
  const {id,latest}=rec??{};
  if(!exactKeys(rec,['id','latest'])||typeof id!=='string'||!idPattern.test(id)||!int(latest,1,LIMITS.revisions)||groups.has(id))fail();
  groups.set(id,{latest,rows:new Map()});
 }
 for(const rec of revisions){
  const {artifactId,sequence,filename,mime,size:count,hash,at}=rec??{};
  const group=groups.get(artifactId);
  if(!exactKeys(rec,['artifactId','sequence','filename','mime','size','hash','at'])||!group||!int(sequence,1,group.latest)||group.rows.has(sequence)||!validMetadata(filename,mime,at)
   ||!int(count,1,LIMITS.fileBytes)||typeof hash!=='string'||!hashPattern.test(hash))fail();
  group.rows.set(sequence,rec);
  if(hashSizes.has(hash)){if(hashSizes.get(hash)!==count)fail();}
  else {hashSizes.set(hash,count);size+=count;if(size>LIMITS.totalBytes)fail();}
 }
 for(const group of groups.values())if(group.rows.size!==group.latest)fail();
 return {groups,hashSizes,size};
}
function canonical({artifacts,revisions}){
 const compare=(a,b)=>a<b?-1:a>b?1:0;
 return {artifacts:artifacts.map(({id,latest})=>({id,latest})).sort((a,b)=>compare(a.id,b.id)),
  revisions:revisions.map(({artifactId,sequence,filename,mime,size,hash,at})=>({artifactId,sequence,filename,mime,size,hash,at}))
   .sort((a,b)=>compare(a.artifactId,b.artifactId)||a.sequence-b.sequence)};
}
export async function encodeBundle({artifacts,revisions,blobs},signal){
 const {hashSizes}=validateJournal(artifacts,revisions);
 if(blobs.size!==hashSizes.size)fail();
 const header=new TextEncoder().encode(JSON.stringify(canonical({artifacts,revisions})));
 if(header.length>headerLimit)fail();
 const prefix=new Uint8Array(prefixBytes);prefix.set(magic);new DataView(prefix.buffer).setUint32(8,header.length);
 prefix.set(new Uint8Array(await crypto.subtle.digest('SHA-256',header)),12);
 const parts=[prefix,header];
 for(const hash of [...hashSizes.keys()].sort()){
  signal?.throwIfAborted();
  const bytes=blobs.get(hash);
  if(!(bytes instanceof Uint8Array)||bytes.length!==hashSizes.get(hash)||await hashBytes(bytes)!==hash)fail();
  parts.push(bytes);
 }
 signal?.throwIfAborted();
 return new Blob(parts,{type:'application/octet-stream'});
}
export async function decodeBundle(file,signal){
 if(!(file instanceof Blob)||!int(file.size,prefixBytes,MAX_BUNDLE))fail();
 signal?.throwIfAborted();
 const prefix=new Uint8Array(await file.slice(0,prefixBytes).arrayBuffer());
 if(!bytesEqual(prefix.subarray(0,8),magic))fail();
 const length=new DataView(prefix.buffer).getUint32(8),body=prefixBytes+length;
 if(!int(length,1,headerLimit)||body>file.size)fail();
 const header=await file.slice(prefixBytes,body).arrayBuffer();
 if(!bytesEqual(prefix.subarray(12),new Uint8Array(await crypto.subtle.digest('SHA-256',header))))fail();
 const raw=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(header);
 const {artifacts,revisions}=JSON.parse(raw)??{};
 const {hashSizes,size}=validateJournal(artifacts,revisions);
 // Require the writer's canonical representation: no duplicate/unknown keys or alternate numeric encodings.
 if(raw!==JSON.stringify(canonical({artifacts,revisions}))||body+size!==file.size)fail();
 let offset=body;const blobs=new Map();
 for(const hash of [...hashSizes.keys()].sort()){
  signal?.throwIfAborted();
  const end=offset+hashSizes.get(hash),bytes=new Uint8Array(await file.slice(offset,end).arrayBuffer());
  if(await hashBytes(bytes)!==hash)fail();
  blobs.set(hash,bytes);offset=end;
 }
 signal?.throwIfAborted();return {artifacts,revisions,blobs};
}
