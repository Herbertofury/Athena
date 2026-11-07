/* Real Chromium acceptance only. Importing this file never loads or launches a browser.
 * Run in an authorized CI environment after npm ci && npm run build:
 * node scripts/test_workshops_browser.cjs
 * Missing Playwright/Chromium is a failed receipt, never a skipped/pass result.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const WORKSHOP_IDS=Object.freeze(['security-foundations','systems-workshop','programming-workshop','cloud-workshop','data-workshop']);
const REQUIRED_CHECKS=Object.freeze(['exact served files','catalog counts and directory','workshop ZIP downloads','all workshop routes and lessons','literal worked-code markup is inert','supplemental checks and unchanged XP','read and notes persistence','close and Escape focus','history Back and Forward','desktop and mobile layout','Packet Trail regression','no external requests or page errors']);
const CSP="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'";
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function createReport(root,out){return {schema:1,kind:'actual Chromium integrated-workshop acceptance',result:'running',started:new Date().toISOString(),root,output:out,browser:null,checks:[],files:[],screenshots:[],errors:[],outsideRequests:[],cspViolations:[],failedResponses:[],limits:['Local static app only; no live-provider, certification, or real-system execution claims','Static runner contract tests are not browser evidence']};}
function validateReceipt(report){
 assert.equal(report.result,'pass');assert.ok(report.browser,'A real browser version is required');
 for(const name of REQUIRED_CHECKS)assert.equal(report.checks.filter(c=>c.name===name&&c.result==='pass').length,1,`Missing or duplicate check: ${name}`);
 for(const field of ['errors','outsideRequests','cspViolations','failedResponses'])assert.deepEqual(report[field],[],field);
 assert.ok(report.files.length>=6,'Need served application identity');
 for(const item of report.files){assert.match(item.sha256,/^[a-f0-9]{64}$/);assert.equal(item.loadedSHA256,item.sha256);}
 assert.equal(report.totalLessons,90);assert.equal(report.addedLessons,42);
 assert.deepEqual(report.workshopIds,WORKSHOP_IDS);assert.equal(new Set(report.openedLessonIds).size,42);
 assert.equal(report.supplementalChecksExercised,84);assert.deepEqual(report.downloads.map(d=>d.id),WORKSHOP_IDS);for(const d of report.downloads){assert.equal(d.status,200);assert.equal(d.mime,'application/zip');assert.deepEqual(d.header,[80,75,3,4]);assert.match(d.sha256,/^[a-f0-9]{64}$/);assert.ok(d.size>100);}
 for(const viewport of ['desktop','mobile'])for(const id of WORKSHOP_IDS)assert.ok(report.screenshots.some(s=>s.name===`${id}-${viewport}.png`),`Missing ${id} ${viewport} screenshot`);
 return true;
}
function resolveAsset(root,url){const name=decodeURIComponent(new URL(url,'http://127.0.0.1').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))throw Error('Path outside root');const real=fs.realpathSync(file);if(!real.startsWith(fs.realpathSync(root)+path.sep))throw Error('Symlink outside root');return file;}
// A changed hash can precede hashchange rendering. Require the target DOM as
// well, including after real clicks and history navigation. This function is
// serialized by Playwright, so it intentionally has no module-scope captures.
function workshopRouteReady(hash){
 if(location.hash!==hash)return false;
 const main=document.querySelector('#main'),paths=globalThis.ATHENA_DATA?.workshops;
 if(main?.dataset.workspace!=='learning'||!Array.isArray(paths))return false;
 if(hash==='#workshops')return paths.length===5&&main.querySelectorAll('[data-workshop]').length===5&&paths.every(p=>{
  const links=[...main.querySelectorAll('[data-workshop]')].filter(a=>a.dataset.workshop===p.id);
  return links.length===1&&links[0].getAttribute('href')==='#workshops/'+p.id;
 });
 const p=paths.find(p=>'#workshops/'+p.id===hash);
 return !!p&&[...main.querySelectorAll('[data-lesson]')].some(el=>el.dataset.lesson===p.lessonIds[0]);
}
async function waitForWorkshopRoute(page,hash){await page.waitForFunction(workshopRouteReady,hash);}
async function run(env=process.env){
 const root=path.resolve(env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(env.ATHENA_WORKSHOPS_BROWSER_OUTPUT||'browser-results/workshops');
 const report=createReport(root,out);let browser,server,page;
 fs.mkdirSync(out,{recursive:true});
 async function screenshot(name){const file=path.join(out,name);await page.screenshot({path:file,fullPage:true});report.screenshots.push({name,sha256:sha256(fs.readFileSync(file))});}
 async function check(name,fn){report.currentCheck=name;try{await fn();report.checks.push({name,result:'pass'});}catch(error){report.checks.push({name,result:'failed',error:error.message});throw error;}}
 try{
  // Deliberately lazy: unit tests can import the contract without Playwright.
  const {chromium}=require('playwright');
  const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.zip':'application/zip'};
  server=http.createServer((req,res)=>{try{const file=resolveAsset(root,req.url),bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Content-Security-Policy':CSP});res.end(bytes);}catch{res.writeHead(404);res.end('not found');}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+server.address().port;report.origin=origin;
  browser=await chromium.launch({headless:true,...(env.CHROMIUM_PATH?{executablePath:env.CHROMIUM_PATH}:{})});report.browser=browser.version();
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  context.setDefaultTimeout(10000);context.setDefaultNavigationTimeout(20000);
  await context.route('**/*',route=>{const url=route.request().url();if(new URL(url).origin!==origin){report.outsideRequests.push(url);return route.abort();}return route.continue();});
  await context.exposeBinding('__reportCSP',(_source,event)=>report.cspViolations.push(event));
  await context.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>globalThis.__reportCSP({directive:e.violatedDirective,blockedURI:e.blockedURI})));
  context.on('page',p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.failedResponses.push({url:r.url(),status:r.status()});});});
  page=await context.newPage();await page.goto(origin,{waitUntil:'networkidle'});
  const dialog=page.locator('#lesson-dialog');
  async function route(hash){await page.evaluate(h=>{location.hash=h;},hash);await waitForWorkshopRoute(page,hash);}
  async function open(id){const button=page.locator(`#main [data-lesson="${id}"]`).first();await button.click();await dialog.waitFor({state:'visible'});await page.waitForFunction(id=>document.querySelector('#read-check')?.dataset.id===id,id);}
  async function close(){const id=await page.locator('#read-check').getAttribute('data-id');await page.locator('#close-lesson').click();await dialog.waitFor({state:'hidden'});await page.waitForFunction(id=>document.activeElement?.dataset.lesson===id,id);}
  async function snapshot(){return page.evaluate(()=>({xp:document.querySelector('#xp-label').textContent,progress:localStorage.getItem('athena-progress-v1')}));}
  await check('exact served files',async()=>{
   const names=['index.html','app.js','catalog.js','core.js','workspace-host.js','styles.css'];
   for(const name of names){const expected=sha256(fs.readFileSync(path.join(root,name)));const loaded=await page.evaluate(async name=>{const response=await fetch(name,{cache:'no-store'});if(!response.ok)throw Error(`Failed asset ${name}`);const digest=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');},name);assert.equal(loaded,expected,name);report.files.push({name,sha256:expected,loadedSHA256:loaded});}
  });
  let data,paths,added;
  await check('catalog counts and directory',async()=>{
   data=await page.evaluate(()=>globalThis.ATHENA_DATA);assert.equal(data.lessons.length,90);report.totalLessons=data.lessons.length;
   paths=data.workshops;assert.ok(Array.isArray(paths),'ATHENA_DATA.workshops must be an array');
   assert.deepEqual(paths.map(p=>p.id),WORKSHOP_IDS);report.workshopIds=paths.map(p=>p.id);
   const addedIds=[...new Set(paths.flatMap(p=>p.lessonIds))];assert.equal(addedIds.length,42);added=addedIds.map(id=>{const lesson=data.lessons.find(l=>l.id===id);assert.ok(lesson,`Missing ${id}`);return lesson;});report.addedLessons=added.length;
   await page.locator('[data-nav="workshops"]').click();await waitForWorkshopRoute(page,'#workshops');
   for(const id of WORKSHOP_IDS){const link=page.locator(`#main [data-workshop="${id}"]`);assert.equal(await link.count(),1);assert.equal(await link.getAttribute('href'),'#workshops/'+id);}
  });
  await check('workshop ZIP downloads',async()=>{
   report.downloads=[];
   for(const p of paths){assert.ok(p.downloadUrl,`Missing ZIP URL ${p.id}`);const url=new URL(p.downloadUrl,origin+'/');assert.equal(url.origin,origin,'Downloads must be local exact artifacts');const result=await page.evaluate(async url=>{const response=await fetch(url);const bytes=new Uint8Array(await response.arrayBuffer());return {status:response.status,mime:response.headers.get('content-type'),header:[...bytes.slice(0,4)],size:bytes.length,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')};},url.href);assert.equal(result.status,200);assert.equal(result.mime,'application/zip');assert.deepEqual(result.header,[80,75,3,4]);assert.ok(result.size>100);assert.equal(result.sha256,sha256(fs.readFileSync(resolveAsset(root,url.href))));report.downloads.push({id:p.id,url:url.href,...result});}
  });
  await check('all workshop routes and lessons',async()=>{
   report.openedLessonIds=[];
   for(const p of paths){await route('#workshops');await page.locator(`[data-workshop="${p.id}"]`).click();await waitForWorkshopRoute(page,'#workshops/'+p.id);await page.locator(`#main [data-lesson="${p.lessonIds[0]}"]`).first().waitFor();
    for(const id of [...(p.prerequisites||[]),...p.lessonIds])assert.ok(await page.locator(`#main [data-lesson="${id}"]`).count()>0,`Missing route lesson ${id}`);
    for(const id of p.lessonIds){const lesson=added.find(l=>l.id===id);await open(id);assert.equal(await page.locator('#lesson-title').textContent(),lesson.title);const text=await page.locator('#lesson-content').textContent();for(const paragraph of lesson.explain)assert.ok(text.includes(paragraph),`Truncated explanation ${id}`);for(const step of lesson.lab)assert.ok(text.includes(step),`Missing lab step ${id}`);
     if(lesson.workedCode){const code=page.locator('pre.worked-code code');assert.equal(await code.textContent(),typeof lesson.workedCode==='string'?lesson.workedCode:lesson.workedCode.code);assert.equal(await code.locator('*').count(),0,'Worked code must not become executable markup');}
     for(const source of lesson.sources)assert.ok(await page.locator('#lesson-content .source-list a').evaluateAll((links,url)=>links.some(a=>a.href===new URL(url).href),source),`Missing source ${source}`);
     report.openedLessonIds.push(id);await close();
    }
    // A direct reload must resolve the same real route, not just click state.
    await page.reload();await page.locator(`#main [data-lesson="${p.lessonIds[0]}"]`).first().waitFor();assert.equal(new URL(page.url()).hash,'#workshops/'+p.id);
   }
  });
  await check('literal worked-code markup is inert',async()=>{
   const lesson=added.find(l=>typeof l.workedCode==='string'&&l.workedCode.length),p=paths.find(p=>p.lessonIds.includes(lesson?.id));assert.ok(lesson&&p,'Need an existing worked-code lesson for the injection regression');
   const payload='<img src=x onerror="globalThis.__athenaMarkupProbe=true"> & </code></pre><img src=x onerror="globalThis.__athenaMarkupProbe=true">';
   await route('#workshops/'+p.id);
   const original=await page.evaluate(({id,payload})=>{const lesson=globalThis.ATHENA_DATA.lessons.find(l=>l.id===id),original=lesson.workedCode;globalThis.__athenaMarkupProbe=false;lesson.workedCode=payload;return original;},{id:lesson.id,payload});
   try{
    await open(lesson.id);const code=page.locator('pre.worked-code code');assert.equal(await code.textContent(),payload);assert.equal(await code.locator('*').count(),0,'Literal code must not create child elements');assert.equal(await page.locator('#lesson-content img').count(),0,'Literal markup must not break out of the code block');assert.equal(await page.evaluate(()=>globalThis.__athenaMarkupProbe),false);await screenshot('literal-worked-code-markup.png');
   }finally{
    await page.evaluate(({id,original})=>{globalThis.ATHENA_DATA.lessons.find(l=>l.id===id).workedCode=original;delete globalThis.__athenaMarkupProbe;},{id:lesson.id,original});
    if(await dialog.isVisible())await close();
   }
   await open(lesson.id);assert.equal(await page.locator('pre.worked-code code').textContent(),original);await close();
  });
  await check('supplemental checks and unchanged XP',async()=>{
   let count=0;
   for(const p of paths){await route('#workshops/'+p.id);for(const id of p.lessonIds){const lesson=added.find(l=>l.id===id);await open(id);const before=await snapshot();assert.equal(lesson.additionalChecks?.length,2,`Missing supplemental checks ${id}`);
    for(const [index,item] of lesson.additionalChecks.entries()){const block=page.locator(`.supplemental-check[data-check-index="${index}"]`),options=block.locator('[data-supplemental-answer]'),feedback=block.locator('.supplemental-feedback');assert.equal(await options.count(),item.options.length);assert.ok((await block.textContent()).includes(item.question));
     const wrong=(item.answer+1)%item.options.length;await options.nth(wrong).click();assert.ok((await feedback.textContent()).includes(item.why));assert.ok(await options.nth(wrong).evaluate(el=>el.disabled));
     const first=await feedback.textContent();await options.nth(wrong).evaluate(el=>{el.click();el.click();});assert.equal(await feedback.textContent(),first);assert.deepEqual(await snapshot(),before);
     await block.locator('[data-check-reset]').click();assert.equal((await feedback.textContent()).trim(),'');assert.equal(await options.nth(item.answer).isEnabled(),true);
     await options.nth(item.answer).click();assert.ok((await feedback.textContent()).includes(item.why));assert.ok(await options.nth(item.answer).evaluate(el=>el.classList.contains('correct')));assert.deepEqual(await snapshot(),before);count++;
    }await close();await open(id);assert.equal((await page.locator('.supplemental-feedback').allTextContents()).every(t=>t.trim()===''),true,'Reopening starts fresh supplemental practice');assert.deepEqual(await snapshot(),before);await close();}}
   report.supplementalChecksExercised=count;assert.equal(count,84);
  });
  await check('read and notes persistence',async()=>{
   const p=paths[0],id=p.lessonIds[0],note='Browser receipt <script>not executable</script> & literal notes';await route('#workshops/'+p.id);await open(id);await page.locator('#read-check').check();await page.locator('#lesson-note').fill(note);await close();await page.reload();await open(id);assert.equal(await page.locator('#read-check').isChecked(),true);assert.equal(await page.locator('#lesson-note').inputValue(),note);assert.equal(await page.locator('#xp-label').textContent(),'10 learning XP');await close();
  });
  await check('close and Escape focus',async()=>{
   const id=paths[0].lessonIds[0];for(const how of ['button','Escape']){await open(id);if(how==='button')await close();else{await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await page.waitForFunction(id=>document.activeElement?.dataset.lesson===id,id);}assert.equal(await page.evaluate(()=>document.activeElement?.dataset.lesson),id);}
  });
  await check('history Back and Forward',async()=>{
   await route('#workshops');await page.locator(`[data-workshop="${WORKSHOP_IDS[0]}"]`).click();await waitForWorkshopRoute(page,'#workshops/'+WORKSHOP_IDS[0]);await page.goBack();await waitForWorkshopRoute(page,'#workshops');await page.locator('#main [data-workshop]').first().waitFor();assert.equal(await page.locator('#main [data-workshop]').count(),5);await page.goForward();await waitForWorkshopRoute(page,'#workshops/'+WORKSHOP_IDS[0]);await page.locator(`#main [data-lesson="${paths[0].lessonIds[0]}"]`).first().waitFor();
  });
  await check('desktop and mobile layout',async()=>{
   async function noOverflow(label){const sizes=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,dialogWidth:document.querySelector('#lesson-dialog').clientWidth,dialogScroll:document.querySelector('#lesson-dialog').scrollWidth,open:document.querySelector('#lesson-dialog').open}));assert.ok(sizes.scroll<=sizes.width+1,JSON.stringify({label,...sizes}));if(sizes.open)assert.ok(sizes.dialogScroll<=sizes.dialogWidth+1,JSON.stringify({label,...sizes}));}
   for(const [name,viewport] of Object.entries({desktop:{width:1440,height:1000},mobile:{width:390,height:844}})){await page.setViewportSize(viewport);await route('#workshops');await page.locator('#main [data-workshop]').first().waitFor();await noOverflow(name+' directory');await screenshot('directory-'+name+'.png');for(const p of paths){await route('#workshops/'+p.id);await page.locator(`#main [data-lesson="${p.lessonIds[0]}"]`).first().waitFor();await noOverflow(p.id);await screenshot(p.id+'-'+name+'.png');for(const id of p.lessonIds){await open(id);await noOverflow(id);if(id===p.lessonIds[0])await screenshot(p.id+'-lesson-'+name+'.png');await close();}}}
  });
  await check('Packet Trail regression',async()=>{
   await page.locator('[data-nav="network"]').click();await page.waitForURL('**/#network');await page.locator('#route-form').waitFor();assert.equal(await page.locator('#main progress').getAttribute('max'),'8');await page.locator('#route-destination').fill('10.20.30.77');await page.locator('#route-form button').click();assert.match(await page.locator('#route-result').textContent(),/10\.20\.30\./);await page.locator('[data-case-answer]').first().click();assert.ok((await page.locator('#case-feedback').textContent()).length>40);await open('net-dns-evidence');assert.match(await page.locator('#lesson-title').textContent(),/DNS/i);await close();await screenshot('packet-trail-mobile.png');
  });
  await check('no external requests or page errors',async()=>{for(const field of ['errors','outsideRequests','cspViolations','failedResponses'])assert.deepEqual(report[field],[],field);for(const file of report.files)assert.equal(sha256(fs.readFileSync(path.join(root,file.name))),file.sha256,'Files changed during browser run');});
  report.result='pass';validateReceipt(report);
 }catch(error){report.result='failed';report.failure=error.stack||String(error);if(page){try{report.failureView=await page.evaluate(()=>({hash:location.hash,title:document.title,text:document.querySelector('#main')?.textContent.slice(0,10000)}));await screenshot('failure.png');}catch(screenshotError){report.screenshotFailure=screenshotError.message;}}}
 finally{try{await browser?.close();}catch(error){report.result='failed';report.cleanupFailure=error.message;}if(server?.listening)await new Promise(resolve=>server.close(resolve));report.finished=new Date().toISOString();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
 return report;
}
module.exports={WORKSHOP_IDS,REQUIRED_CHECKS,CSP,sha256,createReport,validateReceipt,resolveAsset,workshopRouteReady,waitForWorkshopRoute,run};
if(require.main===module)run().then(report=>{console.log(JSON.stringify(report,null,2));if(report.result!=='pass')process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});
