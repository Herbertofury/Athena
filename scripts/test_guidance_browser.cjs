const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(process.env.ATHENA_PUBLIC_ROOT||'dist');
 const server=http.createServer((req,res)=>{res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'");const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return;}const f=p===root?path.join(root,'index.html'):p;try{res.setHeader('Content-Type',f.endsWith('.mjs')||f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/#guidance`);await page.getByRole('heading',{name:'Build once. Carry the understanding.'}).waitFor();
  await page.waitForFunction(()=>{const b=document.querySelector('.workspace-container')?.shadowRoot?.querySelector('.reader');return b&&getComputedStyle(b).borderRadius==='20px';});
  assert.equal(await page.getByRole('checkbox').count(),16);assert.equal(await page.locator('iframe').count(),0);fs.mkdirSync('browser-results',{recursive:true});await page.screenshot({path:'browser-results/guidance-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Select all standards',exact:true}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export selected JSON',exact:true}).click()]);const packet=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(packet.documents.length,16);assert(packet.scope.includes('Does not install'));assert(packet.documents.every(d=>d.sha256.length===64&&d.text&&d.sourcePath.startsWith('guidance/')));
  await page.reload();await page.getByRole('checkbox').first().waitFor();assert.equal(await page.getByRole('checkbox',{checked:true}).count(),16);
  await page.getByRole('button',{name:'Athena Product Invariants',exact:true}).click();
  const outline=page.locator('details[aria-label="Sections in selected standard"]');
  const sectionName='19. Project to-do awareness without task drift';
  const selectedBytes=await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),currentUrl=page.url(),outlineRequests=[];
  const observe=request=>outlineRequests.push(request.url());page.on('request',observe);
  try{
   await outline.getByText('Jump to a section',{exact:true}).click();
   assert.equal(await outline.getByRole('button').count(),19);
   const item=outline.getByRole('button',{name:sectionName,exact:true});
   await item.focus();await page.keyboard.press('Enter');
   const heading=page.getByRole('heading',{name:sectionName,exact:true});
   assert.equal(await heading.evaluate(el=>el===el.getRootNode().activeElement),true);
   const visible=await heading.evaluate(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;});assert.equal(visible,true);
   await heading.locator('..').getByRole('button',{name:'Back to sections',exact:true}).click();
   assert.equal(await item.evaluate(el=>el===el.getRootNode().activeElement),true);
   assert.equal(page.url(),currentUrl);
   assert.equal(await page.evaluate(()=>localStorage.getItem('athena-workspaces-v1')),selectedBytes);
   assert.deepEqual(outlineRequests,[]);
  }finally{page.off('request',observe);}
  await page.locator('#search').fill('sensitive actions');await page.getByRole('button',{name:'Authorization & Runtime Control Standard',exact:true}).click();await page.getByRole('heading',{name:'Authorization & Runtime Control Standard',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'View canonical source',exact:true}).getAttribute('href'),'https://github.com/Herbertofury/Athena/blob/main/guidance/AUTHORIZATION_CONTROL_STANDARD.md');
  await page.locator('#search').fill('synthetic impossible phrase');await page.getByText('No matching standards. Clear the shared search to see the complete library.',{exact:true}).waitFor();assert.equal(await page.getByRole('checkbox').count(),0);
  await page.locator('#search').fill('');await page.getByRole('checkbox').nth(15).waitFor();await page.getByRole('button',{name:'Clear selection',exact:true}).click();assert(await page.getByRole('button',{name:'Export selected JSON',exact:true}).isDisabled());
  await page.getByRole('checkbox').first().check();const [md]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export selected Markdown',exact:true}).click()]);const text=fs.readFileSync(await md.path(),'utf8');assert(text.includes('SHA-256:'));assert(text.includes('Reference only.'));assert(text.includes(packet.documents[0].text));
  await page.locator('nav [data-nav=continuity]').click();await page.getByRole('link',{name:'Guidance library',exact:true}).click();await page.getByRole('checkbox').first().waitFor();assert.equal(await page.getByRole('checkbox',{checked:true}).count(),1);
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('Synthetic quota failure');};});await page.getByRole('button',{name:'Select all standards',exact:true}).click();await page.getByText(/Selection could not be saved. Export it before leaving this page./).waitFor();
  const [recovery]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export selected JSON',exact:true}).click()]);assert.equal(JSON.parse(fs.readFileSync(await recovery.path(),'utf8')).documents.length,16);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:process.env.GUIDANCE_SCREENSHOT||'browser-results/guidance-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log('PASS native guidance route, complete16 standards, canonical-source navigation, shared search, persistent selection, JSON/Markdown downloads, quota recovery and narrow layout; local public packaged catalog only.');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
