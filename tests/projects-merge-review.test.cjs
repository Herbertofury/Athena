'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const runtime=process.env.ATHENA_BACKUP_TEST_RUNTIME||path.resolve(__dirname,'../dist');
const projects=()=>import(pathToFileURL(path.join(runtime,'workspaces/projects/import.mjs')).href);

test('large Projects metadata is preserved with one full clone for new and identical values',async t=>{
 const {mergeBackup}=await projects();
 const original=global.structuredClone;
 let full=0;
 const size=150000;
 t.after(()=>{global.structuredClone=original;});
 global.structuredClone=(value,...rest)=>{
  if(value?.external?.length===size||Array.isArray(value)&&value.length===size)full++;
  return original(value,...rest);
 };
 const incoming={schema:1,entries:[],external:Array.from({length:size},(_,i)=>i%3)};
 let result=mergeBackup({schema:1,entries:[]},incoming);
 assert.equal(full,1);
 assert.deepEqual(result.data.external,incoming.external);
 assert.notEqual(result.data.external,incoming.external);
 full=0;
 const current=original(incoming);
 result=mergeBackup(current,incoming);
 assert.equal(full,1);
 assert.deepEqual(result.data,current);
 assert.notEqual(result.data.external,current.external);
 assert.notEqual(result.data.external,incoming.external);
});

test('Projects still checks unordered nested keys, conflicts, and non-aliasing',async()=>{
 const {mergeBackup}=await projects();
 const current={schema:1,entries:[],vendor:[{a:1,b:2}]};
 const same={schema:1,entries:[],vendor:[{b:2,a:1}],fresh:{nested:[2]}};
 const a=mergeBackup(current,same);
 assert.deepEqual(a.data,{...current,fresh:same.fresh});
 a.data.fresh.nested[0]=200;
 assert.equal(same.fresh.nested[0],2);
 assert.deepEqual(current.vendor,[{a:1,b:2}]);
 assert.throws(()=>mergeBackup(current,{...same,vendor:[{b:3,a:1}]}),/metadata conflicts/);
 assert.throws(()=>mergeBackup({...current,vendor:[1,2]},{...same,vendor:[1,3]}),/metadata conflicts/);
});

test('mounted Projects reviews 1.5 million values without saving, then keeps exactly those values after confirmation', {
 skip:process.env.ATHENA_TEST_REAL_BACKUP_WORKER!=='1', timeout:60000,
},async()=>{
 const http=require('node:http'),{readFile}=require('node:fs/promises'),{chromium}=require('playwright');
 const files=new Set([
  'shared/portable-backup-admission.mjs','shared/portable-backup-job.mjs','shared/portable-backup-worker.mjs',
  ...['index','model','import','compare'].map(n=>'workspaces/projects/'+n+'.mjs'),
  'workspaces/projects/style.css',
 ]);
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><div id="mount"></div>');}
  const k=req.url.slice(1);
  if(!files.has(k)){res.statusCode=404;return res.end();}
  try{
   res.setHeader('Content-Type',k.endsWith('.css')?'text/css':'text/javascript');
   res.end(await readFile(path.join(runtime,k)));
  }catch{res.statusCode=500;res.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();let workers=0;
  page.on('worker',w=>{if(w.url().endsWith('/shared/portable-backup-worker.mjs'))workers++;});
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.evaluate(async()=>{
   const {mount}=await import('/workspaces/projects/index.mjs');
   window.operations={writes:0};
   mount({container:document.getElementById('mount'),state:{schema:1,entries:[]},setState(data,options){
    const values=data.external;
    window.operations={writes:window.operations.writes+1, count:values.length,
     allExact:values.every((v,i)=>v===i%3),reviewed:JSON.parse(options.reviewedProjectBackup).entries.length===0};
    return true;
   }});
  });
  const bytes=Buffer.from('{"schema":1,"entries":[],"external":['+'0,1,2,'.repeat(499999)+'0,1,2]}');
  const review=page.locator('#backup-review'),confirm=page.locator('#backup-confirm');
  const started=Date.now();
  await page.locator('input#import').setInputFiles({name:'large-synthetic.json',mimeType:'application/json',buffer:bytes});
  await review.waitFor({state:'visible',timeout:20000});
  const elapsed=Date.now()-started;
  assert.ok(workers>=1);
  assert.equal(await page.evaluate(()=>window.operations.writes),0);
  assert.equal(await page.evaluate(()=>document.getElementById('mount').shadowRoot.activeElement.id),'backup-confirm');
  await confirm.click();
  assert.deepEqual(await page.evaluate(()=>window.operations),{writes:1,count:1500000,allExact:true,reviewed:true});
  await page.locator('input#import').setInputFiles({name:'same-synthetic.json',mimeType:'application/json',buffer:bytes});
  await page.getByText('This backup adds nothing. Nothing was saved.').waitFor({timeout:20000});
  assert.equal(await review.isVisible(),false);
  assert.equal(await page.evaluate(()=>window.operations.writes),1);
  console.log('Mounted synthetic selected-file to review elapsed (ms, not a UI-block claim): '+elapsed);
 }finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
