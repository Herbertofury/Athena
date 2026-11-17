/* Actual Chromium measured native surface geometry; neutral synthetic objects only. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.ATHENA_BROWSER_ROOT||'dist'),out=path.resolve(process.env.ATHENA_BROWSER_OUTPUT||'browser-results/foundry-axis-alignment');
const report={kind:'actual Chromium native base-box axis alignment',checks:[],errors:[],outsideRequests:[],limitations:['Approximate max-base fit and base-box center, not visual bounds affected by rotation, skew or transform origin']};
let browser,server,page;
async function check(name,fn){report.current=name;await fn();report.checks.push(name);}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();const data=fs.readFileSync(file),ext=path.extname(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'})[ext]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin&&u.protocol!=='blob:'){report.outsideRequests.push(u.href);return route.abort();}return route.continue();});
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(origin+'/index.html#build');
 await page.locator('[data-inspect-blend]').waitFor();
 await page.locator('.workspace-status').filter({hasText:/workspace loaded/}).waitFor();
 const one=s=>page.locator(s);



 const id=await one('[data-inspect-object]').inputValue();
 await check('six explicit alignments preserve the other axis and Undo on native surfaces',async()=>{
  report.measurements=[];
  for(const scope of ['world','ui','sticker']){
   await one('[data-inspect-scope]').selectOption(scope);if(scope==='sticker')await one('[data-inspect-anchor]').selectOption('inspector');await one('[data-inspect-scope-apply]').click();
   await one('[data-inspect-scale-x]').fill('-0.5');await one('[data-inspect-scale-y]').fill('0.5');await one('[data-inspect-transform]').click();
   for(const alignment of ['left','center','right','top','middle','bottom']){
    const oldX=Number(await one('[data-inspect-x]').inputValue()),oldY=Number(await one('[data-inspect-y]').inputValue());
    const d=await page.locator('.foundry-object').evaluateAll((os,id)=>{const n=os.find(o=>o.dataset.id===id),p=n.parentElement;return{width:p.clientWidth,height:p.clientHeight,bw:n.offsetWidth,bh:n.offsetHeight};},id);
    const horizontal=['left','center','right'].includes(alignment),axis=horizontal?'x':'y',size=(horizontal?d.bw:d.bh)*.5,extent=horizontal?d.width:d.height;
    assert(size+16<=extent,JSON.stringify(d));const near=(8+size/2)/extent,expected=100*(['center','middle'].includes(alignment)?.5:['left','top'].includes(alignment)?near:1-near);
    await one('[data-align-selected="'+alignment+'"]').click();
    const x=Number(await one('[data-inspect-x]').inputValue()),y=Number(await one('[data-inspect-y]').inputValue());assert(Math.abs((horizontal?x:y)-expected)<.001);assert.equal(horizontal?y:x,horizontal?oldY:oldX);
    if(Math.abs((horizontal?oldX:oldY)-expected)>=.001){await one('[data-undo]').click();assert.equal(Number(await one('[data-inspect-x]').inputValue()),oldX);assert.equal(Number(await one('[data-inspect-y]').inputValue()),oldY);}
    report.measurements.push({scope,alignment,dimensions:d,x,y,expected});
   }
  }
 });
 await check('position pin rejects alignment without changing coordinates',async()=>{
  await one('[data-inspect-pin]').check();const before=[await one('[data-inspect-x]').inputValue(),await one('[data-inspect-y]').inputValue()];await one('[data-align-selected="left"]').click();assert.deepEqual([await one('[data-inspect-x]').inputValue(),await one('[data-inspect-y]').inputValue()],before);await one('[data-inspect-pin]').uncheck();
 });
 await one('.foundry-grid').screenshot({path:path.join(out,'axis-alignment.png')});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outsideRequests,[]);report.result='pass';
})().catch(async e=>{report.result='failed';report.failure=e.stack;process.exitCode=1;if(page)try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
