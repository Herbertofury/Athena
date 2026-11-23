const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
const link=(label,url)=>{const a=node('a',label);a.href=url;return a;};
const routes=new Map([
  ['atlas',['/#lab','/learning']], ['foundry',['/#build',null]],
  ['constellation',['/#continuity',null]], ['guidance',['/#guidance',null]],
]);
const LIMIT=64*1024;
const refused=()=>new Error('Readiness snapshot could not be verified. No evidence links shown. No source is certified safe to delete.');
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const localOptions=()=>({cache:'no-store',credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(8000)});

async function snapshot() {
  const options=localOptions();
  const response=await fetch('/api/migration/readiness',options);
  const digest=response.headers.get('x-athena-snapshot-sha256');
  const reader=response.body?.getReader();
  if(!reader)throw refused();
  const bytes=new Uint8Array(LIMIT);
  let size=0,done=false;
  try {
    if(!response.ok||!/^[a-f0-9]{64}$/.test(digest??''))throw refused();
    for(;;){
      const item=await reader.read();
      if(options.signal.aborted)throw refused();
      if(item.done){done=true;break;}
      if(size+item.value.byteLength>LIMIT)throw refused();
      bytes.set(item.value,size);size+=item.value.byteLength;
    }
  } finally {
    if(!done)reader.cancel().catch(()=>{});
    reader.releaseLock();
  }
  const content=bytes.subarray(0,size);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',content)),v=>v.toString(16).padStart(2,'0')).join('');
  if(hash!==digest)throw refused();
  const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(content));
  if(data?.schema!==1||data.retirement_certified!==false||!text(data.scope,1024)||
     typeof data.snapshot_date!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data.snapshot_date)||
     typeof data.source_snapshot_commit!=='string'||!/^[a-f0-9]{40}$/.test(data.source_snapshot_commit)||
     !Array.isArray(data.projects)||data.projects.length!==routes.size)throw refused();
  return {data,hash};
}
function card(project,seen,pin) {
  const route=routes.get(project?.id);
  if(!route||seen.has(project.id)||project.workspace!==route[0]||project.native_entry!==route[1]||
     !text(project.name,160)||!text(project.summary,1024)||!Array.isArray(project.gates)||
     project.gates.length>16||!project.gates.some(gate=>gate?.state==='open')||
     !Array.isArray(project.evidence)||project.evidence.length<1||project.evidence.length>16)throw refused();
  seen.add(project.id);
  const article=node('article','');article.className='runner';
  article.append(node('h2',project.name),node('p',project.summary));
  const nav=node('nav','');nav.setAttribute('aria-label',`${project.name} workspace navigation`);
  nav.append(link('Open native workspace',route[0]));
  if(route[1])nav.append(link('Open local experiments',route[1]));
  article.append(nav);
  for(const gate of project.gates){
    if(!['recorded','open'].includes(gate?.state)||!text(gate.label,160)||!text(gate.detail,2048))throw refused();
    const section=node('section','');
    section.append(node('h3',`${gate.state==='recorded'?'Recorded evidence':'Still open'} · ${gate.label}`),node('p',gate.detail));
    article.append(section);
  }
  const sources=node('ul',''),prefix=`https://github.com/Herbertofury/Athena/blob/${pin}/`;
  for(const source of project.evidence){
    if(!text(source?.label,160)||!text(source.url,1024)||!source.url.startsWith(prefix))throw refused();
    const path=source.url.slice(prefix.length).split('/');
    if(path.some(segment=>!(/^[A-Za-z0-9_.-]+$/).test(segment)||segment==='.'||segment==='..'))throw refused();
    const li=node('li',''),anchor=link(source.label,source.url);
    anchor.rel='noreferrer';
    li.append(anchor);sources.append(li);
  }
  article.append(sources);
  return article;
}
async function load(){
  const status=document.querySelector('#status');
  try{
    const {data,hash}=await snapshot();
    const seen=new Set(),cards=data.projects.map(project=>card(project,seen,data.source_snapshot_commit));
    document.querySelector('#projects').replaceChildren(...cards);
    document.querySelector('#scope').textContent=data.scope;
    document.querySelector('#snapshot').textContent=`Snapshot ${data.snapshot_date} · source commit ${data.source_snapshot_commit} · local bytes matched engine SHA-256 ${hash}`;
    status.textContent=`${cards.length} source integrations shown. This is not a live audit or a completion checklist.`;
  }catch{status.textContent=refused().message;}
}
async function runtime(){
  try{
    const response=await fetch('/api/runtime',localOptions());
    if(!response.ok)throw Error(`Local read failed (${response.status}). No source was changed.`);
    const data=await response.json();
    document.querySelector('#runtime').textContent=`Local ${data.application} engine responding · instance ${data.engine_instance}. Runtime availability does not verify migration gates.`;
  }catch(error){document.querySelector('#runtime').textContent=error.message;}
}
Promise.all([load(),runtime()]);
