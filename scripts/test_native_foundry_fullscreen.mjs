import assert from 'node:assert/strict';

async function waitForFullscreen(page,active){
 await page.waitForFunction(active=>{
  const root=document.querySelector('#main[data-workspace=build] .foundry-workspace');
  const button=root?.querySelector('[data-foundry-fullscreen]');
  const status=root?.querySelector('[data-foundry-fullscreen-status]')?.textContent;
  if(!button||button.getAttribute('aria-disabled')!=='false'||button.getAttribute('aria-pressed')!==String(active))return false;
  if(active)return document.fullscreenElement===root&&root.matches(':fullscreen')&&status.startsWith('Foundry is fullscreen.');
  return !document.fullscreenElement&&!root.matches(':fullscreen')&&status==='Foundry left fullscreen.';
 },active);
}

export async function checkNativeFoundryFullscreen({browser,origin}){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const unexpected=[],errors=[];
 try{
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin&&['GET','HEAD'].includes(request.method()))return route.continue();
   unexpected.push([request.method(),url.origin,url.pathname]);
   return route.abort();
  });
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  assert.equal((await page.goto(origin+'/#build'))?.status(),200);
  await page.locator('#main[data-workspace=build] .workspace-status').filter({hasText:'workspace loaded.'}).waitFor();
  const root=page.locator('#main[data-workspace=build] .foundry-workspace');
  const full=root.getByRole('button',{name:'Fullscreen',exact:true});
  const canvas=root.locator('[data-canvas-view-toggle]');
  const shell=page.locator('body > .sidebar');
  const draft=root.getByLabel('Layout name',{exact:true});
  await full.waitFor();
  // An unavailable Fullscreen API is not a pass for a runner meant to
  // validate this feature. Retain the exact runner failure instead.
  assert.equal(await page.evaluate(()=>document.fullscreenEnabled),true,'Extracted runner lacks the browser Fullscreen API');
  assert.equal(await full.isEnabled(),true);
  assert.equal(await full.getAttribute('aria-keyshortcuts'),'F');
  assert.equal(await full.getAttribute('aria-pressed'),'false');
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
  const shellNode=await shell.elementHandle();
  const box=await shell.boundingBox();
  assert.ok(shellNode&&box);
  const before=await page.evaluate(()=>Object.entries(localStorage).sort());

  // Observe actual browser-generated input. These listeners never dispatch
  // events, alter browser fullscreen state, or cancel keys.
  const readProbe=await page.evaluateHandle(()=>{
   const input=[],owner=()=>document.fullscreenElement;
   document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-foundry-fullscreen]'))
     input.push({key:'click',event,owns:Boolean(owner()),activation:navigator.userActivation.isActive});
   },true);
   document.addEventListener('keydown',event=>{
    if(event.key==='Escape'||event.key.toLowerCase()==='f')
     input.push({key:event.key,event,owns:owner()?.classList.contains('foundry-workspace')??false});
   },true);
   return input;
  });
  const events=()=>readProbe.evaluate(input=>input.map(({key,event,owns,activation})=>
   ({key,owns,activation,trusted:event.isTrusted,cancelled:event.defaultPrevented})));

  await draft.fill('Synthetic fullscreen dra');
  await draft.press('f');
  assert.equal(await draft.inputValue(),'Synthetic fullscreen draf');
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
  assert.deepEqual((await events()).at(-1),{key:'f',owns:false,trusted:true,cancelled:false,activation:undefined});

  await full.click();
  await waitForFullscreen(page,true);
  const click=(await events()).at(-1);
  assert.ok(click.key==='click'&&click.trusted&&click.activation);
  assert.equal(await canvas.getAttribute('aria-pressed'),'false');
  assert.equal(await root.locator('.foundry-toolbar').isVisible(),true);
  await full.click();
  await waitForFullscreen(page,false);
  assert.equal(await draft.inputValue(),'Synthetic fullscreen draf');

  await full.focus();
  assert.equal(await full.evaluate(button=>button===document.activeElement),true);
  await page.keyboard.press('f');
  await waitForFullscreen(page,true);
  assert.deepEqual((await events()).at(-1),{key:'f',owns:false,trusted:true,cancelled:true,activation:undefined});
  await full.focus();
  assert.equal(await full.evaluate(button=>button===document.activeElement),true);
  await page.keyboard.press('f');
  await waitForFullscreen(page,false);
  assert.deepEqual((await events()).at(-1),{key:'f',owns:true,trusted:true,cancelled:true,activation:undefined});

  await canvas.click();
  assert.equal(await canvas.getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
  assert.equal(await shell.isVisible(),true);
  assert.equal(await root.locator('.foundry-toolbar').isVisible(),false);
  await canvas.focus();
  await page.keyboard.press('Escape');
  assert.equal(await canvas.getAttribute('aria-pressed'),'false');
  assert.equal(await draft.inputValue(),'Synthetic fullscreen draf');
  assert.deepEqual(await page.evaluate(()=>Object.entries(localStorage).sort()),before);
  assert.equal(await shellNode.evaluate(node=>node===document.querySelector('body > .sidebar')),true);
  await page.waitForFunction(({x,y,width,height})=>{
   const rect=document.querySelector('body > .sidebar')?.getBoundingClientRect();
   return rect?.x===x&&rect.y===y&&rect.width===width&&rect.height===height;
  },box);
  assert.deepEqual(await shell.boundingBox(),box);
  assert.equal(await shell.isVisible(),true);

  const research=shell.locator('[data-nav=research]');
  await research.focus();
  await page.keyboard.press('f');
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
  assert.equal(await research.evaluate(link=>link===document.activeElement),true);
  await research.click();
  await page.locator('#main[data-workspace=research] .workspace-status').filter({hasText:'workspace loaded.'}).waitFor();
  assert.equal(new URL(page.url()).hash.startsWith('#research'),true);
  await shell.locator('[data-nav=build]').click();
  await page.locator('#main[data-workspace=build] .workspace-status').filter({hasText:'workspace loaded.'}).waitFor();
  await canvas.click();
  await full.click();
  await waitForFullscreen(page,true);
  const escapeOffset=(await events()).length;
  await page.keyboard.press('Escape');
  // This is deliberately the last interaction. An asynchronous browser
  // escape may still complete; we never use a fallback click/API to claim it.
  const escape=await readProbe.evaluate((input,offset)=>{
   const row=input.slice(offset).findLast(entry=>entry.key==='Escape');
   return {exited:!document.fullscreenElement,seen:row?{
    trusted:row.event.isTrusted,cancelled:row.event.defaultPrevented,owns:row.owns}:null};
  },escapeOffset);
  if(escape.seen){
   assert.equal(escape.seen.trusted,true);
   if(escape.seen.owns)assert.equal(escape.seen.cancelled,false);
  }
  assert.equal(await canvas.getAttribute('aria-pressed'),'true');
  assert.deepEqual(unexpected,[]);
  assert.deepEqual(errors,[]);
  return {browserEscape:escape.exited?'native browser exit observed':
   escape.seen?.owns?'trusted page Escape left uncancelled; OS/browser-chrome exit unverified':
   'OS/browser-chrome Escape delivery and exit unverified'};
 }finally{await context.close();}
}
