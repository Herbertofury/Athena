// Execute the actual current app search function, not a Python approximation.
const fs=require('node:fs'),vm=require('node:vm'),{performance}=require('node:perf_hooks');
const root=process.argv[2],queries=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const app=fs.readFileSync(root+'/dist/app.js','utf8');
const start=app.indexOf('function search(q){'),end=app.indexOf('\n',start);
if(start<0||end<0)throw Error('Search function extraction contract changed');
const fn=app.slice(start,end),dc={};vm.createContext(dc);vm.runInContext(fs.readFileSync(root+'/dist/catalog.js','utf8'),dc);const data=dc.ATHENA_DATA;
let ids=[];
const context={data,$:()=>({textContent:''}),heading:()=>'',certCard:()=>'',lessonCard:l=>{ids.push(l.id);return '';}};
vm.createContext(context);vm.runInContext(fn,context);
const results=queries.map(q=>{ids=[];context.search(q.query);const result=[...ids],times=[];
for(let i=0;i<101;i++){ids=[];const t=performance.now();context.search(q.query);times.push(performance.now()-t);}
times.sort((a,b)=>a-b);return {query:q.query,ids:result,median_ms:times[50],p95_ms:times[95]};});
console.log(JSON.stringify({node:process.version,function_source:fn,documents:data.lessons.map(l=>({id:l.id,text:(l.id+' '+l.title+' '+l.summary+' '+l.category+' '+l.tags.join(' ')+' '+(l.learningGoals||[]).join(' ')).toLowerCase()})),results}));
