const assert=require('node:assert/strict');
async function runMediaFilterBrowserChecks({page,report,check}){
  await check('Media renderer switches preserve the shared query and visible records',async()=>{
    await page.evaluate(()=>{location.hash='#media?q=steam';});
    const search=page.locator('#search');
    await page.waitForFunction(()=>document.querySelector('#main')?.dataset.workspace==='media'&&document.querySelector('.workspace-container')?.shadowRoot?.querySelectorAll('article.card').length===5&&document.querySelector('#search').value==='steam');
    const visible=()=>page.locator('.workspace-container article.card:visible').evaluateAll(cards=>cards.map(card=>card.dataset.cardId));
    const expected=await visible();assert.equal(expected.length,1);assert.match(expected[0],/^steam:/);
    const seen=[];
    for(const mode of ['bounded','baseline']){
      await page.locator('.workspace-container [data-event-mode="'+mode+'"]').click();
      await page.waitForFunction(mode=>{const p=new URLSearchParams(location.hash.split('?')[1]);return p.get('event_view')===mode&&p.get('q')==='steam'&&document.querySelector('.workspace-container')?.shadowRoot?.getElementById('event-mode')?.textContent.startsWith(mode==='bounded'?'Bounded':'Full-history');},mode);
      assert.equal(await search.inputValue(),'steam');assert.deepEqual(await visible(),expected);
      seen.push(await page.evaluate(()=>location.hash));
    }
    await page.goBack();await page.waitForFunction(()=>new URLSearchParams(location.hash.split('?')[1]).get('event_view')==='bounded'&&document.querySelector('.workspace-container')?.shadowRoot?.getElementById('event-mode')?.textContent.startsWith('Bounded'));
    assert.equal(await search.inputValue(),'steam');assert.deepEqual(await visible(),expected);
    await page.goForward();await page.waitForFunction(()=>new URLSearchParams(location.hash.split('?')[1]).get('event_view')==='baseline'&&document.querySelector('.workspace-container')?.shadowRoot?.getElementById('event-mode')?.textContent.startsWith('Full-history'));
    assert.equal(await search.inputValue(),'steam');assert.deepEqual(await visible(),expected);
    assert.equal(await page.locator('.workspace-container img[src],.workspace-container iframe,.workspace-container video,.workspace-container audio').count(),0);
    report.mediaFilterMode={query:'steam',visibleCardIds:expected,routes:seen,backForwardPreserved:true,autoplay:false,scope:'Actual shell navigation with retained public fixture; no provider playback'};
  });
}
module.exports={runMediaFilterBrowserChecks};
