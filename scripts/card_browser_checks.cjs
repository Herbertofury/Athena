'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
async function runCardBrowserChecks({page,report,check,out}){
 const root=page.locator('.workspace-container');
 async function captureViewport(theme){const viewport=root.locator('#viewport');await viewport.evaluate(el=>{el.scrollTop=0;});await viewport.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await viewport.screenshot({path:path.join(out,'native-cards-viewport-'+theme+'.png')});assert.equal(await root.locator('.card').count(),200);}
 async function open(){await page.locator('[data-nav="cards"]').click();await page.locator('.workspace-status').filter({hasText:'Athena card density lab workspace loaded.'}).waitFor();}
 await check('Native card lab retains complete generated output and exact downloadable worker-lane receipt',async()=>{
  await open();assert.equal(await root.locator('iframe').count(),0);assert.equal(await root.locator('.card').count(),0);
  await root.locator('#count').selectOption('200');await root.locator('#bytes').selectOption('512');await root.locator('#rounds').selectOption('3');await root.locator('#preparation').selectOption('worker');
  await root.locator('#run').click();await page.waitForFunction(()=>{const r=document.querySelector('.workspace-container')?.shadowRoot;return r?.getElementById('run').disabled===false&&r?.getElementById('output').textContent.length>0;},{},{timeout:60000});
  const text=await root.locator('#output').textContent(),receipt=JSON.parse(text);report.cardDensity={scope:'generated workload in native workspace; not target speedup',receipt};
  assert.equal(receipt.complete,true,JSON.stringify(receipt));assert.equal(receipt.samples.length,6);assert.ok(receipt.samples.every(x=>x.complete_output_equal&&x.dom_card_count===200));assert.equal(await root.locator('.card').count(),200);
  const downloadPromise=page.waitForEvent('download');await root.locator('#download').click();const download=await downloadPromise;const target=path.join(out,'native-card-receipt.json');await download.saveAs(target);assert.equal(fs.readFileSync(target,'utf8'),text);
  await page.locator('.topbar #search').fill('card-000000');assert.equal(await root.locator('.card').count(),200);assert.equal(await root.locator('#find').inputValue(),'card-000000');await root.locator('#inspect').click();const inspected=JSON.parse(await root.locator('#record-data').textContent());assert.equal(inspected.id,'card-000000');assert.equal(inspected.metadata.length,512);await root.locator('#close-record').click();
  await captureViewport('dark');await page.screenshot({path:path.join(out,'native-cards-dark.png'),fullPage:true});
  await page.locator('#theme').click();await page.waitForFunction(()=>document.querySelector('.workspace-container')?.dataset.theme==='light');await captureViewport('light');await page.screenshot({path:path.join(out,'native-cards-light.png'),fullPage:true});await page.locator('#theme').click();
 });
 await check('Native card evidence survives navigation and interrupted run cannot replace last-good receipt',async()=>{
  const before=report.cardDensity.receipt;await page.locator('[data-nav="home"]').click();await open();assert.deepEqual(JSON.parse(await root.locator('#output').textContent()),before);
  await root.locator('#run').click();await page.locator('[data-nav="home"]').click();await open();const partial=JSON.parse(await root.locator('#output').textContent());assert.equal(partial.complete,false);assert.match(partial.error,/navigation interrupted/);
  const pending=page.waitForEvent('download');await root.locator('#download-last-good').click();const download=await pending;const target=path.join(out,'native-card-last-good.json');await download.saveAs(target);assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),before);
 });
}
module.exports={runCardBrowserChecks};
