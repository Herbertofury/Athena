'use strict';
/* These tests validate the harness/receipt contract without launching a browser.
 * They deliberately do NOT claim browser acceptance of the application. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),Module=require('node:module');
const runnerPath=path.resolve(__dirname,'../scripts/test_workshops_browser.cjs');
const {WORKSHOP_IDS,REQUIRED_CHECKS,CSP,sha256,createReport,validateReceipt,resolveAsset,run}=require(runnerPath);
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
