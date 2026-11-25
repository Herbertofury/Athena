// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {createLegacyCombat,createLegacyPlayer} from '../src/gamesync-combat-formulas.mjs';
import {createLegacySurvivorRun} from '../src/legacy-survivor-run.mjs';
const raw=(path,pin)=>{
 const bytes=readFileSync(new URL(path,import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),pin);
 return bytes.toString('utf8');
};
const coreSource=raw('../../shared-game-runtime/upstream/gamesync/game-core.js','f6c4f182ec271a1aefe2decea72cd9da0d120cfa8e649126c04e55d15a4b038e');
const gameSource=raw('../upstream/gamesync/game-survivors.js','1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7');
function rng(seed){
 let state=seed,count=0;
 return {next:()=>{count++;state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32;},count:()=>count};
}
function reference(random,capture){
 const window={};const env={window,Math:Object.create(Math,{random:{value:random}}),console};
 const input={keys:{},mouse:{},clearClicked(){this.mouse.clicked=false;}};
 runInNewContext(coreSource,env);
 const core=window.__gsMascotGameCore;
 Object.assign(core,{
  createCanvas:()=>({}),createInput:()=>input,createButton:()=>({contains:()=>false}),createGameLoop:()=>({}),
  Audio:{play:id=>capture.push({type:'audio',id})}
 });
 const a=gameSource.indexOf('      // Fire weapons'),b=gameSource.indexOf('      // Update enemies',a);
 assert.ok(a>=0&&b>a);
 const target='      start() { loop.start(); },';
 assert.equal(gameSource.split(target).length,2);
 // Instrument the returned instance only; execute the actual untouched update loop.
 runInNewContext(gameSource.replace(target,`
      probe: {
       update,
       armory(ids){player.weapons=ids.map(id=>({...WEAPONS[id],timer:0}));return player.weapons;},
       fireOnly(dt,targets) {
        enemies=targets;
${gameSource.slice(a,b)}
        particles.update(dt);
       },
       snapshot:()=>({
        gameTime,spawnTimer,
        offers:levelUpChoices?.map(({id,name,icon,weapon})=>({id,name,icon,kind:weapon?'weapon':'stat'}))??null,
        player,run:{kills,gameOver,won},enemies,gems,
        projectiles:projectiles.map(({hit,...p})=>({...p,hit:[...hit].map(e=>enemies.indexOf(e))})),
        bibles,damageNumbers,particles:particles.count
       })
      },
`+target),env);
 const probe=window.__gsMascotGameSurvivors.create(null).probe;
 return {step(dt,keys){input.keys={...keys};probe.update(dt);},
  choose(index){input.mouse={x:240,y:145+42*index,clicked:true};probe.update(0);input.clearClicked();},
  snapshot:probe.snapshot,armory:probe.armory,fireOnly:probe.fireOnly};
}
const json=(v)=>JSON.parse(JSON.stringify(v));
const hosts=seed=>{
 const a=rng(seed),b=rng(seed),audio=[];
 const engine=createLegacySurvivorRun({random:a.next}),original=reference(b.next,audio);
 function equal(){
  const {contract,...data}=engine.snapshot();
  assert.equal(contract,'athena.roguelite.gamesync-live.v1');
  assert.deepEqual(json(data),json(original.snapshot()));
  assert.equal(a.count(),b.count(),'Original and composed host must consume identical entropy');
  return data;
 }
 function step(dt,keys){
  const result=engine.step({dt,keys});original.step(dt,keys);
  assert.deepEqual(result.audio,audio.splice(0));return {result,...equal()};
 }
 function choose(offers,index){
  const result=engine.choose(offers[index].id);original.choose(index);
  assert.deepEqual(result.audio,audio.splice(0));return equal();
 }
 return {engine,equal,step,choose};
};
test('original game update and composed engine have identical attacks, damage, drops, choices and entropy',()=>{
 let runs=0,shots=0,damage=0,kills=0,picks=0,win=0,dashes=0;
 for(const seed of [177,2026,42,8088]){
  const h=hosts(seed); let end;
  for(let i=0;i<6200;i++){
   const keys={KeyD:i%385<42,KeyA:i%385>=320&&i%385<350,KeyW:i%505<11,ShiftLeft:i%139===0};
   const state=h.step(.05,keys);end=state;shots+=Number(state.projectiles.length>0);
   damage+=Number(state.damageNumbers.length>0);
   dashes+=state.result.audio.filter(x=>x.id==='jump').length;
   if(state.offers){
    const pick=state.offers.findIndex(o=>o.kind==='weapon');
    h.choose(state.offers,pick<0?0:pick);picks++;
   }
   if(state.run.gameOver&&!state.offers)break;
  }
  assert.ok(end.run.gameOver);kills+=end.run.kills;runs++;win+=Number(end.run.won);
 }
 assert.equal(runs,4);
 console.log('Four full original-versus-engine runs:',{shots,damage,kills,picks,win,dashes});
 assert.ok(shots>100&&kills>10&&damage>100&&picks>=4&&dashes>5,JSON.stringify({shots,kills,damage,picks,dashes,win}));
});
test('invalid command or unauthorized choice does not mutate engine; five-minute terminal ignores later input',()=>{
 const h=hosts(12);
 assert.throws(()=>h.engine.step({dt:-1}),RangeError);
 assert.throws(()=>h.engine.choose('hp'),TypeError);
 h.equal();assert.equal(h.step(300,{}).result.status,'finished');
 assert.equal(h.step(1,{KeyD:true}).gameTime,300);
 assert.equal(h.step(0,{}).player.x,0);
});

test('each of the six source weapons damages actual targets; pierce/orbit follow original bookkeeping',()=>{
 for(const id of ['orb','whip','bible','lightning','fire','knife']){
  const left=rng(300),right=rng(300);
  const old=reference(right.next,[]), player=createLegacyPlayer();
  player.weapons=json(old.armory([id]));
  const combat=createLegacyCombat(left.next);
  const make=()=>[{x:15,y:0},{x:30,y:0},{x:55,y:0}].map(p=>({...p,hp:10000,size:12,hitFlash:0}));
  const a=make(),b=make();let bent=0;
  for(let i=0;i<160;i++){
   combat.step(player,a,1/60);combat.settle(1/60);old.fireOnly(1/60,b);
   const fresh=combat.snapshot(a),prior=old.snapshot();
   assert.deepEqual(json({enemies:a,projectiles:fresh.projectiles,bibles:fresh.bibles,particles:fresh.particles}),
    json({enemies:b,projectiles:prior.projectiles,bibles:prior.bibles,particles:prior.particles}));
   assert.equal(left.count(),right.count());
   bent+=fresh.projectiles.filter(p=>p.hit.length).length;
  }
  assert.ok(a.some(e=>e.hp<10000),id+' caused real damage');
  if(id==='knife')assert.ok(bent>0,'piercing projectile must continue after its first hit');
 }
});
