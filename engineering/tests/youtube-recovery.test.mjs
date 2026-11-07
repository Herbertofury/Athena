import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRetryableLoader} from '../docs/media-lab/resource-loader.mjs';
const current=readFileSync(new URL('../docs/media-lab/media.js',import.meta.url),'utf8');
const code=current.slice(current.indexOf('const youtubeApi='),current.indexOf('function render(data)'))+'\nglobalThis.load=youtubeApi;';
function setup(failure='error',program=code){
 const state={starts:0,removed:0,timers:new Set(),events:[]};
 const window={};
 const document={createElement(){return {remove(){state.removed++;}};},head:{append(script){state.starts++;if(state.starts===1&&failure==='throw')throw Error('fixture append failure');queueMicrotask(()=>{if(state.starts===1){if(failure==='timeout'){for(const fn of [...state.timers])fn();}else script.onerror();}else {window.YT={Player:function(){}};window.onYouTubeIframeAPIReady();}});}}};
 const context={window,document,createRetryableLoader,event:(...args)=>state.events.push(args),setTimeout(fn){state.timers.add(fn);return fn;},clearTimeout(fn){state.timers.delete(fn);}};
 vm.runInNewContext(program,context);
 return {load:context.load,state,window};
}
for(const failure of ['error','timeout','throw'])test(`actual YouTube loader recovers after ${failure} without extra retries or stale timers`,async()=>{
 const {load,state,window}=setup(failure);await assert.rejects(load());assert.equal(state.starts,1);assert.equal(state.removed,1);assert.equal(state.timers.size,0);assert.equal(window.onYouTubeIframeAPIReady,undefined);
 await load();assert.equal(state.starts,2);assert.equal(state.timers.size,0);assert.equal(window.onYouTubeIframeAPIReady,undefined);
 await load();assert.equal(state.starts,2);
});

test('retained v3 loader reproduces permanent rejected-promise caching',async()=>{
 const old=readFileSync(new URL('../experiments/media-recovery-lab/baseline-youtube-loader.mjs',import.meta.url),'utf8')+'\nglobalThis.load=youtubeApi;';
 const {load,state}=setup('error',old);const first=load();await assert.rejects(first);const retry=load();assert.equal(retry,first);await assert.rejects(retry);assert.equal(state.starts,1);
});
