import assert from 'node:assert/strict';
import fs from 'node:fs';

const recorded='https://fixture.invalid/exact-old-continuity';
const newer='https://fixture.invalid/newer-continuity-not-reviewed';
const live='https://fixture.invalid/same-id-live-continuity';
const revision=(text,source,at)=>({text,source,at});
const note=(id,project,revisions,dependencies=[])=>({id,project,kind:'decision',pinned:false,ignored:false,revisions,history:[],dependencies});
const archived={schema:2,entries:[
 note('synthetic-shared-id','Synthetic backup project',[
  revision('Exact old backup revision <img src=x onerror=alert(1)>',recorded,20),
  revision('Newer backup revision not selected',newer,10)
 ],[{id:'synthetic-reference-id',revision:1}]),
 note('synthetic-reference-id','Synthetic linked project',[
  revision('Exactly reviewed dependency revision',recorded,11),revision('Later dependency never substituted',newer,12)
 ])
]};
const elsewhere={schema:2,entries:[
 note('synthetic-shared-id','Different live profile',[revision('Same-ID live replacement must not be shown',live,30)]),
 note('synthetic-reference-id','Different live reference',[revision('Same-ID live reference must not be shown',live,31)])
]};
export async function checkNativeContinuityBackupReader({browser,origin}){
 const contexts=[],external=[],errors=[];
 const scope=page=>page.locator('#main[data-workspace=continuity] .workspace-container');
 async function setup(fixture){
  const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:true});
  contexts.push(context);
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin===origin&&['GET','HEAD'].includes(request.method()))return route.continue();
   external.push([request.method(),url.origin,url.pathname]);return route.abort();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/#continuity');
  await page.locator('#main[data-workspace=continuity] .workspace-status')
   .filter({hasText:/^Athena project continuity workspace loaded\. Search above applies here\.$/}).waitFor();
  const root=scope(page),importer=root.getByLabel('Import local continuity backup',{exact:true});
  await importer.waitFor({state:'visible'});
  await importer.setInputFiles({name:'synthetic-continuity-input.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
  await root.locator('#notice').filter({hasText:/^Imported 2 notes; 0 identical notes retained\. Saved in this browser\. Export a backup\.$/}).waitFor();
  return page;
 }
 try{
  const base=await setup(archived),originalRoot=scope(base);
  const [download]=await Promise.all([base.waitForEvent('download'),
   originalRoot.getByRole('button',{name:'Export local continuity JSON',exact:true}).click()]);
  assert.equal(download.suggestedFilename(),'athena-continuity.json');
  const bytes=fs.readFileSync(await download.path());
  assert.deepEqual(JSON.parse(bytes),archived);

  const target=await setup(elsewhere),root=scope(target);
  const snapshot=()=>target.evaluate(()=>localStorage.getItem('athena-workspaces-v1'));
  const before=await snapshot();
  assert.deepEqual(JSON.parse(before).workspaces.continuity,elsewhere);
  const requests=[];target.on('request',request=>requests.push(request.url()));
  const view=root.locator('[data-continuity-backup-reader]');
  await view.locator(':scope > summary').filter({hasText:/^Review a Continuity backup without importing$/}).click();
  const chooser=view.getByLabel('Choose Continuity backup to review',{exact:true});
  const open=view.getByRole('button',{name:'Open backup read-only',exact:true});
  const outcome=view.getByRole('status');
  await chooser.waitFor({state:'visible'});
  await chooser.setInputFiles({name:download.suggestedFilename(),mimeType:'application/json',buffer:bytes});
  await open.click();
  await outcome.filter({hasText:/^Backup opened: 2 notes\. Read-only\./}).waitFor();
  const exact=view.locator('[data-backup-note-view]'),linked=view.locator('[data-backup-dependency-view]');
  await exact.getByText('Newer backup revision not selected',{exact:true}).waitFor();
  await view.getByRole('button',{name:'Previous backup revision',exact:true}).click();
  await exact.getByText('Exact old backup revision <img src=x onerror=alert(1)>',{exact:true}).waitFor();
  await exact.getByText('Recorded source: '+recorded,{exact:true}).waitFor();
  await linked.getByText('Exactly reviewed dependency revision',{exact:true}).waitFor();
  assert.doesNotMatch(await linked.textContent(),/Later dependency never substituted/);
  assert.doesNotMatch(await view.textContent(),/Same-ID live/);
  assert.equal(await view.locator('a,img,script,iframe').count(),0);
  const retained=await exact.textContent();
  await chooser.setInputFiles({name:'wrong-source.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"project-constellation","version":7}')});
  await open.click();
  await outcome.filter({hasText:/^Backup not opened\./}).waitFor();
  assert.equal(await exact.textContent(),retained);
  await view.getByRole('button',{name:'Clear backup review',exact:true}).click();
  await view.locator('[data-backup-review-content][hidden]').waitFor({state:'attached'});
  assert.doesNotMatch(await view.textContent(),/Exact old backup revision|Exactly reviewed dependency revision/);
  assert.equal(await snapshot(),before);
  assert.deepEqual(requests,[]);
  assert.deepEqual(external,[]);
  assert.deepEqual(errors,[]);
 }finally{for(const context of contexts)await context.close();}
}
