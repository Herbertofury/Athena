/* Actual Chromium native layer navigation; synthetic neutral scene only. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-layers');
const report={kind:'actual Chromium native layer navigation',checks:[],errors:[],outsideRequests:[],limitations:['Native surface groups and position pin do not claim original left/right worlds or lock parity']};
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
 await page.locator('[data-inspect-blend]').waitFor();
 await page.locator('.workspace-status').filter({hasText:/workspace loaded/}).waitFor();
 const one=s=>page.locator(s);



 await one('[data-layer-groups]').waitFor();const original=await one('[data-inspect-object]').inputValue();await one('[data-instance-duplicate]').click();const copy=await one('[data-inspect-object]').inputValue();assert.notEqual(copy,original);const row=id=>page.locator('[data-layer-id="'+id+'"]');
 await check('layer rows expose exact duplicate identities and hidden filtered selection without unintended history',async()=>{assert.match(await row(copy).textContent(),new RegExp(copy));await row(copy).locator('[data-layer-action="visible"]').click();assert.equal(await one('[data-inspect-visible]').isChecked(),false);await row(original).locator('[data-layer-action="select"]').click();await page.locator('.topbar #search').fill('no-such-instance');await row(copy).locator('[data-layer-action="select"]').click();assert.equal(await one('[data-inspect-object]').inputValue(),copy);assert.match(await row(copy).textContent(),/filtered/);await row(copy).locator('[data-layer-action="visible"]').click();assert.equal(await one('[data-inspect-visible]').isChecked(),true);await one('[data-undo]').click();assert.equal(await one('[data-inspect-visible]').isChecked(),false);await one('[data-redo]').click();assert.equal(await one('[data-inspect-visible]').isChecked(),true);await page.locator('.topbar #search').fill('');await row(copy).locator('[data-layer-action="pin"]').click();assert.equal(await one('[data-inspect-pin]').isChecked(),true);await one('[data-undo]').click();assert.equal(await one('[data-inspect-pin]').isChecked(),false);});
 await check('focused keyboard action survives same-room edits and room switch retires prior nodes',async()=>{
  const pin=row(copy).locator('[data-layer-action="pin"]');
  const handle=await pin.elementHandle();await pin.focus();await page.keyboard.press('Space');
  assert.equal(await handle.evaluate(el=>el.isConnected&&el===el.getRootNode().activeElement),true);
  assert.equal(await pin.getAttribute('aria-pressed'),'true');
  assert.match(await handle.evaluate(el=>el.getRootNode().getElementById(el.getAttribute('aria-describedby')).textContent),new RegExp(copy));
  await page.keyboard.press('Space');assert.equal(await pin.getAttribute('aria-pressed'),'false');
  await row(copy).locator('[data-layer-action="select"]').click();
  await pin.focus();
  await one('[data-instance-back]').evaluate(el=>el.click());
  assert.equal(await handle.evaluate(el=>el.isConnected&&el===el.getRootNode().activeElement),true);
  const room=one('[data-room-select]'),old=await room.inputValue();await room.selectOption({index:1});
  assert.equal(await handle.evaluate(el=>el.isConnected),false);
  await room.selectOption(old);assert.equal(await pin.count(),1);
 });
 await one('[data-layer-groups]').screenshot({path:path.join(out,'layers.png')});
 await check('dark and light layer action states remain readable at narrow width',async()=>{
  const panel=one('[data-foundry-module="layers"]'),first=panel.locator('[data-layer-id]').first();
  await page.setViewportSize({width:375,height:860});
  await panel.scrollIntoViewIfNeeded();
  const dark=await panel.evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.equal(dark,'rgb(9, 9, 9)');
  const action=first.locator('[data-layer-action="select"]');
  await action.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const geometry=await first.evaluate(row=>{
   const buttons=[...row.querySelectorAll('button')],style=getComputedStyle(row);
   const rect=row.getBoundingClientRect();
   return {keyboard:buttons[0]===row.getRootNode().activeElement,rowFits:rect.left>=0&&rect.right<=innerWidth,sizes:buttons.map(b=>b.getBoundingClientRect().height),
    outline:getComputedStyle(buttons[0]).outlineStyle,wrapping:style.flexWrap};
  });
  const skipStyle=await one('.skip').evaluate(el=>{const s=getComputedStyle(el);return [s.clipPath,s.pointerEvents];});
  assert.deepEqual(skipStyle,['inset(50%)','none']);
  const {sizes,...traits}=geometry;
  assert.deepEqual(traits,{keyboard:true,rowFits:true,outline:'solid',wrapping:'wrap'});
  assert.ok(sizes.every(h=>h>=44),'Layer action heights: '+sizes.join(', '));
  await panel.evaluate(el=>el.closest('.foundry-workspace').dataset.theme='light');
  assert.equal(await panel.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(245, 247, 250)');
  await panel.screenshot({path:path.join(out,'layers-light-narrow.png')});
  await panel.evaluate(el=>el.closest('.foundry-workspace').dataset.theme='dark');
  await panel.screenshot({path:path.join(out,'layers-dark-narrow.png')});
  await page.setViewportSize({width:1440,height:1000});
 });
 await one('.foundry-scene').scrollIntoViewIfNeeded();await one('.foundry-grid').screenshot({path:path.join(out,'layer-scene.png')});
 await check('public import keeps all 300 real controls on a selection in a full 100-layer room',async()=>{
  const {createLayoutModel}=await import(require('node:url').pathToFileURL(path.join(root,'workspaces/foundry/layout-state.mjs')).href);
  const {themes}=JSON.parse(fs.readFileSync(path.join(root,'workspaces/foundry/catalog.json'),'utf8'));
  const model=createLayoutModel(themes),layout=model.upgradeBlendModes(model.initial(themes[0].id));
  const base=Object.values(layout.placements)[0];
  for(let n=Object.keys(layout.placements).length;n<100;n++){
   const id='instance-00000000-0000-4000-8000-'+String(n).padStart(12,'0');
   layout.placements[id]={...base,zIndex:n};
  }
  await one('[data-import]').setInputFiles({name:'neutral-room.json',mimeType:'application/json',buffer:Buffer.from(model.encode(layout))});
  await page.locator('[data-layer-id]').nth(99).waitFor({state:'attached'});
  const all=one('[data-layer-groups]');
  assert.equal(await all.locator('button').count(),300);
  const outcome=await all.evaluate(group=>{
   const buttons=[...group.querySelectorAll('button')];
   const selected=group.querySelector('[data-layer-action="select"][aria-pressed="true"]');
   const change=[...group.querySelectorAll('[data-layer-action="select"]')].find(b=>b!==selected);
   const select=group.getRootNode().querySelector('[data-inspect-object]');
   const oldOptions=[...select.options];
   const observer=new MutationObserver(()=>{});observer.observe(group,{subtree:true,childList:true,attributes:true});
   change.click();
   const edits=observer.takeRecords();observer.disconnect();
   return {same:buttons.every((b,i)=>group.querySelectorAll('button')[i]===b),nodes:edits.filter(x=>x.type==='childList').length,
    aria:edits.filter(x=>x.attributeName==='aria-pressed').length,inspector:oldOptions.every((o,i)=>select.options[i]===o),
    selected:select.value===change.closest('[data-layer-id]').dataset.layerId};
  });
  assert.deepEqual(outcome,{same:true,nodes:0,aria:2,inspector:true,selected:true});
 });
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
