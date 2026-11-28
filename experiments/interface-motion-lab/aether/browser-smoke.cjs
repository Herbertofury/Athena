#!/usr/bin/env node
// Optional QA: node browser-smoke.cjs . /path/to/chromium [existing-screenshot-directory]
// Requires Playwright available to Node; the actual demo has no npm dependencies.
const { chromium } = require('playwright')
const { createServer } = require('node:http')
const assert = require('node:assert/strict')
const { readFile } = require('node:fs/promises')
const { extname, resolve, sep } = require('node:path')
const root=resolve(process.argv[2]), exe=process.argv[3]
const output=process.argv[4]
const server=createServer(async(req,res)=>{
  const pathname = new URL(req.url,'http://localhost').pathname
  const dest=resolve(root, '.'+(pathname==='/'?'/index.html':pathname))
  if(!dest.startsWith(root+sep)) {res.writeHead(404).end();return}
  try {
    const b=await readFile(dest)
    res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.css':'text/css','.html':'text/html'}[extname(dest)]}).end(b)
  } catch {res.writeHead(404).end()}
})
;(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r))
  const url='http://127.0.0.1:'+server.address().port
  const browser=await chromium.launch({
    executablePath:exe,
    args:['--no-sandbox','--disable-setuid-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']
  })
  try {
    for (const mobile of [false,true]) {
      const page=await browser.newPage({
        hasTouch:mobile,isMobile:mobile,
        viewport:mobile?{width:390,height:844}:{width:1280,height:800},
      })
      const errors=[], external=[]
      page.on('pageerror',error=>errors.push(error.message))
      page.on('console',msg=>{if(msg.type()==='error'&&!msg.text().includes('favicon'))errors.push(msg.text())})
      page.on('request',r=>{if(!r.url().startsWith(url)&&!r.url().startsWith('data:'))external.push(r.url())})
      await page.addInitScript(()=>{
        const method=WebGLRenderingContext.prototype.uniform3f
        window.__signals=[]
        WebGLRenderingContext.prototype.uniform3f=function(location,...values){
          if(values.every(Number.isFinite)) window.__signals.push(values)
          if(window.__signals.length>5000) window.__signals.splice(0,1000)
          return method.call(this,location,...values)
        }
      })
      await page.goto(url)
      await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('WebGL'))
      await page.selectOption('#mode','ripples')
      await page.selectOption('#strength','vivid')
      await page.evaluate(()=>window.__signals.length=0)
      if(mobile) {
        const cdp=await page.context().newCDPSession(page)
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:50,y:115}]})
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:96,y:150}]})
        await page.waitForTimeout(120)
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
      } else {
        await page.mouse.move(100,110)
        await page.mouse.move(360,145,{steps:8})
        await page.mouse.click(360,145)
      }
      const [w,h]=mobile?[390,844]:[1280,800]
      const [x,y]=mobile?[50,115]:[360,145]
      const nx=(x-w/2)/h, ny=(h-y-h/2)/h
      await page.waitForFunction(([nx,ny])=>window.__signals.some(([x,y,t])=>Math.abs(x-nx)<.002&&Math.abs(y-ny)<.002&&t>=0&&t<1.5),[nx,ny])
      if(output) await page.screenshot({path:`${output}/${mobile?'mobile':'desktop'}.png`})
      await page.emulateMedia({reducedMotion:'reduce'})
      await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('reduced motion'))
      await page.evaluate(()=>window.__signals.length=0)
      await page.waitForTimeout(160)
      assert.equal(await page.evaluate(()=>window.__signals.length),0)
      assert.deepEqual(errors,[])
      assert.deepEqual(external,[])
      const csp = await page.evaluate(() => new Promise(resolve => {
        document.addEventListener('securitypolicyviolation', event => resolve(event.effectiveDirective), { once:true })
        fetch('./must-not-be-fetched').catch(() => {})
      }))
      assert.equal(csp,'connect-src')
      console.log(`${mobile?'Mobile touch emulation':'Desktop mouse'} WebGL press verified by live uniform, reduced motion stops draws; no page errors or outbound requests; CSP blocked fetch`)
      await page.close()
    }
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1})
