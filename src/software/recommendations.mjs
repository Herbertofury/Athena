export const metric = value => Number.isFinite(value) && value >= 0 ? value : null;
export function chooseRepositories(rows, query, category, sort) {
  const needle=String(query).trim().toLowerCase().slice(0,150);
  const ranks={'Start here':0, 'Reference':1};
  const fields={stars:'stars', downloads:'downloads', reviews:'reviews'};
  const cmpName=(a,b)=>a.name.localeCompare(b.name);
  return rows.filter(r=>(!category||r.category===category)&&
    [r.name,r.category,r.use,r.repository].some(s=>String(s).toLowerCase().includes(needle)))
    .sort((a,b)=>{
      if(sort==='recommendations')return (ranks[a.recommendation]??2)-(ranks[b.recommendation]??2)||cmpName(a,b);
      const key=fields[sort]; if(!key)return cmpName(a,b);
      const x=metric(a[key]),y=metric(b[key]);
      return (x===null?1:0)-(y===null?1:0) || (y??0)-(x??0) || cmpName(a,b);
    });
}
const REPO=/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
export function repositoryRows(raw) {
  if(raw?.schema_version!==1||!Array.isArray(raw.repositories))throw Error('Unsupported repository recommendation index');
  return raw.repositories.filter(r=>r&&typeof r.id==='string'&&typeof r.name==='string'&&typeof r.category==='string'&&REPO.test(r.repository));
}
export function mountRecommendations(at, {element,link,signal}){
  const count=element('p',{class:'muted',role:'status'});
  const search=element('input',{type:'search',placeholder:'Search auth, hosting, tools…',autocomplete:'off'});
  const category=element('select',{},element('option',{value:''},'All categories'));
  const order=element('select',{},[['recommendations','Recommendations'],['stars','GitHub stars'],['downloads','Release asset downloads'],['reviews','Review rating'],['name','Name A–Z']].map(([value,title])=>element('option',{value},title)));
  const contents=element('div',{class:'recommendation-grid','aria-label':'Repository results'});
  const gallery=element('button',{type:'button','aria-pressed':'true'},'Gallery');
  const list=element('button',{type:'button','aria-pressed':'false'},'List');
  const controls=element('div',{class:'recommendation-controls'},
    element('label',{},'Find a repository',search),element('label',{},'Category',category),element('label',{},'Order',order),
    element('div',{class:'recommendation-views','aria-label':'Presentation'},gallery,list));
  const panel=element('details',{class:'repository-recommendations',id:'repo-recommendations'},
    element('summary',{},'GitHub recommendations'),
    element('p',{class:'muted'},'Developer references and suggested starting points. Stars are GitHub bookmarks, not ratings. Downloads count assets in the named GitHub release, not unique users or all-time downloads. Missing measurements sort last.'),
    controls,count,contents);
  at.before(panel);
  let rows=null, pending=false;
  const num=new Intl.NumberFormat();
  const measure=(value,label)=>metric(value)===null?'Not reported':num.format(value)+(label?' '+label:'');
  function render(){
    if(rows===null)return;
    const results=chooseRepositories(rows,search.value,category.value,order.value);
    count.textContent=results.length+' repositories'+(order.value==='reviews'&&!results.some(r=>metric(r.reviews)!==null)?' · No public review scores available.':'');
    contents.replaceChildren(...(results.length?results.map(r=>element('article',{class:'repository-card'},
      element('header',{},element('span',{class:'eyebrow'},r.category),element('h3',{},link(r.name,r.repository)),element('span',{class:'repo-pick'},r.recommendation)),
      element('p',{},r.use),
      element('dl',{class:'repo-stats'},
        element('div',{},element('dt',{},'GitHub stars'),element('dd',{},measure(r.stars,''))),
        element('div',{},element('dt',{},'Release downloads'),element('dd',{},measure(r.downloads,''))),
        element('div',{},element('dt',{},'Review rating'),element('dd',{},measure(r.reviews,'')))),
      element('footer',{},element('small',{},'Observed '+r.observed),
        element('div',{class:'repo-sources'},link('Repository metrics',r.repositoryEvidence),
          r.downloadEvidence?link('Release '+r.downloadScope,r.downloadEvidence):null,
          (Array.isArray(r.links)?r.links:[]).map(i=>link(i.label,i.url))))
    )):[element('p',{class:'muted'},'No repositories match. Try another search.')]));
  }
  function layout(useList){contents.classList.toggle('compact',useList);list.setAttribute('aria-pressed',String(useList));gallery.setAttribute('aria-pressed',String(!useList));}
  search.addEventListener('input',render);category.addEventListener('change',render);order.addEventListener('change',render);
  gallery.addEventListener('click',()=>layout(false));list.addEventListener('click',()=>layout(true));
  panel.addEventListener('toggle',async()=>{
    if(!panel.open||rows!==null||pending)return;
    pending=true;count.textContent='Loading repository recommendations…';
    try {
      const r=await fetch(new URL('./repository-recommendations.json',import.meta.url),{signal});
      if(!r.ok)throw Error('Catalog returned '+r.status);
      rows=repositoryRows(await r.json());
      category.append(...Array.from(new Set(rows.map(row=>row.category))).sort().map(v=>element('option',{value:v},v)));
      order.value='recommendations';render();
    } catch {
      if(!signal?.aborted)count.textContent='Could not load recommendations. Close and reopen to retry.';
    } finally {pending=false;}
  });
  return panel;
}
