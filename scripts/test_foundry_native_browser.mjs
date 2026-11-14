// Bounded real-browser/native-process acceptance. Only synthetic data is used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn, execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {repoRoot, binaryPath, pythonCommand} from '../native/foundry/tests/paths.mjs';
const out=path.join(repoRoot,'browser-results/foundry-native');
fs.mkdirSync(out,{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'athena native synthetic '));
const db=path.join(temporary,'synthetic.sqlite');
const report={platform:process.platform,scope:'Chromium → loopback Python bridge → native Rust SQLite executable; synthetic data, not desktop installer or private migration acceptance',checks:[],errors:[]};
let bridge,browser,context,page,exited,origin,stderr='';
const cli=(command,input)=>execFileSync(binaryPath,[command,db],{encoding:'utf8',input,timeout:15000});
async function check(name,fn){await fn();report.checks.push(name);}
async function startBridge(){
 bridge=spawn(pythonCommand,[path.join(repoRoot,'native/foundry/bridge.py'),'--binary',binaryPath,'--database',db]);
 exited=new Promise(resolve=>bridge.once('exit',resolve));
 bridge.stderr.on('data',chunk=>stderr+=chunk);
 return await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('Bridge startup timed out: '+stderr)),15000);
  bridge.once('error',error=>{clearTimeout(timeout);reject(error)});
  bridge.once('exit',()=>{clearTimeout(timeout);reject(Error('Bridge exited before ready: '+stderr))});
  let text='';bridge.stdout.on('data',chunk=>{text+=chunk;if(text.includes('\n')){clearTimeout(timeout);resolve(new URL(text.trim()).origin)}});
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
 cli('init');
 for(const suffix of ['history','soundtracks','transforms','scopes','environment','targets','instances','appearance','filters','origins','environments','blend-modes','music-precision'])cli('upgrade-'+suffix);
 origin=await startBridge();
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
 context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 page=await context.newPage();page.on('pageerror',error=>report.errors.push(String(error)));
 page.setDefaultTimeout(15000);
 await page.goto(origin+'/#build');await page.locator('.foundry-scene').waitFor();
 await check('Native profile loads without iframe or automatic playback',async()=>{
  assert.equal(await page.locator('.foundry-workspace iframe').count(),0);
  await page.locator('[data-native-save]').waitFor();
  assert.equal(await page.locator('[data-native-save]').count(),1);
  assert.equal(await page.locator('audio[autoplay],video[autoplay]').count(),0);
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
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  page=await context.newPage();page.on('pageerror',error=>report.errors.push(String(error)));page.setDefaultTimeout(15000);
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
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  page=await context.newPage();page.on('pageerror',error=>report.errors.push(String(error)));page.setDefaultTimeout(15000);
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
 assert.deepEqual(report.errors,[]);
 await page.screenshot({path:path.join(out,'native-profile.png'),fullPage:true});
 report.passed=true;
} catch(error){report.passed=false;report.failure=String(error.stack||error);if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1;}
finally {
 await browser?.close();
 await stopBridge().catch(error=>{report.passed=false;report.errors.push(String(error));process.exitCode=1;});
 report.bridgeStderr=stderr;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 fs.rmSync(temporary,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 console.log(JSON.stringify(report,null,2));
}
