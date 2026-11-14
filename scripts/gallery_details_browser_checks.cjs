const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
async function runGalleryDetailsBrowserChecks({page,root,report,check}){
 await check('Gallery source details are keyboard-readable without loading provider media',async()=>{
  await page.evaluate(()=>{location.hash='#media?q=';});
  await page.waitForFunction(()=>document.querySelector('#main')?.dataset.workspace==='media'&&document.querySelector('.workspace-container')?.shadowRoot?.querySelectorAll('.gallery-details').length>0&&document.querySelector('#search').value==='');
  const fixture=JSON.parse(fs.readFileSync(path.join(root,'workspaces/engineering/media/public-fixtures.json'))),card=fixture.cards.find(x=>x.provider==='Modrinth');
  const details=page.locator('.workspace-container article.card[data-card-id="'+card.id+'"] .gallery-details');assert.equal(await details.count(),card.gallery.length);
  const summary=details.first().locator('summary');await summary.focus();await page.keyboard.press('Enter');assert.equal(await details.first().getAttribute('open'),'');
  const first=details.first();assert.equal(await first.locator('.gallery-description').textContent(),card.gallery[0].description);assert.equal(await first.locator('[data-metadata="ordering"]').textContent(),String(card.gallery[0].ordering));assert.match(await first.locator('.gallery-access').textContent(),/Metadata only/);
  await page.keyboard.press('Enter');assert.equal(await first.getAttribute('open'),null);
  await page.setViewportSize({width:390,height:844});await summary.focus();await page.keyboard.press('Enter');
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));assert.ok(width.scroll<=width.client+1,JSON.stringify(width));
  assert.equal(await page.locator('.workspace-container img[src],.workspace-container iframe,.workspace-container video,.workspace-container audio').count(),0);
  await page.setViewportSize({width:1440,height:1000});report.gallerySourceDetails={count:card.gallery.length,keyboardToggle:true,exactStoredDescription:true,mobileWidth:width,loadedProviderMedia:0,scope:'Retained metadata only; no fresh provider request or image decode'};
 });
}
module.exports={runGalleryDetailsBrowserChecks};
