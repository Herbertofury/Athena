/*  * ticker-core 0.1.0 — application-neutral, accessible scrolling lifecycle.
 * Hosts own markup, colors, images and text; no feed or network dependency.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TickerCore=api;})
(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='0.1.0';
  const bounded=(value,fallback,min,max)=>value!==null&&value!==''&&Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
  function normalizeOptions(raw={}){
    const p=raw&&typeof raw==='object'?raw:{};
    return {enabled:p.enabled!==false,speedPxPerSec:bounded(p.speedPxPerSec,40,0,500),direction:p.direction==='right'?'right':'left',paused:p.paused===true,
      motion:['off','full','system'].includes(p.motion)?p.motion:'system',pauseOnHover:p.pauseOnHover!==false};
  }
  function durationMs(distancePx,speedPxPerSec){const distance=Number(distancePx),speed=Number(speedPxPerSec);return Number.isFinite(distance)&&Number.isFinite(speed)&&distance>0&&speed>0?distance/speed*1000:Infinity;}
  function mountTicker({viewport,track,segment,options={},onStateChange=()=>{}}={}){
    if(!viewport||!track||!segment)throw new TypeError('Ticker requires viewport, track and one original segment.');
    const doc=viewport.ownerDocument,win=doc?.defaultView;
    let settings=normalizeOptions(options),animation=null,disposed=false,hover=false,focused=false,visible=true,loopPx=0,duration=0,phase=0;
    const removals=[],originalOverflow=viewport.style.overflowX,originalTransform=track.style.transform;
    const media=win?.matchMedia?.('(prefers-reduced-motion: reduce)');
    let clone=null;
    const notify=()=>{const value=state();onStateChange(value);return value;};
    function reasons(){return [...(!settings.enabled?['disabled']:[]),...(settings.paused?['user']:[]),...(settings.speedPxPerSec===0?['speed']:[]),
      ...(settings.motion==='off'||(settings.motion==='system'&&media?.matches)?['reduced-motion']:[]),...(doc?.hidden?['hidden']:[]),...(!visible?['offscreen']:[]),
      ...(hover&&settings.pauseOnHover?['hover']:[]),...(focused?['focus']:[]),...(!animation?['static']:[])];}
    function state(){const pausedFor=reasons();return {paused:pausedFor.length>0,userPaused:settings.paused,reasons:pausedFor,disposed,distancePx:loopPx,durationMs:duration,options:{...settings}};}
    function apply(){if(disposed)return;const pausedFor=reasons();if(animation){if(pausedFor.length)animation.pause();else animation.play();}
      viewport.dataset.tickerState=pausedFor.length?'paused':'playing';notify();}
    function remember(){if(animation&&duration>0&&loopPx>0){const ratio=Number(animation.currentTime||0)%duration/duration;phase=settings.direction==='left'?ratio*loopPx:(1-ratio)*loopPx;}}
    function measure(){
      if(disposed)return;remember();animation?.cancel();animation=null;
      const measured=segment.getBoundingClientRect().width;
      const gap=win?.getComputedStyle?parseFloat(win.getComputedStyle(track).columnGap)||0:0;
      loopPx=measured+gap;duration=durationMs(loopPx,settings.speedPxPerSec);
      if(loopPx>0&&Number.isFinite(duration)&&typeof track.animate==='function'){
        const from=settings.direction==='right'?-loopPx:0,to=settings.direction==='right'?0:-loopPx;
        animation=track.animate([{transform:`translateX(${from}px)`},{transform:`translateX(${to}px)`}],{duration,iterations:Infinity,easing:'linear'});
        const position=((phase%loopPx)+loopPx)%loopPx;
        animation.currentTime=(settings.direction==='right'?1-position/loopPx:position/loopPx)*duration;
      }
      apply();
    }
    function listen(target,type,handler){target?.addEventListener?.(type,handler);removals.push(()=>target?.removeEventListener?.(type,handler));}
    // Static/reduced-motion fallback retains the complete original and manual scrolling.
    viewport.style.overflowX='auto';
    if(track.children.length===1&&segment.cloneNode){
      clone=segment.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.setAttribute('inert','');clone.removeAttribute('id');
      for(const node of clone.querySelectorAll('[id]'))node.removeAttribute('id');
      for(const node of clone.querySelectorAll('a,button,input,select,textarea,[tabindex]'))node.setAttribute('tabindex','-1');
      track.appendChild(clone);
    }
    listen(viewport,'mouseenter',()=>{hover=true;apply();});listen(viewport,'mouseleave',()=>{hover=false;apply();});
    listen(viewport,'focusin',()=>{focused=true;apply();});listen(viewport,'focusout',event=>{focused=!!event.relatedTarget&&viewport.contains(event.relatedTarget);apply();});
    listen(doc,'visibilitychange',apply);listen(media,'change',apply);
    listen(track,'load',measure); // Captured image sizes are also handled by ResizeObserver.
    const Resize=win?.ResizeObserver||(typeof ResizeObserver!=='undefined'?ResizeObserver:null);
    const resize=Resize?new Resize(measure):null;resize?.observe(segment);if(!resize)listen(win,'resize',measure);
    const Intersection=win?.IntersectionObserver||(typeof IntersectionObserver!=='undefined'?IntersectionObserver:null);
    const observer=Intersection?new Intersection(entries=>{visible=entries.some(entry=>entry.isIntersecting);apply();}):null;observer?.observe(viewport);
    measure();
    return {
      pause(){settings.paused=true;apply();return state();},play(){settings.paused=false;apply();return state();},
      update(patch={}){if(disposed)return state();remember();animation?.cancel();animation=null;settings=normalizeOptions({...settings,...patch});measure();return state();},
      measure,state,
      dispose(){if(disposed)return;disposed=true;animation?.cancel();animation=null;resize?.disconnect();observer?.disconnect();for(const remove of removals)remove();clone?.remove();
        track.style.transform=originalTransform;viewport.style.overflowX=originalOverflow;delete viewport.dataset.tickerState;notify();}
    };
  }
  return Object.freeze({VERSION,normalizeOptions,normalizeTickerOptions:normalizeOptions,durationMs,mountTicker,createTicker:mountTicker});
});
