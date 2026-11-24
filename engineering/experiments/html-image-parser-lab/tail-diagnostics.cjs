'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{performance,PerformanceObserver}=require('node:perf_hooks');
const paths={baseline:path.join(__dirname,'../enderloom-media/src/provider-media.js'),sax:path.join(__dirname,'candidate/src/provider-media.js'),callback:path.join(__dirname,'fast-candidate/src/provider-media.js'),streaming:path.join(__dirname,'streaming-candidate/src/provider-media.js')};
const modules=Object.fromEntries(Object.entries(paths).map(([name,file])=>[name,require(file)]));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');const emit=value=>process.stdout.write(JSON.stringify(value)+'\n');const settle=()=>new Promise(resolve=>setImmediate(resolve));
const names=['baseline','sax','callback','streaming'];
const orders=Array.from({length:8},(_,i)=>{const rotated=names.slice(i%4).concat(names.slice(0,i%4));return i<4?rotated:rotated.reverse();});
const gc=[];const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())gc.push({start_ms:entry.startTime,duration_ms:entry.duration,kind:entry.detail?.kind??null});});observer.observe({entryTypes:['gc']});
(async()=>{
 emit({kind:'header',scope:'generated offline HTML parser comparison, no target deployment',source_revision:'fc55c422f93480d75604203b288a837bb87ed623',source_sha256:Object.fromEntries(Object.entries(paths).map(([n,p])=>[n,hash(fs.readFileSync(p))])),harness_sha256:hash(fs.readFileSync(__filename)),dependency_lock_sha256:hash(fs.readFileSync(path.join(__dirname,'package-lock.json'))),node:process.version,rounds:16,warmups:2,order:'eight counterbalanced rotations repeated twice',cleanup:'setImmediate outside every timing window for all strategies',limits:['Generated clean fixtures; adversarial correctness is separate','Passive GC instrumentation and process CPU diagnostics add overhead; not comparable directly to uninstrumented runs','Post-sample heap-used is not peak memory and all parser modules share this process','No module-load, live provider, image/video, UI or peak-memory measurement','Every parser is reconstructed; no parsed-output cache','Provider-specific scopes and non-img fallback paths are unchanged']});
 for(const [count,density] of [[1024,256]]){
  const title='Atlas Generated Fixture',source='https://www.nexusmods.com/skyrimspecialedition/mods/123456';
  const items=Array.from({length:count},(_,i)=>`<img src="https://staticdelivery.nexusmods.com/mods/1704/images/123456/item-${i}.png" alt="${title} screenshot ${i} ${'x'.repeat(density)}" width="1280" height="720">`).join('');
  const html=`<html><head><meta property="og:title" content="${title}"></head><body><h1>${title}</h1><section class="gallery">${items}</section></body></html>`;
  const expected=JSON.stringify(modules.baseline.parseGenericProjectHtml(html,source,{title}));
  emit({kind:'workload',count,density,input_bytes:Buffer.byteLength(html),input_sha256:hash(html),complete_expected_sha256:hash(expected)});
  for(let i=0;i<2;i++)for(const name of orders[i]){modules[name].parseGenericProjectHtml(html,source,{title});await settle();}
  for(let round=0;round<16;round++)for(const strategy of orders[round%8]){
   const cpuStart=process.cpuUsage();const start=performance.now();const output=modules[strategy].parseGenericProjectHtml(html,source,{title});const end=performance.now();const elapsed=end-start;const cpu=process.cpuUsage(cpuStart);
   const serialized=JSON.stringify(output),equal=serialized===expected&&output.gallery.length===count;
   await settle();await settle();emit({kind:'sample',count,density,round,strategy,elapsed_ms:elapsed,cpu_user_us:cpu.user,cpu_system_us:cpu.system,gc_overlap:gc.filter(e=>e.start_ms<end&&e.start_ms+e.duration_ms>start),heap_used_after_bytes:process.memoryUsage().heapUsed,gallery_count:output.gallery.length,complete_output_equal:equal,output_sha256:hash(serialized)});
   if(!equal)throw Error('Complete generated output mismatch');
   await settle();
  }
 }
 observer.disconnect();emit({kind:'completion',complete:true,samples:64});
})().catch(error=>{emit({kind:'failure',complete:false,message:error.message});process.exitCode=1;});
