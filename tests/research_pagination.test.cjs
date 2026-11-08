const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL,fileURLToPath}=require('node:url'),{webcrypto}=require('node:crypto'),{parseHTML}=require('linkedom');
const base=path.resolve(__dirname,'../dist/workspaces/engineering');
async function component(kind){return import(pathToFileURL(path.join(base,kind,'index.mjs')).href);}
function setup(){
 const {window,document}=parseHTML('<!doctype html><html><head></head><body><section id="workspace"></section></body></html>');
 const originals=new Map(),calls=[];const store=new Map();
 for(const [name,value] of Object.entries({window,document,Option:function(text,value){const opt=document.createElement('option');opt.textContent=text;opt.value=value;return opt;},location:new URL('https://athena.example/#research'),navigator:{userAgent:'Athena DOM contract test',clipboard:{writeText:async()=>{}}},crypto:webcrypto,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},fetch:async(url,{signal}={})=>{if(signal?.aborted)throw Error('Aborted');calls.push(String(url));assert.ok(String(url).startsWith('file:'),'No external provider request allowed during mount');const bytes=fs.readFileSync(fileURLToPath(url));return {ok:true,json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}})){
  originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 }
 const select=window.HTMLSelectElement.prototype;select.add=function(opt){this.append(opt);};select.remove=function(index){if(index!==undefined)this.options[index]?.remove();else this.parentNode?.removeChild(this);};const priorValue=Object.getOwnPropertyDescriptor(select,'value');
 Object.defineProperty(select,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')||'';},set(v){for(const opt of this.querySelectorAll('option')){if(opt.getAttribute('value')===String(v))opt.setAttribute('selected','');else opt.removeAttribute('selected');}}});
 return {window,document,calls,container:document.getElementById('workspace'),restore(){if(priorValue)Object.defineProperty(select,'value',priorValue);for(const[name,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}};
}


const {createHost}=require('../dist/workspace-host.js');
for (const scenario of [
 {name:'explicit page deep link',route:'#research?page=2',page:2},
 {name:'sorted page deep link',route:'#research?sort=name&page=3',page:3},
 {name:'saved page on bare route',route:'#research',state:{query:'page=4'},page:4},
]) test('Research host preserves '+scenario.name,async()=>{
 const env=setup(),routes=[];let controller;
 const host=createHost({load:async()=>({mount:async args=>controller=await(await component('research')).mount(args)}),context:{navigate:r=>routes.push(r)}});
 try{
  assert.equal(await host.open('research',env.container,{search:'',route:scenario.route,state:scenario.state}),true);
  assert.equal(new URLSearchParams(controller.exportState().query).get('page'),String(scenario.page));
  assert.equal(env.container.shadowRoot.getElementById('page-label').textContent,'Page '+scenario.page+' of 12');
  assert.equal(new URLSearchParams(routes.at(-1).split('?')[1]).get('page'),String(scenario.page));
  assert.equal(env.calls.length,1,'same query should not refetch');
 }finally{await host.clear();env.restore();}
});

test('Research same query keeps cards; changed query still resets to page one',async()=>{
 const env=setup();let controller;
 try{controller=await(await component('research')).mount({container:env.container,route:'#research?page=2'});
 const first=env.container.shadowRoot.querySelector('.research-card');
 controller.setSearch('');assert.equal(new URLSearchParams(controller.exportState().query).get('page'),'2');
 assert.equal(env.container.shadowRoot.querySelector('.research-card'),first,'same query must not rebuild results');
 controller.setSearch('rust');const query=new URLSearchParams(controller.exportState().query);assert.equal(query.get('q'),'rust');assert.equal(query.get('page'),null);
 assert.match(env.container.shadowRoot.getElementById('page-label').textContent,/^Page 1 of /);
 }finally{controller?.unmount();env.restore();}
});

test('Research a changed query after host initialization still resets pagination',async()=>{
 const env=setup();let controller;const host=createHost({load:async()=>({mount:async args=>controller=await(await component('research')).mount(args)})});
 try{await host.open('research',env.container,{search:'',route:'#research?page=2'});await host.setSearch('rust');const query=new URLSearchParams(controller.exportState().query);assert.equal(query.get('q'),'rust');assert.equal(query.get('page'),null);}
 finally{await host.clear();env.restore();}
});

test('Research nonempty and 300-character-normalized duplicate queries do not rebuild results',async()=>{
 const env=setup();let controller;
 try{controller=await(await component('research')).mount({container:env.container,route:'#research?q=a&page=2'});
 const root=env.container.shadowRoot,first=root.querySelector('.research-card');assert.ok(first);
 controller.setSearch('a');assert.equal(new URLSearchParams(controller.exportState().query).get('page'),'2');assert.equal(root.querySelector('.research-card'),first);
 const long='x'.repeat(300);controller.setSearch(long);const empty=root.querySelector('.empty');assert.ok(empty);
 controller.setSearch(long+'extra');assert.equal(root.querySelector('.empty'),empty);assert.equal(new URLSearchParams(controller.exportState().query).get('q'),long);
 }finally{controller?.unmount();env.restore();}
});
