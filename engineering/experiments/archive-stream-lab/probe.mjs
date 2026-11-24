const mode=process.argv[2];
if(!['baseline','current'].includes(mode))throw Error('Choose baseline or current');
const {loadSavedProject}=await import(mode==='baseline'?'./archive-view-before.mjs':'../../apps/atlas-lab/ui/archive-view.mjs');
import {createHash} from 'node:crypto';
const size=262144,body=new Uint8Array(size).fill(32),id='AANobbMI';
let pos=0,peak=0;const start=process.memoryUsage();
const response=new Response(new ReadableStream({pull(c){if(pos===size){c.close();return;}c.enqueue(new Uint8Array([body[pos++]]));if(pos%4096===0)peak=Math.max(peak,process.memoryUsage().heapUsed);}}),{headers:{'content-type':'application/json','x-atlas-canonical-id':id,'x-atlas-generation':'1','x-atlas-payload-sha256':createHash('sha256').update(body).digest('hex')}});
const t=performance.now();const result=await loadSavedProject(id,{fetchImpl:async()=>response,timeoutMs:30000});
console.log(JSON.stringify({bytes:result.bytes.length,chunks:size,hash:result.hash,elapsedMs:performance.now()-t,startHeap:start.heapUsed,peakSampledHeap:peak,peakRss:process.resourceUsage().maxRSS,scope:'Generated one-byte stream through actual archive loader; not browser or provider performance'}));
