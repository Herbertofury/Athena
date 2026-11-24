import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export async function checkNativeReceiverFileReview({browser,origin}){
 const context=await browser.newContext({acceptDownloads:true,serviceWorkers:'block',viewport:{width:1440,height:1000}});
 const unexpected=[],errors=[];
 try{
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin&&['GET','HEAD'].includes(request.method()))return route.continue();
   unexpected.push([request.method(),url.origin,url.pathname]);return route.abort();
  });
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.bringToFront();
  assert.equal((await page.goto(origin+'/#receiver'))?.status(),200);
  const ready=()=>page.locator('#main[data-workspace=receiver] .workspace-status')
   .filter({hasText:'Athena complete receiver lab workspace loaded.'}).waitFor();
  await ready();
  const root=page.locator('#main[data-workspace=receiver] .workspace-container');
  const before=await page.evaluate(()=>Object.entries(localStorage).sort());
  await root.locator('#execution').selectOption('main');
  await root.locator('#bytes').selectOption('8192');
  await root.locator('#run').click();
  await root.locator('#last:not(:disabled)').waitFor({timeout:100000});
  const live=JSON.parse(await root.locator('#output').textContent());
  assert.equal(live.complete,true);
  assert.equal(live.samples.length,6);
  assert.equal(live.execution,'main');
  assert.ok(live.samples.every(sample=>sample.complete_parity));

  const [download]=await Promise.all([page.waitForEvent('download'),root.locator('#last').click()]);
  assert.equal(download.suggestedFilename(),'receiver-last-good.json');
  const stream=await download.createReadStream();
  assert.ok(stream);
  const chunks=[];
  let total=0;
  for await(const chunk of stream){
   total+=chunk.length;
   assert.ok(total<=262144);
   chunks.push(chunk);
  }
  const exactFile=Buffer.concat(chunks);
  assert.deepEqual(JSON.parse(exactFile.toString('utf8')),live);
  const sha=createHash('sha256').update(exactFile).digest('hex');

  // Reload really loses the in-memory working receipt. The app opens only
  // the same browser-downloaded bytes chosen through the normal file input.
  assert.equal((await page.reload())?.status(),200);
  await ready();
  assert.equal(await root.locator('#output').textContent(),'');
  assert.equal(await root.locator('#last').isDisabled(),true);
  const chooser=root.getByLabel('Choose downloaded receipt',{exact:true});
  const status=root.locator('#receipt-file-status');
  const view=root.locator('#receipt-file-output');
  assert.equal(await view.isVisible(),false);
  await chooser.setInputFiles({name:download.suggestedFilename(),mimeType:'application/json',buffer:exactFile});
  await status.filter({hasText:'Showing an unverified local file. Current and last-good receipts were not changed.'}).waitFor();
  await view.waitFor();
  assert.equal(await view.locator('[data-receiver-file-digest]').textContent(),sha);
  assert.match(await view.textContent(),/Unverified file evidence/);
  assert.deepEqual(await view.locator('tbody tr').evaluateAll(rows=>rows.map(row=>[...row.children].map(cell=>cell.textContent))),
   live.samples.map(sample=>[String(sample.round+1),sample.lane,String(sample.request_ms)]));
  assert.equal(await root.locator('#output').textContent(),'');
  assert.equal(await root.locator('#last').isDisabled(),true);
  assert.equal(await root.locator('#save-receipt').isDisabled(),true);
  assert.deepEqual(await page.evaluate(()=>Object.entries(localStorage).sort()),before);

  await chooser.setInputFiles({name:'wrong.pdf',mimeType:'application/pdf',buffer:exactFile});
  await status.filter({hasText:'Previous file review retained.'}).waitFor();
  assert.equal(await view.locator('[data-receiver-file-digest]').textContent(),sha);
  await root.getByRole('button',{name:'Clear file review',exact:true}).click();
  assert.equal(await view.isVisible(),false);
  assert.equal(await view.textContent(),'');
  assert.equal(await root.locator('#output').textContent(),'');
  assert.deepEqual(await page.evaluate(()=>Object.entries(localStorage).sort()),before);
  assert.deepEqual(unexpected,[]);
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
}
