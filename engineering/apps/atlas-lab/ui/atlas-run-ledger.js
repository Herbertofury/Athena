const q=id=>document.getElementById(id),PAGE=25;
const element=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
let index=[],offset=0,drill=null;
const filters={changed:r=>r.early&&r.later&&(r.early.status!==r.later.status||r.early.conclusion!==r.later.conclusion),
 failed:r=>r.later?.conclusion==='failure',later:r=>!r.early&&r.later};
function label(r){return r?(r.conclusion??r.status).replaceAll('_',' '):'Not present in that snapshot';}
function external(url,text){
 const a=element('a',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';return a;
}
function card(r){
 const n=document.createElement('article');n.className='record-panel';
 n.append(element('h3',`#${r.id} · ${r.name}`),
  element('p',`Created ${r.created_at} · Nov 7: ${label(r.early)} · Nov 14: ${label(r.later)}`));
 const d=document.createElement('details');
 d.append(element('summary','Commit and original run link'),element('p',`Commit: ${r.head_sha}`));
 if(r.branch)d.append(element('p',`Branch observed Nov 7: ${r.branch}`));
 if(r.event)d.append(element('p',`Event observed Nov 7: ${r.event}`));
 d.append(external('https://github.com/Herbertofury/Engineering-Atlas/actions/runs/'+r.id,'Open original GitHub run'));
 n.append(d);return n;
}
function commitCard({sha,rows,failures,changes}){
 const n=document.createElement('article');
 n.className='record-panel';
 const go=element('button','Inspect '+rows.length+' matched '+(rows.length===1?'run':'runs'));
 go.type='button';
 go.addEventListener('click',()=>{
  drill={sha,offset};offset=0;render();q('run-heading').focus();
 });
 const title=element('h3','Commit '+sha.slice(0,12));title.title=sha;
 n.append(title,element('p',rows.length+' matched · '+failures+' failed on Nov 14 · '+changes+' changed between snapshots'),go);
 return n;
}
function render(){
 const needle=q('search').value.trim().toLocaleLowerCase(),filter=filters[q('scope').value];
 const selected=index.filter(x=>(!filter||filter(x.run))&&x.text.includes(needle)&&(!drill||x.run.head_sha===drill.sha));
 const grouped=q('view').value==='commits'&&!drill;
 const byCommit=new Map();
 if(grouped)for(const {run} of selected){
  let c=byCommit.get(run.head_sha);
  if(!c){c={sha:run.head_sha,rows:[],failures:0,changes:0};byCommit.set(run.head_sha,c);}
  c.rows.push(run);if(filters.failed(run))c.failures++;if(filters.changed(run))c.changes++;
 }
 const list=grouped?[...byCommit.values()]:selected;
 offset=Math.min(offset,Math.max(0,Math.floor((list.length-1)/PAGE)*PAGE));
 const rows=list.slice(offset,offset+PAGE);
 q('records').replaceChildren(...rows.map(x=>grouped?commitCard(x):card(x.run)));
 const scope=grouped?(list.length===1?'commit':'commits')+' · '+selected.length+' matched '+(selected.length===1?'run':'runs'):(list.length===1?'run':'runs');
 q('status').textContent=rows.length?`Showing ${offset+1}–${offset+rows.length} of ${list.length} matched ${scope} (${index.length} archived).`:'No recorded runs match.';
 q('commit-focus').hidden=!drill;
 q('commit-label').textContent=drill?'Showing matching runs for '+drill.sha:'';
 q('run-heading').textContent=grouped?'Recorded commits':'Recorded runs';
 q('pages').hidden=list.length<=PAGE;
 q('previous').disabled=offset===0;q('next').disabled=offset+PAGE>=list.length;
}
for(const id of ['search','scope','view'])q(id).addEventListener(id==='search'?'input':'change',()=>{offset=0;drill=null;render();});
q('back-to-groups').addEventListener('click',()=>{if(!drill)return;offset=drill.offset;drill=null;render();q('run-heading').focus();});
for(const [id,delta] of [['previous',-PAGE],['next',PAGE]])q(id).addEventListener('click',()=>{offset=Math.max(0,offset+delta);render();q('run-heading').focus();});
try{
 const r=await fetch('/api/migration/atlas-runs',{credentials:'omit',mode:'same-origin',redirect:'error'});
 if(!r.ok)throw Error();
 const d=await r.json();
 if(d.schema!=='athena-engineering-atlas-historical-runs-v1'||!Array.isArray(d.runs)||d.runs.length!==522||
    d.repeated_ids!==509||d.changed_readings!==2||d.runs.some(r=>!Number.isSafeInteger(r.id)||r.id<1||!(/^[a-f0-9]{40}$/).test(r.head_sha)))throw Error();
 for(const s of [d.early,d.later]){
  const p=new URL(s.source);
  if(p.origin!=='https://github.com'||!p.pathname.startsWith('/Herbertofury/Athena/blob/')||!(/^[a-f0-9]{64}$/).test(s.sha256))throw Error();
  const li=element('li',`${s.date}: ${s.rows} rows. `);
  li.append(external(s.source,'View pinned source'),element('p',`SHA-256: ${s.sha256}`));q('sources').append(li);
 }
 index=d.runs.map(run=>({run,text:`${run.id} ${run.name} ${run.head_sha} ${run.branch??''}`.toLocaleLowerCase()}));
 q('filters').hidden=q('source-panel').hidden=false;render();
}catch{q('status').textContent='The local workflow ledger could not be verified. No results are shown.';}
