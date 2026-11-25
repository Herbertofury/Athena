const q=id=>document.getElementById(id),el=(tag,t)=>Object.assign(document.createElement(tag),{textContent:t});
const sections=[['worlds','Worlds','variant'],['districts','Districts'],['weather','Weather','intensity']];
let cards=[];
function card(a){
 const article=document.createElement('article');article.className='record-panel';
 article.append(el('h2',a.name),el('p',a.family),el('p',a.rights_note));
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
 const provenance=new URL(d.pinned_source);
 if(provenance.origin!=='https://github.com'||!provenance.pathname.startsWith('/Herbertofury/Athena/blob/'))throw Error();
 const a=el('a','View pinned public source');a.href=provenance.href;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
 q('source').append(a,el('span',` · ${d.coverage.worlds} worlds · ${d.coverage.districts} districts · SHA-256: ${d.source_sha256}`));
 q('find').addEventListener('input',filter);filter();
}catch{q('artists').replaceChildren();q('status').textContent='The artist index could not be verified.';}
