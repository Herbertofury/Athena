// Bounded real-browser/native-process acceptance. Only synthetic data is used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn, execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {repoRoot, binaryPath, pythonCommand} from '../native/foundry/tests/paths.mjs';
const unified=process.env.ATHENA_UNIFIED_ENGINE;
const out=path.join(repoRoot,unified?'browser-results/unified-native':'browser-results/foundry-native');
fs.mkdirSync(out,{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'athena native synthetic '));
const db=path.join(temporary,'synthetic.sqlite');
const portable=path.join(temporary,'portable');
const enginePackage=path.join(temporary,'engine-package'),journal=path.join(temporary,'journal.sqlite');
const report={platform:process.platform,scope:'Chromium → loopback Python bridge → native Rust SQLite executable; synthetic data, not desktop installer or private migration acceptance',checks:[],errors:[],networkFailures:[],httpFailures:[],externalRequests:[]};
let bridge,browser,context,page,exited,origin,stderr='';
const cli=(command,input)=>execFileSync(binaryPath,[command,db],{encoding:'utf8',input,timeout:15000});
async function check(name,fn){await fn();report.checks.push(name);}
async function startBridge(){
 bridge=unified?spawn(unified,['serve-unified',journal,enginePackage,db],{cwd:temporary}):spawn(pythonCommand,[path.join(portable,'launch.py'),'--database',db],{cwd:temporary});
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
}
try {
 const binarySha=createHash('sha256').update(fs.readFileSync(binaryPath)).digest('hex');
 execFileSync(pythonCommand,['-B',path.join(repoRoot,'scripts/package_native.py'),'--source',path.join(repoRoot,'dist'),'--binary',binaryPath,'--binary-sha256',binarySha,'--platform',process.platform==='win32'?'windows':'linux','--output',portable],{encoding:'utf8',timeout:30000});
 execFileSync(pythonCommand,['-B',path.join(portable,'launch.py'),'--verify-only'],{cwd:temporary,encoding:'utf8',timeout:15000});
 report.checks.push('Portable native package exact hashes verified outside source checkout');
 const initialized=JSON.parse(execFileSync(pythonCommand,[path.join(portable,'launch.py'),'--create-database',db],{cwd:temporary,encoding:'utf8',timeout:60000}));
 assert.equal(initialized.schema,15);assert.equal(initialized.integrity,'ok');
 report.checks.push('Explicit portable first-run creates verified new schema15 store without checkout commands');
 if(unified){
  execFileSync(pythonCommand,[path.join(repoRoot,'scripts/package_app.py'),'--profile','public-preview','--allowlist',path.join(repoRoot,'config/runtime-public-preview.json'),'--output',enginePackage],{cwd:repoRoot,timeout:30000});
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
 await page.goto(origin+'/#build');await page.locator('.foundry-scene').waitFor();
 await check('Native profile loads without iframe or automatic playback',async()=>{
  assert.equal(await page.locator('.foundry-workspace iframe').count(),0);
  await page.locator('[data-native-save]').waitFor();
  assert.equal(await page.locator('[data-native-save]').count(),1);
  assert.equal(await page.locator('audio[autoplay],video[autoplay]').count(),0);
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
 await check('Explicit stopped-profile backup preserves native workspace and soundtrack library',async()=>{
  await stopBridge();
  const before=fs.readFileSync(db),backup=path.join(temporary,'native-backup.sqlite');
  const savedWorkspace=cli('load-backup'),savedMusic=cli('list-native-soundtracks');
  const receipt=JSON.parse(execFileSync(pythonCommand,[path.join(portable,'launch.py'),'--backup-database',db,'--backup-destination',backup,'--source-quiescent'],{cwd:temporary,encoding:'utf8',timeout:60000}));
  assert.equal(receipt.backed_up,true);assert.equal(receipt.restored,false);assert.deepEqual(fs.readFileSync(db),before);
  for(const [command,expected] of [['load-backup',savedWorkspace],['list-native-soundtracks',savedMusic]])assert.equal(execFileSync(binaryPath,[command,backup],{encoding:'utf8',timeout:15000}),expected);
 });
 assert.deepEqual(report.errors,[]);
 await page.screenshot({path:path.join(out,'native-profile.png'),fullPage:true});
 report.passed=true;
} catch(error){report.passed=false;report.failure=String(error.stack||error);if(page)report.mediaFailure=await page.locator('video').evaluateAll(xs=>xs.map(v=>({readyState:v.readyState,paused:v.paused,ended:v.ended,time:v.currentTime,duration:v.duration,error:v.error?.message||null,playingEvent:v.dataset.nativeTestPlaying||null}))).catch(()=>[]);if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1;}
finally {
 await browser?.close();
 await stopBridge().catch(error=>{report.passed=false;report.errors.push(String(error));process.exitCode=1;});
 report.bridgeStderr=stderr;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 fs.rmSync(temporary,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 console.log(JSON.stringify(report,null,2));
}
