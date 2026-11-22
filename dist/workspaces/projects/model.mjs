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
// The caller's workspace owns a validated snapshot. Retain its latest revisions
// only for searching and sort once per snapshot; history/export stay unchanged.
export function createBrowseIndex(snapshot){
 const items=snapshot.entries.map(project=>({project,latest:project.revisions.at(-1),haystack:null}));
 items.sort((a,b)=>b.latest.at-a.latest.at||a.project.id.localeCompare(b.project.id));
 const active=items.reduce((count,{project})=>count+Number(!project.archived),0);
 return {active,find({query='',ownership='',stage='',archived=false}={}){
  const q=query.toLowerCase(),result=[];
  for(const item of items){
   const {project,latest}=item;
   if(project.archived!==archived||(ownership&&latest.ownership!==ownership)||(stage&&latest.stage!==stage))continue;
   if(q){
    item.haystack??=Object.values(latest).join(' ').toLowerCase();
    if(!item.haystack.includes(q))continue;
   }
   result.push(project);
  }
  return result;
 }};
}
export function browse(value,options){return createBrowseIndex(validate(value)).find(options);}
