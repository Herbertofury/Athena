// Manual source cues only. No fetch, media loading, persistence, or inferred identity.
const labels=Object.freeze({visible:'User-marked visible text',spoken:'User-marked spoken name',inferred:'Inference, unconfirmed'});
const noteLimit=32_768,rowLimit=64;
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
export function mountVideoModEvidence(host){
 const doc=host.ownerDocument;
 const form=doc.createElement('form');
 form.innerHTML='<p>Review timestamped mod clues you already collected. One per line: <code>0:12..0:14 | visible | Example mod name</code>. Use <code>visible</code>, <code>spoken</code>, or <code>inferred</code>. Only your labels are recorded; Athena does not identify or verify a mod.</p><p><label>Video or post URL <input type="url" name="source" maxlength="2048" required></label></p><p><label>Local timestamped cues <textarea name="notes" maxlength="32768" rows="5" required></textarea></label></p><button type="submit">Review local cues</button><button type="button" data-clear>Clear preview</button>';
 const status=doc.createElement('p'),result=doc.createElement('div');
 const source=form.querySelector('[name="source"]'),notes=form.querySelector('[name="notes"]');
 status.setAttribute('role','status');
 status.textContent='Local session only. Nothing is fetched, uploaded or saved.';
 let disposed=false;
 function clear(){if(disposed)return;result.replaceChildren();status.textContent='Preview cleared. Inputs are retained.';}
 function edited(){if(!disposed&&result.childNodes.length){result.replaceChildren();status.textContent='Inputs changed. Review them again.';}}
 function render(event){
  event.preventDefault();if(disposed)return;
  result.replaceChildren();
  try{
   const review=reviewVideoModCues(source.value,notes.value);
   const link=doc.createElement('a');link.href=review.source.url;link.target='_blank';link.rel='noopener noreferrer';
   link.textContent='Open supplied '+review.source.provider+' source';
   const list=doc.createElement('ol');
   for(const cue of review.cues){
    const entry=doc.createElement('li');entry.textContent=cue.span+' · '+labels[cue.basis]+' · '+cue.text;list.append(entry);
   }
   const details=doc.createElement('details'),summary=doc.createElement('summary'),pre=doc.createElement('pre');
   summary.textContent='Inspect structured cue evidence';pre.textContent=JSON.stringify(review,null,2);
   details.append(summary,pre);result.append(link,list,details);
   const inferred=review.cues.filter(cue=>cue.basis==='inferred').length;
   status.textContent=review.cues.length+' cue(s), '+inferred+' marked inferred. Not verified mod identities or download links.';
  }catch(error){status.textContent=error.message;}
 }
 const button=form.querySelector('[data-clear]');
 form.addEventListener('submit',render);form.addEventListener('input',edited);button.addEventListener('click',clear);
 host.append(form,status,result);
 return {dispose(){if(disposed)return;disposed=true;form.removeEventListener('submit',render);form.removeEventListener('input',edited);button.removeEventListener('click',clear);form.remove();status.remove();result.remove();}};
}
