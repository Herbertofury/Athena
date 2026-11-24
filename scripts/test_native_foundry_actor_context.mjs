import assert from 'node:assert/strict';

export async function checkNativeFoundryActorContext({browser,origin}){
 const context=await browser.newContext({serviceWorkers:'block'}),violations=[],errors=[];
 try{
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin&&['GET','HEAD'].includes(request.method()))return route.continue();
   violations.push([request.method(),url.origin,url.pathname]);return route.abort();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/#build');
  await page.locator('#main[data-workspace=build] .workspace-status')
   .filter({hasText:/^Athena room authoring workspace loaded\. Search above applies here\.$/}).waitFor();
  const root=page.locator('#main[data-workspace=build] .foundry-workspace');
  const actor=root.locator('.foundry-scene button.foundry-object').nth(1);
  await actor.waitFor({state:'visible'});
  const actorId=await actor.getAttribute('data-id'),actorLabel=await actor.locator('.foundry-object-label').textContent();
  assert.ok(actorId);
  const menu=root.getByRole('menu',{name:'Room object actions: '+actorLabel,exact:true});
  const transform=menu.getByRole('menuitem',{name:'Inspect transform',exact:true});
  const layer=menu.getByRole('menuitem',{name:'Reveal in Room layers',exact:true});
  const rotate=root.locator('input[data-inspect-rotation]'),selector=root.locator('select[data-inspect-object]');
  const room=root.locator('select[data-room-select]'),theme=root.locator('select[data-theme-select]');
  const settledSoundtrack=root.locator('button[data-soundtrack-refresh]:enabled');
  // The native startup lookup must be finished before observing gesture traffic.
  await settledSoundtrack.waitFor();
  const focused=control=>control.evaluate(el=>el.ownerDocument.activeElement===el);
  const capture=()=>page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));
  const initial=await capture(),initialRoom=await room.inputValue();
  const requests=[];page.on('request',request=>requests.push({url:request.url(),method:request.method()}));
  await context.setOffline(true);

  await actor.click({button:'right'});
  await menu.waitFor({state:'visible'});
  assert.equal(await focused(transform),true);
  await page.keyboard.press('End');
  assert.equal(await focused(layer),true);
  await page.keyboard.press('Enter');
  await menu.waitFor({state:'hidden'});
  const revealed=root.locator('[data-foundry-module="layers"] button[data-layer-action="select"]:focus');
  await revealed.waitFor();
  assert.equal(await revealed.evaluate(el=>el.closest('[data-layer-id]').dataset.layerId),actorId);

  await actor.focus();await page.keyboard.press('Shift+F10');
  await transform.waitFor();
  await page.keyboard.press('Enter');await rotate.waitFor({state:'visible'});
  assert.equal(await focused(rotate),true);
  assert.equal(await selector.inputValue(),actorId);
  await rotate.fill('27');await actor.focus();
  await page.keyboard.press('ContextMenu');await transform.waitFor();
  await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});
  assert.equal(await focused(actor),true);
  assert.equal(await rotate.inputValue(),'27');
  assert.equal(await room.inputValue(),initialRoom);
  assert.deepEqual(await capture(),initial);

  const oldActor=await actor.elementHandle();
  await page.keyboard.press('Shift+F10');await transform.waitFor();
  assert.deepEqual(requests,[],'opening an actor menu is offline and request-free');
  // Separate, explicit user navigation is not an actor-menu command. The
  // connected native room chooser has one established local soundtrack GET.
  const newRoom=await room.locator('option').nth(1).getAttribute('value');
  assert.ok(newRoom);assert.notEqual(newRoom,initialRoom);
  const expected={url:origin+'/__native/soundtrack/'+(await theme.inputValue())+'/'+newRoom,method:'GET'};
  await context.setOffline(false);
  await Promise.all([
   page.waitForRequest(request=>request.url()===expected.url&&request.method()===expected.method),
   room.selectOption({value:newRoom})
  ]);
  await settledSoundtrack.waitFor();
  await context.setOffline(true);
  assert.deepEqual(requests.splice(0),[expected],'only the explicit chooser may read its exact local bookmark');
  assert.equal(await room.inputValue(),newRoom);
  await menu.waitFor({state:'hidden'});
  assert.equal(await oldActor.evaluate(el=>el.isConnected),false);
  await oldActor.dispose();
  assert.equal(await actor.getAttribute('data-id'),actorId);
  const changedRoom=await capture();
  const workspaceKey='athena-workspaces-v1';
  const { [workspaceKey]: oldWorkspace, ...oldOtherStorage }=initial.local;
  const { [workspaceKey]: newWorkspace, ...newOtherStorage }=changedRoom.local;
  assert.deepEqual(newOtherStorage,oldOtherStorage);
  assert.deepEqual(changedRoom.session,initial.session);
  const before=JSON.parse(oldWorkspace??'{"schema":1,"workspaces":{}}');
  const after=JSON.parse(newWorkspace);
  assert.equal(after.workspaces.build.active.roomId,newRoom);
  assert.equal(after.workspaces.build.layouts[initialRoom].roomId,initialRoom);
  delete before.workspaces.build;
  delete after.workspaces.build;
  assert.deepEqual(after,before,'changing rooms may only change the owned Build workspace');

  await actor.focus();await page.keyboard.press('Shift+F10');await transform.waitFor();
  await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});
  assert.equal(await focused(actor),true);
  assert.deepEqual(await capture(),changedRoom);
  assert.deepEqual(requests,[]);
  assert.deepEqual(violations,[]);
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
}
