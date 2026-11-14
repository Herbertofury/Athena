'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
exports.runMediaCoverBrowserChecks=async({browser,origin,check,report,root})=>{
 const original=JSON.parse(fs.readFileSync(path.join(root,'workspaces/engineering/media/public-fixtures.json')));
 for(const kind of ['single','mixed','contradictory'])await check('Media explicit absent cover: '+kind,async()=>{
  const fixture=structuredClone(original),card={...fixture.cards[0],id:'modrinth:synthetic-no-cover',title:'Synthetic explicit no-cover card',cover:null,cover_status:'not-provided',gallery:[],videos:[],completeness:'Synthetic absent-cover acceptance only; not a live-provider test.'};
  if(kind==='contradictory')card.cover=original.cards[0].cover;
  fixture.cards=kind==='mixed'?[...fixture.cards,card]:[card];
  const context=await browser.newContext(),outside=[];let fixtureRequests=0;
  try{
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin){outside.push(url.href);return route.abort();}
    if(url.pathname==='/workspaces/engineering/media/public-fixtures.json'){fixtureRequests++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)});}
    return route.continue();
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/#media');const workspace=page.locator('.workspace-container');
   if(kind==='contradictory'){
    await workspace.locator('#status').filter({hasText:'Contradictory Modrinth cover absence'}).waitFor();
    assert.equal(await workspace.locator('article.card').count(),0);assert.equal(await workspace.locator('#load-media').isDisabled(),true);
   }else{
    await workspace.locator('article.card').filter({hasText:'Synthetic explicit no-cover card'}).waitFor();
    assert.equal(await workspace.locator('article.card').count(),kind==='mixed'?6:1);
    const target=workspace.locator('[data-card-id="modrinth:synthetic-no-cover"]');
    assert.equal(await target.locator('.cover-placeholder').textContent(),'No cover supplied by the public project record.');
    assert.equal(await target.locator('img,iframe,video,audio').count(),0);
    if(kind==='single'){await workspace.locator('#load-media').click();await workspace.locator('#status').filter({hasText:'0 decoded, 0 failed'}).waitFor();}
   }
   assert.equal(fixtureRequests,1);assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);
   report.mediaCoverStates??=[];report.mediaCoverStates.push({kind,cards:fixture.cards.length,fixtureRequests,externalRequests:outside.length,fixture:'synthetic override of retained public fixture; no live or playback claim'});
  }finally{await context.close();}
 });
};
