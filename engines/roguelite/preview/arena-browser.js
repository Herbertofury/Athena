// SPDX-License-Identifier: GPL-3.0-or-later
const get=id=>document.getElementById(id);
const board=get('arena'), ctx=board.getContext('2d'), start=get('start'), pause=get('pause'), seed=get('seed');
const hud=Object.fromEntries(['hp','level','xp','kills','time','arsenal'].map(id=>[id,get(id)]));
const choicePanel=get('choice'), choices=get('choices'), status=get('status'), formatField=get('run-format'), pressure=get('pressure');
const movementKeys=new Set(['KeyA','KeyD','KeyW','KeyS','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight']);
const keys={};
const stepSeconds=1/60;
let host=null, snapshot=null, mode='ready', raf=0, prior=0, leftover=0, lastOffer=null;
const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
const clearKeys=()=>{for(const key of Object.keys(keys))delete keys[key];};
function transition(next,message){
 mode=next;setText(status,message);
 pause.disabled=!['running','paused'].includes(next);setText(pause,next==='paused'?'Resume':'Pause');
 if(next!=='running'){
  if(raf)cancelAnimationFrame(raf);raf=0;prior=0;leftover=0;clearKeys();
 }else if(!raf){raf=requestAnimationFrame(frame);}
}
function showChoices(offers){
 if(lastOffer===offers)return;
 lastOffer=offers;choicePanel.hidden=false;choices.replaceChildren();
 for(const {id,name,icon,kind} of offers){
  const button=document.createElement('button');button.textContent=icon+' '+name;
  const marker=document.createElement('span');marker.textContent=kind==='weapon'?'New weapon':'Stat upgrade';
  button.append(marker);
  button.addEventListener('click',()=>{
   if(mode!=='choice'||lastOffer!==offers)return;
   host.choose(id);snapshot=host.snapshot();choices.replaceChildren();choicePanel.hidden=true;lastOffer=null;
   transition(snapshot.run.gameOver?'finished':'running',snapshot.run.gameOver?'Run finished.':'Upgrade equipped: '+name);
   board.focus();draw();
  });
  choices.append(button);
 }
 choices.firstElementChild?.focus();
}
function showFrameStats(){
 if(!snapshot)return;
 const {player,gameTime,run}=snapshot;
 setText(hud.hp,Math.max(0,Math.ceil(player.hp))+' / '+player.maxHp);
 setText(hud.level,String(player.level));setText(hud.xp,player.xp+' / '+player.xpToNext);setText(hud.kills,String(run.kills));
 const t=Math.floor(gameTime);setText(hud.time,Math.floor(t/60)+':'+String(t%60).padStart(2,'0'));
 const m=snapshot.arenaFormat;
 setText(pressure,m?(m.seconds===null?'Endless':m.seconds/60+' min')+' · '+m.label+(m.wave?' '+m.wave:''):'Classic source rules');
 setText(hud.arsenal,'Equipped: '+player.weapons.map(w=>w.name).join(' · '));
}
function circle(x,y,r,color){
 ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);ctx.fill();
}
function draw(){
 const W=board.width,H=board.height,p=snapshot?.player??{x:0,y:0}, ox=W/2-p.x, oy=H/2-p.y;
 ctx.fillStyle='#0b0d15';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#1d2637';ctx.lineWidth=1;ctx.beginPath();
 for(let x=((ox%40)+40)%40;x<W;x+=40){ctx.moveTo(x,0);ctx.lineTo(x,H);}
 for(let y=((oy%40)+40)%40;y<H;y+=40){ctx.moveTo(0,y);ctx.lineTo(W,y);}
 ctx.stroke();
 for(const gem of snapshot?.gems??[]){
  ctx.fillStyle='#6ee7b7';ctx.beginPath();const x=gem.x+ox,y=gem.y+oy,r=Math.min(10,gem.size);
  ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fill();
 }
 for(const enemy of snapshot?.enemies??[]){
  const x=enemy.x+ox,y=enemy.y+oy;circle(x,y,enemy.size,enemy.hitFlash>0?'#fff1dc':enemy.color);
  ctx.fillStyle='#252533';ctx.fillRect(x-enemy.size,y-enemy.size-7,2*enemy.size,3);
  ctx.fillStyle='#ff8f94';ctx.fillRect(x-enemy.size,y-enemy.size-7,2*enemy.size*Math.max(0,Math.min(1,enemy.hp/enemy.maxHp)),3);
 }
 for(const shot of snapshot?.projectiles??[])circle(shot.x+ox,shot.y+oy,shot.size,shot.color);
 for(const b of snapshot?.bibles??[])circle(W/2+Math.cos(b.angle)*b.r,H/2+Math.sin(b.angle)*b.r,b.size,b.color);
 circle(W/2,H/2,15,p.dashTimer>0?'#d6faff':'#354967');circle(W/2,H/2,10,'#89f7cd');
 ctx.font='bold 13px system-ui';ctx.textAlign='center';
 for(const n of snapshot?.damageNumbers??[]){ctx.fillStyle=n.color;ctx.fillText(n.val,n.x+ox,n.y+oy);}
 if(mode==='ready'||mode==='paused'||mode==='finished'){
  ctx.fillStyle='#0a0c14d9';ctx.fillRect(0,H/2-31,W,63);ctx.font='bold 25px system-ui';ctx.fillStyle='#f1f5ff';
  ctx.fillText(mode==='ready'?'Survivor Arena':mode==='paused'?'Paused':snapshot.run.won?'You survived!':'Run finished',W/2,H/2+8);
 }
 showFrameStats();
}
function frame(now){
 raf=0;if(mode!=='running')return;
 if(prior)leftover+=Math.min(.1,(now-prior)/1000);
 prior=now;let turns=0;
 while(leftover>=stepSeconds&&turns++<6&&mode==='running'){
  leftover-=stepSeconds;const tick=host.step({dt:stepSeconds,keys});
  if(tick.audio.some(cue=>cue.id==='jump')){delete keys.ShiftLeft;delete keys.ShiftRight;}
  // Snapshot once per display except when the host pauses on a choice or ends.
  const result=tick.status;
  if(result!=='running'){
   snapshot=host.snapshot();
   if(result==='choice'){
    transition('choice','Level '+snapshot.player.level+'. Choose an upgrade.');
    showChoices(snapshot.offers);
   }else transition('finished',snapshot.run.won?(snapshot.arenaFormat?'Marathon complete.':'You survived five minutes.'):'Run finished. Try another seed or play again.');
  }
 }
 if(mode==='running')snapshot=host.snapshot();
 draw();if(mode==='running'&&!raf)raf=requestAnimationFrame(frame);
}
function togglePause(){
 if(mode==='running')transition('paused','Paused. Resume when ready.');
 else if(mode==='paused'){transition('running','Run resumed.');board.focus();}
 draw();
}
start.addEventListener('click',()=>{
 if(!seed.checkValidity()||seed.value===''){seed.focus();setText(status,'Enter a whole seed from 0 to 4294967295.');return;}
 let state=Number(seed.value)>>>0;
 host=createLegacySurvivorRun({format:formatField.value,random:()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;}});
 clearKeys();lastOffer=null;choicePanel.hidden=true;choices.replaceChildren();prior=0;leftover=0;snapshot=host.snapshot();
 transition('running','Run started.');setText(start,'Restart run');board.focus();draw();
});
pause.addEventListener('click',togglePause);
window.addEventListener('keydown',e=>{
 if(e.code==='Escape'&&['running','paused'].includes(mode)&&!e.repeat){e.preventDefault();togglePause();return;}
 if(e.target===board&&mode==='running'&&movementKeys.has(e.code)){e.preventDefault();if(!e.repeat||!e.code.startsWith('Shift'))keys[e.code]=true;}
});
window.addEventListener('keyup',e=>{delete keys[e.code];});
board.addEventListener('blur',clearKeys);
window.addEventListener('blur',clearKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')togglePause();});
for(const button of document.querySelectorAll('[data-code]')){
 const code=button.dataset.code;
 button.addEventListener('pointerdown',e=>{if(mode==='running'){e.preventDefault();button.setPointerCapture(e.pointerId);keys[code]=true;}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{delete keys[code];});
}
draw();
