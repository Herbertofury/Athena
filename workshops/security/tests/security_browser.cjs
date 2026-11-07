/* Actual Chromium verification of the additive content in an isolated snapshot.
   Existing Athena code is unmodified; this is not published-source acceptance. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../compatibility/dist'),out=path.resolve(__dirname,'../evidence/browser');
const lessons=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../content/security-lessons.json'),'utf8'));
const report={kind:'actual Chromium, isolated additive-content snapshot',checks:[],outsideRequests:[],errors:[],limitations:['No live-source integration, publication or CI acceptance','No screen-reader or complete accessibility audit','Existing UI displays 10 first checks, not 20 supplemental checks','Security pathway navigation not implemented; tested through foundations and Security+ track']};
let server,browser,page;
async function check(name,fn){report.currentCheck=name;await fn();report.checks.push(name);}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 server=http.createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const data=fs.readFileSync(file);const type={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){report.outsideRequests.push(r.request().url());return r.abort();}return r.continue();});
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(origin+'/#foundations');
 await check('All ten applied lesson dialogs show teaching, practice and the correct first-check feedback',async()=>{
  for(const lesson of lessons){await page.locator(`[data-lesson="${lesson.id}"]`).click();await page.locator('#lesson-dialog').waitFor({state:'visible'});
   assert.equal(await page.locator('#lesson-title').textContent(),lesson.title);
   const text=await page.locator('#lesson-content').textContent();assert.ok(text.includes(lesson.explain[5]));assert.ok(text.includes(lesson.lab[5]));assert.ok(text.includes('not full-domain mastery'));
   await page.locator(`[data-answer="${lesson.answer}"]`).click();assert.ok((await page.locator('#lesson-feedback').textContent()).includes(lesson.why));assert.equal(await page.locator('#lesson-options button:disabled').count(),4);
   await page.locator('#close-lesson').click();
  }
 });
 await check('New lesson note and read state survive reload, with inert text',async()=>{
  await page.locator('[data-lesson="sec-risk-story"]').click();await page.locator('#read-check').check();await page.locator('#lesson-note').fill('<img src=x onerror=evil> synthetic study note');await page.locator('#close-lesson').click();await page.reload();await page.locator('[data-lesson="sec-risk-story"]').click();
  assert.equal(await page.locator('#read-check').isChecked(),true);assert.equal(await page.locator('#lesson-note').inputValue(),'<img src=x onerror=evil> synthetic study note');assert.equal(await page.locator('#lesson-note img').count(),0);await page.keyboard.press('Escape');await page.locator('#lesson-dialog').waitFor({state:'hidden'});
 });
 await check('Security+ snapshot lists its six existing and ten added lessons',async()=>{await page.goto(origin+'/#track/security-plus');assert.equal(await page.locator('[data-lesson]').count(),16);});
 await check('Search can find the new log lesson',async()=>{await page.goto(origin+'/#foundations');await page.locator('#search').fill('Read security logs');assert.equal(await page.locator('[data-lesson="sec-log-evidence"]').count(),1);await page.locator('#search').fill('');});
 await check('Wrong answer is explanatory and disables repeated grading',async()=>{const l=lessons.find(x=>x.id==='sec-restore-proof');await page.locator(`[data-lesson="${l.id}"]`).click();await page.locator(`[data-answer="${(l.answer+1)%4}"]`).click();assert.ok((await page.locator('#lesson-feedback').textContent()).includes(l.why));assert.equal(await page.locator('#lesson-options button:disabled').count(),4);await page.locator('#close-lesson').click();});
 await check('Keyboard activation, Escape close and opener focus work for new content',async()=>{const button=page.locator('[data-lesson="sec-identity-lifecycle"]');await button.focus();await page.keyboard.press('Enter');await page.locator('#lesson-dialog').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.locator('#lesson-dialog').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.activeElement?.dataset.lesson),'sec-identity-lifecycle');});
 await check('Long lesson fits desktop and 390px mobile viewport in both themes',async()=>{for(const width of [1280,390]){await page.setViewportSize({width,height:900});for(const theme of ['dark','light']){const light=(await page.locator('body').getAttribute('class')||'').includes('light');if(light!==(theme==='light'))await page.locator('#theme').click();await page.locator('[data-lesson="sec-incident-decisions"]').click();const sizes=await page.evaluate(()=>{const d=document.querySelector('#lesson-dialog');return {pageWidth:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,dialogScroll:d.scrollWidth,dialogClient:d.clientWidth};});assert.ok(sizes.pageWidth<=sizes.client+1,JSON.stringify(sizes));assert.ok(sizes.dialogScroll<=sizes.dialogClient+1,JSON.stringify(sizes));await page.screenshot({path:path.join(out,`security-${width}-${theme}.png`)});await page.locator('#close-lesson').click();}}});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png')});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));});
