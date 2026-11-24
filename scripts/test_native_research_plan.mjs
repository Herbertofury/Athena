import assert from 'node:assert/strict';

const beforeHash='#research?q=sqlite&sort=name';
const planId='planned-local-catalog-v1';
const planHash='#research?plan='+planId;
const planName='Local catalog transactions';
const candidateIds=['fjall','libmdbx','redb','rocksdb','sqlite','turso-database'];
const catalogPath='/workspaces/engineering/research/catalog.json';

async function waitForResearch(page,{url,q,sort,plan}){
 // URL updates occur before the workspace host forwards them. Wait for the
 // visible loaded shell AND the controls/results produced by the new route.
 await page.waitForFunction(({url,q,sort,plan,candidateIds,planId,planName})=>{
  if(location.href!==url)return false;
  const main=document.querySelector('#main[data-workspace="research"]');
  if(!main?.querySelector('.workspace-status')?.textContent.startsWith('Athena research workspace loaded.'))return false;
  const root=main.querySelector('.workspace-container')?.shadowRoot;
  const guide=root?.getElementById('plan-guide');
  if(!guide||document.querySelector('#search')?.value!==q||
   root.getElementById('search')?.value!==q||root.getElementById('sort')?.value!==sort||
   root.getElementById('plan')?.value!==(plan?planId:''))return false;
  const ids=[...root.querySelectorAll('#results article[data-candidate]')].map(row=>row.dataset.candidate);
  if(!plan)return guide.hidden&&ids.includes('sqlite');
  return !guide.hidden&&guide.querySelector('h3')?.textContent===planName&&
   ids.sort().join(',')===candidateIds.join(',');
 },{url,q,sort,plan,candidateIds,planId,planName});
}

export async function checkNativeResearchPlan({browser,origin}){
 // Same extracted, verified native app as the other checks; no imports,
 // settings, pre-populated history, workspace fixture or provider access.
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}});
 const unexpected=[],errors=[],failed=[];
 const beforeURL=origin+'/'+beforeHash,planURL=origin+'/'+planHash;
 const before={url:beforeURL,q:'sqlite',sort:'name',plan:false};
 const planned={url:planURL,q:'',sort:'priority',plan:true};
 try{
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin&&['GET','HEAD'].includes(request.method()))return route.continue();
   unexpected.push([request.method(),url.origin,url.pathname]);
   return route.abort();
  });
  const openTab=async()=>{
   const tab=await context.newPage();
   tab.setDefaultTimeout(15000);
   const catalogReads=[];
   tab.on('pageerror',error=>errors.push(error.message));
   tab.on('requestfailed',request=>failed.push([new URL(request.url()).pathname,request.failure()?.errorText]));
   tab.on('response',response=>{
    const {pathname}=new URL(response.url());
    if(response.status()>=400)failed.push([pathname,response.status()]);
    if(pathname===catalogPath&&response.request().method()==='GET')catalogReads.push(response.status());
   });
   return {tab,catalogReads};
  };
  const {tab,catalogReads}=await openTab();
  assert.equal((await tab.goto(beforeURL))?.status(),200);
  await waitForResearch(tab,before);
  const storageBefore=await tab.evaluate(()=>Object.entries(localStorage).sort());
  const workspace=await tab.locator('#main .workspace-container').elementHandle();
  assert.ok(workspace);
  const sameWorkspace=()=>workspace.evaluate(node=>node===document.querySelector('#main .workspace-container'));

  const sqlite=tab.locator('article[data-candidate="sqlite"]');
  await sqlite.locator('details.card-detail > summary').click();
  const link=sqlite.getByRole('link',{name:planName,exact:true});
  await link.waitFor();
  assert.equal(await link.count(),1);
  assert.equal(await link.getAttribute('href'),planHash);
  // Read the browser-resolved address a user would copy/open in a new tab.
  const copiedURL=await link.evaluate(anchor=>anchor.href);
  assert.equal(copiedURL,planURL);

  // Ordinary trusted browser click, then real Back and Forward. A correct
  // visible query with replacement history or a full app reload is not a pass.
  await link.click();
  await waitForResearch(tab,planned);
  assert.equal(await sameWorkspace(),true);
  await tab.goBack();
  await waitForResearch(tab,before);
  assert.equal(await sameWorkspace(),true);
  await tab.goForward();
  await waitForResearch(tab,planned);
  assert.equal(await sameWorkspace(),true);
  assert.deepEqual(await tab.evaluate(()=>Object.entries(localStorage).sort()),storageBefore);
  assert.deepEqual(catalogReads,[200],'the original workspace never reloaded its catalog');
  await workspace.dispose();

  const {tab:copiedTab,catalogReads:copiedCatalogReads}=await openTab();
  assert.equal((await copiedTab.goto(copiedURL))?.status(),200);
  await waitForResearch(copiedTab,planned);
  assert.deepEqual(copiedCatalogReads,[200],'the copied address opened the plan from the packaged catalog');
  assert.deepEqual(await copiedTab.evaluate(()=>Object.entries(localStorage).sort()),storageBefore);
  assert.deepEqual(unexpected,[]);
  assert.deepEqual(failed,[]);
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
}
