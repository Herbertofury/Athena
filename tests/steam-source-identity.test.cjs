/* Synthetic identity-join failures based on retained public cards; no provider requests. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{webcrypto}=require('node:crypto'),{parseHTML}=require('linkedom');
const base=path.resolve(__dirname,'../dist/workspaces/engineering/media');
const fresh=()=>JSON.parse(fs.readFileSync(path.join(base,'public-fixtures.json')));
const core=()=>import(pathToFileURL(path.join(base,'media-core.mjs')).href);
function steam(fixture){return fixture.cards.find(card=>card.provider==='Steam');}

test('Steam app cards reject source URLs for a different AppID',async()=>{
 const {validateFixture}=await core();
 for(const source of ['https://store.steampowered.com/app/730/','https://store.steampowered.com/app/6200/Portal_2/','https://store.steampowered.com/app/730/?appids=620']){
  const fixture=fresh();steam(fixture).source=source;
  assert.throws(()=>validateFixture(fixture),/Mismatched Steam source and card identity/);
 }
});
test('Steam app cards do not reinterpret package, bundle, root or malformed routes as apps',async()=>{
 const {validateFixture}=await core();
 for(const suffix of ['/sub/620/','/bundle/620/','/','/app/6200','/app/620wrong/','/app/%36%32%30/','/app/0620/']){
  const fixture=fresh();steam(fixture).source='https://store.steampowered.com'+suffix;
  assert.throws(()=>validateFixture(fixture),/Mismatched Steam source and card identity/);
 }
});
test('Steam card identity is canonical decimal and must match the source path',async()=>{
 const {validateFixture}=await core();
 for(const id of ['steam:730','steam:0620','steam:0','steam:-620','steam:6.20','Steam:620','steam:620:extra','steam:620\n']){
  const fixture=fresh();steam(fixture).id=id;
  assert.throws(()=>validateFixture(fixture),/Mismatched Steam source and card identity/);
 }
});
test('Matching Steam app routes retain localization, display slug, query and fragment exactly',async()=>{
 const {validateFixture}=await core();
 for(const source of ['https://store.steampowered.com/app/620','https://store.steampowered.com/app/620/','https://store.steampowered.com/app/620/Portal_2/','https://store.steampowered.com/app/620/?cc=us&l=english#app_reviews_hash']){
  const fixture=fresh();steam(fixture).source=source;const before=JSON.stringify(fixture);
  assert.equal(validateFixture(fixture),fixture);assert.equal(JSON.stringify(fixture),before);
 }
});
async function mounted(fixture,callback){
 const {window,document}=parseHTML('<!doctype html><html><head></head><body><section id="workspace"></section></body></html>');
 const original=new Map(),calls=[],raw=Buffer.from(JSON.stringify(fixture));let controller;
 for(const[k,v]of Object.entries({window,document,location:new URL('https://athena.example/#media'),navigator:{userAgent:'Athena synthetic identity regression'},crypto:webcrypto,
  fetch:async url=>{calls.push(String(url));assert.match(String(url),/\/public-fixtures\.json$/);return{ok:true,arrayBuffer:async()=>raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)};}})){
  original.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});
 }
 try{controller=await(await import(pathToFileURL(path.join(base,'index.mjs')).href)).mount({container:document.getElementById('workspace')});await callback({controller,root:document.getElementById('workspace').shadowRoot,calls});}
 finally{controller?.unmount();for(const[k,d]of original){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
}
test('Actual Media mount cannot present a Portal 2 source action leading to a different app',async()=>{
 const fixture=fresh();steam(fixture).source='https://store.steampowered.com/app/730/';
 await mounted(fixture,({controller,root,calls})=>{
  assert.equal(controller.ready,false);assert.equal(root.querySelectorAll('article.card').length,0);
  assert.match(root.getElementById('status').textContent,/Mismatched Steam source and card identity/);
  assert.equal(root.getElementById('load-media').disabled,true);
  assert.equal(root.querySelectorAll('img[src],iframe,video,audio').length,0);assert.equal(calls.length,1);
 });
});
test('Unmodified public cards keep metadata, gallery order, media counts and unloaded states',async()=>{
 const fixture=fresh(),before=JSON.stringify(fixture);
 await mounted(fixture,({controller,root,calls})=>{
  assert.equal(controller.ready,true);const cards=[...root.querySelectorAll('article.card')];assert.deepEqual(cards.map(card=>card.dataset.cardId),fixture.cards.map(card=>card.id));
  assert.equal(root.querySelectorAll('img').length,23);assert.equal(root.querySelectorAll('figure').length,19);
  for(const[at,card]of cards.entries()){
   assert.equal(card.querySelector('h2').textContent,fixture.cards[at].title);assert.equal(card.querySelector('.source').href,fixture.cards[at].source);assert.equal(card.querySelector('.scope').textContent,fixture.cards[at].completeness);
   assert.deepEqual([...card.querySelectorAll('figure a')].map(a=>a.href),fixture.cards[at].gallery.map(g=>g.original));
  }
  assert.equal(root.querySelectorAll('img[src],iframe,video,audio').length,0);assert.equal(calls.length,1);
 });assert.equal(JSON.stringify(fixture),before);
});
