/* Unit tests for browser-check assertions/wiring. These do not run Chromium. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {runMediaBrowserChecks}=require('../scripts/media_browser_checks.cjs');
const root=path.resolve(__dirname,'../dist');
const hashes=()=>Object.fromEntries(['index.mjs','event-log-view.mjs','media-event-recorder.mjs'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'workspaces/engineering/media',name))).digest('hex')]));
function prepared(){return [hashes(),{events:260,state:{render_failures:2},exactVisibleJSON:true},['youtube','native','hls'].map(mode=>({mode,viewRenderFailures:mode==='youtube'?1:0,retainedFailureCount:1,newAttemptPlayingCallbacks:1,calls:{play:0},fixtureSHA256:'1'.repeat(64)}))];}
async function invoke(values,{visible=['steam:620'],query='steam',mediaElements=0}={}){
 const names=[],report={},history=['#media?q=steam'];let index=0,position=0;
 // This is only an assertion-wiring mock, not browser/navigation acceptance.
 const page={
  evaluate:async(fn,arg)=>{const source=String(fn);if(source.includes("location.hash='#media?q=steam'"))return;if(source==='()=>location.hash')return history[position];return values[index++];},
  waitForFunction:async()=>{},
  goBack:async()=>{position--;},goForward:async()=>{position++;},
  locator:selector=>({inputValue:async()=>query,evaluateAll:async()=>visible,count:async()=>mediaElements,
   click:async()=>{const mode=selector.includes('"bounded"')?'bounded':'baseline';history.splice(++position);history.push('#media?event_view='+mode+'&q=steam');}}),
 };
 await runMediaBrowserChecks({root,report,origin:'http://127.0.0.1:12345',page,check:async(name,fn)=>{await fn();names.push(name);}});return {names,report,index};
}
test('CI browser coverage validates all four result groups before reporting them',async()=>{const result=await invoke(prepared());assert.equal(result.names.length,4);assert.equal(result.index,3);assert.equal(result.report.mediaTerminalStates.length,3);assert.equal(result.report.mediaRecovery.exactVisibleJSON,true);});
test('CI assertions reject changed served module bytes',async()=>{const values=prepared();values[0]['event-log-view.mjs']='0'.repeat(64);await assert.rejects(()=>invoke(values),error=>error.code==='ERR_ASSERTION'&&error.actual==='0'.repeat(64));});
test('CI assertions reject omitted recovery failures and automatic playback',async()=>{let values=prepared();values[1].state.render_failures=0;await assert.rejects(()=>invoke(values),error=>error.code==='ERR_ASSERTION'&&error.actual===0&&error.expected===2);values=prepared();values[2][0].calls.play=1;await assert.rejects(()=>invoke(values),error=>error.code==='ERR_ASSERTION'&&error.actual===1&&error.expected===0);});
test('existing browser entry calls additive Media checks without adding a browser launcher',()=>{const entry=fs.readFileSync(path.resolve(__dirname,'../scripts/test_browser.cjs'),'utf8'),helper=fs.readFileSync(path.resolve(__dirname,'../scripts/media_browser_checks.cjs'),'utf8');assert.equal(entry.split("require('./media_browser_checks.cjs').runMediaBrowserChecks").length-1,1);assert.doesNotMatch(helper,/chromium\.launch|--no-sandbox|require\(['"]playwright/);assert.match(helper,/Synthetic transient insertion failure/);assert.match(helper,/same|Superseded callbacks/);});

test('CI filter assertions reject lost query, broadened cards or unexpected loaded media',async()=>{for(const options of [{query:''},{visible:['steam:620','youtube:M7lc1UVf-VE']},{mediaElements:1}])await assert.rejects(()=>invoke(prepared(),options),error=>error.code==='ERR_ASSERTION');});
