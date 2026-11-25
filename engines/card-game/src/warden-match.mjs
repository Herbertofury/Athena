// SPDX-License-Identifier: GPL-3.0-or-later
import {createEngine} from './engine.mjs';
import {blankMatchState} from './match-state.mjs';
import {createReplayEntropy} from './replay-entropy.mjs';
import {CARDS,HEROES,FIXTURE,decks,powerFor} from './replay-fixture.mjs';
export const TAPE_VERSION='athena.card-foundry.tape.v1';
export const RULES='gamesync-bce6c1bcb31c63d31c64185fef143a53d9c4d35f/replay-v1';
export const MAX_ACTIONS=512,MAX_TAPE_BYTES=96*1024;
const START_TICKS=2_000_000;
const pos=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;
export const cards=CARDS;
export const heroes=HEROES;

function exact(object,keys){
 if(object===null||typeof object!=='object'||Object.getPrototypeOf(object)!==Object.prototype||
  Object.keys(object).length!==keys.length||keys.some(k=>!Object.hasOwn(object,k)))throw Error('Unexpected record shape');
}
function command(row){
 if(row?.type==='mulligan'){
  exact(row,['type','kept']);
  if(!Array.isArray(row.kept)||row.kept.length>4||row.kept.some((v,i)=>!pos(v,3)||(i>0&&row.kept[i-1]>=v)))throw Error('Mulligan indices must be unique and sorted');
  return {type:row.type,kept:[...row.kept]};
 }
 const props={play:['hand'],attack:['from','to'],'attack-hero':['from'],power:[],end:[],concede:[]};
 if(!Object.hasOwn(props,row?.type))throw Error('Unknown command');
 exact(row,['type',...props[row.type]]);
 const copy={type:row.type};
 for(const p of props[row.type]){
  if(!pos(row[p],p==='hand'?9:6))throw Error('Invalid board or hand slot');
  copy[p]=row[p];
 }
 return copy;
}

export function newMatch(seed){
 if(!pos(seed,2**32-1))throw Error('Expected a uint32 seed');
 const engine=createEngine(id=>CARDS[id],id=>HEROES[id],{
  entropy:createReplayEntropy(seed,START_TICKS),getHeroPowerAction:powerFor
 });
 let state=engine.startMatch(blankMatchState(),{yourHeroId:'green-warden',enemyHeroId:'neon-warden',
  deckCards:decks.player,enemyDeckCards:decks.enemy,mode:'practice'});
 const frames=[engine.drainEvents()], commands=[];
 const player=HEROES['green-warden'];
 function actions(){
  if(state.phase!=='playing')return {play:[],attack:[],hero:[],power:false,end:false};
  const play=state.yourBoard.length<7?state.handCards.flatMap((id,i)=>CARDS[id]?.cost<=state.mana?[i]:[]):[];
  const taunt=engine.hasTaunt(state.enemyBoard), ready=[];
  for(const [i,unit] of state.yourBoard.entries())if(engine.canMinionAttack(unit,state.turn))ready.push(i);
  const attack=ready.flatMap(from=>state.enemyBoard.flatMap((target,to)=>
   !target.stealth&&!target.dormant&&(!taunt||CARDS[target.id]?.keywords.includes('taunt'))?[[from,to]]:[]));
  return {play,attack,hero:taunt?[]:ready,power:!state.yourPowerUsedThisTurn&&state.mana>=2,end:true};
 }
 function apply(row){
  const c=command(row);
  if(commands.length===MAX_ACTIONS)throw Error('Turn tape has reached its action limit');
  if(state.phase==='ended')throw Error('No command after the match ends');
  const choices=actions();
  switch(c.type){
   case 'mulligan':
    if(state.phase!=='mulligan'||c.kept.some(i=>i>=state.mulliganOffered.length))throw Error('Invalid mulligan for this match');
    state=engine.completeMulligan(state,c.kept);break;
   case 'play':
    if(!choices.play.includes(c.hand))throw Error('Cannot play this card now');
    state=engine.playCard(state,c.hand);break;
   case 'attack':
    if(!choices.attack.some(a=>a[0]===c.from&&a[1]===c.to))throw Error('Cannot attack this target now');
    state=engine.attackMinion(state,c.from,c.to);break;
   case 'attack-hero':
    if(!choices.hero.includes(c.from))throw Error('Cannot attack the hero now');
    state=engine.attackHero(state,c.from);break;
   case 'power':
    if(!choices.power)throw Error('Hero power unavailable');
    state=engine.useHeroPower(state,player);break;
   case 'end':
    if(!choices.end)throw Error('Cannot end the turn during the mulligan');
    state=engine.endTurn(state);break;
   case 'concede':
    if(state.phase!=='playing'&&state.phase!=='mulligan')throw Error('Cannot concede this state');
    state=engine.concede(state);break;
  }
  commands.push(c);frames.push(engine.drainEvents());return view();
 }
 function view(){
  const v=structuredClone(state);
  // The presentation does not reveal deck order or current opposing hand.
  // The fixed-content recording is publicly reproducible, not a secrecy boundary.
  delete v.deckCards;delete v.enemyDeckCards;delete v.enemyHandCards;
  return {state:v,choices:actions(),events:structuredClone(frames.at(-1).map(e=>{
   if(e.type==='CARD_DRAWN'&&e.who==='enemy'){const {cardId:_id,...rest}=e;return rest;}
   return e;
  }))};
 }
 function receipt(){
  return {
   header:{schema:TAPE_VERSION,rules:RULES,fixture:FIXTURE,seed,commands:structuredClone(commands)},
   transcript:JSON.stringify(frames),final:JSON.stringify(state),
  };
 }
 return Object.freeze({apply,view,receipt});
}

export function replayTape(tape){
 exact(tape,['schema','rules','fixture','seed','commands','transcript_sha256','final_sha256']);
 const signature=/^[a-f0-9]{64}$/;
 if(tape.schema!==TAPE_VERSION||tape.rules!==RULES||tape.fixture!==FIXTURE||
  typeof tape.transcript_sha256!=='string'||typeof tape.final_sha256!=='string'||
  !signature.test(tape.transcript_sha256)||!signature.test(tape.final_sha256)||
  !Array.isArray(tape.commands)||tape.commands.length>MAX_ACTIONS)throw Error('Incompatible or invalid replay tape');
 const match=newMatch(tape.seed);
 for(const c of tape.commands)match.apply(c);
 return match;
}
