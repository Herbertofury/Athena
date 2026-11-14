/** Compare only ordered gallery URL pairs from a Modrinth project response.
 * Not a source-authentication, image-decode, or full-content comparison. */
export function compareGallery(project,card){
 if(!project||typeof project.id!=='string'||!/^[A-Za-z0-9]{8}$/.test(project.id)||card?.id!=='modrinth:'+project.id) throw Error('Project identity mismatch');
 if(!Array.isArray(project.gallery)||!Array.isArray(card.gallery)) return {status:'unknown',reason:'gallery absent or invalid'};
 // URL construction coerces arrays to strings; malformed JSON must stay unknown.
 const normalize=(url)=>{if(typeof url!=='string')return null;try{const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='cdn.modrinth.com'||u.port||u.username||u.password)return null;return u.href;}catch{return null}};
 const actual=project.gallery.map(x=>[normalize(x?.url),normalize(x?.raw_url)]); const snapshot=card.gallery.map(x=>[normalize(x?.preview),normalize(x?.original)]);
 if(actual.some(pair=>pair.includes(null))||snapshot.some(pair=>pair.includes(null)))return {status:'unknown',reason:'missing or unsupported media URL'};
 const identical=JSON.stringify(actual)===JSON.stringify(snapshot);
 return {status:identical?'matching':'changed',actual_count:actual.length,snapshot_count:snapshot.length,scope:'ordered gallery preview/original URL pairs only'};
}
