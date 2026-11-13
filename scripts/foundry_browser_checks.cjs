const assert=require('node:assert/strict');const path=require('node:path');
exports.runFoundryBrowserChecks=async({page,report,check,out})=>{
 await check('Native Foundry authoring preserves room placements across navigation and reload',async()=>{
  await page.locator('[data-nav="build"]').click();await page.locator('.foundry-scene').waitFor();assert.equal(await page.locator('.foundry-workspace iframe').count(),0);assert.equal(await page.locator('[data-theme-select] option').count(),17);assert.equal(await page.locator('.foundry-object').count(),5);
  const object=page.locator('.foundry-object').first(),id=await object.getAttribute('data-id');await object.focus();await object.press('ArrowRight');await object.press('p');assert.equal(await object.getAttribute('aria-pressed'),'true');const left=await object.evaluate(e=>e.style.left);
  await page.locator('[data-nav="research"]').click();await page.locator('[data-nav="build"]').click();await page.locator('.foundry-scene').waitFor();assert.equal(await page.locator(`[data-id="${id}"]`).evaluate(e=>e.style.left),left);assert.equal(await page.locator(`[data-id="${id}"]`).getAttribute('aria-pressed'),'true');
  await page.reload();await page.locator('.foundry-scene').waitFor();assert.equal(await page.locator(`[data-id="${id}"]`).evaluate(e=>e.style.left),left);
  await page.locator('[data-theme-select]').selectOption('vaporwave');assert.equal(await page.locator('.foundry-object').count(),5);await page.locator('[data-room-select]').selectOption({index:1});const room=await page.locator('[data-room-select]').inputValue();assert.match(room,/vaporwave/);
  const downloadPromise=page.waitForEvent('download');await page.locator('[data-export]').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'athena-room-layout.json');
  await page.locator('[data-import]').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{bad')});await page.locator('.foundry-status').filter({hasText:'Import not applied'}).waitFor();assert.equal(await page.locator('[data-room-select]').inputValue(),room);
  for(const light of [false,true]){if((await page.locator('body').getAttribute('class')||'').includes('light')!==light)await page.locator('#theme').click();await page.screenshot({path:path.join(out,`foundry-${light?'light':'dark'}.png`),fullPage:true});}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'foundry-mobile.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.setViewportSize({width:1440,height:1000});
 });
};
