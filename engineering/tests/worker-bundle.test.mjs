import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';
import {prepareDataset} from '../experiments/card-receiver-lab/baseline.mjs';
import * as validators from '../experiments/card-receiver-lab/verified-receiver.mjs';
const workerSource=await readFile(new URL('../docs/card-receiver-lab/receiver-worker.mjs',import.meta.url),'utf8');
const codes={modules:workerSource.replace(/^import .*;\n/gm,''),esbuild:await readFile(new URL('../experiments/worker-bundle-lab/artifacts/worker-esbuild.mjs',import.meta.url),'utf8'),rolldown:await readFile(new URL('../experiments/worker-bundle-lab/artifacts/worker-rolldown.mjs',import.meta.url),'utf8')};
async function execute(kind,request){
 const messages=[];const context={self:{postMessage:(message,transfer)=>messages.push(structuredClone(message,{transfer:transfer||[]}))},performance,crypto:webcrypto,TextEncoder,TextDecoder,ArrayBuffer,Uint8Array,...validators};
 vm.runInNewContext('"use strict";\n'+codes[kind],context,{timeout:1000});await context.self.onmessage({data:structuredClone(request)});assert.equal(messages.length,1);const result=messages[0];
 if(result.ok){assert.ok(Number.isFinite(result.validation_ms)&&result.validation_ms>=0);const times=Object.values(result.phase);assert.ok(times.every(Number.isFinite));assert.deepEqual(times,[...times].sort((a,b)=>a-b));}
 return result;
}
function compare(actual,expected){
 for(const key of ['validation_ms','phase']){delete actual[key];delete expected[key];}
 if(actual.buffer||expected.buffer){assert.ok(actual.buffer&&expected.buffer);assert.ok(Buffer.from(actual.buffer).equals(Buffer.from(expected.buffer)));delete actual.buffer;delete expected.buffer;}
 assert.deepEqual(actual,expected);
}
test('both pinned bundles retain all fields and transferred bytes across complete valid workloads',async()=>{
 for(const [count,bytes] of [[1,64],[7,512],[32,8192],[200,65536]]){
  const prepared=await prepareDataset(count,bytes),before=JSON.stringify(prepared);
  for(const transport of ['clone','transfer','receipt']){
   const request={id:1,lane:'bounded',transport,prepared,count,bytes};const reference=await execute('modules',request);assert.equal(reference.ok,true);
   for(const kind of ['esbuild','rolldown'])compare(await execute(kind,request),structuredClone(reference));
  }
  assert.equal(JSON.stringify(prepared),before);
 }
});
test('both pinned bundles preserve validation and request failures rather than remove checks',async()=>{
 const good=await prepareDataset(2,512);
 for(const mutate of [x=>x.records[0].metadata=x.records[0].metadata.slice(0,-1)+'Z',x=>x.dataset.sha256='0'.repeat(64),x=>x.dataset.serialized_bytes++,x=>x.records[0].extra='undisplayed',x=>x.records[0].id='wrong']){
  const prepared=structuredClone(good);mutate(prepared);
  for(const transport of ['clone','transfer','receipt']){
   const request={id:1,lane:'bounded',transport,prepared,count:2,bytes:512};const reference=await execute('modules',request);assert.equal(reference.ok,false);
   for(const kind of ['esbuild','rolldown'])compare(await execute(kind,request),structuredClone(reference));
  }
 }
 for(const change of [{id:'1'},{transport:'unchecked'}]){
  const request={id:1,lane:'bounded',transport:'clone',prepared:good,count:2,bytes:512,...change};const reference=await execute('modules',request);assert.equal(reference.ok,false);
  for(const kind of ['esbuild','rolldown'])compare(await execute(kind,request),structuredClone(reference));
 }
});
test('compiler refuses an unrecognized input manifest before importing build tools',async()=>{
 const {spawnSync}=await import('node:child_process');const {fileURLToPath}=await import('node:url');
 const script=fileURLToPath(new URL('../experiments/worker-bundle-lab/tools/compile.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[script,'esbuild','unused-output.mjs','not-allowed.json'],{encoding:'utf8',timeout:5000});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Only fixed worker manifests are accepted/);
});
