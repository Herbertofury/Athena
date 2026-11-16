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
  const motionPositions=new Set();for(let i=0;i<12;i++){await page.waitForTimeout(16);motionPositions.add(await actor.evaluate(el=>el.style.transform));assert(await actor.evaluate(el=>{const a=el.getBoundingClientRect(),s=el.parentElement.getBoundingClientRect();return a.left>=s.left-1&&a.top>=s.top-1&&a.right<=s.right+1&&a.bottom<=s.bottom+1}), 'rotating motion form crossed stage boundary')}
  assert(motionPositions.size>1,'post-release throw must actually animate, not pass as stationary');
  await page.setViewportSize({width:360,height:700});await page.waitForTimeout(100);assert(await actor.evaluate(el=>{const a=el.getBoundingClientRect(),s=el.parentElement.getBoundingClientRect();return a.width<=110&&a.right<=s.right+1&&a.bottom<=s.bottom+1}));
  const rotationReceipts=[];
  for(const rotation of [-90,-45,45,90]){
   await page.evaluate(rotation=>{const id=themes[0].objects[0].id;window.rotatedLayout={version:6,themeId:themes[0].id,roomId:themes[0].rooms[0].id,placements:{a:{objectId:id,x:1,y:1,pinned:false,rotation}}};adapter.update(rotatedLayout)},rotation);
   const receipt=await actor.evaluate(el=>{const r=el.getBoundingClientRect(),s=el.parentElement.getBoundingClientRect();return {baseWidth:el.offsetWidth,baseHeight:el.offsetHeight,width:r.width,height:r.height,transform:getComputedStyle(el).transform,inside:r.left>=s.left-1&&r.top>=s.top-1&&r.right<=s.right+1&&r.bottom<=s.bottom+1}});
   assert.equal(receipt.baseWidth,80);assert.equal(receipt.baseHeight,150);const rad=rotation*Math.PI/180;assert(Math.abs(receipt.width-(Math.abs(80*Math.cos(rad))+Math.abs(150*Math.sin(rad))))<.1);assert(Math.abs(receipt.height-(Math.abs(150*Math.cos(rad))+Math.abs(80*Math.sin(rad))))<.1);assert(receipt.inside);rotationReceipts.push({rotation,...receipt});
  }
  const rotatedInput=await page.evaluate(()=>JSON.stringify(rotatedLayout));
  await page.locator('[data-ecology-motion]').check();const rotatedBox=await actor.boundingBox();await page.mouse.move(rotatedBox.x+rotatedBox.width/2,rotatedBox.y+rotatedBox.height/2);await page.mouse.down();await page.mouse.move(rotatedBox.x+rotatedBox.width/2-35,rotatedBox.y+rotatedBox.height/2-25,{steps:3});await page.mouse.up();
  const rotatedMotion=new Set();for(let i=0;i<16;i++){await page.waitForTimeout(16);rotatedMotion.add(await actor.evaluate(el=>el.style.transform));assert(await actor.evaluate(el=>{const a=el.getBoundingClientRect(),s=el.parentElement.getBoundingClientRect();return a.left>=s.left-1&&a.top>=s.top-1&&a.right<=s.right+1&&a.bottom<=s.bottom+1}),'authored rotating form crossed stage boundary')}
  assert(rotatedMotion.size>1,'authored rotation throw must animate');await page.locator('[data-ecology-motion]').uncheck();assert.match(await actor.evaluate(el=>el.style.transform),/rotate\(90deg\)/);assert.equal(await page.evaluate(()=>JSON.stringify(rotatedLayout)),rotatedInput);
  const scaleReceipts=[];
  for(const [scaleX,scaleY,rotation] of [[-1,1,0],[1,-.5,30],[-.75,-1.25,-45],[.5,1.5,90],[8,8,0]]){
   await page.evaluate(p=>{const id=themes[0].objects[0].id;window.scaledLayout={version:6,themeId:themes[0].id,roomId:themes[0].rooms[0].id,placements:{a:{objectId:id,x:1,y:1,pinned:false,...p}}};adapter.update(scaledLayout)},{scaleX,scaleY,rotation});
   const receipt=await actor.evaluate(el=>{const r=el.getBoundingClientRect(),stage=el.parentElement,s=stage.getBoundingClientRect(),m=new DOMMatrix(getComputedStyle(el).transform);return {baseWidth:el.offsetWidth,baseHeight:el.offsetHeight,width:r.width,height:r.height,matrix:[m.a,m.b,m.c,m.d],clipped:el.dataset.ecologyClipped,overflow:getComputedStyle(stage).overflow,inside:r.left>=s.left-1&&r.top>=s.top-1&&r.right<=s.right+1&&r.bottom<=s.bottom+1}});
   assert.equal(receipt.baseWidth,80);assert.equal(receipt.baseHeight,150);const r=rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),expected=[c*scaleX,s*scaleX,-s*scaleY,c*scaleY];receipt.matrix.forEach((v,i)=>assert(Math.abs(v-expected[i])<.00001,'signed affine transform mismatch'));assert(Math.abs(receipt.width-(Math.abs(80*scaleX*c)+Math.abs(150*scaleY*s)))<.1);assert(Math.abs(receipt.height-(Math.abs(80*scaleX*s)+Math.abs(150*scaleY*c)))<.1);
   if(scaleX===8){assert.equal(receipt.clipped,'true');assert.equal(receipt.overflow,'hidden');assert(!receipt.inside)}else{assert.equal(receipt.clipped,'false');assert(receipt.inside)}scaleReceipts.push({scaleX,scaleY,rotation,...receipt});
  }
  await page.evaluate(()=>{Object.assign(scaledLayout.placements.a,{scaleX:-.75,scaleY:1.25,rotation:30});adapter.update(scaledLayout)});const scaledInput=await page.evaluate(()=>JSON.stringify(scaledLayout));
  await page.locator('[data-ecology-motion]').check();const scaledBox=await actor.boundingBox();await page.mouse.move(scaledBox.x+scaledBox.width/2,scaledBox.y+scaledBox.height/2);await page.mouse.down();await page.mouse.move(scaledBox.x+scaledBox.width/2-35,scaledBox.y+scaledBox.height/2-25,{steps:3});await page.mouse.up();
  const scaledMotion=new Set();for(let i=0;i<16;i++){await page.waitForTimeout(16);scaledMotion.add(await actor.evaluate(el=>el.style.transform));assert(await actor.evaluate(el=>{const a=el.getBoundingClientRect(),s=el.parentElement.getBoundingClientRect();return a.left>=s.left-1&&a.top>=s.top-1&&a.right<=s.right+1&&a.bottom<=s.bottom+1}),'scaled rotating form crossed stage boundary')}
  assert(scaledMotion.size>1);await page.locator('[data-ecology-motion]').uncheck();assert.match(await actor.evaluate(el=>el.style.transform),/scale\(-0.75, ?1.25\)/);assert.equal(await page.evaluate(()=>JSON.stringify(scaledLayout)),scaledInput);
  // Controlled solid colors test the compositor, not original artwork/backdrop parity.
  await page.evaluate(()=>{
   const id=themes[0].objects[0].id;window.blendFixture={version:6,themeId:themes[0].id,roomId:themes[0].rooms[0].id,placements:{a:{objectId:id,x:.2,y:.2,pinned:false,blendMode:'multiply'},b:{objectId:id,x:.3,y:.2,pinned:false,blendMode:'multiply'}}};
   document.querySelector('#host').style.background='rgb(255,0,0)';
   const style=document.createElement('style');style.textContent='[data-ecology-stage] .foundry-object{background:rgb(128,128,128)!important;border:0!important;box-shadow:none!important;border-radius:0!important;outline:0!important} [data-ecology-stage] .foundry-object>*{display:none!important}';document.head.append(style);adapter.update(blendFixture);
  });
  async function sampleOverlap(mode){
   await page.evaluate(mode=>{blendFixture.placements.a.blendMode=mode;blendFixture.placements.b.blendMode=mode;adapter.update(blendFixture)},mode);
   await page.locator('[data-ecology-stage]').scrollIntoViewIfNeeded();
   const boxes=await page.locator('[data-ecology-object]').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,blend:getComputedStyle(el).mixBlendMode}}));
   assert.equal(boxes[0].blend,mode);assert(boxes[1].x+5<boxes[0].x+boxes[0].w,'fixture must overlap');
   const png=(await page.screenshot()).toString('base64');
   return page.evaluate(async({png,boxes})=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const a=boxes[0],b=boxes[1],y=Math.floor(a.y+20),singleX=Math.floor(a.x+2),overlapX=Math.floor(b.x+5);return {single:[...ctx.getImageData(singleX,y,1,1).data],overlap:[...ctx.getImageData(overlapX,y,1,1).data]};},{png,boxes});
  }
  const blendPixels={};for(const [mode,expected] of [['normal',128],['multiply',64],['screen',192]]){const receipt=await sampleOverlap(mode);blendPixels[mode]=receipt;for(let c=0;c<3;c++){assert(Math.abs(receipt.single[c]-128)<=1,'blend escaped isolated preview');assert(Math.abs(receipt.overlap[c]-expected)<=1,'overlap blend pixel mismatch')}assert.equal(receipt.overlap[3],255)}
  await page.evaluate(()=>{blendFixture.placements.a.blendMode='url(https://example.invalid/blend)';adapter.update(blendFixture)});assert.equal(await page.locator('[data-ecology-object]').first().evaluate(el=>getComputedStyle(el).mixBlendMode),'normal');
  await page.waitForTimeout(100);assert.deepEqual(outside,[]);await page.click('[data-ecology-close]');assert.equal(await actor.count(),0);
  console.log(JSON.stringify({actualChromium:true,before,shapes,blendPixels,rotationReceipts,rotatedMotion:rotatedMotion.size,scaleReceipts,scaledMotion:scaledMotion.size,keyboardMovement:true,inputUnchanged:true,closeClean:true,motionPositions:motionPositions.size,outsideRequests:outside.length}));
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
