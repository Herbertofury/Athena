/** Real Node worker roundtrips; not Electron utilityProcess or Rust IPC measurements. */
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';

const digest = a => createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const median = a => [...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
if (!isMainThread) {
  parentPort.on('message', ({method,data}) => {
    if (method === 'json') {
      const values=JSON.parse(data);let sum=0;for(const x of values)sum+=x;
      parentPort.postMessage({sum,data:JSON.stringify(values)});
    } else {
      let sum=0;for(const x of data)sum+=x;
      parentPort.postMessage({sum,data}, method==='clone'?[]:[data.buffer]);
    }
  });
  parentPort.postMessage({ready:true});
} else {
  let seed=20261026;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const worker=new Worker(new URL(import.meta.url));
  const waitMessage=()=>new Promise((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);worker.off('message',onMessage);worker.off('error',onError);worker.off('exit',onExit);};
    const onMessage=x=>{cleanup();resolve(x);};const onError=e=>{cleanup();reject(e);};const onExit=c=>onError(new Error(`worker exited ${c}`));
    const timer=setTimeout(()=>onError(new Error('worker response timeout')),30000);
    worker.once('message',onMessage);worker.once('error',onError);worker.once('exit',onExit);
  });
  const report={schema:1,date:new Date().toISOString().slice(0,10),evidence:'measured_local_generated_workload',
    environment:{node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch},
    harness_sha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
    protocol:{rounds:15,seed:20261026,warmups_per_method:2,cold_start_measured:false,memory_measured:false,cpu_isolation_guaranteed:false},workloads:{}};
  try {
    assert.equal((await waitMessage()).ready,true);
    const a=new Uint32Array([1,2,3]), alias=new Uint8Array(a.buffer);
    const moved=structuredClone(a,{transfer:[a.buffer]});
    assert.equal(a.byteLength,0);assert.equal(alias.byteLength,0);assert.deepEqual([...moved],[1,2,3]);
    assert.equal(structuredClone(9007199254740993n),9007199254740993n);
    assert.throws(()=>JSON.stringify(9007199254740993n));
    assert.throws(()=>structuredClone(new SharedArrayBuffer(8),{transfer:[new SharedArrayBuffer(8)]}));
    report.semantic_probes={transfer_detaches_sender_and_alias:true,structured_clone_preserves_bigint:true,json_bigint_requires_explicit_codec:true,shared_array_buffer_not_transferable:true};
    for (const length of [1024,65536,1048576]) {
      const original=Uint32Array.from({length},(_,i)=>(i*31)%65536), expected=digest(original);
      let expectedSum=0;for(const x of original)expectedSum+=x;
      const methods=['clone','copy_transfer','owned_transfer','json'];
      const samples=Object.fromEntries(methods.map(x=>[x,[]])),orders=[];
      async function trial(method){
        // owned_transfer has a different lifetime contract: fresh exclusive input prepared before timing.
        const owned=method==='owned_transfer'?original.slice():null;
        const response=waitMessage();
        const start=performance.now();
        let data=method==='copy_transfer'?original.slice():method==='owned_transfer'?owned:method==='json'?JSON.stringify(Array.from(original)):original;
        worker.postMessage({method,data},method==='copy_transfer'||method==='owned_transfer'?[data.buffer]:[]);
        const result=await response;
        const returned=method==='json'?Uint32Array.from(JSON.parse(result.data)):result.data;
        const elapsed=performance.now()-start;
        assert.equal(result.sum,expectedSum);assert.equal(digest(returned),expected);assert.equal(digest(original),expected);
        if(method==='owned_transfer')assert.equal(owned.byteLength,0);
        return elapsed;
      }
      for(const method of methods)for(let i=0;i<2;i++)await trial(method);
      for(let round=0;round<15;round++){const order=shuffle([...methods]);orders.push(order);for(const method of order)samples[method].push(await trial(method));}
      report.workloads[original.byteLength]={input_bytes:original.byteLength,result_sha256:expected,round_orders:orders,samples_ms:samples,median_ms:Object.fromEntries(methods.map(m=>[m,median(samples[m])]))};
    }
    report.qualification='Actual Node worker_threads, generated Uint32 payloads, sum and full roundtrip. owned_transfer excludes preparing exclusive input and changes sender lifetime; do not compare it as a drop-in sender-preserving path. No Electron utilityProcess, browser renderer, Rust IPC, application or memory acceptance.';
    writeFileSync(process.argv[2]??'results.json',JSON.stringify(report,null,2)+'\n');
    for(const [bytes,r] of Object.entries(report.workloads))console.log(bytes,r.median_ms);
  } finally { await worker.terminate(); }
}
