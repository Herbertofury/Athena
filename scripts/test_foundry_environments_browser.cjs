/* Actual Chromium verification. Requires Playwright and a browser; no provider/network tests. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const report={kind:'actual Chromium, localhost static app',started:new Date().toISOString(),checks:[],limitations:['No actual provider playback or authenticated API tests','Foundry room authoring is partial: original 3D, artist worlds, desktop persistence and provider accounts remain pending','No runtime speedup or complete parity claim'],errors:[],outsideRequests:[]};
let browser,server,page;
async function check(name,fn){report.currentCheck=name;await fn();report.checks.push({name,result:'pass'});}
(async()=>{fs.mkdirSync(out,{recursive:true});server=http.createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const data=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('not found');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});report.browser=await browser.version();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){report.outsideRequests.push(route.request().url());return route.abort();}return route.continue();});page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));const search=page.locator('.topbar #search');
 async function openWorkspace(id){await page.locator('[data-nav="'+id+'"]').click();await page.waitForFunction(id=>document.querySelector('#main').dataset.workspace===id,id);const title={research:'Research',media:'Media workbench',cards:'Card density lab',audio:'Verified audio',receiver:'Complete receiver lab',diagnostics:'Media diagnostics'}[id].toLowerCase();await page.locator('.workspace-status').filter({hasText:'Athena '+title+' workspace loaded.'}).waitFor();}
 await page.goto(origin);report.loadedAppSHA256=await page.evaluate(async()=>{const bytes=await(await fetch('app.js')).arrayBuffer();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');});assert.equal(report.loadedAppSHA256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'app.js'))).digest('hex'));
 await check('Expanded original environments paint distinctly and survive reload/reset',async()=>{
  await page.locator('[data-nav="build"]').click();await page.locator('[data-environment-preset]').waitFor();
  const sums=[];
  for(const preset of ['cosmic','frutiger','aurora','ocean','raincity','diner']){
   await page.locator('[data-environment-preset]').selectOption(preset);await page.locator('[data-environment-apply]').click();
   const canvas=page.locator('canvas[data-environment-backdrop="'+preset+'"]');await canvas.waitFor();
   const pixels=await canvas.evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let sum=0,visible=0;for(let i=0;i<data.length;i+=4){sum=(sum+data[i]*3+data[i+1]*5+data[i+2]*7)>>>0;if(data[i+3])visible++;}return {sum,visible};});
   assert.ok(pixels.visible>500000);sums.push(pixels.sum);
  }
  assert.equal(new Set(sums).size,6);report.expandedEnvironmentPixels=sums;
  await page.reload();await page.locator('canvas[data-environment-backdrop="diner"]').waitFor();
  await page.locator('[data-reset-room]').click();await page.locator('canvas[data-environment-backdrop="diner"]').waitFor();
  const event=page.waitForEvent('download');await page.locator('[data-export]').click();const download=await event;const fs=require('node:fs');const filename=path.join(out,'expanded-environment-layout.json');await download.saveAs(filename);const value=JSON.parse(fs.readFileSync(filename));assert.equal(value.version,12);assert.equal(value.environment.preset,'diner');
  await page.screenshot({path:path.join(out,'foundry-expanded-environment.png'),fullPage:true});
  await page.locator('[data-environment-preset]').selectOption('off');await page.locator('[data-environment-apply]').click();assert.equal(await page.locator('[data-environment-backdrop]').count(),0);
 });
 await check('Motion is explicit, moves actual pixels, stops and never resumes on reload',async()=>{
  await page.locator('[data-environment-preset]').selectOption('cosmic');await page.locator('[data-environment-apply]').click();
  const canvas=page.locator('canvas[data-environment-backdrop="cosmic"]'),button=page.locator('[data-environment-motion]');
  const pixels=()=>canvas.evaluate(c=>c.toDataURL());const first=await pixels();await page.waitForTimeout(100);assert.equal(await pixels(),first);
  await button.click();await page.waitForFunction(()=>document.querySelector('[data-environment-motion]').textContent.startsWith('Stop'));
  await page.waitForTimeout(200);assert.notEqual(await pixels(),first);await button.click();const stopped=await pixels();await page.waitForTimeout(100);assert.equal(await pixels(),stopped);
  await button.click();await page.reload();await canvas.waitFor();assert.equal(await button.textContent(),'Start environment motion');const reloaded=await pixels();await page.waitForTimeout(100);assert.equal(await pixels(),reloaded);
  await button.click();await page.locator('[data-environment-preset]').selectOption('off');await page.locator('[data-environment-apply]').click();assert.equal(await page.locator('[data-environment-backdrop]').count(),0);assert.equal(await button.isDisabled(),true);
 });
 report.result='pass';console.log(JSON.stringify(report,null,2));
})().catch(error=>{report.result='fail';report.failure=String(error.stack);console.error(JSON.stringify(report,null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
