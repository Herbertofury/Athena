const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../feed-core.js');
const now=Date.parse('2026-11-28T12:00:00Z');
const article=(id,extra={})=>({id,sourceId:'vendor',title:`Article ${id}`,url:`https://example.org/${id}`,date:'2026-11-27',media:[],...extra});

test('URLs preserve semantic queries and reject active schemes and credentials',()=>{
  assert.equal(core.safeUrl('javascript:alert(1)'), '');assert.equal(core.safeUrl('https://user:secret@example.org/'), '');
  assert.equal(core.canonicalUrl('https://EXAMPLE.org/a?lang=fr&utm_source=rss&x=1#comments'),'https://example.org/a?lang=fr&x=1');
  assert.notEqual(core.canonicalUrl('https://example.org/a?id=1'),core.canonicalUrl('https://example.org/a?id=2'));
});
test('normalization never substitutes fetch time for publication date or changes date precision',()=>{
  const item=core.normalizeItem(article('one',{date:'',fetchedAt:'2026-11-28T10:00:00Z'}));
  assert.equal(item.date,'');assert.equal(item.publishedAt,'');assert.equal(item.fetchedAt,'2026-11-28T10:00:00.000Z');
  assert.equal(core.normalizeItem(article('two')).date,'2026-11-27');
  assert.equal(core.validDate('2026-02-31'),'');assert.equal(core.normalizeItem(article('bad',{url:'data:text/html,hi'})),null);
});
test('exact URL dedupe preserves attribution and does not collapse distinct same-title articles',()=>{
  const rows=core.deduplicateItems([article('one'),article('copy',{sourceId:'second',url:'https://example.org/one?utm_source=x',summary:'Extra detail'}),article('distinct',{title:'Article one'})]);
  assert.equal(rows.length,2);assert.deepEqual(rows[0].sourceIds,['vendor','second']);assert.equal(rows[0].summary,'Extra detail');
});
test('explicit false and temporarily absent source choices survive catalog updates and export',()=>{
  const sources=[{id:'a',defaultEnabled:true},{id:'b',defaultEnabled:false},{id:'new',defaultEnabled:true}];
  const p=core.normalizePreferences({sourceOverrides:{a:false,b:true,temporarilyMissing:false},savedIds:['x'],readIds:['y']});
  assert.deepEqual([...core.resolveSourceSelection(sources,p)],['b','new']);
  const imported=core.importPreferences(core.exportPreferences(p),sources);
  assert.equal(imported.sourceOverrides.temporarilyMissing,false);assert.deepEqual(imported.savedIds,['x']);assert.deepEqual(imported.readIds,['y']);
});
test('typed imports discard scripts/secrets/prototype keys and preserve custom data',()=>{
  const p=core.importPreferences(JSON.stringify({format:'feed-preferences',schemaVersion:1,preferences:{view:'list',ticker:{accent:'red; background:url(x)',label:'My feed'},sourceOverrides:JSON.parse('{"__proto__":true,"constructor":true,"a":false}'),
    slackWebhook:'secret',customItems:[article('local')],customSources:[{id:'local',name:'Local',url:'https://example.org'}],presets:[{id:'preset',name:'Security',settings:{view:'magazine',readIds:['private']}}]}}));
  assert.equal(p.view,'list');assert.equal(p.slackWebhook,undefined);assert.equal(Object.hasOwn(p.sourceOverrides,'__proto__'),false);assert.equal(p.ticker.accent,'#497fcf');
  assert.equal(p.customItems.length,1);assert.equal(p.customSources.length,1);assert.equal(p.presets[0].settings.readIds,undefined);
  assert.throws(()=>core.importPreferences('{"format":"feed-preferences","schemaVersion":9,"preferences":{}}'),/version/);
});
test('filters combine selections, keywords, title search, unread, saved and source categories',()=>{
  const items=[article('a',{title:'Security patch CVE-2026-1234',summary:'Linux update'}),article('b',{title:'New release',sourceId:'other'})];
  assert.deepEqual(core.filterItems(items,{sourceIds:['vendor'],query:'patch Linux',includeKeywords:['security'],includeRegex:['CVE-[0-9]{4}-[0-9]{4,7}'],sourceMap:{vendor:{category:'advisory'}},category:'advisory',savedOnly:true,savedIds:['a'],onlyUnread:true}).map(x=>x.id),['a']);
  assert.equal(core.filterItems(items,{excludeKeywords:['security','release']}).length,0);
  assert.equal(core.filterItems(items,{onlyUnread:true,readIds:['a','b']}).length,0);
  assert.equal(core.filterItems(items,{sourceIds:[]}).length,0);
});
test('NFA patterns support useful operators without unsafe backtracking syntax',()=>{
  for(const [pattern,text,want] of [['^a+$','aaaa',true],['^a+$','baaaa',false],['patch|release','new release',true],['CVE-\\d{4}-\\d{4,7}','CVE-2026-12345',true],['[^0-9]+','123',false],['a?b','b',true],['^$','',true],['x.*y','xlong y',true]]) assert.equal(core.compilePattern(pattern)(text),want,pattern);
  for(const pattern of ['(a+)+$','(?=secret)','a\\1','[bad','a{1001}'])assert.throws(()=>core.compilePattern(pattern));
  assert.equal(core.compilePattern('a*a*a*a*a*b')('a'.repeat(12000)),false);
});
test('ranking is deterministic, excludes future boost and keeps unknown dates at end',()=>{
  const items=[article('unknown',{date:''}),article('old',{date:'2020-01-01'}),article('future',{date:'2027-01-01'}),article('new')];
  assert.deepEqual(core.rankItems(items,{now}).map(x=>x.id),['new','old','unknown','future']);
  assert.deepEqual(core.rankItems(items,{now,sort:'oldest'}).map(x=>x.id),['old','new','unknown','future']);
  assert.equal(core.rankItems(items,{now,sort:'relevance',query:'old'})[0].id,'old');
});
test('freshness distinguishes failed refresh, old success, offline and future clock',()=>{
  const old={generatedAt:'2026-11-28T12:00:00Z',sources:[{id:'a',status:'unavailable',lastSuccessAt:'2026-11-20T00:00:00Z'}]};
  assert.equal(core.freshness(old,{now}).status,'stale');assert.equal(core.freshness(old,{now,offline:true}).status,'offline');
  assert.equal(core.freshness({}, {now}).status,'unknown');assert.equal(core.freshness({generatedAt:'2027-01-01'},{now}).status,'future');
});
test('merging a partial snapshot preserves archived articles and missing-source health',()=>{
  const merged=core.mergeDigests({items:[article('old'),article('same')],sources:[{id:'vendor',lastSuccessAt:'2026-11-27'},{id:'other',status:'ok'}]},
    {generatedAt:'2026-11-28T12:00:00Z',items:[article('same',{title:'Updated title'})],sources:[{id:'vendor',status:'unavailable'}]});
  assert.equal(merged.items.length,2);assert.equal(merged.items.find(x=>x.id==='same').title,'Updated title');assert.equal(merged.sources.length,2);assert.equal(merged.sources[0].lastSuccessAt,'2026-11-27');
});
test('JSON Feed import and all exports preserve absent publication dates and escape text',()=>{
  const input=JSON.stringify({version:'https://jsonfeed.org/version/1.1',title:'Vendor',home_page_url:'https://example.org',items:[{id:12,title:'<alert> & news',url:'https://example.org/12',content_text:'Hello',attachments:[{url:'https://example.org/a.mp3',mime_type:'audio/mpeg'}]}]});
  const parsed=core.parseImportedFeed(input,{sourceId:'vendor'});assert.equal(parsed.items[0].date,'');assert.equal(parsed.items[0].media[0].kind,'audio');
  const rss=core.exportFeed(parsed.items,{format:'rss',url:'https://example.org'});assert.ok(rss.includes('&lt;alert&gt; &amp; news'));assert.ok(!rss.includes('<pubDate>'));
  const json=JSON.parse(core.exportFeed(parsed.items));assert.equal(json.items[0].date_published,undefined);
  assert.throws(()=>core.exportFeed(parsed.items,{format:'atom'}),/generatedAt/);
  const atom=core.exportFeed(parsed.items,{format:'atom',generatedAt:'2026-11-28T12:00:00Z'});assert.ok(!atom.includes('<published>'));assert.ok(atom.includes('<updated>2026-11-28T12:00:00.000Z</updated>'));
  assert.throws(()=>core.parseImportedFeed('<!DOCTYPE x><rss/>'),/DTD/);
});
