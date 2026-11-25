/* Actual Chromium, synthetic semantic room metadata only; no source/user files. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-semantic-room');
const fixture={sourceName:'Synthetic <img onerror=alert(1)>.blend',imported:true,importMode:'unified-detached',keepUnified:true,detachInteractables:true,autoPhysics:false,mascotAffordances:true,selectedId:'sample',stage:'ready',tableAssetId:null,objects:[{id:'sample',name:'Synthetic chair',icon:'X',role:'Seat',physics:'Unverified',interactive:true,detachable:true,visible:true,locked:false,state:'recorded',actions:['Sit','<script>not executable</script>'],mascot:'Recorded action',atlasId:'synthetic-source-id'}]};
fixture.objects.push({...fixture.objects[0],id:'second'});
const raw=Buffer.from('\ufeff \n'+JSON.stringify(fixture,null,3)+'\n');
const report={kind:'actual Chromium local semantic metadata',checks:[],errors:[],outsideRequests:[],limitations:['Synthetic saved metadata only; no meshes, physics, migrations or actual user records']};
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
 await page.locator('[data-semantic-file]').waitFor();
 await page.locator('.workspace-status').filter({hasText:/workspace loaded/}).waitFor();
 const one=s=>page.locator(s);
 await check('actual file selection safely renders recorded metadata without storage',async()=>{
  await one('[data-semantic-file]').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:raw});
  await one('[data-semantic-status]').filter({hasText:'Snapshot inspected locally'}).waitFor();
  assert.match(await one('[data-semantic-details]').textContent(),/Unverified/);
  assert.equal(await one('[data-foundry-module=semanticRoom] img').count(),0);
  await one('[data-foundry-module=semanticRoom]').screenshot({path:path.join(out,'semantic-explorer.png')});
  assert.equal(await one('[data-foundry-module=semanticRoom] script').count(),0);
  const stored=await page.evaluate(()=>JSON.stringify(localStorage));assert.ok(!stored.includes(fixture.sourceName));
 });
 await check('download reproduces exact original BOM whitespace and bytes',async()=>{
  const event=page.waitForEvent('download');await one('[data-semantic-export]').click();const download=await event;
  const data=fs.readFileSync(await download.path());assert.deepEqual(data,raw);report.originalSHA256=crypto.createHash('sha256').update(raw).digest('hex');report.exportSHA256=crypto.createHash('sha256').update(data).digest('hex');
 });
 await check('explicit typed edit changes only exact duplicate ID, with Undo/Redo and distinct derivative download',async()=>{
  const stored=await page.evaluate(()=>JSON.stringify(localStorage));
  await one('[data-semantic-select]').selectOption('second');
  assert.equal(await one('[data-semantic-role]').inputValue(),'Seat');
  await one('[data-semantic-visible]').uncheck();await one('[data-semantic-locked]').check();await one('[data-semantic-apply]').click();
  await one('[data-semantic-prepare]').click();const pending=page.waitForEvent('download');await one('[data-semantic-edited]').click();const download=await pending;
  const changed=JSON.parse(fs.readFileSync(await download.path(),'utf8')),expected=structuredClone(fixture);expected.objects[1].visible=false;expected.objects[1].locked=true;assert.deepEqual(changed,expected);
  const href=await one('[data-semantic-edited]').getAttribute('href');await one('[data-semantic-undo]').click();assert.equal(await one('[data-semantic-visible]').isChecked(),true);assert.equal(await one('[data-semantic-edited]').getAttribute('href'),null);assert.equal(await page.evaluate(async u=>{try{await fetch(u);return false}catch{return true}},href),true);
  await one('[data-semantic-apply]').click();assert.equal(await one('[data-semantic-redo]').isEnabled(),true);await one('[data-semantic-redo]').click();assert.equal(await one('[data-semantic-visible]').isChecked(),false);
  const original=page.waitForEvent('download');await one('[data-semantic-export]').click();assert.deepEqual(fs.readFileSync(await (await original).path()),raw);assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),stored);
  await one('[data-semantic-editor]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'semantic-authoring.png')});
 });
 await check('ambiguous replacement is refused while previous snapshot remains',async()=>{
  await one('[data-semantic-file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"objects":[],"objects":[]}')});
  await one('[data-semantic-status]').filter({hasText:'Rejected'}).waitFor();assert.match(await one('[data-semantic-details]').textContent(),/Unverified/);
 });
 await check('Valid replacement keeps current edits and export until explicit discard',async()=>{
  const file=one('[data-semantic-file]'),keep=one('[data-semantic-keep]'),discard=one('[data-semantic-discard]');
  await one('[data-semantic-prepare]').click();
  const previous=await one('[data-semantic-edited]').getAttribute('href');
  const replacement=Buffer.from(JSON.stringify({...fixture,sourceName:'Replacement scene'}));
  const choose=()=>file.setInputFiles({name:'replacement.json',mimeType:'application/json',buffer:replacement});
  await choose();await keep.waitFor();
  assert.equal(await keep.evaluate(button=>document.activeElement===button),true);
  await page.keyboard.press('Enter');await keep.waitFor({state:'hidden'});
  assert.equal(await one('[data-semantic-edited]').getAttribute('href'),previous);
  assert.equal(await one('[data-semantic-visible]').isChecked(),false);
  await choose();await discard.click();
  assert.match(await one('[data-semantic-summary]').textContent(),/Replacement scene/);
  assert.equal(await one('[data-semantic-undo]').isEnabled(),false);
  assert.equal(await page.evaluate(async u=>{try{await fetch(u);return false}catch{return true}},previous),true);
 });
 await check('real private-format capsule reveals and exports only its verified room value',async()=>{
  const os=require('node:os'),cp=require('node:child_process'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'athena-room-capsule-'));
  const selected={...fixture,sourceName:'Verified capsule Ω scene'},record='\ufeff \n'+JSON.stringify(selected,null,2)+'\n';
  const secret='non-room-capsule-marker-unsupported-export',source=path.join(temp,'values.json'),output=path.join(temp,'capsule.json');
  try{
   fs.writeFileSync(source,JSON.stringify({'ff-room-semantic-state':record,'ff.music-hub.v2':secret+'😀'+String.fromCharCode(0xd800)}));
   cp.execFileSync(process.env.PYTHON||'python',['-B','tools/foundry-recovery/capsule/capsule.py','pack',source,output]);
   const capsule=fs.readFileSync(output),file=one('[data-semantic-file]');await file.setInputFiles({name:'capsule.json',mimeType:'application/json',buffer:capsule});
   await one('[data-semantic-status]').filter({hasText:'Recovery capsule verified locally'}).waitFor();
   assert.match(await one('[data-semantic-summary]').textContent(),/Verified capsule Ω scene/);
   assert.ok(!(await one('[data-foundry-module=semanticRoom]').textContent()).includes(secret));
   const event=page.waitForEvent('download');await one('[data-semantic-export]').click();
   assert.deepEqual(fs.readFileSync(await (await event).path()),Buffer.from(record));
   const invalid=JSON.parse(capsule);invalid.entries.find(v=>v.key==='ff.music-hub.v2').value+='tamper';
   await file.setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});
   await one('[data-semantic-status]').filter({hasText:'checksum mismatch'}).waitFor();
   assert.match(await one('[data-semantic-summary]').textContent(),/Verified capsule Ω scene/);
   assert.ok(!(await page.evaluate(()=>JSON.stringify(localStorage))).includes(secret));
  }finally{fs.rmSync(temp,{force:true,recursive:true});}
 });
 await check('close revokes export and route navigation discards session',async()=>{
  const href=await one('[data-semantic-export]').getAttribute('href');await one('[data-semantic-role]').selectOption('Decoration');await one('[data-semantic-close]').click();await one('[data-semantic-discard]').click();assert.equal(await one('[data-semantic-export]').getAttribute('href'),null);
  assert.equal(await page.evaluate(async url=>{try{await fetch(url);return false}catch{return true}},href),true);
  await page.evaluate(()=>{location.hash='#home'});await one('[data-semantic-file]').waitFor({state:'detached'});await page.evaluate(()=>{location.hash='#build'});await one('[data-semantic-file]').waitFor();assert.equal(await one('[data-semantic-export]').getAttribute('href'),null);
 });
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
