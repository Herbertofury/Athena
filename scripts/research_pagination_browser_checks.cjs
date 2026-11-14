/* Additive actual-browser acceptance. No browser launcher or provider access. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function assertPage(snapshot,page){
 assert.equal(snapshot.label,'Page '+page+' of 12');
 assert.equal(new URLSearchParams(snapshot.hash.split('?')[1]).get('page'),String(page));
 assert.equal(snapshot.titles.length,24);assert.equal(snapshot.query,'');
 assert.equal(new Set(snapshot.titles).size,24);
}
async function runResearchPaginationBrowserChecks({page,origin,root,report,check}){
 await check('Research deep links, reload and workspace return retain the selected catalog page',async()=>{
  const ready=()=>page.locator('.workspace-status').filter({hasText:'Athena research workspace loaded.'}).waitFor();
  const snapshot=()=>page.evaluate(()=>{const r=document.querySelector('.workspace-container').shadowRoot;return {hash:location.hash,label:r.getElementById('page-label').textContent,query:document.querySelector('#search').value,titles:[...r.querySelectorAll('.research-card h3')].map(n=>n.textContent)};});
  await page.goto(origin+'/#research?page=2');await ready();
  const second=await snapshot();assertPage(second,2);
  const served=await page.evaluate(async()=>{const bytes=await(await fetch('/workspaces/engineering/research/index.mjs',{cache:'no-store'})).arrayBuffer();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');});
  assert.equal(served,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'workspaces/engineering/research/index.mjs'))).digest('hex'));
  await page.locator('.workspace-container #next').click();await page.waitForFunction(()=>document.querySelector('.workspace-container')?.shadowRoot?.getElementById('page-label')?.textContent==='Page 3 of 12');
  const third=await snapshot();assertPage(third,3);assert.notDeepEqual(third.titles,second.titles);
  await page.reload();await ready();const reloaded=await snapshot();assertPage(reloaded,3);assert.deepEqual(reloaded.titles,third.titles);
  await page.locator('[data-nav="home"]').click();await page.waitForFunction(()=>document.querySelector('#main').dataset.workspace==='learning');
  await page.locator('[data-nav="research"]').click();await ready();const restored=await snapshot();assertPage(restored,3);assert.deepEqual(restored.titles,third.titles);
  await page.locator('.topbar #search').fill('rust');await page.waitForFunction(()=>new URLSearchParams(location.hash.split('?')[1]).get('q')==='rust');
  const changed=await snapshot();assert.match(changed.label,/^Page 1 of /);assert.equal(new URLSearchParams(changed.hash.split('?')[1]).get('page'),null);assert.equal(changed.query,'rust');
  report.researchPagination={servedSHA256:served,second,third,reloaded,restored,changed,scope:'Actual shell, local retained 283-entry catalog, page 2 deep link, page 3 reload and saved return. No performance claim or provider requests.'};
  await page.locator('.workspace-container #reset').click();await page.waitForFunction(()=>location.hash==='#research?q=');
 });
}
module.exports={runResearchPaginationBrowserChecks,assertPage};
