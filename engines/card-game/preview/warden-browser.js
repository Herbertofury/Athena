// SPDX-License-Identifier: GPL-3.0-or-later
const q=id=>document.getElementById(id);
const text=(id,s)=>{q(id).textContent=s;};
let match=newMatch(42),revision=0,selected=null,kept=new Set(),op=0;
const choose=(label,fn)=>Object.assign(document.createElement('button'),{type:'button',textContent:label,onclick:fn});
const tips="Select a ready ally to target an enemy.";
const note=s=>text('tape-status',s);
const update=()=>{
 const {state:s,choices:c}=match.view();
 text('turn',String(s.turn));text('your-hp',`${s.yourHp} HP · ${s.yourArmor} armor`);
 text('their-hp',`${Math.max(0,s.enemyHp)} HP · ${s.enemyArmor} armor`);text('mana',`${s.mana} / ${s.maxMana}`);
 q('mulligan').hidden=s.phase!=='mulligan';q('match').hidden=s.phase==='mulligan';
 const label=s.phase==='ended'?({win:'Victory.',loss:'Defeat.',draw:'Draw.'}[s.matchResult]??'Match complete.'):
   s.phase==='mulligan'?'Select your starting cards.':selected===null?tips:'Select an eligible opposing target.';
 text('status',label);
 if(s.phase==='mulligan'){
  const b=s.mulliganOffered.map((id,i)=>card(id,()=>{if(kept.has(i))kept.delete(i);else kept.add(i);update();q('keep-cards').children[i].focus();},
   {pressed:kept.has(i)}));q('keep-cards').replaceChildren(...b);return;
 }
 const permits=(i)=>c.hero.includes(i)||c.attack.some(x=>x[0]===i);
 q('field').replaceChildren(...s.yourBoard.map((m,i)=>card(m.id,()=>{selected=selected===i?null:i;update();q('field').children[i]?.focus();},
  {stats:`${m.attack} attack · ${m.hp} HP`,disabled:!permits(i),pressed:selected===i})));
 q('enemy').replaceChildren(...s.enemyBoard.map((m,i)=>card(m.id,()=>apply({type:'attack',from:selected,to:i}),
  {stats:`${m.attack} attack · ${m.hp} HP`,disabled:!c.attack.some(x=>x[0]===selected&&x[1]===i),enemy:true})));
 q('hand').replaceChildren(...s.handCards.map((id,i)=>card(id,()=>apply({type:'play',hand:i}),{disabled:!c.play.includes(i)})));
 q('power').disabled=!c.power;q('end').disabled=!c.end;q('concede').disabled=s.phase==='ended';
 q('enemy-hero').disabled=!c.hero.includes(selected);
};
function card(id,fn,{pressed,stats,disabled=false,enemy=false}={}){
 const c=cards[id], button=choose('',fn),name=document.createElement('b'),meta=document.createElement('small');
 button.className=enemy?'card attack':'card';button.disabled=disabled;
 name.textContent=c?.title??'Token';meta.textContent=stats??`${c.cost} mana · ${c.attack} attack · ${c.health} HP`;
 button.append(name,meta);
 if(c?.keywords?.length){const k=document.createElement('small');k.textContent=c.keywords.join(' · ');button.append(k);}
 if(pressed!==undefined)button.setAttribute('aria-pressed',String(pressed));
 return button;
}
function apply(command){
 try{match.apply(command);revision++;selected=null;update();
  if(!q('end').disabled)q('end').focus();else q('status').focus();
 }catch(e){text('status',e.message);}
}
q('begin').addEventListener('click',()=>apply({type:'mulligan',kept:[...kept].sort((a,b)=>a-b)}));
q('enemy-hero').addEventListener('click',()=>apply({type:'attack-hero',from:selected}));
for(const id of ['power','end','concede'])q(id).addEventListener('click',()=>apply({type:id}));
q('restart').addEventListener('click',()=>{
 try{
  if(!q('seed').value||!q('seed').checkValidity())throw Error('Enter a whole number from 0 to 4294967295.');
  match=newMatch(Number(q('seed').value));revision++;selected=null;kept=new Set();update();q('keep-cards').firstElementChild?.focus();
 }catch(e){note(e.message);}
});
const enc=new TextEncoder();
const hash=async(s)=>{
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(s));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
};
const tape=async(m)=>{
 const {header,transcript,final}=m.receipt();
 const [transcript_sha256,final_sha256]=await Promise.all([hash(transcript),hash(final)]);
 return JSON.stringify({...header,transcript_sha256,final_sha256})+'\n';
};
q('file').addEventListener('change',()=>{++op;q('load').disabled=!q('file').files.length;});
q('load').addEventListener('click',async()=>{
 const f=q('file').files[0];if(!f)return;
 const token=++op,start=revision;
 try{
  if(f.size>MAX_TAPE_BYTES)throw Error('Replay tape is too large.');
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer());
  const candidate=replayTape(JSON.parse(raw));
  if(await tape(candidate)!==raw)throw Error('Replay digest or canonical format did not match.');
  if(op!==token||revision!==start)return;
  match=candidate;revision++;selected=null;kept=new Set();q('seed').value=String(match.receipt().header.seed);update();
  note('Verified and loaded the tape.');q('load').focus();
 }catch(e){if(op===token&&revision===start)note('Not loaded. '+e.message);}
});
q('save').addEventListener('click',async()=>{
 try{
  const raw=await tape(match);
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download='Warden-Duel-Tape.json';
  try{a.click();note('Replay generated. Your browser handles the download.');}finally{setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
 }catch{note('Replay export is unavailable. Use the Node CLI on this browser.');}
});
update();
