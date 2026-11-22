// Actual loopback Rust + Chromium acceptance. Fresh synthetic database only; no provider requests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),http=require('node:http'),net=require('node:net'),{spawn,spawnSync}=require('node:child_process'),{chromium}=require('playwright');
const binary=path.resolve(process.env.ATHENA_LAB_BINARY||'engineering/apps/atlas-lab/target/debug/atlas-lab'),pkg=path.resolve(process.env.ATHENA_RUNTIME_PACKAGE||'public'),out=path.resolve(process.env.ATHENA_LAB_TEST_OUTPUT||'lab-runtime-results'),origin='http://127.0.0.1:41379';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),report={kind:'Actual Rust engine and Chromium with generated local fixtures',started:new Date().toISOString(),checks:[],errors:[],cspViolations:[],outsideRequests:[],limitations:['Generated snapshots, not live provider collection','Controlled restart persistence, not power-loss certification','No Windows acceptance','External media disabled in privileged local engine mode']};let proc,browser,page,serverLog;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function request(route,{method='GET',headers={},body}={}){return new Promise((resolve,reject)=>{const req=http.request(origin+route,{method,headers,timeout:15000},res=>{const chunks=[];let bytes=0;res.on('data',b=>{bytes+=b.length;if(bytes>20*1024*1024){req.destroy(Error('Response budget'));return;}chunks.push(b)});res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));});req.on('error',reject);req.on('timeout',()=>req.destroy(Error('Request deadline')));if(body)req.write(body);req.end();});}
async function check(name,fn){report.currentCheck=name;await fn();report.checks.push({name,result:'pass'});}
async function stop(){if(!proc)return;const own=proc;proc=null;if(own.exitCode!==null)return;own.kill('SIGINT');await Promise.race([new Promise(r=>own.once('exit',r)),wait(5000).then(()=>{if(own.exitCode===null)own.kill('SIGKILL');})]);}
async function start(){proc=spawn(binary,['serve-athena',path.join(out,'fixture.sqlite'),pkg],{stdio:['ignore',serverLog,serverLog]});for(let i=0;i<100;i++){if(proc.exitCode!==null)throw Error('Server exited before ready');try{const r=await request('/api/runtime');if(r.status===200)return JSON.parse(r.body);}catch{}await wait(50);}throw Error('Server readiness deadline');}
async function verifyFinalDatabase(){await check('Final SQLite integrity and exact job count',async()=>{await stop();const integrity=spawnSync('python3',['-c','import sqlite3,sys,pathlib; c=sqlite3.connect(pathlib.Path(sys.argv[1]).as_uri()+"?mode=ro",uri=True); print(c.execute("pragma integrity_check").fetchone()[0]); print(c.execute("select count(*) from jobs").fetchone()[0]); c.close()',path.join(out,'fixture.sqlite')],{encoding:'utf8'});assert.equal(integrity.status,0);assert.equal(integrity.stdout.trim(),'ok\n1');report.integrity=integrity.stdout.trim();});}
(async()=>{fs.mkdirSync(out,{recursive:false});serverLog=fs.openSync(path.join(out,'server.log'),'a');report.binarySHA256=hash(fs.readFileSync(binary));report.harnessSHA256=hash(fs.readFileSync(__filename));report.packageSHA256=hash(fs.readFileSync(path.join(pkg,'athena-runtime-manifest.json')));
 await new Promise((resolve,reject)=>{const socket=net.createServer();socket.once('error',reject);socket.listen(41379,'127.0.0.1',()=>socket.close(resolve));});
 const project=' {"id":"SHARED01","slug":"generated","title":"Generated project","description":"Synthetic browser fixture, not provider evidence","project_type":"mod","versions":[],"unknown":18446744073709551617,"markup":"<script>inert</script> 雪"} ';
 const earlier='9007199254740993',later='9007199254740995',missing='9007199254740994';
 const latest=project.replace('Generated project','Newer generated project');
 async function verifyProjectArchives(){
  const latestResponse=await request('/api/project-archive/SHARED01');
  assert.equal(latestResponse.body.toString(),latest);assert.equal(latestResponse.headers['x-atlas-generation'],later);
  const exactResponse=await request('/api/project-archive/SHARED01/'+earlier);
  assert.equal(exactResponse.body.toString(),project);assert.equal(exactResponse.headers['x-atlas-generation'],earlier);
  assert.equal((await request('/api/project-archive/SHARED01/'+missing)).status,404);
  const head=await request('/api/project-history/SHARED01?limit=12');
  assert.equal(head.status,200);
  const history=JSON.parse(head.body);assert.deepEqual(history.entries.slice(0,2).map(row=>row.generation),[later,earlier]);
  assert.equal(history.entries.length,12);assert.equal(history.next_before,'3');
  assert.ok(history.entries.every(row=>!Object.hasOwn(row,'payload')&&Number.isSafeInteger(row.stored_bytes)));
  const tail=await request('/api/project-history/SHARED01?limit=12&before='+history.next_before);
  assert.equal(tail.status,200);const older=JSON.parse(tail.body);
  assert.deepEqual(older.entries.map(row=>row.generation),['2','1']);assert.equal(older.next_before,null);

 }
 const seed=spawnSync('python3',['-c',`import sqlite3,sys\nc=sqlite3.connect(sys.argv[1]);c.execute('CREATE TABLE snapshots(generation INTEGER PRIMARY KEY,provider TEXT NOT NULL,canonical_id TEXT NOT NULL,observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,payload TEXT NOT NULL)');c.executemany("INSERT INTO snapshots(generation,provider,canonical_id,payload) VALUES(?,'modrinth-project-raw','SHARED01',?)",[(int(sys.argv[2]),sys.argv[3]),(int(sys.argv[4]),sys.argv[5])] + [(i,sys.argv[3]) for i in range(1,13)]);c.commit();c.close()`,path.join(out,'fixture.sqlite'),earlier,project,later,latest],{encoding:'utf8'});assert.equal(seed.status,0,seed.stderr);
 const identity=await start();assert.equal(identity.runtime_manifest_sha256,report.packageSHA256);report.firstEngine=identity.engine_instance;
 await check('Served shell and every allowlisted runtime file match package bytes',async()=>{const manifest=JSON.parse(fs.readFileSync(path.join(pkg,'athena-runtime-manifest.json')));for(const file of manifest.files){if(file.path==='.nojekyll')continue;const r=await request('/'+file.path);assert.equal(r.status,200,file.path);assert.equal(hash(r.body),file.sha256,file.path);assert.equal(r.headers['x-athena-asset-sha256'],file.sha256);assert.equal(r.headers['x-athena-runtime-sha256'],report.packageSHA256);assert.equal(r.headers['cache-control'],'no-store');assert.equal(r.headers['x-content-type-options'],'nosniff');}report.verifiedAssets=manifest.files.length-1;});
 await check('Loopback API keeps strict Host, Origin, custom-header and no-CORS protections',async()=>{const job='"DedupExperiment"';for(const headers of [{},{Origin:'https://evil.invalid','X-Atlas-Request':'local-ui'},{Origin:origin},{Origin:origin,'X-Atlas-Request':'wrong'},{Origin:origin,'X-Atlas-Request':'local-ui',Host:'evil.invalid'}])assert.equal((await request('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:job})).status,403);assert.equal((await request('/api/overview',{headers:{Host:'evil.invalid'}})).status,403);assert.equal((await request('/api/jobs',{method:'OPTIONS',headers:{Origin:'https://evil.invalid'}})).status,403);const r=await request('/');assert.equal(r.headers['access-control-allow-origin'],undefined);assert.match(r.headers['content-security-policy'],/script-src 'self'; style-src 'self'/);assert.doesNotMatch(r.headers['content-security-policy'],/unsafe-inline|unsafe-eval|https:/);for(const p of ['/fixture.sqlite','/../fixture.sqlite','/%2e%2e/fixture.sqlite','/.git/config','/api/no-such-endpoint'])assert.equal((await request(p)).status,404,p);});
 await check('Disabled CurseForge operation is rejected before any durable job or provider request',async()=>{const before=JSON.parse((await request('/api/overview')).body).jobs;const rejected=await request('/api/jobs',{method:'POST',headers:{Origin:origin,'X-Atlas-Request':'local-ui','Content-Type':'application/json'},body:JSON.stringify({CollectCurseForge:{project:700001}})});assert.equal(rejected.status,422);assert.deepEqual(JSON.parse((await request('/api/overview')).body).jobs,before);});
 if(process.env.ATHENA_LAB_HTTP_ONLY==='1'){
   report.kind='Actual Rust loopback HTTP and controlled restart only; browser untested';
   await check('Exact generated archive reads and bounded experiment persist across restart',async()=>{
     await verifyProjectArchives();
     const receipt=await request('/api/jobs',{method:'POST',headers:{Origin:origin,'X-Atlas-Request':'local-ui','Content-Type':'application/json'},body:'"DedupExperiment"'});assert.equal(receipt.status,200);
     let overview;for(let i=0;i<160;i++){overview=JSON.parse((await request('/api/overview')).body);if(overview.jobs[0]&&['succeeded','failed'].includes(overview.jobs[0].state))break;await wait(150);}
     assert.equal(overview.jobs[0].state,'succeeded');assert.ok(overview.jobs[0].result.experiment.evidence.trials.length>0);assert.ok(overview.jobs[0].result.experiment_id);report.job=overview.jobs[0];
     await stop();const restarted=await start();assert.notEqual(restarted.engine_instance,identity.engine_instance);report.secondEngine=restarted.engine_instance;
     assert.deepEqual(JSON.parse((await request('/api/overview')).body).jobs[0],report.job);await verifyProjectArchives();
   });
   await verifyFinalDatabase();report.result='pass';return;
 }
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),env:{...process.env,XDG_CONFIG_HOME:path.join(out,'chromium-config'),XDG_CACHE_HOME:path.join(out,'chromium-cache')}});report.browser=await browser.version();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',acceptDownloads:true});await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){report.outsideRequests.push(route.request().url());return route.abort();}return route.continue();});await context.exposeBinding('__recordAthenaCSP',(_source,value)=>report.cspViolations.push(value));await context.addInitScript(()=>{window.__athenaCSP=[];document.addEventListener('securitypolicyviolation',e=>{const value={directive:e.effectiveDirective,blocked:e.blockedURI};window.__athenaCSP.push(value);window.__recordAthenaCSP(value);});});page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 async function workspace(id){await page.locator('[data-nav="'+id+'"]').click();await page.waitForFunction(id=>document.querySelector('#main').dataset.workspace===id,id);await page.locator('.workspace-status').filter({hasText:'Athena '+({lab:'local r&d lab',research:'research',media:'media workbench'}[id])+' workspace loaded.'}).waitFor();}
 await page.goto(origin+'/#lab');await page.waitForFunction(()=>document.querySelector('.workspace-container')?.shadowRoot?.getElementById('connection')?.textContent.includes('Connected'));
 await check('Unified native Lab mounts under the original strict CSP',async()=>{assert.equal(await page.locator('body > .sidebar').count(),1);assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.locator('.workspace-container link[rel="stylesheet"]').count(),1);assert.equal(await page.locator('.workspace-container #pending').textContent(),'0');assert.equal(await page.locator('.workspace-container #connection').evaluate(el=>getComputedStyle(el).fontSize),'11px');assert.deepEqual(await page.evaluate(()=>window.__athenaCSP),[]);});
 await require('./curseforge_preview_browser_checks.cjs')({page,check,out,expected:JSON.parse(fs.readFileSync(path.resolve(__dirname,'../engineering/experiments/site-extraction-lab/fixtures/curseforge-synthetic/preview-receipt.json'))).preview});
 await check('Native Collection reopens the exact requested generation, keeps last-good and downloads original bytes',async()=>{
  await page.locator('.workspace-container [data-panel="collectors"]').click();
  const input=page.locator('.workspace-container #saved-archive-id');
  const generation=page.getByLabel('Saved generation (optional)',{exact:true});
  const submit=page.locator('.workspace-container #saved-archive-form button');
  const dialog=page.locator('.workspace-container #saved-archive-dialog');
  const text=page.locator('.workspace-container #saved-archive-text');
  const title=page.locator('.workspace-container #saved-archive-title');
  const status=page.locator('.workspace-container #saved-archive-status');
  const close=()=>page.locator('.workspace-container #close-saved-archive').click();
  const reopen=()=>page.locator('.workspace-container #show-last-archive').click();
  await input.fill('SHARED01');assert.equal(await generation.inputValue(),'');
  await submit.click();await dialog.waitFor({state:'visible'});
  assert.equal(await text.textContent(),latest);assert.ok((await title.textContent()).endsWith(later));
  await close();await generation.fill(earlier);
  const explicit=page.waitForRequest(r=>r.url()===origin+'/api/project-archive/SHARED01/'+earlier&&r.method()==='GET');
  await submit.click();await explicit;await dialog.waitFor({state:'visible'});
  assert.equal(await text.textContent(),project);assert.ok((await title.textContent()).endsWith(earlier));
  const downloadPromise=page.waitForEvent('download');await page.locator('.workspace-container #download-saved-archive').click();
  const download=await downloadPromise,dest=path.join(out,'synthetic-archive.json');
  await download.saveAs(dest);assert.equal(hash(fs.readFileSync(dest)),hash(Buffer.from(project)));
  await close();await generation.fill(missing);await submit.click();await status.filter({hasText:'The latest response was not opened'}).waitFor();
  await reopen();assert.equal(await text.textContent(),project);assert.ok((await title.textContent()).endsWith(earlier));await close();
  await generation.fill('');await input.fill('MISSING1');await submit.click();await status.filter({hasText:'No archived response'}).waitFor();
  await reopen();assert.equal(await text.textContent(),project);await close();
 });
 await check('Native saved-generation list reads bounded metadata only and reopens exact retained bytes',async()=>{
  const input=page.locator('.workspace-container #saved-archive-id');
  const generation=page.getByLabel('Saved generation (optional)',{exact:true});
  const open=page.getByRole('button',{name:'List saved generations',exact:true});
  const panel=page.getByRole('region',{name:'Saved generations',exact:true});
  const old=page.getByRole('button',{name:'Older generations',exact:true});
  const dismiss=page.getByRole('button',{name:'Close generation list',exact:true});
  const rows=panel.getByRole('listitem');
  const dialog=page.locator('.workspace-container #saved-archive-dialog');
  const archive=page.locator('.workspace-container #saved-archive-text');
  let reads=[];const observe=r=>{if(r.url().includes('-history/')||r.url().includes('-archive/'))reads.push([r.method(),r.url()]);};page.on('request',observe);
  try{
   await input.fill('SHARED01');assert.deepEqual(reads,[]);
   await open.click();await panel.getByRole('button',{name:'Open generation '+earlier,exact:true}).waitFor();
   assert.equal(await rows.count(),12);assert.deepEqual(reads,[['GET',origin+'/api/project-history/SHARED01?limit=12']]);
   const selected=panel.getByRole('button',{name:'Open generation '+earlier,exact:true});
   await selected.click();await dialog.waitFor({state:'visible'});
   assert.equal(await generation.inputValue(),earlier);assert.equal(await archive.textContent(),project);
   assert.deepEqual(reads.at(-1),['GET',origin+'/api/project-archive/SHARED01/'+earlier]);
   await page.locator('.workspace-container #close-saved-archive').click();
   await old.click();const first=panel.getByRole('button',{name:'Open generation 2',exact:true});await first.waitFor();
   assert.equal(await rows.count(),2);assert.equal(await old.isDisabled(),true);
   assert.equal(await first.evaluate(el=>el===el.getRootNode().activeElement),true);
   assert.deepEqual(reads.at(-1),['GET',origin+'/api/project-history/SHARED01?limit=12&before=3']);
   await dismiss.click();await panel.waitFor({state:'hidden'});
   assert.equal(await open.evaluate(el=>el===el.getRootNode().activeElement),true);
   assert.equal(await generation.inputValue(),earlier);

   let release;const delay=new Promise(r=>{release=r});
   const route=origin+'/api/project-history/SHARED01?limit=12';
   const hold=async request=>{await delay;try{await request.continue();}catch{}};
   await page.route(route,hold);
   try{
    const request=page.waitForRequest(req=>req.url()===route);
    await open.click();await request;
    await input.fill('MISSING1');await panel.waitFor({state:'hidden'});
    release();
    await open.click();
    await panel.getByRole('status').filter({hasText:'No retained generations'}).waitFor();
    assert.equal(await rows.count(),0);
   }finally{release();await page.unroute(route,hold);}
   assert.equal(reads.every(([method])=>method==='GET'),true);
   assert.equal(reads.filter(([,url])=>url.includes('-archive/')).length,1);
  }finally{page.off('request',observe);}
 });
 await check('Native bounded experiment writes a durable job and preserves raw evidence',async()=>{await page.locator('.workspace-container [data-panel="experiments"]').click();await page.locator('.workspace-container #run-experiment').click();await page.locator('.workspace-container #experiment-status').filter({hasText:'queued'}).waitFor();await page.locator('.workspace-container [data-panel="overview"]').click();let overview;for(let i=0;i<120;i++){overview=JSON.parse((await request('/api/overview')).body);if(overview.jobs[0]&&['succeeded','failed'].includes(overview.jobs[0].state))break;await wait(150);}assert.equal(overview.jobs.length,1);assert.equal(overview.jobs[0].state,'succeeded');assert.ok(overview.jobs[0].result.experiment.evidence.trials.length>0);assert.ok(overview.jobs[0].result.experiment_id);report.job=overview.jobs[0];await page.waitForFunction(()=>document.querySelector('.workspace-container').shadowRoot.getElementById('completed').textContent==='1');await page.locator('.workspace-container .job summary').click();assert.match(await page.locator('.workspace-container .job pre').textContent(),/acceptance_policy/);});
 await page.screenshot({path:path.join(out,'lab-dark.png'),fullPage:true});
 await check('Shared navigation retains Lab state and Research styles under strict CSP',async()=>{await workspace('research');assert.match(await page.locator('.workspace-container #result-count').textContent(),/283/);assert.equal(await page.locator('.workspace-container .research-card').first().evaluate(el=>getComputedStyle(el).borderRadius),'8px');await workspace('media');assert.ok(await page.locator('.workspace-container article.card').count()>0);assert.equal(await page.locator('.workspace-container #load-media').isDisabled(),true);assert.equal(await page.locator('.workspace-container .player-controls button:not([disabled])').count(),0);assert.match(await page.locator('.workspace-container #status').textContent(),/disabled to keep third-party code/);await workspace('lab');await page.waitForFunction(()=>document.querySelector('.workspace-container').shadowRoot.getElementById('completed').textContent==='1');await page.locator('#theme').click();await page.screenshot({path:path.join(out,'lab-light.png'),fullPage:true});});
 await check('Controlled engine restart preserves SQLite jobs, experiment journal and exact archive',async()=>{await stop();const before=JSON.stringify(report.job);const restarted=await start();assert.notEqual(restarted.engine_instance,identity.engine_instance);const overview=JSON.parse((await request('/api/overview')).body);assert.equal(JSON.stringify(overview.jobs[0]),before);await verifyProjectArchives();report.secondEngine=restarted.engine_instance;await page.reload();await page.waitForFunction(()=>document.querySelector('.workspace-container')?.shadowRoot?.getElementById('completed')?.textContent==='1');});
 assert.deepEqual(await page.evaluate(()=>window.__athenaCSP),[]);assert.deepEqual(report.cspViolations,[]);assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);await verifyFinalDatabase();report.result='pass';
})().catch(async error=>{report.result='failed';report.failure=error.stack;process.exitCode=1;if(page){try{report.failureView=await page.evaluate(()=>({hash:location.hash,status:document.querySelector('.workspace-status')?.textContent,content:document.querySelector('.workspace-container')?.shadowRoot?.innerHTML?.slice(-20000),csp:window.__athenaCSP}));await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}}).finally(async()=>{await browser?.close();await stop();if(serverLog!==undefined)fs.closeSync(serverLog);report.finished=new Date().toISOString();if(fs.existsSync(out))fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));});
