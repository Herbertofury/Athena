/* Actual Chromium, synthetic local video only. No network providers or autoplay. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-video-routing');
let fixture=process.env.ATHENA_LOCAL_VIDEO_FIXTURE;
if(fixture&&!fs.statSync(fixture).isFile())throw Error('ATHENA_LOCAL_VIDEO_FIXTURE must identify an existing synthetic test video');
const report={kind:'actual Chromium synthetic local-file routing',fixtureSource:fixture?'operator synthetic fixture':'generated canvas pattern (no capture device)',checks:[],errors:[],outsideRequests:[],limitations:['Synthetic local video only; no real user media or providers','Does not establish all codecs, Windows acceptance or full original media parity']};
let browser,server,page;
async function check(name,fn){report.current=name;await fn();report.checks.push(name);}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();const data=fs.readFileSync(file),ext=path.extname(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'})[ext]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin&&u.protocol!=='blob:'){report.outsideRequests.push(u.href);return route.abort();}return route.continue();});
 if(!fixture){
  const generator=await context.newPage();
  try{const bytes=await generator.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;
   if(!MediaRecorder.isTypeSupported('video/webm;codecs=vp8'))throw Error('Synthetic VP8 recorder unavailable');
   const draw=canvas.getContext('2d'),stream=canvas.captureStream(15),chunks=[];
   const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});let timer,deadline;
   try{return await new Promise((resolve,reject)=>{let frame=0;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onerror=()=>reject(Error('Synthetic video recording failed'));
    recorder.onstop=async()=>{try{resolve(Array.from(new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer())))}catch(e){reject(e)}};
    deadline=setTimeout(()=>reject(Error('Synthetic recording deadline exceeded')),10000);
    recorder.start();timer=setInterval(()=>{draw.fillStyle=frame%2?'#204080':'#80c040';draw.fillRect(0,0,160,90);draw.fillStyle='#ffffff';draw.fillRect((frame*7)%140,20,20,50);if(++frame===30){clearInterval(timer);recorder.stop()}},80);
   });}finally{clearInterval(timer);clearTimeout(deadline);if(recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(t=>t.stop())}
  });if(!bytes.length||bytes.length>1024*1024)throw Error('Synthetic video exceeds bounds');fixture=path.join(out,'synthetic.webm');fs.writeFileSync(fixture,Buffer.from(bytes));}finally{await generator.close()}
 }
 report.fixtureSHA256=crypto.createHash('sha256').update(fs.readFileSync(fixture)).digest('hex');
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(origin+'/index.html#build');
 await page.locator('[data-local-video-file]').waitFor();
 await page.locator('.workspace-status').filter({hasText:/workspace loaded/}).waitFor();
 const one=s=>page.locator(s);
 await check('file selection metadata is real, no autoplay or persistence',async()=>{
  await one('[data-local-video-file]').setInputFiles(fixture);
  await one('video').evaluate(v=>v.readyState>=1?Promise.resolve():new Promise((resolve,reject)=>{v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',()=>reject(Error('Synthetic codec failed')),{once:true});}));
  report.beforeRouting=await one('video').evaluate(v=>({paused:v.paused,currentTime:v.currentTime,width:v.videoWidth,height:v.videoHeight,autoplay:v.autoplay}));
  assert.equal(report.beforeRouting.paused,true);assert.equal(report.beforeRouting.currentTime,0);assert.equal(report.beforeRouting.autoplay,false);assert.ok(report.beforeRouting.width>0);
 });
 await check('routed player has visible box above artwork and label remains visible',async()=>{
  await one('[data-local-video-route]').click();
  await one('.foundry-scene').scrollIntoViewIfNeeded();
  report.render=await one('[data-local-video-surface]').evaluate(layer=>{const form=layer.parentElement,object=form.closest('.foundry-object'),label=object.querySelector('.foundry-object-label'),v=layer.querySelector('video'),rect=v.getBoundingClientRect();return {videoCount:object.getRootNode().querySelectorAll('video').length,videoBox:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},display:getComputedStyle(v).display,visibility:getComputedStyle(v).visibility,layerZ:getComputedStyle(layer).zIndex,pseudoVisibility:getComputedStyle(form,'::before').visibility,labelVisibility:getComputedStyle(label).visibility,labelText:label.textContent,pointerEvents:getComputedStyle(layer).pointerEvents,controls:v.controls,paused:v.paused,objectId:object.dataset.id};});
  assert.equal(report.render.videoCount,1);assert.ok(report.render.videoBox.width>0&&report.render.videoBox.height>0);assert.equal(report.render.visibility,'visible');assert.notEqual(report.render.display,'none');assert.equal(report.render.layerZ,'2');assert.equal(report.render.pseudoVisibility,'hidden');assert.equal(report.render.labelVisibility,'visible');assert.equal(report.render.pointerEvents,'none');assert.equal(report.render.controls,false);assert.equal(report.render.paused,true);
  await one('.foundry-scene').screenshot({path:path.join(out,'routed-scene.png')});
 });
 await check('failed replacement setup preserves decoded routed player and controls',async()=>{
  const prior=await one('video').evaluate(v=>({src:v.src,time:v.currentTime,paused:v.paused}));
  await page.evaluate(()=>{const load=HTMLMediaElement.prototype.load;HTMLMediaElement.prototype.load=function(){HTMLMediaElement.prototype.load=load;throw Error('synthetic replacement setup fault');};});
  await one('[data-local-video-file]').setInputFiles(fixture);
  await one('[data-local-video-status]').filter({hasText:'Previous video retained.'}).waitFor();
  assert.equal(await one('video').count(),1);assert.equal(await one('[data-local-video-surface] video').count(),1);
  const retained=await one('video').evaluate(v=>({src:v.src,time:v.currentTime,paused:v.paused}));assert.deepEqual(retained,prior);
  assert.equal(await one('[data-local-video-play]').isEnabled(),true);
 });
 await check('explicit Play yields trusted playing; filtering pauses same player with no retarget',async()=>{
  await one('[data-local-video-play]').click();await one('[data-local-video-status][data-state=playing]').waitFor();
  assert.equal(await one('video').evaluate(v=>v.paused),false);
  await one('.topbar #search').fill('absent-video-routing-target');
  await one('[data-local-video-route-status]').filter({hasText:'unavailable'}).waitFor();assert.equal(await one('[data-local-video-surface]').count(),0);assert.equal(await one('video').evaluate(v=>v.paused),true);
  await one('.topbar #search').fill('');await one('[data-local-video-surface]').waitFor();assert.equal(await one('video').evaluate(v=>v.paused),true);assert.equal(await one('[data-local-video-surface]').evaluate(l=>l.closest('.foundry-object').dataset.id),report.render.objectId);
 });
 await check('return to preview and close restore artwork and remove player',async()=>{
  await one('[data-local-video-preview]').click();assert.equal(await one('[data-local-video-surface]').count(),0);assert.equal(await one('[data-local-video-view] video').count(),1);
  await one('.foundry-scene').scrollIntoViewIfNeeded();const restored=await one('.foundry-object').first().evaluate(o=>getComputedStyle(o.querySelector('.foundry-object-form'),'::before').visibility);assert.equal(restored,'visible');
  await one('[data-local-video-route]').click();await one('[data-local-video-close]').click();assert.equal(await one('video').count(),0);assert.equal(await one('[data-local-video-surface]').count(),0);
  const stored=await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1')||'');assert.ok(!stored.includes('blob:'));assert.ok(!stored.includes(path.basename(fixture)));
 });
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
