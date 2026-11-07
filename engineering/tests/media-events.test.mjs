import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMediaEvent} from '../docs/media-lab/media-events.mjs';

test('normal event details remain complete and input is not mutated',()=>{
 const details={card_id:'steam:620',error_type:'networkError',details:'manifestLoadError',future:{x:[1,2]}};
 const before=structuredClone(details),r=createMediaEvent('hls_error',12,details);
 assert.deepEqual(r,{type:'hls_error',at_ms:12,...before});assert.deepEqual(details,before);
});
test('provider detail keys cannot overwrite event identity or timing',()=>{
 for(const details of [{type:'networkError'},{at_ms:-1},{type:undefined},{at_ms:undefined}])
  assert.throws(()=>createMediaEvent('hls_error',12,details),/reserved/i);
});
test('invalid event envelope inputs are rejected explicitly',()=>{
 for(const type of ['',null,42])assert.throws(()=>createMediaEvent(type,1,{}));
 for(const time of [-1,NaN,Infinity,'1'])assert.throws(()=>createMediaEvent('event',time,{}));
 for(const details of [null,[],42,'x'])assert.throws(()=>createMediaEvent('event',1,details));
});
test('fatal HLS observer retains event tag separately from provider category',()=>{
 const source=readFileSync(new URL('../docs/media-lab/media.js',import.meta.url),'utf8');
 assert.equal(/event\('hls_error',\{card_id:card\.id,error_type:data\.type,details:data\.details\}\)/.test(source),true,'HLS caller retains provider category under error_type');
 assert.equal(/createMediaEvent\(type,performance\.now\(\),details\)/.test(source),true,'Application uses the validated envelope');
});

test('actual HLS callback: generated fatal fixture preserves both names and ignores stale/nonfatal events',()=>{
 const source=readFileSync(new URL('../docs/media-lab/media.js',import.meta.url),'utf8');
 const marker='hls.on(Hls.Events.ERROR,';const start=source.indexOf(marker)+marker.length;
 const callback=source.slice(start,source.indexOf(');hls.loadSource',start));
 const baseline=readFileSync(new URL('../experiments/media-event-identity-lab/baseline-handler.txt',import.meta.url),'utf8');
 const fixture={fatal:true,type:'networkError',details:'manifestLoadError'};
 function invoke(code,record,current=1,generation=1,data=fixture){
  const records=[],state={};const event=(type,details)=>records.push(record(type,1,details));
  const fn=Function('generation','current','state','event','card','readyTimer','clearTimeout','return ('+code+')')(generation,current,state,event,{id:'steam:620'},null,()=>{});
  fn(null,data);return {records,state};
 }
 const old=invoke(baseline,(type,time,details)=>({type,at_ms:time,...details}));
 assert.equal(old.records[0].type,'networkError','known-bad control loses hls_error identity');
 const fixed=invoke(callback,createMediaEvent);
 assert.deepEqual(fixed.records,[{type:'hls_error',at_ms:1,card_id:'steam:620',error_type:'networkError',details:'manifestLoadError'}]);
 assert.equal(invoke(callback,createMediaEvent,1,2).records.length,0);
 assert.equal(invoke(callback,createMediaEvent,1,1,{...fixture,fatal:false}).records.length,0);
});
