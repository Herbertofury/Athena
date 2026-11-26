// SPDX-License-Identifier: GPL-3.0-or-later
const q=id=>document.getElementById(id);
let game=newClockworkEncounter(),epoch=0;
function refresh(){
 const {state,choices,last}=game.view();
 q('health').textContent=state.health;q('shield').textContent=state.shield;
 q('enemy').textContent=state.sentinel;q('timer').textContent=state.timer;
 q('status').textContent=state.outcome?({win:'Sentinel down.',lose:'Your frame broke.',limit:'Replay length limit reached.'}[state.outcome]):
 last.some(e=>e.type==='SENTINEL_STRIKE')?'The Sentinel struck.':'Choose an action. The timer only moves when you act.';
 q('events').replaceChildren(...last.map(e=>Object.assign(document.createElement('li'),{textContent:({
   NEW_HAND:'New hand. Unspent charge is lost.',COIL_PRIMED:'Coil primed.',BRACED:'Brace raised.',DISCHARGE:`Arc dealt ${e.damage}.`,
   TIMER_SPENT:`Spent ${e.ticks} time.`,SENTINEL_STRIKE:`Sentinel dealt ${e.damage}; blocked ${e.blocked}.`,SENTINEL_DOWN:'Sentinel down.'
 })[e.type]})));
 for(const btn of q('actions').querySelectorAll('button')){
  const action=btn.dataset.move,p=game.preview(action);
  btn.disabled=!choices.includes(action);
  const label=action==='end'?'Next turn':clockworkCards[action].label;
  btn.textContent=p?`${label} · ${p.ticks} time${p.damage?` · ${p.damage} damage`:''}${p.intercept?` · STRIKE: ${Math.max(0,6-p.shield)} incoming`:''}`:label;
 }
}
const advance=()=>{epoch++;q('tape-status').textContent='';refresh();};
q('actions').addEventListener('click',e=>{const action=e.target.dataset.move;if(action&&!e.target.disabled){game.apply(action);advance();}});
q('restart').addEventListener('click',()=>{game=newClockworkEncounter();advance();});
q('tape').addEventListener('input',()=>{epoch++;q('tape-status').textContent='';});
q('export').addEventListener('click',async()=>{
 const rev=++epoch;
 try{const tape=await game.tape();if(rev!==epoch)return;q('tape').value=JSON.stringify(tape,null,2);q('tape-status').textContent='Verified replay text is ready to copy.';}
 catch{if(rev===epoch)q('tape-status').textContent='Could not make a replay tape.';}
});
q('import').addEventListener('click',async()=>{
 const rev=++epoch;
 try{const opened=await openClockworkTape(q('tape').value);if(rev!==epoch)return;game=opened;refresh();q('tape-status').textContent='Verified replay loaded.';}
 catch{if(rev===epoch)q('tape-status').textContent='Rejected replay. Current encounter unchanged.';}
});
refresh();
