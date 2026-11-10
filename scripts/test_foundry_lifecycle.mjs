import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {parseHTML} from 'linkedom';
const here=dirname(fileURLToPath(import.meta.url));
const real={setTimeout,clearTimeout,setInterval,clearInterval,URL};
let window,document,failures={};
const tracked={observers:new Set(),audio:new Set()};
function install(){
 ({window,document}=parseHTML('<html><head></head><body><main id="workspace"></main></body></html>'));
 Object.assign(globalThis,{window,document,Event:window.Event,CustomEvent:window.CustomEvent,HTMLElement:window.HTMLElement,HTMLInputElement:window.HTMLInputElement,CSS:{escape:s=>s}});
 const storage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},configurable:true});
 Object.defineProperty(window,'location',{value:{hostname:'127.0.0.1',origin:'http://127.0.0.1:42800',pathname:'/',href:'http://127.0.0.1:42800/'},configurable:true});
 Object.assign(window,{setTimeout:real.setTimeout,clearTimeout:real.clearTimeout,setInterval:real.setInterval,clearInterval:real.clearInterval,requestAnimationFrame:fn=>real.setTimeout(()=>fn(Date.now()),16),cancelAnimationFrame:real.clearTimeout,URL:real.URL});
 for(const name of ['ResizeObserver','MutationObserver','PerformanceObserver']){
  const Cls=class{constructor(fn){this.fn=fn;this.live=true;tracked.observers.add(this)}observe(){}disconnect(){this.live=false;tracked.observers.delete(this);if(failures.observer)throw Error('injected observer cleanup failure')}};
  globalThis[name]=Cls;window[name]=Cls;
 }
 const Audio=class{constructor(){this.closed=false;tracked.audio.add(this)}close(){this.closed=true;tracked.audio.delete(this);if(failures.audio)throw Error('injected audio cleanup failure');return Promise.resolve()}};
 window.AudioContext=Audio;globalThis.AudioContext=Audio;
 return document.getElementById('workspace');
}
const fixture=`window.ffPremium={diagnostics:()=>({fixture:true})};window.__ffPrototypeTest={fixture:true};
new MutationObserver(()=>{}).observe(document.body);new PerformanceObserver(()=>{}).observe(document.body);new AudioContext();
setTimeout(()=>{},60000);setInterval(()=>{},60000);requestAnimationFrame(()=>{});
window.addEventListener('resize',()=>{});window.addEventListener('ff:test',()=>{});document.addEventListener('click',()=>{});
const video=document.querySelector('video');video.pause=()=>{if(globalThis.__failMedia)throw Error('injected pause failure')};video.load=()=>{if(globalThis.__failMedia)throw Error('injected load failure')};
window.__athenaDispose=()=>{if(globalThis.__failDispose)throw Error('injected runtime dispose failure')};`;
async function moduleFor(timeout=10000){
 const dir=await mkdtemp(resolve(tmpdir(),'athena-foundry-unit-'));
 let source=await readFile(resolve(here,'../dist/workspaces/foundry/index.js'),'utf8');
 const wrapper=source.indexOf('/* Athena Foundry workspace:'),start=source.indexOf('  function boot(){',wrapper),end=source.indexOf('  const cleanupErrors=[];',start);
 assert.ok(wrapper>=0&&start>wrapper&&end>start,'Generated workspace lifecycle markers missing');
 source=source.slice(wrapper,start)+'  function boot(){'+fixture+'\n  }\n'+source.slice(end);
 source=source.replace(',10000);shadow.append(style)',','+timeout+');shadow.append(style)');
 source='const BODY_ATTRIBUTES={};const WORKSPACE_HTML="<video></video>";\n'+source;
 const file=resolve(dir,'module.mjs');await writeFile(file,source);return import(pathToFileURL(file));
}

function stylesheet(event='load'){const host=document.querySelector('.athena-foundry-workspace');assert.ok(host);host.shadowRoot.querySelector('link').dispatchEvent(new window.Event(event));}
function clean(diag){assert.equal(diag.resources.dead,true);for(const [k,v]of Object.entries(diag.resources))if(k!=='dead')assert.equal(v,0,k);assert.equal(document.querySelectorAll('.athena-foundry-workspace').length,0);assert.equal(tracked.observers.size,0);assert.equal(tracked.audio.size,0)}
test('normal mount and repeated unmount clear every owned resource',async()=>{const container=install();const {mount}=await moduleFor();const pending=mount({container});stylesheet();const w=await pending;assert.ok(w.diagnostics().resources.observers>=3);await w.unmount();await w.unmount();clean(w.diagnostics());assert.deepEqual(w.diagnostics().cleanupErrors,[])});
test('abort while stylesheet is stalled rejects and removes host',async()=>{const container=install();const {mount}=await moduleFor();const c=new AbortController();const pending=mount({container,signal:c.signal});c.abort();await assert.rejects(pending,{name:'AbortError'});assert.equal(container.childElementCount,0)});
test('bounded stylesheet timeout rejects and removes host',async()=>{const container=install();const {mount}=await moduleFor(20);const pending=mount({container});await assert.rejects(pending,/stylesheet timed out/);assert.equal(container.childElementCount,0)});
test('stylesheet error rejects and removes host',async()=>{const container=install();const {mount}=await moduleFor();const pending=mount({container});stylesheet('error');await assert.rejects(pending,/stylesheet failed/);assert.equal(container.childElementCount,0)});
test('abort after load before boot never leaves a mounted host',async()=>{const container=install();const {mount}=await moduleFor();const c=new AbortController();const pending=mount({container,signal:c.signal});stylesheet();c.abort();await assert.rejects(pending,{name:'AbortError'});assert.equal(container.childElementCount,0)});
test('throwing runtime, observer, media and audio cleanup cannot stop remaining disposal',async()=>{const container=install();const {mount}=await moduleFor();const pending=mount({container});stylesheet();const w=await pending;failures={observer:true,audio:true};globalThis.__failMedia=true;globalThis.__failDispose=true;try{await w.unmount();const d=w.diagnostics();clean(d);for(const word of ['runtime','observer','pause','load','audio'])assert.ok(d.cleanupErrors.some(e=>e.includes(word)),word+' missing failure receipt')}finally{failures={};globalThis.__failMedia=false;globalThis.__failDispose=false}});
