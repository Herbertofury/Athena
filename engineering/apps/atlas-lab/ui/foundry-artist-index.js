const q=id=>document.getElementById(id),el=(tag,t)=>Object.assign(document.createElement(tag),{textContent:t});
const sections=[['worlds','Worlds','variant'],['districts','Districts'],['weather','Weather','intensity'],['timeflow','Lighting phases']];
let cards=[],active=null,caller=null,loadRevision=0,plateRevision=0,theme,sourceDigest;
const artistCards=new Map();
const hasConcept=document.body.dataset.conceptReady==='yes';
q('optional-concept-note').hidden=hasConcept;
function conceptStyle(){
 if(!theme)theme=new Promise((resolve,reject)=>{
  const link=document.createElement('link');
  link.rel='stylesheet';link.href='/migration/foundry-artists/concept.css';
  link.onload=resolve;
  link.onerror=()=>{link.remove();theme=undefined;reject(Error('Optional concept stylesheet unavailable'));};
  document.head.append(link);
 });
 return theme;
}
const menu=(id,rows)=>q(id).replaceChildren(...rows.map(([value,name])=>Object.assign(el('option',name),{value})));
const setStatus=t=>{q('concept-status').textContent=t;};
function showPlate(preview,figure,world,weather,phase) {
 const node=q(figure),{motif,swatches}=preview.describePlate(world.id);
 preview.drawPlate(node.querySelector('canvas'),world.id,weather,phase?.id);
 const save=node.querySelector('.save-plate');
 save.dataset.filename=`athena-concept-${world.id}--${weather?.id??'clear'}${phase?'--'+phase.id:''}.png`;
 save.setAttribute('aria-label','Save '+world.name+' concept PNG');
 save.disabled=false;
 node.querySelector('h3').textContent=world.name;
 node.querySelector('p').textContent=`${world.variant} · ${motif}${phase?' · '+phase.name:''}`;
 node.querySelector('.swatches').replaceChildren(...swatches.map(color=>{
  const tag=el('span',''),chip=el('i','');chip.style.backgroundColor=color;
  chip.setAttribute('aria-hidden','true');tag.append(chip,document.createTextNode(color.toUpperCase()));return tag;
 }));
}
function resetExports(){
 ++plateRevision;
 q('plate-export-status').textContent='';
 q('preview-code-capture').disabled=true;
 for(const id of ['primary','alternate'])q(id).querySelector('.save-plate').disabled=true;
}
function savePlate(event){
 const button=event.currentTarget,node=button.closest('figure');
 const name=button.dataset.filename;
 if(!active||node.hidden||button.disabled||!/^athena-concept-[a-z0-9.-]+--[a-z0-9.-]+\.png$/.test(name))return;
 const revision=plateRevision;
 const status=q('plate-export-status');
 button.disabled=true;
 const current=()=>revision===plateRevision&&!node.hidden&&active;
 const failed=()=>{if(current()){button.disabled=false;status.textContent='Could not prepare this concept PNG.';}};
 try{
  node.querySelector('canvas').toBlob(blob=>{
   if(!current())return;
   if(!blob||blob.type!=='image/png'||!blob.size){failed();return;}
   let url;
   try{
    url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.download=name;link.href=url;link.hidden=true;
    document.body.append(link);
    try{link.click();}finally{link.remove();}
    button.disabled=false;status.textContent='PNG download requested.';
   }catch{failed();}
   finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),5000);}
  },'image/png');
 }catch{failed();}
}
for(const id of ['primary','alternate'])q(id).querySelector('.save-plate').addEventListener('click',savePlate);
function draw(){
 resetExports();
 if(!active)return;
 const {artist,preview}=active;
 const world=artist.worlds.find(w=>w.id===q('concept-world').value);
 const weather=artist.weather.find(w=>w.id===q('concept-weather').value);
 const phase=artist.timeflow.find(p=>p.id===q('concept-phase').value);
 if(!world)return;
 try{
  showPlate(preview,'primary',world,weather,phase);
  q('primary').hidden=false;
  const other=q('concept-compare').checked&&artist.worlds.find(w=>w.id!==world.id);
  if(other)showPlate(preview,'alternate',other,weather,phase);
  q('alternate').hidden=!other;
  q('preview-code-capture').disabled=false;
  setStatus(`${world.name}${other?' and '+other.name:''} · ${weather?weather.name:'Clear study'}${phase?' · '+phase.name:''}`);
 }catch{
  resetExports();
  for(const id of ['primary','alternate'])q(id).hidden=true;
  setStatus('Concept rendering is unavailable. The separate artist index remains usable.');
 }
}
async function openPreview(artist,button,restore=null){
 const revision=++loadRevision;
 caller=button;
 q('concept').hidden=false;q('concept-title').textContent=artist.name+' concept preview';q('concept-title').focus();
 active=null;resetExports();q('primary').hidden=true;q('alternate').hidden=true;
 setStatus('Loading optional concept tools…');
 for(const id of ['concept-world','concept-weather','concept-phase','concept-compare'])q(id).disabled=true;
 try{
  const [preview]=await Promise.all([import('/migration/foundry-artists/concept.mjs'),conceptStyle()]);
  if(revision!==loadRevision)return;
  active={artist,preview};
  menu('concept-world',artist.worlds.map(w=>[w.id,w.name+' · '+w.variant]));
  menu('concept-phase',[['','Original study lighting'],...artist.timeflow.map(p=>[p.id,p.name])]);
  menu('concept-weather',[['','Clear study'],...artist.weather.map(w=>[w.id,w.name+' · '+w.intensity])]);
  for(const id of ['concept-world','concept-weather','concept-phase','concept-compare'])q(id).disabled=false;
  if(restore){
   q('concept-world').value=restore.world;
   q('concept-weather').value=restore.weather;
   q('concept-phase').value=restore.phase;
  }
  q('concept-compare').checked=restore?.compare===true;q('primary').hidden=false;draw();
 }catch{
  if(revision===loadRevision)setStatus('Concept tools could not load. The separate artist index remains usable.');
 }
}
for(const id of ['concept-world','concept-weather','concept-phase','concept-compare'])q(id).addEventListener('change',draw);
q('concept-close').addEventListener('click',()=>{
 ++loadRevision;active=null;resetExports();q('concept').hidden=true;
 if(caller?.closest('article')?.hidden)q('find').focus();else caller?.focus();caller=null;
});

const keyIds=['concept-world','concept-weather','concept-phase'];
const codeInput=q('preview-code-input'),codeStatus=q('preview-code-status');
const validId=(v,rows)=>typeof v==='string'&&rows.some(row=>row.id===v);
function decodeCode(value){
 if(value.length>512)return null;
 let row;
 try{row=JSON.parse(value);}catch{return null;}
 if(!Array.isArray(row)||row.length!==7||row[0]!=='athena-concept-v1'||row[1]!==sourceDigest)return null;
 const entry=artistCards.get(row[2]),[world,weather,phase,compare]=row.slice(3);
 if(!entry||!validId(world,entry.artist.worlds)||!(weather===''||validId(weather,entry.artist.weather))||
    !(phase===''||validId(phase,entry.artist.timeflow))||typeof compare!=='boolean')return null;
 return {...entry,world,weather,phase,compare};
}
q('preview-code-capture').addEventListener('click',()=>{
 if(!active||!sourceDigest||q('primary').hidden)return;
 codeInput.value=JSON.stringify(['athena-concept-v1',sourceDigest,active.artist.id,...keyIds.map(id=>q(id).value),q('concept-compare').checked]);
 q('preview-code').open=true;
 codeStatus.textContent='Preview code selected. Copy it to keep this exact selection.';
 codeInput.focus();codeInput.select();
});
q('preview-code-restore').addEventListener('click',()=>{
 const recipe=hasConcept&&decodeCode(codeInput.value);
 if(!recipe){codeStatus.textContent='This preview code is invalid or belongs to a different catalog. The current preview was not changed.';return;}
 codeStatus.textContent='Opening the saved preview selection.';
 void openPreview(recipe.artist,recipe.button,recipe);
});

function compareInputs(artists,count){
 const recipes=new Map();
 let total=0;
 for(const artist of artists){
  if(!Array.isArray(artist.interactions)||artist.interactions.length!==5)return;
  for(const r of artist.interactions){
   if(typeof r.name!=='string'||!(/^[A-Z][A-Za-z]*( \/ [A-Z][A-Za-z]*)?$/).test(r.name)||
     typeof r.response!=='string'||typeof r.guardrail!=='string')return;
   total++;
   for(const input of r.name.split(' / ')){
    if(!recipes.has(input))recipes.set(input,[]);
    recipes.get(input).push([artist.name,r]);
   }
  }
 }
 if(total!==count||!recipes.has('Press'))return;
 const control=q('interaction-input');
 menu('interaction-input',[...recipes.keys()].sort().map(input=>[input,input]));
 control.value='Press';
 const reflect=()=>{
  const rows=recipes.get(control.value)??[];
  q('interaction-results').replaceChildren(...rows.map(([artist,r])=>{
   const item=el('article','');item.className='record-panel';
   item.append(el('h3',artist),el('p',r.name),el('p',r.response),el('p','Input guardrail: '+r.guardrail));return item;
  }));
  q('interaction-status').textContent=`${rows.length} ${rows.length===1?'recipe':'recipes'} for ${control.value}.`;
 };
 control.addEventListener('change',reflect);reflect();q('interaction-library').hidden=false;
}
function card(a){
 const article=document.createElement('article');article.className='record-panel';
 article.append(el('h2',a.name),el('p',a.family),el('p',a.rights_note));
 if(hasConcept){
  const preview=el('button','Preview '+a.name+' worlds');preview.type='button';
  preview.addEventListener('click',()=>void openPreview(a,preview));
  artistCards.set(a.id,{artist:a,button:preview});
  article.append(preview);
 }

 for(const [key,title,qualifier] of sections){
  const details=document.createElement('details'),list=document.createElement('ul');
  details.append(el('summary',`${title} (${a[key].length})`),list);
  for(const row of a[key])list.append(el('li',row.name+(qualifier?` · ${row[qualifier]}`:'')+` (${row.id})`));
  article.append(details);
 }
 article.append(el('p',`Recorded music routes: ${a.recorded_music_routes} (counts only, no access claim)`));
 return article;
}
function filter(){
 const term=q('find').value.trim().toLocaleLowerCase();
 let shown=0;
 for(const [node,text] of cards){node.hidden=!text.includes(term);if(!node.hidden)shown++;}
 q('status').textContent=`Showing ${shown} of ${cards.length} artists.`;
}
try{
 const r=await fetch('/api/migration/foundry-artists',{mode:'same-origin',credentials:'omit',redirect:'error'});
 if(!r.ok)throw Error();
 const d=await r.json();
 if(d.schema!=='athena-foundry-artist-index-v1'||d.artists.length!==5||!(/^[a-f0-9]{64}$/).test(d.source_sha256))throw Error();
 cards=d.artists.map(a=>{const n=card(a);return [n,(a.id+' '+n.textContent).toLocaleLowerCase()];});
 q('artists').replaceChildren(...cards.map(x=>x[0]));
 sourceDigest=d.source_sha256;
 const provenance=new URL(d.pinned_source);
 if(provenance.origin!=='https://github.com'||!provenance.pathname.startsWith('/Herbertofury/Athena/blob/'))throw Error();
 const a=el('a','View pinned public source');a.href=provenance.href;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
 q('preview-code').hidden=!hasConcept;
 q('source').append(a,el('span',` · ${d.coverage.worlds} worlds · ${d.coverage.districts} districts · SHA-256: ${d.source_sha256}`));
 compareInputs(d.artists,d.coverage.interactions);
 q('find').addEventListener('input',filter);filter();
}catch{q('interaction-library').hidden=true;sourceDigest=undefined;artistCards.clear();q('preview-code').hidden=true;q('artists').replaceChildren();q('status').textContent='The artist index could not be verified.';}
