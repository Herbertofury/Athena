import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rename, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildReplay } from '../build-replay.mjs';

async function withBundle(t,body) {
  const temp=await mkdtemp(resolve(tmpdir(),'athena-engine-replay-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const target=resolve(temp,'bundle');
  await buildReplay(target);
  const moved=resolve(temp,'movable bundle');await rename(target,moved);
  const mod=await import(pathToFileURL(resolve(moved,'engine.mjs')));
  const entropy=await import(pathToFileURL(resolve(moved,'replay-entropy.mjs')));
  const state=await import(pathToFileURL(resolve(moved,'match-state.mjs')));
  await body({mod,entropy,state,temp,moved});
}

const names=['copper','shield','charge','cry','quiet','wind','stone','leaf','ash','tide','light','coal'];
const cards=Object.fromEntries(names.map((id,i)=>[id,Object.freeze({id,title:id,type:'minion',cost:0,
  attack:1+i%2,health:2+i%3,keywords:i===1?['shield']:i===2?['charge']:i===3?['battlecry']:[]})]));
const hero={id:'player',hpMax:30,powerKey:'summon'};
const enemy={id:'enemy',hpMax:30,powerKey:'damage'};

function replay({mod,entropy,state},seed){
  const random=entropy.createReplayEntropy(seed,20_000);
  const engine=mod.createEngine(id=>cards[id],id=>id==='player'?hero:enemy,{entropy:random,
    getHeroPowerAction:h=>h.powerKey==='summon'?{type:'HERO_POWER_SUMMON',attack:1,health:1}:{type:'HERO_POWER_DAMAGE',damage:1}});
  let world=state.blankMatchState();const frames=[];
  const take=(label,action)=>{world=action(world);frames.push([label,structuredClone(world),structuredClone(engine.drainEvents())]);};
  take('start',s=>engine.startMatch(s,{yourHeroId:'player',enemyHeroId:'enemy',deckCards:names,enemyDeckCards:names}));
  take('mulligan',s=>engine.completeMulligan(s,[0,2]));
  take('play',s=>engine.playCard(s,0));
  take('enemy turn',s=>engine.endTurn(s));
  take('hero power',s=>engine.useHeroPower(s,hero));
  take('offer',s=>engine.offerDiscover(s));
  take('pick',s=>engine.pickDiscover(s,1));
  take('concede',s=>engine.concede(s));
  return frames;
}

test('actual rules replay across a relocated bundle with no implicit browser state or entropy',async t=>withBundle(t, async api=>{
  const random=Math.random,now=Date.now;
  Math.random=Date.now=()=>{throw Error('Unexpected process-global entropy')};
  let a,b,c;
  try{a=replay(api,123456);b=replay(api,123456);c=replay(api,7654321);}
  finally{Math.random=random;Date.now=now;}
  assert.deepEqual(a,b);
  assert.notDeepEqual(a[0][1].deckCards,c[0][1].deckCards);
  assert.equal(a[0][1].deckCards.length+a[0][1].handCards.length,names.length);
  assert.equal(a[1][1].phase,'playing');
  assert.equal(a[2][1].yourBoard.length,1);
  assert.ok(a[2][2].some(e=>e.type==='MINION_SUMMONED'));
  assert.ok(a[4][2].some(e=>e.type==='HERO_POWER_USED'));
  const picks=a[5][1].discoverOffered;
  assert.equal(picks.length,3);assert.equal(new Set(picks).size,3);
  assert.ok(a[6][1].handCards.includes(picks[1]));
  assert.equal(a[7][1].phase,'ended');assert.equal(a[7][1].matchResult,'loss');
  const clock=a.flatMap(f=>f[2]).map(e=>e.timestamp);
  assert.ok(clock.length>15);assert.ok(clock.every((x,i)=>!i||x>clock[i-1]));
}));

test('portable output refuses existing paths and invalid entropy parameters',async t=>withBundle(t,async ({mod,entropy,moved})=>{
  await assert.rejects(buildReplay(moved),error=>error.code==='EEXIST');
  const src=await readFile(resolve(moved,'engine.mjs'),'utf8');
  assert.doesNotMatch(src,/Math\.random\(|Date\.now\(|localStorage\s*\./);
  assert.throws(()=>mod.createEngine(()=>null,()=>null),/Explicit/);
  for (const seed of [NaN,-1,2**32,1.5]) assert.throws(()=>entropy.createReplayEntropy(seed));
  const e=entropy.createReplayEntropy(0,21);
  assert.equal(e.version,'mulberry32-clock-v1');
  assert.equal(e.now(),21);assert.equal(e.now(),22);
  assert.equal(e.next(),0.26642920868471265);
}));

test('real combat can end the match without conceding',async t=>withBundle(t,async ({mod,entropy,state})=>{
  const player={...hero,hpMax:30};
  const opponent={...enemy,hpMax:1};
  const e=mod.createEngine(id=>cards[id],id=>id==='player'?player:opponent,{
    entropy:entropy.createReplayEntropy(987,2500),getHeroPowerAction:()=>null
  });
  let s=e.startMatch(state.blankMatchState(),{yourHeroId:'player',enemyHeroId:'enemy',
    deckCards:Array(12).fill('charge'),enemyDeckCards:Array(12).fill('copper')});
  s=e.skipMulligan(s);
  s=e.playCard(s,0);
  s=e.attackHero(s,0);
  assert.equal(s.phase,'ended');
  assert.equal(s.matchResult,'win');
  assert.ok(s.enemyHp<=0);
  const events=e.drainEvents(),damage=events.findIndex(v=>v.type==='HERO_DAMAGED'&&v.who==='enemy');
  const ended=events.findIndex(v=>v.type==='GAME_OVER'&&v.result==='win');
  assert.ok(damage>=0&&damage<ended);
}));
