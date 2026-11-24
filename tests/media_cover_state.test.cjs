const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{webcrypto}=require('node:crypto'),{parseHTML}=require('linkedom');
const base=path.resolve(__dirname,'../dist/workspaces/engineering');
const original=()=>JSON.parse(fs.readFileSync(path.join(base,'media/public-fixtures.json')));
function fixture(mixed){const x=original(),card={...x.cards[0],id:'modrinth:synthetic-no-cover',title:'Synthetic explicit no-cover card',cover:null,cover_status:'not-provided',gallery:[],videos:[],completeness:'Synthetic variant for absent-cover rendering only; no live-provider claim.'};x.cards=mixed?[...x.cards,card]:[card];return x;}
function environment(data){
 const {window,document}=parseHTML('<!doctype html><html><head></head><body><section id="workspace"></section></body></html>');
 const originals=new Map(),calls=[];
 for(const[name,value]of Object.entries({window,document,location:new URL('https://athena.example/#media'),navigator:{userAgent:'Athena DOM contract test'},crypto:webcrypto,fetch:async url=>{calls.push(String(url));assert.ok(String(url).startsWith('file:'));assert.ok(String(url).endsWith('/public-fixtures.json'));const bytes=Buffer.from(JSON.stringify(data));return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}})){
  originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 }
 return{window,document,calls,container:document.getElementById('workspace'),restore(){for(const[n,d]of originals){if(d)Object.defineProperty(globalThis,n,d);else delete globalThis[n];}}};
}
async function mount(env,extra={}){return(await import(pathToFileURL(path.join(base,'media/index.mjs')).href)).mount({container:env.container,...extra});}
test('explicit absent cover renders metadata without a broken image, invented player or automatic request',async()=>{
 const env=environment(fixture(false));let controller;
 try{controller=await mount(env);const root=env.container.shadowRoot;assert.equal(controller.ready,true);assert.equal(root.querySelectorAll('article.card').length,1);assert.equal(root.querySelectorAll('img,iframe,video,audio,.player-controls').length,0);assert.equal(root.querySelector('.cover-placeholder').textContent,'No cover supplied by the public project record.');assert.equal(root.querySelector('h2').textContent,'Synthetic explicit no-cover card');assert.equal(root.querySelector('.source').href,fixture(false).cards[0].source);root.getElementById('load-media').click();await new Promise(setImmediate);assert.match(root.getElementById('status').textContent,/0 decoded, 0 failed/);assert.equal(env.calls.length,1);}
 finally{controller?.unmount();env.restore();}
});
test('one valid iconless card no longer suppresses the other five cards',async()=>{
 const env=environment(fixture(true));let controller;
 try{controller=await mount(env);const root=env.container.shadowRoot;assert.equal(controller.ready,true);assert.equal(root.querySelectorAll('article.card').length,6);assert.equal(root.querySelectorAll('img[src],iframe,video,audio').length,0);const bili=[...root.querySelectorAll('article.card')].find(x=>x.dataset.cardId.startsWith('bilibili:'));assert.equal(bili.querySelector('.cover-placeholder').textContent,'Poster remains inside the official player');assert.equal(env.calls.length,1);controller.setSearch('synthetic explicit');assert.equal([...root.querySelectorAll('article.card')].filter(x=>!x.hidden).length,1);const state=controller.exportState();controller.unmount();controller=await mount(env,{state});assert.equal(controller.ready,true);assert.equal(env.container.shadowRoot.querySelectorAll('article.card').length,6);assert.equal(env.calls.length,2);}
 finally{controller?.unmount();env.restore();}
});
test('a contradictory no-cover state still fails closed in the actual mounted module',async()=>{
 const data=fixture(false);data.cards[0].cover=original().cards[0].cover;const env=environment(data);let controller;
 try{controller=await mount(env);const root=env.container.shadowRoot;assert.equal(controller.ready,false);assert.equal(root.querySelectorAll('article.card').length,0);assert.match(root.getElementById('status').textContent,/Contradictory Modrinth cover absence/);assert.equal(root.getElementById('load-media').disabled,true);assert.equal(env.calls.length,1);}
 finally{controller?.unmount();env.restore();}
});
