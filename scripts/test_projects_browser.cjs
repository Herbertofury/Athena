const {chromium}=require('playwright');const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const root=path.resolve('dist');const server=http.createServer((req,res)=>{res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'");const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return;}const f=p===root?path.join(root,'index.html'):p;try{res.setHeader('Content-Type',f.endsWith('.mjs')||f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});const context=await browser.newContext();const origin=`http://127.0.0.1:${server.address().port}`;const externalRequests=[];await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin){externalRequests.push(url.href);return route.abort();}return route.continue();});await context.addInitScript(()=>{globalThis.__athenaCspViolations=[];document.addEventListener('securitypolicyviolation',event=>globalThis.__athenaCspViolations.push({blockedURI:event.blockedURI,directive:event.violatedDirective}));});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/#projects');await page.getByRole('heading',{name:'Project browser',exact:true}).last().waitFor();
await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByLabel('Project name',{exact:true}).fill('Space ARPG');await page.getByLabel('Goal',{exact:true}).fill('Space Diablo-like adventure with health and mana');await page.getByLabel('Next actions',{exact:true}).fill('Outpost tracker from the first plan');await page.getByLabel('Resources and inspiration').fill('Diablo I–IV; Path of Exile; EVE Online; No Man’s Sky');await page.getByRole('button',{name:'Save project',exact:true}).click();await page.getByText('Saved in this browser. Export a backup.',{exact:true}).waitFor();
await page.reload();await page.getByRole('button',{name:'Open Space ARPG'}).click();await page.getByRole('button',{name:'Edit project',exact:true}).click();await page.getByLabel('Next actions',{exact:true}).fill('Study combat and space exploration');await page.getByRole('button',{name:'Save project',exact:true}).click();await page.getByText('2 saved revision(s)',{exact:true}).waitFor();
const comparisonBefore=await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1'));
await page.getByText('Compare saved revisions',{exact:true}).click();
const beforeRevision=page.getByLabel('Before revision',{exact:true}),afterRevision=page.getByLabel('After revision',{exact:true});
assert.equal(await beforeRevision.inputValue(),'0');assert.equal(await afterRevision.inputValue(),'1');
await page.getByText(/1 changed field\(s\): revision 1/).waitFor();
await beforeRevision.selectOption('1');await page.getByText(/0 changed field\(s\): revision 2/).waitFor();
await afterRevision.selectOption('0');await page.getByText(/1 changed field\(s\): revision 2/).waitFor();
assert.equal(await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),comparisonBefore);
const projectScope=page.getByLabel('Project search scope',{exact:true}),projectSearch=page.locator('#search');
await projectSearch.fill('outpost tracker');await page.getByText(/^Showing 0 of 0 matching/).waitFor();
await projectScope.selectOption('history');await page.getByRole('button',{name:'Open Space ARPG',exact:true}).click();
await page.getByText('Revision 1 (historical): Next actions',{exact:true}).waitFor();
assert.equal(await page.locator('#saved-history pre').count(),0);
await page.locator('#saved-history summary').click();
await page.locator('#saved-history pre').nth(1).waitFor({state:'attached'});
assert.match(await page.locator('#saved-history pre').nth(1).textContent(),/Outpost tracker from the first plan/);
assert.equal(await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),comparisonBefore);
await page.reload();assert.equal(await projectScope.inputValue(),'current');assert.equal(await projectSearch.inputValue(),'');
await projectSearch.fill('outpost tracker');await page.getByText(/^Showing 0 of 0 matching/).waitFor();
await projectSearch.fill('');
await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByLabel('Project name',{exact:true}).fill('External project');await page.getByLabel('Ownership',{exact:true}).selectOption('followed');await page.getByLabel('Official source URL').fill('https://example.org/project');await page.getByLabel('Observed version').fill('1.0');await page.getByRole('button',{name:'Save project',exact:true}).click();await page.getByLabel('Project ownership').selectOption('own');assert.equal(await page.getByRole('button',{name:'Open External project'}).count(),0);await page.getByLabel('Project ownership').selectOption('');
await page.getByRole('button',{name:'Open Space ARPG'}).click();await page.getByRole('button',{name:'Archive project',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Open Space ARPG'}).count(),0);await page.getByRole('button',{name:'Show archived'}).click();await page.getByRole('button',{name:'Open Space ARPG'}).click();await page.getByRole('button',{name:'Restore project',exact:true}).click();await page.getByRole('button',{name:'Show active'}).click();await page.getByRole('button',{name:'Open Space ARPG'}).waitFor();
await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByLabel('Project name',{exact:true}).fill('Canceled');await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Open Canceled'}).count(),0);
const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export projects',exact:true}).click()]);const backup=fs.readFileSync(await download.path());assert.equal(JSON.parse(backup).entries.length,2);
await page.getByLabel('Import backup').setInputFiles({name:'projects.json',mimeType:'application/json',buffer:backup});await page.getByText(/This backup adds nothing/).waitFor();
await page.getByRole('button',{name:'Open Space ARPG',exact:true}).click();
await page.getByRole('button',{name:'Review portable copy',exact:true}).click();
const [one]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download reviewed project',exact:true}).click()]);
const oneBytes=fs.readFileSync(await one.path()), portable=JSON.parse(oneBytes.toString());
assert.equal(portable.entries.length,1);assert.equal(portable.entries[0].revisions.length,2);assert.equal(portable.entries[0].revisions[1].name,'Space ARPG');
const recipient=await browser.newContext(), target=await recipient.newPage();await target.goto(origin+'/#projects');
await target.getByLabel('Import backup').setInputFiles({name:'one-project.json',mimeType:'application/json',buffer:oneBytes});
await target.getByRole('heading',{name:'Review project backup',exact:true}).waitFor();
assert.equal(await target.getByRole('button',{name:'Open Space ARPG',exact:true}).count(),0);
await target.getByRole('button',{name:'Import reviewed projects',exact:true}).click();
await target.getByRole('button',{name:'Open Space ARPG',exact:true}).waitFor();
assert.equal(await target.getByRole('button',{name:'Open External project',exact:true}).count(),0);
await recipient.close();
await page.getByRole('link',{name:'Project continuity',exact:true}).click();await page.getByRole('link',{name:'Project browser',exact:true}).click();await page.getByRole('button',{name:'Open Space ARPG'}).waitFor();
fs.mkdirSync('browser-results',{recursive:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'browser-results/project-browser-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'browser-results/project-browser-desktop.png',fullPage:true});
await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('quota');};});await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByLabel('Project name',{exact:true}).fill('Unsaved idea');await page.getByRole('button',{name:'Save project',exact:true}).click();await page.getByText('Not saved. Keep this page open and export your draft before leaving.',{exact:true}).waitFor();const [draft]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export projects',exact:true}).click()]);assert.equal(JSON.parse(fs.readFileSync(await draft.path())).entries.length,3);
await projectSearch.fill('Unsaved idea');await page.getByText(/^Showing 0 of 0 matching/).waitFor();
await projectScope.selectOption('history');assert.equal(await page.getByRole('button',{name:'Open Unsaved idea'}).count(),0);
await projectScope.selectOption('current');await projectSearch.fill('');await page.getByRole('button',{name:'Open Unsaved idea'}).waitFor();
await projectSearch.fill('Space ARPG');await page.getByRole('button',{name:'Open Space ARPG',exact:true}).click();
const archiveFromSearch=page.getByRole('button',{name:'Archive project',exact:true});
await archiveFromSearch.click();await archiveFromSearch.click();
const [retriedDraft]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export projects',exact:true}).click()]);
assert.equal(JSON.parse(fs.readFileSync(await retriedDraft.path())).entries.find(p=>p.revisions.at(-1).name==='Space ARPG').archived,true);
const concurrent=await browser.newContext();try{
 const writer=await concurrent.newPage(),stale=await concurrent.newPage();
 for(const tab of [writer,stale]){
  await tab.goto(origin+'/#projects');
  await tab.getByRole('heading',{name:'Project browser',exact:true}).last().waitFor();
 }
 async function newProject(tab,name){
  await tab.getByRole('button',{name:'New project',exact:true}).click();
  await tab.getByLabel('Project name',{exact:true}).fill(name);
  await tab.getByRole('button',{name:'Save project',exact:true}).click();
 }
 await writer.evaluate(()=>localStorage.setItem('athena-workspaces-v1',JSON.stringify({schema:1,workspaces:{continuity:{fixtureMarker:'must survive'}}})));
 await newProject(writer,'Newer saved project');
 await writer.getByText('Saved in this browser. Export a backup.',{exact:true}).waitFor();
 const persisted=await writer.evaluate(()=>localStorage.getItem('athena-workspaces-v1'));
 assert.equal(JSON.parse(persisted).workspaces.continuity.fixtureMarker,'must survive');
 await newProject(stale,'Stale unsaved proposal');
 await stale.getByText('Not saved. Saved Projects changed. Export your draft before reloading Athena.',{exact:true}).waitFor();
 assert.equal(await writer.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),persisted);
 const [copy]=await Promise.all([stale.waitForEvent('download'),stale.getByRole('button',{name:'Export projects',exact:true}).click()]);
 assert.equal(JSON.parse(fs.readFileSync(await copy.path())).entries[0].revisions[0].name,'Stale unsaved proposal');
 await stale.reload();
 await stale.getByRole('button',{name:'Open Newer saved project',exact:true}).waitFor();
 assert.equal(await stale.getByRole('button',{name:'Open Stale unsaved proposal',exact:true}).count(),0);
}finally{await concurrent.close();}
const rootState={schema:1,workspaces:{projects:{schema:1,entries:Array.from({length:28},(_,i)=>({
 id:'project-'+i,archived:false,revisions:[{name:'Fixture project '+i,ownership:'own',stage:'idea',goal:'No outside work',next:'',blockers:'',decisions:'',resources:'',source:'',version:'',release:'',at:i}]
}))}}};
for(const theme of ['dark','light']){
 const pagedContext=await browser.newContext({viewport:{width:theme==='light'?390:1440,height:1000}});
 try {
  const paged=await pagedContext.newPage();
  const pagedErrors=[];paged.on('pageerror',error=>pagedErrors.push(error.message));
  await paged.addInitScript(({origin,rootState})=>{if(location.origin===origin)localStorage.setItem('athena-workspaces-v1',JSON.stringify(rootState));},{origin,rootState});
  await paged.goto(origin+'/#projects');
  const pageCount=paged.getByText(/^Showing 24 of 28 matching/), more=paged.getByRole('button',{name:'Show next 4 projects',exact:true});
  await pageCount.waitFor();assert.equal(await paged.locator('[data-project]').count(),24);
  const host=paged.locator('.workspace-container');
  assert.equal(await host.getAttribute('data-theme'),'dark');
  if(theme==='light')await paged.locator('#theme').click();
  await paged.waitForFunction(theme=>document.querySelector('.workspace-container')?.dataset.theme===theme,theme);
  const expected=theme==='light'?'rgb(97, 66, 157)':'rgb(189, 176, 255)';
  const checkRing=async(control,color=expected)=>{
   const ring=await control.evaluate(el=>{
    const css=getComputedStyle(el);
    return [el===el.getRootNode().activeElement,el.matches(':focus-visible'),css.outlineColor,css.outlineWidth,css.outlineStyle];
   });
   assert.deepEqual(ring,[true,true,color,'3px','solid']);
  };
  const keyboardFocus=async(control)=>{await paged.keyboard.press('Tab');await control.focus();};
  const first=paged.getByRole('button',{name:'Open Fixture project 27',exact:true});
  const detail=paged.locator('#detail h3');
  await keyboardFocus(first);await paged.keyboard.press('Enter');await checkRing(detail);
  await detail.evaluate(el=>{el.dataset.focusTest='unchanged';});
  await more.focus();await checkRing(more);await paged.keyboard.press('Enter');
  await paged.getByText(/^Showing 28 of 28 matching/).waitFor();
  assert.equal(await paged.locator('[data-project]').count(),28);
  await checkRing(paged.getByRole('button',{name:'Open Fixture project 3',exact:true}));
  assert.equal(await detail.getAttribute('data-focus-test'),'unchanged');

  const transfer=paged.getByRole('button',{name:'Review portable copy',exact:true});
  await transfer.focus();await paged.keyboard.press('Enter');
  await checkRing(paged.locator('#transfer-heading'));
  const reviewed=await paged.locator('#transfer-json').textContent();
  assert.deepEqual(JSON.parse(reviewed),{schema:1,entries:[rootState.workspaces.projects.entries[27]]});
  const cancelTransfer=paged.getByRole('button',{name:'Cancel portable copy',exact:true});
  await cancelTransfer.focus();await checkRing(cancelTransfer);await paged.keyboard.press('Enter');
  await checkRing(transfer);
  const storedBefore=await paged.evaluate(()=>localStorage.getItem('athena-workspaces-v1'));
  const importFile=paged.getByLabel('Import backup');
  const copy={schema:1,entries:[{...rootState.workspaces.projects.entries[27],id:'review-only'}]};
  await importFile.setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(copy))});
  await paged.getByRole('heading',{name:'Review project backup',exact:true}).waitFor();
  const cancelImport=paged.getByRole('button',{name:'Cancel backup import',exact:true});
  await keyboardFocus(cancelImport);await checkRing(cancelImport);await paged.keyboard.press('Enter');
  await checkRing(importFile);
  assert.equal(await paged.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),storedBefore);

  await paged.locator('#search').fill('fixture project 0');
  const deep=paged.getByRole('button',{name:'Open Fixture project 0',exact:true});
  await deep.waitFor();assert.equal(await paged.locator('[data-project]').count(),1);
  assert(await paged.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await paged.emulateMedia({forcedColors:'active'});
  await keyboardFocus(deep);
  const system=await deep.evaluate(el=>{
   const probe=document.createElement('span');
   probe.style.color='CanvasText';el.getRootNode().append(probe);
   const css=getComputedStyle(el), model={system:getComputedStyle(probe).color,token:css.getPropertyValue('--focus-outline').trim(),adjust:css.forcedColorAdjust};
   probe.remove();return model;
  });
  assert.equal(system.token,'CanvasText');assert.equal(system.adjust,'auto');
  await checkRing(deep,system.system);
  assert.equal(await paged.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),JSON.stringify(rootState));
  assert.deepEqual(pagedErrors,[]);
 }finally{await pagedContext.close();}
}
assert.deepEqual(externalRequests,[]);assert.deepEqual(errors,[]);console.log('PASS project browser create/edit/reload, own/followed filter, archive/restore, cancel, export/import, navigation, mobile layout, quota-failure draft export');}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
