/* feed-widget-core — portable news reader, source directory, dashboard and builder.
 * Hosts supply catalog policy, network endpoints, identity and optional native hooks.
 */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.FeedWidgetCore=api;})
(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  function createReader(config={}) {
  const namespace=String(config.storageNamespace||'feed-reader');
  const title=String(config.title||'News'),description=String(config.description||'Follow the sources you trust. Make the view your own.'),eyebrow=String(config.eyebrow||'YOUR DAILY BRIEFING');
  const FeedCore=config.feedCore||root.FeedCore,TickerCore=config.tickerCore||root.TickerCore,ContentExtractionCore=config.contentExtractionCore||root.ContentExtractionCore,FeedGenerationCore=config.feedGenerationCore||root.FeedGenerationCore,VisualEditorCore=config.visualEditorCore||root.VisualEditorCore;
  const KEY = namespace+'-preferences:v1';
  const CACHE_KEY = namespace+'-cache:v1';
  const UI_KEY = namespace+'-reader:v1';
  const SOURCE_CACHE_KEY = namespace+'-source-cache:v1';
  const HEALTH_CACHE_KEY = namespace+'-health-cache:v1';
  const VIEWS = [['gallery','Gallery'],['compact','Compact gallery'],['list','List'],['masonry','Masonry'],['magazine','Magazine'],['carousel','Carousel'],['imageboard','Imageboard'],['slideshow','Slideshow'],['social','Social feed'],['ticker','Ticker']];
  const GROUPS = {...{news:'News',custom:'My feeds'},...(config.groups||{})};
  const editorialSourceIds=new Set(config.editorialSourceIds||[]);
  const STYLES = [['default','Default'],['grid','Grid'],['compact','Compact'],['clear','Clear'],['cards','Cards'],['minimal','Minimal'],['glass','Glass'],['paper','Paper'],['warm','Warm'],['news','Newspaper'],['dracula','Dracula'],['neonpink','Neon pink'],['darkgrey','Dark grey'],['blackwhite','Black & white'],['amoled','AMOLED'],['aurora','Aurora'],['sunset','Sunset'],['terminal','Terminal']];
  const TICKER_STYLES = [['classic','Classic'],['headlines','Headlines'],['bright','Bright'],['bw','Black & white'],['breaking','Breaking news'],['neon','Neon glow'],['wire','Wire'],['terminal','Terminal'],['gold','Gold'],['gradient','Gradient flow'],['sports','Sports']];
  let inputModel, sourceCache={}, itemCache={}, refreshController=null, refreshGeneration=0;
  let model, helpers = {...(config.helpers||{})}, prefs, digest, mounted, homeMounted, healthState, cleanup = [], tickerInstances = [], refreshTimer, pending = null;
  let collectionId = '', editingWidgetId = '', draggedWidgetId = '', editingFeedId = '';
  const widgetSlides = new Map();
  let builderDraft={url:'',name:'',html:'',mode:'listing',selectors:{item:'article',title:'h2, h3',link:'a[href]',date:'time[datetime]',image:'img',summary:'p'},limit:50,minimumItems:1,sourceId:''},builderPreview=null,discoveredFeeds=[];
  let section = 'latest', query = '', category = '', onlyUnread = false, onlyMedia = false, sourceQuery = '', sourceCategory = '', sourceScope = 'all';
  let fetching = false, lastClientCheck = 0, refreshError = '', storageError = false, slideIndex = 0, slideTimer, touchedAt = 0;
  const normalizeDisplay=raw=>({autoRefresh:raw?.autoRefresh!==false,slideshowAutoplay:raw?.slideshowAutoplay===true,slideshowSeconds:Math.max(3,Math.min(30,Number(raw?.slideshowSeconds)||6))});
  let display = normalizeDisplay({});
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = value => { try { const u=new URL(String(value)); return u.protocol==='https:'&&!u.username&&!u.password ? u.href : ''; } catch (_) { return ''; } };
  const link = (url,label,extra='') => safe(url) ? `<a href="${esc(safe(url))}" target="_blank" rel="noopener noreferrer" data-brand-decorated="true" ${extra}>${label}</a>` : label;
  const ic = name => helpers.icon ? helpers.icon(name) : '';
  const checked = value => value ? ' checked' : '';
  const opts = (list, selected) => list.map(([value,label])=>`<option value="${esc(value)}"${value===selected?' selected':''}>${esc(label)}</option>`).join('');
  function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { storageError=true;return fallback; } }
  function store(key, value) { try { localStorage.setItem(key,JSON.stringify(value));return true; } catch (_) { storageError=true;return false; } }
  function allSources() {const catalog=model?.news?.sources||[],ids=new Set(catalog.map(s=>s.id));return [...catalog,...(prefs?.customSources||[]).filter(source=>!ids.has(source.id))];}
  function sourceMap() { const catalog=model?.news?.sources,custom=prefs?.customSources;if(sourceCache.catalog!==catalog||sourceCache.custom!==custom||!sourceCache.map)sourceCache={catalog,custom,map:new Map(allSources().map(s=>[s.id,s]))};return sourceCache.map; }
  function allItems() {const items=digest?.items,custom=prefs?.customItems,saved=prefs?.savedItems;if(itemCache.items!==items||itemCache.custom!==custom||itemCache.saved!==saved||!itemCache.result)itemCache={items,custom,saved,result:FeedCore.deduplicateItems([...(items||[]),...(custom||[]),...(saved||[])])};return itemCache.result;}
  function normalize() { prefs=FeedCore.normalizePreferences(prefs,model?.news?.sources||[]); }
  function save() { normalize(); store(KEY,prefs);store(UI_KEY,display); }
  function notify(message) { const target=mounted?.querySelector('[data-news-notice]');if(target)target.textContent=message;helpers.notify?.(message); }
  function time(value, detailed=false) { const d=new Date(value);if(!Number.isFinite(d.getTime()))return 'Unknown';return d.toLocaleString(undefined,detailed?{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}:{month:'short',day:'numeric',year:d.getFullYear()!==new Date().getFullYear()?'numeric':undefined}); }
  function relative(value) { const age=Date.now()-Date.parse(value);if(!Number.isFinite(age))return 'unknown';if(age<0)return 'clock mismatch';if(age<60000)return 'just now';if(age<3600000)return `${Math.floor(age/60000)}m ago`;if(age<86400000)return `${Math.floor(age/3600000)}h ago`;return `${Math.floor(age/86400000)}d ago`; }
  function sourceState(source) {
    const original=(digest?.sources||[]).find(row=>row.id===source.id);
    const health=healthState?.sources?.[source.id];
    if(!health||original?.origin==='editorial'||Date.parse(health.attemptedAt||'')<Date.parse(original?.attemptedAt||original?.lastSuccessfulCheckAt||''))return original;
    return {...original,...health,id:source.id,status:['healthy','cached'].includes(health.health)?'ok':'unavailable'};
  }
  function sourceIsStale(state) {const age=Date.now()-Date.parse(state?.lastSuccessfulCheckAt);if(!Number.isFinite(age)||age< -300000)return true;const due=Date.parse(state?.nextAttemptAt);return Number.isFinite(due)?Date.now()>due+15*60000:age>6*3600000;}
  function sourceStatus(source) {
    const state=sourceState(source);
    if(source.custom){const generated=(prefs.feedRecipes||[]).some(r=>r.sourceId===source.id);return {label:generated?'Generated locally':'Imported locally',tone:'neutral',detail:generated?'Refresh the saved extraction recipe in My feeds.':source.feedUrl?'Refresh this custom feed in My feeds.':'Imported from a file. Set its feed URL in My feeds to enable refresh.'};}
    if(state?.origin==='editorial'||(!state&&editorialSourceIds.has(source.id)))return {label:'Editorial snapshot',tone:'neutral',detail:'Selected dated information; open the publisher for current guidance.'};
    if(!state && !source.managed)return {label:'Publisher reference',tone:'neutral',detail:'Available in the directory; no managed feed is connected yet.'};
    if(!state)return {label:'Awaiting first check',tone:'warn',detail:'This feed has no successful refresh recorded yet.'};
    const failed=state.status!=='ok';
    const age=Date.now()-Date.parse(state.lastSuccessfulCheckAt);
    const clockMismatch=Number.isFinite(age)&&age< -300000,stale=sourceIsStale(state);
    const retained=(digest.items||[]).some(item=>item.sourceId===source.id);
    return {label:failed?(state.health==='quarantined'?'Recovery scheduled':retained?'Retained snapshot':'Awaiting usable feed'):clockMismatch?'Clock mismatch':stale?'Check overdue':'Feed available',tone:failed||stale?'warn':'neutral',detail:`Last successful check: ${state.lastSuccessfulCheckAt?time(state.lastSuccessfulCheckAt,true):'unknown'}${state.lastError?' · '+String(state.lastError).slice(0,180):''}${state.nextAttemptAt?' · Next attempt '+time(state.nextAttemptAt,true):''}`};
  }
  function logo(source) { const html=helpers.logo?.(source);return html||`<span class="news-monogram" aria-hidden="true">${esc((source.name||source.id||'?').split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase())}</span>`; }
  function configure(data,h={}) {
    const incoming=data&&data!==model&&data!==inputModel?{...data,news:data.news||data.catalog||{schemaVersion:1,sources:[]},newsDigest:data.newsDigest||data.digest||{schemaVersion:1,items:[],sources:[]}}:null;
    if(incoming){inputModel=data;if(!model)model=incoming;else if(!model.news?.reviewedAt||!incoming.news.reviewedAt||Date.parse(incoming.news.reviewedAt)>=Date.parse(model.news.reviewedAt))model={...model,...incoming};}
    model=model||{};helpers={...helpers,...h};
    if(!prefs) {
      const raw=load(KEY,{});
      const cachedSources=load(SOURCE_CACHE_KEY,null);
      if(validCatalog(cachedSources)&&(!model.news?.reviewedAt||Date.parse(cachedSources.reviewedAt)>=Date.parse(model.news.reviewedAt)))model.news=cachedSources;
      const cachedHealth=load(HEALTH_CACHE_KEY,null);healthState=validHealth(cachedHealth)?cachedHealth:null;
      if(!raw.followedSourceIds)raw.followedSourceIds=config.legacyFollowKey?load(config.legacyFollowKey,[]):[];
      prefs=FeedCore.normalizePreferences(raw,model.news?.sources||[]);
      display=normalizeDisplay(load(UI_KEY,{}));
      digest=model.newsDigest||{schemaVersion:1,items:[],sources:[]};
      const cached=load(CACHE_KEY,null);
      if(validDigest(cached)&&Date.parse(cached.generatedAt)>Date.parse(digest.generatedAt))digest=cached;
    } else if(incoming&&validDigest(incoming.newsDigest)&&Date.parse(incoming.newsDigest.generatedAt)>Date.parse(digest.generatedAt))digest=incoming.newsDigest;
  }
  function validCatalog(value) {
    if(!value||value.schemaVersion!==1||!Array.isArray(value.sources)||value.sources.length>10000)return false;
    const ids=new Set();
    return value.sources.every(source=>{if(!source||typeof source.id!=='string'||!source.id||ids.has(source.id)||typeof source.name!=='string'||!safe(source.url)||(source.feed&&!safe(source.feed)))return false;ids.add(source.id);return true;});
  }
  function validHealth(value) {
    if(!value||value.schemaVersion!==1||!value.sources||typeof value.sources!=='object'||Array.isArray(value.sources))return false;
    const date=Date.parse(value.generatedAt);if(!Number.isFinite(date)||date>Date.now()+300000)return false;
    return Object.values(value.sources).every(s=>s&&typeof s==='object'&&typeof s.health==='string');
  }
  async function readBounded(response,limit=3*1024*1024) {
    const length=Number(response.headers.get('content-length'));if(Number.isFinite(length)&&length>limit)throw new Error('Response exceeded the 3 MB size limit.');
    if(!response.body?.getReader){const text=await response.text();if(text.length>limit)throw new Error('Response exceeded the 3 MB size limit.');return text;}
    const reader=response.body.getReader(),decoder=new TextDecoder();let size=0,result='';
    try { while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>limit){await reader.cancel();throw new Error('Response exceeded the 3 MB size limit.');}result+=decoder.decode(part.value,{stream:true});}return result+decoder.decode(); }
    finally { reader.releaseLock(); }
  }
  function validDigest(value) {
    if(!value||value.schemaVersion!==1||!Array.isArray(value.items)||!Array.isArray(value.sources)||value.items.length>10000)return false;
    const stamp=Date.parse(value.generatedAt);
    if(!Number.isFinite(stamp)||stamp>Date.now()+300000)return false;
    const ids=new Set((model.news?.sources||[]).map(s=>s.id));
    return value.items.every(item=>item&&typeof item.id==='string'&&ids.has(item.sourceId)&&typeof item.title==='string'&&item.title.length<1000&&safe(item.url)&&Array.isArray(item.media)&&item.media.every(m=>m&&['image','audio','video','embed'].includes(m.kind)&&safe(m.url)))&&value.sources.every(s=>s&&ids.has(s.id));
  }
  function selectedItems({savedOnly=false}={}) {
    const map=sourceMap();
    const collection=collectionId?(prefs.collections||[]).find(c=>c.id===collectionId):null;
    const candidates=collection?allItems().filter(item=>collection.itemIds.includes(item.id)):allItems();
    const result=FeedCore.filterItems(candidates,{query,category,sourceIds:savedOnly?undefined:FeedCore.resolveSourceSelection(allSources(),prefs),includeKeywords:prefs.includeKeywords,excludeKeywords:prefs.excludeKeywords,includeRegex:prefs.includeRegex,excludeRegex:prefs.excludeRegex,onlyUnread,savedOnly:savedOnly&&!collection,readIds:prefs.readIds,savedIds:prefs.savedIds,withImagesOnly:onlyMedia,sourceMap:map});
    return FeedCore.rankItems(result,{sort:prefs.sort||'newest',query,sourceMap:map});
  }
  function freshnessBar() {
    const managed=allSources().filter(s=>s.managed||sourceState(s)).map(s=>sourceState(s)||{id:s.id,status:'unavailable'}).filter(s=>s.origin!=='editorial'&&!editorialSourceIds.has(s.id));
    const failed=managed.filter(s=>s.status!=='ok');
    const stale=managed.filter(sourceIsStale);
    const offline=navigator.onLine===false;
    const label=offline?'Offline · saved news':!managed.length?'No managed feeds connected':failed.length?`${failed.length} feed${failed.length===1?'':'s'} recovering`:stale.length?'Some checks are overdue':'Automatic refresh';
    const newest=(digest.items||[]).map(item=>item.publishedAt||item.date).filter(Boolean).sort().at(-1);
    return `<div class="news-freshness${offline||failed.length||stale.length?' has-warning':''}" data-news-health><div><strong>${esc(label)}</strong><span>${managed.length-failed.length}/${managed.length} feeds available · Latest published ${newest?esc(relative(newest)):'unknown'} · Snapshot ${esc(time(digest.generatedAt,true))}</span></div><button class="button" data-news-action="refresh"${fetching?' disabled':''}>${ic('refresh')}${fetching?'Checking…':'Refresh'}</button></div>${refreshError?`<p class="news-inline-warning">${esc(refreshError)}</p>`:''}${storageError?'<p class="news-inline-warning">Storage is unavailable. Changes work for this session; export your preferences to keep them.</p>':''}${pending?'<div class="news-update-banner"><span>A newer snapshot is ready.</span><button class="button" data-news-action="apply-updates">Show updates</button></div>':''}`;
  }
  function tabs() { return `<nav class="news-tabs" aria-label="News sections">${[['latest','Latest'],['sources','Sources'],...(VisualEditorCore?[['dashboard','Dashboard']]:[]),['saved','Saved'],['feeds','My feeds'],['customize','Customize']].map(([id,label])=>`<button type="button" data-news-section="${id}" aria-current="${section===id?'page':'false'}">${id==='saved'?ic('bookmark'):id==='sources'?ic('globe'):''}${label}${id==='saved'?`<span>${prefs.savedIds.length}</span>`:''}</button>`).join('')}</nav>`; }
  function render(data,h={}) {
    if(!FeedCore||!TickerCore)return `<section><h1>${esc(title)}</h1><p>The shared reader could not load. Open a publisher from the source catalog or reload this page.</p></section>`;
    configure(data,h);
    return `<div id="news-workspace" class="news-workspace" data-no-link><header class="news-heading"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="news-heading-actions"><button class="button" data-news-action="export">${ic('download')} Export</button><button class="button" data-news-section="customize">${ic('layers')} Customize</button></div></header><div data-news-freshness>${freshnessBar()}</div>${tabs()}<p class="news-notice" data-news-notice role="status" aria-live="polite"></p><div id="news-content">${content()}</div><p class="news-storage-note">Reading preferences stay on this device. Export/import moves them between your apps; account synchronization is not connected in this reader.</p></div>`;
  }
  function content() {
    if(section==='dashboard')return dashboardContent();
    if(section==='sources')return sourcesContent();
    if(section==='customize')return customizeContent();
    if(section==='feeds')return feedsContent();
    return articlesContent();
  }
  function articleToolbar() { return `<div class="news-reader-toolbar"><label class="news-search-label">Search headlines<input id="news-article-search" type="search" placeholder="Search titles, summaries, sources…" value="${esc(query)}"></label><label>Category<select id="news-article-category">${opts([['','All categories'],...Object.entries(GROUPS)],category)}</select></label><label>View<select id="news-view">${opts(VIEWS,prefs.view)}</select></label><label>Sort<select id="news-sort">${opts([['newest','Newest'],['oldest','Oldest'],['relevance','Relevance'],['source','Source A–Z']],prefs.sort)}</select></label></div><div class="news-reader-flags"><label><input id="news-unread" type="checkbox"${checked(onlyUnread)}> Unread only</label><label><input id="news-group-related" type="checkbox"${checked(prefs.groupRelated)}> Group related headlines</label><label><input id="news-media-only" type="checkbox"${checked(onlyMedia)}> With images</label><label><input id="news-show-images" type="checkbox"${checked(prefs.showImages)}> Load publisher images</label><button class="news-text-button" data-news-action="mark-visible-read">Mark these read</button><button class="news-text-button" data-news-action="clear-filters">Clear filters</button></div>`; }
  function articlesContent() {
    const items=selectedItems({savedOnly:section==='saved'});
    return `${articleToolbar()}<div class="news-results-heading"><h2>${esc(section==='saved'?(collectionId?(prefs.collections||[]).find(c=>c.id===collectionId)?.name||'Collection':'Saved stories'):'Your news')}</h2><span id="news-result-count" aria-live="polite">${items.length} ${items.length===1?'story':'stories'} · ${FeedCore.resolveSourceSelection(allSources(),prefs).size} sources enabled</span><button class="news-text-button" data-news-section="sources">Choose sources ${ic('arrow')}</button></div><div data-news-ticker-slot>${tickerMarkup(items)}</div><div id="news-articles" data-news-style="${esc(prefs.cardStyle||'default')}">${articleLayout(items)}</div>${editorialMarkup()}`;
  }
  function articleLayout(items,grouping=true) {
    const displayView=!grouping&&['carousel','slideshow','ticker'].includes(prefs.view)?'list':prefs.view;
    if(grouping&&prefs.groupRelated&&typeof FeedCore.clusterStories==='function'&&items.length){const clusters=FeedCore.clusterStories(items,{maxItems:3000});return `<div class="news-story-groups"><p class="news-setting-help">Related groups use headline word overlap and publication timing. Every publisher's story is retained; this is not semantic or factual verification. Interactive layouts use lists within each group.</p>${clusters.groups.map(group=>`<section class="news-story-group"><header><h3>${esc(group.title)}</h3><span>${group.items.length} ${group.items.length===1?'story':'stories'} · ${group.sourceIds.length} ${group.sourceIds.length===1?'source':'sources'}</span></header>${articleLayout(group.items,false)}</section>`).join('')}${clusters.limited?'<p class="news-setting-help">Similarity matching is limited to 3,000 stories. Additional stories remain visible individually.</p>':''}</div>`;}

    if(!items.length)return `<div class="news-empty"><h3>${section==='saved'?'Keep a story for later':'No stories match yet'}</h3><p>${section==='saved'?'Use Save on any headline to build your reading list.':'Try another search, clear filters, or enable more sources. Cached stories stay available when a feed is recovering.'}</p><button class="button" data-news-action="clear-filters">Clear filters</button> <button class="button" data-news-section="sources">Choose sources</button></div>`;
    if(displayView==='ticker')return `<div class="news-ticker-reading"><p>All matching headlines are in the strip above. Pause it to read, or choose another view.</p><div class="news-article-grid" data-view="list">${items.map((item,i)=>articleCard(item,i,displayView)).join('')}</div></div>`;
    const carousel=displayView==='carousel'||displayView==='slideshow';
    if(displayView==='slideshow')slideIndex=Math.min(slideIndex,items.length-1);
    return `${carousel?`<div class="news-carousel-controls"><button class="button" data-news-action="previous" aria-label="Previous story">${ic('back')} Previous</button><span data-slide-position>${displayView==='slideshow'?`${slideIndex+1} / ${items.length}`:'Scroll or use the arrows'}</span><button class="button" data-news-action="next" aria-label="Next story">Next ${ic('arrow')}</button>${displayView==='slideshow'?`<button class="button" data-news-action="slideshow-pause">${display.slideshowAutoplay?'Pause slideshow':'Play slideshow'}</button>`:''}</div>`:''}<div class="news-article-grid" data-view="${esc(displayView)}" data-density="${esc(prefs.density||'comfortable')}" style="--news-columns:${Math.max(1,Math.min(4,Number(prefs.columns)||3))}" ${carousel?'tabindex="0" aria-label="News stories"':''}>${items.map((item,i)=>articleCard(item,i,displayView)).join('')}</div>`;
  }
  function articleCard(item,index,view=prefs.view) {
    const source=sourceMap().get(item.sourceId)||{name:item.sourceId,id:item.sourceId};
    const state=sourceStatus(source);
    const isRead=prefs.readIds.includes(item.id),isSaved=prefs.savedIds.includes(item.id);
    const media=(item.media||[]).filter(m=>safe(m.url));
    const image=media.find(m=>m.kind==='image');
    const showMedia=prefs.showImages&&image;
    const date=item.publishedAt||item.date;
    return `<article class="news-article${isRead?' is-read':''}" data-news-item="${esc(item.id)}" data-slide-index="${index}"${view==='slideshow'&&index!==slideIndex?' hidden':''}><div class="news-article-cover${showMedia?' has-image':''}">${showMedia?`<img src="${esc(image.url)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:`<div class="news-cover-source">${logo(source)}<span>${esc(GROUPS[source.category]||'Publisher')}</span></div>`}<span class="news-cover-kind">${esc(GROUPS[source.category]||'News')}</span></div><div class="news-article-body"><div class="news-article-byline">${logo(source)}${link(source.url,esc(source.name))}<time datetime="${esc(date||'')}" title="${esc(date?time(date,true):'Publisher date unknown')}">${esc(date?relative(date):'Date unknown')}</time></div><h3>${link(item.url,esc(item.title),`data-news-open="${esc(item.id)}"`)}</h3>${prefs.showSummary!==false&&item.summary?`<p class="news-article-summary">${esc(item.summary)}</p>`:''}<p class="news-source-freshness ${state.tone==='warn'?'news-warning-text':''}" title="${esc(state.detail)}">${esc(state.label)}${sourceState(source)?.lastSuccessfulCheckAt?` · checked ${esc(relative(sourceState(source).lastSuccessfulCheckAt))}`:''}</p><div class="news-article-actions"><button class="news-text-button" data-news-save="${esc(item.id)}" aria-pressed="${isSaved}" aria-label="${isSaved?'Unsave':'Save'} ${esc(item.title)}">${ic('bookmark')}${isSaved?'Saved':'Save'}</button><button class="news-text-button" data-news-read="${esc(item.id)}" aria-pressed="${isRead}">${ic('check')}${isRead?'Read':'Mark read'}</button>${media.length?`<button class="news-text-button" data-news-media="${esc(item.id)}">${ic('external')}Media (${media.length})</button>`:''}</div><div class="news-media-links" data-media-for="${esc(item.id)}" hidden>${media.map((m,i)=>link(m.url,`Open ${esc(m.kind)}${media.length>1?' '+(i+1):''}`)).join(' · ')}</div></div></article>`;
  }
  function editorialMarkup() {
    const rows=model.news?.briefing||[];
    if(!rows.length)return '';
    return `<details class="news-editorial"><summary>Dated editorial selections <span>${rows.length}</span></summary><p>These are selected reference articles, separate from automatically refreshed publisher feeds.</p>${rows.map(item=>`<article><time datetime="${esc(item.date)}">${esc(time(item.date))}</time><h3>${link(item.url,esc(item.title))}</h3><p>${esc(item.description)}</p></article>`).join('')}</details>`;
  }
  function tickerMarkup(items,home=false) {
    if(prefs.ticker?.enabled===false||!items.length)return '';
    const t=prefs.ticker||{};
    const accent=/^#[a-fA-F0-9]{6}$/.test(t.accent||'')?t.accent:'#497fcf';
    const label=String(t.label||'NEWS').slice(0,40);
    const content=items.map(item=>{const img=t.images&&(item.media||[]).find(m=>m.kind==='image'&&safe(m.url));return `<span class="news-ticker-item">${img?`<img src="${esc(img.url)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:''}${link(item.url,esc(item.title),`data-news-open="${esc(item.id)}"`)}${t.showDate!==false?`<span class="news-ticker-date">${esc(item.date?time(item.date):'')}</span>`:''}</span>`;}).join('<span class="news-ticker-separator" aria-hidden="true">•</span>');
    return `<section class="news-ticker-shell" aria-label="Recent news headlines" data-ticker-style="${esc(prefs.ticker.style||'classic')}" style="--ticker-accent:${accent};${/^#[a-fA-F0-9]{6}$/.test(t.headlineColor||'')?'--ticker-ink:'+t.headlineColor+';':''}--ticker-font:${Math.max(12,Math.min(26,Number(t.fontSize)||14))}px"><div class="news-ticker-label" data-shape="${esc(t.badgeShape||'wedge')}">${esc(label)}</div><div class="news-ticker-viewport" tabindex="0" aria-label="Scrolling headlines. Focus pauses motion."><div class="news-ticker-track"><div class="news-ticker-segment">${content}</div></div></div><button type="button" class="news-ticker-pause" data-news-action="ticker-pause" aria-label="${t.paused?'Play':'Pause'} news ticker">${t.paused?'Play':'Pause'}</button>${home?`<a href="${esc(config.route||'#news')}" class="news-ticker-all">All ${esc(title.toLocaleLowerCase())}</a>`:''}</section>`;
  }
  function renderHomeTicker(data,h={}) {
    if(!FeedCore||!TickerCore)return '';
    configure(data,h);
    const items=FeedCore.rankItems(FeedCore.filterItems(allItems(),{sourceIds:FeedCore.resolveSourceSelection(allSources(),prefs),includeKeywords:prefs.includeKeywords,excludeKeywords:prefs.excludeKeywords,includeRegex:prefs.includeRegex,excludeRegex:prefs.excludeRegex}),{sort:'newest'});
    const recovering=allSources().some(source=>source.managed&&sourceState(source)?.status!=='ok');
    return `<section id="news-home-strip" class="news-home-strip" data-no-link><div class="news-home-title"><h2><a href="${esc(config.route||'#news')}">${esc(title)}</a></h2><span>${navigator.onLine===false?'Offline · ':''}Publisher snapshot ${esc(time(digest.generatedAt,true))}${Date.now()-Date.parse(digest.generatedAt)>6*3600000?' · Last saved headlines':''}${recovering?' · Some feeds recovering':''}</span><a href="${esc(config.route||'#news')}">Choose sources ${ic('arrow')}</a></div>${tickerMarkup(items,true)||`<p>Enable sources to see headlines here. <a href="${esc(config.route||'#news')}">Open ${esc(title)}</a></p>`}</section>`;
  }
  function sourcesContent() {
    return `<header class="news-section-heading"><div><h2>Make it your news</h2><p>Curated feeds start enabled. Your choices always take priority.</p></div><div class="news-view-switch" aria-label="Source view"><button data-news-source-view="gallery" aria-pressed="${prefs.sourceView!=='list'}">${ic('grid')}Gallery</button><button data-news-source-view="list" aria-pressed="${prefs.sourceView==='list'}">${ic('list')}List</button></div></header><div class="news-reader-toolbar"><label class="news-search-label">Search sources<input id="news-source-search" type="search" placeholder="Search publishers, subjects, websites…" value="${esc(sourceQuery)}"></label><label>Category<select id="news-source-category">${opts([['','All categories'],...Object.entries(GROUPS)],sourceCategory)}</select></label><label>Show<select id="news-source-scope">${opts([['all','All sources'],['enabled','Enabled feeds'],['recommended','Recommended'],['followed','Saved sources'],['attention','Needs attention']],sourceScope)}</select></label></div><div class="news-source-toolbar"><p id="news-source-count" aria-live="polite"></p><button class="news-text-button" data-news-action="enable-recommended">Enable recommended feeds</button><button class="news-text-button" data-news-action="reset-sources">Reset source choices</button></div><div id="news-directory" class="news-source-directory" data-view="${prefs.sourceView==='list'?'list':'gallery'}">${sourceCards()}</div>`;
  }
  function matchingSources() {
    const terms=sourceQuery.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return allSources().filter(s=>(!sourceCategory||s.category===sourceCategory)&&terms.every(t=>[s.name,s.description,s.url,GROUPS[s.category]].join(' ').toLocaleLowerCase().includes(t))&&(sourceScope!=='enabled'||FeedCore.sourceEnabled(s,prefs))&&(sourceScope!=='recommended'||s.recommended===true||s.defaultEnabled===true)&&(sourceScope!=='followed'||prefs.followedSourceIds.includes(s.id))&&(sourceScope!=='attention'||sourceStatus(s).tone==='warn'));
  }
  function sourceCards() {
    const rows=matchingSources();
    return rows.map(source=>{
      const enabled=FeedCore.sourceEnabled(source,prefs),followed=prefs.followedSourceIds.includes(source.id),state=sourceStatus(source);
      const capable=source.managed===true||source.custom===true||!!sourceState(source);
      const recent=(digest.items||[]).filter(x=>x.sourceId===source.id).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
      return `<article class="news-source-card${enabled?' is-enabled':''}" data-news-source="${esc(source.id)}"><div class="news-source-card-top">${logo(source)}<span class="news-source-category">${esc(GROUPS[source.category]||'News')}</span>${source.recommended||source.defaultEnabled?'<span class="news-recommended">Recommended</span>':''}</div><div class="news-source-description"><h3>${link(source.url,esc(source.name))}</h3><p>${esc(source.description||'Your custom feed.')}</p></div><div class="news-source-health ${state.tone==='warn'?'needs-attention':''}" title="${esc(state.detail)}"><span>${esc(state.label)}</span><small>${sourceState(source)?.lastSuccessfulCheckAt?`Checked ${esc(relative(sourceState(source).lastSuccessfulCheckAt))}`:capable?'No successful check recorded':'Open publisher for updates'}</small></div>${recent?`<p class="news-source-latest">Latest: ${link(recent.url,esc(recent.title))}</p>`:''}<div class="news-source-actions">${capable?`<label class="news-toggle"><input type="checkbox" data-news-enable="${esc(source.id)}"${checked(enabled)}><span>${enabled?'Enabled':'Enable feed'}</span></label>`:link(source.url,'Open publisher')}<button class="news-text-button" data-news-follow="${esc(source.id)}" aria-pressed="${followed}" aria-label="${followed?'Unsave':'Save'} source ${esc(source.name)}">${ic('bookmark')}${followed?'Saved':'Save source'}</button>${(source.feed||source.feedUrl)?link(source.feed||source.feedUrl,'Feed'):''}</div></article>`;
    }).join('')||'<div class="news-empty"><h3>No sources match</h3><p>Try a different name or category.</p><button class="button" data-news-action="clear-source-filters">Clear source filters</button></div>';
  }
  function currentDashboard(create=true) {
    if(!VisualEditorCore)return null;
    const dashboards=prefs.dashboards||[];
    let dashboard=dashboards.find(d=>d.id===prefs.activeDashboardId)||dashboards[0];
    if(!dashboard&&create){dashboard=VisualEditorCore.normalizeDashboard({id:'dashboard-main',name:'My dashboard',widgets:config.defaultWidgets||[{id:'latest',title:'Latest headlines',view:'list',limit:6,span:1}]});prefs.dashboards=[dashboard];prefs.activeDashboardId=dashboard.id;save();}
    return dashboard;
  }
  function saveDashboard(dashboard) { prefs.dashboards=(prefs.dashboards||[]).map(d=>d.id===dashboard.id?dashboard:d);prefs.activeDashboardId=dashboard.id;save(); }
  function dashboardItems(widget) {
    const enabled=FeedCore.resolveSourceSelection(allSources(),prefs),ids=widget.sourceIds?.length?new Set(widget.sourceIds.filter(id=>enabled.has(id))):enabled;
    return FeedCore.rankItems(FeedCore.filterItems(allItems(),{sourceIds:ids,query:widget.query,category:widget.category,includeKeywords:prefs.includeKeywords,excludeKeywords:prefs.excludeKeywords,includeRegex:prefs.includeRegex,excludeRegex:prefs.excludeRegex,sourceMap:sourceMap()}),{sort:prefs.sort,query:widget.query,sourceMap:sourceMap()}).slice(0,widget.limit||8);
  }
  function dashboardContent() {
    const dashboard=currentDashboard();if(!dashboard)return '<p>The shared visual editor could not load.</p>';
    const editing=dashboard.widgets.find(w=>w.id===editingWidgetId);
    return `<header class="news-section-heading"><div><h2>Your dashboard</h2><p>Arrange independent views. Drag their handles or use Move earlier and Move later.</p></div><button class="button" data-news-action="add-widget">Add a view</button></header><div class="news-dashboard-toolbar"><label>Dashboard<select id="news-dashboard-select">${opts((prefs.dashboards||[]).map(d=>[d.id,d.name]),dashboard.id)}</select></label><label>Name<input id="news-dashboard-name" maxlength="80" value="${esc(dashboard.name)}"></label><button class="news-text-button" data-news-action="new-dashboard">New dashboard</button><button class="news-text-button" data-news-action="delete-dashboard">Delete dashboard</button></div>${editing?widgetEditor(editing):''}<div class="news-dashboard-grid" data-news-style="${esc(prefs.cardStyle)}">${dashboard.widgets.map((w,index)=>dashboardWidget(w,index,dashboard.widgets.length)).join('')||'<div class="news-empty"><h3>A space for your news</h3><p>Add a view, choose its sources and filters, and arrange it here.</p><button class="button" data-news-action="add-widget">Add a view</button></div>'}</div>`;
  }
  function dashboardWidget(widget,index,total) {
    const items=dashboardItems(widget),isSlide=widget.view==='slideshow';
    const current=Math.min(widgetSlides.get(widget.id)||0,Math.max(0,items.length-1));
    const visible=isSlide?items.slice(current,current+1):items;
    return `<section class="news-dashboard-widget" data-widget-id="${esc(widget.id)}" data-span="${widget.span===2?'2':'1'}"><header><button type="button" class="news-widget-handle" draggable="true" data-widget-drag="${esc(widget.id)}" aria-label="Drag ${esc(widget.title)} to reorder" title="Drag to reorder">${ic('grid')||'↕'}</button><div><h3>${esc(widget.title)}</h3><span>${items.length} stories${widget.query?' · '+esc(widget.query):''}</span></div><button class="news-text-button" data-widget-edit="${esc(widget.id)}">Edit</button></header><div class="news-widget-order"><button class="news-text-button" data-widget-move="${esc(widget.id)}" data-offset="-1"${index===0?' disabled':''}>Move earlier</button><button class="news-text-button" data-widget-move="${esc(widget.id)}" data-offset="1"${index===total-1?' disabled':''}>Move later</button></div>${widget.view==='ticker'?tickerMarkup(items):!items.length?'<p class="news-widget-empty">No matching stories. Edit this view or enable more sources.</p>':`<div class="news-article-grid" data-view="${esc(widget.view)}" style="--news-columns:${widget.span===2?3:2}">${visible.map((item,i)=>articleCard(item,i,widget.view==='slideshow'?'gallery':widget.view)).join('')}</div>`}${['carousel','slideshow'].includes(widget.view)&&items.length?`<div class="news-carousel-controls"><button class="news-text-button" data-widget-slide="${esc(widget.id)}" data-offset="-1">Previous</button><span>${isSlide?`${current+1} / ${items.length}`:'Scroll to explore'}</span><button class="news-text-button" data-widget-slide="${esc(widget.id)}" data-offset="1">Next</button></div>`:''}</section>`;
  }
  function widgetEditor(widget) {
    return `<section class="news-widget-editor"><header><h3>Edit view</h3><button class="news-text-button" data-news-action="close-widget-editor">Done</button></header><div class="news-settings-grid"><label>Title<input data-widget-field="title" maxlength="80" value="${esc(widget.title)}"></label><label>Layout<select data-widget-field="view">${opts(VIEWS,widget.view)}</select></label><label>Find words<input data-widget-field="query" value="${esc(widget.query||'')}" placeholder="Optional search within this view"></label><label>Category<select data-widget-field="category">${opts([['','All categories'],...Object.entries(GROUPS)],widget.category||'')}</select></label><label>Stories<input data-widget-field="limit" type="number" min="1" max="100" value="${widget.limit||8}"></label><label>Width<select data-widget-field="span">${opts([['1','One column'],['2','Full width']],String(widget.span||1))}</select></label><label class="news-widget-sources">Sources<select data-widget-field="sourceIds" multiple size="5" aria-describedby="news-widget-sources-help">${allSources().filter(s=>s.managed||s.custom||sourceState(s)).map(s=>`<option value="${esc(s.id)}"${widget.sourceIds?.includes(s.id)?' selected':''}>${esc(s.name)}</option>`).join('')}</select><span id="news-widget-sources-help" class="news-setting-help">No selection uses every enabled source. Disabled sources remain excluded.</span></label></div><div class="news-button-row"><button class="button" data-news-action="save-widget">Apply changes</button><button class="news-text-button" data-widget-delete="${esc(widget.id)}">Remove view</button></div></section>`;
  }
  function moveWidget(id,index) { const dashboard=currentDashboard();if(!dashboard)return;saveDashboard(VisualEditorCore.moveWidget(dashboard,id,index));updateContent();notify('Dashboard order saved.');mounted?.querySelector(`[data-widget-edit="${CSS.escape(id)}"]`)?.focus(); }
  function onDragStart(event) { const handle=event.target.closest('[data-widget-drag]');if(!handle)return;draggedWidgetId=handle.dataset.widgetDrag;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',draggedWidgetId); }
  function onDragOver(event) { if(draggedWidgetId&&event.target.closest('[data-widget-id]')){event.preventDefault();event.dataTransfer.dropEffect='move';} }
  function onDrop(event) { const target=event.target.closest('[data-widget-id]');if(!draggedWidgetId||!target)return;event.preventDefault();const dashboard=currentDashboard(),index=dashboard.widgets.findIndex(w=>w.id===target.dataset.widgetId);moveWidget(draggedWidgetId,index);draggedWidgetId=''; }
  function customizeContent() {
    const t=prefs.ticker||{};
    return `<header class="news-section-heading"><div><h2>A reader that fits you</h2><p>Changes apply immediately to News and your homepage strip.</p></div><button class="button" data-news-action="preview">Preview news ${ic('arrow')}</button></header><div class="news-settings-grid"><section class="news-settings-panel"><h3>Reading view</h3><label>Layout<select data-news-setting="view">${opts(VIEWS,prefs.view)}</select></label><label>Card appearance<select data-news-setting="cardStyle">${opts(STYLES,prefs.cardStyle)}</select></label><label>Columns<input data-news-setting="columns" type="range" min="1" max="4" value="${prefs.columns||3}"><output>${prefs.columns||3}</output></label><label>Density<select data-news-setting="density">${opts([['comfortable','Comfortable'],['compact','Compact']],prefs.density)}</select></label><label class="news-check"><input type="checkbox" data-news-setting="showImages"${checked(prefs.showImages)}> Load publisher images</label><label class="news-check"><input type="checkbox" data-news-setting="showSummary"${checked(prefs.showSummary!==false)}> Show available summaries</label><label class="news-check"><input type="checkbox" data-display-setting="autoRefresh"${checked(display.autoRefresh)}> Check for fresh news automatically</label><p class="news-setting-help">Images load from publishers when enabled. Headlines and settings remain usable offline.</p></section><section class="news-settings-panel"><h3>News strip</h3><label class="news-check"><input type="checkbox" data-ticker-setting="enabled"${checked(t.enabled!==false)}> Show on News and Home</label><label>Style<select data-ticker-setting="style">${opts(TICKER_STYLES,prefs.ticker.style)}</select></label><label>Headline badge<input type="text" data-ticker-setting="label" maxlength="40" value="${esc(t.label||'NEWS')}"></label><label>Speed (pixels / second)<input type="range" data-ticker-setting="speedPxPerSec" min="0" max="180" step="2" value="${t.speedPxPerSec??40}"><output>${t.speedPxPerSec??40}</output></label><label>Direction<select data-ticker-setting="direction">${opts([['left','Left'],['right','Right']],t.direction||'left')}</select></label><label>Badge shape<select data-ticker-setting="badgeShape">${opts([['wedge','Wedge'],['rectangle','Rectangle'],['rounded','Rounded'],['pill','Pill'],['circle','Circle']],t.badgeShape||'wedge')}</select></label><label>Accent color<input type="color" data-ticker-setting="accent" value="${esc(t.accent||'#497fcf')}"></label><label>Headline color<input type="color" data-ticker-setting="headlineColor" value="${esc(t.headlineColor||'#d8dfe9')}"></label><button class="news-text-button" data-news-action="reset-ticker-color">Use theme text color</button><label class="news-check"><input type="checkbox" data-ticker-setting="images"${checked(t.images)}> Load strip thumbnails</label><label class="news-check"><input type="checkbox" data-ticker-setting="showDate"${checked(t.showDate!==false)}> Show publication dates</label><label class="news-check"><input type="checkbox" data-ticker-setting="pauseOnHover"${checked(t.pauseOnHover!==false)}> Pause while hovered</label><label>Text size<input type="range" data-ticker-setting="fontSize" min="12" max="26" value="${t.fontSize||14}"><output>${t.fontSize||14}px</output></label><label>Motion<select data-ticker-setting="motion">${opts([['system','Respect device preference'],['off','No motion']],t.motion==='off'?'off':'system')}</select></label></section><section class="news-settings-panel"><h3>Content filters</h3><label>Include words or phrases<textarea data-news-words="includeKeywords" rows="3" placeholder="One per line. Any matching phrase is included.">${esc((prefs.includeKeywords||[]).join('\n'))}</textarea></label><label>Exclude words or phrases<textarea data-news-words="excludeKeywords" rows="3" placeholder="One per line">${esc((prefs.excludeKeywords||[]).join('\n'))}</textarea></label><label>Include patterns<textarea data-news-words="includeRegex" rows="2" placeholder="Simple regular expressions, one per line">${esc((prefs.includeRegex||[]).join('\n'))}</textarea></label><label>Exclude patterns<textarea data-news-words="excludeRegex" rows="2" placeholder="Simple regular expressions, one per line">${esc((prefs.excludeRegex||[]).join('\n'))}</textarea></label><p class="news-setting-help">Complex or unsafe patterns are rejected. Use plain phrases for predictable filtering.</p><button class="button" data-news-action="apply-filters">Apply filters</button></section><section class="news-settings-panel"><h3>Presets & portability</h3><label>Preset name<input id="news-preset-name" type="text" maxlength="60" placeholder="My morning briefing"></label><button class="button" data-news-action="save-preset">Save current preset</button><div class="news-preset-list">${(prefs.presets||[]).map(p=>`<div><span>${esc(p.name)}</span><button class="news-text-button" data-preset-apply="${esc(p.id)}">Apply</button><button class="news-text-button" data-preset-delete="${esc(p.id)}">Delete</button></div>`).join('')||'<p>No presets saved yet.</p>'}</div><div class="news-button-row"><button class="button" data-news-action="export">Export preferences</button><label class="button news-file-label">Import preferences<input type="file" data-news-import="preferences" accept="application/json,.json"></label></div><label>Slideshow seconds<input type="range" data-display-setting="slideshowSeconds" min="3" max="30" value="${display.slideshowSeconds}"><output>${display.slideshowSeconds}s</output></label><p class="news-setting-help">Exports include source choices, saved stories, local feed URLs, dashboards and extraction recipes. Account services are not connected.</p></section></div><div class="news-settings-preview"><h3>Strip preview</h3>${tickerMarkup(selectedItems())}</div>`;
  }
  function feedsContent() {
    return `<header class="news-section-heading"><div><h2>My feeds</h2><p>Bring your own RSS, Atom or JSON Feed. Keep saved views and local collections together.</p></div></header><div class="news-settings-grid"><section class="news-settings-panel"><h3>Add a feed</h3><label>Feed URL<input id="news-custom-url" type="url" placeholder="https://publisher.example/feed.xml"></label><div class="news-button-row"><button class="button" data-news-action="fetch-custom">Fetch feed</button><label class="button news-file-label">Import feed file<input type="file" data-news-import="feed" accept=".xml,.rss,.atom,.json,application/json,application/xml,text/xml"></label></div><label>Or paste a feed<textarea id="news-custom-text" rows="6" placeholder="Paste RSS, Atom or JSON Feed content"></textarea></label><button class="button" data-news-action="import-feed">Add pasted feed</button><p class="news-setting-help">Browser fetches require the publisher to allow cross-origin access. If blocked, import a downloaded feed file. Imported feeds are local; no server-side subscription is created.</p><div class="news-custom-feeds">${(prefs.customSources||[]).map(s=>`<div><strong>${esc(s.name)}</strong>${link(s.url,'Publisher')}${s.feedUrl||(prefs.feedRecipes||[]).some(r=>r.sourceId===s.id)?`<button class="news-text-button" data-custom-refresh="${esc(s.id)}">Refresh</button>`:'<span>Local import</span>'}${!(prefs.feedRecipes||[]).some(r=>r.sourceId===s.id)?`<button class="news-text-button" data-custom-url="${esc(s.id)}">${s.feedUrl?'Change feed URL':'Set feed URL'}</button>`:''}${(prefs.feedRecipes||[]).some(r=>r.sourceId===s.id)?`<button class="news-text-button" data-recipe-edit="${esc(s.id)}">Edit extraction</button>`:''}<button class="news-text-button" data-custom-delete="${esc(s.id)}">Remove</button></div>`).join('')}</div>${editingFeedId?`<div class="news-custom-url-editor"><label>Actual RSS, Atom or JSON Feed URL<input id="news-custom-edit-url" type="url" value="${esc(prefs.customSources.find(source=>source.id===editingFeedId)?.feedUrl||'')}" placeholder="https://publisher.example/feed.xml"></label><button class="button" data-news-action="save-custom-url">Save and refresh feed</button></div>`:''}</section><section class="news-settings-panel"><h3>Bundles</h3><p>Save the current selection of enabled sources as a reusable bundle.</p><label>Bundle name<input id="news-bundle-name" type="text" maxlength="60" placeholder="Security and releases"></label><button class="button" data-news-action="save-bundle">Save enabled sources</button><div class="news-preset-list">${(prefs.bundles||[]).map(b=>`<div><span>${esc(b.name)} · ${(b.sourceIds||[]).length} sources</span><button class="news-text-button" data-bundle-apply="${esc(b.id)}">Apply</button><button class="news-text-button" data-bundle-delete="${esc(b.id)}">Delete</button></div>`).join('')||'<p>No bundles saved.</p>'}</div><h3>Collections</h3><label>Collection name<input id="news-collection-name" type="text" maxlength="60" placeholder="Read this weekend"></label><button class="button" data-news-action="save-collection">Collect saved stories</button><div class="news-preset-list">${(prefs.collections||[]).map(c=>`<div><span>${esc(c.name)} · ${(c.itemIds||[]).length} stories</span><button class="news-text-button" data-collection-open="${esc(c.id)}">Open</button><button class="news-text-button" data-collection-delete="${esc(c.id)}">Delete</button></div>`).join('')||'<p>No collections saved.</p>'}</div><label>Feed export format<select id="news-export-format">${opts([['json','JSON Feed'],['rss','RSS 2.0'],['atom','Atom']],'json')}</select></label><button class="button" data-news-action="export-feed">Export current filtered feed</button></section></div>${builderContent()}`;
  }
  function builderContent() {
    if(!FeedGenerationCore||!ContentExtractionCore)return '';
    const recipe=builderDraft;
    const diagnostics=[...(builderPreview?.diagnostics||[]),...(builderPreview?.validation?.errors||[]),...(builderPreview?.validation?.warnings||[])].filter((entry,index,rows)=>rows.findIndex(other=>(other.code||'')===(entry.code||'')&&(other.message||other)===(entry.message||entry))===index);
    return `<section class="news-builder"><header class="news-section-heading"><div><h2>Build a feed from a website</h2><p>Discover published feeds or extract a repeatable list of articles. Review the preview before saving.</p></div></header><div class="news-settings-grid"><section class="news-settings-panel"><h3>Source page</h3><label>Public page URL<input id="news-builder-url" type="url" value="${esc(recipe.url)}" placeholder="https://publisher.example/news"></label><label>Feed name<input id="news-builder-name" maxlength="100" value="${esc(recipe.name)}" placeholder="My website feed"></label><div class="news-button-row"><button class="button" data-news-action="fetch-page">Fetch page</button><label class="button news-file-label">Import HTML file<input type="file" data-news-import="html" accept=".html,.htm,text/html"></label></div><label>Page HTML<textarea id="news-builder-html" rows="7" spellcheck="false" placeholder="Paste the HTML of the public page">${esc(recipe.html)}</textarea></label><button class="button" data-news-action="discover-feeds">Discover published feeds</button>${discoveredFeeds.length?`<div class="news-discovered-feeds">${discoveredFeeds.map(feed=>`<div><span>${esc(feed.title||feed.type||'Published feed')}</span>${link(feed.url||feed.feedUrl,esc(feed.url||feed.feedUrl))}<button class="news-text-button" data-discovered-feed="${esc(feed.url||feed.feedUrl)}">Add feed</button></div>`).join('')}</div>`:''}<p class="news-setting-help">Public fetches need the publisher's cross-origin permission. Pasted or imported HTML works offline. Source scripts are never run, and no authenticated session is used.</p></section><section class="news-settings-panel"><h3>Extraction recipe</h3><label>Mode<select id="news-builder-mode">${opts([['listing','List of articles'],['article','Single article']],recipe.mode)}</select></label><div class="news-selector-grid">${[['item','Article container'],['title','Title'],['link','Article link'],['date','Publication date'],['image','Image'],['summary','Summary']].map(([key,label])=>`<label>${label}<input data-news-selector="${key}" value="${esc(recipe.selectors[key]||'')}" placeholder="CSS selector"></label>`).join('')}</div><div class="news-selector-grid"><label>Maximum stories<input id="news-builder-limit" type="number" min="1" max="200" value="${recipe.limit}"></label><label>Minimum expected<input id="news-builder-minimum" type="number" min="1" max="200" value="${recipe.minimumItems}"></label></div><p class="news-setting-help">Selectors operate inside each article container. Dates stay unknown when the publisher provides no date; preview warnings help detect a changed page structure.</p><div class="news-button-row"><button class="button" data-news-action="preview-extraction">Preview extraction</button><button class="button" data-news-action="save-generated"${!builderPreview?.validation?.ok?' disabled':''}>Save generated feed</button></div><div class="news-button-row"><button class="news-text-button" data-news-action="export-recipe">Export recipe</button><label class="button news-file-label">Import recipe<input type="file" data-news-import="recipe" accept=".json,application/json"></label></div></section></div>${builderPreview?`<section class="news-extraction-preview"><header><h3>Extraction preview</h3><span>${builderPreview.items?.length||0} stories · ${builderPreview.validation?.ok?'Ready to save':'Review required'}</span></header>${diagnostics.length?`<ul class="news-extraction-diagnostics">${diagnostics.map(row=>`<li>${esc(typeof row==='string'?row:row.message||row.code)}</li>`).join('')}</ul>`:''}<div class="news-extraction-list">${(builderPreview.items||[]).slice(0,30).map(item=>`<article><h4>${link(item.url,esc(item.title))}</h4><p>${esc(item.summary||'No summary extracted.')}</p><small>${item.date?esc(time(item.date,true)):'Publication date unknown'}</small></article>`).join('')||'<p>No usable articles were found. Check the article container and link selectors.</p>'}</div></section>`:''}</section>`;
  }
  function readBuilderForm() {
    if(!mounted?.querySelector('#news-builder-url'))return;
    builderDraft={...builderDraft,url:mounted.querySelector('#news-builder-url').value.trim(),name:mounted.querySelector('#news-builder-name').value.trim(),html:mounted.querySelector('#news-builder-html').value,mode:mounted.querySelector('#news-builder-mode').value,limit:Number(mounted.querySelector('#news-builder-limit').value),minimumItems:Number(mounted.querySelector('#news-builder-minimum').value),selectors:Object.fromEntries([...mounted.querySelectorAll('[data-news-selector]')].map(field=>[field.dataset.newsSelector,field.value.trim()]))};
  }
  function builderRecipe() {
    if(!safe(builderDraft.url))throw new Error('Enter the public HTTPS page URL so article links resolve correctly.');
    if(!builderDraft.sourceId||((model.news?.sources||[]).some(source=>source.id===builderDraft.sourceId)))builderDraft.sourceId='custom-site-'+Date.now().toString(36);
    return FeedGenerationCore.normalizeRecipe({schemaVersion:1,sourceId:builderDraft.sourceId,sourceName:builderDraft.name||new URL(builderDraft.url).hostname,baseUrl:builderDraft.url,category:'custom',mode:builderDraft.mode,selectors:builderDraft.selectors,limit:builderDraft.limit,minimumItems:builderDraft.minimumItems});
  }
  function previewExtraction() { readBuilderForm();if(!builderDraft.html.trim())throw new Error('Fetch, paste or import a source page first.');if(builderDraft.html.length>3*1024*1024)throw new Error('Source HTML exceeds the 3 MB limit.');builderPreview=FeedGenerationCore.generate(builderDraft.html,builderRecipe(),{baseUrl:builderDraft.url,DOMParser:root.DOMParser});updateContent();return builderPreview; }
  async function fetchPublicText(url) {
    if(!safe(url))throw new Error('Enter a public HTTPS page URL.');
    const parsed=new URL(url);if(/^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|\[|0\.)/.test(parsed.hostname)||/\.(local|localhost|internal)$/.test(parsed.hostname))throw new Error('Use a public publisher URL.');
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);
    try{const response=await fetch(url,{credentials:'omit',signal:ctl.signal,mode:'cors',referrerPolicy:'no-referrer'});if(!response.ok)throw new Error('Publisher returned HTTP '+response.status);return await readBounded(response);}
    catch(error){throw new Error(`Page fetch unavailable (${error.name==='AbortError'?'request timed out':error.message}). Import or paste the page HTML if cross-origin access is blocked.`);}
    finally{clearTimeout(timer);}
  }
  function persistGenerated(result) {
    if(!result.validation?.ok)throw new Error('The preview did not pass the recipe checks. Review its warnings before saving.');
    const source={...result.source,id:result.recipe.sourceId,name:result.recipe.sourceName,url:result.recipe.baseUrl,feedUrl:'',custom:true,defaultEnabled:true,category:'custom'};
    prefs.customSources=[...(prefs.customSources||[]).filter(s=>s.id!==source.id),source];
    prefs.customItems=FeedCore.deduplicateItems([...(prefs.customItems||[]).filter(item=>item.sourceId!==source.id),...result.items]);
    prefs.feedRecipes=[...(prefs.feedRecipes||[]).filter(r=>r.sourceId!==source.id),{id:'recipe-'+source.id,sourceId:source.id,name:source.name,recipe:result.recipe}];
    prefs.sourceOverrides={...prefs.sourceOverrides,[source.id]:true};save();updateContent();notify(`Saved ${result.items.length} extracted stories. Use Refresh in My feeds to check this page again.`);
  }
  async function refreshGenerated(record) { const html=await fetchPublicText(record.recipe.baseUrl);const result=FeedGenerationCore.generate(html,record.recipe,{baseUrl:record.recipe.baseUrl,DOMParser:root.DOMParser,baseline:FeedGenerationCore.createBaseline({items:(prefs.customItems||[]).filter(item=>item.sourceId===record.sourceId)})});if(!result.validation?.ok)throw new Error('The source page no longer passes its saved recipe checks. Keeping the last good articles; edit the extraction to review the page.');persistGenerated(result); }
  function updateContent({focusId}={}) {
    if(!mounted)return;
    disposeTickers();clearInterval(slideTimer);
    mounted.querySelector('#news-content').innerHTML=content();
    mounted.querySelector('.news-tabs').outerHTML=tabs();
    bindDynamic();
    if(focusId)mounted.querySelector('#'+CSS.escape(focusId))?.focus();
  }
  function renderArticles() {
    const host=mounted?.querySelector('#news-articles');if(!host)return;
    const items=selectedItems({savedOnly:section==='saved'});
    host.innerHTML=articleLayout(items);
    const count=mounted.querySelector('#news-result-count');if(count)count.textContent=`${items.length} ${items.length===1?'story':'stories'} · ${FeedCore.resolveSourceSelection(allSources(),prefs).size} sources enabled`;
    disposeTickers();
    const slot=mounted.querySelector('[data-news-ticker-slot]');if(slot)slot.innerHTML=tickerMarkup(items);
    bindDynamic();
  }
  function renderSources() { const host=mounted?.querySelector('#news-directory');if(!host)return;host.innerHTML=sourceCards();host.dataset.view=prefs.sourceView==='list'?'list':'gallery';const count=mounted.querySelector('#news-source-count');if(count)count.textContent=`${matchingSources().length} of ${allSources().length} sources · ${FeedCore.resolveSourceSelection(allSources(),prefs).size} enabled`; }
  function disposeTickers() { tickerInstances.forEach(t=>t.dispose());tickerInstances=[]; }
  function mountTickers(container) {
    container.querySelectorAll('.news-ticker-shell').forEach(shell=>{
      const segment=shell.querySelector('.news-ticker-segment');if(!segment)return;
      const track=shell.querySelector('.news-ticker-track');
      tickerInstances.push(TickerCore.mountTicker({viewport:shell.querySelector('.news-ticker-viewport'),track,segment,options:{...prefs.ticker},onStateChange:state=>{shell.dataset.motion=state?.paused?'paused':'playing';}}));
    });
  }
  function bindDynamic() {
    if(!mounted)return;
    mountTickers(mounted);
    if(section==='sources')renderSources();
    mounted.querySelectorAll('.news-article-cover img').forEach(img=>img.addEventListener('error',()=>{img.closest('.news-article-cover').classList.remove('has-image');img.remove();},{once:true}));
    clearInterval(slideTimer);
    if(prefs.view==='slideshow'&&!prefs.groupRelated&&display.slideshowAutoplay&&!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches)slideTimer=setInterval(()=>{if(document.hidden||mounted.matches(':focus-within')||mounted.matches(':hover'))return;advanceSlide(1);},display.slideshowSeconds*1000);
  }
  function advanceSlide(direction) {
    const grid=mounted?.querySelector('.news-article-grid');if(!grid)return;
    if(prefs.view==='carousel'){grid.scrollBy({left:direction*grid.clientWidth*.85,behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
    const cards=[...grid.querySelectorAll('.news-article')];if(!cards.length)return;slideIndex=(slideIndex+direction+cards.length)%cards.length;cards.forEach((c,i)=>c.hidden=i!==slideIndex);const pos=mounted.querySelector('[data-slide-position]');if(pos)pos.textContent=`${slideIndex+1} / ${cards.length}`;
  }
  function toggleArray(key,id) { const next=new Set(prefs[key]||[]);if(next.has(id))next.delete(id);else next.add(id);prefs[key]=[...next];save(); }
  function filename(name) { return name.replace(/[^a-z0-9._-]+/gi,'-'); }
  function download(name,value,type='application/json') { if(typeof helpers.download==='function'){helpers.download(filename(name),value,type);return;}const blob=new Blob([value],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename(name);a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  function exportPreferences() { save();const value={...JSON.parse(FeedCore.exportPreferences(prefs)),readerDisplay:display};download('news-preferences.json',JSON.stringify(value,null,2));notify('Preferences exported. Import them in another compatible reader to carry your setup across.'); }
  async function importedText(text,baseUrl,existingId) {
    if(text.length>3*1024*1024)throw new Error('Feed is larger than the 3 MB import limit.');
    const sourceId=existingId||'custom-'+Date.now().toString(36);
    const result=FeedCore.parseImportedFeed(text,{sourceId,baseUrl:safe(baseUrl)||undefined,DOMParser:root.DOMParser});
    result.items=(result.items||[]).filter(item=>safe(item.url));
    if(!result.items?.length)throw new Error('No usable articles with HTTPS links were found in this feed.');
    const source=result.sources[0];
    if(!safe(source.url))source.url=new URL(result.items[0].url).origin+'/';
    prefs.customSources=[...(prefs.customSources||[]).filter(s=>s.id!==sourceId),{...source,feedUrl:safe(baseUrl)||source.feedUrl,custom:true,defaultEnabled:true}];
    prefs.customItems=FeedCore.deduplicateItems([...(prefs.customItems||[]).filter(i=>i.sourceId!==sourceId),...result.items]);
    prefs.sourceOverrides={...prefs.sourceOverrides,[sourceId]:true};save();updateContent();notify(`Added ${result.items.length} articles from ${source.name}.`);
  }
  async function fetchCustom(url,existingId) {
    if(!safe(url))throw new Error('Enter a public HTTPS feed URL.');
    const parsed=new URL(url);if(/^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|\[|0\.)/.test(parsed.hostname)||/\.(local|localhost|internal)$/.test(parsed.hostname))throw new Error('Use a public publisher URL.');
    notify('Fetching your feed…');
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);
    try { const response=await fetch(url,{credentials:'omit',signal:ctl.signal,mode:'cors',referrerPolicy:'no-referrer'});if(!response.ok)throw new Error('Publisher returned HTTP '+response.status);const text=await readBounded(response);await importedText(text,url,existingId); }
    catch(error){throw new Error(`Could not load this feed (${error.name==='AbortError'?'request timed out':error.message}). Cross-origin access may be blocked; importing a feed file also works.`);}
    finally {clearTimeout(timer);}
  }
  async function onClick(event) {
    const button=event.target.closest('button,a,[data-news-section]');if(!button)return;
    touchedAt=Date.now();
    try {
      if(button.dataset.newsSection){section=button.dataset.newsSection;collectionId='';updateContent();mounted.querySelector(`.news-tabs [data-news-section="${section}"]`)?.focus();return;}
      if(button.dataset.newsOpen){const id=button.dataset.newsOpen;if(!prefs.readIds.includes(id)){prefs.readIds.push(id);save();for(const card of (mounted||homeMounted||document).querySelectorAll(`[data-news-item="${CSS.escape(id)}"]`)){card.classList.add('is-read');const read=card.querySelector('[data-news-read]');if(read){read.setAttribute('aria-pressed','true');read.innerHTML=ic('check')+'Read';}}}return;}
      if(button.dataset.widgetEdit){editingWidgetId=button.dataset.widgetEdit;updateContent();mounted.querySelector('[data-widget-field="title"]')?.focus();return;}
      if(button.dataset.widgetMove){const d=currentDashboard();moveWidget(button.dataset.widgetMove,d.widgets.findIndex(w=>w.id===button.dataset.widgetMove)+Number(button.dataset.offset));return;}
      if(button.dataset.widgetDelete){saveDashboard(VisualEditorCore.deleteWidget(currentDashboard(),button.dataset.widgetDelete));editingWidgetId='';updateContent();return;}
      if(button.dataset.widgetSlide){const id=button.dataset.widgetSlide,w=currentDashboard().widgets.find(w=>w.id===id);if(w.view==='carousel'){mounted.querySelector(`[data-widget-id="${CSS.escape(id)}"] .news-article-grid`)?.scrollBy({left:Number(button.dataset.offset)*500,behavior:'smooth'});}else{const count=dashboardItems(w).length;widgetSlides.set(id,((widgetSlides.get(id)||0)+Number(button.dataset.offset)+count)%count);updateContent();}return;}
      if(button.dataset.newsSave){const id=button.dataset.newsSave;const item=allItems().find(i=>i.id===id);const willSave=!prefs.savedIds.includes(id);const collected=(prefs.collections||[]).some(c=>c.itemIds.includes(id));prefs.savedItems=(prefs.savedItems||[]).filter(i=>i.id!==id);if((willSave||collected)&&item)prefs.savedItems.push(item);toggleArray('savedIds',id);if(section==='dashboard')updateContent();else renderArticles();mounted.querySelector(`[data-news-save="${CSS.escape(id)}"]`)?.focus();return;}
      if(button.dataset.newsRead){const id=button.dataset.newsRead;toggleArray('readIds',id);if(section==='dashboard')updateContent();else renderArticles();mounted.querySelector(`[data-news-read="${CSS.escape(id)}"]`)?.focus();return;}
      if(button.dataset.newsMedia){const panel=mounted.querySelector(`[data-media-for="${CSS.escape(button.dataset.newsMedia)}"]`);panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));return;}
      if(button.dataset.newsFollow){const id=button.dataset.newsFollow;toggleArray('followedSourceIds',id);if(config.legacyFollowKey)store(config.legacyFollowKey,prefs.followedSourceIds);renderSources();mounted.querySelector(`[data-news-follow="${CSS.escape(id)}"]`)?.focus();return;}
      if(button.dataset.newsSourceView){prefs.sourceView=button.dataset.newsSourceView;save();updateContent();return;}
      if(button.dataset.presetApply){const p=prefs.presets.find(p=>p.id===button.dataset.presetApply);if(p){for(const key of ['cardStyle','view','sort','density','columns','showImages','showSummary','groupRelated','ticker','includeKeywords','excludeKeywords','includeRegex','excludeRegex'])if(key in p.settings)prefs[key]=p.settings[key];save();updateContent();notify('Preset applied.');}return;}
      if(button.dataset.presetDelete){prefs.presets=prefs.presets.filter(p=>p.id!==button.dataset.presetDelete);save();updateContent();return;}
      if(button.dataset.bundleApply){const b=prefs.bundles.find(b=>b.id===button.dataset.bundleApply);if(b){const ids=new Set(b.sourceIds);prefs.sourceOverrides=Object.fromEntries(allSources().map(s=>[s.id,ids.has(s.id)]));save();notify('Source bundle applied.');}return;}
      if(button.dataset.bundleDelete){prefs.bundles=prefs.bundles.filter(b=>b.id!==button.dataset.bundleDelete);save();updateContent();return;}
      if(button.dataset.collectionOpen){const c=prefs.collections.find(c=>c.id===button.dataset.collectionOpen);if(c){collectionId=c.id;section='saved';updateContent();notify(`Opened ${c.name}. Saved snapshots remain available offline.`);}return;}
      if(button.dataset.collectionDelete){prefs.collections=prefs.collections.filter(c=>c.id!==button.dataset.collectionDelete);save();updateContent();return;}
      if(button.dataset.customUrl){editingFeedId=button.dataset.customUrl;updateContent();mounted.querySelector('#news-custom-edit-url')?.focus();return;}
      if(button.dataset.customRefresh){const s=prefs.customSources.find(s=>s.id===button.dataset.customRefresh),recipe=(prefs.feedRecipes||[]).find(r=>r.sourceId===s.id);if(recipe)await refreshGenerated(recipe);else await fetchCustom(s.feed||s.feedUrl,s.id);return;}
      if(button.dataset.discoveredFeed){await fetchCustom(button.dataset.discoveredFeed);return;}
      if(button.dataset.recipeEdit){const record=(prefs.feedRecipes||[]).find(r=>r.sourceId===button.dataset.recipeEdit);if(record){builderDraft={...builderDraft,url:record.recipe.baseUrl,name:record.name,sourceId:record.sourceId,mode:record.recipe.mode,selectors:{...record.recipe.selectors},limit:record.recipe.limit,minimumItems:record.recipe.minimumItems,html:''};builderPreview=null;updateContent();mounted.querySelector('#news-builder-url')?.focus();}return;}
      if(button.dataset.customDelete){const id=button.dataset.customDelete;prefs.customSources=prefs.customSources.filter(s=>s.id!==id);prefs.customItems=prefs.customItems.filter(i=>i.sourceId!==id);prefs.feedRecipes=(prefs.feedRecipes||[]).filter(r=>r.sourceId!==id);save();updateContent();return;}
      const action=button.dataset.newsAction;
      if(action==='add-widget'){const d=currentDashboard(),id='view-'+Date.now().toString(36);saveDashboard(VisualEditorCore.normalizeDashboard({...d,widgets:[...d.widgets,{id,title:'New view',view:'gallery',limit:6,span:1}]}));editingWidgetId=id;updateContent();mounted.querySelector('[data-widget-field="title"]')?.focus();return;}
      if(action==='close-widget-editor'){editingWidgetId='';updateContent();return;}
      if(action==='save-widget'){const patch={};for(const field of mounted.querySelectorAll('[data-widget-field]'))patch[field.dataset.widgetField]=field.multiple?[...field.selectedOptions].map(o=>o.value):['limit','span'].includes(field.dataset.widgetField)?Number(field.value):field.value;saveDashboard(VisualEditorCore.updateWidget(currentDashboard(),editingWidgetId,patch));editingWidgetId='';updateContent();notify('View updated.');return;}
      if(action==='new-dashboard'){const d=VisualEditorCore.normalizeDashboard({id:'dashboard-'+Date.now().toString(36),name:'New dashboard',widgets:[]});prefs.dashboards=[...(prefs.dashboards||[]),d];prefs.activeDashboardId=d.id;editingWidgetId='';save();updateContent();mounted.querySelector('#news-dashboard-name')?.focus();return;}
      if(action==='delete-dashboard'){const d=currentDashboard();prefs.dashboards=(prefs.dashboards||[]).filter(row=>row.id!==d.id);prefs.activeDashboardId=prefs.dashboards[0]?.id||'';editingWidgetId='';save();updateContent();return;}
      if(action==='refresh'){await refresh(true);return;}
      if(action==='apply-updates'){applyPending();return;}
      if(action==='export'){exportPreferences();return;}
      if(action==='preview'){section='latest';updateContent();return;}
      if(action==='reset-ticker-color'){prefs.ticker.headlineColor='';save();updateContent();return;}
      if(action==='ticker-pause'){prefs.ticker.paused=!prefs.ticker.paused;save();tickerInstances.forEach(t=>prefs.ticker.paused?t.pause():t.play());(mounted||homeMounted||document).querySelectorAll('[data-news-action="ticker-pause"]').forEach(b=>{b.textContent=prefs.ticker.paused?'Play':'Pause';b.setAttribute('aria-label',(prefs.ticker.paused?'Play':'Pause')+' news ticker');});return;}
      if(action==='next'||action==='previous'){advanceSlide(action==='next'?1:-1);return;}
      if(action==='slideshow-pause'){display.slideshowAutoplay=!display.slideshowAutoplay;save();updateContent();return;}
      if(action==='mark-visible-read'){prefs.readIds=[...new Set([...prefs.readIds,...selectedItems({savedOnly:section==='saved'}).map(i=>i.id)])];save();renderArticles();notify('Visible stories marked read.');return;}
      if(action==='clear-filters'){query='';category='';onlyUnread=false;onlyMedia=false;collectionId='';prefs.includeKeywords=[];prefs.excludeKeywords=[];prefs.includeRegex=[];prefs.excludeRegex=[];save();updateContent();return;}
      if(action==='clear-source-filters'){sourceQuery='';sourceCategory='';sourceScope='all';updateContent();return;}
      if(action==='enable-recommended'){allSources().filter(s=>(s.recommended||s.defaultEnabled)&&s.managed).forEach(s=>prefs.sourceOverrides[s.id]=true);save();renderSources();return;}
      if(action==='reset-sources'){prefs.sourceOverrides={};save();renderSources();notify('Curated source defaults restored. Saved sources are kept.');return;}
      if(action==='apply-filters'){const candidate={...prefs};for(const field of mounted.querySelectorAll('[data-news-words]'))candidate[field.dataset.newsWords]=field.value.split('\n').map(s=>s.trim()).filter(Boolean);FeedCore.filterItems([],candidate);prefs=candidate;save();updateContent();notify('Filters saved.');return;}
      if(action==='save-preset'){const name=mounted.querySelector('#news-preset-name').value.trim();if(!name){notify('Give the preset a name.');return;}const settings={groupRelated:prefs.groupRelated,cardStyle:prefs.cardStyle,view:prefs.view,sort:prefs.sort,density:prefs.density,columns:prefs.columns,showImages:prefs.showImages,showSummary:prefs.showSummary,ticker:{...prefs.ticker},includeKeywords:[...prefs.includeKeywords],excludeKeywords:[...prefs.excludeKeywords],includeRegex:[...prefs.includeRegex],excludeRegex:[...prefs.excludeRegex]};prefs.presets.push({id:'preset-'+Date.now().toString(36),name,settings});save();updateContent();notify('Preset saved.');return;}
      if(action==='save-bundle'){const name=mounted.querySelector('#news-bundle-name').value.trim();if(!name){notify('Give the bundle a name.');return;}prefs.bundles=[...(prefs.bundles||[]),{id:'bundle-'+Date.now().toString(36),name,sourceIds:[...FeedCore.resolveSourceSelection(allSources(),prefs)]}];save();updateContent();return;}
      if(action==='save-collection'){const name=mounted.querySelector('#news-collection-name').value.trim();if(!name||!prefs.savedIds.length){notify('Name the collection and save at least one story first.');return;}prefs.collections=[...(prefs.collections||[]),{id:'collection-'+Date.now().toString(36),name,itemIds:[...prefs.savedIds]}];save();updateContent();return;}
      if(action==='save-custom-url'){const id=editingFeedId;await fetchCustom(mounted.querySelector('#news-custom-edit-url').value,id);editingFeedId='';updateContent();return;}
      if(action==='fetch-page'){readBuilderForm();notify('Fetching the public source page…');builderDraft.html=await fetchPublicText(builderDraft.url);builderPreview=null;discoveredFeeds=[];updateContent();notify('Page loaded. Discover a published feed or preview your extraction.');return;}
      if(action==='discover-feeds'){readBuilderForm();if(!builderDraft.html.trim())builderDraft.html=await fetchPublicText(builderDraft.url);const discovered=ContentExtractionCore.discoverFeeds(builderDraft.html,{baseUrl:builderDraft.url,DOMParser:root.DOMParser});discoveredFeeds=Array.isArray(discovered)?discovered:discovered.feeds||[];updateContent();notify(discoveredFeeds.length?`Found ${discoveredFeeds.length} published feeds.`:'No published feed links were found in this HTML. You can create an extraction recipe below.');return;}
      if(action==='preview-extraction'){const result=previewExtraction();notify(`${result.items?.length||0} stories extracted. ${result.validation?.ok?'Review them, then save the feed.':'The recipe needs review.'}`);return;}
      if(action==='save-generated'){persistGenerated(previewExtraction());return;}
      if(action==='export-recipe'){readBuilderForm();download('feed-recipe.json',FeedGenerationCore.exportRecipe(builderRecipe()));return;}
      if(action==='import-feed'){await importedText(mounted.querySelector('#news-custom-text').value,mounted.querySelector('#news-custom-url').value);return;}
      if(action==='fetch-custom'){await fetchCustom(mounted.querySelector('#news-custom-url').value);return;}
      if(action==='export-feed'){const format=mounted.querySelector('#news-export-format')?.value||'json',items=selectedItems(),options={format,title:'My '+title,url:safe(config.publicUrl||location.href)||undefined,generatedAt:new Date().toISOString()};const result=FeedCore.exportFeedResult?FeedCore.exportFeedResult(items,options):{content:FeedCore.exportFeed(items,options),exportedItems:items.length,omittedItems:0,warnings:[]};download('news-feed.'+(format==='json'?'json':'xml'),result.content,format==='json'?'application/feed+json':format==='atom'?'application/atom+xml':'application/rss+xml');notify(result.omittedItems?`Exported ${result.exportedItems} stories. ${result.omittedItems} stories without a reliable publication/update timestamp were omitted from Atom. Choose JSON Feed or RSS to retain them.`:`Exported ${result.exportedItems} stories from the current filtered feed.`);}
    } catch(error){notify(error.message||'This action could not finish. Your current news is still available.');}
  }
  function onInput(event) {
    touchedAt=Date.now();const target=event.target;
    if(target.id==='news-article-search'){query=target.value;renderArticles();}
    if(target.id==='news-source-search'){sourceQuery=target.value;renderSources();}
    if(target.id?.startsWith('news-builder-')||target.dataset.newsSelector){readBuilderForm();const saveButton=mounted.querySelector('[data-news-action="save-generated"]');if(saveButton)saveButton.disabled=true;}
    if(target.type==='range'){const output=target.parentElement.querySelector('output');if(output)output.textContent=target.value;}
  }
  async function onChange(event) {
    const t=event.target;touchedAt=Date.now();
    try {
      if(t.id==='news-dashboard-select'){prefs.activeDashboardId=t.value;editingWidgetId='';save();updateContent();return;}
      if(t.id==='news-dashboard-name'){saveDashboard(VisualEditorCore.normalizeDashboard({...currentDashboard(),name:t.value}));updateContent();return;}
      if(t.dataset.newsImport) {
        const file=t.files?.[0];if(!file)return;if(file.size>3*1024*1024)throw new Error('Choose a file smaller than 3 MB.');const text=await file.text();
        if(t.dataset.newsImport==='feed')await importedText(text,mounted.querySelector('#news-custom-url')?.value);else if(t.dataset.newsImport==='html'){readBuilderForm();builderDraft.html=text;builderPreview=null;updateContent();notify('HTML loaded. Preview the extraction before saving.');}else if(t.dataset.newsImport==='recipe'){const recipe=FeedGenerationCore.importRecipe(text);builderDraft={...builderDraft,url:recipe.baseUrl,name:recipe.sourceName,sourceId:recipe.sourceId,mode:recipe.mode,selectors:{...recipe.selectors},limit:recipe.limit,minimumItems:recipe.minimumItems};builderPreview=null;updateContent();notify('Recipe imported. Load its source HTML to preview it.');}else {const raw=JSON.parse(text);prefs=FeedCore.importPreferences(text,model?.news?.sources||[]);if(raw.readerDisplay)display=normalizeDisplay(raw.readerDisplay);save();updateContent();notify('Preferences imported.');}return;
      }
      if(t.dataset.newsEnable){prefs.sourceOverrides={...prefs.sourceOverrides,[t.dataset.newsEnable]:t.checked};save();renderSources();mounted.querySelector(`[data-news-enable="${CSS.escape(t.dataset.newsEnable)}"]`)?.focus();return;}
      if(t.dataset.newsSetting||t.dataset.tickerSetting||t.dataset.displaySetting){const value=t.type==='checkbox'?t.checked:t.type==='range'?Number(t.value):t.value;if(t.dataset.newsSetting)prefs[t.dataset.newsSetting]=value;if(t.dataset.tickerSetting)prefs.ticker={...prefs.ticker,[t.dataset.tickerSetting]:value};if(t.dataset.displaySetting)display[t.dataset.displaySetting]=value;save();disposeTickers();const preview=mounted.querySelector('.news-settings-preview');if(preview){preview.innerHTML='<h3>Strip preview</h3>'+tickerMarkup(selectedItems());mountTickers(preview);}return;}
      if(t.id==='news-article-category')category=t.value;
      else if(t.id==='news-view'){prefs.view=t.value;save();}
      else if(t.id==='news-sort'){prefs.sort=t.value;save();}
      else if(t.id==='news-unread')onlyUnread=t.checked;
      else if(t.id==='news-media-only')onlyMedia=t.checked;
      else if(t.id==='news-group-related'){prefs.groupRelated=t.checked;save();}
      else if(t.id==='news-show-images'){prefs.showImages=t.checked;save();}
      else if(t.id==='news-source-category'){sourceCategory=t.value;renderSources();return;}
      else if(t.id==='news-source-scope'){sourceScope=t.value;renderSources();return;}
      else return;
      renderArticles();
    }catch(error){notify(error.message||'Could not apply this setting.');}
  }
  function updateFreshness() { const host=mounted?.querySelector('[data-news-freshness]');if(host)host.innerHTML=freshnessBar(); }
  function repaintHome() {
    if(!homeMounted)return;
    disposeTickers();
    const wrapper=document.createElement('div');wrapper.innerHTML=renderHomeTicker(model,helpers);
    homeMounted.innerHTML=wrapper.firstElementChild.innerHTML;
    mountTickers(homeMounted);
  }
  function applyPending() {if(!pending)return;digest=pending;pending=null;model.newsDigest=digest;store(CACHE_KEY,digest);updateFreshness();if(mounted)updateContent();repaintHome();notify('Latest available news loaded.');}
  async function refresh(manual=false) {
    if(fetching||navigator.onLine===false){if(manual)notify('You are offline. The last saved news remains available.');return;}
    if(!manual&&(!display.autoRefresh||Date.now()-lastClientCheck<60000||document.hidden))return;
    fetching=true;refreshError='';updateFreshness();
    const controller=new AbortController(),generation=++refreshGeneration,timeout=setTimeout(()=>controller.abort(),15000);refreshController=controller;
    try {
      const web=location.protocol==='http:'||location.protocol==='https:';
      const base=web?'./':String(config.remoteBaseUrl||'');
      if(!web&&!base&&!helpers.digestUrl){if(manual)notify('No refresh endpoint is configured for this local reader. Imported and saved news remains available.');return;}
      const urls=[helpers.digestUrl||base+'news-digest.json',helpers.catalogUrl||base+'news-sources.json',helpers.healthUrl||base+'news-refresh-state.json'];
      const responses=await Promise.allSettled(urls.map(async url=>{const response=await fetch(url,{cache:'no-cache',credentials:'omit',signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok)throw new Error('News service returned HTTP '+response.status);return JSON.parse(await readBounded(response));}));
      if(generation!==refreshGeneration)return;
      if(responses[1].status==='fulfilled'&&validCatalog(responses[1].value)){model.news=responses[1].value;store(SOURCE_CACHE_KEY,model.news);normalize();}
      if(responses[2].status==='fulfilled'&&validHealth(responses[2].value)){healthState=responses[2].value;store(HEALTH_CACHE_KEY,healthState);}
      const unavailable=[];if(responses[1].status==='rejected'||!validCatalog(responses[1].value))unavailable.push('source catalog');if(responses[2].status==='rejected'||!validHealth(responses[2].value))unavailable.push('source health');if(unavailable.length)refreshError='Could not check '+unavailable.join(' and ')+'. Showing the last saved information.';
      lastClientCheck=Date.now();
      if(responses[0].status==='rejected')throw responses[0].reason;
      const incoming=responses[0].value;if(!validDigest(incoming))throw new Error('The new snapshot did not pass validation');
      if(Date.parse(incoming.generatedAt)>Date.parse(digest.generatedAt)){
        // The publisher retains last-good source records. Replace its bounded
        // rolling snapshot rather than accumulating an unbounded browser history.
        // Saved stories live in the separate portable preferences snapshot.
        pending={...incoming,items:incoming.items.map(item=>FeedCore.normalizeItem(item)).filter(Boolean)};
        if(manual||Date.now()-touchedAt>30000)applyPending();else updateFreshness();
      } else {
        if(section==='sources'&&mounted)renderSources();
        if(manual)notify('You have the latest published snapshot. Source checks run independently in the background.');
      }
    }catch(error){if(generation!==refreshGeneration)return;refreshError='Refresh unavailable. Keeping the last good snapshot. '+(error.name==='AbortError'?'The request timed out.':error.message);if(manual)notify(refreshError);}
    finally {clearTimeout(timeout);if(generation===refreshGeneration){fetching=false;refreshController=null;updateFreshness();}}
  }
  function dispose() {refreshGeneration++;refreshController?.abort();refreshController=null;fetching=false;cleanup.forEach(fn=>fn());cleanup=[];disposeTickers();clearInterval(refreshTimer);clearInterval(slideTimer);mounted=null;homeMounted=null;}
  function bind(container=document) {
    dispose();mounted=container.querySelector('#news-workspace')||(container.id==='news-workspace'?container:null);if(!mounted)return ()=>{};
    const target=mounted;target.addEventListener('click',onClick);target.addEventListener('input',onInput);target.addEventListener('change',onChange);target.addEventListener('dragstart',onDragStart);target.addEventListener('dragover',onDragOver);target.addEventListener('drop',onDrop);
    cleanup.push(()=>{target.removeEventListener('click',onClick);target.removeEventListener('input',onInput);target.removeEventListener('change',onChange);target.removeEventListener('dragstart',onDragStart);target.removeEventListener('dragover',onDragOver);target.removeEventListener('drop',onDrop);});
    const online=()=>{lastClientCheck=0;refresh();updateFreshness();};const offline=()=>updateFreshness();const visibility=()=>{if(!document.hidden)refresh();};
    const storage=event=>{if(event.key===UI_KEY&&event.newValue){try{display=normalizeDisplay(JSON.parse(event.newValue));updateContent();}catch(_){}}if(event.key===KEY&&event.newValue){try{prefs=FeedCore.normalizePreferences(JSON.parse(event.newValue),model?.news?.sources||[]);updateContent();}catch(_){}}};
    root.addEventListener('online',online);root.addEventListener('offline',offline);root.addEventListener('storage',storage);document.addEventListener('visibilitychange',visibility);
    cleanup.push(()=>{root.removeEventListener('online',online);root.removeEventListener('offline',offline);root.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',visibility);});
    bindDynamic();refreshTimer=setInterval(()=>refresh(),5*60000);refresh();return dispose;
  }
  function bindHomeTicker(container=document) {
    const home=container.querySelector('#news-home-strip');if(!home)return ()=>{};
    dispose();homeMounted=home;repaintHome();home.addEventListener('click',onClick);cleanup.push(()=>home.removeEventListener('click',onClick));
    const online=()=>{lastClientCheck=0;refresh();repaintHome();},offline=()=>repaintHome(),visibility=()=>{if(!document.hidden)refresh();};
    const storage=event=>{try{if(event.key===KEY&&event.newValue){prefs=FeedCore.normalizePreferences(JSON.parse(event.newValue),model?.news?.sources||[]);repaintHome();}if(event.key===UI_KEY&&event.newValue)display=normalizeDisplay(JSON.parse(event.newValue));}catch(_){}};
    root.addEventListener('online',online);root.addEventListener('offline',offline);root.addEventListener('storage',storage);document.addEventListener('visibilitychange',visibility);
    cleanup.push(()=>{root.removeEventListener('online',online);root.removeEventListener('offline',offline);root.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',visibility);});
    refreshTimer=setInterval(()=>refresh(),5*60000);refresh();return dispose;
  }
  return Object.freeze({render,bind,renderHomeTicker,bindHomeTicker,dispose,mount(element,data,h={}){element.innerHTML=render(data,h);return bind(element);},refresh});
  }
  return Object.freeze({VERSION:'0.1.0',createReader});
});
