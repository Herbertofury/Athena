const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const root=path.join(__dirname,'../dist/workspaces/foundry');
 const themes=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'))).themes;
 const server=http.createServer((req,res)=>{
  const files={'/module.mjs':['native-ecology.mjs','text/javascript'],'/style.css':['style.css','text/css']};
  if(files[req.url]){const [file,type]=files[req.url];res.setHeader('Content-Type',type);res.end(fs.readFileSync(path.join(root,file)));return}
  if(req.url!=='/'){res.writeHead(404).end();return}
  res.setHeader('Content-Type','text/html');
  res.end(`<link rel="stylesheet" href="/style.css"><section class="foundry-workspace"><section id="host"></section></section><script type="module">import {attachNativeEcology} from '/module.mjs';window.themes=${JSON.stringify(themes)};window.layout={version:6,themeId:themes[0].id,roomId:themes[0].rooms[0].id,placements:{[themes[0].objects[0].id]:{objectId:themes[0].objects[0].id,x:.2,y:.3,pinned:false,brightness:.5,contrast:2,saturation:.25,hue:90,blur:1,opacity:.6,zIndex:42}}};window.adapter=attachNativeEcology({host:document.querySelector('#host'),themes});adapter.update(layout);</script>`);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true});
  const page=await browser.newPage(),outside=[];
  await page.route('**/*',route=>{if(new URL(route.request().url()).hostname!=='127.0.0.1'){outside.push(route.request().url());return route.abort()}return route.continue()});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.click('[data-ecology-open]');
  const actor=page.locator('[data-ecology-object]');
  const before=await actor.evaluate(el=>({filter:getComputedStyle(el).filter,opacity:getComputedStyle(el).opacity,z:getComputedStyle(el).zIndex,transform:el.style.transform,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
  assert.equal(before.filter,'brightness(0.5) contrast(2) saturate(0.25) hue-rotate(90deg) blur(1px)');assert.equal(before.opacity,'0.6');assert.equal(before.z,'42');assert.equal(before.width,110);assert.equal(before.height,150);
  await actor.press('ArrowRight');const after=await actor.evaluate(el=>({filter:getComputedStyle(el).filter,transform:el.style.transform}));assert.equal(after.filter,before.filter);assert.notEqual(after.transform,before.transform);assert.equal(await page.evaluate(()=>layout.placements[Object.keys(layout.placements)[0]].x),.2);
  await page.evaluate(()=>{const p=layout.placements[Object.keys(layout.placements)[0]];p.brightness='1) url(https://example.invalid/filter.svg#x) brightness(1';adapter.update(layout)});assert(!(await actor.evaluate(el=>getComputedStyle(el).filter)).includes('url('));
  const shapes=await page.evaluate(()=>{
   const seen=new Set(),receipts=[];
   for(const theme of themes)for(const object of theme.objects){if(seen.has(object.shape))continue;seen.add(object.shape);
    const value={version:6,themeId:theme.id,roomId:theme.rooms[0].id,placements:{[object.id]:{objectId:object.id,x:1,y:1,pinned:false}}};adapter.update(value);
    const stage=document.querySelector('[data-ecology-stage]'),el=stage.querySelector('button'),style=getComputedStyle(el.querySelector('.foundry-object-form'),'::before'),a=el.getBoundingClientRect(),s=stage.getBoundingClientRect();
    receipts.push({shape:el.dataset.shape,width:a.width,height:a.height,background:style.backgroundImage,clip:style.clipPath,radius:style.borderRadius,label:el.querySelector('.foundry-object-label').textContent,inside:a.right<=s.right+1&&a.bottom<=s.bottom+1});
   }return receipts;
  });
  assert.equal(shapes.length,5);for(const s of shapes){assert.equal(s.width,110);assert.equal(s.height,150);assert(s.background.includes('gradient'));assert(s.inside)}
  assert(shapes.find(x=>x.shape==='tower').clip.includes('polygon'));assert.notEqual(shapes.find(x=>x.shape==='chair').radius,shapes.find(x=>x.shape==='orb').radius);
  // At the lower-right collision boundary, keyboard movement must remain bounded using the actual authored form dimensions.
  await actor.press('ArrowRight');await actor.press('ArrowDown');assert(await actor.evaluate(el=>{const a=el.getBoundingClientRect(),s=el.parentElement.getBoundingClientRect();return a.right<=s.right+1&&a.bottom<=s.bottom+1}));
  await page.locator('[data-ecology-motion]').check();const dragBox=await actor.boundingBox();await page.mouse.move(dragBox.x+dragBox.width/2,dragBox.y+dragBox.height/2);await page.mouse.down();await page.mouse.move(dragBox.x+dragBox.width/2+35,dragBox.y+dragBox.height/2+25,{steps:3});await page.mouse.up();
  for(let i=0;i<12;i++){await page.waitForTimeout(16);assert(await actor.evaluate(el=>{const a=el.getBoundingClientRect(),s=el.parentElement.getBoundingClientRect();return a.left>=s.left-1&&a.top>=s.top-1&&a.right<=s.right+1&&a.bottom<=s.bottom+1}), 'rotating motion form crossed stage boundary')}
  await page.setViewportSize({width:360,height:700});await page.waitForTimeout(100);assert(await actor.evaluate(el=>{const a=el.getBoundingClientRect(),s=el.parentElement.getBoundingClientRect();return a.width<=110&&a.right<=s.right+1&&a.bottom<=s.bottom+1}));
  await page.waitForTimeout(100);assert.deepEqual(outside,[]);await page.click('[data-ecology-close]');assert.equal(await actor.count(),0);
  console.log(JSON.stringify({actualChromium:true,before,shapes,keyboardMovement:true,inputUnchanged:true,closeClean:true,outsideRequests:outside.length}));
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
