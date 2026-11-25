import test from 'node:test';
import assert from 'node:assert/strict';
import {copyFile,mkdir,mkdtemp,readFile,rename,rm,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {buildAtlas} from '../build-atlas.mjs';

test('real Chromium opens the moved file offline, plots authored roads and tours doors',async t=>{
 const root=await mkdtemp(resolve(tmpdir(),'athena-city-atlas-'));
 let browser;
 t.after(async()=>{try{await browser?.close();}finally{await rm(root,{recursive:true,force:true});}});
 const before=resolve(root,'first atlas.html'),file=resolve(root,'independently moved atlas.html');
 await buildAtlas(before);await rename(before,file);
 const bytes=await readFile(file);await assert.rejects(buildAtlas(file),e=>e.code==='EEXIST');
 assert.deepEqual(await readFile(file),bytes);
 browser=await chromium.launch();
 const calls=[],errors=[];
 const page=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
 page.on('request',r=>{if(!r.url().startsWith('file:'))calls.push(r.url());});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(file).href);
 await page.waitForFunction(()=>document.querySelector('#route-status').textContent.includes('3,580'));
 assert.equal(await page.locator('[data-node]').count(),30);
 assert.equal(await page.locator('[data-door]').count(),4);
 assert.equal(await page.locator('#active-route').getAttribute('points'),'340,1820 710,1820 710,1420 710,980 710,560 1180,560 1680,560 2160,560 2660,560');
 const output=resolve(process.env.ATHENA_CITY_ATLAS_EVIDENCE||root,'evidence');
 await mkdir(output,{recursive:true});
 await page.screenshot({path:resolve(output,'01-desktop-route.png'),fullPage:true});
 await page.locator('[data-node="6"]').focus();await page.keyboard.press('Enter');
 await page.locator('[data-node="6"]').focus();await page.keyboard.press('Space');
 assert.equal(await page.locator('#from').inputValue(),'6');assert.equal(await page.locator('#to').inputValue(),'6');
 assert.match(await page.locator('#route-status').textContent(),/^0 map units/);
 await page.selectOption('#from','0');await page.selectOption('#to','29');await page.click('#route');
 assert.match(await page.locator('#route-status').textContent(),/^3,580 map units/);
 await page.selectOption('#door','garage');await page.click('#enter');
 assert.match(await page.locator('#door-status').textContent(),/Inside Midtown Garage · spawn 310, 312/);
 assert.equal(await page.locator('#floorplan').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'exit');
 await page.screenshot({path:resolve(output,'02-original-garage.png'),fullPage:true});
 await page.click('#exit');
 assert.match(await page.locator('#door-status').textContent(),/Returned outside at 640, 1886/);
 assert.equal(await page.locator('#floorplan').isVisible(),false);
 assert.equal(await page.locator('#x').inputValue(),'640');assert.equal(await page.locator('#y').inputValue(),'1886');
 await page.locator('#x').fill('-1');await page.click('#inspect');
 assert.match(await page.locator('#point-status').textContent(),/outside authored world/);
 await page.click('#zoom-in');assert.notEqual(await page.locator('#city-map').getAttribute('viewBox'),'0 0 3200 2200');
 await page.click('#zoom-reset');assert.equal(await page.locator('#city-map').getAttribute('viewBox'),'0 0 3200 2200');
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.screenshot({path:resolve(output,'03-mobile.png'),fullPage:true});
 assert.deepEqual(calls,[]);assert.deepEqual(errors,[]);
});


test('portable HTML is byte-identical with Windows-style checkout line endings',async t=>{
 const root=await mkdtemp(resolve(tmpdir(),'athena-atlas-eol-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const replica=resolve(root,'replica'),actual=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 for(const rel of ['build-atlas.mjs','build-topology.mjs','LICENSE','src/city-topology.mjs','src/explore.mjs','preview/atlas.css','preview/atlas.html','preview/atlas-ui.mjs','upstream/gamesync/game-openworld.js']){
  const dst=resolve(replica,rel);await mkdir(dirname(dst),{recursive:true});
  if(rel.startsWith('upstream/'))await copyFile(resolve(actual,rel),dst);
  else await writeFile(dst,(await readFile(resolve(actual,rel),'utf8')).replace(/\r?\n/g,'\r\n'));
 }
 const {buildAtlas:windowsStyle}=await import(pathToFileURL(resolve(replica,'build-atlas.mjs')));
 const a=resolve(root,'initial.html'),b=resolve(root,'replica.html');
 await buildAtlas(a);await windowsStyle(b);assert.deepEqual(await readFile(b),await readFile(a));
});
