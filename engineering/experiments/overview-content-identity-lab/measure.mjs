// Controlled-DOM target renderer cost, not native input/paint latency.
import {readFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {mount} from '../job-identity-lab/render-harness.mjs';
import * as input from '../../apps/atlas-lab/ui/collection-input.mjs';
const [before,after,fixture,output]=process.argv.slice(2);
const sources=[before,after].map(p=>readFileSync(p,'utf8').replace(/^import .*;\n/gm,''));
const publicFixture=JSON.parse(readFileSync(fixture,'utf8'));
const generated=(count,size)=>({counts:{succeeded:count},jobs:Array.from({length:count},(_,i)=>({id:i+1,id_text:String(i+1),job:'DedupExperiment',state:'succeeded',attempt:1,result:{unknown:'x'.repeat(size),error:'retained generated fixture'}}))});
const cases=[['retained-public-plus-id-fixtures',publicFixture],['generated-50x8KiB',generated(50,8192)],['generated-single-2MiB-field',generated(1,2*1024*1024-100)]];
const results=[];
for(const [name,data] of cases){const raw=JSON.stringify(data);for(let pass=0;pass<24;pass++){for(const variant of (pass%2?[1,0]:[0,1])){const app=mount(sources[variant],input),fresh=JSON.parse(raw);let start=performance.now();app.render(fresh);const cold=performance.now()-start;start=performance.now();app.render(JSON.parse(raw));const repeatedIncludingParse=performance.now()-start;results.push({name,pass,variant:variant?'repair':'baseline',cold_ms:cold,repeated_including_parse_ms:repeatedIncludingParse,cards:app.get('jobs').children.length});}}}
writeFileSync(output,JSON.stringify({scope:'Same actual renderer, controlled DOM. 24 alternating-order pairs per workload. No native latency/RSS/performance promotion.',results},null,2)+'\n');
for(const [name] of cases)for(const variant of ['baseline','repair']){const rows=results.filter(r=>r.name===name&&r.variant===variant),pct=k=>rows.map(r=>r[k]).sort((a,b)=>a-b)[22];console.log(name,variant,{cold_p95_ms:pct('cold_ms'),repeat_parse_p95_ms:pct('repeated_including_parse_ms')});}
