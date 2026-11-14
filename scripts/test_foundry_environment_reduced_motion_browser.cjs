/* Actual Chromium environment motion preference acceptance; synthetic scene only. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-environment-reduced-motion');
const report={kind:'actual Chromium environment reduced-motion lifecycle',checks:[],errors:[],outsideRequests:[],limitations:['Only environment motion preference handling; no claim of complete original governor parity']};
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
 await page.addInitScript(()=>{window.__mediaEvidence=[];const original=window.matchMedia.bind(window);window.matchMedia=query=>{const media=original(query),row={query,events:[]};window.__mediaEvidence.push(row);media.addEventListener('change',()=>row.events.push(media.matches));return media;};});
 await page.goto(origin+'/index.html#build');
 await page.locator('[data-inspect-blend]').waitFor();
 await page.locator('.workspace-status').filter({hasText:/workspace loaded/}).waitFor();
 const one=s=>page.locator(s);



 await one('[data-environment-preset]').selectOption('ocean');await one('[data-environment-apply]').click();
 const canvas=()=>one('canvas[data-environment-backdrop="ocean"]'), pixels=()=>canvas().evaluate(c=>c.toDataURL());
 await check('initial reduced motion disables start and preserves static pixels',async()=>{assert.equal(await one('[data-environment-motion]').isDisabled(),true);const before=await pixels();await one('[data-environment-motion]').dispatchEvent('click');await page.waitForTimeout(150);assert.equal(await pixels(),before);assert.match(await one('[data-environment-status]').textContent(),/Reduced-motion/);});
 await check('preference change cancels active motion and never auto resumes',async()=>{await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>!document.querySelector('[data-environment-motion]').disabled,null,{polling:100});const staticPixels=await pixels();await page.waitForTimeout(120);assert.equal(await pixels(),staticPixels);await one('[data-environment-motion]').click();await page.waitForTimeout(150);assert.notEqual(await pixels(),staticPixels);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('[data-environment-motion]').disabled,null,{polling:100});const stopped=await pixels();await page.waitForTimeout(180);assert.equal(await pixels(),stopped);await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>!document.querySelector('[data-environment-motion]').disabled,null,{polling:100});await page.waitForTimeout(150);assert.equal(await pixels(),stopped);assert.match(await one('[data-environment-status]').textContent(),/remains stopped/);});
 await one('.foundry-scene').scrollIntoViewIfNeeded();await one('.foundry-grid').screenshot({path:path.join(out,'environment-reduced-motion.png')});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;if(page)report.state=await page.evaluate(()=>({mediaEvents:window.__mediaEvidence,matches:matchMedia('(prefers-reduced-motion: reduce)').matches,disabled:document.querySelector('[data-environment-motion]')?.disabled,status:document.querySelector('[data-environment-status]')?.textContent}));process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
