const test=require('node:test');
const assert=require('node:assert/strict');
const {DOMParser}=require('linkedom');
const Feed=require('../../feed-core/feed-core');
const Generation=require('../feed-generation-core');
const recipe={sourceId:'example',sourceName:'Example news',baseUrl:'https://example.org/'};
const html='<article><h2><a href="/one">Original report</a></h2><p>Original details.</p><time datetime="2026-11-27T08:30:00Z"></time></article><article><h2><a href="/two">Undated report</a></h2></article>';

test('generated feeds are ordinary normalized records and preserve unknown publication dates in every format',()=>{
  const result=Generation.generate(html,recipe,{DOMParser});
  assert.equal(result.validation.ok,true);assert.equal(result.items.length,2);assert.equal(result.items[1].date,'');
  const json=JSON.parse(Generation.exportGenerated(result,{format:'json'}));assert.equal(json.items[1].date_published,undefined);
  const rss=Generation.exportGenerated(result,{format:'rss'});assert.equal((rss.match(/<pubDate>/g)||[]).length,1);
  const atom=Generation.exportGenerated(result,{format:'atom',generatedAt:'2026-11-28T12:00:00Z'});assert.equal((atom.match(/<published>/g)||[]).length,1);
  assert.equal(Feed.parseImportedFeed(JSON.stringify(json),{sourceId:'roundtrip'}).items.length,2);
});
test('regression validation rejects selector count collapse and missing required dates before export',()=>{
  const good=Generation.generate(html,recipe,{DOMParser}),baseline=Generation.createBaseline(good);
  const failed=Generation.generate('<section>Changed website</section>',recipe,{DOMParser,baseline});
  assert.equal(failed.validation.ok,false);assert.ok(failed.validation.errors.some(e=>e.code==='extraction-count-drop'));
  assert.throws(()=>Generation.exportGenerated(failed),/validation failed/);
  const missingDates=Generation.generate(html,{...recipe,requireDates:true},{DOMParser});assert.equal(missingDates.validation.ok,false);
  assert.ok(missingDates.validation.errors.some(e=>e.code==='required-dates'));
  const partial=Generation.generate(html,recipe,{DOMParser,baseline:{itemCount:10,datedCount:5}});
  assert.equal(partial.items.length,2);assert.equal(partial.validation.ok,false);assert.throws(()=>Generation.exportGenerated(partial),/validation failed/);
  assert.equal(good.items.length,2,'validation never mutates a last-known-good result');
});
test('recipes roundtrip as bounded data and preferences retain recipes without leaking them into display presets',()=>{
  const normalized=Generation.normalizeRecipe({...recipe,script:'steal()',limit:9999,selectors:{item:'article',title:'h2',summary:''}});
  assert.equal(normalized.script,undefined);assert.equal(normalized.limit,500);assert.equal(normalized.selectors.summary,'');
  assert.deepEqual(Generation.importRecipe(Generation.exportRecipe(normalized)),normalized);
  const stored=Feed.importPreferences(Feed.exportPreferences({feedRecipes:[{id:'recipe',sourceId:'example',name:'Reusable',recipe:normalized}],presets:[{id:'preset',name:'Display',settings:{feedRecipes:[{id:'private',recipe}]}}]}));
  assert.equal(stored.feedRecipes[0].recipe.baseUrl,recipe.baseUrl);assert.equal(stored.presets[0].settings.feedRecipes,undefined);
  assert.throws(()=>Generation.importRecipe('{"schemaVersion":99}'),/Unsupported/);
});
test('single-article mode uses metadata extraction without inventing selectors or dates',()=>{
  const output=Generation.generate('<meta property="og:title" content="Reported"><meta property="og:description" content="Summary"><main><p>Body</p></main>',{...recipe,mode:'article'},{DOMParser});
  assert.equal(output.validation.ok,true);assert.equal(output.items.length,1);assert.equal(output.items[0].date,'');assert.equal(output.items[0].url,'https://example.org/');
});
