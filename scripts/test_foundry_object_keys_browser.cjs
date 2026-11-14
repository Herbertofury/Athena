// Real Chromium presentation test; local synthetic authoring state only.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const base=path.resolve(__dirname,'../dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-object-keys');let browser,server;
const report={scope:'Scoped native Foundry selected Duplicate/Delete shortcuts; no original asset/provider/private-data parity claim',checks:[],errors:[],outsideRequests:[]};
async function check(name,fn){await fn();report.checks.push({name,result:'pass'});}
(async()=>{fs.mkdirSync(out,{recursive:true});server=http.createServer((req,res)=>{try{const f=path.resolve(base,'.'+new URL(req.url,'http://localhost').pathname.replace(/^\/$/,'/index.html'));if(!f.startsWith(base+path.sep))throw Error();const b=fs.readFileSync(f);res.setHeader('Content-Type',f.endsWith('.js')||f.endsWith('.mjs')?'text/javascript':f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'application/octet-stream');res.end(b);}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});report.browser=browser.version();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await context.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();report.outsideRequests.push(r.request().url());return r.abort();});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(origin+'/#build');const root=page.locator('.foundry-workspace'),toggle=root.locator('[data-canvas-view-toggle]'),draft=root.locator('[data-inspect-rotation]');await toggle.waitFor();await page.locator('.workspace-status').filter({hasText:'workspace loaded'}).waitFor();
const count=()=>root.locator('[data-inspect-object] option').count();
await check('Selected duplicate/delete changes exact instance count with Undo/Redo and no text interception',async()=>{
const before=await count();await toggle.focus();await page.keyboard.press('Control+d');assert.equal(await count(),before+1);
await toggle.focus();await page.keyboard.press('Delete');assert.equal(await count(),before);
await toggle.focus();await page.keyboard.press('Control+z');assert.equal(await count(),before+1);
await page.keyboard.press('Control+Shift+z');assert.equal(await count(),before);
await draft.fill('37');await draft.focus();await page.keyboard.press('Control+d');assert.equal(await count(),before);await page.keyboard.press('Delete');assert.equal(await count(),before);
await page.locator('[data-nav="research"]').focus();await page.keyboard.press('Delete');assert.equal(await count(),before);
});
await check('Reload persistence and route remount preserve exactly one action owner',async()=>{
const before=await count();await page.reload();await toggle.waitFor();await page.locator('.workspace-status').filter({hasText:'workspace loaded'}).waitFor();assert.equal(await count(),before);
await page.locator('[data-nav="research"]').click();await page.locator('.workspace-container #result-count').waitFor();await page.keyboard.press('Delete');assert.equal(await page.locator('.foundry-workspace').count(),0);
await page.locator('[data-nav="build"]').click();await toggle.waitFor();await page.locator('.workspace-status').filter({hasText:'workspace loaded'}).waitFor();await toggle.focus();await page.keyboard.press('Control+d');assert.equal(await count(),before+1);await page.screenshot({path:path.join(out,'object-keys.png'),fullPage:true});
});
assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';})().catch(e=>{report.result='failed';report.error=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
