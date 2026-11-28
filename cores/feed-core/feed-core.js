/*  * feed-core 0.1.0 — portable feed records, selection, filtering and preferences.
 * No network, storage, framework, or application runtime dependency.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FeedCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '0.1.0';
  const VIEWS = Object.freeze(['gallery','compact','list','masonry','magazine','carousel','imageboard','slideshow','social','ticker']);
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o || {},k);
  const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const text = value => typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim() : '';
  const strings = value => Array.isArray(value) ? [...new Set(value.filter(v=>typeof v==='string').map(text).filter(Boolean))] : [];
  const choice = (value,allowed,fallback) => allowed.includes(value) ? value : fallback;
  const number = (value,fallback,min,max) => value!==null&&value!==''&&Number.isFinite(Number(value)) ? Math.min(max,Math.max(min,Number(value))) : fallback;
  const keyOK = key => !['__proto__','prototype','constructor'].includes(key);
  const colour = (value,fallback) => /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
  function safeUrl(value, base) {
    const raw = text(value);
    if (!raw || /[\u0000-\u0020<>]/.test(raw)) return '';
    try {
      const url = new URL(raw,base || undefined);
      return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch (_) { return ''; }
  }
  function canonicalUrl(value) {
    const safe = safeUrl(value);
    if (!safe) return '';
    const url = new URL(safe);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || ['fbclid','gclid','dclid','msclkid','mc_cid','mc_eid'].includes(key.toLowerCase())) url.searchParams.delete(key);
    }
    // Preserve semantic query order, trailing slashes and all unknown parameters.
    return url.href;
  }
  function validDate(value) {
    const raw = text(value);
    if (!raw || !Number.isFinite(Date.parse(raw))) return '';
    const isoDay=raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if(isoDay&&new Date(isoDay).toISOString().slice(0,10)!==isoDay)return '';
    // Preserve date-only precision; do not relabel it as an observed timestamp.
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(raw).toISOString().slice(0,10) === raw ? raw : '';
    if(/\d{1,2}:\d{2}/.test(raw)&&!hasTimeZone(raw)){
      if(isoDay)return isoDay;
      const local=new Date(raw);return `${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,'0')}-${String(local.getDate()).padStart(2,'0')}`;
    }
    return new Date(raw).toISOString();
  }
  function hasTimeZone(value){return /\d{1,2}:\d{2}/.test(value)&&/(?:z|[+-]\d{2}:?\d{2}|GMT|UTC|UT|[ECMP][DS]T)(?:\s*\([^)]*\))?$/i.test(value);}
  function validTimestamp(value){const raw=text(value);return hasTimeZone(raw)?validDate(raw):'';}
  function normalizeItem(raw, source = {}) {
    const item = record(raw), src = record(source);
    const url = safeUrl(item.url || item.link || item.external_url,src.url || src.feedUrl);
    const sourceId = text(item.sourceId || src.id);
    const title = text(item.title);
    if (!url || !title || !sourceId) return null;
    const media = [];
    for (const entry of Array.isArray(item.media) ? item.media : []) {
      const link = safeUrl(entry?.url,url);
      if (link && ['image','audio','video','embed'].includes(entry.kind) && !media.some(m=>m.kind===entry.kind&&m.url===link)) media.push({kind:entry.kind,url:link,
        ...(/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(entry.mimeType||'')?{mimeType:entry.mimeType}:{})});
    }
    const image = safeUrl(item.image || item.imageUrl,url);
    if (image && !media.some(m=>m.url===image)) media.unshift({kind:'image',url:image});
    const publishedAt=validTimestamp(item.publishedAt)||validTimestamp(item.date_published)||validTimestamp(item.pubDate)||validTimestamp(item.date);
    const date=validDate(item.date)||validDate(item.date_published)||validDate(item.pubDate)||publishedAt||validDate(record(item._feed_core).date);
    return {
      id:text(item.id) || `${sourceId}:${canonicalUrl(url)}`, sourceId,title,url,date,
      publishedAt, updatedAt:validTimestamp(item.updatedAt)||validTimestamp(item.date_modified),
      fetchedAt:validDate(item.fetchedAt), summary:text(item.summary || item.excerpt || item.content_text),
      category:text(item.category || src.category), media, tags:strings(item.tags),
      sourceIds:strings([sourceId,...(item.sourceIds || [])]),
      retained:item.retained === true,
      ...(typeof item.author === 'string' ? {author:text(item.author)} : {})
    };
  }
  function deduplicateItems(items) {
    const result = [], byUrl = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      if (!item || !item.url) continue;
      const key = canonicalUrl(item.url);
      if (!key) continue;
      if (!byUrl.has(key)) {
        const copy = {...item,sourceIds:strings([item.sourceId,...(item.sourceIds || [])])};
        byUrl.set(key,copy); result.push(copy);
      } else {
        const prior = byUrl.get(key);
        prior.sourceIds = strings([...prior.sourceIds,item.sourceId,...(item.sourceIds || [])]);
        // One article identity; preserve original date and useful richer metadata.
        if (!prior.summary && item.summary) prior.summary = item.summary;
        if (!prior.date && item.date) {prior.date=item.date;prior.publishedAt=item.publishedAt || item.date;}
        if(item.publishedAt&&(!prior.publishedAt||prior.publishedAt.length===10&&item.publishedAt.startsWith(prior.publishedAt)))prior.publishedAt=item.publishedAt;
        const seen = new Set((prior.media || []).map(m=>`${m.kind}:${m.url}`));
        prior.media = [...(prior.media || []),...(item.media || []).filter(m=>!seen.has(`${m.kind}:${m.url}`))];
      }
    }
    return result;
  }
  function sourceEnabled(source,prefs = {}) {
    if (!source || !source.id) return false;
    const overrides = record(prefs.sourceOverrides);
    return own(overrides,source.id) && typeof overrides[source.id] === 'boolean' ? overrides[source.id] : source.defaultEnabled !== false;
  }
  function resolveSourceSelection(sources,prefs) { return new Set((sources || []).filter(s=>sourceEnabled(s,prefs)).map(s=>s.id)); }
  function normalizeTickerOptions(raw) {
    const t = record(raw);
    return {enabled:t.enabled!==false,speedPxPerSec:number(t.speedPxPerSec,40,0,500),direction:choice(t.direction,['left','right'],'left'),
      paused:t.paused===true,motion:choice(t.motion,['system','off','full'],'system'),label:text(t.label)||'NEWS',
      badgeShape:choice(t.badgeShape,['wedge','rectangle','rounded','pill','circle'],'wedge'),
      accent:colour(t.accent,'#497fcf'),fontSize:number(t.fontSize,14,10,48),images:t.images===true,
      style:choice(t.style,['classic','headlines','bright','bw','breaking','neon','wire','terminal','gold','gradient','sports'],'classic'),
      headlineColor:colour(t.headlineColor,''),showDate:t.showDate!==false,pauseOnHover:t.pauseOnHover!==false};
  }
  function normalizeFeedRecipe(raw={}) {
    const p=record(raw), supplied=record(p.selectors), selectors={}, baseUrl=safeUrl(p.baseUrl);
    const defaults={item:'article',title:'h2, h3, h1',link:'a[href]',date:'time[datetime]',image:'img',summary:'p'};
    for(const [field,fallback]of Object.entries(defaults)) selectors[field]=typeof supplied[field]==='string'?text(supplied[field]).slice(0,513):fallback;
    return {schemaVersion:1,sourceId:(text(p.sourceId)||(baseUrl?`custom:${new URL(baseUrl).hostname}`:'custom')).slice(0,160),
      sourceName:(text(p.sourceName)||text(p.name)||'Custom feed').slice(0,200),baseUrl,category:(text(p.category)||'custom').slice(0,100),
      mode:choice(p.mode,['listing','article'],'listing'),selectors,limit:Math.round(number(p.limit,100,1,500)),
      minimumItems:Math.round(number(p.minimumItems,1,0,500)),maxDropRatio:number(p.maxDropRatio,0.6,0,1),
      requireDates:p.requireDates===true,allowCrossOrigin:p.allowCrossOrigin===true};
  }
  function normalizeDashboard(raw={}) {
    const p=record(raw),widgets=[],seen=new Set();
    for(const rawWidget of (Array.isArray(p.widgets)?p.widgets:[]).slice(0,64)){
      const w=record(rawWidget),id=text(w.id).slice(0,120);
      if(!id||!keyOK(id)||seen.has(id))continue;seen.add(id);
      widgets.push({id,title:(text(w.title)||'News').slice(0,200),view:choice(w.view,VIEWS,'gallery'),query:text(w.query).slice(0,512),
        category:text(w.category).slice(0,100),sourceIds:strings(w.sourceIds).slice(0,100).map(s=>s.slice(0,160)),
        limit:Math.round(number(w.limit,12,1,100)),span:Math.round(number(w.span,1,1,2))});
      if(widgets.length>=32)break;
    }
    return {id:(text(p.id)||'dashboard').slice(0,120),name:(text(p.name)||'Dashboard').slice(0,200),widgets};
  }
  function normalizePreferences(raw = {},sources = [],nested = false) {
    const p=record(raw), sourceOverrides={};
    // Preserve overrides for temporarily absent sources so outages cannot reset choices.
    for(const [id,on] of Object.entries(record(p.sourceOverrides))) if(keyOK(id)&&typeof on==='boolean') sourceOverrides[id]=on;
    const result={schemaVersion:1,sourceOverrides,view:choice(p.view,VIEWS,'gallery'),sourceView:choice(p.sourceView,['gallery','list','compact'],'gallery'),
      sort:choice(p.sort,['newest','oldest','relevance','source'],'newest'),readIds:strings(p.readIds),savedIds:strings(p.savedIds),
      followedSourceIds:strings(p.followedSourceIds),includeKeywords:strings(p.includeKeywords),excludeKeywords:strings(p.excludeKeywords),
      includeRegex:strings(p.includeRegex),excludeRegex:strings(p.excludeRegex),showImages:p.showImages===true,showSummary:p.showSummary!==false,groupRelated:p.groupRelated===true,
      density:choice(p.density,['comfortable','compact'],'comfortable'),columns:Math.round(number(p.columns,3,1,6)),
      cardStyle:choice(p.cardStyle,['default','grid','compact','cards','minimal','glass','paper','clear','warm','news','dracula','neonpink','darkgrey','blackwhite','amoled','aurora','sunset','terminal'],'default'),
      ticker:normalizeTickerOptions(p.ticker),presets:[],customSources:[],customItems:[],savedItems:[],bundles:[],collections:[],
      feedRecipes:[],dashboards:[],activeDashboardId:''};
    for (const row of Array.isArray(p.customSources) ? p.customSources : []) {
      const s=record(row),url=safeUrl(s.url),feedUrl=safeUrl(s.feedUrl);
      if(text(s.id)&&keyOK(s.id)&&text(s.name)&&(url||feedUrl)) result.customSources.push({id:text(s.id),name:text(s.name),url:url||feedUrl,feedUrl,
        description:text(s.description),category:text(s.category)||'custom',defaultEnabled:s.defaultEnabled!==false,custom:true});
    }
    for (const item of Array.isArray(p.customItems)?p.customItems:[]) { const normal=normalizeItem(item);if(normal)result.customItems.push(normal); }
    for (const item of Array.isArray(p.savedItems)?p.savedItems:[]) { const normal=normalizeItem(item);if(normal)result.savedItems.push(normal); }
    for (const name of ['bundles','collections']) for(const rawRow of Array.isArray(p[name])?p[name]:[]) {
      const row=record(rawRow);if(!text(row.id)||!text(row.name))continue;
      result[name].push({id:text(row.id),name:text(row.name),sourceIds:strings(row.sourceIds),itemIds:strings(row.itemIds),description:text(row.description)});
    }
    for(const entry of (Array.isArray(p.feedRecipes)?p.feedRecipes:[]).slice(0,100)){
      const row=record(entry);if(!text(row.id)||!keyOK(row.id))continue;
      const recipe=normalizeFeedRecipe(row.recipe);
      result.feedRecipes.push({id:text(row.id).slice(0,120),sourceId:(text(row.sourceId)||recipe.sourceId).slice(0,160),name:(text(row.name)||recipe.sourceName).slice(0,200),recipe});
    }
    const seenDashboards=new Set();
    for(const entry of (Array.isArray(p.dashboards)?p.dashboards:[]).slice(0,20)){
      const dashboard=normalizeDashboard(entry);if(!keyOK(dashboard.id)||seenDashboards.has(dashboard.id))continue;
      seenDashboards.add(dashboard.id);result.dashboards.push(dashboard);
    }
    result.activeDashboardId=seenDashboards.has(p.activeDashboardId)?p.activeDashboardId:result.dashboards[0]?.id||'';
    if(!nested) for(const rawPreset of Array.isArray(p.presets)?p.presets:[]) {
      const preset=record(rawPreset);if(!text(preset.id)||!text(preset.name))continue;
      const settings=normalizePreferences(preset.settings,sources,true);
      // Presets carry presentation/filters/source choices; reading history stays personal.
      for(const field of ['presets','readIds','savedIds','savedItems','customItems','collections','bundles','feedRecipes','dashboards','activeDashboardId'])delete settings[field];
      result.presets.push({id:text(preset.id),name:text(preset.name),settings});
    }
    return result;
  }
  function exportPreferences(preferences) {
    return JSON.stringify({format:'feed-preferences',schemaVersion:1,preferences:normalizePreferences(preferences)},null,2);
  }
  function importPreferences(input,sources=[]) {
    if(typeof input!=='string')throw new TypeError('Import must contain JSON text.');
    if(input.length>8*1024*1024)throw new RangeError('Preferences file exceeds the 8 MiB import limit; no settings were changed.');
    const payload=JSON.parse(input);
    if(!payload||payload.format!=='feed-preferences'||payload.schemaVersion!==1||!payload.preferences||typeof payload.preferences!=='object'||Array.isArray(payload.preferences))throw new Error('Unsupported feed preferences format or version.');
    const result=normalizePreferences(payload.preferences,sources);
    const managed=new Set((Array.isArray(sources)?sources:[]).filter(source=>source&&source.custom!==true).map(source=>source.id));
    const collisions=[...result.customSources.map(source=>source.id),...result.customItems.map(item=>item.sourceId),...result.feedRecipes.flatMap(entry=>[entry.sourceId,entry.recipe.sourceId])].filter(id=>managed.has(id));
    if(collisions.length)throw new Error('Imported custom feeds cannot replace managed source identities. Give each custom source a distinct ID and retry; no settings were changed.');
    for(const pattern of [...result.includeRegex,...result.excludeRegex])compilePattern(pattern);
    return result;
  }
  // A small Thompson-NFA regex subset: literals, dot, character classes, anchors,
  // alternation and quantifiers. No groups, backreferences, lookarounds or eval.
  // Matching visits each state at most once per character; no backtracking engine.
  function compilePattern(input) {
    const pattern=text(input);if(pattern.length>512)throw new Error('Filter pattern exceeds 512 characters.');
    const states=[];
    const node=()=>{if(states.length>=4096)throw new Error('Filter pattern expands beyond 4096 states.');states.push({edges:[],epsilon:[]});return states.length-1;};
    const starts=[];let i=0;
    const escapeTest=()=>{if(i>=pattern.length)throw new Error('Incomplete escape in filter pattern.');const c=pattern[i++];
      if(/[1-9bBAZzkp]/.test(c))throw new Error('Backreferences, boundaries and Unicode classes are unsupported.');
      if(c==='d')return c=>c>='0'&&c<='9';if(c==='D')return c=>!(c>='0'&&c<='9');
      if(c==='w')return c=>/[A-Za-z0-9_]/.test(c);if(c==='W')return c=>!/[A-Za-z0-9_]/.test(c);
      if(c==='s')return c=>/\s/.test(c);if(c==='S')return c=>!/\s/.test(c);
      const literal=({n:'\n',r:'\r',t:'\t'})[c]||c;return c=>c.toLowerCase()===literal.toLowerCase();};
    while(i<=pattern.length){
      const anchored=pattern[i]==='^';if(anchored)i++;
      let current=node();starts.push({index:current,anchored});let endAnchored=false;
      while(i<pattern.length&&pattern[i]!=='|'){
        let test;let c=pattern[i++];
        if(c==='$'){if(i<pattern.length&&pattern[i]!=='|')throw new Error('$ must end a branch.');endAnchored=true;break;}
        if(c==='\\')test=escapeTest();
        else if(c==='.')test=c=>c!=='\n'&&c!=='\r';
        else if(c==='['){
          const negate=pattern[i]==='^';if(negate)i++;const tests=[];let closed=false;
          while(i<pattern.length){if(pattern[i]===']'){i++;closed=true;break;}let first=pattern[i++];
            if(first==='\\'){tests.push(escapeTest());continue;}
            if(pattern[i]==='-'&&pattern[i+1]!==']'&&i+1<pattern.length){i++;const last=pattern[i++];if(last==='\\')throw new Error('Use literal character ranges.');const a=first.toLowerCase(),b=last.toLowerCase();if(a>b)throw new Error('Reversed character range.');tests.push(c=>c.toLowerCase()>=a&&c.toLowerCase()<=b);}
            else {const literal=first.toLowerCase();tests.push(c=>c.toLowerCase()===literal);}
          }
          if(!closed||!tests.length)throw new Error('Invalid character class.');test=c=>negate!==tests.some(fn=>fn(c));
        }else if(/[()^*+?{}\]]/.test(c))throw new Error('Unsupported filter syntax: groups, lookarounds and unmatched quantifiers are not allowed.');
        else {const literal=c.toLowerCase();test=c=>c.toLowerCase()===literal;}
        let min=1,max=1;
        if(pattern[i]==='*'){min=0;max=Infinity;i++;}else if(pattern[i]==='+'){max=Infinity;i++;}else if(pattern[i]==='?'){min=0;i++;}
        else if(pattern[i]==='{'){
          const match=/^\{(\d+)(?:,(\d*))?\}/.exec(pattern.slice(i));if(!match)throw new Error('Invalid repetition range.');
          min=Number(match[1]);max=match[2]===undefined?min:match[2]===''?Infinity:Number(match[2]);
          if(min>1000||max<min||(max!==Infinity&&max>1000))throw new Error('Repetition must be within 0–1000.');i+=match[0].length;
        }
        for(let count=0;count<min;count++){const next=node();states[current].edges.push({to:next,test});current=next;}
        if(max===Infinity){const next=node();states[current].edges.push({to:current,test});states[current].epsilon.push(next);current=next;}
        else for(let count=min;count<max;count++){const next=node();states[current].epsilon.push(next);states[current].edges.push({to:next,test});current=next;}
      }
      states[current].accept=true;states[current].endAnchored=endAnchored;
      if(i>=pattern.length)break;i++;
    }
    const closure=indices=>{const set=new Set(indices),queue=[...set];for(let q=0;q<queue.length;q++)for(const next of states[queue[q]].epsilon)if(!set.has(next)){set.add(next);queue.push(next);}return set;};
    return value=>{const valueText=String(value??'');let active=new Set();
      for(let at=0;at<=valueText.length;at++){
        for(const start of starts)if(at===0||!start.anchored)active.add(start.index);
        active=closure(active);
        for(const index of active)if(states[index].accept&&(!states[index].endAnchored||at===valueText.length))return true;
        if(at===valueText.length)break;
        const next=new Set();for(const index of active)for(const edge of states[index].edges)if(edge.test(valueText[at]))next.add(edge.to);
        active=next;
      }return false;
    };
  }
  const lookup=(map,id)=>map instanceof Map?map.get(id):record(map)[id];
  function filterItems(items,options={}) {
    const includes=strings(options.includeKeywords).map(s=>s.toLowerCase()),excludes=strings(options.excludeKeywords).map(s=>s.toLowerCase());
    const includeRegex=strings(options.includeRegex).map(compilePattern),excludeRegex=strings(options.excludeRegex).map(compilePattern);
    const query=text(options.query).toLowerCase(),selected=options.sourceIds==null?null:new Set(options.sourceIds);
    const read=new Set(options.readIds || []),saved=new Set(options.savedIds || []);
    return (items || []).filter(item=>{
      if(!item)return false;const source=lookup(options.sourceMap,item.sourceId)||{};
      const haystack=[item.title,item.summary,source.name,...(item.tags||[])].join(' ').toLowerCase();
      if(selected&&![item.sourceId,...(item.sourceIds||[])].some(id=>selected.has(id)))return false;
      if(options.category&&(item.category||source.category)!==options.category)return false;
      if(query&&!query.split(/\s+/).every(term=>haystack.includes(term)))return false;
      if(includes.length&&!includes.some(term=>haystack.includes(term)))return false;
      if(excludes.some(term=>haystack.includes(term)))return false;
      if(includeRegex.length&&!includeRegex.some(fn=>fn(haystack)))return false;
      if(excludeRegex.some(fn=>fn(haystack)))return false;
      if(options.onlyUnread&&read.has(item.id))return false;
      if(options.savedOnly&&!saved.has(item.id))return false;
      if(options.withImagesOnly&&!(item.media||[]).some(m=>m.kind==='image')&&!item.image)return false;
      return true;
    });
  }
  function rankItems(items,options={}) {
    const now=Number.isFinite(options.now)?options.now:Date.now();
    const terms=text(options.query).toLowerCase().split(/\s+/).filter(Boolean);
    const timestamp=item=>{const value=Date.parse(item.publishedAt||item.date||'');return Number.isFinite(value)&&value<=now?value:0;};
    const relevance=item=>{
      const published=timestamp(item),age=published?Math.max(0,(now-published)/86400000):Infinity;
      const title=text(item.title).toLowerCase(),summary=text(item.summary).toLowerCase();
      return (Number(lookup(options.sourceWeights,item.sourceId))||0)+terms.reduce((s,t)=>s+(title.includes(t)?3:0)+(summary.includes(t)?1:0),0)+(published?2/(1+age):0);
    };
    // Compute each date/score once per complete ranking, instead of repeating
    // parsing and token scans for every sort comparison.
    return (items || []).map((item,index)=>({item,index,time:timestamp(item),score:options.sort==='relevance'?relevance(item):0,
      source:options.sort==='source'?text(lookup(options.sourceMap,item.sourceId)?.name||item.sourceId):''})).sort((a,b)=>{
      let diff=0;
      if(options.sort==='oldest')diff=a.time&&b.time?a.time-b.time:a.time?-1:b.time?1:0;
      else if(options.sort==='source')diff=a.source.localeCompare(b.source);
      else if(options.sort==='relevance')diff=b.score-a.score;
      return diff||b.time-a.time||a.index-b.index;
    }).map(row=>row.item);
  }
  function freshness(digest,options={}) {
    const now=Number.isFinite(options.now)?options.now:Date.now(),maxAgeMs=number(options.maxAgeMs,2*3600000,0,Infinity);
    const data=record(digest),published=Date.parse(data.generatedAt||'');
    const successes=(Array.isArray(data.sources)?data.sources:[]).map(row=>Date.parse(row.lastSuccessAt||row.lastSuccessfulFetchAt||row.lastSuccess||'')).filter(Number.isFinite);
    const lastSuccess=successes.length?Math.max(...successes):null;
    const stamp=lastSuccess??(Number.isFinite(published)?published:null),ageMs=stamp===null?null:Math.max(0,now-stamp);
    const status=options.offline?'offline':stamp===null?'unknown':stamp>now+300000?'future':ageMs>maxAgeMs?'stale':'current';
    const messages={offline:'Offline — showing the last saved snapshot.',unknown:'Refresh time unavailable.',future:'Snapshot time is ahead of this device clock.',stale:'Updates are overdue — showing the last saved snapshot.',current:lastSuccess===null?'Recent snapshot; individual source health is shown separately.':'Recently refreshed; individual source health is shown separately.'};
    return {status,ageMs,lastSuccessAt:lastSuccess===null?'':new Date(lastSuccess).toISOString(),snapshotAt:text(data.generatedAt),message:messages[status]};
  }
  function clusterStories(items,options={}) {
    const rows=Array.isArray(items)?items:[],threshold=number(options.threshold,0.72,0.5,1),windowMs=number(options.windowHours,72,1,720)*3600000;
    const maxItems=Math.round(number(options.maxItems,2000,1,10000)),maxCandidates=Math.round(number(options.maxCandidates,100,1,500));
    const stops=new Set(['the','a','an','and','or','of','to','for','in','on','is','are','with','from','by','at','this','that','new','news','update','updates']);
    const words=title=>new Set((text(title).toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]{2,}/gu)||[]).filter(t=>!stops.has(t)).slice(0,40));
    const groups=[],terms=new Map(),urls=new Map();
    for(let index=0;index<rows.length;index++){
      const item=rows[index];if(!item||typeof item!=='object')continue;
      const tokens=words(item.title),url=canonicalUrl(item.url),stamp=Date.parse(item.publishedAt||item.date),dated=Number.isFinite(stamp);
      let found=url?urls.get(url):undefined;
      if(found===undefined&&index<maxItems&&tokens.size>=3){
        const candidates=new Set();
        for(const token of tokens){for(const group of terms.get(token)||[]){candidates.add(group);if(candidates.size>=maxCandidates)break;}if(candidates.size>=maxCandidates)break;}
        let best=threshold;
        for(const candidate of candidates){
          const group=groups[candidate];
          if(dated!==group.dated)continue;
          if(dated&&(Math.max(stamp,group.maxTime)-Math.min(stamp,group.minTime)>windowMs))continue;
          let shared=0;for(const token of tokens)if(group.tokens.has(token))shared++;
          const score=shared/(tokens.size+group.tokens.size-shared);
          // Unknown dates and short generic titles are not enough evidence to join.
          if(shared>=3&&score>=best&&(dated||score===1&&tokens.size>=5)){found=candidate;best=score;}
        }
      }
      if(found===undefined){
        found=groups.length;groups.push({id:`story:${text(item.id)||url||index}`,title:text(item.title),items:[],sourceIds:[],tokens,dated,minTime:dated?stamp:0,maxTime:dated?stamp:0});
        if(index<maxItems)for(const token of tokens){if(!terms.has(token))terms.set(token,[]);terms.get(token).push(found);}
      }
      const group=groups[found];group.items.push(item);group.sourceIds=strings([...group.sourceIds,item.sourceId,...(Array.isArray(item.sourceIds)?item.sourceIds:[])]);
      if(dated){if(!group.dated){group.minTime=stamp;group.maxTime=stamp;group.dated=true;}else{group.minTime=Math.min(group.minTime,stamp);group.maxTime=Math.max(group.maxTime,stamp);}}
      if(url)urls.set(url,found);
    }
    return {method:'lexical-title-similarity',limited:rows.length>maxItems,groups:groups.map(({tokens,dated,minTime,maxTime,...group})=>({...group,latestAt:dated?new Date(maxTime).toISOString():''}))};
  }
  async function rankItemsSemantic(items,options={}) {
    const lexical=rankItems(items,{...options,sort:'relevance'}),query=text(options.query).slice(0,4096);
    const fallback=reason=>({method:'lexical',items:lexical,scores:[],scoredCount:0,reason});
    if(!query)return fallback('A query is required for semantic ranking.');
    if(typeof options.embedder!=='function')return fallback('No embedding provider is configured.');
    if(!lexical.length)return {method:'semantic',items:[],scores:[],scoredCount:0,reason:''};
    const aborted=()=>{const error=new Error('Ranking was cancelled.');error.name='AbortError';return error;};
    if(options.signal?.aborted)throw aborted();
    const limit=Math.round(number(options.maxItems,200,1,500)),sample=lexical.slice(0,limit),controller=typeof AbortController!=='undefined'?new AbortController():null;
    let rejectCancelled;const cancelled=new Promise((_,reject)=>{rejectCancelled=reject;});
    const cancel=()=>{controller?.abort();rejectCancelled(aborted());};options.signal?.addEventListener?.('abort',cancel,{once:true});
    let timer,timedOut=false;
    try{
      const input=[query,...sample.map(item=>`${text(item.title).slice(0,500)}\n${text(item.summary).slice(0,4000)}`)];
      const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{timedOut=true;controller?.abort();reject(new Error('timeout'));},number(options.timeoutMs,8000,10,60000));});
      const vectors=await Promise.race([Promise.resolve().then(()=>options.embedder(input,{signal:controller?.signal||options.signal})),timeout,cancelled]);
      if(options.signal?.aborted)throw aborted();
      if(!Array.isArray(vectors)||vectors.length!==input.length)throw new Error('vectors');
      let dimension=0;
      const unit=vectors.map(vector=>{
        if(!Array.isArray(vector)&&!ArrayBuffer.isView(vector))throw new Error('vectors');
        if(!dimension)dimension=vector.length;
        if(!dimension||dimension>4096||vector.length!==dimension)throw new Error('vectors');
        let sum=0;for(const value of vector){if(typeof value!=='number'||!Number.isFinite(value))throw new Error('vectors');sum+=value*value;}
        if(!sum||!Number.isFinite(sum))throw new Error('vectors');const scale=Math.sqrt(sum);return Array.from(vector,value=>value/scale);
      });
      const ranked=sample.map((item,index)=>({item,index,score:unit[0].reduce((sum,value,k)=>sum+value*unit[index+1][k],0)})).sort((a,b)=>b.score-a.score||a.index-b.index);
      return {method:lexical.length>sample.length?'semantic-with-lexical-tail':'semantic',items:[...ranked.map(row=>row.item),...lexical.slice(limit)],scores:ranked.map(({item,score})=>({id:item.id,score})),scoredCount:sample.length,reason:''};
    }catch(error){
      if(options.signal?.aborted)throw aborted();
      return fallback(timedOut?'Embedding provider timed out; lexical ranking was used.':'Embedding provider failed or returned invalid vectors; lexical ranking was used.');
    }finally{clearTimeout(timer);options.signal?.removeEventListener?.('abort',cancel);}
  }
  function mergeDigests(previous,incoming) {
    const old=record(previous),next=record(incoming);
    if(!Array.isArray(next.items)||!Array.isArray(next.sources))throw new Error('Invalid feed snapshot: items and sources arrays are required.');
    const items=new Map();
    for(const item of [...(old.items||[]),...next.items]){const normal=normalizeItem(item);if(normal)items.set(`${normal.sourceId}:${normal.id}`,normal);}
    const sources=new Map((old.sources||[]).filter(s=>s&&s.id).map(s=>[s.id,s]));
    for(const source of next.sources)if(source&&source.id)sources.set(source.id,{...(sources.get(source.id)||{}),...source});
    return {...old,...next,schemaVersion:1,items:rankItems([...items.values()]),sources:[...sources.values()]};
  }
  function parseImportedFeed(input,options={}) {
    if(typeof input!=='string')throw new TypeError('Feed import requires text.');
    if(input.length>8*1024*1024)throw new RangeError('Feed exceeds the 8 MiB import limit; import a smaller publisher feed.');
    const baseUrl=safeUrl(options.baseUrl),feedUrl=safeUrl(options.feedUrl),sourceId=text(options.sourceId)||`custom:${baseUrl||'import'}`;
    const sources=[{id:sourceId,name:'Imported feed',url:baseUrl,feedUrl,category:'custom',defaultEnabled:true,custom:true}],items=[];
    const add=raw=>{const item=normalizeItem({...raw,sourceId},sources[0]);if(item)items.push(item);};
    if(/^\s*\{/.test(input)){
      const feed=JSON.parse(input);
      if(!['https://jsonfeed.org/version/1','https://jsonfeed.org/version/1.1'].includes(feed.version)||!Array.isArray(feed.items))throw new Error('Expected JSON Feed version 1 or 1.1.');
      sources[0].name=text(feed.title)||'Imported feed';sources[0].url=safeUrl(feed.home_page_url,baseUrl)||baseUrl;sources[0].feedUrl=safeUrl(feed.feed_url,baseUrl)||feedUrl;
      for(const item of feed.items){
        const media=(Array.isArray(item.attachments)?item.attachments:[]).map(a=>({url:a.url,mimeType:a.mime_type,kind:/^audio\//.test(a.mime_type)?'audio':/^video\//.test(a.mime_type)?'video':/^image\//.test(a.mime_type)?'image':''}));
        add({...item,id:item.id!=null?`${sourceId}:${String(item.id)}`:'',media,summary:item.summary||item.content_text});
      }
    } else {
      if(/<!DOCTYPE|<!ENTITY/i.test(input))throw new Error('DTD and entity declarations are not supported.');
      const Parser=options.DOMParser||(typeof DOMParser!=='undefined'?DOMParser:null);if(!Parser)throw new Error('XML import requires the host DOMParser.');
      const doc=new Parser().parseFromString(input,'application/xml');
      if(doc.getElementsByTagName('parsererror').length)throw new Error('Invalid RSS or Atom XML.');
      const local=node=>node.localName||node.nodeName?.split(':').pop();
      const children=node=>Array.from(node?.children||node?.childNodes||[]).filter(n=>n.nodeType===1);
      const child=(node,name)=>children(node).find(n=>local(n)===name);
      const value=(node,name)=>child(node,name)?.textContent||'';
      const root=doc.documentElement,rootName=local(root);
      if(!['rss','feed','RDF'].includes(rootName))throw new Error('Expected RSS or Atom XML.');
      const channel=child(root,'channel')||root;
      sources[0].name=text(value(channel,'title'))||'Imported feed';
      const atom=rootName==='feed';const articleNodes=children(atom?root:rootName==='RDF'?root:channel).filter(n=>local(n)===(atom?'entry':'item'));
      const channelLinks=children(channel).filter(n=>local(n)==='link');
      const homeLink=atom?channelLinks.find(n=>!n.getAttribute('rel')||n.getAttribute('rel')==='alternate')?.getAttribute('href'):value(channel,'link');
      sources[0].url=safeUrl(homeLink,baseUrl)||baseUrl;
      const selfLink=channelLinks.find(n=>n.getAttribute('rel')==='self')?.getAttribute('href');
      sources[0].feedUrl=safeUrl(selfLink,baseUrl)||feedUrl;
      for(const entry of articleNodes){
        const links=children(entry).filter(n=>local(n)==='link'),link=atom?(links.find(n=>!n.getAttribute('rel')||n.getAttribute('rel')==='alternate')?.getAttribute('href')||''):value(entry,'link');
        const media=[];for(const n of children(entry)){const name=local(n),url=n.getAttribute('url')||(name==='link'&&n.getAttribute('rel')==='enclosure'?n.getAttribute('href'):'');
          if(!url)continue;const type=n.getAttribute('type')||n.getAttribute('medium')||'';const kind=name==='thumbnail'?'image':/^image/.test(type)?'image':/^audio/.test(type)?'audio':/^video/.test(type)?'video':'';if(kind)media.push({kind,url});}
        const guid=value(entry,atom?'id':'guid');
        add({id:guid?`${sourceId}:${guid}`:'',title:value(entry,'title'),url:safeUrl(link,baseUrl),date:value(entry,atom?'published':'pubDate')||value(entry,'date'),publishedAt:value(entry,atom?'published':'issued')||value(entry,'pubDate'),updatedAt:atom?value(entry,'updated'):value(entry,'modified'),
          summary:value(entry,atom?'summary':'description'),media,author:value(entry,'author'),tags:children(entry).filter(n=>local(n)==='category').map(n=>n.getAttribute('term')||n.textContent)});
      }
    }
    if(!items.length)throw new Error('Feed contains no supported articles with a title and HTTP(S) link.');
    if(!sources[0].url)sources[0].url=new URL(items[0].url).origin;
    return {schemaVersion:1,sources,items:deduplicateItems(items)};
  }
  function exportFeedResult(items,options={}) {
    const title=text(options.title)||'Feed',url=safeUrl(options.url),feedUrl=safeUrl(options.feedUrl),format=choice(options.format,['rss','atom','json'],'json');
    const rows=(items||[]).map(item=>normalizeItem(item)).filter(Boolean);
    const finish=(content,exportedItems=rows.length)=>({content,format,inputItems:rows.length,exportedItems,omittedItems:rows.length-exportedItems,
      warnings:rows.length>exportedItems?[`${rows.length-exportedItems} item(s) lack an original publication or update timestamp and were omitted from Atom. JSON Feed and RSS retain these stories.`]:[]});
    const xml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
    const mime=media=>{if(media.mimeType)return media.mimeType;const suffix=new URL(media.url).pathname.toLowerCase();
      if(media.kind==='audio')return /\.ogg$/.test(suffix)?'audio/ogg':/\.m4a$/.test(suffix)?'audio/mp4':/\.wav$/.test(suffix)?'audio/wav':/\.mp3$/.test(suffix)?'audio/mpeg':'application/octet-stream';
      if(media.kind==='video')return /\.webm$/.test(suffix)?'video/webm':/\.mp4$/.test(suffix)?'video/mp4':'application/octet-stream';
      return /\.png$/.test(suffix)?'image/png':/\.webp$/.test(suffix)?'image/webp':/\.gif$/.test(suffix)?'image/gif':/\.jpe?g$/.test(suffix)?'image/jpeg':'application/octet-stream';};
    if(format==='json')return finish(JSON.stringify({version:'https://jsonfeed.org/version/1.1',title,...(url?{home_page_url:url}:{}),...(feedUrl?{feed_url:feedUrl}:{}),
      items:rows.map(item=>({id:item.id,url:item.url,title:item.title,content_text:item.summary||item.title,...(item.publishedAt?{date_published:item.publishedAt}:{}),
        ...(item.date?{_feed_core:{date:item.date.slice(0,10)}}:{}),
        ...(item.updatedAt?{date_modified:item.updatedAt}:{}),...(item.tags.length?{tags:item.tags}:{}),...((item.media.find(m=>m.kind==='image'))?{image:item.media.find(m=>m.kind==='image').url}:{}),
        ...(item.media.some(m=>m.kind!=='embed')?{attachments:item.media.filter(m=>m.kind!=='embed').map(m=>({url:m.url,mime_type:mime(m)}))}:{})}))},null,2));
    if(format==='rss')return finish(`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><channel><title>${xml(title)}</title><link>${xml(url||feedUrl)}</link><description>${xml(title)}</description>${rows.map(item=>`<item><guid isPermaLink="false">${xml(item.id)}</guid><title>${xml(item.title)}</title><link>${xml(item.url)}</link>${item.publishedAt?`<pubDate>${xml(new Date(item.publishedAt).toUTCString())}</pubDate><dcterms:issued>${xml(item.publishedAt)}</dcterms:issued>`:''}${item.date?`<dc:date>${xml(item.date.slice(0,10))}</dc:date>`:''}${item.updatedAt?`<dcterms:modified>${xml(item.updatedAt)}</dcterms:modified>`:''}<description>${xml(item.summary||item.title)}</description>${item.media.filter(m=>m.kind!=='embed').map(m=>`<media:content url="${xml(m.url)}" medium="${m.kind}"/>`).join('')}</item>`).join('')}</channel></rss>`);
    // Atom requires a real entry updated instant. Feed generation is not article modification.
    const generatedAt=validTimestamp(options.generatedAt);if(!generatedAt)throw new Error('Atom export requires an explicit generatedAt timestamp for the feed.');
    const updated=new Date(generatedAt).toISOString();
    const timed=rows.filter(item=>item.publishedAt||item.updatedAt);
    return finish(`<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><id>${xml(feedUrl||url||'urn:feed:export')}</id><title>${xml(title)}</title><updated>${updated}</updated><author><name>${xml(text(options.author)||title)}</name></author>${timed.map(item=>`<entry><id>${xml(item.url)}</id><title>${xml(item.title)}</title><link href="${xml(item.url)}"/><updated>${xml(item.updatedAt||item.publishedAt)}</updated>${item.publishedAt?`<published>${xml(item.publishedAt)}</published>`:''}${item.date?`<dc:date>${xml(item.date.slice(0,10))}</dc:date>`:''}<summary>${xml(item.summary||item.title)}</summary>${item.media.filter(m=>m.kind!=='embed').map(m=>`<link rel="enclosure" href="${xml(m.url)}" type="${mime(m)}"/>`).join('')}</entry>`).join('')}</feed>`,timed.length);
  }
  function exportFeed(items,options={}){return exportFeedResult(items,options).content;}
  return Object.freeze({VERSION,VIEWS,safeUrl,canonicalUrl,validDate,validTimestamp,normalizeItem,deduplicateItems,sourceEnabled,resolveSourceSelection,normalizeTickerOptions,normalizeFeedRecipe,normalizeDashboard,normalizePreferences,
    normalisePreferences:normalizePreferences,exportPreferences,importPreferences,compilePattern,filterItems,rankItems,clusterStories,rankItemsSemantic,freshness,mergeDigests,parseImportedFeed,exportFeed,exportFeedResult});
});
