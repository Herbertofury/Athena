const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'../..'),candidate=require('./candidate.cjs'),dataContext={};
vm.createContext(dataContext);vm.runInContext(fs.readFileSync(root+'/dist/catalog.js','utf8'),dataContext);
const data=dataContext.ATHENA_DATA,app=fs.readFileSync(root+'/dist/app.js','utf8');
const start=app.indexOf('function search(q){'),source=app.slice(start,app.indexOf('\n',start));
const filter="data.lessons.filter(l=>(l.id+' '+l.title+' '+l.summary+' '+l.category+' '+l.tags.join(' ')+' '+(l.learningGoals||[]).join(' ')).toLowerCase().includes(q))";
if(!source.includes(filter))throw Error('Baseline function contract changed');
const patched=source.replace(filter,'candidateSearch(q)');
const setup=performance.now(),candidateSearch=candidate.create(data.lessons),setupMs=performance.now()-setup;
function harness(fn){let ids=[];const ctx={data,candidateSearch,$:()=>({textContent:''}),heading:()=>'',certCard:()=>'',lessonCard:l=>{ids.push(l.id);return '';}};vm.createContext(ctx);vm.runInContext(fn,ctx);return q=>{ids=[];ctx.search(q);return [...ids];};}
const base=harness(source),improved=harness(patched);
const original=JSON.parse(fs.readFileSync(root+'/research/offline-target-search-2026-11-15/queries.json'));
const generated=data.lessons.flatMap(l=>[{query:l.title,expected:l.id,kind:'generated exact-title contract'},{query:candidate.text(l).split(' ').filter(Boolean).slice(0,4).reverse().join(' '),expected:l.id,kind:'generated reordered-text discovery'}]);
const tasks=[...original,...generated],rows=[];
for(const task of tasks){const b=base(task.query),c=improved(task.query);if(b.length&&JSON.stringify(b)!==JSON.stringify(c))throw Error('Baseline results changed: '+task.query);const times={baseline:[],candidate:[]};for(let i=0;i<101;i++){for(const [name,fn] of i%2?[['candidate',improved],['baseline',base]]:[['baseline',base],['candidate',improved]]){const t=performance.now();fn(task.query);times[name].push(performance.now()-t);}};rows.push({...task,baseline:b,candidate:c,baseline_success:task.expected?b.includes(task.expected):b.length===0,candidate_success:task.expected?c.includes(task.expected):c.length===0,baseline_median_ms:times.baseline.sort((a,b)=>a-b)[50],candidate_median_ms:times.candidate.sort((a,b)=>a-b)[50]});}
const bytes=Buffer.byteLength(JSON.stringify(data.lessons.map(candidate.text)));
console.log(JSON.stringify({scope:'same Node runtime, actual app function with identical rendering stubs; R&D only',node:process.version,documents:data.lessons.length,queries:rows.length,original_queries:original.length,generated_queries:generated.length,candidate_setup_ms:setupMs,preindexed_text_utf8_bytes:bytes,baseline_compatibility_preserved:true,source_hashes:Object.fromEntries(['dist/app.js','dist/catalog.js','research/offline-compatible-search-2026-11-15/candidate.cjs'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+p)).digest('hex')])),baseline_success:rows.filter(x=>x.baseline_success).length,candidate_success:rows.filter(x=>x.candidate_success).length,results:rows},null,2));
