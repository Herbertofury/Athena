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
