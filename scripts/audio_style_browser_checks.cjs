'use strict';
const assert=require('node:assert/strict');
exports.runAudioStyleBrowserChecks=async({browser,origin,check,report})=>{
 await check('Audio readiness waits for CSS and survives failure and navigation cancellation',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+'/#home');
   let release,seen;const gate=new Promise(r=>release=r),requested=new Promise(r=>seen=r);
   const held=async route=>{seen();await gate;await route.continue();};await page.route('**/audio/style.css',held);
   await page.evaluate(()=>{location.hash='#audio';});await requested;
   assert.match(await page.locator('.workspace-status').textContent(),/Opening/);
   assert.equal(await page.locator('.workspace-container #load').isDisabled(),true);
   release();await page.locator('.workspace-status').filter({hasText:'workspace loaded.'}).waitFor();
   const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,sheet:!!document.querySelector('.workspace-container').shadowRoot.querySelector('link').sheet}));
   assert.equal(sizes.sheet,true);assert.ok(sizes.scroll<=sizes.client+1,JSON.stringify(sizes));await page.unroute('**/audio/style.css',held);
   await page.evaluate(()=>{location.hash='#home';});await page.waitForFunction(()=>document.querySelector('#main').dataset.workspace==='learning');
   let releaseLate,seenLate,finishedLate;const lateDone=new Promise(r=>finishedLate=r);const lateGate=new Promise(r=>releaseLate=r),lateRequest=new Promise(r=>seenLate=r);
   const late=async route=>{seenLate();await lateGate;try{await route.continue();}catch(error){if(!/Route is already handled/.test(error.message))throw error;}finally{finishedLate();}};await page.route('**/audio/style.css',late);
   await page.evaluate(()=>{location.hash='#audio';});await lateRequest;await page.evaluate(()=>{location.hash='#home';});await page.waitForFunction(()=>document.querySelector('#main').dataset.workspace==='learning');releaseLate();await lateDone;await page.unroute('**/audio/style.css',late);
   const broken=route=>route.abort('failed');await page.route('**/audio/style.css',broken);await page.evaluate(()=>{location.hash='#audio';});await page.locator('.workspace-status').filter({hasText:'Audio stylesheet failed'}).waitFor();assert.equal(await page.locator('.workspace-container #load').count(),0);await page.unroute('**/audio/style.css',broken);
   await page.evaluate(()=>{location.hash='#home';});await page.waitForFunction(()=>document.querySelector('#main').dataset.workspace==='learning');await page.evaluate(()=>{location.hash='#audio';});await page.locator('.workspace-status').filter({hasText:'workspace loaded.'}).waitFor();assert.equal(await page.locator('.workspace-container #load').isEnabled(),true);assert.deepEqual(errors,[]);
   report.audioStyleReadiness={pendingNotReady:true,failedNotReady:true,navigationCancels:true,reopenRecovers:true,sizes,scope:'CSS lifecycle only; no media loading/playback'};
  }finally{await context.close();}
 });
};
