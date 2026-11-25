const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {execFileSync}=require('node:child_process'),os=require('node:os');
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
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',locale:'en-US'});
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
  const win={schema:'athena-windows-directory-observation-v1',
   scope:'Explicit directory direct children only. No child content, recursion, names, IDs or paths returned.',
   records_examined:4,observed_file_pathnames:3,logical_pathname_bytes:8193,
   identified_unique_files:2,observed_identified_allocation_bytes:8192,excluded_directories:1,
   excluded_reparse_entries:0,files_without_stable_id:0,identity_or_name_conflicts:0,
   stopped_entry_limit:true,stopped_batch_limit:false,partial:true,point_in_time_snapshot:false,reclaimable_space_inferred:false};
  const windowsView=page.locator('.windows-report');
  await choose('#windows-observation-file',win);
  await windowsView.getByText('Partial observation: entry limit reached.').waitFor();
  await windowsView.getByText('8 KiB (8,192 bytes)',{exact:true}).waitFor();
  assert.match(await windowsView.textContent(),/not a point-in-time snapshot or an estimate of reclaimable space/i);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await panel.isVisible(),false);
  await windowsView.screenshot({path:'browser-results/storage-windows-observation.png'});
  await choose('#windows-observation-file',{...win,path:'C:/private-folder'});
  await windowsView.getByText(/Previous report preserved/).waitFor();
  assert.doesNotMatch(await windowsView.textContent(),/private-folder/);
  await windowsView.getByRole('button',{name:'Clear Windows report'}).click();
  assert.equal(await windowsView.locator('.windows-evidence article').count(),0);
  const complete={...win,stopped_entry_limit:false,partial:false};
  await choose('#windows-observation-file',complete);
  await choose('#windows-comparison-file',{...complete,logical_pathname_bytes:8200});
  const same=page.locator('#windows-same-scope'),changes=page.locator('#windows-differences li');
  assert.equal(await changes.count(),0);
  await same.check();
  await page.getByText('Logical pathname bytes: +7',{exact:true}).waitFor();
  await choose('#windows-comparison-file',win);
  await page.locator('#windows-comparison-guidance').filter({hasText:'partial'}).waitFor();
  assert.equal(await same.isDisabled(),true);
  assert.equal(await changes.count(),0);
  await page.getByRole('button',{name:'Clear second Windows report'}).click();
  if(process.env.ATHENA_TEST_PACKAGED_WIN_OBSERVATION){
   assert.equal(process.platform,'win32');
   const folder=fs.mkdtempSync(path.join(os.tmpdir(),'athena-windows-report-'));
   try{
    fs.writeFileSync(path.join(folder,'private-original'),Buffer.alloc(12345,7));
    fs.linkSync(path.join(folder,'private-original'),path.join(folder,'private-alias'));
    fs.mkdirSync(path.join(folder,'private-subdirectory'));
    fs.writeFileSync(path.join(folder,'private-subdirectory','private-excluded'),Buffer.alloc(9999,2));
    const real=JSON.parse(execFileSync(path.resolve(process.env.ATHENA_TEST_PACKAGED_WIN_OBSERVATION),
     ['windows-directory-observation',folder,'100'],{encoding:'utf8',timeout:30000}));
    assert.equal(real.partial,false);assert.equal(real.logical_pathname_bytes,24690);
    assert.equal(real.observed_file_pathnames,2);assert.equal(real.identified_unique_files,1);
    assert.equal(real.excluded_directories,1);
    await choose('#windows-observation-file',real);
    await windowsView.getByText(/24,690 bytes/).waitFor();
    assert.match(await windowsView.textContent(),/1 directory; 0 reparse entries/);
    assert.doesNotMatch(await windowsView.textContent(),/private-original|private-alias|private-subdirectory|private-excluded/);
    fs.writeFileSync(path.join(folder,'private-added'),Buffer.alloc(101,5));
    const second=JSON.parse(execFileSync(path.resolve(process.env.ATHENA_TEST_PACKAGED_WIN_OBSERVATION),
     ['windows-directory-observation',folder,'100'],{encoding:'utf8',timeout:30000}));
    assert.equal(second.partial,false);
    await choose('#windows-comparison-file',second);
    await same.check();
    await page.getByText('Logical pathname bytes: +101',{exact:true}).waitFor();
    await page.getByText('Identified unique files: +1',{exact:true}).waitFor();
    assert.doesNotMatch(await windowsView.textContent(),/private-original|private-alias|private-subdirectory|private-excluded|private-added/);
    await windowsView.screenshot({path:'browser-results/storage-windows-observation-real.png'});
    console.log('Extracted Windows atlas-lab generated the local hardlink report loaded by Chromium; the nested file was excluded.');
   }finally{fs.rmSync(folder,{recursive:true,force:true});}
  }
  assert.deepEqual(external,[]);
  console.log('Native Storage: Linux category comparison and separate Windows aggregate report with no network egress.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
