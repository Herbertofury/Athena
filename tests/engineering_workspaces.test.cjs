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

test('Research mounts actual catalog, filters, shortlist and exports without global routing',async()=>{
 const env=setup();let controller;const routes=[];
 try{controller=await(await component('research')).mount({container:env.container,theme:'light',navigate:(...x)=>routes.push(x)});const root=env.container.shadowRoot;
 assert.equal(controller.ready,true,root.getElementById('results').textContent);assert.match(root.getElementById('result-count').textContent,/283/,root.getElementById('results').textContent);assert.equal(root.querySelector('iframe'),null);assert.equal(root.querySelector('.masthead'),null);
 controller.setSearch('rust');assert.equal(controller.exportState().query,'q=rust');assert.match(routes.at(-1)[0],/^#research\?q=rust$/);
 controller.setRoute('#research?q=storage&sort=name');assert.equal(controller.exportState().query,'q=storage&sort=name');
 controller.setSearch('');const box=root.querySelector('input[type="checkbox"]');assert.ok(box);box.checked=true;box.dispatchEvent(new env.window.Event('change'));assert.equal(controller.exportState().shortlist.length,1);
 controller.setTheme('dark');assert.equal(env.container.dataset.theme,'dark');const saved=controller.exportState();controller.unmount();assert.equal(root.childNodes.length,0);
 controller=await(await component('research')).mount({container:env.container,state:saved});assert.deepEqual(controller.exportState().shortlist,saved.shortlist);assert.equal(env.calls.length,2);
 }finally{controller?.unmount();env.restore();}
});

test('Research aborts pending mount without stale DOM writes',async()=>{
 const env=setup();const abort=new AbortController();let controller;
 try{globalThis.fetch=(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('Aborted')),{once:true}));const pending=(await component('research')).mount({container:env.container,signal:abort.signal});abort.abort();controller=await pending;assert.equal(controller.ready,false);assert.equal(env.container.shadowRoot.childNodes.length,0);}
 finally{controller?.unmount();env.restore();}
});

test('Media mounts source records without auto-loading providers, retains receipt on remount',async()=>{
 const env=setup();let controller;
 try{controller=await(await component('media')).mount({container:env.container,theme:'light'});const root=env.container.shadowRoot;assert.equal(controller.ready,true);assert.ok(root.querySelectorAll('article.card').length>0);assert.equal(root.querySelectorAll('img[src]').length,0);assert.equal(root.querySelectorAll('iframe').length,0);assert.equal(env.calls.length,1);const first=controller.exportState();assert.match(first.receipt.fixture_sha256,/^[a-f0-9]{64}$/);
 controller.setSearch('no-match-zzzz');assert.equal([...root.querySelectorAll('article.card')].filter(x=>!x.hidden).length,0);
 controller.setRoute('#media?event_view=bounded&q=steam');assert.equal(controller.exportState().event_view,'bounded');assert.ok(controller.exportState().receipt.events.length>=first.receipt.events.length);
 const saved=controller.exportState();controller.unmount();controller=await(await component('media')).mount({container:env.container,state:saved});assert.equal(controller.ready,true);assert.ok(controller.exportState().receipt.events.some(x=>x.type==='workspace_resumed'));assert.ok(controller.exportState().receipt.events.length>saved.receipt.events.length);
 controller.unmount();const mismatched={...saved,receipt:{...saved.receipt,fixture_sha256:'0'.repeat(64)}};controller=await(await component('media')).mount({container:env.container,state:mismatched});assert.equal(controller.ready,false);assert.deepEqual(controller.exportState().receipt,mismatched.receipt);assert.equal(env.container.shadowRoot.getElementById('load-media').disabled,true);
 }finally{controller?.unmount();env.restore();}
});

test('Media official Bilibili frame stays autoplay-off and unloads on workspace exit',async()=>{
 const env=setup();let controller;
 try{controller=await(await component('media')).mount({container:env.container});const root=env.container.shadowRoot;const button=[...root.querySelectorAll('button')].find(x=>x.textContent==='Load official Bilibili player');assert.ok(button);button.click();const frame=root.querySelector('iframe');assert.ok(frame);assert.equal(new URL(frame.src).searchParams.get('autoplay'),'0');assert.equal(frame.getAttribute('sandbox'),'allow-scripts allow-same-origin allow-presentation');controller.unmount();assert.equal(root.querySelector('iframe'),null);}
 finally{controller?.unmount();env.restore();}
});

test('Abort stops preview decoding and does not start queued provider requests',async()=>{
 const {createPreviewLoader}=await import(pathToFileURL(path.join(base,'media/preview-loader.mjs')).href);const abort=new AbortController();let starts=0;const images=Array.from({length:7},(_,i)=>({dataset:{source:'https://example.test/'+i},classList:{add(){},remove(){}},set src(x){starts++;this.loaded=x;},removeAttribute(){this.loaded=null;},decode(){return new Promise(()=>{});}}));
 const loader=createPreviewLoader(images,{signal:abort.signal,concurrency:2});const work=loader.run();assert.equal(starts,2);abort.abort();await work;assert.equal(starts,2);assert.ok(images.every(x=>!x.loaded));assert.equal(loader.counts().unattempted,5);
});

test('Workspace output retains exact source algorithms and public fixture identity',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json')));for(const relative of ['research/explorer-core.mjs','media/media-core.mjs','media/media-events.mjs','media/bilibili-player.mjs','media/public-fixtures.json']){const record=manifest.source_modules.find(x=>x.destination===relative);assert.ok(record);assert.equal(record.source_sha256,record.output_sha256);}for(const kind of ['research','media']){const code=fs.readFileSync(path.join(base,kind,'index.mjs'),'utf8');assert.doesNotMatch(code,/history\.replaceState|window\.addEventListener\('popstate'|\beval\(/);assert.match(code,/export async function mount/);}
});


test('YouTube player construction is explicit, autoplay-off and destroyed on unmount',async()=>{
 const env=setup();let controller,settings,destroyed=0;const oldYT=Object.getOwnPropertyDescriptor(globalThis,'YT');
 try{const fake={Player:class {constructor(_target,options){settings=options;}destroy(){destroyed++;}}};env.window.YT=fake;Object.defineProperty(globalThis,'YT',{configurable:true,writable:true,value:fake});controller=await(await component('media')).mount({container:env.container});const root=env.container.shadowRoot;assert.equal(settings,undefined);const article=[...root.querySelectorAll('article.card')].find(x=>x.querySelector('.provider').textContent.includes('YouTube'));assert.ok(article);[...article.querySelectorAll('button')].find(x=>x.textContent==='Load selected player').click();await new Promise(setImmediate);assert.equal(settings.playerVars.autoplay,0);assert.equal(settings.host,'https://www.youtube-nocookie.com');controller.unmount();assert.equal(destroyed,1);}
 finally{controller?.unmount();if(oldYT)Object.defineProperty(globalThis,'YT',oldYT);else delete globalThis.YT;env.restore();}
});

test('Native workspace build reproduces every published module and fixture byte',()=>{
 const {spawnSync}=require('node:child_process');const run=spawnSync('python3',[path.resolve(__dirname,'../scripts/build_engineering_workspaces.py'),'--check'],{encoding:'utf8'});assert.equal(run.status,0,run.stdout+run.stderr);
});


test('Preview cancellation settles even if a detached image rejects cleanup',async()=>{
 const {createPreviewLoader}=await import(pathToFileURL(path.join(base,'media/preview-loader.mjs')).href);const abort=new AbortController();const events=[];const image={dataset:{source:'https://example.test/image'},classList:{add(){},remove(){}},removeAttribute(){throw Error('detached');},decode(){return new Promise(()=>{});}};const loader=createPreviewLoader([image],{signal:abort.signal,report:(type)=>events.push(type)});const work=loader.run();abort.abort();await work;assert.equal(loader.counts().failed,1);assert.ok(events.includes('image_abort_cleanup_failed'));
});


test('Privileged loopback Media retains metadata but disables all external media controls',async()=>{
 const env=setup();let controller;
 try{globalThis.location=new URL('http://127.0.0.1:41379/#media');controller=await(await component('media')).mount({container:env.container});const root=env.container.shadowRoot;assert.equal(controller.ready,true);assert.ok(root.querySelectorAll('article.card').length>0);assert.equal(root.getElementById('load-media').disabled,true);assert.ok([...root.querySelectorAll('.player-controls button,.player-controls select')].every(control=>control.disabled));assert.match(root.getElementById('status').textContent,/third-party code away from local data/);assert.ok(controller.exportState().receipt.events.some(event=>event.type==='local_runtime_restriction'));assert.equal(env.calls.length,1);}
 finally{controller?.unmount();env.restore();}
});

test('Research renders preserved Athena evidence links while keeping original Atlas provenance visible',async()=>{
 const env=setup();let controller;
 try{controller=await(await component('research')).mount({container:env.container,route:'#research?sort=measured&cohort=json-catalog-2000-decode'});const root=env.container.shadowRoot;
  assert.equal(controller.ready,true);const links=[...root.querySelectorAll('a[data-preserved-sha256]')];assert.equal(links.length,4);
  for(const link of links){assert.match(link.href,/^https:\/\/github.com\/Herbertofury\/Athena\/blob\/af594fd2cdd5c00f01178ee353965a54b01b05d7\/engineering\/experiments\/json-lab\//);assert.match(link.title,/Original: https:\/\/github.com\/Herbertofury\/Engineering-Atlas\/blob\/4ed47c5c/);assert.match(link.title,/SHA-256 [a-f0-9]{64}/);assert.match(link.parentNode.textContent,/Exact Athena copy; original Atlas evidence/);assert.equal(link.getAttribute('rel'),'noopener noreferrer');}
  assert.ok([...root.querySelectorAll('a[href]')].every(link=>!link.href.includes('Herbertofury/Engineering-Atlas')));assert.equal(env.calls.length,1);
 }finally{controller?.unmount();env.restore();}
});
