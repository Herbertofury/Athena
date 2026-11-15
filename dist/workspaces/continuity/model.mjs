// Native Athena continuity contract. No provider requests, execution or grants.
export function fresh(){return {schema:1,entries:[]};}
const kinds=new Set(['decision','next-action','resource','blocker']);
function text(v,max){if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('Missing or oversized text');return v.trim();}
function source(v){if(!v)return '';const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password)throw Error('Source must be HTTPS without credentials');return u.href;}
export function validate(value){
 if(!value||value.schema!==1||!Array.isArray(value.entries)||value.entries.length>500)throw Error('Unsupported continuity data');
 const ids=new Set();
 for(const e of value.entries){text(e.id,100);if(ids.has(e.id))throw Error('Duplicate ID');ids.add(e.id);text(e.project,200);if(!kinds.has(e.kind)||typeof e.pinned!=='boolean'||typeof e.ignored!=='boolean'||!Array.isArray(e.revisions)||!e.revisions.length||!Array.isArray(e.history))throw Error('Invalid entry');
 for(const rev of e.revisions){text(rev.text,10000);source(rev.source);if(!Number.isFinite(rev.at))throw Error('Invalid revision time');}
 for(const h of e.history){if(!['created','revised','pinned','unpinned','ignored','restored'].includes(h.action)||!Number.isFinite(h.at))throw Error('Invalid policy history');}}
 const out=structuredClone(value);if(JSON.stringify(out).length>240000)throw Error('Continuity storage budget reached; export before adding more');return out;
}
export function apply(value,action,now=Date.now()){
 const next=validate(value);if(!Number.isFinite(now))throw Error('Invalid time');
 if(action.type==='add'){const id=text(action.id,100);if(next.entries.some(e=>e.id===id))throw Error('Duplicate ID');if(!kinds.has(action.kind))throw Error('Unknown kind');next.entries.push({id,project:text(action.project,200),kind:action.kind,pinned:false,ignored:false,revisions:[{text:text(action.text,10000),source:source(action.source),at:now}],history:[{action:'created',at:now}]});}
 else {const e=next.entries.find(e=>e.id===action.id);if(!e)throw Error('Entry not found');if(action.type==='revise'){e.revisions.push({text:text(action.text,10000),source:source(action.source),at:now});e.history.push({action:'revised',at:now});}
 else if(action.type==='pin'){e.pinned=!e.pinned;e.history.push({action:e.pinned?'pinned':'unpinned',at:now});}
 else if(action.type==='ignore'){e.ignored=!e.ignored;e.history.push({action:e.ignored?'ignored':'restored',at:now});}else throw Error('Unknown action');}
 return validate(next);
}
export function visible(value,query='',includeIgnored=false){const q=query.toLowerCase();return validate(value).entries.filter(e=>(includeIgnored||!e.ignored)&&[e.project,e.kind,...e.revisions.flatMap(r=>[r.text,r.source])].join(' ').toLowerCase().includes(q)).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.revisions.at(-1).at-a.revisions.at(-1).at||a.id.localeCompare(b.id));}
