/* content-extraction-core 0.1.0 — inert HTML metadata, feed discovery and listings.
 * No network, execution of publisher scripts, storage, or framework dependency.
 */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('../feed-core/feed-core.js'):root.FeedCore);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ContentExtractionCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Feed){
  'use strict';
  if(!Feed)throw new Error('content-extraction-core requires feed-core.');
  const VERSION='0.1.0', MAX_HTML=4*1024*1024, MAX_NODES=50000;
  const clean=(v,n=2000)=>typeof v==='string'?v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/\s+/g,' ').trim().slice(0,n):'';
  const diagnostic=(level,code,message,extra={})=>({level,code,message,...extra});
  function parse(input,options={}){
    if(typeof input!=='string')throw new TypeError('HTML must be text.');
    if(input.length>MAX_HTML)throw new RangeError('HTML exceeds the 4 MiB extraction limit.');
    const Parser=options.DOMParser||(typeof DOMParser!=='undefined'?DOMParser:null);
    if(!Parser)throw new Error('Supply a DOMParser implementation for HTML extraction.');
    // Parse only a fixed empty document. User HTML goes into a detached template:
    // unlike a bare HTML DOMParser document, its images/frames are inert too.
    const document=new Parser().parseFromString('<!doctype html><html><body></body></html>','text/html');
    const template=document.createElement('template');
    if(!template.content)throw new Error('The DOM adapter must support inert HTML templates.');
    template.innerHTML=input;
    const root=template.content;
    if(root.querySelectorAll('*').length>MAX_NODES)throw new RangeError('HTML exceeds the 50,000 element extraction limit.');
    return root;
  }
  function plain(node,limit=2000){
    if(!node)return '';
    const stack=[node],parts=[];let length=0;
    const skip=new Set(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','IFRAME','OBJECT','SVG','NAV','FOOTER','FORM']);
    const block=new Set(['ARTICLE','MAIN','SECTION','DIV','P','H1','H2','H3','H4','H5','H6','LI','BR','TR','TD','BLOCKQUOTE']);
    while(stack.length&&length<limit+100){
      const entry=stack.pop();
      if(typeof entry==='string'){parts.push(entry);length+=entry.length;continue;}
      if(entry.nodeType===3){const value=(entry.textContent||'').slice(0,limit+100-length);parts.push(value);length+=value.length;continue;}
      if(skip.has(entry.tagName)||entry.hasAttribute?.('hidden')||entry.getAttribute?.('aria-hidden')==='true')continue;
      const separate=block.has(entry.tagName);if(separate){parts.push(' ');length++;stack.push(' ');}
      const children=[...(entry.childNodes||[])];for(let i=children.length-1;i>=0;i--)stack.push(children[i]);
    }
    return clean(parts.join(''),limit);
  }
  function select(root,selector){
    if(!selector)return null;
    if(selector===':scope'||selector===':self')return root;
    return root.matches?.(selector)?root:root.querySelector(selector);
  }
  function metadata(root){
    const map=new Map();
    for(const node of root.querySelectorAll('meta[property],meta[name],meta[itemprop]')){
      const key=clean(node.getAttribute('property')||node.getAttribute('name')||node.getAttribute('itemprop'),100).toLowerCase();
      const value=clean(node.getAttribute('content'),10000);if(key&&value&&!map.has(key))map.set(key,value);
    }
    return (...keys)=>keys.map(k=>map.get(k.toLowerCase())).find(Boolean)||'';
  }
  function feedLinks(root,baseUrl){
    const result=[],seen=new Set();
    const types=new Set(['application/rss+xml','application/atom+xml','application/feed+json']);
    for(const node of root.querySelectorAll('link[rel][href]')){
      const rel=(node.getAttribute('rel')||'').toLowerCase().split(/\s+/),type=(node.getAttribute('type')||'').split(';')[0].trim().toLowerCase();
      if(!rel.includes('alternate')||!types.has(type))continue;
      const url=Feed.safeUrl(node.getAttribute('href'),baseUrl);
      if(url&&!seen.has(url)){seen.add(url);result.push({url,type,title:clean(node.getAttribute('title'),300)});}
      if(result.length>=50)break;
    }
    return result;
  }
  function discoverFeeds(html,options={}){return feedLinks(parse(html,options),Feed.safeUrl(options.baseUrl));}
  function structuredArticle(root,diagnostics){
    let visited=0;
    const articles=[];
    const walk=(value,depth)=>{
      if(!value||typeof value!=='object'||depth>8||++visited>1000)return;
      if(Array.isArray(value)){for(const entry of value.slice(0,200))walk(entry,depth+1);return;}
      const types=Array.isArray(value['@type'])?value['@type']:[value['@type']];
      if(types.some(type=>typeof type==='string'&&/(?:^|[/#])(?:Article|NewsArticle|BlogPosting|TechArticle|Report|ScholarlyArticle)$/.test(type)))articles.push(value);
      for(const key of ['@graph','mainEntity','itemListElement','item'])if(value[key])walk(value[key],depth+1);
    };
    for(const script of [...root.querySelectorAll('script[type]')].filter(node=>(node.getAttribute('type')||'').split(';')[0].trim().toLowerCase()==='application/ld+json').slice(0,32)){
      const json=script.textContent||'';
      if(json.length>256*1024){diagnostics.push(diagnostic('warning','jsonld-size','A structured-data block exceeded 256 KiB and was ignored.'));continue;}
      try{walk(JSON.parse(json),0);}catch(_){diagnostics.push(diagnostic('warning','invalid-jsonld','A structured-data block was malformed; other metadata remains available.'));}
    }
    return articles.find(article=>clean(article.headline))||articles[0]||{};
  }
  const objectUrl=value=>typeof value==='string'?value:value&&typeof value==='object'?value.url||value['@id']||value.contentUrl||'':'';
  function extractArticle(html,options={}){
    const root=parse(html,options),baseUrl=Feed.safeUrl(options.baseUrl),diagnostics=[],meta=metadata(root),data=structuredArticle(root,diagnostics),provenance={};
    const choose=(field,choices)=>{for(const [origin,value]of choices){if(value){provenance[field]=origin;return value;}}return '';};
    const canonical=[...root.querySelectorAll('link[rel][href]')].find(el=>(el.getAttribute('rel')||'').toLowerCase().split(/\s+/).includes('canonical'));
    const url=choose('url',[['canonical',Feed.safeUrl(canonical?.getAttribute('href'),baseUrl)],['jsonld',Feed.safeUrl(objectUrl(data.mainEntityOfPage)||objectUrl(data.url),baseUrl)],['og:url',Feed.safeUrl(meta('og:url'),baseUrl)],['input',baseUrl]]);
    const title=choose('title',[['jsonld.headline',clean(data.headline,500)],['og:title',meta('og:title')],['heading',plain(root.querySelector('h1'),500)],['title',plain(root.querySelector('title'),500)]]);
    const dateNode=root.querySelector('[itemprop="datePublished"],time[pubdate]');
    const date=choose('date',[['jsonld.datePublished',Feed.validDate(data.datePublished)],['published metadata',Feed.validDate(meta('article:published_time','datePublished','date'))],['publication element',Feed.validDate(dateNode?.getAttribute('datetime')||dateNode?.getAttribute('content')||plain(dateNode,100))]]);
    const updatedAt=choose('updatedAt',[['jsonld.dateModified',Feed.validDate(data.dateModified)],['modified metadata',Feed.validDate(meta('article:modified_time','dateModified'))]]);
    const body=root.querySelector('[itemprop="articleBody"],article,main');
    const bodyText=clean(data.articleBody,100000)||plain(body,100000);
    const summary=choose('summary',[['jsonld.description',clean(data.description)],['description metadata',meta('description','og:description','twitter:description')],['first paragraph',plain(body?.querySelector('p'))]]);
    const authors=Array.isArray(data.author)?data.author:[data.author];
    const author=authors.map(a=>typeof a==='string'?clean(a,200):clean(a?.name,200)).filter(Boolean).join(', ')||meta('author','article:author');
    const images=Array.isArray(data.image)?data.image:[data.image],media=[],seen=new Set();
    for(const raw of [...images.map(objectUrl),meta('og:image','twitter:image'),body?.querySelector('img')?.getAttribute('src')]){
      const image=Feed.safeUrl(raw,baseUrl||url);if(image&&!seen.has(image)){seen.add(image);media.push({kind:'image',url:image});}
      if(media.length>=8)break;
    }
    if(!title)diagnostics.push(diagnostic('error','missing-title','No article title was found.'));
    if(!url)diagnostics.push(diagnostic('error','missing-url','A valid HTTP(S) page URL is required.'));
    if(!date)diagnostics.push(diagnostic('warning','unknown-publication-date','No valid publication date was found; it remains unknown.'));
    if(!bodyText)diagnostics.push(diagnostic('warning','missing-body','No structured article body or article/main text was found.'));
    return {title:clean(title,500),url,date,publishedAt:date,updatedAt,summary:clean(summary),text:bodyText,author,media,
      tags:(typeof data.keywords==='string'?data.keywords.split(','):Array.isArray(data.keywords)?data.keywords:[]).map(x=>clean(x,100)).filter(Boolean).slice(0,30),
      feeds:feedLinks(root,baseUrl),provenance,diagnostics};
  }
  function validateSelectors(selectors,root){
    const errors=[];
    for(const field of ['item','title','link'])if(!selectors?.[field])errors.push(diagnostic('error','missing-selector',`${field} needs a CSS selector.`,{field}));
    for(const [field,selector]of Object.entries(selectors||{})){
      if(typeof selector!=='string'||selector.length>512){errors.push(diagnostic('error','invalid-selector',`${field} must be a CSS selector of at most 512 characters.`,{field}));continue;}
      if(!selector||selector===':scope'||selector===':self')continue;
      if(/:has\s*\(/i.test(selector)){errors.push(diagnostic('error','unsupported-selector',`${field} cannot use :has(); select the repeating parent directly.`,{field}));continue;}
      try{root.querySelector(selector);}catch(_){errors.push(diagnostic('error','invalid-selector',`${field} contains invalid CSS selector syntax.`,{field}));}
    }
    return errors;
  }
  function extractListing(html,recipe={},options={}){
    const root=parse(html,options),normalized=Feed.normalizeFeedRecipe(recipe),baseUrl=Feed.safeUrl(options.baseUrl||normalized.baseUrl),selectors=normalized.selectors;
    const diagnostics=validateSelectors(selectors,root),stats={matched:0,processed:0,extracted:0,skipped:0,undated:0,withoutImage:0,duplicates:0,truncated:false};
    if(!baseUrl)diagnostics.push(diagnostic('error','invalid-base-url','A valid HTTP(S) base URL is required for listing links.'));
    if(diagnostics.some(d=>d.level==='error'))return {items:[],diagnostics,stats};
    const rows=[...root.querySelectorAll(selectors.item)],items=[],seen=new Set();
    stats.matched=rows.length;stats.truncated=rows.length>normalized.limit;
    const origin=new URL(baseUrl).origin;
    for(const row of rows.slice(0,normalized.limit)){
      stats.processed++;
      const link=select(row,selectors.link),titleNode=select(row,selectors.title);
      const url=Feed.safeUrl(link?.getAttribute('href')||link?.getAttribute('data-url'),baseUrl),title=plain(titleNode,500)||clean(link?.getAttribute('title'),500);
      if(!url||!title||(!normalized.allowCrossOrigin&&new URL(url).origin!==origin)){
        stats.skipped++;
        if(diagnostics.filter(d=>d.code==='invalid-item').length<20)diagnostics.push(diagnostic('warning','invalid-item','A selected row lacked a safe title/link or linked outside the allowed origin.',{row:stats.processed}));
        continue;
      }
      const key=Feed.canonicalUrl(url);if(seen.has(key)){stats.duplicates++;continue;}seen.add(key);
      const time=select(row,selectors.date),image=select(row,selectors.image),summary=select(row,selectors.summary);
      const date=Feed.validDate(time?.getAttribute('datetime')||time?.getAttribute('content')||time?.getAttribute('data-published')||plain(time,100));
      const imageUrl=['src','data-src','data-lazy-src','content'].map(name=>Feed.safeUrl(image?.getAttribute(name),baseUrl)).find(Boolean)||'';
      if(!date)stats.undated++;if(!imageUrl)stats.withoutImage++;
      const item=Feed.normalizeItem({sourceId:normalized.sourceId,title,url,date,summary:plain(summary),category:normalized.category,media:imageUrl?[{kind:'image',url:imageUrl}]:[]});
      if(item)items.push(item);
    }
    stats.extracted=items.length;
    if(stats.matched===0)diagnostics.push(diagnostic('error','no-matching-rows','The repeating item selector matched no elements; the page may have changed or require scripts.'));
    if(stats.undated)diagnostics.push(diagnostic('warning','unknown-publication-date',`${stats.undated} extracted item(s) have no valid publication date; none was invented.`));
    if(stats.truncated)diagnostics.push(diagnostic('warning','item-limit',`Only the first ${normalized.limit} selected rows were processed.`));
    return {items,diagnostics,stats};
  }
  return Object.freeze({VERSION,MAX_HTML,discoverFeeds,extractArticle,extractListing});
});
