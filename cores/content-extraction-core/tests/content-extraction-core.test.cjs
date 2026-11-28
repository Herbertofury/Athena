const test=require('node:test');
const assert=require('node:assert/strict');
const {DOMParser}=require('linkedom');
const Extraction=require('../content-extraction-core');
const options={DOMParser,baseUrl:'https://publisher.example/news/'};

test('declared discovery resolves relative links, ignores hostile bases and active schemes',()=>{
  const feeds=Extraction.discoverFeeds('<base href="https://untrusted.example/"><link rel="alternate" type="application/rss+xml" href="rss.xml" title="Articles"><link rel="alternate" type="application/rss+xml" href="rss.xml"><link rel="alternate" type="application/atom+xml" href="javascript:alert(1)"><link rel="alternate" type="text/html" href="/fr"><link rel="ALTERNATE" type="application/feed+json; charset=utf-8" href="/feed.json">',options);
  assert.deepEqual(feeds.map(f=>f.url),['https://publisher.example/news/rss.xml','https://publisher.example/feed.json']);
  assert.equal(feeds[0].title,'Articles');
});
test('article metadata follows JSONLD, keeps publication and modification separate and returns text only',()=>{
  const html=`<html><head><title>Fallback title</title><link rel="canonical" href="/original"><meta property="og:title" content="Secondary title"><script type="application/ld+json">{"@graph":[{"@type":"WebSite","name":"Site"},{"@type":["NewsArticle"],"headline":"Original & accurate","datePublished":"2026-11-27","dateModified":"2026-11-28T10:00:00Z","author":[{"name":"One Author"},{"name":"Second Author"}],"image":["/photo.jpg","javascript:bad"],"description":"Reported summary"}]}</script></head><body><article><h1>Local heading</h1><p>Readable <strong>body</strong>.</p><script>dangerous()</script><p hidden>Hidden content</p><iframe src="https://untrusted.example/"></iframe></article></body></html>`;
  const article=Extraction.extractArticle(html,options);
  assert.equal(article.title,'Original & accurate');assert.equal(article.url,'https://publisher.example/original');
  assert.equal(article.date,'2026-11-27');assert.equal(article.updatedAt,'2026-11-28T10:00:00.000Z');
  assert.equal(article.author,'One Author, Second Author');assert.deepEqual(article.media,[{kind:'image',url:'https://publisher.example/photo.jpg'}]);
  assert.equal(article.text,'Local heading Readable body.');assert.equal(article.summary,'Reported summary');
  assert.equal(article.provenance.date,'jsonld.datePublished');assert.equal(article.text.includes('dangerous'),false);
});
test('malformed structured data falls back honestly and never promotes modified date to published',()=>{
  const article=Extraction.extractArticle('<meta property="og:title" content="Observed title"><meta property="article:modified_time" content="2026-11-28"><script type="application/ld+json">{"broken":</script><main><p>Observed summary</p></main>',options);
  assert.equal(article.title,'Observed title');assert.equal(article.date,'');assert.equal(article.updatedAt,'2026-11-28');
  assert.ok(article.diagnostics.some(d=>d.code==='invalid-jsonld'));assert.ok(article.diagnostics.some(d=>d.code==='unknown-publication-date'));
});
test('listing extraction applies typed selectors, dedupes canonical URLs, and excludes unsafe links',()=>{
  const html='<article><h2><a href="/one?utm_source=x">First &amp; true</a></h2><p>Summary<script>bad()</script></p><time datetime="2026-11-27T10:00:00-05:00"></time><img src="/one.jpg"></article><article><h2><a href="/one">Duplicate</a></h2></article><article><h2><a href="javascript:attack()">Unsafe</a></h2></article><article><h2><a href="https://outside.example/story">Outside</a></h2></article><article><h2><a href="/two">Undated</a></h2><time>yesterday</time></article>';
  const output=Extraction.extractListing(html,{sourceId:'publisher'},options);
  assert.deepEqual(output.items.map(i=>i.title),['First & true','Undated']);assert.equal(output.items[0].date,'2026-11-27T15:00:00.000Z');
  assert.equal(output.items[1].date,'');assert.equal(output.items[0].summary,'Summary');
  assert.equal(output.stats.skipped,2);assert.equal(output.stats.duplicates,1);assert.equal(output.stats.undated,1);
  assert.equal(Extraction.extractListing(html,{allowCrossOrigin:true},options).items.length,3);
});
test('invalid selectors and changed markup produce actionable failure instead of silent empty success',()=>{
  for(const selector of ['[invalid',':has(article)','']){
    const result=Extraction.extractListing('<article>new structure</article>',{selectors:{item:selector}},options);
    assert.equal(result.items.length,0);assert.ok(result.diagnostics.some(d=>d.level==='error'));
  }
  const none=Extraction.extractListing('<section>No cards</section>',{},options);
  assert.ok(none.diagnostics.some(d=>d.code==='no-matching-rows'));
  assert.throws(()=>Extraction.extractArticle('x'.repeat(Extraction.MAX_HTML+1),options),/limit/);
});
test('relative listing images use the acquired page URL and safe lazy sources survive placeholders',()=>{
  const listing=Extraction.extractListing('<article><h2><a href="/stories/one">A story</a></h2><img src="data:image/gif;base64,AAAA" data-src="images/photo.jpg"></article>',{},options);
  assert.equal(listing.items[0].media[0].url,'https://publisher.example/news/images/photo.jpg');
  const article=Extraction.extractArticle('<link rel="canonical" href="/canonical/story"><script type="APPLICATION/LD+JSON">{"@type":"Article","headline":"Declared","image":"images/a.jpg","keywords":["security","patch"]}</script>',options);
  assert.equal(article.media[0].url,'https://publisher.example/news/images/a.jpg');assert.deepEqual(article.tags,['security','patch']);
});
test('an optional author selector preserves publisher bylines as plain data',()=>{
  const listing=Extraction.extractListing('<article><h2><a href="/one">An authored story</a></h2><address class="byline">Ada <strong>Example</strong><script>untrusted()</script></address></article>',{selectors:{author:'.byline'}},options);
  assert.equal(listing.items[0].author,'Ada Example');
  const Feed=require('../../feed-core/feed-core');
  const json=Feed.exportFeed(listing.items,{format:'json'});
  assert.deepEqual(JSON.parse(json).items[0].authors,[{name:'Ada Example'}]);
  assert.equal(Feed.parseImportedFeed(json,{sourceId:'author-roundtrip'}).items[0].author,'Ada Example');
  const versionOne=JSON.parse(json);versionOne.version='https://jsonfeed.org/version/1';versionOne.items[0].author={name:'Legacy author'};delete versionOne.items[0].authors;
  assert.equal(Feed.parseImportedFeed(JSON.stringify(versionOne),{sourceId:'legacy-author'}).items[0].author,'Legacy author');
});
