// SPDX-License-Identifier: GPL-3.0-or-later
const get=id=>document.getElementById(id);
const board=get('arena'), ctx=board.getContext('2d'), start=get('start'), pause=get('pause'), seed=get('seed');
const hud=Object.fromEntries(['hp','level','xp','kills','time','arsenal'].map(id=>[id,get(id)]));
const choicePanel=get('choice'), choices=get('choices'), status=get('status'), formatField=get('run-format'), pressure=get('pressure');
const expedition=get('expedition-readout'), eventReadout=get('expedition-event'), balanceReadout=get('expedition-balance');
const riftPanel=get('rift-readout'),riftEvent=get('rift-event'),riftTime=get('rift-time'),riftEarned=get('rift-earned'),leaveRift=get('rift-abandon');
const direction=(dx,dy)=>(Math.abs(dy)>28?(dy<0?'north':'south'):'')+(Math.abs(dx)>28?(dx<0?'west':'east'):'')||'nearby';
const clockLabel=time=>{const t=Math.floor(Math.max(0,time));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};
const campPanel=get('camp-readout'),campEvent=get('camp-event'),campWallet=get('camp-wallet'),campRanks=get('camp-ranks');
const movementKeys=new Set(['KeyA','KeyD','KeyW','KeyS','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight']);
const keys={};
const stepSeconds=1/60;
let host=null, snapshot=null, transfer=0, mode='ready', raf=0, prior=0, leftover=0, lastOffer=null;
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
 const kind=offers[0]?.kind;
 setText(get('choice-title'),kind==='rift'?'Choose a rift route':kind==='camp'?'Choose a camp upgrade':'Choose an upgrade');
 for(const {id,name,icon,kind} of offers){
  const button=document.createElement('button');button.textContent=icon+' '+name;
  const marker=document.createElement('span');marker.textContent=kind==='rift'?'Rift decision':kind==='camp'?'Camp decision':kind==='weapon'?'New weapon':'Stat upgrade';
  button.append(marker);
  button.addEventListener('click',()=>{
   if(mode!=='choice'||lastOffer!==offers)return;
   if(loading){transfer++;controls(false);reportTape('Verification cancelled because you chose an upgrade.');}
   const result=host.choose(id);snapshot=host.frameView();choices.replaceChildren();choicePanel.hidden=true;lastOffer=null;
   transition(snapshot.run.gameOver?'finished':'running',snapshot.run.gameOver?'Run finished.':kind==='rift'?(snapshot.rift.active?'Rift entered. Your main run is paused.':'Stayed in the main expedition.'):kind==='camp'?(result.camp?.perk?'Camp upgrade built.':'Left the camp.'):'Upgrade equipped: '+name);
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
 setText(hud.time,clockLabel(gameTime));
 get('write-tape').disabled=!host?.canSave();
 const m=snapshot.arenaFormat;
 setText(pressure,m?(m.seconds===null?'Endless':m.seconds/60+' min')+' · '+m.label+(m.wave?' '+m.wave:''):'Classic source rules');
 const discoveries=snapshot.roaming;
 expedition.hidden=!discoveries;
 if(discoveries){
  const target=discoveries.live, cache=discoveries.caches[0];
  const marked=cache??target;
  const dx=marked?marked.x-player.x:0,dy=marked?marked.y-player.y:0;
  const where=' · '+direction(dx,dy);
  const name=cache?'Cache dropped: collect '+cache.resource+where:target?target.name+' spotted'+where:'No roaming encounter nearby.';
  setText(eventReadout,name);
  setText(balanceReadout,'Crystal '+discoveries.balance.crystal+' · Gold '+discoveries.balance.gold);
 }
 const route=snapshot.rift;
 riftPanel.hidden=!route;
 leaveRift.hidden=!route?.active;
 if(route){
  const mark=snapshot.portal?.marker;
  const state=route.active?'Inside a '+route.active.minutes+'-minute rift':snapshot.portal?.awaitingDecision?'Rift reached. Choose whether to enter.':mark?mark.minutes+'-minute rift detected · '+direction(mark.x-player.x,mark.y-player.y):route.last?({won:'Rift cleared. Main expedition resumed.',lost:'Rift lost. Main expedition resumed.',abandoned:'Rift left. Main expedition resumed.'})[route.last.result]:'No portal nearby.';
  setText(riftEvent,state);
  setText(riftTime,route.active?'Rift time remaining '+clockLabel(route.active.minutes*60-gameTime)+' · Main timer paused at '+clockLabel(route.mainTime):'Rift sessions do not advance your main run.');
  setText(riftEarned,'Rift rewards this run: Crystal '+route.earned.crystal+' · Gold '+route.earned.gold);
 }
 const camp=snapshot.camp;
 campPanel.hidden=!camp||Boolean(route?.active);
 if(camp&&!route?.active){
  const {mark,prompt,balance,ranks}=camp;
  setText(campEvent,prompt?'Camp reached. Choose what to build.':mark?'Camp workshop · '+direction(mark.x-player.x,mark.y-player.y):'No workshop nearby.');
  setText(campWallet,'Available for camp: Crystal '+balance.crystal+' · Gold '+balance.gold);
  setText(campRanks,'Built: Health totems '+ranks.health+' · Weapon racks '+ranks.damage);
 }
 setText(hud.arsenal,'Equipped: '+player.weapons.map(w=>w.name).join(' · '));
}
function circle(x,y,r,color){
 ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);ctx.fill();
}
function drawExpedition(discoveries,ox,oy,width,height) {
 if(!discoveries)return;
 const {live,caches}=discoveries;
 if(live){
  const x=live.x+ox,y=live.y+oy;
  if(live.kind==='geode'){
   const bx=live.anchorX+ox,by=live.anchorY+oy;
   const dx=bx-x,dy=by-y;
   for(let i=6;i>=1;i--){
    const ratio=i*.43;
    circle(x+dx*ratio,y+dy*ratio+Math.sin(i*1.3)*9,29-i*2.8,i%2?'#285960':'#356d76');
   }
   circle(x,y,live.size+5,'#24565b');
  }else{
   ctx.fillStyle='#74442d';ctx.fillRect(x-19,y-10,13,20);
  }
  circle(x,y,live.size,live.hitFlash>0?'#fff4c9':live.color);
  ctx.fillStyle='#042023';ctx.fillRect(x-32,y-live.size-11,64,5);
  ctx.fillStyle=live.color;ctx.fillRect(x-32,y-live.size-11,64*Math.max(0,live.hp/live.maxHp),5);
  if(x>=35&&x<=width-35&&y>=40&&y<=height-22){
   ctx.textAlign='center';ctx.font='bold 12px system-ui';ctx.fillStyle='#fff5df';
   ctx.fillText(live.kind==='geode'?'MINE THE GEODE':'CATCH THE GOBLIN',x,y-live.size-17);
  }
 }
 for(const cache of caches){
  const x=cache.x+ox,y=cache.y+oy;
  ctx.strokeStyle=cache.resource==='gold'?'#ffca75':'#8affee';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#16273b';ctx.fillRect(x-12,y-8,24,16);ctx.strokeRect(x-12,y-8,24,16);
 }
 const marked=caches[0]??live;
 if(marked){
  const x=marked.x+ox,y=marked.y+oy;
  if(x<24||x>width-24||y<24||y>height-24){
   const dx=x-width/2,dy=y-height/2;
   const scale=Math.min((width/2-27)/Math.max(1,Math.abs(dx)),(height/2-27)/Math.max(1,Math.abs(dy)));
   const atX=width/2+dx*scale,atY=height/2+dy*scale,angle=Math.atan2(dy,dx);
   ctx.save();ctx.translate(atX,atY);ctx.rotate(angle);
   ctx.fillStyle=marked.resource==='gold'?'#ffca75':'#8affee';
   ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(-8,-9);ctx.lineTo(-3,0);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();
   ctx.restore();
  }
 }
}
function drawRift(mark,ox,oy,W,H){
 if(!mark)return;
 const rawX=mark.x+ox,rawY=mark.y+oy;
 const x=Math.max(26,Math.min(W-26,rawX)),y=Math.max(26,Math.min(H-26,rawY));
 ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);
 ctx.strokeStyle='#bea2ff';ctx.fillStyle='#2a1b60';ctx.lineWidth=3;
 ctx.fillRect(-15,-15,30,30);ctx.strokeRect(-15,-15,30,30);
 ctx.fillStyle='#e1ceff';ctx.fillRect(-5,-5,10,10);
 ctx.restore();
 ctx.textAlign='center';ctx.font='bold 12px system-ui';ctx.fillStyle='#e1ceff';ctx.fillText(mark.minutes+'m RIFT',x,Math.max(17,y-25));
}
function drawCamp(mark,ox,oy,W,H){
 if(!mark)return;
 const x=Math.max(30,Math.min(W-30,mark.x+ox)),y=Math.max(37,Math.min(H-28,mark.y+oy));
 circle(x,y,25,'#372419');circle(x,y,19,'#9f5446');
 ctx.fillStyle='#e67753';ctx.beginPath();ctx.moveTo(x,y-17);ctx.lineTo(x+10,y+12);ctx.lineTo(x-10,y+12);ctx.closePath();ctx.fill();
 ctx.fillStyle='#ffca83';ctx.beginPath();ctx.moveTo(x+3,y-7);ctx.lineTo(x+8,y+8);ctx.lineTo(x-6,y+10);ctx.closePath();ctx.fill();
 ctx.font='bold 12px system-ui';ctx.fillStyle='#ffdfbb';ctx.textAlign='center';ctx.fillText('WORKSHOP',x,y-28);
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
 drawExpedition(snapshot?.roaming,ox,oy,W,H);
 drawRift(snapshot?.rift?.active?null:snapshot?.portal?.marker,ox,oy,W,H);
 drawCamp(snapshot?.rift?.active?null:snapshot?.camp?.mark,ox,oy,W,H);
 for(const shot of snapshot?.projectiles??[])circle(shot.x+ox,shot.y+oy,shot.size,shot.color);
 for(const b of snapshot?.bibles??[])circle(W/2+Math.cos(b.angle)*b.r,H/2+Math.sin(b.angle)*b.r,b.size,b.color);
 circle(W/2,H/2,15,p.dashTimer>0?'#d6faff':'#354967');circle(W/2,H/2,10,'#89f7cd');
 ctx.font='bold 13px system-ui';ctx.textAlign='center';
 for(const n of snapshot?.damageNumbers??[]){ctx.fillStyle=n.color;ctx.fillText(n.val,n.x+ox,n.y+oy);}
 if(mode==='ready'||mode==='paused'||mode==='finished'){
  const bannerY=(snapshot?.roaming||snapshot?.rift)&&mode==='paused'?44:H/2;
  ctx.fillStyle='#0a0c14d9';ctx.fillRect(0,bannerY-31,W,63);ctx.font='bold 25px system-ui';ctx.fillStyle='#f1f5ff';
  ctx.fillText(mode==='ready'?'Survivor Arena':mode==='paused'?'Paused':snapshot.run.won?'You survived!':'Run finished',W/2,bannerY+8);
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
  if(tick.rift)setText(status,tick.rift.result==='won'?'Rift cleared. Main expedition resumed.':'Rift lost. Main expedition resumed.');
  if(result!=='running'){
   snapshot=host.frameView();
   if(result==='choice'){
    transition('choice',snapshot.portal?.awaitingDecision?'Time is paused. Choose whether to enter the rift.':snapshot.camp?.prompt?'Time is paused. Review camp upgrades.':'Level '+snapshot.player.level+'. Choose an upgrade.');
    showChoices(snapshot.offers);
   }else transition('finished',snapshot.run.won?(snapshot.roaming?'Expedition complete.':snapshot.arenaFormat?'Marathon complete.':'You survived five minutes.'):'Run finished. Try another seed or play again.');
  }
 }
 if(mode==='running')snapshot=host.frameView();
 draw();if(mode==='running'&&!raf)raf=requestAnimationFrame(frame);
}
function togglePause(){
 if(mode==='running')transition('paused','Paused. Resume when ready.');
 else if(mode==='paused'){
  if(loading){transfer++;controls(false);reportTape('Verification cancelled because you resumed play.');}
  transition('running','Run resumed.');board.focus();
 }
 draw();
}
start.addEventListener('click',()=>{
 if(!seed.checkValidity()||seed.value===''){seed.focus();setText(status,'Enter a whole seed from 0 to 4294967295.');return;}
 transfer++;
 if(loading)controls(false);
 host=createRecordedArena({seed:Number(seed.value),format:formatField.value});
 clearKeys();lastOffer=null;choicePanel.hidden=true;choices.replaceChildren();prior=0;leftover=0;snapshot=host.frameView();
 transition('running','Run started.');setText(start,'Restart run');board.focus();draw();
});
const readTape=get('read-tape'), verifyTapeButton=get('verify-tape'), cancelTape=get('cancel-tape');
const tapeStatus=get('tape-status'), reportTape=s=>setText(tapeStatus,s);
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),
 b=>b.toString(16).padStart(2,'0')).join('');
const handOff=()=>new Promise(resolve=>setTimeout(resolve,0));
let loading=false;
function controls(active){
 loading=active;verifyTapeButton.disabled=active||!readTape.files?.length;cancelTape.hidden=!active;
}
readTape.addEventListener('change',()=>{transfer++;controls(false);});
cancelTape.addEventListener('click',()=>{transfer++;controls(false);reportTape('Run verification cancelled.');});
get('write-tape').addEventListener('click',async()=>{
 if(!host)return;
 try{
  if(mode==='running')togglePause();
  const raw=await encodeArenaTape(host,sha);
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download='Athena-Survivor-Arena-Tape.json';
  try{a.click();reportTape('Run tape generated. Your browser handles the download.');}finally{setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
 }catch(e){reportTape('Could not export the run: '+e.message);}
});
verifyTapeButton.addEventListener('click',async()=>{
 const f=readTape.files?.[0];if(!f||loading)return;
 const id=++transfer;
 try{
  if(mode==='running')togglePause();
  if(f.size>ARENA_TAPE_MAX_BYTES)throw Error('Tape is larger than the portable limit');
  controls(true);reportTape('Reading the selected run…');
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer());
  const candidate=await decodeArenaTape(raw,{digest:sha,yieldTask:handOff,
   cancelled:()=>id!==transfer,onProgress:(n,total)=>{if(id===transfer)reportTape(`Verifying ${n.toLocaleString()} / ${total.toLocaleString()} input frames…`);}});
  if(id!==transfer)return;
  host=candidate;clearKeys();lastOffer=null;choicePanel.hidden=true;choices.replaceChildren();snapshot=host.frameView();
  const h=host.capture().header;
  seed.value=String(h.seed);formatField.value=h.format;
  if(host.phase()==='choice'){transition('choice',snapshot.portal?.awaitingDecision?'Select your pending rift decision.':snapshot.camp?.prompt?'Select your pending camp decision.':'Select your pending upgrade.');showChoices(snapshot.offers);}
  else if(host.phase()==='finished')transition('finished','Verified completed run.');
  else transition('paused','Verified run loaded, ready to resume.');
  setText(start,'Restart run');draw();reportTape('Verified and loaded the selected run.');
 }catch(e){if(id===transfer)reportTape('Not loaded. '+e.message);}
 finally{if(id===transfer)controls(false);}
});
leaveRift.addEventListener('click',()=>{
 if(!host||!snapshot?.rift?.active)return;
 if(loading){transfer++;controls(false);reportTape('Verification cancelled because you left the rift.');}
 host.choose('rift-abandon');snapshot=host.frameView();
 choices.replaceChildren();choicePanel.hidden=true;lastOffer=null;
 const paused=mode==='paused';
 transition(paused?'paused':'running','Rift left. Main expedition restored.');
 board.focus();draw();
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
// Let the browser expose the picker only after all tape handlers are wired.
readTape.disabled=false;
controls(false);
draw();
start.disabled=false;
