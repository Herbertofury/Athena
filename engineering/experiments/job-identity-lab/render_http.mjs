import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {mount} from './render-harness.mjs';
const base='http://127.0.0.1:41379',hash=text=>createHash('sha256').update(text).digest('hex');
async function read(path){const r=await fetch(base+path,{signal:AbortSignal.timeout(5000),redirect:'error'});if(!r.ok)throw Error('HTTP fixture failed');const text=await r.text();if(Buffer.byteLength(text)>2*1024*1024)throw Error('Response budget');return text;}
const app=await read('/app.js'),input=await read('/collection-input.mjs'),wire=await read('/api/overview');
const harness=mount(input.replace(/^export /gm,'')+'\n'+app.replace(/^import .*;\n/gm,''));const data=JSON.parse(wire);let error=null;
try{harness.render(data);}catch(e){error=e.message;}
const result={scope:'Actual served application source and actual HTTP overview, executed in controlled DOM; not native browser paint',response_sha256:hash(wire),app_sha256:hash(app),input_sha256:hash(input),server_job_count:data.jobs.length,received_identities:data.jobs.map(j=>({legacy_js_id:String(j.id),exact:j.id_text??null})),rendered_card_count:harness.get('jobs').children.length,rendered_id_labels:harness.get('jobs').children.map(node=>node.children.find(child=>child.tag==='p')?.textContent??null),rendered_labels:harness.get('jobs').children.map(node=>node.textContent),error};
writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
