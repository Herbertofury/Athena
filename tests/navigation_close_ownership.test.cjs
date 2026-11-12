'use strict';
// Focus calls and markup contracts only. LinkeDOM does not implement browser
// focus trapping, rendering, zoom or an assistive-technology accessibility tree.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');
function setup(options={}){
 const {window}=parseHTML(fs.readFileSync('dist/index.html','utf8')),doc=window.document,store=new Map(Object.entries(options.storage||{}));let focused=doc.body;const closes=[];
 Object.defineProperty(doc,'activeElement',{get:()=>focused});window.HTMLElement.prototype.focus=function(){focused=this;};
 window.AbortController=AbortController;window.AthenaWorkspaceLoaders=options.loaders;window.localStorage={getItem:k=>{if(options.getError)throw Error('storage unavailable');return store.get(k)||null;},setItem:(k,v)=>{if(options.setError)throw Error('storage unavailable');store.set(k,v);}};
 window.location={hash:'#home'};window.confirm=()=>true;window.URL=URL;window.URLSearchParams=URLSearchParams;window.history={replaceState:(_a,_b,hash)=>{window.location.hash=hash;}};window.Blob=Blob;window.setTimeout=()=>1;window.clearTimeout=()=>{};doc.querySelector('#search').value='';
 const dialog=doc.querySelector('dialog');dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{if(!dialog.open)return;dialog.open=false;const event=()=>dialog.dispatchEvent(new window.Event('close'));if(options.queuedClose)closes.push(event);else event();};
 const context=vm.createContext(window);for(const file of ['catalog.js','core.js','workspace-host.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),context);
 return {window,doc,store,dialog,focus:()=>focused,flush:()=>{while(closes.length)closes.shift()();},go(hash){window.location.hash=hash;window.dispatchEvent(new window.Event('hashchange'));},click(element){element.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));},key(target,key,flags={}){const e=new window.Event('keydown',{bubbles:true,cancelable:true});Object.assign(e,{key,...flags});if(flags.prePrevented)e.preventDefault();target.dispatchEvent(e);return e;}};
}
function open(s,id){s.click(s.doc.querySelector(`#main [data-lesson="${id}"]`));}
function input(s,el,value){el.value=value;el.dispatchEvent(new s.window.Event('input',{bubbles:true}));}
const tick=()=>new Promise(setImmediate);

test('queued close from an old route cannot steal newly chosen search focus',()=>{
 const s=setup({queuedClose:true});s.go('#workshops/security-foundations');open(s,'sec-risk-story');s.go('#certificates');
 const search=s.doc.querySelector('#search'),heading=s.doc.querySelector('#view-title');search.focus();s.flush();
 assert.equal(s.focus()===search,true,'an old dialog close must not steal focus after navigation');
 assert.equal(s.doc.querySelector('#view-title')===heading,true,'an old dialog close must not replace the new route');
});
test('queued Escape close cannot replace a route entered before native close delivery',()=>{
 const s=setup({queuedClose:true});s.go('#workshops/security-foundations');open(s,'sec-risk-story');s.dialog.close();s.go('#certificates');
 const filter=s.doc.querySelector('[data-filter="Data analytics"]');s.click(filter);const focused=s.focus(),heading=s.doc.querySelector('#view-title');s.flush();
 assert.equal(s.focus()===focused,true,'delayed close must preserve selected filter focus');assert.equal(s.doc.querySelector('#view-title')===heading,true);
});
test('route close cannot erase an answer submitted in the new review view',()=>{
 const s=setup({queuedClose:true});s.go('#workshops/security-foundations');open(s,'sec-risk-story');s.go('#review');
 s.click(s.doc.querySelector('[data-review-answer="0"]'));const feedback=s.doc.querySelector('#review-feedback'),next=s.doc.querySelector('[data-next-review]');
 assert.ok(feedback);assert.ok(next);s.flush();
 assert.equal(s.doc.querySelector('#review-feedback')===feedback,true,'the answered review must not rerender');assert.equal(s.doc.querySelector('[data-next-review]')===next,true);assert.equal(s.focus()===feedback,true);
});
test('a new lesson after route cancellation retains normal close behavior',()=>{
 const s=setup({queuedClose:true});s.go('#workshops/security-foundations');open(s,'sec-risk-story');s.go('#workshops/data-workshop');open(s,'data-null-metrics');s.flush();
 assert.equal(s.dialog.open,true);assert.equal(s.focus().id,'lesson-title');s.dialog.close();s.flush();assert.equal(s.focus().dataset.lesson,'data-null-metrics');
});
for(const queuedClose of [false,true])test(`repeated navigation and newer lessons retain close behavior (${queuedClose?'queued':'synchronous'} close)`,()=>{
 const s=setup({queuedClose});
 for(let round=0;round<4;round++){
  s.go('#workshops/security-foundations');open(s,'sec-risk-story');s.go('#certificates');s.go('#workshops/data-workshop');
  const heading=s.doc.querySelector('#view-title'),search=s.doc.querySelector('#search');search.focus();s.flush();
  assert.equal(s.doc.querySelector('#view-title')===heading,true);assert.equal(s.focus()===search,true);
  open(s,'data-null-metrics');s.flush();assert.equal(s.dialog.open,true);assert.equal(s.focus().id,'lesson-title');
  s.dialog.close();s.flush();assert.equal(s.focus().dataset.lesson,'data-null-metrics');
 }
});
