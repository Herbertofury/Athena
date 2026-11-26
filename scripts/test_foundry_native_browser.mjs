import {readLearningUiOnce,readLearningOverviewOnce,readAcceptedReceipt} from './foundry-learning-diagnostic.mjs';
import {decodeJobReceipt} from '../engineering/apps/atlas-lab/ui/job-submit.mjs';
// Bounded real-browser/native-process acceptance. Only synthetic data is used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn, execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {repoRoot, binaryPath, pythonCommand} from '../native/foundry/tests/paths.mjs';
const unified=process.env.ATHENA_UNIFIED_ENGINE;
const suppliedPackage=process.env.ATHENA_TEST_PORTABLE_PACKAGE;
const portableUnified=Boolean(unified && (process.env.ATHENA_PORTABLE_UNIFIED==='1'||suppliedPackage));
const out=path.join(repoRoot,suppliedPackage?'browser-results/portable-artifact':unified?'browser-results/unified-native':'browser-results/foundry-native');
fs.mkdirSync(out,{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'athena native synthetic '));
const db=path.join(temporary,'synthetic.sqlite');
const portable=suppliedPackage?path.resolve(suppliedPackage):path.join(temporary,'portable');
const enginePackage=path.join(temporary,'engine-package'),journal=path.join(temporary,'journal.sqlite');
const report={platform:process.platform,scope:'Chromium → loopback Python bridge → native Rust SQLite executable; synthetic data, not desktop installer or private migration acceptance',checks:[],errors:[],networkFailures:[],httpFailures:[],externalRequests:[]};
let bridge,browser,context,page,exited,origin,stderr='';
const cli=(command,input)=>execFileSync(binaryPath,[command,db],{encoding:'utf8',input,timeout:15000});
async function check(name,fn){await fn();report.checks.push(name);}
async function startBridge(legacy=null){
 bridge=legacy?spawn(pythonCommand,['-B',path.join(portable,'bridge.py'),'--binary',binaryPath,'--database',db,
   '--runtime',path.join(portable,'runtime'),'--legacy-source',legacy.source,'--import-destination',legacy.destination],
   {cwd:temporary}):portableUnified?spawn(pythonCommand,['-B',path.join(portable,'launch.py'),'--database',db,'--journal',journal],{cwd:temporary}):unified?spawn(unified,['serve-unified',journal,enginePackage,db],{cwd:temporary}):spawn(pythonCommand,[path.join(portable,'launch.py'),'--database',db],{cwd:temporary});
 exited=new Promise(resolve=>bridge.once('exit',resolve));
 bridge.stderr.on('data',chunk=>stderr+=chunk);
 return await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('Bridge startup timed out: '+stderr)),15000);
  bridge.once('error',error=>{clearTimeout(timeout);reject(error)});
  bridge.once('exit',()=>{clearTimeout(timeout);reject(Error('Bridge exited before ready: '+stderr))});
  let text='';bridge.stdout.on('data',chunk=>{text+=chunk;if(text.includes('\n')){clearTimeout(timeout);resolve(unified?'http://127.0.0.1:41379':new URL(text.trim()).origin)}});
 });
}
async function stopBridge(){
 if(!bridge)return;
 const child=bridge;bridge=undefined;
 if(child.exitCode===null && child.signalCode===null)child.kill();
 let timer;
 try{await Promise.race([exited,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Bridge stop timed out')),10000)})]);}
 finally{clearTimeout(timer);}
 if(portableUnified){
  const open=()=>new Promise((resolve,reject)=>{const s=net.connect(41379,'127.0.0.1');s.setTimeout(1000);s.once('connect',()=>{s.destroy();resolve(true)});s.once('error',()=>resolve(false));s.once('timeout',()=>{s.destroy();reject(Error('Listener-close probe timed out'))})});
  let closed=false;for(let i=0;i<100;i++){if(!await open()){closed=true;break;}await new Promise(r=>setTimeout(r,50));}
  assert.ok(closed,'Engine listener survived portable launcher termination');
 }
}
try {
 const binarySha=createHash('sha256').update(fs.readFileSync(binaryPath)).digest('hex');
 if(!suppliedPackage)execFileSync(pythonCommand,['-B',path.join(repoRoot,'scripts/package_native.py'),'--source',path.join(repoRoot,'dist'),'--binary',binaryPath,'--binary-sha256',binarySha,'--platform',process.platform==='win32'?'windows':'linux','--output',portable,...(portableUnified?['--engine',unified,'--engine-sha256',createHash('sha256').update(fs.readFileSync(unified)).digest('hex')]:[])],{encoding:'utf8',timeout:30000});
 execFileSync(pythonCommand,['-B',path.join(portable,'launch.py'),'--verify-only'],{cwd:temporary,encoding:'utf8',timeout:15000});
 if(suppliedPackage){
  assert.ok(portableUnified,'Extracted artifact acceptance requires unified profile');
  const suffix=process.platform==='win32'?'.exe':'';
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(portable,'athena-foundry-store'+suffix))).digest('hex'),binarySha);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(portable,'atlas-lab'+suffix))).digest('hex'),createHash('sha256').update(fs.readFileSync(unified)).digest('hex'));
  report.checks.push('Extracted archive executables exactly match tested current build');
 }
 report.checks.push('Portable native package exact hashes verified outside source checkout');
 const initialized=JSON.parse(execFileSync(pythonCommand,[path.join(portable,'launch.py'),'--create-database',db],{cwd:temporary,encoding:'utf8',timeout:60000}));
 assert.equal(initialized.schema,15);assert.equal(initialized.integrity,'ok');
 report.checks.push('Explicit portable first-run creates verified new schema15 store without checkout commands');
 let offlineRun,offlineRaw;
 if(unified){
  offlineRun=JSON.parse(execFileSync(unified,['dedup-lab',journal],{encoding:'utf8',timeout:60000}));
  // Generated raw fixture proves display preserves integers beyond JS precision.
  offlineRaw=execFileSync(pythonCommand,['-c',`import sqlite3,sys
c=sqlite3.connect(sys.argv[1]); raw=c.execute('SELECT output FROM experiment_runs WHERE experiment_id=?',(int(sys.argv[2]),)).fetchone()[0]
raw='{\"large_integer\":18446744073709551617,'+raw[1:]
c.execute('UPDATE experiment_runs SET output=? WHERE experiment_id=?',(raw,int(sys.argv[2])));c.execute('UPDATE experiments SET candidate=? WHERE id=?',('<img src=x onerror=alert(1)>',int(sys.argv[2])));c.commit();c.close();sys.stdout.write(raw)`,journal,String(offlineRun.experiment_id)],{encoding:'utf8',timeout:15000});
  if(!portableUnified)execFileSync(pythonCommand,[path.join(repoRoot,'scripts/package_app.py'),'--profile','public-preview','--allowlist',path.join(repoRoot,'config/runtime-public-preview.json'),'--output',enginePackage],{cwd:repoRoot,timeout:30000});
  report.portableUnified=portableUnified;
  report.scope='Actual unified Rust evidence and Foundry native stores in one origin; synthetic fixtures, no private migration or installer acceptance';
 }
 origin=await startBridge();
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
 context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.externalRequests.push(route.request().url());return route.abort()});
 page=await context.newPage();page.on('pageerror',error=>report.errors.push(String(error)));
 page.on('requestfailed',request=>report.networkFailures.push({path:new URL(request.url()).pathname,error:request.failure()?.errorText}));
 page.on('response',response=>{if(response.status()>=400)report.httpFailures.push({path:new URL(response.url()).pathname,status:response.status()})});
 page.setDefaultTimeout(15000);
 if(unified)await check('Real Lab and native Foundry share one verified origin without iframe',async()=>{
  await page.goto(origin+'/#lab');await page.locator('#connection').filter({hasText:'Connected'}).waitFor();
  assert.equal(await page.locator('iframe').count(),0);
  const info=await (await context.request.get(origin+'/api/runtime')).json();assert.equal(info.application,'Athena');assert.equal(info.same_origin_only,true);
  assert.equal((await context.request.get(origin+'/__native/backup')).status(),403);
  assert.equal((await context.request.post(origin+'/__native/backup',{headers:{'X-Athena-Native':'1','Content-Type':'application/json','If-Match':'"empty"'},data:'{}'})).status(),403);
  assert.equal((await context.request.post(origin+'/api/jobs',{headers:{Origin:origin,'X-Athena-Native':'1'},data:{kind:'dedup'}})).status(),403);
 });
 if(portableUnified)await check('Extracted portable Athena browses exact offline frontier source evidence',async()=>{
  const evidencePath='/workspaces/engineering/research/frontier-observations.json';
  const events=[];
  const track=request=>{if(new URL(request.url()).pathname===evidencePath)events.push(request.url());};
  page.on('request',track);
  try{
   await page.goto(origin+'/#research');
   await page.locator('.workspace-status').filter({hasText:'Athena research workspace loaded.'}).waitFor();
   const panel=page.locator('#frontier-observations');
   const matches=panel.locator('[data-source-observation]');
   assert.equal(events.length,0);
   const loaded=page.waitForResponse(r=>new URL(r.url()).pathname===evidencePath);
   await panel.locator('summary').press('Space');
   const response=await loaded;
   assert.equal(response.status(),200);
   const payload=await response.body();
   assert.equal(createHash('sha256').update(payload).digest('hex'),
    createHash('sha256').update(fs.readFileSync(path.join(portable,'runtime',evidencePath.slice(1)))).digest('hex'));
   await panel.getByRole('status').filter({hasText:'64 of 64 source observations'}).waitFor();
   assert.equal(await matches.count(),64);
   await panel.getByLabel('Source batch').selectOption('releases');
   await panel.getByLabel('Search observations').fill('VulkanMod');
   assert.equal(await matches.count(),1);
   assert.equal(await matches.first().getByRole('link').getAttribute('href'),'https://github.com/xCollateral/VulkanMod/releases/tag/0.6.0');
   assert.equal(events.length,1);
   assert.equal(report.externalRequests.length,0);
  }finally{page.off('request',track);}
 });
 // Exercise actual Foundry readiness rather than waiting for unrelated document assets.
 await page.goto(origin+'/#build',{waitUntil:'commit'});
 await page.locator('.foundry-scene').waitFor();
 await page.locator('.workspace-status').filter({hasText:/workspace loaded/i}).waitFor();
 await check('Native profile loads without iframe or automatic playback',async()=>{
  assert.equal(await page.locator('.foundry-workspace iframe').count(),0);
  await page.locator('[data-native-save]').waitFor();
  assert.equal(await page.locator('[data-native-save]').count(),1);
  assert.equal(await page.locator('audio[autoplay],video[autoplay]').count(),0);
 });
 await check('Real semantic room replacement preserves edits until explicit discard',async()=>{
  const fixture={sourceName:'Original room',imported:true,importMode:'unified',keepUnified:true,detachInteractables:false,autoPhysics:false,mascotAffordances:false,selectedId:'chair',stage:'ready',tableAssetId:null,objects:[{id:'chair',name:'Chair',icon:'chair',role:'Couch / Seat',physics:'No collision',interactive:false,detachable:false,visible:true,locked:false,state:'recorded',actions:[],mascot:''}]};
  const one=selector=>page.locator(selector);
  const load=(sourceName)=>one('[data-semantic-file]').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...fixture,sourceName}))});
  await load('Original room');await one('[data-semantic-status]').filter({hasText:'Snapshot inspected locally'}).waitFor();
  await one('[data-semantic-visible]').uncheck();await one('[data-semantic-apply]').click();await one('[data-semantic-prepare]').click();
  const original=await one('[data-semantic-export]').getAttribute('href'),edited=await one('[data-semantic-edited]').getAttribute('href');
  assert.ok(original&&edited&&original!==edited);
  await load('Replacement room');
  const keep=one('[data-semantic-keep]'),discard=one('[data-semantic-discard]');
  await keep.waitFor();assert.equal(await keep.evaluate(button=>document.activeElement===button),true);
  await page.keyboard.press('Enter');await keep.waitFor({state:'hidden'});
  assert.equal(await one('[data-semantic-visible]').isChecked(),false);
  assert.equal(await one('[data-semantic-export]').getAttribute('href'),original);
  assert.equal(await one('[data-semantic-edited]').getAttribute('href'),edited);
  await load('Replacement room');await discard.click();
  assert.match(await one('[data-semantic-summary]').textContent(),/Replacement room/);
  assert.equal(await one('[data-semantic-visible]').isChecked(),true);
  await one('[data-semantic-locked]').check();await one('[data-semantic-close]').click();
  assert.equal(await one('[data-semantic-locked]').isChecked(),true);
  await discard.click();assert.equal(await one('[data-semantic-export]').getAttribute('href'),null);
 });
 if(unified)await check('Unified CSP allows explicit local PNG and synthetic video without external players',async()=>{
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=64;c.height=48;c.getContext('2d').fillRect(0,0,64,48);return c.toDataURL('image/png').split(',')[1]});
  await page.locator('[data-local-image-file]').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.locator('[data-local-image-view] img').evaluate(img=>img.decode());
  await page.locator('[data-local-image-route]').click();assert.equal(await page.locator('[data-local-image-surface] img').evaluate(i=>i.naturalWidth),64);
  await page.locator('[data-local-image-close]').click();
  const bytes=await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;
   const ctx=canvas.getContext('2d'),stream=canvas.captureStream(15),chunks=[];
   const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});let timer,deadline;
   try{return await new Promise((resolve,reject)=>{
    let frame=0;recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onerror=()=>reject(Error('synthetic recorder failed'));
    recorder.onstop=async()=>resolve(Array.from(new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer())));
    deadline=setTimeout(()=>reject(Error('synthetic recorder deadline')),10000);
    recorder.start();timer=setInterval(()=>{ctx.fillStyle=frame%2?'#204080':'#80c040';ctx.fillRect(0,0,160,90);ctx.fillStyle='#ffffff';ctx.fillRect((frame*7)%140,20,20,50);if(++frame===30){clearInterval(timer);recorder.stop()}},80);
   })}finally{clearInterval(timer);clearTimeout(deadline);if(recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(t=>t.stop())}
  });
  await page.locator('[data-local-video-file]').setInputFiles({name:'synthetic.webm',mimeType:'video/webm',buffer:Buffer.from(bytes)});
  await page.locator('[data-local-video-play]:not(:disabled)').waitFor();assert.equal(await page.locator('video').evaluate(v=>v.paused),true);
  await page.locator('video').evaluate(v=>v.addEventListener('playing',event=>{if(event.isTrusted)v.dataset.nativeTestPlaying='true'},{once:true}));
  await page.locator('[data-local-video-play]').click();await page.locator('video[data-native-test-playing="true"]').waitFor();
  await page.locator('[data-local-video-close]').click();assert.equal(report.externalRequests.length,0);
 });
 await check('Real UI edit saves schema9 workspace through native SQLite',async()=>{
  await page.locator('select[data-time]').selectOption('night');
  await page.locator('[data-inspect-rotation]').fill('45');
  await page.locator('[data-inspect-transform]').click();
  assert.equal(await page.locator('[data-inspect-rotation]').inputValue(),'45','rotation input immediately after Apply');
  await page.locator('[data-inspect-origin]').selectOption('tr');
  await page.locator('[data-origin-apply]').click();
  assert.equal(await page.locator('[data-inspect-origin]').inputValue(),'tr','origin input immediately after Apply');
  assert.equal(await page.locator('[data-inspect-rotation]').inputValue(),'45','rotation retained after origin upgrade');
  await page.locator('[data-native-save]').click();
  await page.locator('[data-native-status]').filter({hasText:'saved to native SQLite'}).waitFor();
  const stored=JSON.parse(cli('load-backup'));
  assert.equal(stored.version,9);assert.equal(stored.active.time,'night');
  assert.ok(Object.values(stored.active.placements).some(p=>p.rotation===45 && p.transformOrigin==='tr'),JSON.stringify(stored.active.placements));
 });
 await check('Named layouts keep independent multi-room transforms and scopes through native storage',async()=>{
  const firstRoom=await page.locator('select[data-room-select]').inputValue();
  await page.locator('[data-inspect-scale-x]').fill('-2');await page.locator('[data-inspect-scale-y]').fill('0.5');await page.locator('[data-inspect-transform]').click();
  await page.locator('[data-inspect-scope]').selectOption('sticker');await page.locator('[data-inspect-anchor]').selectOption('scene');await page.locator('[data-inspect-scope-apply]').click();
  await page.locator('[data-preset-name]').fill('Synthetic night room');await page.locator('[data-preset-save]').click();
  const secondRoom=await page.locator('select[data-room-select] option').nth(1).getAttribute('value');assert.notEqual(secondRoom,firstRoom);
  await page.locator('select[data-room-select]').selectOption(secondRoom);await page.locator('select[data-time]').selectOption('dusk');
  await page.locator('[data-inspect-rotation]').fill('-30');await page.locator('[data-inspect-transform]').click();
  await page.locator('[data-preset-name]').fill('Synthetic dusk room');await page.locator('[data-preset-save]').click();
  await page.locator('[data-preset-select]').selectOption({label:'Synthetic night room'});await page.locator('[data-preset-load]').click();
  assert.equal(await page.locator('select[data-room-select]').inputValue(),firstRoom);
  assert.equal(await page.locator('select[data-time]').inputValue(),'night');
  assert.equal(await page.locator('[data-inspect-scale-x]').inputValue(),'-2');assert.equal(await page.locator('[data-inspect-scale-y]').inputValue(),'0.5');
  assert.equal(await page.locator('[data-inspect-scope]').inputValue(),'sticker');
  await page.locator('[data-native-save]').click();await page.locator('[data-native-save]:not(:disabled)').waitFor();await page.locator('[data-native-status]').filter({hasText:'saved to native SQLite'}).waitFor();
  const backup=JSON.parse(cli('load-backup'));assert.equal(backup.savedLayouts.length,2);assert.deepEqual(backup.savedLayouts.map(p=>p.name),['Synthetic night room','Synthetic dusk room']);
  const night=backup.savedLayouts[0].layout,dusk=backup.savedLayouts[1].layout;assert.equal(night.roomId,firstRoom);assert.equal(dusk.roomId,secondRoom);assert.equal(dusk.time,'dusk');
  assert.ok(Object.values(night.placements).some(p=>p.rotation===45&&p.scaleX===-2&&p.scaleY===.5&&p.scope==='sticker'&&p.anchor==='scene'&&p.transformOrigin==='tr'));
  assert.ok(Object.values(dusk.placements).some(p=>p.rotation===-30));assert.equal(backup.layouts[secondRoom].time,'dusk');
 });
 await check('Review retained session state without saving or discarding inspector inputs',async()=>{
  const time=page.locator('select[data-time]'),draft=page.locator('[data-inspect-rotation]');
  assert.equal(await time.inputValue(),'night');
  await time.selectOption('dawn');
  await draft.fill('123');
  const history=page.locator('[data-session-history-list]');
  const row=history.locator('button[data-history-id]').filter({hasText:/^\d+\. past:/}).last();
  const review=row.locator('..').getByRole('button',{name:/^Review session state \d+$/});
  const summary=page.getByRole('region',{name:'Reviewed session state',exact:true});
  const workspaceState=()=>page.evaluate(()=>localStorage.getItem('athena-workspaces-v1'));
  const beforeReview=await workspaceState(),committed=cli('load-backup'),database=fs.readFileSync(db);
  assert.equal(JSON.parse(beforeReview).workspaces.build.active.time,'dawn');
  const writes=[];
  const observeWrite=request=>{if(!['GET','HEAD','OPTIONS'].includes(request.method()))writes.push(request.url());};
  page.on('request',observeWrite);
  try{
   await review.click();await summary.waitFor({state:'visible'});
   const heading=summary.getByRole('heading',{level:3});
   assert.equal(await heading.evaluate(el=>el===el.getRootNode().activeElement),true,'review transfers focus to summary');
   assert.match(await summary.textContent(),/Active room time: night/);
   await summary.getByText('Synthetic night room',{exact:true}).waitFor({state:'visible'});
   await summary.getByText('Synthetic dusk room',{exact:true}).waitFor({state:'visible'});
   assert.match(await summary.textContent(),/Jumping replaces the whole workspace and may discard unapplied inspector inputs/);
   assert.equal(await time.inputValue(),'dawn');assert.equal(await draft.inputValue(),'123');
   await summary.getByRole('button',{name:'Close review',exact:true}).click();
   await summary.waitFor({state:'hidden'});
   assert.equal(await review.evaluate(el=>el===el.getRootNode().activeElement),true,'close restores focus to the same Review button');
   assert.equal(await draft.inputValue(),'123');
   assert.equal(await workspaceState(),beforeReview,'review and close do not touch browser authoring data');
   assert.deepEqual(writes,[],'review and close issue no write requests');
   assert.equal(cli('load-backup'),committed);
   assert.deepEqual(fs.readFileSync(db),database);
   await review.click();await summary.getByRole('button',{name:'Jump to reviewed state',exact:true}).click();
   await summary.waitFor({state:'hidden'});
   assert.equal(await time.inputValue(),'night');assert.equal(await draft.inputValue(),'45');
   assert.equal(await page.locator('[data-redo]').isEnabled(),true);
   assert.equal(JSON.parse(await workspaceState()).workspaces.build.active.time,'night');
   assert.deepEqual(writes,[],'an explicit session jump writes only browser authoring data');
   assert.equal(cli('load-backup'),committed);
   assert.deepEqual(fs.readFileSync(db),database);
  }finally{page.off('request',observeWrite);}
 });
 const stored=JSON.parse(cli('load-backup'));
 await check('Fresh browser context restores persisted native data, not old browser storage',async()=>{
  await context.close();context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.externalRequests.push(route.request().url());return route.abort()});
  page=await context.newPage();page.on('pageerror',error=>report.errors.push(String(error)));
 page.on('requestfailed',request=>report.networkFailures.push({path:new URL(request.url()).pathname,error:request.failure()?.errorText}));
 page.on('response',response=>{if(response.status()>=400)report.httpFailures.push({path:new URL(response.url()).pathname,status:response.status()})});page.setDefaultTimeout(15000);
  await page.goto(origin+'/#build');await page.locator('.foundry-scene').waitFor();
  assert.equal(await page.locator('select[data-time]').inputValue(),'day');
  await page.locator('[data-native-load]').click();
  await page.locator('[data-native-status]').filter({hasText:'restored'}).waitFor();
  assert.equal(await page.locator('select[data-time]').inputValue(),'night');
  assert.deepEqual(JSON.parse(cli('load-backup')),stored);
 });
 await check('Stopped and relaunched native process restores committed state in a fresh browser',async()=>{
  await context.close();
  const beforeRestart=fs.readFileSync(db),savedText=cli('load-backup');
  await stopBridge();
  assert.deepEqual(fs.readFileSync(db),beforeRestart,'committed database unchanged after process termination');
  origin=await startBridge();
  assert.equal(cli('load-backup'),savedText,'native restart preserves exact committed backup');
  assert.deepEqual(fs.readFileSync(db),beforeRestart,'startup does not rewrite database');
  context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.externalRequests.push(route.request().url());return route.abort()});
  page=await context.newPage();page.on('pageerror',error=>report.errors.push(String(error)));
 page.on('requestfailed',request=>report.networkFailures.push({path:new URL(request.url()).pathname,error:request.failure()?.errorText}));
 page.on('response',response=>{if(response.status()>=400)report.httpFailures.push({path:new URL(response.url()).pathname,status:response.status()})});page.setDefaultTimeout(15000);
  await page.goto(origin+'/#build');await page.locator('.foundry-scene').waitFor();
  assert.equal(await page.locator('select[data-time]').inputValue(),'day');
  await page.locator('[data-native-load]').click();await page.locator('[data-native-status]').filter({hasText:'restored'}).waitFor();
  assert.equal(await page.locator('select[data-time]').inputValue(),'night');
  assert.equal(await page.locator('[data-inspect-rotation]').inputValue(),'45');
  assert.equal(await page.locator('[data-inspect-origin]').inputValue(),'tr');
  assert.equal(cli('load-backup'),savedText);
 });
 await check('Restarted named layouts can be removed and undone without mutating native backup',async()=>{
  const committed=cli('load-backup');
  assert.equal(await page.locator('[data-preset-select] option').count(),2);
  await page.locator('[data-preset-select]').selectOption({label:'Synthetic dusk room'});await page.locator('[data-preset-load]').click();
  assert.equal(await page.locator('select[data-time]').inputValue(),'dusk');assert.equal(await page.locator('[data-inspect-rotation]').inputValue(),'-30');
  await page.locator('[data-preset-select]').selectOption({label:'Synthetic dusk room'});await page.locator('[data-preset-remove]').click();assert.equal(await page.locator('[data-preset-select] option').count(),1);
  await page.locator('[data-undo]').click();assert.equal(await page.locator('[data-preset-select] option').count(),2);
  assert.equal(cli('load-backup'),committed,'browser-only authoring does not implicitly save native storage');
 });
 await check('Concurrent writer conflict retains newer native state and browser edit',async()=>{
  const newer=structuredClone(stored);newer.active.time='dusk';
  cli('save-backup',JSON.stringify(newer));
  const written=cli('load-backup'),beforeConflict=fs.readFileSync(db);
  assert.equal(JSON.parse(written).active.time,'dusk');
  await page.locator('select[data-time]').selectOption('day');await page.locator('[data-native-save]').click();
  await page.locator('[data-native-status]').filter({hasText:'Save conflict'}).waitFor();
  assert.equal(await page.locator('select[data-time]').inputValue(),'day');
  assert.equal(cli('load-backup'),written);
  assert.deepEqual(fs.readFileSync(db),beforeConflict);
  await page.locator('[data-native-load]').click();
  await page.locator('[data-native-status]').filter({hasText:'restored'}).waitFor();
  assert.equal(await page.locator('select[data-time]').inputValue(),'dusk');
 });
 await check('Leaving and reopening Foundry preserves native restore capability',async()=>{
  await page.locator('[data-nav="research"]').click();await page.locator('.foundry-scene').waitFor({state:'detached'});
  await page.locator('[data-nav="build"]').click();await page.locator('.foundry-scene').waitFor();
  await page.locator('[data-native-load]').click();await page.locator('[data-native-status]').filter({hasText:'restored'}).waitFor();
  assert.equal(await page.locator('select[data-time]').inputValue(),'dusk');
 });
 await check('Actual browser bookmark authoring, conflict, scoped clearing and native restart',async()=>{
  const beforeExternal=report.externalRequests.length;
  const theme=await page.locator('[data-theme-select]').inputValue();
  const first=await page.locator('[data-room-select]').inputValue();
  const second=await page.locator('[data-room-select] option').evaluateAll((options,first)=>options.map(o=>o.value).find(v=>v!==first),first);
  assert.ok(second);
  const request=async(method,endpoint,body,token)=>page.evaluate(async({method,endpoint,body,token})=>{
   const headers={'X-Athena-Native':'1'};
   if(body!==undefined)headers['Content-Type']='application/json';
   if(token!==undefined)headers['If-Match']=token;
   const response=await fetch(endpoint,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
   return {status:response.status,etag:response.headers.get('ETag'),value:await response.json()};
  },{method,endpoint,body,token});
  const read=room=>{assert.match(theme,/^[a-z0-9-]{1,100}$/);assert.match(room,/^[a-z0-9:-]{1,100}$/);return request('GET','/__native/soundtrack/'+theme+'/'+room)};
  const saveUI=async(room,label)=>{
   await page.locator('[data-room-select]').selectOption(room);
   await page.locator('[data-soundtrack-save]:not(:disabled)').waitFor();
   await page.locator('[data-soundtrack-provider]').selectOption('youtube');
   await page.locator('[data-soundtrack-url]').fill('https://music.youtube.com/watch?v=synthetic');
   await page.locator('[data-soundtrack-label]').fill(label);
   await page.locator('[data-soundtrack-save]').click();
   await page.locator('[data-soundtrack-status]').filter({hasText:'Public bookmark saved locally'}).waitFor();
   assert.equal((await read(room)).value.assignment.label,label);
  };
  await saveUI(first,'Synthetic browser Café 音楽');
  await saveUI(second,'Synthetic untouched second room');
  const other=await read(second);
  await page.locator('[data-room-select]').selectOption(first);
  await page.locator('[data-soundtrack-save]:not(:disabled)').waitFor();
  const initial=await read(first);
  assert.equal(initial.status,200);assert.ok(initial.etag);
  const newer=await request('POST','/__native/assign-soundtrack',{theme_id:theme,room_id:first,provider:'youtube',url:'https://music.youtube.com/watch?v=synthetic',label:'Synthetic concurrent assignment'},initial.etag);
  assert.equal(newer.status,200);
  await page.locator('[data-soundtrack-label]').fill('Synthetic retained draft');
  await page.locator('[data-soundtrack-save]').click();
  await page.locator('[data-soundtrack-status]').filter({hasText:'Bookmark not confirmed'}).waitFor();
  assert.equal(await page.locator('[data-soundtrack-label]').inputValue(),'Synthetic retained draft');
  assert.equal((await read(first)).value.assignment.label,'Synthetic concurrent assignment');
  const beforeStale=fs.readFileSync(db);
  assert.equal((await request('POST','/__native/clear-soundtrack',{theme_id:theme,room_id:first},initial.etag)).status,409);
  assert.deepEqual(fs.readFileSync(db),beforeStale);
  const cleared=await request('POST','/__native/clear-soundtrack',{theme_id:theme,room_id:first},newer.etag);
  assert.equal(cleared.status,200);assert.equal(cleared.value,null);
  assert.deepEqual(await read(second),other);
  await page.locator('[data-soundtrack-refresh]').click();
  await page.locator('[data-soundtrack-status]').filter({hasText:'No native soundtrack bookmark assigned'}).waitFor();
  assert.equal(await page.locator('[data-soundtrack-label]').inputValue(),'Synthetic retained draft');
  const stable=fs.readFileSync(db);
  assert.equal((await request('POST','/__native/clear-soundtrack',{theme_id:theme,room_id:first},cleared.etag)).status,200);
  assert.deepEqual(fs.readFileSync(db),stable);
  await stopBridge();origin=await startBridge();
  await page.goto(origin+'/#build');await page.locator('.foundry-scene').waitFor();
  assert.equal((await read(first)).value,null);assert.deepEqual(await read(second),other);
  assert.equal(await page.locator('audio[autoplay],video[autoplay]').count(),0);
  assert.ok(await page.locator('audio,video').evaluateAll(nodes=>nodes.every(node=>node.paused)));
  assert.equal(report.externalRequests.length,beforeExternal,'bookmark workflow must not request a provider');
 });
 await check('Local soundtrack starts only on Play and stops when leaving its room',async()=>{
  const select=page.locator('[data-room-select]'),one=await select.inputValue();
  const two=await select.locator('option').evaluateAll((options,current)=>options.find(o=>o.value!==current)?.value,one);
  assert.ok(two);
  const wave=Buffer.alloc(44+32000),sampleRate=8000;
  wave.write('RIFF',0);wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);
  wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(1,22);
  wave.writeUInt32LE(sampleRate,24);wave.writeUInt32LE(sampleRate*2,28);
  wave.writeUInt16LE(2,32);wave.writeUInt16LE(16,34);wave.write('data',36);wave.writeUInt32LE(wave.length-44,40);
  for(let i=0;i<(wave.length-44)/2;i++) wave.writeInt16LE(Math.round(600*Math.sin(2*Math.PI*440*i/sampleRate)),44+i*2);
  const writes=[],observe=request=>{if(!['GET','HEAD'].includes(request.method()))writes.push(request.url());};
  const external=report.externalRequests.length;
  page.on('request',observe);
  try{
   const picker=page.locator('[data-soundtrack-local-file]');
   const status=page.locator('[data-soundtrack-local-status]');
   const player=page.locator('[data-soundtrack-local-player] audio');
   await picker.setInputFiles({name:'synthetic-audio.wav',mimeType:'audio/wav',buffer:wave});
   await status.filter({hasText:'Press Play'}).waitFor();
   assert.equal(await player.evaluate(node=>node.paused&&node.currentTime===0&&!node.autoplay),true);
   await page.locator('[data-soundtrack-local-play]').click();
   await status.filter({hasText:'Browser is playing the local preview'}).waitFor();
   // Check actual playback clock movement, never infer playing from a pending promise.
   await player.evaluate(node=>new Promise((ok,no)=>{
    if(node.currentTime>0)return ok();
    const t=setTimeout(()=>no(Error('Audio clock did not advance')),1000);
    node.addEventListener('timeupdate',()=>{clearTimeout(t);ok();},{once:true});
   }));
   const old=await player.elementHandle();
   await select.selectOption(two);
   await status.filter({hasText:'Local preview closed when leaving the room'}).waitFor();
   assert.equal(await player.count(),0);
   assert.equal(await old.evaluate(node=>node.paused&&!node.hasAttribute('src')&&!node.isConnected),true);
   assert.deepEqual(writes,[]);
   assert.equal(report.externalRequests.length,external);
  }finally{page.off('request',observe);}
 });
 if(unified)await check('Native read-only Learning History survives restart and exposes exact retained run',async()=>{
  const runtime=await (await fetch(origin+'/api/runtime')).json();assert.equal(runtime.learning_history_url,'/learning');
  await page.goto(origin+'/learning');await page.locator('#records li').first().waitFor();
  assert.ok((await page.locator('#records button').first().textContent()).includes('<img src=x onerror=alert(1)>'));assert.equal(await page.locator('#records img').count(),0);
  await page.locator('#records button').first().click();
  await page.locator('#detail summary').filter({hasText:'Complete run'}).waitFor();
  const full=await page.locator('#detail pre').last().textContent();assert.equal(full,offlineRaw);assert.ok(full.includes('"large_integer":18446744073709551617'));
  await page.reload();await page.locator('#detail summary').filter({hasText:'Complete run'}).waitFor();
  assert.equal(await page.locator('#detail pre').last().textContent(),offlineRaw);
  assert.equal((await fetch(origin+'/api/learning/history?before=0')).status,400);
  assert.equal((await fetch(origin+'/api/learning/history/999999')).status,404);
  assert.equal((await fetch(origin+'/api/learning/history',{method:'POST',headers:{Origin:origin,'x-atlas-request':'local-ui'}})).status,405);
  assert.equal(await page.locator('iframe').count(),0);
  const readinessWrites=[];const observeReadiness=request=>{if(new URL(request.url()).origin===origin&&!['GET','HEAD'].includes(request.method()))readinessWrites.push(request.method()+' '+request.url());};
  page.on('request',observeReadiness);
  await page.locator('nav a').filter({hasText:'Migration readiness'}).click();
  await page.locator('#projects article').nth(3).waitFor();
  assert.equal(await page.locator('#projects article').count(),4);
  assert.ok((await page.locator('#scope').textContent()).includes('not a new live repository audit'));
  assert.equal(await page.locator('button').count(),0);
  const snapshotResponse=await fetch(origin+'/api/migration/readiness');const snapshotText=await snapshotResponse.text();
  assert.equal(snapshotResponse.headers.get('x-athena-snapshot-sha256'),createHash('sha256').update(snapshotText).digest('hex'));
  assert.equal(JSON.parse(snapshotText).retirement_certified,false);
  assert.equal(await page.locator('#projects a[href^="https://github.com/Herbertofury/Athena/blob/"]').count(),9);
  const foundryReadiness=page.locator('#projects article').filter({has:page.getByRole('heading',{name:'Feature Foundry',exact:true})});
  assert.match(await foundryReadiness.textContent(),/Recorded evidence · Original v24 release custody/);
  assert.match(await foundryReadiness.textContent(),/Still open · Non-Git records and owner data/);
  assert.match(await foundryReadiness.textContent(),/Still open · Native and rights acceptance/);
  assert.equal(await foundryReadiness.locator('a[href*="/64954a16f8af349c27a2652649882d4ec0e3450a/"]').count(),2);
  assert.equal(await page.locator('#projects a[href="/#continuity"]').count(),1);
  assert.match(await page.locator('#snapshot').textContent(),/verified SHA-256/);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#evidence-download').click()]);
  assert.equal(download.suggestedFilename(),'Athena-Migration-Evidence.json');
  const savedEvidence=path.join(out,'migration-evidence.json');
  await download.saveAs(savedEvidence);
  assert.deepEqual(fs.readFileSync(savedEvidence),Buffer.from(snapshotText,'utf8'));
  await page.selectOption('#project-filter','foundry');
  await page.selectOption('#gate-filter','open');
  assert.equal(await page.locator('#projects article:visible').count(),1);
  assert.equal(await foundryReadiness.locator('section:visible').count(),2);
  await page.fill('#evidence-search','rights');
  assert.equal(await foundryReadiness.locator('section:visible').count(),1);
  await page.fill('#evidence-search','no such gate here');
  assert.equal(await page.locator('#projects article:visible').count(),0);
  assert.match(await page.locator('#status').textContent(),/No matching gates/);
  await page.goto(origin+'/migration?source=foundry&view=open');
  await page.locator('#controls').waitFor();
  assert.equal(await page.locator('#projects article:visible').count(),1);
  assert.equal(await page.locator('#gate-filter').inputValue(),'open');
  await page.route('**/api/migration/readiness',route=>route.fulfill({
    status:200,contentType:'application/json',headers:{'x-athena-snapshot-sha256':'0'.repeat(64)},body:snapshotText,
  }));
  await page.goto(origin+'/migration');
  await page.getByText('Evidence checksum mismatch. No evidence was displayed or saved.',{exact:true}).waitFor();
  assert.equal(await page.locator('#projects article').count(),0);
  assert.equal(await page.locator('#evidence-download').isVisible(),false);
  await page.unroute('**/api/migration/readiness');
  await page.goto(origin+'/migration');
  await page.locator('#projects article').nth(3).waitFor();
  await page.screenshot({path:path.join(out,'migration-readiness.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(out,'migration-readiness-narrow.png'),fullPage:true});
  await page.getByRole('link',{name:'Browse recovered Engineering-Atlas evidence'}).click();
  await page.getByText('19 of 19 historical targets · 18 with offline notes',{exact:true}).waitFor();
  await page.fill('#search','upstream-validation-lab results-table.md');
  assert.equal(await page.locator('#targets article:visible').count(),2);
  await page.getByRole('button',{name:'Read offline: results-table.md'}).first().click();
  await page.locator('#reader-status').filter({hasText:'Verified original Git blob'}).waitFor();
  const asset='c2472667b88a1ff28814b40cd056c861b0cd7e38/results-table.md';
  const archiveDoc=await fetch(origin+'/api/migration/atlas/'+asset);
  assert.equal(archiveDoc.headers.get('content-type'),'text/plain; charset=utf-8');
  assert.equal(archiveDoc.headers.get('x-content-type-options'),'nosniff');
  assert.equal(await page.locator('#document').textContent(),await archiveDoc.text());
  assert.equal(await page.locator('#reader iframe, #reader img, #reader script').count(),0);
  await page.screenshot({path:path.join(out,'atlas-archive-narrow.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.route('**/api/migration/atlas/'+asset,route=>route.fulfill({status:200,body:'Not the original document.'}));
  await page.getByRole('button',{name:'Read offline: results-table.md'}).first().click();
  await page.locator('#reader-status').filter({hasText:'Git blob checksum mismatch'}).waitFor();
  assert.equal(await page.locator('#document').textContent(),'');
  await page.unroute('**/api/migration/atlas/'+asset);
  await page.fill('#search','');
  await page.selectOption('#scope','index');
  assert.equal(await page.locator('#targets article:visible').count(),1);
  assert.equal(await page.locator('#targets article:visible button').count(),0);
  const blockedApp=origin+'/api/migration/atlas/67c4eff92b07230c1a9385028f8d2e539dbabdac/run_pinned_audit.py';
  assert.equal((await fetch(blockedApp)).status,404);
  assert.equal((await fetch(origin+'/api/migration/atlas',{method:'POST',headers:{Origin:origin,'x-atlas-request':'local-ui'}})).status,405);
  await page.setViewportSize({width:1440,height:1000});
  assert.deepEqual(readinessWrites,[]);page.off('request',observeReadiness);
  assert.equal((await fetch(origin+'/api/migration/readiness',{method:'POST',headers:{Origin:origin,'x-atlas-request':'local-ui'}})).status,405);
  await page.goto(origin+'/migration?source=constellation');
  const archiveAPI=origin+'/api/migration/constellation/review';
  await page.getByRole('link',{name:'Review an original Constellation export'}).click();
  await page.waitForLoadState('load');
  assert.equal(await page.locator('#review').isDisabled(),true);
  // Other startup/worker GETs must not be mistaken for the act of submitting a file.
  // The capture below still inspects all new URLs, origins, methods and body presence.
  const archiveRequests=[];
  const trackArchive=request=>archiveRequests.push({method:request.method(),url:request.url(),body:request.postDataBuffer()});
  page.on('request',trackArchive);
  const summarizeArchiveRequests=()=>archiveRequests.map(r=>({method:r.method,url:r.url,hasBody:r.body!==null}));
  const verifyNoArchiveDisclosure=()=>assert.ok(archiveRequests.every(r=>new URL(r.url).origin===origin&&!r.url.includes('fixture-private-marker-never-render')),JSON.stringify(summarizeArchiveRequests()));
  const reviewTraffic=()=>archiveRequests.filter(r=>!['GET','HEAD'].includes(r.method)||r.url.startsWith(archiveAPI)||r.body!==null);
  const exportBody=Object.fromEntries('providers projects chats turns turnRevisions outputSnapshots files knowledgeItems knowledgeSources projectContinuity events checkpoints syncReceipts catalogRuns'.split(' ').map(key=>[key,[]]));
  Object.assign(exportBody,{schema:'project-constellation',schemaVersion:7,summary:{events:12001,checkpoints:0},events:Array.from({length:12000},()=>({})),meta:{token:'fixture-private-marker-never-render'}});
  Object.assign(exportBody.summary,{files:1,outputSnapshots:0,continuityProjects:0,turnRevisions:1,chats:1,turns:1});
  exportBody.files=[{id:'fixture-private-marker-never-render',filename:'fixture-private-marker-never-render'}];
  exportBody.chats=[{id:'chat-a'}];exportBody.turns=[{id:'turn-a',chatId:'chat-a'}];
  exportBody.turnRevisions=[{id:'revision-a',chatId:'different-chat',turnId:'turn-a'}];
  const exportBytes=Buffer.from(JSON.stringify(exportBody));
  await page.locator('#source').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:exportBytes});
  verifyNoArchiveDisclosure();
  assert.deepEqual(reviewTraffic(),[],JSON.stringify(summarizeArchiveRequests()));
  await page.getByRole('button',{name:'Run local review'}).click();
  await page.getByText('Review complete. Nothing was imported or changed.',{exact:true}).waitFor();
  verifyNoArchiveDisclosure();
  assert.deepEqual(reviewTraffic().map(r=>[r.method,r.url]),[['POST',archiveAPI]],JSON.stringify(summarizeArchiveRequests()));
  if(reviewTraffic()[0].body!==null)assert.deepEqual(reviewTraffic()[0].body,exportBytes);
  assert.match(await page.locator('#digest').textContent(),new RegExp(createHash('sha256').update(exportBytes).digest('hex')));
  assert.match(await page.locator('#collections').textContent(),/Source reported [\d,]+ · 1 omitted/);
  await page.locator('#collections article').filter({has:page.getByRole('heading',{name:'files',exact:true})}).getByText('Source reported 1 · 0 omitted.',{exact:true}).waitFor();
  await page.getByText('Revisions naming a different chat than their turn: 1',{exact:true}).waitFor();
  assert.equal((await page.locator('main').textContent()).includes('fixture-private-marker-never-render'),false);
  await page.selectOption('#filter','needs');
  assert.match(await page.locator('#coverage').textContent(),/5 of 18 collections/);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(out,'constellation-v7-review-narrow.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#source').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{')});
  await page.getByRole('button',{name:'Run local review'}).click();
  await page.getByText('Invalid v7 export structure',{exact:true}).waitFor();
  const mislabeled=Buffer.from(JSON.stringify({...exportBody,summary:{...exportBody.summary,files:2}}));
  await page.locator('#source').setInputFiles({name:'mismatched.json',mimeType:'application/json',buffer:mislabeled});
  await page.getByRole('button',{name:'Run local review'}).click();
  await page.getByText('Source collection does not match its reported total or the v7 export bounds',{exact:true}).waitFor();
  assert.equal(await page.locator('#results').isHidden(),true);
  verifyNoArchiveDisclosure();
  assert.equal(await page.locator('#results').isVisible(),false);
  page.off('request',trackArchive);
  const sample={method:'POST',headers:{'x-atlas-request':'local-ui','content-type':'application/json'},body:'{}'};
  assert.equal((await fetch(origin+'/api/migration/constellation/review',{...sample,headers:{...sample.headers,Origin:'https://example.invalid'}})).status,403);
  assert.equal((await fetch(origin+'/api/migration/constellation/review',{...sample,headers:{...sample.headers,Origin:origin,'content-type':'text/plain'}})).status,415);
  await page.goto(origin+'/learning');
  await page.locator('#records li').first().waitFor();
  const beforeRuns=await (await fetch(origin+'/api/learning/history')).json();
  let submissions=0;await page.route('**/api/jobs',async route=>{submissions++;await route.continue();});
  let observedAcceptedId=null,status5xx=null;
  const observeResponse=response=>{
   const url=new URL(response.url()), method=response.request().method(), status=response.status();
   if(url.origin!==origin)return;
   if(method==='POST'&&url.pathname==='/api/jobs'&&status===200){
    void readAcceptedReceipt(response).then(id=>{observedAcceptedId=id;});
   }else if(method==='GET'&&/^\/api\/learning\/jobs\/[1-9]\d{0,18}$/.test(url.pathname)&&status>=500&&status<=599){
    status5xx={status,id:url.pathname.split('/').at(-1)};
   }
  };
  page.on('response',observeResponse);
  try{
   await page.locator('#run-experiment').click();await page.locator('#run-experiment').evaluate(button=>button.click());
   await page.locator('#run-status').filter({hasText:'Complete experiment history is retained'}).waitFor({timeout:90000});
  }catch(error){
   if(status5xx){
    const id=observedAcceptedId===status5xx.id?observedAcceptedId:null;
    const [ui,queue]=await Promise.all([
     readLearningUiOnce(page),
     readLearningOverviewOnce(origin,id)
    ]);
    report.learningJobDiagnostic={phase:'await-retained-job',category:'job-status-http-5xx',status:status5xx.status,acceptanceMatched:id!==null,ui,queue};
   }
   throw error;
  }finally{page.off('response',observeResponse);}
  assert.equal(submissions,1);await page.unroute('**/api/jobs');
  const afterRuns=await (await fetch(origin+'/api/learning/history')).json();
  assert.equal(afterRuns.records.length,beforeRuns.records.length+1);
  const retainedId=afterRuns.records[0].id;
  const retained=await (await fetch(origin+'/api/learning/history/'+retainedId)).json();
  assert.equal(retained.run_state,'retained');assert.ok(retained.run.includes('evidence'));
  const comparisonWrites=[];const observeComparison=request=>{if(new URL(request.url()).origin===origin&&!['GET','HEAD'].includes(request.method()))comparisonWrites.push(request.method()+' '+request.url());};
  page.on('request',observeComparison);
  await page.locator('#pin-comparison').click();await page.locator('#pin-comparison').click();
  assert.ok((await page.locator('#comparison-result').textContent()).includes('Same record selected'));
  await page.locator('#records button').filter({hasText:'<img src=x onerror=alert(1)>'}).click();
  await page.waitForFunction(id=>document.querySelectorAll('.comparison-grid .record-panel')[1]?.dataset.recordId===id,String(offlineRun.experiment_id));
  assert.equal(await page.locator('.comparison-grid .record-panel').count(),2);
  assert.equal(await page.locator('.comparison-grid .record-panel').first().locator('pre').last().textContent(),retained.run);
  assert.equal(await page.locator('.comparison-grid .record-panel').last().locator('pre').last().textContent(),offlineRaw);
  assert.ok((await page.locator('#comparison-result').textContent()).includes('run: retained text differs'));
  assert.equal(await page.locator('#detail img').count(),0);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(out,'learning-comparison-narrow.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:path.join(out,'learning-comparison.png'),fullPage:true});
  await page.locator('#clear-comparison').click();assert.equal(await page.locator('.comparison-grid').count(),0);
  assert.equal(await page.locator('#detail pre').last().textContent(),offlineRaw);
  assert.deepEqual(comparisonWrites,[]);page.off('request',observeComparison);
  await page.locator('#pin-comparison').click();await page.reload();await page.locator('#detail summary').filter({hasText:'Complete run'}).waitFor();
  assert.equal(await page.locator('#clear-comparison').isDisabled(),true);assert.equal(await page.locator('.comparison-grid').count(),0);
  const beforeInstance=(await (await fetch(origin+'/api/runtime')).json()).engine_instance;
  await stopBridge();origin=await startBridge();
  assert.notEqual((await (await fetch(origin+'/api/runtime')).json()).engine_instance,beforeInstance);
  await page.goto(origin+'/learning#'+retainedId);await page.reload();
  await page.locator('#detail summary').filter({hasText:'Complete run'}).waitFor();
  assert.equal(await page.locator('#detail pre').last().textContent(),retained.run);
  await page.screenshot({path:path.join(out,'learning-history.png'),fullPage:true});
  let uncertainSubmissions=0,acceptedStatus,acceptedReceipt;
  await page.route('**/api/jobs',async route=>{uncertainSubmissions++;const accepted=await route.fetch();acceptedStatus=accepted.status();acceptedReceipt=await accepted.text();await route.abort('failed');});
  await page.locator('#run-experiment').click();
  await page.locator('#run-status').filter({hasText:'Submission outcome is unconfirmed'}).waitFor();
  assert.equal(await page.locator('#run-experiment').isDisabled(),true);
  await page.locator('#run-experiment').evaluate(button=>button.click());
  assert.equal(uncertainSubmissions,1);assert.equal(acceptedStatus,200);
  const acceptedId=decodeJobReceipt(acceptedReceipt).id;
  const acceptedState=await fetch(origin+'/api/learning/jobs/'+acceptedId);assert.equal(acceptedState.status,200);assert.equal((await acceptedState.json()).id,acceptedId);
  await page.unroute('**/api/jobs');
  // Lost status is distinct from lost acceptance. Never automatically resubmit.
  await page.reload();await page.locator('#records li').first().waitFor();
  let statusSubmissions=0;await page.route('**/api/jobs',async route=>{statusSubmissions++;await route.continue();});
  await page.route('**/api/learning/jobs/*',route=>route.abort('failed'));
  await page.locator('#run-experiment').click();
  await page.locator('#run-status').filter({hasText:'was accepted, but status is unconfirmed'}).waitFor();
  assert.equal(await page.locator('#run-experiment').isDisabled(),true);assert.equal(statusSubmissions,1);
  await page.unroute('**/api/jobs');await page.unroute('**/api/learning/jobs/*');

 });
 if(unified)await check('Engineering-Atlas offline run ledger preserves both observations and exact workflow IDs',async()=>{
  const endpoint=origin+'/api/migration/atlas-runs',before=report.externalRequests.length;
  const stored=await (await fetch(endpoint)).json();
  assert.equal(stored.runs.length,522);assert.equal(stored.repeated_ids,509);assert.equal(stored.changed_readings,2);
  assert.equal(stored.early.sha256,'5e19fabe50551bb3bcf7f122f5eee9d3c0326c0ec230c6858e0605a128726f65');
  assert.equal(stored.later.sha256,'b1321421c23f0600be368d997231786287e4173e9f483eeb191022d16ff72f05');
  await page.goto(origin+'/migration/atlas');
  await page.getByRole('link',{name:'Recorded workflow runs',exact:true}).click();
  const status=page.locator('#status');
  await status.filter({hasText:'Showing 1–25 of 522'}).waitFor();
  assert.equal(await page.locator('#records article').count(),25);
  await page.getByRole('button',{name:'Next 25',exact:true}).click();
  await status.filter({hasText:'Showing 26–50 of 522'}).waitFor();
  assert.equal(await page.locator('#run-heading').evaluate(node=>document.activeElement===node),true);
  await page.locator('#scope').selectOption('changed');
  await status.filter({hasText:'Showing 1–2 of 2'}).waitFor();
  for(const e of await page.locator('#records article').all()){
   const line=await e.textContent();assert.match(line,/Nov 7: in progress · Nov 14: success/);
  }
  await page.locator('#scope').selectOption('failed');
  await status.filter({hasText:'Showing 1–25 of 49'}).waitFor();
  await page.locator('#scope').selectOption('later');
  await status.filter({hasText:'Showing 1–13 of 13'}).waitFor();
  await page.locator('#scope').selectOption('');
  await page.locator('#search').fill('42334871509');
  await status.filter({hasText:'Showing 1–1 of 1'}).waitFor();
  await page.getByText('Commit and original run link',{exact:true}).click();
  const link=page.getByRole('link',{name:'Open original GitHub run',exact:true});
  assert.equal(await link.getAttribute('href'),'https://github.com/Herbertofury/Engineering-Atlas/actions/runs/42334871509');
  await page.getByText('Pinned snapshots and checksums',{exact:true}).click();
  assert.equal(await page.getByRole('link',{name:'View pinned source',exact:true}).count(),2);
  assert.equal((await fetch(endpoint,{method:'POST',headers:{Origin:origin,'x-atlas-request':'local-ui'}})).status,405);
  assert.equal(report.externalRequests.length,before);
 });
 if(unified)await check('Native artist index filters original artist worlds without disclosing media',async()=>{
  const endpoint=origin+'/api/migration/foundry-artists',external=report.externalRequests.length;
  const payload=await (await fetch(endpoint)).text(),index=JSON.parse(payload);
  assert.equal(index.source_sha256,'474f3e14c57539e86afb9d9352674e9ee4d4b652c9a9e7cab961f8e651f8b920');
  assert.deepEqual(index.coverage,{artists:5,worlds:10,districts:20,weather:20,timeflow:20,music_routes:21});
  assert.doesNotMatch(payload,/local_filename|spotify_uri|open_search|instagram|tiktok/);
  await page.goto(origin+'/migration?source=foundry');
  await page.getByRole('link',{name:'Foundry artist index',exact:true}).click();
  const status=page.locator('#status');
  await status.filter({hasText:'Showing 5 of 5 artists.'}).waitFor();
  await page.getByRole('searchbox',{name:'Artist, world, district or weather'}).fill('Sporelight Marsh');
  await status.filter({hasText:'Showing 1 of 5 artists.'}).waitFor();
  const card=page.locator('#artists article:visible');
  await card.getByRole('heading',{name:'Frawgy',exact:true}).waitFor();
  await card.getByText('Districts (4)',{exact:true}).click();
  await card.getByText(/Sporelight Marsh/).waitFor();
  assert.equal(await page.locator('#artists img,#artists iframe,#artists audio,#artists video').count(),0);
  assert.equal((await fetch(endpoint,{method:'POST',headers:{Origin:origin,'x-atlas-request':'local-ui'}})).status,405);
  assert.equal(report.externalRequests.length,external);
 });
 if(unified)await check('Native artist concept lighting and weather compare and export matching PNGs without requests or storage writes',async()=>{
  const modulePath='/migration/foundry-artists/concept.mjs';
  const requested=[],outbound=report.externalRequests.length;
  const track=req=>{if(new URL(req.url()).pathname===modulePath)requested.push(req.url());};
  page.on('request',track);
  try{
   await page.goto(origin+'/migration/foundry-artists');
   await page.locator('#status').filter({hasText:'Showing 5 of 5 artists.'}).waitFor();
   assert.equal(requested.length,0);
   const baseline=await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));
   const open=page.getByRole('button',{name:'Preview Frawgy worlds',exact:true});
   await open.focus();await page.keyboard.press('Enter');
   const preview=page.locator('#concept');
   await preview.getByRole('status').filter({hasText:'Verdant Conservatory · Clear study'}).waitFor();
   assert.equal(await page.locator('#concept-title').evaluate(e=>e===document.activeElement),true);
   assert.equal(requested.length,1);
   const frame=selector=>page.locator(selector+' canvas').evaluate(e=>e.toDataURL());
   const clear=await frame('#primary');
   assert.ok(clear.length>2048);
   await preview.getByLabel('Weather study').selectOption('weather.frawgy.spore-shower');
   const weather=await frame('#primary');
   assert.notEqual(weather,clear);
   await preview.getByLabel('Compare both variants').check();
   await preview.getByRole('heading',{name:'Lilypad Nocturne',exact:true}).waitFor();
   assert.notEqual(await frame('#alternate'),weather);
   for(const [figure,world] of [['#primary','Verdant Conservatory'],['#alternate','Lilypad Nocturne']]){
    const pending=page.waitForEvent('download');
    await preview.getByRole('button',{name:'Save '+world+' concept PNG',exact:true}).click();
    const file=await pending, chunks=[];
    assert.match(file.suggestedFilename(),/^athena-concept-world\.frawgy\.[a-z-]+--weather\.frawgy\.spore-shower\.png$/);
    for await(const chunk of await file.createReadStream())chunks.push(chunk);
    const bytes=Buffer.concat(chunks);
    assert.equal(bytes.readUInt32BE(16),640);
    assert.equal(bytes.readUInt32BE(20),320);
    assert.deepEqual(bytes,Buffer.from((await frame(figure)).split(',')[1],'base64'));
    await file.delete();
   }
   assert.equal(await preview.locator('.swatches span').count(),10);
   const light=preview.getByLabel('Lighting phase');
   assert.equal(await light.locator('option').count(),5);
   const companionBefore=await frame('#alternate');
   await light.selectOption('time.frawgy.dusk');
   await preview.getByRole('status').filter({hasText:'Dusk'}).waitFor();
   assert.notEqual(await frame('#primary'),weather);
   assert.notEqual(await frame('#alternate'),companionBefore);
   const [phased]=await Promise.all([page.waitForEvent('download'),
    preview.getByRole('button',{name:'Save Verdant Conservatory concept PNG',exact:true}).click()]);
   assert.match(phased.suggestedFilename(),/--weather\.frawgy\.spore-shower--time\.frawgy\.dusk\.png$/);
   const phasedChunks=[];
   for await(const chunk of await phased.createReadStream())phasedChunks.push(chunk);
   assert.deepEqual(Buffer.concat(phasedChunks),Buffer.from((await frame('#primary')).split(',')[1],'base64'));
   await phased.delete();
   await light.selectOption('');
   assert.equal(await frame('#primary'),weather);
   assert.equal(await frame('#alternate'),companionBefore);

   await preview.getByLabel('Weather study').selectOption('');
   assert.equal(await frame('#primary'),clear);
   await preview.getByRole('button',{name:'Close preview',exact:true}).click();
   assert.equal(await open.evaluate(e=>e===document.activeElement),true);
   await page.getByRole('button',{name:'Preview Dreamrelicc worlds',exact:false}).click();
   await preview.getByRole('status').filter({hasText:'Cathedral Orbit · Clear study'}).waitFor();
   assert.notEqual(await frame('#primary'),clear);
   assert.equal(requested.length,1,'Optional module loaded once in this page');
   assert.equal(await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}})),baseline);
   assert.equal(report.externalRequests.length,outbound);
   assert.equal(await preview.locator('img,iframe,audio,video').count(),0);
  }finally{page.off('request',track);}
 });
 await check('Continuity refresh reveals a second tab revision without losing the selected file',async()=>{
  const other=await context.newPage();
  const selectFile=(tab,name,contents)=>tab.locator('[data-artifact-file]').setInputFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(contents)});
  const openJournal=async tab=>{
   await tab.goto(origin+'/#continuity');
   await tab.locator('[data-artifacts-open]').click();
   await tab.locator('[data-artifact-status]').filter({hasText:'Local journal opened'}).waitFor();
  };
  try{
   await openJournal(page);
   await selectFile(page,'fixture-original.bin','original bytes');
   await page.locator('[data-artifact-save]').click();
   await page.locator('[data-artifact-history] p').filter({hasText:'Revision 1:'}).waitFor();
   const id=await page.locator('[data-artifact-target] option').nth(1).getAttribute('value');
   assert.ok(id);
   await page.locator('[data-artifact-target]').selectOption(id);await selectFile(page,'not-retained.bin','selected only');
   await openJournal(other);
   await other.locator('[data-artifact-target]').selectOption(id);await selectFile(other,'other-tab.bin','another revision');
   await other.locator('[data-artifact-save]').click();
   await other.locator('[data-artifact-history] p').filter({hasText:'Revision 2:'}).waitFor();
   assert.equal(await page.locator('[data-artifact-history] p').filter({hasText:'Revision 2:'}).count(),0);
   await page.locator('[data-artifact-refresh]').click();
   await page.locator('[data-artifact-history] p').filter({hasText:'Revision 2: other-tab.bin'}).waitFor();
   assert.equal(await page.locator('[data-artifact-target]').inputValue(),id);
   assert.equal(await page.locator('[data-artifact-file]').evaluate(input=>input.files[0].name),'not-retained.bin');
   assert.equal(await page.locator('[data-artifact-history] p').count(),2);
  }finally{await other.close();}
 });
 await check('Continuity whole artifact backup restores exact history in a fresh browser profile',async()=>{
  const imported=await browser.newContext({acceptDownloads:true});
  await imported.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.externalRequests.push(route.request().url());return route.abort();});
  const restored=await imported.newPage();restored.setDefaultTimeout(15000);restored.on('pageerror',error=>report.errors.push(String(error)));
  const select=(page,bytes)=>page.locator('[data-artifact-restore-file]').setInputFiles({name:'journal.athart',mimeType:'application/octet-stream',buffer:bytes});
  const exportBundle=async page=>{
   const [file]=await Promise.all([page.waitForEvent('download'),page.locator('[data-artifact-backup]').click()]);
   assert.equal(file.suggestedFilename(),'athena-artifact-journal.athart');return fs.readFileSync(await file.path());
  };
  const rows=page=>page.locator('[data-artifact-history] p');
  try{
   const original=await exportBundle(page);
   await restored.goto(origin+'/#continuity');
   await restored.locator('[data-artifacts-open]').click();
   await restored.locator('[data-artifact-status]').filter({hasText:'Local journal opened'}).waitFor();
   assert.equal(await rows(restored).count(),0);
   const damaged=Buffer.from(original);damaged[damaged.length-1]^=255;
   await select(restored,damaged);
   await restored.locator('[data-artifact-restore]').click();
   await restored.getByText(/Restore refused: backup integrity/).waitFor();
   assert.equal(await rows(restored).count(),0);
   await select(restored,original);
   await restored.locator('[data-artifact-restore]').click();
   await restored.getByText('Restored 2 missing revisions; 0 identical revisions already present.').waitFor();
   assert.equal(await rows(restored).count(),2);
   assert.equal(await restored.locator('[data-artifact-target] option').nth(1).getAttribute('value'),await page.locator('[data-artifact-target] option').nth(1).getAttribute('value'));
   assert.deepEqual(await exportBundle(restored),original);
   await restored.reload();await restored.locator('[data-artifacts-open]').click();await rows(restored).nth(1).waitFor();
   const [revision]=await Promise.all([restored.waitForEvent('download'),restored.getByRole('button',{name:'Download exact revision',exact:true}).first().click()]);
   assert.equal(revision.suggestedFilename(),'fixture-original.bin');assert.equal(fs.readFileSync(await revision.path(),'utf8'),'original bytes');
   await select(restored,original);
   await restored.locator('[data-artifact-restore]').click();
   await restored.getByText('Restored 0 missing revisions; 2 identical revisions already present.').waitFor();
   assert.equal(await rows(restored).count(),2);
   const target=restored.locator('[data-artifact-target]');
   await target.selectOption(await target.locator('option').nth(1).getAttribute('value'));
   await restored.locator('[data-artifact-file]').setInputFiles({name:'diverged.bin',mimeType:'application/octet-stream',buffer:Buffer.from('different extension')});
   await restored.locator('[data-artifact-save]').click();await rows(restored).nth(2).waitFor();
   const conflict=await exportBundle(restored);
   await page.locator('[data-artifact-file]').setInputFiles({name:'unrelated-name.bin',mimeType:'application/octet-stream',buffer:Buffer.from('other independently appended bytes')});
   await page.locator('[data-artifact-save]').click();await rows(page).nth(2).waitFor();
   await select(page,conflict);await page.locator('[data-artifact-restore]').click();
   await page.getByText('Backup conflicts with retained history. No revision changed.').waitFor();
   assert.equal(await rows(page).count(),3);
   assert.match(await rows(page).nth(2).textContent(),/unrelated-name/);
  }finally{await imported.close();}
 });
 await check('Explicit stopped-profile backup preserves native workspace and soundtrack library',async()=>{
  await stopBridge();
  const before=fs.readFileSync(db),backup=path.join(temporary,'native-backup.sqlite');
  const savedWorkspace=cli('load-backup'),savedMusic=cli('list-native-soundtracks');
  const receipt=JSON.parse(execFileSync(pythonCommand,[path.join(portable,'launch.py'),'--backup-database',db,'--backup-destination',backup,'--source-quiescent'],{cwd:temporary,encoding:'utf8',timeout:60000}));
  assert.equal(receipt.backed_up,true);assert.equal(receipt.restored,false);assert.deepEqual(fs.readFileSync(db),before);
  for(const [command,expected] of [['load-backup',savedWorkspace],['list-native-soundtracks',savedMusic]])assert.equal(execFileSync(binaryPath,[command,backup],{encoding:'utf8',timeout:15000}),expected);
 });
 if(!unified)await check('Actual v24 dry-run report renders selected fields without writing any source or destination',async()=>{
  const source=path.join(temporary,'legacy fixture.sqlite');
  const destination=path.join(temporary,'migration must not exist.sqlite');
  execFileSync(pythonCommand,['-B',path.join(repoRoot,'native/foundry/tests/legacy_fixture.py'),source],
   {encoding:'utf8',timeout:15000});
  const beforeSource=fs.readFileSync(source),beforeNative=fs.readFileSync(db),requests=[];
  origin=await startBridge({source,destination});
  await page.goto(origin+'/#build');
  const panel=page.locator('[data-foundry-module="legacyImport"]');
  await panel.locator('[data-legacy-review]').waitFor();
  assert.equal(await panel.locator('[data-legacy-import]').isDisabled(),true);
  const observer=request=>{if(request.url().includes('/__native/legacy-'))requests.push(request.method());};
  page.on('request',observer);
  try{
   await panel.locator('[data-legacy-review]').click();
   await panel.getByText('Theme IDs and names: 0 exact, 1 changed',{exact:true}).waitFor();
   await panel.getByText('Room IDs and names: 0 exact, 1 changed',{exact:true}).click();
   assert.equal(await panel.getByText('Only in Athena: 33',{exact:true}).isVisible(),true);
   assert.match(await panel.textContent(),/Raw catalog rows, media, materials and behavior are not verified/);
   await panel.getByText('Other migration counts and exclusions',{exact:true}).click();
   assert.equal(await panel.getByText('Raw catalog rows not copied: 3',{exact:true}).isVisible(),true);
   assert.equal(await panel.locator('[data-legacy-import]').isEnabled(),true);
   await panel.screenshot({path:path.join(out,'legacy-catalog-review.png')});
  }finally{page.off('request',observer);await stopBridge();}
  assert.deepEqual(requests,['GET']);assert.equal(fs.existsSync(destination),false);
  assert.deepEqual(fs.readFileSync(source),beforeSource);assert.deepEqual(fs.readFileSync(db),beforeNative);
 });
 assert.deepEqual(report.errors,[]);
 await page.screenshot({path:path.join(out,'native-profile.png'),fullPage:true});
 report.passed=true;
} catch(error){report.passed=false;report.failure=String(error.stack||error);if(page)report.mediaFailure=await page.locator('video').evaluateAll(xs=>xs.map(v=>({readyState:v.readyState,paused:v.paused,ended:v.ended,time:v.currentTime,duration:v.duration,error:v.error?.message||null,playingEvent:v.dataset.nativeTestPlaying||null}))).catch(()=>[]);if(page)report.foundryStartup=await page.evaluate(()=>{
 const scene=document.querySelector('.foundry-scene');
 const style=[...document.querySelectorAll('link[rel="stylesheet"]')].find(e=>e.href.endsWith('/workspaces/foundry/style.css'));
 const completed=performance.getEntriesByType('resource').filter(resource=>{const u=new URL(resource.name);return u.origin===location.origin&&u.pathname.startsWith('/workspaces/foundry/');}).slice(0,32).map(resource=>({name:new URL(resource.name).pathname.split('/').pop(),durationMs:Math.round(resource.duration),status:resource.responseStatus||null}));
 return {readyState:document.readyState,
  workspace:document.querySelector('main')?.dataset.workspace||null,
  sceneHeight:scene?.getBoundingClientRect().height??null,
  stylesheetApplied:Boolean(style?.sheet),
  mountedSections:[...document.querySelectorAll('[data-foundry-module]')].slice(0,18).map(el=>({name:el.dataset.foundryModule,populated:el.childElementCount>0})),
  completed};
}).catch(()=>null);if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1;}
finally {
 await browser?.close();
 await stopBridge().catch(error=>{report.passed=false;report.errors.push(String(error));process.exitCode=1;});
 report.bridgeStderr=stderr;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 fs.rmSync(temporary,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 console.log(JSON.stringify(report,null,2));
}
