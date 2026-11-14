const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL,fileURLToPath}=require('node:url'),{webcrypto}=require('node:crypto'),{parseHTML}=require('linkedom');
const base=process.env.ATHENA_MEDIA_TEST_ROOT||path.resolve(__dirname,'../dist/workspaces/engineering');
async function component(){return import(pathToFileURL(path.join(base,'media/index.mjs')).href);}
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

for(const query of ['steam','bilibili','', 'snow ☃ &mode=baseline # ? +'])test('Media renderer switch retains exact shared query: '+JSON.stringify(query),async()=>{
 const env=setup();let c;const routes=[];
 try{
  c=await(await component()).mount({container:env.container,search:query,navigate:route=>{routes.push(route);c.setRoute(route);}});
  const root=env.container.shadowRoot,visible=()=>[...root.querySelectorAll('article.card')].filter(card=>!card.hidden).map(card=>card.dataset.cardId);
  const before=visible(),events=c.exportState().receipt.events;
  for(const mode of ['bounded','baseline']){
   root.querySelector('[data-event-mode="'+mode+'"]').click();
   const target=routes.at(-1),params=new URLSearchParams(target.slice(target.indexOf('?')+1));
   assert.equal(params.get('q'),query,JSON.stringify({message:'Renderer route must retain an explicit query, including empty',target,before,after:visible(),exportedSearch:c.exportState().search}));
   assert.equal(params.get('event_view'),mode);assert.equal(c.exportState().search,query);
   assert.deepEqual(visible(),before);assert.deepEqual(c.exportState().receipt.events.slice(0,events.length),events);
   assert.equal(root.querySelectorAll('article.card').length,5);assert.equal(root.querySelectorAll('img[src],iframe,video,audio').length,0);
  }
  c.setRoute(routes[0]);assert.equal(c.exportState().search,query);assert.equal(c.exportState().event_view,'bounded');assert.deepEqual(visible(),before);
  c.setRoute(routes[1]);assert.equal(c.exportState().search,query);assert.equal(c.exportState().event_view,'baseline');assert.deepEqual(visible(),before);
  assert.equal(env.calls.length,1,'One local fixture fetch, no provider request');
 }finally{c?.unmount();env.restore();}
});
