/* Unit tests for browser-check assertions/wiring. These do not run Chromium. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {runMediaBrowserChecks}=require('../scripts/media_browser_checks.cjs');
const root=path.resolve(__dirname,'../dist');
const origin='http://127.0.0.1:12345';
const hashes=()=>Object.fromEntries(['index.mjs','event-log-view.mjs','media-event-recorder.mjs','media-core.mjs','video-mod-evidence.mjs'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'workspaces/engineering/media',name))).digest('hex')]));
function prepared(){return [{cards:2,pendingImages:4,automaticImages:0,players:0,fixtureSHA256:'auto'},hashes(),{events:260,state:{render_failures:2},exactVisibleJSON:true},['youtube','native','hls'].map(mode=>({mode,viewRenderFailures:mode==='youtube'?1:0,retainedFailureCount:1,newAttemptPlayingCallbacks:1,calls:{play:0},fixtureSHA256:'1'.repeat(64)}))];}
function cueSequence({playerCount=0,workspaceAfter='unchanged',externalRequest,sourceHref='https://www.youtube.com/watch?v=f0iYkTUx5Rs',cues=[{basis:'visible',start_ms:41091,end_ms:43400},{basis:'inferred',start_ms:44000,end_ms:null}],stalePreviewCount=0}={}){
 return [
  ['evaluate',null,'unchanged'],['evaluate','.shell > #main',undefined],
  ['count','#video-mod-cues -> form',0],['click','Review mod cues from a video'],
  ['fill','Video or post URL','https://youtu.be/f0iYkTUx5Rs?si=discard'],
  ['fill','Local timestamped cues','0:41.091..0:43.4 | visible | Example title\n0:44 | inferred | <img src=x onerror=alert(1)>'],
  ['click','button:Review local cues'],['waitFor','/Inference, unconfirmed/'],
  ['count','#video-mod-cues -> img,video,audio,iframe',playerCount],
  ['href','link:Open supplied YouTube source',sourceHref],
  ['textContent','#video-mod-cues -> pre',JSON.stringify({cues})],
  ['fill','Local timestamped cues','changed draft'],['count','#video-mod-cues -> pre',stalePreviewCount],
  ['evaluate',null,workspaceAfter,externalRequest]
 ];
}
async function invoke(values,stats={},cueOptions){const names=[],report={},cue=cueSequence(cueOptions);let index=0,fixtureSHA,active,listener,cueStarted=false;
 const step=(method,key)=>{
  assert.ok(listener,'Cue actions require request monitoring');
  const next=cue.shift();assert.deepEqual(next?.slice(0,2),[method,key],'Unexpected cue interaction');
  if(next[3])listener({url:()=>next[3]});
  return next[2];
 };
 const locator=(key,scope=false)=>({
  locator:(selector)=>locator(scope?key+' -> '+selector:selector,true),
  getByText:(label,options)=>{assert.equal(key,'#video-mod-cues');if(typeof label==='string')assert.deepEqual(options,{exact:true});return locator(String(label));},
  getByLabel:(label)=>{assert.equal(key,'#video-mod-cues');return locator(label);},
  getByRole:(role,{name})=>{assert.equal(key,'#video-mod-cues');return locator(role+':'+name);},
  count:async()=>step('count',key),click:async()=>step('click',key),waitFor:async()=>step('waitFor',key),
  fill:async(value)=>assert.equal(value,step('fill',key)),textContent:async()=>step('textContent',key),
  getAttribute:async(name)=>{assert.equal(name,'href');return step('href',key);}
 });
 await runMediaBrowserChecks({root,report,origin,page:{
  route:async(url,handler)=>{assert.equal(url,origin+'/workspaces/engineering/media/public-fixtures.json');assert.equal(active,undefined);stats.routes=(stats.routes||0)+1;active={url,handler};await handler({fulfill:async({body})=>{fixtureSHA=crypto.createHash('sha256').update(body).digest('hex');}});},
  unroute:async(url,handler)=>{assert.deepEqual({url,handler},active);assert.equal(listener,undefined);stats.unroutes=(stats.unroutes||0)+1;active=undefined;},
  on:(event,handler)=>{assert.equal(event,'request');assert.ok(active);assert.equal(listener,undefined);listener=handler;cueStarted=true;stats.subscribed=(stats.subscribed||0)+1;},
  off:(event,handler)=>{assert.equal(event,'request');assert.equal(handler,listener);listener=undefined;stats.unsubscribed=(stats.unsubscribed||0)+1;},
  locator:(target)=>{assert.equal(target,'[data-cue-browser-fixture]');assert.ok(listener);return locator(target);},
  evaluate:async(fn,args)=>{
   if(listener){if(String(fn).includes('cueController?.unmount()')){stats.cleanup=(stats.cleanup||0)+1;return;}
    if(args)assert.match(String(fn),/document\.querySelector\(selector\)[\s\S]*main\.append\(container\)/);
    return step('evaluate',args??null);
   }
   const value=values[index++];if(value?.fixtureSHA256==='auto')return {...value,fixtureSHA256:fixtureSHA};return value;
  }
 },check:async(name,fn)=>{await fn();names.push(name);}});
 if(cueStarted)assert.equal(cue.length,0);
 return {names,report,index,stats};
}
test('CI browser coverage validates all five result groups before reporting them',async()=>{
 const result=await invoke(prepared());assert.equal(result.names.length,5);assert.match(result.names[1],/manually supplied mod cues/);assert.equal(result.index,4);
 assert.equal(result.report.mediaTerminalStates.length,3);assert.equal(result.report.mediaRecovery.exactVisibleJSON,true);
 assert.deepEqual(result.report.manualVideoModCues,{rows:2,externalRequests:0,workspaceUnchanged:true,scope:'synthetic manually attributed cues, no media or mod discovery'});
 assert.deepEqual(result.stats,{routes:2,unroutes:2,subscribed:1,cleanup:1,unsubscribed:1});
});
test('CI assertions reject changed served module bytes',async()=>{const values=prepared();values[1]['event-log-view.mjs']='0'.repeat(64);await assert.rejects(()=>invoke(values),{code:'ERR_ASSERTION'});});
test('CI assertions reject omitted recovery failures and automatic playback',async()=>{let values=prepared();values[2].state.render_failures=0;await assert.rejects(()=>invoke(values),{code:'ERR_ASSERTION'});values=prepared();values[3][0].calls.play=1;await assert.rejects(()=>invoke(values),{code:'ERR_ASSERTION'});});
test('Cue browser fixture rejects dirty state, player, provider request, wrong receipt, source or stale review and removes listeners on failure',async()=>{
 for (const [options,actual] of [
  [{playerCount:1},1],[{workspaceAfter:'changed'},'changed'],[{externalRequest:'https://www.youtube.com/watch?v=f0iYkTUx5Rs'},['https://www.youtube.com']],
  [{sourceHref:'https://youtu.be/f0iYkTUx5Rs'},'https://youtu.be/f0iYkTUx5Rs'],
  [{cues:[]},[]],[{stalePreviewCount:1},1]
 ]){
  const stats={};await assert.rejects(()=>invoke(prepared(),stats,options),error=>{assert.equal(error.code,'ERR_ASSERTION');assert.deepEqual(error.actual,actual);return true;});
  assert.deepEqual(stats,{routes:2,unroutes:2,subscribed:1,cleanup:1,unsubscribed:1});
 }
});
test('existing browser entry calls additive Media checks without adding a browser launcher',()=>{const entry=fs.readFileSync(path.resolve(__dirname,'../scripts/test_browser.cjs'),'utf8'),helper=fs.readFileSync(path.resolve(__dirname,'../scripts/media_browser_checks.cjs'),'utf8');assert.equal(entry.split("require('./media_browser_checks.cjs').runMediaBrowserChecks").length-1,1);assert.doesNotMatch(helper,/chromium\.launch|--no-sandbox|require\(['"]playwright/);assert.match(helper,/Synthetic transient insertion failure/);assert.match(helper,/same|Superseded callbacks/);});

test('Nexus browser fixture requires exact receipt and inert media, with routing always removed',async()=>{
 for(const bad of [{fixtureSHA256:'0'.repeat(64)},{cards:1},{pendingImages:3},{automaticImages:1},{players:1}]){
  const values=prepared(),stats={};Object.assign(values[0],bad);await assert.rejects(()=>invoke(values,stats));assert.equal(stats.routes,1);assert.equal(stats.unroutes,1);
 }
 const result=await invoke(prepared());assert.equal(result.report.nexusLargePreview.cards,2);assert.equal(result.stats.routes,2);assert.equal(result.stats.unroutes,2);
});
