// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const address=pathToFileURL(resolve('Athena-Midnight-City-Walk.html')).href;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({offline:true,viewport:{width:1200,height:920}});
 const errors=[],requests=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 page.on('request',r=>requests.push(r.url()));
 await page.clock.install();await page.goto(address);
 await page.clock.pauseAt(new Date(Date.now()+1000));
 const start=page.getByLabel('Practice start'),go=page.getByRole('button',{name:'Go to practice start'});
 const stage=page.locator('#map'),location=page.locator('#scene'),point=page.locator('#point');
 assert.equal(await start.locator('option').count(),5);
 for(const key of ['hideout','garage','club','warehouse-a']){
  const choices=await start.locator('option').evaluateAll(rows=>rows.map(r=>r.value));
  assert.ok(choices.includes(key),choices.join(', '));
  await start.selectOption(key);await go.click();
  const outdoors=await point.textContent();
  const pictured=await stage.evaluate(e=>e.toDataURL());
  const name=(await page.locator('#target').textContent()).trim();
  assert.notEqual(name,'None in reach');
  await page.keyboard.press('e');
  assert.equal(await location.textContent(),name);
  assert.notEqual(await stage.evaluate(e=>e.toDataURL()),pictured);
  if(key==='hideout'){
   await page.keyboard.down('ArrowDown');
   await page.clock.runFor(405);
   await page.keyboard.up('ArrowDown');
   assert.match(await page.locator('#target').textContent(),/Exit to street/);
   await page.getByRole('button',{name:'Exit to street',exact:true}).click();
   assert.equal(await point.textContent(),outdoors);
   assert.equal(await stage.evaluate(e=>e.toDataURL()),pictured);
  }
 }
 assert.deepEqual(requests,[address]);assert.deepEqual(errors,[]);
 console.log('Offline city opened, four real doors reached and entered, keyboard walked Hideout exit, exact street return; no external requests.');
}finally{await browser.close();}
