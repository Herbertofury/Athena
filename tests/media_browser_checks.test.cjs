/* Unit tests for browser-check assertions/wiring. These do not run Chromium. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {runMediaBrowserChecks}=require('../scripts/media_browser_checks.cjs');
const root=path.resolve(__dirname,'../dist');
const hashes=()=>Object.fromEntries(['index.mjs','event-log-view.mjs','media-event-recorder.mjs','media-core.mjs'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'workspaces/engineering/media',name))).digest('hex')]));
function prepared(){return [{cards:2,pendingImages:4,automaticImages:0,players:0,fixtureSHA256:'auto'},hashes(),{events:260,state:{render_failures:2},exactVisibleJSON:true},['youtube','native','hls'].map(mode=>({mode,viewRenderFailures:mode==='youtube'?1:0,retainedFailureCount:1,newAttemptPlayingCallbacks:1,calls:{play:0},fixtureSHA256:'1'.repeat(64)}))];}
async function invoke(values,stats={}){const names=[],report={};let index=0,fixtureSHA,active;
 await runMediaBrowserChecks({root,report,origin:'http://127.0.0.1:12345',page:{
  route:async(url,handler)=>{stats.routes=(stats.routes||0)+1;active={url,handler};await handler({fulfill:async({body})=>{fixtureSHA=crypto.createHash('sha256').update(body).digest('hex');}});},
  unroute:async(url,handler)=>{assert.deepEqual({url,handler},active);stats.unroutes=(stats.unroutes||0)+1;active=null;},
  evaluate:async()=>{const value=values[index++];if(value?.fixtureSHA256==='auto')return {...value,fixtureSHA256:fixtureSHA};return value;}
 },check:async(name,fn)=>{await fn();names.push(name);}});return {names,report,index,stats};}
test('CI browser coverage validates all four result groups before reporting them',async()=>{const result=await invoke(prepared());assert.equal(result.names.length,4);assert.equal(result.index,4);assert.equal(result.report.mediaTerminalStates.length,3);assert.equal(result.report.mediaRecovery.exactVisibleJSON,true);});
test('CI assertions reject changed served module bytes',async()=>{const values=prepared();values[1]['event-log-view.mjs']='0'.repeat(64);await assert.rejects(()=>invoke(values));});
test('CI assertions reject omitted recovery failures and automatic playback',async()=>{let values=prepared();values[2].state.render_failures=0;await assert.rejects(()=>invoke(values));values=prepared();values[3][0].calls.play=1;await assert.rejects(()=>invoke(values));});
test('existing browser entry calls additive Media checks without adding a browser launcher',()=>{const entry=fs.readFileSync(path.resolve(__dirname,'../scripts/test_browser.cjs'),'utf8'),helper=fs.readFileSync(path.resolve(__dirname,'../scripts/media_browser_checks.cjs'),'utf8');assert.equal(entry.split("require('./media_browser_checks.cjs').runMediaBrowserChecks").length-1,1);assert.doesNotMatch(helper,/chromium\.launch|--no-sandbox|require\(['"]playwright/);assert.match(helper,/Synthetic transient insertion failure/);assert.match(helper,/same|Superseded callbacks/);});

test('Nexus browser fixture requires exact receipt and inert media, with routing always removed',async()=>{
 for(const bad of [{fixtureSHA256:'0'.repeat(64)},{cards:1},{pendingImages:3},{automaticImages:1},{players:1}]){
  const values=prepared(),stats={};Object.assign(values[0],bad);await assert.rejects(()=>invoke(values,stats));assert.equal(stats.routes,1);assert.equal(stats.unroutes,1);
 }
 const result=await invoke(prepared());assert.equal(result.report.nexusLargePreview.cards,2);assert.equal(result.stats.routes,1);assert.equal(result.stats.unroutes,1);
});
