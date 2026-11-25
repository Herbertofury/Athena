// SPDX-License-Identifier: GPL-3.0-or-later
import {open,writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {cards,decodeTape,encodeTape,MAX_TAPE_BYTES,newMatch} from './portable-tape.mjs';
const usage='Usage: node tape-cli.mjs play [seed] | resume TAPE | demo [OUTPUT] | verify TAPE';
function status(match){
 const {state:s,choices:c}=match.view();
 const format=b=>b.map((m,i)=>`${i+1}:${cards[m.id]?.title??m.id} ${m.attack}/${m.hp}`).join('  ')||'—';
 console.log(`Turn ${s.turn} · ${s.phase} · HP ${s.yourHp} (+${s.yourArmor}) / ${s.enemyHp} · Mana ${s.mana}/${s.maxMana}`);
 console.log('Opponent  '+format(s.enemyBoard));
 console.log('You       '+format(s.yourBoard));
 console.log('Hand      '+s.handCards.map((id,i)=>`${i+1}:${cards[id]?.title??id} [${cards[id]?.cost??'?'}]`).join('  '));
 if(s.phase==='mulligan') console.log('Keep: '+s.mulliganOffered.map((id,i)=>`${i+1}:${cards[id]?.title??id}`).join('  '));
 else if(s.phase==='ended')console.log('Result: '+s.matchResult);
 else console.log('Playable slots: '+(c.play.map(i=>i+1).join(', ')||'none')+' · Ready: '+([...new Set([...c.hero,...c.attack.map(x=>x[0])])].map(i=>i+1).join(', ')||'none')+' · Power: '+(c.power?'ready':'unavailable'));
}
function parse(words){
 const [action,...indices]=words;
 const slot=(x)=>{if(!/^[1-9][0-9]?$/.test(x??''))throw Error('Use a numbered card or board slot');return Number(x)-1;};
 if(action==='keep')return {type:'mulligan',kept:indices.map(slot).sort((a,b)=>a-b)};
 if(action==='play'&&indices.length===1)return {type:'play',hand:slot(indices[0])};
 if(action==='hit'&&indices.length===2)return indices[1]==='hero'?{type:'attack-hero',from:slot(indices[0])}:
  {type:'attack',from:slot(indices[0]),to:slot(indices[1])};
 if(['power','end','concede'].includes(action)&&!indices.length)return {type:action};
 throw Error('Commands: keep [slot …], play SLOT, hit SLOT SLOT|hero, power, end, concede, save PATH, quit');
}
async function getTape(file){
 const f=await open(file,'r');
 try{
  if(!(await f.stat()).isFile())throw Error('Expected a regular replay file');
  const bytes=Buffer.alloc(MAX_TAPE_BYTES+1);let offset=0;
  while(offset<bytes.length){
   const {bytesRead:n}=await f.read(bytes,offset,bytes.length-offset,null);
   if(!n)break;
   offset+=n;
  }
  if(offset>MAX_TAPE_BYTES)throw Error('Replay tape exceeds size limit');
  return decodeTape(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,offset)));
 }finally{await f.close();}
}
async function save(match,path){await writeFile(path,encodeTape(match),{flag:'wx',mode:0o600});}
async function play(match){
 console.log('Warden Duel · local practice · help for commands');status(match);
 const prompt=createInterface({input:stdin,output:stdout,terminal:!!stdout.isTTY});
 const iterator=prompt[Symbol.asyncIterator]();
 try{
  for(;;){
   if(stdout.isTTY)stdout.write('warden> ');
   const next=await iterator.next();if(next.done)break;
   const line=next.value.trim();if(!line||line==='help'){console.log('keep [slot …] · play SLOT · hit SLOT SLOT|hero · power · end · concede · save PATH · quit');continue;}
   if(line==='quit')break;
   try{
    if(line.startsWith('save ')){const p=line.slice(5).trim();await save(match,p);console.log('Saved new replay tape.');}
    else{match.apply(parse(line.split(/\s+/)));status(match);}
   }catch(error){console.error('Not applied:',error.message);}
  }
 }finally{prompt.close();}
}
function demo(){
 const match=newMatch(42);match.apply({type:'mulligan',kept:[0,2]});
 for(let i=0;i<256&&match.view().state.phase!=='ended';i++){
  const {choices:c}=match.view();
  const move=c.attack.length?{type:'attack',from:c.attack[0][0],to:c.attack[0][1]}:
   c.hero.length?{type:'attack-hero',from:c.hero[0]}:
   c.play.length?{type:'play',hand:c.play[0]}:
   c.power?{type:'power'}:{type:'end'};
  match.apply(move);
 }
 if(match.view().state.phase!=='ended')throw Error('Demo did not reach a natural end');
 return match;
}
const [mode,arg,...rest]=process.argv.slice(2);
if(rest.length)throw Error(usage);
switch(mode){
 case 'play':
  if(arg!==undefined&&!/^\d{1,10}$/.test(arg))throw Error(usage);
  await play(newMatch(arg===undefined?42:Number(arg)));break;
 case 'resume':
  if(!arg)throw Error(usage);
  await play(await getTape(arg));break;
 case 'verify': {
  if(!arg)throw Error(usage);
  const match=await getTape(arg);
  console.log(JSON.stringify({verified:true,phase:match.view().state.phase,result:match.view().state.matchResult,...match.snapshot()}));
  break;
 }
 case 'demo': {
  const m=demo();
  if(arg)await save(m,arg);
  status(m);console.log(`Verified-demo result: ${m.view().state.matchResult} · ${m.snapshot().commands.length} actions`);
  break;
 }
 default: throw Error(usage);
}
