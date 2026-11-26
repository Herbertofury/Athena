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
const frontierPanel=get('frontier-readout'),frontierEvent=get('frontier-event'),frontierDetails=get('frontier-details');
const cavernPanel=get('cavern-readout'),cavernEvent=get('cavern-event'),cavernDetails=get('cavern-details');
const mirrorNames=Object.freeze(['Amber','Blue','Pearl']),mirrorColors=Object.freeze(['#ffc27f','#75d9ff','#dbb7ff']);
const ferryPanel=get('escort-readout'),ferryEvent=get('escort-event'),ferryDetails=get('escort-details'),ferryHull=get('escort-hull');
const relayPanel=get('relay-readout'),relayEvent=get('relay-event'),relayDetails=get('relay-details');
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
 setText(get('choice-title'),kind==='rift'?'Choose a rift route':kind==='camp'?'Choose a camp upgrade':kind==='region'?'Decide what to do at Skirmish Basin':kind==='relay'?'Choose a Frontier relay task':'Choose an upgrade');
 for(const {id,name,icon,kind} of offers){
  const button=document.createElement('button');button.textContent=icon+' '+name;
  const marker=document.createElement('span');marker.textContent=kind==='rift'?'Rift decision':kind==='camp'?'Camp decision':kind==='region'?'Frontier decision':kind==='relay'?'Relay decision':kind==='weapon'?'New weapon':'Stat upgrade';
  button.append(marker);
  button.addEventListener('click',()=>{
   if(mode!=='choice'||lastOffer!==offers)return;
   if(loading){transfer++;controls(false);reportTape('Verification cancelled because you chose an upgrade.');}
   const result=host.choose(id);snapshot=host.frameView();choices.replaceChildren();choicePanel.hidden=true;lastOffer=null;
   transition(snapshot.run.gameOver?'finished':'running',snapshot.run.gameOver?'Run finished.':kind==='rift'?(snapshot.rift.active?'Rift entered. Your main run is paused.':'Stayed in the main expedition.'):kind==='camp'?(result.camp?.recovery?'Ferryman remedy restored '+Number(result.camp.recovery.toFixed(1))+' HP.':result.camp?.perk?'Camp upgrade built.':'Left the camp.'):kind==='region'?(id==='region-intervene'?'Stay inside the basin to help the Amber Surveyors.':'You detoured around the skirmish.'):kind==='relay'?(id==='relay-leave'?'You left the relay.':'Relay task accepted. Follow the objective.'):'Upgrade equipped: '+name);
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
 const frontier=snapshot.region;
 frontierPanel.hidden=!frontier||Boolean(route?.active);
 if(frontier&&!route?.active){
  const {battle,state,seenSurvey,cache,paid,amber,violet}=frontier;
  const near=Math.hypot(battle.x-player.x,battle.y-player.y)<=250;
  const description=paid?'Skirmish Basin cache collected.':cache?'Skirmish resolved. Collect the cache.':state==='resolved'?(amber<=0?'The Amber Surveyors fell. Nothing was earned.':'The unclaimed skirmish cache expired.'):state==='detoured'?'You left the factions to it.':state==='decision'||state==='intervening'||near?'Amber and Violet factions fighting at Skirmish Basin.':seenSurvey?'Survey Outcrop discovered. No faction battle here.':'Explore in a direction to discover a region.';
  setText(frontierEvent,description);
  setText(frontierDetails,(near&&state!=='detoured'&&state!=='resolved'?'Amber strength '+Math.ceil(amber)+' · Violet strength '+Math.ceil(violet)+' · ':'')+'Frontier crystal banked '+frontier.bankedCrystal);
 }
 const cave=snapshot.cavern;
 const close=cave&&(player.x-cave.mouth.x)**2+(player.y-cave.mouth.y)**2<=380**2;
 cavernPanel.hidden=!cave||Boolean(route?.active)||(!cave.entered&&!close);
 if(!cavernPanel.hidden){
  const {entered,mouth,mirrors,pedestal,order,aligned,vaultOpen,taken,bankedGold,wrongTurns}=cave;
  const target=taken?null:vaultOpen?pedestal:entered?mirrors[order[aligned]]:mouth;
  const label=taken?'Ashglass gold recovered.':vaultOpen?'The vault is open. Walk to the gold pedestal.':entered?'Ashglass Cavern · '+aligned+' / 3 mirrors aligned':'Ashglass Cairns nearby. Follow the basalt arch.';
  setText(cavernEvent,label);
  setText(cavernDetails,taken?'Gold banked: '+bankedGold:(entered?'Cairns: '+order.map(i=>mirrorNames[i]).join(' → ')+' · ':'')+
   (target?'Next: '+direction(target.x-player.x,target.y-player.y):'')+(wrongTurns?' · Realignments '+wrongTurns:''));
 }
 const ferry=snapshot.escort;
 ferryPanel.hidden=!ferry||Boolean(route?.active)||ferry.state==='unseen';
 if(!ferryPanel.hidden){
  const status=ferry.recruited?ferry.companion+' joined this run.':ferry.state==='docked'?'Ferry reached the dock. Walk over to recruit.':ferry.state==='lost'?'The ferry did not survive the crossing.':ferry.state==='waiting'?'The ferry is waiting. Approach the gangway to launch.':'Stay alongside the moving ferry.';
  setText(ferryEvent,status);
  if(ferryHull.value!==Math.ceil(ferry.hull))ferryHull.value=Math.ceil(ferry.hull);
  const target=ferry.state==='docked'?ferry.dock:ferry.position;
  setText(ferryDetails,ferry.recruited?'Camp remedies left: '+ferry.remedies:ferry.state==='lost'?'No companion or rewards were earned.':'Hull '+Math.ceil(ferry.hull)+'% · '+direction(target.x-player.x,target.y-player.y));
 }
 const relay=snapshot.relay;
 relayPanel.hidden=!relay||Boolean(route?.active);
 if(!relayPanel.hidden){
  const {sequence,completed,route:task,post,next,progress,checked,bank}=relay;
  const point=next??post, reach=Math.round(Math.hypot(point.x-player.x,point.y-player.y));
  const goal=task==='decision'?'Relay '+sequence+' reached. Pick a task.':task==='supply'||task==='watch'?point.name:'Find relay outpost '+sequence;
  setText(relayEvent,goal);
  const hold=task==='watch'&&checked<2&&progress>0?' · hold '+Math.floor(progress/2.2*100)+'%':'';
  setText(relayDetails,direction(point.x-player.x,point.y-player.y)+' · '+reach+' m'+hold+' · Relays done '+completed+' · Gold '+bank.gold+' · Crystal '+bank.crystal);
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
function drawFrontier(region,player,ox,oy){
 if(!region)return;
 const {battle,survey,state,approach,conflict,cache,amber,violet}=region;
 if(Math.hypot(player.x-survey.x,player.y-survey.y)<280){
  const x=survey.x+ox,y=survey.y+oy;
  circle(x,y,84,'#192c34');
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3;
   circle(x+Math.cos(a)*40,y+Math.sin(a)*39,9,'#496f75');
  }
  ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#c8f8ee';ctx.fillText('Survey Outcrop',x,y-55);
 }
 if(Math.hypot(player.x-battle.x,player.y-battle.y)<280){
  const x=battle.x+ox,y=battle.y+oy;
  circle(x,y,82,'#34252a');ctx.strokeStyle='#4d343b';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(x,y,82,0,Math.PI*2);ctx.stroke();
  if(!['resolved','detoured'].includes(state)){
   const pulse=approach+conflict, wobble=Math.sin(pulse*3)*9;
   for(const [side,color,strength] of [[-1,'#ffb276',amber],[1,'#b394ff',violet]]){
    const fx=x+side*(39+wobble),fy=y+side*5;
    circle(fx,fy,13,color);circle(fx,fy,6,'#201d2e');
    circle(fx+side*13,fy+17,7,color);circle(fx+side*14,fy-17,7,color);
    ctx.fillStyle='#241b29';ctx.fillRect(fx-18,fy-29,36,4);
    ctx.fillStyle=color;ctx.fillRect(fx-18,fy-29,36*strength/55,4);
    ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(fx,fy-7);ctx.lineTo(x+side*Math.cos(pulse*7)*15,y);ctx.stroke();
   }
  }
  if(cache){circle(x,y,18,'#29354a');circle(x,y,10,'#91efcd');}
  ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#f6dfe6';ctx.fillText('Skirmish Basin',x,y-70);
 }
}
function drawCavern(cave,p,ox,oy){
 if(!cave||(p.x-cave.mouth.x)**2+(p.y-cave.mouth.y)**2>440**2)return;
 const x=cave.mouth.x+ox,y=cave.mouth.y+oy;
 const dir=Math.sign(cave.pedestal.x-cave.mouth.x);
 // A distinctive basalt gallery and a sequence of three surface cairns.
 ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
 ctx.fillStyle='#212c3e';ctx.beginPath();ctx.moveTo(-88,-23);ctx.lineTo(-26,-69);ctx.lineTo(117,-108);
 ctx.lineTo(258,-44);ctx.lineTo(272,27);ctx.lineTo(117,102);ctx.lineTo(-62,57);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#4b6181';ctx.lineWidth=2;ctx.stroke();
 circle(8,0,36,'#425a77');circle(9,0,25,'#141725');
 for(const [j,index] of cave.order.entries())circle(-36+j*15,-32,5,mirrorColors[index]);
 ctx.restore();
 ctx.textAlign='center';ctx.font='bold 13px system-ui';ctx.fillStyle='#bce1f6';ctx.fillText('Ashglass Cavern',x,y+51);
 if(!cave.entered)return;
 for(const [i,m] of cave.mirrors.entries()){
  const mx=m.x+ox,my=m.y+oy,done=cave.order.indexOf(i)<cave.aligned;
  ctx.save();ctx.translate(mx,my);ctx.rotate(Math.PI/4);ctx.fillStyle='#142235';ctx.fillRect(-14,-14,28,28);
  ctx.lineWidth=done?4:2;ctx.strokeStyle=mirrorColors[i];ctx.strokeRect(-13,-13,26,26);
  ctx.fillStyle=mirrorColors[i];ctx.fillRect(-5,-9,10,18);ctx.restore();
  ctx.fillStyle=mirrorColors[i];ctx.fillText(mirrorNames[i],mx,my-23);
 }
 const px=cave.pedestal.x+ox,py=cave.pedestal.y+oy;
 circle(px,py,23,'#2e3349');circle(px,py,15,cave.vaultOpen&&!cave.taken?'#ffd66d':'#566075');
}
function drawFloodplain(ferry,p,ox,oy){
 if(!ferry)return;
 const {start,bend,dock,position,state,hull,recruited}=ferry;
 if(Math.min(Math.hypot(p.x-start.x,p.y-start.y),Math.hypot(p.x-dock.x,p.y-dock.y))>440)return;
 ctx.lineCap='round';ctx.lineJoin='round';
 for(const [width,color] of [[115,'#213d46'],[79,'#24596a'],[46,'#316c83']]){
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(start.x+ox,start.y+oy);
  ctx.lineTo(bend.x+ox,bend.y+oy);ctx.lineTo(dock.x+ox,dock.y+oy);ctx.stroke();
 }
 ctx.lineCap='butt';ctx.lineJoin='miter';
 for(const [label,node] of [['Skiff launch',start],['Far dock',dock]]){
  const x=node.x+ox,y=node.y+oy;
  for(let n=0;n<5;n++){ctx.fillStyle=n%2?'#855742':'#aa7352';ctx.fillRect(x-32,y-18+n*8,64,5);}
  ctx.textAlign='center';ctx.font='bold 13px system-ui';ctx.fillStyle='#d8e9ed';ctx.fillText(label,x,y-31);
 }
 if(recruited)return;
 const x=position.x+ox,y=position.y+oy;
 ctx.fillStyle=state==='lost'?'#694c54':'#edb975';ctx.beginPath();ctx.moveTo(x-14,y-9);ctx.lineTo(x+13,y-9);ctx.lineTo(x+21,y);ctx.lineTo(x+11,y+10);ctx.lineTo(x-14,y+10);ctx.lineTo(x-21,y);ctx.closePath();ctx.fill();
 circle(x,y,5,'#28253f');
 ctx.fillStyle='#172939';ctx.fillRect(x-21,y+15,42,4);
 ctx.fillStyle='#7af0bf';ctx.fillRect(x-21,y+15,42*hull/100,4);
}
function drawRelay(relay,p,ox,oy){
 if(!relay)return;
 const x=relay.post.x+ox,y=relay.post.y+oy;
 if(Math.hypot(relay.post.x-p.x,relay.post.y-p.y)<=440){
  circle(x,y,61,'#33213a');circle(x,y,49,'#512e49');
  ctx.strokeStyle='#ba8ac2';ctx.lineWidth=2;ctx.strokeRect(x-37,y-24,74,48);
  ctx.fillStyle='#f2c099';ctx.fillRect(x-18,y-18,36,36);
  ctx.fillStyle='#352643';ctx.fillRect(x-11,y-11,22,22);
  ctx.textAlign='center';ctx.font='bold 13px system-ui';ctx.fillStyle='#edcdeb';ctx.fillText('Relay '+relay.sequence,x,y-53);
 }
 const {next}=relay;
 if(next.name!==relay.post.name&&Math.hypot(next.x-p.x,next.y-p.y)<=425){
  const mx=next.x+ox,my=next.y+oy,hue=relay.route==='watch'?'#92c7ff':'#ffda9e';
  circle(mx,my,23,'#322c46');ctx.strokeStyle=hue;ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(mx,my,26,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=hue;ctx.fillRect(mx-8,my-7,16,14);
  ctx.textAlign='center';ctx.font='bold 13px system-ui';ctx.fillText(next.name,mx,my-33);
 }
}
function draw(){
 const W=board.width,H=board.height,p=snapshot?.player??{x:0,y:0}, ox=W/2-p.x, oy=H/2-p.y;
 ctx.fillStyle='#0b0d15';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#1d2637';ctx.lineWidth=1;ctx.beginPath();
 for(let x=((ox%40)+40)%40;x<W;x+=40){ctx.moveTo(x,0);ctx.lineTo(x,H);}
 for(let y=((oy%40)+40)%40;y<H;y+=40){ctx.moveTo(0,y);ctx.lineTo(W,y);}
 ctx.stroke();
 drawFrontier(snapshot?.rift?.active?null:snapshot?.region,p,ox,oy);
 if(!snapshot?.rift?.active){drawCavern(snapshot?.cavern,p,ox,oy);drawFloodplain(snapshot?.escort,p,ox,oy);drawRelay(snapshot?.relay,p,ox,oy);}
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
  if(tick.region?.amount)setText(status,'Frontier cache collected: '+tick.region.amount+' crystal.');
  if(tick.rift)setText(status,tick.rift.result==='won'?'Rift cleared. Main expedition resumed.':'Rift lost. Main expedition resumed.');
  if(result!=='running'){
   snapshot=host.frameView();
   if(result==='choice'){
    transition('choice',snapshot.portal?.awaitingDecision?'Time is paused. Choose whether to enter the rift.':snapshot.camp?.prompt?'Time is paused. Review camp upgrades.':snapshot.region?.state==='decision'?'Time is paused. Choose a route through the skirmish.':snapshot.relay?.route==='decision'?'Time is paused. Choose a relay task.':'Level '+snapshot.player.level+'. Choose an upgrade.');
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
  if(host.phase()==='choice'){transition('choice',snapshot.portal?.awaitingDecision?'Select your pending rift decision.':snapshot.camp?.prompt?'Select your pending camp decision.':snapshot.region?.state==='decision'?'Select your pending frontier decision.':snapshot.relay?.route==='decision'?'Select your pending relay task.':'Select your pending upgrade.');showChoices(snapshot.offers);}
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
draw();
setText(status,'Ready. Choose a seed or start with 42.');
start.disabled=false;
