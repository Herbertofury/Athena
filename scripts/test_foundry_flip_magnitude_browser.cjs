/* Actual Chromium measured native surface geometry; neutral synthetic objects only. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-flip-magnitude');
const report={kind:'actual Chromium native flip and linked magnitude workflows',checks:[],errors:[],outsideRequests:[],limitations:['Linking equalizes magnitudes, not aspect ratio; native pin is honored; signed Apply remains separate']};
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




 const original=await one('[data-inspect-object]').inputValue();await one('[data-instance-duplicate]').click();const copy=await one('[data-inspect-object]').inputValue();const matrix=()=>page.locator('.foundry-object').evaluateAll((os,id)=>{const n=os.find(o=>o.dataset.id===id),m=new DOMMatrix(getComputedStyle(n).transform);return {x:m.a,y:m.d}},copy);
 await check('explicit flips use committed values, Undo is exact and original duplicate remains unchanged',async()=>{await one('[data-inspect-scale-x]').fill('7');await one('[data-flip-axis="x"]').click();assert.deepEqual(await matrix(),{x:-1,y:1});await one('[data-undo]').click();assert.deepEqual(await matrix(),{x:1,y:1});await one('[data-redo]').click();await one('[data-flip-axis="y"]').click();assert.deepEqual(await matrix(),{x:-1,y:-1});await one('[data-inspect-object]').selectOption(original);assert.equal(await one('[data-inspect-scale-x]').inputValue(),'1');await one('[data-inspect-object]').selectOption(copy);});
 await check('linked magnitude equalizes both signs; unlinked edits only chosen axis and pin refuses',async()=>{assert.equal(await one('[data-link-magnitudes]').isChecked(),true);await one('[data-magnitude-x]').fill('2');await one('[data-apply-magnitude="x"]').click();assert.deepEqual(await matrix(),{x:-2,y:-2});await one('[data-link-magnitudes]').uncheck();await one('[data-magnitude-y]').fill('0.5');await one('[data-apply-magnitude="y"]').click();assert.deepEqual(await matrix(),{x:-2,y:-.5});await one('[data-undo]').click();assert.deepEqual(await matrix(),{x:-2,y:-2});await one('[data-redo]').click();assert.deepEqual(await matrix(),{x:-2,y:-.5});await one('[data-inspect-scale-x]').fill('6');await one('[data-apply-magnitude="y"]').click();assert.equal(await one('[data-inspect-scale-x]').inputValue(),'6');await one('[data-inspect-pin]').check();assert.equal(await one('[data-flip-axis="x"]').isDisabled(),true);await one('[data-flip-axis="x"]').dispatchEvent('click');assert.deepEqual(await matrix(),{x:-2,y:-.5});report.finalMatrix=await matrix();});
 await one('.foundry-scene').scrollIntoViewIfNeeded();await one('.foundry-grid').screenshot({path:path.join(out,'flip-magnitude.png')});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
