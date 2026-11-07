import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=dirname(fileURLToPath(import.meta.url));
const modulePath=process.env.FOUNDRY_MODULE||resolve(cwd,'../dist/workspaces/foundry/index.js');
const evidence=process.env.FOUNDRY_EVIDENCE||resolve(cwd,'../browser-results/foundry');await mkdir(evidence,{recursive:true});
const html=`<!doctype html><html><head><meta charset="utf-8"><title>Athena Foundry lifecycle contract</title><link rel="stylesheet" href="/harness.css"></head><body><nav id="hostNav"><button id="hostButton">Athena navigation</button></nav><main id="workspace"></main><script type="module" src="/harness.js"></script></body></html>`;
const harness=`import{mount}from'/foundry.js';window.mountModule=mount;window.controller=new AbortController();window.mountFoundry=async()=>{window.workspace=await mount({container:document.getElementById('workspace'),signal:controller.signal});return workspace.diagnostics()};window.exportFoundry=()=>workspace.exportState();window.ready=mountFoundry();`;
const csp="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
const server=createServer(async(req,res)=>{try{
 res.setHeader('Content-Security-Policy',csp);
 if(req.url==='/foundry.js'){res.setHeader('Content-Type','application/javascript');res.end(await readFile(modulePath))}
 else if(req.url==='/harness.js'){res.setHeader('Content-Type','application/javascript');res.end(harness)}
 else if(req.url==='/harness.css'){res.setHeader('Content-Type','text/css');res.end('body{margin:0;padding:20px;background:#111827;color:white}#hostNav{height:40px}')}
 else if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(await readFile(resolve(dirname(modulePath),'style.css')))}
 else{res.setHeader('Content-Type','text/html');res.end(html)}
 }catch(error){res.writeHead(500);res.end(String(error))}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
let browser;const errors=[],network=[],cspViolations=[];const report={source:'Herbertofury/Feature-Foundry',sourceHead:'e1ba080b5c7590f1c844a6ed13b3a471709920b9',checks:[],errors,network,cspViolations,csp};
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1536,height:1100}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Content Security Policy|violates.*directive|Refused to/.test(m.text()))cspViolations.push(m.text())});page.on('request',r=>network.push(r.url()));
 await page.goto(`http://127.0.0.1:${port}`);await page.evaluate(()=>ready);
 const selftest=await page.evaluate(()=>workspace.diagnostics().selftest);assert.ok(selftest&&Object.values(selftest).every(v=>v===true),JSON.stringify(selftest));report.checks.push('Original runtime selftests pass in scoped workspace');
 assert.equal(await page.locator('.premium-ecology-actor').count(),5);assert.equal(await page.evaluate(()=>document.body.dataset.theme),undefined);assert.equal(await page.evaluate(()=>window.ffPrototype),undefined);report.checks.push('Five ecology actors, isolated host body and globals');
 await page.locator('#themeSelect').selectOption('world.frawgy.verdant-conservatory');await page.waitForFunction(()=>workspace.diagnostics().runtime.themeDirector.active==='world.frawgy.verdant-conservatory');
 await page.locator('#editTheme').click();await page.locator('#themeAtlasStudio.open').waitFor();assert.equal(await page.locator('.theme-atlas-card').count(),27);await page.screenshot({path:resolve(evidence,'theme-atlas.png'),fullPage:true});await page.locator('.theme-atlas-header [data-theme-atlas-action=close]').click();report.checks.push('27 theme cards and actual Frawgy theme transition');
 await page.locator('#musicQuick').click();await page.locator('#musicHub.open').waitFor();await page.locator('[data-music-action=toggle-menu]').click();assert.equal(await page.locator('.music-provider-menu [data-music-route]').count(),8);await page.locator('[data-music-route=settings]').click();assert.equal(await page.locator('#appleDeveloperToken').count(),0);await page.locator('.music-hub-close').click();report.checks.push('Six provider routes plus Home/Settings; unavailable account auth asks for no credentials');
 await page.locator('#environmentTv').click();await page.locator('#mediaSurfaceStudio.open').waitFor();await page.locator('#mediaSurfaceUrl').fill('http://example.com/video.mp4');await page.locator('[data-media-action=load-url]').click();assert.match(await page.locator('[data-media-message]').textContent(),/HTTPS/);report.checks.push('Non-HTTPS media rejected');
 assert.equal(await page.evaluate(()=>[...workspace.host.shadowRoot.querySelectorAll('video,audio')].some(el=>!el.paused||el.autoplay)),false);report.checks.push('No media autoplay');
 await page.evaluate(()=>{window.before=workspace.diagnostics();window.old=workspace;return workspace.unmount()});let resources=await page.evaluate(()=>old.diagnostics().resources);assert.equal(resources.dead,true);for(const [k,v]of Object.entries(resources))if(k!=='dead')assert.equal(v,0,k+' leaked');assert.equal(await page.locator('.athena-foundry-workspace').count(),0);report.checks.push('Unmount clears every tracked timer, frame, observer, listener, audio and object URL');
 await page.evaluate(()=>mountFoundry());await page.waitForFunction(()=>workspace.diagnostics().runtime.themeDirector.active==='world.frawgy.verdant-conservatory');report.checks.push('Remount restores namespaced durable theme');
 await page.evaluate(()=>controller.abort());await page.waitForFunction(()=>workspace.diagnostics().resources.dead);assert.equal(await page.locator('.athena-foundry-workspace').count(),0);report.checks.push('Abort removes active workspace');
 // A stylesheet request that never finishes must still honor navigation abort.
 const blockedPage=await browser.newPage();await blockedPage.route('**/style.css',()=>{});
 await blockedPage.goto(`http://127.0.0.1:${port}`,{waitUntil:'domcontentloaded'});await blockedPage.waitForFunction(()=>Boolean(window.controller));
 const aborted=await blockedPage.evaluate(async()=>{controller.abort();try{await ready;return {error:null}}catch(error){return {error:error.name,hosts:document.querySelectorAll('.athena-foundry-workspace').length}}});assert.deepEqual(aborted,{error:'AbortError',hosts:0});await blockedPage.close();report.checks.push('Abort while stylesheet is stalled rejects readiness and removes host');
 // One failing cleanup method must not prevent the remaining cleanup or host removal.
 const failureProbe=await page.evaluate(async()=>{const ctrl=new AbortController();const w=await mountModule({container:document.getElementById('workspace'),signal:ctrl.signal});const media=w.host.shadowRoot.querySelector('video');media.pause=()=>{throw Error('intentional pause failure')};media.load=()=>{throw Error('intentional load failure')};await w.unmount();return {resources:w.diagnostics().resources,cleanupErrors:w.diagnostics().cleanupErrors,attached:w.host.isConnected}});assert.equal(failureProbe.attached,false);assert.ok(failureProbe.cleanupErrors.some(e=>e.includes('intentional pause failure')));for(const [k,v]of Object.entries(failureProbe.resources))if(k!=='dead')assert.equal(v,0,k+' leaked after cleanup error');report.checks.push('Throwing media cleanup does not prevent complete resource tracking cleanup and host removal');
 assert.equal(cspViolations.length,0,cspViolations.join('\n'));report.checks.push('Exact Athena local-engine CSP, without unsafe-inline or unsafe-eval');assert.equal(errors.length,0,errors.join('\n'));assert.equal(network.filter(x=>!x.startsWith(`http://127.0.0.1:${port}`)).length,0,'Unexpected external request');report.status='pass';report.browser=browser.version();
}catch(error){report.status='fail';report.failure=error.stack;throw error}finally{await writeFile(resolve(evidence,'foundry-browser.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
