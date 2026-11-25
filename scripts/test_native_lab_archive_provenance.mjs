import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export async function checkNativeLabArchiveProvenance({browser,origin}){
 const context=await browser.newContext({acceptDownloads:true,serviceWorkers:'block'});
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'athena synthetic raw archive '));
 const id='AANobbMI',generations=['9007199254740993','9007199254740994','9007199254740995'];
 const payload=Buffer.from(' {"id":"AANobbMI","slug":"fixture","title":"Retained twice","project_type":"mod","versions":[],"exact":18446744073709551617} ');
 const sha256=createHash('sha256').update(payload).digest('hex');
 const jobs=generations.map((generation,i)=>({id:i+8,id_text:String(i+8),state:'succeeded',attempt:1,job:{CollectModrinthRaw:{project:'fixture'}},result:{project_archive:{schema_version:1,status:'complete_received_response',canonical_id:id,generation,payload_bytes:payload.length,payload_sha256:sha256}}}));
 const observations=[],violations=[],errors=[],downloads=[];
 try{
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==origin||request.method()!=='GET'){
    violations.push([request.method(),url.origin,url.pathname]);return route.abort();
   }
   if(url.pathname==='/api/overview')return route.fulfill({json:{jobs,counts:{succeeded:3},worker_status:'running'},headers:{'x-atlas-engine-instance':'a'.repeat(32)}});
   const generation=url.pathname.split('/').at(-1);
   if(generations.includes(generation)&&url.pathname==='/api/project-archive/'+id+'/'+generation&&url.search===''){
    observations.push(generation);
    const body=generation===generations[2]?Buffer.alloc(payload.length,32):payload;
    return route.fulfill({status:200,body,headers:{'content-type':'application/json','content-length':String(body.length),
      'x-atlas-canonical-id':id,'x-atlas-archive-kind':'project','x-atlas-generation':generation,'x-atlas-payload-sha256':sha256}});
   }
   if(url.pathname.startsWith('/api/')&&url.pathname!=='/api/runtime'){
    violations.push([request.method(),url.origin,url.pathname]);return route.abort();
   }
   return route.continue();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));page.on('download',download=>downloads.push(download.suggestedFilename()));
  await page.goto(origin+'/#lab');
  const workspace=page.locator('#main[data-workspace=lab] .workspace-container');
  const dialog=workspace.locator('#saved-archive-dialog');
  const action=generation=>workspace.locator('[data-project-archive-review]').filter({hasText:generation});
  const storage=()=>page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));
  await action(generations[0]).waitFor();
  const initial=await storage();
  for(const [i,generation] of generations.slice(0,2).entries()){
   await action(generation).click();
   await dialog.locator('#saved-archive-title').filter({hasText:generation}).waitFor({state:'visible'});
   assert.equal(downloads.length,i*2,'opening the archive must not download either file');
   const [raw]=await Promise.all([page.waitForEvent('download'),dialog.getByRole('button',{name:'Download exact JSON',exact:true}).click()]);
   const filename='modrinth-project-'+id+'-generation-'+generation+'.json';
   assert.equal(raw.suggestedFilename(),filename);
   const original=path.join(temp,filename),renamed=path.join(temp,'moved-raw-'+i+'.json');
   await raw.saveAs(original);await fs.rename(original,renamed);
   const bytes=await fs.readFile(renamed);assert.deepEqual(bytes,payload);
   assert.equal(downloads.length,i*2+1,'exact JSON action downloads one file only');
   const [provenance]=await Promise.all([page.waitForEvent('download'),dialog.getByRole('button',{name:'Download provenance',exact:true}).click()]);
   assert.equal(provenance.suggestedFilename(),filename.slice(0,-5)+'.provenance.json');
   const receiptPath=path.join(temp,'record-'+i+'.provenance.json');await provenance.saveAs(receiptPath);
   const receipt=JSON.parse(await fs.readFile(receiptPath,'utf8'));
   assert.deepEqual(receipt,{schema:1,kind:'athena_lab_saved_archive_provenance',archive:{kind:'project',canonical_id:id,generation},
    payload:{filename,media_type:'application/json',byte_length:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')},
    verification:'sha256_matched_retained_local_response',authenticity:'not_asserted'});
   assert.equal(downloads.length,i*2+2,'separate provenance action downloads one file only');
   await dialog.getByRole('button',{name:'Close',exact:true}).click();
   await dialog.waitFor({state:'hidden'});
  }
  const corrupt=action(generations[2]);await corrupt.click();
  await workspace.getByText('Saved-response hash mismatch.',{exact:true}).waitFor();
  assert.equal(await dialog.isVisible(),false);
  assert.equal(downloads.length,4);
  assert.deepEqual(observations,generations);
  assert.deepEqual(await storage(),initial);
  assert.deepEqual(violations,[]);
  assert.deepEqual(errors,[]);
 }finally{await context.close();await fs.rm(temp,{recursive:true,force:true});}
}
