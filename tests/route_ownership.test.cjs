const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');
function setup(hash='#home'){
 const {window}=parseHTML(fs.readFileSync('dist/index.html','utf8')),store=new Map(),calls=[];
 window.AbortController=AbortController;window.URL=URL;window.URLSearchParams=URLSearchParams;window.Blob=Blob;
 window.location={hash};window.history={replaceState:(_a,_b,value)=>window.location.hash=value};
 window.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
 window.confirm=()=>true;window.setTimeout=()=>1;window.clearTimeout=()=>{};window.HTMLElement.prototype.focus=function(){};
 window.document.querySelector('#search').value='';
 window.AthenaWorkspaceLoaders=Object.fromEntries(['research','media','lab','build'].map(id=>[id,async()=>({mount:async context=>{calls.push({id,search:context.search});context.container.textContent='Fixture '+id;return {unmount(){calls.push({closed:id});},setRoute(){},setSearch(){}};}})]));
 const dialog=window.document.querySelector('dialog');dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new window.Event('close'));};
 const ctx=vm.createContext(window);for(const name of ['catalog.js','core.js','workspace-host.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+name,'utf8'),ctx);
 return {window,doc:window.document,store,calls,go(next){window.location.hash=next;window.dispatchEvent(new window.Event('hashchange'));}};
}
function assertNotFound(s){assert.equal(s.doc.querySelector('#main').dataset.workspace,'learning');assert.equal(s.doc.querySelector('h1').textContent,'That trail is not mapped yet.');assert.equal(s.doc.querySelector('#search').value,'');assert.equal(s.doc.querySelector('.workspace-container'),null);}
const inheritedNames=Object.getOwnPropertyNames(Object.prototype);
test('inherited object names are not workspace routes on initial load',()=>{
 for(const name of inheritedNames)for(const suffix of ['','/child?q=not-a-learning-query']){
  const s=setup('#'+name+suffix);assertNotFound(s);assert.equal(s.calls.length,0);assert.equal(s.store.size,0);
 }
});
test('hash navigation rejects inherited names and their query strings without losing learning',()=>{
 const s=setup();for(const name of inheritedNames){s.go('#'+name+'?q=unrecognized');assertNotFound(s);s.go('#foundations');assert.ok(s.doc.querySelectorAll('[data-lesson]').length>=90);}
 assert.equal(s.calls.length,0);assert.equal(s.store.size,0);
});
test('unknown navigation tears down a real workspace and allows a later valid mount',async()=>{
 const s=setup('#research?q=rust');await new Promise(setImmediate);assert.deepEqual(s.calls,[{id:'research',search:'rust'}]);
 s.go('#constructor');await new Promise(setImmediate);assertNotFound(s);assert.deepEqual(s.calls.at(-1),{closed:'research'});
 s.go('#media?q=video');await new Promise(setImmediate);assert.equal(s.doc.querySelector('#main').dataset.workspace,'media');assert.deepEqual(s.calls.at(-1),{id:'media',search:'video'});
 s.go('#hasOwnProperty');await new Promise(setImmediate);assertNotFound(s);assert.deepEqual(s.calls.at(-1),{closed:'media'});
 s.go('#lab?q=journal');await new Promise(setImmediate);assert.deepEqual(s.calls.at(-1),{id:'lab',search:'journal'});
});
test('explicit routes, prototype-like search text and native Build keep their existing meaning',async()=>{
 const s=setup('#build');await new Promise(setImmediate);assert.equal(s.doc.querySelector('#main').dataset.workspace,'build');assert.deepEqual(s.calls,[{id:'build',search:''}]);
 for(const route of ['#constructorx','#prototype','#track/constructor','#workshops/toString']){s.go(route);assertNotFound(s);}
 for(const name of inheritedNames){s.go('#foundations');const search=s.doc.querySelector('#search');search.value=name;search.dispatchEvent(new s.window.Event('input'));assert.equal(s.doc.querySelector('h1').textContent,'Find your next connection.');assert.equal(s.doc.querySelector('#main').dataset.workspace,'learning');}
 s.go('#track/ccna');await new Promise(setImmediate);assert.match(s.doc.querySelector('h1').textContent,/CCNA/);assert.deepEqual(s.calls,[{id:'build',search:''},{closed:'build'}]);
});
