/* Actual Chromium, synthetic semantic room metadata only; no source/user files. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-blends');
const report={kind:'actual Chromium authored blend modes',checks:[],errors:[],outsideRequests:[],limitations:['Synthetic flat colors validate compositing arithmetic, not original artwork/backdrop equivalence']};
let browser,server,page;
async function check(name,fn){report.current=name;await fn();report.checks.push(name);}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();const data=fs.readFileSync(file),ext=path.extname(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'})[ext]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin&&u.protocol!=='blob:'){report.outsideRequests.push(u.href);return route.abort();}return route.continue();});
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(origin+'/index.html#build');
 await page.locator('[data-inspect-blend]').waitFor();
 await page.locator('.workspace-status').filter({hasText:/workspace loaded/}).waitFor();
 const one=s=>page.locator(s);

 const select=async id=>one('[data-inspect-object]').selectOption(id);
 const ids=await one('[data-inspect-object] option').evaluateAll(os=>os.map(o=>o.value));
 for(const id of ids.slice(0,2)){await select(id);await one('[data-inspect-x]').fill('50');await one('[data-inspect-y]').fill('50');await one('[data-inspect-apply]').click();}
 await select(ids[0]);await one('[data-instance-front]').click();await one('[data-inspect-blend]').selectOption('normal');await one('[data-blend-apply]').click();
 await page.addStyleTag({content:`.foundry-object{border:0!important;box-shadow:none!important;border-radius:0!important;background:rgb(100,200,150)!important}.foundry-object[data-id="${ids[0]}"]{background:rgb(200,100,50)!important}.foundry-object>*{visibility:hidden!important}`});
 
 const pixel=async()=>{const box=await page.locator('.foundry-object').evaluateAll((os,id)=>{const r=os.find(o=>o.dataset.id===id).getBoundingClientRect();return{x:Math.floor(r.x+r.width/2),y:Math.floor(r.y+r.height/2),width:1,height:1}},ids[0]);const png=await page.screenshot({clip:box});let i=8,parts=[];while(i<png.length){const n=png.readUInt32BE(i),type=png.toString('ascii',i+4,i+8);if(type==='IDAT')parts.push(png.subarray(i+8,i+8+n));i+=n+12;}const raw=require('node:zlib').inflateSync(Buffer.concat(parts));return [...raw.subarray(1,4)];};
 await one('.foundry-scene').scrollIntoViewIfNeeded();
 await check('normal and multiply overlap pixels match expected arithmetic; unrelated controls unchanged',async()=>{
  const normal=await pixel(),controls=await one('.foundry-toolbar').screenshot();assert.deepEqual(normal,[200,100,50]);
  await one('[data-inspect-blend]').selectOption('multiply');await one('[data-blend-apply]').click();await one('.foundry-scene').scrollIntoViewIfNeeded();const multiplied=await pixel();for(let i=0;i<3;i++)assert.ok(Math.abs(multiplied[i]-[78,78,29][i])<=2,JSON.stringify(multiplied));assert.deepEqual(await one('.foundry-toolbar').screenshot(),controls);report.pixels={normal,multiplied};
 });
 await check('all nine source enum modes reach actual computed style with surface isolation',async()=>{for(const mode of ['normal','multiply','screen','overlay','soft-light','hard-light','difference','color-dodge','luminosity']){await one('[data-inspect-blend]').selectOption(mode);await one('[data-blend-apply]').click();const actual=await page.locator('.foundry-object').evaluateAll((os,id)=>getComputedStyle(os.find(o=>o.dataset.id===id)).mixBlendMode,ids[0]);assert.equal(actual,mode);}assert.equal(await one('.foundry-scene').evaluate(el=>getComputedStyle(el).isolation),'isolate');});
 await check('Undo/Redo preserves mode and explicit reset is recoverable',async()=>{await one('[data-undo]').click();assert.equal(await one('[data-inspect-blend]').inputValue(),'color-dodge');await one('[data-redo]').click();assert.equal(await one('[data-inspect-blend]').inputValue(),'luminosity');await one('[data-reset-room]').click();assert.equal(await one('[data-inspect-blend]').inputValue(),'normal');await one('[data-undo]').click();await select(ids[0]);assert.equal(await one('[data-inspect-blend]').inputValue(),'luminosity');});
 await one('.foundry-scene').scrollIntoViewIfNeeded();await one('.foundry-grid').screenshot({path:path.join(out,'blend-authoring.png')});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
