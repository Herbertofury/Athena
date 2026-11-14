import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mount} from '../job-identity-lab/render-harness.mjs';
import * as input from '../../apps/atlas-lab/ui/collection-input.mjs';
const ref=process.argv[2],output=process.argv[3];
const sourceBytes=ref?execFileSync('git',['show',ref+':apps/atlas-lab/ui/app.js'],{encoding:'utf8'}):readFileSync(new URL('../../apps/atlas-lab/ui/app.js',import.meta.url),'utf8');
const source=sourceBytes.replace(/^import .*;\r?\n/gm,'');
const cases=[
 {name:'numeric string concatenates pending metric',counts:{queued:'4',running:2}},
 {name:'negative completed count',counts:{succeeded:-7}},
 {name:'boolean failed count',counts:{failed:true}},
 {name:'non-finite count from JSON exponent overflow',counts:JSON.parse('{"running":1e309}')},
 {name:'unsafe aggregate sum',counts:{queued:Number.MAX_SAFE_INTEGER,running:1}},
 {name:'array masquerading as counts',counts:[]},
];
const records=cases.map(c=>{const app=mount(source,input);app.render({counts:{queued:3,succeeded:4,failed:5},jobs:[]});let rejected=false;try{app.render({counts:c.counts,jobs:[]});}catch{rejected=true;}const shown=Object.fromEntries(['pending','completed','failed'].map(id=>[id,app.get(id).textContent]));return {case:c.name,rejected,shown,last_good_retained:shown.pending==='3'&&shown.completed==='4'&&shown.failed==='5'};});
const sha256=value=>createHash('sha256').update(value).digest('hex');
const receipt={app_sha256:sha256(sourceBytes),harness_sha256:sha256(readFileSync(new URL('../job-identity-lab/render-harness.mjs',import.meta.url))),input_sha256:sha256(readFileSync(new URL('../../apps/atlas-lab/ui/collection-input.mjs',import.meta.url))),kind:'synthetic-controlled-renderer-reproduction',source_revision:ref||'working-tree',native_browser:false,real_http:false,node:process.version,cases:records};
if(output)writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
