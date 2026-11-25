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

export const MAX_REFERENCE_BYTES=512*1024;
const hashPattern=/^[a-f0-9]{64}$/;
const same=(left,right,fields)=>fields.every(field=>left[field]===right[field]);
const packetFields=['version','sourceRepository','sourceRevision','legacySourceCommit'];
const documentFields=['title','sourcePath','sourceUrl'];
const byId=(left,right)=>left.id.localeCompare(right.id,'en');
export async function reviewReference(catalog,bytes,digest=globalThis.crypto?.subtle){
 validateCatalog(catalog);
 if(!(bytes instanceof Uint8Array)||bytes.byteLength>MAX_REFERENCE_BYTES||!digest)
  throw Error('Choose a valid local JSON reference pack within 512 KiB with Web Crypto available.');
 let pack;
 try {pack=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 catch {throw Error('Invalid UTF-8 JSON reference pack.');}
 if(pack?.schema!==1||pack.kind!=='athena-guidance-reference-pack'||!Array.isArray(pack.documents)
    ||!pack.documents.length||pack.documents.length>64||!packetFields.every(field=>typeof pack[field]==='string'))
  throw Error('Unrecognized reference pack format.');
 const source=new Map(catalog.documents.map(d=>[d.id,d])),seen=new Set();
 for(const doc of pack.documents){
  if(!doc||typeof doc.id!=='string'||doc.id.length>160||seen.has(doc.id)||!hashPattern.test(doc.sha256)
     ||typeof doc.text!=='string'||!documentFields.every(field=>typeof doc[field]==='string'))
   throw Error('Reference pack contains a malformed or duplicate standard.');
  seen.add(doc.id);
 }
 const toSha=async text=>[...new Uint8Array(await digest.digest('SHA-256',new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('');
 let unknown=0,unknownBadDigest=0;
 const rows=[];
 for(const incoming of pack.documents){
  const actual=await toSha(incoming.text),trusted=source.get(incoming.id);
  if(!trusted){unknown++;if(actual!==incoming.sha256)unknownBadDigest++;continue;}
  // Use fixed locally embedded names and links; never show untrusted input.
  const state=actual!==incoming.sha256?'invalid-digest':actual!==trusted.sha256||incoming.text!==trusted.text
    ?'content-changed':!same(incoming,trusted,documentFields)?'source-changed':'exact';
  rows.push({id:trusted.id,title:trusted.title,sourceUrl:trusted.sourceUrl,state});
 }
 rows.sort(byId);
 const identityMatches=same(pack,catalog,packetFields);
 const exact=rows.filter(row=>row.state==='exact').length;
 return {identityMatches,exact,unknown,unknownBadDigest,provided:pack.documents.length,notIncluded:catalog.documents.length-rows.length,rows,
  exactSelection:identityMatches&&exact===pack.documents.length};
}
