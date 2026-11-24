import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// One second, 10 frames per second, 32×24, entirely synthetic and silent:
// ffmpeg -v error -threads 1 -f lavfi -i 'testsrc2=s=32x24:r=10:d=1' -an -c:v libvpx
// -threads 1 -g 10 -auto-alt-ref 0 -fflags +bitexact -flags:v +bitexact fixture.webm
const syntheticWebm=Buffer.from(
 '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' +
 'u4+zgQC3iveBAfGCAWjwgQM=','base64');

export async function checkNativeFoundryVideoLoop({browser,origin}){
 assert.equal(syntheticWebm.length,1673);
 assert.equal(createHash('sha256').update(syntheticWebm).digest('hex'),'f7deee65a38fca5e0c421c4ef5613a2941d2041a9f03173400802d1f33b0f30f');
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000},reducedMotion:'reduce'});
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
  assert.equal((await page.goto(origin+'/#build'))?.status(),200);
  await page.locator('#main[data-workspace=build] .workspace-status').filter({hasText:'workspace loaded.'}).waitFor();
  const root=page.locator('#main[data-workspace=build] .foundry-workspace');
  const loop=root.getByRole('checkbox',{name:'Loop this video (session only)',exact:true});
  const chosen=root.locator('[data-local-video-file]');
  const play=root.locator('[data-local-video-play]');
  const route=root.locator('[data-local-video-route]');
  const preview=root.locator('[data-local-video-preview]');
  const close=root.locator('[data-local-video-close]');
  const video=root.locator('[data-local-video-view] video');
  const status=root.locator('[data-local-video-status]');
  const before=await page.evaluate(()=>Object.entries(localStorage).sort());
  assert.equal(await loop.isDisabled(),true);
  const file={name:'synthetic-vp8-loop.webm',mimeType:'video/webm',buffer:syntheticWebm};
  await chosen.setInputFiles(file);
  await play.waitFor({state:'visible'});
  await page.locator('[data-local-video-play]:not(:disabled)').waitFor();
  assert.deepEqual(await video.evaluate(v=>({paused:v.paused,loop:v.loop,autoplay:v.autoplay,
   duration:v.duration,width:v.videoWidth,height:v.videoHeight})),
   {paused:true,loop:false,autoplay:false,duration:1,width:32,height:24});
  assert.equal(await loop.isChecked(),false);
  await loop.check();
  assert.deepEqual(await video.evaluate(v=>[v.loop,v.paused,v.currentTime]),[true,true,0]);

  const player=await video.elementHandle();
  assert.ok(player);
  const selected=await root.locator('[data-inspect-object]').inputValue();
  assert.ok(selected,'native Foundry selected a concrete room object');
  await route.click();
  assert.deepEqual(await player.evaluate(v=>[v.closest('[data-local-video-surface]')!==null,
   v.closest('.foundry-object')?.dataset.id,v.loop,v.paused]),[true,selected,true,true]);
  assert.equal(await root.locator('video').count(),1);
  await preview.click();
  assert.equal(await player.evaluate(v=>v.closest('[data-local-video-view]')!==null&&v.loop&&v.paused),true);
  assert.equal(await root.locator('video').count(),1);

  // Observe presented frame timestamps, never assigning currentTime or
  // invoking play() from the test. A native timestamp wrap proves repeat,
  // instead of mistaking the loop property or a pending promise for playback.
  const observation=await player.evaluateHandle(video=>{
   const seen={last:null,wraps:0,ended:0,playing:0};
   const frame=(_now,{mediaTime})=>{
    if(seen.last!==null&&mediaTime<seen.last-.2)seen.wraps++;
    seen.last=mediaTime;
    if(!video.ended&&video.isConnected)video.requestVideoFrameCallback(frame);
   };
   video.requestVideoFrameCallback(frame);
   video.addEventListener('playing',event=>{if(event.isTrusted)seen.playing++;});
   video.addEventListener('ended',event=>{if(event.isTrusted)seen.ended++;});
   return seen;
  });
  await play.click();
  await video.scrollIntoViewIfNeeded();
  await page.waitForFunction(seen=>seen.wraps>=1&&seen.playing>=1,observation);
  assert.equal(await observation.evaluate(seen=>seen.ended),0);
  assert.deepEqual(await player.evaluate(v=>[v.loop,v.paused,v.ended]),[true,false,false]);

  await loop.uncheck();
  await status.and(root.locator('[data-state=ended]')).waitFor();
  await page.waitForFunction(seen=>seen.ended===1,observation);
  assert.deepEqual(await player.evaluate(v=>[v.loop,v.paused,v.ended]),[false,true,true]);
  assert.equal(await root.locator('video').count(),1);

  await chosen.setInputFiles({...file,name:'replacement-vp8.webm'});
  await page.locator('[data-local-video-play]:not(:disabled)').waitFor();
  assert.equal(await loop.isChecked(),false);
  assert.deepEqual(await video.evaluate(v=>[v.loop,v.paused]),[false,true]);
  assert.equal(await root.locator('video').count(),1);
  assert.equal(await player.evaluate(v=>v.isConnected||v.hasAttribute('src')),false);
  await close.click();
  assert.equal(await loop.isDisabled(),true);
  assert.equal(await root.locator('video').count(),0);
  assert.deepEqual(await page.evaluate(()=>Object.entries(localStorage).sort()),before);
  assert.deepEqual(unexpected,[]);
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
}
