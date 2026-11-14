/* Actual Chromium measured native surface geometry; neutral synthetic objects only. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-pixel-nudge');
const report={kind:'actual Chromium native measured pixel nudges',checks:[],errors:[],outsideRequests:[],limitations:['Session-only inspector pixel steps; existing percentage arrow keys unchanged; no drag snapping']};
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




 const original=await one('[data-inspect-object]').inputValue();await one('[data-instance-duplicate]').click();const copy=await one('[data-inspect-object]').inputValue();const point=()=>page.locator('.foundry-object').evaluateAll((os,id)=>{const n=os.find(o=>o.dataset.id===id),s=getComputedStyle(n);return {x:parseFloat(s.left),y:parseFloat(s.top),width:n.parentElement.clientWidth,height:n.parentElement.clientHeight}},copy);
 await check('actual world UI and sticker directional nudges move eight surface pixels with exact Undo/Redo',async()=>{report.measurements=[];for(const scope of ['world','ui','sticker']){await one('[data-inspect-scope]').selectOption(scope);if(scope==='sticker')await one('[data-inspect-anchor]').selectOption('inspector');await one('[data-inspect-scope-apply]').click();await one('[data-inspect-x]').fill('50');await one('[data-inspect-y]').fill('50');await one('[data-inspect-apply]').click();const before=await point();await one('[data-nudge-pixels="1,0"]').click();const after=await point();assert.ok(Math.abs(after.x-before.x-8)<.03);assert.equal(after.y,before.y);await one('[data-undo]').click();assert.deepEqual(await point(),before);await one('[data-redo]').click();assert.deepEqual(await point(),after);await one('[data-nudge-pixels="0,1"]').click();const down=await point();report.measurements.push({scope,before,after,down});assert.ok(Math.abs(down.y-after.y-8)<.03);assert.equal(down.x,after.x);}await one('[data-inspect-object]').selectOption(original);assert.equal(await one('[data-inspect-x]').inputValue(),'15');await one('[data-inspect-object]').selectOption(copy);});
 await check('world outward clamp is true no-op; inward starts at rendered edge and custom step is bounded',async()=>{await one('[data-inspect-scope]').selectOption('world');await one('[data-inspect-scope-apply]').click();await one('[data-inspect-x]').fill('0');await one('[data-inspect-apply]').click();const edge=await point();await one('[data-nudge-pixels="-1,0"]').click();assert.deepEqual(await point(),edge);assert.equal(await one('[data-inspect-x]').inputValue(),'0');await one('[data-nudge-step]').fill('13');await one('[data-nudge-pixels="1,0"]').click();const inward=await point();assert.ok(Math.abs(inward.x-edge.x-13)<.03);await one('[data-nudge-step]').fill('101');await one('[data-nudge-pixels="1,0"]').click();assert.deepEqual(await point(),inward);report.edge={edge,inward};});
 await check('responsive world edge uses45px, not desktop60px',async()=>{await page.setViewportSize({width:360,height:900});await one('[data-nudge-step]').fill('8');await one('[data-inspect-x]').fill('0');await one('[data-inspect-apply]').click();const edge=await point();assert.equal(edge.x,45);await one('[data-nudge-pixels="-1,0"]').click();assert.deepEqual(await point(),edge);await one('[data-nudge-pixels="1,0"]').click();assert.ok(Math.abs((await point()).x-edge.x-8)<.03);});await page.setViewportSize({width:1440,height:1000});
 await one('.foundry-scene').scrollIntoViewIfNeeded();await one('.foundry-grid').screenshot({path:path.join(out,'pixel-nudge.png')});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
