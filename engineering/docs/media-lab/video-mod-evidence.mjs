// Manual source cues only. No fetch, media loading, automatic persistence, or inferred identity.
const labels=Object.freeze({visible:'User-marked visible text',spoken:'User-marked spoken name',inferred:'Inference, unconfirmed'});
const noteLimit=32_768,rowLimit=64, fileByteLimit=256*1024;
// Google publishes the minute/second form on youtu.be. Leave longer review
// offsets as evidence only instead of assuming an undocumented URL syntax.
const linkedStartLimitMs=3_600_000;
const sourceError=()=>Error('Use a YouTube video, Bilibili video, or X post HTTPS URL without credentials.');

function canonicalSource(input){
 if(typeof input!=='string'||input.length>2048)throw sourceError();
 let url;try{url=new URL(input.trim());}catch{throw sourceError();}
 if(url.protocol!=='https:'||url.port||url.username||url.password)throw sourceError();
 const host=url.hostname,path=url.pathname;
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(host)){
  const ids=url.searchParams.getAll('v');
  const id=host==='youtu.be'?/^\/([\w-]{11})\/?$/.exec(path)?.[1]:
   path==='/watch'&&ids.length===1?ids[0]:/^\/shorts\/([\w-]{11})\/?$/.exec(path)?.[1];
  if(!id||!/^[\w-]{11}$/.test(id)||(path!=='/watch'&&ids.length))throw sourceError();
  return {provider:'YouTube',id,url:'https://www.youtube.com/watch?v='+id};
 }
 if(['bilibili.com','www.bilibili.com'].includes(host)){
  const id=/^\/video\/(BV[A-Za-z0-9]{10})\/?$/.exec(path)?.[1],parts=url.searchParams.getAll('p');
  if(!id||parts.length>1||parts.some(value=>!/^[1-9]\d{0,3}$/.test(value)))throw sourceError();
  const part=parts.length?Number(parts[0]):null;
  return {provider:'Bilibili',id,part,url:'https://www.bilibili.com/video/'+id+'/'+(part===null?'':'?p='+part)};
 }
 if(['x.com','www.x.com','twitter.com','www.twitter.com'].includes(host)){
  const match=/^\/([A-Za-z0-9_]{1,15})\/status\/([1-9]\d{0,24})\/?$/.exec(path);
  if(!match)throw sourceError();
  return {provider:'X post',id:match[2],url:'https://x.com/'+match[1]+'/status/'+match[2]};
 }
 throw sourceError();
}
function millis(input){
 const m=/^(?:(\d{1,2}):)?(\d{1,2}):([0-5]\d)(?:\.(\d{1,3}))?$/.exec(input);
 if(!m||(m[1]&&(m[2].length!==2||Number(m[2])>59)))return null;
 const result=(Number(m[1]||0)*3600+Number(m[2])*60+Number(m[3]))*1000+Number((m[4]||'').padEnd(3,'0'));
 return result<86_400_000?result:null;
}
export function reviewVideoModCues(sourceText,notes){
 const source=canonicalSource(sourceText);
 if(typeof notes!=='string'||notes.length>noteLimit)throw Error('Enter no more than 32,768 characters of local cue notes.');
 const cues=[];
 for(const [offset,raw] of notes.split(/\r?\n/).entries()){
  const line=offset+1;
  if(!raw.trim())continue;
  if(cues.length===rowLimit)throw Error('Review no more than 64 cue rows at once.');
  const fault=()=>Error('Line '+line+': use time or time..time | visible, spoken or inferred | cue text.');
  if(raw.length>1024||/[\u0000-\u0008\u000b-\u001f\u007f]/.test(raw))throw fault();
  const match=/^([^|]{1,45})\|([^|]{1,20})\|(.+)$/.exec(raw);
  if(!match)throw fault();
  const span=match[1].trim(),basis=match[2].trim().toLowerCase(),text=match[3].trim();
  if(!Object.hasOwn(labels,basis)||!text||text.length>512)throw fault();
  const marks=span.split('..').map(s=>s.trim()),start_ms=millis(marks[0]),end_ms=marks.length===2?millis(marks[1]):null;
  if(start_ms===null||marks.length>2||(marks.length===2&&(end_ms===null||end_ms<start_ms)))throw fault();
  cues.push({line,span,start_ms,end_ms,basis,text});
 }
 if(!cues.length)throw Error('Enter at least one local cue.');
 return {schema:1,kind:'manual-video-mod-cues',source,verification:'user-supplied-unverified',cues};
}
// Re-derive the schema and identity from the same local parser used for new
// reviews. Formatting and consistent edits are fine; no input becomes trusted.
const exactKeys=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
 Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
export function parseVideoModCueFile(bytes){
 const invalid=()=>Error('Invalid reviewed cue file. Use UTF-8 cue JSON up to 256 KiB with consistent source and cue fields, still marked unverified.');
 try{
  if(!(bytes instanceof Uint8Array)||bytes.byteLength>fileByteLimit)throw invalid();
  const json=new TextDecoder('utf-8',{fatal:true}).decode(bytes),data=JSON.parse(json);
  if(!exactKeys(data,['schema','kind','source','verification','cues'])||data.schema!==1||
     data.kind!=='manual-video-mod-cues'||data.verification!=='user-supplied-unverified'||
     !Array.isArray(data.cues)||!data.cues.length||data.cues.length>rowLimit)throw invalid();
  const source=canonicalSource(data.source?.url),sourceKeys=Object.keys(source);
  if(!exactKeys(data.source,sourceKeys)||sourceKeys.some(key=>data.source[key]!==source[key]))throw invalid();
  let draft='',prior=0;
  for(const cue of data.cues){
   if(!exactKeys(cue,['line','span','start_ms','end_ms','basis','text'])||!Number.isSafeInteger(cue.line)||
      cue.line<=prior||cue.line>noteLimit||typeof cue.span!=='string'||cue.span.length>45||
      !Object.hasOwn(labels,cue.basis)||typeof cue.basis!=='string'||
      typeof cue.text!=='string'||cue.text.length>512)throw invalid();
   draft+=(prior?'\n':'')+'\n'.repeat(cue.line-prior-1)+cue.span+'|'+cue.basis+'|'+cue.text;
   prior=cue.line;
  }
  const record=reviewVideoModCues(source.url,draft);
  if(record.cues.length!==data.cues.length||record.cues.some((cue,index)=>
     Object.keys(cue).some(key=>!Object.is(cue[key],data.cues[index][key]))))throw invalid();
  // JSON.parse alone would silently accept a last-key-wins spoof. Scan the
  // lexical string tokens only after the bounded, known schema is verified.
  const containers=[];
  for(const [token,quoted,keyEnd] of json.matchAll(/("(?:[^"\\]|\\.)*")(\s*:)?|[{}\[\]]/g)){
   if(keyEnd){
    const key=JSON.parse(quoted),keys=containers.at(-1);
    if(keys.has(key))throw invalid();
    keys.add(key);
   }else if(token==='{')containers.push(new Set());
   else if(token==='[')containers.push(null);
   else if(token==='}'||token===']')containers.pop();
  }
  return record;
 }catch{throw invalid();}
}

export function mountVideoModEvidence(host){
 const doc=host.ownerDocument;
 const form=doc.createElement('form');
 form.innerHTML='<p>Review timestamped mod clues you already collected. One per line: <code>0:12..0:14 | visible | Example mod name</code>. Use <code>visible</code>, <code>spoken</code>, or <code>inferred</code>. Only your labels are recorded; Athena does not identify or verify a mod.</p><p><label>Video or post URL <input type="url" name="source" maxlength="2048" required></label></p><p><label>Local timestamped cues <textarea name="notes" maxlength="32768" rows="5" required></textarea></label></p><button type="submit">Review local cues</button><button type="button" data-clear>Clear preview</button>';
 const reopen=doc.createElement('p');
 reopen.innerHTML='<label>Reopen reviewed cue JSON <input type="file" accept="application/json,.json" data-reopen-cues></label>';
 const fileInput=reopen.querySelector('input');
 const status=doc.createElement('p'),result=doc.createElement('div');
 const source=form.querySelector('[name="source"]'),notes=form.querySelector('[name="notes"]');
 status.setAttribute('role','status');
 status.textContent='Local session only. Nothing is fetched, uploaded or saved automatically.';
 let disposed=false,generation=0;
 const downloads=new Map();
 function clear(){if(disposed)return;generation++;result.replaceChildren();status.textContent='Preview cleared. Inputs are retained.';}
 function edited(){
  if(disposed)return;
  generation++;
  if(result.childNodes.length)result.replaceChildren();
  status.textContent='Inputs changed. Review them again.';
 }
 function show(review,reopened=false){
   result.replaceChildren();
   const link=doc.createElement('a');link.href=review.source.url;link.target='_blank';link.rel='noopener noreferrer';
   link.textContent='Open supplied '+review.source.provider+' source';
   const list=doc.createElement('ol');
   for(const cue of review.cues){
    const entry=doc.createElement('li');entry.textContent=cue.span+' · '+labels[cue.basis]+' · '+cue.text;
    if(review.source.provider==='YouTube'&&cue.start_ms<linkedStartLimitMs){
     const open=doc.createElement('button');
     open.type='button';open.textContent='Open video at cue';
     open.setAttribute('aria-label','Open video at cue on line '+cue.line+' on YouTube');
     open.onclick=()=>{
      if(disposed||!result.contains(open))return;
      const seconds=Math.floor(cue.start_ms/1000);
      const offset=Math.floor(seconds/60)+'m'+String(seconds%60).padStart(2,'0')+'s';
      doc.defaultView?.open('https://youtu.be/'+review.source.id+'?t='+offset,'_blank','noopener,noreferrer');
     };
     entry.append(doc.createTextNode(' '),open);
    }
    list.append(entry);
   }
   if(review.source.provider==='YouTube'){
    const hint=doc.createElement('p');
    hint.textContent='Timed YouTube links open the full video at the cue start, rounded down to the whole second. For offsets of one hour or more, use the source link and seek manually.';
    result.append(hint);
   }
   const details=doc.createElement('details'),summary=doc.createElement('summary'),pre=doc.createElement('pre');
   const serialized=JSON.stringify(review,null,2);
   summary.textContent='Inspect structured cue evidence';pre.textContent=serialized;
   const download=doc.createElement('button');download.type='button';download.textContent='Download reviewed cue JSON';
   download.onclick=()=>{
    if(disposed||!result.contains(download))return;
    try{
     const url=URL.createObjectURL(new Blob([serialized+'\n'],{type:'application/json'}));
     downloads.set(url,setTimeout(()=>{downloads.delete(url);URL.revokeObjectURL(url);},1000));
     const a=doc.createElement('a');a.href=url;a.download='athena-video-mod-cues.json';a.click();
    }catch{status.textContent='Cue download could not start. The reviewed evidence is still displayed.';}
   };
   details.append(summary,pre);result.append(link,list,download,details);
   const inferred=review.cues.filter(cue=>cue.basis==='inferred').length;
   status.textContent=(reopened?'Reopened local file. Draft unchanged. ':'')+review.cues.length+' cue(s), '+inferred+
     ' marked inferred. Not verified mod identities or download links.';
 }
 function render(event){
  event.preventDefault();if(disposed)return;generation++;result.replaceChildren();
  try{show(reviewVideoModCues(source.value,notes.value));}
  catch(error){status.textContent=error.message;}
 }
 async function readFile(){
  const file=fileInput.files?.[0];fileInput.value='';
  if(disposed||!file)return;
  const ticket=++generation;
  try{
   if(file.size>fileByteLimit)throw Error();
   const buffer=await file.arrayBuffer();
   if(disposed||ticket!==generation)return;
   show(parseVideoModCueFile(new Uint8Array(buffer)),true);
  }catch{
   if(!disposed&&ticket===generation)status.textContent='Cue file refused. Use valid unverified Athena cue JSON up to 256 KiB. Draft and any previous review are unchanged.';
  }
 }
 const button=form.querySelector('[data-clear]');form.addEventListener('submit',render);form.addEventListener('input',edited);button.addEventListener('click',clear);
 fileInput.addEventListener('change',readFile);host.append(form,reopen,status,result);
 return {dispose(){
  if(disposed)return;disposed=true;generation++;
  for(const [url,timer] of downloads){clearTimeout(timer);URL.revokeObjectURL(url);}downloads.clear();
  form.removeEventListener('submit',render);form.removeEventListener('input',edited);button.removeEventListener('click',clear);
  fileInput.removeEventListener('change',readFile);form.remove();reopen.remove();status.remove();result.remove();
 }};
}
