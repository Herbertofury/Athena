/* Actual Chromium native layer navigation; synthetic neutral scene only. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-palette');
const report={kind:'actual Chromium native scene palette',checks:[],errors:[],outsideRequests:[],limitations:['Native scene accent mix is session-only and does not claim source asset or full theme equivalence']};
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



 await one('[data-palette-apply]').waitFor();
 await check('source mix changes actual scene background without storing state or global theme',async()=>{const secondary=await one('[data-palette-theme] option').nth(1).getAttribute('value');await one('[data-palette-theme]').selectOption(secondary);await one('[data-palette-amount]').fill('50');const base=await one('.foundry-scene').evaluate(e=>getComputedStyle(e).backgroundImage),outside=await page.evaluate(()=>document.documentElement.getAttribute('style')),storage=await page.evaluate(()=>JSON.stringify(localStorage));await one('[data-palette-apply]').click();assert.notEqual(await one('.foundry-scene').evaluate(e=>getComputedStyle(e).backgroundImage),base);assert.equal(await page.evaluate(()=>document.documentElement.getAttribute('style')),outside);assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),storage);await one('[data-palette-reset]').click();assert.equal(await one('.foundry-scene').evaluate(e=>getComputedStyle(e).backgroundImage),base);await one('[data-palette-apply]').click();await page.reload();await one('[data-palette-apply]').waitFor();assert.equal(await one('.foundry-scene').evaluate(e=>getComputedStyle(e).backgroundImage),base);assert.equal(await one('[data-palette-reset]').isEnabled(),false);});
 await one('[data-foundry-module=palette]').screenshot({path:path.join(out,'palette.png')});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
