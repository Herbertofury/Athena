const test=require('node:test');const assert=require('node:assert/strict');const ticker=require('../ticker-core.js');
function target(extra={}){const listeners=new Map();return {...extra,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);},emit(type,event={}){for(const fn of listeners.get(type)||[])fn(event);},count(){return [...listeners.values()].reduce((n,s)=>n+s.size,0);}};}
function setup(reduced=false){
  const media=target({matches:reduced}),win=target({matchMedia:()=>media,getComputedStyle:()=>({columnGap:'10px'})}),doc=target({hidden:false,defaultView:win});
  const viewport=target({ownerDocument:doc,style:{overflowX:''},dataset:{},contains:n=>n==='inside'}),animations=[];
  const track=target({style:{transform:''},children:[{},{}],animate(frames,timing){const a={frames,timing,currentTime:0,playing:true,cancelled:false,play(){this.playing=true;},pause(){this.playing=false;},cancel(){this.cancelled=true;this.playing=false;}};animations.push(a);return a;}});
  const segment={getBoundingClientRect:()=>({width:390})};
  const api=ticker.mountTicker({viewport,track,segment});return {api,media,doc,viewport,track,win,animations};
}
test('duration scales by measured distance and zero means pause',()=>{assert.equal(ticker.durationMs(1200,40),30000);assert.equal(ticker.durationMs(0,40),Infinity);assert.equal(ticker.durationMs(1200,0),Infinity);assert.equal(ticker.normalizeOptions({speedPxPerSec:0}).speedPxPerSec,0);});
test('explicit user pause survives hover and visibility changes until resumed',()=>{
  const s=setup();assert.equal(s.api.state().paused,false);s.api.pause();s.viewport.emit('mouseenter');s.viewport.emit('mouseleave');assert.equal(s.api.state().userPaused,true);
  s.doc.hidden=true;s.doc.emit('visibilitychange');s.api.play();assert.equal(s.api.state().paused,true);s.doc.hidden=false;s.doc.emit('visibilitychange');assert.equal(s.api.state().paused,false);s.api.dispose();
});
test('reduced motion, focus and no-animation fallback keep complete content usable',()=>{
  const s=setup(true);assert.ok(s.api.state().reasons.includes('reduced-motion'));assert.equal(s.viewport.style.overflowX,'auto');s.media.matches=false;s.media.emit('change');assert.equal(s.api.state().paused,false);
  s.viewport.emit('focusin');assert.equal(s.api.state().paused,true);s.viewport.emit('focusout',{relatedTarget:'inside'});assert.equal(s.api.state().paused,true);s.viewport.emit('focusout',{relatedTarget:null});assert.equal(s.api.state().paused,false);s.api.dispose();
});
test('speed change preserves physical phase and teardown cancels animation/listeners',()=>{
  const s=setup();s.animations[0].currentTime=2500;s.api.update({speedPxPerSec:80});assert.equal(s.animations[1].currentTime,1250);assert.equal(s.animations[0].cancelled,true);
  s.api.update({direction:'right'});assert.equal(s.animations[2].currentTime,3750);
  s.api.dispose();s.api.dispose();assert.ok(s.animations.every(a=>a.cancelled));assert.equal(s.viewport.count()+s.track.count()+s.doc.count()+s.win.count()+s.media.count(),0);assert.equal(s.viewport.style.overflowX,'');assert.equal(s.api.state().disposed,true);
});
