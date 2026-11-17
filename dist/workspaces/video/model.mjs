export const MAX_BYTES=16*1024*1024;
export function parseTranscript(bytes){
 if(bytes.byteLength>MAX_BYTES)throw Error('Transcript exceeds 16 MiB.');
 const v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 if(v?.schema!==1||typeof v.video_id!=='string'||typeof v.sha256!=='string'||!/^[-\w]{11}$/.test(v.video_id)||! /^(?:[a-f0-9]{64})$/.test(v.sha256)||typeof v.automatic!=='boolean'||!['user-supplied','creator-provided','authorized-export'].includes(v.origin)||!['vtt','srt','json3'].includes(v.format)||typeof v.language!=='string'||!v.language.trim()||v.language.length>100||!Array.isArray(v.cues)||!v.cues.length||v.cues.length>20000)throw Error('Expected normalized video_learning.py transcript JSON.');
 let previous=-1;
 const cues=v.cues.map((c,i)=>{
  if(c?.id!==`cue-${i+1}`||!Number.isSafeInteger(c.start_ms)||!Number.isSafeInteger(c.end_ms)||c.start_ms<previous||c.start_ms<0||c.end_ms<=c.start_ms||c.end_ms>604800000||typeof c.text!=='string'||!c.text.trim())throw Error('Invalid cue or time order.');
  previous=c.start_ms;
  return {id:c.id,start_ms:c.start_ms,end_ms:c.end_ms,text:c.text,url:`https://www.youtube.com/watch?v=${v.video_id}&t=${Math.floor(c.start_ms/1000)}s`};
 });
 return {video_id:v.video_id,sha256:v.sha256,automatic:v.automatic,language:v.language,origin:v.origin,cues};
}
export function selectCues(data,query,page=0){const matches=data.cues.filter(c=>`${c.id} ${c.text}`.toLowerCase().includes(String(query).toLowerCase()));const pages=Math.max(1,Math.ceil(matches.length/50));page=Math.max(0,Math.min(pages-1,page));return {total:matches.length,pages,page,cues:matches.slice(page*50,page*50+50)};}
