// Actual isolated Chromium against the extracted native Lab, not the public site.
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {gzipSync} from 'node:zlib';
import {chromium} from 'playwright';

const root=path.resolve(process.argv[2]);
const manifest=JSON.parse(readFileSync(path.join(root,'native-package.json'),'utf8'));
const work=mkdtempSync(path.join(tmpdir(),'athena-local-review '));
const origin='http://127.0.0.1:41379';
const program=spawn(path.join(root,manifest.engine),['serve-athena',path.join(work,'journal.sqlite'),path.join(root,'runtime')],
  {cwd:work,stdio:'ignore',windowsHide:true});
const exited=new Promise(resolve=>{program.once('exit',resolve);program.once('error',resolve);});
const marker='synthetic-private-value';
const markerName='private-filename';
const gzip=gzipSync;
const hash=input=>createHash('sha256').update(input).digest('hex');
const data=Object.fromEntries('providers projects chats turns turnRevisions outputSnapshots files knowledgeItems knowledgeSources projectContinuity events checkpoints syncReceipts catalogRuns'.split(' ').map(k=>[k,[]]));
Object.assign(data,{schema:'project-constellation',schemaVersion:7,summary:{events:12001,checkpoints:0},meta:{name:marker}});
data.events=Array.from({length:12000},()=>({})); // deliberately above normal 4 KiB local API cap
const plain=Buffer.from(JSON.stringify(data)), zipped=gzip(plain);
let browser;
try {
  for(let ready=false,i=0;!ready;i++){
    if(i>=100 || program.exitCode!==null || program.pid===undefined) throw Error('Extracted native reviewer did not start');
    try{ready=(await fetch(origin+'/api/runtime')).ok;}catch{}
    if(!ready)await delay(100);
  }
  const endpoint=origin+'/api/migration/constellation/review';
  const headers={'Content-Type':'application/octet-stream','Origin':origin,'X-Atlas-Request':'local-ui'};
  for(const [init,status] of [
    [{method:'POST',body:plain},403],
    [{method:'POST',headers:{...headers,Origin:'https://not-local.invalid'},body:plain},403],
    [{method:'POST',headers:{...headers,'Content-Type':'text/plain'},body:plain},415],
    [{method:'POST',headers:{...headers,'Content-Encoding':'gzip'},body:zipped},415],
    [{method:'POST',headers,body:Buffer.alloc(16*1024*1024+1)},413],
  ]) {
    const response=await fetch(endpoint,init);assert.equal(response.status,status);await response.arrayBuffer();
  }
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
  const context=await browser.newContext({viewport:{width:390,height:820}});
  const external=[], errors=[];
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}
    return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/migration');
  await page.getByRole('link',{name:'Review a saved Constellation export'}).click();
  await page.getByRole('heading',{name:'Review a Constellation export'}).waitFor();
  const choose=(name,buffer)=>page.getByLabel('Constellation backup',{exact:true}).setInputFiles({name,mimeType:'application/octet-stream',buffer});
  const start=()=>page.getByRole('button',{name:'Review backup',exact:true}).click();
  await choose(markerName+'.json',plain);
  await start();
  await page.getByText('Review complete. No data was imported.',{exact:true}).waitFor();
  assert.equal(await page.locator('main').evaluate(e=>e.scrollWidth <= document.documentElement.clientWidth),true);
  await page.getByLabel('Show only missing, capped or incomplete collections',{exact:true}).check();
  await page.getByText('Known omissions: 1',{exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Chats',exact:true}).count(),0);
  const save=async()=>{
    const [d]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Save count-only receipt',exact:true}).click()]);
    const content=readFileSync(await d.path(),'utf8');
    assert(!content.includes(marker)&&!content.includes(markerName));
    return JSON.parse(content);
  };
  let report=await save();
  assert.equal(report.exact_input_sha256,undefined);assert.equal(report.selected_gzip_sha256,undefined);
  assert.equal(report.slices.find(x=>x.kind==='events').retained,12000);
  await page.getByText('Compare with a saved count-only receipt',{exact:true}).click();
  const oldReport = structuredClone(report);
  oldReport.slices.find(x=>x.kind==='events').omitted=0;
  oldReport.slices.find(x=>x.kind==='groups').retained=0;
  const compare = async value => {
    await page.getByLabel('Earlier Athena receipt',{exact:true}).setInputFiles({
      name:'private-receipt.json',mimeType:'application/json',
      buffer:Buffer.from(typeof value==='string'?value:JSON.stringify(value,null,2)+'\n')
    });
    await page.getByRole('button',{name:'Compare receipts',exact:true}).click();
  };
  await compare(oldReport);
  await page.getByText('Events / Omitted: 0 → 1',{exact:true}).waitFor();
  await page.getByText('Groups / Retained: 0 → Not recorded',{exact:true}).waitFor();
  await compare(report);
  await page.getByText('No reported counts or limits changed. No shared fingerprints to compare.',{exact:true}).waitFor();
  await compare({...report,fileName:markerName});
  await page.getByText(/Receipt refused/).waitFor();
  assert.equal(await page.locator('#differences li').count(),0);
  await compare(JSON.stringify(report,null,2).replace('"source_schema": 7','"source_schema": 9,\n  "source_schema": 7'));
  await page.getByText(/Receipt refused/).waitFor();
  await page.setViewportSize({width:1440,height:900});
  await choose(markerName+'.gz',zipped);
  await page.getByLabel('Include SHA-256 fingerprints',{exact:true}).check();
  await start();
  await page.getByText('Review complete. No data was imported.',{exact:true}).waitFor();
  report=await save();
  assert.equal(report.exact_input_sha256,hash(plain));assert.equal(report.selected_gzip_sha256,hash(zipped));
  await compare(report);
  await page.getByText('No reported counts or limits changed. Decoded JSON fingerprints match. Selected gzip fingerprints match.',{exact:true}).waitFor();
  await compare({...report,exact_input_sha256:'f'.repeat(64)});
  await page.getByText('No reported counts or limits changed. Decoded JSON fingerprints differ. Selected gzip fingerprints match.',{exact:true}).waitFor();

  await choose(markerName+'.gz',Buffer.concat([zipped,zipped]));await start();
  await page.getByText('Gzip export contains trailing bytes or multiple members',{exact:true}).waitFor();
  assert(!(await page.getByRole('button',{name:'Save count-only receipt',exact:true}).isVisible()));
  // Selection is opt-in. Only eligible workspace metadata reaches the local UI.
  const workspace=(id,name,extra={})=>({id,sourceType:'workspace',providerId:'',name,archived:false,updatedAt:1700000000001,notes:marker,...extra});
  const workspaceInput=gzip(Buffer.from(JSON.stringify({...data,projects:[
    workspace('workspace-a','Workspace example'),workspace('workspace-b','Workspace example'),
    workspace('mirror','hidden provider mirror',{providerId:'example',sourceType:'provider'}),
    workspace('deleted','hidden deleted',{deletedAt:1700000000002})
  ]})));
  const unavailableOrigin=await fetch(endpoint+'?projects=1',{method:'POST',headers:{...headers,Origin:'https://not-local.invalid'},body:workspaceInput});
  assert.equal(unavailableOrigin.status,403);
  const many = Array.from({length:129},(_,i)=>workspace('id-'+i,'Eligible '+i));
  const capped = await fetch(endpoint+'?projects=1',{method:'POST',headers,body:Buffer.from(JSON.stringify({...data,projects:many}))});
  assert.equal(capped.status,200);
  const list = await capped.json();
  assert.equal(list.eligible,129); assert.equal(list.projects.length,128);
  const duplicate = await fetch(endpoint+'?projects=1',{method:'POST',headers,body:Buffer.from(JSON.stringify({...data,projects:[many[0],many[0]]}))});
  assert.equal(duplicate.status,422);
  assert(!JSON.stringify(await duplicate.json()).includes('id-0'));
  const beforeSave=await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1'));
  await page.setViewportSize({width:390,height:820});
  await choose('workspace-source.gz',workspaceInput);
  await start();
  await page.getByText('Review complete. No data was imported.',{exact:true}).waitFor();
  assert.equal(await page.getByText('1. Workspace example',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Show eligible workspace projects',exact:true}).click();
  await page.getByText('2 of 2 eligible projects shown. 2 records are not eligible.',{exact:true}).waitFor();
  assert.equal(await page.getByText(/hidden provider mirror|hidden deleted|synthetic-private-value/).count(),0);
  assert.equal(await page.locator('#project-rows input:checked').count(),0);
  const space=await context.newPage();
  await space.goto(origin+'/#projects');
  const [dest]=await Promise.all([space.waitForEvent('download'),space.getByRole('button',{name:'Export projects',exact:true}).click()]);
  const roster=readFileSync(await dest.path());
  await page.getByLabel('Current Athena Projects export',{exact:true}).setInputFiles({name:'destination.json',mimeType:'application/json',buffer:roster});
  await page.getByLabel('Stable source workspace label').fill('stable-slot');
  const saveRecipe=page.getByRole('button',{name:'Save private staging recipe',exact:true});
  await saveRecipe.click();
  await page.getByText(/Select 1–24 rows/).waitFor();
  await page.getByRole('group',{name:'2. Workspace example',exact:true}).getByRole('checkbox').check();
  await page.getByLabel('Stage for project 2',{exact:true}).selectOption('research');
  await page.getByLabel('Ownership for project 2',{exact:true}).selectOption('followed');
  const [recipe]=await Promise.all([page.waitForEvent('download'),saveRecipe.click()]);
  const recipeBytes=readFileSync(await recipe.path());
  assert.deepEqual(JSON.parse(recipeBytes),{schema:1,sourceSha256:hash(workspaceInput),destinationSha256:hash(roster),namespace:'stable-slot',selected:[{id:'workspace-b',stage:'research',ownership:'followed'}]});
  assert.equal(await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),beforeSave);
  const [src,plan,dst,candidate]=['source.gz','plan.json','roster.json','candidate.json'].map(n=>path.join(work,n));
  writeFileSync(src,workspaceInput);writeFileSync(plan,recipeBytes);writeFileSync(dst,roster);
  const run=spawnSync(path.join(root,manifest.engine),['stage-constellation-projects',src,plan,dst,candidate],{cwd:work,encoding:'utf8',windowsHide:true,timeout:15000});
  assert.equal(run.status,0,run.stderr);
  const staged=readFileSync(candidate);
  assert(!staged.includes(marker));
  await space.getByLabel('Import backup',{exact:true}).setInputFiles({name:'candidate.json',mimeType:'application/json',buffer:staged});
  await space.getByText(/Staged Constellation destination verified/).waitFor();
  await space.getByRole('button',{name:'Import reviewed projects',exact:true}).click();
  await space.getByRole('button',{name:'Open Workspace example',exact:true}).waitFor();
  assert.equal(JSON.parse(await space.evaluate(()=>localStorage.getItem('athena-workspaces-v1'))).workspaces.projects.entries.length,1);
  await page.getByRole('button',{name:'Clear project selection',exact:true}).click();
  await page.getByText('Project selection cleared. Nothing was imported.',{exact:true}).waitFor();
  assert.equal(await page.locator('#project-rows fieldset').count(),0);
  await page.getByRole('button',{name:'Show eligible workspace projects',exact:true}).click();
  await page.getByText('2 of 2 eligible projects shown. 2 records are not eligible.',{exact:true}).waitFor();
  await choose('different.gz',zipped);
  assert.equal(await page.locator('#project-rows fieldset').count(),0);
  assert.equal(await page.getByRole('button',{name:'Save private staging recipe',exact:true}).isVisible(),false);
  await space.close();
  assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
  console.log('PASS actual extracted native browser: local navigation, precise bounded JSON/gzip, refused origins, private receipt, filtering, private recipe creation, native staging, exact reviewed import, and no outside requests.');
} finally {
  await browser?.close();
  program.kill();await exited;
  rmSync(work,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
