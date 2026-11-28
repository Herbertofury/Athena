'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {parseHTML}=require('linkedom');

const NOW=new Date().toISOString();
function fixture(){return {catalog:{schemaVersion:1,reviewedAt:NOW,sources:[
  {id:'alpha',name:'Alpha',url:'https://alpha.example/',managed:true,defaultEnabled:true,category:'reporting'},
  {id:'beta',name:'Beta',url:'https://beta.example/',managed:true,defaultEnabled:false,category:'advisory'}
],briefing:[]},digest:{schemaVersion:1,generatedAt:NOW,sources:[{id:'alpha',status:'ok',health:'healthy',lastSuccessfulCheckAt:NOW},{id:'beta',status:'ok',health:'healthy',lastSuccessfulCheckAt:NOW}],items:[
  {id:'a',sourceId:'alpha',title:'An original headline',url:'https://alpha.example/story',date:'2026-11-20T12:34:00Z',media:[]},
  {id:'b',sourceId:'beta',title:'Disabled source story',url:'https://beta.example/story',date:'2026-11-20T13:34:00Z',media:[]}
]}};}
function harness(initial={},config={}){
  const {window}=parseHTML('<html><body><main id="host"></main></body></html>');
  window.HTMLElement.prototype.getBoundingClientRect=function(){return {width:600,height:40,left:0,top:0,right:600,bottom:40};};
  const storage=new Map(Object.entries(initial).map(([k,v])=>[k,JSON.stringify(v)])),downloads=[];
  const env={document:window.document,DOMParser:window.DOMParser,Event:window.Event,Date,URL,TextDecoder,console,setTimeout,clearTimeout,setInterval,clearInterval,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{onLine:false},location:{protocol:'file:',href:'file:///reader.html'},
    matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}}),addEventListener:window.addEventListener.bind(window),removeEventListener:window.removeEventListener.bind(window),CSS:{escape:s=>s}};
  vm.createContext(env);
  for(const name of ['feed-core','ticker-core','content-extraction-core','feed-generation-core','visual-editor-core','feed-widget-core'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..','..',name,name+'.js'),'utf8'),env,{filename:name+'.js'});
  const reader=env.FeedWidgetCore.createReader({storageNamespace:'test-reader',groups:{reporting:'Reporting',advisory:'Advisories'},...config});
  const host=window.document.querySelector('#host');reader.mount(host,fixture(),{download:(name,body,type)=>downloads.push({name,body,type})});
  const find=selector=>{const node=host.querySelector(selector);assert.ok(node,`Missing ${selector}`);return node;};
  // Linkedom leaves RCDATA entities encoded in textarea.value. Model the browser
  // form value here; this is a DOM contract harness, not browser layout proof.
  const formValues=()=>{for(const node of host.querySelectorAll('textarea'))if(!Object.hasOwn(node,'value')){const div=window.document.createElement('div');div.innerHTML=node.textContent;Object.defineProperty(node,'value',{value:div.textContent,writable:true,configurable:true});}};
  const click=async selector=>{formValues();find(selector).click();await Promise.resolve();await Promise.resolve();};
  const set=async(selector,value,type='change')=>{formValues();const node=find(selector);if(typeof value==='boolean')node.checked=value;else Object.defineProperty(node,'value',{value:String(value),writable:true,configurable:true});node.dispatchEvent(new window.Event(type,{bubbles:true}));await Promise.resolve();await Promise.resolve();};
  return {reader,host,find,click,set,storage,downloads,env,prefs:()=>JSON.parse(storage.get('test-reader-preferences:v1')||'{}')};
}

test('mounted reading controls retain bookmarks and source overrides across remount',async t=>{
  const h=harness();t.after(()=>h.reader.dispose());
  assert.equal(h.host.querySelectorAll('[data-news-item]').length,1);
  await h.click('[data-news-save="a"]');
  assert.deepEqual(h.prefs().savedIds,['a']);assert.equal(h.prefs().savedItems[0].title,'An original headline');
  await h.click('.news-tabs [data-news-section="saved"]');
  await h.click('[data-news-read="a"]');await h.set('#news-unread',true);
  assert.equal(h.host.querySelectorAll('[data-news-item]').length,0);
  await h.set('#news-unread',false);
  await h.click('.news-tabs [data-news-section="sources"]');
  await h.set('[data-news-enable="alpha"]',false);await h.set('[data-news-enable="beta"]',true);
  assert.deepEqual(h.prefs().sourceOverrides,{alpha:false,beta:true});
  await h.click('.news-tabs [data-news-section="latest"]');
  assert.equal(h.find('[data-news-item]').getAttribute('data-news-item'),'b');
  h.reader.mount(h.host,fixture());
  assert.equal(h.find('[data-news-item]').getAttribute('data-news-item'),'b');
  await h.click('[data-news-action="export"]');
  assert.equal(JSON.parse(h.downloads[0].body).preferences.savedItems[0].id,'a');
});

test('presets preserve custom source ownership and invalid patterns leave saved filters unchanged',async t=>{
  const initial={'test-reader-preferences:v1':{customSources:[{id:'custom-one',name:'Mine',url:'https://mine.example/',feedUrl:'https://mine.example/feed'}],sourceOverrides:{alpha:false},savedIds:['a']}};
  const h=harness(initial);t.after(()=>h.reader.dispose());
  await h.click('.news-tabs [data-news-section="customize"]');
  await h.set('[data-news-setting="view"]','masonry');await h.set('[data-ticker-setting="direction"]','right');
  await h.set('#news-preset-name','Morning','input');await h.click('[data-news-action="save-preset"]');
  await h.set('[data-news-setting="view"]','list');await h.click('[data-preset-apply]');
  assert.equal(h.prefs().view,'masonry');assert.equal(h.prefs().ticker.direction,'right');
  assert.equal(h.prefs().customSources[0].id,'custom-one');assert.equal(h.prefs().sourceOverrides.alpha,false);assert.deepEqual(h.prefs().savedIds,['a']);
  await h.set('[data-news-words="includeRegex"]','(a+)+$','input');await h.click('[data-news-action="apply-filters"]');
  assert.deepEqual(h.prefs().includeRegex,[]);assert.match(h.find('[data-news-notice]').textContent,/group|supported|syntax/i);
});

test('visual dashboard operations affect actual rendered independent views and persist order',async t=>{
  const h=harness();t.after(()=>h.reader.dispose());
  await h.click('.news-tabs [data-news-section="dashboard"]');
  assert.equal(h.host.querySelectorAll('[data-widget-id]').length,1);
  await h.click('[data-news-action="add-widget"]');
  await h.set('[data-widget-field="title"]','My second view','input');
  await h.set('[data-widget-field="query"]','not-in-any-headline','input');
  await h.click('[data-news-action="save-widget"]');
  const widgets=h.prefs().dashboards[0].widgets;assert.equal(widgets.length,2);
  assert.equal(h.host.querySelectorAll('[data-widget-id]')[1].querySelectorAll('[data-news-item]').length,0);
  await h.click(`[data-widget-move="${widgets[1].id}"][data-offset="-1"]`);
  assert.equal(h.prefs().dashboards[0].widgets[0].title,'My second view');
  await h.click(`[data-widget-edit="${widgets[1].id}"]`);await h.click(`[data-widget-delete="${widgets[1].id}"]`);
  assert.equal(h.prefs().dashboards[0].widgets.length,1);
});

test('website builder discovers real feeds, validates a preview, saves and exports usable items',async t=>{
  const h=harness();t.after(()=>h.reader.dispose());
  await h.click('.news-tabs [data-news-section="feeds"]');
  await h.set('#news-builder-url','https://publisher.example/news','input');
  await h.set('#news-builder-name','A website feed','input');
  await h.set('#news-builder-html','<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml" title="Publisher RSS"></head><body><article><h2><a href="/one">A safe extracted headline</a></h2><time datetime="2026-11-02T10:11:12Z"></time><p>A summary.</p><span class="byline">Ada Example</span><script>globalThis.shouldNotRun=true</script></article></body></html>','input');
  await h.set('[data-news-selector="author"]','.byline','input');
  await h.click('[data-news-action="discover-feeds"]');
  assert.equal(h.find('[data-discovered-feed]').dataset.discoveredFeed,'https://publisher.example/feed.xml');
  await h.click('[data-news-action="preview-extraction"]');
  assert.equal(h.find('[data-news-action="save-generated"]').disabled,false,h.host.textContent);
  assert.match(h.find('.news-extraction-preview').textContent,/A safe extracted headline/);
  assert.equal(h.env.shouldNotRun,undefined);
  await h.click('[data-news-action="save-generated"]');
  const p=h.prefs();assert.equal(p.feedRecipes.length,1);assert.equal(p.customItems.length,1);assert.equal(p.customItems[0].date,'2026-11-02T10:11:12.000Z');assert.equal(p.customItems[0].author,'Ada Example');
  await h.click('[data-news-action="export-recipe"]');
  assert.equal(JSON.parse(h.downloads.at(-1).body).recipe.baseUrl,'https://publisher.example/news');
  await h.click('.news-tabs [data-news-section="latest"]');
  assert.equal(h.host.querySelectorAll('[data-news-item]').length,2);
});

test('the reader owns and removes ticker clones and endpoint-free local readers stay offline',async t=>{
  const h=harness();t.after(()=>h.reader.dispose());
  for(let i=0;i<4;i++){
    await h.click('.news-tabs [data-news-section="customize"]');
    assert.equal(h.host.querySelectorAll('.news-ticker-segment').length,2);
    await h.click('.news-tabs [data-news-section="latest"]');
    assert.equal(h.host.querySelectorAll('.news-ticker-segment').length,2);
  }
  assert.equal(h.host.querySelectorAll('[aria-hidden="true"] a:not([tabindex="-1"])').length,0);
  h.reader.dispose();assert.equal(h.host.querySelectorAll('.news-ticker-segment').length,1);
});

test('600-story collections keep a bounded first page in all modes without truncating search, export or saved history',async t=>{
  const h=harness();t.after(()=>h.reader.dispose());
  const data=fixture();data.digest.generatedAt=new Date(Date.now()+1000).toISOString();
  data.digest.items=Array.from({length:600},(_,i)=>({id:'bulk-'+i,sourceId:'alpha',title:'Large fixture story '+i,url:'https://alpha.example/bulk/'+i,date:'2026-11-20T12:34:00Z',media:[]}));
  h.reader.mount(h.host,data);
  for(const view of ['gallery','compact','list','masonry','magazine','carousel','imageboard','slideshow','social','ticker']){
    await h.set('#news-view',view);assert.equal(h.host.querySelectorAll('[data-news-item]').length,60,view);
    assert.deepEqual(Array.from(h.host.querySelectorAll('[data-news-item]'),node=>node.dataset.newsItem),Array.from({length:60},(_,i)=>'bulk-'+i),view+' order');
  }
  assert.match(h.find('#news-result-count').textContent,/600 stories · showing 60/);
  assert.equal(h.host.querySelectorAll('.news-ticker-segment').length,2);
  assert.equal(h.host.querySelector('.news-ticker-segment').querySelectorAll('[data-news-open]').length,120);
  await h.click('[data-news-action="mark-visible-read"]');assert.equal(h.prefs().readIds.length,60);
  await h.set('#news-view','slideshow');
  await h.click('[data-news-action="show-more"]');assert.equal(h.host.querySelectorAll('[data-news-item]').length,120);
  assert.deepEqual(Array.from(h.host.querySelectorAll('[data-news-item]'),node=>node.dataset.newsItem),Array.from({length:120},(_,i)=>'bulk-'+i));
  assert.equal(h.find('[data-news-item]:not([hidden])').dataset.newsItem,'bulk-60','newly loaded slide is visible before focus moves');
  await h.set('#news-article-search','story 599','input');assert.equal(h.host.querySelectorAll('[data-news-item]').length,1);
  await h.click('[data-news-save="bulk-599"]');assert.equal(h.prefs().savedItems[0].id,'bulk-599');
  await h.click('[data-news-action="clear-filters"]');
  await h.click('.news-tabs [data-news-section="feeds"]');await h.click('[data-news-action="export-feed"]');
  assert.equal(JSON.parse(h.downloads.at(-1).body).items.length,600);
  await h.click('.news-tabs [data-news-section="saved"]');
  h.reader.mount(h.host,{catalog:data.catalog,digest:{...data.digest,generatedAt:new Date(Date.now()+2000).toISOString(),items:[]}});
  assert.equal(h.find('[data-news-item]').dataset.newsItem,'bulk-599');
});
