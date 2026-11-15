// Real Chromium, entirely locally fulfilled app requests. No browser flags/security changes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'../..'),dist=path.join(root,'dist');
const filter="data.lessons.filter(l=>(l.id+' '+l.title+' '+l.summary+' '+l.category+' '+l.tags.join(' ')+' '+(l.learningGoals||[]).join(' ')).toLowerCase().includes(q))";
const baseline=fs.readFileSync(dist+'/app.js','utf8'),candidateCode=fs.readFileSync(__dirname+'/candidate.cjs','utf8');
if(!baseline.includes(filter))throw Error('Baseline contract drift');
const candidate=candidateCode+'\n'+baseline.replace('function search(q){','const candidateSearch=globalThis.AthenaOfflineSearchCandidate.create(data.lessons);\nfunction search(q){').replace(filter,'candidateSearch(q)');
(async()=>{let browser;const report={scope:'actual local Athena Chromium UI, experimental response substitution only',cases:[]};try{
 browser=await chromium.launch({headless:true});report.browser=browser.version();
 for(const [mode,app] of [['baseline',baseline],['candidate',candidate]]){
  const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!=='http://athena.local'){await route.abort();return;}const rel=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1),target=path.resolve(dist,rel);if(!target.startsWith(dist+path.sep)||!fs.existsSync(target)){await route.fulfill({status:404,body:'not found'});return;}const type=target.endsWith('.js')||target.endsWith('.mjs')?'text/javascript':target.endsWith('.css')?'text/css':target.endsWith('.html')?'text/html':'application/octet-stream';await route.fulfill({status:200,contentType:type,body:rel==='app.js'?app:fs.readFileSync(target)});});
  await page.goto('http://athena.local/');await page.locator('#search').waitFor();
  for(const query of ['subnet','database durable','Hashing encryption']){
   const runs=[];let ids=[];for(let i=0;i<11;i++){const result=await page.evaluate(async q=>{const input=document.querySelector('#search'),start=performance.now();input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {ms:performance.now()-start,ids:[...document.querySelectorAll('#main [data-lesson]')].map(x=>x.dataset.lesson)};},query);runs.push(result.ms);ids=result.ids;}
   report.cases.push({mode,query,ids,median_input_to_two_frames_ms:runs.sort((a,b)=>a-b)[5],p95_ms:runs[10]});
  }
  report[mode+'_loaded_app_sha256']=crypto.createHash('sha256').update(await page.evaluate(()=>fetch('app.js').then(r=>r.text()))).digest('hex');
  assert.equal(report[mode+'_loaded_app_sha256'],crypto.createHash('sha256').update(app).digest('hex'));
  assert.deepEqual(errors,[]);await context.close();
 }
 const row=(mode,q)=>report.cases.find(r=>r.mode===mode&&r.query===q);
 assert.deepEqual(row('baseline','subnet').ids,row('candidate','subnet').ids);
 assert(row('candidate','database durable').ids.includes('sys-durable-database'));
 assert(row('candidate','Hashing encryption').ids.includes('cryptography'));
 report.passed=true;
}catch(e){report.passed=false;report.error=String(e);process.exitCode=1;}finally{if(browser)await browser.close();console.log(JSON.stringify(report,null,2));}})();
