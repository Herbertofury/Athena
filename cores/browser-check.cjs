/* Local browser acceptance for the delivered shared cores; no external network. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
  try{
    const page=await browser.newPage({viewport:{width:900,height:500}});
    await page.setContent('<!doctype html><html><body><h1>Shared ticker acceptance</h1><div id="viewport" style="width:320px;overflow:auto;border:1px solid"><div id="track" style="display:flex;width:max-content;gap:16px"><div id="segment" style="display:flex;gap:30px;white-space:nowrap;padding:12px"><a href="#one">First complete headline</a><a href="#two">Second complete headline with detail</a><a href="#three">Third complete headline</a></div></div></div><button id="pause">Pause</button><p id="result"></p></body></html>');
    await page.addScriptTag({path:path.join(__dirname,'feed-core/feed-core.js')});
    await page.addScriptTag({path:path.join(__dirname,'ticker-core/ticker-core.js')});
    const imported=await page.evaluate(()=>{
      const rss=FeedCore.parseImportedFeed('<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>Example publisher</title><link>https://example.org/</link><item><guid>same</guid><title>Original &amp; new</title><link>https://example.org/story</link><pubDate>Fri, 27 Nov 2026 15:00:00 GMT</pubDate><description>Original summary</description><media:content url="https://example.org/hero.jpg" medium="image"/></item></channel></rss>',{sourceId:'rss',DOMParser});
      const atom=FeedCore.parseImportedFeed('<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><link href="https://example.org/"/><entry><id>same</id><title>Undated original</title><link href="https://example.org/undated"/><updated>2026-11-28T10:00:00Z</updated><summary>Summary</summary><link rel="enclosure" href="https://example.org/audio.mp3" type="audio/mpeg"/></entry></feed>',{sourceId:'atom',DOMParser});
      let malformed=false;try{FeedCore.parseImportedFeed('<rss><channel>',{sourceId:'bad',DOMParser});}catch(_){malformed=true;}
      return {rss,atom,malformed};
    });
    assert.equal(imported.rss.items[0].title,'Original & new');assert.equal(imported.rss.items[0].date,'2026-11-27T15:00:00.000Z');assert.equal(imported.rss.items[0].media[0].kind,'image');assert.equal(imported.rss.sources[0].url,'https://example.org/');
    assert.equal(imported.atom.items[0].date,'');assert.equal(imported.atom.items[0].updatedAt,'2026-11-28T10:00:00.000Z');assert.equal(imported.atom.items[0].media[0].kind,'audio');assert.notEqual(imported.atom.items[0].id,imported.rss.items[0].id);assert.equal(imported.malformed,true);
    await page.evaluate(()=>{window.testTicker=TickerCore.mountTicker({viewport:document.querySelector('#viewport'),track:document.querySelector('#track'),segment:document.querySelector('#segment')});document.querySelector('#pause').onclick=()=>testTicker.pause();});
    await page.waitForTimeout(200);
    const initial=await page.evaluate(()=>({x:getComputedStyle(document.querySelector('#track')).transform,state:testTicker.state(),clone:document.querySelector('#track').children[1].outerHTML}));
    assert.equal(initial.state.paused,false);assert.match(initial.clone,/aria-hidden="true"/);assert.match(initial.clone,/tabindex="-1"/);
    await page.waitForTimeout(140);
    const moved=await page.evaluate(()=>getComputedStyle(document.querySelector('#track')).transform);assert.notEqual(initial.x,moved);
    await page.locator('#pause').click();assert.equal(await page.evaluate(()=>testTicker.state().userPaused),true);
    await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>testTicker.play());assert.ok((await page.evaluate(()=>testTicker.state().reasons)).includes('reduced-motion'));
    await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#segment a').first().focus();assert.ok((await page.evaluate(()=>testTicker.state().reasons)).includes('focus'));
    await page.evaluate(()=>testTicker.dispose());assert.equal(await page.locator('#track > div').count(),1);assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
    console.log('PASS: real Chromium RSS/Atom parsing, publication precision, ticker motion, pause, reduced motion, keyboard focus, inert duplicate and teardown.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
