export function validateCatalog(value){
 if(value?.schema!==1||typeof value.version!=='string'||!Array.isArray(value.documents)||!value.documents.length)throw Error('Unsupported or empty guidance catalog.');
 const seen=new Set();
 for(const item of value.documents){
  if(!item||typeof item.id!=='string'||seen.has(item.id)||typeof item.title!=='string'||typeof item.text!=='string'||!/^guidance\/[A-Za-z0-9_./-]+\.md$/.test(item.sourcePath)||item.sourcePath.split('/').includes('..')||!/^https:\/\/github\.com\/Herbertofury\/Athena\/blob\/main\/guidance\//.test(item.sourceUrl)||!/^[a-f0-9]{64}$/.test(item.sha256)||item.sourcePath!=='guidance/'+item.id||item.sourceUrl!=='https://github.com/Herbertofury/Athena/blob/main/'+item.sourcePath)throw Error('Malformed guidance entry.');
  seen.add(item.id);
 }
 return value;
}
export function findDocuments(catalog,query=''){
 const terms=String(query).toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 return catalog.documents.filter(d=>terms.every(t=>(d.title+' '+d.id+' '+d.text).toLocaleLowerCase().includes(t)));
}
export function selectedDocuments(catalog,ids=[]){const chosen=new Set(ids);return catalog.documents.filter(d=>chosen.has(d.id));}
export function exportPacket(catalog,ids){
 const documents=selectedDocuments(catalog,ids);
 if(!documents.length)throw Error('Choose at least one standard to export.');
 return {schema:1,kind:'athena-guidance-reference-pack',version:catalog.version,sourceRepository:catalog.sourceRepository,sourceRevision:catalog.sourceRevision,legacySourceCommit:catalog.legacySourceCommit,scope:'Reference only. Does not install instructions, execute tools, grant permissions or override project-owned guidance.',documents};
}
export function exportMarkdown(packet){return ['# Athena guidance reference pack',`Version: ${packet.version}`,`Source: ${packet.sourceRepository}`,`Revision identity: ${packet.sourceRevision}`,`Original source commit: ${packet.legacySourceCommit}`,packet.scope,...packet.documents.flatMap(d=>[`\n---\nSource: ${d.sourceUrl}`,`Path: ${d.sourcePath}`,`SHA-256: ${d.sha256}\n`,d.text])].join('\n\n');}

// Verify a detached snapshot before the native reader admits complete standards.
// A matching catalog hash proves consistency, not publisher authenticity.
export async function verifyCatalog(value, subtle = globalThis.crypto?.subtle){
 const checked = validateCatalog(value);
 const snapshot = {...checked, documents:checked.documents.map(item=>Object.freeze({...item}))};
 Object.freeze(snapshot.documents);Object.freeze(snapshot);
 if(!subtle || typeof subtle.digest !== 'function')throw Error('Guidance integrity verification is unavailable. No standards were opened.');
 const encoder = new TextEncoder();
 for(const item of snapshot.documents){
  const digest = await subtle.digest('SHA-256',encoder.encode(item.text));
  const hex = Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  if(hex !== item.sha256)throw Error('Guidance integrity mismatch. No standards were opened.');
 }
 return snapshot;
}
