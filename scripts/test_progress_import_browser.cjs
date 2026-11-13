/* Real Chromium acceptance for progress import persistence; no provider traffic. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve('dist'),out=path.resolve(process.env.ATHENA_IMPORT_OUTPUT||'browser-results/progress-import');
const report={kind:'actual Chromium local progress-import acceptance',checks:[],outsideRequests:[],errors:[]};
let server,browser;
(async()=>{
 server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))throw Error('Outside root');const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[ext]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});report.browser=browser.version();
 const context=await browser.newContext();await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){report.outsideRequests.push(route.request().url());return route.abort();}return route.continue();});
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));page.on('dialog',dialog=>dialog.accept());await page.goto(origin);
 report.appSha256=await page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch('app.js')).arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join(''));
 assert.equal(report.appSha256,crypto.createHash('sha256').update(fs.readFileSync('dist/app.js')).digest('hex'));
 const progress=await page.evaluate(()=>{const p=AthenaCore.fresh();p.notes.identity='Imported draft';return p;});
 await page.evaluate(()=>{const prior=AthenaCore.fresh();prior.notes.identity='Last durable draft';localStorage.setItem('athena-progress-v1',JSON.stringify(prior));window.originalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='athena-progress-v1')throw new DOMException('Test quota exhaustion','QuotaExceededError');return window.originalStorageSet.call(this,key,value);};});
 async function importProgress(){await page.locator('#import').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(progress))});}
 await importProgress();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('only for this session'));
 assert.match(await page.locator('#toast').textContent(),/Export/);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('athena-progress-v1')).notes.identity),'Last durable draft');
 report.checks.push('Quota failure does not claim durable save or overwrite last-good stored progress');
 await page.locator('[data-nav="foundations"]').click();await page.locator('[data-lesson="identity"]').click();assert.equal(await page.locator('#lesson-note').inputValue(),'Imported draft');await page.locator('#close-lesson').click();
 report.checks.push('Imported draft remains available in the active session');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);assert.equal(JSON.parse(Buffer.concat(chunks).toString()).notes.identity,'Imported draft');
 report.checks.push('Session-only imported draft can be exported without data loss');
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalStorageSet;});await importProgress();await page.waitForFunction(()=>document.querySelector('#toast').textContent==='Progress imported and saved.');await page.reload();await page.locator('[data-lesson="identity"]').click();assert.equal(await page.locator('#lesson-note').inputValue(),'Imported draft');
 report.checks.push('Retry after storage recovery saves imported draft across page reload');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(error=>{report.result='failed';report.error=error.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));});
