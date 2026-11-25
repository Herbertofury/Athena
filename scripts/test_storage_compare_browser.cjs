const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(process.env.ATHENA_PUBLIC_ROOT||'dist');
const report=(date,media,source)=>({schema:'athena-storage-observation-v1',platform:'linux',observedAt:date,partial:false,
 stops:{entryLimit:0,depthLimit:0,deadline:0,unreadable:0,changed:0},skipped:{links:0,mounts:0,special:0},
 totals:{logicalBytes:160,allocatedBytes:media+source,files:2,physicalFiles:2},
 categories:[{name:'Media',allocatedBytes:media,logicalBytes:100,files:1},{name:'Source',allocatedBytes:source,logicalBytes:60,files:1}]});
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const target=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(target!==root&&!target.startsWith(root+path.sep))return res.writeHead(403).end();
 const f=target===root?path.join(root,'index.html'):target;
 try{return res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}
 catch{return res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const external=[];await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():(external.push(r.request().url()),r.abort()));
  await page.goto(origin+'/#storage');await page.getByRole('heading',{name:'Compare two local observations'}).waitFor();
  const choose=(query,value)=>page.locator(query).setInputFiles({name:'report.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});
  await choose('#observation-file',report('2026-11-21T00:00:00Z',4096,4096));
  await choose('#comparison-file',report('2026-11-22T00:00:00Z',0,16384));
  await page.locator('#compare-same').waitFor();
  const panel=page.locator('#compare-categories');assert.equal(await panel.isVisible(),false);
  await page.locator('#compare-same').check();
  await page.locator('#compare-sort').selectOption('allocatedBytes');
  assert.deepEqual(await page.locator('#compare-category-rows strong').allTextContents(),['Source','Media']);
  assert.match(await page.locator('#compare-category-rows').textContent(),/\+12 KiB allocated/);
  assert.match(await page.locator('#compare-category-rows').textContent(),/−4 KiB allocated/);
  await page.locator('#search').fill('media');assert.deepEqual(await page.locator('#compare-category-rows strong').allTextContents(),['Media']);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  fs.mkdirSync('browser-results',{recursive:true});await panel.screenshot({path:'browser-results/storage-category-changes.png'});
  await page.locator('#clear-comparison').click();assert.equal(await panel.isVisible(),false);
  assert.deepEqual(external,[]);
  console.log('Native Storage category changes: scope confirmation, signs, sorting, search, clear and no network egress.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
