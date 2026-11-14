'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{pathToFileURL}=require('node:url'),{webcrypto}=require('node:crypto'),{parseHTML}=require('linkedom');
const APP=process.env.ATHENA_TEST_ROOT||path.resolve(__dirname,'..');
const fixture=()=>JSON.parse(fs.readFileSync(path.join(APP,'engineering/docs/media-lab/public-fixtures.json')));
async function mountFixture(value,origin='https://athena.example/#media'){
 const{window,document}=parseHTML('<!doctype html><html><body><section id="workspace"></section></body></html>');
 const originals=new Map(),calls=[],bytes=Buffer.from(JSON.stringify(value));
 for(const[name,item]of Object.entries({window,document,location:new URL(origin),navigator:{userAgent:'Athena gallery metadata DOM test'},crypto:webcrypto,fetch:async(url)=>{calls.push(String(url));assert.match(String(url),/\/public-fixtures\.json$/);return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}})){
  originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:item});
 }
 let controller;try{const{mount}=await import(pathToFileURL(path.join(APP,'dist/workspaces/engineering/media/index.mjs')));controller=await mount({container:document.getElementById('workspace'),theme:'dark',route:'#media?q='});assert.equal(controller.ready,true);return{controller,root:document.getElementById('workspace').shadowRoot,calls,restore(){controller.unmount();for(const[n,d]of originals){if(d)Object.defineProperty(globalThis,n,d);else delete globalThis[n];}}};}
 catch(error){controller?.unmount();for(const[n,d]of originals){if(d)Object.defineProperty(globalThis,n,d);else delete globalThis[n];}throw error;}
}
test('stored Sodium gallery descriptions are discoverable without loading any media',async()=>{
 const data=fixture(),card=data.cards.find(c=>c.provider==='Modrinth');data.cards=[card];const env=await mountFixture(data);
 try{
  const figures=[...env.root.querySelectorAll('figure')];assert.equal(figures.length,6);
  for(const[ i,fig]of figures.entries()){
   const details=fig.querySelector('details.gallery-details');assert.ok(details,'Stored gallery description has no presentation');assert.equal(details.hasAttribute('open'),false);
   const summary=details.querySelector('summary');assert.equal(summary.textContent,'Source details');assert.equal(summary.getAttribute('aria-label'),'Source details for '+card.gallery[i].title);
   details.setAttribute('open','');assert.equal(details.querySelector('.gallery-description').textContent,card.gallery[i].description);assert.equal(details.querySelector('[data-metadata="ordering"]').textContent,String(card.gallery[i].ordering));
   assert.match(details.querySelector('.gallery-access').textContent,/Metadata only/);assert.match(details.textContent,/Featured imageNot recorded/);
  }
  env.controller.setSearch('gradients across each block');assert.equal(env.root.querySelector('article.card').hidden,false,'Stored description should be searchable');env.controller.setSearch('no-match-zzzz');assert.equal(env.root.querySelector('article.card').hidden,true);env.controller.setSearch('');
  assert.equal(env.root.querySelectorAll('img[src]').length,0);assert.equal(env.root.querySelectorAll('iframe,video,audio').length,0);assert.equal(env.calls.length,1);
 }finally{env.restore();}
});
test('optional source metadata is inert, exact and distinguishes missing, null, empty and supplied',async()=>{
 const data=fixture();data.cards=[data.cards[0]];const template=data.cards[0].gallery[0];
 data.cards[0].gallery=[
  {...template,title:'Credit',description:'Photo by: fixture artist\n<img src="https://invalid.example/x" onerror="bad()">',featured:true,created:'2026-01-01T00:00:00Z',ordering:0},
  {...template,title:'Empty',description:'',featured:false,created:'',ordering:-1},
  {preview:template.preview,original:template.original,title:'Missing'},
  {...template,title:'Null',description:null,featured:null,created:null,ordering:null},
  {...template,title:'Invalid',description:{payload:'do not stringify'},featured:1,created:{},ordering:Number.MAX_SAFE_INTEGER+1}
 ];
 const env=await mountFixture(data);
 try{const details=[...env.root.querySelectorAll('.gallery-details')];assert.equal(details.length,5);
  assert.equal(details[0].querySelector('.gallery-description').textContent,data.cards[0].gallery[0].description);assert.equal(details[0].querySelector('img,script,iframe'),null);assert.equal(details[0].querySelector('[data-metadata="featured"]').textContent,'Yes');assert.equal(details[0].querySelector('[data-metadata="created"]').textContent,'2026-01-01T00:00:00Z');assert.equal(details[0].querySelector('[data-metadata="ordering"]').textContent,'0');
  assert.equal(details[1].querySelector('.gallery-description-state').textContent,'Description is empty in this snapshot.');assert.equal(details[1].querySelector('[data-metadata="featured"]').textContent,'No');assert.equal(details[1].querySelector('[data-metadata="ordering"]').textContent,'-1');
  for(const n of[2,3])assert.equal(details[n].querySelector('.gallery-description-state').textContent,'Description not recorded in this snapshot.');
  assert.equal(details[4].querySelector('.gallery-description-state').textContent,'Unsupported description format in this snapshot.');assert.equal(details[4].textContent.includes('[object Object]'),false);assert.equal(details[4].querySelector('[data-metadata="ordering"]').textContent,'Not recorded');
  assert.equal(env.root.querySelectorAll('img[src]').length,0);assert.equal(env.calls.length,1);
 }finally{env.restore();}
});
test('source-detail disclosures keep privileged loopback media restrictions and cleanup',async()=>{
 const env=await mountFixture(fixture(),'http://127.0.0.1:41379/#media');
 try{assert.ok(env.root.querySelectorAll('.gallery-details').length>0);assert.equal(env.root.getElementById('load-media').disabled,true);assert.ok([...env.root.querySelectorAll('.player-controls button,.player-controls select')].every(x=>x.disabled));assert.equal(env.root.querySelectorAll('img[src],iframe,video,audio').length,0);assert.equal(env.calls.length,1);env.controller.unmount();assert.equal(env.root.childNodes.length,0);}
 finally{env.restore();}
});
