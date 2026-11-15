'use strict';
// R&D index lifecycle. No new matcher: reuse the compatibility candidate from #186.
const matcher=require('../offline-compatible-search-2026-11-15/candidate.cjs');
const MAX_BYTES=4*1024*1024;
function prepare(input){
 const serialized=JSON.stringify(input);
 if(Buffer.byteLength(serialized,'utf8')>MAX_BYTES)throw Error('Snapshot exceeds explicit 4 MiB R&D budget');
 const data=JSON.parse(serialized);
 if(data.schema!==1||typeof data.revision!=='string'||!data.revision.trim()||!Array.isArray(data.lessons))throw Error('Malformed snapshot envelope');
 const ids=new Set();
 for(const l of data.lessons){
  if(!l||!['id','title','summary','category'].every(k=>typeof l[k]==='string')||!l.id||ids.has(l.id))throw Error('Malformed or duplicate lesson');
  if(!Array.isArray(l.tags)||!l.tags.every(t=>typeof t==='string')||(l.learningGoals!==undefined&&(!Array.isArray(l.learningGoals)||!l.learningGoals.every(t=>typeof t==='string'))))throw Error('Malformed searchable arrays');
  ids.add(l.id);
 }
 return {data,serialized:JSON.stringify(data),search:matcher.create(data.lessons)};
}
function create(storage){
 if(!storage||typeof storage.read!=='function'||typeof storage.writeAtomic!=='function')throw Error('Atomic persistence adapter required');
 let current=null;const saved=storage.read();if(saved!==null)current=prepare(JSON.parse(saved));
 return {
  revision:()=>current?.data.revision??null,
  search:q=>current?structuredClone(current.search(q)):[],
  export:()=>current?.serialized??null,
  prepare:input=>prepare(input).serialized,
  commit(serialized){const next=prepare(JSON.parse(serialized));storage.writeAtomic(next.serialized);current=next;return current.data.revision;},
 };
}
module.exports={create,prepare,MAX_BYTES};
