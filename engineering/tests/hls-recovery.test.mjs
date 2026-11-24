import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRetryableLoader} from '../docs/media-lab/resource-loader.mjs';
const baseline=readFileSync(new URL('../experiments/hls-recovery-lab/baseline-hls-loader.mjs',import.meta.url),'utf8');
function setup(code){
 const state={scripts:[],removed:0,timers:new Set(),events:[],throwAppend:false};const window={};
 const document={createElement(){return {remove(){state.removed++;}};},head:{append(script){state.scripts.push(script);if(state.throwAppend)throw Error('fixture append failure');}}};
 const context={window,document,createRetryableLoader,performance:{now:()=>0},event:(...args)=>state.events.push(args),setTimeout(fn){state.timers.add(fn);return fn;},clearTimeout(fn){state.timers.delete(fn);}};
 vm.runInNewContext(code+'\nglobalThis.load=hlsApi;',context);
 return {state,window,load:context.load,ready(){window.Hls={version:'1.7.3'};context.Hls=window.Hls;}};
}
const current=readFileSync(new URL('../docs/media-lab/media.js',import.meta.url),'utf8');
const start=current.includes('const hlsApi=')?current.indexOf('const hlsApi='):current.indexOf('let hlsPromise=null;');
const actual=current.slice(start,current.indexOf('const youtubeApi='));
test('retained baseline reproduces orphaned timeout script and late ready event',async()=>{
 const x=setup(baseline);const first=x.load();for(const fn of [...x.state.timers])fn();await assert.rejects(first);assert.equal(x.state.removed,0);x.ready();x.state.scripts[0].onload();assert.equal(x.state.events.length,1);
});
for(const mode of ['error','timeout','throw','wrong-identity'])test(`actual HLS loader cleans ${mode} and permits one explicit retry`,async()=>{
 const x=setup(actual);x.state.throwAppend=mode==='throw';const first=x.load();await Promise.resolve();
 const script=x.state.scripts[0];const lateLoad=script.onload;
 if(mode==='error')script.onerror();if(mode==='timeout')for(const fn of [...x.state.timers])fn();if(mode==='wrong-identity'){x.window.Hls={version:'unexpected'};script.onload();}
 await assert.rejects(first);assert.equal(x.state.removed,1);assert.equal(x.state.timers.size,0);assert.equal(x.state.events.length,0);assert.equal(script.onload,null);assert.equal(script.onerror,null);
 x.state.throwAppend=false;const retry=x.load();assert.equal(x.load(),retry);await Promise.resolve();assert.equal(x.state.scripts.length,2);x.ready();lateLoad?.();assert.equal(x.state.events.length,0);x.state.scripts[1].onload();await retry;assert.equal(x.state.events.length,1);assert.equal(x.state.timers.size,0);await x.load();assert.equal(x.state.scripts.length,2);assert.equal(x.state.scripts[1].integrity,'__HLS_SRI__');assert.equal(x.state.scripts[1].crossOrigin,'anonymous');
});
