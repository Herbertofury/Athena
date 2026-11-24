const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {fileURLToPath, pathToFileURL} = require('node:url');
const {parseHTML} = require('linkedom');

const assets = path.resolve(process.env.ATHENA_RESEARCH_TEST_PACKAGE || path.join(__dirname, '../dist'));
const research = path.join(assets, 'workspaces/engineering/research');
const sourceCatalog = path.join(research, 'catalog.json');
const entryRoute = '#research?q=sqlite&sort=name';
const planRoute = '#research?plan=planned-local-catalog-v1';
const initialURL = 'https://example.invalid/Athena/preview/?style=local';

async function open(initial = entryRoute) {
  const asset = name => fs.readFileSync(path.join(assets, name), 'utf8');
  const {window, document} = parseHTML(asset('index.html'));
  const original = new Map(), requests = [], writes = [];
  const calls = [];
  let cursor = 0;
  const history = [new URL(initial, initialURL).href];
  const location = {get href(){return history[cursor];},
    get origin(){return new URL(this.href).origin;},
    get hash(){return new URL(this.href).hash;}};
  const storage = {getItem(){return null;},setItem(...args){writes.push(args);}};
  const option = function(text, value){const node=document.createElement('option');
    node.textContent=text;node.setAttribute('value',value);return node;};
  const fetch = async (url, options) => {
    requests.push([String(url), options]);
    assert.equal(fileURLToPath(url), sourceCatalog, 'only the packaged catalog may be read');
    return {ok:true,json:async()=>JSON.parse(fs.readFileSync(sourceCatalog, 'utf8'))};
  };
  const select = window.HTMLSelectElement.prototype;
  const descriptors = Object.getOwnPropertyDescriptors(select);
  select.add = function(node){this.append(node);};
  select.remove = function(i){this.options[i]?.remove();};
  Object.defineProperty(select, 'value', {configurable:true,
    get(){return this.querySelector('option[selected]')?.getAttribute('value')||'';},
    set(value){for(const node of this.options)node.toggleAttribute('selected',node.getAttribute('value')===String(value));}});
  const restore = () => {
    for(const [key, descriptor] of original){
      if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
    }
    for(const key of ['value','add','remove']){
      if(descriptors[key])Object.defineProperty(select,key,descriptors[key]);else delete select[key];
    }
  };
  for(const [key, value] of Object.entries({document,location,localStorage:storage,Option:option,fetch})){
    original.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  }
  window.HTMLElement.prototype.focus = function(){};
  window.location = location;
  window.history = {replaceState(_state,_unused,target){history[cursor]=new URL(target,location.href).href;}};
  window.localStorage = storage;
  window.URL = URL;
  window.URLSearchParams = URLSearchParams;
  window.AthenaWorkspaceLoaders = {research:async()=>{
    const mod = await import(pathToFileURL(path.join(research, 'index.mjs')).href);
    return {mount:async context=>{calls.push(context.route);return mod.mount(context);}};
  }};
  const search = document.querySelector('#search');
  search.value = '';
  const settle = () => new Promise(setImmediate);
  const routeChanged = () => window.dispatchEvent(new window.Event('hashchange'));
  const go = async target => {
    const url = new URL(target, location.href).href;
    if(url !== location.href){history.splice(++cursor,Infinity,url);routeChanged();}
    await settle();
  };
  const step = async delta => {cursor += delta;routeChanged();await settle();};
  const root = () => document.querySelector('.workspace-container')?.shadowRoot;
  // Linkedom dispatches the click but does not implement default hyperlink
  // navigation. Only emulate that action if the actual adapter allows it.
  const click = async (link, {button=0,ctrlKey=false,metaKey=false,shiftKey=false,altKey=false,detail=1}={}) => {
    const event = new window.Event('click',{bubbles:true,cancelable:true});
    Object.assign(event,{button,ctrlKey,metaKey,shiftKey,altKey,detail});
    link.dispatchEvent(event);
    if(!event.defaultPrevented && button===0 && !ctrlKey && !metaKey && !shiftKey && !altKey)await go(link.getAttribute('href'));
    return event.defaultPrevented;
  };
  try {
    const ctx=vm.createContext(window);
    for(const name of ['catalog.js','core.js','workspace-host.js','app.js'])
      vm.runInContext(asset(name),ctx,{filename:name});
    await settle();
    return {window,document,search,root,go,step,click,location,requests,writes,history,calls,restore};
  }catch(error){restore();throw error;}
}
function linksToPlan(root) {
  return [...root.querySelectorAll('a')].filter(a=>a.textContent==='Local catalog transactions');
}
function plan(root) {
  const guide=root.getElementById('plan-guide');
  assert.equal(guide.hidden,false);
  assert.equal(guide.querySelector('h3').textContent,'Local catalog transactions');
  assert.match(guide.textContent,/6 registered candidates/);
  assert.match(root.getElementById('result-count').textContent,/^6 of \d+ candidates/);
  assert.deepEqual([...root.querySelectorAll('#results article h3')].map(node=>node.textContent).sort(),
    ['Fjall','RocksDB','SQLite','Turso Database','libmdbx','redb']);
}

test('registered plan supports copy, new tab and un-intercepted modified clicks on Athena’s subpath',async()=>{
  const s=await open();
  try {
    const root=s.root(), [link]=linksToPlan(root);
    assert.ok(link,'open the retained SQLite candidate and read its registered test-plan link');
    assert.equal(link.localName,'a');
    assert.equal(link.getAttribute('href'),planRoute);
    assert.equal(new URL(link.getAttribute('href'),s.location.href).href,initialURL+planRoute);
    assert.equal(await s.click(link,{ctrlKey:true}),false);
    assert.equal(await s.click(link,{metaKey:true}),false);
    assert.equal(await s.click(link,{button:1}),false);
    assert.equal(await s.click(link,{shiftKey:true}),false);
    assert.equal(await s.click(link,{altKey:true}),false);
    assert.equal(s.location.hash,entryRoute);
    assert.equal(s.history.length,1);
    assert.equal(s.requests.length,1);
    assert.deepEqual(s.writes,[]);
  } finally {s.restore();}
  const reopened=await open(planRoute);
  try {plan(reopened.root());assert.equal(reopened.requests.length,1);assert.deepEqual(reopened.writes,[]);}
  finally {reopened.restore();}
});

test('keyboard-style plan activation participates in shell Back/Forward without swallowing unrelated hashes',async()=>{
  const s=await open();
  try {
    const root=s.root(), [link]=linksToPlan(root);
    assert.ok(link);
    assert.equal(await s.click(link,{detail:0}),false);
    assert.equal(s.location.hash,planRoute);
    assert.equal(s.root(),root,'a same-workspace plan never remounts');
    assert.equal(s.calls.length,1);
    plan(root);
    assert.equal(s.search.value,'');
    await s.step(-1);
    assert.equal(s.location.hash,entryRoute);
    assert.equal(s.search.value,'sqlite');
    assert.equal(root.getElementById('sort').value,'name');
    assert.equal(root.getElementById('plan-guide').hidden,true);
    await s.step(1);
    plan(root);
    await s.go('#research?plan=unknown-fixture');
    assert.equal(root.getElementById('plan-guide').hidden,true);
    assert.match(root.getElementById('results').textContent,/planned comparison is unavailable/i);
    assert.equal(s.location.hash,'#research?plan=unknown-fixture');
    assert.deepEqual(s.writes,[],'opening plans does not directly write storage');
    await s.go('#foundations');
    assert.equal(s.document.querySelector('#main').dataset.workspace,'learning');
    await s.step(-1);
    assert.match(s.root().getElementById('results').textContent,/planned comparison is unavailable/i);
    await s.step(-1);
    plan(s.root());
    await s.step(1);
    assert.match(s.root().getElementById('results').textContent,/planned comparison is unavailable/i);
    // Crossing into Learning retains only the shell’s existing Research settings snapshot.
    assert.deepEqual(s.writes.map(([key, value])=>[key,JSON.parse(value)]),[
      ['athena-workspaces-v1',{schema:1,workspaces:{research:{query:'plan=unknown-fixture',shortlist:[],loaded:true}}}]]);
    assert.equal(s.requests.length,2);
  } finally {s.restore();}
});

test('workspace-local methodology jump stays a jump, not a shell history entry',async()=>{
  const s=await open();
  try {
    const root=s.root();
    const methodology=root.getElementById('methodology'), scrolls=[];
    methodology.scrollIntoView=options=>scrolls.push(options);
    assert.equal(await s.click(root.querySelector('a[href="#methodology"]')),true);
    assert.deepEqual(scrolls,[{block:'start'}]);
    assert.equal(s.location.hash,entryRoute);
    assert.equal(s.history.length,1);
    assert.deepEqual(s.writes,[]);
  } finally {s.restore();}
});
