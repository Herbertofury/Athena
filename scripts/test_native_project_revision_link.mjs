import assert from 'node:assert/strict';
import {projectComparisonFixture} from './test_native_project_comparison.mjs';

export async function checkNativeProjectRevisionLink({browser,origin}){
 const unexpected=[],errors=[],contexts=[];
 const start=async()=>{
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}});
  contexts.push(context);
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin&&['GET','HEAD'].includes(request.method()))return route.continue();
   unexpected.push([request.method(),url.origin,url.pathname]);return route.abort();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  return {context,page};
 };
 const scope=page=>page.locator('#main[data-workspace=projects] .workspace-container');
 async function ready(page){
  await page.locator('#main[data-workspace=projects] .workspace-status')
   .filter({hasText:/^Athena project browser workspace loaded\. Search above applies here\.$/}).waitFor();
  await scope(page).getByRole('button',{name:'New project',exact:true}).waitFor();
 }
 async function populate(page,fixture){
  await page.goto(origin+'/#projects');await ready(page);
  await scope(page).getByLabel('Import backup').setInputFiles({
   name:'synthetic-local-project-revisions.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture)),
  });
  await scope(page).getByRole('button',{name:'Import reviewed projects',exact:true}).click();
  await scope(page).getByText('Imported 2 new projects; retained 0 identical projects. Saved in this browser.',{exact:true}).waitFor();
  return page.evaluate(()=>localStorage.getItem('athena-workspaces-v1'));
 }
 try{
  const fixture=projectComparisonFixture();
  const active=fixture.entries[0],old=active.revisions[0],latest=active.revisions.at(-1);
  const {context,page}=await start();
  const before=await populate(page,fixture),root=scope(page);
  await root.locator('[data-project]').locator('button').click();
  await root.getByRole('button',{name:'Edit project',exact:true}).click();
  const draft=root.locator('#editor textarea[name=goal]');
  await draft.fill('Synthetic unsaved editor text; must stay here');
  await root.locator('#saved-history > summary').click();
  const historyRow=root.locator('[data-saved-revision="1"]');
  await historyRow.getByRole('button',{name:'Prepare local link to revision 1',exact:true}).click();
  const link=historyRow.getByRole('link',{name:'Open local link to revision 1',exact:true});
  await link.waitFor();
  const href=await link.getAttribute('href');
  assert.match(href,/^#projects\?saved-revision=1&project-key=[a-f0-9]{64}&revision-key=[a-f0-9]{64}$/);
  for(const value of [active.id,old.name,old.goal,old.source,latest.goal]){
   assert.equal(href.includes(value),false);assert.equal(href.includes(encodeURIComponent(value)),false);
  }
  const address=await link.evaluate(el=>el.href);
  assert.equal(address,origin+'/'+href);
  const view=root.locator('#saved-revision-route');
  await link.click();
  await view.getByText(old.goal,{exact:true}).waitFor();
  assert.equal(new URL(page.url()).hash,href);
  assert.equal(await view.getByRole('link',{name:'Open linked revision official source (new tab)',exact:true}).getAttribute('href'),old.source);
  assert.doesNotMatch(await view.textContent(),/Synthetic unsaved editor|newer-unselected-sentinel|archived-old-sentinel|unknown-field-sentinel/);
  await page.goBack();
  await view.waitFor({state:'hidden'});
  assert.equal(new URL(page.url()).hash,'#projects');
  assert.equal(await draft.inputValue(),'Synthetic unsaved editor text; must stay here');
  await page.goForward();
  await view.getByText(old.goal,{exact:true}).waitFor();
  assert.equal(await draft.inputValue(),'Synthetic unsaved editor text; must stay here');
  assert.equal(await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),before);

  const copied=await context.newPage();copied.setDefaultTimeout(15000);
  copied.on('pageerror',error=>errors.push(error.message));
  await copied.goto(address);await ready(copied);
  await scope(copied).locator('#saved-revision-route').getByText(old.goal,{exact:true}).waitFor();
  assert.equal(await scope(copied).locator('#editor').isVisible(),false);
  await copied.close();
  const {page:other}=await start(),collision=structuredClone(fixture);
  collision.entries[0].revisions[0].goal='Different saved content under same identity and save order';
  const unchanged=await populate(other,collision);
  await other.goto(address);
  const refused=scope(other).locator('#saved-revision-route');
  await refused.getByText(/exact saved revision is unavailable/i).waitFor();
  assert.doesNotMatch(await refused.textContent(),/Different saved content|Synthetic old project evidence/);
  assert.equal(await other.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),unchanged);
  assert.deepEqual(unexpected,[]);
  assert.deepEqual(errors,[]);
 }finally{for(const context of contexts)await context.close();}
}
