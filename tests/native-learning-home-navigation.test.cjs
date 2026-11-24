const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');

const assets = process.env.ATHENA_HOME_TEST_PACKAGE ||
  path.resolve(__dirname, '../dist');
const pinned = 'http://127.0.0.1:41379';
const capability = {
  application:'Athena', api_version:1, loopback_only:true,
  same_origin_only:true, learning_history_url:'/learning'
};
const getAsset = name => fs.readFileSync(path.join(assets,name),'utf8');
const tick = () => new Promise(setImmediate);
const result = value => ({ok:true,json:async()=>value});

function open({origin=pinned, answer=async()=>result(capability)}={}) {
  const {window} = parseHTML(getAsset('index.html'));
  const writes = [];
  const reads = [];
  const deadlines = [];
  const signal = new AbortController().signal;
  const prior = JSON.stringify({searchShortcutEnabled:false});
  window.location = {origin,hash:'#home'};
  window.history = {replaceState:(_a,_b,value)=>window.location.hash=value};
  window.URL = URL;
  window.URLSearchParams = URLSearchParams;
  window.AbortSignal = {timeout:ms=>{deadlines.push(ms);return signal;}};
  window.fetch = (url,options)=>{reads.push({url,options});return answer(url,options);};
  window.localStorage = {getItem:key=>key==='athena-accessibility-v1'?prior:null,
    setItem:(key,value)=>writes.push([key,value])};
  window.HTMLElement.prototype.focus=function(){};
  window.document.querySelector('#search').value='';
  const ctx = vm.createContext(window);
  for(const name of ['catalog.js','core.js','workspace-host.js','app.js'])
    vm.runInContext(getAsset(name),ctx,{filename:name});
  const document=window.document;
  return {
    document, reads, writes, deadlines, signal,
    links:()=>[...document.querySelectorAll('nav[aria-label="Main navigation"] a[href="/learning"]')],
    go(hash){window.location.hash=hash;window.dispatchEvent(new window.Event('hashchange'));}
  };
}

test('pinned Home adds a single real history link without moving or writing the page', async()=>{
  let release;
  const pending = new Promise(resolve=>{release=resolve;});
  const s=open({answer:()=>pending});
  assert.equal(s.links().length,0);
  assert.equal(s.reads.length,1);
  const home=s.document.querySelector('[data-nav="home"]');
  const heading=s.document.querySelector('#main h1');
  release(result(capability));
  await tick();
  const [link]=s.links();
  assert.equal(s.links().length,1);
  assert.equal(link.textContent,'Learning History');
  assert.equal(home.nextElementSibling,link);
  assert.equal(s.document.querySelector('#main h1'),heading);
  const [{url,options}]=s.reads;
  assert.equal(url,'/api/runtime');
  assert.equal(options.method,'GET');
  assert.equal(options.credentials,'omit');
  assert.equal(options.cache,'no-store');
  assert.equal(options.redirect,'error');
  assert.equal(options.signal,s.signal);
  assert.deepEqual(s.deadlines,[3000]);
  assert.deepEqual(s.writes,[]);
});

test('late qualification does not replace a different route, clear its query or rediscover', async()=>{
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  const s=open({answer:()=>pending});
  s.go('#foundations');
  const search=s.document.querySelector('#search');
  search.value='kernel';
  const heading=s.document.querySelector('#main h1');
  release(result(capability));
  await tick();
  assert.equal(s.links().length,1);
  assert.equal(s.document.querySelector('#main h1'),heading);
  assert.equal(search.value,'kernel');
  s.go('#home');
  s.go('#foundations');
  assert.equal(s.links().length,1);
  assert.equal(s.reads.length,1);
  assert.deepEqual(s.writes,[]);
});

test('public, standalone and non-exact loopback origins never probe discovery', async()=>{
  for(const origin of ['https://herbertofury.github.io','null','http://127.0.0.1:41200',
    'http://localhost:41379','https://127.0.0.1:41379','http://[::1]:41379',
    'http://127.0.0.1:413790','http://127.0.0.1.elsewhere.invalid:41379']){
    const s=open({origin});
    await tick();
    assert.equal(s.links().length,0,origin);
    assert.equal(s.reads.length,0,origin);
    assert.deepEqual(s.writes,[]);
  }
});

test('missing, failed or unverified capability leaves Home usable', async()=>{
  const mismatched=[
    null,{...capability,application:'Other'},{...capability,api_version:'1'},
    {...capability,loopback_only:false},{...capability,same_origin_only:false},
    {...capability,learning_history_url:'//outside.invalid/learning'},
    {...capability,learning_history_url:'/learning?unreviewed=1'},
    {...capability,learning_history_url:'/different'}
  ].map(x=>async()=>result(x));
  for(const answer of [...mismatched,
    async()=>({ok:false,json:async()=>{throw Error('status body must not be consumed');}}),
    async()=>({ok:true,json:async()=>{throw Error('invalid JSON');}}),
    async()=>{throw new DOMException('deadline','TimeoutError');}]) {
    const s=open({answer});
    const heading=s.document.querySelector('#main h1');
    await tick();
    assert.equal(s.links().length,0);
    assert.equal(s.document.querySelector('#main h1'),heading);
    assert.ok(s.document.querySelector('[data-nav="home"]'));
    assert.equal(s.reads.length,1);
    assert.deepEqual(s.writes,[]);
  }
});
