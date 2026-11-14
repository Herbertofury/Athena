/* Actual Chromium, synthetic semantic room metadata only; no source/user files. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-selected-reset');
const report={kind:'actual Chromium selected-instance reset',checks:[],errors:[],outsideRequests:[],limitations:['Source lock has no native equivalent; native pin and sticker anchor are retained']};
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


 await one('[data-inspect-rotation]').fill('67');await one('[data-inspect-scale-x]').fill('-2');await one('[data-inspect-transform]').click();await one('[data-inspect-blend]').selectOption('multiply');await one('[data-blend-apply]').click();await one('[data-inspect-opacity]').fill('0.3');await one('[data-inspect-visible]').uncheck();await one('[data-inspect-appearance]').click();
 await check('selected reset makes hidden instance visible and restores actual computed transform/appearance; single Undo/Redo',async()=>{await one('[data-reset-selected]').click();assert.equal(await one('[data-inspect-rotation]').inputValue(),'0');assert.equal(await one('[data-inspect-scale-x]').inputValue(),'1');assert.equal(await one('[data-inspect-opacity]').inputValue(),'1');assert.equal(await one('[data-inspect-visible]').isChecked(),true);assert.equal(await one('[data-inspect-blend]').inputValue(),'normal');const id=await one('[data-inspect-object]').inputValue();const style=await page.locator('.foundry-object').evaluateAll((os,id)=>{const e=os.find(o=>o.dataset.id===id),s=getComputedStyle(e);return {opacity:s.opacity,blend:s.mixBlendMode,transform:s.transform}},id);assert.equal(style.opacity,'1');assert.equal(style.blend,'normal');report.style=style;await one('[data-undo]').click();assert.equal(await one('[data-inspect-rotation]').inputValue(),'67');assert.equal(await one('[data-inspect-scale-x]').inputValue(),'-2');assert.equal(await one('[data-inspect-visible]').isChecked(),false);await one('[data-redo]').click();assert.equal(await one('[data-inspect-visible]').isChecked(),true);assert.equal(await one('[data-inspect-rotation]').inputValue(),'0');});
 await one('.foundry-scene').scrollIntoViewIfNeeded();await one('.foundry-grid').screenshot({path:path.join(out,'selected-reset.png')});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
