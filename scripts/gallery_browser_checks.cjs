/* Actual native Media file-picker/download checks. No provider access. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
async function runGalleryBrowserChecks({page,origin,root,report,check}){
 await check('Native Media local gallery comparison preserves type guards, recovery and narrow receipts',async()=>{
  await page.goto(origin+'/#media');const panel=page.locator('[data-gallery-comparison]');await panel.waitFor();
  const select=panel.locator('[data-gallery-card]'),input=panel.locator('[data-gallery-file]'),status=panel.locator('[data-gallery-status]');
  await select.selectOption('modrinth:AANobbMI');const bytes=fs.readFileSync(path.resolve(__dirname,'../engineering/tests/fixtures/modrinth-sodium-public-excerpt-20261105.json'));
  const requests=[];const observe=req=>requests.push(req.url());page.on('request',observe);
  try{
   await input.setInputFiles({name:'local-private-fixture.json',mimeType:'application/json',buffer:bytes});await panel.getByRole('button',{name:'Compare gallery',exact:true}).click();await status.filter({hasText:': matching.'}).waitFor();
   const downloadEvent=page.waitForEvent('download');await panel.getByRole('button',{name:'Download comparison receipt'}).click();const download=await downloadEvent;const receipt=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
   assert.equal(receipt.input_sha256,crypto.createHash('sha256').update(bytes).digest('hex'));assert.equal(receipt.result.status,'matching');assert.deepEqual(Object.keys(receipt).sort(),['card_id','input_bytes','input_sha256','result','schema_version','scope']);assert.doesNotMatch(JSON.stringify(receipt),/local-private-fixture|cdn\.modrinth|Underwater/);
   await input.setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{')});await panel.getByRole('button',{name:'Compare gallery',exact:true}).click();await status.filter({hasText:'Last completed result is retained'}).waitFor();await panel.getByRole('button',{name:'Show last completed comparison'}).click();await status.filter({hasText:': matching.'}).waitFor();
   const malformed=JSON.parse(bytes);malformed.gallery[0].url=[malformed.gallery[0].url];await input.setInputFiles({name:'malformed.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(malformed))});await panel.getByRole('button',{name:'Compare gallery',exact:true}).click();await status.filter({hasText:': unknown.'}).waitFor();
   assert.deepEqual(requests,[],'local comparison and receipt must make no network requests');report.localGalleryComparison={matching:true,malformedURL:'unknown',failedReadRecovery:true,receiptFields:Object.keys(receipt),inputSHA256:receipt.input_sha256,requests:0};
  }finally{page.off('request',observe);}
  await page.locator('[data-nav="home"]').click();await panel.waitFor({state:'detached'});await page.locator('[data-nav="media"]').click();await panel.waitFor();assert.equal(await page.locator('[data-gallery-comparison]').count(),1);assert.equal(await panel.getByRole('button',{name:'Show last completed comparison'}).isDisabled(),true);
  const names=['compare.mjs','local-compare.mjs','gallery-comparison.mjs'];const hashes=await page.evaluate(async names=>Object.fromEntries(await Promise.all(names.map(async name=>{const data=await(await fetch('/workspaces/engineering/media/'+name)).arrayBuffer();return [name,Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('')]}))),names);
  for(const name of names)assert.equal(hashes[name],crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'workspaces/engineering/media',name))).digest('hex'));report.galleryModuleSHA256=hashes;
 });
}
module.exports={runGalleryBrowserChecks};
