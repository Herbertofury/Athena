'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {Worker:Thread}=require('node:worker_threads');
const runtime=process.env.ATHENA_BACKUP_TEST_RUNTIME||path.resolve(__dirname,'../dist');
const href=part=>pathToFileURL(path.join(runtime,part)).href;
const reader=()=>import(href('shared/portable-backup-job.mjs'));
const padding=' '.repeat(256*1024);
const sample=()=>new Blob([padding,'{"schema":1,"entries":[],"extra":[1,2,3,"retain"]}']);

test('actual one-shot worker decodes each independent workspace and is terminated',async t=>{
 const previous=global.Worker, running=[];
 t.after(()=>{global.Worker=previous;});
 global.Worker=class {
  constructor(url,options) {
   assert.equal(options.type,'module');
   const code=`
    import {parentPort,workerData} from 'node:worker_threads';
    globalThis.self={postMessage:v=>parentPort.postMessage(v)};
    await import(workerData);
    parentPort.on('message',data=>self.onmessage?.({data}));
   `;
   this.native=new Thread(code,{eval:true,workerData:url.href});
   this.termination=null;
   this.native.on('message',data=>this.onmessage?.({data}));
   this.native.on('error',error=>this.onerror?.({error}));
   running.push(this);
  }
  postMessage(data) { this.native.postMessage(data); }
  terminate() { this.termination=this.native.terminate(); }
 };
 const {createPortableBackupReader}=await reader();
 for(const [kind,schema] of [['projects',1],['continuity',2]]){
  const worker=createPortableBackupReader(kind,()=>assert.fail('unexpected local fallback'));
  const result=await worker.read(sample());
  assert.deepEqual(result,{schema,entries:[],extra:[1,2,3,'retain']});
  assert.ok(running.at(-1).termination);
  await running.at(-1).termination;
  await assert.rejects(worker.read(new Blob([padding,'{"schema":1,"entries":[],"x":1,"x":2}'])),/Duplicate backup property/);
  await running.at(-1).termination;
 }
 assert.equal(running.length,4);
});

test('superseded and canceled work terminates without applying late replies',async t=>{
 const previous=global.Worker, workers=[];
 t.after(()=>{global.Worker=previous;});
 global.Worker=class {
  constructor(){this.terminated=false;workers.push(this);}
  postMessage(){}
  terminate(){this.terminated=true;}
 };
 const {createPortableBackupReader}=await reader();
 const r=createPortableBackupReader('projects',()=>assert.fail('not local'));
 const first=r.read(sample());
 const refused=assert.rejects(first,{name:'AbortError'});
 const second=r.read(sample());
 await refused;assert.equal(workers[0].terminated,true);
 workers[0].onmessage({data:{ok:true,value:'stale'}});
 workers[1].onmessage({data:{ok:true,value:'current'}});
 assert.equal(await second,'current');
 assert.equal(workers[1].terminated,true);
 const third=r.read(sample());
 const canceled=assert.rejects(third,{name:'AbortError'});
 r.cancel();await canceled;assert.equal(workers[2].terminated,true);
});

test('unsupported workers retain local fallback, and stop a read before its parser',async t=>{
 const previous=global.Worker;t.after(()=>{global.Worker=previous;});
 global.Worker=undefined;
 const {createPortableBackupReader}=await reader();
 const {parseBackup}=await import(href('workspaces/projects/import.mjs'));
 let calls=0,release;
 const r=createPortableBackupReader('projects',bytes=>{calls++;return parseBackup(bytes);});
 assert.equal((await r.read(sample())).schema,1);
 assert.equal((await r.read(new Blob(['{"schema":1,"entries":[]}']))).schema,1);
 const older=r.read({arrayBuffer:()=>new Promise(resolve=>{release=resolve;})});
 const canceled=assert.rejects(older,{name:'AbortError'});
 r.cancel();release(await sample().arrayBuffer());await canceled;
 assert.equal(calls,2);
});

// In CI, exercise the exact unpacked module through a real Chromium Worker.
test('Chromium uses the packaged worker, not the fallback parser', {
 skip:process.env.ATHENA_TEST_REAL_BACKUP_WORKER!=='1',
},async()=>{
 const http=require('node:http');
 const {readFile}=require('node:fs/promises');
 const {chromium}=require('playwright');
 const routes=new Set([
  'shared/portable-backup-job.mjs','shared/portable-backup-worker.mjs',
  'shared/portable-backup-admission.mjs',
  'workspaces/projects/import.mjs','workspaces/projects/model.mjs',
  'workspaces/continuity/import.mjs','workspaces/continuity/model.mjs',
 ]);
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/'){
   res.setHeader('Content-Type','text/html; charset=UTF-8');
   return res.end('<!doctype html><title>Isolated local backup fixture</title>');
  }
  const file=req.url.slice(1);
  if(!routes.has(file)){res.statusCode=404;return res.end();}
  try{
   res.setHeader('Content-Type','text/javascript; charset=UTF-8');
   res.end(await readFile(path.join(runtime,file)));
  }catch{res.statusCode=500;res.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const started=[];
  page.on('worker',w=>started.push(w.url()));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  const results=await page.evaluate(async()=>{
   const {createPortableBackupReader}=await import('/shared/portable-backup-job.mjs');
   const noFallback=()=>{throw Error('Unexpected local fallback');};
   const sample=new Blob([' '.repeat(256*1024),'{"schema":1,"entries":[],"vendor":{"note":"original","rows":[1,2,3]}}']);
   const r=createPortableBackupReader('projects',noFallback);
   const waiting=r.read(sample);
   r.cancel();
   const aborted=await waiting.then(()=>false,e=>e.name==='AbortError');
   const p=await r.read(sample);
   const c=await createPortableBackupReader('continuity',noFallback).read(sample);
   return {aborted,p,c};
  });
  const vendor={note:'original',rows:[1,2,3]};
  assert.deepEqual(results,{aborted:true,p:{schema:1,entries:[],vendor},c:{schema:2,entries:[],vendor}});
  assert.ok(started.filter(url=>url.endsWith('/shared/portable-backup-worker.mjs')).length>=2);
 }finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
