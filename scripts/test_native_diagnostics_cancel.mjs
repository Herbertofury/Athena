import assert from 'node:assert/strict';

export async function checkNativeDiagnosticsCancellation({browser,origin}){
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
  assert.equal((await page.goto(origin+'/#diagnostics'))?.status(),200);
  await page.locator('#main[data-workspace=diagnostics] .workspace-status')
   .filter({hasText:'Athena media diagnostics workspace loaded.'}).waitFor();
  const root=page.locator('#main[data-workspace=diagnostics] .workspace-container');
  const run=root.getByRole('button',{name:'Run 7 comparison rounds',exact:true});
  const cancel=root.getByRole('button',{name:'Cancel comparison',exact:true});
  const exportResult=root.getByRole('button',{name:'Export comparison',exact:true});
  const status=root.locator('#status');
  const results=root.locator('#results');
  const workspace=await root.elementHandle();
  assert.ok(workspace);
  assert.equal(await cancel.isDisabled(),true);
  assert.equal(await exportResult.isDisabled(),true);
  assert.equal(await results.textContent(),'');
  const before=await page.evaluate(()=>Object.entries(localStorage).sort());

  // Observe real progress from the packaged benchmark. No fake clock,
  // synthetic comparison result, forced click, injected rAF or provider.
  await run.click();
  await status.filter({hasText:/Round 1\/7: (?:append|blocked)|Round [2-7]\/7:/}).waitFor();
  await cancel.click();
  await status.filter({hasText:'Comparison cancelled. Completed samples retained; no winner declared.'}).waitFor();
  await root.locator('#run:not(:disabled)').waitFor();
  assert.equal(await cancel.isDisabled(),true);
  assert.equal(await exportResult.isEnabled(),true);
  assert.equal(await root.locator('#workload').textContent(),'');
  const partial=JSON.parse(await results.textContent());
  assert.equal(partial.complete,false);
  assert.equal(partial.outcome,'cancelled');
  assert.match(partial.error,/no winner declared/);
  assert.ok(partial.samples.length>=1&&partial.samples.length<21);
  assert.equal(partial.samples[0].strategy,'full_history');
  assert.ok(partial.samples.every(sample=>sample.complete_output_equal&&sample.scroll_frame_wait_ms.length===8));
  assert.ok(Number.isFinite(Date.parse(partial.finished_at)));
  const [download]=await Promise.all([page.waitForEvent('download'),exportResult.click()]);
  assert.equal(download.suggestedFilename(),'atlas-event-log-render.json');
  const stream=await download.createReadStream();
  assert.ok(stream);
  const chunks=[];
  let size=0;
  for await(const chunk of stream){
   size+=chunk.length;
   assert.ok(size<=262144,'diagnostic export exceeded the expected bound');
   chunks.push(chunk);
  }
  assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString('utf8')),partial);

  await run.click();
  await status.filter({hasText:'All 21 complete-output comparisons passed.'}).waitFor({timeout:60000});
  const finished=JSON.parse(await results.textContent());
  assert.equal(finished.complete,true);
  assert.equal(finished.outcome,undefined);
  assert.equal(finished.error,undefined);
  assert.equal(finished.samples.length,21);
  assert.ok(finished.samples.every(sample=>sample.complete_output_equal));
  assert.equal(await workspace.evaluate(node=>node===document.querySelector('#main .workspace-container')),true);
  assert.equal(await cancel.isDisabled(),true);
  assert.deepEqual(await page.evaluate(()=>Object.entries(localStorage).sort()),before);
  assert.deepEqual(unexpected,[]);
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
}
