// Explicit user-owned project records. No polling, provider requests or credential access.
export const stages = ['idea','research','building','testing','released','paused'];
export const empty = () => ({schema:1,entries:[]});
const txt=(x,max=10000)=>{if(typeof x!=='string'||x.length>max)throw Error('Invalid or oversized project text');return x;};
const required=(x,max)=>{txt(x,max);if(!x.trim())throw Error('Project name is required');return x;};
function url(x){txt(x,2000);if(!x)return x;const u=new URL(x);if(u.protocol!=='https:'||u.username||u.password)throw Error('Use an HTTPS source without credentials');return x;}
function fields(p){required(p.name,200);if(!['own','followed'].includes(p.ownership)||!stages.includes(p.stage))throw Error('Invalid project type or stage');for(const k of ['goal','next','blockers','decisions','resources'])txt(p[k]);url(p.source);txt(p.version,200);url(p.release);return p;}
export function validate(value){
 if(!value||value.schema!==1||!Array.isArray(value.entries))throw Error('Unsupported projects backup');
 const seen=new Set();for(const p of value.entries){required(p.id,100);if(seen.has(p.id))throw Error('Duplicate project ID');seen.add(p.id);if(typeof p.archived!=='boolean'||!Array.isArray(p.revisions)||!p.revisions.length)throw Error('Invalid project history');for(const r of p.revisions){fields(r);if(!Number.isFinite(r.at))throw Error('Invalid revision date');}}
 return structuredClone(value);
}
export function change(value,id,input,now=Date.now()){
 const next=validate(value);fields(input);if(!Number.isFinite(now))throw Error('Invalid date');required(id,100);
 let project=next.entries.find(p=>p.id===id);if(!project){project={id,archived:false,revisions:[]};next.entries.push(project);}
 project.revisions.push({...structuredClone(input),at:now});return validate(next);
}
export function archive(value,id){const next=validate(value),p=next.entries.find(p=>p.id===id);if(!p)throw Error('Unknown project');p.archived=!p.archived;return next;}
// Search only the declared project text fields; unknown imported metadata stays
// preserved but is not accidentally exposed as search evidence.
export const searchableFields=['name','ownership','stage','goal','next','blockers','decisions','resources','source','version','release'];
export function matchingRevisions(project,query,{history=false}={}){
 const q=String(query).trim().toLowerCase();if(!q)return [];
 const found=[];
 for(let index=project.revisions.length-1;index>=0;index--){
  if(!history&&index!==project.revisions.length-1)break;
  const revision=project.revisions[index];
  const fields=searchableFields.filter(key=>revision[key].toLowerCase().includes(q));
  if(fields.length)found.push({index,fields});
 }
 return found;
}
export function browse(value,{query='',ownership='',stage='',archived=false,history=false}={}){
 const q=String(query).trim();return validate(value).entries.filter(p=>{
  const r=p.revisions.at(-1);
  return p.archived===archived&&(!ownership||r.ownership===ownership)&&(!stage||r.stage===stage)&&(!q||matchingRevisions(p,q,{history}).length>0);
 }).sort((a,b)=>b.revisions.at(-1).at-a.revisions.at(-1).at||a.id.localeCompare(b.id));
}
