import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

export async function checkNativeContinuityArtifactCopy({browser,origin}){
 const contexts=[],errors=[],unexpected=[];
 const start=async({measureStorage=false}={})=>{
  const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:true});
  contexts.push(context);
  if(measureStorage)await context.addInitScript(()=>{
   const observed={opens:0,writes:0};
   for(const [prototype,name,counter] of [[IDBFactory.prototype,'open','opens'],
    [Storage.prototype,'setItem','writes'],[Storage.prototype,'removeItem','writes'],[Storage.prototype,'clear','writes']]){
    const original=prototype[name];
    prototype[name]=function(...args){observed[counter]++;return original.apply(this,args);};
   }
   window.artifactVerificationStorageObserved=observed;
  });
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin&&['GET','HEAD'].includes(request.method()))return route.continue();
   unexpected.push([request.method(),url.origin,url.pathname]);return route.abort();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/#continuity');
  await page.locator('#main[data-workspace=continuity] .workspace-status')
   .filter({hasText:/^Athena project continuity workspace loaded\. Search above applies here\.$/}).waitFor();
  return page;
 };
 const scope=page=>page.locator('#main[data-workspace=continuity] .workspace-container #artifact-journal');
 try{
  const old=Buffer.from([0,255,10,13,0]),newer=Buffer.from([0,255,10,13,1]);
  const source=await start(),journal=scope(source);
  await journal.getByRole('button',{name:'Open local artifact journal',exact:true}).click();
  const retained=journal.getByRole('button',{name:'Retain selected file as a revision',exact:true});
  const choose=journal.getByLabel('Choose artifact file',{exact:true});
  // setInputFiles does not wait for a real user-accessible control. Observe
  // complete async IndexedDB admission before injecting the chosen file.
  const status=journal.locator('[data-artifact-status]');
  await status.filter({hasText:/^(Local journal opened\. Select a file and explicitly retain it\.|Local journal unavailable; no file retained\.)$/}).waitFor();
  assert.equal(await status.textContent(),'Local journal opened. Select a file and explicitly retain it.');
  await choose.waitFor({state:'visible'});
  const pick=buffer=>choose.setInputFiles({name:'synthetic-source.bin',mimeType:'application/octet-stream',buffer});
  const history=journal.locator('[data-artifact-history]');
  await pick(old);await retained.click();
  const first=history.locator('p').filter({hasText:/^Revision 1:/});
  await first.waitFor();
  const expected=(await first.textContent()).match(/SHA-256 ([a-f0-9]{64})/)[1];
  assert.equal(expected,createHash('sha256').update(old).digest('hex'));
  const target=journal.getByLabel('Artifact target',{exact:true});
  await target.selectOption({index:1});
  await pick(newer);await retained.click();
  const latest=history.locator('p').filter({hasText:/^Revision 2:/});
  await latest.waitFor();
  assert.doesNotMatch(await latest.textContent(),new RegExp(expected));
  const [download]=await Promise.all([source.waitForEvent('download'),first.getByRole('button',{name:'Download exact revision',exact:true}).click()]);
  const exact=fs.readFileSync(await download.path());
  assert.deepEqual(exact,old);
  assert.equal(createHash('sha256').update(exact).digest('hex'),expected);

  // A new browser context has no shared journal. Do not open any database;
  // compare the actual previously downloaded bytes after a filename change.
  const destination=await start({measureStorage:true}),local=scope(destination);
  const capture=()=>destination.evaluate(()=>({observed:{...window.artifactVerificationStorageObserved},local:{...localStorage},session:{...sessionStorage}}));
  const before=await capture();
  assert.deepEqual(before.observed,{opens:0,writes:0});
  const requests=[];destination.on('request',request=>requests.push(request.url()));
  const view=local.locator('[data-copy-verifier]');
  await view.getByText('Verify a copied artifact',{exact:true}).click();
  const expectedHash=view.getByLabel('Recorded SHA-256',{exact:true});
  const selected=view.getByLabel('Choose copied artifact',{exact:true});
  const verify=view.getByRole('button',{name:'Compare exact bytes',exact:true});
  const result=view.getByRole('status');
  await expectedHash.fill(expected.toUpperCase());
  await selected.setInputFiles({name:'moved-copy.bin',mimeType:'application/octet-stream',buffer:exact});
  assert.doesNotMatch(await result.textContent(),/^Bytes match/);
  await verify.click();
  await result.filter({hasText:/^Bytes match the recorded SHA-256\./}).waitFor();
  assert.match(await result.textContent(),/not identity or authenticity/);
  assert.equal(await local.getByRole('button',{name:'Open local artifact journal',exact:true}).isVisible(),true);
  await selected.setInputFiles({name:'moved-copy.bin',mimeType:'application/octet-stream',buffer:newer});
  await verify.click();
  await result.filter({hasText:/^Bytes do not match the recorded SHA-256\./}).waitFor();
  await view.getByRole('button',{name:'Clear verification',exact:true}).click();
  assert.equal(await expectedHash.inputValue(),'');
  assert.equal(await selected.evaluate(input=>input.files.length),0);
  assert.deepEqual(await capture(),before);
  assert.deepEqual(requests,[]);
  assert.deepEqual(unexpected,[]);
  assert.deepEqual(errors,[]);
 }finally{for(const context of contexts)await context.close();}
}
