'use strict';
/* These tests validate the harness/receipt contract without launching a browser.
 * They deliberately do NOT claim browser acceptance of the application. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),Module=require('node:module');
const runnerPath=path.resolve(__dirname,'../scripts/test_workshops_browser.cjs');
const {WORKSHOP_IDS,REQUIRED_CHECKS,CSP,sha256,createReport,validateReceipt,resolveAsset,workshopRouteReady,waitForWorkshopRoute,run}=require(runnerPath);
function fixture(){return {...createReport('/fixture/dist','/fixture/report'),result:'pass',browser:'Chromium fixture, NOT a browser run',checks:REQUIRED_CHECKS.map(name=>({name,result:'pass'})),files:['index.html','app.js','catalog.js','core.js','workspace-host.js','styles.css'].map(name=>({name,sha256:'a'.repeat(64),loadedSHA256:'a'.repeat(64)})),screenshots:WORKSHOP_IDS.flatMap(id=>['desktop','mobile'].map(viewport=>({name:`${id}-${viewport}.png`,sha256:'b'.repeat(64)}))),totalLessons:90,addedLessons:42,workshopIds:[...WORKSHOP_IDS],openedLessonIds:Array.from({length:42},(_,i)=>`fixture-lesson-${i}`),supplementalChecksExercised:84,downloads:WORKSHOP_IDS.map(id=>({id,status:200,mime:'application/zip',header:[80,75,3,4],sha256:'c'.repeat(64),size:101}))};}
test('importing the runner is side-effect-free and has no eager Playwright dependency',()=>{
 assert.equal(typeof run,'function');assert.equal(Object.keys(require.cache).some(name=>/[\\/]playwright[\\/]/.test(name)),false);
 assert.equal(WORKSHOP_IDS.length,5);assert.ok(Object.isFrozen(WORKSHOP_IDS));assert.ok(Object.isFrozen(REQUIRED_CHECKS));
 const report=createReport('/fixture','/receipt');assert.equal(report.result,'running');assert.equal(report.browser,null);assert.deepEqual(report.checks,[]);assert.throws(()=>validateReceipt(report));
});
test('complete synthetic receipt validates; omission or failure of any required check cannot pass',()=>{
 assert.equal(validateReceipt(fixture()),true);
 for(const name of REQUIRED_CHECKS){for(const mutation of ['omit','fail','duplicate']){const receipt=fixture();if(mutation==='omit')receipt.checks=receipt.checks.filter(c=>c.name!==name);else if(mutation==='fail')receipt.checks.find(c=>c.name===name).result='failed';else receipt.checks.push({name,result:'pass'});assert.throws(()=>validateReceipt(receipt),`${name} ${mutation}`);}}
});
test('receipt requires actual browser identity, exact bytes, all lessons and clean runtime',()=>{
 const mutations=[r=>r.result='skipped',r=>r.browser=null,r=>r.files=[],r=>r.files[0].sha256='invalid',r=>r.files[0].loadedSHA256='0'.repeat(64),r=>r.totalLessons=89,r=>r.addedLessons=41,r=>r.workshopIds.reverse(),r=>r.openedLessonIds[0]=r.openedLessonIds[1],r=>r.screenshots.pop(),r=>r.supplementalChecksExercised=83,r=>r.downloads.pop(),r=>r.downloads[0].mime='text/html'];
 for(const field of ['errors','outsideRequests','cspViolations','failedResponses'])mutations.push(r=>r[field].push('fixture failure'));
 for(const mutate of mutations){const receipt=fixture();mutate(receipt);assert.throws(()=>validateReceipt(receipt));}
});
test('static server refuses path escapes and symlinks outside the served root',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'athena-workshop-contract-'));try{const root=path.join(temp,'dist');fs.mkdirSync(root);fs.writeFileSync(path.join(root,'index.html'),'fixture');fs.writeFileSync(path.join(temp,'private.txt'),'outside');assert.equal(resolveAsset(root,'/'),path.join(root,'index.html'));assert.throws(()=>resolveAsset(root,'/%2e%2e%2fprivate.txt'));fs.symlinkSync(path.join(temp,'private.txt'),path.join(root,'escape.txt'));assert.throws(()=>resolveAsset(root,'/escape.txt'));}finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('missing browser dependency produces a failed report without loading or launching Playwright',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'athena-workshop-failure-')),original=Module._load;let attempts=0;
 // This intercept fails BEFORE Playwright loads, before a server starts, and before a browser can launch.
 Module._load=function(request,...args){if(request==='playwright'){attempts++;throw Error('Synthetic unavailable Playwright dependency: no browser launched');}return original.call(this,request,...args);};
 try{const report=await run({ATHENA_BROWSER_ROOT:path.join(temp,'dist'),ATHENA_WORKSHOPS_BROWSER_OUTPUT:temp});assert.equal(attempts,1);assert.equal(report.result,'failed');assert.equal(report.browser,null);assert.deepEqual(report.checks,[]);assert.match(report.failure,/Synthetic unavailable Playwright/);assert.ok(report.finished);const saved=JSON.parse(fs.readFileSync(path.join(temp,'report.json'),'utf8'));assert.equal(saved.result,'failed');assert.throws(()=>validateReceipt(saved));}finally{Module._load=original;fs.rmSync(temp,{recursive:true,force:true});}
});
test('runner keeps browser checks, artifact receipts and restrictive local-only network policy',()=>{
 const source=fs.readFileSync(runnerPath,'utf8');
 for(const name of REQUIRED_CHECKS)assert.ok(source.includes(`await check('${name}'`),`Missing implementation ${name}`);
 for(const token of ['chromium.launch','page.screenshot','page.goBack','page.goForward',"page.keyboard.press('Escape')",'report.failure','report.result=\'failed\'',"process.exitCode=1",'pre.worked-code code','athena-progress-v1','data-check-reset','noOverflow','loadedSHA256','<img src=x onerror=','lesson.workedCode=payload','lesson.workedCode','Literal markup must not break out of the code block','literal-worked-code-markup.png'])assert.ok(source.includes(token),`Missing contract ${token}`);
 assert.match(source,/if\(require\.main===module\)run\(\)/);assert.match(source,/new URL\(url\)\.origin!==origin/);assert.match(source,/return route\.abort\(\)/);assert.match(source,/serviceWorkers:'block'/);
 assert.ok(CSP.includes("script-src 'self'"));assert.ok(CSP.includes("style-src 'self';"));assert.equal(CSP.includes("'unsafe-inline'"),false);assert.ok(source.includes("'.mjs':'text/javascript'"));assert.ok(CSP.includes("connect-src 'self'"));assert.equal(CSP.includes("'unsafe-eval'"),false);
 assert.equal(/execSync|spawnSync|playwright install|ignoreHTTPSErrors|--no-sandbox|test\.skip/.test(source),false,'No install, sandbox bypass, or silent skip');
 assert.equal(sha256(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

function routeFixture(){
 const {document}=require('linkedom').parseHTML('<html><body><main id="main" data-workspace="learning"><h1>Home</h1></main></body></html>');
 const workshops=WORKSHOP_IDS.map((id,i)=>({id,lessonIds:['lesson-'+i]}));
 const context={document,location:{hash:'#workshops'},ATHENA_DATA:{workshops}};
 const ready=hash=>require('node:vm').runInNewContext('('+workshopRouteReady.toString()+')(hash)',{...context,hash});
 const main=document.querySelector('#main');
 const directory=()=>{main.innerHTML=workshops.map(p=>`<a data-workshop="${p.id}" href="#workshops/${p.id}">${p.id}</a>`).join('');};
 return {context,ready,main,directory,workshops};
}
test('workshop readiness rejects new URL with old home, partial or wrong directory DOM',()=>{
 const f=routeFixture();assert.equal(f.ready('#workshops'),false,'Observed CI regression: hash alone cannot establish rendered readiness');
 f.directory();assert.equal(f.ready('#workshops'),true);
 f.context.location.hash='#home';assert.equal(f.ready('#workshops'),false);f.context.location.hash='#workshops';
 f.main.dataset.workspace='pending';assert.equal(f.ready('#workshops'),false);f.main.dataset.workspace='learning';
 f.main.firstElementChild.remove();assert.equal(f.ready('#workshops'),false);
 f.directory();f.main.firstElementChild.setAttribute('href','#wrong');assert.equal(f.ready('#workshops'),false);
 f.directory();f.main.lastElementChild.dataset.workshop=WORKSHOP_IDS[0];assert.equal(f.ready('#workshops'),false);
});
test('detail readiness rejects stale directory or another workshop despite target hash',()=>{
 const f=routeFixture(),hash='#workshops/'+WORKSHOP_IDS[1];f.directory();f.context.location.hash=hash;assert.equal(f.ready(hash),false);
 f.main.innerHTML='<button data-lesson="lesson-0"></button>';assert.equal(f.ready(hash),false);
 f.main.innerHTML='<button data-lesson="lesson-1"></button>';assert.equal(f.ready(hash),true);
 f.context.location.hash='#workshops/'+WORKSHOP_IDS[0];assert.equal(f.ready(hash),false);
});
test('shared route wait remains pending until render and propagates a failed wait',async()=>{
 const f=routeFixture(),events=[];
 await waitForWorkshopRoute({async waitForFunction(predicate,hash){assert.equal(predicate,workshopRouteReady);assert.equal(hash,'#workshops');events.push(f.ready(hash));await new Promise(setImmediate);f.directory();events.push(f.ready(hash));}},'#workshops');
 assert.deepEqual(events,[false,true]);
 await assert.rejects(waitForWorkshopRoute({async waitForFunction(){throw Error('Synthetic bounded Playwright wait failure');}},'#workshops'),/bounded Playwright wait failure/);
});
test('real directory click and history transitions use rendered readiness, not URL-only waits',()=>{
 const source=fs.readFileSync(runnerPath,'utf8');
 assert.ok(source.includes(`await page.locator('[data-nav="workshops"]').click();await waitForWorkshopRoute(page,'#workshops');`));
 assert.ok(source.includes(`await page.goBack();await waitForWorkshopRoute(page,'#workshops');`));
 assert.ok(source.includes(`await page.goForward();await waitForWorkshopRoute(page,'#workshops/'+WORKSHOP_IDS[0]);`));
 assert.ok(source.includes(`await page.locator(\`[data-workshop="\${WORKSHOP_IDS[0]}"]\`).click();await waitForWorkshopRoute(page,'#workshops/'+WORKSHOP_IDS[0]);await page.goBack()`));
 assert.equal(source.includes("waitForURL('**/#workshops"),false);
 assert.ok(source.includes("assert.equal(await link.count(),1)"));assert.ok(source.includes("assert.equal(addedIds.length,42)"));
});
