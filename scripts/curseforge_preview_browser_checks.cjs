/* Native-browser acceptance helper. Only an already verified loopback Lab; no provider traffic. */
const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function curseforgePreviewChecks({page,check,expected,out}){
 const requests=[];const observe=req=>requests.push({url:req.url(),method:req.method()});page.on('request',observe);
 try{
  await check('CurseForge synthetic preview stays disabled and does not submit or fetch provider data',async()=>{
   await page.locator('.workspace-container [data-panel="collectors"]').click();
   const card=page.locator('.workspace-container #curseforge-offline-card');await card.waitFor({state:'visible'});
   assert.match(await card.textContent(),/no approved CurseForge credential configuration or transport/);
   assert.equal(await card.locator('input,textarea,form,iframe,img,a').count(),0);
   const live=card.locator('#curseforge-live-collect'),toggle=card.locator('#curseforge-preview-toggle'),pre=card.locator('#curseforge-preview-json');
   assert.equal(await live.isDisabled(),true);assert.equal(await pre.isVisible(),false);
   await toggle.focus();await page.keyboard.press('Enter');await pre.waitFor({state:'visible'});
   assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.deepEqual(JSON.parse(await pre.textContent()),expected);
   assert.equal(await pre.locator('*').count(),0);assert.equal(expected.liveAcceptance,false);assert.equal(expected.access.state,'missing_key');
   // This is a synthetic test of an accidentally re-enabled control, never an API grant.
   await live.evaluate(el=>{el.disabled=false;});try{await live.click();}finally{await live.evaluate(el=>{el.disabled=true;});}
   assert.equal(requests.filter(r=>r.method!=='GET').length,0);
   assert.ok(requests.every(r=>new URL(r.url).origin==='http://127.0.0.1:41379'));
   await page.screenshot({path:path.join(out,'curseforge-preview-desktop.png'),fullPage:true});
   const previous=page.viewportSize();await page.setViewportSize({width:390,height:844});
   try{assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));await page.screenshot({path:path.join(out,'curseforge-preview-mobile.png'),fullPage:true});}finally{if(previous)await page.setViewportSize(previous);}
   await toggle.click();await pre.waitFor({state:'hidden'});assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  });
 }finally{page.off('request',observe);}
};
