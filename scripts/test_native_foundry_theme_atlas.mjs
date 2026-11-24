import assert from 'node:assert/strict';

export async function checkNativeFoundryThemeAtlas({browser,origin}){
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
  const view=root.locator('[data-foundry-theme-atlas]');
  const theme=root.locator('select[data-theme-select]'),room=root.locator('select[data-room-select]');
  const draft=root.locator('[data-inspect-rotation]');
  assert.equal(await theme.inputValue(),'frutiger-aero');
  const activeRoom=await room.inputValue(),scene=root.locator('.foundry-scene');
  const actors=await scene.locator('.foundry-object').evaluateAll(nodes=>nodes.map(node=>node.dataset.id));
  const capture=()=>page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));
  await draft.fill('27');
  const initial=await capture();
  const requests=[];page.on('request',request=>requests.push(request.url()));
  // The existing packaged assets are loaded. All discovery below must
  // still work with the browser's network disabled.
  await context.setOffline(true);
  const open=view.locator(':scope > summary').filter({hasText:/^Browse all themes and rooms$/});
  await open.focus();await open.press('Enter');
  const search=view.getByLabel('Search built-in themes, rooms and objects',{exact:true});
  await search.waitFor({state:'visible'});await search.fill('Archive Rotunda');
  const found=view.locator('button[data-theme-atlas-id="utopian-scholastic"]');
  await found.waitFor();
  assert.equal(await view.locator('[data-theme-atlas-id]').count(),1);
  await found.focus();await found.press('Enter');
  assert.equal(await found.getAttribute('aria-pressed'),'true');
  const inspected=view.locator('[data-theme-atlas-inspect]');
  const title=inspected.getByRole('heading',{name:'Utopian Scholastic',exact:true});
  await title.waitFor();
  assert.equal(await title.evaluate(node=>node.getRootNode().activeElement===node),true);
  const inspectRoom=inspected.locator('button[data-theme-atlas-room-id="utopian-scholastic:room:archive-rotunda"]');
  await inspectRoom.focus();await inspectRoom.press('Enter');
  assert.equal(await inspectRoom.getAttribute('aria-pressed'),'true');
  const record=inspected.locator('[data-theme-atlas-room-preview]');
  await record.filter({hasText:'Archive Rotunda (utopian-scholastic:room:archive-rotunda)'}).waitFor();
  const objects=inspected.locator('details > summary').filter({hasText:/^Theme catalog objects, not room placements/});
  await objects.focus();await objects.press('Enter');
  await inspected.getByText('Archive Globe · console · play · utopian-scholastic:archive-globe',{exact:true}).waitFor();
  await search.fill('No matching fixture theme');
  await view.locator('[data-theme-atlas-results-state]').filter({hasText:/^No matching built-in themes/}).waitFor();
  assert.match(await record.textContent(),/utopian-scholastic:room:archive-rotunda/);
  assert.equal(await inspected.locator('a,iframe,img,video').count(),0);
  assert.equal(await theme.inputValue(),'frutiger-aero');
  assert.equal(await room.inputValue(),activeRoom);
  assert.equal(await draft.inputValue(),'27');
  assert.deepEqual(await scene.locator('.foundry-object').evaluateAll(nodes=>nodes.map(node=>node.dataset.id)),actors);
  assert.deepEqual(await capture(),initial);
  assert.deepEqual(requests,[]);
  assert.deepEqual(violations,[]);
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
}
