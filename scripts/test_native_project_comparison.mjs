import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const activeId='native-project-comparison-active';
const archivedId='native-project-comparison-archived';
const printable='<img src=x onerror=alert(1)>';

export function projectComparisonFixture(){
 const row={name:'Same name on two Projects',ownership:'own',stage:'research',
  goal:'Synthetic old project evidence',next:'',blockers:'',decisions:'',resources:'',
  source:'https://fixture.invalid/reviewed-original',version:'',release:''};
 return {schema:1,entries:[
  {id:activeId,archived:false,revisions:[
   {...row,at:20,extension:{fixture:'unknown-field-sentinel'}},
   {...row,at:10,goal:printable,source:'https://fixture.invalid/reviewed-second'},
   {...row,at:30,goal:'newer-unselected-sentinel'},
  ]},
  {id:archivedId,archived:true,revisions:[
   {...row,at:20,goal:'archived-old-sentinel'},
   {...row,at:10,goal:'archived-second-sentinel'},
  ]},
 ]};
}

export async function checkNativeProjectComparison({browser,origin,temporary}){
 // The product's normal project backup importer creates the saved rows. The
 // pre-existing harness owns temporary; the isolated context is not its editor.
 const contents=JSON.stringify(projectComparisonFixture())+'\n';
 const fixture=path.join(temporary,'native-project-comparison-fixture.json');
 fs.writeFileSync(fixture,contents,{encoding:'utf8',flag:'wx'});
 const context=await browser.newContext({serviceWorkers:'block'});
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
  await page.goto(origin+'/#projects');
  await page.getByLabel('Import backup').setInputFiles(fixture);
  await page.getByRole('button',{name:'Import reviewed projects',exact:true}).click();
  await page.getByText('Imported 2 new projects; retained 0 identical projects. Saved in this browser.',{exact:true}).waitFor();
  // Recover through the normal browser reload before claiming these are saved.
  await page.reload();
  const before=await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1'));
  assert.deepEqual(JSON.parse(before)?.workspaces?.projects,projectComparisonFixture());
  const detail=page.locator('#detail');
  async function show(id){
   await page.locator('[data-project="'+id+'"] button').click();
   await detail.getByText('Compare saved revisions',{exact:true}).click();
   return detail.locator('textarea[data-comparison-receipt]');
  }
  const prepare=detail.getByRole('button',{name:'Prepare comparison receipt',exact:true});
  let receipt=await show(activeId);
  await detail.getByLabel('Before revision',{exact:true}).selectOption('0');
  await detail.getByLabel('After revision',{exact:true}).selectOption('1');
  await prepare.click();
  await receipt.waitFor();
  const text=await receipt.inputValue(),value=JSON.parse(text);
  assert.equal(value.format,'athena-project-revision-comparison');
  assert.equal(value.schema,1);
  assert.equal(value.project_id,activeId);
  assert.deepEqual([value.before.revision,value.before.at,value.after.revision,value.after.at],[1,20,2,10]);
  assert.equal(value.after.fields.goal,printable);
  assert.equal(value.before.fields.source,'https://fixture.invalid/reviewed-original');
  assert.equal(value.after.fields.source,'https://fixture.invalid/reviewed-second');
  assert.deepEqual(value.changed_fields,['goal','source']);
  assert.doesNotMatch(text,/newer-unselected-sentinel|unknown-field-sentinel|archived-old-sentinel/);
  assert.equal(await receipt.getAttribute('aria-label'),'Copyable saved revision comparison receipt');
  assert.equal(await receipt.evaluate(el=>el.readOnly),true);
  assert.equal(await detail.locator('img,iframe').count(),0);

  await detail.getByText('Compare saved revisions',{exact:true}).click();
  await receipt.waitFor({state:'hidden'});
  assert.equal(await receipt.evaluate(el=>el.value),'');
  await page.getByRole('button',{name:'Show archived',exact:true}).click();
  receipt=await show(archivedId);
  await prepare.click();
  await receipt.waitFor();
  const alternate=JSON.parse(await receipt.inputValue());
  assert.equal(alternate.project_id,archivedId);
  assert.equal(alternate.before.fields.goal,'archived-old-sentinel');
  assert.equal(alternate.after.fields.goal,'archived-second-sentinel');
  assert.equal(await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),before);
  assert.equal(fs.readFileSync(fixture,'utf8'),contents);
  assert.deepEqual(unexpected,[]);
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
}
