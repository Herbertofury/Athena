/* Actual Chromium native layer navigation; synthetic neutral scene only. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-layers');
const report={kind:'actual Chromium native layer navigation',checks:[],errors:[],outsideRequests:[],limitations:['Native surface groups and position pin do not claim original left/right worlds or lock parity']};
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



 await one('[data-layer-groups]').waitFor();const original=await one('[data-inspect-object]').inputValue();await one('[data-instance-duplicate]').click();const copy=await one('[data-inspect-object]').inputValue();assert.notEqual(copy,original);const row=id=>page.locator('[data-layer-id="'+id+'"]');
 await check('layer rows expose exact duplicate identities and hidden filtered selection without unintended history',async()=>{assert.match(await row(copy).textContent(),new RegExp(copy));await row(copy).locator('[data-layer-action="visible"]').click();assert.equal(await one('[data-inspect-visible]').isChecked(),false);await row(original).locator('[data-layer-action="select"]').click();await page.locator('.topbar #search').fill('no-such-instance');await row(copy).locator('[data-layer-action="select"]').click();assert.equal(await one('[data-inspect-object]').inputValue(),copy);assert.match(await row(copy).textContent(),/filtered/);await row(copy).locator('[data-layer-action="visible"]').click();assert.equal(await one('[data-inspect-visible]').isChecked(),true);await one('[data-undo]').click();assert.equal(await one('[data-inspect-visible]').isChecked(),false);await one('[data-redo]').click();assert.equal(await one('[data-inspect-visible]').isChecked(),true);await page.locator('.topbar #search').fill('');await row(copy).locator('[data-layer-action="pin"]').click();assert.equal(await one('[data-inspect-pin]').isChecked(),true);await one('[data-undo]').click();assert.equal(await one('[data-inspect-pin]').isChecked(),false);});
 await one('[data-layer-groups]').screenshot({path:path.join(out,'layers.png')});
 await one('.foundry-scene').scrollIntoViewIfNeeded();await one('.foundry-grid').screenshot({path:path.join(out,'layer-scene.png')});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
