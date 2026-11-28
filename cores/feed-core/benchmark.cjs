/* Full-output lexical ranking benchmark. No network, truncation or prewarming. */
const assert=require('node:assert/strict');const {performance}=require('node:perf_hooks');const core=require('./feed-core.js');
const now=Date.parse('2026-11-28T12:00:00Z'),terms=['security','patch'];
const items=Array.from({length:10000},(_,i)=>({id:String(i),sourceId:`source-${i%43}`,url:`https://example.org/article/${i}`,
  title:`${i%3?'Release details':'Security patch'} for product ${i}`,summary:`Publisher summary for software update ${i}; ${i%7?'release notes':'security patch advisory'}.`,
  date:i%41?new Date(now-(i%887)*3600000).toISOString():'',media:[]}));
// Readable reference preserves the original equivalent comparator contract.
function reference(){const timestamp=item=>{const d=Date.parse(item.date||'');return Number.isFinite(d)&&d<=now?d:0;};const score=item=>{
  const d=timestamp(item),age=d?Math.max(0,(now-d)/86400000):Infinity,title=item.title.toLowerCase(),summary=item.summary.toLowerCase();
  return terms.reduce((sum,term)=>sum+(title.includes(term)?3:0)+(summary.includes(term)?1:0),0)+(d?2/(1+age):0);};
  return items.map((item,index)=>({item,index})).sort((a,b)=>score(b.item)-score(a.item)||timestamp(b.item)-timestamp(a.item)||a.index-b.index).map(row=>row.item);}
const referenceTimes=[],coreTimes=[];let firstCoreMs;
for(let round=0;round<15;round++){
  let start=performance.now();const expected=reference();referenceTimes.push(performance.now()-start);
  start=performance.now();const actual=core.rankItems(items,{sort:'relevance',query:terms.join(' '),now});const elapsed=performance.now()-start;coreTimes.push(elapsed);if(round===0)firstCoreMs=elapsed;
  assert.deepEqual(actual.map(item=>item.id),expected.map(item=>item.id));assert.equal(actual.length,items.length);
}
const summary=times=>{const sorted=[...times].sort((a,b)=>a-b);return {p50Ms:sorted[7],p95Ms:sorted[14],p99Ms:sorted[14]};};
console.log(JSON.stringify({node:process.version,items:items.length,runs:15,firstCompleteCoreCallMs:firstCoreMs,reference:summary(referenceTimes),candidate:summary(coreTimes),equivalentCompleteOutput:true,
  scope:'Synthetic 10,000-item lexical-ranking fixture; module-call timing only, not application startup or field performance.'},null,2));
