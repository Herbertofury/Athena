import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const full=readFileSync(process.env.MEDIA_SOURCE||new URL('../docs/media-lab/media.js',import.meta.url),'utf8');const source=full.slice(full.indexOf('function addVideo('),full.indexOf('\nconst hlsApi='));
function fixture(mode='native'){let ytOptions,hlsError,playCalls=0;const timers=new Map(),elements=[],events=[];let serial=0;
 function node(tag,text='',className=''){const e={tag,textContent:text,className,children:[],listeners:{},value:'',disabled:false,currentTime:0,videoWidth:0,videoHeight:0,setAttribute(){},addEventListener(type,fn){this.listeners[type]=fn;},append(...items){this.children.push(...items);if(tag==='select'&&!this.value&&items.length)this.value=String(items[0].value);},replaceChildren(){this.children=[];},pause(){},load(){},removeAttribute(){},canPlayType(){return mode.startsWith('hls')?'':'probably';}};elements.push(e);return e;}
 class Hls {static Events={ERROR:'error'};on(_type,fn){hlsError=fn;}loadSource(){}attachMedia(){}destroy(){}}
 const context={node,youtubeApi:async()=>{},hlsApi:async()=>{if(mode==='hlsfail')throw Error('Generated library failure');},location:{origin:'https://example.invalid'},YT:{Player:class{constructor(_target,options){ytOptions=options;}destroy(){}playVideo(){playCalls++;}pauseVideo(){}}},Hls,window:{Hls:{isSupported:()=>true}},event:(type,details)=>events.push({type,details}),safeMediaUrl:u=>u,nativePlaybackLabel:type=>type==='error'?'Playback failed.':null,performance:{now:()=>0},setTimeout(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);}};vm.createContext(context);vm.runInContext(source+'\nthis.attach=addVideo;',context);
 const content=node('div');context.attach(mode==='youtube'?{provider:'YouTube',id:'youtube:fixture',title:'Generated player fixture',videos:[{id:'abcdefghijk',kind:'youtube'}]}:{provider:'Steam',id:'steam:fixture',title:'Generated player fixture',videos:[{id:1,hls:'https://video.akamai.steamstatic.com/generated.m3u8'}]},content);
 return {timers,elements,events,ytOptions:()=>ytOptions,playCalls:()=>playCalls,fatal:()=>hlsError(null,{fatal:true,type:'networkError',details:'generated'}),hlsError:data=>hlsError(null,data),load:()=>elements.find(e=>e.tag==='button'&&e.textContent==='Load selected player').listeners.click(),state:()=>elements.find(e=>e.className==='player-state'),video:()=>elements.filter(e=>e.tag==='video').at(-1),select:()=>elements.filter(e=>e.tag==='select')[1]};
}
test('native player readiness has a bounded truthful status without autoplay',async()=>{const f=fixture();await f.load();const timer=[...f.timers.values()].find(t=>t.ms===30000);assert.ok(timer,'readiness needs its own deadline');timer.fn();assert.match(f.state().textContent,/not verified/);assert.ok(f.events.some(e=>e.type==='player_ready_unverified_timeout'));assert.equal(f.video().autoplay,undefined);f.video().listeners.canplay();assert.match(f.state().textContent,/ready/);assert.equal(f.timers.size,0);});
test('old readiness deadline cannot overwrite a changed selection',async()=>{const f=fixture();await f.load();const timer=[...f.timers.values()].find(t=>t.ms===30000);assert.ok(timer);f.select().listeners.change();const expected=f.state().textContent;timer.fn();assert.equal(f.state().textContent,expected);assert.equal(f.timers.size,0);});
test('a native error clears readiness deadline and keeps the failure state',async()=>{const f=fixture();await f.load();assert.ok(f.timers.size);f.video().listeners.error();assert.equal(f.timers.size,0);assert.equal(f.state().textContent,'Playback failed.');});

test('official YouTube ready clears deadline without requesting playback',async()=>{const f=fixture('youtube');await f.load();assert.ok(f.timers.size);assert.equal(f.ytOptions().playerVars.autoplay,0);f.ytOptions().events.onReady();assert.equal(f.timers.size,0);assert.match(f.state().textContent,/Official player ready/);assert.equal(f.playCalls(),0);});
test('stale official player callback cannot overwrite selection state',async()=>{const f=fixture('youtube');await f.load();const ready=f.ytOptions().events.onReady;f.select().listeners.change();const expected=f.state().textContent;ready();assert.equal(f.state().textContent,expected);assert.equal(f.timers.size,0);});
test('fatal HLS error clears readiness deadline',async()=>{const f=fixture('hls');await f.load();assert.ok(f.timers.size);f.fatal();assert.equal(f.timers.size,0);assert.match(f.state().textContent,/HLS playback error/);});
test('failed HLS library load clears readiness deadline',async()=>{const f=fixture('hlsfail');await f.load();assert.equal(f.timers.size,0);assert.match(f.state().textContent,/Generated library failure/);});


// A terminal failure belongs to the current load attempt. Late callbacks from
// that attempt must not convert failed media into ready/playing evidence.
function control(f, text) {return f.elements.find(e=>e.tag==='button'&&e.textContent===text);}
test('terminal YouTube error survives late readiness and playing callbacks',async()=>{
 const f=fixture('youtube');await f.load();const callbacks=f.ytOptions().events;
 callbacks.onError({data:150});const failure=f.state().textContent;
 callbacks.onReady();callbacks.onStateChange({data:1});
 assert.equal(f.state().textContent,failure);
 assert.equal(control(f,'Play').disabled,true);assert.equal(control(f,'Pause').disabled,true);
 assert.equal(f.events.some(e=>e.type==='youtube_ready'||e.type==='youtube_playing'),false);
 assert.equal(f.timers.size,0);
});
test('terminal native error survives late canplay and playing callbacks',async()=>{
 const f=fixture();await f.load();f.video().listeners.error();const failure=f.state().textContent;
 f.video().listeners.canplay();f.video().listeners.playing();
 assert.equal(f.state().textContent,failure);
 assert.equal(control(f,'Play').disabled,true);assert.equal(control(f,'Pause').disabled,true);
 assert.equal(f.events.some(e=>e.type==='video_canplay'||e.type==='video_playing'),false);
 assert.equal(f.timers.size,0);
});
test('terminal HLS error survives late canplay and playing callbacks',async()=>{
 const f=fixture('hls');await f.load();f.fatal();const failure=f.state().textContent;
 f.video().listeners.canplay();f.video().listeners.playing();
 assert.equal(f.state().textContent,failure);
 assert.equal(control(f,'Play').disabled,true);assert.equal(control(f,'Pause').disabled,true);
 assert.equal(f.events.some(e=>e.type==='video_canplay'||e.type==='video_playing'),false);
 assert.equal(f.timers.size,0);
});
test('terminal YouTube error disables already ready controls',async()=>{
 const f=fixture('youtube');await f.load();f.ytOptions().events.onReady();
 assert.equal(control(f,'Play').disabled,false);f.ytOptions().events.onError({data:150});
 assert.equal(control(f,'Play').disabled,true);assert.equal(control(f,'Pause').disabled,true);
});
test('terminal native error disables already ready controls',async()=>{
 const f=fixture();await f.load();f.video().listeners.canplay();
 assert.equal(control(f,'Play').disabled,false);f.video().listeners.error();
 assert.equal(control(f,'Play').disabled,true);assert.equal(control(f,'Pause').disabled,true);
});
test('terminal HLS error disables already ready controls',async()=>{
 const f=fixture('hls');await f.load();f.video().listeners.canplay();
 assert.equal(control(f,'Play').disabled,false);f.fatal();
 assert.equal(control(f,'Play').disabled,true);assert.equal(control(f,'Pause').disabled,true);
});

test('explicit reload recovers each failed provider and fences prior callbacks',async()=>{
 for(const mode of ['youtube','native','hls']){
  const f=fixture(mode);await f.load();
  const old=mode==='youtube'?f.ytOptions().events:f.video().listeners;
  if(mode==='youtube')old.onError({data:150});else if(mode==='hls')f.fatal();else old.error();
  assert.equal(control(f,'Load selected player').disabled,false);
  await f.load();
  const before=f.events.length;
  if(mode==='youtube'){old.onReady();old.onStateChange({data:1});}
  else{old.canplay();old.playing();}
  assert.equal(f.events.length,before,'superseded callbacks cannot add new evidence');
  assert.equal(control(f,'Play').disabled,true);
  if(mode==='youtube')f.ytOptions().events.onReady();else f.video().listeners.canplay();
  assert.equal(control(f,'Play').disabled,false,'new explicit load can become ready');
  assert.equal(f.timers.size,0);
 }
});
test('queued readiness or playback deadline cannot erase a terminal failure',async()=>{
 const f=fixture('youtube');await f.load();const readiness=[...f.timers.values()][0];
 f.ytOptions().events.onReady();await control(f,'Play').listeners.click();
 const playback=[...f.timers.values()][0];assert.ok(playback);
 f.ytOptions().events.onError({data:150});const failure=f.state().textContent;
 readiness.fn();playback.fn();
 assert.equal(f.state().textContent,failure);assert.equal(f.timers.size,0);
 assert.equal(f.events.some(e=>e.type.endsWith('unverified_timeout')),false);
});
test('late blocked, paused, ended, buffering and duplicate errors preserve the first terminal failure',async()=>{
 const f=fixture('youtube');await f.load();const callbacks=f.ytOptions().events;
 callbacks.onError({data:150});const failure=f.state().textContent,events=f.events.length;
 callbacks.onAutoplayBlocked();for(const data of [0,1,2,3,5])callbacks.onStateChange({data});
 callbacks.onError({data:100});
 assert.equal(f.state().textContent,failure);assert.equal(f.events.length,events);
});
test('even direct button handlers cannot play or pause a terminally failed attempt',async()=>{
 const f=fixture('youtube');await f.load();f.ytOptions().events.onReady();
 f.ytOptions().events.onError({data:150});const before=f.events.length;
 await control(f,'Play').listeners.click();control(f,'Pause').listeners.click();
 assert.equal(f.playCalls(),0);assert.equal(f.events.length,before);assert.equal(f.timers.size,0);
});
test('late native play rejection does not erase a newer terminal error',async()=>{
 const f=fixture();await f.load();f.video().listeners.canplay();let reject;
 f.video().play=()=>new Promise((_resolve,r)=>{reject=r;});
 const pending=control(f,'Play').listeners.click();f.video().listeners.error();
 const failure=f.state().textContent;reject(Error('generated late play rejection'));await pending;
 assert.equal(f.state().textContent,failure);
 assert.equal(f.events.some(e=>e.type==='play_rejected'),false);
});
test('ordinary native play rejection remains retryable rather than terminal',async()=>{
 const f=fixture();await f.load();f.video().listeners.canplay();
 f.video().play=()=>Promise.reject(Error('generated browser gesture requirement'));
 await control(f,'Play').listeners.click();
 assert.equal(control(f,'Play').disabled,false);assert.equal(control(f,'Pause').disabled,false);
 assert.equal(f.events.at(-1).type,'play_rejected');
});
test('unverified readiness deadline is recoverable without an unnecessary new load',async()=>{
 for(const mode of ['youtube','native','hls']){
  const f=fixture(mode);await f.load();[...f.timers.values()][0].fn();
  assert.match(f.state().textContent,/not verified/);
  if(mode==='youtube')f.ytOptions().events.onReady();else f.video().listeners.canplay();
  assert.equal(control(f,'Play').disabled,false);assert.match(f.state().textContent,/ready/);
 }
});

test('nonfatal HLS errors leave readiness and controls recoverable',async()=>{
 const f=fixture('hls');await f.load();f.hlsError({fatal:false,type:'networkError',details:'generated transient'});
 assert.equal(f.timers.size,1);assert.equal(f.events.some(e=>e.type==='hls_error'),false);
 f.video().listeners.canplay();assert.equal(control(f,'Play').disabled,false);
});
