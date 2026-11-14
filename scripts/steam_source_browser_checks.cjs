/* Actual browser DOM check with synthetic source-link mutations, not a provider fetch. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
async function runSteamSourceBrowserChecks({page,root,report,check}){
 await check('Steam source actions stay bound to their card AppID in the native Media workspace',async()=>{
  const result=await page.evaluate(async()=>{
   const fixture=await(await fetch('/workspaces/engineering/media/public-fixtures.json')).json();
   const coreBytes=await(await fetch('/workspaces/engineering/media/media-core.mjs',{cache:'no-store'})).arrayBuffer();
   const coreSHA256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',coreBytes)),b=>b.toString(16).padStart(2,'0')).join('');
   const {mount}=await import('/workspaces/engineering/media/index.mjs');const originalFetch=window.fetch,rows=[];
   for(const suffix of [null,'/app/730/','/sub/620/','/']){
    const data=structuredClone(fixture),steam=data.cards.find(card=>card.provider==='Steam');
    if(suffix!==null)steam.source='https://store.steampowered.com'+suffix;
    const before=JSON.stringify(data);let reads=0,controller;const host=document.createElement('section');document.body.append(host);
    try{
     window.fetch=(input,options)=>{const url=new URL(String(input),location.href);if(url.origin===location.origin&&url.pathname==='/workspaces/engineering/media/public-fixtures.json'){reads++;return Promise.resolve(new Response(before,{headers:{'content-type':'application/json'}}));}return originalFetch.call(window,input,options);};
     controller=await mount({container:host});const shadow=host.shadowRoot,card=shadow.querySelector('[data-card-id="steam:620"]');
     rows.push({kind:suffix===null?'retained-valid':'synthetic-mismatch',source:steam.source,ready:controller.ready,cards:shadow.querySelectorAll('article.card').length,gallery:shadow.querySelectorAll('figure').length,images:shadow.querySelectorAll('img').length,loadedMedia:shadow.querySelectorAll('img[src],iframe,video,audio').length,sourceHref:card?.querySelector('.source')?.href??null,status:shadow.getElementById('status').textContent,loadDisabled:shadow.getElementById('load-media').disabled,fixtureReads:reads,inputFixtureUnchanged:JSON.stringify(data)===before});
    }finally{controller?.unmount();window.fetch=originalFetch;host.remove();}
   }
   return {coreSHA256,rows,scope:'Actual browser/native adapter with retained public metadata and synthetic mismatched source URLs; no provider fetch or playback'};
  });
  const expected=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'workspaces/engineering/media/media-core.mjs'))).digest('hex');
  assert.equal(result.coreSHA256,expected);assert.equal(result.rows.length,4);
  for(const row of result.rows){assert.equal(row.loadedMedia,0);assert.equal(row.fixtureReads,1);assert.equal(row.inputFixtureUnchanged,true);
   if(row.kind==='retained-valid'){assert.equal(row.ready,true);assert.equal(row.cards,5);assert.equal(row.gallery,19);assert.equal(row.images,23);assert.equal(row.sourceHref,row.source);assert.equal(row.loadDisabled,false);}
   else{assert.equal(row.ready,false);assert.equal(row.cards,0);assert.equal(row.sourceHref,null);assert.equal(row.loadDisabled,true);assert.match(row.status,/Mismatched Steam source and card identity/);}
  }
  report.steamSourceIdentity=result;
 });
}
module.exports={runSteamSourceBrowserChecks};
